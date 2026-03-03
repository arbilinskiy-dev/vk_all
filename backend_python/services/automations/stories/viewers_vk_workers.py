"""
Воркеры VK API для параллельного получения зрителей историй.

Содержит:
- _rotate_tokens() — ротация токенов по round-robin
- _fetch_story_viewers_ids() — получение IDs зрителей одной истории
- _fetch_users_batch_execute() — загрузка данных пользователей через execute
"""
import requests
import time
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass

from services.vk_api.api_client import call_vk_api as raw_vk_call

# Константы
MAX_VIEWERS_PER_REQUEST = 100  # Лимит stories.getViewers
MAX_USERS_PER_REQUEST = 100    # Лимит users.get (VK обрезает до 100 при community token)
EXECUTE_USERS_BATCH = 25       # Количество users.get запросов в одном execute (лимит VK = 25)
REQUEST_TIMEOUT = 30

# Поля для запроса users.get
USER_FIELDS = 'sex,bdate,city,country,photo_100,domain,has_mobile,last_seen,deactivated,is_closed,can_access_closed'


@dataclass
class StoryViewersData:
    """Данные о зрителях одной истории."""
    owner_id: str
    story_id: str
    user_ids: List[int]
    reactions_map: Dict[int, Dict]  # user_id -> {is_liked, reaction_id}
    total_count: int
    reactions_count: int
    success: bool
    error: Optional[str] = None
    partial: bool = False


def _rotate_tokens(tokens: List[str], index: int) -> List[str]:
    """Round-robin ротация: начинаем с токена по индексу, затем по кругу."""
    num_tokens = len(tokens)
    primary_index = index % num_tokens
    return tokens[primary_index:] + tokens[:primary_index]


def _paginate_story_viewers(
    owner_id: str,
    story_id: str,
    token: str
) -> Tuple[Optional[List[int]], Optional[Dict[int, Dict]], Optional[int], int, Optional[str]]:
    """
    Пагинация зрителей одной истории с одним токеном.
    
    Возвращает:
        (user_ids, reactions_map, total_count, reactions_count, error)
        Если error не None — токен не подошёл, нужно пробовать следующий.
        Если error содержит "PERMANENT:" — повторять бессмысленно.
    """
    all_user_ids = []
    all_reactions_map = {}
    total_count = None
    reactions_count = 0
    offset = 0

    while True:
        try:
            resp = requests.post(
                "https://api.vk.com/method/stories.getViewers",
                data={
                    "owner_id": owner_id,
                    "story_id": story_id,
                    "count": MAX_VIEWERS_PER_REQUEST,
                    "offset": offset,
                    "extended": 1,
                    "access_token": token,
                    "v": "5.131"
                },
                timeout=REQUEST_TIMEOUT
            )

            result = resp.json()

            if 'error' in result:
                error_code = result['error'].get('error_code', 0)
                error_msg = result['error'].get('error_msg', 'Unknown error')
                error_text = f"VK Error {error_code}: {error_msg}"

                # Permanent errors — повторять с другим токеном бессмысленно
                if error_code == 100:
                    return [], {}, 0, 0, f"PERMANENT:{error_text}"

                if error_code in [5, 204, 212]:
                    return (
                        all_user_ids, all_reactions_map,
                        total_count or len(all_user_ids), reactions_count,
                        f"PERMANENT_PARTIAL:{error_text}"
                    )

                # Ротируемые ошибки (15, прочие) — пробуем следующий токен
                return None, None, None, 0, error_text

            if 'response' in result:
                response = result['response']
                items = response.get('items', [])

                if total_count is None:
                    total_count = response.get('count', len(items))
                    reactions_count = response.get('reactions_count', 0)

                # Извлекаем user_ids и реакции
                for item in items:
                    user_id = item.get('user_id') or item.get('id')
                    if user_id:
                        all_user_ids.append(user_id)
                        all_reactions_map[user_id] = {
                            'is_liked': item.get('is_liked', False),
                            'reaction_id': item.get('reaction_id')
                        }

                # Проверяем, есть ли ещё данные
                if len(items) < MAX_VIEWERS_PER_REQUEST or len(all_user_ids) >= total_count:
                    return all_user_ids, all_reactions_map, total_count, reactions_count, None

                # Есть ещё — продолжаем пагинацию
                offset += MAX_VIEWERS_PER_REQUEST
                time.sleep(0.2)
            else:
                # Непонятный ответ — пробуем следующий токен
                return None, None, None, 0, "Unknown response format"

        except Exception as e:
            return None, None, None, 0, str(e)


