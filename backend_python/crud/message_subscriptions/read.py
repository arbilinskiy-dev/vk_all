"""
Чтение / агрегация данных подписок для дашборда.
Все функции — batch-запросы с GROUP BY, без N+1.
"""

import logging
from typing import Optional, Dict, Any, List
from collections import defaultdict

from sqlalchemy.orm import Session
from sqlalchemy import func, case, distinct

from models_library.message_stats import MessageSubscription

logger = logging.getLogger("crud.message_subscriptions.read")


def get_subscriptions_summary(
    db: Session,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Глобальная сводка подписок/отписок по всем проектам.
    
    :return: {
        total_allow, total_deny, total_events,
        unique_users_allow, unique_users_deny,
        projects_count
    }
    """
    q = db.query(
        func.count(MessageSubscription.id).label("total"),
        func.sum(case((MessageSubscription.event_type == "allow", 1), else_=0)).label("total_allow"),
        func.sum(case((MessageSubscription.event_type == "deny", 1), else_=0)).label("total_deny"),
        func.count(distinct(MessageSubscription.project_id)).label("projects_count"),
    )
    q = _apply_date_filter(q, date_from, date_to)
    row = q.one()
    
    # Уникальные пользователи по типу (отдельные запросы для DISTINCT)
    q_allow_users = db.query(func.count(distinct(MessageSubscription.vk_user_id))).filter(
        MessageSubscription.event_type == "allow"
    )
    q_deny_users = db.query(func.count(distinct(MessageSubscription.vk_user_id))).filter(
        MessageSubscription.event_type == "deny"
    )
    q_allow_users = _apply_date_filter(q_allow_users, date_from, date_to)
    q_deny_users = _apply_date_filter(q_deny_users, date_from, date_to)
    
    return {
        "total_events": row.total or 0,
        "total_allow": row.total_allow or 0,
        "total_deny": row.total_deny or 0,
        "unique_users_allow": q_allow_users.scalar() or 0,
        "unique_users_deny": q_deny_users.scalar() or 0,
        "projects_count": row.projects_count or 0,
    }


def get_subscriptions_chart(
    db: Session,
    project_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Данные для графика подписок/отписок по часовым слотам.
    
    :return: [{ hour_slot, allow, deny, total }]
    """
    q = db.query(
        MessageSubscription.hour_slot,
        func.sum(case((MessageSubscription.event_type == "allow", 1), else_=0)).label("allow"),
        func.sum(case((MessageSubscription.event_type == "deny", 1), else_=0)).label("deny"),
        func.count(MessageSubscription.id).label("total"),
    ).group_by(MessageSubscription.hour_slot)
    
    if project_id:
        q = q.filter(MessageSubscription.project_id == project_id)
    q = _apply_date_filter(q, date_from, date_to)
    q = q.order_by(MessageSubscription.hour_slot)
    
    return [
        {
            "hour_slot": row.hour_slot,
            "allow": row.allow or 0,
            "deny": row.deny or 0,
            "total": row.total or 0,
        }
        for row in q.all()
    ]


def get_subscriptions_by_projects(
    db: Session,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Сводка подписок/отписок по каждому проекту.
    
    :return: [{ project_id, allow_count, deny_count, total, unique_users }]
    """
    q = db.query(
        MessageSubscription.project_id,
        func.sum(case((MessageSubscription.event_type == "allow", 1), else_=0)).label("allow_count"),
        func.sum(case((MessageSubscription.event_type == "deny", 1), else_=0)).label("deny_count"),
        func.count(MessageSubscription.id).label("total"),
        func.count(distinct(MessageSubscription.vk_user_id)).label("unique_users"),
    ).group_by(MessageSubscription.project_id)
    
    q = _apply_date_filter(q, date_from, date_to)
    
    return [
        {
            "project_id": row.project_id,
            "allow_count": row.allow_count or 0,
            "deny_count": row.deny_count or 0,
            "total": row.total or 0,
            "unique_users": row.unique_users or 0,
        }
        for row in q.all()
    ]


def get_subscriptions_events(
    db: Session,
    project_id: Optional[str] = None,
    event_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> Dict[str, Any]:
    """
    Список отдельных событий с пагинацией.
    Для таблицы «кто подписался/отписался».
    
    :return: { total_count, events: [{ id, project_id, vk_user_id, event_type, event_at }] }
    """
    q = db.query(MessageSubscription)
    count_q = db.query(func.count(MessageSubscription.id))
    
    if project_id:
        q = q.filter(MessageSubscription.project_id == project_id)
        count_q = count_q.filter(MessageSubscription.project_id == project_id)
    if event_type:
        q = q.filter(MessageSubscription.event_type == event_type)
        count_q = count_q.filter(MessageSubscription.event_type == event_type)
    
    q = _apply_date_filter(q, date_from, date_to)
    count_q = _apply_date_filter(count_q, date_from, date_to)
    
    total_count = count_q.scalar() or 0
    
    events = q.order_by(MessageSubscription.event_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "total_count": total_count,
        "events": [
            {
                "id": e.id,
                "project_id": e.project_id,
                "vk_user_id": e.vk_user_id,
                "event_type": e.event_type,
                "event_at": e.event_at,
                "event_date": e.event_date,
            }
            for e in events
        ],
    }


def get_subscriptions_project_users(
    db: Session,
    project_id: str,
    event_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> Dict[str, Any]:
    """
    Пользователи проекта с кол-вом подписок/отписок (агрегация по vk_user_id).
    
    :return: { total_count, users: [{ vk_user_id, allow_count, deny_count, last_event_at, last_event_type }] }
    """
    q = db.query(
        MessageSubscription.vk_user_id,
        func.sum(case((MessageSubscription.event_type == "allow", 1), else_=0)).label("allow_count"),
        func.sum(case((MessageSubscription.event_type == "deny", 1), else_=0)).label("deny_count"),
        func.max(MessageSubscription.event_at).label("last_event_at"),
    ).filter(MessageSubscription.project_id == project_id)
    
    if event_type:
        q = q.filter(MessageSubscription.event_type == event_type)
    q = _apply_date_filter(q, date_from, date_to)
    
    q = q.group_by(MessageSubscription.vk_user_id)
    
    # Считаем общее кол-во уникальных пользователей
    # Подзапрос для подсчёта
    count_q = db.query(func.count(distinct(MessageSubscription.vk_user_id))).filter(
        MessageSubscription.project_id == project_id
    )
    if event_type:
        count_q = count_q.filter(MessageSubscription.event_type == event_type)
    count_q = _apply_date_filter(count_q, date_from, date_to)
    total_count = count_q.scalar() or 0
    
    rows = q.order_by(func.max(MessageSubscription.event_at).desc()).offset(offset).limit(limit).all()
    
    # Для каждого пользователя определяем тип последнего события
    # (оптимизировано: один запрос вместо N)
    if rows:
        user_ids = [r.vk_user_id for r in rows]
        # Получаем последний event_type для каждого пользователя в этом проекте
        from sqlalchemy import and_
        last_events_q = db.query(
            MessageSubscription.vk_user_id,
            MessageSubscription.event_type,
        ).filter(
            MessageSubscription.project_id == project_id,
            MessageSubscription.vk_user_id.in_(user_ids),
        ).order_by(MessageSubscription.event_at.desc())
        
        # Собираем последний тип для каждого юзера
        last_type_map: Dict[int, str] = {}
        for le in last_events_q.all():
            if le.vk_user_id not in last_type_map:
                last_type_map[le.vk_user_id] = le.event_type
    else:
        last_type_map = {}
    
    return {
        "total_count": total_count,
        "users": [
            {
                "vk_user_id": r.vk_user_id,
                "allow_count": r.allow_count or 0,
                "deny_count": r.deny_count or 0,
                "last_event_at": r.last_event_at,
                "last_event_type": last_type_map.get(r.vk_user_id, "unknown"),
            }
            for r in rows
        ],
    }


def _apply_date_filter(query, date_from: Optional[str], date_to: Optional[str]):
    """Фильтрация по event_date (YYYY-MM-DD)."""
    if date_from:
        query = query.filter(MessageSubscription.event_date >= date_from)
    if date_to:
        query = query.filter(MessageSubscription.event_date <= date_to)
    return query
