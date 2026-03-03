# Обработчик message_edit — Редактирование сообщения
#
# Пользователь или сообщество отредактировало сообщение.
# Пока только логирование — точка расширения для будущей логики.

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

logger = logging.getLogger("vk_callback.handlers.messages")


class MessageEditHandler(BaseEventHandler):
    """
    Редактирование сообщения.
    
    Точка расширения — пока только логирование.
    """
    
    HANDLES_EVENTS = ["message_edit"]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        msg_id = obj.get("id")
        from_id = obj.get("from_id", 0)
        text = obj.get("text", "")[:100]
        
        self._log(f"message_edit: msg_id={msg_id}, from_id={from_id}, text='{text}'", event)
        
        return HandlerResult(
            success=True,
            message=f"Сообщение обработано (message_edit)",
            action_taken="logged"
        )
