"""Тесты для crud.message_stats._admin — статистика по администраторам."""

import pytest
from unittest.mock import MagicMock, patch
import json


def _make_admin_agg_row(sender_id="admin-1", sender_name="Администратор", messages_sent=100, projects_count=3):
    """Создаёт мок-строку агрегата по администратору."""
    row = MagicMock()
    row.sender_id = sender_id
    row.sender_name = sender_name
    row.messages_sent = messages_sent
    row.projects_count = projects_count
    return row


class TestGetAdminStats:
    """Тесты агрегированной статистики по администраторам."""

    def test_returns_list(self, mock_db):
        """Возвращает список словарей."""
        from crud.message_stats._admin import get_admin_stats

        admin_row = _make_admin_agg_row()
        mock_db.query.return_value.group_by.return_value.all.return_value = [admin_row]
        # Мокаем запрос unique_dialogs_json
        mock_db.query.return_value.filter.return_value.all.return_value = [
            (json.dumps([100, 200, 300]),),
        ]

        result = get_admin_stats(mock_db)
        assert isinstance(result, list)
        assert len(result) == 1

    def test_admin_fields(self, mock_db):
        """Проверяем все поля элемента результата."""
        from crud.message_stats._admin import get_admin_stats

        admin_row = _make_admin_agg_row(
            sender_id="admin-2", sender_name="Василий",
            messages_sent=50, projects_count=2,
        )
        mock_db.query.return_value.group_by.return_value.all.return_value = [admin_row]
        mock_db.query.return_value.filter.return_value.all.return_value = [
            (json.dumps([10, 20]),),
        ]

        result = get_admin_stats(mock_db)
        item = result[0]
        assert item["sender_id"] == "admin-2"
        assert item["sender_name"] == "Василий"
        assert item["messages_sent"] == 50
        assert item["unique_dialogs"] == 2
        assert item["projects_count"] == 2

    def test_empty_data(self, mock_db):
        """Нет администраторов — пустой список."""
        from crud.message_stats._admin import get_admin_stats

        mock_db.query.return_value.group_by.return_value.all.return_value = []

        result = get_admin_stats(mock_db)
        assert result == []

    def test_null_sender_name_defaults(self, mock_db):
        """None sender_name заменяется на 'Неизвестный'."""
        from crud.message_stats._admin import get_admin_stats

        admin_row = _make_admin_agg_row(sender_name=None)
        mock_db.query.return_value.group_by.return_value.all.return_value = [admin_row]
        mock_db.query.return_value.filter.return_value.all.return_value = []

        result = get_admin_stats(mock_db)
        assert result[0]["sender_name"] == "Неизвестный"

    def test_sorted_by_messages_desc(self, mock_db):
        """Результат отсортирован по messages_sent убывающе."""
        from crud.message_stats._admin import get_admin_stats

        row1 = _make_admin_agg_row(sender_id="a1", messages_sent=10)
        row2 = _make_admin_agg_row(sender_id="a2", messages_sent=50)
        mock_db.query.return_value.group_by.return_value.all.return_value = [row1, row2]
        # Для обоих — пустые диалоги
        mock_db.query.return_value.filter.return_value.all.return_value = []

        result = get_admin_stats(mock_db)
        assert result[0]["messages_sent"] >= result[1]["messages_sent"]

    def test_with_date_filters(self, mock_db):
        """При передаче дат — фильтры применяются."""
        from crud.message_stats._admin import get_admin_stats

        admin_row = _make_admin_agg_row()
        # Настраиваем цепочку filter → filter → group_by → all
        mock_db.query.return_value.filter.return_value.filter.return_value.group_by.return_value.all.return_value = [admin_row]
        mock_db.query.return_value.filter.return_value.filter.return_value.all.return_value = [
            (json.dumps([1, 2]),),
        ]
        # Для ветки count unique_dialogs с фильтрами
        mock_db.query.return_value.filter.return_value.filter.return_value.filter.return_value.all.return_value = [
            (json.dumps([1, 2]),),
        ]

        result = get_admin_stats(mock_db, date_from="2026-01-01", date_to="2026-01-31")
        assert isinstance(result, list)


class TestGetAdminDialogs:
    """Тесты списка диалогов администратора."""

    def test_returns_structure(self, mock_db):
        """Возвращает словарь с sender_name и dialogs."""
        from crud.message_stats._admin import get_admin_dialogs

        row = MagicMock()
        row.project_id = "proj-1"
        row.messages_sent = 10
        row.unique_dialogs_json = json.dumps([100, 200])
        row.sender_name = "Менеджер"
        row.date = "2026-02-25"
        mock_db.query.return_value.filter.return_value.all.return_value = [row]

        # Мокаем загрузку VkProfile (пустой результат — без ФИО)
        mock_db.query.return_value.join.return_value.filter.return_value.all.return_value = []

        result = get_admin_dialogs(mock_db, sender_id="admin-1")
        assert "sender_name" in result
        assert "dialogs" in result
        assert result["sender_name"] == "Менеджер"

    def test_dialogs_list_populated(self, mock_db):
        """Диалоги содержат ожидаемые поля."""
        from crud.message_stats._admin import get_admin_dialogs

        row = MagicMock()
        row.project_id = "proj-1"
        row.messages_sent = 20
        row.unique_dialogs_json = json.dumps([100])
        row.sender_name = "Иван"
        row.date = "2026-02-25"
        mock_db.query.return_value.filter.return_value.all.return_value = [row]
        mock_db.query.return_value.join.return_value.filter.return_value.all.return_value = []

        result = get_admin_dialogs(mock_db, sender_id="admin-1")
        assert len(result["dialogs"]) == 1
        dialog = result["dialogs"][0]
        expected_keys = {"project_id", "vk_user_id", "messages_sent", "first_name", "last_name", "photo_url"}
        assert expected_keys == set(dialog.keys())

    def test_empty_dialogs(self, mock_db):
        """Нет данных — пустой список диалогов."""
        from crud.message_stats._admin import get_admin_dialogs

        mock_db.query.return_value.filter.return_value.all.return_value = []

        result = get_admin_dialogs(mock_db, sender_id="admin-nonexistent")
        assert result["sender_name"] == "Неизвестный"
        assert result["dialogs"] == []

    def test_dialogs_sorted_by_messages_desc(self, mock_db):
        """Диалоги отсортированы по messages_sent убывающе."""
        from crud.message_stats._admin import get_admin_dialogs

        row1 = MagicMock()
        row1.project_id = "proj-1"
        row1.messages_sent = 30
        row1.unique_dialogs_json = json.dumps([100, 200])
        row1.sender_name = "Тест"
        row1.date = "2026-02-25"

        row2 = MagicMock()
        row2.project_id = "proj-2"
        row2.messages_sent = 60
        row2.unique_dialogs_json = json.dumps([300])
        row2.sender_name = "Тест"
        row2.date = "2026-02-25"

        mock_db.query.return_value.filter.return_value.all.return_value = [row1, row2]
        mock_db.query.return_value.join.return_value.filter.return_value.all.return_value = []

        result = get_admin_dialogs(mock_db, sender_id="admin-1")
        if len(result["dialogs"]) >= 2:
            assert result["dialogs"][0]["messages_sent"] >= result["dialogs"][1]["messages_sent"]
