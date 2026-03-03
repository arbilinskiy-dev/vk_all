"""Тесты для admin_tools_crud.py — CRUD/DB операции с AdministeredGroup."""
import pytest
import json
import sys
import os
from unittest.mock import MagicMock, patch, PropertyMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


class TestGetAllAdministeredGroups:
    """Тесты для get_all_administered_groups."""

    def test_returns_all_groups_ordered_by_name(self):
        """Возвращает все группы, отсортированные по имени."""
        from services.admin_tools_crud import get_all_administered_groups

        # Мок SQLAlchemy Session
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.order_by.return_value = mock_query

        fake_groups = [MagicMock(name="GroupA"), MagicMock(name="GroupB")]
        mock_query.all.return_value = fake_groups

        result = get_all_administered_groups(mock_db)

        # Проверяем что вызывается query → order_by → all
        mock_db.query.assert_called_once()
        mock_query.order_by.assert_called_once()
        mock_query.all.assert_called_once()
        assert result == fake_groups

    def test_returns_empty_list_when_no_groups(self):
        """Возвращает пустой список, если групп нет."""
        from services.admin_tools_crud import get_all_administered_groups

        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.all.return_value = []

        result = get_all_administered_groups(mock_db)
        assert result == []


class TestProcessAndSaveAdmins:
    """Тесты для _process_and_save_admins."""

    def _make_group(self, admins_data=None, creator_id=None, creator_name=None):
        """Хелпер: создаёт мок AdministeredGroup."""
        group = MagicMock()
        group.admins_data = admins_data
        group.creator_id = creator_id
        group.creator_name = creator_name
        return group

    def test_saves_new_admins(self):
        """Новые менеджеры корректно сохраняются в admins_data."""
        from services.admin_tools_crud import _process_and_save_admins

        mock_db = MagicMock()
        group = self._make_group(admins_data=None)

        managers_data = [
            {"id": 100, "first_name": "Иван", "last_name": "Петров", "role": "administrator"},
            {"id": 200, "first_name": "Анна", "last_name": "Сидорова", "role": "editor"},
        ]

        result = _process_and_save_admins(mock_db, group, managers_data)

        # Проверяем что admins_data был записан
        saved_data = json.loads(group.admins_data)
        assert len(saved_data) == 2
        assert saved_data[0]["id"] == 100
        assert saved_data[0]["status"] == "active"
        assert saved_data[1]["id"] == 200

        # Проверяем commit и refresh
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(group)

    def test_creator_is_extracted(self):
        """Роль creator корректно сохраняется в group.creator_id и creator_name."""
        from services.admin_tools_crud import _process_and_save_admins

        mock_db = MagicMock()
        group = self._make_group(admins_data=None)

        managers_data = [
            {"id": 555, "first_name": "Создатель", "last_name": "Группы", "role": "creator"},
        ]

        _process_and_save_admins(mock_db, group, managers_data)

        assert group.creator_id == 555
        assert group.creator_name == "Создатель Группы"

    def test_existing_admins_marked_inactive(self):
        """Админы, отсутствующие в новом списке, помечаются как inactive."""
        from services.admin_tools_crud import _process_and_save_admins

        mock_db = MagicMock()
        # Старый админ id=300, которого нет в новом списке
        existing = json.dumps([
            {"id": 300, "first_name": "Старый", "last_name": "Админ", "role": "administrator", "status": "active"}
        ])
        group = self._make_group(admins_data=existing)

        managers_data = [
            {"id": 100, "first_name": "Новый", "last_name": "Админ", "role": "administrator"},
        ]

        _process_and_save_admins(mock_db, group, managers_data)

        saved_data = json.loads(group.admins_data)
        # Должно быть 2 записи: новый active и старый inactive
        assert len(saved_data) == 2

        active_ids = [a["id"] for a in saved_data if a["status"] == "active"]
        inactive_ids = [a["id"] for a in saved_data if a["status"] == "inactive"]
        assert 100 in active_ids
        assert 300 in inactive_ids

    def test_preserves_permissions(self):
        """Поле permissions сохраняется из VK-данных."""
        from services.admin_tools_crud import _process_and_save_admins

        mock_db = MagicMock()
        group = self._make_group(admins_data=None)

        managers_data = [
            {"id": 100, "first_name": "A", "last_name": "B", "role": "administrator",
             "permissions": ["post", "stats"]},
        ]

        _process_and_save_admins(mock_db, group, managers_data)

        saved_data = json.loads(group.admins_data)
        assert saved_data[0]["permissions"] == ["post", "stats"]

    def test_exception_is_reraised(self):
        """При ошибке commit исключение перебрасывается."""
        from services.admin_tools_crud import _process_and_save_admins

        mock_db = MagicMock()
        mock_db.commit.side_effect = Exception("DB is down")
        group = self._make_group(admins_data=None)

        with pytest.raises(Exception, match="DB is down"):
            _process_and_save_admins(mock_db, group, [{"id": 1, "role": "admin"}])

    def test_empty_managers_list(self):
        """Пустой список менеджеров — все существующие помечаются inactive."""
        from services.admin_tools_crud import _process_and_save_admins

        mock_db = MagicMock()
        existing = json.dumps([
            {"id": 100, "first_name": "A", "last_name": "B", "role": "administrator", "status": "active"}
        ])
        group = self._make_group(admins_data=existing)

        _process_and_save_admins(mock_db, group, [])

        saved_data = json.loads(group.admins_data)
        assert len(saved_data) == 1
        assert saved_data[0]["status"] == "inactive"
