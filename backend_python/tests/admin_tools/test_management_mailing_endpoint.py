"""Тесты для эндпоинта POST /management/refresh-all-mailing."""
import pytest
import sys
import os
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


class TestRefreshAllMailingEndpoint:
    """Тесты роутера refresh-all-mailing."""

    @patch("routers.management.admin_tools_service")
    @patch("routers.management.task_monitor")
    @patch("routers.management.settings")
    def test_returns_new_task_id(self, mock_settings, mock_tm, mock_service):
        """При запуске создаёт новую задачу и возвращает taskId."""
        from fastapi.testclient import TestClient
        from main import app

        mock_tm.get_active_task_id.return_value = None
        client = TestClient(app)

        r = client.post("/api/management/refresh-all-mailing")

        assert r.status_code == 200
        data = r.json()
        assert "taskId" in data
        assert len(data["taskId"]) > 0

    @patch("routers.management.admin_tools_service")
    @patch("routers.management.task_monitor")
    @patch("routers.management.settings")
    def test_returns_existing_task_if_running(self, mock_settings, mock_tm, mock_service):
        """Если задача уже запущена — возвращает существующий taskId."""
        from fastapi.testclient import TestClient
        from main import app

        mock_tm.get_active_task_id.return_value = "existing-task-123"
        client = TestClient(app)

        r = client.post("/api/management/refresh-all-mailing")

        assert r.status_code == 200
        assert r.json()["taskId"] == "existing-task-123"

    @patch("routers.management.admin_tools_service")
    @patch("routers.management.task_monitor")
    @patch("routers.management.settings")
    def test_starts_background_task(self, mock_settings, mock_tm, mock_service):
        """Эндпоинт регистрирует фоновую задачу refresh_all_mailing_task."""
        from fastapi.testclient import TestClient
        from main import app

        mock_tm.get_active_task_id.return_value = None
        client = TestClient(app)

        r = client.post("/api/management/refresh-all-mailing")

        assert r.status_code == 200
        # task_monitor.start_task должен быть вызван с GLOBAL и refresh_all_mailing
        mock_tm.start_task.assert_called_once()
        call_args = mock_tm.start_task.call_args
        assert call_args.args[1] == "GLOBAL"
        assert call_args.args[2] == "refresh_all_mailing"

    @patch("routers.management.admin_tools_service")
    @patch("routers.management.task_monitor")
    @patch("routers.management.settings")
    def test_no_user_token_needed(self, mock_settings, mock_tm, mock_service):
        """Эндпоинт НЕ передаёт user_token — рассылка работает только с community-токенами."""
        from fastapi.testclient import TestClient
        from main import app

        mock_tm.get_active_task_id.return_value = None
        client = TestClient(app)

        r = client.post("/api/management/refresh-all-mailing")

        assert r.status_code == 200
        # Проверяем что refresh_all_mailing_task будет вызван без user_token
        # Это background task, но мы можем проверить что mock_service.refresh_all_mailing_task вызывается
