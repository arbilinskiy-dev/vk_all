"""Тесты для admin_tools_promote.py — назначение администраторов VK."""
import pytest
import json
import sys
import os
from unittest.mock import MagicMock, patch, call

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


class TestPromoteToAdmins:
    """Тесты для promote_to_admins."""

    def _setup_mocks(self, mock_vk, mock_settings, mock_crud):
        """Хелпер: базовая настройка моков."""
        mock_settings.vk_user_token = "env_token"

        # users.get для ENV-токена
        mock_vk.return_value = [{"id": 1000, "first_name": "Env", "last_name": "User"}]

        # Нет системных аккаунтов
        mock_crud.get_all_accounts.return_value = []

    @patch("services.admin_tools_promote.crud")
    @patch("services.admin_tools_promote.settings")
    @patch("services.admin_tools_promote.raw_vk_call")
    def test_successful_promote(self, mock_vk, mock_settings, mock_crud):
        """Успешное назначение администратора через groups.editManager."""
        from services.admin_tools_promote import promote_to_admins

        mock_settings.vk_user_token = "env_token"

        # Карта вызовов VK API
        def vk_side_effect(method, params):
            if method == 'users.get':
                return [{"id": 1000, "first_name": "Env", "last_name": "User"}]
            elif method == 'groups.isMember':
                return [{"user_id": 1000, "member": 1}]
            elif method == 'groups.getMembers':
                return {"items": [{"id": 1000, "role": "creator"}]}
            elif method == 'groups.editManager':
                return 1  # Успех
            return None

        mock_vk.side_effect = vk_side_effect
        mock_crud.get_all_accounts.return_value = []

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.all.return_value = [
            MagicMock(id=500, name="Тестовая группа")
        ]

        result = promote_to_admins(mock_db, group_ids=[500], user_ids=[1000], role='administrator')

        assert result["success"] is True
        assert result["promoted_count"] == 1

    @patch("services.admin_tools_promote.crud")
    @patch("services.admin_tools_promote.settings")
    @patch("services.admin_tools_promote.raw_vk_call")
    def test_user_not_member_joins_first(self, mock_vk, mock_settings, mock_crud):
        """Пользователь не подписчик — сначала вступление через groups.join, затем назначение."""
        from services.admin_tools_promote import promote_to_admins

        mock_settings.vk_user_token = "env_token"

        join_called = {"value": False}

        def vk_side_effect(method, params):
            if method == 'users.get':
                return [{"id": 1000, "first_name": "Env", "last_name": "User"}]
            elif method == 'groups.isMember':
                return [{"user_id": 1000, "member": 0}]  # Не участник
            elif method == 'groups.join':
                join_called["value"] = True
                return 1
            elif method == 'groups.getMembers':
                return {"items": [{"id": 1000, "role": "creator"}]}
            elif method == 'groups.editManager':
                return 1
            return None

        mock_vk.side_effect = vk_side_effect
        mock_crud.get_all_accounts.return_value = []

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.all.return_value = [
            MagicMock(id=500, name="Группа")
        ]

        result = promote_to_admins(mock_db, [500], [1000])

        assert join_called["value"] is True, "groups.join должен был быть вызван"
        assert result["joined_count"] == 1
        assert result["promoted_count"] == 1

    @patch("services.admin_tools_promote.crud")
    @patch("services.admin_tools_promote.settings")
    @patch("services.admin_tools_promote.raw_vk_call")
    def test_already_admin_detected(self, mock_vk, mock_settings, mock_crud):
        """Пользователь уже админ (код 224) — помечается как already_admin."""
        from services.admin_tools_promote import promote_to_admins

        mock_settings.vk_user_token = "env_token"

        def vk_side_effect(method, params):
            if method == 'users.get':
                return [{"id": 1000, "first_name": "E", "last_name": "U"}]
            elif method == 'groups.isMember':
                return [{"user_id": 1000, "member": 1}]
            elif method == 'groups.getMembers':
                return {"items": [{"id": 1000, "role": "creator"}]}
            elif method == 'groups.editManager':
                raise Exception("Error Code: 224 - already manager")
            return None

        mock_vk.side_effect = vk_side_effect
        mock_crud.get_all_accounts.return_value = []

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.all.return_value = [
            MagicMock(id=500, name="Группа")
        ]

        result = promote_to_admins(mock_db, [500], [1000])

        assert result["already_admin_count"] == 1
        assert result["promoted_count"] == 0

    @patch("services.admin_tools_promote.crud")
    @patch("services.admin_tools_promote.settings")
    @patch("services.admin_tools_promote.raw_vk_call")
    def test_no_admin_token_for_group(self, mock_vk, mock_settings, mock_crud):
        """Нет админ-токена для группы — пользователь вступает, но назначение не происходит."""
        from services.admin_tools_promote import promote_to_admins

        mock_settings.vk_user_token = "env_token"

        def vk_side_effect(method, params):
            if method == 'users.get':
                return [{"id": 1000, "first_name": "E", "last_name": "U"}]
            elif method == 'groups.isMember':
                return [{"user_id": 1000, "member": 1}]
            elif method == 'groups.getMembers':
                # Ни один из наших пользователей не админ
                return {"items": [{"id": 9999, "role": "creator"}]}
            return None

        mock_vk.side_effect = vk_side_effect
        mock_crud.get_all_accounts.return_value = []

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.all.return_value = [
            MagicMock(id=500, name="Группа")
        ]
        # _find_admin_token_for_group ищет в admins_data
        mock_db.query.return_value.filter.return_value.first.return_value = MagicMock(
            id=500, admins_data="[]"
        )

        result = promote_to_admins(mock_db, [500], [1000])

        assert result["error_count"] >= 1
        # Ошибка "Нет токена администратора"
        errors = [r for r in result["results"] if r.get("error")]
        assert len(errors) > 0

    @patch("services.admin_tools_promote.crud")
    @patch("services.admin_tools_promote.settings")
    @patch("services.admin_tools_promote.raw_vk_call")
    def test_edit_manager_scope_error_15(self, mock_vk, mock_settings, mock_crud):
        """Ошибка Code: 15 — токен не имеет scope 'groups', помечается как broken."""
        from services.admin_tools_promote import promote_to_admins

        mock_settings.vk_user_token = "env_token"

        def vk_side_effect(method, params):
            if method == 'users.get':
                return [{"id": 1000, "first_name": "E", "last_name": "U"}]
            elif method == 'groups.isMember':
                return [{"user_id": 1000, "member": 1}]
            elif method == 'groups.getMembers':
                return {"items": [{"id": 1000, "role": "creator"}]}
            elif method == 'groups.editManager':
                raise Exception("Error Code: 15 - Access denied")
            return None

        mock_vk.side_effect = vk_side_effect
        mock_crud.get_all_accounts.return_value = []

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.all.return_value = [
            MagicMock(id=500, name="Группа")
        ]

        result = promote_to_admins(mock_db, [500], [1000])

        assert result["error_count"] >= 1
        err_results = [r for r in result["results"] if r.get("error")]
        assert any("Error 15" in r["error"] or "Code: 15" in r["error"] for r in err_results)

    @patch("services.admin_tools_promote.crud")
    @patch("services.admin_tools_promote.settings")
    @patch("services.admin_tools_promote.raw_vk_call")
    def test_no_token_for_user(self, mock_vk, mock_settings, mock_crud):
        """Нет токена для запрошенного user_id — ошибка с рекомендацией."""
        from services.admin_tools_promote import promote_to_admins

        mock_settings.vk_user_token = None  # Нет ENV-токена
        mock_crud.get_all_accounts.return_value = []

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.all.return_value = [
            MagicMock(id=500, name="Группа")
        ]

        result = promote_to_admins(mock_db, [500], [7777])

        # Нет токенов вообще — target_users пуст → нет результатов
        assert result["total_pairs"] == 0

    @patch("services.admin_tools_promote.crud")
    @patch("services.admin_tools_promote.settings")
    @patch("services.admin_tools_promote.raw_vk_call")
    def test_statistics_summary(self, mock_vk, mock_settings, mock_crud):
        """Итоговая статистика корректно подсчитывает promoted, joined, errors."""
        from services.admin_tools_promote import promote_to_admins

        mock_settings.vk_user_token = "env_token"

        def vk_side_effect(method, params):
            if method == 'users.get':
                return [{"id": 1000, "first_name": "E", "last_name": "U"}]
            elif method == 'groups.isMember':
                return [{"user_id": 1000, "member": 0}]
            elif method == 'groups.join':
                return 1
            elif method == 'groups.getMembers':
                return {"items": [{"id": 1000, "role": "administrator"}]}
            elif method == 'groups.editManager':
                return 1
            return None

        mock_vk.side_effect = vk_side_effect
        mock_crud.get_all_accounts.return_value = []

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.all.return_value = [
            MagicMock(id=500, name="G1"),
            MagicMock(id=600, name="G2"),
        ]

        result = promote_to_admins(mock_db, [500, 600], [1000])

        assert result["success"] is True
        assert result["total_pairs"] == result["promoted_count"] + result["already_admin_count"] + result["error_count"]


