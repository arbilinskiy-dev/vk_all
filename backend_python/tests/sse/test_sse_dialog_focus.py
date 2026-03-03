"""Тесты для sse_dialog_focus_mixin.py — трекинг менеджеров в диалогах."""

import asyncio
import pytest
from unittest.mock import MagicMock, patch

from services.sse_manager import SSEManager
from services.sse_event import SSEEvent


@pytest.fixture
def manager():
    """Чистый SSEManager для каждого теста."""
    mgr = SSEManager()
    # Мокаем publish_via_redis чтобы не вызывать реальный Redis/publish
    mgr.publish_via_redis = MagicMock()
    return mgr


class TestSetDialogFocus:
    """Тесты set_dialog_focus — установка фокуса менеджера."""

    def test_sets_focus(self, manager):
        """set_dialog_focus фиксирует менеджера в словаре."""
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Иван")
        key = ("proj_1", 100)
        assert key in manager._dialog_focus
        assert "m1" in manager._dialog_focus[key]
        assert manager._dialog_focus[key]["m1"]["name"] == "Иван"

    def test_publishes_enter_event(self, manager):
        """set_dialog_focus публикует событие с action=enter."""
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Иван")
        manager.publish_via_redis.assert_called_once()
        event_arg = manager.publish_via_redis.call_args[0][0]
        assert isinstance(event_arg, SSEEvent)
        assert event_arg.data["action"] == "enter"
        assert event_arg.data["manager_id"] == "m1"

    def test_multiple_managers_same_dialog(self, manager):
        """Два менеджера в одном диалоге — оба в словаре."""
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Иван")
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m2", manager_name="Пётр")
        key = ("proj_1", 100)
        assert len(manager._dialog_focus[key]) == 2

    def test_records_timestamp(self, manager):
        """set_dialog_focus сохраняет timestamp."""
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Тест")
        info = manager._dialog_focus[("proj_1", 100)]["m1"]
        assert "ts" in info
        assert isinstance(info["ts"], float)


class TestRemoveDialogFocus:
    """Тесты remove_dialog_focus — удаление фокуса менеджера."""

    def test_removes_focus(self, manager):
        """remove_dialog_focus удаляет менеджера из словаря."""
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Иван")
        manager.remove_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Иван")
        key = ("proj_1", 100)
        # Ключ удаляется если менеджеров не осталось
        assert key not in manager._dialog_focus

    def test_publishes_leave_event(self, manager):
        """remove_dialog_focus публикует событие с action=leave."""
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Иван")
        manager.publish_via_redis.reset_mock()
        manager.remove_dialog_focus("proj_1", vk_user_id=100, manager_id="m1")
        manager.publish_via_redis.assert_called_once()
        event_arg = manager.publish_via_redis.call_args[0][0]
        assert event_arg.data["action"] == "leave"

    def test_keeps_other_managers(self, manager):
        """Удаление одного менеджера не влияет на другого в том же диалоге."""
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Иван")
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m2", manager_name="Пётр")
        manager.remove_dialog_focus("proj_1", vk_user_id=100, manager_id="m1")
        key = ("proj_1", 100)
        assert "m2" in manager._dialog_focus[key]
        assert "m1" not in manager._dialog_focus[key]

    def test_remove_nonexistent_no_error(self, manager):
        """Удаление несуществующего фокуса не вызывает ошибки."""
        manager.remove_dialog_focus("proj_1", vk_user_id=999, manager_id="m_unknown")
        # Не должно быть исключения


class TestGetDialogFocus:
    """Тесты get_dialog_focus — получение фокуса по диалогу."""

    def test_returns_list_of_managers(self, manager):
        """get_dialog_focus возвращает список менеджеров в диалоге."""
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Иван")
        result = manager.get_dialog_focus("proj_1", vk_user_id=100)
        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]["manager_id"] == "m1"
        assert result[0]["manager_name"] == "Иван"

    def test_empty_for_unknown_dialog(self, manager):
        """get_dialog_focus для неизвестного диалога — пустой список."""
        result = manager.get_dialog_focus("proj_1", vk_user_id=999)
        assert result == []

    def test_multiple_managers(self, manager):
        """Несколько менеджеров в одном диалоге."""
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Иван")
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m2", manager_name="Пётр")
        result = manager.get_dialog_focus("proj_1", vk_user_id=100)
        ids = {r["manager_id"] for r in result}
        assert ids == {"m1", "m2"}


