"""
Тесты для CRUD-операций с бизнес-действиями пользователей.
Тестируемый модуль: crud/user_action_crud.py
"""
import pytest
import sys
import os
import json
from unittest.mock import MagicMock, patch
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


# =============================================
# log_action
# =============================================

class TestLogAction:
    """Тесты записи бизнес-действия пользователя (с коммитом)."""

    @patch("crud.user_action_crud.uuid")
    @patch("crud.user_action_crud.datetime")
    def test_создание_действия_с_metadata(self, mock_dt, mock_uuid, mock_db):
        """Создаёт UserAction с metadata (dict → JSON-строка), вызывает db.add и db.commit."""
        from crud.user_action_crud import log_action

        mock_uuid.uuid4.return_value = "action-uuid-1"
        mock_dt.utcnow.return_value = datetime(2026, 3, 1, 12, 0, 0)

        result = log_action(
            db=mock_db,
            user_id="user-1",
            username="ivanov",
            action_type="post_publish",
            action_category="posts",
            entity_type="post",
            entity_id="post-123",
            project_id="proj-1",
            metadata={"title": "Мой пост", "char_count": 500},
        )

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

        action = mock_db.add.call_args[0][0]
        assert action.id == "action-uuid-1"
        assert action.user_id == "user-1"
        assert action.username == "ivanov"
        assert action.action_type == "post_publish"
        assert action.action_category == "posts"
        assert action.entity_type == "post"
        assert action.entity_id == "post-123"
        assert action.project_id == "proj-1"
        # metadata должна быть сериализована в JSON
        parsed = json.loads(action.action_metadata)
        assert parsed["title"] == "Мой пост"
        assert parsed["char_count"] == 500

    @patch("crud.user_action_crud.uuid")
    @patch("crud.user_action_crud.datetime")
    def test_создание_действия_без_metadata(self, mock_dt, mock_uuid, mock_db):
        """Если metadata=None — action_metadata тоже None."""
        from crud.user_action_crud import log_action

        mock_uuid.uuid4.return_value = "action-uuid-2"
        mock_dt.utcnow.return_value = datetime(2026, 3, 1, 12, 0, 0)

        log_action(
            db=mock_db,
            user_id="user-2",
            username="petrov",
            action_type="message_send",
            action_category="messages",
        )

        action = mock_db.add.call_args[0][0]
        assert action.action_metadata is None
        assert action.entity_type is None
        assert action.entity_id is None

    @patch("crud.user_action_crud.uuid")
    @patch("crud.user_action_crud.datetime")
    def test_все_поля_заполнены(self, mock_dt, mock_uuid, mock_db):
        """Проверяет, что все обязательные поля присутствуют у созданного объекта."""
        from crud.user_action_crud import log_action

        mock_uuid.uuid4.return_value = "action-uuid-3"
        mock_dt.utcnow.return_value = datetime(2026, 3, 1, 15, 30, 0)

        log_action(
            db=mock_db,
            user_id="user-3",
            username="sidorov",
            action_type="ai_generate_text",
            action_category="ai",
            entity_type="ai_text",
            entity_id="gen-42",
            project_id="proj-5",
        )

        action = mock_db.add.call_args[0][0]
        assert action.created_at == datetime(2026, 3, 1, 15, 30, 0)
        assert action.action_type == "ai_generate_text"
        assert action.action_category == "ai"


# =============================================
# log_action_no_commit
# =============================================

