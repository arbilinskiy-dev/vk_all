"""Тесты для crud.message_stats._summary — сводки статистики."""

import pytest
from unittest.mock import MagicMock, patch, PropertyMock
import json


# ============================================================================
# Вспомогательные фабрики для мок-результатов
# ============================================================================

def _make_hourly_agg_row(**kwargs):
    """Создаёт мок-результат агрегирующего запроса hourly."""
    defaults = {
        "total_projects": 2,
        "total_incoming": 100,
        "total_outgoing": 50,
        "incoming_payload": 30,
        "incoming_text": 70,
        "outgoing_system": 20,
        "outgoing_bot": 30,
    }
    defaults.update(kwargs)
    row = MagicMock()
    for k, v in defaults.items():
        setattr(row, k, v)
    return row


def _make_project_agg_row(**kwargs):
    """Создаёт мок-результат агрегата по проекту."""
    defaults = {
        "total_incoming": 40,
        "total_outgoing": 20,
        "incoming_payload": 10,
        "incoming_text": 30,
        "outgoing_system": 8,
        "outgoing_bot": 12,
    }
    defaults.update(kwargs)
    row = MagicMock()
    for k, v in defaults.items():
        setattr(row, k, v)
    return row


class TestGetGlobalSummary:
    """Тесты глобальной сводки (без фильтра по датам)."""

    @patch("crud.message_stats._summary._collect_unique_users_from_json")
    @patch("crud.message_stats._summary._hourly_date_filter")
    def test_returns_expected_keys(self, mock_filter, mock_collect, mock_db):
        """Результат содержит все ожидаемые ключи."""
        from crud.message_stats._summary import get_global_summary

        # Настраиваем _hourly_date_filter чтобы возвращал query как есть
        mock_filter.side_effect = lambda q, *a: q
        # Настраиваем мок-результат first()
        agg_row = _make_hourly_agg_row()
        mock_db.query.return_value.first.return_value = agg_row
        # Без дат — пойдёт ветка без JSON-юзеров
        mock_db.query.return_value.scalar.return_value = 10

        result = get_global_summary(mock_db)
        expected_keys = {
            "total_projects", "total_incoming", "total_outgoing", "total_messages",
            "incoming_payload", "incoming_text", "outgoing_system", "outgoing_bot",
            "unique_users", "unique_text_users", "unique_payload_users",
            "unique_dialogs", "incoming_dialogs", "dialogs_with_text",
            "dialogs_with_payload", "outgoing_recipients",
            "incoming_users", "outgoing_users",
        }
        assert expected_keys.issubset(set(result.keys()))

    @patch("crud.message_stats._summary._collect_unique_users_from_json")
    @patch("crud.message_stats._summary._hourly_date_filter")
    def test_total_messages_sum(self, mock_filter, mock_collect, mock_db):
        """total_messages = total_incoming + total_outgoing."""
        from crud.message_stats._summary import get_global_summary

        mock_filter.side_effect = lambda q, *a: q
        agg_row = _make_hourly_agg_row(total_incoming=120, total_outgoing=80)
        mock_db.query.return_value.first.return_value = agg_row
        mock_db.query.return_value.scalar.return_value = 0

        result = get_global_summary(mock_db)
        assert result["total_messages"] == 200

    @patch("crud.message_stats._summary._collect_unique_users_from_json")
    @patch("crud.message_stats._summary._hourly_date_filter")
    def test_with_date_range_uses_json_users(self, mock_filter, mock_collect, mock_db):
        """При передаче дат — уникальные юзеры считаются из JSON-множеств."""
        from crud.message_stats._summary import get_global_summary

        mock_filter.side_effect = lambda q, *a: q
        agg_row = _make_hourly_agg_row()
        mock_db.query.return_value.first.return_value = agg_row
        # Мокаем _collect_unique_users_from_json — 4 вызова
        mock_collect.side_effect = [
            {1, 2, 3},      # all_users
            {1, 2},          # text_users
            {3},             # payload_users
            {10, 20},        # outgoing_users
        ]
        # Мокаем dialogs_q.all() — пустой (чтобы не падало)
        mock_db.query.return_value.all.return_value = []

        result = get_global_summary(mock_db, date_from="2026-01-01", date_to="2026-01-31")
        assert result["unique_users"] == 3
        assert result["outgoing_recipients"] == 2

    @patch("crud.message_stats._summary._collect_unique_users_from_json")
    @patch("crud.message_stats._summary._hourly_date_filter")
    def test_null_aggregates_default_to_zero(self, mock_filter, mock_collect, mock_db):
        """None-значения из БД заменяются на 0."""
        from crud.message_stats._summary import get_global_summary

        mock_filter.side_effect = lambda q, *a: q
        agg_row = _make_hourly_agg_row(
            total_projects=None, total_incoming=None, total_outgoing=None,
            incoming_payload=None, incoming_text=None,
            outgoing_system=None, outgoing_bot=None,
        )
        mock_db.query.return_value.first.return_value = agg_row
        mock_db.query.return_value.scalar.return_value = 0

        result = get_global_summary(mock_db)
        assert result["total_projects"] == 0
        assert result["total_incoming"] == 0
        assert result["total_outgoing"] == 0
        assert result["total_messages"] == 0