class TestFindAdminTokenForGroup:
    """Тесты для _find_admin_token_for_group."""

    @patch("services.admin_tools_promote.raw_vk_call")
    def test_finds_admin_token_via_api(self, mock_vk):
        """Находит токен пользователя-администратора через groups.getMembers."""
        from services.admin_tools_promote import _find_admin_token_for_group

        # groups.getMembers подтверждает, что uid=100 — administrator
        mock_vk.return_value = {
            "items": [{"id": 100, "role": "administrator"}]
        }

        mock_db = MagicMock()
        # В БД есть группа с admins_data
        group_mock = MagicMock()
        group_mock.admins_data = json.dumps([{"id": 100, "role": "administrator"}])
        mock_db.query.return_value.filter.return_value.first.return_value = group_mock

        user_tokens_map = {
            100: {"token": "tok_100", "name": "User 100"},
        }

        result = _find_admin_token_for_group(mock_db, 500, user_tokens_map)

        assert result is not None
        assert result["uid"] == 100
        assert result["token"] == "tok_100"

    @patch("services.admin_tools_promote.raw_vk_call")
    def test_no_admin_found_returns_none(self, mock_vk):
        """Ни один из токенов не является админом — возвращается None."""
        from services.admin_tools_promote import _find_admin_token_for_group

        # Ни один из наших пользователей не в списке менеджеров
        mock_vk.return_value = {
            "items": [{"id": 9999, "role": "creator"}]
        }

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = MagicMock(
            admins_data="[]"
        )

        user_tokens_map = {
            100: {"token": "tok_100", "name": "User 100"},
        }

        result = _find_admin_token_for_group(mock_db, 500, user_tokens_map)

        assert result is None

    @patch("services.admin_tools_promote.raw_vk_call")
    def test_priority_from_db_admins_data(self, mock_vk):
        """Приоритет отдаётся пользователям из admins_data БД."""
        from services.admin_tools_promote import _find_admin_token_for_group

        # В БД uid=200 — creator (приоритет), uid=100 — editor (неприоритет)
        mock_db = MagicMock()
        group_mock = MagicMock()
        group_mock.admins_data = json.dumps([
            {"id": 200, "role": "creator"},
            {"id": 100, "role": "editor"},
        ])
        mock_db.query.return_value.filter.return_value.first.return_value = group_mock

        # API подтверждает uid=200 как creator
        mock_vk.return_value = {
            "items": [
                {"id": 200, "role": "creator"},
                {"id": 100, "role": "editor"},
            ]
        }

        user_tokens_map = {
            100: {"token": "tok_100", "name": "User 100"},
            200: {"token": "tok_200", "name": "User 200"},
        }

        result = _find_admin_token_for_group(mock_db, 500, user_tokens_map)

        # Должен вернуть uid=200 (creator), а не uid=100
        assert result is not None
        assert result["uid"] == 200

    @patch("services.admin_tools_promote.raw_vk_call")
    def test_all_api_calls_fail_returns_none(self, mock_vk):
        """Все API-вызовы падают — возвращается None."""
        from services.admin_tools_promote import _find_admin_token_for_group

        mock_vk.side_effect = Exception("API unreachable")

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = MagicMock(
            admins_data="[]"
        )

        user_tokens_map = {
            100: {"token": "tok_100", "name": "User 100"},
        }

        result = _find_admin_token_for_group(mock_db, 500, user_tokens_map)

        assert result is None

    @patch("services.admin_tools_promote.raw_vk_call")
    def test_group_not_in_db(self, mock_vk):
        """Группа не найдена в БД — всё равно пробуем API-вызовы."""
        from services.admin_tools_promote import _find_admin_token_for_group

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None

        mock_vk.return_value = {
            "items": [{"id": 100, "role": "administrator"}]
        }

        user_tokens_map = {
            100: {"token": "tok_100", "name": "User 100"},
        }

        result = _find_admin_token_for_group(mock_db, 500, user_tokens_map)

        assert result is not None
        assert result["uid"] == 100

    @patch("services.admin_tools_promote.raw_vk_call")
    def test_finds_other_admin_from_managers_list(self, mock_vk):
        """Текущий uid не админ, но в списке менеджеров найден другой наш пользователь."""
        from services.admin_tools_promote import _find_admin_token_for_group

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = MagicMock(
            admins_data="[]"
        )

        # uid=100 запрашивает, но в списке менеджеров uid=200 — администратор
        mock_vk.return_value = {
            "items": [
                {"id": 100, "role": "editor"},  # Наш, но не админ
                {"id": 200, "role": "administrator"},  # Наш и админ
            ]
        }

        user_tokens_map = {
            100: {"token": "tok_100", "name": "User 100"},
            200: {"token": "tok_200", "name": "User 200"},
        }

        result = _find_admin_token_for_group(mock_db, 500, user_tokens_map)

        assert result is not None
        assert result["uid"] == 200
