"""
Тесты для routers/user_activity.py — дашборд активности пользователей.
Все запросы к БД и CRUD замоканы. Реальная БД не используется.
"""
import pytest
import sys
import os
from unittest.mock import MagicMock, patch, PropertyMock
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


def _make_admin():
    """Создаёт мок администратора."""
    from services.auth_middleware import CurrentUser
    return CurrentUser(
        user_id="admin-1",
        username="admin",
        role="admin",
        user_type="internal",
        session_id="s1",
        full_name="Admin",
    )


def _build_mock_db():
    """
    Собирает MagicMock для db (Session), который корректно отвечает
    на цепочки db.query(...).filter(...).scalar() / .group_by(...).all() и т.д.
    """
    mock_db = MagicMock()

    # --- Хелпер: любой вызов .query() возвращает объект-цепочку ---
    chain = MagicMock()
    # Скаляры по умолчанию — 0
    chain.scalar.return_value = 0
    # .all() по умолчанию — пустой список
    chain.all.return_value = []
    # Любой .filter / .group_by / .order_by возвращает ту же цепочку
    chain.filter.return_value = chain
    chain.group_by.return_value = chain
    chain.order_by.return_value = chain

    mock_db.query.return_value = chain
    return mock_db


class TestActivityDashboardKeys:
    """Проверяем структуру ответа /user-activity/dashboard."""

    @patch("routers.user_activity.user_action_crud")
    def test_dashboard_returns_all_required_keys(self, mock_action_crud):
        """Ответ содержит все 8 ключей верхнего уровня."""
        from routers.user_activity import get_activity_dashboard, ActivityDashboardPayload

        mock_action_crud.get_actions_summary.return_value = {}
        mock_action_crud.get_user_actions_stats.return_value = []
        mock_action_crud.get_daily_actions.return_value = []

        payload = ActivityDashboardPayload(period_days=30)
        mock_db = _build_mock_db()
        mock_admin = _make_admin()

        result = get_activity_dashboard(payload=payload, db=mock_db, admin=mock_admin)

        expected_keys = {
            "summary", "user_stats", "daily_chart",
            "hourly_chart", "events_chart", "actions_summary",
            "user_actions_stats", "daily_actions",
        }
        assert expected_keys == set(result.keys()), (
            f"Отсутствуют ключи: {expected_keys - set(result.keys())}"
        )

    @patch("routers.user_activity.user_action_crud")
    def test_dashboard_summary_structure(self, mock_action_crud):
        """summary содержит все KPI-поля."""
        from routers.user_activity import get_activity_dashboard, ActivityDashboardPayload

        mock_action_crud.get_actions_summary.return_value = {}
        mock_action_crud.get_user_actions_stats.return_value = []
        mock_action_crud.get_daily_actions.return_value = []

        result = get_activity_dashboard(
            payload=ActivityDashboardPayload(period_days=7),
            db=_build_mock_db(),
            admin=_make_admin(),
        )

        summary = result["summary"]
        required_fields = {
            "total_active_users", "total_logins", "total_failed_logins",
            "total_timeouts", "total_force_logouts", "online_now",
            "avg_session_minutes", "period_days",
        }
        assert required_fields.issubset(set(summary.keys()))

    @patch("routers.user_activity.user_action_crud")
    def test_dashboard_period_days_passed_through(self, mock_action_crud):
        """period_days из payload отражается в summary."""
        from routers.user_activity import get_activity_dashboard, ActivityDashboardPayload

        mock_action_crud.get_actions_summary.return_value = {}
        mock_action_crud.get_user_actions_stats.return_value = []
        mock_action_crud.get_daily_actions.return_value = []

        result = get_activity_dashboard(
            payload=ActivityDashboardPayload(period_days=90),
            db=_build_mock_db(),
            admin=_make_admin(),
        )

        assert result["summary"]["period_days"] == 90


