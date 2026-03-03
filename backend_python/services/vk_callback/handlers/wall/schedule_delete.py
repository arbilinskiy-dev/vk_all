# Обработчик wall_schedule_post_delete — Удалён отложенный пост
#
# Событие приходит когда:
# - Отложенный пост удалён
# - Отложенный пост отредактирован (VK шлёт delete, потом new)
# - Отложенный пост опубликован (удаляется из очереди)
#
# ВАЖНО: Игнорируется во время внутренних операций удаления (cooldown).

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult
from ...debounce import should_debounce, is_event_on_cooldown

logger = logging.getLogger("vk_callback.handlers.wall")


class WallSchedulePostDeleteHandler(BaseEventHandler):
    """
    Обработчик события wall_schedule_post_delete.
    
    Cooldown: Игнорирует события во время массового удаления.
    Debounce: Группирует быстрые события (edit = delete + new).
    """
    
    HANDLES_EVENTS = ["wall_schedule_post_delete", "postponed_delete"]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        if not project:
            return HandlerResult(success=False, message="Проект не найден")
        
        # COOLDOWN CHECK: Игнорируем если идёт внутренняя операция
        if is_event_on_cooldown(event.group_id, "wall_schedule_post_delete"):
            self._log(f"Пропущено — внутренняя операция удаления (cooldown)", event)
            return HandlerResult(
                success=True,
                message="Пропущено (cooldown)",
                action_taken="skipped_cooldown"
            )
        
        obj = event.object or {}
        post_id = obj.get("id")
        schedule_time = obj.get("schedule_time")
        
        self._log(f"Удалён отложенный: id={post_id}, schedule_time={schedule_time}", event)
        
        # Debounce: при редактировании VK шлет delete+new подряд
        if should_debounce(event.group_id, "refresh_scheduled"):
            self._log(f"Debounced — обновление уже запланировано", event)
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
