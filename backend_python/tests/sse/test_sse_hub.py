"""Тесты для hub-файла sse_manager.py — SSEManager singleton и реэкспорт."""

import asyncio
import pytest
from unittest.mock import patch

from services.sse_manager import SSEManager, SSEEvent, sse_manager
from services.sse_dialog_focus_mixin import SSEDialogFocusMixin
from services.sse_global_mixin import SSEGlobalMixin
from services.sse_redis_mixin import SSERedisMixin


def _run(coro):
    """Хелпер: запускает корутину в новом event loop."""
    return asyncio.get_event_loop_policy().new_event_loop().run_until_complete(coro)


class TestSSEManagerSingleton:
    """Проверка singleton-экземпляра sse_manager."""

    def test_singleton_is_instance_of_sse_manager(self):
        """sse_manager — экземпляр SSEManager."""
        assert isinstance(sse_manager, SSEManager)

    def test_singleton_has_instance_id(self):
        """Singleton имеет уникальный _instance_id (8 символов)."""
        assert hasattr(sse_manager, "_instance_id")
        assert isinstance(sse_manager._instance_id, str)
        assert len(sse_manager._instance_id) == 8


class TestSSEManagerInheritance:
    """Проверка наследования SSEManager от всех трёх миксинов."""

    def test_inherits_dialog_focus_mixin(self):
        """SSEManager наследует SSEDialogFocusMixin."""
        assert issubclass(SSEManager, SSEDialogFocusMixin)

    def test_inherits_global_mixin(self):
        """SSEManager наследует SSEGlobalMixin."""
        assert issubclass(SSEManager, SSEGlobalMixin)

    def test_inherits_redis_mixin(self):
        """SSEManager наследует SSERedisMixin."""
        assert issubclass(SSEManager, SSERedisMixin)


class TestSSEManagerReexports:
    """Проверка реэкспорта SSEEvent из hub-файла."""

    def test_sse_event_importable_from_hub(self):
        """SSEEvent доступен через import из services.sse_manager."""
        assert SSEEvent is not None
        # Класс SSEEvent должен быть dataclass с полем event_type
        evt = SSEEvent(event_type="test", project_id="p1", data={})
        assert evt.event_type == "test"


class TestSSEManagerPublicMethods:
    """Все публичные методы доступны на экземпляре SSEManager."""

    @pytest.fixture
    def manager(self):
        """Создаём чистый экземпляр для каждого теста."""
        return SSEManager()

    @pytest.mark.parametrize("method_name", [
        "subscribe",
        "unsubscribe",
        "publish",
        "get_stats",
        "initialize_loop",
        # Методы SSEDialogFocusMixin
        "set_dialog_focus",
        "remove_dialog_focus",
        "get_dialog_focus",
        "get_all_dialog_focuses",
        # Методы SSEGlobalMixin
        "subscribe_global",
        "unsubscribe_global",
        "publish_global",
        "publish_global_via_redis",
        # Методы SSERedisMixin
        "publish_via_redis",
        "start_redis_listener",
    ])
    def test_public_method_exists(self, manager, method_name):
        """Метод {method_name} доступен на экземпляре SSEManager."""
        assert hasattr(manager, method_name), f"Метод {method_name} не найден"
        assert callable(getattr(manager, method_name))


class TestSSEManagerGetStats:
    """Тесты метода get_stats."""

    def test_get_stats_returns_dict(self):
        """get_stats возвращает словарь со всеми ключами."""
        mgr = SSEManager()
        stats = mgr.get_stats()
        assert isinstance(stats, dict)
        assert "total_connections" in stats
        assert "global_connections" in stats
        assert "global_lvc_cached" in stats
        assert "projects" in stats
        assert "redis_listener_active" in stats

    def test_get_stats_initial_values(self):
        """Начальная статистика — все нули."""
        mgr = SSEManager()
        stats = mgr.get_stats()
        assert stats["total_connections"] == 0
        assert stats["global_connections"] == 0
        assert stats["global_lvc_cached"] == 0
        assert stats["projects"] == {}
        assert stats["redis_listener_active"] is False


class TestSSEManagerSubscribeUnsubscribe:
    """Тесты subscribe/unsubscribe на hub-уровне."""

    def test_subscribe_returns_queue(self):
        """subscribe возвращает asyncio.Queue."""
        async def _inner():
            mgr = SSEManager()
            queue = mgr.subscribe("proj_1", manager_id="m1", manager_name="Иван")
            assert isinstance(queue, asyncio.Queue)
        _run(_inner())

    def test_subscribe_increments_stats(self):
        """Подписка увеличивает счётчик подключений."""
        async def _inner():
            mgr = SSEManager()
            mgr.subscribe("proj_1", manager_id="m1")
            mgr.subscribe("proj_1", manager_id="m2")
            stats = mgr.get_stats()
            assert stats["total_connections"] == 2
            assert stats["projects"]["proj_1"] == 2
        _run(_inner())

    def test_unsubscribe_decrements_stats(self):
        """Отписка уменьшает счётчик подключений."""
        async def _inner():
            mgr = SSEManager()
            q = mgr.subscribe("proj_1", manager_id="m1")
            mgr.unsubscribe("proj_1", q)
            stats = mgr.get_stats()
            assert stats["total_connections"] == 0
        _run(_inner())

    def test_publish_delivers_to_subscribers(self):
        """publish доставляет событие подписчикам проекта."""
        async def _inner():
            mgr = SSEManager()
            q = mgr.subscribe("proj_1")
            event = SSEEvent(event_type="new_message", project_id="proj_1", data={"text": "hi"})
            mgr.publish(event)
            # Даём event loop время обработать call_soon_threadsafe
            await asyncio.sleep(0.05)
            assert not q.empty()
            sse_str = q.get_nowait()
            assert "new_message" in sse_str
        _run(_inner())
