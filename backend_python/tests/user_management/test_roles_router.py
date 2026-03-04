"""
Тесты для routers/roles.py — управление бизнес-ролями пользователей.
Все CRUD-вызовы замоканы, БД не используется.
"""
import pytest
import sys
import os
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


def _make_admin():
    """Создаёт мок администратора (CurrentUser)."""
    from services.auth_middleware import CurrentUser
    return CurrentUser(
        user_id="admin-1",
        username="admin",
        role="admin",
        user_type="internal",
        session_id="s1",
        full_name="Admin",
    )


def _make_role_obj(role_id="role-1", name="SMM-менеджер",
                   description="Ведёт соцсети", color="indigo", sort_order=1):
    """Создаёт мок объекта роли, возвращаемого из CRUD."""
    role = MagicMock()
    role.id = role_id
    role.name = name
    role.description = description
    role.color = color
    role.sort_order = sort_order
    return role


class TestListRoles:
    """Тесты для POST /roles/list."""

    @patch("routers.roles.user_role_crud")
    def test_list_roles_returns_all(self, mock_crud):
        """Проверяем, что /list возвращает success и список ролей."""
        from routers.roles import list_roles

        role1 = _make_role_obj("r1", "SMM", "SMM спец", "green", 1)
        role2 = _make_role_obj("r2", "Дизайнер", "Картинки", "blue", 2)
        mock_crud.get_all_roles.return_value = [role1, role2]

        mock_db = MagicMock()
        mock_admin = _make_admin()

        result = list_roles(db=mock_db, admin=mock_admin)

        assert result["success"] is True
        assert len(result["roles"]) == 2
        assert result["roles"][0]["id"] == "r1"
        assert result["roles"][1]["name"] == "Дизайнер"
        mock_crud.get_all_roles.assert_called_once_with(mock_db)

    @patch("routers.roles.user_role_crud")
    def test_list_roles_empty(self, mock_crud):
        """Пустой список ролей — возвращает пустой массив."""
        from routers.roles import list_roles

        mock_crud.get_all_roles.return_value = []

        result = list_roles(db=MagicMock(), admin=_make_admin())

        assert result["success"] is True
        assert result["roles"] == []


class TestCreateRole:
    """Тесты для POST /roles/create."""

    @patch("routers.roles.user_role_crud")
    def test_create_role_success(self, mock_crud):
        """Успешное создание роли — возвращает success и данные роли."""
        from routers.roles import create_role, RolePayload

        new_role = _make_role_obj("r-new", "Контент-мейкер", "Пишет посты", "red", 3)
        mock_crud.create_role.return_value = new_role

        payload = RolePayload(name="Контент-мейкер", description="Пишет посты", color="red")
        result = create_role(payload=payload, db=MagicMock(), admin=_make_admin())

        assert result["success"] is True
        assert result["role"]["name"] == "Контент-мейкер"
        assert result["role"]["color"] == "red"

    @patch("routers.roles.user_role_crud")
    def test_create_role_error_raises_400(self, mock_crud):
        """Ошибка при создании — HTTPException 400."""
        from routers.roles import create_role, RolePayload
        from fastapi import HTTPException

        mock_crud.create_role.side_effect = Exception("duplicate name")

        payload = RolePayload(name="Дубликат")
        with pytest.raises(HTTPException) as exc_info:
            create_role(payload=payload, db=MagicMock(), admin=_make_admin())

        assert exc_info.value.status_code == 400
        assert "Не удалось создать роль" in exc_info.value.detail


