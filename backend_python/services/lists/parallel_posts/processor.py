"""
Модуль обработки постов одного проекта.

Содержит логику скачивания постов из VK и сохранения их в БД.
"""

import time
from typing import Dict
from datetime import datetime, timezone

import crud
from database import SessionLocal
from services.vk_api.api_client import call_vk_api as raw_vk_call, VkApiError
import services.vk_service as vk_service
from services.lists.parallel_common import BulkRefreshState, ProjectStatus

from .fetcher import fetch_posts_batch, EXECUTE_BATCH_SIZE
from .progress import update_task_progress


def process_single_project_posts(
    state: BulkRefreshState, 
    project_id: str, 
    token: str, 
    token_name: str, 
    limit: int = 1000, 
    mode: str = 'limit'
) -> bool:
    """
    Обрабатывает посты одного проекта.
    
    Выполняет полный цикл: инициализация -> скачивание -> сохранение.
    
    Args:
        state: Общее состояние задачи
        project_id: ID проекта
        token: Токен VK
        token_name: Имя токена для логов
        limit: Максимальное количество постов для загрузки
        mode: 'limit' — скачиваем limit постов, 'actual' — пропускаем если БД актуальна
        
    Returns:
        True если успешно, False если flood control (токен нужно отключить)
    """
    state.update_project(project_id, status=ProjectStatus.PROCESSING)
    update_task_progress(state)
    
    # === ЭТАП 1: ИНИЦИАЛИЗАЦИЯ ===
    init_data = _initialize_project(state, project_id, mode)
    if init_data is None:
        return True  # Ошибка уже залогирована
    
    project_vk_id, project_name, stored_count = init_data
    
    # === ЭТАП 2: СКАЧИВАНИЕ ПОСТОВ ===
    fetch_result = _fetch_project_posts(
        state, project_id, project_vk_id, project_name, 
        token, token_name, stored_count, limit, mode
    )
    
    if fetch_result is None:
        return False  # Flood control
    if fetch_result == []:
        return True  # Пропущено или пусто (уже обработано)
    
    all_posts, target_count = fetch_result
    
    # === ЭТАП 3: СОХРАНЕНИЕ ===
    return _save_project_posts(state, project_id, project_vk_id, project_name, token, token_name, all_posts)


def _initialize_project(state: BulkRefreshState, project_id: str, mode: str):
    """
    Инициализирует данные проекта из БД.
    
    Returns:
        Tuple[vk_id, name, stored_count] или None при ошибке
    """
    db = SessionLocal()
    try:
        project = crud.get_project_by_id(db, project_id)
        if not project:
            state.mark_project_error(project_id, "Проект не найден")
            return None
        
        project_vk_id = str(project.vkProjectId)
        project_name = str(project.name)
        
        # Для режима 'actual' — получаем количество постов в БД
        stored_count = 0
        if mode == 'actual':
            stored_count = crud.get_stored_posts_count(db, project_id)
            
        return (project_vk_id, project_name, stored_count)
    except Exception as e:
        state.mark_project_error(project_id, f"Ошибка инициализации: {e}")
        return None
    finally:
        db.close()


def _fetch_project_posts(
    state: BulkRefreshState,
    project_id: str,
    project_vk_id: str,
    project_name: str,
    token: str,
    token_name: str,
    stored_count: int,
    limit: int,
    mode: str
):
    """
    Скачивает посты проекта из VK.
    
    Returns:
        - None: flood control (нужно отключить токен)
        - []: пропущено или нечего скачивать
        - (all_posts, target_count): успешно скачано
    """
    all_posts = []
    
    try:
        state.update_project(project_id, status=ProjectStatus.FETCHING)
        update_task_progress(state)
        
        print(f"   [{token_name}] Посты: {project_name}")
        
        numeric_id = vk_service.resolve_vk_group_id(str(project_vk_id), token)
        owner_id = vk_service.vk_owner_id_string(numeric_id)
        
        # Получаем количество постов в VK
        try:
            init_resp = raw_vk_call('wall.get', {
                'owner_id': owner_id, 
                'count': 1, 
                'access_token': token
            }, project_id=project_id)
            total_vk_count = init_resp.get('count', 0)
        except VkApiError as e:
            if e.code == 9:
                print(f"   [{token_name}] FLOOD CONTROL при получении count постов!")
                return None
            state.mark_project_error(project_id, f"VK Error {e.code}: {e}")
            return []
        except Exception as e:
            state.mark_project_error(project_id, f"Ошибка получения count: {e}")
            return []
        
        # Режим 'actual': если в БД >= чем в VK, пропускаем
        if mode == 'actual' and stored_count >= total_vk_count:
            print(f"   [{token_name}] ✓ {project_name}: актуально (БД: {stored_count}, VK: {total_vk_count})")
            state.update_project(project_id, total=stored_count, loaded=stored_count)
            state.mark_project_done(project_id, added=0, left=0)
            return []
        
        # Применяем лимит
        target_count = min(total_vk_count, limit)
        state.update_project(project_id, total=target_count)
        update_task_progress(state)
        
        if target_count == 0:
            state.mark_project_done(project_id, added=0, left=0)
            return []
        
        # Разбиваем на чанки
        tasks_params = []
        current_offset = 0
        while current_offset < target_count:
            remaining = target_count - current_offset
            chunk_size = min(remaining, EXECUTE_BATCH_SIZE)
            tasks_params.append({"offset": current_offset, "count": chunk_size})
            current_offset += chunk_size
        
        total_fetched = 0
        
        # Загрузка чанков
        for i, params in enumerate(tasks_params):
            try:
                items = fetch_posts_batch(
                    token,
                    owner_id,
                    params['offset'],
                    params['count'],
                    project_id
                )
                all_posts.extend(items)
                total_fetched += len(items)
                state.update_project(project_id, loaded=total_fetched)
                update_task_progress(state)
                
                time.sleep(0.3)
                
            except VkApiError as e:
                if e.code == 9:
                    print(f"   [{token_name}] FLOOD CONTROL при скачивании постов chunk {i}!")
                    return None
                print(f"   [{token_name}] Posts chunk {i} failed: {e}")
            except Exception as e:
                print(f"   [{token_name}] Posts chunk {i} failed: {e}")
        
        # Проверяем порог успешности (90%)
        threshold = int(target_count * 0.90)
        if total_fetched < threshold:
            state.mark_project_error(project_id, 
                f"Скачано {total_fetched} из {target_count} постов ({int(total_fetched/target_count*100)}%)")
            return []
        
        return (all_posts, target_count)
            
    except VkApiError as e:
        if e.code == 9:
            return None
        state.mark_project_error(project_id, f"VK Error {e.code}: {e}")
        return []
    except Exception as e:
        state.mark_project_error(project_id, f"Ошибка скачивания: {e}")
        return []


