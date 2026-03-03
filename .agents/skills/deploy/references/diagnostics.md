# Diagnostics — Диагностика проблем деплоя

## Docker Desktop не запущен

**Симптом:** Ошибка `open //./pipe/dockerDesktopLinuxEngine`

**Решение:** Запустить Docker Desktop и подождать ~30 секунд.

```cmd
docker info
```

## YC CLI не авторизован

**Симптом:** Ошибка `No 'token'` или `no active profile`

**Решение:**
```cmd
yc init
```
→ Вставить OAuth-токен с https://oauth.yandex.ru/authorize?response_type=token&client_id=1a6990aa636648e9b2ef855fa7bec2fb

Проверка:
```cmd
yc config list
```

## Docker не авторизован в реестре Yandex

**Симптом:** Ошибка при `docker push`

**Решение:**
```cmd
yc container registry configure-docker
```

## Контейнер не стартует

**Диагностика:**
```cmd
yc logging read --group-name=default --folder-id=b1g1qicqnhgh8tthu3up --since=5m --limit=50
```

**Частые причины:**
- Забыли передать переменные окружения при ревизии → контейнер падает при старте
- Ошибка в `requirements.txt` → образ собрался, но не работает
- Порт не совпадает → контейнер ожидает $PORT из окружения

## Ошибка сборки Docker

**Диагностика:**
```cmd
cd "c:\Users\nikita79882\Desktop\vk planer code\12.02.2026\backend_python"
pip install -r requirements.txt
```

## Ошибка сборки фронтенда

**Диагностика:**
```cmd
cd "c:\Users\nikita79882\Desktop\vk planer code\12.02.2026"
npx tsc --noEmit
```

## CORS ошибки на фронте

**Диагностика:**
- Проверить список `origins` в `backend_python/main.py` (строки ~338-344)
- Для cross-domain cookies: `SameSite=None` + `Secure=True`
- Динамические ngrok-адреса поддерживаются через `allow_origin_regex`

## База данных: SSL/Connection errors

**Решение:**
- Настройки пула в `database.py`: `pool_pre_ping=True`, `pool_recycle=120`
- Увеличены `pool_size=10`, `max_overflow=20` для параллельных задач

## Проверка статуса после деплоя

```cmd
:: Список ревизий (статус должен быть ACTIVE)
yc serverless container revision list --container-name vk-planner-backend-preprod --limit 3

:: Логи (последние 2 минуты)
yc logging read --group-name=default --folder-id=b1g1qicqnhgh8tthu3up --since=2m --limit=30
```
