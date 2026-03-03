"""
Pydantic-схемы для списков промокодов.
"""

from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


# ===== Промокод =====

class PromoCodeBase(BaseModel):
    """Базовая схема промокода."""
    code: str
    description: Optional[str] = None


class PromoCodeCreate(PromoCodeBase):
    """Создание одного промокода."""
    pass


class PromoCodeBulkAdd(BaseModel):
    """Массовое добавление промокодов в список."""
    codes: List[PromoCodeCreate]


class PromoCode(PromoCodeBase):
    """Полная схема промокода (ответ API)."""
    id: str
    promo_list_id: str
    status: str  # "free" | "issued"
    issued_to_user_id: Optional[int] = None
    issued_to_user_name: Optional[str] = None
    issued_at: Optional[datetime] = None
    issued_in_project_id: Optional[str] = None
    issued_message_id: Optional[str] = None
    sort_order: int = 0
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ===== Список промокодов =====

class PromoListBase(BaseModel):
    """Базовая схема списка промокодов."""
    name: str
    slug: str
    is_one_time: bool = True


class PromoListCreate(PromoListBase):
    """Создание списка промокодов."""
    pass


class PromoListUpdate(BaseModel):
    """Обновление списка (все поля опциональны)."""
    name: Optional[str] = None
    slug: Optional[str] = None
    is_one_time: Optional[bool] = None


class PromoList(PromoListBase):
    """Полная схема списка промокодов (ответ API)."""
    id: str
    project_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Агрегированные данные
    total_count: int = 0
    free_count: int = 0
    issued_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class PromoCodesListResponse(BaseModel):
    """Ответ со списком промокодов + метаинформация."""
    codes: List[PromoCode]
    total: int
    free_count: int
    issued_count: int


class PromoVariableInfo(BaseModel):
    """Информация о переменной промокода для шаблонов."""
    list_name: str
    slug: str
    code_variable: str       # {promo_<slug>_code}
    description_variable: str  # {promo_<slug>_description}
    free_count: int