class TestActivityDashboardOptionalFields:
    """Проверяем опциональные поля: actions_summary, user_actions_stats, daily_actions."""

    @patch("routers.user_activity.user_action_crud")
    def test_actions_summary_empty_dict(self, mock_action_crud):
        """Если get_actions_summary вернул пустой dict — поле есть, пустой dict."""
        from routers.user_activity import get_activity_dashboard, ActivityDashboardPayload

        mock_action_crud.get_actions_summary.return_value = {}
        mock_action_crud.get_user_actions_stats.return_value = []
        mock_action_crud.get_daily_actions.return_value = []

        result = get_activity_dashboard(
            payload=ActivityDashboardPayload(period_days=30),
            db=_build_mock_db(),
            admin=_make_admin(),
        )

        assert result["actions_summary"] == {}

    @patch("routers.user_activity.user_action_crud")
    def test_actions_summary_with_data(self, mock_action_crud):
        """actions_summary с реальными данными — прокидывается как есть."""
        from routers.user_activity import get_activity_dashboard, ActivityDashboardPayload

        mock_action_crud.get_actions_summary.return_value = {
            "total_actions": 150,
            "unique_users": 5,
            "top_category": "posts",
        }
        mock_action_crud.get_user_actions_stats.return_value = []
        mock_action_crud.get_daily_actions.return_value = []

        result = get_activity_dashboard(
            payload=ActivityDashboardPayload(period_days=30),
            db=_build_mock_db(),
            admin=_make_admin(),
        )

        assert result["actions_summary"]["total_actions"] == 150

    @patch("routers.user_activity.user_action_crud")
    def test_user_actions_stats_list(self, mock_action_crud):
        """user_actions_stats — список (может быть пустой)."""
        from routers.user_activity import get_activity_dashboard, ActivityDashboardPayload

        mock_action_crud.get_actions_summary.return_value = {}
        mock_action_crud.get_user_actions_stats.return_value = [
            {"user_id": "u1", "action_count": 42},
        ]
        mock_action_crud.get_daily_actions.return_value = []

        result = get_activity_dashboard(
            payload=ActivityDashboardPayload(period_days=14),
            db=_build_mock_db(),
            admin=_make_admin(),
        )

        assert isinstance(result["user_actions_stats"], list)
        assert len(result["user_actions_stats"]) == 1

    @patch("routers.user_activity.user_action_crud")
    def test_daily_actions_list(self, mock_action_crud):
        """daily_actions — список."""
        from routers.user_activity import get_activity_dashboard, ActivityDashboardPayload

        mock_action_crud.get_actions_summary.return_value = {}
        mock_action_crud.get_user_actions_stats.return_value = []
        mock_action_crud.get_daily_actions.return_value = [
            {"date": "2026-03-01", "count": 10},
            {"date": "2026-03-02", "count": 20},
        ]

        result = get_activity_dashboard(
            payload=ActivityDashboardPayload(period_days=7),
            db=_build_mock_db(),
            admin=_make_admin(),
        )

        assert isinstance(result["daily_actions"], list)
        assert len(result["daily_actions"]) == 2


