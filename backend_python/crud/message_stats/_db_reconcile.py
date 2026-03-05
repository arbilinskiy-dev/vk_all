"""
DB-обновление статистики через MAX()-подход.

Нормализованная архитектура:
- Пользователи записываются в message_stats_hourly_users (INSERT ON CONFLICT DO NOTHING)
- Счётчики сообщений обновляются через MAX()
- Счётчики пользователей пересчитываются bulk-запросом ПОСЛЕ всех INSERT (в _project_worker)
- JSON-поля больше не используются

Идемпотентные функции:
- reconcile_hourly: MAX для счётчиков + INSERT юзеров в нормализованную таблицу
- reconcile_user: MAX для счётчиков + min/max для дат
"""

import time
import logging
from typing import Dict, Any, Optional, Set

from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert

from models_library.message_stats import MessageStatsHourly, MessageStatsUser, MessageStatsHourlyUsers

logger = logging.getLogger("crud.message_stats.reconcile")


def reconcile_hourly(
    db: Session,
    project_id: str,
    hourly_agg: Dict[str, Dict[str, Any]],
    hourly_cache: Optional[Dict[str, MessageStatsHourly]] = None,
) -> int:
    """
    Обновляет message_stats_hourly через MAX()-подход.
    INSERT юзеров в нормализованную таблицу (ON CONFLICT DO NOTHING).
    Счётчики юзеров НЕ обновляются здесь — это делается bulk-запросом
    в _project_worker после обработки всех юзеров проекта.
    
    Возвращает количество корректировок.
    """
    if hourly_cache is None:
        hourly_cache = {}
    corrections = 0

    for hour_slot, data in hourly_agg.items():
        row_id = f"{project_id}_{hour_slot}"
        real_in = data.get("incoming", 0)
        real_out = data.get("outgoing", 0)
        real_users: set = data.get("users", set())
        real_incoming_users: set = data.get("incoming_users", set())
        real_outgoing_users: set = data.get("outgoing_users", set())

        # Сначала проверяем кэш (pending объекты невидимы для db.query при autoflush=False)
        existing = hourly_cache.get(row_id)
        if existing is None:
            existing = db.query(MessageStatsHourly).filter(MessageStatsHourly.id == row_id).first()
            if existing:
                hourly_cache[row_id] = existing

        if existing:
            changed = False
            
            # MAX для входящих
            if real_in > (existing.incoming_count or 0):
                existing.incoming_count = real_in
                existing.incoming_text_count = max(
                    existing.incoming_text_count or 0,
                    real_in - (existing.incoming_payload_count or 0),
                )
                changed = True

            # MAX для исходящих
            if real_out > (existing.outgoing_count or 0):
                existing.outgoing_count = real_out
                changed = True

            # INSERT юзеров в нормализованную таблицу
            if real_users:
                users_inserted = _insert_hourly_users_batch(
                    db, project_id, hour_slot,
                    real_incoming_users, real_outgoing_users,
                )
                if users_inserted:
                    changed = True

            if changed:
                existing.updated_at = time.time()
                corrections += 1
        else:
            # Создаём новую hourly-запись
            new_row = _create_new_hourly(
                project_id, hour_slot, row_id, data,
                real_in, real_out, real_users,
            )
            db.add(new_row)
            hourly_cache[row_id] = new_row

            # INSERT юзеров в нормализованную таблицу
            _insert_hourly_users_batch(
                db, project_id, hour_slot,
                real_incoming_users, real_outgoing_users,
            )
            corrections += 1

    return corrections


def _insert_hourly_users_batch(
    db: Session,
    project_id: str,
    hour_slot: str,
    incoming_users: Set[int],
    outgoing_users: Set[int],
) -> bool:
    """
    Batch INSERT юзеров в нормализованную таблицу.
    Входящие юзеры из VK API reconcile не различают text/payload → пишем как type=1 (text).
    
    Возвращает True если были новые вставки.
    """
    values = []
    # Входящие юзеры → text (type=1). VK API не различает text/payload в истории
    for uid in incoming_users:
        values.append({
            "project_id": project_id, "hour_slot": hour_slot,
            "vk_user_id": uid, "user_type": 1,
        })
    # Исходящие юзеры → outgoing (type=3)
    for uid in outgoing_users:
        values.append({
            "project_id": project_id, "hour_slot": hour_slot,
            "vk_user_id": uid, "user_type": 3,
        })
    
    if not values:
        return False
    
    result = db.execute(
        pg_insert(MessageStatsHourlyUsers.__table__).values(values).on_conflict_do_nothing()
    )
    return result.rowcount > 0


def _create_new_hourly(
    project_id: str,
    hour_slot: str,
    row_id: str,
    data: Dict[str, Any],
    real_in: int,
    real_out: int,
    real_users: set,
) -> MessageStatsHourly:
    """
    Создаёт новую hourly-запись.
    Счётчики юзеров = 0 — будут пересчитаны bulk-запросом в _project_worker.
    """
    now = time.time()

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
        unique_users_count=len(real_users),
        unique_text_users_count=0,  # Будет пересчитан bulk
        unique_payload_users_count=0,
        outgoing_users_count=0,
        incoming_users_count=0,
        unique_dialogs_count=len(real_users),
        # JSON поля (deprecated — пустые)
        unique_users_json="[]",
        unique_text_users_json="[]",
        unique_payload_users_json="[]",
        outgoing_users_json="[]",
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
