"""Тесты для sse_global_mixin.py — глобальная подписка SSE."""

import asyncio
import pytest
from unittest.mock import MagicMock, patch

from services.sse_manager import SSEManager
from services.sse_event import SSEEvent


def _run(coro):
    """Хелпер: запускает корутину в новом event loop."""
    return asyncio.get_event_loop_policy().new_event_loop().run_until_complete(coro)


class TestSubscribeGlobal:
    """Тесты subscribe_global — глобальная подписка."""

    def test_returns_queue(self):
        """subscribe_global возвращает asyncio.Queue."""
        async def _inner():
            mgr = SSEManager()
            q = mgr.subscribe_global()
            assert isinstance(q, asyncio.Queue)
        _run(_inner())

    def test_increments_global_count(self):
        """Подписка увеличивает счётчик глобальных подписчиков."""
        async def _inner():
            mgr = SSEManager()
            mgr.subscribe_global()
            mgr.subscribe_global()
            stats = mgr.get_stats()
            assert stats["global_connections"] == 2
        _run(_inner())

    def test_lvc_replay_on_subscribe(self):
        """Новый подписчик получает кешированные LVC-события."""
        async def _inner():
            mgr = SSEManager()
            # Публикуем событие ДО подписки
            event = SSEEvent(event_type="unread_update", project_id="p1", data={"count": 5})
            mgr.publish_global(event)
            # Подписываемся — должны получить LVC
            q = mgr.subscribe_global()
            assert not q.empty()
            sse_str = q.get_nowait()
            assert "unread_update" in sse_str
        _run(_inner())


class TestUnsubscribeGlobal:
    """Тесты unsubscribe_global — отписка."""

    def test_decrements_global_count(self):
        """Отписка уменьшает счётчик."""
        async def _inner():
            mgr = SSEManager()
            q = mgr.subscribe_global()
            mgr.unsubscribe_global(q)
            stats = mgr.get_stats()
            assert stats["global_connections"] == 0
        _run(_inner())

    def test_unsubscribe_idempotent(self):
        """Повторная отписка не вызывает ошибки."""
        async def _inner():
            mgr = SSEManager()
            q = mgr.subscribe_global()
            mgr.unsubscribe_global(q)
            mgr.unsubscribe_global(q)  # Повторно — без ошибки
            stats = mgr.get_stats()
            assert stats["global_connections"] == 0
        _run(_inner())


class TestPublishGlobal:
    """Тесты publish_global — рассылка глобального события."""

    def test_delivers_to_all_subscribers(self):
        """Событие доставляется всем глобальным подписчикам."""
        async def _inner():
            mgr = SSEManager()
            q1 = mgr.subscribe_global()
            q2 = mgr.subscribe_global()
            # Очищаем LVC-replay
            while not q1.empty():
                q1.get_nowait()
            while not q2.empty():
                q2.get_nowait()

            event = SSEEvent(event_type="unread_update", project_id="p1", data={"count": 3})
            mgr.publish_global(event)
            await asyncio.sleep(0.05)  # ждём call_soon_threadsafe
            assert not q1.empty()
            assert not q2.empty()
        _run(_inner())

    def test_caches_in_lvc(self):
        """publish_global сохраняет событие в LVC даже без подписчиков."""
        mgr = SSEManager()
        event = SSEEvent(event_type="unread_update", project_id="p1", data={"count": 7})
        mgr.publish_global(event)
        stats = mgr.get_stats()
        assert stats["global_lvc_cached"] == 1

    def test_lvc_overwrites_per_project(self):
        """LVC хранит последнее событие по project_id."""
        async def _inner():
            mgr = SSEManager()
            e1 = SSEEvent(event_type="unread_update", project_id="p1", data={"count": 1})
            e2 = SSEEvent(event_type="unread_update", project_id="p1", data={"count": 2})
            mgr.publish_global(e1)
            mgr.publish_global(e2)
            # Только 1 запись для p1
            stats = mgr.get_stats()
            assert stats["global_lvc_cached"] == 1
            # Но значение — второе
            q = mgr.subscribe_global()
            sse_str = q.get_nowait()
            assert '"count": 2' in sse_str
        _run(_inner())

    def test_no_subscribers_no_error(self):
        """Публикация без подписчиков не вызывает ошибки."""
        mgr = SSEManager()
        event = SSEEvent(event_type="unread_update", project_id="p1", data={})
        mgr.publish_global(event)  # Не должно быть исключения


class TestPublishGlobalViaRedis:
    """Тесты publish_global_via_redis — локальная публикация + Redis."""

    def test_always_publishes_locally(self):
        """publish_global_via_redis ВСЕГДА вызывает publish_global."""
        mgr = SSEManager()
        calls = []
        mgr.publish_global = lambda e: calls.append(e)
        event = SSEEvent(event_type="unread_update", project_id="p1", data={"count": 1})
        with patch.dict("sys.modules", {"database": MagicMock(redis_client=None)}):
            mgr.publish_global_via_redis(event)
        assert len(calls) == 1

    def test_redis_publish_when_available(self):
        """Если Redis доступен — публикует в канал sse:global:unread."""
        mgr = SSEManager()
        mock_redis = MagicMock()
        event = SSEEvent(event_type="unread_update", project_id="p1", data={"count": 5})
        with patch.dict("sys.modules", {"database": MagicMock(redis_client=mock_redis)}):
            mgr.publish_global_via_redis(event)
        mock_redis.publish.assert_called_once()
        channel = mock_redis.publish.call_args[0][0]
        assert channel == "sse:global:unread"

    def test_redis_unavailable_graceful(self):
        """Redis недоступен — graceful fallback без исключения."""
        mgr = SSEManager()
        event = SSEEvent(event_type="unread_update", project_id="p1", data={})
        with patch.dict("sys.modules", {"database": MagicMock(redis_client=None)}):
            mgr.publish_global_via_redis(event)  # Не должно быть исключения
