"""
Тесты для routers/message_actions.py — АМ-аналитика: дашборд действий сотрудников.
Тестируем:
- Маппинги ACTION_TYPE_LABELS и ACTION_GROUPS
- Логику агрегации endpoint /dashboard (через мок БД)
- Формирование ответа: summary, user_stats, action_distribution, group_distribution, daily_chart
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch, PropertyMock
from datetime import datetime, timedelta

# Добавляем корень бэкенда в sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# =============================================================================
# Тесты маппингов
# =============================================================================

class TestActionMappings:
    """Проверяем словари маппинга action_type → label и группы."""

    def test_action_type_labels_not_empty(self):
        from routers.message_actions import ACTION_TYPE_LABELS
        assert len(ACTION_TYPE_LABELS) > 0

    def test_action_type_labels_all_strings(self):
        from routers.message_actions import ACTION_TYPE_LABELS
        for key, val in ACTION_TYPE_LABELS.items():
            assert isinstance(key, str), f"Ключ {key} не строка"
            assert isinstance(val, str), f"Значение {val} не строка"
            assert len(val) > 0, f"Пустой label для {key}"

    def test_action_groups_not_empty(self):
        from routers.message_actions import ACTION_GROUPS
        assert len(ACTION_GROUPS) > 0

    def test_action_groups_contain_known_groups(self):
        from routers.message_actions import ACTION_GROUPS
        expected = {"dialogs", "messages", "labels", "templates", "promocodes"}
        assert set(ACTION_GROUPS.keys()) == expected

    def test_all_action_types_in_groups(self):
        """Каждый action_type из LABELS должен быть в одной из групп."""
        from routers.message_actions import ACTION_TYPE_LABELS, ACTION_GROUPS
        grouped_types = set()
        for types in ACTION_GROUPS.values():
            grouped_types.update(types)
        for action_type in ACTION_TYPE_LABELS:
            assert action_type in grouped_types, f"{action_type} не попал ни в одну группу"

    def test_action_group_labels_match_groups(self):
        from routers.message_actions import ACTION_GROUPS, ACTION_GROUP_LABELS
        for group in ACTION_GROUPS:
            assert group in ACTION_GROUP_LABELS, f"Группа {group} без label"

    def test_dialogs_group_types(self):
        from routers.message_actions import ACTION_GROUPS
        expected = {
            "message_dialog_read", "message_unread_dialog_read", "message_mark_unread",
            "message_mark_all_read", "message_toggle_important",
        }
        assert set(ACTION_GROUPS["dialogs"]) == expected

    def test_messages_group_types(self):
        from routers.message_actions import ACTION_GROUPS
        assert ACTION_GROUPS["messages"] == ["message_send"]

    def test_labels_group_types(self):
        from routers.message_actions import ACTION_GROUPS
        expected = {
            "dialog_label_create", "dialog_label_update", "dialog_label_delete",
            "dialog_label_assign", "dialog_label_unassign", "dialog_label_set",
        }
        assert set(ACTION_GROUPS["labels"]) == expected

    def test_templates_group_types(self):
        from routers.message_actions import ACTION_GROUPS
        expected = {"template_create", "template_update", "template_delete"}
        assert set(ACTION_GROUPS["templates"]) == expected

    def test_promocodes_group_types(self):
        from routers.message_actions import ACTION_GROUPS
        expected = {
            "promo_list_create", "promo_list_update", "promo_list_delete",
            "promo_codes_add", "promo_code_delete", "promo_codes_delete_all_free",
        }
        assert set(ACTION_GROUPS["promocodes"]) == expected


# =============================================================================
# Тесты endpoint: dashboard
# =============================================================================

class TestDashboardEndpoint:
    """Тесты для POST /messages/actions-analysis/dashboard."""

    def _make_mock_db(self):
        """Создаёт мок БД, который возвращает 0/[] по умолчанию."""
        db = MagicMock()
        # Цепочки query → filter → scalar
        db.query.return_value.filter.return_value.scalar.return_value = 0
        # Цепочки query → filter → group_by → order_by → all
        db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = []
        return db

    def _make_admin_user(self):
        """Мок CurrentUser (admin)."""
        from services.auth_middleware import CurrentUser
        return CurrentUser(
            user_id="admin-1",
            username="test_admin",
            role="admin",
            user_type="system",
            session_id="sess-1",
            full_name="Test Admin",
        )

    @patch("routers.message_actions.get_current_admin")
    @patch("routers.message_actions.get_db")
    def test_dashboard_returns_all_sections(self, mock_get_db, mock_get_admin):
        """Endpoint возвращает все 5 секций + action_type_labels."""
        from routers.message_actions import get_am_analysis_dashboard

        mock_db = self._make_mock_db()
        admin = self._make_admin_user()

        result = get_am_analysis_dashboard(period_days=30, db=mock_db, current_user=admin)

        assert "summary" in result
        assert "user_stats" in result
        assert "action_distribution" in result
        assert "group_distribution" in result
        assert "daily_chart" in result
        assert "action_type_labels" in result

    @patch("routers.message_actions.get_current_admin")
    @patch("routers.message_actions.get_db")
    def test_summary_has_required_fields(self, mock_get_db, mock_get_admin):
        """Summary содержит все KPI-поля."""
        from routers.message_actions import get_am_analysis_dashboard

        mock_db = self._make_mock_db()
        admin = self._make_admin_user()

        result = get_am_analysis_dashboard(period_days=7, db=mock_db, current_user=admin)
        summary = result["summary"]

        expected_keys = {
            "total_actions", "active_users", "total_dialogs_read",
            "total_unread_dialogs_read", "total_messages_sent",
            "total_labels_actions", "total_templates_actions", "period_days",
        }
        assert set(summary.keys()) == expected_keys

    @patch("routers.message_actions.get_current_admin")
    @patch("routers.message_actions.get_db")
    def test_summary_period_days_passed_through(self, mock_get_db, mock_get_admin):
        """period_days из запроса отражается в summary."""
        from routers.message_actions import get_am_analysis_dashboard

        mock_db = self._make_mock_db()
        admin = self._make_admin_user()

        result = get_am_analysis_dashboard(period_days=90, db=mock_db, current_user=admin)
        assert result["summary"]["period_days"] == 90

    @patch("routers.message_actions.get_current_admin")
    @patch("routers.message_actions.get_db")
    def test_empty_db_returns_zeros(self, mock_get_db, mock_get_admin):
        """Пустая БД → нули во всех KPI."""
        from routers.message_actions import get_am_analysis_dashboard

        mock_db = self._make_mock_db()
        admin = self._make_admin_user()

        result = get_am_analysis_dashboard(period_days=30, db=mock_db, current_user=admin)
        summary = result["summary"]

        assert summary["total_actions"] == 0
        assert summary["active_users"] == 0
        assert summary["total_dialogs_read"] == 0
        assert summary["total_unread_dialogs_read"] == 0
        assert summary["total_messages_sent"] == 0
        assert summary["total_labels_actions"] == 0
        assert summary["total_templates_actions"] == 0

    @patch("routers.message_actions.get_current_admin")
    @patch("routers.message_actions.get_db")
    def test_empty_db_returns_empty_lists(self, mock_get_db, mock_get_admin):
        """Пустая БД → пустые списки."""
        from routers.message_actions import get_am_analysis_dashboard

        mock_db = self._make_mock_db()
        admin = self._make_admin_user()

        result = get_am_analysis_dashboard(period_days=30, db=mock_db, current_user=admin)

        assert result["user_stats"] == []
        assert result["action_distribution"] == []
        assert result["group_distribution"] == []
        assert result["daily_chart"] == []

    @patch("routers.message_actions.get_current_admin")
    @patch("routers.message_actions.get_db")
    def test_action_type_labels_in_response(self, mock_get_db, mock_get_admin):
        """Ответ содержит словарь action_type_labels."""
        from routers.message_actions import get_am_analysis_dashboard, ACTION_TYPE_LABELS

        mock_db = self._make_mock_db()
        admin = self._make_admin_user()

        result = get_am_analysis_dashboard(period_days=30, db=mock_db, current_user=admin)
        assert result["action_type_labels"] == ACTION_TYPE_LABELS

    @patch("routers.message_actions.get_current_admin")
    @patch("routers.message_actions.get_db")
    def test_default_period_is_30(self, mock_get_db, mock_get_admin):
        """Дефолтный period_days=30 — вызываем как int."""
        from routers.message_actions import get_am_analysis_dashboard

        mock_db = self._make_mock_db()
        admin = self._make_admin_user()

        # Вызываем с дефолтным значением (int, не Query)
        result = get_am_analysis_dashboard(period_days=30, db=mock_db, current_user=admin)
        assert result["summary"]["period_days"] == 30


# =============================================================================
# Тесты: проверка что роутер имеет правильный prefix и methods
# =============================================================================

class TestRouterConfig:
    """Проверяем конфигурацию роутера."""

    def test_router_prefix(self):
        from routers.message_actions import router
        assert router.prefix == "/messages/actions-analysis"

    def test_router_has_dashboard_route(self):
        from routers.message_actions import router
        paths = [route.path for route in router.routes]
        # Путь включает prefix роутера
        matching = [p for p in paths if p.endswith("/dashboard")]
        assert len(matching) > 0, f"Путь dashboard не найден в {paths}"

    def test_dashboard_accepts_post(self):
        from routers.message_actions import router
        for route in router.routes:
            if route.path.endswith("/dashboard"):
                assert "POST" in route.methods
                break
        else:
            pytest.fail("Route /dashboard не найден")

    def test_router_tags(self):
        from routers.message_actions import router
        assert "AM Analysis" in router.tags
