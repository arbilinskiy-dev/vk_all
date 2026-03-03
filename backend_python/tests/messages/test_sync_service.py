"""
Тесты для services/messages/sync_service.py — фоновая синхронизация.
"""

import pytest
from unittest.mock import MagicMock, patch, call


class TestBackgroundSyncNewMessages:
    """Тесты фоновой синхронизации новых сообщений."""

    @patch("services.messages.sync_service.mem_invalidate_dialog")
    @patch("services.messages.sync_service.messages_crud")
    @patch("services.messages.sync_service.fetch_from_vk")
    @patch("services.messages.sync_service.SessionLocal")
    def test_sync_with_new_messages(self, mock_session_cls, mock_fetch, mock_crud, mock_invalidate):
        """Есть новые сообщения — сохраняем, пересчитываем, инвалидируем."""
        from services.messages.sync_service import background_sync_new_messages

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        # Кэш содержит сообщения до даты 1700000200
        mock_crud.get_newest_cached_date.return_value = 1700000200

        # VK возвращает 3 сообщения, 1 из которых новее кэша
        mock_fetch.return_value = {
            "items": [
                {"id": 1, "date": 1700000100},  # Старое
                {"id": 2, "date": 1700000200},  # Ровно граница — не новое
                {"id": 3, "date": 1700000300},  # Новое!
            ],
            "count": 10,
        }
        mock_crud.save_vk_messages.return_value = 1
        mock_crud.recalc_direction_counts.return_value = {
            "cached_total": 10,
            "incoming_count": 5,
            "outgoing_count": 5,
        }

        background_sync_new_messages("proj-1", 12345, ["token"], 123456)

        # Сохранено только 1 новое сообщение (date > 1700000200)
        mock_crud.save_vk_messages.assert_called_once()
        saved_items = mock_crud.save_vk_messages.call_args[0][3]
        assert len(saved_items) == 1
        assert saved_items[0]["id"] == 3

        # Пересчёт и обновление метаданных
        mock_crud.recalc_direction_counts.assert_called_once()
        mock_crud.upsert_cache_meta.assert_called_once()

        # Memory-кэш инвалидирован
        mock_invalidate.assert_called_once_with("proj-1", 12345)

    @patch("services.messages.sync_service.messages_crud")
    @patch("services.messages.sync_service.fetch_from_vk")
    @patch("services.messages.sync_service.SessionLocal")
    def test_sync_no_items_from_vk(self, mock_session_cls, mock_fetch, mock_crud):
        """VK вернул пустой список — ничего не делаем."""
        from services.messages.sync_service import background_sync_new_messages

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db
        mock_crud.get_newest_cached_date.return_value = 1700000200
        mock_fetch.return_value = {"items": [], "count": 0}

        background_sync_new_messages("proj-1", 12345, ["token"], 123456)

        mock_crud.save_vk_messages.assert_not_called()

    @patch("services.messages.sync_service.messages_crud")
    @patch("services.messages.sync_service.fetch_from_vk")
    @patch("services.messages.sync_service.SessionLocal")
    def test_sync_no_cached_date_saves_all(self, mock_session_cls, mock_fetch, mock_crud):
        """Нет кэша (newest_date=None) — сохраняем все."""
        from services.messages.sync_service import background_sync_new_messages

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db
        mock_crud.get_newest_cached_date.return_value = None
        mock_fetch.return_value = {
            "items": [{"id": 1, "date": 100}, {"id": 2, "date": 200}],
            "count": 2,
        }
        mock_crud.save_vk_messages.return_value = 2
        mock_crud.recalc_direction_counts.return_value = {
            "cached_total": 2, "incoming_count": 1, "outgoing_count": 1,
        }

        background_sync_new_messages("proj-1", 12345, ["token"], 123456)

        saved_items = mock_crud.save_vk_messages.call_args[0][3]
        assert len(saved_items) == 2

    @patch("services.messages.sync_service.messages_crud")
    @patch("services.messages.sync_service.fetch_from_vk")
    @patch("services.messages.sync_service.SessionLocal")
    def test_sync_error_handled_gracefully(self, mock_session_cls, mock_fetch, mock_crud):
        """Ошибка при синхронизации — не падает, session закрывается."""
        from services.messages.sync_service import background_sync_new_messages

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db
        mock_crud.get_newest_cached_date.side_effect = Exception("DB connection lost")

        # Не должно бросать исключение
        background_sync_new_messages("proj-1", 12345, ["token"], 123456)

        # Session должна быть закрыта
        mock_session_cls.remove.assert_called_once()
