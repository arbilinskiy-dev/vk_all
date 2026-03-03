# VK Callback Event Dispatcher (v2 — Redis Queue)
#
# Главный диспетчер событий — принимает событие от VK и:
# - confirmation → обрабатывает синхронно (VK ждёт код)
# - всё остальное → кладёт в Redis-очередь и сразу отвечает "ok"
#
# Тяжёлая обработка выполняется отдельным процессом worker.py.

import logging
from typing import Optional, Tuple

from sqlalchemy.orm import Session
from fastapi.responses import PlainTextResponse

from .models import CallbackEvent, HandlerResult
from .event_bus import enqueue_event, get_queue_size
from .registry import get_registry
from .config import callback_config
import crud

logger = logging.getLogger("vk_callback.dispatcher")


def dispatch_event(
    db: Session,
    event_type: str,
    group_id: int,
    payload: dict
) -> Tuple[HandlerResult, Optional[str]]:
    """
    Диспетчер событий VK Callback (v2).
    
    Для событий типа "confirmation" — находит хендлер и выполняет синхронно,
    потому что VK ожидает мгновенный ответ с кодом подтверждения.
    
    Для всех остальных событий — кладёт в Redis-очередь (LPUSH).
    Worker-процесс извлечёт и обработает позже.
    
    Args:
        db: Сессия БД
        event_type: Тип события (строка от VK)
        group_id: ID группы VK
        payload: Полный payload события
        
    Returns:
        tuple:
            - HandlerResult
            - str | None — код подтверждения (только для confirmation)
    """
    logger.info(f"DISPATCHER: Событие '{event_type}' от group={group_id}")
    
    # ─── Confirmation: синхронная обработка ────────────────────────
    if event_type == "confirmation":
        return _handle_confirmation(db, event_type, group_id, payload)
    
    # ─── Все остальные: ставим в очередь ──────────────────────────
    return _enqueue_to_redis(event_type, group_id, payload)


def _handle_confirmation(
    db: Session,
    event_type: str,
    group_id: int,
    payload: dict
) -> Tuple[HandlerResult, Optional[str]]:
    """
    Синхронная обработка confirmation.
    
    VK ожидает мгновенный ответ — нельзя ставить в очередь.
    Находим проект по group_id и возвращаем confirmation code.
    """
    logger.info(f"DISPATCHER: Confirmation от group={group_id} — обработка синхронно")
    
    event = CallbackEvent(
        type=event_type,
        group_id=group_id,
        event_id=payload.get("event_id"),
        v=payload.get("v"),
        object=payload.get("object"),
        secret=payload.get("secret")
    )
    
    # Ищем хендлер через реестр
    registry = get_registry()
    handler = registry.get_handler("confirmation")
    
    if handler:
        project = crud.get_project_by_vk_id(db, group_id)
        try:
            result = handler.handle(db, event, project)
            confirmation_code = None
            if result.success and result.data:
                confirmation_code = result.data.get("confirmation_code")
            return result, confirmation_code
        except Exception as e:
            logger.error(f"DISPATCHER: Ошибка confirmation handler: {e}")
    
    # Fallback: если хендлер не сработал, ищем код напрямую
    return HandlerResult(
        success=False,
        message="Confirmation handler не найден или ошибка"
    ), None


def _enqueue_to_redis(
    event_type: str,
    group_id: int,
    payload: dict
) -> Tuple[HandlerResult, None]:
    """
    Поставить событие в Redis-очередь для асинхронной обработки.
    
    Если Redis недоступен, выполняем fallback на синхронную обработку.
    """
    event = CallbackEvent(
        type=event_type,
        group_id=group_id,
        event_id=payload.get("event_id"),
        v=payload.get("v"),
        object=payload.get("object"),
        secret=payload.get("secret")
    )
    
    # Пытаемся положить в очередь
    queued = enqueue_event(event)
    
    if queued:
        queue_size = get_queue_size()
        logger.info(
            f"DISPATCHER: Событие '{event_type}' от group={group_id} "
            f"поставлено в очередь (размер: {queue_size})"
        )
        return HandlerResult(
            success=True,
            message=f"Событие '{event_type}' поставлено в очередь",
            action_taken="queued",
            data={"queue_size": queue_size}
        ), None
    
    # Fallback: Redis недоступен — обрабатываем синхронно
    logger.warning(
        f"DISPATCHER: Redis недоступен! Fallback на синхронную обработку "
        f"для '{event_type}' group={group_id}"
    )
    return _fallback_sync_process(event)


def _fallback_sync_process(event: CallbackEvent) -> Tuple[HandlerResult, None]:
    """
    Синхронная обработка при недоступности Redis.
    
    Используется как fallback — не основной путь.
    Импортируем handlers чтобы гарантировать регистрацию хендлеров в реестре
    (при работе через Redis это делает worker.py).
    """
    from database import SessionLocal
    # Импорт handlers гарантирует вызов _register_all_handlers() —
    # без Redis worker не запускается и хендлеры не регистрируются автоматически
    from .handlers import ALL_HANDLERS  # noqa: F401
    
    registry = get_registry()
    handler = registry.get_handler(event.type)
    
    if not handler:
        logger.warning(f"DISPATCHER FALLBACK: Нет хендлера для '{event.type}'")
        return HandlerResult(
            success=True,
            message=f"Нет обработчика для '{event.type}' (проигнорировано)",
            action_taken="ignored"
        ), None
    
    handler_name = handler.__class__.__name__
    db = SessionLocal()
    try:
        project = None
        try:
            project = crud.get_project_by_vk_id(db, event.group_id)
        except Exception:
            pass
        
        result = handler.handle(db, event, project)
        logger.info(f"DISPATCHER FALLBACK: {handler_name} — {result.message}")
        return result, None
        
    except Exception as e:
        logger.error(f"DISPATCHER FALLBACK: Ошибка {handler_name}: {e}")
        import traceback
        traceback.print_exc()
        return HandlerResult(
            success=False,
            message=f"Ошибка обработки: {str(e)}"
        ), None
    finally:
        db.close()


def get_registered_event_types() -> list[str]:
    """Получить список всех зарегистрированных типов событий."""
    registry = get_registry()
    return registry.get_all_registered_events()


def get_dispatcher_stats() -> dict:
    """Статистика системы обработки событий."""
    registry = get_registry()
    return {
        "registry": registry.get_stats(),
        "queue_size": get_queue_size(),
        "config": {
            "queue_key": callback_config.queue_key,
            "worker_concurrency": callback_config.worker_concurrency,
            "worker_max_retries": callback_config.worker_max_retries,
        }
    }
