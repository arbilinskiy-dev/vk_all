"""
Загрузка медиа в VK — ХАБ-МОДУЛЬ.
Тонкий хаб: импортирует и реэкспортирует всё из подмодулей.

Подмодули:
  - upload_photos   — фото на стену и в альбом
  - upload_messages — медиа для личных сообщений (фото, документы, видео)
  - upload_stories  — истории (фото и видео)
  - upload_market   — фото товаров VK Market
  - upload_video    — видео в сообщество
"""

# Фото (стена + альбом)
from .upload_photos import upload_wall_photo, upload_album_photo

# Медиа для сообщений
from .upload_messages import upload_message_photo, upload_message_doc, upload_message_video

# Истории
from .upload_stories import upload_story, upload_video_story

# Товары (маркет)
from .upload_market import ensure_market_photo_min_size, upload_market_photo

# Видео
from .upload_video import upload_video

__all__ = [
    # Фото
    "upload_wall_photo",
    "upload_album_photo",
    # Сообщения
    "upload_message_photo",
    "upload_message_doc",
    "upload_message_video",
    # Истории
    "upload_story",
    "upload_video_story",
    # Маркет
    "ensure_market_photo_min_size",
    "upload_market_photo",
    # Видео
    "upload_video",
]
