"""Тесты для ночной задачи job_refresh_all_mailing в scheduler_jobs_nightly.py."""
import pytest
import sys
import os
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


class TestJobRefreshAllMailing:
    """Тесты для job_refresh_all_mailing."""

    @patch("services.scheduler_jobs_nightly._acquire_lock", return_value=False)
    def test_skips_if_lock_not_acquired(self, mock_lock):
        """Если Redis-блокировка не получена — задача не запускается."""
        from services.scheduler_jobs_nightly import job_refresh_all_mailing

        # Не должен падать, просто выходит
        job_refresh_all_mailing()

        mock_lock.assert_called_once_with("vk_planner:refresh_all_mailing_lock", 14400)

    @patch("services.scheduler_jobs_nightly._acquire_lock", return_value=True)
    def test_skips_if_task_already_running(self, mock_lock):
        """Если задача уже запущена (вручную) — пропускает."""
        from services.scheduler_jobs_nightly import job_refresh_all_mailing

        with patch("services.task_monitor.get_active_task_id", return_value="existing-task-1") as mock_gat:
            with patch("services.task_monitor.start_task") as mock_start:
                job_refresh_all_mailing()

                mock_gat.assert_called_once_with("GLOBAL", "refresh_all_mailing")
                mock_start.assert_not_called()

    @patch("services.scheduler_jobs_nightly._acquire_lock", return_value=True)
    def test_creates_and_runs_task(self, mock_lock):
        """При свободной блокировке — создаёт задачу и вызывает refresh_all_mailing_task."""
        from services.scheduler_jobs_nightly import job_refresh_all_mailing

        with patch("services.task_monitor.get_active_task_id", return_value=None):
            with patch("services.task_monitor.start_task") as mock_start:
                with patch("services.admin_tools_bulk.refresh_all_mailing_task") as mock_bulk:
                    job_refresh_all_mailing()

                    # start_task вызван с GLOBAL + refresh_all_mailing
                    mock_start.assert_called_once()
                    call_args = mock_start.call_args.args
                    assert call_args[1] == "GLOBAL"
                    assert call_args[2] == "refresh_all_mailing"

                    # refresh_all_mailing_task вызван с task_id
                    mock_bulk.assert_called_once()

    @patch("services.scheduler_jobs_nightly._acquire_lock", return_value=True)
    def test_handles_exception_gracefully(self, mock_lock):
        """При исключении в bulk task — не падает (печатает ошибку)."""
        from services.scheduler_jobs_nightly import job_refresh_all_mailing

        with patch("services.task_monitor.get_active_task_id", return_value=None):
            with patch("services.task_monitor.start_task"):
                with patch("services.admin_tools_bulk.refresh_all_mailing_task", side_effect=Exception("DB error")):
                    # Не должен выбрасывать исключение
                    job_refresh_all_mailing()

    @patch("services.scheduler_jobs_nightly._acquire_lock", return_value=True)
    def test_no_user_token_passed(self, mock_lock):
        """Ночная задача рассылки НЕ передаёт user_token (в отличие от подписчиков)."""
        from services.scheduler_jobs_nightly import job_refresh_all_mailing

        with patch("services.task_monitor.get_active_task_id", return_value=None):
            with patch("services.task_monitor.start_task"):
                with patch("services.admin_tools_bulk.refresh_all_mailing_task") as mock_bulk:
                    job_refresh_all_mailing()

                    # Вызов только с task_id, без user_token
                    call_args = mock_bulk.call_args.args
                    assert len(call_args) == 1  # Только task_id


class TestSchedulerRegistration:
    """Тесты регистрации задачи в планировщике."""

    def test_job_refresh_all_mailing_importable(self):
        """Функция экспортируется из scheduler_jobs_nightly."""
        from services.scheduler_jobs_nightly import job_refresh_all_mailing
        assert callable(job_refresh_all_mailing)

    def test_scheduler_service_imports_mailing_job(self):
        """scheduler_service.py импортирует job_refresh_all_mailing."""
        import importlib
        import services.scheduler_service as ss
        source = importlib.util.find_spec("services.scheduler_service")
        assert source is not None

        import inspect
        source_code = inspect.getsource(ss)
        assert "job_refresh_all_mailing" in source_code
        assert "refresh_all_mailing_nightly" in source_code
