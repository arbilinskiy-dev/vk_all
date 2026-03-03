"""
Сервис автоматической настройки VK Callback API.

Содержит главную функцию auto_setup_callback, которая автоматически
создаёт / обновляет Callback-сервер в группе VK.
"""

import logging
from typing import Optional, Dict, Any

from services.vk_api.api_client import VkApiError
from services.callback_constants import (
    VM_CALLBACK_URL,
    VM_TUNNEL_CALLBACK_URL,
    SERVER_NAME_PROD,
    SERVER_NAME_LOCAL,
    DEFAULT_CALLBACK_EVENTS,
)
from services.callback_vk_client import (
    get_confirmation_code,
    get_callback_servers,
    add_callback_server,
    edit_callback_server,
    set_callback_settings,
    find_server_by_title,
)
from services.callback_utils import detect_ngrok_url

logger = logging.getLogger("callback_setup")


def auto_setup_callback(
    group_id: int,
    community_token: str,
    is_local: bool = False,
    use_tunnel: bool = False,
    events: Optional[Dict[str, int]] = None,
) -> Dict[str, Any]:
    """
    Автоматическая настройка Callback API для группы VK.
    
    Алгоритм:
    1. Получаем confirmation code через API
    2. Получаем список существующих серверов
    3. Определяем callback URL:
       - Продакшен → VM_CALLBACK_URL (https://api.dosmmit.ru/api/vk/callback)
       - Локалка → ngrok URL + /api/vk/callback
    4. Если сервер с нужным именем уже есть → editCallbackServer
       Если нет → addCallbackServer
    5. Подписываем на все события (setCallbackSettings)
    6. Возвращаем результат с confirmation_code и деталями
    
    Args:
        group_id: ID группы VK (положительное число)
        community_token: Токен сообщества с правами управления
        is_local: True если работаем с локальной версией (ищем ngrok)
        
    Returns:
        dict с полями:
        - success: bool
        - confirmation_code: str — код подтверждения (нужно сохранить в проекте)
        - server_name: str — "smmit" или "smmitloc"
        - server_id: int — ID сервера в VK
        - callback_url: str — URL на который настроен сервер
        - action: str — "created" или "updated"
        - message: str — человеко-читаемое описание
        - ngrok_url: str | None — обнаруженный ngrok URL (только для локалки)
    """
    result = {
        "success": False,
        "confirmation_code": "",
        "server_name": "",
        "server_id": 0,
        "callback_url": "",
        "action": "",
        "message": "",
        "ngrok_url": None,
        "error_code": None,
    }
    
    try:
        # Шаг 1: Получаем confirmation code
        logger.info(f"Шаг 1: Получаем confirmation code для group_id={group_id}")
        confirmation_code = get_confirmation_code(group_id, community_token)
        if not confirmation_code:
            result["message"] = "Не удалось получить код подтверждения от VK"
            return result
        result["confirmation_code"] = confirmation_code
        logger.info(f"Confirmation code получен: {confirmation_code}")
        
        # Шаг 2: Определяем callback URL и имя сервера
        if use_tunnel:
            # Режим SSH tunnel: через VM без ngrok (тот же сервер smmitloc)
            server_name = SERVER_NAME_LOCAL
            callback_url = VM_TUNNEL_CALLBACK_URL
            logger.info(f"SSH Tunnel режим: callback={callback_url}")
        elif is_local:
            server_name = SERVER_NAME_LOCAL
            ngrok_url = detect_ngrok_url()
            if not ngrok_url:
                result["message"] = (
                    "Ngrok не обнаружен. Убедитесь, что ngrok запущен "
                    "(команда: ngrok http 8000) и попробуйте снова."
                )
                return result
            callback_url = f"{ngrok_url}/api/vk/callback"
            result["ngrok_url"] = ngrok_url
            logger.info(f"Локальный режим: ngrok={ngrok_url}, callback={callback_url}")
        else:
            server_name = SERVER_NAME_PROD
            callback_url = VM_CALLBACK_URL
            logger.info(f"Продакшен режим: callback={callback_url}")
        
        result["server_name"] = server_name
        result["callback_url"] = callback_url
        
        # Шаг 3: Получаем список существующих серверов
        logger.info(f"Шаг 3: Получаем список Callback-серверов group_id={group_id}")
        servers = get_callback_servers(group_id, community_token)
        logger.info(f"Найдено серверов: {len(servers)}")
        for s in servers:
            logger.info(f"  → id={s.get('id')}, title='{s.get('title')}', url={s.get('url')}, status={s.get('status')}")
        
        # Шаг 4: Создаём или редактируем сервер
        existing = find_server_by_title(servers, server_name)
        
        if existing:
            server_id = existing["id"]
            existing_url = existing.get("url", "")
            existing_status = existing.get("status", "")
            
            if existing_url == callback_url and existing_status == "ok":
                # URL совпадает и сервер работает → НЕ трогаем сервер,
                # только обновляем подписку на события ниже
                result["action"] = "events_updated"
                result["server_id"] = server_id
                logger.info(
                    f"Сервер '{server_name}' (id={server_id}) уже настроен "
                    f"на {callback_url}, статус=ok. Обновляем только подписку на события."
                )
            else:
                # URL изменился или сервер в нерабочем статусе → обновляем
                logger.info(
                    f"Сервер '{server_name}' (id={server_id}): "
                    f"url={'совпадает' if existing_url == callback_url else f'{existing_url} → {callback_url}'}, "
                    f"status={existing_status}. Обновляем..."
                )
                edit_callback_server(
                    group_id=group_id,
                    server_id=server_id,
                    url=callback_url,
                    title=server_name,
                    access_token=community_token,
                )
                result["action"] = "updated"
                result["server_id"] = server_id
                logger.info(f"Сервер '{server_name}' обновлён: url={callback_url}")
        else:
            # Сервера нет → создаём новый
            logger.info(f"Сервер '{server_name}' не найден. Создаём новый...")
            server_id = add_callback_server(
                group_id=group_id,
                url=callback_url,
                title=server_name,
                access_token=community_token,
            )
            result["action"] = "created"
            result["server_id"] = server_id
            logger.info(f"Сервер '{server_name}' создан: id={server_id}, url={callback_url}")
        
        # Шаг 5: Настраиваем подписку на события
        selected_events = events or DEFAULT_CALLBACK_EVENTS
        logger.info(f"Шаг 5: Настраиваем подписку на {len(selected_events)} событий для server_id={result['server_id']}")
        set_callback_settings(
            group_id=group_id,
            server_id=result["server_id"],
            access_token=community_token,
            events=selected_events,
        )
        logger.info("Подписка на события настроена")
        
        # Готово!
        action_texts = {
            "created": "создан",
            "updated": "обновлён",
            "events_updated": "уже настроен, подписка обновлена",
        }
        action_text = action_texts.get(result["action"], result["action"])
        env_text = f"ngrok: {result['ngrok_url']}" if is_local else "VM: api.dosmmit.ru"
        result["success"] = True
        result["events_count"] = len(selected_events)
        result["message"] = (
            f"Callback-сервер \"{server_name}\" {action_text} "
            f"({env_text}). Подписка на {len(selected_events)} событий настроена."
        )
        
        return result
        
    except VkApiError as e:
        error_msg = f"Ошибка VK API: {e}"
        logger.error(error_msg)
        result["message"] = error_msg
        result["error_code"] = e.code
        return result
    except Exception as e:
        error_msg = f"Непредвиденная ошибка: {e}"
        logger.error(error_msg, exc_info=True)
        result["message"] = error_msg
        return result
