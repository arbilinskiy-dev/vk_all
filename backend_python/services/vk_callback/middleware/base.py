# Базовый класс middleware для VK Callback

from abc import ABC, abstractmethod
import logging
from ..models import CallbackEvent, MiddlewareResult

logger = logging.getLogger("vk_callback.middleware")


class BaseMiddleware(ABC):
    """
    Базовый класс для middleware VK Callback.
    
    Каждый middleware решает: пропустить событие дальше или заблокировать.
    Может также модифицировать событие (обогащение данными).
    """
    
    @abstractmethod
    def process(self, event: CallbackEvent) -> MiddlewareResult:
        """
        Обработать событие.
        
        Args:
            event: Входящее событие
            
        Returns:
            MiddlewareResult:
                allow=True — пропустить дальше
                allow=False — заблокировать (reason обязателен)
        """
        pass
    
    @property
    def name(self) -> str:
        """Имя middleware для логирования."""
        return self.__class__.__name__


def run_middleware_chain(event: CallbackEvent, middlewares: list) -> MiddlewareResult:
    """
    Прогнать событие через цепочку middleware.
    
    Останавливается на первом middleware, который заблокировал событие.
    
    Args:
        event: Входящее событие
        middlewares: Список middleware в порядке выполнения
        
    Returns:
        MiddlewareResult с итоговым решением
    """
    current_event = event
    
    for mw in middlewares:
        try:
            result = mw.process(current_event)
            
            if not result.allow:
                logger.info(
                    f"MIDDLEWARE: {mw.name} заблокировал '{event.type}' "
                    f"group={event.group_id}: {result.reason}"
                )
                return result
            
            # Если middleware модифицировал событие — используем новую версию
            if result.modified_event:
                current_event = result.modified_event
                
        except Exception as e:
            logger.error(f"MIDDLEWARE: Ошибка в {mw.name}: {e}")
            # При ошибке middleware — пропускаем его, не блокируем событие
            continue
    
    return MiddlewareResult(allow=True, modified_event=current_event)
