# 🚀 Запуск VK Callback Worker

Воркер — это процесс-потребитель Redis-очереди. Он забирает события (`BRPOP`),  
прогоняет через middleware и вызывает нужный хендлер.

---

## Локальная разработка

### Отдельный процесс (рекомендуется)

```bash
# Терминал 1 — Бэкенд (API)
cd "c:\Users\nikita79882\Desktop\vk planer code\12.02.2026\backend_python"
python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0

# Терминал 2 — VK Callback Worker
cd "c:\Users\nikita79882\Desktop\vk planer code\12.02.2026\backend_python"
python -m services.vk_callback.worker
```

Воркер запустится и будет ждать события в Redis-очереди:
```
[VK_CALLBACK_WORKER] Воркер запущен. Ожидание событий...
[VK_CALLBACK_WORKER] Queue: vk_callback:events | Timeout: 5s
```

### Без воркера (fallback)

Если воркер не запущен, а Redis доступен — события всё равно попадут в очередь,  
но не будут обработаны до запуска воркера.

Если Redis недоступен — система автоматически переключается на **синхронную обработку**  
(событие обрабатывается прямо в потоке API-запроса, с задержкой ответа VK).

---

## Продакшен (Yandex Serverless Container)

### Embedded Mode — автоматический запуск

В продакшене воркер **запускается автоматически** при старте FastAPI.  
Отдельный деплой или контейнер **не нужен**.

Механизм (в `main.py` → `startup_event()`):

```python
# Шаг 5: VK Callback Worker (embedded)
from services.vk_callback.worker import start_embedded_worker
start_embedded_worker()
```

### Как это работает с Gunicorn (4 воркера)

Gunicorn запускает 4 Uvicorn-процесса. Каждый из них вызывает `start_embedded_worker()`.  
Но Redis-лок гарантирует, что **только один** из них фактически запустит потребитель:

```
Gunicorn Worker 1 → start_embedded_worker() → Redis SET NX "vk_callback:worker_lock" → ✅ Лок получен → запуск
Gunicorn Worker 2 → start_embedded_worker() → Redis SET NX "vk_callback:worker_lock" → ❌ Лок занят → пропуск
Gunicorn Worker 3 → start_embedded_worker() → Redis SET NX "vk_callback:worker_lock" → ❌ Лок занят → пропуск
Gunicorn Worker 4 → start_embedded_worker() → Redis SET NX "vk_callback:worker_lock" → ❌ Лок занят → пропуск
```

Параметры лока:
- **TTL:** 120 секунд
- **Renewal:** каждые 60 секунд (фоновый поток)
- **При падении:** лок автоматически истечёт, другой процесс подхватит

### Остановка

При завершении FastAPI (`shutdown_event()`):
```python
from services.vk_callback.worker import stop_embedded_worker
stop_embedded_worker()
```

Воркер корректно завершает обработку текущего события и останавливается.

---

## Деплой

Обычная ревизия контейнера — воркер поднимется автоматически:

```bash
# Сборка и деплой (стандартный процесс)
docker build --no-cache -t vk-planner-backend-preprod .
docker tag vk-planner-backend-preprod cr.yandex/crpq5n1men523nvih5j4/vk-planner-backend:vXX
docker push cr.yandex/crpq5n1men523nvih5j4/vk-planner-backend:vXX
yc serverless container revision deploy ...
```

---

## Мониторинг

### API endpoints

```bash
# Статистика обработки
GET /api/vk/callback/stats

# Состояние очереди
GET /api/vk/callback/queue

# Очистка очереди (экстренный случай)
DELETE /api/vk/callback/queue
```

### Логи (Yandex Cloud)

```bash
yc logging read --group-name=default --folder-id=b1g1qicqnhgh8tthu3up --since=5m --limit=50
```

Искать строки с `[VK_CALLBACK_WORKER]` или `[VK_CALLBACK]`.

---

## Диагностика

| Симптом | Причина | Решение |
|---|---|---|
| События копятся в очереди | Воркер не запущен | Проверь логи на `start_embedded_worker` |
| `Redis connection refused` | Redis недоступен | Проверь `REDIS_HOST` / `REDIS_PORT` |
| Дублирование обработки | Лок не сработал | Проверь TTL лока (120s) и renewal |
| Событие обрабатывается медленно | Синхронный fallback | Запусти Redis / воркер |
| `unknown` тип события | VK добавил новый тип | Добавь в `EventType` enum и `EVENT_CATEGORY_MAP` |
