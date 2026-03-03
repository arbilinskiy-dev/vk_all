"""
Тесты для главного сервиса auto_setup_callback.

Все зависимости (VK API, ngrok, константы) замоканы.
"""

import pytest
from unittest.mock import patch, MagicMock

from services.callback_service import auto_setup_callback
from services.callback_constants import (
    VM_CALLBACK_URL,
    VM_TUNNEL_CALLBACK_URL,
    SERVER_NAME_PROD,
    SERVER_NAME_LOCAL,
)
from services.vk_api.api_client import VkApiError


# Базовые пути для моков
_MOD = "services.callback_service"


def _mock_defaults():
    """Возвращает словарь с патчами по умолчанию для всех зависимостей."""
    return {
        "confirmation_code": "test_code_123",
        "servers": [],
        "add_server_id": 99,
    }


class TestAutoSetupCallbackProd:
    """Продакшен-режим (is_local=False)."""

    @patch(f"{_MOD}.set_callback_settings")
    @patch(f"{_MOD}.add_callback_server", return_value=42)
    @patch(f"{_MOD}.get_callback_servers", return_value=[])
    @patch(f"{_MOD}.get_confirmation_code", return_value="code_abc")
    def test_creates_new_server(self, mock_code, mock_servers, mock_add, mock_settings):
        """Создаёт новый сервер, если нет существующего → action=created."""
        result = auto_setup_callback(group_id=100, community_token="tok")

        assert result["success"] is True
        assert result["action"] == "created"
        assert result["server_id"] == 42
        assert result["callback_url"] == VM_CALLBACK_URL
        assert result["server_name"] == SERVER_NAME_PROD
        assert result["confirmation_code"] == "code_abc"
        # Проверяем, что addCallbackServer был вызван
        mock_add.assert_called_once()

    @patch(f"{_MOD}.set_callback_settings")
    @patch(f"{_MOD}.edit_callback_server", return_value=True)
    @patch(f"{_MOD}.find_server_by_title", return_value={
        "id": 10, "title": "smmit", "url": "https://old.url", "status": "wait",
    })
    @patch(f"{_MOD}.get_callback_servers", return_value=[
        {"id": 10, "title": "smmit", "url": "https://old.url", "status": "wait"},
    ])
    @patch(f"{_MOD}.get_confirmation_code", return_value="code_xyz")
    def test_updates_existing_server(
        self, mock_code, mock_servers, mock_find, mock_edit, mock_settings
    ):
        """Обновляет существующий сервер (url изменился) → action=updated."""
        result = auto_setup_callback(group_id=100, community_token="tok")

        assert result["success"] is True
        assert result["action"] == "updated"
        assert result["server_id"] == 10
        mock_edit.assert_called_once()


class TestAutoSetupCallbackEventsUpdated:
    """Сервер уже настроен — url совпадает, статус ok."""

    @patch(f"{_MOD}.set_callback_settings")
    @patch(f"{_MOD}.find_server_by_title", return_value={
        "id": 5, "title": "smmit", "url": VM_CALLBACK_URL, "status": "ok",
    })
    @patch(f"{_MOD}.get_callback_servers", return_value=[
        {"id": 5, "title": "smmit", "url": VM_CALLBACK_URL, "status": "ok"},
    ])
    @patch(f"{_MOD}.get_confirmation_code", return_value="code_ok")
    def test_events_updated_only(self, mock_code, mock_servers, mock_find, mock_settings):
        """URL совпадает + status=ok → action=events_updated, сервер не перезаписывается."""
        result = auto_setup_callback(group_id=100, community_token="tok")

        assert result["success"] is True
        assert result["action"] == "events_updated"
        assert result["server_id"] == 5
        # set_callback_settings всё равно вызывается (подписка обновляется)
        mock_settings.assert_called_once()


class TestAutoSetupCallbackLocal:
    """Локальный режим (is_local=True)."""

    @patch(f"{_MOD}.set_callback_settings")
    @patch(f"{_MOD}.add_callback_server", return_value=77)
    @patch(f"{_MOD}.get_callback_servers", return_value=[])
    @patch(f"{_MOD}.get_confirmation_code", return_value="local_code")
    @patch(f"{_MOD}.detect_ngrok_url", return_value=None)
    def test_no_ngrok_returns_error(
        self, mock_ngrok, mock_code, mock_servers, mock_add, mock_settings
    ):
        """Ngrok не запущен → success=False с сообщением об ошибке."""
        result = auto_setup_callback(group_id=100, community_token="tok", is_local=True)

        assert result["success"] is False
        assert "ngrok" in result["message"].lower()
        # addCallbackServer НЕ вызывается
        mock_add.assert_not_called()


class TestAutoSetupCallbackTunnel:
    """Режим SSH tunnel (use_tunnel=True)."""

    @patch(f"{_MOD}.set_callback_settings")
    @patch(f"{_MOD}.add_callback_server", return_value=55)
    @patch(f"{_MOD}.get_callback_servers", return_value=[])
    @patch(f"{_MOD}.get_confirmation_code", return_value="tunnel_code")
    def test_tunnel_uses_vm_tunnel_url(self, mock_code, mock_servers, mock_add, mock_settings):
        """Tunnel режим → использует VM_TUNNEL_CALLBACK_URL."""
        result = auto_setup_callback(
            group_id=100, community_token="tok", use_tunnel=True,
        )

        assert result["success"] is True
        assert result["callback_url"] == VM_TUNNEL_CALLBACK_URL
        assert result["server_name"] == SERVER_NAME_LOCAL


class TestAutoSetupCallbackErrors:
    """Обработка ошибок."""

    @patch(f"{_MOD}.get_confirmation_code")
    def test_vk_api_error_returns_failure(self, mock_code):
        """VkApiError → success=False, error_code заполнен."""
        mock_code.side_effect = VkApiError("Access denied", code=15)

        result = auto_setup_callback(group_id=100, community_token="tok")

        assert result["success"] is False
        assert result["error_code"] == 15
        assert "VK API" in result["message"]

    @patch(f"{_MOD}.get_confirmation_code", return_value="")
    def test_empty_confirmation_code_returns_failure(self, mock_code):
        """Пустой код подтверждения → success=False."""
        result = auto_setup_callback(group_id=100, community_token="tok")

        assert result["success"] is False
        assert "код подтверждения" in result["message"].lower()
