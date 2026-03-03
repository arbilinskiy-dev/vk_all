# Debounce и Cooldown для VK Callback событий (Redis-based)
#
# Работает корректно между несколькими Gunicorn-воркерами,
# т.к. состояние хранится в Redis, а не в памяти процесса.
#
# Cooldown — подавление событий во время внутренних операций
#            (например, массовое удаление постов).
# Debounce — группировка быстрых последовательных событий одного типа
#            (например, edit = delete + new подряд).
# Dedup    — пропуск повторных событий с одинаковым event_id.

import time
import json
import logging
from typing import Optional

from .config import callback_config

logger = logging.getLogger("vk_callback.debounce")


def _get_redis():
    """Ленивый импорт Redis-клиента."""
    try:
        from database import redis_client
        return redis_client
    except ImportError:
        return None


# =============================================================================
# COOLDOWN — Подавление событий во время внутренних операций
# =============================================================================

def set_event_cooldown(group_id: int, event_type: str, seconds: float = None):
    """
    Установить cooldown для конкретного типа события.
    
    Используется ПЕРЕД началом внутренней операции (например, массового удаления).
    Все callback события этого типа будут игнорироваться до истечения cooldown.
    
    Args:
        group_id: ID группы VK
        event_type: Тип события VK
        seconds: Длительность cooldown в секундах (None = из конфига)
    """
    if seconds is None:
        seconds = callback_config.cooldown_default_seconds
    
    redis = _get_redis()
    key = f"{callback_config.cooldown_key_prefix}:{group_id}:{event_type}"
    
    if redis:
        try:
            # SET с TTL — автоматически удалится
            redis.set(key, "1", ex=int(seconds))
            logger.info(f"COOLDOWN: Установлен '{event_type}' для group={group_id} ({seconds}с) [Redis]")
            return
        except Exception as e:
            logger.warning(f"COOLDOWN: Redis ошибка, fallback на in-memory: {e}")
    
    # Fallback на in-memory (для локальной разработки без Redis)
    _memory_cooldowns[f"{group_id}:{event_type}"] = time.time() + seconds
    logger.info(f"COOLDOWN: Установлен '{event_type}' для group={group_id} ({seconds}с) [in-memory]")


def clear_event_cooldown(group_id: int, event_type: str):
    """Снять cooldown раньше времени."""
    redis = _get_redis()
    key = f"{callback_config.cooldown_key_prefix}:{group_id}:{event_type}"
    
    if redis:
        try:
            redis.delete(key)
            logger.info(f"COOLDOWN: Снят '{event_type}' для group={group_id} [Redis]")
            return
        except Exception:
            pass
    
    _memory_cooldowns.pop(f"{group_id}:{event_type}", None)


def is_event_on_cooldown(group_id: int, event_type: str) -> bool:
    """
    Проверить, активен ли cooldown для данного типа события.
    
    Returns:
        True если событие должно быть проигнорировано
    """
    redis = _get_redis()
    key = f"{callback_config.cooldown_key_prefix}:{group_id}:{event_type}"
    
    if redis:
        try:
            return redis.exists(key) > 0
        except Exception:
            pass
    
    # Fallback на in-memory
    deadline = _memory_cooldowns.get(f"{group_id}:{event_type}", 0)
    if deadline > time.time():
        return True
    _memory_cooldowns.pop(f"{group_id}:{event_type}", None)
    return False


# In-memory fallback для разработки без Redis
_memory_cooldowns = {}


# =============================================================================
# DEBOUNCE — Группировка быстрых последовательных событий
# =============================================================================