class TestLogActionNoCommit:
    """Тесты записи действия БЕЗ коммита (внутри чужой транзакции)."""

    @patch("crud.user_action_crud.uuid")
    @patch("crud.user_action_crud.datetime")
    def test_db_add_вызван(self, mock_dt, mock_uuid, mock_db):
        """Объект добавляется в сессию через db.add."""
        from crud.user_action_crud import log_action_no_commit

        mock_uuid.uuid4.return_value = "nc-uuid-1"
        mock_dt.utcnow.return_value = datetime(2026, 3, 1, 12, 0, 0)

        result = log_action_no_commit(
            db=mock_db,
            user_id="user-1",
            username="ivanov",
            action_type="post_create",
            action_category="posts",
        )

        mock_db.add.assert_called_once()
        action = mock_db.add.call_args[0][0]
        assert action.id == "nc-uuid-1"
        assert action.action_type == "post_create"

    @patch("crud.user_action_crud.uuid")
    @patch("crud.user_action_crud.datetime")
    def test_db_commit_не_вызван(self, mock_dt, mock_uuid, mock_db):
        """db.commit() НЕ вызывается — коммит остаётся на стороне вызывающего кода."""
        from crud.user_action_crud import log_action_no_commit

        mock_uuid.uuid4.return_value = "nc-uuid-2"
        mock_dt.utcnow.return_value = datetime(2026, 3, 1, 12, 0, 0)

        log_action_no_commit(
            db=mock_db,
            user_id="user-1",
            username="ivanov",
            action_type="post_delete",
            action_category="posts",
        )

        mock_db.commit.assert_not_called()

    @patch("crud.user_action_crud.uuid")
    @patch("crud.user_action_crud.datetime")
    def test_metadata_сериализация(self, mock_dt, mock_uuid, mock_db):
        """Metadata корректно сериализуется в JSON даже без коммита."""
        from crud.user_action_crud import log_action_no_commit

        mock_uuid.uuid4.return_value = "nc-uuid-3"
        mock_dt.utcnow.return_value = datetime(2026, 3, 1, 12, 0, 0)

        log_action_no_commit(
            db=mock_db,
            user_id="user-1",
            username="ivanov",
            action_type="bulk_edit",
            action_category="other",
            metadata={"count": 15},
        )

        action = mock_db.add.call_args[0][0]
        assert json.loads(action.action_metadata) == {"count": 15}


# =============================================
# get_actions_summary
# =============================================

class TestGetActionsSummary:
    """Тесты агрегированной сводки действий за период."""

    def test_формат_ответа_пустые_данные(self, mock_db):
        """При пустых данных возвращает корректную структуру с нулями."""
        from crud.user_action_crud import get_actions_summary

        # scalar() возвращает 0 для total и active_doers
        mock_db.query.return_value.filter.return_value.scalar.return_value = 0
        # group_by().order_by().all() и limit().all() возвращают []
        mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = []
        mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.return_value = []

        result = get_actions_summary(mock_db, period_days=30)

        assert "total_actions" in result
        assert "active_doers" in result
        assert "top_categories" in result
        assert "top_actions" in result
        assert result["total_actions"] == 0
        assert result["active_doers"] == 0
        assert result["top_categories"] == []
        assert result["top_actions"] == []

    def test_с_данными_категории_и_действия(self, mock_db):
        """Возвращает top_categories и top_actions с правильным форматом."""
        from crud.user_action_crud import get_actions_summary

        # Мокируем scalar вызовы — для total_actions и active_doers
        mock_db.query.return_value.filter.return_value.scalar.side_effect = [42, 5]

        cat1 = MagicMock(action_category="posts", cnt=20)
        cat2 = MagicMock(action_category="messages", cnt=15)
        act1 = MagicMock(action_type="post_publish", cnt=12)
        act2 = MagicMock(action_type="message_send", cnt=10)

        mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = [cat1, cat2]
        mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.return_value = [act1, act2]

        result = get_actions_summary(mock_db, period_days=7)

        assert result["total_actions"] == 42
        assert result["active_doers"] == 5
        assert len(result["top_categories"]) == 2
        assert result["top_categories"][0] == {"category": "posts", "count": 20}
        assert len(result["top_actions"]) == 2
        assert result["top_actions"][0] == {"action_type": "post_publish", "count": 12}

    def test_period_days_параметр(self, mock_db):
        """Проверяет, что функция принимает различные значения period_days."""
        from crud.user_action_crud import get_actions_summary

        mock_db.query.return_value.filter.return_value.scalar.return_value = 0
        mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = []
        mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.return_value = []

        # Не должно падать с разными значениями period_days
        for days in [1, 7, 30, 90, 365]:
            result = get_actions_summary(mock_db, period_days=days)
            assert isinstance(result, dict)


# =============================================
# get_user_actions_stats
# =============================================

