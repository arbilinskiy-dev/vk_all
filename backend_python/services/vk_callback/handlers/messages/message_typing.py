# Обработчик message_typing_state — Пользователь печатает сообщение
#
# Действия:
# - SSE push user_typing (фронтенд показывает индикатор "печатает...")
# - Только для реальных пользователей (from_id > 0), не боты

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

from ._helpers import _publish_sse_event

logger = logging.getLogger("vk_callback.handlers.messages")


class MessageTypingHandler(BaseEventHandler):
    """
    Пользователь печатает сообщение.
    
    Публикует SSE user_typing для отображения индикатора в интерфейсе.
    """
    
    HANDLES_EVENTS = ["message_typing_state"]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        state = obj.get("state", "")
        from_id = obj.get("from_id", 0)
        to_id = obj.get("to_id", 0)
        
        self._log(
            f"message_typing_state: from_id={from_id}, to_id={to_id}, state={state}", event
        )
        
        # from_id > 0 → реальный пользователь (не бот) печатает в сообщество
        if from_id > 0 and state == "typing":
            project_id = str(project.id) if project else None
            if project_id:
                _publish_sse_event("user_typing", project_id, {
                    "vk_user_id": from_id,
                })
        
        return HandlerResult(
            success=True,
            message=f"Сообщение обработано (message_typing_state)",
            action_taken="sse_push"
        )
