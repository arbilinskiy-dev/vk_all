# VK Callback Event System — Документация

Модульная система обработки событий от VK Callback API  
с Redis-очередью, middleware-пайплайном и автоматической регистрацией хендлеров.

---

## Оглавление

| Файл | Описание |
|---|---|
| [01_VK_DOCUMENTATION_LINKS.md](01_VK_DOCUMENTATION_LINKS.md) | 🔗 Ссылки на официальную документацию VK API |
| [02_ARCHITECTURE.md](02_ARCHITECTURE.md) | 🏗️ Архитектура системы, поток данных, компоненты |
| [03_EVENT_TYPES.md](03_EVENT_TYPES.md) | 📋 Справочник всех типов событий и категорий |
| [04_HANDLER_GUIDE.md](04_HANDLER_GUIDE.md) | 🛠️ Как добавить новый обработчик событий |
| [05_CONFIGURATION.md](05_CONFIGURATION.md) | ⚙️ Настройки, таймауты, Redis-ключи |
| [06_DEPLOYMENT.md](06_DEPLOYMENT.md) | 🚀 Запуск воркера: локально и в продакшене |

---

## Быстрый старт

```python
# Точка входа — используется в роутере
from services.vk_callback import dispatch_event

result, confirmation_code = dispatch_event(db, event_type, group_id, payload)
```

```bash
# Запуск воркера отдельным процессом (локально)
cd backend_python
python -m services.vk_callback.worker
```

---

## Структура файлов

```
services/vk_callback/
├── __init__.py              # Публичный API + ASCII-схема архитектуры
├── config.py                # CallbackConfig (dataclass) — все параметры
├── models.py                # EventType (40+ типов), CallbackEvent, HandlerResult
├── event_bus.py             # Redis-очередь (LPUSH/BRPOP, FIFO)
├── registry.py              # HandlerRegistry — авторегистрация
├── dispatcher.py            # Точка входа: confirmation синхронно, остальное → Redis
├── debounce.py              # Redis-based debounce / cooldown / dedup
├── worker.py                # Потребитель очереди + embedded mode для продакшена
├── middleware/               # Pipeline обработки перед хендлером
│   ├── __init__.py
│   ├── base.py              # run_middleware_chain()
│   ├── deduplicator.py      # Фильтр дублей по event_id
│   ├── rate_limiter.py      # Лимит событий от группы
│   └── secret_validator.py  # Проверка secret из payload
└── handlers/                # Обработчики по категориям
    ├── __init__.py           # _register_all_handlers() — автоимпорт
    ├── base.py               # BaseEventHandler
    ├── confirmation/         # Подтверждение сервера
    ├── wall/                 # Записи на стене (4 хендлера)
    ├── wall_comments/        # Комментарии на стене
    ├── messages/             # Личные сообщения
    ├── photos/               # Фотографии
    ├── videos/               # Видео
    ├── audio/                # Аудио
    ├── likes/                # Лайки
    ├── market/               # Товары
    ├── board/                # Обсуждения
    ├── members/              # Участники
    ├── group_management/     # Управление сообществом
    ├── polls/                # Опросы
    └── donut/                # VK Donut
```
