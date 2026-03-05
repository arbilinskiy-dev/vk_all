"""
ЧТЕНИЕ: Детализация по пользователям внутри проекта.
Поддерживает фильтрацию по дате через нормализованную таблицу MessageStatsHourlyUsers.
"""

import logging
from collections import defaultdict
from typing import Dict, Any, Optional, Set
from sqlalchemy.orm import Session
from sqlalchemy import func

from models_library.message_stats import MessageStatsHourly, MessageStatsUser, MessageStatsHourlyUsers
from crud.message_stats._helpers import _hourly_date_filter, _hourly_users_date_filter

logger = logging.getLogger("crud.message_stats")


def _collect_active_user_ids(
    db: Session,
    project_id: str,
    date_from: Optional[str],
    date_to: Optional[str],
    message_type: Optional[str] = None,
) -> Set[int]:
    """Собрать ID пользователей, активных в проекте за период, из нормализованной таблицы."""
    base_q = db.query(MessageStatsHourlyUsers.vk_user_id).distinct().filter(
        MessageStatsHourlyUsers.project_id == project_id
    )
    base_q = _hourly_users_date_filter(base_q, date_from, date_to)

    if message_type == 'text':
        # Reconcile из VK API НЕ различает text/payload → при создании hourly-строки
        # все входящие попадают в type=1 (text). Callback/sync корректно пишут payload.
        # Итог: text_users - payload_users = гарантированно «реальные» пользователи.
        text_ids = {r[0] for r in base_q.filter(MessageStatsHourlyUsers.user_type == 1).all()}
        payload_ids = {r[0] for r in base_q.filter(MessageStatsHourlyUsers.user_type == 2).all()}
        return text_ids - payload_ids
    elif message_type == 'payload':
        return {r[0] for r in base_q.filter(MessageStatsHourlyUsers.user_type == 2).all()}
    else:
        # Все активные (входящие + исходящие) — все типы
        return {r[0] for r in base_q.all()}


def _count_per_user_from_hourly(
    db: Session,
    project_id: str,
    active_ids: Set[int],
    date_from: Optional[str],
    date_to: Optional[str],
    message_type: Optional[str] = None,
) -> Dict[int, Dict[str, int]]:
    """
    Подсчитать кол-во входящих/исходящих за период ПО КАЖДОМУ пользователю.
    Читает из нормализованной таблицы MessageStatsHourlyUsers.
    Поддерживает message_type для суб-фильтрации:
    - text: только реальные набранные (incoming_text_count среди text users)
    - payload: только кнопочные (incoming_payload_count среди payload users)
    - None: все входящие/исходящие
    """
    if not active_ids:
        return {}

    # Получаем hourly-счётчики проекта за период
    hq = db.query(
        MessageStatsHourly.hour_slot,
        MessageStatsHourly.incoming_count,
        MessageStatsHourly.outgoing_count,
        MessageStatsHourly.incoming_text_count,
        MessageStatsHourly.incoming_payload_count,
    ).filter(MessageStatsHourly.project_id == project_id)
    hq = _hourly_date_filter(hq, date_from, date_to)
    hourly_data = {r.hour_slot: r for r in hq.all()}

    # Получаем user-slot-type из нормализованной таблицы
    uq = db.query(
        MessageStatsHourlyUsers.hour_slot,
        MessageStatsHourlyUsers.vk_user_id,
        MessageStatsHourlyUsers.user_type,
    ).filter(
        MessageStatsHourlyUsers.project_id == project_id,
        MessageStatsHourlyUsers.vk_user_id.in_(active_ids),
    )
    uq = _hourly_users_date_filter(uq, date_from, date_to)

    # Строим per-slot множества пользователей по типам
    slot_text_users: Dict[str, Set[int]] = defaultdict(set)
    slot_payload_users: Dict[str, Set[int]] = defaultdict(set)
    slot_out_users: Dict[str, Set[int]] = defaultdict(set)

    for slot, uid, utype in uq.all():
        if utype == 1:
            slot_text_users[slot].add(uid)
        elif utype == 2:
            slot_payload_users[slot].add(uid)
        elif utype == 3:
            slot_out_users[slot].add(uid)

    # Собираем слоты для пропорционального распределения
    slot_incoming: list = []  # (count, set_of_uids)
    slot_outgoing: list = []

    for slot, h in hourly_data.items():
        if message_type == 'text':
            # Только текстовые: распределяем incoming_text_count среди text users
            # Пересекаем с active_ids чтобы payload-юзеры (ошибочно попавшие
            # из reconcile) не участвовали в распределении
            inc_users = slot_text_users.get(slot, set()) & active_ids
            if inc_users:
                slot_incoming.append((h.incoming_text_count or 0, inc_users))
        elif message_type == 'payload':
            # Только кнопочные: распределяем incoming_payload_count среди payload users
            inc_users = slot_payload_users.get(slot, set())
            if inc_users:
                slot_incoming.append((h.incoming_payload_count or 0, inc_users))
        else:
            # Все входящие: text ∪ payload
            inc_users = slot_text_users.get(slot, set()) | slot_payload_users.get(slot, set())
            if inc_users:
                slot_incoming.append((h.incoming_count or 0, inc_users))

        # Исходящие не зависят от message_type (только входящие суб-фильтр)
        if not message_type:
            out_users = slot_out_users.get(slot, set())
            if out_users:
                slot_outgoing.append((h.outgoing_count or 0, out_users))

    # Распределяем сообщения пропорционально (в каждом слоте делим count на кол-во юзеров)
    user_incoming: Dict[int, float] = {}
    for cnt, uids in slot_incoming:
        share = cnt / max(len(uids), 1)
        for uid in uids:
            user_incoming[uid] = user_incoming.get(uid, 0) + share

    user_outgoing: Dict[int, float] = {}
    for cnt, uids in slot_outgoing:
        share = cnt / max(len(uids), 1)
        for uid in uids:
            user_outgoing[uid] = user_outgoing.get(uid, 0) + share

    return {
        uid: {
            "incoming": round(user_incoming.get(uid, 0)),
            "outgoing": round(user_outgoing.get(uid, 0)),
        }
        for uid in active_ids
    }


