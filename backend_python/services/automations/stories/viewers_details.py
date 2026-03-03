"""
Модуль для получения ДЕТАЛЬНОЙ информации о зрителях историй VK.
Аналогично функционалу списков подписчиков, но изолирован для области историй.

Этап 1: Получаем список user_id из stories.getViewers
Этап 2: Дозапрашиваем детали через users.get (фото, пол, ДР, город, онлайн и т.д.)
"""
from typing import List, Dict, Any
import requests
import time
import json
from datetime import datetime, timezone

# Константы
MAX_USERS_PER_REQUEST = 100   # Лимит users.get (VK обрезает ответ до 100 при community token)
MAX_VIEWERS_PER_REQUEST = 100  # Лимит stories.getViewers
MAX_RETRIES = 3
RETRY_DELAY = 1
REQUEST_TIMEOUT = 30

# Поля для запроса users.get (аналогично списку подписчиков)
USER_FIELDS = 'sex,bdate,city,country,photo_100,domain,has_mobile,last_seen,deactivated,is_closed,can_access_closed'


# ─── Хелперы: единая retry-логика и батчинг ───────────────────────────────────

def _vk_api_request(
    method: str,
    params: Dict[str, Any],
    token: str,
    permanent_errors: List[int] = None,
    api_version: str = "5.131"
) -> Dict[str, Any]:
    """
    Универсальный VK API вызов с retry и linear backoff.
    Возвращает: {"success": True, "response": ...} или {"success": False, "error": ..., "permanent": bool}
    """
    if permanent_errors is None:
        permanent_errors = [5, 15]

    request_data = {**params, "access_token": token, "v": api_version}

    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.post(
                f"https://api.vk.com/method/{method}",
                data=request_data,
                timeout=REQUEST_TIMEOUT
            )
            result = resp.json()

            if 'response' in result:
                return {"success": True, "response": result['response']}

            if 'error' in result:
                error_code = result['error'].get('error_code', 0)
                error_msg = result['error'].get('error_msg', 'Unknown error')

                if error_code in permanent_errors:
                    return {"success": False, "error": f"VK Error {error_code}: {error_msg}", "permanent": True}

                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY * (attempt + 1))
                    continue

                return {"success": False, "error": f"VK Error {error_code}: {error_msg}", "permanent": False}

        except requests.exceptions.Timeout:
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))
                continue
            return {"success": False, "error": "Timeout", "permanent": False}

        except Exception as e:
            return {"success": False, "error": str(e), "permanent": False}

    return {"success": False, "error": "Max retries", "permanent": False}


def _chunked_vk_request(
    method: str,
    ids: List[int],
    chunk_size: int,
    id_param_name: str,
    extra_params: Dict[str, Any],
    token: str,
    permanent_errors: List[int] = None,
    api_version: str = "5.131",
    log_prefix: str = "[ViewersDetails]"
) -> List[tuple]:
    """
    Батч-запросы к VK API по чанкам ID.
    Возвращает список кортежей (chunk_ids, response_data) для каждого успешного чанка.
    """
    results = []

    for i in range(0, len(ids), chunk_size):
        chunk = ids[i:i + chunk_size]
        ids_str = ",".join(map(str, chunk))

        params = {id_param_name: ids_str, **extra_params}
        result = _vk_api_request(method, params, token, permanent_errors, api_version)

        if result['success']:
            results.append((chunk, result['response']))
        else:
            print(f"{log_prefix} {method} error: {result.get('error', 'Unknown')}")

        # Пауза между чанками
        if i + chunk_size < len(ids):
            time.sleep(0.3)

    return results


# ─── Функции получения данных ──────────────────────────────────────────────────

