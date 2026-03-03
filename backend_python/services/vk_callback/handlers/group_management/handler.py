# Обработчик управления сообществом (group_officers_edit, group_change_*)

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

logger = logging.getLogger("vk_callback.handlers.group_management")


class GroupManagementHandler(BaseEventHandler):
    """
    Обработчик событий управления сообществом.
    
    Сейчас: логирование.
    Расширение: аудит изменений, уведомления.
    """
    
    HANDLES_EVENTS = [
        "group_officers_edit",
        "group_change_settings",
        "group_change_photo",
    ]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        
        if event.type == "group_officers_edit":
            user_id = obj.get("user_id")
            level_old = obj.get("level_old")
            level_new = obj.get("level_new")
            self._log(
                f"Изменение полномочий: user={user_id}, {level_old}→{level_new}",
                event
            )
        elif event.type == "group_change_settings":
            user_id = obj.get("user_id")
            self._log(f"Изменение настроек: user={user_id}", event)
        elif event.type == "group_change_photo":
            user_id = obj.get("user_id")
            self._log(f"Изменение фото: user={user_id}", event)
        
        return HandlerResult(
            success=True,
            message=f"Событие управления ({event.type})",
            action_taken="logged"
        )
