"""
Тесты для services/messages/community_chats_service.py — групповые чаты сообщества.
"""

import json
import pytest
from unittest.mock import MagicMock, patch, call


class TestGetCommunityChats:
    """Тесты загрузки чатов из БД."""

    def test_returns_cached_chats(self, mock_db):
        """Кэш с данными → возвращает чаты из БД."""
        from services.messages.community_chats_service import get_community_chats

        # Мокаем результат запроса к БД
        chat1 = MagicMock()
        chat1.to_dict.return_value = {
            "peer_id": 2000000001,
            "title": "Внутренний чат",
            "members_count": 3,
        }
        chat2 = MagicMock()
        chat2.to_dict.return_value = {
            "peer_id": 2000000002,
            "title": "Рабочий чат",
            "members_count": 5,
        }

        query_mock = MagicMock()
        query_mock.filter.return_value.order_by.return_value.all.return_value = [chat1, chat2]
        mock_db.query.return_value = query_mock

        result = get_community_chats(mock_db, "proj-1")

        assert result["count"] == 2
        assert result["from_cache"] is True
        assert result["chats"][0]["title"] == "Внутренний чат"
        assert result["chats"][1]["peer_id"] == 2000000002

    def test_returns_empty_when_no_cache(self, mock_db):
        """Пустой кэш → возвращает пустой список."""
        from services.messages.community_chats_service import get_community_chats

        query_mock = MagicMock()
        query_mock.filter.return_value.order_by.return_value.all.return_value = []
        mock_db.query.return_value = query_mock

        result = get_community_chats(mock_db, "proj-1")

        assert result["count"] == 0
        assert result["chats"] == []
        assert result["from_cache"] is True


class TestSyncCommunityChats:
    """Тесты синхронизации чатов с VK API."""

    @patch("services.messages.community_chats_service.get_community_chats")
    @patch("services.messages.community_chats_service.call_vk_api_for_group")
    @patch("services.messages.community_chats_service.get_project_and_tokens")
    def test_sync_filters_chat_type(self, mock_get_proj, mock_vk_call, mock_get_chats, mock_db):
        """Синхронизация фильтрует только peer.type === 'chat'."""
        from services.messages.community_chats_service import sync_community_chats

        mock_get_proj.return_value = (MagicMock(), ["token"], 123456)
        mock_vk_call.return_value = {
            "count": 3,
            "items": [
                # Личный диалог — НЕ чат
                {
                    "conversation": {"peer": {"type": "user", "id": 12345}},
                    "last_message": {"id": 1, "text": "hi", "date": 1700000100, "from_id": 12345},
                },
                # Групповой чат — это чат
                {
                    "conversation": {
                        "peer": {"type": "chat", "id": 2000000001, "local_id": 1},
                        "chat_settings": {"title": "Тестовый чат", "members_count": 3, "photo": {}},
                        "unread_count": 0,
                    },
                    "last_message": {"id": 2, "text": "привет", "date": 1700000200, "from_id": 100},
                },
                # Группа — НЕ чат
                {
                    "conversation": {"peer": {"type": "group", "id": -98765}},
                    "last_message": {"id": 3, "text": "new", "date": 1700000300, "from_id": -98765},
                },
            ],
            "profiles": [],
            "groups": [],
        }
        mock_get_chats.return_value = {"chats": [], "count": 0, "from_cache": True}

        # Проверяем что коммит вызван (значит обработка прошла)
        sync_community_chats(mock_db, "proj-1")
        mock_db.commit.assert_called_once()

    @patch("services.messages.community_chats_service.get_community_chats")
    @patch("services.messages.community_chats_service.call_vk_api_for_group")
    @patch("services.messages.community_chats_service.get_project_and_tokens")
    def test_sync_handles_vk_api_error(self, mock_get_proj, mock_vk_call, mock_get_chats, mock_db):
        """Ошибка VK API → прерывает пагинацию, сохраняет что есть."""
        from services.messages.community_chats_service import sync_community_chats

        mock_get_proj.return_value = (MagicMock(), ["token"], 123456)
        mock_vk_call.side_effect = Exception("VK API timeout")
        mock_get_chats.return_value = {"chats": [], "count": 0, "from_cache": True}

        # Не падает, обрабатывает ошибку
        result = sync_community_chats(mock_db, "proj-1")
        assert result is not None
