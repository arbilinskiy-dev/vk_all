from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List

class PhotoAttachment(BaseModel):
    id: str
    url: str

# Данные опроса для создания через VK API (polls.create)
class PollData(BaseModel):
    question: str                              # Текст вопроса
    answers: List[str]                         # Варианты ответов (от 1 до 10, каждый до 100 символов)
    is_anonymous: Optional[bool] = False       # Анонимное голосование
    is_multiple: Optional[bool] = False        # Множественный выбор
    end_date: Optional[int] = 0                # Дата завершения опроса (Unix timestamp), 0 = бессрочный
    disable_unvote: Optional[bool] = False     # Запретить отмену голоса

class Attachment(BaseModel):
    id: str
    type: str
    description: str
    # Расширенные поля для видео (опциональные, для обратной совместимости)
    thumbnail_url: Optional[str] = None   # URL превью-кадра видео
    player_url: Optional[str] = None      # URL встроенного плеера VK
    # Данные для создания опроса (используется при публикации — polls.create вызывается на лету)
    poll_data: Optional[PollData] = None

class Album(BaseModel):
    id: str # ownerId_albumId
    name: str = Field(validation_alias='title')
    size: int

    model_config = ConfigDict(from_attributes=True)

class Photo(BaseModel):
    id: str # ownerId_photoId
    url: str
    
    model_config = ConfigDict(from_attributes=True)