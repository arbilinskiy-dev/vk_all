"""
ИНТЕГРАЦИОННЫЕ HTTP-ТЕСТЫ для модуля сообщений.
Используют FastAPI TestClient для проверки ПОЛНОГО стека:
  маршрутизация → auth middleware → handler → ответ

Эти тесты ловят проблемы, которые юнит-тесты НЕ видят:
  - 404: маршрут не зарегистрирован в app (include_router отсутствует)
  - 401: auth middleware отклоняет запрос (нет/кривой X-Session-Token)
  - 403: роль пользователя недостаточна (get_current_admin vs get_current_user)
  - 422: невалидный формат body/query (FastAPI Validation Error)

Принцип: НЕ мокаем роутеры/auth — тестируем реальный HTTP через TestClient.
Мокаем только БД (get_db) и внешние вызовы (VK API, track и т.д.).
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime, timedelta

# Добавляем корень бэкенда в sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient


# =============================================================================
# Фикстуры
# =============================================================================

def _create_mock_session(role="admin", user_type="system"):
    """Создаёт мок-объект auth_session для auth_session_crud.get_session_by_token."""
    session = MagicMock()
    session.id = "test-session-id"
    session.user_id = "user-1"
    session.username = "test_admin"
    session.role = role
    session.user_type = user_type
    session.last_activity = datetime.utcnow()  # свежая сессия
    return session


@pytest.fixture
def mock_db():
    """Мок SQLAlchemy Session."""
    db = MagicMock()
    db.query.return_value.filter.return_value.scalar.return_value = 0
    db.query.return_value.filter.return_value.first.return_value = None
    db.query.return_value.filter.return_value.all.return_value = []
    db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = []
    return db


@pytest.fixture
def app_client(mock_db):
    """
    TestClient с подменённым get_db.
    НЕ мокает auth — это критично для тестов 401/403.
    """
    from main import app
    from database import get_db

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app, raise_server_exceptions=False)
    yield client
    app.dependency_overrides.clear()


# =============================================================================
# 1. ТЕСТЫ МАРШРУТИЗАЦИИ: маршрут зарегистрирован → не 404
# =============================================================================

class TestRouteRegistration:
    """
    Проверяем, что ВСЕ маршруты модуля сообщений зарегистрированы в app
    и возвращают НЕ 404.
    Допустимые коды: 401 (нужна auth), 422 (невалидный body) — но НЕ 404.
    """

    def test_messages_actions_dashboard_not_404(self, app_client):
        """POST /api/messages/actions-analysis/dashboard → НЕ 404."""
        r = app_client.post("/api/messages/actions-analysis/dashboard")
        assert r.status_code != 404, (
            f"Маршрут /api/messages/actions-analysis/dashboard вернул 404! "
            f"Проверь include_router(message_actions.router) в main.py"
        )

    def test_messages_send_not_404(self, app_client):
        """POST /api/messages/send → НЕ 404."""
        r = app_client.post("/api/messages/send", json={
            "project_id": "test", "user_id": 12345, "message": "hello"
        })
        assert r.status_code != 404, (
            f"Маршрут /api/messages/send вернул 404! "
            f"Проверь include_router(messages.router) в main.py"
        )

    def test_messages_mark_read_not_404(self, app_client):
        """PUT /api/messages/mark-read → НЕ 404."""
        r = app_client.put("/api/messages/mark-read", json={
            "project_id": "test", "user_id": 12345
        })
        assert r.status_code != 404

    def test_messages_mark_all_read_not_404(self, app_client):
        """PUT /api/messages/mark-all-read → НЕ 404."""
        r = app_client.put("/api/messages/mark-all-read", json={"project_id": "test"})
        assert r.status_code != 404

    def test_messages_mark_unread_not_404(self, app_client):
        """PUT /api/messages/mark-unread → НЕ 404."""
        r = app_client.put("/api/messages/mark-unread", json={
            "project_id": "test", "user_id": 12345
        })
        assert r.status_code != 404

    def test_dialog_labels_list_not_404(self, app_client):
        """GET /api/dialog-labels/list → НЕ 404."""
        r = app_client.get("/api/dialog-labels/list", params={"project_id": "test"})
        assert r.status_code != 404, (
            f"Маршрут /api/dialog-labels/list вернул 404! "
            f"Проверь include_router(dialog_labels.router) в main.py"
        )

    def test_message_templates_list_not_404(self, app_client):
        """POST /api/message-templates/list → НЕ 404."""
        r = app_client.post("/api/message-templates/list", json={"project_id": "test"})
        assert r.status_code != 404, (
            f"Маршрут /api/message-templates/list вернул 404! "
            f"Проверь include_router(message_templates.router) в main.py"
        )

    def test_promo_lists_list_not_404(self, app_client):
        """POST /api/promo-lists/list → НЕ 404."""
        r = app_client.post("/api/promo-lists/list", json={"project_id": "test"})
        assert r.status_code != 404, (
            f"Маршрут /api/promo-lists/list вернул 404! "
            f"Проверь include_router(promo_lists.router) в main.py"
        )


# =============================================================================
# 2. ТЕСТЫ AUTH: без токена → 401, с невалидным → 401
# =============================================================================

class TestAuthMiddleware:
    """
    Проверяем, что auth-защищённые эндпоинты:
    - Без X-Session-Token → 401
    - С невалидным токеном → 401
    - С валидным токеном (admin) → НЕ 401
    """

    def test_dashboard_no_token_returns_401(self, app_client):
        """Dashboard без токена → 401."""
        r = app_client.post("/api/messages/actions-analysis/dashboard")
        assert r.status_code == 401, (
            f"Ожидали 401 без X-Session-Token, получили {r.status_code}. "
            f"Response: {r.text[:200]}"
        )

    def test_send_no_token_returns_401(self, app_client):
        """Send без токена → 401."""
        r = app_client.post("/api/messages/send", json={
            "project_id": "test", "user_id": 12345, "message": "hello"
        })
        assert r.status_code == 401

    def test_mark_read_no_token_returns_401(self, app_client):
        """Mark-read без токена → 401."""
        r = app_client.put("/api/messages/mark-read", json={
            "project_id": "test", "user_id": 12345
        })
        assert r.status_code == 401

    @patch("crud.auth_session_crud.get_session_by_token", return_value=None)
    def test_dashboard_invalid_token_returns_401(self, mock_get_session, app_client):
        """Dashboard с невалидным токеном → 401."""
        r = app_client.post(
            "/api/messages/actions-analysis/dashboard",
            headers={"X-Session-Token": "invalid-token-xxx"},
        )
        assert r.status_code == 401

    @patch("crud.auth_session_crud.update_last_activity")
    @patch("crud.auth_session_crud.get_session_by_token")
    def test_dashboard_valid_admin_token_not_401(self, mock_get_session, mock_update, app_client):
        """Dashboard с валидным admin-токеном → НЕ 401 и НЕ 403."""
        mock_get_session.return_value = _create_mock_session(role="admin")

        r = app_client.post(
            "/api/messages/actions-analysis/dashboard",
            headers={"X-Session-Token": "valid-admin-token"},
        )
        assert r.status_code not in (401, 403), (
            f"Валидный admin-токен вернул {r.status_code}: {r.text[:200]}"
        )

    @patch("crud.auth_session_crud.update_last_activity")
    @patch("crud.auth_session_crud.get_session_by_token")
    def test_send_valid_user_token_not_401(self, mock_get_session, mock_update, app_client):
        """Send с валидным user-токеном → НЕ 401."""
        mock_get_session.return_value = _create_mock_session(role="user")

        r = app_client.post(
            "/api/messages/send",
            json={"project_id": "test", "user_id": 12345, "message": "hello"},
            headers={"X-Session-Token": "valid-user-token"},
        )
        # Может быть 500 (нет проекта в БД) или другое, но НЕ 401
        assert r.status_code != 401, (
            f"Валидный user-токен вернул 401: {r.text[:200]}"
        )


# =============================================================================
# 3. ТЕСТЫ РОЛЕЙ: admin vs user (403)
# =============================================================================

class TestRoleRestrictions:
    """
    Проверяем, что эндпоинты с get_current_admin:
    - С admin-токеном → НЕ 403  
    - С user-токеном → 403
    """

    @patch("crud.auth_session_crud.update_last_activity")
    @patch("crud.auth_session_crud.get_session_by_token")
    def test_dashboard_user_token_returns_403(self, mock_get_session, mock_update, app_client):
        """Dashboard требует admin → обычный user получает 403."""
        mock_get_session.return_value = _create_mock_session(role="user")

        r = app_client.post(
            "/api/messages/actions-analysis/dashboard",
            headers={"X-Session-Token": "valid-user-token"},
        )
        assert r.status_code == 403, (
            f"Ожидали 403 для не-admin, получили {r.status_code}: {r.text[:200]}"
        )

    @patch("crud.auth_session_crud.update_last_activity")
    @patch("crud.auth_session_crud.get_session_by_token")
    def test_dashboard_admin_token_passes_role_check(self, mock_get_session, mock_update, app_client):
        """Dashboard с admin-токеном проходит проверку роли."""
        mock_get_session.return_value = _create_mock_session(role="admin")

        r = app_client.post(
            "/api/messages/actions-analysis/dashboard",
            headers={"X-Session-Token": "valid-admin-token"},
        )
        assert r.status_code != 403


# =============================================================================
# 4. ТЕСТЫ СЕССИИ: протухшая сессия → 401
# =============================================================================

class TestSessionTimeout:
    """Проверяем, что протухшая сессия (>20 мин) → 401."""

    @patch("crud.auth_session_crud.terminate_session")
    @patch("crud.auth_session_crud.get_session_by_token")
    def test_expired_session_returns_401(self, mock_get_session, mock_terminate, app_client):
        """Сессия старше 20 минут → 401."""
        expired_session = _create_mock_session(role="admin")
        expired_session.last_activity = datetime.utcnow() - timedelta(minutes=25)
        mock_get_session.return_value = expired_session

        r = app_client.post(
            "/api/messages/actions-analysis/dashboard",
            headers={"X-Session-Token": "expired-token"},
        )
        assert r.status_code == 401
        mock_terminate.assert_called_once()

    @patch("crud.auth_session_crud.update_last_activity")
    @patch("crud.auth_session_crud.get_session_by_token")
    def test_fresh_session_passes(self, mock_get_session, mock_update, app_client):
        """Сессия моложе 20 минут → проходит."""
        fresh_session = _create_mock_session(role="admin")
        fresh_session.last_activity = datetime.utcnow() - timedelta(minutes=5)
        mock_get_session.return_value = fresh_session

        r = app_client.post(
            "/api/messages/actions-analysis/dashboard",
            headers={"X-Session-Token": "fresh-token"},
        )
        assert r.status_code != 401


# =============================================================================
# 5. ТЕСТЫ ФОРМАТА ЗАПРОСА (422 — Validation Error)
# =============================================================================

class TestRequestValidation:
    """
    Проверяем, что некорректный формат body → 422 (а не 500).
    Для auth-protected эндпоинтов передаём валидный токен.
    """

    @patch("crud.auth_session_crud.update_last_activity")
    @patch("crud.auth_session_crud.get_session_by_token")
    def test_send_empty_body_returns_422(self, mock_get_session, mock_update, app_client):
        """Send с пустым body → 422 (нужен project_id, user_id, message)."""
        mock_get_session.return_value = _create_mock_session(role="user")

        r = app_client.post(
            "/api/messages/send",
            json={},
            headers={"X-Session-Token": "valid-token"},
        )
        assert r.status_code == 422, (
            f"Пустой body должен дать 422, получили {r.status_code}: {r.text[:300]}"
        )

    @patch("crud.auth_session_crud.update_last_activity")
    @patch("crud.auth_session_crud.get_session_by_token")
    def test_send_missing_message_returns_422(self, mock_get_session, mock_update, app_client):
        """Send без message → 422."""
        mock_get_session.return_value = _create_mock_session(role="user")

        r = app_client.post(
            "/api/messages/send",
            json={"project_id": "test", "user_id": 12345},
            headers={"X-Session-Token": "valid-token"},
        )
        assert r.status_code == 422


# =============================================================================
# 6. ТЕСТЫ «МАРШРУТ+AUTH» ПОЛНОЙ ЦЕПОЧКИ
# Комбинированные тесты: проверяем что эндпоинт одновременно:
# - зарегистрирован (не 404)
# - требует auth (401 без токена)
# - возвращает данные (200 с токеном)
# =============================================================================

class TestFullChainDashboard:
    """Полная цепочка для /messages/actions-analysis/dashboard."""

    def test_no_token_is_401(self, app_client):
        r = app_client.post("/api/messages/actions-analysis/dashboard")
        assert r.status_code == 401

    @patch("crud.auth_session_crud.update_last_activity")
    @patch("crud.auth_session_crud.get_session_by_token")
    def test_admin_token_returns_200(self, mock_get_session, mock_update, app_client):
        """С admin-токеном получаем 200 и JSON."""
        mock_get_session.return_value = _create_mock_session(role="admin")

        r = app_client.post(
            "/api/messages/actions-analysis/dashboard",
            headers={"X-Session-Token": "valid-admin-token"},
        )
        assert r.status_code == 200, f"Ожидали 200, получили {r.status_code}: {r.text[:300]}"
        data = r.json()
        assert "summary" in data
        assert "user_stats" in data
        assert "action_type_labels" in data

    @patch("crud.auth_session_crud.update_last_activity")
    @patch("crud.auth_session_crud.get_session_by_token")
    def test_user_token_returns_403(self, mock_get_session, mock_update, app_client):
        """Dashboard требует admin — user получает 403."""
        mock_get_session.return_value = _create_mock_session(role="user")

        r = app_client.post(
            "/api/messages/actions-analysis/dashboard",
            headers={"X-Session-Token": "valid-user-token"},
        )
        assert r.status_code == 403


class TestFullChainSend:
    """Полная цепочка для /api/messages/send."""

    def test_no_token_is_401(self, app_client):
        r = app_client.post("/api/messages/send", json={
            "project_id": "test", "user_id": 12345, "message": "hello"
        })
        assert r.status_code == 401

    @patch("crud.auth_session_crud.update_last_activity")
    @patch("crud.auth_session_crud.get_session_by_token")
    def test_valid_token_not_401(self, mock_get_session, mock_update, app_client):
        """С валидным токеном → не 401 (может быть 500 из-за отсутствия проекта, но не 401)."""
        mock_get_session.return_value = _create_mock_session(role="user")

        r = app_client.post(
            "/api/messages/send",
            json={"project_id": "test", "user_id": 12345, "message": "hello"},
            headers={"X-Session-Token": "valid-token"},
        )
        assert r.status_code != 401
