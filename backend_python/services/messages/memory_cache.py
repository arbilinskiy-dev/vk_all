"""
In-memory кэш сообщений (TTL 5 мин).
Используется для снижения нагрузки на БД при повторных запросах.
"""

import time
import threading
from typing import Optional, Dict, Any


# =============================================================================
# IN-MEMORY КЭШ (TTL 5 мин) — чтобы не дёргать БД при повторных запросах
# =============================================================================
_memory_cache: Dict[str, Any] = {}  # ключ: "project_id:user_id:offset:limit" → {data, ts}
_memory_cache_lock = threading.Lock()
_MEMORY_TTL = 300  # 5 минут


def mem_cache_key(project_id: str, user_id: int, offset: int, limit: int) -> str:
    """Формирует ключ memory-кэша."""
    return f"{project_id}:{user_id}:{offset}:{limit}"


def mem_get(key: str) -> Optional[Dict]:
    """Читает данные из memory-кэша. Возвращает None если просрочено или нет."""
    with _memory_cache_lock:
        entry = _memory_cache.get(key)
        if entry and (time.time() - entry["ts"]) < _MEMORY_TTL:
            return entry["data"]
        if entry:
            del _memory_cache[key]
    return None


def mem_set(key: str, data: Dict):
    """Записывает данные в memory-кэш."""
    with _memory_cache_lock:
        _memory_cache[key] = {"data": data, "ts": time.time()}


def mem_invalidate_dialog(project_id: str, user_id: int):
    """Инвалидирует весь memory-кэш для диалога."""
    prefix = f"{project_id}:{user_id}:"
    with _memory_cache_lock:
        keys_to_del = [k for k in _memory_cache if k.startswith(prefix)]
        for k in keys_to_del:
            del _memory_cache[k]
