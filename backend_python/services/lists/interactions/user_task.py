
import crud
import models
from models_library.interactions import PostInteraction
from services import task_monitor
from services.lists.list_sync_utils import get_all_project_tokens, fetch_users_smart_parallel
from crud.lists.utils import deduplicate_users
from crud.lists.interactions import get_interaction_user_count
from database import SessionLocal
from config import settings

def refresh_interaction_users_task(task_id: str, project_id: str, list_type: str, user_token: str):
    """
    Фоновая задача обновления профилей взаимодействий (Split Session).
    Использует PostInteraction + VkProfile (нормализованная архитектура).
    """
    # --- Phase 1: Read ---
    all_vk_ids = []
    unique_tokens = []

    # Маппинг list_type → PostInteraction.type
    event_type_map = {'likes': 'like', 'comments': 'comment', 'reposts': 'repost'}
    event_type = event_type_map.get(list_type)
    
    db = SessionLocal()
    try:
        if not event_type:
            task_monitor.update_task(task_id, "error", error="Invalid list type")
            return

        # Удаляем дубликаты перед обработкой
        deduplicate_users(db, PostInteraction, project_id, event_type=event_type)

        all_vk_ids = crud.get_all_interaction_vk_ids(db, project_id, list_type)
        # Приоритет: VK_SERVICE_KEY → fallback на user-токены
        service_key = settings.vk_service_key
        if service_key:
            unique_tokens = [service_key]
            use_service_key = True
        else:
            unique_tokens = get_all_project_tokens(db, user_token)
            use_service_key = False
    finally:
        db.close()
    
    if not all_vk_ids:
        task_monitor.update_task(task_id, "done")
        return

    if not unique_tokens:
        task_monitor.update_task(task_id, "error", error="Нет токенов")
        return

    # --- Phase 2: Network ---
    task_monitor.update_task(task_id, "fetching", loaded=0, total=len(all_vk_ids))
    extra_params = {'lang': 'ru'} if use_service_key else None
    
    def on_progress(loaded, total):
        task_monitor.update_task(task_id, "fetching", loaded=loaded, total=total)

    fields = 'last_seen,first_name,last_name,sex,photo_100,bdate,city,country,domain,has_mobile'
    fetched_users = fetch_users_smart_parallel(all_vk_ids, unique_tokens, fields, project_id, on_progress, extra_params)
    
    # --- Phase 3: Write ---
    db = SessionLocal()
    try:
        updates = []
        for user_data in fetched_users:
            updates.append({
                'vk_user_id': user_data['id'],
                'deactivated': user_data.get('deactivated'),
                'last_seen': user_data.get('last_seen', {}).get('time') if user_data.get('last_seen') else None,
                'platform': user_data.get('last_seen', {}).get('platform') if user_data.get('last_seen') else None,
                'first_name': user_data.get('first_name'),
                'last_name': user_data.get('last_name'),
                'sex': user_data.get('sex'),
                'photo_url': user_data.get('photo_100'),
                'domain': user_data.get('domain'),
                'bdate': user_data.get('bdate'),
                'city': user_data.get('city', {}).get('title') if user_data.get('city') else None,
                'country': user_data.get('country', {}).get('title') if user_data.get('country') else None,
                'has_mobile': bool(user_data.get('has_mobile')),
                'is_closed': user_data.get('is_closed'),
                'can_access_closed': user_data.get('can_access_closed')
            })
        
        if updates:
            crud.bulk_update_interaction_users(db, project_id, list_type, updates)
        
        # Обновляем метаданные (уникальные пользователи для данного типа)
        from services.lists.list_sync_utils import get_rounded_timestamp
        meta_count_field = f"{list_type}_count"
        meta_date_field = f"{list_type}_last_updated"
        real_count = get_interaction_user_count(db, project_id, list_type)
        crud.update_list_meta(db, project_id, {
            meta_count_field: real_count,
            meta_date_field: get_rounded_timestamp(),
        })
        
        task_monitor.update_task(task_id, "done")

    except Exception as e:
        task_monitor.update_task(task_id, "error", error=str(e))
    finally:
        db.close()
