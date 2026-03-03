# Обработчик опросов (poll_vote_new)

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

logger = logging.getLogger("vk_callback.handlers.polls")


class PollsHandler(BaseEventHandler):
    """
    Обработчик голосований в опросах.
    
    Сейчас: логирование.
    Расширение: статистика опросов, триггеры по результатам.
    """
    
    HANDLES_EVENTS = ["poll_vote_new"]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        poll_id = obj.get("poll_id")
        option_id = obj.get("option_id")
        user_id = obj.get("user_id")
        
        self._log(f"Голос: poll={poll_id}, option={option_id}, user={user_id}", event)
        
        return HandlerResult(
            success=True,
            message="Голос в опросе",
            action_taken="logged",
            data={"poll_id": poll_id, "option_id": option_id, "user_id": user_id}
        )
