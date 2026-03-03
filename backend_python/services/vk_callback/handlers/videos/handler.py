# Обработчик событий видеозаписей (video_*)
#
# События: video_new, video_comment_new/edit/restore/delete

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

logger = logging.getLogger("vk_callback.handlers.videos")


class VideosHandler(BaseEventHandler):
    """
    Обработчик событий видеозаписей.
    
    Сейчас: логирование.
    Расширение: модерация комментариев, уведомления.
    """
    
    HANDLES_EVENTS = [
        "video_new",
        "video_comment_new",
        "video_comment_edit",
        "video_comment_restore",
        "video_comment_delete",
    ]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        
        if event.type == "video_new":
            video_id = obj.get("id")
            self._log(f"Новое видео: id={video_id}", event)
        else:
            video_id = obj.get("video_id")
            comment_id = obj.get("id")
            self._log(f"{event.type}: video={video_id}, comment={comment_id}", event)
        
        return HandlerResult(
            success=True,
            message=f"Событие видео ({event.type})",
            action_taken="logged"
        )
