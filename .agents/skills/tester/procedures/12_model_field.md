# Процедура: Model-Field Contract (Router↔Model↔CRUD↔Schema)

**Триггер:** «model-field тест», «проверь поля модели», «тест роутер-модель», «проверь маппинг полей», «AttributeError на модели»
**Время:** 30 сек — 2 мин на модуль
**Приоритет:** 🔴 P0
**⚡ Параллельность:** БЕЗОПАСНО с frontend-тестами. Пишет в `tests/<модуль>/`. В СЛОЕ 2 — Саб-агент B параллельно с api_unit (Саб-агент A).

**Предыстория:** Роутер DLVRY обращался к 12+ несуществующим полям ORM-модели. Фронтенд-тесты с `vi.mock()` НЕ ловят такие баги. MagicMock тоже НЕ ловит. Только реальная in-memory SQLite + реальные ORM-объекты ломаются.

## TODO-шаблон

1. [ ] Определить модуль для тестирования
2. [ ] Прочитать 4 файла стека:
   - `models_library/<модуль>.py` → поля ORM-модели
   - `crud/<модуль>_crud.py` → сигнатуры функций
   - `routers/<модуль>.py` → маппинг model.field → response.field
   - `schemas/<модуль>_schemas.py` → Pydantic-схемы ответов
3. [ ] Написать 5 категорий тестов (smoke/empty/not-found/fields/values)
4. [ ] Запустить `pytest tests/<модуль>/test_<модуль>_integration.py -v`
5. [ ] Если 500 → это РЕАЛЬНЫЙ баг → исправить

## 5 обязательных категорий тестов

| Категория | Что проверяет |
|---|---|
| Smoke (200 not 500) | С данными → стек router→CRUD→model→schema работает |
| Empty data (200 not 500) | Пустая таблица не крашит |
| Not found (404 not 500) | Несуществующий ресурс → 404, не 500 |
| Field contract | Ответ содержит ВСЕ поля фронтенд-типа |
| Value mapping | Значения маппятся из модели корректно |

## Критично: StaticPool

```python
from sqlalchemy.pool import StaticPool
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # ОБЯЗАТЕЛЬНО! Без StaticPool потоки не видят таблицы
)
```

Без StaticPool каждый поток получает НОВОЕ соединение с пустой in-memory БД → `OperationalError: no such table`.

## Когда ОБЯЗАТЕЛЬНО запускать

| Ситуация | Действие |
|---|---|
| Создан новый роутер | Создать model-field тест для ВСЕХ эндпоинтов |
| Переименовано поле модели | Запустить тест → поймает AttributeError |
| Изменена сигнатура CRUD | Запустить тест → поймает TypeError |
| Изменена Pydantic-схема | Запустить тест → поймает ValidationError |
| Рефакторинг бэкенда | Запустить ВСЕ model-field тесты |

## Эталон

`backend_python/tests/dlvry/test_dlvry_integration.py` — 23 теста, 5 классов.

## Шаблоны

→ `references/model_field_contract_template.md`