def _save_project_posts(
    state: BulkRefreshState,
    project_id: str,
    project_vk_id: str,
    project_name: str,
    token: str,
    token_name: str,
    all_posts: list
) -> bool:
    """
    Сохраняет скачанные посты в БД.
    
    Returns:
        True всегда (ошибки логируются, но не требуют отключения токена)
    """
    state.update_project(project_id, status=ProjectStatus.SAVING)
    update_task_progress(state)
    
    db = SessionLocal()
    try:
        numeric_id = vk_service.resolve_vk_group_id(str(project_vk_id), token)
        owner_id = vk_service.vk_owner_id_string(numeric_id)
        
        posts_to_save = []
        for post in all_posts:
            post_entry = _parse_post_data(post, project_id, owner_id)
            posts_to_save.append(post_entry)
        
        # Сохраняем пачками по 500
        BATCH_SIZE = 500
        for i in range(0, len(posts_to_save), BATCH_SIZE):
            batch = posts_to_save[i:i + BATCH_SIZE]
            crud.bulk_upsert_posts(db, batch)
        
        saved_count = len(posts_to_save)
        state.mark_project_done(project_id, added=saved_count, left=0)
        print(f"   [{token_name}] ✓ {project_name}: {saved_count} постов")
        return True
        
    except Exception as e:
        db.rollback()
        state.mark_project_error(project_id, f"Ошибка сохранения: {e}")
        return True
    finally:
        db.close()


def _parse_post_data(post: Dict, project_id: str, owner_id: str) -> Dict:
    """
    Парсит данные поста из VK в формат для БД.
    
    Args:
        post: Словарь с данными поста из VK API
        project_id: ID проекта
        owner_id: ID владельца стены
        
    Returns:
        Словарь для сохранения в БД
    """
    # Извлекаем изображение
    image_url = None
    attachments = post.get('attachments', [])
    if attachments:
        for att in attachments:
            if att['type'] == 'photo' and 'sizes' in att.get('photo', {}):
                sizes = att['photo']['sizes']
                best_size = next((s for s in sizes if s.get('type') == 'x'), sizes[-1])
                image_url = best_size.get('url')
                break
    
    # Извлекаем автора
    post_author_id = None
    if 'post_author_data' in post and 'author' in post['post_author_data']:
        post_author_id = post['post_author_data']['author']
    if not post_author_id:
        post_author_id = post.get('signer_id')
    if not post_author_id:
        from_id = post.get('from_id')
        if from_id and from_id > 0:
            post_author_id = from_id
    
    return {
        "id": f"{project_id}_{post['id']}",
        "project_id": project_id,
        "vk_post_id": post['id'],
        "date": datetime.fromtimestamp(post['date'], timezone.utc),
        "text": post.get('text', ''),
        "image_url": image_url,
        "vk_link": f"https://vk.com/wall{owner_id}_{post['id']}",
        "likes_count": post.get('likes', {}).get('count', 0),
        "comments_count": post.get('comments', {}).get('count', 0),
        "reposts_count": post.get('reposts', {}).get('count', 0),
        "views_count": post.get('views', {}).get('count', 0),
        "can_post_comment": bool(post.get('comments', {}).get('can_post', 0)),
        "can_like": bool(post.get('likes', {}).get('can_like', 0)),
        "user_likes": bool(post.get('likes', {}).get('user_likes', 0)),
        "signer_id": post.get('signer_id'),
        "post_author_id": post_author_id
    }
