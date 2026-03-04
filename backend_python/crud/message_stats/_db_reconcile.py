"""
DB-обновление статистики через MAX()-подход.

Идемпотентные функции:
- reconcile_hourly: обновляет message_stats_hourly (MAX + union множеств)
- reconcile_user: обновляет message_stats_user (MAX для счётчиков + min/max для дат)

Все функции принимают DB-сессию и работают с ORM-объектами.
Коммит — ответственность вызывающего (батч-коммит в _project_worker).
"""

import json
import time
import logging
from typing import Dict, Any, Optional

from sqlalchemy.orm import Session

from models_library.message_stats import MessageStatsHourly, MessageStatsUser

logger = logging.getLogger("crud.message_stats.reconcile")


def reconcile_hourly(
    db: Session,
    project_id: str,
    hourly_agg: Dict[str, Dict[str, Any]],
    hourly_cache: Optional[Dict[str, MessageStatsHourly]] = None,
) -> int:
    """
    Обновляет message_stats_hourly через MAX()-подход.
    Если реальное значение > текущего — перезаписываем.
    Возвращает количество корректировок.
    
    hourly_cache: кэш ORM-объектов на уровне проекта.
    Решает проблему autoflush=False: без кэша db.query() не видит pending db.add(),
    что приводит к дубликатам и UNIQUE constraint failed при commit.
    """
    if hourly_cache is None:
        hourly_cache = {}
    corrections = 0

    for hour_slot, data in hourly_agg.items():
        row_id = f"{project_id}_{hour_slot}"
        real_in = data.get("incoming", 0)
        real_out = data.get("outgoing", 0)
        real_users: set = data.get("users", set())

        # Сначала проверяем кэш (pending объекты невидимы для db.query при autoflush=False)
        existing = hourly_cache.get(row_id)
        if existing is None:
            existing = db.query(MessageStatsHourly).filter(MessageStatsHourly.id == row_id).first()
            if existing:
                hourly_cache[row_id] = existing

        if existing:
            changed = _update_existing_hourly(existing, data, real_in, real_out, real_users)
            if changed:
                existing.updated_at = time.time()
                corrections += 1
        else:
            new_row = _create_new_hourly(project_id, hour_slot, row_id, data, real_in, real_out, real_users)
            db.add(new_row)
            hourly_cache[row_id] = new_row  # Кэшируем для следующих юзеров
            corrections += 1

    return corrections


def _update_existing_hourly(
    existing: MessageStatsHourly,
    data: Dict[str, Any],
    real_in: int,
    real_out: int,
    real_users: set,
) -> bool:
    """
    Обновляет существующую hourly-запись через MAX()-подход.
    Возвращает True если были изменения.
    """
    changed = False

    # MAX для входящих
    if real_in > (existing.incoming_count or 0):
        existing.incoming_count = real_in
        # Дозаписываем text_count как разницу (из истории нет info о payload)
        existing.incoming_text_count = max(
            existing.incoming_text_count or 0,
            real_in - (existing.incoming_payload_count or 0),
        )
        changed = True

    # MAX для исходящих
    if real_out > (existing.outgoing_count or 0):
        existing.outgoing_count = real_out
        changed = True

    # Обновляем уникальных пользователей (union множеств)
    if real_users:
        changed |= _merge_users_json(existing, real_users)
        changed |= _merge_incoming_users(existing, data)
        changed |= _merge_outgoing_users(existing, data)

    return changed


def _merge_users_json(existing: MessageStatsHourly, real_users: set) -> bool:
    """Мержит unique_users_json (union множеств). Возвращает True если были изменения."""
    try:
        existing_set = set(json.loads(existing.unique_users_json or "[]"))
    except (json.JSONDecodeError, TypeError):
        existing_set = set()
    merged = existing_set | real_users
    if len(merged) > len(existing_set):
        existing.unique_users_json = json.dumps(list(merged))
        existing.unique_users_count = len(merged)
        existing.unique_dialogs_count = len(merged)
        return True
    return False


