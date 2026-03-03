# Middleware: Дедупликация по event_id
#
# VK может повторно отправить событие, если не получил 'ok' вовремя.
# Пропускаем дубликаты по event_id через Redis SET NX.

import logging
from ..models import CallbackEvent, MiddlewareResult
from ..debounce import is_duplicate_event
from .base import BaseMiddleware

logger = logging.getLogger("vk_callback.middleware.dedup")


class DeduplicatorMiddleware(BaseMiddleware):
    """
    Дедупликация событий по event_id.
    
    VK присылает event_id начиная с API v5.103.
    Если event_id уже обрабатывался — блокируем.
    Если event_id отсутствует — пропускаем (старая версия API).
    """
    
    def process(self, event: CallbackEvent) -> MiddlewareResult:
        # Confirmation не дедуплицируем
        if event.type == "confirmation":
            return MiddlewareResult(allow=True)
        
        # Если нет event_id — пропускаем
        if not event.event_id:
            return MiddlewareResult(allow=True)
        
        # Проверяем дубликат
        if is_duplicate_event(event.event_id):
            return MiddlewareResult(
                allow=False,
                reason=f"Дубликат event_id={event.event_id}"
            )
        
        return MiddlewareResult(allow=True)
