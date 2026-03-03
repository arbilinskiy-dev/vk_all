"""
SSE (Server-Sent Events) менеджер для push-уведомлений.

Hub-файл: логика вынесена в модули:
- sse_event.py            — модель SSEEvent
- sse_dialog_focus_mixin.py — трекинг менеджеров в диалогах
- sse_global_mixin.py     — глобальная подписка (счётчики непрочитанных)
- sse_redis_mixin.py      — Redis Pub/Sub

Два режима:
1. Redis Pub/Sub — для продакшена (несколько инстансов)
2. In-memory asyncio.Queue — для локальной разработки (без Redis)

Поддерживает типы событий:
- new_message: новое входящее сообщение
- message_read: диалог прочитан менеджером (нашим)
- unread_update: обновление счётчика непрочитанных
- user_read: пользователь VK прочитал наши исходящие сообщения
- user_typing: пользователь VK печатает сообщение
- dialog_focus: менеджер открыл/закрыл диалог (для отображения другим)
"""

import asyncio
import json
import logging
import threading
import time
from typing import Dict, Set, Any, Optional, Tuple

# --- Реэкспорт из модулей ---
from services.sse_event import SSEEvent
from services.sse_dialog_focus_mixin import SSEDialogFocusMixin
from services.sse_global_mixin import SSEGlobalMixin
from services.sse_redis_mixin import SSERedisMixin

logger = logging.getLogger("sse_manager")

__all__ = ["SSEEvent", "SSEManager", "sse_manager"]


