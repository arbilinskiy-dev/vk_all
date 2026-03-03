"""
Миксин Redis Pub/Sub для SSE-менеджера.

Отвечает за:
- Публикацию per-project событий через Redis (для multi-instance)
- Фоновый Redis listener (подписка на каналы sse:messages:* и sse:global:unread)
"""

import json
import logging
import threading
import time

from services.sse_event import SSEEvent

logger = logging.getLogger("sse_manager")


class SSERedisMixin:
    """Миксин: Redis Pub/Sub для per-project и глобальных SSE-событий."""

    # Атрибуты инициализируются в SSEManager.__init__:
    # _instance_id: str
    # _redis_listener_started: bool

    def publish_via_redis(self, event: SSEEvent):
        """
        Публикует per-project событие.
        
        1. ВСЕГДА публикует локально (publish) — для подписчиков этого инстанса.
        2. Если Redis есть — дополнительно публикует в Pub/Sub для других инстансов.
        """
        # --- ВСЕГДА публикуем локально ---
        try:
            self.publish(event)
        except Exception as e:
            logger.error(f"SSE LOCAL publish EXCEPTION: {e}", exc_info=True)
        
        # --- Дополнительно через Redis (для других инстансов) ---
        try:
            from database import redis_client
            if redis_client:
                channel = f"sse:messages:{event.project_id}"
                payload = json.dumps({
                    "event_type": event.event_type,
                    "project_id": event.project_id,
                    "data": event.data,
                    "timestamp": event.timestamp,
                    "source_instance": self._instance_id,
                }, ensure_ascii=False)
                redis_client.publish(channel, payload)
                logger.info(f"SSE → Redis PUBLISH: {event.event_type} → channel={channel}")
        except Exception as e:
            logger.warning(f"SSE → Redis PUBLISH failed (non-critical): {e}")

    def start_redis_listener(self):
        """
        Запускает фоновый поток, который слушает Redis Pub/Sub
        и перенаправляет события в локальные asyncio.Queue.
        Должен вызываться один раз при старте приложения.
        """
        if self._redis_listener_started:
            return

        try:
            from database import redis_client
            if not redis_client:
                logger.info("SSE: Redis не подключен, работаем в локальном режиме")
                return
        except Exception:
            return

        self._redis_listener_started = True

        def _listener():
            """Фоновый поток: слушает Redis Pub/Sub → пишет в локальные очереди."""
            from database import redis_client
            pubsub = redis_client.pubsub()
            # Подписываемся на паттерн всех проектов + глобальный канал
            pubsub.psubscribe("sse:messages:*")
            pubsub.subscribe("sse:global:unread")
            logger.info("SSE Redis Listener запущен (psubscribe sse:messages:* + subscribe sse:global:unread)")

            for raw_message in pubsub.listen():
                try:
                    if raw_message["type"] not in ("pmessage", "message"):
                        continue

                    payload = json.loads(raw_message["data"])
                    
                    # Пропускаем собственные события — они уже доставлены локально через publish().
                    # Без этой проверки каждое событие доставляется дважды в single-instance.
                    source = payload.get("source_instance")
                    if source == self._instance_id:
                        continue
                    
                    event = SSEEvent(
                        event_type=payload["event_type"],
                        project_id=payload["project_id"],
                        data=payload["data"],
                        timestamp=payload.get("timestamp", time.time()),
                    )
                    
                    # Определяем канал: глобальный или per-project
                    channel = raw_message.get("channel", b"")
                    if isinstance(channel, bytes):
                        channel = channel.decode("utf-8", errors="replace")
                    
                    if channel == "sse:global:unread":
                        # Глобальное событие → всем глобальным подписчикам
                        self.publish_global(event)
                    else:
                        # Per-project событие → подписчикам конкретного проекта
                        self.publish(event)
                        
                        # Синхронизация dialog_focus dict при получении от другого воркера/инстанса
                        if event.event_type == "dialog_focus":
                            self._apply_dialog_focus_from_event(event)

                except Exception as e:
                    logger.error(f"SSE Redis Listener error: {e}")

        thread = threading.Thread(target=_listener, daemon=True, name="sse-redis-listener")
        thread.start()
        logger.info("SSE Redis Listener thread started")
