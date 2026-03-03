"""
Pydantic-схемы для VK Callback API.
Используются в routers/vk_callback.py.
"""
from pydantic import BaseModel
from typing import Optional, List


class CallbackSetupRequest(BaseModel):
    """Запрос на автоматическую настройку Callback API."""
    project_id: str
    is_local: bool = False
    use_tunnel: bool = False  # SSH reverse tunnel через VM (без ngrok)
    events: Optional[List[str]] = None  # Список событий для подписки (None = все)


class CallbackSetupResponse(BaseModel):
    """Ответ с результатом автонастройки."""
    success: bool
    confirmation_code: str = ""
    server_name: str = ""
    server_id: int = 0
    callback_url: str = ""
    action: str = ""
    message: str = ""
    ngrok_url: Optional[str] = None
    error_code: Optional[int] = None
    vk_group_short_name: Optional[str] = None
    events_count: Optional[int] = None
