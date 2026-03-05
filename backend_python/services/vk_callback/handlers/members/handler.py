# Обработчик событий блокировки/разблокировки участников (user_block, user_unblock)
#
# Примечание: события group_join и group_leave вынесены в отдельные файлы:
# - group_join.py → GroupJoinHandler
# - group_leave.py → GroupLeaveHandler

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

logger = logging.getLogger("vk_callback.handlers.members")


class MembersBlockHandler(BaseEventHandler):
    """
    Обработчик событий блокировки/разблокировки участников сообщества.
    
    Обрабатывает:
    - user_block — блокировка пользователя в сообществе
    - user_unblock — разблокировка пользователя в сообществе
    """
    
    HANDLES_EVENTS = [
        "user_block",
        "user_unblock",
    ]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        user_id = obj.get("user_id")
        
        if event.type == "user_block":
            admin_id = obj.get("admin_id")
            reason = obj.get("reason", 0)
            self._log(f"Заблокирован: user={user_id}, admin={admin_id}, reason={reason}", event)
        elif event.type == "user_unblock":
            admin_id = obj.get("admin_id")
            self._log(f"Разблокирован: user={user_id}, admin={admin_id}", event)
        
        return HandlerResult(
            success=True,
            message=f"Событие блокировки ({event.type})",
            action_taken="logged",
            data={"user_id": user_id}
        )