def should_debounce(group_id: int, action_type: str) -> bool:
    """
    Проверить, нужно ли подавить событие (debounce активен).
    
    Если для этого group_id + action_type уже есть активный debounce-таймер
    в Redis, возвращает True (событие нужно проигнорировать — предыдущее
    ещё не обработано и обработает все накопленные).
    
    Args:
        group_id: ID группы VK
        action_type: Тип действия (refresh_scheduled, refresh_published, etc.)
        
    Returns:
        True если событие нужно подавить (дубль в пределах debounce-окна)
    """
    redis = _get_redis()
    key = f"{callback_config.debounce_key_prefix}:{group_id}:{action_type}"
    
    if redis:
        try:
            # Пытаемся установить ключ только если его нет (NX)
            # Если установили — это первое событие в серии (NOT debounced)
            # Если не установили — debounce активен (нужно подавить)
            was_set = redis.set(
                key, "1", 
                nx=True, 
                ex=int(callback_config.debounce_delay)
            )
            if was_set:
                logger.debug(f"DEBOUNCE: Первое событие '{action_type}' для group={group_id}")
                return False  # Первое событие — обрабатываем
            else:
                logger.debug(f"DEBOUNCE: Подавлено '{action_type}' для group={group_id}")
                return True  # Дубль — подавляем
        except Exception as e:
            logger.warning(f"DEBOUNCE: Redis ошибка: {e}")
    
    # Без Redis — не дебаунсим, обрабатываем всё
    return False


def extend_debounce(group_id: int, action_type: str):
    """
    Продлить debounce-окно (сбросить таймер).
    
    Вызывается когда приходит ещё одно событие до истечения debounce.
    """
    redis = _get_redis()
    key = f"{callback_config.debounce_key_prefix}:{group_id}:{action_type}"
    
    if redis:
        try:
            redis.expire(key, int(callback_config.debounce_delay))
        except Exception:
            pass


def clear_debounce(group_id: int, action_type: str):
    """Снять debounce (после выполнения действия)."""
    redis = _get_redis()
    key = f"{callback_config.debounce_key_prefix}:{group_id}:{action_type}"
    
    if redis:
        try:
            redis.delete(key)
        except Exception:
            pass


# =============================================================================
# ДЕДУПЛИКАЦИЯ — Пропуск повторных событий по event_id
# =============================================================================

def is_duplicate_event(event_id: Optional[str]) -> bool:
    """
    Проверить, обрабатывалось ли уже событие с таким event_id.
    
    VK может повторно отправить событие если не получил 'ok' вовремя.
    
    Args:
        event_id: Уникальный ID события от VK
        
    Returns:
        True если это дубликат (уже обработано)
    """
    if not event_id:
        return False  # Без event_id не дедуплицируем
    
    redis = _get_redis()
    key = f"{callback_config.dedup_key_prefix}:{event_id}"
    
    if redis:
        try:
            # SET NX — установить только если не существует
            was_set = redis.set(key, "1", nx=True, ex=callback_config.dedup_ttl)
            if was_set:
                return False  # Новое событие
            else:
                logger.info(f"DEDUP: Дубликат event_id={event_id}")
                return True  # Уже видели
        except Exception as e:
            logger.warning(f"DEDUP: Redis ошибка: {e}")
    
    return False  # Без Redis — дедупликация отключена


# =============================================================================
# RATE LIMITING — Ограничение частоты от одной группы
# =============================================================================

def check_rate_limit(group_id: int) -> bool:
    """
    Проверить, не превышен ли лимит запросов от группы.
    
    Returns:
        True если лимит НЕ превышен (можно обрабатывать)
        False если превышен
    """
    redis = _get_redis()
    if not redis:
        return True  # Без Redis — лимит не проверяем
    
    key = f"{callback_config.rate_limit_key_prefix}:{group_id}"
    
    try:
        # Инкрементируем счётчик
        count = redis.incr(key)
        
        # Если это первый запрос — ставим TTL окна
        if count == 1:
            redis.expire(key, callback_config.rate_limit_window)
        
        # Проверяем лимит
        if count > callback_config.rate_limit_max_events:
            logger.warning(
                f"RATELIMIT: Превышен лимит для group={group_id} "
                f"({count}/{callback_config.rate_limit_max_events} за {callback_config.rate_limit_window}с)"
            )
            return False
        
        return True
        
    except Exception as e:
        logger.warning(f"RATELIMIT: Redis ошибка: {e}")
        return True  # При ошибке — пропускаем


# Экспорт
__all__ = [
    # Cooldown
    'set_event_cooldown',
    'clear_event_cooldown',
    'is_event_on_cooldown',
    # Debounce
    'should_debounce',
    'extend_debounce',
    'clear_debounce',
    # Дедупликация
    'is_duplicate_event',
    # Rate limiting
    'check_rate_limit',
]
