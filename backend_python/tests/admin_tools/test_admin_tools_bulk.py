"""Тесты для admin_tools_bulk.py — фоновые задачи массового обновления."""
import pytest
import json
import sys
import os
from unittest.mock import MagicMock, patch, call

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


class TestWorkerFetchAdmins:
    """Тесты для _worker_fetch_admins."""

    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.raw_vk_call")
    @patch("services.admin_tools_bulk.time")
    def test_successful_fetch(self, mock_time, mock_vk, mock_tm):
        """Успешная загрузка менеджеров возвращает данные в successes."""
        from services.admin_tools_bulk import _worker_fetch_admins

        mock_vk.return_value = {"items": [{"id": 1, "role": "administrator"}]}

        successes, failures = _worker_fetch_admins(
            token="test_token",
            group_ids=[100, 200],
            task_id="task_1",
            processed_counter={"val": 0},
            total_groups=2,
        )

        assert len(successes) == 2
        assert len(failures) == 0
        assert successes[0][0] == 100
        assert successes[1][0] == 200

    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.raw_vk_call")
    @patch("services.admin_tools_bulk.time")
    def test_api_error_goes_to_failures(self, mock_time, mock_vk, mock_tm):
        """Ошибка VK API — группа попадает в failures."""
        from services.admin_tools_bulk import _worker_fetch_admins

        mock_vk.side_effect = Exception("VK error")

        successes, failures = _worker_fetch_admins(
            token="test_token",
            group_ids=[100],
            task_id="task_1",
            processed_counter={"val": 0},
            total_groups=1,
        )

        assert len(successes) == 0
        assert failures == [100]

    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.raw_vk_call")
    @patch("services.admin_tools_bulk.time")
    def test_empty_response_goes_to_failures(self, mock_time, mock_vk, mock_tm):
        """Пустой ответ VK (нет items) — группа в failures."""
        from services.admin_tools_bulk import _worker_fetch_admins

        mock_vk.return_value = {}  # Нет ключа 'items'

        successes, failures = _worker_fetch_admins(
            token="test_token",
            group_ids=[100],
            task_id="task_1",
            processed_counter={"val": 0},
            total_groups=1,
        )

        assert len(successes) == 0
        assert failures == [100]

    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.raw_vk_call")
    @patch("services.admin_tools_bulk.time")
    def test_progress_counter_updated(self, mock_time, mock_vk, mock_tm):
        """Счётчик прогресса инкрементируется для каждой группы."""
        from services.admin_tools_bulk import _worker_fetch_admins

        mock_vk.return_value = {"items": []}

        counter = {"val": 0}
        _worker_fetch_admins("tok", [1, 2, 3], "t_1", counter, 3)

        assert counter["val"] == 3

    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.raw_vk_call")
    @patch("services.admin_tools_bulk.time")
    def test_sleep_called_per_group(self, mock_time, mock_vk, mock_tm):
        """time.sleep вызывается для каждой группы (rate limit)."""
        from services.admin_tools_bulk import _worker_fetch_admins

        mock_vk.return_value = {"items": []}

        _worker_fetch_admins("tok", [1, 2], "t_1", {"val": 0}, 2)

        assert mock_time.sleep.call_count == 2


