````markdown
# Шаблон Model-Field Contract теста (Router↔Model↔CRUD↔Schema)

## Зачем

Ловит несоответствия между роутером, ORM-моделью, CRUD-функциями и Pydantic-схемой
на уровне **реальных SQL-запросов и реальных ORM-объектов**.

**MagicMock-тесты НЕ ловят такие баги:**
- `o.client_phone` вместо `o.phone` → MagicMock молча вернёт новый мок
- `page/page_size` вместо `skip/limit` → MagicMock примет любые kwargs
- `total_count` вместо `total` → мок не валидирует Pydantic

**Model-Field Contract ЛОВИТ:**
- AttributeError на реальном ORM-объекте → 500 → тест видит

## Файл: tests/<модуль>/test_<модуль>_integration.py

```python
"""
Интеграционный тест роутера <МОДУЛЬ>.

ЗАЧЕМ ЭТОТ ТЕСТ:
    Ловит несоответствия между роутером ↔ моделью ↔ CRUD ↔ схемой
    на уровне *реальных SQL-запросов и реальных ORM-объектов*.

    MagicMock-тесты НЕ ловят такие баги:
      - обращение к несуществующему полю модели (o.client_phone вместо o.phone)
      - неправильная сигнатура CRUD (page/page_size vs skip/limit)
      - несовпадение полей в Pydantic-схеме и фактическом ответе

    Здесь мы используем in-memory SQLite + реальный TestClient →
    любая такая ошибка сразу даёт 500 Internal Server Error.

ПАТТЕРН:
    1. Создаём движок sqlite:///:memory: и реальные таблицы из моделей
    2. Переопределяем get_db через app.dependency_overrides
    3. Вставляем тестовые данные через ORM
    4. Вызываем эндпоинты через TestClient
    5. Проверяем status_code + структуру JSON-ответа
"""

import sys
import os
import pytest
from datetime import datetime, timezone

# Добавляем корень бэкенда в путь
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from database import Base, get_db
from main import app
# TODO: Заменить на реальные модели модуля
from models_library.<модуль> import <Model>, <RelatedModel>


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Фикстуры
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@pytest.fixture(scope="function")
def test_db():
    """
    Создаёт in-memory SQLite с реальными таблицами.

    ВАЖНО: StaticPool гарантирует, что ВСЕ соединения работают с одной и той же
    in-memory БД. Без StaticPool каждое новое соединение (в т.ч. из другого потока,
    куда FastAPI передаёт sync-эндпоинты через anyio.to_thread.run_sync)
    получило бы ПУСТУЮ in-memory БД без таблиц → OperationalError: no such table.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Создаём только нужные таблицы (не все — иначе потянет зависимости)
    <Model>.__table__.create(bind=engine, checkfirst=True)
    <RelatedModel>.__table__.create(bind=engine, checkfirst=True)
    # TODO: Добавить все таблицы, используемые модулем

    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestSession()
    yield session
    session.close()
    engine.dispose()


@pytest.fixture(scope="function")
def client(test_db):
    """TestClient с подменённой зависимостью get_db."""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    # raise_server_exceptions=False — чтобы тест видел 500, а не exception
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Хелперы — вставка тестовых данных
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _insert_test_item(db, **overrides) -> "<Model>":
    """
    Вставляет тестовый объект в БД и возвращает ORM объект.
    
    ВАЖНО: Заполнить ВСЕ NOT NULL поля модели дефолтными значениями.
    Overrides позволяют переопределять конкретные поля в тестах.
    """
    defaults = dict(
        # TODO: Заполнить реальными полями модели
        # Все NOT NULL поля ДОЛЖНЫ быть здесь
        name="Тестовый элемент",
        status="active",
        created_at=datetime.now(timezone.utc),
        # ...
    )
    defaults.update(overrides)
    item = <Model>(**defaults)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def _insert_test_related(db, parent_id: int, **overrides) -> "<RelatedModel>":
    """Вставляет связанный объект (если есть связь один-ко-многим)."""
    defaults = dict(
        parent_id=parent_id,
        # TODO: Заполнить реальными полями
    )
    defaults.update(overrides)
    item = <RelatedModel>(**defaults)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Категория 1: Smoke (200 не 500 — базовая связка стека)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestSmoke:
    """
    Базовая проверка: эндпоинты не падают с 500.
    Если падает → несоответствие полей модели / CRUD / схемы.
    """

    def test_list_returns_200(self, client, test_db):
        """GET /list с данными → 200, не 500."""
        _insert_test_item(test_db)
        r = client.get("/api/<модуль>/")
        assert r.status_code == 200, (
            f"Ожидали 200, получили {r.status_code}. "
            f"Тело: {r.text[:500]}. "
            f"Скорее всего несоответствие полей модели / CRUD / схемы."
        )

    def test_detail_returns_200(self, client, test_db):
        """GET /detail с данными → 200, не 500."""
        item = _insert_test_item(test_db)
        r = client.get(f"/api/<модуль>/{item.id}")
        assert r.status_code == 200, (
            f"Detail вернул {r.status_code}: {r.text[:500]}"
        )

    # TODO: Добавить smoke для КАЖДОГО GET-эндпоинта модуля
    # def test_stats_returns_200(self, client, test_db): ...


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Категория 2: Empty Data (пустая таблица → 200, не 500)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestEmptyData:
    """
    Пустая таблица — частый источник NoneType/StopIteration ошибок.
    Каждый GET-эндпоинт ДОЛЖЕН корректно работать на пустой БД.
    """

    def test_empty_list_returns_200(self, client, test_db):
        """Пустая таблица → 200 с пустым списком, а не 500."""
        r = client.get("/api/<модуль>/")
        assert r.status_code == 200
        # Проверить что возвращает пустой список (формат зависит от схемы)
        # assert r.json()["items"] == []
        # assert r.json()["total"] == 0

    def test_empty_stats_returns_200(self, client, test_db):
        """Агрегация на пустой таблице → 200 с нулями, не 500."""
        r = client.get("/api/<модуль>/stats")
        assert r.status_code == 200
        # assert r.json()["total_count"] == 0

    # TODO: Добавить для КАЖДОГО GET-эндпоинта


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Категория 3: Not Found (несуществующий ресурс → 404, не 500)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestNotFound:
    """
    Запрос несуществующего ресурса должен возвращать 404.
    Если возвращает 500 — в роутере нет проверки на None.
    """

    def test_detail_not_found_returns_404(self, client, test_db):
        """Несуществующий ID → 404, а не 500."""
        r = client.get("/api/<модуль>/99999")
        assert r.status_code == 404


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Категория 4: Field Contract (поля ответа ↔ фронтенд-тип)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestFieldContract:
    """
    Контрактные тесты — ответ содержит ВСЕ поля,
    которые ожидает фронтенд (TypeScript тип).
    
    Если бэкенд добавляет/убирает поле → тест ломается.
    """

    def test_list_response_has_required_fields(self, client, test_db):
        """JSON-ответ содержит поля, которые ожидает фронтенд."""
        _insert_test_item(test_db)
        r = client.get("/api/<модуль>/")
        assert r.status_code == 200
        data = r.json()

        # TODO: Верхний уровень (обёртка списка)
        assert "items" in data, "Нет поля 'items'"
        assert "total" in data, "Нет поля 'total'"

        # TODO: Поля элемента (из фронтенд TypeScript типа)
        item = data["items"][0]
        expected_fields = [
            "id", "name", "status", "created_at",
            # TODO: Все поля из фронтенд-типа
        ]
        for field in expected_fields:
            assert field in item, (
                f"Поле '{field}' отсутствует в ответе. "
                f"Фронтенд ожидает это поле. "
                f"Имеющиеся: {list(item.keys())}"
            )

    def test_detail_response_has_required_fields(self, client, test_db):
        """Детали содержат ВСЕ поля фронтенд-типа DetailType."""
        item = _insert_test_item(test_db)
        r = client.get(f"/api/<модуль>/{item.id}")
        assert r.status_code == 200
        data = r.json()

        detail_fields = [
            "id", "name", "status", "created_at",
            # TODO: Все поля из фронтенд DetailType
        ]
        for field in detail_fields:
            assert field in data, (
                f"Поле '{field}' отсутствует в деталях. "
                f"Имеющиеся: {list(data.keys())}"
            )

    def test_full_contract(self, client, test_db):
        """Полный контракт — набор ключей точно совпадает."""
        _insert_test_item(test_db)
        r = client.get("/api/<модуль>/")
        assert r.status_code == 200

        data = r.json()
        # Верхний уровень
        assert set(data.keys()) >= {"items", "total"}

        # Каждый элемент
        if data["items"]:
            item_keys = set(data["items"][0].keys())
            required_keys = {
                "id", "name", "status", "created_at",
                # TODO: Все обязательные поля
            }
            missing = required_keys - item_keys
            assert not missing, (
                f"Контракт нарушен! Фронтенд ожидает поля {missing}, "
                f"но бэкенд их не вернул. Имеющиеся: {item_keys}"
            )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Категория 5: Value Mapping (значения из модели → ответ)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestValueMapping:
    """
    Проверяет что значения из ORM-модели корректно маппятся
    в поля JSON-ответа. Ловит:
    - model.phone → response.client_phone (переименование)
    - model.is_preorder → response.preorder (упрощение имени)
    - datetime → isoformat() (сериализация)
    - Вычисляемые поля (total = price × quantity)
    """

    def test_list_values_correct(self, client, test_db):
        """Значения маппятся корректно (не None от MagicMock)."""
        _insert_test_item(test_db, name="Тест")
        r = client.get("/api/<модуль>/")
        item = r.json()["items"][0]

        # TODO: Замапить реальные поля
        assert item["name"] == "Тест"
        assert item["created_at"] is not None  # datetime → isoformat()

    def test_detail_values_correct(self, client, test_db):
        """Маппинг model → response (ключевые проблемные поля)."""
        item = _insert_test_item(test_db)
        r = client.get(f"/api/<модуль>/{item.id}")
        data = r.json()

        # TODO: Проверить ВСЕ поля с переименованием
        # assert data["client_phone"] == "+79001234567"  # model.phone → client_phone
        # assert data["payment_type"] == "Онлайн"        # model.payment_name → payment_type
```

