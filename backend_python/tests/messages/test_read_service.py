"""
Тесты для services/messages/read_service.py — статусы прочитанности.
"""

import pytest
from unittest.mock import MagicMock, patch


class TestMarkDialogRead:
    """Тесты пометки диалога как прочитанного."""

    @patch("services.messages.read_service._publish_global_unread_count")
    @patch("services.messages.read_service._publish_sse_event")
    @patch("services.messages.read_service.message_read_crud")
    def test_no_incoming_messages(self, mock_crud, mock_sse, mock_global_sse, mock_db):
        """Нет входящих сообщений (max_msg_id <= 0) → unread_count=0."""
        from services.messages.read_service import mark_dialog_read

        mock_crud.get_max_incoming_message_id.return_value = 0

        result = mark_dialog_read(mock_db, "proj-1", 12345, "mgr-1")
        assert result["success"] is True
        assert result["unread_count"] == 0
        assert result["last_read_message_id"] == 0
        mock_crud.mark_dialog_as_read.assert_not_called()

    @patch("services.messages.read_service._publish_global_unread_count")
    @patch("services.messages.read_service._publish_sse_event")
    @patch("services.messages.read_service.message_read_crud")
    def test_mark_read_success(self, mock_crud, mock_sse, mock_global_sse, mock_db):
        """Успешная пометка — вызывает CRUD + SSE."""
        from services.messages.read_service import mark_dialog_read

        mock_crud.get_max_incoming_message_id.return_value = 5000
        mock_crud.mark_dialog_as_read.return_value = MagicMock()

        result = mark_dialog_read(mock_db, "proj-1", 12345, "mgr-1")
        assert result["success"] is True
        assert result["last_read_message_id"] == 5000

        mock_crud.mark_dialog_as_read.assert_called_once_with(
            mock_db, "proj-1", 12345, 5000, "mgr-1"
        )
        mock_sse.assert_called_once()
        mock_global_sse.assert_called_once()


class TestMarkAllDialogsRead:
    """Тесты пометки ВСЕХ диалогов как прочитанных."""

    @patch("services.messages.read_service._publish_global_unread_count")
    @patch("services.messages.read_service._publish_sse_event")
    @patch("services.messages.read_service.message_read_crud")
    def test_mark_all_read_success(self, mock_crud, mock_sse, mock_global_sse, mock_db):
        from services.messages.read_service import mark_all_dialogs_read

        mock_crud.mark_all_dialogs_as_read.return_value = 5

        result = mark_all_dialogs_read(mock_db, "proj-1", "mgr-1")
        assert result["success"] is True
        assert result["updated_count"] == 5
        mock_sse.assert_called_once()
        mock_global_sse.assert_called_once()


class TestMarkDialogUnread:
    """Тесты пометки диалога как непрочитанного."""

    @patch("services.messages.read_service._publish_global_unread_count")
    @patch("services.messages.read_service._publish_sse_event")
    @patch("services.messages.read_service.message_read_crud")
    def test_mark_unread_success(self, mock_crud, mock_sse, mock_global_sse, mock_db):
        from services.messages.read_service import mark_dialog_unread

        mock_crud.mark_dialog_as_unread.return_value = 1

        result = mark_dialog_unread(mock_db, "proj-1", 12345, "mgr-1")
        assert result["success"] is True
        assert result["unread_count"] == 1
        mock_sse.assert_called_once()
        mock_global_sse.assert_called_once()


class TestGetUnreadCounts:
    """Тесты получения счётчиков непрочитанных."""

    @patch("services.messages.read_service.message_read_crud")
    def test_with_user_ids(self, mock_crud, mock_db):
        from services.messages.read_service import get_unread_counts

        mock_crud.get_unread_counts_batch.return_value = {100: 3, 200: 0}

        result = get_unread_counts(mock_db, "proj-1", "100,200")
        assert result["success"] is True
        assert result["counts"]["100"] == 3
        assert result["counts"]["200"] == 0

    @patch("services.messages.read_service.message_read_crud")
    def test_empty_user_ids(self, mock_crud, mock_db):
        from services.messages.read_service import get_unread_counts

        result = get_unread_counts(mock_db, "proj-1", "")
        assert result["success"] is True
        assert result["counts"] == {}

    @patch("services.messages.read_service.message_read_crud")
    def test_no_user_ids_param(self, mock_crud, mock_db):
        """user_ids_str=None — fallback на все из кэша."""
        from services.messages.read_service import get_unread_counts

        with patch("services.messages.read_service.CachedMessage", create=True):
            # Мокаем запрос distinct
            mock_db.query.return_value.filter.return_value.all.return_value = [
                (100,), (200,),
            ]
            mock_crud.get_unread_counts_batch.return_value = {100: 1, 200: 2}

            result = get_unread_counts(mock_db, "proj-1", None)
            assert result["counts"]["100"] == 1
