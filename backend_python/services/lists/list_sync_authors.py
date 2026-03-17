
import crud
import models
from models_library.dialogs_authors import ProjectAuthor
from services import task_monitor
from services.lists.list_sync_utils import get_all_project_tokens, fetch_users_smart_parallel
from crud.lists.utils import deduplicate_users
from crud.lists.authors import get_all_author_vk_ids, bulk_update_author_details
from database import SessionLocal
from config import settings
from services.post_helpers import get_rounded_timestamp

def refresh_author_details_task(task_id: str, project_id: str, user_token: str):
    """
    Фоновая задача для обновления деталей авторов постов.
    Использует ProjectAuthor + VkProfile (нормализованная архитектура).
    """
    # --- Phase 1: Read ---
    all_vk_ids = []
    unique_tokens = []
    
    db = SessionLocal()
    try:
        project = crud.get_project_by_id(db, project_id)
        if not project:
            task_monitor.update_task(task_id, "error", error="Project not found")
            return
            
        # 1. Удаляем дубликаты
        deduplicate_users(db, ProjectAuthor, project_id)
        
        # 2. Получаем ID всех авторов через нормализованный запрос
        all_vk_ids = get_all_author_vk_ids(db, project_id)
        
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
        task_monitor.update_task(task_id, "done", message="Нет авторов")
        return
    
    if not unique_tokens:
        task_monitor.update_task(task_id, "error", error="Нет токенов")
        return

    # --- Phase 2: Network ---
    task_monitor.update_task(task_id, "fetching", loaded=0, total=len(all_vk_ids))
    fields = 'sex,bdate,city,country,photo_100,domain,has_mobile,last_seen,deactivated,is_closed,can_access_closed'
    extra_params = {'lang': 'ru'} if use_service_key else None
    
    def on_progress(loaded, total):
        task_monitor.update_task(task_id, "fetching", loaded=loaded, total=total)

    fetched_users = fetch_users_smart_parallel(all_vk_ids, unique_tokens, fields, project_id, on_progress, extra_params)

    # --- Phase 3: Write ---
    db = SessionLocal()
    try:
        task_monitor.update_task(task_id, "processing", message="Сохранение...")
        
        updates = []
        for user_data in fetched_users:
            updates.append({
                "vk_user_id": user_data['id'],
                "first_name": user_data.get('first_name'),
                "last_name": user_data.get('last_name'),
                "sex": user_data.get('sex'),
                "photo_url": user_data.get('photo_100'),
                "domain": user_data.get('domain'),
                "bdate": user_data.get('bdate'),
                "city": user_data.get('city', {}).get('title') if user_data.get('city') else None,
                "country": user_data.get('country', {}).get('title') if user_data.get('country') else None,
                "has_mobile": bool(user_data.get('has_mobile')),
                "is_closed": user_data.get('is_closed'),
                "can_access_closed": user_data.get('can_access_closed'),
                "deactivated": user_data.get('deactivated'),
                "last_seen": user_data.get('last_seen', {}).get('time') if user_data.get('last_seen') else None,
                "platform": user_data.get('last_seen', {}).get('platform') if user_data.get('last_seen') else None,
            })
            
        if updates:
            bulk_update_author_details(db, project_id, updates)

        # Пересчитываем реальное количество авторов
        real_count = db.query(ProjectAuthor).filter(
            ProjectAuthor.project_id == project_id
        ).count()
            
        timestamp = get_rounded_timestamp()
        crud.update_list_meta(db, project_id, {
            "authors_last_updated": timestamp,
            "authors_count": real_count
        })

        task_monitor.update_task(task_id, "done", message="Данные обновлены")

    except Exception as e:
        print(f"TASK ERROR: {e}")
        task_monitor.update_task(task_id, "error", error=str(e))
    finally:
        db.close()
