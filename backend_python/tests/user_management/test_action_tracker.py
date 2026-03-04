"""
Тесты для сервиса трекинга действий пользователей.
Тестируемый модуль: services/action_tracker.py
"""
import pytest
import sys
import os
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


class TestTrackWithCommit:
    """Тесты track() с commit=True (по умолчанию) — вызывает log_action."""

    @patch("services.action_tracker.user_action_crud")
    def test_вызывает_log_action(self, mock_crud, mock_db, mock_current_user):
        """При commit=True вызывается log_action (с коммитом)."""
        from services.action_tracker import track

        track(
            db=mock_db,
            user=mock_current_user,
            action_type="post_publish",
            category="posts",
            entity_type="post",
            entity_id="p-1",
            project_id="proj-1",
            metadata={"key": "value"},
            commit=True,
        )

        mock_crud.log_action.assert_called_once_with(
            db=mock_db,
            user_id="user-123",
            username="testuser",
            action_type="post_publish",
            action_category="posts",
            entity_type="post",
            entity_id="p-1",
            project_id="proj-1",
            metadata={"key": "value"},
        )
        mock_crud.log_action_no_commit.assert_not_called()

    @patch("services.action_tracker.user_action_crud")
    def test_commit_true_по_умолчанию(self, mock_crud, mock_db, mock_current_user):
        """commit=True по умолчанию — log_action вызывается без явного указания commit."""
        from services.action_tracker import track

        track(
            db=mock_db,
            user=mock_current_user,
            action_type="message_send",
            category="messages",
        )

        mock_crud.log_action.assert_called_once()
        mock_crud.log_action_no_commit.assert_not_called()

    @patch("services.action_tracker.user_action_crud")
    def test_минимальные_параметры(self, mock_crud, mock_db, mock_current_user):
        """Передаём только обязательные параметры, опциональные = None."""
        from services.action_tracker import track

        track(
            db=mock_db,
            user=mock_current_user,
            action_type="settings_update",
            category="settings",
        )

        mock_crud.log_action.assert_called_once_with(
            db=mock_db,
            user_id="user-123",
            username="testuser",
            action_type="settings_update",
            action_category="settings",
            entity_type=None,
            entity_id=None,
            project_id=None,
            metadata=None,
        )


class TestTrackWithoutCommit:
    """Тесты track() с commit=False — вызывает log_action_no_commit."""

    @patch("services.action_tracker.user_action_crud")
    def test_вызывает_log_action_no_commit(self, mock_crud, mock_db, mock_current_user):
        """При commit=False вызывается log_action_no_commit."""
        from services.action_tracker import track

        track(
            db=mock_db,
            user=mock_current_user,
            action_type="post_create",
            category="posts",
            commit=False,
        )

        mock_crud.log_action_no_commit.assert_called_once_with(
            db=mock_db,
            user_id="user-123",
            username="testuser",
            action_type="post_create",
            action_category="posts",
            entity_type=None,
            entity_id=None,
            project_id=None,
            metadata=None,
        )
        mock_crud.log_action.assert_not_called()

    @patch("services.action_tracker.user_action_crud")
    def test_все_параметры_передаются_в_no_commit(self, mock_crud, mock_db, mock_current_user):
        """Все опциональные параметры корректно передаются в log_action_no_commit."""
        from services.action_tracker import track

        track(
            db=mock_db,
            user=mock_current_user,
            action_type="market_create_item",
            category="market",
            entity_type="market_item",
            entity_id="item-42",
            project_id="proj-7",
            metadata={"price": 1500},
            commit=False,
        )

        mock_crud.log_action_no_commit.assert_called_once_with(
            db=mock_db,
            user_id="user-123",
            username="testuser",
            action_type="market_create_item",
            action_category="market",
            entity_type="market_item",
            entity_id="item-42",
            project_id="proj-7",
            metadata={"price": 1500},
        )


class TestTrackExceptionHandling:
    """Тесты поведения track() при исключениях — не должен ломать бизнес-логику."""

    @patch("services.action_tracker.user_action_crud")
    def test_исключение_проглатывается(self, mock_crud, mock_db, mock_current_user):
        """При ошибке в log_action — track() НЕ поднимает исключение."""
        from services.action_tracker import track

        mock_crud.log_action.side_effect = Exception("DB connection lost")

        # Не должно падать
        track(
            db=mock_db,
            user=mock_current_user,
            action_type="post_publish",
            category="posts",
        )

    @patch("builtins.print")
    @patch("services.action_tracker.user_action_crud")
    def test_при_ошибке_печатается_warning(self, mock_crud, mock_print, mock_db, mock_current_user):
        """При ошибке выводится предупреждение через print."""
        from services.action_tracker import track

        mock_crud.log_action.side_effect = RuntimeError("Disk full")

        track(
            db=mock_db,
            user=mock_current_user,
            action_type="post_publish",
            category="posts",
        )

        mock_print.assert_called_once()
        printed_msg = mock_print.call_args[0][0]
        assert "action_tracker.track failed" in printed_msg
        assert "Disk full" in printed_msg

    @patch("services.action_tracker.user_action_crud")
    def test_исключение_в_no_commit_тоже_проглатывается(self, mock_crud, mock_db, mock_current_user):
        """Ошибка в log_action_no_commit тоже не роняет вызывающий код."""
        from services.action_tracker import track

        mock_crud.log_action_no_commit.side_effect = ValueError("Invalid data")

        # Не должно падать
        track(
            db=mock_db,
            user=mock_current_user,
            action_type="bulk_edit",
            category="other",
            commit=False,
        )
