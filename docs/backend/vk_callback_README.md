# VK Callback Event System

> ⚠️ **Этот файл устарел.** Полная документация доступна в папке:  
> **[docs/backend/vk_callback/](vk_callback/)** — 6 файлов с детальной документацией.
>
> Краткие ссылки:
> - [Ссылки на документацию VK API](vk_callback/01_VK_DOCUMENTATION_LINKS.md)
> - [Архитектура системы](vk_callback/02_ARCHITECTURE.md)
> - [Справочник типов событий](vk_callback/03_EVENT_TYPES.md)
> - [Как добавить хендлер](vk_callback/04_HANDLER_GUIDE.md)
> - [Конфигурация](vk_callback/05_CONFIGURATION.md)
> - [Запуск и деплой](vk_callback/06_DEPLOYMENT.md)

---

Модульная система обработки событий от VK Callback API  
с Redis-очередью, middleware-пайплайном и авторегистрацией хендлеров (v2).

## Архитектура

```
services/vk_callback/
├── __init__.py              # Публичный API + ASCII-схема
├── config.py                # CallbackConfig (все параметры)
├── models.py                # EventType (40+ типов), CallbackEvent, HandlerResult
├── event_bus.py             # Redis-очередь (LPUSH/BRPOP, FIFO)
├── registry.py              # HandlerRegistry — авторегистрация
├── dispatcher.py            # confirmation синхронно, остальное → Redis
├── debounce.py              # Redis-based debounce / cooldown / dedup
├── worker.py                # Потребитель + embedded mode для продакшена
├── middleware/               # Pipeline: dedup → rate limit → secret
│   ├── base.py, deduplicator.py, rate_limiter.py, secret_validator.py
└── handlers/                # Обработчики по категориям (14 папок)
    ├── confirmation/, wall/ (4), wall_comments/, messages/,
    │   photos/, videos/, audio/, likes/, market/, board/,
    │   members/, group_management/, polls/, donut/
    └── base.py              # BaseEventHandler
```

## Поддерживаемые события

### Стена (wall)
- `wall_post_new` — Новый пост опубликован (сразу или из отложки)
- `wall_schedule_post_new` — Создан новый отложенный пост
- `wall_schedule_post_delete` — Удален/отредактирован отложенный пост

### Другие
- `confirmation` — Подтверждение сервера при настройке Callback API

## Debounce механизм

При редактировании отложенного поста VK присылает 2 события подряд:
1. `wall_schedule_post_delete` (старая версия)
2. `wall_schedule_post_new` (новая версия)

Также при публикации из отложки приходит:
1. `wall_post_new` (опубликованный пост)
2. `wall_schedule_post_delete` (удален из очереди)

Debouncer накапливает эти события и выполняет **одно** обновление с задержкой 2 секунды.

## Cooldown механизм

Когда наше приложение удаляет посты через VK API, VK присылает callback-события
об этих удалениях. Чтобы избежать лишних обновлений, используется cooldown:

### Как работает

1. **Перед удалением** — вызываем `set_event_cooldown(group_id, "wall_schedule_post_delete")`
2. **Обработчик получает событие** — проверяет `is_event_on_cooldown()` и пропускает его
3. **Cooldown истекает** — через 30 секунд события снова обрабатываются нормально

### Где используется

- `services/post_actions/delete.py` — устанавливает cooldown при удалении отложенных постов
- `handlers/wall.py` — `WallSchedulePostDeleteHandler` проверяет cooldown

### Пример

```python
from services.vk_callback.debounce import set_event_cooldown, clear_event_cooldown

# Перед операцией
set_event_cooldown(group_id, "wall_schedule_post_delete")

# Выполняем операции с VK API...
vk_service.call_vk_api('wall.delete', {...})

# Cooldown автоматически истечёт через 30 секунд
# Или можно снять вручную: clear_event_cooldown(group_id, "wall_schedule_post_delete")
```

## Использование

```python
from services.vk_callback import dispatch_event

# В роутере callback API
result, confirmation_code = dispatch_event(db, event_type, group_id, payload)

if event_type == "confirmation" and confirmation_code:
    return PlainTextResponse(content=confirmation_code)

return PlainTextResponse(content="ok")
```

## Добавление нового обработчика

1. Создайте файл в `handlers/` (например, `messages.py`)
2. Унаследуйте класс от `BaseEventHandler`
3. Укажите `HANDLES_EVENTS` — список типов событий
4. Реализуйте метод `handle()`
5. Добавьте в `handlers/__init__.py` в `ALL_HANDLERS`

```python
from .base import BaseEventHandler
from ..models import CallbackEvent, HandlerResult

class MessageNewHandler(BaseEventHandler):
    HANDLES_EVENTS = ["message_new"]
    
    def handle(self, db, event: CallbackEvent, project) -> HandlerResult:
        # Логика обработки
        self._log("Processing message", event)
        return HandlerResult(success=True, message="Message processed")
```

## Логирование

Все события автоматически логируются в таблицу `vk_callback_logs` через роутер.

Обработчики используют `self._log()` для консольного вывода с контекстом события.

## Конфигурация

- `debounce.py`: `delay_seconds = 2.0` — задержка debounce
- Токен для API запросов берется из `config.settings.vk_user_token`
