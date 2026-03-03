
from sqlalchemy.orm import Session
from typing import List, Dict, Set
import models
from models_library.vk_profiles import VkProfile
from models_library.members import ProjectMember
from utils.db_retry import db_operation_with_retry, bulk_operation_with_retry

# ── Вспомогательная функция: обеспечить наличие VkProfile ──────────────
def _ensure_vk_profiles(db: Session, items: List[Dict]) -> Dict[int, int]:
    """
    Гарантирует, что для каждого vk_user_id из items существует запись в vk_profiles.
    Новые создаёт, существующие обновляет (профильные поля).
    
    Возвращает маппинг {vk_user_id → vk_profiles.id} для всех элементов.
    
    Батчевый подход — 2-3 запроса к БД вне зависимости от количества пользователей.
    """
    if not items:
        return {}
    
    vk_ids = list({item['vk_user_id'] for item in items})
    
    # 1. Получаем существующие профили (батчами по 500)
    existing_map: Dict[int, int] = {}
    CHUNK = 500
    for i in range(0, len(vk_ids), CHUNK):
        chunk = vk_ids[i:i + CHUNK]
        rows = db.query(VkProfile.id, VkProfile.vk_user_id).filter(
            VkProfile.vk_user_id.in_(chunk)
        ).all()
        for row in rows:
            existing_map[row.vk_user_id] = row.id
    
    # 2. Группируем items по vk_user_id (с дедупликацией)
    items_by_vk_id: Dict[int, Dict] = {}
    for item in items:
        items_by_vk_id[item['vk_user_id']] = item
    
    # 3. Вставляем новые профили
    new_vk_ids = [vid for vid in vk_ids if vid not in existing_map]
    if new_vk_ids:
        new_profiles = []
        for vid in new_vk_ids:
            item = items_by_vk_id.get(vid, {})
            new_profiles.append({
                'vk_user_id': vid,
                'first_name': item.get('first_name'),
                'last_name': item.get('last_name'),
                'sex': item.get('sex'),
                'photo_url': item.get('photo_url'),
                'domain': item.get('domain'),
                'bdate': item.get('bdate'),
                'city': item.get('city'),
                'country': item.get('country'),
                'has_mobile': item.get('has_mobile'),
                'is_closed': item.get('is_closed'),
                'can_access_closed': item.get('can_access_closed'),
                'deactivated': item.get('deactivated'),
                'last_seen': item.get('last_seen'),
                'platform': item.get('platform'),
            })
        
        def insert_chunk(chunk: List[Dict]):
            db.bulk_insert_mappings(VkProfile, chunk)
        
        bulk_operation_with_retry(
            db=db, items=new_profiles, chunk_operation=insert_chunk,
            operation_name="ensure_vk_profiles_insert", chunk_size=100, max_retries=3
        )
        db.flush()
        
        # Дочитываем ID новых профилей
        for i in range(0, len(new_vk_ids), CHUNK):
            chunk = new_vk_ids[i:i + CHUNK]
            rows = db.query(VkProfile.id, VkProfile.vk_user_id).filter(
                VkProfile.vk_user_id.in_(chunk)
            ).all()
            for row in rows:
                existing_map[row.vk_user_id] = row.id
    
    # 4. Обновляем существующие профили (профильные поля)
    old_vk_ids = [vid for vid in vk_ids if vid in existing_map and vid not in new_vk_ids]
    if old_vk_ids:
        profile_updates = []
        for vid in old_vk_ids:
            item = items_by_vk_id.get(vid, {})
            profile_id = existing_map[vid]
            update_payload = {'id': profile_id}
            for field in ('first_name', 'last_name', 'sex', 'photo_url', 'domain', 'bdate',
                          'city', 'country', 'has_mobile', 'is_closed', 'can_access_closed',
                          'deactivated', 'last_seen', 'platform'):
                if field in item and item[field] is not None:
                    update_payload[field] = item[field]
            if len(update_payload) > 1:  # есть что обновлять кроме id
                profile_updates.append(update_payload)
        
        if profile_updates:
            def update_chunk(chunk: List[Dict]):
                db.bulk_update_mappings(VkProfile, chunk)
            
            bulk_operation_with_retry(
                db=db, items=profile_updates, chunk_operation=update_chunk,
                operation_name="ensure_vk_profiles_update", chunk_size=100, max_retries=3
            )
    
    return existing_map


# ── CRUD операции для подписчиков (через ProjectMember + VkProfile) ────

def get_all_subscriber_vk_ids(db: Session, project_id: str) -> Set[int]:
    """Получает set всех VK ID подписчиков проекта."""
    results = db.query(VkProfile.vk_user_id).join(
        ProjectMember, ProjectMember.vk_profile_id == VkProfile.id
    ).filter(
        ProjectMember.project_id == project_id
    ).all()
    return {r[0] for r in results}

