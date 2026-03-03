"""
Тесты для services/messages/history_service.py — история сообщений с кэшированием.
"""

import pytest
from unittest.mock import MagicMock, patch, PropertyMock


class TestGetHistory:
    """Тесты получения истории сообщений."""

    @patch("services.messages.history_service.mem_get")
    @patch("services.messages.history_service.mem_cache_key")
    def test_memory_cache_hit(self, mock_key, mock_mem_get, mock_db, mock_project):
        """Memory-кэш содержит данные → возвращаем сразу."""
        from services.messages.history_service import get_history

        mock_key.return_value = "test-key"
        cached_data = {"success": True, "items": [{"id": 1}], "source": "cache"}
        mock_mem_get.return_value = cached_data

        result = get_history(
            mock_db, "proj-1", 12345, 50, 0,
            force_refresh=False, include_user_info=False,
            project=mock_project, community_tokens=["token"], group_id_int=123456,
        )
        assert result["items"] == [{"id": 1}]

    @patch("services.messages.history_service.get_user_info_for_response")
    @patch("services.messages.history_service.mem_get")
    @patch("services.messages.history_service.mem_cache_key")
    def test_memory_cache_hit_with_user_info(self, mock_key, mock_mem_get, mock_user_info, mock_db, mock_project):
        """Memory-кэш + include_user_info → добавляем user_info поверх кэша."""
        from services.messages.history_service import get_history

        mock_key.return_value = "key"
        mock_mem_get.return_value = {"success": True, "items": []}
        mock_user_info.return_value = {"name": "Иван"}

        result = get_history(
            mock_db, "proj-1", 12345, 50, 0,
            force_refresh=False, include_user_info=True,
            project=mock_project, community_tokens=["token"], group_id_int=123456,
        )
        assert result["user_info"]["name"] == "Иван"

    @patch("services.messages.history_service.mem_set")
    @patch("services.messages.history_service.mem_cache_key")
    @patch("services.messages.history_service.mem_get")
    @patch("services.messages.history_service.messages_crud")
    def test_force_refresh_skips_memory_cache(self, mock_crud, mock_mem_get, mock_key, mock_mem_set, mock_db, mock_project):
        """force_refresh=True → не проверяем memory-кэш, идём в VK API."""
        from services.messages.history_service import get_history

        mock_crud.get_cache_meta.return_value = None  # Нет кэша в БД

        with patch("services.messages.history_service._fetch_and_cache_from_vk") as mock_fetch:
            mock_fetch.return_value = {"success": True, "items": [], "source": "vk_api"}

            result = get_history(
                mock_db, "proj-1", 12345, 50, 0,
                force_refresh=True, include_user_info=False,
                project=mock_project, community_tokens=["token"], group_id_int=123456,
            )

            mock_mem_get.assert_not_called()
            mock_fetch.assert_called_once()

    @patch("services.messages.history_service.sync_new_messages")
    @patch("services.messages.history_service.mem_set")
    @patch("services.messages.history_service.mem_cache_key")
    @patch("services.messages.history_service.mem_get")
    @patch("services.messages.history_service.messages_crud")
    def test_stale_cache_triggers_sync(self, mock_crud, mock_mem_get, mock_key, mock_mem_set, mock_sync, mock_db, mock_project):
        """Устаревший кэш → синхронная до-синхронизация из VK."""
        from services.messages.history_service import get_history

        mock_mem_get.return_value = None
        mock_key.return_value = "key"

        # Кэш есть, но устарел
        meta = MagicMock()
        meta.cached_count = 100
        meta.total_count = 100
        meta.is_fully_loaded = False
        mock_crud.get_cache_meta.return_value = meta
        mock_crud.is_cache_fresh.return_value = False
        mock_crud.get_cached_messages.return_value = ([{"id": 1}], 100)
        mock_crud.get_message_direction_counts.return_value = {"incoming": 50, "outgoing": 50}
        mock_sync.return_value = 5

        result = get_history(
            mock_db, "proj-1", 12345, 50, 0,
            force_refresh=False, include_user_info=False,
            project=mock_project, community_tokens=["token"], group_id_int=123456,
        )

        assert result["source"] == "cache_synced"
        mock_sync.assert_called_once()

    @patch("services.messages.history_service.mem_set")
    @patch("services.messages.history_service.mem_cache_key")
    @patch("services.messages.history_service.mem_get")
    @patch("services.messages.history_service.messages_crud")
    def test_fresh_cache_no_bg_sync(self, mock_crud, mock_mem_get, mock_key, mock_mem_set, mock_db, mock_project):
        """Свежий кэш → возвращаем из БД, фон НЕ запускаем."""
        from services.messages.history_service import get_history

        mock_mem_get.return_value = None
        mock_key.return_value = "key"

        meta = MagicMock()
        meta.cached_count = 100
        meta.total_count = 100
        meta.is_fully_loaded = True
        mock_crud.get_cache_meta.return_value = meta
        mock_crud.is_cache_fresh.return_value = True
        mock_crud.get_cached_messages.return_value = ([{"id": 1}], 100)
        mock_crud.get_message_direction_counts.return_value = {"incoming": 50, "outgoing": 50}

        bg_tasks = MagicMock()

        result = get_history(
            mock_db, "proj-1", 12345, 50, 0,
            force_refresh=False, include_user_info=False,
            project=mock_project, community_tokens=["token"], group_id_int=123456,
            background_tasks=bg_tasks,
        )

        assert result["source"] == "cache"
        bg_tasks.add_task.assert_not_called()
