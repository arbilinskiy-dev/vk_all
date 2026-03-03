"""
ЗАПИСЬ: Атомарные upsert при каждом callback (message_new / message_reply).
Горячий путь — вызывается при каждом входящем/исходящем сообщении.
"""

import json
import time
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from models_library.message_stats import MessageStatsHourly, MessageStatsUser, MessageStatsAdmin

logger = logging.getLogger("crud.message_stats")


def record_message(
    db: Session,
    project_id: str,
    vk_user_id: int,
    is_incoming: bool,
    message_timestamp: int = 0,
    has_payload: bool = False,
    sender_id: str = None,
    sender_name: str = None,
) -> None:
    """
    Записывает одно сообщение во все таблицы статистики.
    Вызывается из callback handler при message_new / message_reply
    и из send_service при отправке через систему.
    
    :param project_id: ID проекта
    :param vk_user_id: VK user_id собеседника
    :param is_incoming: True = входящее (от пользователя), False = исходящее (от сообщества)
    :param message_timestamp: Unix timestamp сообщения (0 = текущее время)
    :param has_payload: True = входящее сообщение с payload (нажатие кнопки)
    :param sender_id: ID менеджера, отправившего через нашу систему (None = бот/рассылка)
    :param sender_name: Имя менеджера (для кэша)
    """
    try:
        now = message_timestamp or time.time()
        
        # 1. UPSERT в message_stats_hourly
        _upsert_hourly(db, project_id, vk_user_id, is_incoming, now, has_payload, sender_id)
        
        # 2. UPSERT в message_stats_user
        _upsert_user(db, project_id, vk_user_id, is_incoming, now)
        
        # 3. UPSERT в message_stats_admin (только для исходящих через систему)
        if not is_incoming and sender_id:
            _upsert_admin(db, project_id, vk_user_id, sender_id, sender_name, now)
        
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"STATS RECORD ERROR: {e} (project={project_id}, user={vk_user_id})")


def _upsert_hourly(
    db: Session, project_id: str, vk_user_id: int,
    is_incoming: bool, timestamp: float,
    has_payload: bool = False, sender_id: str = None,
) -> None:
    """Атомарный upsert в таблицу часовых слотов."""
    # Формируем hour_slot из timestamp
    dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)
    hour_slot = dt.strftime("%Y-%m-%dT%H")
    row_id = f"{project_id}_{hour_slot}"
    
    existing = db.query(MessageStatsHourly).filter(MessageStatsHourly.id == row_id).first()
    
    if existing:
        # Обновляем общие счётчики
        if is_incoming:
            existing.incoming_count = (existing.incoming_count or 0) + 1
            # Детализация входящих: кнопки vs живые
            if has_payload:
                existing.incoming_payload_count = (existing.incoming_payload_count or 0) + 1
                # Обновляем unique_payload_users
                try:
                    payload_users_set = set(json.loads(existing.unique_payload_users_json or "[]"))
                except (json.JSONDecodeError, TypeError):
                    payload_users_set = set()
                payload_users_set.add(vk_user_id)
                existing.unique_payload_users_json = json.dumps(list(payload_users_set))
            else:
                existing.incoming_text_count = (existing.incoming_text_count or 0) + 1
                # Обновляем unique_text_users
                try:
                    text_users_set = set(json.loads(existing.unique_text_users_json or "[]"))
                except (json.JSONDecodeError, TypeError):
                    text_users_set = set()
                text_users_set.add(vk_user_id)
                existing.unique_text_users_json = json.dumps(list(text_users_set))
        else:
            existing.outgoing_count = (existing.outgoing_count or 0) + 1
            # Детализация исходящих: система vs бот
            if sender_id:
                existing.outgoing_system_count = (existing.outgoing_system_count or 0) + 1
            else:
                existing.outgoing_bot_count = (existing.outgoing_bot_count or 0) + 1
            # Обновляем outgoing_users (получатели исходящих)
            try:
                out_users_set = set(json.loads(existing.outgoing_users_json or "[]"))
            except (json.JSONDecodeError, TypeError):
                out_users_set = set()
            out_users_set.add(vk_user_id)
            existing.outgoing_users_json = json.dumps(list(out_users_set))
        
        # Обновляем unique_users
        try:
            users_set = set(json.loads(existing.unique_users_json or "[]"))
        except (json.JSONDecodeError, TypeError):
            users_set = set()
        
        users_set.add(vk_user_id)
        existing.unique_users_json = json.dumps(list(users_set))
        existing.unique_users_count = len(users_set)
        # unique_dialogs = unique_users в рамках одного проекта-часа
        existing.unique_dialogs_count = len(users_set)
        existing.updated_at = time.time()
    else:
        # Создаём новую строку
        now = time.time()
        is_text_incoming = is_incoming and not has_payload
        db.add(MessageStatsHourly(
            id=row_id,
            project_id=project_id,
            hour_slot=hour_slot,
            incoming_count=1 if is_incoming else 0,
            outgoing_count=0 if is_incoming else 1,
            incoming_payload_count=1 if (is_incoming and has_payload) else 0,
            incoming_text_count=1 if is_text_incoming else 0,
            outgoing_system_count=1 if (not is_incoming and sender_id) else 0,
            outgoing_bot_count=1 if (not is_incoming and not sender_id) else 0,
            unique_users_count=1,
            unique_users_json=json.dumps([vk_user_id]),
            unique_text_users_json=json.dumps([vk_user_id] if is_text_incoming else []),
            unique_payload_users_json=json.dumps([vk_user_id] if (is_incoming and has_payload) else []),
            outgoing_users_json=json.dumps([vk_user_id] if not is_incoming else []),
            unique_dialogs_count=1,
            created_at=now,
            updated_at=now,
        ))


