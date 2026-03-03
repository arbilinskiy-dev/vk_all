# Обработчик комментариев на стене (wall_reply_*)
#
# События: wall_reply_new, wall_reply_edit, wall_reply_restore, wall_reply_delete
#
# Возможные действия:
# - Уведомление о новом комментарии
# - Автомодерация (фильтр по стоп-словам)
# - Статистика по комментариям
# - Триггер автоматических ответов

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

logger = logging.getLogger("vk_callback.handlers.wall_comments")


class WallCommentsHandler(BaseEventHandler):
    """
    Обработчик комментариев на стене.
    
    Сейчас: логирование.
    Расширение: автомодерация, уведомления, статистика.
    """
    
    HANDLES_EVENTS = [
        "wall_reply_new",
        "wall_reply_edit",
        "wall_reply_restore",
        "wall_reply_delete",
    ]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        comment_id = obj.get("id")
        from_id = obj.get("from_id")
        post_id = obj.get("post_id")
        text = obj.get("text", "")[:100]  # Первые 100 символов
        
        self._log(
            f"{event.type}: comment={comment_id}, from={from_id}, "
            f"post={post_id}, text='{text}'",
            event
        )
        
        # TODO: Реализовать логику обработки комментариев
        # - Фильтрация по стоп-словам
        # - Уведомление администратора
        # - Статистика
        
        return HandlerResult(
            success=True,
            message=f"Комментарий зарегистрирован ({event.type})",
            action_taken="logged",
            data={
                "comment_id": comment_id,
                "from_id": from_id,
                "post_id": post_id
            }
        )
