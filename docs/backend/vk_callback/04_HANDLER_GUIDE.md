# 🛠️ Как добавить новый обработчик событий

Пошаговый гайд по добавлению полноценного хендлера для нового типа событий VK Callback.

---

## Быстрый пример (за 3 шага)

### Шаг 1: Создай файл хендлера

Допустим, нужно реализовать обработку `message_new`.

Файл: `services/vk_callback/handlers/messages/handler.py`

```python
# Обработчик новых сообщений VK Callback
#
# Обрабатывает события: message_new

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult, EventType


class MessageNewHandler(BaseEventHandler):
    """Обработчик нового сообщения."""
    
    # Список типов событий, которые обрабатывает этот хендлер
    HANDLES_EVENTS = [
        EventType.MESSAGE_NEW,
    ]
    
    def handle(self, db, event: CallbackEvent, project) -> HandlerResult:
        """Основная логика обработки."""
        
        # Данные события в event.object
        message_data = event.object
        
        self._log(f"Новое сообщение от {message_data.get('from_id')}", event)
        
        # Бизнес-логика...
        
        return HandlerResult(
            success=True,
            message=f"message_new обработано для группы {event.group_id}"
        )
```

### Шаг 2: Зарегистрируй в `__init__.py` папки

Файл: `services/vk_callback/handlers/messages/__init__.py`

```python
from .handler import MessageNewHandler

__all__ = ['MessageNewHandler']
```

### Шаг 3: Готово! 🎉

Хендлер автоматически зарегистрируется при старте через `handlers/__init__.py` → `_register_all_handlers()`.

---

## Детальное описание

### Структура хендлера

Каждый хендлер наследует `BaseEventHandler`:

```python
class BaseEventHandler:
    """Базовый класс обработчика событий."""
    
    # Обязательно переопределить — список обрабатываемых типов
    HANDLES_EVENTS: list[str | EventType] = []
    
    def handle(self, db, event: CallbackEvent, project) -> HandlerResult:
        """Основной метод обработки. ОБЯЗАТЕЛЬНО переопределить."""
        raise NotImplementedError
    
    def _log(self, message: str, event: CallbackEvent = None):
        """Логирование с контекстом события."""
        # Автоматически добавляет event_type, group_id, event_id
```

### Параметры метода `handle()`

| Параметр | Тип | Описание |
|---|---|---|
| `db` | `Session` | SQLAlchemy-сессия для работы с БД |
| `event` | `CallbackEvent` | Объект события (type, group_id, object, event_id, secret) |
| `project` | `Project \| None` | Проект из БД, привязанный к group_id (может быть None) |

### Структура `CallbackEvent`

```python
class CallbackEvent(BaseModel):
    type: EventType          # Тип события (enum)
    group_id: int            # ID сообщества
    object: dict             # Данные события (payload)
    event_id: str = ""       # Уникальный ID события от VK
    secret: str = ""         # Секретный ключ (для валидации)
    ts: datetime             # Время получения
    raw_payload: dict = {}   # Полный исходный JSON от VK
```

### Структура `HandlerResult`

```python
class HandlerResult(BaseModel):
    success: bool            # Успешно ли обработано
    message: str = ""        # Описание результата
    data: dict = {}          # Дополнительные данные (опционально)
    confirmation_code: str = ""  # Для confirmation-хендлера
```

---

## Множественные хендлеры в одной папке

Одна папка может содержать несколько хендлеров. Пример — `wall/`:

```
handlers/wall/
├── __init__.py                # Экспорт всех классов
├── post_new.py                # WallPostNewHandler (wall_post_new)
├── repost.py                  # WallRepostHandler (wall_repost)
├── schedule_post_new.py       # WallSchedulePostNewHandler
└── schedule_post_delete.py    # WallSchedulePostDeleteHandler
```

`__init__.py`:
```python
from .post_new import WallPostNewHandler
from .repost import WallRepostHandler
from .schedule_post_new import WallSchedulePostNewHandler
from .schedule_post_delete import WallSchedulePostDeleteHandler

__all__ = [
    'WallPostNewHandler',
    'WallRepostHandler', 
    'WallSchedulePostNewHandler',
    'WallSchedulePostDeleteHandler',
]
```

---

## Работа с debounce / cooldown

### Debounce

Если события приходят «пачкой» (например, при редактировании отложки VK шлёт `schedule_post_delete` + `schedule_post_new`), используй debounce:

```python
from ...debounce import should_debounce

class MyHandler(BaseEventHandler):
    HANDLES_EVENTS = [EventType.WALL_SCHEDULE_POST_NEW]
    
    def handle(self, db, event, project):
        # Если к этому group_id уже пришло событие менее 3 сек назад — пропускаем
        if should_debounce(event.group_id, "wall_schedule"):
            self._log("Debounce: пропускаем дубль", event)
            return HandlerResult(success=True, message="Debounced")
        
        # Основная логика...
```

### Cooldown

Если наше приложение само инициирует действие (удаление поста через API), а VK присылает callback:

```python
from ...debounce import is_event_on_cooldown

class MyHandler(BaseEventHandler):
    def handle(self, db, event, project):
        if is_event_on_cooldown(event.group_id, event.type.value):
            self._log("Cooldown: пропускаем наше собственное действие", event)
            return HandlerResult(success=True, message="On cooldown")
        
        # Обработка внешнего события...
```

А перед вызовом VK API:
```python
from services.vk_callback.debounce import set_event_cooldown

# Перед удалением поста через VK API
set_event_cooldown(group_id, "wall_schedule_post_delete")
vk_service.call_vk_api("wall.delete", {...})
```

---

## Работа с БД внутри хендлера

```python
from crud.post_crud import get_post_by_vk_id, update_post_status

class WallPostNewHandler(BaseEventHandler):
    HANDLES_EVENTS = [EventType.WALL_POST_NEW]
    
    def handle(self, db, event, project):
        post_data = event.object
        vk_post_id = post_data.get("id")
        
        # Поиск поста в нашей БД
        existing_post = get_post_by_vk_id(db, project.id, vk_post_id)
        
        if existing_post:
            update_post_status(db, existing_post.id, status="published")
            self._log(f"Пост {vk_post_id} обновлён в БД", event)
        else:
            self._log(f"Пост {vk_post_id} не найден в БД — внешний пост", event)
        
        return HandlerResult(success=True, message=f"wall_post_new для {vk_post_id}")
```

---

## Чек-лист нового хендлера

- [ ] Создан файл `handler.py` в соответствующей папке `handlers/{category}/`
- [ ] Класс наследует `BaseEventHandler`
- [ ] Заполнен `HANDLES_EVENTS` с нужными `EventType`
- [ ] Реализован метод `handle()` с возвратом `HandlerResult`
- [ ] Экспортирован в `__init__.py` папки (в `__all__`)
- [ ] Протестировано локально (поднять воркер + отправить тестовый POST)
- [ ] Добавлен в таблицу «Статус реализации» в `03_EVENT_TYPES.md`
