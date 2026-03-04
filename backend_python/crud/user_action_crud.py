"""
CRUD для записи и чтения бизнес-действий пользователей (user_actions).
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, case, desc, extract
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import uuid
import json

import models


# ==========================================
# ЗАПИСЬ ДЕЙСТВИЙ
# ==========================================

def log_action(
    db: Session,
    user_id: str,
    username: str,
    action_type: str,
    action_category: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    project_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> models.UserAction:
    """
    Записывает одно бизнес-действие пользователя.
    
    Категории (action_category):
        posts, messages, market, contests, ai, settings, projects, automations, other
    
    Примеры action_type:
        post_create, post_publish, post_delete, post_schedule,
        message_send, message_read, message_template_use,
        market_create_item, market_delete_item,
        contest_create, contest_finalize,
        ai_generate_text, ai_generate_image,
        settings_update, project_update, bulk_edit
    """
    action = models.UserAction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        username=username,
        action_type=action_type,
        action_category=action_category,
        entity_type=entity_type,
        entity_id=entity_id,
        project_id=project_id,
        action_metadata=json.dumps(metadata, ensure_ascii=False) if metadata else None,
        created_at=datetime.utcnow(),
    )
    db.add(action)
    db.commit()
    return action


def log_action_no_commit(
    db: Session,
    user_id: str,
    username: str,
    action_type: str,
    action_category: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    project_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> models.UserAction:
    """
    Записывает действие БЕЗ коммита — для использования
    внутри транзакции, где коммит делает вызывающий код.
    """
    action = models.UserAction(
        id=str(uuid.uuid4()),
        user_id=user_id,
        username=username,
        action_type=action_type,
        action_category=action_category,
        entity_type=entity_type,
        entity_id=entity_id,
        project_id=project_id,
        action_metadata=json.dumps(metadata, ensure_ascii=False) if metadata else None,
        created_at=datetime.utcnow(),
    )
    db.add(action)
    return action


# ==========================================
# ЧТЕНИЕ / АНАЛИТИКА
# ==========================================

def get_actions_summary(
    db: Session,
    period_days: int = 30,
) -> Dict[str, Any]:
    """
    Агрегированная сводка действий за период — 
    для раздела 'Действия' на дашборде аналитики.
    """
    now = datetime.utcnow()
    since = now - timedelta(days=period_days)

    # Общее кол-во действий
    total_actions = db.query(func.count(models.UserAction.id)).filter(
        models.UserAction.created_at >= since,
    ).scalar() or 0

    # Уникальных активных пользователей (тех, кто делал действия)
    active_doers = db.query(
        func.count(distinct(models.UserAction.user_id))
    ).filter(
        models.UserAction.created_at >= since,
    ).scalar() or 0

    # Топ-категории
    top_categories = db.query(
        models.UserAction.action_category,
        func.count(models.UserAction.id).label("cnt"),
    ).filter(
        models.UserAction.created_at >= since,
    ).group_by(
        models.UserAction.action_category,
    ).order_by(desc("cnt")).all()

    # Топ-действия
    top_actions = db.query(
        models.UserAction.action_type,
        func.count(models.UserAction.id).label("cnt"),
    ).filter(
        models.UserAction.created_at >= since,
    ).group_by(
        models.UserAction.action_type,
    ).order_by(desc("cnt")).limit(10).all()

    return {
        "total_actions": total_actions,
        "active_doers": active_doers,
        "top_categories": [
            {"category": c.action_category, "count": c.cnt}
            for c in top_categories
        ],
        "top_actions": [
            {"action_type": a.action_type, "count": a.cnt}
            for a in top_actions
        ],
    }


def get_user_actions_stats(
    db: Session,
    period_days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Статистика действий по каждому пользователю — кто сколько сделал,
    по каким категориям, последнее действие.
    """
    now = datetime.utcnow()
    since = now - timedelta(days=period_days)

    rows = db.query(
        models.UserAction.user_id,
        models.UserAction.username,
        func.count(models.UserAction.id).label("total"),
        func.count(case((models.UserAction.action_category == "posts", 1))).label("posts"),
        func.count(case((models.UserAction.action_category == "messages", 1))).label("messages"),
        func.count(case((models.UserAction.action_category == "market", 1))).label("market"),
        func.count(case((models.UserAction.action_category == "ai", 1))).label("ai"),
        func.count(case((models.UserAction.action_category == "contests", 1))).label("contests"),
        func.count(case((models.UserAction.action_category == "automations", 1))).label("automations"),
        func.max(models.UserAction.created_at).label("last_action_at"),
    ).filter(
        models.UserAction.created_at >= since,
    ).group_by(
        models.UserAction.user_id,
        models.UserAction.username,
    ).order_by(desc("total")).all()

    # Подтягиваем ФИО и role_id
    user_ids = [r.user_id for r in rows]
    users_map = {}
    if user_ids:
        users_db = db.query(
            models.User.id, models.User.full_name, models.User.role_id
        ).filter(models.User.id.in_(user_ids)).all()
        users_map = {u.id: {"full_name": u.full_name, "role_id": u.role_id} for u in users_db}

    # Подтягиваем роли
    roles_map = {}
    role_ids = list({u["role_id"] for u in users_map.values() if u.get("role_id")})
    if role_ids:
        roles_db = db.query(
            models.UserRole.id, models.UserRole.name, models.UserRole.color
        ).filter(models.UserRole.id.in_(role_ids)).all()
        roles_map = {r.id: {"name": r.name, "color": r.color} for r in roles_db}

    result = []
    for r in rows:
        user_info = users_map.get(r.user_id, {})
        role_info = roles_map.get(user_info.get("role_id")) if user_info.get("role_id") else None
        result.append({
            "user_id": r.user_id,
            "username": r.username,
            "full_name": user_info.get("full_name"),
            "role_name": role_info["name"] if role_info else None,
            "role_color": role_info["color"] if role_info else None,
            "total_actions": r.total,
            "categories": [
                {"category": "posts", "count": r.posts},
                {"category": "messages", "count": r.messages},
                {"category": "market", "count": r.market},
                {"category": "ai", "count": r.ai},
                {"category": "contests", "count": r.contests},
                {"category": "automations", "count": r.automations},
            ],
            "last_action_at": r.last_action_at.isoformat() if r.last_action_at else None,
        })
    return result


def get_daily_actions(
    db: Session,
    period_days: int = 30,
) -> List[Dict[str, Any]]:
    """
    Действия по дням — для графика на дашборде.
    """
    now = datetime.utcnow()
    since = now - timedelta(days=period_days)

    rows = db.query(
        func.date(models.UserAction.created_at).label("day"),
        func.count(models.UserAction.id).label("total"),
        func.count(case((models.UserAction.action_category == "posts", 1))).label("posts"),
        func.count(case((models.UserAction.action_category == "messages", 1))).label("messages"),
        func.count(case((models.UserAction.action_category == "ai", 1))).label("ai"),
        func.count(distinct(models.UserAction.user_id)).label("unique_users"),
    ).filter(
        models.UserAction.created_at >= since,
    ).group_by(
        func.date(models.UserAction.created_at),
    ).order_by(
        func.date(models.UserAction.created_at),
    ).all()

    return [
        {
            "date": str(r.day),
            "total": r.total,
            "posts": r.posts,
            "messages": r.messages,
            "ai": r.ai,
            "unique_users": r.unique_users,
        }
        for r in rows
    ]
