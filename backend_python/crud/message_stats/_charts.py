"""
ЧТЕНИЕ: Данные для графиков пиковых нагрузок (часовые слоты).
"""

import json
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
    
    def _parse_json_set(val: str) -> set:
        """Безопасный парсинг JSON-массива в set."""
        try:
            return set(json.loads(val or "[]"))
        except (json.JSONDecodeError, TypeError):
            return set()
    
    # Хелпер для маппинга строки модели → dict для ответа
    def _row_to_dict(r) -> Dict[str, Any]:
        inc = r.incoming_count or 0
        out = r.outgoing_count or 0
        # Уникальные пользователи из JSON
        text_users = _parse_json_set(r.unique_text_users_json)
        payload_users = _parse_json_set(r.unique_payload_users_json)
        out_users = _parse_json_set(r.outgoing_users_json)
        # Входящие диалоги = уникальные юзеры, написавшие хоть что-то входящее
        incoming_dialog_users = text_users | payload_users
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
            # Диалоги и пользователи (из JSON)
            "incoming_dialogs": len(incoming_dialog_users),
            "unique_text_users": len(text_users),
            "unique_payload_users": len(payload_users),
            "outgoing_recipients": len(out_users),
        }

    # Если фильтр по проекту — возвращаем как есть
    if project_id:
        return [_row_to_dict(r) for r in rows]
    
    # Без фильтра — агрегируем по hour_slot (суммируем все проекты)
    # Для счётчиков — простая сумма. Для уникальных юзеров — объединение множеств.
    agg_counts: Dict[str, Dict[str, int]] = {}
    agg_sets: Dict[str, Dict[str, set]] = {}
    
    for r in rows:
        slot = r.hour_slot
        if slot not in agg_counts:
            agg_counts[slot] = {
                "incoming": 0, "outgoing": 0,
                "incoming_payload": 0, "incoming_text": 0,
                "outgoing_system": 0, "outgoing_bot": 0,
            }
            agg_sets[slot] = {
                "unique_users": set(),
                "text_users": set(),
                "payload_users": set(),
                "out_users": set(),
            }
        c = agg_counts[slot]
        s = agg_sets[slot]
        c["incoming"] += r.incoming_count or 0
        c["outgoing"] += r.outgoing_count or 0
        c["incoming_payload"] += r.incoming_payload_count or 0
        c["incoming_text"] += r.incoming_text_count or 0
        c["outgoing_system"] += r.outgoing_system_count or 0
        c["outgoing_bot"] += r.outgoing_bot_count or 0
        # Объединяем множества для честного подсчёта уникальных
        s["unique_users"].update(_parse_json_set(r.unique_users_json))
        s["text_users"].update(_parse_json_set(r.unique_text_users_json))
        s["payload_users"].update(_parse_json_set(r.unique_payload_users_json))
        s["out_users"].update(_parse_json_set(r.outgoing_users_json))
    
    result = []
    for slot in sorted(agg_counts.keys()):
        c = agg_counts[slot]
        s = agg_sets[slot]
        incoming_dialog_users = s["text_users"] | s["payload_users"]
        result.append({
            "hour_slot": slot,
            "incoming": c["incoming"],
            "outgoing": c["outgoing"],
            "total": c["incoming"] + c["outgoing"],
            "unique_users": len(s["unique_users"]),
            "incoming_payload": c["incoming_payload"],
            "incoming_text": c["incoming_text"],
            "outgoing_system": c["outgoing_system"],
            "outgoing_bot": c["outgoing_bot"],
            "incoming_dialogs": len(incoming_dialog_users),
            "unique_text_users": len(s["text_users"]),
            "unique_payload_users": len(s["payload_users"]),
            "outgoing_recipients": len(s["out_users"]),
        })
    return result
