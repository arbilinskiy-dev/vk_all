# Обработчик событий фотографий (photo_*)
#
# События: photo_new, photo_comment_new/edit/restore/delete
#
# Возможные действия:
# - Уведомление о новой фотографии
# - Модерация комментариев к фотографиям

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

logger = logging.getLogger("vk_callback.handlers.photos")


class PhotosHandler(BaseEventHandler):
    """
    Обработчик событий фотографий.
    
    Сейчас: логирование.
    Расширение: модерация, уведомления, статистика.
    """
    
    HANDLES_EVENTS = [
        "photo_new",
        "photo_comment_new",
        "photo_comment_edit",
        "photo_comment_restore",
        "photo_comment_delete",
    ]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        
        if event.type == "photo_new":
            photo_id = obj.get("id")
            self._log(f"Новая фотография: id={photo_id}", event)
        else:
            photo_id = obj.get("photo_id")
            comment_id = obj.get("id")
            self._log(f"{event.type}: photo={photo_id}, comment={comment_id}", event)
        
        return HandlerResult(
            success=True,
            message=f"Событие фотографии ({event.type})",
            action_taken="logged"
        )
