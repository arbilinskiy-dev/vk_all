"""
Общие фикстуры для тестов crud.message_stats.
"""

import sys
import os
import pytest
from unittest.mock import MagicMock

# Добавляем корень бэкенда в sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


@pytest.fixture
def mock_db():
    """Мок-объект SQLAlchemy Session с цепочками query/filter/all/first/scalar."""
    db = MagicMock()
    # Настраиваем цепочку по умолчанию
    db.query.return_value.filter.return_value.first.return_value = None
    db.query.return_value.filter.return_value.all.return_value = []
    db.query.return_value.filter.return_value.scalar.return_value = 0
    db.query.return_value.filter.return_value.group_by.return_value.all.return_value = []
    db.query.return_value.filter.return_value.order_by.return_value.all.return_value = []
    db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []
    db.query.return_value.group_by.return_value.all.return_value = []
    db.query.return_value.all.return_value = []
    db.query.return_value.first.return_value = None
    db.query.return_value.scalar.return_value = 0
    return db
