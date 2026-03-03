# Асинхронный сервис массового редактирования с динамическим пулом воркеров
# Параллельная обработка с автоматическим масштабированием

import asyncio
import json
import time
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from concurrent.futures import ThreadPoolExecutor

import crud
import schemas
from database import SessionLocal
from config import settings
from services import vk_service
from services.vk_service import VkApiError
from services import task_monitor
from services.worker_pool import bulk_edit_pool, WorkerPoolStats
from .distribution_service import distribute_posts_to_admins, get_all_available_tokens


# Константы
MAX_RETRIES_PER_POST = 3      # Максимум попыток на один пост
MIN_DELAY_BETWEEN_VK = 0.35   # Минимальная задержка между VK запросами (секунды)

# ThreadPoolExecutor для синхронных операций с БД
_db_executor = ThreadPoolExecutor(max_workers=10, thread_name_prefix="bulk_edit_db")


async def execute_bulk_edit_async(
    task_id: str,
    request: schemas.BulkEditApplyRequest,
    user_token: str
):
    """
    Асинхронная фоновая задача массового редактирования постов.
    Использует динамический пул воркеров для параллельной обработки.
    """
    print(f"[BULK_EDIT_ASYNC] Task {task_id}: Starting async bulk edit of {len(request.posts)} posts", flush=True)
    print(f"[BULK_EDIT_ASYNC] Initial pool: {bulk_edit_pool.current_workers} workers", flush=True)
    
    # Обновляем статус задачи
    task_monitor.update_task(
        task_id, 'running',
        loaded=0, total=len(request.posts),
        message='Начинаем обработку...'
    )
    
    # Разделяем посты на системные и VK
    system_posts = [p for p in request.posts if p.postType == 'system']
    vk_posts = [p for p in request.posts if p.postType in ['published', 'scheduled']]
    
    results = {
        'completed': 0,
        'failed': 0,
        'errors': [],
        'affected_project_ids': set()
    }
    
    # Счётчики для прогресса (thread-safe)
    progress_lock = asyncio.Lock()
    
    async def update_progress(success: bool, post_id: str = None, project_id: str = None, error: str = None):
        """Обновляет прогресс задачи"""
        async with progress_lock:
            if success:
                results['completed'] += 1
                if project_id:
                    results['affected_project_ids'].add(project_id)
            else:
                results['failed'] += 1
                if error:
                    # Получаем имя проекта
                    project_name = await _get_project_name_async(project_id) if project_id else 'Unknown'
                    results['errors'].append({
                        'postId': post_id,
                        'projectName': project_name,
                        'error': error
                    })
            
            total = len(request.posts)
            # Сохраняем ошибки в JSON для передачи через message/error
            error_json = json.dumps(results['errors'], ensure_ascii=False) if results['errors'] else None
            task_monitor.update_task(
                task_id, 'running',
                loaded=results['completed'], total=total,
                message=f"Обработано {results['completed']}/{total}, ошибок: {results['failed']}",
                error=error_json,
                sub_loaded=results['failed'], sub_total=total
            )
    
    try:
        # === 1. Обрабатываем системные посты параллельно ===
        if system_posts:
            print(f"[BULK_EDIT_ASYNC] Processing {len(system_posts)} system posts in parallel...", flush=True)
            
            async def process_system_post(post):
                async with (await bulk_edit_pool.acquire()):
                    try:
                        # Выполняем синхронную операцию с БД в executor
                        success = await asyncio.get_event_loop().run_in_executor(
                            _db_executor,
                            _update_system_post_sync,
                            post.id,
                            request.changes
                        )
                        await update_progress(success, post.id, post.projectId, 
                                            None if success else "Post not found in database")
                    except Exception as e:
                        await update_progress(False, post.id, post.projectId, str(e))
            
            # Запускаем все задачи параллельно
            await asyncio.gather(*[process_system_post(p) for p in system_posts])
            print(f"[BULK_EDIT_ASYNC] System posts done", flush=True)
        
        # === 2. Обрабатываем VK посты параллельно ===
        if vk_posts:
            print(f"[BULK_EDIT_ASYNC] Processing {len(vk_posts)} VK posts in parallel...", flush=True)
            
            # Получаем токены в sync executor
            db = SessionLocal()
            try:
                vk_posts_dicts = [{'id': p.id, 'postType': p.postType, 'projectId': p.projectId} for p in vk_posts]
                token_assignments = distribute_posts_to_admins(vk_posts_dicts, db)
                all_tokens = get_all_available_tokens(db)
            finally:
                db.close()
            
            # Создаём семафор для rate limiting VK API
            vk_rate_limiter = asyncio.Semaphore(3)  # Максимум 3 запроса одновременно к VK
            
            async def process_vk_post(post_dict: dict, primary_token: str):
                async with (await bulk_edit_pool.acquire()):
                    async with vk_rate_limiter:
                        try:
                            success, error_msg = await asyncio.get_event_loop().run_in_executor(
                                _db_executor,
                                _edit_vk_post_sync,
                                post_dict,
                                request.changes,
                                primary_token,
                                all_tokens
                            )
                            await update_progress(success, post_dict['id'], post_dict['projectId'], error_msg)
                            
                            # Минимальная задержка между VK запросами
                            await asyncio.sleep(MIN_DELAY_BETWEEN_VK)
                            
                        except Exception as e:
                            await update_progress(False, post_dict['id'], post_dict['projectId'], str(e))
            
            # Формируем задачи
            tasks = []
            assigned_post_ids = set()
            for primary_token, posts_for_token in token_assignments.items():
                for post_dict in posts_for_token:
                    tasks.append(process_vk_post(post_dict, primary_token))
                    assigned_post_ids.add(post_dict['id'])
            
            # Проверяем, все ли VK посты попали в задачи
            for vk_post_dict in vk_posts_dicts:
                if vk_post_dict['id'] not in assigned_post_ids:
                    print(f"[BULK_EDIT_ASYNC] ⚠️ Пост {vk_post_dict['id']} не был назначен ни одному токену!", flush=True)
                    await update_progress(False, vk_post_dict['id'], vk_post_dict['projectId'],
                                         'Пост не назначен ни одному токену для редактирования')
            
            print(f"[BULK_EDIT_ASYNC] Запускаем {len(tasks)} VK задач параллельно...", flush=True)
            
            # Запускаем все задачи параллельно
            await asyncio.gather(*tasks)
            print(f"[BULK_EDIT_ASYNC] VK posts done", flush=True)
        
        # === 3. Обновляем расписание в затронутых проектах ===
        if results['affected_project_ids']:
            print(f"[BULK_EDIT_ASYNC] Refreshing {len(results['affected_project_ids'])} projects...", flush=True)
            await asyncio.get_event_loop().run_in_executor(
                _db_executor,
                _refresh_projects_sync,
                list(results['affected_project_ids'])
            )
        
        # === 4. Финальный статус ===
        final_status = 'done' if results['failed'] == 0 else 'error'
        
        pool_stats = bulk_edit_pool.stats
        
        # Формируем JSON с детальной информацией для поля message
        final_meta = json.dumps({
            'progress': {
                'total': len(request.posts),
                'completed': results['completed'],
                'failed': results['failed']
            },
            'errors': results['errors'],
            'affectedProjectIds': list(results['affected_project_ids']),
            'workerStats': _format_pool_stats(pool_stats),
            'performance': {
                'avgTaskTimeMs': round(pool_stats.avg_task_time_ms, 2),
                'totalScaleUps': pool_stats.total_scale_ups,
                'totalScaleDowns': pool_stats.total_scale_downs,
                'finalWorkers': bulk_edit_pool.current_workers
            }
        }, ensure_ascii=False)
        
        error_json = json.dumps(results['errors'], ensure_ascii=False) if results['errors'] else None
        
        task_monitor.update_task(
            task_id, final_status,
            loaded=results['completed'], total=len(request.posts),
            message=final_meta,
            error=error_json,
            sub_loaded=results['failed'], sub_total=len(request.posts)
        )
        
        print(f"[BULK_EDIT_ASYNC] Task {task_id}: Completed. {results['completed']} success, {results['failed']} failed", flush=True)
        print(f"[BULK_EDIT_ASYNC] Pool stats: {pool_stats.total_scale_ups} scale ups, {pool_stats.total_scale_downs} scale downs", flush=True)
        
    except Exception as e:
        print(f"[BULK_EDIT_ASYNC] Task {task_id}: Critical error: {e}", flush=True)
        error_data = json.dumps(
            [{'postId': 'all', 'projectName': 'System', 'error': str(e)}],
            ensure_ascii=False
        )
        task_monitor.update_task(
            task_id, 'error',
            loaded=0, total=len(request.posts),
            message=f'Критическая ошибка: {str(e)}',
            error=error_data,
            sub_loaded=len(request.posts), sub_total=len(request.posts)
        )