class TestGetUserActionsStats:
    """Тесты статистики действий по пользователям."""

    def test_формат_выхода_с_ролью(self, mock_db):
        """Пользователь с ролью — role_name и role_color заполнены."""
        from crud.user_action_crud import get_user_actions_stats

        user_row = MagicMock(
            user_id="u1",
            username="ivanov",
            total=25,
            posts=10,
            messages=8,
            market=3,
            ai=2,
            contests=1,
            automations=1,
            last_action_at=datetime(2026, 3, 1, 14, 0, 0),
        )

        mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = [user_row]

        # Мок юзеров (для ФИО и role_id)
        user_info = MagicMock(id="u1", full_name="Иванов Иван", role_id="r1")
        # Мок ролей
        role_info = MagicMock(id="r1", color="indigo")
        role_info.name = "SMM-менеджер"

        # Второй вызов filter().all() — юзеры, третий — роли
        mock_db.query.return_value.filter.return_value.all.side_effect = [[user_info], [role_info]]

        result = get_user_actions_stats(mock_db, period_days=30)

        assert len(result) == 1
        r = result[0]
        assert r["user_id"] == "u1"
        assert r["username"] == "ivanov"
        assert r["full_name"] == "Иванов Иван"
        assert r["role_name"] == "SMM-менеджер"
        assert r["role_color"] == "indigo"
        assert r["total_actions"] == 25
        assert len(r["categories"]) == 6
        assert r["categories"][0] == {"category": "posts", "count": 10}
        assert r["last_action_at"] == "2026-03-01T14:00:00"

    def test_пользователь_без_роли(self, mock_db):
        """role_name и role_color = None у пользователя без роли."""
        from crud.user_action_crud import get_user_actions_stats

        user_row = MagicMock(
            user_id="u2",
            username="petrov",
            total=5,
            posts=2,
            messages=3,
            market=0,
            ai=0,
            contests=0,
            automations=0,
            last_action_at=datetime(2026, 2, 28, 10, 0, 0),
        )

        mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = [user_row]

        user_info = MagicMock(id="u2", full_name="Петров Пётр", role_id=None)
        mock_db.query.return_value.filter.return_value.all.side_effect = [[user_info]]

        result = get_user_actions_stats(mock_db, period_days=30)

        assert len(result) == 1
        assert result[0]["role_name"] is None
        assert result[0]["role_color"] is None

    def test_пустой_результат(self, mock_db):
        """Если действий нет — возвращает пустой список."""
        from crud.user_action_crud import get_user_actions_stats

        mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = []

        result = get_user_actions_stats(mock_db, period_days=30)

        assert result == []


# =============================================
# get_daily_actions
# =============================================

class TestGetDailyActions:
    """Тесты статистики действий по дням."""

    def test_формат_выхода(self, mock_db):
        """Каждый элемент содержит date, total, posts, messages, ai, unique_users."""
        from crud.user_action_crud import get_daily_actions

        day_row = MagicMock(
            day="2026-03-01",
            total=50,
            posts=20,
            messages=15,
            ai=10,
            unique_users=3,
        )

        mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = [day_row]

        result = get_daily_actions(mock_db, period_days=7)

        assert len(result) == 1
        d = result[0]
        assert d["date"] == "2026-03-01"
        assert d["total"] == 50
        assert d["posts"] == 20
        assert d["messages"] == 15
        assert d["ai"] == 10
        assert d["unique_users"] == 3

    def test_несколько_дней(self, mock_db):
        """Возвращает данные за несколько дней в правильном порядке."""
        from crud.user_action_crud import get_daily_actions

        day1 = MagicMock(day="2026-02-28", total=10, posts=5, messages=3, ai=2, unique_users=2)
        day2 = MagicMock(day="2026-03-01", total=30, posts=15, messages=10, ai=5, unique_users=4)

        mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = [day1, day2]

        result = get_daily_actions(mock_db, period_days=30)

        assert len(result) == 2
        assert result[0]["date"] == "2026-02-28"
        assert result[1]["date"] == "2026-03-01"
        assert result[1]["total"] == 30

    def test_пустой_период(self, mock_db):
        """Если за период нет действий — пустой список."""
        from crud.user_action_crud import get_daily_actions

        mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = []

        result = get_daily_actions(mock_db, period_days=1)

        assert result == []
