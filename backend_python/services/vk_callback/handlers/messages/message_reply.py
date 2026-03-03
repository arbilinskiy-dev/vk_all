# Обработчик message_reply — Исходящее сообщение от сообщества
#
# Событие приходит когда от имени сообщества отправлено сообщение:
# бот, рассылка, менеджер через нативный VK, и т.д.
#
# Действия:
# 1. Upsert сообщения в БД (CachedMessage)
# 2. +1 к статистике исходящих
#
# БЕЗ SSE push, БЕЗ пересчёта непрочитанных, БЕЗ global unread.
# message_reply не должен влиять на слой уведомлений менеджеров.

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult
from crud import messages_crud

from ._helpers import format_vk_item

logger = logging.getLogger("vk_callback.handlers.messages")


class MessageReplyHandler(BaseEventHandler):
    """
    Исходящее сообщение от сообщества.
    
    Фиксация факта отправки: upsert в БД + статистика.
    Не трогает слой уведомлений менеджеров.
    """
    
    HANDLES_EVENTS = ["message_reply"]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        # message_reply — объект сообщения без вложенности
        message = obj
        text = message.get("text", "")[:100]
        self._log(f"Ответ сообщества user={message.get('peer_id')}: '{text}'", event)
        
        self._save_outgoing(db, message, project)
        
        return HandlerResult(
            success=True,
            message=f"Сообщение обработано (message_reply)",
            action_taken="cached+stats"
        )
    
    def _save_outgoing(self, db: Session, message: dict, project) -> None:
        """Upsert исходящего сообщения в БД + запись в статистику."""
        try:
            project_id = str(project.id) if project else None
            if not project_id:
                return
            
            msg_id = message.get("id")
            peer_id = message.get("peer_id", 0)
            
            if not msg_id:
                return
            
            # peer_id — собеседник (пользователь VK)
            vk_user_id = peer_id
            
            # --- Upsert сообщения в БД ---
            vk_item = format_vk_item(message)
            messages_crud.save_vk_messages(db, project_id, vk_user_id, [vk_item])
            logger.info(f"CALLBACK SAVE (outgoing): msg_id={msg_id}, user={vk_user_id}, project={project_id}")
            
            # --- Статистика: +1 исходящее ---
            try:
                from crud.message_stats_crud import record_message
                record_message(
                    db, project_id, vk_user_id, is_incoming=False,
                    message_timestamp=message.get("date", 0),
                )
            except Exception as stats_err:
                logger.warning(f"STATS RECORD ERROR (не критично): {stats_err}")
            
        except Exception as e:
            logger.error(f"CALLBACK → SAVE OUTGOING ERROR: {e}")
