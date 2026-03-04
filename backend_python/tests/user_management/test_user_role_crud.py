"""
Тесты для CRUD-операций с бизнес-ролями пользователей.
Тестируемый модуль: crud/user_role_crud.py
"""
import pytest
import sys
import os
from unittest.mock import MagicMock, patch, call

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


# =============================================
# get_all_roles
# =============================================

class TestGetAllRoles:
    """Тесты получения списка всех ролей."""

    def test_пустой_список_ролей(self, mock_db):
        """Если ролей нет — возвращается пустой список."""
        from crud.user_role_crud import get_all_roles

        mock_db.query.return_value.order_by.return_value.all.return_value = []
        result = get_all_roles(mock_db)

        assert result == []
        mock_db.query.assert_called_once()

    def test_несколько_ролей(self, mock_db):
        """Возвращает список ролей, отсортированных по sort_order."""
        from crud.user_role_crud import get_all_roles

        role1 = MagicMock(id="r1", sort_order=0)
        role1.name = "SMM"
        role2 = MagicMock(id="r2", sort_order=1)
        role2.name = "Аналитик"
        mock_db.query.return_value.order_by.return_value.all.return_value = [role1, role2]

        result = get_all_roles(mock_db)

        assert len(result) == 2
        assert result[0].name == "SMM"
        assert result[1].name == "Аналитик"


# =============================================
# get_role_by_id
# =============================================

class TestGetRoleById:
    """Тесты получения роли по ID."""

    def test_роль_найдена(self, mock_db):
        """Возвращает объект роли, если она существует."""
        from crud.user_role_crud import get_role_by_id

        role = MagicMock(id="r1")
        role.name = "SMM"
        mock_db.query.return_value.filter.return_value.first.return_value = role

        result = get_role_by_id(mock_db, "r1")

        assert result is not None
        assert result.name == "SMM"

    def test_роль_не_найдена(self, mock_db):
        """Возвращает None, если роль не найдена."""
        from crud.user_role_crud import get_role_by_id

        mock_db.query.return_value.filter.return_value.first.return_value = None

        result = get_role_by_id(mock_db, "nonexistent")

        assert result is None


# =============================================
# create_role
# =============================================

class TestCreateRole:
    """Тесты создания новой роли."""

    @patch("crud.user_role_crud.uuid")
    def test_успешное_создание(self, mock_uuid, mock_db):
        """Создаёт роль с корректными полями, вызывает add/commit/refresh."""
        from crud.user_role_crud import create_role

        mock_uuid.uuid4.return_value = "fake-uuid-1234"

        result = create_role(mock_db, name="Контент-мейкер", description="Создаёт контент", color="blue")

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()

        created_role = mock_db.add.call_args[0][0]
        assert created_role.id == "fake-uuid-1234"
        assert created_role.name == "Контент-мейкер"
        assert created_role.description == "Создаёт контент"
        assert created_role.color == "blue"

    @patch("crud.user_role_crud.uuid")
    def test_создание_без_опциональных_полей(self, mock_uuid, mock_db):
        """Создаёт роль только с именем, без описания и цвета."""
        from crud.user_role_crud import create_role

        mock_uuid.uuid4.return_value = "uuid-minimal"

        result = create_role(mock_db, name="Стажёр")

        created_role = mock_db.add.call_args[0][0]
        assert created_role.name == "Стажёр"
        assert created_role.description is None
        assert created_role.color is None


# =============================================
# update_role
# =============================================

class TestUpdateRole:
    """Тесты обновления роли."""

    def test_успешное_обновление_всех_полей(self, mock_db):
        """Обновляет name, description, color и коммитит."""
        from crud.user_role_crud import update_role

        existing_role = MagicMock(id="r1", name="Старое имя", description="Старое описание", color="red")
        mock_db.query.return_value.filter.return_value.first.return_value = existing_role

        result = update_role(mock_db, "r1", name="Новое имя", description="Новое описание", color="green")

        assert result is not None
        assert existing_role.name == "Новое имя"
        assert existing_role.description == "Новое описание"
        assert existing_role.color == "green"
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(existing_role)

    def test_частичное_обновление(self, mock_db):
        """Обновляет только переданные поля; остальные не трогает."""
        from crud.user_role_crud import update_role

        existing_role = MagicMock(id="r1", name="Было", description="Было описание", color="red")
        mock_db.query.return_value.filter.return_value.first.return_value = existing_role

        result = update_role(mock_db, "r1", name="Стало")

        assert existing_role.name == "Стало"
        # description и color не меняются (None не передан — не обновляем)
        mock_db.commit.assert_called_once()

    def test_роль_не_найдена_при_обновлении(self, mock_db):
        """Возвращает None, если роль не существует."""
        from crud.user_role_crud import update_role

        mock_db.query.return_value.filter.return_value.first.return_value = None

        result = update_role(mock_db, "nonexistent", name="Имя")

        assert result is None
        mock_db.commit.assert_not_called()


