"""
Тесты для services/messages/user_info_service.py — авто-обновление профиля.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

from services.messages.user_info_service import (
    _needs_profile_refresh,
    get_user_info,
    get_user_info_for_response,
)


class TestNeedsProfileRefresh:
    """Тесты логики TTL 24 часа."""

    def test_force_always_true(self):
        assert _needs_profile_refresh("2030-01-01T00:00:00", force=True) is True

    def test_none_updated_at(self):
        assert _needs_profile_refresh(None) is True

    def test_empty_string(self):
        assert _needs_profile_refresh("") is True

    def test_invalid_format(self):
        assert _needs_profile_refresh("not-a-date") is True

    def test_fresh_within_24h(self):
        """Обновлён 1 час назад — обновление НЕ нужно."""
        fresh = (datetime.utcnow() - timedelta(hours=1)).isoformat()
        assert _needs_profile_refresh(fresh) is False

    def test_stale_over_24h(self):
        """Обновлён 25 часов назад — обновление нужно."""
        stale = (datetime.utcnow() - timedelta(hours=25)).isoformat()
        assert _needs_profile_refresh(stale) is True

    def test_exactly_24h_boundary(self):
        """Ровно 24 часа — пограничный случай (>24ч → True)."""
        boundary = (datetime.utcnow() - timedelta(hours=24, seconds=1)).isoformat()
        assert _needs_profile_refresh(boundary) is True


class TestGetUserInfo:
    """Тесты получения данных пользователя."""

    @patch("services.messages.user_info_service.get_mailing_user_by_vk_id")
    @patch("services.messages.user_info_service.messages_crud")
    def test_user_not_found(self, mock_crud, mock_get_user, mock_db):
        """Пользователь не найден в рассылке → found=False."""
        mock_get_user.return_value = None

        result = get_user_info(mock_db, "proj-1", 12345, ["token"], 123456)
        assert result["success"] is True
        assert result["found"] is False
        assert result["user"] is None

    @patch("services.messages.user_info_service._refresh_profile_from_vk")
    @patch("services.messages.user_info_service.get_mailing_user_by_vk_id")
    @patch("services.messages.user_info_service.messages_crud")
    def test_user_found_fresh_profile(self, mock_crud, mock_get_user, mock_refresh, mock_db):
        """Пользователь найден, профиль свежий — не обновляем из VK."""
        fresh_time = (datetime.utcnow() - timedelta(hours=1)).isoformat()
        mock_get_user.return_value = {"name": "Иван", "updated_at": fresh_time}
        mock_crud.get_last_message_dates.return_value = {
            "last_incoming_date": None,
            "last_outgoing_date": None,
        }

        result = get_user_info(mock_db, "proj-1", 12345, ["token"], 123456)
        assert result["success"] is True
        assert result["found"] is True
        assert result["user"]["name"] == "Иван"
        assert result["user"]["profile_refreshed"] is False
        mock_refresh.assert_not_called()

    @patch("services.messages.user_info_service._refresh_profile_from_vk")
    @patch("services.messages.user_info_service.get_mailing_user_by_vk_id")
    @patch("services.messages.user_info_service.messages_crud")
    def test_user_found_stale_profile_refreshed(self, mock_crud, mock_get_user, mock_refresh, mock_db):
        """Профиль устарел — обновляем из VK API."""
        stale_time = (datetime.utcnow() - timedelta(hours=25)).isoformat()
        user_data = {"name": "Иван", "updated_at": stale_time}
        refreshed_data = {"name": "Иван Обновлённый", "updated_at": datetime.utcnow().isoformat()}

        mock_get_user.side_effect = [user_data, refreshed_data]
        mock_refresh.return_value = True
        mock_crud.get_last_message_dates.return_value = {
            "last_incoming_date": None,
            "last_outgoing_date": None,
        }

        result = get_user_info(mock_db, "proj-1", 12345, ["token"], 123456)
        assert result["user"]["profile_refreshed"] is True
        mock_refresh.assert_called_once()

    @patch("services.messages.user_info_service._refresh_profile_from_vk")
    @patch("services.messages.user_info_service.get_mailing_user_by_vk_id")
    @patch("services.messages.user_info_service.messages_crud")
    def test_force_refresh(self, mock_crud, mock_get_user, mock_refresh, mock_db):
        """Принудительное обновление (force_refresh=True)."""
        fresh_time = (datetime.utcnow() - timedelta(hours=1)).isoformat()
        mock_get_user.side_effect = [
            {"name": "Иван", "updated_at": fresh_time},
            {"name": "Иван Обновлённый", "updated_at": datetime.utcnow().isoformat()},
        ]
        mock_refresh.return_value = True
        mock_crud.get_last_message_dates.return_value = {
            "last_incoming_date": None,
            "last_outgoing_date": None,
        }

        result = get_user_info(mock_db, "proj-1", 12345, ["token"], 123456, force_refresh=True)
        mock_refresh.assert_called_once()

    @patch("services.messages.user_info_service.get_mailing_user_by_vk_id")
    @patch("services.messages.user_info_service.messages_crud")
    def test_enrichment_with_message_dates(self, mock_crud, mock_get_user, mock_db):
        """Добавление дат последних сообщений."""
        fresh_time = (datetime.utcnow() - timedelta(hours=1)).isoformat()
        mock_get_user.return_value = {"name": "Иван", "updated_at": fresh_time}
        mock_crud.get_last_message_dates.return_value = {
            "last_incoming_date": 1700000100,
            "last_outgoing_date": 1700000200,
        }

        result = get_user_info(mock_db, "proj-1", 12345, ["token"], 123456)
        user = result["user"]
        assert user["last_incoming_message_date"] is not None
        assert user["last_outgoing_message_date"] is not None


class TestGetUserInfoForResponse:
    """Тесты хелпера для include_user_info."""

    @patch("services.messages.user_info_service.get_mailing_user_by_vk_id")
    def test_returns_none_if_user_not_found(self, mock_get_user, mock_db, mock_project):
        mock_get_user.return_value = None
        result = get_user_info_for_response(mock_db, "proj-1", 12345, mock_project, ["token"], 123456)
        assert result is None

    @patch("services.messages.user_info_service.get_mailing_user_by_vk_id")
    @patch("services.messages.user_info_service.messages_crud")
    def test_returns_user_data(self, mock_crud, mock_get_user, mock_db, mock_project):
        fresh_time = (datetime.utcnow() - timedelta(hours=1)).isoformat()
        mock_get_user.return_value = {"name": "Мария", "updated_at": fresh_time}
        mock_crud.get_last_message_dates.return_value = {
            "last_incoming_date": None,
            "last_outgoing_date": None,
        }
        result = get_user_info_for_response(mock_db, "proj-1", 12345, mock_project, ["token"], 123456)
        assert result is not None
        assert result["name"] == "Мария"
