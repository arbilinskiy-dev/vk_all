"""
Запись событий подписки/отписки (message_allow / message_deny).
Вызывается из VK Callback handler при получении соответствующего события.
Append-only — только вставки.
"""

import time
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from models_library.message_stats import MessageSubscription

logger = logging.getLogger("crud.message_subscriptions.write")


def record_subscription(
    db: Session,
    project_id: str,
    vk_user_id: int,
    event_type: str,
    event_timestamp: float | None = None,
) -> MessageSubscription:
    """
    Записывает событие подписки/отписки в БД.
    
    :param db: SQLAlchemy Session
    :param project_id: ID проекта (сообщества)
    :param vk_user_id: VK user_id пользователя
    :param event_type: "allow" или "deny"
    :param event_timestamp: Unix timestamp события (если None — текущее время)
    :return: созданная запись
    """
    now = event_timestamp or time.time()
    dt = datetime.fromtimestamp(now, tz=timezone.utc)
    event_date = dt.strftime("%Y-%m-%d")
    hour_slot = dt.strftime("%Y-%m-%dT%H")
    
    row = MessageSubscription(
        project_id=project_id,
        vk_user_id=vk_user_id,
        event_type=event_type,
        event_at=now,
        event_date=event_date,
        hour_slot=hour_slot,
    )
    
    db.add(row)
    db.commit()
    db.refresh(row)
    
    logger.info(
        f"Подписка записана: проект={project_id}, юзер={vk_user_id}, "
        f"тип={event_type}, дата={event_date}"
    )
    
    return row
