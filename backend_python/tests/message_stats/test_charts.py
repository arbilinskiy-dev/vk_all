"""Тесты для crud.message_stats._charts — данные для графиков."""

import pytest
from unittest.mock import MagicMock, patch
import json


def _make_hourly_row(
    hour_slot="2026-02-24T14",
    project_id="proj-1",
    incoming_count=10,
    outgoing_count=5,
    incoming_payload_count=3,
    incoming_text_count=7,
    outgoing_system_count=2,
    outgoing_bot_count=3,
    unique_users_count=4,
    unique_users_json="[100,200,300,400]",
    unique_text_users_json="[100,200]",
    unique_payload_users_json="[300]",
    outgoing_users_json="[500,600]",
):
    """Создаёт мок-строку MessageStatsHourly."""
    row = MagicMock()
    row.hour_slot = hour_slot
    row.project_id = project_id
    row.incoming_count = incoming_count
    row.outgoing_count = outgoing_count
    row.incoming_payload_count = incoming_payload_count
    row.incoming_text_count = incoming_text_count
    row.outgoing_system_count = outgoing_system_count
    row.outgoing_bot_count = outgoing_bot_count
    row.unique_users_count = unique_users_count
    row.unique_users_json = unique_users_json
    row.unique_text_users_json = unique_text_users_json
    row.unique_payload_users_json = unique_payload_users_json
    row.outgoing_users_json = outgoing_users_json
    return row


class TestGetHourlyChart:
    """Тесты графика пиковых нагрузок."""

    @patch("crud.message_stats._charts._hourly_date_filter")
    def test_with_project_returns_data(self, mock_filter, mock_db):
        """С project_id — возвращает список данных по часам."""
        from crud.message_stats._charts import get_hourly_chart

        mock_filter.side_effect = lambda q, *a: q
        row = _make_hourly_row()
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [row]

        result = get_hourly_chart(mock_db, project_id="proj-1")
        assert len(result) == 1
        assert result[0]["hour_slot"] == "2026-02-24T14"
        assert result[0]["incoming"] == 10
        assert result[0]["outgoing"] == 5
        assert result[0]["total"] == 15

    @patch("crud.message_stats._charts._hourly_date_filter")
    def test_with_project_detail_fields(self, mock_filter, mock_db):
        """Детализация входящих/исходящих + уникальные юзеры."""
        from crud.message_stats._charts import get_hourly_chart

        mock_filter.side_effect = lambda q, *a: q
        row = _make_hourly_row()
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [row]

        result = get_hourly_chart(mock_db, project_id="proj-1")
        item = result[0]
        assert item["incoming_payload"] == 3
        assert item["incoming_text"] == 7
        assert item["outgoing_system"] == 2
        assert item["outgoing_bot"] == 3
        assert item["unique_users"] == 4
        # text_users=[100,200], payload=[300] → incoming_dialogs = 3
        assert item["incoming_dialogs"] == 3
        assert item["unique_text_users"] == 2
        assert item["unique_payload_users"] == 1
        assert item["outgoing_recipients"] == 2

    @patch("crud.message_stats._charts._hourly_date_filter")
    def test_empty_data_with_project(self, mock_filter, mock_db):
        """Нет данных по проекту — пустой список."""
        from crud.message_stats._charts import get_hourly_chart

        mock_filter.side_effect = lambda q, *a: q
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = []

        result = get_hourly_chart(mock_db, project_id="proj-nonexistent")
        assert result == []

    @patch("crud.message_stats._charts._hourly_date_filter")
    def test_without_project_aggregates_by_slot(self, mock_filter, mock_db):
        """Без project_id — агрегируем по hour_slot через суммирование."""
        from crud.message_stats._charts import get_hourly_chart

        mock_filter.side_effect = lambda q, *a: q
        # Две строки с одинаковым hour_slot, разные проекты
        row1 = _make_hourly_row(
            hour_slot="2026-02-24T14", project_id="proj-1",
            incoming_count=10, outgoing_count=5,
            unique_users_json="[100,200]",
            unique_text_users_json="[100]",
            unique_payload_users_json="[200]",
            outgoing_users_json="[300]",
        )
        row2 = _make_hourly_row(
            hour_slot="2026-02-24T14", project_id="proj-2",
            incoming_count=20, outgoing_count=10,
            unique_users_json="[200,300]",
            unique_text_users_json="[300]",
            unique_payload_users_json="[]",
            outgoing_users_json="[400]",
        )
        mock_db.query.return_value.order_by.return_value.all.return_value = [row1, row2]

        result = get_hourly_chart(mock_db)
        assert len(result) == 1
        item = result[0]
        assert item["hour_slot"] == "2026-02-24T14"
        # Суммирование счётчиков
        assert item["incoming"] == 30
        assert item["outgoing"] == 15
        assert item["total"] == 45
        # Объединение множеств: unique_users = {100,200,300}
        assert item["unique_users"] == 3

    @patch("crud.message_stats._charts._hourly_date_filter")
    def test_without_project_empty_data(self, mock_filter, mock_db):
        """Без project_id и без данных — пустой список."""
        from crud.message_stats._charts import get_hourly_chart

        mock_filter.side_effect = lambda q, *a: q
        mock_db.query.return_value.order_by.return_value.all.return_value = []

        result = get_hourly_chart(mock_db)
        assert result == []

    @patch("crud.message_stats._charts._hourly_date_filter")
    def test_null_counts_default_to_zero(self, mock_filter, mock_db):
        """None-значения счётчиков заменяются на 0."""
        from crud.message_stats._charts import get_hourly_chart

        mock_filter.side_effect = lambda q, *a: q
        row = _make_hourly_row(
            incoming_count=None, outgoing_count=None,
            incoming_payload_count=None, incoming_text_count=None,
            outgoing_system_count=None, outgoing_bot_count=None,
            unique_users_count=None,
            unique_users_json=None,
            unique_text_users_json=None,
            unique_payload_users_json=None,
            outgoing_users_json=None,
        )
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [row]

        result = get_hourly_chart(mock_db, project_id="proj-1")
        assert len(result) == 1
        item = result[0]
        assert item["incoming"] == 0
        assert item["outgoing"] == 0
        assert item["total"] == 0
        assert item["unique_users"] == 0
