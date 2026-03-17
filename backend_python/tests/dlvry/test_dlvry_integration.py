"""
Интеграционный тест роутера DLVRY.

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
from models_library.dlvry_orders import DlvryOrder, DlvryOrderItem, DlvryWebhookLog


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
    DlvryOrder.__table__.create(bind=engine, checkfirst=True)
    DlvryOrderItem.__table__.create(bind=engine, checkfirst=True)
    DlvryWebhookLog.__table__.create(bind=engine, checkfirst=True)

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
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


def _insert_test_order(db, **overrides) -> DlvryOrder:
    """Вставляет тестовый заказ в БД и возвращает ORM объект."""
    defaults = dict(
        dlvry_order_id="test-100",
        affiliate_id="aff-1",
        project_id="proj-1",
        owner_id="owner-1",
        vk_group_id="123456",
        vk_user_id="789",
        client_name="Иван Тестов",
        phone="+79001234567",
        phone_raw="89001234567",
        client_email="test@test.ru",
        client_bday="1990-01-15",
        source_code="vkapp",
        source_name="VK Mini App",
        payment_code="online",
        payment_name="Онлайн",
        delivery_code="delivery",
        delivery_name="Доставка",
        delivery_price=100.0,
        address_city="Москва",
        address_street="Пушкина",
        address_house="10",
        address_apt="5",
        address_full="г. Москва, ул. Пушкина, д. 10, кв. 5",
        items_text="Пицца × 2",
        items_count=1,
        items_total_qty=2,
        order_sum=1000.0,
        discount=100.0,
        total=900.0,
        cost=450.0,
        payment_bonus=50.0,
        markup=30.0,
        vk_platform="desktop_web",
        persons=2,
        promocode="СКИДКА",
        comment="Тестовый заказ",
        is_preorder=False,
        order_date=datetime(2026, 3, 1, 10, 30, tzinfo=timezone.utc),
        order_date_str="01.03.2026 10:30:00",
        received_at=datetime(2026, 3, 1, 10, 31, tzinfo=timezone.utc),
        status="received",
        raw_json='{"test": true}',
    )
    defaults.update(overrides)
    order = DlvryOrder(**defaults)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def _insert_test_item(db, order_id: int, **overrides) -> DlvryOrderItem:
    """Вставляет тестовую позицию заказа."""
    defaults = dict(
        order_id=order_id,
        dlvry_item_id="item-1",
        code="pizza-001",
        name="Пицца Маргарита",
        price=500.0,
        quantity=2,
        full_price=500.0,
        cost_price=200.0,
        weight="500",
    )
    defaults.update(overrides)
    item = DlvryOrderItem(**defaults)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def _insert_test_webhook_log(db, **overrides) -> DlvryWebhookLog:
    """Вставляет тестовый лог вебхука."""
    defaults = dict(
        remote_ip="1.2.3.4",
        affiliate_id="aff-1",
        dlvry_order_id="test-100",
        result="ok",
        error_message=None,
        payload='{"test": true}',
    )
    defaults.update(overrides)
    log = DlvryWebhookLog(**defaults)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /api/dlvry/orders — список заказов
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestGetOrders:
    """
    Тестирует GET /api/dlvry/orders.
    Ловит: AttributeError на модели, TypeError в CRUD, несовпадение схемы.
    """

    def test_returns_200_not_500(self, client, test_db):
        """Эндпоинт не падает с 500 — базовая проверка связки router→CRUD→model→schema."""
        _insert_test_order(test_db)
        r = client.get("/api/dlvry/orders", params={"project_id": "proj-1"})
        assert r.status_code == 200, (
            f"Ожидали 200, получили {r.status_code}. "
            f"Тело: {r.text[:500]}. "
            f"Скорее всего несоответствие полей модели / CRUD / схемы."
        )

    def test_response_has_required_fields(self, client, test_db):
        """JSON-ответ содержит поля, которые ожидает фронтенд."""
        _insert_test_order(test_db)
        r = client.get("/api/dlvry/orders", params={"project_id": "proj-1"})
        assert r.status_code == 200
        data = r.json()

        # Верхний уровень (фронтенд: DlvryOrdersListResponse)
        assert "orders" in data, "Нет поля 'orders' — фронтенд ожидает его"
        assert "total" in data, "Нет поля 'total' — фронтенд ожидает его"
        assert "skip" in data, "Нет поля 'skip' — фронтенд ожидает его"
        assert "limit" in data, "Нет поля 'limit' — фронтенд ожидает его"

        # Ни в коем случае не page/page_size (старая схема)
        assert "page" not in data, "Поле 'page' — фронтенд ожидает 'skip'"
        assert "page_size" not in data, "Поле 'page_size' — фронтенд ожидает 'limit'"

    def test_order_fields_match_frontend_types(self, client, test_db):
        """Каждый заказ в списке содержит все поля фронтенд-типа DlvryOrder."""
        _insert_test_order(test_db)
        r = client.get("/api/dlvry/orders", params={"project_id": "proj-1"})
        assert r.status_code == 200

        orders = r.json()["orders"]
        assert len(orders) >= 1

        order = orders[0]
        # Поля из фронтенд-типа DlvryOrder (services/api/dlvry.api.ts)
        expected_fields = [
            "id", "dlvry_order_id", "affiliate_id", "order_date",
            "client_name", "client_phone", "total",
            "payment_type", "delivery_type", "source_name",
            "status", "items_count", "created_at",
            # Расширенные поля для переключаемых групп колонок
            "cost", "discount", "delivery_price", "subtotal",
            "payment_bonus", "markup", "vk_platform", "vk_user_id",
            "address_city", "persons", "items_total_qty",
            "promocode", "comment", "is_preorder",
        ]
        for field in expected_fields:
            assert field in order, (
                f"Поле '{field}' отсутствует в ответе заказа. "
                f"Фронтенд ожидает это поле (DlvryOrder тип). "
                f"Имеющиеся поля: {list(order.keys())}"
            )

    def test_order_values_are_correct(self, client, test_db):
        """Значения полей маппятся из модели корректно (не None от MagicMock)."""
        _insert_test_order(test_db)
        r = client.get("/api/dlvry/orders", params={"project_id": "proj-1"})
        order = r.json()["orders"][0]

        assert order["client_name"] == "Иван Тестов"
        assert order["client_phone"] == "+79001234567"  # model.phone → response.client_phone
        assert order["payment_type"] == "Онлайн"  # model.payment_name → response.payment_type
        assert order["delivery_type"] == "Доставка"  # model.delivery_name → response.delivery_type
        assert order["source_name"] == "VK Mini App"
        assert order["total"] == 900.0
        assert order["items_count"] == 1
        assert order["created_at"] is not None  # model.received_at → response.created_at
        # Расширенные поля
        assert order["cost"] == 450.0
        assert order["discount"] == 100.0
        assert order["delivery_price"] == 100.0
        assert order["subtotal"] == 1000.0  # model.order_sum → subtotal
        assert order["payment_bonus"] == 50.0
        assert order["markup"] == 30.0
        assert order["vk_platform"] == "desktop_web"
        assert order["vk_user_id"] == "789"
        assert order["address_city"] == "Москва"
        assert order["persons"] == 2
        assert order["items_total_qty"] == 2
        assert order["promocode"] == "СКИДКА"
        assert order["comment"] == "Тестовый заказ"
        assert order["is_preorder"] == False

    def test_skip_limit_pagination(self, client, test_db):
        """skip/limit работают корректно (не page/page_size)."""
        for i in range(5):
            _insert_test_order(test_db, dlvry_order_id=f"order-{i}")
        
        r = client.get("/api/dlvry/orders", params={"skip": 2, "limit": 2})
        assert r.status_code == 200
        data = r.json()
        assert len(data["orders"]) == 2
        assert data["total"] == 5
        assert data["skip"] == 2
        assert data["limit"] == 2

    def test_empty_orders_returns_200(self, client, test_db):
        """Пустая таблица → 200 с пустым списком, а не 500."""
        r = client.get("/api/dlvry/orders")
        assert r.status_code == 200
        assert r.json()["orders"] == []
        assert r.json()["total"] == 0

    def test_search_filter(self, client, test_db):
        """Фильтр search работает без ошибок (model поля ilike)."""
        _insert_test_order(test_db)
        r = client.get("/api/dlvry/orders", params={"search": "Иван"})
        assert r.status_code == 200, (
            f"search фильтр упал с {r.status_code}: {r.text[:300]}"
        )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /api/dlvry/orders/stats — статистика
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestGetOrdersStats:
    """
    Тестирует GET /api/dlvry/orders/stats.
    Ловит: ошибки агрегации, несовпадение полей схемы.
    """

    def test_returns_200(self, client, test_db):
        """Эндпоинт не падает — связка router→CRUD→model→schema ОК."""
        _insert_test_order(test_db)
        r = client.get("/api/dlvry/orders/stats", params={"project_id": "proj-1"})
        assert r.status_code == 200, f"Stats вернул {r.status_code}: {r.text[:500]}"

    def test_stats_fields_match_frontend(self, client, test_db):
        """Ответ содержит все поля, которые ожидает фронтенд."""
        _insert_test_order(test_db)
        r = client.get("/api/dlvry/orders/stats", params={"project_id": "proj-1"})
        assert r.status_code == 200
        data = r.json()

        expected = ["total_orders", "total_revenue", "avg_check"]
        for field in expected:
            assert field in data, f"Поле '{field}' отсутствует в статистике"

    def test_stats_values_are_numeric(self, client, test_db):
        """Значения — числа, а не None/MagicMock."""
        _insert_test_order(test_db, total=1500.0)
        r = client.get("/api/dlvry/orders/stats", params={"project_id": "proj-1"})
        data = r.json()
        assert data["total_orders"] == 1
        assert data["total_revenue"] == 1500.0
        assert isinstance(data["avg_check"], (int, float))

    def test_empty_stats_returns_200(self, client, test_db):
        """Пустая таблица → 200 с нулевыми значениями."""
        r = client.get("/api/dlvry/orders/stats")
        assert r.status_code == 200
        assert r.json()["total_orders"] == 0


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /api/dlvry/orders/{order_id} — детали заказа
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestGetOrderDetail:
    """
    Тестирует GET /api/dlvry/orders/{id}.
    Ловит: AttributeError на модели (address_flat→address_apt, etc).
    """

    def test_returns_200_with_order_and_items(self, client, test_db):
        """Детали заказа + позиции не падают с 500."""
        order = _insert_test_order(test_db)
        _insert_test_item(test_db, order.id)

        r = client.get(f"/api/dlvry/orders/{order.id}")
        assert r.status_code == 200, f"Detail вернул {r.status_code}: {r.text[:500]}"

    def test_detail_fields_match_frontend(self, client, test_db):
        """Ответ содержит поля, которые ожидает DlvryOrderDetail на фронтенде."""
        order = _insert_test_order(test_db)
        _insert_test_item(test_db, order.id)

        r = client.get(f"/api/dlvry/orders/{order.id}")
        assert r.status_code == 200
        data = r.json()

        assert "order" in data
        assert "items" in data

        o = data["order"]
        # Основные поля фронтенд-типа DlvryOrderDetail
        detail_fields = [
            "id", "dlvry_order_id", "affiliate_id", "order_date",
            "client_name", "client_phone", "client_email", "client_birthday",
            "vk_user_id", "vk_group_id", "vk_platform",
            "address_full", "address_city",
            "total", "subtotal", "discount", "delivery_price",
            "payment_type", "delivery_type", "source_name",
            "promocode", "comment", "status", "items_count", "created_at",
            # Расширенные поля
            "cost", "payment_bonus", "markup", "persons", "items_total_qty",
        ]
        for field in detail_fields:
            assert field in o, (
                f"Поле '{field}' отсутствует в деталях заказа. "
                f"Имеющиеся: {list(o.keys())}"
            )

    def test_detail_values_mapped_correctly(self, client, test_db):
        """Значения полей корректно маппятся из модели → ответ."""
        order = _insert_test_order(test_db)
        _insert_test_item(test_db, order.id)

        r = client.get(f"/api/dlvry/orders/{order.id}")
        o = r.json()["order"]

        # Маппинг model → response (ключевые проблемные поля)
        assert o["client_phone"] == "+79001234567", "model.phone → client_phone"
        assert o["client_birthday"] == "1990-01-15", "model.client_bday → client_birthday"
        assert o["payment_type"] == "Онлайн", "model.payment_name → payment_type"
        assert o["delivery_type"] == "Доставка", "model.delivery_name → delivery_type"
        assert o["subtotal"] == 1000.0, "model.order_sum → subtotal"
        assert o["preorder"] == False, "model.is_preorder → preorder"
        assert o["address_flat"] == "5", "model.address_apt → address_flat"
        # Расширенные поля
        assert o["cost"] == 450.0, "model.cost → cost"
        assert o["payment_bonus"] == 50.0, "model.payment_bonus → payment_bonus"
        assert o["markup"] == 30.0, "model.markup → markup"
        assert o["persons"] == 2, "model.persons → persons"
        assert o["items_total_qty"] == 2, "model.items_total_qty → items_total_qty"
        assert o["vk_platform"] == "desktop_web", "model.vk_platform → vk_platform"

    def test_items_structure(self, client, test_db):
        """Позиции заказа имеют правильные поля."""
        order = _insert_test_order(test_db)
        _insert_test_item(test_db, order.id, name="Пицца", price=500, quantity=2)

        r = client.get(f"/api/dlvry/orders/{order.id}")
        items = r.json()["items"]
        assert len(items) == 1

        item = items[0]
        assert item["name"] == "Пицца"
        assert item["price"] == 500.0
        assert item["quantity"] == 2
        assert item["total"] == 1000.0  # price × quantity (вычисляется в роутере)

    def test_404_for_missing_order(self, client, test_db):
        """Несуществующий заказ → 404, а не 500."""
        r = client.get("/api/dlvry/orders/99999")
        assert r.status_code == 404


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /api/dlvry/webhook-logs — журнал вебхуков
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestWebhookLogs:
    """
    Тестирует GET/DELETE /api/dlvry/webhook-logs.
    Ловит: несовпадение полей лога (ip vs remote_ip, created_at vs timestamp).
    """

    def test_get_logs_returns_200(self, client, test_db):
        """Получение логов не падает с 500."""
        _insert_test_webhook_log(test_db)
        r = client.get("/api/dlvry/webhook-logs")
        assert r.status_code == 200, f"Logs вернул {r.status_code}: {r.text[:500]}"

    def test_log_fields_match_frontend(self, client, test_db):
        """Поля лога соответствуют фронтенд-типу DlvryWebhookLog."""
        _insert_test_webhook_log(test_db)
        r = client.get("/api/dlvry/webhook-logs")
        assert r.status_code == 200
        
        logs = r.json()["logs"]
        assert len(logs) >= 1

        log = logs[0]
        expected_fields = [
            "id", "remote_ip", "affiliate_id", "dlvry_order_id",
            "result", "error_message", "timestamp",
        ]
        for field in expected_fields:
            assert field in log, (
                f"Поле '{field}' отсутствует в логе вебхука. "
                f"Имеющиеся: {list(log.keys())}"
            )

    def test_delete_logs_returns_200(self, client, test_db):
        """Удаление логов работает."""
        _insert_test_webhook_log(test_db)
        r = client.delete("/api/dlvry/webhook-logs")
        assert r.status_code == 200
        assert "deleted" in r.json()

    def test_empty_logs_returns_200(self, client, test_db):
        """Пустая таблица логов → 200."""
        r = client.get("/api/dlvry/webhook-logs")
        assert r.status_code == 200
        assert r.json()["logs"] == []


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Контрактные тесты (API ↔ Frontend types)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestApiContract:
    """
    Контрактные тесты — проверяют что формат ответа бэкенда
    совпадает с TypeScript-типами фронтенда.

    Если фронтенд-разработчик добавит новое поле в тип,
    и бэкенд его не вернёт — тест упадёт.
    """

    def test_orders_list_contract(self, client, test_db):
        """
        Контракт: GET /orders → { orders: DlvryOrder[], total, skip, limit }
        где DlvryOrder = { id, dlvry_order_id, affiliate_id, order_date,
            client_name, client_phone, total, payment_type, delivery_type,
            source_name, status, items_count, created_at }
        """
        _insert_test_order(test_db)
        r = client.get("/api/dlvry/orders")
        assert r.status_code == 200

        data = r.json()

        # Верхний уровень
        assert set(data.keys()) >= {"orders", "total", "skip", "limit"}

        # Каждый заказ
        if data["orders"]:
            order_keys = set(data["orders"][0].keys())
            required_keys = {
                "id", "dlvry_order_id", "affiliate_id", "order_date",
                "client_name", "client_phone", "total", "payment_type",
                "delivery_type", "source_name", "status", "items_count",
                "created_at",
                # Расширенные поля
                "cost", "discount", "delivery_price", "subtotal",
                "payment_bonus", "markup", "vk_platform", "vk_user_id",
                "address_city", "persons", "items_total_qty",
                "promocode", "comment", "is_preorder",
            }
            missing = required_keys - order_keys
            assert not missing, (
                f"Контракт нарушен! Фронтенд ожидает поля {missing}, "
                f"но бэкенд их не вернул. Имеющиеся: {order_keys}"
            )

    def test_stats_contract(self, client, test_db):
        """
        Контракт: GET /orders/stats → { total_orders, total_revenue, avg_check, ... }
        """
        r = client.get("/api/dlvry/orders/stats")
        assert r.status_code == 200

        data = r.json()
        required_keys = {"total_orders", "total_revenue", "avg_check"}
        missing = required_keys - set(data.keys())
        assert not missing, f"Stats контракт нарушен: нет полей {missing}"

    def test_order_detail_contract(self, client, test_db):
        """
        Контракт: GET /orders/{id} → { order: {...}, items: [...] }
        """
        order = _insert_test_order(test_db)
        _insert_test_item(test_db, order.id)

        r = client.get(f"/api/dlvry/orders/{order.id}")
        assert r.status_code == 200

        data = r.json()
        assert "order" in data and "items" in data

        order_keys = set(data["order"].keys())
        required_keys = {
            "id", "dlvry_order_id", "client_name", "client_phone",
            "total", "subtotal", "discount", "delivery_price",
            "payment_type", "delivery_type", "source_name",
            "status", "created_at",
            # Расширенные поля
            "cost", "payment_bonus", "markup", "persons", "items_total_qty",
        }
        missing = required_keys - order_keys
        assert not missing, f"Detail контракт нарушен: нет полей {missing}"

        # Items
        if data["items"]:
            item_keys = set(data["items"][0].keys())
            required_item_keys = {"id", "name", "price", "quantity", "total"}
            missing_items = required_item_keys - item_keys
            assert not missing_items, f"Items контракт нарушен: нет полей {missing_items}"
