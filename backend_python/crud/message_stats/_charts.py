"""
ЧТЕНИЕ: Данные для графиков пиковых нагрузок (часовые слоты).
Нормализованная архитектура: используем integer-колонки вместо JSON-парсинга.
"""

import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from models_library.message_stats import MessageStatsHourly

from crud.message_stats._helpers import _hourly_date_filter

logger = logging.getLogger("crud.message_stats")


# =============================================================================
# ГРАФИК ПИКОВЫХ НАГРУЗОК
# =============================================================================

def get_hourly_chart(
    db: Session,
    project_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Данные для графика пиковых нагрузок (часовые слоты)."""
    query = db.query(MessageStatsHourly)
    
    if project_id:
        query = query.filter(MessageStatsHourly.project_id == project_id)
    query = _hourly_date_filter(query, date_from, date_to)
    
    rows = query.order_by(MessageStatsHourly.hour_slot.asc()).all()
    
    # Маппинг строки модели → dict для ответа (без JSON-парсинга)
    def _row_to_dict(r) -> Dict[str, Any]:
        inc = r.incoming_count or 0
        out = r.outgoing_count or 0
        return {
            "hour_slot": r.hour_slot,
            "incoming": inc,
            "outgoing": out,
            "total": inc + out,
            "unique_users": r.unique_users_count or 0,
            # Детализация входящих
            "incoming_payload": r.incoming_payload_count or 0,
            "incoming_text": r.incoming_text_count or 0,
            # Детализация исходящих
            "outgoing_system": r.outgoing_system_count or 0,
            "outgoing_bot": r.outgoing_bot_count or 0,
            # Диалоги и пользователи (из integer-колонок)
            "incoming_dialogs": r.incoming_users_count or 0,
            "unique_text_users": r.unique_text_users_count or 0,
            "unique_payload_users": r.unique_payload_users_count or 0,
            "outgoing_recipients": r.outgoing_users_count or 0,
        }

    # Если фильтр по проекту — возвращаем как есть
    if project_id:
        return [_row_to_dict(r) for r in rows]
    
    # Без фильтра — агрегируем по hour_slot (суммируем все проекты)
    # Для счётчиков — простая сумма. Для уникальных юзеров — тоже сумма
    # (проверено: кросс-проектный overlap = 0, значит sum = union)
    agg: Dict[str, Dict[str, int]] = {}
    
    for r in rows:
        slot = r.hour_slot
        if slot not in agg:
            agg[slot] = {
                "incoming": 0, "outgoing": 0,
                "incoming_payload": 0, "incoming_text": 0,
                "outgoing_system": 0, "outgoing_bot": 0,
                "unique_users": 0, "unique_text_users": 0,
                "unique_payload_users": 0, "outgoing_recipients": 0,
                "incoming_dialogs": 0,
            }
        c = agg[slot]
        c["incoming"] += r.incoming_count or 0
        c["outgoing"] += r.outgoing_count or 0
        c["incoming_payload"] += r.incoming_payload_count or 0
        c["incoming_text"] += r.incoming_text_count or 0
        c["outgoing_system"] += r.outgoing_system_count or 0
        c["outgoing_bot"] += r.outgoing_bot_count or 0
        # Кросс-проектный overlap = 0 → сумма = точный подсчёт уникальных
        c["unique_users"] += r.unique_users_count or 0
        c["unique_text_users"] += r.unique_text_users_count or 0
        c["unique_payload_users"] += r.unique_payload_users_count or 0
        c["outgoing_recipients"] += r.outgoing_users_count or 0
        c["incoming_dialogs"] += r.incoming_users_count or 0
    
    result = []
    for slot in sorted(agg.keys()):
        c = agg[slot]
        result.append({
            "hour_slot": slot,
            "incoming": c["incoming"],
            "outgoing": c["outgoing"],
            "total": c["incoming"] + c["outgoing"],
            "unique_users": c["unique_users"],
            "incoming_payload": c["incoming_payload"],
            "incoming_text": c["incoming_text"],
            "outgoing_system": c["outgoing_system"],
            "outgoing_bot": c["outgoing_bot"],
            "incoming_dialogs": c["incoming_dialogs"],
            "unique_text_users": c["unique_text_users"],
            "unique_payload_users": c["unique_payload_users"],
            "outgoing_recipients": c["outgoing_recipients"],
        })
    return result
