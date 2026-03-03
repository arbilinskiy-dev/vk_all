
from sqlalchemy.orm import Session
from typing import List, Dict, Set
import models
from models_library.vk_profiles import VkProfile
from models_library.dialogs_authors import ProjectAuthor
from crud.lists.subscribers import _ensure_vk_profiles
from utils.db_retry import bulk_operation_with_retry, db_operation_with_retry


def bulk_upsert_authors(db: Session, items: List[Dict]):
    """
    Массовое обновление/вставка авторов.
    Использует ProjectAuthor + VkProfile (нормализованная архитектура).
    
    1. Upsert VK-профилей через _ensure_vk_profiles
    2. Upsert записей ProjectAuthor (INSERT новых, UPDATE существующих)
    """
    if not items:
        return
    
    # 1. Обеспечиваем VK-профили
    vk_to_profile_id = _ensure_vk_profiles(db, items)
    
    # 2. Дедупликация по vk_user_id внутри пакета (последний элемент побеждает)
    unique_map = {}
    for item in items:
        unique_map[item['vk_user_id']] = item
    deduped = list(unique_map.values())
    
    # 3. Проверяем, какие записи уже есть в базе
    project_id = deduped[0]['project_id'] if deduped else None
    if not project_id:
        return
    
    profile_ids = [vk_to_profile_id[item['vk_user_id']] for item in deduped if item['vk_user_id'] in vk_to_profile_id]
    
    existing_profile_ids = set()
    CHUNK_SIZE = 500
    for i in range(0, len(profile_ids), CHUNK_SIZE):
        chunk = profile_ids[i:i + CHUNK_SIZE]
        found = db.query(ProjectAuthor.vk_profile_id).filter(
            ProjectAuthor.project_id == project_id,
            ProjectAuthor.vk_profile_id.in_(chunk)
        ).all()
        existing_profile_ids.update(r[0] for r in found)
    
    # 4. Разделяем на INSERT и UPDATE
    to_insert = []
    to_update = []
    
    for item in deduped:
        profile_id = vk_to_profile_id.get(item['vk_user_id'])
        if not profile_id:
            continue
        
        if profile_id in existing_profile_ids:
            # UPDATE: обновляем source (но НЕ first_seen_at — дата первого обнаружения)
            to_update.append({
                'project_id': project_id,
                'vk_profile_id': profile_id,
                'source': item.get('source', 'posts_sync'),
            })
        else:
            to_insert.append({
                'project_id': project_id,
                'vk_profile_id': profile_id,
                'first_seen_at': item.get('event_date'),
                'source': item.get('source', 'posts_sync'),
            })
    
    # 5. Выполняем INSERT
    if to_insert:
        def insert_chunk(chunk: List[Dict]):
            db.bulk_insert_mappings(ProjectAuthor, chunk)
        
        bulk_operation_with_retry(
            db=db, items=to_insert, chunk_operation=insert_chunk,
            operation_name="bulk_insert_authors", chunk_size=100, max_retries=3
        )
    
    # 6. UPDATE существующих (обновляем source в ProjectAuthor)
    # Для авторов не меняем first_seen_at — это дата первого обнаружения
    if to_update:
        for upd in to_update:
            db.query(ProjectAuthor).filter(
                ProjectAuthor.project_id == upd['project_id'],
                ProjectAuthor.vk_profile_id == upd['vk_profile_id']
            ).update({'source': upd['source']}, synchronize_session=False)
        db.commit()


def get_all_author_vk_ids(db: Session, project_id: str) -> List[int]:
    """Получает все VK ID авторов проекта."""
    results = db.query(VkProfile.vk_user_id).join(
        ProjectAuthor, ProjectAuthor.vk_profile_id == VkProfile.id
    ).filter(
        ProjectAuthor.project_id == project_id
    ).distinct().all()
    return [r[0] for r in results]


def bulk_update_author_details(db: Session, project_id: str, updates: List[Dict]):
    """
    Массовое обновление профильных данных авторов.
    В нормализованной архитектуре обновляет VkProfile.
    """
    if not updates:
        return
    
    vk_ids = [u['vk_user_id'] for u in updates]
    
    # Получаем маппинг vk_user_id → vk_profiles.id (батчами)
    vk_to_pk: Dict[int, int] = {}
    CHUNK_SIZE = 500
    for i in range(0, len(vk_ids), CHUNK_SIZE):
        chunk = vk_ids[i:i + CHUNK_SIZE]
        rows = db.query(VkProfile.id, VkProfile.vk_user_id).filter(
            VkProfile.vk_user_id.in_(chunk)
        ).all()
        for pk, vk_id in rows:
            vk_to_pk[vk_id] = pk
    
    # Формируем обновления для vk_profiles
    profile_updates = []
    for u in updates:
        pk = vk_to_pk.get(u['vk_user_id'])
        if not pk:
            continue
        row = {'id': pk}
        for field in ('first_name', 'last_name', 'sex', 'photo_url', 'domain',
                       'bdate', 'city', 'country', 'has_mobile', 'deactivated',
                       'last_seen', 'platform', 'is_closed', 'can_access_closed'):
            if field in u:
                row[field] = u[field]
        profile_updates.append(row)
    
    if profile_updates:
        def update_chunk(chunk):
            db.bulk_update_mappings(VkProfile, chunk)
        
        bulk_operation_with_retry(
            db=db, items=profile_updates, chunk_operation=update_chunk,
            operation_name="bulk_update_author_profiles", chunk_size=100, max_retries=3
        )


def delete_all_authors(db: Session, project_id: str):
    """Полное удаление списка авторов проекта."""
    def do_delete():
        db.query(ProjectAuthor).filter(
            ProjectAuthor.project_id == project_id
        ).delete(synchronize_session=False)
    
    db_operation_with_retry(
        db=db, operation=do_delete,
        operation_name="delete_all_authors", max_retries=3
    )
    db.commit()
