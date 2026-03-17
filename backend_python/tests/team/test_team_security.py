"""
ТЕСТЫ БЕЗОПАСНОСТИ (auth boundary) для модуля Team / HR.

Проверяем границы авторизации через РЕАЛЬНЫЙ auth-middleware
(НЕ через dependency_overrides). Мокаем только session lookup.

Три класса:
  1. TestRouteRegistration — маршрут зарегистрирован (НЕ 404)
  2. TestAuthMiddleware — без токена → 401
  3. TestRoleRestrictions — user на admin-endpoint → 403,
     user на my-profile → НЕ 403
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from fastapi.testclient import TestClient
from database import get_db
from main import app


# ─────────────────────────────────────────────
# Фикстуры
# ─────────────────────────────────────────────

def _create_mock_session(role="admin", user_type="system"):
    """Мок-объект auth_session для get_session_by_token."""
    session = MagicMock()
    session.id = "test-session-id"
    session.user_id = "user-1"
    session.username = "test_admin" if role == "admin" else "test_user"
    session.role = role
    session.user_type = user_type
    session.last_activity = datetime.utcnow()
    return session


@pytest.fixture
def mock_db():
    """Мок SQLAlchemy Session."""
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    db.query.return_value.filter.return_value.all.return_value = []
    db.query.return_value.order_by.return_value.all.return_value = []
    db.query.return_value.filter.return_value.order_by.return_value.all.return_value = []
    return db


@pytest.fixture
def app_client(mock_db):
    """
    TestClient с подменённым get_db. Auth НЕ мокается —
    это критично для тестов 401/403.
    """
    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app, raise_server_exceptions=False)
    yield client
    app.dependency_overrides.clear()


# Репрезентативные маршруты для тестов (не все 64 — покрываем каждый ресурс)
# (метод, путь, json-body если нужен)
_ADMIN_ROUTES = [
    ("GET",    "/api/team/constructor",              None),
    ("GET",    "/api/team/contact-types",            None),
    ("POST",   "/api/team/contact-types",            {"name": "T"}),
    ("GET",    "/api/team/section-types",            None),
    ("POST",   "/api/team/section-types",            {"name": "S"}),
    ("GET",    "/api/team/categories/competency",    None),
    ("POST",   "/api/team/categories/competency",    {"name": "C"}),
    ("GET",    "/api/team/competencies",             None),
    ("POST",   "/api/team/competencies",             {"name": "C"}),
    ("GET",    "/api/team/regulations",              None),
    ("POST",   "/api/team/regulations",              {"title": "R"}),
    ("GET",    "/api/team/trainings",                None),
    ("POST",   "/api/team/trainings",                {"title": "T"}),
    ("GET",    "/api/team/tests",                    None),
    ("POST",   "/api/team/tests",                    {"title": "T"}),
    ("GET",    "/api/team/departments",              None),
    ("GET",    "/api/team/departments/tree",         None),
    ("POST",   "/api/team/departments",              {"name": "D"}),
    ("GET",    "/api/team/positions",                None),
    ("POST",   "/api/team/positions",                {"title": "P"}),
    ("GET",    "/api/team/employees",                None),
    ("POST",   "/api/team/employees",                {"last_name": "L", "first_name": "F"}),
]

_USER_ROUTES = [
    ("GET",    "/api/team/my-profile",    None),
    ("PATCH",  "/api/team/my-profile",    {"bio": "x"}),
]


def _request(client, method, path, json_body):
    """Выполняет HTTP-запрос по методу."""
    fn = getattr(client, method.lower())
    if json_body:
        return fn(path, json=json_body)
    return fn(path)


# ═══════════════════════════════════════════════════
# 1. Маршруты зарегистрированы (НЕ 404)
# ═══════════════════════════════════════════════════

class TestRouteRegistration:
    """Все team-маршруты зарегистрированы в app → НЕ 404."""

    @pytest.mark.parametrize("method,path,body", _ADMIN_ROUTES + _USER_ROUTES,
                             ids=[f"{m} {p}" for m, p, _ in _ADMIN_ROUTES + _USER_ROUTES])
    def test_route_not_404(self, app_client, method, path, body):
        r = _request(app_client, method, path, body)
        assert r.status_code != 404, (
            f"{method} {path} вернул 404! Проверь include_router в main.py"
        )


# ═══════════════════════════════════════════════════
# 2. Без токена → 401
# ═══════════════════════════════════════════════════

class TestAuthMiddleware:
    """Запросы без X-Session-Token возвращают 401."""

    @pytest.mark.parametrize("method,path,body", _ADMIN_ROUTES + _USER_ROUTES,
                             ids=[f"{m} {p}" for m, p, _ in _ADMIN_ROUTES + _USER_ROUTES])
    def test_no_token_returns_401(self, app_client, method, path, body):
        r = _request(app_client, method, path, body)
        assert r.status_code == 401, (
            f"{method} {path} без токена вернул {r.status_code}, ожидался 401. "
            f"Response: {r.text[:200]}"
        )

    @patch("crud.auth_session_crud.get_session_by_token", return_value=None)
    def test_invalid_token_returns_401(self, mock_get_session, app_client):
        """Невалидный токен → 401."""
        r = app_client.get(
            "/api/team/contact-types",
            headers={"X-Session-Token": "invalid-token-xxx"},
        )
        assert r.status_code == 401, (
            f"Невалидный токен вернул {r.status_code}, ожидался 401"
        )


# ═══════════════════════════════════════════════════
# 3. Роли: admin vs user
# ═══════════════════════════════════════════════════

class TestRoleRestrictions:
    """
    Admin-only эндпоинты:
      - admin → НЕ 401 и НЕ 403
      - user → 403

    User-allowed (/my-profile):
      - user → НЕ 401 и НЕ 403
    """

    @patch("crud.auth_session_crud.update_last_activity")
    @patch("crud.auth_session_crud.get_session_by_token")
    def test_admin_routes_user_returns_403(self, mock_get_session, mock_update, app_client):
        """Обычный user на admin-endpoint → 403."""
        mock_get_session.return_value = _create_mock_session(role="user")

        for method, path, body in _ADMIN_ROUTES:
            r = _request(app_client, method, path, body)
            if body:
                # POST/PATCH с headers
                fn = getattr(app_client, method.lower())
                r = fn(path, json=body, headers={"X-Session-Token": "user-token"})
            else:
                fn = getattr(app_client, method.lower())
                r = fn(path, headers={"X-Session-Token": "user-token"})
            assert r.status_code == 403, (
                f"{method} {path}: user получил {r.status_code}, ожидался 403. "
                f"Response: {r.text[:200]}"
            )

    @patch("crud.auth_session_crud.update_last_activity")
    @patch("crud.auth_session_crud.get_session_by_token")
    def test_admin_routes_admin_passes(self, mock_get_session, mock_update, app_client):
        """Admin на admin-endpoint → НЕ 401/403."""
        mock_get_session.return_value = _create_mock_session(role="admin")

        for method, path, body in _ADMIN_ROUTES:
            fn = getattr(app_client, method.lower())
            if body:
                r = fn(path, json=body, headers={"X-Session-Token": "admin-token"})
            else:
                r = fn(path, headers={"X-Session-Token": "admin-token"})
            assert r.status_code not in (401, 403), (
                f"{method} {path}: admin получил {r.status_code}. "
                f"Response: {r.text[:200]}"
            )

    @patch("crud.auth_session_crud.update_last_activity")
    @patch("crud.auth_session_crud.get_session_by_token")
    def test_my_profile_user_allowed(self, mock_get_session, mock_update, app_client):
        """/my-profile доступен обычному user → НЕ 401 и НЕ 403."""
        mock_get_session.return_value = _create_mock_session(role="user")

        for method, path, body in _USER_ROUTES:
            fn = getattr(app_client, method.lower())
            if body:
                r = fn(path, json=body, headers={"X-Session-Token": "user-token"})
            else:
                r = fn(path, headers={"X-Session-Token": "user-token"})
            assert r.status_code not in (401, 403), (
                f"{method} {path}: user получил {r.status_code}, а должен пройти. "
                f"Response: {r.text[:200]}"
            )

    @patch("crud.auth_session_crud.terminate_session")
    @patch("crud.auth_session_crud.update_last_activity")
    @patch("crud.auth_session_crud.get_session_by_token")
    def test_expired_session_returns_401(self, mock_get_session, mock_update, mock_terminate, app_client):
        """Протухшая сессия (>20 мин) → 401."""
        expired = _create_mock_session(role="admin")
        expired.last_activity = datetime(2020, 1, 1)  # давно протухла
        mock_get_session.return_value = expired

        r = app_client.get(
            "/api/team/contact-types",
            headers={"X-Session-Token": "expired-token"},
        )
        assert r.status_code == 401, (
            f"Протухшая сессия вернула {r.status_code}, ожидался 401"
        )