def _fetch_viewers_ids_page(
    owner_id: str,
    story_id: str,
    user_token: str,
    offset: int = 0,
    count: int = MAX_VIEWERS_PER_REQUEST
) -> Dict[str, Any]:
    """
    Получает одну страницу ID зрителей истории.
    Возвращает dict с ключами: success, user_ids, total_count, reactions_map
    """
    result = _vk_api_request(
        "stories.getViewers",
        {"owner_id": owner_id, "story_id": story_id, "count": count, "offset": offset, "extended": 1},
        user_token,
        permanent_errors=[5, 15, 204, 212]
    )

    if not result['success']:
        return {
            "success": False,
            "error": result.get('error', 'Unknown'),
            "permanent": result.get('permanent', False),
            "user_ids": [],
            "reactions_map": {},
            "total_count": 0
        }

    response = result['response']
    items = response.get('items', [])
    total_count = response.get('count', len(items))
    reactions_count = response.get('reactions_count', 0)

    # Извлекаем user_id и информацию о лайках
    user_ids = []
    reactions_map = {}  # user_id -> {is_liked, reaction_id}

    for item in items:
        user_id = item.get('user_id') or item.get('id')
        if user_id:
            user_ids.append(user_id)
            reactions_map[user_id] = {
                'is_liked': item.get('is_liked', False),
                'reaction_id': item.get('reaction_id')
            }

    return {
        "success": True,
        "user_ids": user_ids,
        "reactions_map": reactions_map,
        "total_count": total_count,
        "reactions_count": reactions_count
    }


def _fetch_all_viewer_ids(
    owner_id: str,
    story_id: str,
    user_token: str
) -> Dict[str, Any]:
    """
    Получает ВСЕХ зрителей истории (только ID и реакции).
    """
    all_user_ids = []
    all_reactions_map = {}
    offset = 0
    total_count = None
    reactions_count = 0
    
    while True:
        result = _fetch_viewers_ids_page(owner_id, story_id, user_token, offset)
        
        if not result['success']:
            if len(all_user_ids) > 0:
                return {
                    "success": True,
                    "user_ids": all_user_ids,
                    "reactions_map": all_reactions_map,
                    "total_count": total_count or len(all_user_ids),
                    "reactions_count": reactions_count,
                    "partial": True
                }
            return result
        
        all_user_ids.extend(result['user_ids'])
        all_reactions_map.update(result['reactions_map'])
        
        if total_count is None:
            total_count = result['total_count']
            reactions_count = result.get('reactions_count', 0)
        
        if len(result['user_ids']) < MAX_VIEWERS_PER_REQUEST or len(all_user_ids) >= total_count:
            break
            
        offset += MAX_VIEWERS_PER_REQUEST
        time.sleep(0.3)
    
    return {
        "success": True,
        "user_ids": all_user_ids,
        "reactions_map": all_reactions_map,
        "total_count": total_count,
        "reactions_count": reactions_count,
        "partial": False
    }


def _fetch_users_details(
    user_ids: List[int],
    user_token: str
) -> List[Dict[str, Any]]:
    """
    Получает детальную информацию о пользователях через users.get.
    Обрабатывает чанками по 100.
    """
    results = _chunked_vk_request(
        "users.get", user_ids, MAX_USERS_PER_REQUEST,
        "user_ids", {"fields": USER_FIELDS}, user_token,
        permanent_errors=[5, 15]
    )

    all_users = []
    for _chunk, response in results:
        all_users.extend(response)
    return all_users


MAX_ISMEMBER_PER_REQUEST = 500  # Лимит groups.isMember для user_ids


