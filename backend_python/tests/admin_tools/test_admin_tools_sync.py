"""Тесты для admin_tools_sync.py — синхронизация групп и админов через VK API."""
import pytest
import json
import sys
import os
from unittest.mock import MagicMock, patch, PropertyMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


class TestSyncAdministeredGroups:
    """Тесты для sync_administered_groups."""

    @patch("services.admin_tools_sync.crud")
    @patch("services.admin_tools_sync.settings")
    @patch("services.admin_tools_sync.raw_vk_call")
    def test_no_tokens_returns_error(self, mock_vk, mock_settings, mock_crud):
        """Если нет активных токенов, возвращается ошибка."""
        from services.admin_tools_sync import sync_administered_groups

        mock_settings.vk_user_token = None
        mock_crud.get_all_accounts.return_value = []

        mock_db = MagicMock()
        result = sync_administered_groups(mock_db)

        assert result["success"] is False
        assert "No active tokens" in result["message"]

    @patch("services.admin_tools_sync.crud")
    @patch("services.admin_tools_sync.settings")
    @patch("services.admin_tools_sync.raw_vk_call")
    def test_syncs_groups_from_vk(self, mock_vk, mock_settings, mock_crud):
        """Группы из VK API сохраняются в БД."""
        from services.admin_tools_sync import sync_administered_groups

        mock_settings.vk_user_token = "test_token"
        mock_crud.get_all_accounts.return_value = []

        # VK возвращает 2 группы
        mock_vk.return_value = {
            "items": [
                {"id": 1001, "name": "Группа 1", "screen_name": "grp1", "members_count": 100},
                {"id": 1002, "name": "Группа 2", "screen_name": "grp2", "members_count": 200},
            ]
        }

        mock_db = MagicMock()
        # Нет существующих групп
        mock_db.query.return_value.all.return_value = []
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.query.return_value.count.return_value = 2

        result = sync_administered_groups(mock_db)

        assert result["success"] is True
        assert result["tokens_scanned"] == 1
        mock_db.commit.assert_called()

    @patch("services.admin_tools_sync.crud")
    @patch("services.admin_tools_sync.settings")
    @patch("services.admin_tools_sync.raw_vk_call")
    def test_marks_lost_groups(self, mock_vk, mock_settings, mock_crud):
        """Группы, к которым потерян доступ, помечаются (admin_sources → [])."""
        from services.admin_tools_sync import sync_administered_groups

        mock_settings.vk_user_token = "test_token"
        mock_crud.get_all_accounts.return_value = []

        # VK возвращает только одну группу (вторая потеряна)
        mock_vk.return_value = {"items": [{"id": 1001, "name": "G1"}]}

        mock_db = MagicMock()
        # В БД было 2 группы
        old_group1 = MagicMock(id=1001)
        old_group2 = MagicMock(id=9999)  # Потерянная
        mock_db.query.return_value.all.return_value = [old_group1, old_group2]
        mock_db.query.return_value.filter.return_value.first.return_value = old_group1
        mock_db.query.return_value.filter.return_value.update.return_value = None
        mock_db.query.return_value.count.return_value = 2

        result = sync_administered_groups(mock_db)

        assert result["success"] is True
        mock_db.commit.assert_called()

    @patch("services.admin_tools_sync.crud")
    @patch("services.admin_tools_sync.settings")
    @patch("services.admin_tools_sync.raw_vk_call")
    def test_vk_api_error_counted(self, mock_vk, mock_settings, mock_crud):
        """Ошибка VK API при сканировании токена — счётчик ошибок увеличивается."""
        from services.admin_tools_sync import sync_administered_groups

        mock_settings.vk_user_token = "broken_token"
        mock_crud.get_all_accounts.return_value = []
        mock_vk.side_effect = Exception("VK API error")

        mock_db = MagicMock()
        mock_db.query.return_value.all.return_value = []
        mock_db.query.return_value.count.return_value = 0

        result = sync_administered_groups(mock_db)

        assert result["success"] is True
        assert result["errors"] == 1
        assert result["tokens_scanned"] == 0

    @patch("services.admin_tools_sync.crud")
    @patch("services.admin_tools_sync.settings")
    @patch("services.admin_tools_sync.raw_vk_call")
    def test_db_error_raises(self, mock_vk, mock_settings, mock_crud):
        """Ошибка при записи в БД — исключение перебрасывается."""
        from services.admin_tools_sync import sync_administered_groups

        mock_settings.vk_user_token = "test_token"
        mock_crud.get_all_accounts.return_value = []
        mock_vk.return_value = {"items": [{"id": 1001, "name": "G1"}]}

        mock_db = MagicMock()
        mock_db.query.return_value.all.return_value = []
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.commit.side_effect = Exception("DB commit failed")

        with pytest.raises(Exception, match="DB commit failed"):
            sync_administered_groups(mock_db)

        mock_db.rollback.assert_called()

    @patch("services.admin_tools_sync.crud")
    @patch("services.admin_tools_sync.settings")
    @patch("services.admin_tools_sync.raw_vk_call")
    def test_multiple_tokens_aggregated(self, mock_vk, mock_settings, mock_crud):
        """Группы из нескольких токенов агрегируются в одну коллекцию."""
        from services.admin_tools_sync import sync_administered_groups

        mock_settings.vk_user_token = "token_env"

        # Один системный аккаунт
        acc = MagicMock()
        acc.token = "token_sys"
        acc.status = "active"
        acc.full_name = "System User"
        acc.vk_user_id = 999
        mock_crud.get_all_accounts.return_value = [acc]

        # У обоих токенов одна и та же группа (дублирование)
        mock_vk.return_value = {"items": [{"id": 1001, "name": "G1"}]}

        mock_db = MagicMock()
        mock_db.query.return_value.all.return_value = []
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.query.return_value.count.return_value = 1

        result = sync_administered_groups(mock_db)

        assert result["tokens_scanned"] == 2
        # VK вызывается 2 раза (для каждого токена)
        assert mock_vk.call_count == 2


