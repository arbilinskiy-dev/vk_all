# Обработчик wall_repost — Репост записи из сообщества
#
# Событие приходит когда кто-то репостит запись сообщества.
# Пока — логируем и обновляем опубликованные.

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult
from ...debounce import should_debounce

logger = logging.getLogger("vk_callback.handlers.wall")


class WallRepostHandler(BaseEventHandler):
    """
    Обработчик события wall_repost.
    
    Репост записи из сообщества. Обновляем счётчики
    и помечаем проект как изменённый.
    """
    
    HANDLES_EVENTS = ["wall_repost"]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        if not project:
            return HandlerResult(success=False, message="Проект не найден")
        
        obj = event.object or {}
        post_id = obj.get("id")
        from_id = obj.get("from_id")
        
        self._log(f"Репост: post_id={post_id}, from_id={from_id}", event)
        
        # Обновляем проект как изменённый
        try:
            from services import update_tracker
            update_tracker.add_updated_project(project.id)
        except Exception as e:
            self._log(f"Ошибка update_tracker: {e}", event, "warning")
        
        return HandlerResult(
            success=True,
            message="Репост зарегистрирован",
            action_taken="logged_repost",
            data={"post_id": post_id, "from_id": from_id}
        )
