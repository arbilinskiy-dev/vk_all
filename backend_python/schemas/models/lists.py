
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Any, List, Optional
from datetime import datetime
import json


def _coerce_id_to_str(v):
    """Конвертация id в строку (новые модели используют BigInteger PK)."""
    if v is None:
        return v
    return str(v)


class ListMemberBase(BaseModel):
    vk_user_id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    sex: Optional[int] = None
    photo_url: Optional[str] = None
    deactivated: Optional[str] = None
    last_seen: Optional[int] = None
    platform: Optional[int] = None # NEW: ID платформы
    
    # Новые поля для профиля
    domain: Optional[str] = None
    bdate: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    has_mobile: Optional[bool] = None
    is_closed: Optional[bool] = False
    # ИСПРАВЛЕНО: Убрано значение по умолчанию True. Если в БД None, на фронт должен уйти None (falsy),
    # чтобы фильтр "Запрещено" (который включает None) визуально совпадал с иконкой (🚫).
    can_access_closed: Optional[bool] = None
    
    last_message_date: Optional[datetime] = None # Для рассылки
    
    model_config = ConfigDict(from_attributes=True)

class SystemListSubscriber(ListMemberBase):
    id: Any  # str (старые) или int (новые модели)
    project_id: str
    added_at: datetime
    source: str

    @field_validator('id', mode='before')
    @classmethod
    def coerce_id(cls, v):
        return _coerce_id_to_str(v)

class SystemListMailingItem(ListMemberBase):
    id: Any
    project_id: str
    conversation_status: Optional[str] = None
    # Добавляем поля даты сбора и источника
    added_at: Optional[datetime] = None
    source: Optional[str] = None
    
    # NEW: Поля анализа
    first_message_date: Optional[datetime] = None
    first_message_from_id: Optional[int] = None

    @field_validator('id', mode='before')
    @classmethod
    def coerce_id(cls, v):
        return _coerce_id_to_str(v)

class SystemListHistoryItem(ListMemberBase):
    id: Any
    project_id: str
    event_date: datetime
    event_type: Optional[str] = None
    source: str

    @field_validator('id', mode='before')
    @classmethod
    def coerce_id(cls, v):
        return _coerce_id_to_str(v)

class SystemListAuthor(ListMemberBase):
    id: Any
    project_id: str
    event_date: datetime
    source: str

    @field_validator('id', mode='before')
    @classmethod
    def coerce_id(cls, v):
        return _coerce_id_to_str(v)

class SystemListPost(BaseModel):
    id: Any
    project_id: str

    @field_validator('id', mode='before')
    @classmethod
    def coerce_id(cls, v):
        return _coerce_id_to_str(v)
    vk_post_id: int
    date: datetime
    text: Optional[str] = None
    image_url: Optional[str] = None
    vk_link: str
    
    likes_count: int
    comments_count: int
    reposts_count: int
    views_count: int
    
    can_post_comment: bool
    can_like: bool
    user_likes: bool
    
    signer_id: Optional[int] = None
    # NEW: ID автора из post_author_data
    post_author_id: Optional[int] = None
    
    last_updated: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class SystemListInteraction(ListMemberBase):
    id: Any
    project_id: str

    @field_validator('id', mode='before')
    @classmethod
    def coerce_id(cls, v):
        return _coerce_id_to_str(v)
    last_interaction_date: datetime
    last_post_id: Optional[str] = None
    interaction_count: int
    post_ids: List[int] = []
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_validator('post_ids', mode='before')
    @classmethod
    def parse_json_string(cls, v):
        if isinstance(v, str):
            if not v:
                return []
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return []
        return v

class ProjectListMeta(BaseModel):
    project_id: str
    subscribers_last_updated: Optional[str] = None
    history_join_last_updated: Optional[str] = None
    history_leave_last_updated: Optional[str] = None
    posts_last_updated: Optional[str] = None
    mailing_last_updated: Optional[str] = None
    
    # Дополнительные поля для UI
    subscribers_count: Optional[int] = 0
    history_join_count: Optional[int] = 0
    history_leave_count: Optional[int] = 0
    mailing_count: Optional[int] = 0
    
    posts_count: Optional[int] = 0 # Количество в VK
    stored_posts_count: Optional[int] = 0 # Количество, сохраненное в нашей БД
    
    likes_count: Optional[int] = 0
    likes_last_updated: Optional[str] = None # Новое
    
    comments_count: Optional[int] = 0
    comments_last_updated: Optional[str] = None # Новое
    
    reposts_count: Optional[int] = 0
    reposts_last_updated: Optional[str] = None # Новое

    # Автоматизации: Конкурс отзывов
    reviews_participants_count: Optional[int] = 0
    reviews_winners_count: Optional[int] = 0
    reviews_posts_count: Optional[int] = 0

    # NEW: Авторы постов
    authors_count: Optional[int] = 0
    authors_last_updated: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
