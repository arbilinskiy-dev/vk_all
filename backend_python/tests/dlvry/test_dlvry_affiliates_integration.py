"""
Интеграционный тест DLVRY Affiliates (Model-Field Contract + CRUD + Endpoints).

ЗАЧЕМ ЭТОТ ТЕСТ:
    Ловит несоответствия между роутером ↔ моделью ↔ CRUD ↔ схемой
    для нового функционала мультифилиалов DLVRY:
      - DlvryProjectAffiliate модель
      - dlvry_affiliate_crud CRUD-функции
      - 4 новых эндпоинта: GET/POST /affiliates/{project_id}, PUT/DELETE /affiliates/record/{record_id}
      - DlvryAffiliateResponse / DlvryAffiliateCreatePayload / DlvryAffiliateUpdatePayload схемы

    In-memory SQLite + реальный TestClient → любое несоответствие = 500.
"""

import sys
import os
import pytest
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from unittest.mock import patch

from database import Base, get_db
from main import app
from models_library.dlvry_affiliates import DlvryProjectAffiliate
import crud.dlvry_affiliate_crud as aff_crud


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Фикстуры
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@pytest.fixture(scope="function")
def test_db():
    """In-memory SQLite с таблицей dlvry_project_affiliates."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
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
# Хелперы
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _insert_affiliate(db, **overrides) -> DlvryProjectAffiliate:
    """Вставляет тестовый филиал и возвращает ORM-объект."""
    defaults = dict(
        id="rec-001",
        project_id="proj-1",
        affiliate_id="aff-100",
        name="Тестовый филиал",
        is_active=True,
    )
    defaults.update(overrides)
    aff = DlvryProjectAffiliate(**defaults)
    db.add(aff)
    db.commit()
    db.refresh(aff)
    return aff


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Категория 1: Smoke (200 не 500)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestSmoke:
    """Базовая проверка: эндпоинты не падают с 500."""

    def test_list_returns_200(self, client, test_db):
        """GET /affiliates/{project_id} с данными → 200."""
        _insert_affiliate(test_db)
        r = client.get("/api/dlvry/affiliates/proj-1")
        assert r.status_code == 200, (
            f"Ожидали 200, получили {r.status_code}. Тело: {r.text[:500]}"
        )

    @patch("services.dlvry.stats_sync_service.run_full_sync_background")
    def test_create_returns_200(self, mock_sync, client, test_db):
        """POST /affiliates/{project_id} → 200."""
        r = client.post(
            "/api/dlvry/affiliates/proj-1",
            json={"affiliate_id": "aff-new", "name": "Новый"},
        )
        assert r.status_code == 200, (
            f"Ожидали 200, получили {r.status_code}. Тело: {r.text[:500]}"
        )

    def test_update_returns_200(self, client, test_db):
        """PUT /affiliates/record/{record_id} → 200."""
        aff = _insert_affiliate(test_db)
        r = client.put(
            f"/api/dlvry/affiliates/record/{aff.id}",
            json={"name": "Обновлённый"},
        )
        assert r.status_code == 200, (
            f"Ожидали 200, получили {r.status_code}. Тело: {r.text[:500]}"
        )

    def test_delete_returns_200(self, client, test_db):
        """DELETE /affiliates/record/{record_id} → 200."""
        aff = _insert_affiliate(test_db)
        r = client.delete(f"/api/dlvry/affiliates/record/{aff.id}")
        assert r.status_code == 200, (
            f"Ожидали 200, получили {r.status_code}. Тело: {r.text[:500]}"
        )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Категория 2: Empty Data (пустая таблица → 200)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestEmptyData:
    """Пустая таблица — не должна вызывать 500."""

    def test_empty_list_returns_200(self, client, test_db):
        """Пустая таблица → 200 с пустым списком."""
        r = client.get("/api/dlvry/affiliates/proj-1")
        assert r.status_code == 200
        assert r.json() == []

    def test_empty_list_other_project_returns_200(self, client, test_db):
        """Филиалы другого проекта → 200 с пустым списком."""
        _insert_affiliate(test_db, project_id="proj-other")
        r = client.get("/api/dlvry/affiliates/proj-1")
        assert r.status_code == 200
        assert r.json() == []


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Категория 3: Not Found (404, не 500)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestNotFound:
    """Несуществующие ресурсы → 404."""

    def test_update_not_found_returns_404(self, client, test_db):
        """PUT несуществующий record_id → 404."""
        r = client.put(
            "/api/dlvry/affiliates/record/non-existent",
            json={"name": "test"},
        )
        assert r.status_code == 404

    def test_delete_not_found_returns_404(self, client, test_db):
        """DELETE несуществующий record_id → 404."""
        r = client.delete("/api/dlvry/affiliates/record/non-existent")
        assert r.status_code == 404


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Категория 4: Field Contract (поля ответа ↔ фронтенд-тип)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestFieldContract:
    """
    Контрактные тесты — ответ содержит ВСЕ поля фронтенд-типа DlvryAffiliate:
    id, project_id, affiliate_id, name, is_active, created_at
    """

    EXPECTED_FIELDS = {"id", "project_id", "affiliate_id", "name", "is_active", "created_at"}

    def test_list_response_has_all_fields(self, client, test_db):
        """GET list → все поля фронтенд-типа DlvryAffiliate."""
        _insert_affiliate(test_db)
        r = client.get("/api/dlvry/affiliates/proj-1")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        item = items[0]
        item_keys = set(item.keys())
        missing = self.EXPECTED_FIELDS - item_keys
        assert not missing, (
            f"Контракт нарушен! Фронтенд ожидает поля {missing}, "
            f"но бэкенд их не вернул. Имеющиеся: {item_keys}"
        )

    @patch("services.dlvry.stats_sync_service.run_full_sync_background")
    def test_create_response_has_all_fields(self, mock_sync, client, test_db):
        """POST create → все поля фронтенд-типа DlvryAffiliate."""
        r = client.post(
            "/api/dlvry/affiliates/proj-1",
            json={"affiliate_id": "aff-new"},
        )
        assert r.status_code == 200
        data = r.json()
        missing = self.EXPECTED_FIELDS - set(data.keys())
        assert not missing, f"Контракт create нарушен! Нет полей: {missing}"

    def test_update_response_has_all_fields(self, client, test_db):
        """PUT update → все поля фронтенд-типа DlvryAffiliate."""
        aff = _insert_affiliate(test_db)
        r = client.put(
            f"/api/dlvry/affiliates/record/{aff.id}",
            json={"name": "Обновлённый"},
        )
        assert r.status_code == 200
        data = r.json()
        missing = self.EXPECTED_FIELDS - set(data.keys())
        assert not missing, f"Контракт update нарушен! Нет полей: {missing}"

    def test_full_contract_exact_keys(self, client, test_db):
        """Набор ключей точно совпадает (нет лишних полей)."""
        _insert_affiliate(test_db)
        r = client.get("/api/dlvry/affiliates/proj-1")
        item_keys = set(r.json()[0].keys())
        assert item_keys == self.EXPECTED_FIELDS, (
            f"Лишние поля: {item_keys - self.EXPECTED_FIELDS}, "
            f"Недостающие: {self.EXPECTED_FIELDS - item_keys}"
        )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Категория 5: Value Mapping (значения ORM → JSON)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestValueMapping:
    """Проверяет корректность маппинга значений model → response."""

    def test_list_values_correct(self, client, test_db):
        """Значения в GET list корректно отражают данные модели."""
        _insert_affiliate(
            test_db,
            id="rec-test-val",
            project_id="proj-42",
            affiliate_id="aff-777",
            name="Пиццерия на Пушкина",
            is_active=True,
        )
        r = client.get("/api/dlvry/affiliates/proj-42")
        assert r.status_code == 200
        item = r.json()[0]
        assert item["id"] == "rec-test-val"
        assert item["project_id"] == "proj-42"
        assert item["affiliate_id"] == "aff-777"
        assert item["name"] == "Пиццерия на Пушкина"
        assert item["is_active"] is True
        assert item["created_at"] is not None

    @patch("services.dlvry.stats_sync_service.run_full_sync_background")
    def test_create_values_correct(self, mock_sync, client, test_db):
        """POST → возвращает корректные значения."""
        r = client.post(
            "/api/dlvry/affiliates/proj-1",
            json={"affiliate_id": "aff-created", "name": "Новый филиал"},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["affiliate_id"] == "aff-created"
        assert data["name"] == "Новый филиал"
        assert data["project_id"] == "proj-1"
        assert data["is_active"] is True

    def test_update_values_correct(self, client, test_db):
        """PUT → обновлённые значения корректно возвращаются."""
        aff = _insert_affiliate(test_db)
        r = client.put(
            f"/api/dlvry/affiliates/record/{aff.id}",
            json={"name": "Переименованный", "is_active": False},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "Переименованный"
        assert data["is_active"] is False

    def test_delete_returns_success(self, client, test_db):
        """DELETE → возвращает success: true."""
        aff = _insert_affiliate(test_db)
        r = client.delete(f"/api/dlvry/affiliates/record/{aff.id}")
        assert r.status_code == 200
        assert r.json()["success"] is True


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Категория 6: CRUD-функции напрямую (без HTTP)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestCrudDirect:
    """Тестирует CRUD-функции без HTTP — чистая работа с БД."""

    def test_create_affiliate(self, test_db):
        """create_affiliate создаёт запись и возвращает ORM-объект."""
        result = aff_crud.create_affiliate(test_db, "proj-1", "aff-crud-1", name="Тест CRUD")
        assert result.affiliate_id == "aff-crud-1"
        assert result.project_id == "proj-1"
        assert result.name == "Тест CRUD"
        assert result.is_active is True
        assert result.id is not None

    def test_get_affiliates_by_project(self, test_db):
        """get_affiliates_by_project возвращает только филиалы нужного проекта."""
        _insert_affiliate(test_db, id="r1", project_id="proj-A", affiliate_id="aff-A1")
        _insert_affiliate(test_db, id="r2", project_id="proj-A", affiliate_id="aff-A2")
        _insert_affiliate(test_db, id="r3", project_id="proj-B", affiliate_id="aff-B1")
        result = aff_crud.get_affiliates_by_project(test_db, "proj-A")
        assert len(result) == 2
        assert {r.affiliate_id for r in result} == {"aff-A1", "aff-A2"}

    def test_get_active_affiliates_by_project(self, test_db):
        """get_active_affiliates_by_project исключает неактивные."""
        _insert_affiliate(test_db, id="r1", project_id="proj-1", affiliate_id="aff-act", is_active=True)
        _insert_affiliate(test_db, id="r2", project_id="proj-1", affiliate_id="aff-inact", is_active=False)
        result = aff_crud.get_active_affiliates_by_project(test_db, "proj-1")
        assert len(result) == 1
        assert result[0].affiliate_id == "aff-act"

    def test_find_project_id_by_affiliate_id(self, test_db):
        """find_project_id_by_affiliate_id находит project_id."""
        _insert_affiliate(test_db, project_id="proj-found", affiliate_id="aff-lookup")
        result = aff_crud.find_project_id_by_affiliate_id(test_db, "aff-lookup")
        assert result == "proj-found"

    def test_find_project_id_by_affiliate_id_not_found(self, test_db):
        """find_project_id_by_affiliate_id → None для несуществующего."""
        result = aff_crud.find_project_id_by_affiliate_id(test_db, "nonexistent")
        assert result is None

    def test_update_affiliate(self, test_db):
        """update_affiliate меняет имя и is_active."""
        aff = _insert_affiliate(test_db)
        updated = aff_crud.update_affiliate(test_db, aff.id, name="Новое имя", is_active=False)
        assert updated is not None
        assert updated.name == "Новое имя"
        assert updated.is_active is False

    def test_update_affiliate_not_found(self, test_db):
        """update_affiliate → None для несуществующего."""
        result = aff_crud.update_affiliate(test_db, "nonexistent", name="test")
        assert result is None

    def test_delete_affiliate(self, test_db):
        """delete_affiliate удаляет запись."""
        aff = _insert_affiliate(test_db)
        assert aff_crud.delete_affiliate(test_db, aff.id) is True
        # Проверяем что реально удалено
        assert aff_crud.get_affiliate_by_id(test_db, aff.id) is None

    def test_delete_affiliate_not_found(self, test_db):
        """delete_affiliate → False для несуществующего."""
        assert aff_crud.delete_affiliate(test_db, "nonexistent") is False

    def test_get_active_affiliate_ids_for_project(self, test_db):
        """get_active_affiliate_ids_for_project → список строк affiliate_id."""
        _insert_affiliate(test_db, id="r1", project_id="proj-1", affiliate_id="aff-1", is_active=True)
        _insert_affiliate(test_db, id="r2", project_id="proj-1", affiliate_id="aff-2", is_active=True)
        _insert_affiliate(test_db, id="r3", project_id="proj-1", affiliate_id="aff-3", is_active=False)
        result = aff_crud.get_active_affiliate_ids_for_project(test_db, "proj-1")
        assert set(result) == {"aff-1", "aff-2"}

    def test_get_all_active_affiliates(self, test_db):
        """get_all_active_affiliates → все активные всех проектов."""
        _insert_affiliate(test_db, id="r1", project_id="proj-A", affiliate_id="aff-A1", is_active=True)
        _insert_affiliate(test_db, id="r2", project_id="proj-B", affiliate_id="aff-B1", is_active=True)
        _insert_affiliate(test_db, id="r3", project_id="proj-C", affiliate_id="aff-C1", is_active=False)
        result = aff_crud.get_all_active_affiliates(test_db)
        assert len(result) == 2
        assert {r.affiliate_id for r in result} == {"aff-A1", "aff-B1"}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Категория 7: Бизнес-логика эндпоинтов
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestBusinessLogic:
    """Проверяет бизнес-правила: дубликаты, фильтрация по проекту."""

    @patch("services.dlvry.stats_sync_service.run_full_sync_background")
    def test_create_duplicate_affiliate_id_returns_409(self, mock_sync, client, test_db):
        """Попытка создать филиал с уже занятым affiliate_id → 409."""
        _insert_affiliate(test_db, affiliate_id="aff-dup")
        r = client.post(
            "/api/dlvry/affiliates/proj-1",
            json={"affiliate_id": "aff-dup"},
        )
        assert r.status_code == 409

    @patch("services.dlvry.stats_sync_service.run_full_sync_background")
    def test_create_triggers_background_sync(self, mock_sync, client, test_db):
        """POST create → запускает фоновую синхронизацию."""
        r = client.post(
            "/api/dlvry/affiliates/proj-1",
            json={"affiliate_id": "aff-sync-test"},
        )
        assert r.status_code == 200
        mock_sync.assert_called_once_with("proj-1", "aff-sync-test")

    def test_list_filters_by_project_id(self, client, test_db):
        """GET list возвращает только филиалы запрошенного проекта."""
        _insert_affiliate(test_db, id="r1", project_id="proj-A", affiliate_id="aff-A")
        _insert_affiliate(test_db, id="r2", project_id="proj-B", affiliate_id="aff-B")
        r = client.get("/api/dlvry/affiliates/proj-A")
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 1
        assert items[0]["affiliate_id"] == "aff-A"

    @patch("services.dlvry.stats_sync_service.run_full_sync_background")
    def test_create_without_name(self, mock_sync, client, test_db):
        """POST без name → создаётся с name=None."""
        r = client.post(
            "/api/dlvry/affiliates/proj-1",
            json={"affiliate_id": "aff-noname"},
        )
        assert r.status_code == 200
        assert r.json()["name"] is None

    def test_update_partial_only_name(self, client, test_db):
        """PUT с только name → is_active не меняется."""
        aff = _insert_affiliate(test_db, is_active=True)
        r = client.put(
            f"/api/dlvry/affiliates/record/{aff.id}",
            json={"name": "Только имя"},
        )
        assert r.status_code == 200
        assert r.json()["name"] == "Только имя"
        assert r.json()["is_active"] is True

    def test_update_partial_only_is_active(self, client, test_db):
        """PUT с только is_active → name не меняется."""
        aff = _insert_affiliate(test_db, name="Оригинал")
        r = client.put(
            f"/api/dlvry/affiliates/record/{aff.id}",
            json={"is_active": False},
        )
        assert r.status_code == 200
        assert r.json()["is_active"] is False
        assert r.json()["name"] == "Оригинал"

    def test_delete_then_get_empty(self, client, test_db):
        """DELETE → повторный GET возвращает пустой список."""
        aff = _insert_affiliate(test_db)
        client.delete(f"/api/dlvry/affiliates/record/{aff.id}")
        r = client.get("/api/dlvry/affiliates/proj-1")
        assert r.status_code == 200
        assert r.json() == []
