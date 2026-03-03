
from typing import List, Dict, Any
from .token_manager import call_vk_api, publish_with_fallback, call_vk_api_for_group, publish_with_admin_priority

def create_album(owner_id: str, title: str, token: str) -> Dict:
    """Creates a new photo album."""
    # Извлекаем group_id из owner_id (он отрицательный для групп)
    group_id = abs(int(owner_id)) if owner_id else None
    
    # Используем publish_with_admin_priority для приоритета токенов-админов группы
    return publish_with_admin_priority({
        'owner_id': owner_id,
        'title': title
    }, method='photos.createAlbum', group_id=group_id, preferred_token=token)

def get_albums(owner_id: str, token: str) -> List[Dict]:
    """Fetches all photo albums."""
    # Используем call_vk_api с ротацией (для чтения)
    response = call_vk_api('photos.getAlbums', {
        'owner_id': owner_id,
        'need_system': 1,
        'access_token': token
    })
    return response.get('items', [])

def get_all_photos_from_album(owner_id: str, album_id: str, token: str) -> List[Dict]:
    """Fetches ALL photos from a specific album, handling pagination."""
    all_photos = []
    offset = 0
    count = 1000
    
    # Для чтения используем стандартный call_vk_api с ротацией
    while True:
        response = call_vk_api('photos.get', {
            'owner_id': owner_id,
            'album_id': album_id,
            'photo_sizes': 1,
            'offset': offset,
            'count': count,
            'access_token': token
        })
        items = response.get('items', [])
        all_photos.extend(items)
        
        if len(items) < count:
            break
        offset += count
        
    return all_photos

def get_latest_wall_posts(owner_id: str, token: str, count: int = 20) -> List[Dict]:
    """
    Fetches the latest few posts from a wall.
    """
    response = call_vk_api('wall.get', {
        'owner_id': owner_id,
        'count': count,
        'access_token': token
    })
    return response.get('items', [])

def create_comment(owner_id: int, post_id: int, message: str, token: str, from_group: int = 1) -> Dict:
    """
    Adds a comment to a post.
    Using publish_with_admin_priority to ensure it works with admin tokens first.
    """
    # Извлекаем group_id из owner_id (он отрицательный для групп)
    group_id = abs(int(owner_id)) if owner_id else None
    
    params = {
        'owner_id': owner_id,
        'post_id': post_id,
        'message': message,
        'from_group': from_group
    }
    return publish_with_admin_priority(params, method='wall.createComment', group_id=group_id, preferred_token=token)

def pin_post(owner_id: str, post_id: int, token: str) -> Dict:
    """
    Закрепляет запись на стене сообщества.
    Требует user_token с правами администратора группы.
    """
    group_id = abs(int(owner_id)) if owner_id else None
    params = {
        'owner_id': owner_id,
        'post_id': post_id
    }
    return publish_with_admin_priority(params, method='wall.pin', group_id=group_id, preferred_token=token)

def unpin_post(owner_id: str, post_id: int, token: str) -> Dict:
    """
    Открепляет запись на стене сообщества.
    Требует user_token с правами администратора группы.
    """
    group_id = abs(int(owner_id)) if owner_id else None
    params = {
        'owner_id': owner_id,
        'post_id': post_id
    }
    return publish_with_admin_priority(params, method='wall.unpin', group_id=group_id, preferred_token=token)

def get_active_stories(group_id: int, token: str, community_tokens: list = None) -> List[Dict]:
    """
    Fetches active stories for a community.
    
    Если community_tokens не пуст — используются ТОЛЬКО они (эксклюзивный режим).
    Иначе — стандартная ротация admin-токенов.
    """
    try:
        response = call_vk_api_for_group('stories.get', {
            'owner_id': -int(group_id),
            'access_token': token,
            'extended': 0,
            'v': '5.199'
        }, group_id=group_id, community_tokens=community_tokens)
        
        all_stories = []
        items_list = response.get('items', [])
        for item in items_list:
            if 'stories' in item:
                all_stories.extend(item['stories'])
            # Sometimes single story object might be in list? 
            # Usually stories.get returns: { count: N, items: [ { type, stories: [...] } ] }
        return all_stories
    except Exception as e:
        print(f"VK_API: Error fetching active stories for group {group_id}: {e}")
        return []