def _upsert_user(db: Session, project_id: str, vk_user_id: int, is_incoming: bool, timestamp: float) -> None:
    """Атомарный upsert в таблицу пользовательской детализации."""
    row_id = f"{project_id}_{vk_user_id}"
    
    existing = db.query(MessageStatsUser).filter(MessageStatsUser.id == row_id).first()
    
    if existing:
        if is_incoming:
            existing.incoming_count = (existing.incoming_count or 0) + 1
        else:
            existing.outgoing_count = (existing.outgoing_count or 0) + 1
        existing.last_message_at = timestamp
    else:
        db.add(MessageStatsUser(
            id=row_id,
            project_id=project_id,
            vk_user_id=vk_user_id,
            incoming_count=1 if is_incoming else 0,
            outgoing_count=0 if is_incoming else 1,
            first_message_at=timestamp,
            last_message_at=timestamp,
        ))


def _upsert_admin(
    db: Session, project_id: str, vk_user_id: int,
    sender_id: str, sender_name: str, timestamp: float,
) -> None:
    """Атомарный upsert в таблицу статистики администраторов."""
    dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)
    date_str = dt.strftime("%Y-%m-%d")
    row_id = f"{sender_id}_{project_id}_{date_str}"
    
    existing = db.query(MessageStatsAdmin).filter(MessageStatsAdmin.id == row_id).first()
    
    if existing:
        existing.messages_sent = (existing.messages_sent or 0) + 1
        # Обновляем уникальные диалоги
        try:
            dialogs_set = set(json.loads(existing.unique_dialogs_json or "[]"))
        except (json.JSONDecodeError, TypeError):
            dialogs_set = set()
        dialogs_set.add(vk_user_id)
        existing.unique_dialogs_json = json.dumps(list(dialogs_set))
        existing.unique_dialogs = len(dialogs_set)
        # Обновляем имя на случай смены
        if sender_name:
            existing.sender_name = sender_name
        existing.updated_at = time.time()
    else:
        now = time.time()
        db.add(MessageStatsAdmin(
            id=row_id,
            sender_id=sender_id,
            sender_name=sender_name,
            project_id=project_id,
            date=date_str,
            messages_sent=1,
            unique_dialogs=1,
            unique_dialogs_json=json.dumps([vk_user_id]),
            created_at=now,
            updated_at=now,
        ))
