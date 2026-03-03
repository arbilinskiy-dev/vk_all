# VK Callback Worker — Процесс-потребитель событий из Redis-очереди
#
# Запуск:
#   python -m services.vk_callback.worker
#
# Архитектура:
#   Endpoint (main.py) → Redis Queue (LPUSH) → Worker (BRPOP) → Middleware → Handler
#
# Воркер работает в отдельном процессе от Gunicorn/Uvicorn.
# Это гарантирует, что обработка "тяжёлых" событий не блокирует ответ VK.
#
# Масштабирование:
#   - Горизонтальное: запуск нескольких процессов worker.py (Redis BRPOP атомарен)
#   - Вертикальное: параметр worker_concurrency в config.py (ThreadPoolExecutor)

import sys
import os
import time
import signal
import logging
import threading
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional

# Добавляем корневую папку бэкенда в PYTHONPATH
# (чтобы запускать python -m services.vk_callback.worker из backend_python/)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from database import SessionLocal

from .config import callback_config
from .models import CallbackEvent, HandlerResult
from .event_bus import dequeue_event, requeue_event, get_queue_size
from .registry import get_registry
from .middleware.base import run_middleware_chain
from .middleware.deduplicator import DeduplicatorMiddleware
from .middleware.rate_limiter import RateLimiterMiddleware
from .middleware.secret_validator import SecretValidatorMiddleware

logger = logging.getLogger("vk_callback.worker")

# Флаг для graceful shutdown
_shutdown_requested = False


def _signal_handler(signum, frame):
    """Обработчик сигналов для корректного завершения."""
    global _shutdown_requested
    _shutdown_requested = True
    logger.info("WORKER: Получен сигнал завершения, заканчиваем обработку...")


# ─── Middleware Pipeline ──────────────────────────────────────────

def _build_middleware_pipeline() -> list:
    """Собрать цепочку middleware для обработки событий."""
    return [
        DeduplicatorMiddleware(),     # 1. Дедупликация (отсеиваем дубли event_id)
        RateLimiterMiddleware(),      # 2. Rate limit (защита от флуда одной группы)
        SecretValidatorMiddleware(),  # 3. Валидация secret ключа
    ]


# ─── Обработка одного события ─────────────────────────────────────

def _process_single_event(event: CallbackEvent, middlewares: list) -> bool:
    """
    Обработать одно событие из очереди.
    
    Returns:
        True если событие обработано успешно,
        False если произошла ошибка (событие может быть возвращено в очередь)
    """
    start_time = time.time()
    event_label = f"'{event.type}' group={event.group_id}"
    
    logger.info(f"WORKER: Обработка {event_label} (попытка {event.retry_count + 1})")
    
    # 1. Прогоняем через middleware
    mw_result = run_middleware_chain(event, middlewares)
    
    if not mw_result.allow:
        logger.info(f"WORKER: Событие {event_label} отклонено middleware: {mw_result.reason}")
        return True  # Событие обработано (отклонено) — не требует повтора
    
    # Используем модифицированное событие (если middleware обогатил)
    processed_event = mw_result.modified_event or event
    
    # 2. Находим обработчик через реестр
    registry = get_registry()
    handler = registry.get_handler(processed_event.type)
    
    if not handler:
        logger.warning(f"WORKER: Нет обработчика для типа '{processed_event.type}', пропускаем")
        return True  # Нет хендлера — не повторяем
    
    handler_name = handler.__class__.__name__
    
    # 3. Выполняем обработчик с сессией БД
    db = SessionLocal()
    try:
        # Получаем проект из БД
        import crud
        project = crud.get_project_by_vk_id(db, processed_event.group_id)
        
        if not project and processed_event.type != "confirmation":
            logger.warning(
                f"WORKER: Проект не найден для group_id={processed_event.group_id}, "
                f"событие {event_label} будет залогировано"
            )
        
        # Вызываем обработчик
        result: HandlerResult = handler.handle(db, processed_event, project)
        
        elapsed_ms = (time.time() - start_time) * 1000
        
        if result.success:
            logger.info(
                f"WORKER: ✅ {handler_name} — {result.message} "
                f"(action={result.action_taken}, {elapsed_ms:.0f}ms)"
            )
        else:
            logger.warning(
                f"WORKER: ⚠️ {handler_name} — {result.message} ({elapsed_ms:.0f}ms)"
            )
            
            # Если хендлер указал, что нужен повтор
            if result.should_retry:
                logger.info(f"WORKER: Событие {event_label} будет возвращено в очередь")
                requeue_event(event)
        
        return result.success
        
    except Exception as e:
        elapsed_ms = (time.time() - start_time) * 1000
        logger.error(
            f"WORKER: ❌ Ошибка в {handler_name} для {event_label}: {e} ({elapsed_ms:.0f}ms)"
        )
        traceback.print_exc()
        
        # Возвращаем в очередь для повтора
        requeue_event(event)
        return False
        
    finally:
        db.close()


