# Обработчик message_event — Callback-кнопки в сообщениях
#
# Пользователь нажал callback-кнопку в сообщении (VK Bot Keyboard).
# Пока только логирование — точка расширения для будущей логики.

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

logger = logging.getLogger("vk_callback.handlers.messages")


class MessageEventHandler(BaseEventHandler):
    """
    Callback-кнопки в сообщениях (VK Bot Keyboard).
    
    Точка расширения — пока только логирование.
    """
    
    HANDLES_EVENTS = ["message_event"]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        user_id = obj.get("user_id")
        peer_id = obj.get("peer_id")
        payload = obj.get("payload")
        
        self._log(
            f"message_event: user_id={user_id}, peer_id={peer_id}, payload={str(payload)[:100]}",
            event
        )
        
        return HandlerResult(
            success=True,
            message=f"Сообщение обработано (message_event)",
            action_taken="logged"
        )
