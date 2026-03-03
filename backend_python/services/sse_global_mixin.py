"""
Миксин глобальной подписки SSE (счётчики непрочитанных по ВСЕМ проектам).

Отвечает за:
- Глобальные подписки/отписки клиентов
- Публикацию глобальных событий (unread_count_changed)
- Last Value Cache (LVC) для глобальных событий
- Публикацию глобальных событий через Redis
"""

import asyncio
import json
import logging

from services.sse_event import SSEEvent

logger = logging.getLogger("sse_manager")


class SSEGlobalMixin:
    """Миксин: глобальная подписка SSE (счётчики непрочитанных по ВСЕМ проектам)."""

    # Атрибуты инициализируются в SSEManager.__init__:
    # _global_subscribers: Set[asyncio.Queue]
    # _global_lock: threading.Lock
    # _global_lvc: Dict[str, str]
    # _global_lvc_lock: threading.Lock
    # _loop: Optional[asyncio.AbstractEventLoop]
    # _instance_id: str

    def subscribe_global(self) -> asyncio.Queue:
        """
        Подписывает клиента на глобальные события (unread_count_changed).
        Возвращает asyncio.Queue для SSE-генератора.
        
        Last Value Cache: при подключении клиент сразу получает
        последние события для каждого project_id (без ожидания нового callback).
        """
        try:
            self._loop = asyncio.get_running_loop()
        except RuntimeError:
            pass

        queue: asyncio.Queue = asyncio.Queue(maxsize=500)
        
        # --- LVC replay: отправляем кешированные события новому подписчику ---
        with self._global_lvc_lock:
            cached_events = list(self._global_lvc.values())
        
        for sse_str in cached_events:
            try:
                queue.put_nowait(sse_str)
            except asyncio.QueueFull:
                logger.warning("SSE GLOBAL LVC: очередь переполнена при replay")
                break
        
        if cached_events:
            logger.info(f"SSE GLOBAL LVC: отправлено {len(cached_events)} кешированных событий новому подписчику")
        
        with self._global_lock:
            self._global_subscribers.add(queue)

        count = len(self._global_subscribers)
        logger.info(f"SSE GLOBAL: новый подписчик (всего: {count})")
        return queue

    def unsubscribe_global(self, queue: asyncio.Queue):
        """Отписывает клиента от глобальных событий."""
        with self._global_lock:
            self._global_subscribers.discard(queue)

        count = len(self._global_subscribers)
        logger.info(f"SSE GLOBAL: подписчик отключён (осталось: {count})")

    def publish_global(self, event: SSEEvent):
        """
        Публикует событие ВСЕМ глобальным подписчикам.
        Используется для уведомления об изменении счётчиков непрочитанных.
        Потокобезопасно — вызывается из callback worker.
        
        Last Value Cache (LVC): событие ВСЕГДА сохраняется в кеш по project_id.
        Если подписчиков нет — событие не теряется, а будет отправлено
        при следующем subscribe_global() (решает гонку EventSource ↔ callback).
        """
        sse_str = event.to_sse_string()
        
        # --- LVC: кешируем ПЕРЕД проверкой подписчиков ---
        if event.project_id:
            with self._global_lvc_lock:
                self._global_lvc[event.project_id] = sse_str
        
        with self._global_lock:
            subscribers = self._global_subscribers.copy()

        if not subscribers:
            logger.warning(
                f"SSE GLOBAL: нет подписчиков для {event.event_type} "
                f"project={event.project_id} — событие сохранено в LVC"
            )
            return
        logger.info(
            f"SSE GLOBAL PUBLISH: {event.event_type} → project={event.project_id} "
            f"→ {len(subscribers)} глобальных подписчиков"
        )

        # Получаем event loop (с fallback)
        loop = self._loop
        if loop is None:
            try:
                loop = asyncio.get_running_loop()
                self._loop = loop
            except RuntimeError:
                pass

        dead_queues = []
        for queue in subscribers:
            try:
                if loop and loop.is_running():
                    loop.call_soon_threadsafe(self._put_nowait_safe, queue, sse_str)
                else:
                    # Fallback: прямой вызов с eviction
                    self._put_nowait_safe(queue, sse_str)
            except RuntimeError:
                dead_queues.append(queue)

        if dead_queues:
            with self._global_lock:
                for dq in dead_queues:
                    self._global_subscribers.discard(dq)

    def publish_global_via_redis(self, event: SSEEvent):
        """
        Публикует глобальное событие.
        
        1. ВСЕГДА публикует локально (publish_global) — для подписчиков этого инстанса.
        2. Если Redis есть — дополнительно публикует в Pub/Sub для других инстансов.
           (Redis listener на других инстансах вызовет их publish_global)
        
        Гарантия доставки: локальные подписчики получают событие мгновенно,
        без ожидания roundtrip через Redis.
        """
        # --- ВСЕГДА публикуем локально ---
        try:
            self.publish_global(event)
        except Exception as e:
            logger.error(f"SSE GLOBAL LOCAL publish_global EXCEPTION: {e}", exc_info=True)
        
        # --- Дополнительно через Redis (для других инстансов) ---
        try:
            from database import redis_client
            if redis_client:
                channel = "sse:global:unread"
                payload = json.dumps({
                    "event_type": event.event_type,
                    "project_id": event.project_id,
                    "data": event.data,
                    "timestamp": event.timestamp,
                    "source_instance": self._instance_id,
                }, ensure_ascii=False)
                redis_client.publish(channel, payload)
                logger.info(f"SSE GLOBAL → Redis PUBLISH: {event.event_type} → channel={channel}")
        except Exception as e:
            logger.warning(f"SSE GLOBAL → Redis PUBLISH failed (non-critical): {e}")
