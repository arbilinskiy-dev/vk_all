"""
Общие фикстуры для тестов модуля сообщений.
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch

# Добавляем корень бэкенда в sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture
def mock_db():
    """Мок-объект SQLAlchemy Session."""
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    db.query.return_value.filter.return_value.all.return_value = []
    return db


@pytest.fixture
def mock_project():
    """Мок-объект проекта с токенами."""
    project = MagicMock()
    project.id = "test-project-id"
    project.communityToken = "token_main"
    project.additional_community_tokens = '["token_extra_1", "token_extra_2"]'
    project.vkProjectId = "123456"
    return project


@pytest.fixture
def mock_project_no_tokens():
    """Мок-объект проекта БЕЗ токенов."""
    project = MagicMock()
    project.id = "test-project-id"
    project.communityToken = None
    project.additional_community_tokens = None
    project.vkProjectId = "123456"
    return project


@pytest.fixture
def sample_vk_messages():
    """Примеры сообщений из VK API."""
    return [
        {"id": 1001, "from_id": 12345, "peer_id": 12345, "text": "Привет!", "date": 1700000100, "out": 0},
        {"id": 1002, "from_id": -123456, "peer_id": 12345, "text": "Здравствуйте!", "date": 1700000200, "out": 1},
        {"id": 1003, "from_id": 12345, "peer_id": 12345, "text": "Вопрос", "date": 1700000300, "out": 0},
    ]


@pytest.fixture
def community_tokens():
    """Список токенов сообщества."""
    return ["token_main", "token_extra_1", "token_extra_2"]
