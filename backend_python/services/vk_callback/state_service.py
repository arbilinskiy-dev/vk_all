"""
Сервис получения текущего состояния Callback для проекта.
Бизнес-логика, вынесенная из routers/vk_callback.py (get_current_callback_state).

Отвечает за:
1. Получение списка серверов из VK API
2. Поиск нашего сервера (smmit / smmitloc)
3. Получение настроек событий для найденного сервера
"""
import logging
from typing import Dict, Any

from services.callback_setup import (
    get_callback_servers,
    get_callback_settings,
    SERVER_NAME_PROD,
    SERVER_NAME_LOCAL,
    find_server_by_title,
)

logger = logging.getLogger(__name__)


def get_callback_state(
    group_id: int,
    token: str,
    project_name: str,
    is_local: bool,
) -> Dict[str, Any]:
    """
    Получает полное текущее состояние callback для группы VK.

    Возвращает dict:
    - found: bool
    - server: dict | None
    - events: dict
    - enabled_events: list
    - enabled_count: int
    """
    # Получаем список серверов
    logger.info(
        f"[CALLBACK-STATE] 🔍 Запрос списка серверов из VK API "
        f"(groups.getCallbackServers, group_id={group_id})"
    )
    servers = get_callback_servers(group_id, token)
    logger.info(f"[CALLBACK-STATE] 📊 Найдено серверов в группе: {len(servers)}")
    for s in servers:
        logger.info(
            f"[CALLBACK-STATE]   → id={s.get('id')}, title=\"{s.get('title')}\", "
            f"url={s.get('url')}, status={s.get('status')}"
        )

    # Ищем наш сервер: в локальном режиме сначала smmitloc, иначе smmit
    our_server = _find_our_server(servers, is_local)

    if not our_server:
        logger.info(
            f"[CALLBACK-STATE] ⚠️ Наш сервер ({SERVER_NAME_PROD}/{SERVER_NAME_LOCAL}) "
            f"НЕ найден в группе {group_id}"
        )
        return {
            "found": False,
            "server": None,
            "events": {},
            "enabled_events": [],
            "enabled_count": 0,
        }

    logger.info(
        f"[CALLBACK-STATE] ✅ Найден наш сервер: \"{our_server.get('title')}\" "
        f"(id={our_server.get('id')}, status={our_server.get('status')})"
    )

    # Получаем настройки событий для найденного сервера
    events, enabled_events = _get_server_events(group_id, our_server["id"], token)

    return {
        "found": True,
        "server": our_server,
        "events": events,
        "enabled_events": enabled_events,
        "enabled_count": len(enabled_events),
    }


def _find_our_server(servers: list, is_local: bool) -> dict | None:
    """Ищет наш callback-сервер среди серверов группы."""
    if is_local:
        our_server = find_server_by_title(servers, SERVER_NAME_LOCAL)
        if not our_server:
            our_server = find_server_by_title(servers, SERVER_NAME_PROD)
    else:
        our_server = find_server_by_title(servers, SERVER_NAME_PROD)
        if not our_server:
            our_server = find_server_by_title(servers, SERVER_NAME_LOCAL)
    return our_server


def _get_server_events(
    group_id: int,
    server_id: int,
    token: str,
) -> tuple[dict, list]:
    """Получает настройки событий для сервера. Возвращает (events_dict, enabled_list)."""
    logger.info(
        f"[CALLBACK-STATE] 🔍 Запрос настроек событий "
        f"(groups.getCallbackSettings, server_id={server_id})"
    )
    settings = get_callback_settings(
        group_id=group_id,
        server_id=server_id,
        access_token=token,
    )
    events = settings.get("events", {})
    enabled_events = [k for k, v in events.items() if v == 1]
    disabled_events = [k for k, v in events.items() if v == 0]

    logger.info(
        f"[CALLBACK-STATE] 📊 Включено событий: {len(enabled_events)}, "
        f"выключено: {len(disabled_events)}"
    )
    if enabled_events:
        logger.info(
            f"[CALLBACK-STATE] ✅ Включённые: "
            f"{', '.join(enabled_events[:10])}{'...' if len(enabled_events) > 10 else ''}"
        )

    return events, enabled_events
