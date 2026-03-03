# Обработчик wall_schedule_post_new — Создан отложенный пост
#
# Событие приходит когда:
# - Создан новый отложенный пост
# - Отредактирован отложенный пост (после delete приходит new)
#
# Действие: Обновляем отложенные посты через VK API.

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult
from ...debounce import should_debounce

logger = logging.getLogger("vk_callback.handlers.wall")


class WallSchedulePostNewHandler(BaseEventHandler):
    """
    Обработчик события wall_schedule_post_new.
    
    При редактировании VK шлет delete+new подряд — debounce отсекает дубли.
    """
    
    HANDLES_EVENTS = ["wall_schedule_post_new", "postponed_new"]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        if not project:
            return HandlerResult(success=False, message="Проект не найден")
        
        obj = event.object or {}
        post_id = obj.get("id")
        schedule_time = obj.get("schedule_time")
        
        self._log(f"Новый отложенный пост: id={post_id}, schedule_time={schedule_time}", event)
        
        # Debounce: при редактировании VK шлет delete+new подряд
        if should_debounce(event.group_id, "refresh_scheduled"):
            self._log(f"Debounced — обновление отложенных уже запланировано", event)
            return HandlerResult(
                success=True,
                message="Debounced",
                action_taken="debounced"
            )
        
        try:
            from services.post_retrieval import refresh_scheduled_posts
            from services import update_tracker
            from config import settings
            
            self._log(f"Обновляем отложенные для проекта '{project.name}'", event)
            refresh_scheduled_posts(db, project.id, settings.vk_user_token)
            update_tracker.add_updated_project(project.id)
            
            self._log(f"Отложенные посты обновлены", event)
            return HandlerResult(
                success=True,
                message="Отложенные посты обновлены",
                action_taken="refresh_scheduled",
                data={"post_id": post_id, "schedule_time": schedule_time}
            )
            
        except Exception as e:
            self._log(f"ОШИБКА обновления отложенных: {e}", event, "error")
            return HandlerResult(
                success=False,
                message=f"Ошибка: {e}",
                should_retry=True
            )
