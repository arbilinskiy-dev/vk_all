"""
Pydantic схемы для Конкурс 2.0
"""

import json
from pydantic import BaseModel, field_validator
from typing import Optional, List, Any, Union
from datetime import datetime


# === Схема для изображения ===
class ImageAttachment(BaseModel):
    id: str
    url: str


# === Базовая схема ===
class ContestV2Base(BaseModel):
    is_active: Optional[bool] = True
    title: Optional[str] = "Новый конкурс"
    description: Optional[str] = None
    
    start_type: Optional[str] = "new_post"  # 'new_post' | 'existing_post'
    existing_post_link: Optional[str] = None
    
    start_post_date: Optional[str] = None  # YYYY-MM-DD
    start_post_time: Optional[str] = None  # HH:mm
    start_post_text: Optional[str] = None
    # Принимает массив объектов с фронтенда, но будет сериализован в JSON для БД
    start_post_images: Optional[Union[List[ImageAttachment], str]] = None
    
    @field_validator('start_post_images', mode='before')
    @classmethod
    def convert_images_to_json(cls, v):
        """Конвертирует массив объектов в JSON строку для хранения в БД"""
        if v is None:
            return None
        if isinstance(v, str):
            # Уже JSON строка - оставляем как есть
            return v
        if isinstance(v, list):
            # Массив объектов - сериализуем в JSON
            return json.dumps(v, ensure_ascii=False)
        return v


# === Схема создания ===
class ContestV2Create(ContestV2Base):
    project_id: str


# === Схема обновления ===
class ContestV2Update(ContestV2Base):
    pass


# === Схема ответа ===
class ContestV2Response(BaseModel):
    """Схема ответа - возвращает images как массив объектов"""
    id: str
    project_id: str
    is_active: Optional[bool] = True
    title: Optional[str] = "Новый конкурс"
    description: Optional[str] = None
    start_type: Optional[str] = "new_post"
    existing_post_link: Optional[str] = None
    start_post_date: Optional[str] = None
    start_post_time: Optional[str] = None
    start_post_text: Optional[str] = None
    start_post_images: Optional[List[ImageAttachment]] = None  # Возвращаем как массив объектов
    status: str = "draft"
    vk_start_post_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @field_validator('start_post_images', mode='before')
    @classmethod
    def convert_images_from_json(cls, v):
        """Конвертирует JSON строку из БД в массив объектов для фронтенда"""
        if v is None:
            return None
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return None
        if isinstance(v, list):
            return v
        return None
    
    class Config:
        from_attributes = True


# === Запросы API ===
class ContestV2ListRequest(BaseModel):
    project_id: str


class ContestV2GetRequest(BaseModel):
    contest_id: str


class ContestV2UpdateRequest(BaseModel):
    contest_id: str
    contest: ContestV2Update


class ContestV2DeleteRequest(BaseModel):
    contest_id: str
