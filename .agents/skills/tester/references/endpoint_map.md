# Карта API эндпоинтов (28 роутеров)

## Все роутеры бэкенда

| # | Роутер | Prefix | Описание |
|---|--------|--------|----------|
| 1 | `vk_callback` | `/api/vk` | VK Callback API |
| 2 | `auth` | `/api` | Авторизация (login, token, register) |
| 3 | `users` | `/api` | Управление пользователями |
| 4 | `projects` | `/api` | CRUD проектов |
| 5 | `posts` | `/api` | CRUD постов, расписание |
| 6 | `system_posts` | `/api` | Системные посты |
| 7 | `ai` | `/api/ai` | AI-генерация текстов |
| 8 | `media` | `/api/media` | Загрузка/обработка медиа |
| 9 | `notes` | `/api` | Заметки |
| 10 | `management` | `/api` | Управление БД |
| 11 | `tags` | `/api/tags` | Теги |
| 12 | `ai_presets` | `/api/ai-presets` | AI-пресеты промптов |
| 13 | `global_variables` | `/api/global-variables` | Глобальные переменные |
| 14 | `market` | `/api/market` | Товары (CRUD) |
| 15 | `market_ai` | `/api/market/ai` | AI для товаров |
| 16 | `lists` | `/api` | Системные списки |
| 17 | `system_accounts` | `/api` | Системные аккаунты |
| 18 | `project_context` | `/api` | Контекст проекта |
| 19 | `ai_tokens` | `/api` | AI-токены |
| 20 | `automations` | `/api` | Автоматизации |
| 21 | `automations_ai` | `/api` | AI-автоматизации постов |
| 22 | `automations_general` | `/api` | Общие автоматизации |
| 23 | `stories_automation` | `/api` | Автоматизация сторис |
| 24 | `contest_v2` | — | Конкурсы v2 |
| 25 | `bulk_edit` | `/api` | Массовое редактирование |
| 26 | `batch` | `/api` | Пакетная загрузка |
| 27 | `vk_test_auth` | — | Тестовая авторизация VK |
| 28 | `sandbox` | — | Песочница |

## Безопасные для smoke-теста эндпоинты (GET без побочных эффектов)

```python
SAFE_GET_ENDPOINTS = [
    # Проекты
    ("/api/projects/", 200),
    
    # Посты (нужен project_id)
    ("/api/posts/?project_id=1", 200),
    
    # Теги
    ("/api/tags/", 200),
    
    # AI-пресеты
    ("/api/ai-presets/", 200),
    
    # Глобальные переменные
    ("/api/global-variables/", 200),
    
    # Товары (нужен project_id)
    ("/api/market/products/?project_id=1", 200),
    
    # Списки
    ("/api/lists/", 200),
    
    # Системные аккаунты
    ("/api/system-accounts/", 200),
    
    # Заметки (нужен project_id)
    ("/api/notes/?project_id=1", 200),
]
```

## Эндпоинты которые НЕ тестировать в smoke (имеют побочные эффекты)

- `POST /api/ai/*` — вызывают внешний API (Google AI), тратят токены
- `POST /api/media/upload` — загрузка файлов
- `POST /api/vk/*` — отправка в VK
- `DELETE *` — удаление данных
- Всё что связано с `automations` и `stories_automation` — запускает процессы

## Обновление карты

При добавлении нового роутера в `main.py` → обновить эту карту.
Последнее обновление: 19.02.2026
