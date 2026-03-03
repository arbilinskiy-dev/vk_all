"""
Маппинг данных VK API обратно к историям.

Содержит:
- build_viewer_item() — формирование элемента зрителя из raw-данных VK
- map_stories_results() — маппинг данных к историям
"""
from typing import List, Dict, Any, Optional

from .viewers_vk_workers import StoryViewersData


def build_viewer_item(
    user_id: int,
    user_data: Dict,
    reaction_info: Dict,
    is_member: Optional[bool]
) -> Dict[str, Any]:
    """Формирует элемент зрителя из raw-данных VK."""
    # Извлекаем город
    city = None
    if user_data.get('city'):
        city = user_data['city'].get('title') if isinstance(user_data['city'], dict) else user_data['city']

    # Извлекаем last_seen
    last_seen_time = None
    platform = None
    if user_data.get('last_seen'):
        last_seen_time = user_data['last_seen'].get('time')
        platform = user_data['last_seen'].get('platform')

    return {
        "user_id": user_id,
        "is_liked": reaction_info.get('is_liked', False),
        "reaction_id": reaction_info.get('reaction_id'),
        "is_member": is_member,
        "user": {
            "id": user_id,
            "first_name": user_data.get('first_name', ''),
            "last_name": user_data.get('last_name', ''),
            "photo_100": user_data.get('photo_100'),
            "sex": user_data.get('sex'),
            "bdate": user_data.get('bdate'),
            "city": city,
            "domain": user_data.get('domain'),
            "has_mobile": user_data.get('has_mobile'),
            "last_seen": last_seen_time,
            "platform": platform,
            "is_closed": user_data.get('is_closed', False),
            "can_access_closed": user_data.get('can_access_closed', False),
            "deactivated": user_data.get('deactivated')
        }
    }


def map_stories_results(
    stories_viewers: List[StoryViewersData],
    users_map: Dict[int, Dict],
    members_map: Dict[int, bool]
) -> tuple:
    """
    Маппинг данных пользователей обратно к историям.
    
    Возвращает: (result_stories, total_viewers)
    """
    result_stories = {}
    total_viewers = 0

    for sv in stories_viewers:
        story_key = f"{sv.owner_id}_{sv.story_id}"

        items = []
        for user_id in sv.user_ids:
            user_data = users_map.get(user_id, {})
            reaction_info = sv.reactions_map.get(user_id, {})
            is_member = members_map.get(user_id, False) if members_map else None

            items.append(build_viewer_item(user_id, user_data, reaction_info, is_member))

        result_stories[story_key] = {
            "items": items,
            "count": sv.total_count,
            "reactions_count": sv.reactions_count,
            "partial": sv.partial,
            "success": sv.success,
            "error": sv.error
        }
        total_viewers += len(items)

    return result_stories, total_viewers
