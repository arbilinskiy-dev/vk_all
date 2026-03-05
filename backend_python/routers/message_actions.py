"""
Роутер АМ-аналитики — анализ действий сотрудников в модуле Сообщений.
Фильтрует user_actions по category='messages' и возвращает агрегированные данные.
Prefix: /messages/actions-analysis
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, case, desc

from database import get_db
from services.auth_middleware import get_current_admin, get_system_admin, CurrentUser
import models

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/messages/actions-analysis", tags=["AM Analysis"])

# =============================================================================
# Маппинг action_type → человекочитаемое название
# =============================================================================

ACTION_TYPE_LABELS: Dict[str, str] = {
    "message_send": "Отправка сообщения",
    "message_dialog_read": "Вход в диалог",
    "message_unread_dialog_read": "Прочтение непрочитанного",
    "message_mark_unread": "Пометка непрочитанным",
    "message_mark_all_read": "Все прочитаны",
    "message_toggle_important": "Пометка важным",
    "dialog_label_create": "Создание метки",
    "dialog_label_update": "Редактирование метки",
    "dialog_label_delete": "Удаление метки",
    "dialog_label_assign": "Привязка метки",
    "dialog_label_unassign": "Открепление метки",
    "dialog_label_set": "Замена меток",
    "template_create": "Создание шаблона",
    "template_update": "Редактирование шаблона",
    "template_delete": "Удаление шаблона",
    "promo_list_create": "Создание промо-списка",
    "promo_list_update": "Редактирование промо-списка",
    "promo_list_delete": "Удаление промо-списка",
    "promo_codes_add": "Добавление промокодов",
    "promo_code_delete": "Удаление промокода",
    "promo_codes_delete_all_free": "Удаление свободных промокодов",
}

# Группировка типов действий для круговой диаграммы
ACTION_GROUPS: Dict[str, List[str]] = {
    "dialogs": [
        "message_dialog_read", "message_unread_dialog_read", "message_mark_unread",
        "message_mark_all_read", "message_toggle_important",
    ],
    "messages": ["message_send"],
    "labels": [
        "dialog_label_create", "dialog_label_update", "dialog_label_delete",
        "dialog_label_assign", "dialog_label_unassign", "dialog_label_set",
    ],
    "templates": ["template_create", "template_update", "template_delete"],
    "promocodes": [
        "promo_list_create", "promo_list_update", "promo_list_delete",
        "promo_codes_add", "promo_code_delete", "promo_codes_delete_all_free",
    ],
}

ACTION_GROUP_LABELS: Dict[str, str] = {
    "dialogs": "Работа с диалогами",
    "messages": "Отправка сообщений",
    "labels": "Метки клиентов",
    "templates": "Шаблоны",
    "promocodes": "Промокоды",
}


# =============================================================================
# ЭНДПОИНТ: POST /messages/actions-analysis/dashboard
# =============================================================================

@router.post("/dashboard")
def get_am_analysis_dashboard(
    period_days: int = Query(30, description="Период в днях"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_system_admin),
):
    """
    Полный дашборд АМ-аналитики.
    Фильтрует user_actions по action_category='messages'.
    Возвращает: сводку, статистику по сотрудникам, топ действий, график по дням.
    """
    now = datetime.utcnow()
    since = now - timedelta(days=period_days)

    base_filter = [
        models.UserAction.action_category == "messages",
        models.UserAction.created_at >= since,
    ]

    # ─── 1. Сводка KPI ──────────────────────────────────────────
    total_actions = db.query(
        func.count(models.UserAction.id)
    ).filter(*base_filter).scalar() or 0

    active_users = db.query(
        func.count(distinct(models.UserAction.user_id))
    ).filter(*base_filter).scalar() or 0

    total_dialogs_read = db.query(
        func.count(models.UserAction.id)
    ).filter(
        *base_filter,
        models.UserAction.action_type == "message_dialog_read",
    ).scalar() or 0

    total_unread_dialogs_read = db.query(
        func.count(models.UserAction.id)
    ).filter(
        *base_filter,
        models.UserAction.action_type == "message_unread_dialog_read",
    ).scalar() or 0

    total_messages_sent = db.query(
        func.count(models.UserAction.id)
    ).filter(
        *base_filter,
        models.UserAction.action_type == "message_send",
    ).scalar() or 0

    total_labels_actions = db.query(
        func.count(models.UserAction.id)
    ).filter(
        *base_filter,
        models.UserAction.action_type.in_([
            "dialog_label_create", "dialog_label_update", "dialog_label_delete",
            "dialog_label_assign", "dialog_label_unassign", "dialog_label_set",
        ]),
    ).scalar() or 0

    total_templates_actions = db.query(
        func.count(models.UserAction.id)
    ).filter(
        *base_filter,
        models.UserAction.action_type.in_([
            "template_create", "template_update", "template_delete",
        ]),
    ).scalar() or 0

    summary = {
        "total_actions": total_actions,
        "active_users": active_users,
        "total_dialogs_read": total_dialogs_read,
        "total_unread_dialogs_read": total_unread_dialogs_read,
        "total_messages_sent": total_messages_sent,
        "total_labels_actions": total_labels_actions,
        "total_templates_actions": total_templates_actions,
        "period_days": period_days,
    }

    # ─── 2. Статистика по сотрудникам ────────────────────────────
    user_rows = db.query(
        models.UserAction.user_id,
        models.UserAction.username,
        func.count(models.UserAction.id).label("total"),
        func.count(case((models.UserAction.action_type == "message_dialog_read", 1))).label("dialogs_read"),
        func.count(case((models.UserAction.action_type == "message_unread_dialog_read", 1))).label("unread_dialogs_read"),
        func.count(case((models.UserAction.action_type == "message_send", 1))).label("messages_sent"),
        func.count(case((models.UserAction.action_type == "message_mark_unread", 1))).label("mark_unread"),
        func.count(case((models.UserAction.action_type == "message_toggle_important", 1))).label("toggle_important"),
        func.count(case((models.UserAction.action_type.in_([
            "dialog_label_create", "dialog_label_update", "dialog_label_delete",
            "dialog_label_assign", "dialog_label_unassign", "dialog_label_set",
        ]), 1))).label("labels"),
        func.count(case((models.UserAction.action_type.in_([
            "template_create", "template_update", "template_delete",
        ]), 1))).label("templates"),
        func.count(case((models.UserAction.action_type.in_([
            "promo_list_create", "promo_list_update", "promo_list_delete",
            "promo_codes_add", "promo_code_delete", "promo_codes_delete_all_free",
        ]), 1))).label("promocodes"),
        func.max(models.UserAction.created_at).label("last_action_at"),
    ).filter(
        *base_filter,
    ).group_by(
        models.UserAction.user_id,
        models.UserAction.username,
    ).order_by(desc("total")).all()

    # Подтягиваем ФИО и роли
    user_ids = [r.user_id for r in user_rows]
    users_map: Dict[str, Dict[str, Any]] = {}
    roles_map: Dict[str, Dict[str, Any]] = {}

    if user_ids:
        users_db = db.query(
            models.User.id, models.User.full_name, models.User.role_id
        ).filter(models.User.id.in_(user_ids)).all()
        users_map = {u.id: {"full_name": u.full_name, "role_id": u.role_id} for u in users_db}

        role_ids = list({u["role_id"] for u in users_map.values() if u.get("role_id")})
        if role_ids:
            roles_db = db.query(
                models.UserRole.id, models.UserRole.name, models.UserRole.color
            ).filter(models.UserRole.id.in_(role_ids)).all()
            roles_map = {r.id: {"name": r.name, "color": r.color} for r in roles_db}

    user_stats = []
    for r in user_rows:
        user_info = users_map.get(r.user_id, {})
        role_info = roles_map.get(user_info.get("role_id")) if user_info.get("role_id") else None
        user_stats.append({
            "user_id": r.user_id,
            "username": r.username,
            "full_name": user_info.get("full_name"),
            "role_name": role_info["name"] if role_info else None,
            "role_color": role_info["color"] if role_info else None,
            "total_actions": r.total,
            "dialogs_read": r.dialogs_read,
            "unread_dialogs_read": r.unread_dialogs_read,
            "messages_sent": r.messages_sent,
            "mark_unread": r.mark_unread,
            "toggle_important": r.toggle_important,
            "labels": r.labels,
            "templates": r.templates,
            "promocodes": r.promocodes,
            "last_action_at": r.last_action_at.isoformat() if r.last_action_at else None,
        })

    # ─── 3. Топ действий (для круговой диаграммы) ────────────────
    top_actions = db.query(
        models.UserAction.action_type,
        func.count(models.UserAction.id).label("cnt"),
    ).filter(
        *base_filter,
    ).group_by(
        models.UserAction.action_type,
    ).order_by(desc("cnt")).all()

    action_distribution = [
        {
            "action_type": a.action_type,
            "label": ACTION_TYPE_LABELS.get(a.action_type, a.action_type),
            "count": a.cnt,
        }
        for a in top_actions
    ]

    # Группировка по категориям
    group_distribution = []
    action_counts = {a.action_type: a.cnt for a in top_actions}
    for group_key, action_types in ACTION_GROUPS.items():
        total = sum(action_counts.get(at, 0) for at in action_types)
        if total > 0:
            group_distribution.append({
                "group": group_key,
                "label": ACTION_GROUP_LABELS.get(group_key, group_key),
                "count": total,
            })

    # ─── 4. График по дням ───────────────────────────────────────
    daily_rows = db.query(
        func.date(models.UserAction.created_at).label("day"),
        func.count(models.UserAction.id).label("total"),
        func.count(case((models.UserAction.action_type == "message_dialog_read", 1))).label("dialogs_read"),
        func.count(case((models.UserAction.action_type == "message_unread_dialog_read", 1))).label("unread_dialogs_read"),
        func.count(case((models.UserAction.action_type == "message_send", 1))).label("messages_sent"),
        func.count(case((models.UserAction.action_type.in_([
            "dialog_label_create", "dialog_label_update", "dialog_label_delete",
            "dialog_label_assign", "dialog_label_unassign", "dialog_label_set",
        ]), 1))).label("labels"),
        func.count(case((models.UserAction.action_type.in_([
            "template_create", "template_update", "template_delete",
        ]), 1))).label("templates"),
        func.count(distinct(models.UserAction.user_id)).label("unique_users"),
    ).filter(
        *base_filter,
    ).group_by(
        func.date(models.UserAction.created_at),
    ).order_by(
        func.date(models.UserAction.created_at),
    ).all()

    daily_chart = [
        {
            "date": str(r.day),
            "total": r.total,
            "dialogs_read": r.dialogs_read,
            "unread_dialogs_read": r.unread_dialogs_read,
            "messages_sent": r.messages_sent,
            "labels": r.labels,
            "templates": r.templates,
            "unique_users": r.unique_users,
        }
        for r in daily_rows
    ]

    return {
        "summary": summary,
        "user_stats": user_stats,
        "action_distribution": action_distribution,
        "group_distribution": group_distribution,
        "daily_chart": daily_chart,
        "action_type_labels": ACTION_TYPE_LABELS,
    }
