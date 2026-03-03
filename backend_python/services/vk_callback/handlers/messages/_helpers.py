# Общие утилиты для обработчиков сообщений:
# публикация SSE-событий, форматирование VK-объектов.

import logging
from sqlalchemy.orm import Session

from crud.message_read_crud import get_unread_dialogs_count

logger = logging.getLogger("vk_callback.handlers.messages")


def _publish_sse_event(event_type: str, project_id: str, data: dict):
    """Публикует SSE-событие менеджерам (через Redis если есть, иначе локально)."""
    try:
        from services.sse_manager import sse_manager, SSEEvent
        event = SSEEvent(event_type=event_type, project_id=project_id, data=data)
        sse_manager.publish_via_redis(event)
    except Exception as e:
        logger.error(f"SSE PUBLISH ERROR: {e}")


def _publish_global_unread_count(db: Session, project_id: str):
    """
    Публикует глобальное SSE-событие unread_count_changed для обновления
    счётчиков непрочитанных диалогов в сайдбаре ВСЕХ менеджеров.
    Вызывается при message_new, mark-read, message_read (callback VK).
    """
    try:
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
        logger.info(
            f"GLOBAL SSE: unread_count_changed → project={project_id}, "
            f"unread_dialogs={unread_dialogs}"
        )
    except Exception as e:
        logger.error(f"GLOBAL SSE PUBLISH ERROR: {e}")


def format_vk_item(message: dict) -> dict:
    """Форматирует сообщение из Callback API в формат VK API для save_vk_messages."""
    vk_item = {
        "id": message.get("id"),
        "from_id": message.get("from_id", 0),
        "peer_id": message.get("peer_id", 0),
        "text": message.get("text", ""),
        "date": message.get("date", 0),
        "out": message.get("out", 0),
        "attachments": message.get("attachments"),
        "keyboard": message.get("keyboard"),
        "payload": message.get("payload"),
    }
    if "read_state" in message:
        vk_item["read_state"] = message["read_state"]
    return vk_item