# =============================================
# delete_role
# =============================================

class TestDeleteRole:
    """Тесты удаления роли."""

    def test_успешное_удаление(self, mock_db):
        """Удаляет роль, сбрасывает role_id у юзеров, возвращает True."""
        from crud.user_role_crud import delete_role

        existing_role = MagicMock(id="r1")
        mock_db.query.return_value.filter.return_value.first.return_value = existing_role

        result = delete_role(mock_db, "r1")

        assert result is True
        mock_db.delete.assert_called_once_with(existing_role)
        mock_db.commit.assert_called_once()

    def test_роль_не_найдена_при_удалении(self, mock_db):
        """Возвращает False, если роль не существует."""
        from crud.user_role_crud import delete_role

        mock_db.query.return_value.filter.return_value.first.return_value = None

        result = delete_role(mock_db, "nonexistent")

        assert result is False
        mock_db.delete.assert_not_called()
        mock_db.commit.assert_not_called()


# =============================================
# assign_role_to_user
# =============================================

class TestAssignRoleToUser:
    """Тесты назначения роли пользователю."""

    def test_успешное_назначение_роли(self, mock_db):
        """Назначает роль пользователю и коммитит."""
        from crud.user_role_crud import assign_role_to_user

        user = MagicMock(id="u1", role_id=None)
        role = MagicMock(id="r1")

        # Первый вызов — поиск юзера; второй — поиск роли
        mock_db.query.return_value.filter.return_value.first.side_effect = [user, role]

        result = assign_role_to_user(mock_db, "u1", "r1")

        assert result is True
        assert user.role_id == "r1"
        mock_db.commit.assert_called_once()

    def test_пользователь_не_найден(self, mock_db):
        """Возвращает False, если пользователь не существует."""
        from crud.user_role_crud import assign_role_to_user

        mock_db.query.return_value.filter.return_value.first.return_value = None

        result = assign_role_to_user(mock_db, "nonexistent", "r1")

        assert result is False
        mock_db.commit.assert_not_called()

    def test_роль_не_найдена(self, mock_db):
        """Возвращает False, если роль не существует."""
        from crud.user_role_crud import assign_role_to_user

        user = MagicMock(id="u1")
        # Первый вызов — юзер найден; второй — роль не найдена
        mock_db.query.return_value.filter.return_value.first.side_effect = [user, None]

        result = assign_role_to_user(mock_db, "u1", "nonexistent")

        assert result is False

    def test_убрать_роль_role_id_none(self, mock_db):
        """role_id=None — убирает роль у пользователя."""
        from crud.user_role_crud import assign_role_to_user

        user = MagicMock(id="u1", role_id="r1")
        mock_db.query.return_value.filter.return_value.first.return_value = user

        result = assign_role_to_user(mock_db, "u1", None)

        assert result is True
        assert user.role_id is None
        mock_db.commit.assert_called_once()


# =============================================
# get_users_with_roles
# =============================================

class TestGetUsersWithRoles:
    """Тесты получения списка пользователей с ролями."""

    def test_пользователь_с_ролью(self, mock_db):
        """Возвращает flat-поля role_name и role_color для пользователя с ролью."""
        from crud.user_role_crud import get_users_with_roles

        user = MagicMock(id="u1", full_name="Иванов", username="ivanov", role_id="r1")
        role = MagicMock(id="r1", color="indigo")
        role.name = "SMM-менеджер"

        # Первый вызов query().order_by().all() — юзеры
        mock_db.query.return_value.order_by.return_value.all.return_value = [user]
        # Второй вызов query().filter().all() — роли
        mock_db.query.return_value.filter.return_value.all.return_value = [role]

        result = get_users_with_roles(mock_db)

        assert len(result) == 1
        assert result[0]["user_id"] == "u1"
        assert result[0]["role_name"] == "SMM-менеджер"
        assert result[0]["role_color"] == "indigo"
        assert result[0]["full_name"] == "Иванов"

    def test_пользователь_без_роли(self, mock_db):
        """role_name и role_color = None у пользователя без роли."""
        from crud.user_role_crud import get_users_with_roles

        user = MagicMock(id="u2", full_name="Петров", username="petrov", role_id=None)
        mock_db.query.return_value.order_by.return_value.all.return_value = [user]

        result = get_users_with_roles(mock_db)

        assert len(result) == 1
        assert result[0]["role_name"] is None
        assert result[0]["role_color"] is None

    def test_пустой_список_пользователей(self, mock_db):
        """Если пользователей нет — возвращается пустой список."""
        from crud.user_role_crud import get_users_with_roles

        mock_db.query.return_value.order_by.return_value.all.return_value = []

        result = get_users_with_roles(mock_db)

        assert result == []
