"""
Тесты декомпозиции роутера DLVRY.

Покрывают модули, извлечённые при оптимизации:
  1. services/dlvry/dlvry_helpers.py    — resolve_affiliate_id
  2. services/dlvry/dlvry_formatters.py — format_order_list_item, format_order_detail,
                                          format_webhook_log, format_daily_stats_row
  3. crud/dlvry_order_crud.py           — clear_webhook_logs (новая функция)
  4. routers/dlvry.py                   — _require_dlvry_token (приватный хелпер)
  5. Интеграционные: эндпоинты работают так же, как до рефакторинга

Паттерн: юнит-тесты с SimpleNamespace-моками (быстрые, без БД),
         + интеграционные через in-memory SQLite (для crud и роутера).
"""

import sys
import os
import pytest
from types import SimpleNamespace
from datetime import datetime, date, timezone
from unittest.mock import MagicMock, patch

# Добавляем корень бэкенда в путь
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app
from fastapi.testclient import TestClient
from models_library.dlvry_orders import DlvryOrder, DlvryOrderItem, DlvryWebhookLog


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Фикстуры
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@pytest.fixture(scope="function")
def test_db():
    """In-memory SQLite с таблицами DLVRY."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
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


def _make_order_ns(**overrides) -> SimpleNamespace:
    """Создаёт SimpleNamespace, имитирующий ORM-объект DlvryOrder."""
    defaults = dict(
        id=1,
        dlvry_order_id="test-100",
        affiliate_id="aff-1",
        order_date=datetime(2026, 3, 1, 10, 30, tzinfo=timezone.utc),
        client_name="Иван Тестов",
        phone="+79001234567",
        client_email="test@test.ru",
        client_bday="1990-01-15",
        vk_user_id="789",
        vk_group_id="123456",
        vk_platform="vk_mini_app",
        address_full="г. Москва, ул. Пушкина, д. 10, кв. 5",
        address_city="Москва",
        address_street="Пушкина",
        address_house="10",
        address_apt="5",
        total=900.0,
        order_sum=1000.0,
        discount=100.0,
        delivery_price=150.0,
        cost=450.0,
        payment_bonus=50.0,
        markup=30.0,
        payment_name="Онлайн",
        payment_code="online",
        delivery_name="Доставка",
        delivery_code="delivery",
        source_name="VK Mini App",
        source_code="vkapp",
        pickup_point_name=None,
        promocode="СКИДКА",
        comment="Тестовый заказ",
        is_preorder=False,
        status="received",
        items_count=2,
        items_total_qty=4,
        items_text="Пицца × 2",
        persons=2,
        raw_json='{"test": true}',
        received_at=datetime(2026, 3, 1, 10, 31, tzinfo=timezone.utc),
    )
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def _make_item_ns(**overrides) -> SimpleNamespace:
    """Создаёт SimpleNamespace, имитирующий ORM-объект DlvryOrderItem."""
    defaults = dict(
        id=10,
        name="Пицца Маргарита",
        price=500.0,
        quantity=2,
        code="pizza-001",
        weight="500",
        options_json=None,
    )
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def _make_webhook_log_ns(**overrides) -> SimpleNamespace:
    """Создаёт SimpleNamespace, имитирующий ORM-объект DlvryWebhookLog."""
    defaults = dict(
        id=1,
        remote_ip="1.2.3.4",
        affiliate_id="aff-1",
        dlvry_order_id="test-100",
        result="ok",
        error_message=None,
        timestamp=datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc),
    )
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def _make_daily_stats_ns(**overrides) -> SimpleNamespace:
    """Создаёт SimpleNamespace, имитирующий ORM-объект DlvryDailyStats."""
    defaults = dict(
        stat_date=date(2026, 3, 1),
        orders_count=10,
        revenue=15000.0,
        first_orders=3,
        avg_check=1500.0,
        canceled=1,
        canceled_sum=500.0,
        cost=8000.0,
        discount=200.0,
        first_orders_sum=4500.0,
        first_orders_cost=2400.0,
        unique_clients=8,
        sum_cash=3000.0,
        count_payment_cash=2,
        sum_card=5000.0,
        count_payment_card=3,
        count_payment_online=5,
        sum_online_success=7000.0,
        sum_online_fail=0.0,
        source_site=2,
        sum_source_site=3000.0,
        source_vkapp=6,
        sum_source_vkapp=9000.0,
        source_ios=1,
        sum_source_ios=1500.0,
        source_android=1,
        sum_source_android=1500.0,
        delivery_self_count=4,
        delivery_self_sum=6000.0,
        delivery_count=6,
        delivery_sum=9000.0,
        repeat_order_2=2,
        repeat_order_3=1,
        repeat_order_4=0,
        repeat_order_5=0,
    )
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


def _insert_test_order(db, **overrides) -> DlvryOrder:
    """Вставляет тестовый заказ в БД."""
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


# ═════════════════════════════════════════════════════════════
# 1. ТЕСТЫ: resolve_affiliate_id (dlvry_helpers.py)
# ═════════════════════════════════════════════════════════════

class TestResolveAffiliateId:
    """
    Юнит-тесты для resolve_affiliate_id.
    Проверяют все ветки: affiliate_id напрямую, через project_id, ошибка, None.
    """

    def test_returns_affiliate_id_when_provided_directly(self):
        """Если affiliate_id передан — возвращает его как есть, без обращения к БД."""
        from services.dlvry.dlvry_helpers import resolve_affiliate_id

        db = MagicMock()
        result = resolve_affiliate_id(db, project_id=None, affiliate_id="aff-123")
        assert result == "aff-123"
        # БД не должна вызываться
        db.query.assert_not_called()

    def test_returns_affiliate_id_even_if_project_id_also_provided(self):
        """affiliate_id имеет приоритет над project_id."""
        from services.dlvry.dlvry_helpers import resolve_affiliate_id

        db = MagicMock()
        result = resolve_affiliate_id(db, project_id="proj-1", affiliate_id="aff-direct")
        assert result == "aff-direct"
        db.query.assert_not_called()

    def test_resolves_from_project_id(self):
        """Если affiliate_id=None, ищет по project_id в БД."""
        from services.dlvry.dlvry_helpers import resolve_affiliate_id

        # Мокаем project с dlvry_affiliate_id
        mock_project = SimpleNamespace(dlvry_affiliate_id="aff-from-project")
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = mock_project

        result = resolve_affiliate_id(db, project_id="proj-1", affiliate_id=None)
        assert result == "aff-from-project"

    def test_raises_when_nothing_found_and_raise_if_missing_true(self):
        """Без affiliate_id и без project_id → HTTPException 400."""
        from services.dlvry.dlvry_helpers import resolve_affiliate_id

        db = MagicMock()
        with pytest.raises(HTTPException) as exc_info:
            resolve_affiliate_id(db, project_id=None, affiliate_id=None, raise_if_missing=True)
        assert exc_info.value.status_code == 400
        assert "affiliate_id" in str(exc_info.value.detail)

    def test_returns_none_when_raise_if_missing_false(self):
        """raise_if_missing=False → возвращает None вместо исключения."""
        from services.dlvry.dlvry_helpers import resolve_affiliate_id

        db = MagicMock()
        result = resolve_affiliate_id(db, project_id=None, affiliate_id=None, raise_if_missing=False)
        assert result is None

    def test_raises_when_project_has_no_dlvry_affiliate(self):
        """Проект найден, но dlvry_affiliate_id=None → HTTPException 400."""
        from services.dlvry.dlvry_helpers import resolve_affiliate_id

        mock_project = SimpleNamespace(dlvry_affiliate_id=None)
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = mock_project

        with pytest.raises(HTTPException) as exc_info:
            resolve_affiliate_id(db, project_id="proj-1", affiliate_id=None)
        assert exc_info.value.status_code == 400

    def test_returns_none_when_project_not_found(self):
        """Проект не найден в БД + raise_if_missing=False → None."""
        from services.dlvry.dlvry_helpers import resolve_affiliate_id

        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None

        result = resolve_affiliate_id(db, project_id="nonexistent", affiliate_id=None, raise_if_missing=False)
        assert result is None


# ═════════════════════════════════════════════════════════════
# 2. ТЕСТЫ: dlvry_formatters.py (все 4 функции)
# ═════════════════════════════════════════════════════════════

class TestFormatOrderListItem:
    """Юнит-тесты для format_order_list_item."""

    def test_returns_pydantic_model(self):
        """Возвращает DlvryOrderResponse (Pydantic), а не dict."""
        from services.dlvry.dlvry_formatters import format_order_list_item
        from schemas.dlvry_schemas import DlvryOrderResponse

        order = _make_order_ns()
        result = format_order_list_item(order)
        assert isinstance(result, DlvryOrderResponse)

    def test_maps_all_required_fields(self):
        """Все поля контракта фронтенда присутствуют и корректно замаплены."""
        from services.dlvry.dlvry_formatters import format_order_list_item

        order = _make_order_ns()
        result = format_order_list_item(order)

        assert result.id == 1
        assert result.dlvry_order_id == "test-100"
        assert result.affiliate_id == "aff-1"
        assert result.client_name == "Иван Тестов"
        assert result.client_phone == "+79001234567"  # model.phone → client_phone
        assert result.total == 900.0
        assert result.payment_type == "Онлайн"  # model.payment_name → payment_type
        assert result.delivery_type == "Доставка"  # model.delivery_name → delivery_type
        assert result.source_name == "VK Mini App"
        assert result.status == "received"
        assert result.items_count == 2

    def test_maps_extended_fields(self):
        """Расширенные поля для переключаемых групп колонок корректно мапятся."""
        from services.dlvry.dlvry_formatters import format_order_list_item

        order = _make_order_ns()
        result = format_order_list_item(order)

        assert result.cost == 450.0
        assert result.discount == 100.0
        assert result.delivery_price == 150.0
        assert result.subtotal == 1000.0  # model.order_sum → subtotal
        assert result.payment_bonus == 50.0
        assert result.markup == 30.0
        assert result.vk_platform == "vk_mini_app"
        assert result.vk_user_id == "789"
        assert result.address_city == "Москва"
        assert result.persons == 2
        assert result.items_total_qty == 4
        assert result.promocode == "СКИДКА"
        assert result.comment == "Тестовый заказ"
        assert result.is_preorder == False

    def test_handles_none_dates(self):
        """order_date=None и received_at=None → None в ответе."""
        from services.dlvry.dlvry_formatters import format_order_list_item

        order = _make_order_ns(order_date=None, received_at=None)
        result = format_order_list_item(order)
        assert result.order_date is None
        assert result.created_at is None

    def test_iso_format_dates(self):
        """Даты форматируются в ISO 8601."""
        from services.dlvry.dlvry_formatters import format_order_list_item

        order = _make_order_ns()
        result = format_order_list_item(order)
        assert "2026-03-01" in result.order_date
        assert "2026-03-01" in result.created_at


class TestFormatOrderDetail:
    """Юнит-тесты для format_order_detail."""

    def test_returns_dict_with_order_and_items(self):
        """Возвращает dict с ключами 'order' и 'items'."""
        from services.dlvry.dlvry_formatters import format_order_detail

        order = _make_order_ns()
        items = [_make_item_ns()]
        result = format_order_detail(order, items)

        assert isinstance(result, dict)
        assert "order" in result
        assert "items" in result

    def test_order_fields_match_frontend_contract(self):
        """Все поля DlvryOrderDetail фронтенда присутствуют."""
        from services.dlvry.dlvry_formatters import format_order_detail

        order = _make_order_ns()
        result = format_order_detail(order, [])

        o = result["order"]
        required = [
            "id", "dlvry_order_id", "affiliate_id", "order_date",
            "client_name", "client_phone", "client_email", "client_birthday",
            "vk_user_id", "vk_group_id", "vk_platform",
            "address_full", "address_city", "address_street", "address_house", "address_flat",
            "total", "subtotal", "discount", "delivery_price",
            "payment_type", "payment_code", "delivery_type", "delivery_code",
            "source_name", "source_code", "pickup_point_name",
            "promocode", "comment", "preorder",
            "status", "items_count", "items_json", "raw_json", "created_at",
            # Расширенные поля
            "cost", "payment_bonus", "markup", "persons", "items_total_qty",
        ]
        missing = [f for f in required if f not in o]
        assert not missing, f"Отсутствуют поля в order detail: {missing}"

    def test_field_mapping_correctness(self):
        """Проблемные маппинги model → response корректны."""
        from services.dlvry.dlvry_formatters import format_order_detail

        order = _make_order_ns()
        result = format_order_detail(order, [])["order"]

        # Ключевые маппинги, которые ломались до рефакторинга
        assert result["client_phone"] == "+79001234567", "phone → client_phone"
        assert result["client_birthday"] == "1990-01-15", "client_bday → client_birthday"
        assert result["subtotal"] == 1000.0, "order_sum → subtotal"
        assert result["address_flat"] == "5", "address_apt → address_flat"
        assert result["preorder"] == False, "is_preorder → preorder"
        assert result["items_json"] == "Пицца × 2", "items_text → items_json"

    def test_extended_fields_mapping(self):
        """Расширенные поля detail корректно мапятся."""
        from services.dlvry.dlvry_formatters import format_order_detail

        order = _make_order_ns()
        result = format_order_detail(order, [])["order"]

        assert result["cost"] == 450.0, "model.cost → cost"
        assert result["payment_bonus"] == 50.0, "model.payment_bonus → payment_bonus"
        assert result["markup"] == 30.0, "model.markup → markup"
        assert result["persons"] == 2, "model.persons → persons"
        assert result["items_total_qty"] == 4, "model.items_total_qty → items_total_qty"

    def test_items_total_calculation(self):
        """total = price × quantity для каждой позиции."""
        from services.dlvry.dlvry_formatters import format_order_detail

        items = [
            _make_item_ns(price=500.0, quantity=2),
            _make_item_ns(id=11, price=300.0, quantity=3),
        ]
        result = format_order_detail(_make_order_ns(), items)

        assert result["items"][0]["total"] == 1000.0
        assert result["items"][1]["total"] == 900.0

    def test_items_with_none_price(self):
        """price=None → total = 0.0 (без ошибки)."""
        from services.dlvry.dlvry_formatters import format_order_detail

        items = [_make_item_ns(price=None, quantity=1)]
        result = format_order_detail(_make_order_ns(), items)
        assert result["items"][0]["total"] == 0.0

    def test_items_with_none_quantity(self):
        """quantity=None → считается как 1."""
        from services.dlvry.dlvry_formatters import format_order_detail

        items = [_make_item_ns(price=500.0, quantity=None)]
        result = format_order_detail(_make_order_ns(), items)
        assert result["items"][0]["total"] == 500.0

    def test_empty_items_list(self):
        """Пустой список позиций → items = []."""
        from services.dlvry.dlvry_formatters import format_order_detail

        result = format_order_detail(_make_order_ns(), [])
        assert result["items"] == []

    def test_item_fields_complete(self):
        """Каждая позиция содержит все требуемые поля."""
        from services.dlvry.dlvry_formatters import format_order_detail

        result = format_order_detail(_make_order_ns(), [_make_item_ns()])
        item = result["items"][0]

        required = ["id", "name", "price", "quantity", "total", "code", "weight", "options"]
        missing = [f for f in required if f not in item]
        assert not missing, f"Отсутствуют поля в item: {missing}"


class TestFormatWebhookLog:
    """Юнит-тесты для format_webhook_log."""

    def test_returns_pydantic_model(self):
        """Возвращает DlvryWebhookLogResponse."""
        from services.dlvry.dlvry_formatters import format_webhook_log
        from schemas.dlvry_schemas import DlvryWebhookLogResponse

        log = _make_webhook_log_ns()
        result = format_webhook_log(log)
        assert isinstance(result, DlvryWebhookLogResponse)

    def test_maps_all_fields(self):
        """Все поля лога корректно замаплены."""
        from services.dlvry.dlvry_formatters import format_webhook_log

        log = _make_webhook_log_ns()
        result = format_webhook_log(log)

        assert result.id == 1
        assert result.remote_ip == "1.2.3.4"
        assert result.affiliate_id == "aff-1"
        assert result.dlvry_order_id == "test-100"
        assert result.result == "ok"
        assert result.error_message is None

    def test_error_log(self):
        """Лог с ошибкой — error_message заполнен."""
        from services.dlvry.dlvry_formatters import format_webhook_log

        log = _make_webhook_log_ns(result="error", error_message="Invalid JSON: ...")
        result = format_webhook_log(log)
        assert result.result == "error"
        assert result.error_message == "Invalid JSON: ..."


class TestFormatDailyStatsRow:
    """Юнит-тесты для format_daily_stats_row."""

    def test_returns_dict(self):
        """Возвращает dict."""
        from services.dlvry.dlvry_formatters import format_daily_stats_row

        row = _make_daily_stats_ns()
        result = format_daily_stats_row(row)
        assert isinstance(result, dict)

    def test_date_is_iso_string(self):
        """stat_date форматируется в ISO (YYYY-MM-DD)."""
        from services.dlvry.dlvry_formatters import format_daily_stats_row

        row = _make_daily_stats_ns(stat_date=date(2026, 3, 15))
        result = format_daily_stats_row(row)
        assert result["date"] == "2026-03-15"

    def test_all_expected_keys_present(self):
        """Все ключи дневной статистики присутствуют."""
        from services.dlvry.dlvry_formatters import format_daily_stats_row

        result = format_daily_stats_row(_make_daily_stats_ns())

        expected_keys = [
            "date", "orders_count", "revenue", "first_orders", "avg_check",
            "canceled", "canceled_sum",
            "cost", "discount", "first_orders_sum", "first_orders_cost",
            "unique_clients",
            "sum_cash", "count_payment_cash", "sum_card", "count_payment_card",
            "count_payment_online", "sum_online_success", "sum_online_fail",
            "source_site", "sum_source_site", "source_vkapp", "sum_source_vkapp",
            "source_ios", "sum_source_ios", "source_android", "sum_source_android",
            "delivery_self_count", "delivery_self_sum", "delivery_count", "delivery_sum",
            "repeat_order_2", "repeat_order_3", "repeat_order_4", "repeat_order_5",
        ]
        missing = [k for k in expected_keys if k not in result]
        assert not missing, f"Отсутствуют ключи: {missing}"

    def test_values_passthrough(self):
        """Значения проходят без изменений (кроме date)."""
        from services.dlvry.dlvry_formatters import format_daily_stats_row

        row = _make_daily_stats_ns(orders_count=42, revenue=63000.0, avg_check=1500.0)
        result = format_daily_stats_row(row)
        assert result["orders_count"] == 42
        assert result["revenue"] == 63000.0
        assert result["avg_check"] == 1500.0


# ═════════════════════════════════════════════════════════════
# 3. ТЕСТЫ: clear_webhook_logs (crud)
# ═════════════════════════════════════════════════════════════

class TestClearWebhookLogs:
    """Интеграционные тесты для clear_webhook_logs (новая функция в crud)."""

    def test_clears_all_logs(self, test_db):
        """Удаляет все логи и возвращает количество."""
        import crud.dlvry_order_crud as dlvry_crud

        _insert_test_webhook_log(test_db, dlvry_order_id="log-1")
        _insert_test_webhook_log(test_db, dlvry_order_id="log-2")
        _insert_test_webhook_log(test_db, dlvry_order_id="log-3")

        count = dlvry_crud.clear_webhook_logs(test_db)
        assert count == 3

        # Проверяем что таблица пуста
        remaining = test_db.query(DlvryWebhookLog).count()
        assert remaining == 0

    def test_returns_zero_on_empty_table(self, test_db):
        """Пустая таблица → возвращает 0."""
        import crud.dlvry_order_crud as dlvry_crud

        count = dlvry_crud.clear_webhook_logs(test_db)
        assert count == 0

    def test_does_not_affect_orders(self, test_db):
        """Удаление логов не затрагивает таблицу заказов."""
        import crud.dlvry_order_crud as dlvry_crud

        _insert_test_order(test_db)
        _insert_test_webhook_log(test_db)

        dlvry_crud.clear_webhook_logs(test_db)

        # Заказ на месте
        orders_count = test_db.query(DlvryOrder).count()
        assert orders_count == 1


# ═════════════════════════════════════════════════════════════
# 4. ТЕСТЫ: _require_dlvry_token (роутер)
# ═════════════════════════════════════════════════════════════

class TestRequireDlvryToken:
    """Тесты для приватного хелпера _require_dlvry_token."""

    def test_returns_token_when_configured(self):
        """Возвращает токен, если он настроен."""
        from routers.dlvry import _require_dlvry_token
        from config import settings

        original = settings.dlvry_token
        try:
            settings.dlvry_token = "test-token-123"
            result = _require_dlvry_token()
            assert result == "test-token-123"
        finally:
            settings.dlvry_token = original

    def test_raises_503_when_not_configured(self):
        """Без токена → HTTPException 503."""
        from routers.dlvry import _require_dlvry_token
        from config import settings

        original = settings.dlvry_token
        try:
            settings.dlvry_token = None
            with pytest.raises(HTTPException) as exc_info:
                _require_dlvry_token()
            assert exc_info.value.status_code == 503
            assert "DLVRY_TOKEN" in str(exc_info.value.detail)
        finally:
            settings.dlvry_token = original

    def test_raises_503_for_empty_string(self):
        """Пустая строка токена → HTTPException 503."""
        from routers.dlvry import _require_dlvry_token
        from config import settings

        original = settings.dlvry_token
        try:
            settings.dlvry_token = ""
            with pytest.raises(HTTPException) as exc_info:
                _require_dlvry_token()
            assert exc_info.value.status_code == 503
        finally:
            settings.dlvry_token = original


# ═════════════════════════════════════════════════════════════
# 5. ИНТЕГРАЦИЯ: эндпоинты работают после рефакторинга
# ═════════════════════════════════════════════════════════════

class TestRouterIntegrationAfterDecomposition:
    """
    Интеграционные тесты — проверяем что эндпоинты роутера
    работают идентично до и после декомпозиции.
    Используют реальный TestClient + in-memory SQLite.
    """

    def test_orders_list_uses_formatter(self, client, test_db):
        """GET /orders — ответ формируется через format_order_list_item."""
        _insert_test_order(test_db)
        r = client.get("/api/dlvry/orders")
        assert r.status_code == 200

        data = r.json()
        assert "orders" in data
        assert len(data["orders"]) == 1

        order = data["orders"][0]
        # Проверяем маппинг (phone → client_phone и т.д.)
        assert order["client_phone"] == "+79001234567"
        assert order["payment_type"] == "Онлайн"
        assert order["delivery_type"] == "Доставка"

    def test_order_detail_uses_formatter(self, client, test_db):
        """GET /orders/{id} — ответ формируется через format_order_detail."""
        order = _insert_test_order(test_db)
        _insert_test_item(test_db, order.id)

        r = client.get(f"/api/dlvry/orders/{order.id}")
        assert r.status_code == 200

        data = r.json()
        assert "order" in data
        assert "items" in data
        assert data["order"]["address_flat"] == "5"  # address_apt → address_flat
        assert data["items"][0]["total"] == 1000.0  # 500 × 2

    def test_webhook_logs_uses_formatter(self, client, test_db):
        """GET /webhook-logs — ответ формируется через format_webhook_log."""
        _insert_test_webhook_log(test_db)
        r = client.get("/api/dlvry/webhook-logs")
        assert r.status_code == 200

        logs = r.json()["logs"]
        assert len(logs) == 1
        assert logs[0]["remote_ip"] == "1.2.3.4"
        assert logs[0]["result"] == "ok"

    def test_delete_webhook_logs_uses_crud(self, client, test_db):
        """DELETE /webhook-logs — использует crud.clear_webhook_logs."""
        _insert_test_webhook_log(test_db, dlvry_order_id="log-1")
        _insert_test_webhook_log(test_db, dlvry_order_id="log-2")

        r = client.delete("/api/dlvry/webhook-logs")
        assert r.status_code == 200
        assert r.json()["deleted"] == 2

        # Проверяем что действительно удалены
        r2 = client.get("/api/dlvry/webhook-logs")
        assert r2.json()["logs"] == []

    def test_stats_endpoint_works(self, client, test_db):
        """GET /orders/stats — не сломался после рефакторинга."""
        _insert_test_order(test_db)
        r = client.get("/api/dlvry/orders/stats")
        assert r.status_code == 200
        assert r.json()["total_orders"] == 1

    def test_all_17_routes_registered(self):
        """Все 17 маршрутов зарегистрированы в роутере (13 базовых + 4 affiliates)."""
        from routers.dlvry import router

        routes = [(list(r.methods), r.path) for r in router.routes]
        paths = [path for _, path in routes]

        expected_paths = [
            "/webhook",
            "/orders",
            "/orders/stats",
            "/orders/{order_id}",
            "/webhook-logs",
            "/webhook-logs",  # DELETE
            "/stats/external",
            "/stats/comparison",
            "/stats/daily",
            "/stats/available-months",
            "/stats/sync",
            "/stats/sync-full-stream",
            "/stats/sync-all",
            "/affiliates/{project_id}",  # GET
            "/affiliates/{project_id}",  # POST
            "/affiliates/record/{record_id}",  # PUT
            "/affiliates/record/{record_id}",  # DELETE
        ]

        for expected in set(expected_paths):
            assert expected in paths, f"Маршрут '{expected}' не зарегистрирован в роутере"

        assert len(routes) == 17, f"Ожидали 17 маршрутов, получили {len(routes)}"
