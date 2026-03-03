"""Тесты для crud.message_stats._users — детализация по пользователям."""

import pytest
from unittest.mock import MagicMock, patch


def _make_user_row(vk_user_id=12345, incoming=10, outgoing=5, first_at=1700000000.0, last_at=1700001000.0):
    """Создаёт мок-строку результата запроса с JOIN (MessageStatsUser + VkProfile)."""
    row = MagicMock()
    # MessageStatsUser поля
    row.MessageStatsUser = MagicMock()
    row.MessageStatsUser.vk_user_id = vk_user_id
    row.MessageStatsUser.incoming_count = incoming
    row.MessageStatsUser.outgoing_count = outgoing
    row.MessageStatsUser.first_message_at = first_at
    row.MessageStatsUser.last_message_at = last_at
    # VkProfile поля
    row.first_name = "Иван"
    row.last_name = "Петров"
    row.photo_url = "https://photo.example.com/1.jpg"
    return row


class TestGetProjectUsers:
    """Тесты списка пользователей проекта."""

    def test_returns_users_list(self, mock_db):
        """Возвращает словарь с total_count и users."""
        from crud.message_stats._users import get_project_users

        user_row = _make_user_row()
        # Настраиваем цепочку для основного запроса
        query_chain = mock_db.query.return_value.outerjoin.return_value.outerjoin.return_value.filter.return_value
        query_chain.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [user_row]
        # Настраиваем total_count
        mock_db.query.return_value.filter.return_value.scalar.return_value = 1

        result = get_project_users(mock_db, "proj-1")
        assert "total_count" in result
        assert "users" in result
        assert result["total_count"] == 1
        assert len(result["users"]) == 1

    def test_user_fields_mapping(self, mock_db):
        """Поля пользователя корректно маппятся в ответ."""
        from crud.message_stats._users import get_project_users

        user_row = _make_user_row(vk_user_id=999, incoming=20, outgoing=10)
        query_chain = mock_db.query.return_value.outerjoin.return_value.outerjoin.return_value.filter.return_value
        query_chain.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [user_row]
        mock_db.query.return_value.filter.return_value.scalar.return_value = 1

        result = get_project_users(mock_db, "proj-1")
        user = result["users"][0]
        assert user["vk_user_id"] == 999
        assert user["incoming_count"] == 20
        assert user["outgoing_count"] == 10
        assert user["total_messages"] == 30
        assert user["first_name"] == "Иван"
        assert user["last_name"] == "Петров"
        assert user["photo_url"] == "https://photo.example.com/1.jpg"

    def test_empty_project_returns_empty_users(self, mock_db):
        """Нет данных — пустой список пользователей, total_count = 0."""
        from crud.message_stats._users import get_project_users

        query_chain = mock_db.query.return_value.outerjoin.return_value.outerjoin.return_value.filter.return_value
        query_chain.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []
        mock_db.query.return_value.filter.return_value.scalar.return_value = 0

        result = get_project_users(mock_db, "proj-nonexistent")
        assert result["total_count"] == 0
        assert result["users"] == []

    def test_null_counts_default_to_zero(self, mock_db):
        """None-значения счётчиков заменяются на 0."""
        from crud.message_stats._users import get_project_users

        user_row = _make_user_row(incoming=None, outgoing=None)
        query_chain = mock_db.query.return_value.outerjoin.return_value.outerjoin.return_value.filter.return_value
        query_chain.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [user_row]
        mock_db.query.return_value.filter.return_value.scalar.return_value = 1

        result = get_project_users(mock_db, "proj-1")
        user = result["users"][0]
        assert user["incoming_count"] == 0
        assert user["outgoing_count"] == 0
        assert user["total_messages"] == 0

    def test_null_profile_fields(self, mock_db):
        """Если VkProfile не найден — поля None."""
        from crud.message_stats._users import get_project_users

        user_row = _make_user_row()
        user_row.first_name = None
        user_row.last_name = None
        user_row.photo_url = None
        query_chain = mock_db.query.return_value.outerjoin.return_value.outerjoin.return_value.filter.return_value
        query_chain.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [user_row]
        mock_db.query.return_value.filter.return_value.scalar.return_value = 1

        result = get_project_users(mock_db, "proj-1")
        user = result["users"][0]
        assert user["first_name"] is None
        assert user["last_name"] is None
        assert user["photo_url"] is None

    def test_pagination_params_passed(self, mock_db):
        """Параметры limit и offset передаются в запрос."""
        from crud.message_stats._users import get_project_users

        query_chain = mock_db.query.return_value.outerjoin.return_value.outerjoin.return_value.filter.return_value
        ordered = query_chain.order_by.return_value
        ordered.offset.return_value.limit.return_value.all.return_value = []
        mock_db.query.return_value.filter.return_value.scalar.return_value = 0

        get_project_users(mock_db, "proj-1", limit=10, offset=20)
        ordered.offset.assert_called_with(20)
        ordered.offset.return_value.limit.assert_called_with(10)