def _fetch_story_viewers_ids(
    owner_id: str,
    story_id: str,
    tokens: List[str],
    story_index: int
) -> StoryViewersData:
    """
    Воркер: получает ВСЕХ зрителей одной истории (только IDs и реакции).
    Выполняется в отдельном потоке.
    
    ВАЖНО: Использует ротацию токенов при Error 15 (non-standalone apps).
    """
    if not tokens:
        return StoryViewersData(
            owner_id=owner_id, story_id=story_id,
            user_ids=[], reactions_map={},
            total_count=0, reactions_count=0,
            success=False, error="No tokens available"
        )

    rotation_order = _rotate_tokens(tokens, story_index)
    last_error = None

    # Пробуем каждый токен по очереди
    for token in rotation_order:
        user_ids, reactions_map, total_count, reactions_count, error = _paginate_story_viewers(
            owner_id, story_id, token
        )

        if error is None:
            # Успех — полный результат
            return StoryViewersData(
                owner_id=owner_id, story_id=story_id,
                user_ids=user_ids, reactions_map=reactions_map,
                total_count=total_count, reactions_count=reactions_count,
                success=True
            )

        last_error = error

        # Permanent error — отдаём то, что есть, дальше не пробуем
        if error.startswith("PERMANENT:"):
            return StoryViewersData(
                owner_id=owner_id, story_id=story_id,
                user_ids=[], reactions_map={},
                total_count=0, reactions_count=0,
                success=False, error=error.replace("PERMANENT:", "")
            )

        if error.startswith("PERMANENT_PARTIAL:"):
            return StoryViewersData(
                owner_id=owner_id, story_id=story_id,
                user_ids=user_ids or [], reactions_map=reactions_map or {},
                total_count=total_count or 0, reactions_count=reactions_count,
                success=len(user_ids or []) > 0,
                error=error.replace("PERMANENT_PARTIAL:", ""),
                partial=len(user_ids or []) > 0
            )

        # Ротируемая ошибка — пробуем следующий токен
        time.sleep(0.1)

    # Все токены перепробовали
    return StoryViewersData(
        owner_id=owner_id, story_id=story_id,
        user_ids=[], reactions_map={},
        total_count=0, reactions_count=0,
        success=False, error=last_error or "All tokens failed"
    )


def _fetch_users_batch_execute(
    user_ids: List[int],
    tokens: List[str],
    chunk_index: int,
    project_id: str
) -> List[Dict]:
    """Воркер: загружает данные пользователей через execute (до 25×100 = 2500 за раз)."""
    if not user_ids or not tokens:
        return []

    rotation_order = _rotate_tokens(tokens, chunk_index)

    # Разбиваем user_ids на под-чанки по 100 (лимит users.get для community token)
    sub_chunks = [user_ids[i:i + MAX_USERS_PER_REQUEST] for i in range(0, len(user_ids), MAX_USERS_PER_REQUEST)]
    sub_chunks = sub_chunks[:EXECUTE_USERS_BATCH]  # Макс 25 запросов в execute

    # Формируем VKScript код
    code_parts = []
    for i, chunk in enumerate(sub_chunks):
        ids_str = ",".join(map(str, chunk))
        code_parts.append(f'''
        var r{i} = API.users.get({{"user_ids": "{ids_str}", "fields": "{USER_FIELDS}"}});
        ''')

    # Собираем результаты в массив
    results_array = " + ".join([f"r{i}" for i in range(len(sub_chunks))])
    code = "".join(code_parts) + f"\nreturn {results_array};"

    for token in rotation_order:
        try:
            response = raw_vk_call("execute", {"code": code, "access_token": token}, project_id=project_id)

            if isinstance(response, list):
                return response
            elif isinstance(response, dict) and 'response' in response:
                return response['response'] if isinstance(response['response'], list) else []

        except Exception as e:
            print(f"[ViewersParallel] Execute failed with token ...{token[-4:]}: {e}")
            time.sleep(0.3)
            continue

    print(f"[ViewersParallel] All tokens failed for user batch {chunk_index}")
    return []
