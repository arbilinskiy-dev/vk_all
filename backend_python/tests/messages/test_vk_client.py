"""
Тесты для services/messages/vk_client.py — утилиты проекта/токенов + VK API.
"""

import json
import pytest
from unittest.mock import MagicMock, patch

from fastapi import HTTPException

from services.messages.vk_client import (
    get_community_tokens,
    get_project_and_tokens,
    fetch_from_vk,
)


class TestGetCommunityTokens:
    """Тесты извлечения токенов из проекта."""

    def test_single_token(self, mock_project):
        mock_project.additional_community_tokens = None
        tokens = get_community_tokens(mock_project)
        assert tokens == ["token_main"]

    def test_main_plus_additional(self, mock_project):
        tokens = get_community_tokens(mock_project)
        assert tokens == ["token_main", "token_extra_1", "token_extra_2"]

    def test_no_tokens(self, mock_project_no_tokens):
        tokens = get_community_tokens(mock_project_no_tokens)
        assert tokens == []

    def test_empty_additional_json(self, mock_project):
        mock_project.additional_community_tokens = "[]"
        tokens = get_community_tokens(mock_project)
        assert tokens == ["token_main"]

    def test_malformed_additional_json(self, mock_project):
        """Некорректный JSON в additional_community_tokens — не падает."""
        mock_project.additional_community_tokens = "not a json"
        tokens = get_community_tokens(mock_project)
        assert tokens == ["token_main"]

    def test_additional_with_empty_strings(self, mock_project):
        """Пустые строки фильтруются."""
        mock_project.additional_community_tokens = '["token1", "", null, "token2"]'
        tokens = get_community_tokens(mock_project)
        assert tokens == ["token_main", "token1", "token2"]

    def test_none_project(self):
        tokens = get_community_tokens(None)
        assert tokens == []


class TestGetProjectAndTokens:
    """Тесты получения проекта + токенов + group_id."""

    def test_project_not_found(self, mock_db):
        """Проект не найден → 404."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        with pytest.raises(HTTPException) as exc:
            get_project_and_tokens(mock_db, "nonexistent")
        assert exc.value.status_code == 404

    def test_no_community_token(self, mock_db, mock_project_no_tokens):
        """Проект без токена → 400."""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_project_no_tokens
        with pytest.raises(HTTPException) as exc:
            get_project_and_tokens(mock_db, "test")
        assert exc.value.status_code == 400
        assert "токена" in exc.value.detail.lower()

    def test_no_group_id(self, mock_db, mock_project):
        """Проект без VK Group ID → 400."""
        mock_project.vkProjectId = None
        mock_db.query.return_value.filter.return_value.first.return_value = mock_project
        with pytest.raises(HTTPException) as exc:
            get_project_and_tokens(mock_db, "test")
        assert exc.value.status_code == 400

    def test_invalid_group_id(self, mock_db, mock_project):
        """Некорректный VK Group ID → 400."""
        mock_project.vkProjectId = "not_a_number"
        mock_db.query.return_value.filter.return_value.first.return_value = mock_project
        with pytest.raises(HTTPException) as exc:
            get_project_and_tokens(mock_db, "test")
        assert exc.value.status_code == 400

    def test_success(self, mock_db, mock_project):
        """Успешный случай — возвращает тройку (project, tokens, group_id_int)."""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_project
        project, tokens, group_id_int = get_project_and_tokens(mock_db, "test")
        assert project == mock_project
        assert "token_main" in tokens
        assert group_id_int == 123456

    def test_negative_group_id_becomes_positive(self, mock_db, mock_project):
        """Отрицательный group_id → abs()."""
        mock_project.vkProjectId = "-98765"
        mock_db.query.return_value.filter.return_value.first.return_value = mock_project
        _, _, group_id_int = get_project_and_tokens(mock_db, "test")
        assert group_id_int == 98765


class TestFetchFromVk:
    """Тесты прямого запроса к VK API."""

    @patch("services.messages.vk_client.call_vk_api_for_group")
    def test_fetch_calls_api_with_correct_params(self, mock_call):
        mock_call.return_value = {"items": [], "count": 0}
        result = fetch_from_vk(["token1"], 12345, 99, 50, 0, "proj-1")

        mock_call.assert_called_once_with(
            method="messages.getHistory",
            params={"user_id": 99, "count": 50, "offset": 0, "rev": 0},
            group_id=12345,
            community_tokens=["token1"],
            project_id="proj-1",
        )
        assert result == {"items": [], "count": 0}
