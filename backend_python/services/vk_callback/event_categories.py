# Категории событий VK Callback — маппинг типов к хендлерам.

from enum import Enum
from typing import Dict


class EventCategory(str, Enum):
    """Категории событий — соответствуют папкам хендлеров."""
    CONFIRMATION = "confirmation"
    WALL = "wall"
    WALL_COMMENTS = "wall_comments"
    MESSAGES = "messages"
    PHOTOS = "photos"
    VIDEOS = "videos"
    AUDIO = "audio"
    LIKES = "likes"
    BOARD = "board"
    MARKET = "market"
    MEMBERS = "members"
    GROUP_MANAGEMENT = "group_management"
    POLLS = "polls"
    LEAD_FORMS = "lead_forms"
    DONUT = "donut"
    OTHER = "other"


# Маппинг: тип события → категория
EVENT_CATEGORY_MAP: Dict[str, EventCategory] = {
    # Подтверждение
    "confirmation": EventCategory.CONFIRMATION,
    
    # Стена
    "wall_post_new": EventCategory.WALL,
    "wall_repost": EventCategory.WALL,
    "wall_schedule_post_new": EventCategory.WALL,
    "wall_schedule_post_delete": EventCategory.WALL,
    "postponed_new": EventCategory.WALL,         # устаревший алиас
    "postponed_delete": EventCategory.WALL,      # устаревший алиас
    
    # Комментарии на стене
    "wall_reply_new": EventCategory.WALL_COMMENTS,
    "wall_reply_edit": EventCategory.WALL_COMMENTS,
    "wall_reply_restore": EventCategory.WALL_COMMENTS,
    "wall_reply_delete": EventCategory.WALL_COMMENTS,
    
    # Сообщения
    "message_new": EventCategory.MESSAGES,
    "message_reply": EventCategory.MESSAGES,
    "message_edit": EventCategory.MESSAGES,
    "message_allow": EventCategory.MESSAGES,
    "message_deny": EventCategory.MESSAGES,
    "message_typing_state": EventCategory.MESSAGES,
    "message_read": EventCategory.MESSAGES,
    "message_event": EventCategory.MESSAGES,
    "message_reaction_event": EventCategory.MESSAGES,
    
    # Фотографии
    "photo_new": EventCategory.PHOTOS,
    "photo_comment_new": EventCategory.PHOTOS,
    "photo_comment_edit": EventCategory.PHOTOS,
    "photo_comment_restore": EventCategory.PHOTOS,
    "photo_comment_delete": EventCategory.PHOTOS,
    
    # Видео
    "video_new": EventCategory.VIDEOS,
    "video_comment_new": EventCategory.VIDEOS,
    "video_comment_edit": EventCategory.VIDEOS,
    "video_comment_restore": EventCategory.VIDEOS,
    "video_comment_delete": EventCategory.VIDEOS,
    
    # Аудио
    "audio_new": EventCategory.AUDIO,
    
    # Лайки
    "like_add": EventCategory.LIKES,
    "like_remove": EventCategory.LIKES,
    
    # Обсуждения
    "board_post_new": EventCategory.BOARD,
    "board_post_edit": EventCategory.BOARD,
    "board_post_restore": EventCategory.BOARD,
    "board_post_delete": EventCategory.BOARD,
    
    # Товары
    "market_comment_new": EventCategory.MARKET,
    "market_comment_edit": EventCategory.MARKET,
    "market_comment_restore": EventCategory.MARKET,
    "market_comment_delete": EventCategory.MARKET,
    "market_order_new": EventCategory.MARKET,
    "market_order_edit": EventCategory.MARKET,
    
    # Участники
    "group_join": EventCategory.MEMBERS,
    "group_leave": EventCategory.MEMBERS,
    "user_block": EventCategory.MEMBERS,
    "user_unblock": EventCategory.MEMBERS,
    
    # Управление сообществом
    "group_officers_edit": EventCategory.GROUP_MANAGEMENT,
    "group_change_settings": EventCategory.GROUP_MANAGEMENT,
    "group_change_photo": EventCategory.GROUP_MANAGEMENT,
    
    # Опросы
    "poll_vote_new": EventCategory.POLLS,
    
    # VK Donut
    "donut_subscription_create": EventCategory.DONUT,
    "donut_subscription_prolonged": EventCategory.DONUT,
    "donut_subscription_expired": EventCategory.DONUT,
    "donut_subscription_cancelled": EventCategory.DONUT,
    "donut_subscription_price_changed": EventCategory.DONUT,
    "donut_money_withdraw": EventCategory.DONUT,
    "donut_money_withdraw_error": EventCategory.DONUT,
    
    # Лид-формы
    "lead_forms_new": EventCategory.LEAD_FORMS,
    
    # Прочее
    "vkpay_transaction": EventCategory.OTHER,
    "app_payload": EventCategory.OTHER,
}


def get_event_category(event_type: str) -> EventCategory:
    """Получить категорию события по его типу."""
    return EVENT_CATEGORY_MAP.get(event_type, EventCategory.OTHER)
