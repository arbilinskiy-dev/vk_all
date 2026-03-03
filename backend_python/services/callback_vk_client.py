"""
VK API клиент для Callback API.

Обёртки над методами VK API для работы с Callback-серверами:
- groups.getCallbackConfirmationCode
- groups.getCallbackServers
- groups.addCallbackServer
- groups.editCallbackServer
- groups.setCallbackSettings
- groups.getCallbackSettings
"""

import logging
from typing import Optional, Dict, Any, List

from services.vk_api.api_client import call_vk_api as raw_call_vk_api, VkApiError
from services.callback_constants import VK_SETTABLE_EVENTS, DEFAULT_CALLBACK_EVENTS

logger = logging.getLogger("callback_setup")


def _vk_api_call(method: str, params: Dict[str, Any]) -> Any:
    """Обёртка для вызова VK API с логированием."""
    logger.info(f"VK API → {method}")
    result = raw_call_vk_api(method, params)
    return result


def get_callback_servers(group_id: int, access_token: str) -> List[Dict]:
    """Получает список Callback-серверов группы."""
    result = _vk_api_call("groups.getCallbackServers", {
        "group_id": group_id,
        "access_token": access_token,
    })
    return result.get("items", []) if isinstance(result, dict) else []


def get_confirmation_code(group_id: int, access_token: str) -> str:
    """Получает код подтверждения для Callback API."""
    result = _vk_api_call("groups.getCallbackConfirmationCode", {
        "group_id": group_id,
        "access_token": access_token,
    })
    code = result.get("code", "") if isinstance(result, dict) else str(result)
    return code


def add_callback_server(
    group_id: int, url: str, title: str, access_token: str, secret_key: str = ""
) -> int:
    """Добавляет новый Callback-сервер. Возвращает server_id."""
    params = {
        "group_id": group_id,
        "url": url,
        "title": title,
        "access_token": access_token,
    }
    if secret_key:
        params["secret_key"] = secret_key
    result = _vk_api_call("groups.addCallbackServer", params)
    server_id = result.get("server_id") if isinstance(result, dict) else result
    return int(server_id)


def edit_callback_server(
    group_id: int, server_id: int, url: str, title: str, access_token: str, secret_key: str = ""
) -> bool:
    """Редактирует существующий Callback-сервер. Возвращает True при успехе."""
    params = {
        "group_id": group_id,
        "server_id": server_id,
        "url": url,
        "title": title,
        "access_token": access_token,
    }
    if secret_key:
        params["secret_key"] = secret_key
    _vk_api_call("groups.editCallbackServer", params)
    return True


def set_callback_settings(
    group_id: int, server_id: int, access_token: str,
    events: Optional[Dict[str, int]] = None
) -> bool:
    """
    Настраивает типы событий для Callback-сервера.
    
    Отправляет ТОЛЬКО параметры, которые принимает VK API
    groups.setCallbackSettings (VK_SETTABLE_EVENTS).
    Невалидные параметры фильтруются, иначе VK вернёт ошибку 100.
    """
    params = {
        "group_id": group_id,
        "server_id": server_id,
        "access_token": access_token,
        "api_version": "5.199",
    }
    
    # Добавляем события, фильтруя только допустимые VK API
    event_settings = events or DEFAULT_CALLBACK_EVENTS
    settable_set = set(VK_SETTABLE_EVENTS)
    
    enabled_count = 0
    disabled_count = 0
    skipped = []
    
    for event_key, value in event_settings.items():
        if event_key in settable_set:
            params[event_key] = value
            if value:
                enabled_count += 1
            else:
                disabled_count += 1
        else:
            skipped.append(event_key)
    
    if skipped:
        logger.info(
            f"Пропущены ненастраиваемые события (VK включает их автоматически): {skipped}"
        )
    logger.info(
        f"setCallbackSettings: включено={enabled_count}, выключено={disabled_count}, "
        f"пропущено={len(skipped)}"
    )
    
    _vk_api_call("groups.setCallbackSettings", params)
    return True


def get_callback_settings(group_id: int, server_id: int, access_token: str) -> Dict[str, Any]:
    """
    Получает текущие настройки событий (подписку) Callback-сервера.
    
    Вызывает VK API groups.getCallbackSettings.
    Возвращает словарь вида {"events": {"message_new": 1, "wall_post_new": 0, ...}, "api_version": "5.199"}
    
    Если сервер не найден или ошибка — возвращает пустой словарь.
    """
    logger.info(f"[CALLBACK-SETTINGS] 🔍 VK API groups.getCallbackSettings: group_id={group_id}, server_id={server_id}")
    try:
        result = _vk_api_call("groups.getCallbackSettings", {
            "group_id": group_id,
            "server_id": server_id,
            "access_token": access_token,
        })
        if isinstance(result, dict):
            events = result.get("events", {})
            enabled = [k for k, v in events.items() if v == 1]
            logger.info(f"[CALLBACK-SETTINGS] ✅ Получено: {len(events)} событий всего, {len(enabled)} включено")
            return result
        else:
            logger.warning(f"[CALLBACK-SETTINGS] ⚠️ Неожиданный формат ответа: {type(result)}")
            return {}
    except VkApiError as e:
        logger.warning(f"[CALLBACK-SETTINGS] ❌ VK API ошибка (server_id={server_id}): {e}")
        return {}
    except Exception as e:
        logger.error(f"[CALLBACK-SETTINGS] ❌ Непредвиденная ошибка: {e}")
        return {}


def find_server_by_title(servers: List[Dict], title: str) -> Optional[Dict]:
    """Ищет сервер по названию (title) в списке серверов."""
    for server in servers:
        if server.get("title") == title:
            return server
    return None
