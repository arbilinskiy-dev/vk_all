"""
Сервис статусов прочитанности диалогов (mark-read, mark-unread, mark-all-read, unread-counts).
Включает публикацию SSE-событий.
"""

import logging
from typing import Optional, Dict, Any, List

from sqlalchemy.orm import Session
from sqlalchemy import distinct

from crud import message_read_crud

logger = logging.getLogger(__name__)


def _publish_sse_event(event_type: str, project_id: str, data: dict):
    """Публикует SSE-событие. Ошибки логирует, но не бросает."""
    try:
        from services.sse_manager import sse_manager, SSEEvent
        event = SSEEvent(
            event_type=event_type,
            project_id=project_id,
            data=data,
        )
        sse_manager.publish_via_redis(event)
    except Exception as e:
        logger.warning(f"SSE publish error ({event_type}): {e}")


def _publish_global_unread_count(db: Session, project_id: str, context: str):
    """Публикует глобальное SSE-событие с обновлённым счётчиком непрочитанных."""
    try:
        from crud.message_read_crud import get_unread_dialogs_count
        from services.sse_manager import sse_manager, SSEEvent
        unread_dialogs = get_unread_dialogs_count(db, project_id)
        event = SSEEvent(
            event_type="unread_count_changed",
            project_id=project_id,
            data={
                "project_id": project_id,
                "unread_dialogs_count": unread_dialogs,
            },
        )
        sse_manager.publish_global_via_redis(event)
        logger.info(f"GLOBAL SSE: {context} → project={project_id}, unread_dialogs={unread_dialogs}")
    except Exception as e:
        logger.warning(f"GLOBAL SSE publish error ({context}): {e}")


def _mark_as_read_in_vk(
    project_id: str,
    user_id: int,
    community_tokens: Optional[List[str]] = None,
    group_id_int: int = 0,
):
    """
    Сбрасывает статус непрочитанности диалога в VK через messages.markAsRead.
    Ошибки логируются, но не бросаются — это не критичная операция.
    """
    if not community_tokens or group_id_int <= 0:
        logger.debug(f"VK MARK-READ: пропущено — нет токенов (project={project_id}, user={user_id})")
        return

    try:
        from services.vk_api.token_manager import call_vk_api_for_group
        call_vk_api_for_group(
            method="messages.markAsRead",
            params={
                "peer_id": user_id,
                "mark_conversation_as_read": 1,
            },
            group_id=group_id_int,
            community_tokens=community_tokens,
            project_id=project_id,
        )
        logger.info(f"VK MARK-READ: диалог с user_id={user_id} помечен как прочитанный в VK (project={project_id})")
    except Exception as e:
        logger.warning(f"VK MARK-READ: ошибка при вызове messages.markAsRead (user={user_id}): {e}")


def mark_dialog_read(
    db: Session,
    project_id: str,
    user_id: int,
    manager_id: Optional[str] = None,
    community_tokens: Optional[List[str]] = None,
    group_id_int: int = 0,
) -> Dict[str, Any]:
    """Помечает диалог как прочитанный. Возвращает was_unread=True если диалог был непрочитанным."""
    max_msg_id = message_read_crud.get_max_incoming_message_id(
        db, project_id, user_id
    )

    if max_msg_id <= 0:
        return {"success": True, "unread_count": 0, "last_read_message_id": 0, "was_unread": False}

    # Проверяем, был ли диалог непрочитанным ДО mark-read
    prev_last_read = message_read_crud.get_last_read_message_id(db, project_id, user_id)
    was_unread = max_msg_id > prev_last_read  # есть новые входящие после последнего прочтения

    # Помечаем как прочитанное
    status = message_read_crud.mark_dialog_as_read(
        db, project_id, user_id, max_msg_id, manager_id
    )

    # Сбрасываем статус непрочитанности в VK (messages.markAsRead)
    _mark_as_read_in_vk(project_id, user_id, community_tokens, group_id_int)

    # SSE-событие "message_read" для остальных менеджеров
    _publish_sse_event("message_read", project_id, {
        "vk_user_id": user_id,
        "last_read_message_id": max_msg_id,
        "read_by": manager_id,
        "unread_count": 0,
    })

    # Глобальное SSE-событие
    _publish_global_unread_count(db, project_id, "mark-read")

    return {
        "success": True,
        "unread_count": 0,
        "last_read_message_id": max_msg_id,
        "was_unread": was_unread,
    }


def mark_all_dialogs_read(
    db: Session,
    project_id: str,
    manager_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Помечает ВСЕ диалоги проекта как прочитанные."""
    updated_count = message_read_crud.mark_all_dialogs_as_read(
        db, project_id, manager_id
    )

    # SSE-событие "all_read"
    _publish_sse_event("all_read", project_id, {
        "project_id": project_id,
        "updated_count": updated_count,
        "read_by": manager_id,
    })

    # Глобальное SSE-событие
    _publish_global_unread_count(db, project_id, "mark-all-read")

    return {
        "success": True,
        "updated_count": updated_count,
    }


def mark_dialog_unread(
    db: Session,
    project_id: str,
    user_id: int,
    manager_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Помечает диалог как непрочитанный."""
    unread_count = message_read_crud.mark_dialog_as_unread(
        db, project_id, user_id, manager_id
    )

    # SSE-событие "unread_update"
    _publish_sse_event("unread_update", project_id, {
        "vk_user_id": user_id,
        "unread_count": unread_count,
        "marked_by": manager_id,
    })

    # Глобальное SSE-событие
    _publish_global_unread_count(db, project_id, "mark-unread")

    return {
        "success": True,
        "unread_count": unread_count,
    }


def get_unread_counts(
    db: Session,
    project_id: str,
    user_ids_str: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Возвращает количество непрочитанных входящих сообщений по диалогам.

    Если user_ids_str не указан — возвращает для всех диалогов, у которых есть кэш.
    Если user_ids_str указан — только для указанных пользователей.
    """
    if user_ids_str:
        vk_ids = [int(uid.strip()) for uid in user_ids_str.split(",") if uid.strip().isdigit()]
    else:
        # Все пользователи из кэша проекта
        from models_library.messages import CachedMessage
        rows = db.query(distinct(CachedMessage.vk_user_id)).filter(
            CachedMessage.project_id == project_id,
        ).all()
        vk_ids = [row[0] for row in rows]

    if not vk_ids:
        return {"success": True, "counts": {}}

    counts = message_read_crud.get_unread_counts_batch(db, project_id, vk_ids)

    return {
        "success": True,
        "counts": {str(uid): cnt for uid, cnt in counts.items()},
    }

def get_unread_dialog_counts_batch(
    db: Session,
    project_ids: List[str],
) -> Dict[str, Any]:
    """
    Пакетный подсчёт количества ДИАЛОГОВ с непрочитанными для нескольких проектов.
    Один SQL-запрос вместо N — используется для бейджей в сайдбаре.

    Возвращает: {success: True, counts: {project_id: dialog_count, ...}}
    """
    if not project_ids:
        return {"success": True, "counts": {}}

    counts = message_read_crud.get_unread_dialogs_count_batch(db, project_ids)

    return {
        "success": True,
        "counts": counts,
    }