# Обработчик событий участников (group_join, group_leave, user_block/unblock)
#
# Возможные действия:
# - Статистика подписчиков (прирост/отток)
# - Приветственные сообщения
# - Защита от массового спама (детекция ботов)
# - Логирование блокировок

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

logger = logging.getLogger("vk_callback.handlers.members")


class MembersHandler(BaseEventHandler):
    """
    Обработчик событий участников сообщества.
    
    Сейчас: логирование.
    Расширение: статистика, приветствия, антиспам.
    """
    
    HANDLES_EVENTS = [
        "group_join",
        "group_leave",
        "user_block",
        "user_unblock",
    ]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        user_id = obj.get("user_id")
        
        if event.type == "group_join":
            join_type = obj.get("join_type", "unknown")
            self._log(f"Новый участник: user={user_id}, join_type={join_type}", event)
        elif event.type == "group_leave":
            self_leave = obj.get("self", 0)
            action = "вышел сам" if self_leave else "был удалён"
            self._log(f"Участник {action}: user={user_id}", event)
        elif event.type == "user_block":
            admin_id = obj.get("admin_id")
            reason = obj.get("reason", 0)
            self._log(f"Заблокирован: user={user_id}, admin={admin_id}, reason={reason}", event)
        elif event.type == "user_unblock":
            admin_id = obj.get("admin_id")
            self._log(f"Разблокирован: user={user_id}, admin={admin_id}", event)
        
        # TODO: Реализовать:
        # - Ведение статистики подписчиков
        # - Приветственные сообщения новым участникам
        # - Детекция ботов (массовые join/leave)
        
        return HandlerResult(
            success=True,
            message=f"Событие участников ({event.type})",
            action_taken="logged",
            data={"user_id": user_id}
        )