def get_subscribers_by_vk_ids(db: Session, project_id: str, vk_ids: List[int]) -> List[ProjectMember]:
    """
    Получает полные данные подписчиков по списку VK ID.
    Возвращает ProjectMember с загруженным vk_profile (через relationship joinedload).
    """
    if not vk_ids:
        return []
    
    result = []
    CHUNK_SIZE = 500
    for i in range(0, len(vk_ids), CHUNK_SIZE):
        chunk = vk_ids[i:i + CHUNK_SIZE]
        # Субзапрос: vk_user_id → vk_profile_id
        profile_ids_sub = db.query(VkProfile.id).filter(
            VkProfile.vk_user_id.in_(chunk)
        ).subquery()
        
        batch = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.vk_profile_id.in_(profile_ids_sub)
        ).all()
        result.extend(batch)
    
    return result

def bulk_add_subscribers(db: Session, subscribers: List[Dict]):
    """
    Массовое добавление подписчиков.
    
    1. Upsert VK-профилей в vk_profiles (батчами)
    2. Вставка связей в project_members (батчами)
    
    Входной формат dict:
        {project_id, vk_user_id, first_name, last_name, sex, ..., added_at, source}
    """
    if not subscribers:
        return
    
    # 1. Обеспечиваем профили
    vk_to_profile_id = _ensure_vk_profiles(db, subscribers)
    
    # 2. Вставляем ProjectMember-записи
    members = []
    for sub in subscribers:
        profile_id = vk_to_profile_id.get(sub['vk_user_id'])
        if not profile_id:
            continue
        members.append({
            'project_id': sub['project_id'],
            'vk_profile_id': profile_id,
            'status': 'subscribed',
            'subscribed_at': sub.get('added_at'),
            'source': sub.get('source', 'sync'),
        })
    
    if members:
        def insert_chunk(chunk: List[Dict]):
            db.bulk_insert_mappings(ProjectMember, chunk)
        
        bulk_operation_with_retry(
            db=db, items=members, chunk_operation=insert_chunk,
            operation_name="bulk_add_subscribers", chunk_size=100, max_retries=3
        )

def bulk_delete_subscribers(db: Session, project_id: str, vk_user_ids: List[int]):
    """Массовое удаление подписчиков по VK ID."""
    if not vk_user_ids:
        return
    
    CHUNK_SIZE = 500
    for i in range(0, len(vk_user_ids), CHUNK_SIZE):
        chunk = vk_user_ids[i:i + CHUNK_SIZE]
        
        # Получаем vk_profile_id для этих vk_user_id
        profile_ids_sub = db.query(VkProfile.id).filter(
            VkProfile.vk_user_id.in_(chunk)
        ).subquery()
        
        def delete_chunk(pids_sub=profile_ids_sub):
            db.query(ProjectMember).filter(
                ProjectMember.project_id == project_id,
                ProjectMember.vk_profile_id.in_(pids_sub)
            ).delete(synchronize_session=False)
        
        db_operation_with_retry(
            db=db, operation=delete_chunk,
            operation_name=f"bulk_delete_subscribers_chunk_{i//CHUNK_SIZE + 1}",
            max_retries=3
        )
        db.commit()

def delete_all_subscribers(db: Session, project_id: str):
    """Полное удаление всех подписчиков проекта."""
    
    def do_delete():
        db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id
        ).delete(synchronize_session=False)
    
    db_operation_with_retry(
        db=db, operation=do_delete,
        operation_name="delete_all_subscribers", max_retries=3
    )
    db.commit()

def bulk_update_subscriber_details(db: Session, project_id: str, updates: List[Dict]):
    """
    Массовое обновление профильных данных подписчиков.
    
    Обновляет VkProfile (единый профиль), а не каждую таблицу отдельно.
    Вход: [{vk_user_id, first_name, last_name, sex, ...}]
    """
    if not updates:
        return
    
    vk_ids = [u['vk_user_id'] for u in updates]
    
    # Получаем маппинг vk_user_id → vk_profiles.id (батчами)
    vk_to_pk: Dict[int, int] = {}
    CHUNK = 1000
    for i in range(0, len(vk_ids), CHUNK):
        chunk = vk_ids[i:i + CHUNK]
        rows = db.query(VkProfile.id, VkProfile.vk_user_id).filter(
            VkProfile.vk_user_id.in_(chunk)
        ).all()
        for r in rows:
            vk_to_pk[r.vk_user_id] = r.id
    
    final_updates = []
    for u in updates:
        pk = vk_to_pk.get(u['vk_user_id'])
        if not pk:
            continue
        payload = {'id': pk}
        for field in ('first_name', 'last_name', 'sex', 'photo_url', 'domain', 'bdate',
                      'city', 'country', 'has_mobile', 'is_closed', 'can_access_closed',
                      'deactivated', 'last_seen', 'platform'):
            if field in u:
                payload[field] = u[field]
        if len(payload) > 1:
            final_updates.append(payload)
    
    if final_updates:
        def update_chunk(chunk: List[Dict]):
            db.bulk_update_mappings(VkProfile, chunk)
        
        bulk_operation_with_retry(
            db=db, items=final_updates, chunk_operation=update_chunk,
            operation_name="bulk_update_subscriber_details", chunk_size=100, max_retries=3
        )
