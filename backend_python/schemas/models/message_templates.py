"""
Pydantic-схемы для шаблонов ответов сообщений.
"""

from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class MessageTemplateAttachment(BaseModel):
    """Вложение шаблона (хранится в attachments_json)."""
    type: str  # 'photo', 'video', 'document'
    vk_id: str  # VK attachment ID, например "photo-123456_789012"
    preview_url: Optional[str] = None
    name: Optional[str] = None


class MessageTemplateBase(BaseModel):
    """Базовая схема шаблона."""
    name: str
    text: str
    attachments: Optional[List[MessageTemplateAttachment]] = None
    sort_order: Optional[int] = 0


class MessageTemplateCreate(MessageTemplateBase):
    """Создание шаблона."""
    pass


class MessageTemplateUpdate(BaseModel):
    """Обновление шаблона (все поля опциональны)."""
    name: Optional[str] = None
    text: Optional[str] = None
    attachments: Optional[List[MessageTemplateAttachment]] = None
    sort_order: Optional[int] = None


class MessageTemplate(MessageTemplateBase):
    """Полная схема шаблона (ответ API)."""
    id: str
    project_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MessageTemplatePreviewRequest(BaseModel):
    """Запрос предпросмотра шаблона."""
    project_id: str
    text: str
    user_id: Optional[int] = None  # VK user_id для подстановки {username}


class MessageTemplatePreviewResponse(BaseModel):
    """Ответ предпросмотра: текст с подставленными переменными."""
    preview_text: str
    original_text: str
