"""Тесты для sse_redis_mixin.py — Redis Pub/Sub для SSE."""

import pytest
from unittest.mock import MagicMock, patch

from services.sse_manager import SSEManager
from services.sse_event import SSEEvent


@pytest.fixture
def manager():
    """Чистый SSEManager для каждого теста."""
    return SSEManager()


class TestPublishViaRedis:
    """Тесты publish_via_redis — локальная публикация + Redis per-project."""

    def test_always_publishes_locally(self, manager):
        """publish_via_redis ВСЕГДА вызывает publish (локально)."""
        calls = []
        manager.publish = lambda e: calls.append(e)
        event = SSEEvent(event_type="new_message", project_id="proj_1", data={"text": "hi"})
        # Мокаем database без Redis
        with patch.dict("sys.modules", {"database": MagicMock(redis_client=None)}):
            manager.publish_via_redis(event)
        assert len(calls) == 1
        assert calls[0].event_type == "new_message"

    def test_redis_publish_to_project_channel(self, manager):
        """Если Redis доступен — публикует в канал sse:messages:<project_id>."""
        mock_redis = MagicMock()
        manager.publish = MagicMock()  # Мокаем локальный publish
        event = SSEEvent(event_type="new_message", project_id="proj_42", data={"x": 1})
        with patch.dict("sys.modules", {"database": MagicMock(redis_client=mock_redis)}):
            manager.publish_via_redis(event)
        mock_redis.publish.assert_called_once()
        channel = mock_redis.publish.call_args[0][0]
        assert channel == "sse:messages:proj_42"

    def test_redis_payload_contains_source_instance(self, manager):
        """Payload в Redis содержит source_instance для фильтрации."""
        import json
        mock_redis = MagicMock()
        manager.publish = MagicMock()
        event = SSEEvent(event_type="test", project_id="p1", data={}, timestamp=100.0)
        with patch.dict("sys.modules", {"database": MagicMock(redis_client=mock_redis)}):
            manager.publish_via_redis(event)
        raw_payload = mock_redis.publish.call_args[0][1]
        payload = json.loads(raw_payload)
        assert payload["source_instance"] == manager._instance_id
        assert payload["event_type"] == "test"
        assert payload["project_id"] == "p1"

    def test_redis_unavailable_graceful(self, manager):
        """Redis недоступен — graceful fallback, событие публикуется только локально."""
        calls = []
        manager.publish = lambda e: calls.append(e)
        event = SSEEvent(event_type="new_message", project_id="p1", data={})
        with patch.dict("sys.modules", {"database": MagicMock(redis_client=None)}):
            manager.publish_via_redis(event)
        # Локальная публикация прошла
        assert len(calls) == 1

    def test_redis_exception_graceful(self, manager):
        """Исключение от Redis — не прерывает работу."""
        mock_redis = MagicMock()
        mock_redis.publish.side_effect = ConnectionError("Redis down")
        manager.publish = MagicMock()
        event = SSEEvent(event_type="new_message", project_id="p1", data={})
        with patch.dict("sys.modules", {"database": MagicMock(redis_client=mock_redis)}):
            manager.publish_via_redis(event)  # Не должно быть исключения
        # Локальная публикация всё равно прошла
        manager.publish.assert_called_once()


class TestStartRedisListener:
    """Тесты start_redis_listener — запуск фонового Redis listener."""

    def test_idempotent_start(self, manager):
        """Повторный вызов start_redis_listener не запускает второй поток."""
        manager._redis_listener_started = True
        # Если бы запускался второй — было бы обращение к database
        manager.start_redis_listener()  # Не должно ничего делать
        assert manager._redis_listener_started is True

    def test_no_redis_skips(self, manager):
        """Если redis_client=None — listener не запускается."""
        with patch.dict("sys.modules", {"database": MagicMock(redis_client=None)}):
            manager.start_redis_listener()
        assert manager._redis_listener_started is False

    def test_starts_thread_with_redis(self, manager):
        """При наличии Redis запускает daemon-поток."""
        mock_redis = MagicMock()
        mock_pubsub = MagicMock()
        # listen() должен возвращать итератор (пустой — чтобы не зависнуть)
        mock_pubsub.listen.return_value = iter([])
        mock_redis.pubsub.return_value = mock_pubsub

        with patch.dict("sys.modules", {"database": MagicMock(redis_client=mock_redis)}):
            with patch("threading.Thread") as mock_thread_cls:
                mock_thread_instance = MagicMock()
                mock_thread_cls.return_value = mock_thread_instance
                manager.start_redis_listener()
                mock_thread_cls.assert_called_once()
                mock_thread_instance.start.assert_called_once()
        assert manager._redis_listener_started is True
