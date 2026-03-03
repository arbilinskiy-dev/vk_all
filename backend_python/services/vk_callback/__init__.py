# VK Callback API Event System (v2 — Redis Queue Architecture)
#
# Модульная система обработки событий от VK Callback API.
#
# Архитектура:
#   ┌─────────────────┐     ┌──────────────┐     ┌──────────────────┐
#   │  VK Servers      │────▶│  API Endpoint │────▶│  Redis Queue     │
#   │  (POST /callback)│     │  (router)     │     │  (LPUSH)         │
#   └─────────────────┘     └──────────────┘     └────────┬─────────┘
#                                                          │
#                                                 ┌────────▼─────────┐
#                                                 │  Worker Process   │
#                                                 │  (BRPOP)          │
#                                                 │  ├─ Middleware     │
#                                                 │  │  ├─ Dedup      │
#                                                 │  │  ├─ Rate Limit │
#                                                 │  │  └─ Secret     │
#                                                 │  └─ Handler       │
#                                                 │     ├─ Wall       │
#                                                 │     ├─ Messages   │
#                                                 │     ├─ Market     │
#                                                 │     └─ ...        │
#                                                 └──────────────────┘
#
# Точка входа (API):
#   from services.vk_callback import dispatch_event
#   result, code = dispatch_event(db, event_type, group_id, payload)
#
# Запуск воркера:
#   python -m services.vk_callback.worker
#
# Компоненты:
#   dispatcher.py   — Точка входа: confirmation синхронно, остальное в Redis-очередь
#   worker.py       — Процесс-потребитель: BRPOP → middleware → handler
#   event_bus.py    — Redis-очередь (LPUSH/BRPOP, FIFO)
#   registry.py     — Автоматический реестр хендлеров
#   config.py       — Конфигурация (таймауты, лимиты, ключи)
#   debounce.py     — Redis-based debounce/cooldown/dedup
#   models.py       — EventType (40+ типов), CallbackEvent, HandlerResult
#   middleware/      — Pipeline: дедупликация, rate limiting, secret validation
#   handlers/        — Обработчики по категориям (wall/, messages/, market/, ...)

from .dispatcher import dispatch_event, get_registered_event_types, get_dispatcher_stats
from .models import CallbackEvent, EventType, HandlerResult
from .event_bus import get_queue_size, get_queue_stats, clear_queue
from .config import callback_config

__all__ = [
    # Точка входа
    'dispatch_event',
    'get_registered_event_types',
    'get_dispatcher_stats',
    
    # Модели
    'CallbackEvent',
    'EventType',
    'HandlerResult',
    
    # Очередь
    'get_queue_size',
    'get_queue_stats',
    'clear_queue',
    
    # Конфиг
    'callback_config',
]
