"""
Вспомогательные функции для статистики сообщений.
Используются в модулях _summary, _charts, _admin, write, reconcile, sync.
"""

import logging
from typing import Optional, Set, List
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, case, text

from models_library.message_stats import MessageStatsHourly, MessageStatsHourlyUsers

logger = logging.getLogger("crud.message_stats")


# =============================================================================
# Фильтрация hourly по дате
# =============================================================================

def _hourly_date_filter(query, date_from: Optional[str], date_to: Optional[str]):
    """Применяет фильтр по дате к запросу MessageStatsHourly."""
    if date_from:
        query = query.filter(MessageStatsHourly.hour_slot >= f"{date_from}T00")
    if date_to:
        query = query.filter(MessageStatsHourly.hour_slot <= f"{date_to}T23")
    return query


def _hourly_users_date_filter(query, date_from: Optional[str], date_to: Optional[str]):
    """Применяет фильтр по дате к запросу MessageStatsHourlyUsers."""
    if date_from:
        query = query.filter(MessageStatsHourlyUsers.hour_slot >= f"{date_from}T00")
    if date_to:
        query = query.filter(MessageStatsHourlyUsers.hour_slot <= f"{date_to}T23")
    return query


# =============================================================================
# Сбор уникальных пользователей из нормализованной таблицы
# =============================================================================

def _collect_unique_users(
    db: Session,
    user_types: Optional[List[int]] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    project_id: Optional[str] = None,
) -> Set[int]:
    """
    Собирает уникальных пользователей из нормализованной таблицы.
    
    :param user_types: фильтр по типу [1=text, 2=payload, 3=outgoing], None = все
    :param date_from: фильтр по дате (YYYY-MM-DD)
    :param date_to: фильтр по дате (YYYY-MM-DD)
    :param project_id: фильтр по проекту
    """
    q = db.query(MessageStatsHourlyUsers.vk_user_id).distinct()
    if project_id:
        q = q.filter(MessageStatsHourlyUsers.project_id == project_id)
    if user_types:
        q = q.filter(MessageStatsHourlyUsers.user_type.in_(user_types))
    q = _hourly_users_date_filter(q, date_from, date_to)
    return {row[0] for row in q.all()}


# =============================================================================
# Пересчёт счётчиков пользователей (для одного слота)
# =============================================================================

def _recount_hourly_users(
    db: Session,
    hourly_row: MessageStatsHourly,
    project_id: str,
    hour_slot: str,
) -> None:
    """
    Пересчитывает все счётчики уникальных пользователей для одного часового слота.
    Один SQL-запрос с CASE-выражениями.
    Используется в write.py (горячий путь — вызывается только при новом юзере).
    """
    counts = db.query(
        func.count(distinct(MessageStatsHourlyUsers.vk_user_id)).label("total"),
        func.count(distinct(case(
            (MessageStatsHourlyUsers.user_type == 1, MessageStatsHourlyUsers.vk_user_id),
        ))).label("text_cnt"),
        func.count(distinct(case(
            (MessageStatsHourlyUsers.user_type == 2, MessageStatsHourlyUsers.vk_user_id),
        ))).label("payload_cnt"),
        func.count(distinct(case(
            (MessageStatsHourlyUsers.user_type == 3, MessageStatsHourlyUsers.vk_user_id),
        ))).label("out_cnt"),
        func.count(distinct(case(
            (MessageStatsHourlyUsers.user_type.in_([1, 2]), MessageStatsHourlyUsers.vk_user_id),
        ))).label("inc_cnt"),
    ).filter(
        MessageStatsHourlyUsers.project_id == project_id,
        MessageStatsHourlyUsers.hour_slot == hour_slot,
    ).first()
    
    hourly_row.unique_users_count = counts.total or 0
    hourly_row.unique_text_users_count = counts.text_cnt or 0
    hourly_row.unique_payload_users_count = counts.payload_cnt or 0
    hourly_row.outgoing_users_count = counts.out_cnt or 0
    hourly_row.incoming_users_count = counts.inc_cnt or 0
    hourly_row.unique_dialogs_count = counts.total or 0


# =============================================================================
# Bulk-пересчёт счётчиков для проекта (для reconcile/sync)
# =============================================================================

def _bulk_recount_hourly_users(db: Session, project_id: str) -> None:
    """
    Пересчитывает ВСЕ счётчики пользователей для проекта одним SQL.
    Используется после batch-операций (reconcile, sync).
    """
    db.execute(text("""
        UPDATE message_stats_hourly h SET
            unique_users_count = COALESCE(sub.all_cnt, h.unique_users_count),
            unique_text_users_count = COALESCE(sub.text_cnt, 0),
            unique_payload_users_count = COALESCE(sub.payload_cnt, 0),
            outgoing_users_count = COALESCE(sub.out_cnt, 0),
            incoming_users_count = COALESCE(sub.inc_cnt, 0),
            unique_dialogs_count = COALESCE(sub.all_cnt, h.unique_dialogs_count)
        FROM (
            SELECT project_id, hour_slot,
                COUNT(DISTINCT vk_user_id) as all_cnt,
                COUNT(DISTINCT CASE WHEN user_type = 1 THEN vk_user_id END) as text_cnt,
                COUNT(DISTINCT CASE WHEN user_type = 2 THEN vk_user_id END) as payload_cnt,
                COUNT(DISTINCT CASE WHEN user_type = 3 THEN vk_user_id END) as out_cnt,
                COUNT(DISTINCT CASE WHEN user_type IN (1,2) THEN vk_user_id END) as inc_cnt
            FROM message_stats_hourly_users
            WHERE project_id = :pid
            GROUP BY project_id, hour_slot
        ) sub
        WHERE h.project_id = sub.project_id AND h.hour_slot = sub.hour_slot
    """), {"pid": project_id})


# =============================================================================
# Deprecated: обратная совместимость (для модулей, ещё не обновлённых)
# =============================================================================

def _collect_unique_users_from_json(
    db: Session, json_field, date_from: Optional[str] = None,
    date_to: Optional[str] = None, project_id: Optional[str] = None,
) -> Set[int]:
    """
    DEPRECATED: Собирает уникальных пользователей из JSON-поля hourly за период.
    Используйте _collect_unique_users() с нормализованной таблицей.
    """
    import json
    rows_q = db.query(json_field)
    if project_id:
        rows_q = rows_q.filter(MessageStatsHourly.project_id == project_id)
    rows_q = _hourly_date_filter(rows_q, date_from, date_to)
    result_set: Set[int] = set()
    for (json_str,) in rows_q.all():
        if json_str:
            try:
                result_set.update(json.loads(json_str))
            except Exception:
                pass
    return result_set
