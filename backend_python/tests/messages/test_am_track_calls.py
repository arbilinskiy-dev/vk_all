"""
Тесты: проверка вызовов track() в роутерах модуля Сообщений.
Убеждаемся что каждый endpoint вызывает services.action_tracker.track()
с правильными action_type, category='messages', и корректными метаданными.

Тестируем роутеры:
- messages.py: mark_read, mark_all_read, mark_unread, send, toggle_important
- dialog_labels.py: create, update, delete, assign, unassign, set_dialog_labels
- message_templates.py: create, update, delete
- promo_lists.py: create, update, delete, codes/add, codes/delete, codes/delete-all-free
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch, call

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# =============================================================================
# Фикстуры
# =============================================================================

@pytest.fixture
def mock_db():
    db = MagicMock()
    return db


@pytest.fixture
def mock_current_user():
    from services.auth_middleware import CurrentUser
    return CurrentUser(
        user_id="user-1",
        username="test_user",
        role="user",
        user_type="system",
        session_id="sess-1",
        full_name="Test User",
    )


# =============================================================================
# messages.py: track() вызовы
# =============================================================================

class TestMessagesRouterTrack:
    """Проверяем track() в messages.py."""

    @patch("routers.messages.track")
    @patch("routers.messages.read_service")
    def test_mark_read_calls_track(self, mock_read_svc, mock_track, mock_db, mock_current_user):
        from routers.messages import mark_dialog_as_read
        from schemas.messages_schemas import MarkReadRequest

        body = MagicMock()
        body.project_id = "proj-1"
        body.user_id = 12345
        body.manager_id = "mgr-1"

        # Диалог НЕ был непрочитанным — только 1 вызов track
        mock_read_svc.mark_dialog_read.return_value = {"success": True, "was_unread": False}

        mark_dialog_as_read(body=body, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once_with(
            mock_db, mock_current_user, "message_dialog_read", "messages",
            entity_type="dialog", entity_id="12345",
            project_id="proj-1",
            metadata={"vk_user_id": 12345, "was_unread": False},
        )

    @patch("routers.messages.track")
    @patch("routers.messages.read_service")
    def test_mark_read_unread_dialog_calls_two_tracks(self, mock_read_svc, mock_track, mock_db, mock_current_user):
        """При прочтении НЕПРОЧИТАННОГО диалога — 2 вызова track()."""
        from routers.messages import mark_dialog_as_read

        body = MagicMock()
        body.project_id = "proj-1"
        body.user_id = 12345
        body.manager_id = "mgr-1"

        mock_read_svc.mark_dialog_read.return_value = {"success": True, "was_unread": True}

        mark_dialog_as_read(body=body, db=mock_db, current_user=mock_current_user)

        assert mock_track.call_count == 2
        # Первый вызов — вход в диалог
        call1 = mock_track.call_args_list[0]
        assert call1.args[2] == "message_dialog_read"
        assert call1.kwargs["metadata"]["was_unread"] is True
        # Второй вызов — прочтение непрочитанного диалога
        call2 = mock_track.call_args_list[1]
        assert call2.args[2] == "message_unread_dialog_read"
        assert call2.args[3] == "messages"
        assert call2.kwargs["entity_type"] == "dialog"
        assert call2.kwargs["entity_id"] == "12345"
        assert call2.kwargs["project_id"] == "proj-1"

    @patch("routers.messages.track")
    @patch("routers.messages.read_service")
    def test_mark_read_already_read_dialog_no_unread_track(self, mock_read_svc, mock_track, mock_db, mock_current_user):
        """При повторном входе в уже прочитанный диалог — только message_dialog_read, без message_unread_dialog_read."""
        from routers.messages import mark_dialog_as_read

        body = MagicMock()
        body.project_id = "proj-1"
        body.user_id = 12345
        body.manager_id = "mgr-1"

        mock_read_svc.mark_dialog_read.return_value = {"success": True, "was_unread": False}

        mark_dialog_as_read(body=body, db=mock_db, current_user=mock_current_user)

        assert mock_track.call_count == 1
        assert mock_track.call_args.args[2] == "message_dialog_read"

    @patch("routers.messages.track")
    @patch("routers.messages.read_service")
    def test_mark_all_read_calls_track(self, mock_read_svc, mock_track, mock_db, mock_current_user):
        from routers.messages import mark_all_dialogs_as_read

        body = MagicMock()
        body.project_id = "proj-1"
        body.manager_id = "mgr-1"

        mock_read_svc.mark_all_dialogs_read.return_value = {"success": True}

        mark_all_dialogs_as_read(body=body, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once_with(
            mock_db, mock_current_user, "message_mark_all_read", "messages",
            entity_type="project", project_id="proj-1",
        )

    @patch("routers.messages.track")
    @patch("routers.messages.read_service")
    def test_mark_unread_calls_track(self, mock_read_svc, mock_track, mock_db, mock_current_user):
        from routers.messages import mark_dialog_as_unread

        body = MagicMock()
        body.project_id = "proj-1"
        body.user_id = 99999
        body.manager_id = "mgr-1"

        mock_read_svc.mark_dialog_unread.return_value = {"success": True}

        mark_dialog_as_unread(body=body, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once_with(
            mock_db, mock_current_user, "message_mark_unread", "messages",
            entity_type="dialog", entity_id="99999",
            project_id="proj-1",
            metadata={"vk_user_id": 99999},
        )

    @patch("routers.messages.track")
    @patch("routers.messages.send_service")
    @patch("routers.messages.get_project_and_tokens")
    def test_send_message_calls_track(self, mock_get_tokens, mock_send_svc, mock_track, mock_db, mock_current_user):
        from routers.messages import send_message_endpoint

        mock_get_tokens.return_value = (MagicMock(), ["token"], 123456)
        mock_send_svc.send_message.return_value = {"success": True, "message_id": 100}

        body = MagicMock()
        body.project_id = "proj-1"
        body.user_id = 55555
        body.message = "Привет!"
        body.sender_id = None
        body.sender_name = None
        body.attachment = None

        send_message_endpoint(body=body, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once_with(
            mock_db, mock_current_user, "message_send", "messages",
            entity_type="message", project_id="proj-1",
            metadata={"user_id": 55555},
        )

    @patch("routers.messages.track")
    def test_toggle_important_calls_track(self, mock_track, mock_db, mock_current_user):
        from routers.messages import toggle_important

        body = MagicMock()
        body.project_id = "proj-1"
        body.vk_user_id = 77777
        body.is_important = True

        # Мок для dialog query
        mock_dialog = MagicMock()
        mock_dialog.is_important = False
        mock_db.query.return_value.join.return_value.filter.return_value.first.return_value = mock_dialog

        toggle_important(body=body, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once_with(
            mock_db, mock_current_user, "message_toggle_important", "messages",
            entity_type="dialog", entity_id="77777",
            project_id="proj-1",
            metadata={"vk_user_id": 77777, "is_important": True},
        )


# =============================================================================
# dialog_labels.py: track() вызовы
# =============================================================================

class TestDialogLabelsRouterTrack:
    """Проверяем track() в dialog_labels.py."""

    @patch("routers.dialog_labels.track")
    @patch("routers.dialog_labels.dialog_label_crud")
    def test_create_label_calls_track(self, mock_crud, mock_track, mock_db, mock_current_user):
        from routers.dialog_labels import create_label

        mock_label = MagicMock()
        mock_label.id = "label-1"
        mock_label.project_id = "proj-1"
        mock_label.name = "VIP"
        mock_label.color = "#ff0000"
        mock_label.sort_order = 0
        mock_label.created_at = None
        mock_crud.create_label.return_value = mock_label

        body = MagicMock()
        body.project_id = "proj-1"
        body.name = MagicMock()
        body.name.strip.return_value = "VIP"
        body.color = "#ff0000"

        create_label(body=body, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once()
        args, kwargs = mock_track.call_args
        assert args[2] == "dialog_label_create"
        assert args[3] == "messages"
        assert kwargs["entity_type"] == "dialog_label"
        assert kwargs["entity_id"] == "label-1"

    @patch("routers.dialog_labels.track")
    @patch("routers.dialog_labels.dialog_label_crud")
    def test_update_label_calls_track(self, mock_crud, mock_track, mock_db, mock_current_user):
        from routers.dialog_labels import update_label

        mock_label = MagicMock()
        mock_label.id = "label-1"
        mock_label.project_id = "proj-1"
        mock_label.name = "VIP Updated"
        mock_label.color = "#00ff00"
        mock_label.sort_order = 1
        mock_label.created_at = None
        mock_crud.update_label.return_value = mock_label

        body = MagicMock()
        body.name = "VIP Updated"
        body.color = "#00ff00"
        body.sort_order = 1

        update_label(label_id="label-1", body=body, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once()
        args, kwargs = mock_track.call_args
        assert args[2] == "dialog_label_update"
        assert args[3] == "messages"
        assert kwargs["entity_id"] == "label-1"

    @patch("routers.dialog_labels.track")
    @patch("routers.dialog_labels.dialog_label_crud")
    def test_delete_label_calls_track(self, mock_crud, mock_track, mock_db, mock_current_user):
        from routers.dialog_labels import delete_label

        mock_crud.delete_label.return_value = True

        delete_label(label_id="label-1", project_id="proj-1", db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once()
        args, kwargs = mock_track.call_args
        assert args[2] == "dialog_label_delete"
        assert args[3] == "messages"
        assert kwargs["entity_id"] == "label-1"
        assert kwargs["project_id"] == "proj-1"

    @patch("routers.dialog_labels.track")
    @patch("routers.dialog_labels.dialog_label_crud")
    def test_assign_label_calls_track(self, mock_crud, mock_track, mock_db, mock_current_user):
        from routers.dialog_labels import assign_label

        mock_crud.assign_label.return_value = True

        body = MagicMock()
        body.project_id = "proj-1"
        body.vk_user_id = 12345
        body.label_id = "label-1"

        assign_label(body=body, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once()
        args, kwargs = mock_track.call_args
        assert args[2] == "dialog_label_assign"
        assert args[3] == "messages"
        assert kwargs["metadata"]["vk_user_id"] == 12345

    @patch("routers.dialog_labels.track")
    @patch("routers.dialog_labels.dialog_label_crud")
    def test_unassign_label_calls_track(self, mock_crud, mock_track, mock_db, mock_current_user):
        from routers.dialog_labels import unassign_label

        mock_crud.unassign_label.return_value = True

        body = MagicMock()
        body.project_id = "proj-1"
        body.vk_user_id = 12345
        body.label_id = "label-1"

        unassign_label(body=body, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once()
        args, kwargs = mock_track.call_args
        assert args[2] == "dialog_label_unassign"
        assert args[3] == "messages"

    @patch("routers.dialog_labels.track")
    @patch("routers.dialog_labels.dialog_label_crud")
    def test_set_dialog_labels_calls_track(self, mock_crud, mock_track, mock_db, mock_current_user):
        from routers.dialog_labels import set_dialog_labels

        mock_crud.set_dialog_labels.return_value = ["label-1", "label-2"]

        body = MagicMock()
        body.project_id = "proj-1"
        body.vk_user_id = 12345
        body.label_ids = ["label-1", "label-2"]

        set_dialog_labels(body=body, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once()
        args, kwargs = mock_track.call_args
        assert args[2] == "dialog_label_set"
        assert args[3] == "messages"
        assert kwargs["metadata"]["label_ids"] == ["label-1", "label-2"]


# =============================================================================
# message_templates.py: track() вызовы
# =============================================================================

class TestMessageTemplatesRouterTrack:
    """Проверяем track() в message_templates.py."""

    @patch("routers.message_templates.track")
    @patch("routers.message_templates.message_template_service")
    def test_create_template_calls_track(self, mock_svc, mock_track, mock_db, mock_current_user):
        from routers.message_templates import create_template

        mock_result = MagicMock()
        mock_result.id = "tpl-1"
        mock_svc.create_template.return_value = mock_result

        payload = MagicMock()
        payload.projectId = "proj-1"
        payload.template = MagicMock()
        payload.template.name = "Шаблон 1"

        create_template(payload=payload, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once()
        args, kwargs = mock_track.call_args
        assert args[2] == "template_create"
        assert args[3] == "messages"
        assert kwargs["entity_type"] == "template"
        assert kwargs["project_id"] == "proj-1"

    @patch("routers.message_templates.track")
    @patch("routers.message_templates.message_template_service")
    def test_update_template_calls_track(self, mock_svc, mock_track, mock_db, mock_current_user):
        from routers.message_templates import update_template

        mock_svc.update_template.return_value = MagicMock()

        payload = MagicMock()
        payload.templateId = "tpl-1"
        payload.template = MagicMock()

        update_template(payload=payload, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once()
        args, kwargs = mock_track.call_args
        assert args[2] == "template_update"
        assert args[3] == "messages"
        assert kwargs["entity_id"] == "tpl-1"

    @patch("routers.message_templates.track")
    @patch("routers.message_templates.message_template_service")
    def test_delete_template_calls_track(self, mock_svc, mock_track, mock_db, mock_current_user):
        from routers.message_templates import delete_template

        mock_svc.delete_template.return_value = {"success": True}

        payload = MagicMock()
        payload.templateId = "tpl-1"

        delete_template(payload=payload, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once()
        args, kwargs = mock_track.call_args
        assert args[2] == "template_delete"
        assert args[3] == "messages"
        assert kwargs["entity_id"] == "tpl-1"


# =============================================================================
# promo_lists.py: track() вызовы
# =============================================================================

class TestPromoListsRouterTrack:
    """Проверяем track() в promo_lists.py."""

    @patch("routers.promo_lists.track")
    @patch("routers.promo_lists.promo_list_service")
    def test_create_promo_list_calls_track(self, mock_svc, mock_track, mock_db, mock_current_user):
        from routers.promo_lists import create_promo_list

        mock_result = MagicMock()
        mock_result.id = "promo-1"
        mock_svc.create_list.return_value = mock_result

        payload = MagicMock()
        payload.projectId = "proj-1"
        payload.data = MagicMock()
        payload.data.name = "Промо 1"

        create_promo_list(payload=payload, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once()
        args, kwargs = mock_track.call_args
        assert args[2] == "promo_list_create"
        assert args[3] == "messages"
        assert kwargs["entity_type"] == "promo_list"

    @patch("routers.promo_lists.track")
    @patch("routers.promo_lists.promo_list_service")
    def test_update_promo_list_calls_track(self, mock_svc, mock_track, mock_db, mock_current_user):
        from routers.promo_lists import update_promo_list

        mock_svc.update_list.return_value = MagicMock()

        payload = MagicMock()
        payload.listId = "promo-1"
        payload.data = MagicMock()

        update_promo_list(payload=payload, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once()
        args, kwargs = mock_track.call_args
        assert args[2] == "promo_list_update"
        assert args[3] == "messages"

    @patch("routers.promo_lists.track")
    @patch("routers.promo_lists.promo_list_service")
    def test_delete_promo_list_calls_track(self, mock_svc, mock_track, mock_db, mock_current_user):
        from routers.promo_lists import delete_promo_list

        mock_svc.delete_list.return_value = {"success": True}

        payload = MagicMock()
        payload.listId = "promo-1"

        delete_promo_list(payload=payload, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once()
        args, kwargs = mock_track.call_args
        assert args[2] == "promo_list_delete"
        assert args[3] == "messages"
        assert kwargs["entity_id"] == "promo-1"

    @patch("routers.promo_lists.track")
    @patch("routers.promo_lists.promo_list_service")
    def test_add_codes_calls_track(self, mock_svc, mock_track, mock_db, mock_current_user):
        from routers.promo_lists import add_codes

        mock_svc.add_codes.return_value = {"added": 5}

        payload = MagicMock()
        payload.promoListId = "promo-1"
        payload.codes = [MagicMock()] * 5

        add_codes(payload=payload, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once()
        args, kwargs = mock_track.call_args
        assert args[2] == "promo_codes_add"
        assert args[3] == "messages"
        assert kwargs["metadata"]["codes_count"] == 5

    @patch("routers.promo_lists.track")
    @patch("routers.promo_lists.promo_list_service")
    def test_delete_code_calls_track(self, mock_svc, mock_track, mock_db, mock_current_user):
        from routers.promo_lists import delete_code

        mock_svc.delete_code.return_value = {"success": True}

        payload = MagicMock()
        payload.codeId = "code-1"

        delete_code(payload=payload, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once()
        args, kwargs = mock_track.call_args
        assert args[2] == "promo_code_delete"
        assert args[3] == "messages"
        assert kwargs["entity_type"] == "promo_code"
        assert kwargs["entity_id"] == "code-1"

    @patch("routers.promo_lists.track")
    @patch("routers.promo_lists.promo_list_service")
    def test_delete_all_free_calls_track(self, mock_svc, mock_track, mock_db, mock_current_user):
        from routers.promo_lists import delete_all_free

        mock_svc.delete_all_free.return_value = {"deleted": 10}

        payload = MagicMock()
        payload.promoListId = "promo-1"

        delete_all_free(payload=payload, db=mock_db, current_user=mock_current_user)

        mock_track.assert_called_once()
        args, kwargs = mock_track.call_args
        assert args[2] == "promo_codes_delete_all_free"
        assert args[3] == "messages"
        assert kwargs["entity_id"] == "promo-1"


# =============================================================================
# Общие проверки: все track() вызовы category='messages'
# =============================================================================

class TestAllTrackCallsCategory:
    """Все action_type-ы из track вызовов используют category='messages'."""

    EXPECTED_ACTION_TYPES = [
        # messages.py
        "message_send",
        "message_dialog_read",
        "message_unread_dialog_read",
        "message_mark_all_read",
        "message_mark_unread",
        "message_toggle_important",
        # dialog_labels.py
        "dialog_label_create",
        "dialog_label_update",
        "dialog_label_delete",
        "dialog_label_assign",
        "dialog_label_unassign",
        "dialog_label_set",
        # message_templates.py
        "template_create",
        "template_update",
        "template_delete",
        # promo_lists.py
        "promo_list_create",
        "promo_list_update",
        "promo_list_delete",
        "promo_codes_add",
        "promo_code_delete",
        "promo_codes_delete_all_free",
    ]

    def test_all_action_types_in_label_mapping(self):
        """Все action_type-ы из track() вызовов имеют метку в ACTION_TYPE_LABELS."""
        from routers.message_actions import ACTION_TYPE_LABELS
        for at in self.EXPECTED_ACTION_TYPES:
            assert at in ACTION_TYPE_LABELS, f"action_type '{at}' не найден в ACTION_TYPE_LABELS"

    def test_expected_count_of_action_types(self):
        """Ровно 21 тип действий отслеживаются."""
        assert len(self.EXPECTED_ACTION_TYPES) == 21
