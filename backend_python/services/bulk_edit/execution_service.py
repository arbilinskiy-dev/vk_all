# Сервис выполнения массового редактирования

import time
from typing import List, Dict, Optional
from datetime import datetime
from sqlalchemy.orm import Session

import crud
import schemas
from database import SessionLocal
from config import settings
from services import vk_service
from services.vk_service import VkApiError
from services import task_monitor
from .distribution_service import distribute_posts_to_admins, get_all_available_tokens


# Константы rate-limit
DELAY_BETWEEN_REQUESTS = 0.5  # 500ms между запросами
MAX_RETRIES_PER_POST = 3      # Максимум попыток на один пост


def execute_bulk_edit_task(
    task_id: str,
    request: schemas.BulkEditApplyRequest,
    user_token: str
):
    """
    Фоновая задача массового редактирования постов.
    Выполняется в BackgroundTasks FastAPI.
    """
    db = SessionLocal()
    
    try:
        print(f"[BULK_EDIT] Task {task_id}: Starting bulk edit of {len(request.posts)} posts", flush=True)
        
        # Обновляем статус задачи
        task_monitor.update_task(task_id, {
            'status': 'running',
            'progress': {'total': len(request.posts), 'completed': 0, 'failed': 0}
        })
        
        # Разделяем посты на системные и VK
        system_posts = [p for p in request.posts if p.postType == 'system']
        vk_posts = [p for p in request.posts if p.postType in ['published', 'scheduled']]
        
        completed = 0
        failed = 0
        errors = []
        affected_project_ids = set()
        
        # === 1. Обрабатываем системные посты (только БД, транзакционно) ===
        if system_posts:
            print(f"[BULK_EDIT] Task {task_id}: Processing {len(system_posts)} system posts...", flush=True)
            
            try:
                for post in system_posts:
                    success = crud.update_system_post_bulk(db, post.id, request.changes)
                    if success:
                        completed += 1
                        affected_project_ids.add(post.projectId)
                    else:
                        failed += 1
                        project = crud.get_project_by_id(db, post.projectId)
                        errors.append({
                            'postId': post.id,
                            'projectName': project.name if project else 'Unknown',
                            'error': 'Post not found in database'
                        })
                    
                    # Обновляем прогресс
                    _update_task_progress(task_id, len(request.posts), completed, failed)
                
                # Коммитим все изменения системных постов
                db.commit()
                print(f"[BULK_EDIT] Task {task_id}: System posts committed", flush=True)
                
            except Exception as e:
                db.rollback()
                print(f"[BULK_EDIT] Task {task_id}: System posts rollback: {e}", flush=True)
                # Помечаем все системные посты как failed
                for post in system_posts:
                    if post.id not in [err['postId'] for err in errors]:
                        failed += 1
                        project = crud.get_project_by_id(db, post.projectId)
                        errors.append({
                            'postId': post.id,
                            'projectName': project.name if project else 'Unknown',
                            'error': str(e)
                        })
        
        # === 2. Обрабатываем VK посты ===
        if vk_posts:
            print(f"[BULK_EDIT] Task {task_id}: Processing {len(vk_posts)} VK posts...", flush=True)
            
            # Конвертируем в dict для distribution_service
            vk_posts_dicts = [{'id': p.id, 'postType': p.postType, 'projectId': p.projectId} for p in vk_posts]
            
            # Распределяем посты между токенами
            token_assignments = distribute_posts_to_admins(vk_posts_dicts, db)
            
            # Получаем все токены для fallback
            all_tokens = get_all_available_tokens(db)
            
            # Обрабатываем каждую группу постов
            for primary_token, posts_for_token in token_assignments.items():
                for post_dict in posts_for_token:
                    success, error_msg = _edit_vk_post_with_retry(
                        db=db,
                        post_dict=post_dict,
                        changes=request.changes,
                        primary_token=primary_token,
                        all_tokens=all_tokens
                    )
                    
                    if success:
                        completed += 1
                        affected_project_ids.add(post_dict['projectId'])
                    else:
                        failed += 1
                        project = crud.get_project_by_id(db, post_dict['projectId'])
                        errors.append({
                            'postId': post_dict['id'],
                            'projectName': project.name if project else 'Unknown',
                            'error': error_msg or 'Unknown error'
                        })
                    
                    # Обновляем прогресс
                    project = crud.get_project_by_id(db, post_dict['projectId'])
                    _update_task_progress(
                        task_id, len(request.posts), completed, failed,
                        current=project.name if project else None
                    )
                    
                    # Задержка между запросами
                    time.sleep(DELAY_BETWEEN_REQUESTS)
        
        # === 3. Обновляем расписание в затронутых проектах ===
        if affected_project_ids:
            print(f"[BULK_EDIT] Task {task_id}: Refreshing schedule for {len(affected_project_ids)} projects...", flush=True)
            _refresh_affected_projects(db, list(affected_project_ids))
        
        # === 4. Финальный статус ===
        final_status = 'done' if failed == 0 else 'error'
        task_monitor.update_task(task_id, {
            'status': final_status,
            'progress': {'total': len(request.posts), 'completed': completed, 'failed': failed},
            'errors': errors,
            'affectedProjectIds': list(affected_project_ids)
        })
        
        print(f"[BULK_EDIT] Task {task_id}: Completed. {completed} success, {failed} failed", flush=True)
        
    except Exception as e:
        print(f"[BULK_EDIT] Task {task_id}: Critical error: {e}", flush=True)
        task_monitor.update_task(task_id, {
            'status': 'error',
            'progress': {'total': len(request.posts), 'completed': 0, 'failed': len(request.posts)},
            'errors': [{'postId': 'all', 'projectName': 'System', 'error': str(e)}],
            'affectedProjectIds': []
        })
    finally:
        db.close()