# ─── Главный цикл воркера ─────────────────────────────────────────

def run_worker():
    """
    Главный цикл воркера.
    
    Бесконечно читает события из Redis-очереди и обрабатывает их.
    Использует ThreadPoolExecutor для параллельной обработки.
    Корректно завершается по SIGINT/SIGTERM.
    """
    global _shutdown_requested
    
    # Настройка логирования
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Регистрация обработчиков сигналов
    signal.signal(signal.SIGINT, _signal_handler)
    signal.signal(signal.SIGTERM, _signal_handler)
    
    logger.info("=" * 60)
    logger.info("WORKER: VK Callback Worker запускается...")
    logger.info(f"WORKER: Redis queue key: {callback_config.queue_key}")
    logger.info(f"WORKER: Pop timeout: {callback_config.queue_pop_timeout}s")
    logger.info(f"WORKER: Max retries: {callback_config.worker_max_retries}")
    logger.info(f"WORKER: Concurrency: {callback_config.worker_concurrency}")
    
    # Инициализация handlers (триггерит авто-регистрацию)
    from .handlers import ALL_HANDLERS
    registry = get_registry()
    stats = registry.get_stats()
    logger.info(
        f"WORKER: Загружено {stats['total_handlers']} обработчиков, "
        f"покрывающих {stats['registered_events']} типов событий"
    )
    
    # Текущий размер очереди
    queue_size = get_queue_size()
    if queue_size > 0:
        logger.info(f"WORKER: В очереди уже {queue_size} событий, начинаем обработку")
    
    logger.info("WORKER: Готов к приёму событий")
    logger.info("=" * 60)
    
    # Собираем pipeline middleware
    middlewares = _build_middleware_pipeline()
    
    # Счётчики для health-check
    events_processed = 0
    events_failed = 0
    last_healthcheck = time.time()
    
    # Главный цикл
    with ThreadPoolExecutor(max_workers=callback_config.worker_concurrency) as executor:
        futures = {}
        
        while not _shutdown_requested:
            try:
                # Проверяем завершённые задачи
                done_futures = [f for f in futures if f.done()]
                for future in done_futures:
                    try:
                        success = future.result()
                        if success:
                            events_processed += 1
                        else:
                            events_failed += 1
                    except Exception as e:
                        events_failed += 1
                        logger.error(f"WORKER: Ошибка в future: {e}")
                    del futures[future]
                
                # Health-check логирование
                now = time.time()
                if now - last_healthcheck >= callback_config.worker_healthcheck_interval:
                    queue_size = get_queue_size()
                    logger.info(
                        f"WORKER HEALTH: обработано={events_processed}, "
                        f"ошибок={events_failed}, очередь={queue_size}, "
                        f"активных задач={len(futures)}"
                    )
                    last_healthcheck = now
                
                # Если все слоты заняты — ждём
                if len(futures) >= callback_config.worker_concurrency:
                    time.sleep(0.1)
                    continue
                
                # Извлекаем событие из очереди (блокирующее)
                event = dequeue_event(timeout=callback_config.queue_pop_timeout)
                
                if event is None:
                    # Таймаут — очередь пуста, ждём дальше
                    continue
                
                # Передаём обработку в пул потоков
                future = executor.submit(_process_single_event, event, middlewares)
                futures[future] = event
                
            except KeyboardInterrupt:
                logger.info("WORKER: Получен KeyboardInterrupt")
                _shutdown_requested = True
            except Exception as e:
                logger.error(f"WORKER: Неожиданная ошибка в главном цикле: {e}")
                traceback.print_exc()
                time.sleep(1)  # Пауза перед повтором
    
    # Graceful shutdown — ждём завершения текущих задач
    logger.info(f"WORKER: Завершение... Ожидаем {len(futures)} активных задач")
    for future in futures:
        try:
            future.result(timeout=30)
        except Exception as e:
            logger.error(f"WORKER: Ошибка при завершении задачи: {e}")
    
    logger.info(
        f"WORKER: Остановлен. Итого: обработано={events_processed}, ошибок={events_failed}"
    )