class TestRefreshAllGroupAdminsTask:
    """Тесты для refresh_all_group_admins_task."""

    @patch("services.admin_tools_bulk._process_and_save_admins")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.settings")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_no_active_groups_completes(self, mock_session_cls, mock_settings, mock_crud, mock_tm, mock_process):
        """Нет активных групп — задача завершается с сообщением."""
        from services.admin_tools_bulk import refresh_all_group_admins_task

        mock_tm.is_task_cancelled.return_value = False
        mock_settings.vk_user_token = None
        mock_crud.get_all_accounts.return_value = []

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db
        mock_db.query.return_value.all.return_value = []

        refresh_all_group_admins_task("task_1")

        mock_tm.update_task.assert_any_call("task_1", "done", message="Нет групп с доступными токенами.")

    @patch("services.admin_tools_bulk._process_and_save_admins")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.settings")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_cancelled_before_start(self, mock_session_cls, mock_settings, mock_crud, mock_tm, mock_process):
        """Задача отменена до начала — ранний выход."""
        from services.admin_tools_bulk import refresh_all_group_admins_task

        mock_tm.is_task_cancelled.return_value = True

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        refresh_all_group_admins_task("task_1")

        mock_tm.clear_cancellation.assert_called_with("task_1")

    @patch("services.admin_tools_bulk.concurrent.futures.ThreadPoolExecutor")
    @patch("services.admin_tools_bulk._process_and_save_admins")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.settings")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_launches_thread_pool(self, mock_session_cls, mock_settings, mock_crud, mock_tm, mock_process, mock_pool_cls):
        """Задача запускает ThreadPoolExecutor для параллельной обработки."""
        from services.admin_tools_bulk import refresh_all_group_admins_task

        mock_tm.is_task_cancelled.return_value = False
        mock_settings.vk_user_token = "env_token"
        mock_crud.get_all_accounts.return_value = []

        # Одна активная группа
        mock_group = MagicMock()
        mock_group.id = 100
        mock_group.admin_sources = json.dumps(["ENV Token (Основной)"])

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db
        mock_db.query.return_value.all.return_value = [mock_group]

        # Мок ThreadPoolExecutor
        mock_pool = MagicMock()
        mock_pool_cls.return_value.__enter__ = MagicMock(return_value=mock_pool)
        mock_pool_cls.return_value.__exit__ = MagicMock(return_value=False)

        # Мок future
        mock_future = MagicMock()
        mock_future.result.return_value = ([], [])
        mock_pool.submit.return_value = mock_future

        # as_completed возвращает один future
        with patch("services.admin_tools_bulk.concurrent.futures.as_completed", return_value=[mock_future]):
            refresh_all_group_admins_task("task_1")

        # ThreadPoolExecutor был создан
        mock_pool_cls.assert_called_once()

    @patch("services.admin_tools_bulk._process_and_save_admins")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.settings")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_cancelled_before_parallel_fetch(self, mock_session_cls, mock_settings, mock_crud, mock_tm, mock_process):
        """Задача отменена после балансировки, но перед параллельной загрузкой."""
        from services.admin_tools_bulk import refresh_all_group_admins_task

        # Первая проверка — не отменено, вторая — отменено
        mock_tm.is_task_cancelled.side_effect = [False, True]
        mock_settings.vk_user_token = "env_token"
        mock_crud.get_all_accounts.return_value = []

        mock_group = MagicMock()
        mock_group.id = 100
        mock_group.admin_sources = json.dumps(["ENV Token (Основной)"])

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db
        mock_db.query.return_value.all.return_value = [mock_group]

        refresh_all_group_admins_task("task_1")

        # Должен был вызвать update_task с "done" и сообщением об отмене
        calls = [str(c) for c in mock_tm.update_task.call_args_list]
        assert any("Отменено" in c for c in calls)


class TestRefreshAllSubscribersTask:
    """Тесты для refresh_all_subscribers_task."""

    def test_delegates_to_parallel_service(self):
        """Задача делегирует работу в run_parallel_subscribers_refresh_v2."""
        from services.admin_tools_bulk import refresh_all_subscribers_task

        with patch("services.lists.parallel_bulk_service_v2.run_parallel_subscribers_refresh_v2") as mock_refresh:
            refresh_all_subscribers_task("task_1", "user_token")
            mock_refresh.assert_called_once_with("task_1", "user_token")


class TestRefreshAllPostsTask:
    """Тесты для refresh_all_posts_task."""

    def test_delegates_to_parallel_posts_service(self):
        """Задача делегирует работу в run_parallel_posts_refresh_v2."""
        from services.admin_tools_bulk import refresh_all_posts_task

        with patch("services.lists.parallel_bulk_posts_v2.run_parallel_posts_refresh_v2") as mock_refresh:
            refresh_all_posts_task("task_2", "user_token", "500", "limit")
            mock_refresh.assert_called_once_with("task_2", "user_token", "500", "limit")

    def test_default_parameters(self):
        """Параметры по умолчанию: limit='1000', mode='limit'."""
        from services.admin_tools_bulk import refresh_all_posts_task

        with patch("services.lists.parallel_bulk_posts_v2.run_parallel_posts_refresh_v2") as mock_refresh:
            refresh_all_posts_task("task_3", "token")
            mock_refresh.assert_called_once_with("task_3", "token", "1000", "limit")
