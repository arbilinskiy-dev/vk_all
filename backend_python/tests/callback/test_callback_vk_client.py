"""
Тесты для VK API клиента callback_vk_client.

Все вызовы VK API замоканы через _vk_api_call.
"""

import pytest
from unittest.mock import patch, MagicMock

from services.callback_vk_client import (
    get_callback_servers,
    get_confirmation_code,
    add_callback_server,
    edit_callback_server,
    set_callback_settings,
    get_callback_settings,
    find_server_by_title,
)
from services.callback_constants import VK_SETTABLE_EVENTS, DEFAULT_CALLBACK_EVENTS
from services.vk_api.api_client import VkApiError

# Базовый путь для моков
_VK_CALL = "services.callback_vk_client._vk_api_call"


class TestGetCallbackServers:
    """Получение списка Callback-серверов."""

    @patch(_VK_CALL)
    def test_returns_items(self, mock_call):
        """Возвращает items из ответа VK API."""
        mock_call.return_value = {
            "items": [
                {"id": 1, "title": "smmit", "url": "https://example.com", "status": "ok"},
                {"id": 2, "title": "other", "url": "https://other.com", "status": "wait"},
            ]
        }
        result = get_callback_servers(group_id=123, access_token="token")
        assert len(result) == 2
        assert result[0]["title"] == "smmit"
        mock_call.assert_called_once()

    @patch(_VK_CALL)
    def test_empty_response_returns_empty_list(self, mock_call):
        """Пустой ответ → пустой список."""
        mock_call.return_value = {"items": []}
        result = get_callback_servers(group_id=123, access_token="token")
        assert result == []

    @patch(_VK_CALL)
    def test_non_dict_response_returns_empty_list(self, mock_call):
        """Если VK API вернул не dict — пустой список."""
        mock_call.return_value = 1
        result = get_callback_servers(group_id=123, access_token="token")
        assert result == []


class TestGetConfirmationCode:
    """Получение кода подтверждения."""

    @patch(_VK_CALL)
    def test_returns_code_string(self, mock_call):
        """Возвращает строку code из словаря."""
        mock_call.return_value = {"code": "abc123"}
        code = get_confirmation_code(group_id=123, access_token="token")
        assert code == "abc123"
        assert isinstance(code, str)

    @patch(_VK_CALL)
    def test_missing_code_returns_empty_string(self, mock_call):
        """Если в ответе нет code → пустая строка."""
        mock_call.return_value = {}
        code = get_confirmation_code(group_id=123, access_token="token")
        assert code == ""


class TestAddCallbackServer:
    """Добавление нового Callback-сервера."""

    @patch(_VK_CALL)
    def test_returns_int_server_id(self, mock_call):
        """Возвращает целочисленный server_id."""
        mock_call.return_value = {"server_id": 42}
        sid = add_callback_server(
            group_id=123, url="https://example.com/cb",
            title="smmit", access_token="token",
        )
        assert sid == 42
        assert isinstance(sid, int)

    @patch(_VK_CALL)
    def test_passes_secret_key_when_provided(self, mock_call):
        """Передаёт secret_key в параметрах VK API, если указан."""
        mock_call.return_value = {"server_id": 7}
        add_callback_server(
            group_id=1, url="https://u", title="t",
            access_token="tok", secret_key="s3cr3t",
        )
        call_args = mock_call.call_args
        assert call_args[0][1]["secret_key"] == "s3cr3t"


class TestEditCallbackServer:
    """Редактирование существующего Callback-сервера."""

    @patch(_VK_CALL)
    def test_returns_true(self, mock_call):
        """При успехе возвращает True."""
        mock_call.return_value = 1
        result = edit_callback_server(
            group_id=123, server_id=1,
            url="https://new.url", title="smmit",
            access_token="token",
        )
        assert result is True

    @patch(_VK_CALL)
    def test_passes_secret_key_when_provided(self, mock_call):
        """Передаёт secret_key в параметрах."""
        mock_call.return_value = 1
        edit_callback_server(
            group_id=1, server_id=1, url="u", title="t",
            access_token="tok", secret_key="sec",
        )
        assert mock_call.call_args[0][1]["secret_key"] == "sec"


class TestSetCallbackSettings:
    """Настройка событий Callback-сервера."""

    @patch(_VK_CALL)
    def test_filters_non_settable_events(self, mock_call):
        """Ненастраиваемые события (не из VK_SETTABLE_EVENTS) пропускаются."""
        mock_call.return_value = 1
        # Передаём одно валидное и одно невалидное событие
        events = {"message_new": 1, "fake_event_xyz": 1}
        set_callback_settings(
            group_id=123, server_id=1,
            access_token="token", events=events,
        )
        params = mock_call.call_args[0][1]
        assert "message_new" in params
        assert "fake_event_xyz" not in params

    @patch(_VK_CALL)
    def test_uses_default_events_when_none(self, mock_call):
        """Без events используется DEFAULT_CALLBACK_EVENTS (все включены)."""
        mock_call.return_value = 1
        set_callback_settings(
            group_id=123, server_id=1,
            access_token="token", events=None,
        )
        params = mock_call.call_args[0][1]
        # Все настраиваемые события должны быть в params
        for event in VK_SETTABLE_EVENTS:
            assert event in params, f"Событие {event} отсутствует в params"
            assert params[event] == 1

    @patch(_VK_CALL)
    def test_returns_true(self, mock_call):
        """Возвращает True при успехе."""
        mock_call.return_value = 1
        result = set_callback_settings(
            group_id=123, server_id=1, access_token="token",
        )
        assert result is True


class TestGetCallbackSettings:
    """Получение текущих настроек событий."""

    @patch(_VK_CALL)
    def test_returns_dict_with_events(self, mock_call):
        """Возвращает словарь с ключом events."""
        expected = {
            "events": {"message_new": 1, "wall_post_new": 0},
            "api_version": "5.199",
        }
        mock_call.return_value = expected
        result = get_callback_settings(group_id=123, server_id=1, access_token="token")
        assert result == expected
        assert "events" in result

    @patch(_VK_CALL)
    def test_vk_api_error_returns_empty_dict(self, mock_call):
        """VkApiError → пустой словарь (graceful degradation)."""
        mock_call.side_effect = VkApiError("Server not found", code=100)
        result = get_callback_settings(group_id=123, server_id=1, access_token="token")
        assert result == {}

    @patch(_VK_CALL)
    def test_non_dict_response_returns_empty_dict(self, mock_call):
        """Если VK вернул не словарь → пустой словарь."""
        mock_call.return_value = "unexpected"
        result = get_callback_settings(group_id=123, server_id=1, access_token="token")
        assert result == {}


class TestFindServerByTitle:
    """Поиск сервера по названию."""

    def test_finds_existing_server(self):
        """Находит сервер с совпадающим title."""
        servers = [
            {"id": 1, "title": "smmit", "url": "https://a.com"},
            {"id": 2, "title": "other", "url": "https://b.com"},
        ]
        result = find_server_by_title(servers, "smmit")
        assert result is not None
        assert result["id"] == 1

    def test_returns_none_when_not_found(self):
        """Если сервер не найден → None."""
        servers = [
            {"id": 1, "title": "other", "url": "https://a.com"},
        ]
        result = find_server_by_title(servers, "smmit")
        assert result is None

    def test_empty_list_returns_none(self):
        """Пустой список → None."""
        result = find_server_by_title([], "smmit")
        assert result is None