def _update_system_post_sync(post_id: str, changes: schemas.BulkEditChanges) -> bool:
    """Синхронная обёртка для обновления системного поста"""
    db = SessionLocal()
    try:
        success = crud.update_system_post_bulk(db, post_id, changes)
        if success:
            db.commit()
        return success
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def _edit_vk_post_sync(
    post_dict: dict,
    changes: schemas.BulkEditChanges,
    primary_token: str,
    all_tokens: List[str]
) -> Tuple[bool, Optional[str]]:
    """
    Синхронная функция редактирования VK поста с retry.
    """
    db = SessionLocal()
    try:
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
            except ValueError:
                pass
        
        # Пробуем с ротацией токенов
        tokens_to_try = [primary_token] + [t for t in all_tokens if t != primary_token]
        last_error = None
        
        for attempt, token in enumerate(tokens_to_try[:MAX_RETRIES_PER_POST]):
            try:
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
                if e.code == 14:  # Капча — невозможно решить автоматически
                    return False, f"Требуется капча (code 14). Попробуйте позже."
                elif e.code in [5, 15, 17, 27]:  # Токен недействителен
                    continue
                elif e.code in [210]:  # Пост не найден
                    return False, f"Post not found in VK (code {e.code})"
                elif e.code == 100:  # Ошибка параметров
                    return False, f"Invalid parameters (code {e.code}): {e}"
                continue
                
            except Exception as e:
                last_error = str(e)
                continue
        
        return False, last_error or "All tokens failed"
        
    finally:
        db.close()


