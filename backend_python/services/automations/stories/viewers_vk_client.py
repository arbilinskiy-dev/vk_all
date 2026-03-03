"""
VK API клиент для получения зрителей историй.
Содержит: запросы к VK API, retry-логику, пагинацию, трансформацию данных.
"""
import requests
import time
from typing import Dict, Any


# Константы
MAX_VIEWERS_PER_REQUEST = 100  # Лимит VK API
MAX_RETRIES = 3  # Максимум повторных попыток при ошибке
RETRY_DELAY = 1  # Задержка между попытками (секунды)
REQUEST_TIMEOUT = 30  # Таймаут запроса (секунды)


def transform_viewer_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Трансформирует элемент зрителя из формата VK API в наш формат.
    VK API с extended=1 возвращает данные пользователя прямо в элементе,
    мы же ожидаем их в отдельном объекте 'user'.
    """
    # Извлекаем user_id (может быть как 'user_id', так и 'id')
    user_id = item.get('user_id') or item.get('id')
    
    return {
        "user_id": user_id,
        "is_liked": item.get('is_liked', False),
        "reaction_id": item.get('reaction_id'),
        "user": {
            "id": user_id,
            "first_name": item.get('first_name', ''),
            "last_name": item.get('last_name', ''),
            "photo_50": item.get('photo_50'),
            "photo_100": item.get('photo_100'),
            "is_closed": item.get('is_closed', False),
            "can_access_closed": item.get('can_access_closed', False)
        }
    }


def fetch_viewers_page(
    owner_id: str, 
    story_id: str, 
    user_token: str, 
    offset: int = 0,
    count: int = MAX_VIEWERS_PER_REQUEST
) -> Dict[str, Any]:
    """
    Получает одну страницу зрителей истории.
    Возвращает dict с ключами: success, data, error, total_count
    """
    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.post(
                "https://api.vk.com/method/stories.getViewers",
                data={
                    "owner_id": owner_id,
                    "story_id": story_id,
                    "count": count,
                    "offset": offset,
                    "extended": 1,  # Расширенная информация о пользователях
                    "fields": "photo_50,photo_100",  # Явно запрашиваем фото
                    "access_token": user_token,
                    "v": "5.131"
                },
                timeout=REQUEST_TIMEOUT
            )
            
            result = resp.json()
            
            if 'error' in result:
                error_code = result['error'].get('error_code', 0)
                error_msg = result['error'].get('error_msg', 'Unknown error')
                
                # Ошибки, которые не имеет смысла повторять
                permanent_errors = [5, 15, 100, 204, 212]  # Auth, access denied, invalid param/story not found, etc.
                if error_code in permanent_errors:
                    return {
                        "success": False,
                        "error": f"VK Error {error_code}: {error_msg}",
                        "permanent": True,
                        "data": [],
                        "total_count": 0
                    }
                
                # Временные ошибки - retry
                if attempt < MAX_RETRIES - 1:
                    print(f"[Viewers] VK Error {error_code}, retry {attempt + 1}/{MAX_RETRIES}...")
                    time.sleep(RETRY_DELAY * (attempt + 1))
                    continue
                    
                return {
                    "success": False,
                    "error": f"VK Error {error_code}: {error_msg}",
                    "permanent": False,
                    "data": [],
                    "total_count": 0
                }
            
            if 'response' in result:
                response = result['response']
                items = response.get('items', [])
                total_count = response.get('count', len(items))
                
                return {
                    "success": True,
                    "data": items,
                    "total_count": total_count,
                    "reactions_count": response.get('reactions_count', 0),
                    "new_reactions": response.get('new_reactions', [])
                }
                
        except requests.exceptions.Timeout:
            if attempt < MAX_RETRIES - 1:
                print(f"[Viewers] Timeout, retry {attempt + 1}/{MAX_RETRIES}...")
                time.sleep(RETRY_DELAY * (attempt + 1))
                continue
            return {
                "success": False,
                "error": "Request timeout after retries",
                "permanent": False,
                "data": [],
                "total_count": 0
            }
            
        except requests.exceptions.ConnectionError as e:
            if attempt < MAX_RETRIES - 1:
                print(f"[Viewers] Connection error, retry {attempt + 1}/{MAX_RETRIES}...")
                time.sleep(RETRY_DELAY * (attempt + 1))
                continue
            return {
                "success": False,
                "error": f"Connection error: {str(e)}",
                "permanent": False,
                "data": [],
                "total_count": 0
            }
            
        except Exception as e:
            print(f"[Viewers] Unexpected error: {e}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "permanent": False,
                "data": [],
                "total_count": 0
            }
    
    return {
        "success": False,
        "error": "Max retries exceeded",
        "permanent": False,
        "data": [],
        "total_count": 0
    }


def fetch_all_viewers(
    owner_id: str,
    story_id: str,
    user_token: str
) -> Dict[str, Any]:
    """
    Получает ВСЕХ зрителей истории с пагинацией.
    Возвращает dict с ключами: success, viewers, total_count, error
    """
    all_viewers = []
    offset = 0
    total_count = None
    reactions_count = 0
    new_reactions = []
    
    while True:
        result = fetch_viewers_page(owner_id, story_id, user_token, offset)
        
        if not result['success']:
            # Если это permanent error или у нас уже есть часть данных
            if result.get('permanent') or len(all_viewers) > 0:
                # Возвращаем то, что успели собрать
                print(f"[Viewers] Error during pagination at offset {offset}: {result.get('error')}")
                if len(all_viewers) > 0:
                    print(f"[Viewers] Returning partial data: {len(all_viewers)} viewers")
                    return {
                        "success": True,  # Partial success
                        "viewers": all_viewers,
                        "total_count": total_count or len(all_viewers),
                        "reactions_count": reactions_count,
                        "new_reactions": new_reactions,
                        "partial": True,
                        "error": result.get('error')
                    }
            return {
                "success": False,
                "viewers": [],
                "total_count": 0,
                "error": result.get('error')
            }
        
        items = result['data']
        # Трансформируем каждый элемент в наш формат
        transformed_items = [transform_viewer_item(item) for item in items]
        all_viewers.extend(transformed_items)
        
        # Сохраняем метаданные с первой страницы
        if total_count is None:
            total_count = result['total_count']
            reactions_count = result.get('reactions_count', 0)
            new_reactions = result.get('new_reactions', [])
        
        # Проверяем, есть ли ещё данные
        if len(items) < MAX_VIEWERS_PER_REQUEST or len(all_viewers) >= total_count:
            break
            
        offset += MAX_VIEWERS_PER_REQUEST
        
        # Небольшая задержка между запросами для избежания rate limit
        time.sleep(0.3)
    
    print(f"[Viewers] Fetched {len(all_viewers)}/{total_count} viewers for story {owner_id}_{story_id}")
    
    return {
        "success": True,
        "viewers": all_viewers,
        "total_count": total_count,
        "reactions_count": reactions_count,
        "new_reactions": new_reactions,
        "partial": False
    }