class SSEManager(SSEDialogFocusMixin, SSEGlobalMixin, SSERedisMixin):
    """
    Менеджер SSE-подключений.
    
    Каждый подключённый менеджер (фронтенд-клиент) регистрирует asyncio.Queue,
    в которую пишутся события для его проекта.
    
    ВАЖНО: publish() вызывается из фоновых потоков (callback worker / Redis listener),
    поэтому используется loop.call_soon_threadsafe() для безопасной записи в asyncio.Queue.
    
    Миксины:
    - SSEDialogFocusMixin — трекинг менеджеров в диалогах
    - SSEGlobalMixin      — глобальная подписка (счётчики непрочитанных)
    - SSERedisMixin       — Redis Pub/Sub
    """

    def __init__(self):
        # Уникальный ID инстанса — для фильтрации собственных событий в Redis pub/sub.
        # Без этого каждое событие доставляется дважды: локально (publish) + через Redis обратно (listener → publish).
        import uuid as _uuid
        self._instance_id = str(_uuid.uuid4())[:8]
        
        # Словарь: project_id → set(asyncio.Queue)
        # Каждая Queue = одно SSE-подключение
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}
        self._lock = threading.Lock()
        self._redis_listener_started = False
        # Ссылка на asyncio event loop (сохраняется при первом subscribe)
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        
        # --- Глобальные подписчики (для счётчиков непрочитанных по ВСЕМ проектам) ---
        # set(asyncio.Queue) — подключены независимо от project_id
        self._global_subscribers: Set[asyncio.Queue] = set()
        self._global_lock = threading.Lock()
        
        # --- Last Value Cache: последние глобальные события по project_id ---
        # Гарантирует, что новый подписчик получит актуальные счётчики,
        # даже если событие было опубликовано ДО подключения клиента (гонка EventSource ↔ callback)
        self._global_lvc: Dict[str, str] = {}  # project_id → последний SSE-string
        self._global_lvc_lock = threading.Lock()
        
        # --- Dialog Focus: трекинг менеджеров в диалогах ---
        # Структура: { (project_id, vk_user_id) → { manager_id → {"name": str, "ts": float} } }
        self._dialog_focus: Dict[Tuple[str, int], Dict[str, dict]] = {}
        self._focus_lock = threading.Lock()
        
        # Привязка queue → (project_id, manager_id, manager_name) для автоочистки при disconnect
        self._queue_meta: Dict[int, dict] = {}  # id(queue) → { project_id, manager_id, manager_name }
        
        # --- Per-project LVC: последние события по vk_user_id ---
        # При подключении/переподключении EventSource клиент получит
        # последние new_message/message_read/unread_update для каждого vk_user_id
        # Структура: { project_id → { vk_user_id → SSE-string } }
        self._project_lvc: Dict[str, Dict[int, str]] = {}
        self._project_lvc_lock = threading.Lock()
        
        logger.info(f"SSE Manager инициализирован (instance_id={self._instance_id})")

    def initialize_loop(self, loop: asyncio.AbstractEventLoop = None):
        """
        Явная инициализация ссылки на asyncio event loop.
        Вызывается из FastAPI startup (async-контекст) — гарантирует,
        что publish() из фоновых потоков (callback worker) всегда имеет валидный loop.
        """
        if loop:
            self._loop = loop
        else:
            try:
                self._loop = asyncio.get_running_loop()
            except RuntimeError:
                pass
        if self._loop:
            logger.info("SSE Manager: event loop инициализирован явно (startup)")

    def subscribe(self, project_id: str, manager_id: str = "", manager_name: str = "") -> asyncio.Queue:
        """
        Подписывает нового клиента на события проекта.
        Возвращает asyncio.Queue, из которой SSE-эндпоинт читает события.
        
        Вызывается из async-контекста (SSE endpoint) — сохраняем ссылку на event loop.
        manager_id и manager_name сохраняются для автоочистки dialog_focus при disconnect.
        
        Per-project LVC: при подключении клиент сразу получает последние события
        new_message по каждому vk_user_id (решает гонку EventSource ↔ callback).
        """
        # Сохраняем event loop при первом подключении
        try:
            self._loop = asyncio.get_running_loop()
        except RuntimeError:
            pass

        queue: asyncio.Queue = asyncio.Queue(maxsize=500)
        
        # --- Per-project LVC replay: отправляем кешированные события новому подписчику ---
        with self._project_lvc_lock:
            cached_events = list((self._project_lvc.get(project_id) or {}).values())
        
        for sse_str in cached_events:
            try:
                queue.put_nowait(sse_str)
            except asyncio.QueueFull:
                logger.warning(f"SSE PROJECT LVC: очередь переполнена при replay, project={project_id}")
                break
        
        if cached_events:
            logger.info(f"SSE PROJECT LVC: отправлено {len(cached_events)} кешированных событий новому подписчику project={project_id}")
        
        with self._lock:
            if project_id not in self._subscribers:
                self._subscribers[project_id] = set()
            self._subscribers[project_id].add(queue)
            # Сохраняем meta для автоочистки при disconnect
            self._queue_meta[id(queue)] = {
                "project_id": project_id,
                "manager_id": manager_id,
                "manager_name": manager_name,
            }
        
        count = len(self._subscribers.get(project_id, set()))
        logger.info(f"SSE: новый подписчик на project={project_id}, manager={manager_id} (всего: {count})")
        return queue

    def unsubscribe(self, project_id: str, queue: asyncio.Queue):
        """
        Отписывает клиента при разрыве SSE-соединения.
        Автоматически очищает dialog_focus для этого менеджера.
        """
        # Получаем meta до удаления
        meta = None
        with self._lock:
            meta = self._queue_meta.pop(id(queue), None)
            if project_id in self._subscribers:
                self._subscribers[project_id].discard(queue)
                if not self._subscribers[project_id]:
                    del self._subscribers[project_id]
        
        # Автоочистка dialog_focus при disconnect
        if meta and meta.get("manager_id"):
            self._cleanup_focus_for_manager(project_id, meta["manager_id"])
        
        count = len(self._subscribers.get(project_id, set()))
        logger.info(f"SSE: подписчик отключён от project={project_id} (осталось: {count})")

    def _put_nowait_safe(self, queue: asyncio.Queue, sse_str: str) -> bool:
        """
        Потокобезопасная запись в asyncio.Queue.
        При переполнении вытесняет старейшее событие (eviction), чтобы не терять свежие.
        """
        try:
            queue.put_nowait(sse_str)
            return True
        except asyncio.QueueFull:
            # Вытесняем старейшее событие, чтобы новые данные не терялись
            try:
                _dropped = queue.get_nowait()
                queue.put_nowait(sse_str)
                logger.warning(
                    f"SSE _put_nowait_safe: очередь переполнена — "
                    f"вытеснено старое событие, qsize={queue.qsize()}/{queue.maxsize}"
                )
                return True
            except (asyncio.QueueEmpty, asyncio.QueueFull):
                # Крайний случай: не удалось ни извлечь, ни поставить
                logger.error(
                    f"SSE _put_nowait_safe: СОБЫТИЕ ПОТЕРЯНО — "
                    f"не удалось вытеснить, qsize={queue.qsize()}"
                )
                return False

    def publish(self, event: SSEEvent):
        """
        Публикует событие всем подписчикам проекта.
        
        Потокобезопасно — вызывается из callback worker / Redis listener (отдельные потоки).
        Использует loop.call_soon_threadsafe() для корректного пробуждения asyncio.Queue.get().
        
        Per-project LVC: кеширует new_message/message_read/unread_update по vk_user_id,
        чтобы новые подписчики получили пропущенные события при переподключении.
        """
        sse_str = event.to_sse_string()
        
        # --- Per-project LVC: кешируем ПЕРЕД проверкой подписчиков ---
        # Кешируем new_message И message_read — при reconnect клиент получит
        # и последнее сообщение, и актуальный статус прочитанности.
        # user_typing/dialog_focus эфемерны — не нужны после reconnect.
        if event.event_type in ("new_message", "message_read"):
            vk_user_id = event.data.get("vk_user_id")
            if vk_user_id is not None:
                # Составной ключ: тип_события:vk_user_id — кешируем последнее по каждому
                lvc_key = f"{event.event_type}:{vk_user_id}"
                with self._project_lvc_lock:
                    if event.project_id not in self._project_lvc:
                        self._project_lvc[event.project_id] = {}
                    self._project_lvc[event.project_id][lvc_key] = sse_str
        
        with self._lock:
            subscribers = self._subscribers.get(event.project_id, set()).copy()

        if not subscribers:
            logger.info(
                f"SSE PUBLISH: {event.event_type} → project={event.project_id} "
                f"→ нет подписчиков — событие сохранено в LVC"
            )
            return
        logger.info(
            f"SSE PUBLISH: {event.event_type} → project={event.project_id} "
            f"→ {len(subscribers)} подписчиков"
        )

        # Получаем event loop (с fallback на текущий контекст)
        loop = self._loop
        if loop is None:
            try:
                loop = asyncio.get_running_loop()
                self._loop = loop
            except RuntimeError:
                pass

        # Пишем в очереди подписчиков
        dead_queues = []
        for queue in subscribers:
            try:
                if loop and loop.is_running():
                    # Потокобезопасная публикация через event loop
                    # call_soon_threadsafe пробудит await queue.get() в SSE генераторе
                    loop.call_soon_threadsafe(self._put_nowait_safe, queue, sse_str)
                else:
                    # Fallback: прямой вызов с eviction (loop недоступен)
                    self._put_nowait_safe(queue, sse_str)
            except RuntimeError:
                # Event loop закрыт — помечаем очередь как мёртвую
                dead_queues.append(queue)

        # Очистка мёртвых очередей
        if dead_queues:
            with self._lock:
                subs = self._subscribers.get(event.project_id, set())
                for dq in dead_queues:
                    subs.discard(dq)

    def get_stats(self) -> Dict[str, Any]:
        """Статистика SSE-подключений."""
        with self._lock:
            total = sum(len(subs) for subs in self._subscribers.values())
            projects = {pid: len(subs) for pid, subs in self._subscribers.items()}
        with self._global_lock:
            global_count = len(self._global_subscribers)
        with self._global_lvc_lock:
            lvc_count = len(self._global_lvc)
        return {
            "total_connections": total,
            "global_connections": global_count,
            "global_lvc_cached": lvc_count,
            "projects": projects,
            "redis_listener_active": self._redis_listener_started,
        }


# =============================================================================
# SINGLETON — единственный экземпляр SSE менеджера
# =============================================================================
sse_manager = SSEManager()
