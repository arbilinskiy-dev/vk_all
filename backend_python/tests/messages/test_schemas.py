"""
Тесты для schemas/messages_schemas.py — Pydantic-модели.
"""

import pytest
from pydantic import ValidationError

from schemas.messages_schemas import (
    LoadAllRequest,
    SendMessageRequest,
    MarkReadRequest,
    MarkAllReadRequest,
    MarkUnreadRequest,
    DialogFocusRequest,
    TypingStatusRequest,
)


class TestLoadAllRequest:
    def test_valid(self):
        r = LoadAllRequest(project_id="proj-1", user_id=12345)
        assert r.project_id == "proj-1"
        assert r.user_id == 12345

    def test_missing_fields(self):
        with pytest.raises(ValidationError):
            LoadAllRequest()


class TestSendMessageRequest:
    def test_valid(self):
        r = SendMessageRequest(project_id="proj-1", user_id=12345, message="Привет")
        assert r.message == "Привет"

    def test_missing_message(self):
        with pytest.raises(ValidationError):
            SendMessageRequest(project_id="proj-1", user_id=12345)


class TestMarkReadRequest:
    def test_valid_with_manager(self):
        r = MarkReadRequest(project_id="proj-1", user_id=100, manager_id="mgr-1")
        assert r.manager_id == "mgr-1"

    def test_manager_id_optional(self):
        r = MarkReadRequest(project_id="proj-1", user_id=100)
        assert r.manager_id is None


class TestMarkAllReadRequest:
    def test_valid(self):
        r = MarkAllReadRequest(project_id="proj-1")
        assert r.manager_id is None

    def test_with_manager(self):
        r = MarkAllReadRequest(project_id="proj-1", manager_id="mgr-2")
        assert r.manager_id == "mgr-2"


class TestMarkUnreadRequest:
    def test_valid(self):
        r = MarkUnreadRequest(project_id="proj-1", user_id=200)
        assert r.user_id == 200


class TestDialogFocusRequest:
    def test_valid_enter(self):
        r = DialogFocusRequest(
            project_id="proj-1",
            vk_user_id=100,
            manager_id="mgr-1",
            manager_name="Никита",
            action="enter",
        )
        assert r.action == "enter"

    def test_missing_action(self):
        with pytest.raises(ValidationError):
            DialogFocusRequest(
                project_id="proj-1",
                vk_user_id=100,
                manager_id="mgr-1",
                manager_name="Никита",
            )


class TestTypingStatusRequest:
    def test_valid(self):
        r = TypingStatusRequest(project_id="proj-1", user_id=100)
        assert r.project_id == "proj-1"
