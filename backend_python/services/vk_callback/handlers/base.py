# Базовые классы и утилиты для обработчиков событий VK Callback
#
# Все хендлеры наследуются от BaseEventHandler и реализуют метод handle().

from abc import ABC, abstractmethod
from sqlalchemy.orm import Session
from typing import Optional
import logging

from ..models import CallbackEvent, HandlerResult

logger = logging.getLogger("vk_callback.handlers")


class BaseEventHandler(ABC):
    """
    Базовый класс для обработчиков событий VK Callback.
    
    Каждый обработчик:
    - Определяет HANDLES_EVENTS — список типов событий
    - Реализует handle() — бизнес-логику обработки
    - Может использовать _get_project() для получения проекта из БД
    """
    
    # Список типов событий, которые обрабатывает этот handler
    HANDLES_EVENTS: list[str] = []
    
    @classmethod
    def can_handle(cls, event_type: str) -> bool:
        """Проверить, может ли этот handler обработать событие."""
        return event_type in cls.HANDLES_EVENTS
    
    @abstractmethod
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        """
        Обработать событие.
        
        Args:
            db: Сессия базы данных
            event: Событие для обработки
            project: Проект (модель из БД), к которому относится событие.
                     Может быть None для некоторых типов событий.
            
        Returns:
            HandlerResult с результатом обработки
        """
        pass
    
    def _log(self, message: str, event: CallbackEvent, level: str = "info"):
        """Логирование с контекстом события."""
        handler_name = self.__class__.__name__
        log_message = f"[{handler_name}] group={event.group_id}: {message}"
        getattr(logger, level, logger.info)(log_message)
    
    def _get_project(self, db: Session, group_id: int):
        """Получить проект по group_id."""
        try:
            import crud
            return crud.get_project_by_vk_id(db, group_id)
        except Exception as e:
            self._log(f"Ошибка получения проекта: {e}", 
                      CallbackEvent(type="unknown", group_id=group_id), "error")
            return None