class TestUpdateRole:
    """Тесты для POST /roles/update."""

    @patch("routers.roles.user_role_crud")
    def test_update_role_success(self, mock_crud):
        """Успешное обновление — возвращает обновлённую роль."""
        from routers.roles import update_role, RoleUpdatePayload

        updated = _make_role_obj("r1", "Новое имя", "Описание", "yellow", 1)
        mock_crud.update_role.return_value = updated

        payload = RoleUpdatePayload(role_id="r1", name="Новое имя", color="yellow")
        result = update_role(payload=payload, db=MagicMock(), admin=_make_admin())

        assert result["success"] is True
        assert result["role"]["name"] == "Новое имя"

    @patch("routers.roles.user_role_crud")
    def test_update_role_not_found_raises_404(self, mock_crud):
        """Роль не найдена — HTTPException 404."""
        from routers.roles import update_role, RoleUpdatePayload
        from fastapi import HTTPException

        mock_crud.update_role.return_value = None

        payload = RoleUpdatePayload(role_id="nonexistent")
        with pytest.raises(HTTPException) as exc_info:
            update_role(payload=payload, db=MagicMock(), admin=_make_admin())

        assert exc_info.value.status_code == 404
        assert "Роль не найдена" in exc_info.value.detail


class TestDeleteRole:
    """Тесты для POST /roles/delete."""

    @patch("routers.roles.user_role_crud")
    def test_delete_role_success(self, mock_crud):
        """Успешное удаление — success: True."""
        from routers.roles import delete_role, DeleteRolePayload

        mock_crud.delete_role.return_value = True

        payload = DeleteRolePayload(role_id="r1")
        result = delete_role(payload=payload, db=MagicMock(), admin=_make_admin())

        assert result["success"] is True

    @patch("routers.roles.user_role_crud")
    def test_delete_role_not_found_raises_404(self, mock_crud):
        """Роль не найдена — HTTPException 404."""
        from routers.roles import delete_role, DeleteRolePayload
        from fastapi import HTTPException

        mock_crud.delete_role.return_value = False

        payload = DeleteRolePayload(role_id="ghost")
        with pytest.raises(HTTPException) as exc_info:
            delete_role(payload=payload, db=MagicMock(), admin=_make_admin())

        assert exc_info.value.status_code == 404


class TestAssignRole:
    """Тесты для POST /roles/assign."""

    @patch("routers.roles.user_role_crud")
    def test_assign_role_success(self, mock_crud):
        """Успешное назначение роли — success: True."""
        from routers.roles import assign_role, AssignRolePayload

        mock_crud.assign_role_to_user.return_value = True

        payload = AssignRolePayload(user_id="u1", role_id="r1")
        result = assign_role(payload=payload, db=MagicMock(), admin=_make_admin())

        assert result["success"] is True

    @patch("routers.roles.user_role_crud")
    def test_assign_role_remove(self, mock_crud):
        """Убрать роль (role_id=None) — тоже success."""
        from routers.roles import assign_role, AssignRolePayload

        mock_crud.assign_role_to_user.return_value = True

        mock_db = MagicMock()
        payload = AssignRolePayload(user_id="u1", role_id=None)
        result = assign_role(payload=payload, db=mock_db, admin=_make_admin())

        assert result["success"] is True
        mock_crud.assign_role_to_user.assert_called_once_with(mock_db, "u1", None)

    @patch("routers.roles.user_role_crud")
    def test_assign_role_user_not_found_raises_404(self, mock_crud):
        """Пользователь или роль не найдены — HTTPException 404."""
        from routers.roles import assign_role, AssignRolePayload
        from fastapi import HTTPException

        mock_crud.assign_role_to_user.return_value = False

        payload = AssignRolePayload(user_id="nobody", role_id="r1")
        with pytest.raises(HTTPException) as exc_info:
            assign_role(payload=payload, db=MagicMock(), admin=_make_admin())

        assert exc_info.value.status_code == 404


class TestGetUsersWithRoles:
    """Тесты для POST /roles/users."""

    @patch("routers.roles.user_role_crud")
    def test_users_with_roles_returns_list(self, mock_crud):
        """Возвращает список пользователей с ролями."""
        from routers.roles import get_users_with_roles

        mock_crud.get_users_with_roles.return_value = [
            {"user_id": "u1", "username": "alice", "role_name": "SMM"},
            {"user_id": "u2", "username": "bob", "role_name": None},
        ]

        result = get_users_with_roles(db=MagicMock(), admin=_make_admin())

        assert result["success"] is True
        assert len(result["users"]) == 2
        assert result["users"][0]["username"] == "alice"