class TestGetAllDialogFocuses:
    """Тесты get_all_dialog_focuses — все фокусы по проекту."""

    def test_returns_dict(self, manager):
        """get_all_dialog_focuses возвращает Dict[int, list]."""
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Иван")
        result = manager.get_all_dialog_focuses("proj_1")
        assert isinstance(result, dict)
        assert 100 in result
        assert len(result[100]) == 1

    def test_multiple_dialogs(self, manager):
        """Несколько диалогов в одном проекте."""
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Иван")
        manager.set_dialog_focus("proj_1", vk_user_id=200, manager_id="m2", manager_name="Пётр")
        result = manager.get_all_dialog_focuses("proj_1")
        assert len(result) == 2
        assert 100 in result
        assert 200 in result

    def test_filters_by_project(self, manager):
        """Возвращает фокусы только для указанного проекта."""
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Иван")
        manager.set_dialog_focus("proj_2", vk_user_id=200, manager_id="m2", manager_name="Пётр")
        result = manager.get_all_dialog_focuses("proj_1")
        assert 100 in result
        assert 200 not in result

    def test_empty_for_unknown_project(self, manager):
        """Пустой dict для неизвестного проекта."""
        result = manager.get_all_dialog_focuses("unknown_proj")
        assert result == {}


class TestCleanupFocusForManager:
    """Тесты _cleanup_focus_for_manager — очистка при disconnect."""

    def test_removes_manager_from_all_dialogs(self, manager):
        """_cleanup_focus_for_manager удаляет менеджера из всех диалогов проекта."""
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Иван")
        manager.set_dialog_focus("proj_1", vk_user_id=200, manager_id="m1", manager_name="Иван")
        manager.publish_via_redis.reset_mock()
        manager._cleanup_focus_for_manager("proj_1", "m1")
        # Оба диалога очищены
        assert manager.get_dialog_focus("proj_1", vk_user_id=100) == []
        assert manager.get_dialog_focus("proj_1", vk_user_id=200) == []

    def test_publishes_leave_for_each_dialog(self, manager):
        """При cleanup публикуется leave для каждого диалога."""
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Иван")
        manager.set_dialog_focus("proj_1", vk_user_id=200, manager_id="m1", manager_name="Иван")
        manager.publish_via_redis.reset_mock()
        manager._cleanup_focus_for_manager("proj_1", "m1")
        # 2 вызова publish_via_redis (по одному на каждый диалог)
        assert manager.publish_via_redis.call_count == 2

    def test_keeps_other_managers(self, manager):
        """Cleanup одного менеджера не трогает другого."""
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m1", manager_name="Иван")
        manager.set_dialog_focus("proj_1", vk_user_id=100, manager_id="m2", manager_name="Пётр")
        manager.publish_via_redis.reset_mock()
        manager._cleanup_focus_for_manager("proj_1", "m1")
        result = manager.get_dialog_focus("proj_1", vk_user_id=100)
        assert len(result) == 1
        assert result[0]["manager_id"] == "m2"

    def test_cleanup_nonexistent_no_error(self, manager):
        """Cleanup несуществующего менеджера не вызывает ошибки."""
        manager._cleanup_focus_for_manager("proj_1", "m_unknown")


class TestApplyDialogFocusFromEvent:
    """Тесты _apply_dialog_focus_from_event — синхронизация из Redis."""

    def test_enter_adds_focus(self, manager):
        """Событие enter добавляет фокус."""
        event = SSEEvent(
            event_type="dialog_focus",
            project_id="proj_1",
            data={
                "vk_user_id": 100,
                "manager_id": "m_remote",
                "manager_name": "Удалённый",
                "action": "enter",
            },
        )
        manager._apply_dialog_focus_from_event(event)
        result = manager.get_dialog_focus("proj_1", vk_user_id=100)
        assert len(result) == 1
        assert result[0]["manager_id"] == "m_remote"

    def test_leave_removes_focus(self, manager):
        """Событие leave удаляет фокус."""
        # Сначала enter
        enter_event = SSEEvent(
            event_type="dialog_focus", project_id="proj_1",
            data={"vk_user_id": 100, "manager_id": "m1", "manager_name": "Тест", "action": "enter"},
        )
        manager._apply_dialog_focus_from_event(enter_event)
        # Потом leave
        leave_event = SSEEvent(
            event_type="dialog_focus", project_id="proj_1",
            data={"vk_user_id": 100, "manager_id": "m1", "manager_name": "Тест", "action": "leave"},
        )
        manager._apply_dialog_focus_from_event(leave_event)
        assert manager.get_dialog_focus("proj_1", vk_user_id=100) == []

    def test_incomplete_event_ignored(self, manager):
        """Событие с неполными данными игнорируется."""
        event = SSEEvent(
            event_type="dialog_focus", project_id="proj_1",
            data={"vk_user_id": 100},  # Нет manager_id и action
        )
        manager._apply_dialog_focus_from_event(event)
        assert manager.get_dialog_focus("proj_1", vk_user_id=100) == []