def _merge_incoming_users(existing: MessageStatsHourly, data: Dict[str, Any]) -> bool:
    """Дозаписывает новых ВХОДЯЩИХ юзеров из VK API в text_users."""
    real_incoming_users: set = data.get("incoming_users", set())
    if not real_incoming_users:
        return False

    try:
        existing_text = set(json.loads(existing.unique_text_users_json or "[]"))
    except (json.JSONDecodeError, TypeError):
        existing_text = set()
    try:
        existing_payload = set(json.loads(existing.unique_payload_users_json or "[]"))
    except (json.JSONDecodeError, TypeError):
        existing_payload = set()

    # Входящие юзеры из VK API, которые ещё не в text и не в payload → считаем текстовыми
    new_text_users = real_incoming_users - existing_text - existing_payload
    if new_text_users:
        merged_text = existing_text | new_text_users
        existing.unique_text_users_json = json.dumps(list(merged_text))
        return True
    return False


def _merge_outgoing_users(existing: MessageStatsHourly, data: Dict[str, Any]) -> bool:
    """Дозаписывает outgoing юзеров."""
    real_outgoing_users: set = data.get("outgoing_users", set())
    if not real_outgoing_users:
        return False

    try:
        existing_out = set(json.loads(existing.outgoing_users_json or "[]"))
    except (json.JSONDecodeError, TypeError):
        existing_out = set()
    new_out = real_outgoing_users - existing_out
    if new_out:
        merged_out = existing_out | real_outgoing_users
        existing.outgoing_users_json = json.dumps(list(merged_out))
        return True
    return False


def _create_new_hourly(
    project_id: str,
    hour_slot: str,
    row_id: str,
    data: Dict[str, Any],
    real_in: int,
    real_out: int,
    real_users: set,
) -> MessageStatsHourly:
    """Создаёт новую hourly-запись (данных в статистике не было вообще)."""
    now = time.time()
    users_list = list(real_users) if real_users else []
    outgoing_users = data.get("outgoing_users", set())

    return MessageStatsHourly(
        id=row_id,
        project_id=project_id,
        hour_slot=hour_slot,
        incoming_count=real_in,
        outgoing_count=real_out,
        incoming_payload_count=0,
        incoming_text_count=real_in,  # Из истории нет info о payload → считаем живыми
        outgoing_system_count=0,
        outgoing_bot_count=real_out,  # Из истории нет info о sender → считаем ботом
        unique_users_count=len(users_list),
        unique_users_json=json.dumps(users_list),
        unique_text_users_json=json.dumps(list(real_users - outgoing_users) if real_in > 0 else []),
        unique_payload_users_json="[]",
        outgoing_users_json=json.dumps(list(outgoing_users)) if real_out > 0 else "[]",
        unique_dialogs_count=len(users_list),
        created_at=now,
        updated_at=now,
    )


def reconcile_user(
    db: Session,
    project_id: str,
    vk_user_id: int,
    user_totals: Dict[str, Any],
) -> int:
    """
    Обновляет message_stats_user через MAX()-подход.
    Возвращает 1 если была корректировка, 0 если нет.
    
    Защита от пустых данных: если user_totals пустой или без ключей,
    безопасно извлекает значения с дефолтами.
    """
    row_id = f"{project_id}_{vk_user_id}"
    real_in = user_totals.get("incoming", 0)
    real_out = user_totals.get("outgoing", 0)
    first_at = user_totals.get("first_at", 0)
    last_at = user_totals.get("last_at", 0)

    existing = db.query(MessageStatsUser).filter(MessageStatsUser.id == row_id).first()

    if existing:
        changed = False
        if real_in > (existing.incoming_count or 0):
            existing.incoming_count = real_in
            changed = True
        if real_out > (existing.outgoing_count or 0):
            existing.outgoing_count = real_out
            changed = True
        if first_at and first_at > 0 and (not existing.first_message_at or first_at < existing.first_message_at):
            existing.first_message_at = first_at
            changed = True
        if last_at and last_at > (existing.last_message_at or 0):
            existing.last_message_at = last_at
            changed = True
        return 1 if changed else 0
    else:
        # Создаём — пользователя в статистике вообще не было
        db.add(MessageStatsUser(
            id=row_id,
            project_id=project_id,
            vk_user_id=vk_user_id,
            incoming_count=real_in,
            outgoing_count=real_out,
            first_message_at=first_at if first_at > 0 else None,
            last_message_at=last_at if last_at > 0 else None,
        ))
        return 1