class TestGetProjectSummary:
    """Тесты сводки по конкретному проекту."""

    def test_returns_expected_keys(self, mock_db):
        """Результат содержит все ожидаемые ключи."""
        from crud.message_stats._summary import get_project_summary

        row = _make_project_agg_row()
        mock_db.query.return_value.filter.return_value.first.return_value = row
        mock_db.query.return_value.filter.return_value.scalar.return_value = 5

        result = get_project_summary(mock_db, "proj-1")
        expected_keys = {
            "project_id", "total_incoming", "total_outgoing", "total_messages",
            "incoming_payload", "incoming_text", "outgoing_system", "outgoing_bot",
            "unique_users",
        }
        assert set(result.keys()) == expected_keys

    def test_project_id_in_result(self, mock_db):
        """project_id передаётся в ответ."""
        from crud.message_stats._summary import get_project_summary

        row = _make_project_agg_row()
        mock_db.query.return_value.filter.return_value.first.return_value = row
        mock_db.query.return_value.filter.return_value.scalar.return_value = 0

        result = get_project_summary(mock_db, "my-project")
        assert result["project_id"] == "my-project"

    def test_total_messages_calculation(self, mock_db):
        """total_messages = incoming + outgoing."""
        from crud.message_stats._summary import get_project_summary

        row = _make_project_agg_row(total_incoming=15, total_outgoing=25)
        mock_db.query.return_value.filter.return_value.first.return_value = row
        mock_db.query.return_value.filter.return_value.scalar.return_value = 0

        result = get_project_summary(mock_db, "proj-1")
        assert result["total_messages"] == 40

    def test_null_values_default_to_zero(self, mock_db):
        """None-значения из БД заменяются на 0."""
        from crud.message_stats._summary import get_project_summary

        row = _make_project_agg_row(
            total_incoming=None, total_outgoing=None,
            incoming_payload=None, incoming_text=None,
            outgoing_system=None, outgoing_bot=None,
        )
        mock_db.query.return_value.filter.return_value.first.return_value = row
        mock_db.query.return_value.filter.return_value.scalar.return_value = 0

        result = get_project_summary(mock_db, "proj-1")
        assert result["total_incoming"] == 0
        assert result["total_messages"] == 0


class TestGetProjectsSummary:
    """Тесты сводки по всем проектам."""

    @patch("crud.message_stats._summary._hourly_date_filter")
    def test_empty_data_returns_empty_list(self, mock_filter, mock_db):
        """Нет данных — пустой список."""
        from crud.message_stats._summary import get_projects_summary

        mock_filter.side_effect = lambda q, *a: q
        mock_db.query.return_value.group_by.return_value.all.return_value = []
        # Для ветки users_agg без дат
        mock_db.query.return_value.filter.return_value.group_by.return_value.all.return_value = []

        result = get_projects_summary(mock_db)
        assert result == []

    @patch("crud.message_stats._summary._hourly_date_filter")
    def test_returns_list_of_dicts(self, mock_filter, mock_db):
        """Возвращает список словарей с ожидаемыми ключами."""
        from crud.message_stats._summary import get_projects_summary

        mock_filter.side_effect = lambda q, *a: q

        # Мокаем hourly_agg — одна строка
        agg_row = MagicMock()
        agg_row.project_id = "proj-1"
        agg_row.total_incoming = 10
        agg_row.total_outgoing = 5
        agg_row.incoming_payload = 3
        agg_row.incoming_text = 7
        agg_row.outgoing_system = 2
        agg_row.outgoing_bot = 3
        mock_db.query.return_value.group_by.return_value.all.return_value = [agg_row]

        # Мокаем users_agg (без дат)
        users_row = MagicMock()
        users_row.project_id = "proj-1"
        users_row.unique_users = 8

        # Определяем разное поведение query в зависимости от контекста
        # Для простоты — users_map будет пустой (дефолтные значения)
        result = get_projects_summary(mock_db)
        assert isinstance(result, list)
        assert len(result) >= 1
        assert "project_id" in result[0]
