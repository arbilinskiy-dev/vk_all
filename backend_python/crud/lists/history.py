
from sqlalchemy.orm import Session
from typing import List, Dict, Set
from datetime import datetime, timedelta, timezone
import models
from models_library.vk_profiles import VkProfile
from models_library.members import MemberEvent
from crud.lists.subscribers import _ensure_vk_profiles
from utils.db_retry import bulk_operation_with_retry, db_operation_with_retry


def bulk_add_history_join(db: Session, items: List[Dict]):
    """
    Массовое добавление истории вступлений.
    Использует MemberEvent + VkProfile (нормализованная архитектура).
    """
    if not items:
        return
    _bulk_add_events(db, items, event_type='join')


def bulk_add_history_leave(db: Session, items: List[Dict]):
    """
    Массовое добавление истории выходов.
    Использует MemberEvent + VkProfile (нормализованная архитектура).
    """
    if not items:
        return
    _bulk_add_events(db, items, event_type='leave')


def _bulk_add_events(db: Session, items: List[Dict], event_type: str):
    """
    Общая логика добавления событий (join/leave) в member_events.
    
    1. Upsert VK-профилей в vk_profiles (батчами через _ensure_vk_profiles)
    2. Дедупликация: фильтруем пользователей, у которых уже есть такое событие за последний час
    3. Вставка событий в member_events
    """
    # 1. Обеспечиваем VK-профили
    vk_to_profile_id = _ensure_vk_profiles(db, items)
    
    # 2. Дедупликация: находим profile_ids, у которых уже есть такое событие за последний час
    all_profile_ids = set(vk_to_profile_id.values())
    project_ids = set(item['project_id'] for item in items)
    already_recorded: Set[tuple] = set()
    
    if all_profile_ids and project_ids:
        threshold = datetime.now(timezone.utc) - timedelta(hours=1)
        CHUNK = 500
        profile_list = list(all_profile_ids)
        for i in range(0, len(profile_list), CHUNK):
            chunk_pids = profile_list[i:i + CHUNK]
            rows = db.query(
                MemberEvent.project_id, MemberEvent.vk_profile_id
            ).filter(
                MemberEvent.event_type == event_type,
                MemberEvent.vk_profile_id.in_(chunk_pids),
                MemberEvent.project_id.in_(project_ids),
                MemberEvent.event_date >= threshold,
            ).all()
            for row in rows:
                already_recorded.add((row.project_id, row.vk_profile_id))
    
    # 3. Формируем записи MemberEvent (только новые)
    events = []
    skipped = 0
    for item in items:
        profile_id = vk_to_profile_id.get(item['vk_user_id'])
        if not profile_id:
            continue
        if (item['project_id'], profile_id) in already_recorded:
            skipped += 1
            continue
        events.append({
            'project_id': item['project_id'],
            'vk_profile_id': profile_id,
            'event_type': event_type,
            'event_date': item.get('event_date'),
            'source': item.get('source', 'sync'),
        })
    
    if skipped > 0:
        import logging
        logging.getLogger('crud.lists.history').info(
            f"_bulk_add_events({event_type}): пропущено {skipped} дубликатов (уже записаны callback-ом)"
        )
    
    if events:
        def insert_chunk(chunk: List[Dict]):
            db.bulk_insert_mappings(MemberEvent, chunk)
        
        bulk_operation_with_retry(
            db=db, items=events, chunk_operation=insert_chunk,
            operation_name=f"bulk_add_history_{event_type}", chunk_size=100, max_retries=3
        )


def get_all_history_vk_ids(db: Session, project_id: str, list_type: str) -> List[int]:
    """Получает все VK ID пользователей из истории (join или leave)."""
    event_type = 'join' if list_type == 'history_join' else 'leave'
    results = db.query(VkProfile.vk_user_id).join(
        MemberEvent, MemberEvent.vk_profile_id == VkProfile.id
    ).filter(
        MemberEvent.project_id == project_id,
        MemberEvent.event_type == event_type
    ).distinct().all()
    return [r[0] for r in results]


def delete_all_history_join(db: Session, project_id: str):
    """Полное удаление истории вступлений."""
    def do_delete():
        db.query(MemberEvent).filter(
            MemberEvent.project_id == project_id,
            MemberEvent.event_type == 'join'
        ).delete(synchronize_session=False)
    
    db_operation_with_retry(
        db=db, operation=do_delete,
        operation_name="delete_all_history_join", max_retries=3
    )
    db.commit()


def delete_all_history_leave(db: Session, project_id: str):
    """Полное удаление истории выходов."""
    def do_delete():
        db.query(MemberEvent).filter(
            MemberEvent.project_id == project_id,
            MemberEvent.event_type == 'leave'
        ).delete(synchronize_session=False)
    
    db_operation_with_retry(
        db=db, operation=do_delete,
        operation_name="delete_all_history_leave", max_retries=3
    )
    db.commit()


def bulk_update_history_details(db: Session, project_id: str, list_type: str, updates: List[Dict]):
    """
    Массовое обновление профильных данных пользователей истории.
    
    В нормализованной архитектуре обновляет VkProfile (единый профиль),
    а не каждую таблицу отдельно.
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
            operation_name=f"bulk_update_history_{list_type}", chunk_size=100, max_retries=3
        )
