"""
Фильтр непрочитанных диалогов для модуля сообщений.
Используется в fetchers.py при filterUnread='unread' для типа 'mailing'.

Возвращает список vk_user_id, у которых есть непрочитанные входящие сообщения.
"""

import logging
from typing import List, Set
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, case, literal

from models_library.messages import CachedMessage
from models_library.message_read_status import MessageReadStatus

logger = logging.getLogger(__name__)


def get_unread_user_ids(db: Session, project_id: str) -> List[int]:
    """
    Возвращает список vk_user_id с непрочитанными входящими сообщениями.
    
    Алгоритм:
    1. Находим всех пользователей с входящими сообщениями в кэше
    2. Для каждого проверяем: есть ли входящие с vk_message_id > last_read_message_id
    3. Если нет read-статуса — все входящие считаются непрочитанными
    
    Оптимизация: используем LEFT JOIN + GROUP BY вместо N запросов.
    """
    # Подзапрос: для каждого vk_user_id получаем max(vk_message_id) входящих
    # и сравниваем с last_read_message_id из MessageReadStatus
    
    # LEFT JOIN: CachedMessage (входящие) ← MessageReadStatus
    # Группируем по vk_user_id, считаем кол-во входящих > last_read
    
    # Составляем status_id для JOIN
    # MessageReadStatus.id = "{project_id}_{vk_user_id}"
    
    results = db.query(
        CachedMessage.vk_user_id,
    ).outerjoin(
        MessageReadStatus,
        and_(
            MessageReadStatus.project_id == project_id,
            MessageReadStatus.vk_user_id == CachedMessage.vk_user_id,
        )
    ).filter(
        and_(
            CachedMessage.project_id == project_id,
            CachedMessage.is_outgoing == False,
        )
    ).group_by(
        CachedMessage.vk_user_id,
    ).having(
        # Считаем: кол-во входящих с id > coalesce(last_read_message_id, 0) > 0
        func.sum(
            case(
                (CachedMessage.vk_message_id > func.coalesce(MessageReadStatus.last_read_message_id, literal(0)), 1),
                else_=0,
            )
        ) > 0
    ).all()
    
    unread_ids = [row[0] for row in results]
    logger.debug(f"[unread_filter] Проект {project_id}: найдено {len(unread_ids)} пользователей с непрочитанными")
    
    return unread_ids
