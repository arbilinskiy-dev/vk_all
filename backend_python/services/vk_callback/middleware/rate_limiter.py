# Middleware: Rate Limiting по group_id
#
# Защита от чрезмерного количества событий от одной группы.
# Ограничение настраивается в CallbackConfig.

import logging
from ..models import CallbackEvent, MiddlewareResult
from ..debounce import check_rate_limit
from .base import BaseMiddleware

logger = logging.getLogger("vk_callback.middleware.ratelimit")


class RateLimiterMiddleware(BaseMiddleware):
    """
    Rate Limiter на уровне group_id.
    
    Если одна группа шлёт слишком много событий за окно времени —
    блокируем лишние. Защита от DoS и некорректных настроек VK.
    """
    
    def process(self, event: CallbackEvent) -> MiddlewareResult:
        # Confirmation не лимитируем
        if event.type == "confirmation":
            return MiddlewareResult(allow=True)
        
        # Проверяем лимит
        if not check_rate_limit(event.group_id):
            return MiddlewareResult(
                allow=False,
                reason=f"Rate limit превышен для group={event.group_id}"
            )
        
        return MiddlewareResult(allow=True)