## Как адаптировать

1. **Заменить `<модуль>`** на реальное имя (dlvry, messages, posts, etc.)
2. **Заменить `<Model>`** на ORM-класс из `models_library/`
3. **Заполнить `_insert_test_item`** — ВСЕ NOT NULL поля модели
4. **Заполнить `expected_fields`** — из фронтенд TypeScript типа (features/X/types/)
5. **Заполнить маппинг значений** — model.field → response.field_name

## Ключевые правила

1. **`StaticPool` ОБЯЗАТЕЛЕН** — без него потоки не видят таблицы → ложный 500
2. **`raise_server_exceptions=False`** в TestClient — чтобы тест видел 500, а не exception
3. **Создавать таблицы через `__table__.create()`** — не `Base.metadata.create_all()` (потянет ВСЕ модели)
4. **Тестовые данные через ORM** — не SQL-вставки (проверяет что модель вообще создаётся)
5. **Только нужные таблицы** — не все модели проекта (избегаем конфликтов зависимостей)
6. **`scope="function"`** — изоляция между тестами (чистая БД на каждый тест)

## Запуск

```bash
cd "c:\Users\nikita79882\Desktop\vk planer code\12.02.2026\backend_python"
pytest tests/<модуль>/test_<модуль>_integration.py -v --tb=short
```

## Живой пример

Эталонная реализация: `backend_python/tests/dlvry/test_dlvry_integration.py` — **23 теста, 5 классов, ~530 строк.**

````
