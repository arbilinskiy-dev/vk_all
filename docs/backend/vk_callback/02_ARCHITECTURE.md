# 🏗️ Архитектура VK Callback Event System

## Общая схема

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  VK Servers      │────▶│  FastAPI Endpoint │────▶│  Redis Queue     │
│  (POST /callback)│     │  (router)         │     │  (LPUSH)         │
└─────────────────┘     └──────────────────┘     └────────┬─────────┘
                                                           │
                                                 ┌─────────▼────────┐
                                                 │  Worker Process   │
                                                 │  (BRPOP)          │
                                                 │  ├─ Middleware     │
                                                 │  │  ├─ Dedup      │
                                                 │  │  ├─ Rate Limit │
                                                 │  │  └─ Secret     │
                                                 │  └─ Handler       │
                                                 │     ├─ Wall       │
                                                 │     ├─ Messages   │
                                                 │     ├─ Market     │
                                                 │     └─ ...        │
                                                 └──────────────────┘
```

---

## Поток обработки события

### 1. Приём (API Endpoint)

```
POST /api/vk/callback  (routers/vk_callback.py)
  │
  ├─ Парсинг JSON: type, group_id, object, secret, event_id
  ├─ Логирование в БД (vk_callback_logs)
  └─ dispatch_event(db, event_type, group_id, payload)
        │
        ├─ confirmation → СИНХРОННО → PlainTextResponse(confirmation_code)
        └─ всё остальное → LPUSH в Redis-очередь → PlainTextResponse("ok")
```

> **Важно:** VK ожидает ответ `"ok"` в течение ~5 секунд. Поэтому обработка идёт асинхронно через Redis-очередь, а ответ отдаётся моментально.

### 2. Очередь (Redis)

```
Ключ: "vk_callback:events" (настраивается в config.py)
Структура: FIFO (LPUSH → BRPOP)
Формат: JSON-строка CallbackEvent
TTL: 3600 секунд (1 час)
```

### 3. Потребление (Worker)

```
Worker (worker.py) — отдельный поток / процесс
  │
  ├─ BRPOP "vk_callback:events" (timeout=5s)
  ├─ Десериализация JSON → CallbackEvent
  ├─ Middleware Pipeline:
  │   ├─ DeduplicatorMiddleware  — event_id уже обработан? → skip
  │   ├─ RateLimiterMiddleware   — превышен лимит группы? → skip
  │   └─ SecretValidatorMiddleware — secret корректен? → skip
  │
  ├─ HandlerRegistry.get_handler(event_type)
  │   ├─ Точное совпадение: "wall_post_new" → WallPostNewHandler
  │   └─ Fallback по категории: EventCategory.WALL → StubHandler
  │
  └─ handler.handle(db, event, project) → HandlerResult
```

### 4. Fallback (если Redis недоступен)

```
dispatch_event()
  └─ Redis недоступен → синхронная обработка в том же потоке
     └─ middleware → handler → HandlerResult (с задержкой API-ответа)
```

---

## Компоненты системы

### `dispatcher.py` — Точка входа

Принимает событие от роутера. Логика:
- `confirmation` → синхронно возвращает confirmation_code
- Всё остальное → сериализует в JSON → `event_bus.enqueue_event()`
- Если Redis упал → fallback к синхронной обработке

### `event_bus.py` — Redis-очередь

Обёртка над Redis List:
- `enqueue_event()` — LPUSH (добавляет в конец очереди)
- `dequeue_event()` — BRPOP (забирает из начала, блокирующий)
- `requeue_event()` — возврат в очередь при ошибке
- `get_queue_stats()` — размер очереди + метаданные

### `registry.py` — Реестр хендлеров

- `register_handler(handler_class)` — регистрирует хендлер по его `HANDLES_EVENTS`
- `get_handler(event_type)` — поиск: сначала exact match, потом fallback по категории
- `get_all_registered_types()` — список всех обслуживаемых типов событий

### `worker.py` — Потребитель очереди

Два режима работы:
1. **Standalone** — `python -m services.vk_callback.worker` (локальная разработка)
2. **Embedded** — `start_embedded_worker()` вызывается при старте FastAPI (продакшен)

Embedded-режим использует Redis-лок (`SET NX`, TTL 120s, renewal каждые 60s), чтобы при запуске 4-х Gunicorn-воркеров стартовал только один потребитель.

### `debounce.py` — Защита от дублирования

Redis-based механизмы:
- **Debounce** — группировка связанных событий (задержка 3 сек)
- **Cooldown** — игнорирование событий после наших собственных действий (30 сек)
- **Dedup** — `SET NX` по event_id (TTL 5 мин)

### `middleware/` — Pipeline

Цепочка проверок перед вызовом хендлера:
1. `DeduplicatorMiddleware` — event_id уже видели? → reject
2. `RateLimiterMiddleware` — группа шлёт слишком много? → reject
3. `SecretValidatorMiddleware` — secret в payload совпадает? → reject

Все middleware имеют общий интерфейс `process(event) → MiddlewareResult`.

### `handlers/` — Обработчики

Каждая категория — отдельная папка с `__init__.py` и `handler.py`:
- `confirmation/` — возвращает confirmation_code
- `wall/` — 4 хендлера: post_new, repost, schedule_new, schedule_delete
- Остальные категории — stub-хендлеры (логируют и возвращают `success=True`)

Автоимпорт через `handlers/__init__.py` → `_register_all_handlers()`.

---

## Redis-ключи

| Ключ | Тип | Назначение |
|---|---|---|
| `vk_callback:events` | List | FIFO-очередь событий |
| `vk_callback:seen:{event_id}` | String | Дедупликация (TTL 5 мин) |
| `vk_callback:ratelimit:{group_id}:{window}` | String (инкремент) | Rate limiting |
| `vk_callback:cooldown:{group_id}:{event_type}` | String | Cooldown (TTL 30 сек) |
| `vk_callback:debounce:{group_id}:{event_type}` | String | Debounce (TTL 3 сек) |
| `vk_callback:worker_lock` | String | Лок embedded-воркера (TTL 120 сек) |

---

## API Endpoints

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/vk/callback` | Приём событий от VK |
| GET | `/api/vk/callback/stats` | Статистика обработки |
| GET | `/api/vk/callback/queue` | Состояние очереди |
| DELETE | `/api/vk/callback/queue` | Очистка очереди |
| POST | `/api/callback` | Legacy-эндпоинт (делегирует в новый) |
