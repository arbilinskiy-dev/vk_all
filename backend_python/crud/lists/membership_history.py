"""
CRUD-операции для таблицы user_membership_history.

Содержит функции записи и чтения истории вступлений/выходов
пользователей из сообществ.
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Optional, Set, Tuple
from datetime import datetime, timezone

from models_library.membership_history import UserMembershipHistory


def add_history_record(
    db: Session,
    project_id: str,
    vk_user_id: int,
    action: str,
    action_date: datetime,
    source: str = 'callback'
) -> UserMembershipHistory:
    """
    Добавляет одну запись в историю вступлений/выходов.
    
    Используется callback-хендлерами (group_join/group_leave).
    Всегда записывает — без дедупликации (callback пишет всегда).
    """
    record = UserMembershipHistory(
        project_id=project_id,
        vk_user_id=vk_user_id,
        action=action,
        action_date=action_date,
        source=source,
    )
    db.add(record)
    db.flush()
    return record


def get_last_action(
    db: Session,
    project_id: str,
    vk_user_id: int
) -> Optional[UserMembershipHistory]:
    """
    Получает последнее действие пользователя в проекте.
    
    Используется sync-логикой для дедупликации:
    если последнее действие совпадает с тем, что хотим записать → skip.
    """
    return db.query(UserMembershipHistory).filter(
        UserMembershipHistory.project_id == project_id,
        UserMembershipHistory.vk_user_id == vk_user_id,
    ).order_by(desc(UserMembershipHistory.action_date)).first()


def get_last_actions_bulk(
    db: Session,
    project_id: str,
    vk_user_ids: List[int]
) -> Dict[int, str]:
    """
    Массовое получение последнего действия для списка пользователей.
    
    Возвращает {vk_user_id: action} — последнее действие каждого пользователя.
    Используется sync-логикой для дедупликации целого батча.
    """
    if not vk_user_ids:
        return {}
    
    result: Dict[int, str] = {}
    CHUNK = 500
    
    for i in range(0, len(vk_user_ids), CHUNK):
        chunk = vk_user_ids[i:i + CHUNK]
        
        # Подзапрос: максимальная action_date для каждого (project_id, vk_user_id)
        from sqlalchemy import func
        subq = db.query(
            UserMembershipHistory.vk_user_id,
            func.max(UserMembershipHistory.action_date).label('max_date')
        ).filter(
            UserMembershipHistory.project_id == project_id,
            UserMembershipHistory.vk_user_id.in_(chunk),
        ).group_by(
            UserMembershipHistory.vk_user_id
        ).subquery()
        
        # Основной запрос: получаем action для записей с максимальной датой
        rows = db.query(
            UserMembershipHistory.vk_user_id,
            UserMembershipHistory.action,
        ).join(
            subq,
            (UserMembershipHistory.vk_user_id == subq.c.vk_user_id) &
            (UserMembershipHistory.action_date == subq.c.max_date)
        ).filter(
            UserMembershipHistory.project_id == project_id,
        ).all()
        
        for row in rows:
            result[row.vk_user_id] = row.action
    
    return result


def bulk_add_history_records(
    db: Session,
    records: List[Dict]
):
    """
    Массовое добавление записей в историю.
    
    Каждый элемент records содержит:
    - project_id: str
    - vk_user_id: int
    - action: 'join' | 'leave'
    - action_date: datetime
    - source: 'callback' | 'sync'
    """
    if not records:
        return
    
    from utils.db_retry import bulk_operation_with_retry
    
    def insert_chunk(chunk: List[Dict]):
        db.bulk_insert_mappings(UserMembershipHistory, chunk)
    
    bulk_operation_with_retry(
        db=db, items=records, chunk_operation=insert_chunk,
        operation_name="bulk_add_membership_history", chunk_size=100, max_retries=3
    )


def get_user_history(
    db: Session,
    project_id: str,
    vk_user_id: int,
    limit: int = 50
) -> List[UserMembershipHistory]:
    """
    Получает хронологию действий пользователя в проекте.
    Отсортировано по дате (последние первыми).
    """
    return db.query(UserMembershipHistory).filter(
        UserMembershipHistory.project_id == project_id,
        UserMembershipHistory.vk_user_id == vk_user_id,
    ).order_by(desc(UserMembershipHistory.action_date)).limit(limit).all()
