"""
Агрегация сообщений VK API по часовым слотам.

Чистая функция без побочных эффектов — принимает items из messages.getHistory,
возвращает агрегированные данные по часовым слотам + user_totals.
"""

from datetime import datetime, timezone
from typing import Dict, List, Any, Tuple, Optional
from collections import defaultdict


def aggregate_messages(
    items: List[Dict[str, Any]],
    group_id_int: int,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Tuple[Dict[str, Dict[str, Any]], Dict[str, Any]]:
    """
    Агрегирует сообщения из VK API ответа по часовым слотам.

    :param items: список сообщений из messages.getHistory
    :param group_id_int: VK group_id (для определения направления)
    :param date_from: фильтр по дате (YYYY-MM-DD)
    :param date_to: фильтр по дате (YYYY-MM-DD)
    :return: (hourly_agg, user_totals)
        hourly_agg = { hour_slot: { "incoming": N, "outgoing": N, "users": set, "incoming_users": set, "outgoing_users": set } }
        user_totals = { "incoming": N, "outgoing": N, "first_at": ts, "last_at": ts }
    """
    if not items:
        return {}, {"incoming": 0, "outgoing": 0, "first_at": 0, "last_at": 0}

    hourly_agg: Dict[str, Dict[str, Any]] = defaultdict(
        lambda: {"incoming": 0, "outgoing": 0, "users": set(), "incoming_users": set(), "outgoing_users": set()}
    )
    user_totals: Dict[str, Any] = {"incoming": 0, "outgoing": 0, "first_at": float("inf"), "last_at": 0}

    for msg in items:
        msg_date = msg.get("date", 0)
        if not msg_date:
            continue

        # Фильтр по дате (если задан)
        dt = datetime.fromtimestamp(msg_date, tz=timezone.utc)
        date_str = dt.strftime("%Y-%m-%d")
        if date_from and date_str < date_from:
            continue
        if date_to and date_str > date_to:
            continue

        hour_slot = dt.strftime("%Y-%m-%dT%H")

        # Определяем направление: from_id > 0 = от пользователя (incoming),
        # from_id < 0 = от группы (outgoing)
        from_id = msg.get("from_id", 0)
        is_incoming = from_id > 0 and from_id != -group_id_int

        # Peer_id определяет собеседника
        peer_id = msg.get("peer_id", 0)
        # vk_user_id = peer_id если это личный диалог (peer_id > 0)
        vk_user_id = peer_id if peer_id > 0 else (from_id if from_id > 0 else 0)

        if is_incoming:
            hourly_agg[hour_slot]["incoming"] += 1
            user_totals["incoming"] += 1
            if vk_user_id > 0:
                hourly_agg[hour_slot]["incoming_users"].add(vk_user_id)
        else:
            hourly_agg[hour_slot]["outgoing"] += 1
            user_totals["outgoing"] += 1
            if vk_user_id > 0:
                hourly_agg[hour_slot]["outgoing_users"].add(vk_user_id)

        if vk_user_id > 0:
            hourly_agg[hour_slot]["users"].add(vk_user_id)

        user_totals["first_at"] = min(user_totals["first_at"], msg_date)
        user_totals["last_at"] = max(user_totals["last_at"], msg_date)

    # Приводим first_at к нормальному значению
    if user_totals["first_at"] == float("inf"):
        user_totals["first_at"] = 0

    return dict(hourly_agg), user_totals