class TestActivityDashboardCharts:
    """Проверяем формирование графиков при пустых данных из БД."""

    @patch("routers.user_activity.user_action_crud")
    def test_hourly_chart_has_24_entries(self, mock_action_crud):
        """hourly_chart всегда содержит 24 записи (по часам 0..23)."""
        from routers.user_activity import get_activity_dashboard, ActivityDashboardPayload

        mock_action_crud.get_actions_summary.return_value = {}
        mock_action_crud.get_user_actions_stats.return_value = []
        mock_action_crud.get_daily_actions.return_value = []

        result = get_activity_dashboard(
            payload=ActivityDashboardPayload(period_days=30),
            db=_build_mock_db(),
            admin=_make_admin(),
        )

        hourly = result["hourly_chart"]
        assert len(hourly) == 24
        # Каждый элемент имеет hour и count
        for entry in hourly:
            assert "hour" in entry
            assert "count" in entry

    @patch("routers.user_activity.user_action_crud")
    def test_daily_chart_empty_when_no_logs(self, mock_action_crud):
        """daily_chart пуст, если нет логов за период."""
        from routers.user_activity import get_activity_dashboard, ActivityDashboardPayload

        mock_action_crud.get_actions_summary.return_value = {}
        mock_action_crud.get_user_actions_stats.return_value = []
        mock_action_crud.get_daily_actions.return_value = []

        result = get_activity_dashboard(
            payload=ActivityDashboardPayload(period_days=7),
            db=_build_mock_db(),
            admin=_make_admin(),
        )

        assert result["daily_chart"] == []

    @patch("routers.user_activity.user_action_crud")
    def test_events_chart_empty_when_no_logs(self, mock_action_crud):
        """events_chart пуст, если нет логов за период."""
        from routers.user_activity import get_activity_dashboard, ActivityDashboardPayload

        mock_action_crud.get_actions_summary.return_value = {}
        mock_action_crud.get_user_actions_stats.return_value = []
        mock_action_crud.get_daily_actions.return_value = []

        result = get_activity_dashboard(
            payload=ActivityDashboardPayload(period_days=30),
            db=_build_mock_db(),
            admin=_make_admin(),
        )

        assert result["events_chart"] == []

    @patch("routers.user_activity.user_action_crud")
    def test_user_stats_empty_when_no_logs(self, mock_action_crud):
        """user_stats пуст, если нет логов за период."""
        from routers.user_activity import get_activity_dashboard, ActivityDashboardPayload

        mock_action_crud.get_actions_summary.return_value = {}
        mock_action_crud.get_user_actions_stats.return_value = []
        mock_action_crud.get_daily_actions.return_value = []

        result = get_activity_dashboard(
            payload=ActivityDashboardPayload(period_days=30),
            db=_build_mock_db(),
            admin=_make_admin(),
        )

        assert result["user_stats"] == []


class TestActivityDashboardDefaults:
    """Проверяем дефолтные значения для числовых полей."""

    @patch("routers.user_activity.user_action_crud")
    def test_summary_defaults_are_zero(self, mock_action_crud):
        """Все числовые KPI по умолчанию равны 0."""
        from routers.user_activity import get_activity_dashboard, ActivityDashboardPayload

        mock_action_crud.get_actions_summary.return_value = {}
        mock_action_crud.get_user_actions_stats.return_value = []
        mock_action_crud.get_daily_actions.return_value = []

        result = get_activity_dashboard(
            payload=ActivityDashboardPayload(period_days=30),
            db=_build_mock_db(),
            admin=_make_admin(),
        )

        s = result["summary"]
        assert s["total_active_users"] == 0
        assert s["total_logins"] == 0
        assert s["total_failed_logins"] == 0
        assert s["total_timeouts"] == 0
        assert s["total_force_logouts"] == 0
        assert s["online_now"] == 0
        assert s["avg_session_minutes"] == 0

    @patch("routers.user_activity.user_action_crud")
    def test_crud_called_with_period_days(self, mock_action_crud):
        """user_action_crud вызывается с правильным period_days."""
        from routers.user_activity import get_activity_dashboard, ActivityDashboardPayload

        mock_action_crud.get_actions_summary.return_value = {}
        mock_action_crud.get_user_actions_stats.return_value = []
        mock_action_crud.get_daily_actions.return_value = []

        get_activity_dashboard(
            payload=ActivityDashboardPayload(period_days=14),
            db=_build_mock_db(),
            admin=_make_admin(),
        )

        mock_action_crud.get_actions_summary.assert_called_once()
        call_args = mock_action_crud.get_actions_summary.call_args
        # Второй аргумент — period_days
        assert call_args[0][1] == 14 or call_args[1].get("period_days") == 14 or call_args[0][-1] == 14
