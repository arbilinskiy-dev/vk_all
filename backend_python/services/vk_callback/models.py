# VK Callback Event Models — ХАБ
#
# Типы данных и Pydantic модели для VK Callback событий.
# Логика разнесена по модулям:
#   event_types.py      — EventType enum
#   event_categories.py — EventCategory enum, EVENT_CATEGORY_MAP, get_event_category()
#   vk_objects.py       — WallPostObject, SchedulePostObject, LikeObject и др.
#
# Этот файл — реэкспорт для обратной совместимости (20+ файлов импортируют из .models).

from typing import Optional, Any, Dict
from pydantic import BaseModel
from datetime import datetime

# --- Вынесенные модули ---
from .event_types import EventType                                          # noqa: F401
from .event_categories import EventCategory, EVENT_CATEGORY_MAP, get_event_category  # noqa: F401
from .vk_objects import (                                                   # noqa: F401
    WallPostObject,
    SchedulePostObject,
    LikeObject,
    MemberObject,
    WallCommentObject,
    MarketOrderObject,
)


# =============================================================================
# PYDANTIC МОДЕЛИ (остаются здесь — ядро системы)
# =============================================================================

class CallbackEvent(BaseModel):
    """
    Модель входящего события VK Callback.
    
    Содержит все поля, которые VK присылает в JSON:
    - type: тип события
    - group_id: ID сообщества
    - event_id: уникальный ID события (с API v5.103+)
    - v: версия API
    - object: данные события (структура зависит от типа)
    - secret: секретный ключ (если настроен)
    """
    
    type: str
    group_id: int
    event_id: Optional[str] = None
    v: Optional[str] = None
    object: Optional[Dict[str, Any]] = None
    secret: Optional[str] = None
    
    # Внутренние поля (не от VK)
    received_at: Optional[datetime] = None
    retry_count: int = 0
    
    def __init__(self, **data):
        super().__init__(**data)
        if self.received_at is None:
            self.received_at = datetime.utcnow()
    
    @property
    def event_type(self) -> EventType:
        """Типизированный EventType."""
        return EventType.from_string(self.type)
    
    @property
    def category(self) -> EventCategory:
        """Категория события."""
        return get_event_category(self.type)
    
    @property
    def is_wall_event(self) -> bool:
        return self.type.startswith("wall_")
    
    @property
    def is_message_event(self) -> bool:
        return self.type.startswith("message_")
    
    @property
    def is_comment_event(self) -> bool:
        return "comment" in self.type or "reply" in self.type
    
    def to_queue_dict(self) -> dict:
        """Сериализация для Redis-очереди."""
        return {
            "type": self.type,
            "group_id": self.group_id,
            "event_id": self.event_id,
            "v": self.v,
            "object": self.object,
            "secret": self.secret,
            "received_at": self.received_at.isoformat() if self.received_at else None,
            "retry_count": self.retry_count,
        }
    
    @classmethod
    def from_queue_dict(cls, data: dict) -> "CallbackEvent":
        """Десериализация из Redis-очереди."""
        received_at = data.get("received_at")
        if received_at and isinstance(received_at, str):
            data["received_at"] = datetime.fromisoformat(received_at)
        return cls(**data)


class HandlerResult(BaseModel):
    """Результат обработки события хендлером."""
    
    success: bool
    message: Optional[str] = None
    action_taken: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    should_retry: bool = False
    
    @property
    def is_ignored(self) -> bool:
        """Событие было сознательно проигнорировано."""
        return self.action_taken in ("ignored", "skipped", "no_handler")


class MiddlewareResult(BaseModel):
    """Результат прохождения через middleware."""
    
    allow: bool = True
    reason: Optional[str] = None
    modified_event: Optional[CallbackEvent] = None
