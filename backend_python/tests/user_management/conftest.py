"""Общие фикстуры для тестов модуля user_management."""
import sys
import os
import pytest
from unittest.mock import MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


@pytest.fixture
def mock_db():
    """Мок-сессия SQLAlchemy с настроенными цепочками вызовов."""
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    db.query.return_value.filter.return_value.all.return_value = []
    db.query.return_value.filter.return_value.scalar.return_value = 0
    db.query.return_value.filter.return_value.group_by.return_value.all.return_value = []
    db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = []
    db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.return_value = []
    db.query.return_value.filter.return_value.order_by.return_value.all.return_value = []
    db.query.return_value.order_by.return_value.all.return_value = []
    db.query.return_value.all.return_value = []
    return db


@pytest.fixture
def mock_current_user():
    """Мок текущего авторизованного пользователя (CurrentUser)."""
    user = MagicMock()
    user.user_id = "user-123"
    user.username = "testuser"
    user.role = "admin"
    user.user_type = "vk"
    user.session_id = "sess-001"
    user.full_name = "Тестовый Пользователь"
    return user
