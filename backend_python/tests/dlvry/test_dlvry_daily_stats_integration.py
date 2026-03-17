"""
Интеграционный тест эндпоинтов статистики продаж DLVRY.

ЗАЧЕМ ЭТОТ ТЕСТ:
    Ловит несоответствия между роутером /stats/daily, /stats/sync
    и стеком model → CRUD → маппинг в ответе.

    Проверяет 5 обязательных категорий:
    1. Smoke (200 not 500) — стек router→CRUD→model работает
    2. Empty data (200 not 500) — пустая таблица не крашит
    3. Not found / Bad request — некорректные параметры → правильный код ошибки
    4. Field contract — ответ содержит ВСЕ поля, которые ожидает фронтенд
    5. Value mapping — значения маппятся из модели корректно

ПАТТЕРН:
    in-memory SQLite + StaticPool + TestClient + реальные ORM-объекты
"""

import sys
import os
import pytest
from datetime import date, datetime, timezone

# Добавляем backend_python в PYTHONPATH
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from database import Base, get_db
from main import app
from models_library.dlvry_daily_stats import DlvryDailyStats
from models_library.dlvry_affiliates import DlvryProjectAffiliate
from models_library.projects import Project


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Фикстуры
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@pytest.fixture(scope="function")
def test_db():
    """Создаёт in-memory SQLite с реальными таблицами для daily stats."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Создаём нужные таблицы
    DlvryDailyStats.__table__.create(bind=engine, checkfirst=True)
    Project.__table__.create(bind=engine, checkfirst=True)
    DlvryProjectAffiliate.__table__.create(bind=engine, checkfirst=True)

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


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Хелперы для вставки тестовых данных
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _insert_project(db, **overrides) -> Project:
    """Вставляет тестовый проект."""
    defaults = dict(
        id="proj-1",
        name="Тестовый проект",
        dlvry_affiliate_id="aff-100",
    )
    defaults.update(overrides)
    project = Project(**defaults)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def _insert_daily_stat(db, **overrides) -> DlvryDailyStats:
    """Вставляет одну запись дневной статистики."""
    defaults = dict(
        affiliate_id="aff-100",
        project_id="proj-1",
        stat_date=date(2026, 3, 1),
        orders_count=10,
        revenue=15000.0,
        first_orders=3,
        avg_check=1500.0,
    )
    defaults.update(overrides)
    row = DlvryDailyStats(**defaults)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _insert_sample_week(db, affiliate_id="aff-100", project_id="proj-1"):
    """Вставляет 7 дней данных (25 фев — 3 мар 2026)."""
    stats = [
        (date(2026, 2, 25), 5, 7500.0, 1, 1500.0),
        (date(2026, 2, 26), 8, 12000.0, 2, 1500.0),
        (date(2026, 2, 27), 0, 0.0, 0, 0.0),
        (date(2026, 2, 28), 12, 18000.0, 4, 1500.0),
        (date(2026, 3, 1), 10, 15000.0, 3, 1500.0),
        (date(2026, 3, 2), 15, 22500.0, 5, 1500.0),
        (date(2026, 3, 3), 7, 10500.0, 2, 1500.0),
    ]
    for stat_date, count, revenue, first, avg in stats:
        _insert_daily_stat(
            db,
            affiliate_id=affiliate_id,
            project_id=project_id,
            stat_date=stat_date,
            orders_count=count,
            revenue=revenue,
            first_orders=first,
            avg_check=avg,
        )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /api/dlvry/stats/daily — дневная статистика из БД
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestGetDailyStats:
    """Категория 1 (Smoke) + 2 (Empty) + 4 (Fields) + 5 (Values)."""

    # ── Smoke ────────────────────────────────────────────────

    def test_returns_200_with_data(self, client, test_db):
        """С данными — стек router→CRUD→model→response работает без 500."""
        _insert_project(test_db)
        _insert_daily_stat(test_db)
        r = client.get("/api/dlvry/stats/daily", params={"project_id": "proj-1"})
        assert r.status_code == 200, (
            f"Ожидали 200, получили {r.status_code}. "
            f"Тело: {r.text[:500]}"
        )

    def test_returns_200_with_affiliate_id(self, client, test_db):
        """Фильтр по affiliate_id тоже работает."""
        _insert_daily_stat(test_db)
        r = client.get("/api/dlvry/stats/daily", params={"affiliate_id": "aff-100"})
        assert r.status_code == 200

    # ── Пустые данные ────────────────────────────────────────

    def test_empty_data_returns_200(self, client, test_db):
        """Пустая таблица → 200, не 500."""
        r = client.get("/api/dlvry/stats/daily")
        assert r.status_code == 200

    def test_empty_days_array(self, client, test_db):
        """Пустая таблица → days = [], total = 0."""
        r = client.get("/api/dlvry/stats/daily")
        data = r.json()
        assert data["days"] == []
        assert data["total"] == 0

    def test_empty_aggregated_zeros(self, client, test_db):
        """Пустая таблица → все агрегаты = 0."""
        r = client.get("/api/dlvry/stats/daily")
        agg = r.json()["aggregated"]
        assert agg["total_orders"] == 0
        assert agg["total_revenue"] == 0
        assert agg["total_first_orders"] == 0
        assert agg["avg_check"] == 0

    # ── Field contract (поля совпадают с фронтенд типами) ────

    def test_response_top_level_fields(self, client, test_db):
        """
        Ответ содержит ключи: days, total, aggregated.
        Тип фронтенда: DlvryDailyStatsResponse.
        """
        _insert_daily_stat(test_db)
        r = client.get("/api/dlvry/stats/daily")
        data = r.json()
        assert "days" in data, f"Нет ключа 'days'. Ключи: {list(data.keys())}"
        assert "total" in data, f"Нет ключа 'total'. Ключи: {list(data.keys())}"
        assert "aggregated" in data, f"Нет ключа 'aggregated'. Ключи: {list(data.keys())}"

    def test_day_item_fields_match_frontend(self, client, test_db):
        """
        Каждый элемент days[] содержит поля DlvryDayStat:
        date, orders_count, revenue, first_orders, avg_check.
        """
        _insert_daily_stat(test_db)
        r = client.get("/api/dlvry/stats/daily")
        days = r.json()["days"]
        assert len(days) >= 1
        day = days[0]

        expected_fields = ["date", "orders_count", "revenue", "first_orders", "avg_check"]
        for field in expected_fields:
            assert field in day, (
                f"Поле '{field}' отсутствует в day-элементе. "
                f"Имеющиеся: {list(day.keys())}. "
                f"Фронтенд тип DlvryDayStat требует это поле."
            )

    def test_aggregated_fields_match_frontend(self, client, test_db):
        """
        aggregated содержит поля DlvryAggregated:
        total_orders, total_revenue, total_first_orders, avg_check.
        """
        _insert_daily_stat(test_db)
        r = client.get("/api/dlvry/stats/daily")
        agg = r.json()["aggregated"]

        expected_fields = ["total_orders", "total_revenue", "total_first_orders", "avg_check"]
        for field in expected_fields:
            assert field in agg, (
                f"Поле '{field}' отсутствует в aggregated. "
                f"Имеющиеся: {list(agg.keys())}. "
                f"Фронтенд тип DlvryAggregated требует это поле."
            )

    # ── Value mapping (значения корректны) ───────────────────

    def test_single_day_values(self, client, test_db):
        """Вставили 1 день — значения маппятся из модели."""
        _insert_daily_stat(
            test_db,
            stat_date=date(2026, 3, 1),
            orders_count=10,
            revenue=15000.0,
            first_orders=3,
            avg_check=1500.0,
        )
        r = client.get("/api/dlvry/stats/daily")
        day = r.json()["days"][0]

        assert day["date"] == "2026-03-01"
        assert day["orders_count"] == 10
        assert day["revenue"] == 15000.0
        assert day["first_orders"] == 3
        assert day["avg_check"] == 1500.0

    def test_aggregated_values_single_day(self, client, test_db):
        """Один день — агрегаты = значениям этого дня."""
        _insert_daily_stat(
            test_db,
            orders_count=10,
            revenue=15000.0,
            first_orders=3,
        )
        r = client.get("/api/dlvry/stats/daily")
        agg = r.json()["aggregated"]

        assert agg["total_orders"] == 10
        assert agg["total_revenue"] == 15000.0
        assert agg["total_first_orders"] == 3
        assert agg["avg_check"] == 1500.0

    def test_aggregated_values_multiple_days(self, client, test_db):
        """Несколько дней — итоги суммируются, avg_check пересчитывается."""
        _insert_daily_stat(test_db, stat_date=date(2026, 3, 1), orders_count=10, revenue=15000.0, first_orders=3, avg_check=1500.0)
        _insert_daily_stat(test_db, stat_date=date(2026, 3, 2), orders_count=5, revenue=10000.0, first_orders=2, avg_check=2000.0)

        r = client.get("/api/dlvry/stats/daily")
        agg = r.json()["aggregated"]

        assert agg["total_orders"] == 15
        assert agg["total_revenue"] == 25000.0
        assert agg["total_first_orders"] == 5
        # avg_check = 25000 / 15 = 1666.67
        assert round(agg["avg_check"], 2) == 1666.67

    def test_total_count_correct(self, client, test_db):
        """total = количество дней в ответе."""
        _insert_sample_week(test_db)
        r = client.get("/api/dlvry/stats/daily")
        data = r.json()
        assert data["total"] == 7
        assert len(data["days"]) == 7

    def test_days_ordered_desc(self, client, test_db):
        """Дни отсортированы от новых к старым."""
        _insert_sample_week(test_db)
        r = client.get("/api/dlvry/stats/daily")
        dates = [d["date"] for d in r.json()["days"]]
        assert dates == sorted(dates, reverse=True)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Фильтрация по дате
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestDateFilters:
    """Проверяем фильтры date_from / date_to."""

    def test_date_from_filters(self, client, test_db):
        """date_from отсекает более ранние даты."""
        _insert_sample_week(test_db)
        r = client.get("/api/dlvry/stats/daily", params={"date_from": "2026-03-01"})
        assert r.status_code == 200
        dates = [d["date"] for d in r.json()["days"]]
        for d in dates:
            assert d >= "2026-03-01"

    def test_date_to_filters(self, client, test_db):
        """date_to отсекает более поздние даты."""
        _insert_sample_week(test_db)
        r = client.get("/api/dlvry/stats/daily", params={"date_to": "2026-02-28"})
        assert r.status_code == 200
        dates = [d["date"] for d in r.json()["days"]]
        for d in dates:
            assert d <= "2026-02-28"

    def test_date_range_filters(self, client, test_db):
        """date_from + date_to — диапазон."""
        _insert_sample_week(test_db)
        r = client.get("/api/dlvry/stats/daily", params={
            "date_from": "2026-02-27",
            "date_to": "2026-03-01",
        })
        data = r.json()
        assert data["total"] == 3  # 27, 28, 1 марта
        dates = [d["date"] for d in data["days"]]
        assert all("2026-02-27" <= d <= "2026-03-01" for d in dates)

    def test_aggregated_respects_date_filter(self, client, test_db):
        """Агрегаты считаются только по отфильтрованному диапазону."""
        _insert_daily_stat(test_db, stat_date=date(2026, 3, 1), orders_count=10, revenue=15000.0, first_orders=3)
        _insert_daily_stat(test_db, stat_date=date(2026, 3, 2), orders_count=5, revenue=10000.0, first_orders=2)

        # Запрашиваем только 1 марта
        r = client.get("/api/dlvry/stats/daily", params={"date_from": "2026-03-01", "date_to": "2026-03-01"})
        agg = r.json()["aggregated"]
        assert agg["total_orders"] == 10
        assert agg["total_revenue"] == 15000.0


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Фильтрация по project_id (auto-resolve affiliate_id)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestProjectIdResolve:
    """Проверяем, что project_id автоматически резолвится в affiliate_id."""

    def test_project_id_resolves_affiliate(self, client, test_db):
        """Передаём project_id → роутер находит affiliate_id из проекта."""
        _insert_project(test_db, id="proj-1", dlvry_affiliate_id="aff-100")
        _insert_daily_stat(test_db, affiliate_id="aff-100", project_id="proj-1")

        r = client.get("/api/dlvry/stats/daily", params={"project_id": "proj-1"})
        assert r.status_code == 200
        assert r.json()["total"] == 1

    def test_project_without_affiliate_returns_empty(self, client, test_db):
        """Проект без affiliate_id → пустой ответ (не 500)."""
        _insert_project(test_db, id="proj-no-dlvry", dlvry_affiliate_id=None)
        r = client.get("/api/dlvry/stats/daily", params={"project_id": "proj-no-dlvry"})
        assert r.status_code == 200
        assert r.json()["total"] == 0


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# POST /api/dlvry/stats/sync — синхронизация
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestSyncStats:
    """Проверяем эндпоинт синхронизации (без реального DLVRY API)."""

    def test_sync_without_affiliate_returns_400(self, client, test_db):
        """Без affiliate_id и без project_id → 400."""
        r = client.post("/api/dlvry/stats/sync")
        assert r.status_code == 400

    def test_sync_with_nonexistent_project_returns_400(self, client, test_db):
        """Несуществующий project_id без affiliate → 400."""
        r = client.post("/api/dlvry/stats/sync", params={"project_id": "not-exist"})
        assert r.status_code == 400

    def test_sync_with_project_without_dlvry_returns_400(self, client, test_db):
        """Проект без dlvry_affiliate_id → 400."""
        _insert_project(test_db, id="proj-no-dlvry", dlvry_affiliate_id=None)
        r = client.post("/api/dlvry/stats/sync", params={"project_id": "proj-no-dlvry"})
        assert r.status_code == 400


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# POST /api/dlvry/stats/sync-all
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestSyncAll:
    """Smoke-проверка sync-all."""

    def test_sync_all_returns_200(self, client, test_db):
        """Эндпоинт sync-all не крашится (даже без проектов)."""
        r = client.post("/api/dlvry/stats/sync-all")
        assert r.status_code == 200

    def test_sync_all_response_structure(self, client, test_db):
        """Структура ответа: total_projects, synced, errors, details."""
        r = client.post("/api/dlvry/stats/sync-all")
        data = r.json()
        assert "total_projects" in data
        assert "synced" in data
        assert "errors" in data
        assert "details" in data

    def test_sync_all_no_projects_returns_zeros(self, client, test_db):
        """Нет проектов с DLVRY → нули."""
        r = client.post("/api/dlvry/stats/sync-all")
        data = r.json()
        assert data["total_projects"] == 0
        assert data["synced"] == 0
        assert data["errors"] == 0


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CRUD-тесты (upsert, bulk_upsert, get)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestCrudDailyStats:
    """Прямые тесты CRUD-функций через реальную БД."""

    def test_upsert_creates_new_record(self, test_db):
        """upsert создаёт новую запись."""
        from crud.dlvry_daily_stats_crud import upsert_daily_stat

        row = upsert_daily_stat(
            db=test_db,
            affiliate_id="aff-100",
            project_id="proj-1",
            stat_date=date(2026, 3, 1),
            orders_count=10,
            revenue=15000.0,
            first_orders=3,
            avg_check=1500.0,
        )
        assert row.id is not None
        assert row.orders_count == 10
        assert row.revenue == 15000.0

    def test_upsert_updates_existing(self, test_db):
        """upsert обновляет существующую запись (тот же affiliate + дата)."""
        from crud.dlvry_daily_stats_crud import upsert_daily_stat

        row1 = upsert_daily_stat(
            db=test_db, affiliate_id="aff-100", project_id="proj-1",
            stat_date=date(2026, 3, 1), orders_count=5, revenue=7500.0,
            first_orders=1, avg_check=1500.0,
        )
        row2 = upsert_daily_stat(
            db=test_db, affiliate_id="aff-100", project_id="proj-1",
            stat_date=date(2026, 3, 1), orders_count=10, revenue=15000.0,
            first_orders=3, avg_check=1500.0,
        )
        # Должна быть та же строка (обновлённая)
        assert row2.id == row1.id
        assert row2.orders_count == 10
        assert row2.revenue == 15000.0

    def test_bulk_upsert_parses_dd_mm_yyyy(self, test_db):
        """bulk_upsert корректно парсит даты в формате DD.MM.YYYY."""
        from crud.dlvry_daily_stats_crud import bulk_upsert_daily_stats

        items = [
            {"date": "01.03.2026", "count": 10, "sum": 15000, "first_orders": 3, "avg_check": 1500},
            {"date": "02.03.2026", "count": 5, "sum": 10000, "first_orders": 2, "avg_check": 2000},
        ]
        count = bulk_upsert_daily_stats(test_db, "aff-100", "proj-1", items)
        assert count == 2

        rows = test_db.query(DlvryDailyStats).all()
        assert len(rows) == 2

    def test_bulk_upsert_skips_invalid_date(self, test_db):
        """Невалидная дата — строка пропускается, не крашит."""
        from crud.dlvry_daily_stats_crud import bulk_upsert_daily_stats

        items = [
            {"date": "01.03.2026", "count": 10, "sum": 15000, "first_orders": 3, "avg_check": 1500},
            {"date": "invalid-date", "count": 0, "sum": 0, "first_orders": 0, "avg_check": 0},
            {"date": "02.03.2026", "count": 5, "sum": 10000, "first_orders": 2, "avg_check": 2000},
        ]
        count = bulk_upsert_daily_stats(test_db, "aff-100", "proj-1", items)
        assert count == 2  # пропустили невалидную

    def test_get_daily_stats_filters(self, test_db):
        """get_daily_stats фильтрует по project_id, date_from, date_to."""
        from crud.dlvry_daily_stats_crud import get_daily_stats

        _insert_daily_stat(test_db, stat_date=date(2026, 3, 1), project_id="proj-1")
        _insert_daily_stat(test_db, stat_date=date(2026, 3, 2), project_id="proj-1")
        _insert_daily_stat(test_db, stat_date=date(2026, 3, 3), project_id="proj-2")

        rows = get_daily_stats(test_db, project_id="proj-1")
        assert len(rows) == 2

        rows = get_daily_stats(test_db, project_id="proj-1", date_from=date(2026, 3, 2))
        assert len(rows) == 1
        assert rows[0].stat_date == date(2026, 3, 2)

    def test_get_aggregated_stats_sums_correctly(self, test_db):
        """get_aggregated_stats суммирует orders_count, revenue, first_orders + считает avg_check."""
        from crud.dlvry_daily_stats_crud import get_aggregated_stats

        _insert_daily_stat(test_db, stat_date=date(2026, 3, 1), orders_count=10, revenue=15000.0, first_orders=3)
        _insert_daily_stat(test_db, stat_date=date(2026, 3, 2), orders_count=5, revenue=10000.0, first_orders=2)

        agg = get_aggregated_stats(test_db)
        assert agg["total_orders"] == 15
        assert agg["total_revenue"] == 25000.0
        assert agg["total_first_orders"] == 5
        assert round(agg["avg_check"], 2) == 1666.67

    def test_get_aggregated_stats_empty_table(self, test_db):
        """Пустая таблица → нули, не ошибка."""
        from crud.dlvry_daily_stats_crud import get_aggregated_stats

        agg = get_aggregated_stats(test_db)
        assert agg["total_orders"] == 0
        assert agg["total_revenue"] == 0
        assert agg["total_first_orders"] == 0
        assert agg["avg_check"] == 0

    def test_get_last_synced_date(self, test_db):
        """get_last_synced_date возвращает максимальную дату."""
        from crud.dlvry_daily_stats_crud import get_last_synced_date

        _insert_daily_stat(test_db, stat_date=date(2026, 3, 1))
        _insert_daily_stat(test_db, stat_date=date(2026, 3, 5))
        _insert_daily_stat(test_db, stat_date=date(2026, 3, 3))

        last = get_last_synced_date(test_db, "aff-100")
        assert str(last) == "2026-03-05"

    def test_get_last_synced_date_empty(self, test_db):
        """Пустая таблица → None."""
        from crud.dlvry_daily_stats_crud import get_last_synced_date

        last = get_last_synced_date(test_db, "aff-100")
        assert last is None


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Контрактный тест (API ↔ Frontend types)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestDailyStatsContract:
    """Контракт: ответ /stats/daily ↔ DlvryDailyStatsResponse."""

    def test_response_contract_keys(self, client, test_db):
        """Все ключи верхнего уровня присутствуют."""
        _insert_daily_stat(test_db)
        r = client.get("/api/dlvry/stats/daily")
        assert r.status_code == 200
        data = r.json()
        assert set(data.keys()) >= {"days", "total", "aggregated"}

    def test_day_item_no_extra_unexpected_keys(self, client, test_db):
        """
        Проверяем, что день содержит именно те ключи,
        которые определены в DlvryDayStat.
        """
        _insert_daily_stat(test_db)
        r = client.get("/api/dlvry/stats/daily")
        day = r.json()["days"][0]
        expected_keys = {"date", "orders_count", "revenue", "first_orders", "avg_check"}
        actual_keys = set(day.keys())
        missing = expected_keys - actual_keys
        assert not missing, (
            f"Контракт нарушен! Фронтенд DlvryDayStat ожидает {missing}. "
            f"Бэкенд вернул: {actual_keys}"
        )

    def test_aggregated_no_missing_keys(self, client, test_db):
        """
        aggregated содержит все ключи DlvryAggregated.
        """
        _insert_daily_stat(test_db)
        r = client.get("/api/dlvry/stats/daily")
        agg = r.json()["aggregated"]
        expected_keys = {"total_orders", "total_revenue", "total_first_orders", "avg_check"}
        actual_keys = set(agg.keys())
        missing = expected_keys - actual_keys
        assert not missing, (
            f"Контракт нарушен! Фронтенд DlvryAggregated ожидает {missing}. "
            f"Бэкенд вернул: {actual_keys}"
        )

    def test_day_values_have_correct_types(self, client, test_db):
        """Типы полей корректны (str, int, float)."""
        _insert_daily_stat(test_db)
        r = client.get("/api/dlvry/stats/daily")
        day = r.json()["days"][0]

        assert isinstance(day["date"], str)
        assert isinstance(day["orders_count"], int)
        assert isinstance(day["revenue"], (int, float))
        assert isinstance(day["first_orders"], int)
        assert isinstance(day["avg_check"], (int, float))

    def test_aggregated_values_have_correct_types(self, client, test_db):
        """Типы полей агрегатов корректны."""
        _insert_daily_stat(test_db)
        r = client.get("/api/dlvry/stats/daily")
        agg = r.json()["aggregated"]

        assert isinstance(agg["total_orders"], int)
        assert isinstance(agg["total_revenue"], (int, float))
        assert isinstance(agg["total_first_orders"], int)
        assert isinstance(agg["avg_check"], (int, float))
