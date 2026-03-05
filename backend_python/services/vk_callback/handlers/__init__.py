# Автоматическая регистрация всех обработчиков событий VK Callback
#
# При импорте этого модуля все хендлеры создаются и регистрируются
# в глобальном реестре (registry.py).

import logging
from .base import BaseEventHandler

logger = logging.getLogger("vk_callback.handlers")

# ─── Импорт всех хендлеров ─────────────────────────────────────────

# Подтверждение сервера
from .confirmation.handler import ConfirmationHandler

# Стена: посты, репосты, расписание
from .wall.post_new import WallPostNewHandler
from .wall.repost import WallRepostHandler
from .wall.schedule_new import WallSchedulePostNewHandler
from .wall.schedule_delete import WallSchedulePostDeleteHandler

# Комментарии на стене
from .wall_comments.handler import WallCommentsHandler

# Сообщения
from .messages.message_new import MessageNewHandler
from .messages.message_reply import MessageReplyHandler
from .messages.message_read import MessageReadHandler
from .messages.message_typing import MessageTypingHandler
from .messages.message_allow_deny import MessageAllowDenyHandler
from .messages.message_edit import MessageEditHandler
from .messages.message_event import MessageEventHandler

# Фотографии
from .photos.handler import PhotosHandler

# Видеозаписи
from .videos.handler import VideosHandler

# Лайки
from .likes.handler import LikesHandler

# Товары и заказы
from .market.handler import MarketHandler

# Участники сообщества
from .members.group_join import GroupJoinHandler
from .members.group_leave import GroupLeaveHandler
from .members.handler import MembersBlockHandler

# Обсуждения
from .board.handler import BoardHandler

# Управление сообществом
from .group_management.handler import GroupManagementHandler

# Опросы
from .polls.handler import PollsHandler

# VK Donut
from .donut.handler import DonutHandler

# Аудиозаписи
from .audio.handler import AudioHandler


# ─── Регистрация в глобальном реестре ──────────────────────────────

# Список всех хендлеров (для регистрации и обратной совместимости)
ALL_HANDLERS: list[BaseEventHandler] = []


def _register_all_handlers():
    """
    Создать экземпляры всех хендлеров и зарегистрировать в реестре.
    Вызывается один раз при импорте модуля.
    """
    from ..registry import register_handler
    
    handler_classes = [
        ConfirmationHandler,
        # Wall
        WallPostNewHandler,
        WallRepostHandler,
        WallSchedulePostNewHandler,
        WallSchedulePostDeleteHandler,
        # Comments
        WallCommentsHandler,
        # Messages
        MessageNewHandler,
        MessageReplyHandler,
        MessageReadHandler,
        MessageTypingHandler,
        MessageAllowDenyHandler,
        MessageEditHandler,
        MessageEventHandler,
        # Media
        PhotosHandler,
        VideosHandler,
        AudioHandler,
        # Engagement
        LikesHandler,
        PollsHandler,
        # Commerce
        MarketHandler,
        # Community
        GroupJoinHandler,
        GroupLeaveHandler,
        MembersBlockHandler,
        BoardHandler,
        GroupManagementHandler,
        # Monetization
        DonutHandler,
    ]
    
    for cls in handler_classes:
        try:
            instance = cls()
            register_handler(instance)
            ALL_HANDLERS.append(instance)
        except Exception as e:
            logger.error(f"Ошибка регистрации {cls.__name__}: {e}")
    
    logger.info(f"HANDLERS: Зарегистрировано {len(ALL_HANDLERS)} обработчиков")


# Автоматическая регистрация при импорте
_register_all_handlers()

__all__ = [
    'BaseEventHandler',
    'ALL_HANDLERS',
    'ConfirmationHandler',
    'WallPostNewHandler',
    'MessageNewHandler',
    'MessageReplyHandler',
    'MessageReadHandler',
    'MessageTypingHandler',
    'MessageAllowDenyHandler',
    'MessageEditHandler',
    'MessageEventHandler',
]
