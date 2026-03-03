
# Этот файл теперь выступает в роли "хаба" (Facade), объединяя функциональность
# из пакета `vk_api`. Это обеспечивает обратную совместимость для существующих сервисов.

# 1. Низкоуровневый клиент и ошибки
from .vk_api.api_client import VkApiError

# 2. Менеджер токенов (High-level calls with rotation)
from .vk_api.token_manager import (
    call_vk_api, 
    publish_with_fallback,
    get_candidate_tokens, # Экспортируем, может пригодиться
    # Новые функции с приоритетом админ-токенов
    call_vk_api_for_group,
    publish_with_admin_priority,
)

# 2.1 Модуль приоритетных токенов для групп (кэширование)
from .vk_api.admin_tokens import (
    get_admin_tokens_for_group,
    get_admin_token_strings_for_group,
    invalidate_cache_for_group,
    invalidate_all_cache,
    get_cache_stats,
)

# 3. Логика загрузки (Uploads)
from .vk_api.upload import (
    upload_wall_photo,
    upload_message_photo,
    upload_message_doc,
    upload_message_video,
    upload_market_photo,
    upload_album_photo,
    upload_story,
    upload_video_story,
    upload_video,
)

# 4. Методы-обертки (Methods)
from .vk_api.methods import (
    create_album,
    get_albums,
    get_all_photos_from_album,
    get_latest_wall_posts,
    create_comment,
    get_active_stories,
    pin_post,
    unpin_post
)

# 5. Форматтеры
from .vk_api.formatters import (
    format_vk_post,
    format_suggested_vk_post,
    format_album_data,
    format_photo_data,
    _extract_photos,
    format_market_album,
    format_market_item
)

# 6. Утилиты
from .vk_api.utils import (
    vk_owner_id_string,
    resolve_vk_group_id,
    extract_vk_group_identifier,
    resolve_screen_name,
)

# Явный экспорт для чистоты API
__all__ = [
    'VkApiError',
    # Базовая ротация токенов
    'call_vk_api',
    'publish_with_fallback',
    'get_candidate_tokens',
    # Ротация с приоритетом админов группы
    'call_vk_api_for_group',
    'publish_with_admin_priority',
    'get_admin_tokens_for_group',
    'get_admin_token_strings_for_group',
    'invalidate_cache_for_group',
    'invalidate_all_cache',
    'get_cache_stats',
    # Загрузка медиа
    'upload_wall_photo',
    'upload_message_photo',
    'upload_message_doc',
    'upload_message_video',
    'upload_market_photo',
    'upload_album_photo',
    'upload_story',
    'upload_video_story',
    'upload_video',
    # Методы VK API
    'create_album',
    'get_albums',
    'get_all_photos_from_album',
    'get_latest_wall_posts',
    'create_comment',
    'get_active_stories',
    'pin_post',
    'unpin_post',
    # Форматтеры
    'format_vk_post',
    'format_suggested_vk_post',
    'format_album_data',
    'format_photo_data',
    '_extract_photos',
    'format_market_album',
    'format_market_item',
    # Утилиты
    'vk_owner_id_string',
    'resolve_vk_group_id',
    'extract_vk_group_identifier',
    'resolve_screen_name',
]