# =============================================================================
# ДЕТАЛИЗАЦИЯ ПО ПОЛЬЗОВАТЕЛЯМ (таблица внутри проекта)
# =============================================================================

def get_project_users(
    db: Session,
    project_id: str,
    sort_by: str = "last_message_at",
    sort_order: str = "desc",
    limit: int = 50,
    offset: int = 0,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    message_type: Optional[str] = None,
) -> Dict[str, Any]:
    """Список пользователей проекта с детализацией. Поддерживает фильтрацию по датам и типу сообщений."""
    from models_library.vk_profiles import VkProfile

    # Если указан период — получаем список активных за период user_id из hourly JSON
    active_ids: Optional[Set[int]] = None
    per_user_counts: Optional[Dict[int, Dict[str, int]]] = None
    if date_from or date_to:
        active_ids = _collect_active_user_ids(db, project_id, date_from, date_to, message_type)
        if not active_ids:
            return {"total_count": 0, "users": []}
        per_user_counts = _count_per_user_from_hourly(
            db, project_id, active_ids, date_from, date_to, message_type
        )
    elif message_type:
        # Без дат, но с типом сообщений — собираем за всё время
        active_ids = _collect_active_user_ids(db, project_id, None, None, message_type)
        if not active_ids:
            return {"total_count": 0, "users": []}

    # JOIN напрямую по vk_user_id — VkProfile.vk_user_id уникален
    query = db.query(
        MessageStatsUser,
        VkProfile.first_name,
        VkProfile.last_name,
        VkProfile.photo_url,
    ).outerjoin(
        VkProfile,
        VkProfile.vk_user_id == MessageStatsUser.vk_user_id
    ).filter(
        MessageStatsUser.project_id == project_id
    )

    # Фильтрация по активным пользователям за период
    if active_ids is not None:
        query = query.filter(MessageStatsUser.vk_user_id.in_(active_ids))

    sort_field = getattr(MessageStatsUser, sort_by, MessageStatsUser.last_message_at)
    if sort_order == "asc":
        query = query.order_by(sort_field.asc())
    else:
        query = query.order_by(sort_field.desc())

    # total_count тоже с учётом фильтра
    count_q = db.query(func.count(MessageStatsUser.id)).filter(
        MessageStatsUser.project_id == project_id
    )
    if active_ids is not None:
        count_q = count_q.filter(MessageStatsUser.vk_user_id.in_(active_ids))
    total_count = count_q.scalar() or 0

    rows = query.offset(offset).limit(limit).all()

    users = []
    for r in rows:
        uid = r.MessageStatsUser.vk_user_id
        # Если фильтрация по дате — используем рассчитанные per-period counts,
        # иначе all-time из MessageStatsUser
        if per_user_counts is not None and uid in per_user_counts:
            inc = per_user_counts[uid]["incoming"]
            out = per_user_counts[uid]["outgoing"]
        else:
            inc = r.MessageStatsUser.incoming_count or 0
            out = r.MessageStatsUser.outgoing_count or 0
        users.append({
            "vk_user_id": uid,
            "incoming_count": inc,
            "outgoing_count": out,
            "total_messages": inc + out,
            "first_message_at": r.MessageStatsUser.first_message_at,
            "last_message_at": r.MessageStatsUser.last_message_at,
            "first_name": r.first_name or None,
            "last_name": r.last_name or None,
            "photo_url": r.photo_url or None,
        })

    return {
        "total_count": total_count,
        "users": users,
    }
