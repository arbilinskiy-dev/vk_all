
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Optional, Any, Set
import json
import models
from models_library.vk_profiles import VkProfile
from models_library.interactions import PostInteraction
from crud.lists.subscribers import _ensure_vk_profiles
from utils.db_retry import bulk_operation_with_retry, db_operation_with_retry

# Маппинг list_type (множ. число) → PostInteraction.type (ед. число)
_LIST_TYPE_TO_EVENT_TYPE = {
    'likes': 'like',
    'comments': 'comment',
    'reposts': 'repost',
}


def bulk_upsert_interactions(db: Session, project_id: str, list_type: str, items: List[Dict]):
    """
    Вставка взаимодействий в post_interactions.
    Использует PostInteraction + VkProfile (нормализованная архитектура).
    
    Принимает список индивидуальных событий (одна запись = одно взаимодействие):
    {project_id, vk_user_id, vk_post_id, type, created_at, ...profile_fields}
    """
    if not items:
        return

    event_type = _LIST_TYPE_TO_EVENT_TYPE.get(list_type, list_type)

    # 1. Обеспечиваем VK-профили
    vk_to_profile_id = _ensure_vk_profiles(db, items)
    
    # 2. Подготавливаем записи PostInteraction
    records = []
    seen_tuples = set()  # Дедупликация внутри пакета
    
    for item in items:
        profile_id = vk_to_profile_id.get(item['vk_user_id'])
        if not profile_id:
            continue
        
        vk_post_id = item['vk_post_id']
        key = (profile_id, vk_post_id, event_type)
        if key in seen_tuples:
            continue
        seen_tuples.add(key)
        
        records.append({
            'project_id': project_id,
            'vk_profile_id': profile_id,
            'vk_post_id': vk_post_id,
            'type': event_type,
            'created_at': item.get('created_at'),
        })
    
    if not records:
        return
    
    # 3. Проверяем существующие записи (по UNIQUE: project_id + vk_profile_id + vk_post_id + type)
    # Батчами по vk_profile_id
    all_profile_ids = list({r['vk_profile_id'] for r in records})
    existing_tuples: Set[tuple] = set()
    
    CHUNK_SIZE = 500
    for i in range(0, len(all_profile_ids), CHUNK_SIZE):
        chunk = all_profile_ids[i:i + CHUNK_SIZE]
        found = db.query(
            PostInteraction.vk_profile_id,
            PostInteraction.vk_post_id,
        ).filter(
            PostInteraction.project_id == project_id,
            PostInteraction.type == event_type,
            PostInteraction.vk_profile_id.in_(chunk)
        ).all()
        existing_tuples.update((r[0], r[1]) for r in found)
    
    # 4. Фильтруем — оставляем только новые
    to_insert = [
        r for r in records 
        if (r['vk_profile_id'], r['vk_post_id']) not in existing_tuples
    ]
    
    # 5. Вставляем
    if to_insert:
        def insert_chunk(chunk: List[Dict]):
            db.bulk_insert_mappings(PostInteraction, chunk)
        
        bulk_operation_with_retry(
            db=db,
            items=to_insert,
            chunk_operation=insert_chunk,
            operation_name=f"bulk_insert_interactions_{list_type}",
            chunk_size=100,
            max_retries=3
        )


def get_all_interaction_vk_ids(db: Session, project_id: str, list_type: str) -> List[int]:
    """Получает все уникальные VK ID пользователей из списка взаимодействий."""
    event_type = _LIST_TYPE_TO_EVENT_TYPE.get(list_type, list_type)
    
    results = db.query(VkProfile.vk_user_id).join(
        PostInteraction, PostInteraction.vk_profile_id == VkProfile.id
    ).filter(
        PostInteraction.project_id == project_id,
        PostInteraction.type == event_type
    ).distinct().all()
    return [r[0] for r in results]


def get_interaction_user_count(db: Session, project_id: str, list_type: str) -> int:
    """Подсчёт уникальных пользователей (не событий!) для типа взаимодействия."""
    event_type = _LIST_TYPE_TO_EVENT_TYPE.get(list_type, list_type)
    
    return db.query(func.count(func.distinct(PostInteraction.vk_profile_id))).filter(
        PostInteraction.project_id == project_id,
        PostInteraction.type == event_type
    ).scalar() or 0


def bulk_update_interaction_users(db: Session, project_id: str, list_type: str, updates: List[Dict]):
    """
    Обновляет профильные данные пользователей взаимодействий.
    В нормализованной архитектуре обновляет VkProfile (единый профиль).
    """
    if not updates:
        return
    
    vk_ids = [u['vk_user_id'] for u in updates]
    
    # Получаем маппинг vk_user_id → vk_profiles.id
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
            db=db,
            items=profile_updates,
            chunk_operation=update_chunk,
            operation_name=f"bulk_update_interaction_profiles",
            chunk_size=100,
            max_retries=3
        )


def delete_all_interactions(db: Session, project_id: str, list_type: str):
    """Полное удаление взаимодействий указанного типа."""
    event_type = _LIST_TYPE_TO_EVENT_TYPE.get(list_type, list_type)
    
    def do_delete():
        db.query(PostInteraction).filter(
            PostInteraction.project_id == project_id,
            PostInteraction.type == event_type
        ).delete(synchronize_session=False)
    
    db_operation_with_retry(
        db=db,
        operation=do_delete,
        operation_name=f"delete_all_interactions_{list_type}",
        max_retries=3
    )
    db.commit()