# ─── Точка входа ──────────────────────────────────────────────────

if __name__ == "__main__":
    run_worker()

# ─── Встроенный режим (запуск из FastAPI startup) ────────────

_embedded_thread: Optional[threading.Thread] = None


def start_embedded_worker() -> bool:
    """
    Запуск воркера в фоновом потоке внутри процесса FastAPI.
    
    Используется в продакшене (Gunicorn + Uvicorn workers).
    Redis-лок гарантирует, что только один воркер-процесс Gunicorn
    запустит callback-воркер (остальные просто пропустят).
    
    Returns:
        True если воркер запущен, False если уже работает в другом воркере
    """
    global _embedded_thread, _shutdown_requested
    
    # Проверяем Redis-лок: только один Gunicorn-воркер запустит callback-воркер
    try:
        from database import redis_client
        if redis_client:
            # SET NX — атомарно, только первый захватит
            # TTL 120с — если воркер упал, лок автоматически истечёт
            acquired = redis_client.set(
                "vk_callback:worker_lock", 
                f"pid_{os.getpid()}", 
                nx=True, 
                ex=120
            )
            if not acquired:
                logger.info(
                    "EMBEDDED WORKER: Лок занят другим процессом, пропускаем"
                )
                return False
        else:
            logger.warning("EMBEDDED WORKER: Redis недоступен, воркер не запущен")
            return False
    except Exception as e:
        logger.warning(f"EMBEDDED WORKER: Не удалось получить лок: {e}")
        return False
    
    _shutdown_requested = False
    
    def _run_with_lock_renewal():
        """Запуск воркера с периодическим продлением Redis-лока."""
        import threading as _th
        
        def _renew_lock():
            """Продляем лок каждые 60 секунд, пока воркер жив."""
            while not _shutdown_requested:
                try:
                    from database import redis_client as _rc
                    if _rc:
                        _rc.expire("vk_callback:worker_lock", 120)
                except Exception:
                    pass
                time.sleep(60)
        
        # Поток продления лока
        renew_thread = _th.Thread(target=_renew_lock, daemon=True, name="callback-lock-renew")
        renew_thread.start()
        
        try:
            run_worker()
        finally:
            # Освобождаем лок при остановке
            try:
                from database import redis_client as _rc
                if _rc:
                    _rc.delete("vk_callback:worker_lock")
            except Exception:
                pass
    
    _embedded_thread = threading.Thread(
        target=_run_with_lock_renewal,
        daemon=True,
        name="vk-callback-worker"
    )
    _embedded_thread.start()
    logger.info(f"EMBEDDED WORKER: Запущен в фоновом потоке (pid={os.getpid()})")
    return True


def stop_embedded_worker():
    """Остановить встроенный воркер."""
    global _shutdown_requested, _embedded_thread
    
    if _embedded_thread and _embedded_thread.is_alive():
        logger.info("EMBEDDED WORKER: Остановка...")
        _shutdown_requested = True
        _embedded_thread.join(timeout=15)
        
        # Освобождаем Redis-лок
        try:
            from database import redis_client
            if redis_client:
                redis_client.delete("vk_callback:worker_lock")
        except Exception:
            pass
        
        logger.info("EMBEDDED WORKER: Остановлен")
    else:
        logger.debug("EMBEDDED WORKER: Воркер не был запущен в этом процессе")