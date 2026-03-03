# Isolation Rules — Правила изоляции песочницы

## Разрешено редактировать

| Путь | Назначение |
|------|------------|
| `backend_python/routers/sandbox.py` | Роутер песочницы |
| `backend_python/services/sandbox/` | Вся папка сервисов (любые файлы внутри) |
| `features/sandbox/` | Вся папка фронтенда (компоненты, хуки, стили) |
| `docs/sandbox/` | Документация песочницы |

## Запрещено редактировать

| Путь | Причина |
|------|---------|
| `backend_python/services/vk_api/` | Основной VK-клиент |
| `backend_python/crud/` | CRUD-операции с БД |
| `backend_python/models.py` | Модели SQLAlchemy |
| `backend_python/schemas/` | Pydantic-схемы |
| `features/posts/` | Основной функционал постов |
| `features/products/` | Функционал товаров |
| `shared/` | Общие утилиты и компоненты |
| `hooks/` | Общие хуки приложения |
| `services/` | Общие сервисы фронтенда |
| `contexts/` | Контексты React |

## Исключения (минимальные правки)

Следующие файлы можно редактировать **только** для добавления/удаления навигации и роутинга песочницы:

- `App.tsx` — import + Route
- `PrimarySidebar.tsx` — пункт навигации
- `AppContent.tsx` — роут
- `backend_python/main.py` — include_router

**Разрешено:** добавить import + 1 строку регистрации.
**Запрещено:** менять любую другую логику этих файлов.

## Разрешено читать (как справку)

- Весь код проекта — понимание архитектуры, паттернов, примеров
- `services/vk_api/` — как VK API используется в основном коде
- UI-компоненты — стили, паттерны взаимодействия

## Принцип изоляции сервисов

Каждый тест в песочнице **самодостаточен**:
- Свои функции `_make_vk_request`, `_upload_file_to_url`
- Или импорт общих утилит из `backend_python/services/sandbox/`
- **Никогда** не импортировать из `backend_python/services/vk_api/` или `backend_python/crud/`
- Логировать каждый шаг: `request`, `response`, `elapsed_ms`, `error`
