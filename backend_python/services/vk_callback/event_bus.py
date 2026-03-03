# VK Callback Event Bus
#
# Redis-очередь для передачи событий от API-эндпоинта к Worker-процессу.
#
# Поток данных:
#   API Endpoint → enqueue_event() → Redis List → Worker → dequeue_event()
#
# Использует Redis List (LPUSH/BRPOP) — надёжно, просто, FIFO-порядок.
# При недоступности Redis — fallback на синхронную обработку.

import json
import time
import logging
from typing import Optional, Callable

from .models import CallbackEvent
from .config import callback_config

logger = logging.getLogger("vk_callback.event_bus")


def _get_redis():
    """Получить Redis-клиент из database.py (ленивый импорт)."""
    try:
        from database import redis_client
        return redis_client
    except ImportError:
        return None


def enqueue_event(event: CallbackEvent) -> bool:
    """
    Положить событие в Redis-очередь для обработки воркером.
    
    Args:
        event: Событие VK Callback
        
    Returns:
        True если событие успешно помещено в очередь,
        False если Redis недоступен (нужен fallback)
    """
    redis = _get_redis()
    if not redis:
        logger.warning("EVENTBUS: Redis недоступен, событие не поставлено в очередь")
        return False
    
    try:
        # Проверяем размер очереди — предохранитель от OOM
        if callback_config.queue_max_size > 0:
            current_size = redis.llen(callback_config.queue_key)
            if current_size >= callback_config.queue_max_size:
                logger.warning(
                    f"EVENTBUS: Очередь переполнена ({current_size}/{callback_config.queue_max_size}), "
                    f"событие '{event.type}' group={event.group_id} отброшено"
                )
                return False
        
        # Сериализуем событие в JSON
        event_data = json.dumps(event.to_queue_dict(), ensure_ascii=False)
        
        # LPUSH — добавляем в начало списка (BRPOP берёт с конца → FIFO)
        redis.lpush(callback_config.queue_key, event_data)
        
        queue_len = redis.llen(callback_config.queue_key)
        logger.info(
            f"EVENTBUS: Событие '{event.type}' для group={event.group_id} "
            f"добавлено в очередь (размер очереди: {queue_len})"
        )
        return True
        
    except Exception as e:
        logger.error(f"EVENTBUS: Ошибка при добавлении в очередь: {e}")
        return False


def dequeue_event(timeout: int = None) -> Optional[CallbackEvent]:
    """
    Извлечь событие из Redis-очереди (блокирующее чтение).
    
    Args:
        timeout: Таймаут ожидания в секундах. 
                 None = использовать значение из конфига.
                 0 = ждать бесконечно.
    
    Returns:
        CallbackEvent или None (если таймаут истёк)
    """
    redis = _get_redis()
    if not redis:
        return None
    
    if timeout is None:
        timeout = callback_config.queue_pop_timeout
    
    try:
        # BRPOP — блокирующее извлечение с конца (FIFO вместе с LPUSH)
        result = redis.brpop(callback_config.queue_key, timeout=timeout)
        
        if result is None:
            return None
        
        # result = (key, value) — нам нужен value
        _, event_data = result
        
        # Десериализуем JSON → CallbackEvent
        data = json.loads(event_data)
        event = CallbackEvent.from_queue_dict(data)
        
        logger.debug(f"EVENTBUS: Извлечено событие '{event.type}' для group={event.group_id}")
        return event
        
    except json.JSONDecodeError as e:
        logger.error(f"EVENTBUS: Ошибка десериализации события: {e}")
        return None
    except Exception as e:
        logger.error(f"EVENTBUS: Ошибка при извлечении из очереди: {e}")
        return None


def requeue_event(event: CallbackEvent) -> bool:
    """
    Вернуть событие обратно в очередь для повторной обработки.
    
    Увеличивает retry_count. Если превышен лимит — событие отбрасывается.
    
    Args:
        event: Событие для повторной обработки
        
    Returns:
        True если событие возвращено в очередь
    """
    event.retry_count += 1
    
    if event.retry_count >= callback_config.worker_max_retries:
        logger.warning(
            f"EVENTBUS: Событие '{event.type}' для group={event.group_id} "
            f"превысило лимит повторов ({callback_config.worker_max_retries}), отброшено"
        )
        return False
    
    logger.info(
        f"EVENTBUS: Возврат события '{event.type}' в очередь "
        f"(попытка {event.retry_count}/{callback_config.worker_max_retries})"
    )
    return enqueue_event(event)


def get_queue_size() -> int:
    """Получить текущий размер очереди."""
    redis = _get_redis()
    if not redis:
        return 0
    try:
        return redis.llen(callback_config.queue_key)
    except Exception:
        return 0


def clear_queue() -> int:
    """Очистить очередь. Возвращает количество удалённых событий."""
    redis = _get_redis()
    if not redis:
        return 0
    try:
        size = redis.llen(callback_config.queue_key)
        redis.delete(callback_config.queue_key)
        logger.info(f"EVENTBUS: Очередь очищена ({size} событий удалено)")
        return size
    except Exception as e:
        logger.error(f"EVENTBUS: Ошибка при очистке очереди: {e}")
        return 0


def get_queue_stats() -> dict:
    """Получить статистику очереди."""
    redis = _get_redis()
    if not redis:
        return {"available": False, "size": 0}
    
    try:
        return {
            "available": True,
            "size": redis.llen(callback_config.queue_key),
        }
    except Exception:
        return {"available": False, "size": 0}