def _fetch_members_status(
    group_id: int,
    user_ids: List[int],
    user_token: str
) -> Dict[int, bool]:
    """
    Проверяет, являются ли пользователи подписчиками сообщества через groups.isMember.
    Возвращает dict: user_id -> is_member (True/False).
    """
    results = _chunked_vk_request(
        "groups.isMember", user_ids, MAX_ISMEMBER_PER_REQUEST,
        "user_ids", {"group_id": group_id}, user_token,
        permanent_errors=[5, 15], api_version="5.199"
    )

    members_map: Dict[int, bool] = {}
    for chunk, response in results:
        if isinstance(response, list):
            # Массовый ответ: [{"user_id": 123, "member": 1}, ...]
            for item in response:
                uid = item.get('user_id')
                if uid is not None:
                    members_map[uid] = bool(item.get('member', 0))
        elif isinstance(response, (int, bool)):
            # Одиночный ответ (1 user_id): {"response": 1}
            if len(chunk) == 1:
                members_map[chunk[0]] = bool(response)

    # Для пользователей без ответа — считаем не подписчиками
    for uid in user_ids:
        if uid not in members_map:
            members_map[uid] = False

    members_count = sum(1 for v in members_map.values() if v)
    print(f"[ViewersDetails] ✓ Membership check: {members_count}/{len(members_map)} are members")

    return members_map


def fetch_viewers_with_details(
    owner_id: str,
    story_id: str,
    user_token: str,
    group_id: int = None
) -> Dict[str, Any]:
    """
    Основная функция: получает зрителей истории с ПОЛНОЙ детализацией.
    
    Возвращает структуру:
    {
        "success": True/False,
        "items": [
            {
                "user_id": 123,
                "is_liked": True/False,
                "reaction_id": None,
                "user": {
                    "id": 123,
                    "first_name": "Имя",
                    "last_name": "Фамилия",
                    "photo_100": "https://...",
                    "sex": 1/2,
                    "bdate": "1.1.1990",
                    "city": "Москва",
                    "last_seen": 1234567890,
                    "platform": 7,
                    "is_closed": False,
                    "deactivated": None
                }
            }
        ],
        "count": 100,
        "reactions_count": 5,
        "partial": False
    }
    """
    print(f"[ViewersDetails] Fetching viewers for story {owner_id}_{story_id}")
    
    # Этап 1: Получаем ID всех зрителей и информацию о реакциях
    viewers_result = _fetch_all_viewer_ids(owner_id, story_id, user_token)
    
    if not viewers_result['success']:
        return {
            "success": False,
            "error": viewers_result.get('error', 'Failed to fetch viewers'),
            "items": [],
            "count": 0,
            "reactions_count": 0
        }
    
    user_ids = viewers_result['user_ids']
    reactions_map = viewers_result['reactions_map']
    
    if not user_ids:
        return {
            "success": True,
            "items": [],
            "count": 0,
            "reactions_count": 0,
            "partial": False
        }
    
    print(f"[ViewersDetails] {len(user_ids)} viewer IDs, fetching details...")
    
    # Этап 2: Получаем детальную информацию о пользователях
    users_data = _fetch_users_details(user_ids, user_token)
    
    # Этап 2.5: Проверяем подписку на сообщество через groups.isMember
    members_map: Dict[int, bool] = {}
    if group_id and user_ids:
        effective_group_id = group_id
        if effective_group_id < 0:
            effective_group_id = abs(effective_group_id)
        members_map = _fetch_members_status(effective_group_id, user_ids, user_token)
    
    # Создаём map для быстрого доступа
    users_map = {u['id']: u for u in users_data}
    
    missing_ids = [uid for uid in user_ids if uid not in users_map]
    if missing_ids:
        print(f"[ViewersDetails] ⚠️ Missing details for {len(missing_ids)} users")
    
    # Этап 3: Собираем финальную структуру
    items = []
    for user_id in user_ids:
        user_data = users_map.get(user_id, {})
        reaction_info = reactions_map.get(user_id, {})
        
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
        
        items.append({
            "user_id": user_id,
            "is_liked": reaction_info.get('is_liked', False),
            "reaction_id": reaction_info.get('reaction_id'),
            "is_member": members_map.get(user_id, False) if members_map else None,
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
        })
    
    print(f"[ViewersDetails] Built {len(items)} viewer records")
    
    return {
        "success": True,
        "items": items,
        "count": viewers_result['total_count'],
        "reactions_count": viewers_result.get('reactions_count', 0),
        "partial": viewers_result.get('partial', False)
    }
