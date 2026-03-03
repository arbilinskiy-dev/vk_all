"""
Сервис автоматической настройки VK Callback API — ХАБ-МОДУЛЬ.

Тонкий хаб: импортирует и реэкспортирует всё из подмодулей.
Внешний контракт (from services.callback_setup import ...) НЕ изменён.

Подмодули:
- callback_constants.py  — URL, имена серверов, списки событий
- callback_vk_client.py  — обёртки VK API (groups.*)
- callback_utils.py      — обнаружение ngrok/SSH туннелей
- callback_service.py    — главная функция auto_setup_callback
"""

# ─── Константы ────────────────────────────────────────────────────
from services.callback_constants import (
    VM_CALLBACK_URL,
    VM_TUNNEL_CALLBACK_URL,
    SERVER_NAME_PROD,
    SERVER_NAME_LOCAL,
    NGROK_API_URL,
    VK_SETTABLE_EVENTS,
    VK_ALWAYS_ON_EVENTS,
    DEFAULT_CALLBACK_EVENTS,
)

# ─── VK API клиент ───────────────────────────────────────────────
from services.callback_vk_client import (
    get_callback_servers,
    get_confirmation_code,
    add_callback_server,
    edit_callback_server,
    set_callback_settings,
    get_callback_settings,
    find_server_by_title,
)

# ─── Утилиты сети ────────────────────────────────────────────────
from services.callback_utils import (
    detect_ngrok_url,
    detect_ssh_tunnel,
)

# ─── Главный сервис ──────────────────────────────────────────────
from services.callback_service import auto_setup_callback

# Публичный контракт модуля (для IDE и статического анализа)
__all__ = [
    # Константы
    "VM_CALLBACK_URL",
    "VM_TUNNEL_CALLBACK_URL",
    "SERVER_NAME_PROD",
    "SERVER_NAME_LOCAL",
    "NGROK_API_URL",
    "VK_SETTABLE_EVENTS",
    "VK_ALWAYS_ON_EVENTS",
    "DEFAULT_CALLBACK_EVENTS",
    # VK API клиент
    "get_callback_servers",
    "get_confirmation_code",
    "add_callback_server",
    "edit_callback_server",
    "set_callback_settings",
    "get_callback_settings",
    "find_server_by_title",
    # Утилиты
    "detect_ngrok_url",
    "detect_ssh_tunnel",
    # Главный сервис
    "auto_setup_callback",
]