class TestSyncGroupAdmins:
    """Тесты для sync_group_admins."""

    @patch("services.admin_tools_sync._process_and_save_admins")
    @patch("services.admin_tools_sync.crud")
    @patch("services.admin_tools_sync.settings")
    @patch("services.admin_tools_sync.raw_vk_call")
    def test_group_not_found_raises_404(self, mock_vk, mock_settings, mock_crud, mock_process):
        """Если группа не найдена в БД, бросается HTTPException 404."""
        from services.admin_tools_sync import sync_group_admins
        from fastapi import HTTPException

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            sync_group_admins(mock_db, 99999)
        assert exc_info.value.status_code == 404

    @patch("services.admin_tools_sync._process_and_save_admins")
    @patch("services.admin_tools_sync.crud")
    @patch("services.admin_tools_sync.settings")
    @patch("services.admin_tools_sync.raw_vk_call")
    def test_no_tokens_raises_400(self, mock_vk, mock_settings, mock_crud, mock_process):
        """Нет активных токенов — HTTPException 400."""
        from services.admin_tools_sync import sync_group_admins
        from fastapi import HTTPException

        mock_settings.vk_user_token = None
        mock_crud.get_active_account_tokens.return_value = []

        mock_db = MagicMock()
        group = MagicMock(id=100)
        mock_db.query.return_value.filter.return_value.first.return_value = group

        with pytest.raises(HTTPException) as exc_info:
            sync_group_admins(mock_db, 100)
        assert exc_info.value.status_code == 400

    @patch("services.admin_tools_sync._process_and_save_admins")
    @patch("services.admin_tools_sync.crud")
    @patch("services.admin_tools_sync.settings")
    @patch("services.admin_tools_sync.raw_vk_call")
    def test_successful_sync(self, mock_vk, mock_settings, mock_crud, mock_process):
        """Успешная синхронизация — вызывается _process_and_save_admins."""
        from services.admin_tools_sync import sync_group_admins

        mock_settings.vk_user_token = "test_token"
        mock_crud.get_active_account_tokens.return_value = []

        mock_db = MagicMock()
        group = MagicMock(id=100)
        mock_db.query.return_value.filter.return_value.first.return_value = group

        managers_items = [{"id": 1, "role": "creator", "first_name": "A", "last_name": "B"}]
        mock_vk.return_value = {"items": managers_items}
        mock_process.return_value = group

        result = sync_group_admins(mock_db, 100)

        mock_process.assert_called_once_with(mock_db, group, managers_items)
        assert result == group

    @patch("services.admin_tools_sync._process_and_save_admins")
    @patch("services.admin_tools_sync.crud")
    @patch("services.admin_tools_sync.settings")
    @patch("services.admin_tools_sync.raw_vk_call")
    def test_all_tokens_fail_raises_403(self, mock_vk, mock_settings, mock_crud, mock_process):
        """Все токены не смогли получить менеджеров — HTTPException 403."""
        from services.admin_tools_sync import sync_group_admins
        from fastapi import HTTPException

        mock_settings.vk_user_token = "token1"
        mock_crud.get_active_account_tokens.return_value = ["token2"]

        mock_db = MagicMock()
        group = MagicMock(id=100)
        mock_db.query.return_value.filter.return_value.first.return_value = group

        # Оба токена падают
        mock_vk.side_effect = Exception("Access denied")

        with pytest.raises(HTTPException) as exc_info:
            sync_group_admins(mock_db, 100)
        assert exc_info.value.status_code == 403

    @patch("services.admin_tools_sync._process_and_save_admins")
    @patch("services.admin_tools_sync.crud")
    @patch("services.admin_tools_sync.settings")
    @patch("services.admin_tools_sync.raw_vk_call")
    def test_first_token_fails_second_succeeds(self, mock_vk, mock_settings, mock_crud, mock_process):
        """Первый токен падает, второй успешно получает данные."""
        from services.admin_tools_sync import sync_group_admins

        mock_settings.vk_user_token = "token_bad"
        mock_crud.get_active_account_tokens.return_value = ["token_good"]

        mock_db = MagicMock()
        group = MagicMock(id=100)
        mock_db.query.return_value.filter.return_value.first.return_value = group

        # Первый вызов — ошибка, второй — успех
        managers_items = [{"id": 1, "role": "administrator"}]
        mock_vk.side_effect = [
            Exception("Token expired"),
            {"items": managers_items}
        ]
        mock_process.return_value = group

        result = sync_group_admins(mock_db, 100)

        mock_process.assert_called_once_with(mock_db, group, managers_items)
