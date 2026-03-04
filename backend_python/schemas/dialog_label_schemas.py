"""
Pydantic-схемы для модуля меток диалогов.
"""

from pydantic import BaseModel
from typing import Optional, List


class DialogLabelCreate(BaseModel):
    """Создание метки диалога."""
    project_id: str
    name: str
    color: str = '#6366f1'  # indigo-500


class DialogLabelUpdate(BaseModel):
    """Обновление метки диалога."""
    name: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None


class DialogLabelAssignRequest(BaseModel):
    """Назначение/снятие метки с диалога."""
    project_id: str
    vk_user_id: int
    label_id: str


class DialogLabelBulkAssignRequest(BaseModel):
    """Массовое назначение меток диалогу (заменяет все текущие)."""
    project_id: str
    vk_user_id: int
    label_ids: List[str]
