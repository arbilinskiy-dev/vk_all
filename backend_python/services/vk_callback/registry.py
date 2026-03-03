# Реестр обработчиков событий VK Callback
#
# Автоматическая регистрация и поиск хендлеров по типу события.
# Каждый хендлер регистрирует себя через декоратор @register_handler
# или добавляется вручную через registry.register().

import logging
from typing import Dict, List, Optional, Type

from .models import CallbackEvent, HandlerResult, EventCategory, get_event_category

logger = logging.getLogger("vk_callback.registry")


class HandlerRegistry:
    """
    Реестр обработчиков событий.
    
    Хранит маппинг: event_type → handler instance.
    Поддерживает wildcard-обработчики для целых категорий.
    """
    
    def __init__(self):
        # Точный маппинг: event_type → handler
        self._handlers: Dict[str, object] = {}
        
        # Маппинг категорий: EventCategory → handler (fallback)
        self._category_handlers: Dict[EventCategory, object] = {}
        
        # Все зарегистрированные хендлеры
        self._all_handlers: List[object] = []
    
    def register(self, handler) -> None:
        """
        Зарегистрировать обработчик в реестре.
        
        Обработчик должен иметь атрибут HANDLES_EVENTS (list[str]).
        
        Args:
            handler: Экземпляр обработчика (наследник BaseEventHandler)
        """
        handler_name = handler.__class__.__name__
        events = getattr(handler, "HANDLES_EVENTS", [])
        
        if not events:
            logger.warning(f"REGISTRY: Хендлер {handler_name} не обрабатывает ни одного события")
            return
        
        for event_type in events:
            if event_type in self._handlers:
                existing = self._handlers[event_type].__class__.__name__
                logger.warning(
                    f"REGISTRY: Перезапись хендлера для '{event_type}': "
                    f"{existing} → {handler_name}"
                )
            self._handlers[event_type] = handler
        
        self._all_handlers.append(handler)
        logger.info(f"REGISTRY: Зарегистрирован {handler_name} → {events}")
    
    def register_category_handler(self, category: EventCategory, handler) -> None:
        """
        Зарегистрировать fallback-обработчик для целой категории.
        
        Вызывается если нет точного маппинга по event_type.
        """
        self._category_handlers[category] = handler
        logger.info(f"REGISTRY: Категорийный хендлер для {category.value}: {handler.__class__.__name__}")
    
    def get_handler(self, event_type: str) -> Optional[object]:
        """
        Найти обработчик для типа события.
        
        Сначала ищет точное совпадение по event_type,
        затем fallback на категорийный обработчик.
        
        Args:
            event_type: Тип события VK
            
        Returns:
            Экземпляр хендлера или None
        """
        # 1. Точное совпадение
        handler = self._handlers.get(event_type)
        if handler:
            return handler
        
        # 2. Fallback по категории
        category = get_event_category(event_type)
        handler = self._category_handlers.get(category)
        if handler:
            return handler
        
        return None
    
    def has_handler(self, event_type: str) -> bool:
        """Есть ли обработчик для данного типа события."""
        return self.get_handler(event_type) is not None
    
    def get_all_registered_events(self) -> List[str]:
        """Получить список всех зарегистрированных типов событий."""
        return list(self._handlers.keys())
    
    def get_all_handlers(self) -> List[object]:
        """Получить все зарегистрированные хендлеры."""
        return list(self._all_handlers)
    
    def get_stats(self) -> dict:
        """Статистика реестра."""
        return {
            "total_handlers": len(self._all_handlers),
            "registered_events": len(self._handlers),
            "category_handlers": len(self._category_handlers),
            "events": list(self._handlers.keys()),
        }


# Глобальный реестр
_registry = HandlerRegistry()


def get_registry() -> HandlerRegistry:
    """Получить глобальный реестр обработчиков."""
    return _registry


def register_handler(handler) -> None:
    """Зарегистрировать хендлер в глобальном реестре."""
    _registry.register(handler)
