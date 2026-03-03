# Обработчик лайков (like_add, like_remove)
#
# Возможные действия:
# - Статистика вовлечённости
# - Триггеры автоматизаций (N лайков → действие)
# - Мониторинг активности

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

logger = logging.getLogger("vk_callback.handlers.likes")


class LikesHandler(BaseEventHandler):
    """
    Обработчик лайков.
    
    Сейчас: логирование.
    Расширение: статистика вовлечённости, триггеры.
    """
    
    HANDLES_EVENTS = [
        "like_add",
        "like_remove",
    ]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        liker_id = obj.get("liker_id")
        object_type = obj.get("object_type")
        object_id = obj.get("object_id")
        
        action = "поставил" if event.type == "like_add" else "снял"
        self._log(
            f"User {liker_id} {action} лайк: {object_type}={object_id}",
            event
        )
        
        # TODO: Реализовать:
        # - Обновление счётчиков в БД
        # - Триггер "пост набрал N лайков"
        # - Статистика вовлечённости
        
        return HandlerResult(
            success=True,
            message=f"Лайк ({event.type})",
            action_taken="logged",
            data={
                "liker_id": liker_id,
                "object_type": object_type,
                "object_id": object_id
            }
        )