async def _get_project_name_async(project_id: str) -> str:
    """Асинхронно получает имя проекта"""
    def get_name():
        db = SessionLocal()
        try:
            project = crud.get_project_by_id(db, project_id)
            return project.name if project else 'Unknown'
        finally:
            db.close()
    
    return await asyncio.get_event_loop().run_in_executor(_db_executor, get_name)


def _refresh_projects_sync(project_ids: List[str]):
    """Синхронно обновляет timestamp для проектов"""
    db = SessionLocal()
    try:
        for project_id in project_ids:
            try:
                timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')
                crud.update_project_last_update_time(db, project_id, 'scheduled', timestamp)
            except Exception as e:
                print(f"[BULK_EDIT_ASYNC] Warning: Failed to refresh project {project_id}: {e}", flush=True)
        db.commit()
    finally:
        db.close()


def _format_pool_stats(stats: WorkerPoolStats) -> dict:
    """Форматирует статистику пула для JSON"""
    return {
        'currentWorkers': stats.current_workers,
        'activeWorkers': stats.active_workers,
        'loadPercent': round((stats.active_workers / stats.current_workers * 100) if stats.current_workers > 0 else 0),
        'completedTasks': stats.completed_tasks,
        'failedTasks': stats.failed_tasks,
        'avgTaskTimeMs': round(stats.avg_task_time_ms, 2),
        'scaleUps': stats.total_scale_ups,
        'scaleDowns': stats.total_scale_downs
    }


# === Функция-обёртка для запуска как BackgroundTask ===

async def execute_bulk_edit_task_async(
    task_id: str,
    request: schemas.BulkEditApplyRequest,
    user_token: str
):
    """
    Async обёртка для запуска массового редактирования.
    FastAPI BackgroundTasks корректно await'ит async def функции.
    """
    await execute_bulk_edit_async(task_id, request, user_token)
