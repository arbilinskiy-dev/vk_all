"""
Pydantic-схемы для модуля сообщений.
"""

from pydantic import BaseModel
from typing import Optional


class LoadAllRequest(BaseModel):
    """Запрос на загрузку ВСЕХ сообщений диалога."""
    project_id: str
    user_id: int


class SendMessageRequest(BaseModel):
    """Запрос на отправку сообщения."""
    project_id: str
    user_id: int
    message: str
    sender_id: Optional[str] = None   # ID менеджера, отправившего сообщение
    sender_name: Optional[str] = None  # Имя менеджера (например, "admin")
    attachment: Optional[str] = None   # Строка вложений VK ("photo123_456,photo123_789")
    reply_to: Optional[int] = None     # ID сообщения VK, на которое отвечаем
    forward_messages: Optional[str] = None  # ID пересылаемых сообщений через запятую ("123,456,789")
    forward: Optional[str] = None  # JSON для пересылки между диалогами ({"peer_id":...,"conversation_message_ids":[...],"owner_id":...})
    keyboard: Optional[str] = None  # JSON VK inline keyboard


class MarkReadRequest(BaseModel):
    """Запрос на пометку диалога как прочитанного."""
    project_id: str
    user_id: int  # vk_user_id собеседника
    manager_id: Optional[str] = None  # ID менеджера (для аудита)


class MarkAllReadRequest(BaseModel):
    """Запрос на пометку ВСЕХ диалогов проекта как прочитанных."""
    project_id: str
    manager_id: Optional[str] = None  # ID менеджера (для аудита)


class MarkUnreadRequest(BaseModel):
    """Запрос на пометку диалога как непрочитанного."""
    project_id: str
    user_id: int  # vk_user_id собеседника
    manager_id: Optional[str] = None  # ID менеджера (для аудита)


class DialogFocusRequest(BaseModel):
    """Запрос на установку/снятие фокуса менеджера на диалоге."""
    project_id: str
    vk_user_id: int
    manager_id: str
    manager_name: str
    action: str  # "enter" | "leave"


class TypingStatusRequest(BaseModel):
    """Запрос на отправку статуса "набирает текст"."""
    project_id: str
    user_id: int


class ConversationsInitRequest(BaseModel):
    """Запрос единой инициализации модуля сообщений.
    Заменяет 4 отдельных запроса (2x getSubscribers + getUnreadCounts + getLastMessages)."""
    project_id: str
    page: int = 1
    sort_unread_first: bool = True
    filter_unread: str = 'all'  # 'all' | 'unread' | 'important' — фильтр


class ToggleImportantRequest(BaseModel):
    """Запрос на переключение пометки «Важное» для диалога."""
    project_id: str
    vk_user_id: int
    is_important: bool  # true = пометить, false = снять
