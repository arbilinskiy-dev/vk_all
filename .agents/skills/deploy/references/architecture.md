# Architecture — Архитектура деплоя

## Схема

```
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│  Yandex Object Storage (S3)          │     │  Yandex VM (Ubuntu 24.04)            │
│  (бакеты: prod / preprod)            │     │  Docker + Nginx + Let's Encrypt      │
│                                      │     │                                      │
│  Статический фронтенд (React SPA)    │────▶│  FastAPI бэкенд (/api/*)             │
│  index.html                          │HTTPS│  Gunicorn + 4 Uvicorn Workers        │
│  assets/*.js, *.css                  │     │  https://api.dosmmit.ru              │
└──────────────────────────────────────┘     └────────────┬─────────────────────────┘
                                                          │
                                             ┌────────────▼─────────────────────────┐
                                             │  PostgreSQL (Yandex Managed DB)      │
                                             │  БД: db1, Порт: 6432                │
                                             │  Таблицы: projects, posts, tokens,   │
                                             │  notes, tags, lists, products...     │
                                             └──────────────────────────────────────┘
```

- **Фронтенд** — статика из Object Storage (режим «Веб-сайт»)
- **API-запросы** — из фронтенда на VM через HTTPS (api.dosmmit.ru)
- **Бэкенд** — Python/FastAPI, Gunicorn с 4 Uvicorn-воркерами, Docker на VM
- **SSL** — Let's Encrypt, автопродление через certbot
- **Резерв** — Serverless Container остаётся как fallback

## Окружения

| Параметр | Предпродакшен | Продакшен |
|----------|--------------|-----------|
| Бэкенд | VM `vkplaner-backend` (Docker + Nginx + SSL) | `vk-planner-backend-preprod` (Serverless, резерв) |
| URL бэкенда | `https://api.dosmmit.ru` | `https://bba15i6uulg2j0uk90sm.containers.yandexcloud.net` |
| S3 бакет фронтенда | `vk-content-planner-frontend-preprod` | `vk-content-planner-frontend` |
| URL фронтенда | `https://vk-content-planner-frontend-preprod.website.yandexcloud.net` | `https://vk-content-planner-frontend.website.yandexcloud.net` |
| CORS домены | localhost:5173, localhost:3000, preprod URL, dosmmit.ru, ngrok | localhost:5173, localhost:3000, prod URL, ngrok |

## Файлы конфигурации

| Файл | Назначение |
|------|-----------|
| `backend_python/Dockerfile` | Образ Python 3.11-slim, Gunicorn + Uvicorn, порт из $PORT |
| `backend_python/.dockerignore` | Исключения для Docker-контекста |
| `backend_python/.env` | Локальные переменные окружения (НЕ попадает в Docker) |
| `backend_python/.env.example` | Шаблон переменных окружения |
| `backend_python/config.py` | Pydantic Settings — чтение переменных окружения |
| `backend_python/database.py` | SQLAlchemy: auto-выбор PostgreSQL / SQLite |
| `backend_python/deploy_preprod.bat` | Батник деплоя на Serverless Container (резерв) |
| `backend_python/vm_deploy/deploy_vm.bat` | Батник деплоя на VM (основной) |
| `backend_python/vm_deploy/docker-compose.yml` | Docker Compose для VM |
| `backend_python/vm_deploy/nginx_api.conf` | Nginx конфиг для api.dosmmit.ru |
| `backend_python/vm_deploy/.env.production` | Переменные окружения для VM |
| `shared/config.ts` | URL API для фронтенда (prod / preprod / local) |
| `vite.config.ts` | Конфигурация сборки Vite |
| `package.json` | Скрипты сборки фронтенда |

## Параметры VM (предпрод)

```
VM:        vkplaner-backend (fhmf2vlcu2013ed30ui2)
IP:        93.77.184.105
OS:        Ubuntu 24.04 LTS
vCPU/RAM:  2 / 4 ГБ
Диск:      20 ГБ SSD
SSH:       yc-user, ключ %USERPROFILE%\.ssh\id_ed25519
Domain:    api.dosmmit.ru
SSL:       Let's Encrypt, автопродление, до 20.05.2026
Docker:    compose в /home/yc-user/vkplanner/
Nginx:     reverse proxy → localhost:8000
```

## Параметры Serverless Container (резерв)

Ревизию создаёт **пользователь** (через батник или консоль YC).

Параметры контейнера (для справки):
```
--memory 4GB
--execution-timeout 300s
--cores 2
--core-fraction 100
--concurrency 16
--min-instances 1
--service-account-id ajevmi0k5m5lb1t7h2fj
```

## VK Callback Worker

В продакшене воркер запускается **автоматически** в фоновом потоке при старте FastAPI:
- `start_embedded_worker()` в `main.py`
- Redis-лок гарантирует, что только 1 из 4 Gunicorn-воркеров запустит callback-обработчик
- Отдельный деплой воркера **не требуется** — ревизия контейнера включает всё

Локально — запускается отдельным процессом: `python -m services.vk_callback.worker`
