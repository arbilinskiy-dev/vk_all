"""
Вспомогательные функции для чтения статистики сообщений.
Используются в модулях _summary, _charts, _admin и внешними модулями (reconcile, verify_sync).
"""

import json
import logging
from typing import Optional, Set
from sqlalchemy.orm import Session

from models_library.message_stats import MessageStatsHourly

logger = logging.getLogger("crud.message_stats")


# =============================================================================
# Вспомогательная функция для фильтрации hourly
# =============================================================================

def _hourly_date_filter(query, date_from: Optional[str], date_to: Optional[str]):
    """Применяет фильтр по дате к запросу MessageStatsHourly."""
    if date_from:
        query = query.filter(MessageStatsHourly.hour_slot >= f"{date_from}T00")
    if date_to:
        query = query.filter(MessageStatsHourly.hour_slot <= f"{date_to}T23")
    return query


def _collect_unique_users_from_json(
    db: Session, json_field, date_from: Optional[str] = None,
    date_to: Optional[str] = None, project_id: Optional[str] = None,
) -> Set[int]:
    """Собирает уникальных пользователей из JSON-поля hourly за период."""
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
