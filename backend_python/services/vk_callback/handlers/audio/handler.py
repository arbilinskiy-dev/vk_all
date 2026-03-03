# Обработчик аудиозаписей (audio_new)

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

logger = logging.getLogger("vk_callback.handlers.audio")


class AudioHandler(BaseEventHandler):
    """
    Обработчик добавления аудиозаписей.
    
    Сейчас: логирование.
    """
    
    HANDLES_EVENTS = ["audio_new"]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        audio_id = obj.get("id")
        
        self._log(f"Новое аудио: id={audio_id}", event)
        
        return HandlerResult(
            success=True,
            message="Новое аудио",
            action_taken="logged"
        )
