"""
Сервис Песочницы: Тест 2 — Получение данных историй (stories.get, stories.getStats, stories.getViewers).

Полностью изолирован от основной логики приложения.
Тестирует 3 метода VK API с 4 типами токенов:
- User Token (токен пользователя-администратора)
- User Non-Admin Token (токен пользователя НЕ админа)
- Community Token (токен сообщества)
- Service Token (сервисный токен приложения)

Цель: определить, какие данные и с каким токеном можно получить.
"""

import requests
import time
from typing import Dict, Any, Optional, List

VK_API_VERSION = '5.199'
VK_API_BASE_URL = 'https://api.vk.com/method/'
REQUEST_TIMEOUT = 15


def _make_vk_request(method: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Выполняет один запрос к VK API и возвращает структурированный лог.
    Изолированная версия — не импортируется из других модулей.
    """
    url = f"{VK_API_BASE_URL}{method}"

    payload = params.copy()
    if 'v' not in payload:
        payload['v'] = VK_API_VERSION

    # Маскируем токен в логе
    safe_payload = payload.copy()
    if 'access_token' in safe_payload:
        token = safe_payload['access_token']
        safe_payload['access_token'] = f"{token[:12]}...{token[-4:]}" if len(token) > 16 else "***"

    request_log = {
        "url": url,
        "method": "POST",
        "params": safe_payload
    }

    start_time = time.time()

    try:
        response = requests.post(url, data=payload, timeout=REQUEST_TIMEOUT)
        elapsed_ms = round((time.time() - start_time) * 1000)
        response_data = response.json()

        return {
            "success": "response" in response_data,
            "request": request_log,
            "response": response_data,
            "http_status": response.status_code,
            "elapsed_ms": elapsed_ms,
            "error": response_data.get("error", None)
        }
    except Exception as e:
        elapsed_ms = round((time.time() - start_time) * 1000)
        return {
            "success": False,
            "request": request_log,
            "response": None,
            "http_status": None,
            "elapsed_ms": elapsed_ms,
            "error": {"message": str(e), "type": type(e).__name__}
        }


# ═══════════════════════════════════════════════
# Тест: stories.get — получение активных историй
# ═══════════════════════════════════════════════

def test_stories_get(
    group_id: int,
    token: str,
    token_type: str,
) -> Dict[str, Any]:
    """
    Тестирует stories.get — получение активных историй сообщества.
    
    Параметры:
    - group_id: ID сообщества (без минуса)
    - token: токен для авторизации
    - token_type: тип токена ('user' / 'community' / 'service') — для логирования
    """
    step = _make_vk_request('stories.get', {
        'owner_id': -int(group_id),
        'access_token': token,
        'extended': 1,
    })

    # Извлекаем краткую сводку из ответа
    summary = None
    if step["success"]:
        resp = step["response"].get("response", {})
        items = resp.get("items", [])
        # stories.get v5.199 возвращает: items: [ { type: "stories", stories: [...] }, ... ]
        # Каждый элемент items — контейнер (группа/пользователь) с вложенным массивом stories
        total_stories = 0
        story_ids = []
        for container in items:
            if isinstance(container, dict):
                # Вложенная структура: container.stories = [story1, story2, ...]
                nested = container.get("stories", [])
                if isinstance(nested, list) and nested:
                    total_stories += len(nested)
                    story_ids.extend([s.get("id") for s in nested if isinstance(s, dict)])
                else:
                    # Fallback: сам контейнер — это история (старый формат)
                    total_stories += 1
                    story_ids.append(container.get("id"))
            elif isinstance(container, list):
                # Совсем старый формат: items = [ [story1, story2], ... ]
                total_stories += len(container)
                story_ids.extend([s.get("id") for s in container if isinstance(s, dict)])
        
        summary = {
            "total_stories": total_stories,
            "story_ids": story_ids[:20],  # Ограничиваем для краткости
            "count_field": resp.get("count"),
        }

    return {
        "method": "stories.get",
        "token_type": token_type,
        "step": {
            "step": 1,
            "name": "stories.get",
            "description": f"Получение активных историй сообщества (токен: {token_type})",
            **step
        },
        "summary": summary,
    }


# ═══════════════════════════════════════════════
# Тест: stories.getStats — статистика истории
# ═══════════════════════════════════════════════

def test_stories_get_stats(
    owner_id: int,
    story_id: int,
    token: str,
    token_type: str,
) -> Dict[str, Any]:
    """
    Тестирует stories.getStats — получение статистики одной истории.
    
    Параметры:
    - owner_id: ID владельца (для сообщества с минусом, напр. -123456)
    - story_id: ID конкретной истории
    - token: токен для авторизации
    - token_type: тип токена ('user' / 'community' / 'service')
    """
    step = _make_vk_request('stories.getStats', {
        'owner_id': owner_id,
        'story_id': story_id,
        'access_token': token,
    })

    # Извлекаем краткую сводку по полям статистики
    summary = None
    if step["success"]:
        resp = step["response"].get("response", {})
        summary = {
            "views": resp.get("views", {}).get("count"),
            "replies": resp.get("replies", {}).get("count"),
            "shares": resp.get("shares", {}).get("count"),
            "subscribers": resp.get("subscribers", {}).get("count"),
            "bans": resp.get("bans", {}).get("count"),
            "likes": resp.get("likes", {}).get("count"),
            "link_clicks": resp.get("open_link", {}).get("count") or resp.get("link_clicks", {}).get("count"),
            "reach": resp.get("reach"),
            "feed_reach": resp.get("feed_reach"),
            "answer": resp.get("answer", {}).get("count"),
        }

    return {
        "method": "stories.getStats",
        "token_type": token_type,
        "step": {
            "step": 1,
            "name": "stories.getStats",
            "description": f"Получение статистики истории {owner_id}_{story_id} (токен: {token_type})",
            **step
        },
        "summary": summary,
    }


# ═══════════════════════════════════════════════
# Тест: stories.getViewers — зрители истории
# ═══════════════════════════════════════════════

def test_stories_get_viewers(
    owner_id: int,
    story_id: int,
    token: str,
    token_type: str,
    count: int = 10,
    offset: int = 0,
) -> Dict[str, Any]:
    """
    Тестирует stories.getViewers — получение списка зрителей истории.
    
    Параметры:
    - owner_id: ID владельца (для сообщества с минусом)
    - story_id: ID конкретной истории
    - token: токен для авторизации
    - token_type: тип токена ('user' / 'community' / 'service')
    - count: сколько зрителей запросить (по умолчанию 10 для теста)
    - offset: смещение для пагинации
    """
    step = _make_vk_request('stories.getViewers', {
        'owner_id': owner_id,
        'story_id': story_id,
        'count': count,
        'offset': offset,
        'extended': 1,
        'fields': 'photo_50,photo_100,sex,city',
        'access_token': token,
    })

    # Извлекаем краткую сводку
    summary = None
    if step["success"]:
        resp = step["response"].get("response", {})
        items = resp.get("items", [])
        summary = {
            "total_count": resp.get("count"),
            "returned_items": len(items),
            "reactions_count": resp.get("reactions_count"),
            "sample_viewers": [
                {
                    "user_id": v.get("user_id") or v.get("id"),
                    "is_liked": v.get("is_liked"),
                    "reaction_id": v.get("reaction_id"),
                }
                for v in items[:5]
            ],
        }

    return {
        "method": "stories.getViewers",
        "token_type": token_type,
        "step": {
            "step": 1,
            "name": "stories.getViewers",
            "description": f"Получение зрителей истории {owner_id}_{story_id} (токен: {token_type})",
            **step
        },
        "summary": summary,
    }


# ═══════════════════════════════════════════════
# Тест: stories.getViewers → users.get (детали зрителей)
# Двухэтапная цепочка как в автоматизации:
#   1) stories.getViewers → собираем user_ids + реакции
#   2) users.get → детальные данные (пол, возраст, город и т.д.)
# ═══════════════════════════════════════════════

USER_DETAIL_FIELDS = (
    'sex,bdate,city,country,photo_100,domain,'
    'has_mobile,last_seen,deactivated,is_closed,can_access_closed'
)


def test_stories_get_viewers_details(
    owner_id: int,
    story_id: int,
    token: str,
    token_type: str,
    count: int = 10,
) -> Dict[str, Any]:
    """
    Тестирует двухэтапную цепочку получения детальных данных зрителей:
    
    Шаг 1: stories.getViewers — получаем ID зрителей + реакции
    Шаг 2: users.get — получаем демографию (пол, возраст, город, страна и т.д.)
    
    Это воспроизводит логику из viewers_details.py в автоматизации.
    """
    steps = []

    # ───── Шаг 1: stories.getViewers (ID зрителей) ─────
    step1 = _make_vk_request('stories.getViewers', {
        'owner_id': owner_id,
        'story_id': story_id,
        'count': count,
        'offset': 0,
        'extended': 1,
        'access_token': token,
    })

    steps.append({
        "step": 1,
        "name": "stories.getViewers",
        "description": f"Получение ID зрителей истории {owner_id}_{story_id} (токен: {token_type})",
        **step1
    })

    if not step1["success"]:
        return {
            "method": "viewers_details",
            "token_type": token_type,
            "step": {
                "step": 1,
                "name": "viewers_details",
                "description": f"Ошибка на шаге 1: stories.getViewers (токен: {token_type})",
                "success": False,
                "request": step1.get("request"),
                "response": step1.get("response"),
                "http_status": step1.get("http_status"),
                "elapsed_ms": step1.get("elapsed_ms", 0),
                "error": step1.get("error"),
            },
            "chain_steps": steps,
            "summary": None,
        }

    # Парсим ответ getViewers — извлекаем user_ids и реакции
    viewers_resp = step1["response"].get("response", {})
    viewers_items = viewers_resp.get("items", [])
    total_count = viewers_resp.get("count", 0)
    reactions_count = viewers_resp.get("reactions_count", 0)

    user_ids = []
    reactions_map = {}

    for item in viewers_items:
        uid = item.get("user_id") or item.get("id")
        if uid:
            user_ids.append(uid)
            reactions_map[uid] = {
                "is_liked": item.get("is_liked", False),
                "reaction_id": item.get("reaction_id"),
            }

    if not user_ids:
        return {
            "method": "viewers_details",
            "token_type": token_type,
            "step": {
                "step": 1,
                "name": "viewers_details",
                "description": f"Нет зрителей для users.get (токен: {token_type})",
                "success": True,
                "request": steps[0].get("request") if steps else None,
                "response": step1.get("response"),
                "http_status": step1.get("http_status"),
                "elapsed_ms": step1.get("elapsed_ms", 0),
                "error": None,
            },
            "chain_steps": steps,
            "summary": {
                "total_viewers": total_count,
                "reactions_count": reactions_count,
                "fetched_ids": 0,
                "details_fetched": 0,
                "note": "Нет зрителей для запроса users.get",
            },
        }

    # ───── Шаг 2: users.get (детали пользователей) ─────
    step2 = _make_vk_request('users.get', {
        'user_ids': ','.join(str(uid) for uid in user_ids),
        'fields': USER_DETAIL_FIELDS,
        'access_token': token,
    })

    steps.append({
        "step": 2,
        "name": "users.get",
        "description": f"Получение детальных данных {len(user_ids)} зрителей (токен: {token_type})",
        **step2
    })

    if not step2["success"]:
        total_elapsed = sum(s.get("elapsed_ms", 0) for s in steps)
        return {
            "method": "viewers_details",
            "token_type": token_type,
            "step": {
                "step": 2,
                "name": "viewers_details",
                "description": f"Ошибка на шаге 2: users.get (токен: {token_type})",
                "success": False,
                "request": steps[1].get("request") if len(steps) > 1 else None,
                "response": step2.get("response"),
                "http_status": step2.get("http_status"),
                "elapsed_ms": total_elapsed,
                "error": step2.get("error"),
            },
            "chain_steps": steps,
            "summary": {
                "total_viewers": total_count,
                "reactions_count": reactions_count,
                "fetched_ids": len(user_ids),
                "details_fetched": 0,
                "users_get_error": step2.get("error"),
            },
        }

    # Парсим ответ users.get — собираем детали
    users_data = step2["response"].get("response", [])
    users_map = {u["id"]: u for u in users_data if isinstance(u, dict) and "id" in u}

    # Собираем объединённый список: viewer + user details
    merged_viewers = []
    for uid in user_ids:
        user_info = users_map.get(uid, {})
        reaction = reactions_map.get(uid, {})
        merged_viewers.append({
            "user_id": uid,
            "first_name": user_info.get("first_name"),
            "last_name": user_info.get("last_name"),
            "sex": user_info.get("sex"),
            "bdate": user_info.get("bdate"),
            "city": user_info.get("city", {}).get("title") if isinstance(user_info.get("city"), dict) else None,
            "country": user_info.get("country", {}).get("title") if isinstance(user_info.get("country"), dict) else None,
            "photo_100": user_info.get("photo_100"),
            "domain": user_info.get("domain"),
            "has_mobile": user_info.get("has_mobile"),
            "last_seen": user_info.get("last_seen"),
            "is_closed": user_info.get("is_closed"),
            "deactivated": user_info.get("deactivated"),
            "is_liked": reaction.get("is_liked", False),
            "reaction_id": reaction.get("reaction_id"),
        })

    # Считаем статистику по полу
    sex_stats = {"male": 0, "female": 0, "unknown": 0}
    has_bdate_count = 0
    has_city_count = 0
    for v in merged_viewers:
        if v["sex"] == 2:
            sex_stats["male"] += 1
        elif v["sex"] == 1:
            sex_stats["female"] += 1
        else:
            sex_stats["unknown"] += 1
        if v["bdate"]:
            has_bdate_count += 1
        if v["city"]:
            has_city_count += 1

    summary = {
        "total_viewers": total_count,
        "reactions_count": reactions_count,
        "fetched_ids": len(user_ids),
        "details_fetched": len(users_data),
        "sex_distribution": sex_stats,
        "has_bdate": has_bdate_count,
        "has_city": has_city_count,
        "sample_viewers": merged_viewers[:5],
        "fields_requested": USER_DETAIL_FIELDS,
    }

    total_elapsed = sum(s.get("elapsed_ms", 0) for s in steps)

    return {
        "method": "viewers_details",
        "token_type": token_type,
        "step": {
            "step": 1,
            "name": "viewers_details",
            "description": f"Цепочка getViewers→users.get: {len(user_ids)} зрителей (токен: {token_type})",
            "success": True,
            "request": steps[0].get("request") if steps else None,
            "response": step2["response"],
            "http_status": step2.get("http_status"),
            "elapsed_ms": total_elapsed,
            "error": None,
        },
        "chain_steps": steps,
        "summary": summary,
    }


# ═══════════════════════════════════════════════
# Комплексный тест: один метод × 3 токена
# ═══════════════════════════════════════════════

def run_method_with_all_tokens(
    method: str,
    group_id: int,
    story_id: Optional[int],
    user_token: Optional[str],
    user_non_admin_token: Optional[str],
    community_token: Optional[str],
    service_token: Optional[str],
    viewers_count: int = 10,
) -> Dict[str, Any]:
    """
    Запускает указанный VK API метод с каждым предоставленным токеном.
    Возвращает результаты для сравнения.
    
    method: 'stories.get' | 'stories.getStats' | 'stories.getViewers' | 'viewers_details'
    """
    results = []
    owner_id = -int(group_id)

    token_map = {
        "user": user_token,
        "user_non_admin": user_non_admin_token,
        "community": community_token,
        "service": service_token,
    }

    for token_type, token in token_map.items():
        if not token or not token.strip():
            results.append({
                "method": method,
                "token_type": token_type,
                "step": {
                    "step": 1,
                    "name": method,
                    "description": f"Пропущено — токен {token_type} не предоставлен",
                    "success": False,
                    "request": None,
                    "response": None,
                    "http_status": None,
                    "elapsed_ms": 0,
                    "error": {"message": f"Токен {token_type} не указан"}
                },
                "summary": None,
                "skipped": True,
            })
            continue

        if method == "stories.get":
            res = test_stories_get(group_id, token, token_type)
        elif method == "stories.getStats":
            if story_id is None:
                results.append({
                    "method": method,
                    "token_type": token_type,
                    "step": {
                        "step": 1,
                        "name": method,
                        "description": "Пропущено — не указан story_id",
                        "success": False,
                        "request": None,
                        "response": None,
                        "http_status": None,
                        "elapsed_ms": 0,
                        "error": {"message": "story_id обязателен для stories.getStats"}
                    },
                    "summary": None,
                    "skipped": True,
                })
                continue
            res = test_stories_get_stats(owner_id, story_id, token, token_type)
        elif method == "stories.getViewers":
            if story_id is None:
                results.append({
                    "method": method,
                    "token_type": token_type,
                    "step": {
                        "step": 1,
                        "name": method,
                        "description": "Пропущено — не указан story_id",
                        "success": False,
                        "request": None,
                        "response": None,
                        "http_status": None,
                        "elapsed_ms": 0,
                        "error": {"message": "story_id обязателен для stories.getViewers"}
                    },
                    "summary": None,
                    "skipped": True,
                })
                continue
            res = test_stories_get_viewers(owner_id, story_id, token, token_type, count=viewers_count)
        elif method == "viewers_details":
            if story_id is None:
                results.append({
                    "method": method,
                    "token_type": token_type,
                    "step": {
                        "step": 1,
                        "name": method,
                        "description": "Пропущено — не указан story_id",
                        "success": False,
                        "request": None,
                        "response": None,
                        "http_status": None,
                        "elapsed_ms": 0,
                        "error": {"message": "story_id обязателен для viewers_details"}
                    },
                    "summary": None,
                    "skipped": True,
                })
                continue
            res = test_stories_get_viewers_details(owner_id, story_id, token, token_type, count=viewers_count)
        else:
            results.append({
                "method": method,
                "token_type": token_type,
                "step": {
                    "step": 1,
                    "name": method,
                    "description": f"Неизвестный метод: {method}",
                    "success": False,
                    "request": None,
                    "response": None,
                    "http_status": None,
                    "elapsed_ms": 0,
                    "error": {"message": f"Неизвестный метод: {method}"}
                },
                "summary": None,
            })
            continue

        results.append(res)

    return {
        "method": method,
        "group_id": group_id,
        "story_id": story_id,
        "results_by_token": results,
        "tokens_tested": len([r for r in results if not r.get("skipped")]),
        "tokens_success": len([r for r in results if r["step"]["success"]]),
    }


# ═══════════════════════════════════════════════
# Полный тест: все 3 метода × все токены
# ═══════════════════════════════════════════════

def run_full_stories_data_test(
    group_id: int,
    story_id: Optional[int],
    user_token: Optional[str],
    user_non_admin_token: Optional[str],
    community_token: Optional[str],
    service_token: Optional[str],
    viewers_count: int = 10,
) -> Dict[str, Any]:
    """
    Запускает все 4 метода (stories.get, stories.getStats, stories.getViewers, viewers_details)
    с каждым из предоставленных токенов.
    Возвращает матрицу результатов: метод × токен.
    """
    methods = ["stories.get", "stories.getStats", "stories.getViewers", "viewers_details"]
    all_results = []

    for method in methods:
        result = run_method_with_all_tokens(
            method=method,
            group_id=group_id,
            story_id=story_id,
            user_token=user_token,
            user_non_admin_token=user_non_admin_token,
            community_token=community_token,
            service_token=service_token,
            viewers_count=viewers_count,
        )
        all_results.append(result)

    # Формируем сводную матрицу
    matrix = {}
    for method_result in all_results:
        method_name = method_result["method"]
        matrix[method_name] = {}
        for token_result in method_result["results_by_token"]:
            token_type = token_result["token_type"]
            matrix[method_name][token_type] = {
                "success": token_result["step"]["success"],
                "skipped": token_result.get("skipped", False),
                "error_code": (token_result["step"].get("error") or {}).get("error_code"),
                "error_msg": (token_result["step"].get("error") or {}).get("error_msg"),
                "elapsed_ms": token_result["step"]["elapsed_ms"],
            }

    return {
        "overall_results": all_results,
        "matrix": matrix,
        "group_id": group_id,
        "story_id": story_id,
    }
