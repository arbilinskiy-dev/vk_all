"""
Тесты для services/messages/memory_cache.py — in-memory кэш (TTL 5 мин).
"""

import time
import pytest
from unittest.mock import patch

from services.messages.memory_cache import (
    mem_cache_key,
    mem_get,
    mem_set,
    mem_invalidate_dialog,
    _memory_cache,
    _memory_cache_lock,
)


class TestMemCacheKey:
    """Тесты формирования ключа."""

    def test_key_format(self):
        key = mem_cache_key("proj-1", 12345, 0, 50)
        assert key == "proj-1:12345:0:50"

    def test_key_with_large_offset(self):
        key = mem_cache_key("proj-1", 99999, 200, 100)
        assert key == "proj-1:99999:200:100"


class TestMemGetSet:
    """Тесты записи и чтения из кэша."""

    def setup_method(self):
        """Очищаем кэш перед каждым тестом."""
        with _memory_cache_lock:
            _memory_cache.clear()

    def test_set_and_get(self):
        data = {"items": [1, 2, 3], "count": 3}
        mem_set("test-key", data)
        result = mem_get("test-key")
        assert result == data

    def test_get_missing_key_returns_none(self):
        result = mem_get("nonexistent-key")
        assert result is None

    def test_expired_entry_returns_none(self):
        """Просроченная запись возвращает None и удаляется."""
        with _memory_cache_lock:
            _memory_cache["expired-key"] = {
                "data": {"items": []},
                "ts": time.time() - 400,  # Старше 5 минут
            }
        result = mem_get("expired-key")
        assert result is None
        # Запись должна быть удалена
        assert "expired-key" not in _memory_cache

    def test_fresh_entry_returns_data(self):
        """Свежая запись возвращает данные."""
        data = {"items": [1]}
        with _memory_cache_lock:
            _memory_cache["fresh-key"] = {"data": data, "ts": time.time()}
        result = mem_get("fresh-key")
        assert result == data

    def test_overwrite_existing_key(self):
        mem_set("key", {"v": 1})
        mem_set("key", {"v": 2})
        assert mem_get("key") == {"v": 2}


class TestMemInvalidateDialog:
    """Тесты инвалидации кэша диалога."""

    def setup_method(self):
        with _memory_cache_lock:
            _memory_cache.clear()

    def test_invalidate_removes_matching_keys(self):
        mem_set("proj-1:100:0:50", {"d": 1})
        mem_set("proj-1:100:50:50", {"d": 2})
        mem_set("proj-1:200:0:50", {"d": 3})  # Другой пользователь — не трогаем

        mem_invalidate_dialog("proj-1", 100)

        assert mem_get("proj-1:100:0:50") is None
        assert mem_get("proj-1:100:50:50") is None
        assert mem_get("proj-1:200:0:50") is not None  # Остался

    def test_invalidate_empty_cache_no_error(self):
        """Инвалидация пустого кэша — без ошибок."""
        mem_invalidate_dialog("proj-1", 100)  # Не должно падать

    def test_invalidate_no_matching_keys(self):
        mem_set("proj-2:300:0:50", {"d": 1})
        mem_invalidate_dialog("proj-1", 100)
        assert mem_get("proj-2:300:0:50") is not None