def _edit_vk_post_with_retry(
    db: Session,
    post_dict: dict,
    changes: schemas.BulkEditChanges,
    primary_token: str,
    all_tokens: List[str]
) -> tuple:
    """
    Редактирует VK пост с retry и fallback на другие токены.
    
    Returns:
        (success: bool, error_message: str | None)
    """
    project = crud.get_project_by_id(db, post_dict['projectId'])
    if not project:
        return False, f"Project {post_dict['projectId']} not found"
    
    if not project.vkProjectId:
        return False, "Project has no VK group ID"
    
    try:
        numeric_id = vk_service.resolve_vk_group_id(project.vkProjectId, primary_token)
        owner_id = vk_service.vk_owner_id_string(numeric_id)
    except Exception as e:
        return False, f"Failed to resolve VK group: {e}"
    
    # Извлекаем post_id из формата "owner_id_post_id"
    try:
        post_id = post_dict['id'].split('_')[1]
    except IndexError:
        return False, f"Invalid post ID format: {post_dict['id']}"
    
    # Формируем параметры для wall.edit
    params = {
        'owner_id': owner_id,
        'post_id': post_id,
    }
    
    if changes.text is not None:
        params['message'] = changes.text
    
    if changes.images is not None or changes.attachments is not None:
        attachment_ids = []
        if changes.images:
            attachment_ids.extend([img.id for img in changes.images])
        if changes.attachments:
            attachment_ids.extend([att.id for att in changes.attachments])
        if attachment_ids:
            params['attachments'] = ','.join(attachment_ids)
    
    if changes.date is not None:
        try:
            dt = datetime.fromisoformat(changes.date.replace('Z', '+00:00'))
            if dt.timestamp() > time.time():
                params['publish_date'] = str(int(dt.timestamp()))
        except ValueError as e:
            print(f"[BULK_EDIT] Invalid date format: {changes.date}, error: {e}", flush=True)
    
    # Пробуем с ротацией токенов
    tokens_to_try = [primary_token] + [t for t in all_tokens if t != primary_token]
    last_error = None
    
    for attempt, token in enumerate(tokens_to_try[:MAX_RETRIES_PER_POST]):
        try:
            token_preview = f"...{token[-4:]}" if len(token) > 4 else token
            print(f"[BULK_EDIT] Editing post {post_dict['id']} with token {token_preview} (attempt {attempt + 1})", flush=True)
            
            vk_service.publish_with_admin_priority(
                params,
                method='wall.edit',
                group_id=numeric_id,
                preferred_token=token
            )
            
            # Успех — обновляем кеш в БД
            crud.update_cached_vk_post(db, post_dict['id'], post_dict['postType'], changes)
            db.commit()
            
            return True, None
            
        except VkApiError as e:
            last_error = str(e)
            print(f"[BULK_EDIT] VK API error: {e}", flush=True)
            
            # Токен недействителен — пробуем следующий
            if e.code in [5, 15, 17, 27]:
                continue
            # Пост не найден или удалён — не пробуем дальше
            elif e.code in [210]:
                return False, f"Post not found in VK (code {e.code})"
            # Ошибка параметров — не пробуем дальше
            elif e.code == 100:
                return False, f"Invalid parameters (code {e.code}): {e}"
            # Другие ошибки — пробуем следующий токен
            continue
            
        except Exception as e:
            last_error = str(e)
            print(f"[BULK_EDIT] Unexpected error: {e}", flush=True)
            continue
    
    return False, last_error or "All tokens failed"


def _update_task_progress(task_id: str, total: int, completed: int, failed: int, current: str = None):
    """Обновляет прогресс задачи в task_monitor."""
    progress = {
        'total': total,
        'completed': completed,
        'failed': failed
    }
    if current:
        progress['current'] = current
    
    task_monitor.update_task(task_id, {
        'status': 'running',
        'progress': progress
    })


def _refresh_affected_projects(db: Session, project_ids: List[str]):
    """
    Обновляет кеш расписания для затронутых проектов.
    """
    for project_id in project_ids:
        try:
            project = crud.get_project_by_id(db, project_id)
            if not project or not project.vkProjectId:
                continue
            
            # Обновляем timestamp последнего обновления
            timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')
            crud.update_project_last_update_time(db, project_id, 'scheduled', timestamp)
            
            print(f"[BULK_EDIT] Marked project {project_id} for refresh", flush=True)
            
        except Exception as e:
            print(f"[BULK_EDIT] Warning: Failed to refresh project {project_id}: {e}", flush=True)
