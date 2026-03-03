# Обработчик message_read — Прочтение сообщений
#
# Два сценария:
# 1. from_id > 0 → Пользователь VK прочитал наши исходящие сообщения
#    → SSE user_read (фронтенд обновит галочки "прочитано")
#
# 2. from_id < 0 → Менеджер прочитал через нативный VK (не через планнер)
#    → mark_dialog_as_read + SSE message_read + global unread

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

from ._helpers import _publish_sse_event, _publish_global_unread_count

logger = logging.getLogger("vk_callback.handlers.messages")


class MessageReadHandler(BaseEventHandler):
    """
    Прочтение сообщений.
    
    Обрабатывает два кейса: пользователь прочитал наши сообщения
    и менеджер прочитал через нативный VK.
    """
    
    HANDLES_EVENTS = ["message_read"]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        from_id = obj.get("from_id", 0)
        peer_id = obj.get("peer_id", 0)
        read_message_id = obj.get("read_message_id", 0)
        
        self._log(
            f"message_read: from_id={from_id}, peer_id={peer_id}, "
            f"read_message_id={read_message_id}", event
        )
        
        project_id = str(project.id) if project else None
        
        # from_id > 0 → пользователь прочитал наши исходящие сообщения
        if from_id > 0 and read_message_id > 0 and project_id:
            self._handle_user_read(project_id, from_id, read_message_id)
        
        # from_id < 0 → менеджер через нативный VK прочитал входящие
        elif from_id < 0 and peer_id > 0 and read_message_id > 0 and project_id:
            self._handle_community_read(db, project_id, peer_id, read_message_id)
        
        return HandlerResult(
            success=True,
            message=f"Сообщение обработано (message_read)",
            action_taken="sse_push"
        )
    
    def _handle_user_read(self, project_id: str, from_id: int, read_message_id: int) -> None:
        """Пользователь VK прочитал наши сообщения → SSE для обновления галочек."""
        _publish_sse_event("user_read", project_id, {
            "vk_user_id": from_id,
            "read_message_id": read_message_id,
        })
        logger.info(
            f"CALLBACK → SSE user_read: user={from_id}, "
            f"read_up_to={read_message_id}, project={project_id}"
        )
    
    def _handle_community_read(self, db: Session, project_id: str, peer_id: int, read_message_id: int) -> None:
        """Менеджер прочитал через нативный VK → mark_read + SSE + global unread."""
        from crud.message_read_crud import mark_dialog_as_read
        try:
            mark_dialog_as_read(
                db, project_id, peer_id, read_message_id,
                manager_id="vk_native"  # Прочитано через нативный VK-интерфейс
            )
            # SSE для менеджеров в планнере — обновить UI диалога
            _publish_sse_event("message_read", project_id, {
                "vk_user_id": peer_id,
                "last_read_message_id": read_message_id,
                "read_by": "vk_native",
                "unread_count": 0,
            })
            # Глобальный SSE — обновить счётчик непрочитанных в сайдбаре
            _publish_global_unread_count(db, project_id)
            logger.info(
                f"CALLBACK → message_read (VK native): community read user={peer_id}, "
                f"up_to_msg={read_message_id}, project={project_id}"
            )
        except Exception as e:
            logger.error(
                f"CALLBACK → message_read error: peer_id={peer_id}, "
                f"read_message_id={read_message_id}, error={e}"
            )
