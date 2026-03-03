# Обработчик обсуждений (board_post_*)

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

logger = logging.getLogger("vk_callback.handlers.board")


class BoardHandler(BaseEventHandler):
    """
    Обработчик событий обсуждений.
    
    Сейчас: логирование.
    Расширение: модерация, уведомления.
    """
    
    HANDLES_EVENTS = [
        "board_post_new",
        "board_post_edit",
        "board_post_restore",
        "board_post_delete",
    ]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        topic_id = obj.get("topic_id")
        comment_id = obj.get("id")
        
        self._log(f"{event.type}: topic={topic_id}, comment={comment_id}", event)
        
        return HandlerResult(
            success=True,
            message=f"Событие обсуждений ({event.type})",
            action_taken="logged"
        )
