# Вспомогательные Pydantic-модели объектов VK Callback API.
# WallPostObject, SchedulePostObject, LikeObject, MemberObject,
# WallCommentObject, MarketOrderObject.

from typing import Optional
from pydantic import BaseModel


class WallPostObject(BaseModel):
    """Объект поста в событии wall_post_new."""
    id: int
    owner_id: int
    from_id: Optional[int] = None
    created_by: Optional[int] = None
    date: Optional[int] = None
    text: Optional[str] = None
    post_type: Optional[str] = None
    attachments: Optional[list] = None
    postponed_id: Optional[int] = None
    
    @property
    def is_suggest(self) -> bool:
        return self.post_type == "suggest"
    
    @property
    def was_scheduled(self) -> bool:
        return self.postponed_id is not None


class SchedulePostObject(BaseModel):
    """Объект отложенного поста."""
    id: int
    schedule_time: int


class LikeObject(BaseModel):
    """Объект события like_add / like_remove."""
    liker_id: int
    object_type: str
    object_owner_id: int
    object_id: int
    thread_reply_id: Optional[int] = None
    post_id: Optional[int] = None


class MemberObject(BaseModel):
    """Объект события group_join / group_leave."""
    user_id: int
    join_type: Optional[str] = None
    self_field: Optional[int] = None


class WallCommentObject(BaseModel):
    """Объект комментария на стене."""
    id: int
    from_id: int
    date: Optional[int] = None
    text: Optional[str] = None
    post_id: Optional[int] = None
    post_owner_id: Optional[int] = None


class MarketOrderObject(BaseModel):
    """Объект заказа товара."""
    id: int
    group_id: int
    user_id: int
    status: Optional[int] = None
    date: Optional[int] = None
