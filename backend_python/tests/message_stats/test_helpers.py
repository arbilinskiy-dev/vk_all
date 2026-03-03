"""Тесты для crud.message_stats._helpers — вспомогательные функции."""

import pytest
from unittest.mock import MagicMock, patch
import json


class TestHourlyDateFilter:
    """Тесты фильтрации по дате для hourly-запросов."""

    def test_no_dates_returns_query_unchanged(self):
        """Без дат запрос возвращается без изменений."""
        from crud.message_stats._helpers import _hourly_date_filter

        query = MagicMock()
        result = _hourly_date_filter(query, None, None)
        # Если даты не переданы — filter не вызывается
        query.filter.assert_not_called()
        assert result is query

    def test_date_from_only(self):
        """Передан только date_from — один вызов filter."""
        from crud.message_stats._helpers import _hourly_date_filter

        query = MagicMock()
        result = _hourly_date_filter(query, "2026-01-01", None)
        # filter вызван ровно один раз (для date_from)
        query.filter.assert_called_once()
        # Результат — возврат цепочки от filter
        assert result is query.filter.return_value

    def test_date_to_only(self):
        """Передан только date_to — один вызов filter."""
        from crud.message_stats._helpers import _hourly_date_filter

        query = MagicMock()
        result = _hourly_date_filter(query, None, "2026-12-31")
        query.filter.assert_called_once()
        assert result is query.filter.return_value

    def test_both_dates(self):
        """Переданы обе даты — два последовательных вызова filter."""
        from crud.message_stats._helpers import _hourly_date_filter

        query = MagicMock()
        # Настраиваем цепочку: query.filter(...) → q1, q1.filter(...) → q2
        q1 = MagicMock()
        query.filter.return_value = q1
        q2 = MagicMock()
        q1.filter.return_value = q2

        result = _hourly_date_filter(query, "2026-01-01", "2026-12-31")
        query.filter.assert_called_once()
        q1.filter.assert_called_once()
        assert result is q2

    def test_empty_string_dates_treated_as_no_filter(self):
        """Пустые строки как даты — фильтры не применяются."""
        from crud.message_stats._helpers import _hourly_date_filter

        query = MagicMock()
        result = _hourly_date_filter(query, "", "")
        query.filter.assert_not_called()
        assert result is query


class TestCollectUniqueUsersFromJson:
    """Тесты сбора уникальных пользователей из JSON-полей."""

    def test_basic_collection(self, mock_db):
        """Корректно собирает уникальных пользователей из нескольких строк."""
        from crud.message_stats._helpers import _collect_unique_users_from_json
        from models_library.message_stats import MessageStatsHourly

        # Мокаем цепочку query → all
        mock_db.query.return_value.all.return_value = [
            (json.dumps([100, 200]),),
            (json.dumps([200, 300]),),
        ]

        result = _collect_unique_users_from_json(
            mock_db, MessageStatsHourly.unique_users_json
        )
        assert result == {100, 200, 300}

    def test_empty_rows(self, mock_db):
        """Нет данных — возвращается пустое множество."""
        from crud.message_stats._helpers import _collect_unique_users_from_json
        from models_library.message_stats import MessageStatsHourly

        mock_db.query.return_value.all.return_value = []

        result = _collect_unique_users_from_json(
            mock_db, MessageStatsHourly.unique_users_json
        )
        assert result == set()

    def test_null_json_skipped(self, mock_db):
        """Null-значения в JSON-поле пропускаются."""
        from crud.message_stats._helpers import _collect_unique_users_from_json
        from models_library.message_stats import MessageStatsHourly

        mock_db.query.return_value.all.return_value = [
            (None,),
            (json.dumps([10, 20]),),
            (None,),
        ]

        result = _collect_unique_users_from_json(
            mock_db, MessageStatsHourly.unique_users_json
        )
        assert result == {10, 20}

    def test_invalid_json_skipped(self, mock_db):
        """Невалидный JSON пропускается без ошибки."""
        from crud.message_stats._helpers import _collect_unique_users_from_json
        from models_library.message_stats import MessageStatsHourly

        mock_db.query.return_value.all.return_value = [
            ("not-a-json",),
            (json.dumps([42]),),
        ]

        result = _collect_unique_users_from_json(
            mock_db, MessageStatsHourly.unique_users_json
        )
        assert result == {42}

    def test_with_project_id_filter(self, mock_db):
        """При передаче project_id применяется дополнительный filter."""
        from crud.message_stats._helpers import _collect_unique_users_from_json
        from models_library.message_stats import MessageStatsHourly

        # Настраиваем цепочку: query → filter → all
        mock_db.query.return_value.filter.return_value.all.return_value = [
            (json.dumps([1, 2]),),
        ]

        result = _collect_unique_users_from_json(
            mock_db, MessageStatsHourly.unique_users_json, project_id="proj-1"
        )
        # filter вызван (для project_id)
        mock_db.query.return_value.filter.assert_called()
        assert result == {1, 2}

    def test_with_date_filters(self, mock_db):
        """При передаче дат применяются фильтры по дате."""
        from crud.message_stats._helpers import _collect_unique_users_from_json
        from models_library.message_stats import MessageStatsHourly

        # Цепочка: query → filter (date_from) → filter (date_to) → all
        q1 = MagicMock()
        q2 = MagicMock()
        mock_db.query.return_value = q1
        q1.filter.return_value = q2
        q2.filter.return_value.all.return_value = [
            (json.dumps([5, 6]),),
        ]

        result = _collect_unique_users_from_json(
            mock_db, MessageStatsHourly.unique_users_json,
            date_from="2026-01-01", date_to="2026-12-31"
        )
        assert result == {5, 6}
