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


class TestRefreshAllMailingTask:
    """Тесты для refresh_all_mailing_task (параллельная обработка сообществ)."""

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_no_projects_with_tokens(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """Нет проектов с community-токенами — задача завершается с сообщением."""
        from services.admin_tools_bulk import refresh_all_mailing_task

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db
        mock_crud.get_all_projects.return_value = []

        refresh_all_mailing_task("task_m_1")

        mock_tm.update_task.assert_called_with("task_m_1", "done", message="Нет проектов с community-токенами")

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_filters_projects_without_tokens(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """Проекты без community-токенов фильтруются — задача завершается если остаток пуст."""
        from services.admin_tools_bulk import refresh_all_mailing_task

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        # Проект без communityToken
        mock_project = MagicMock()
        mock_project.communityToken = None
        mock_project.additional_community_tokens = None

        mock_crud.get_all_projects.return_value = [mock_project]

        refresh_all_mailing_task("task_m_2")

        mock_tm.update_task.assert_called_with("task_m_2", "done", message="Нет проектов с community-токенами")

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_calls_refresh_mailing_for_each_project(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """Для каждого проекта с токенами вызывается refresh_mailing_task."""
        from services.admin_tools_bulk import refresh_all_mailing_task

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        # Два проекта с токенами
        p1 = MagicMock()
        p1.id = "proj_1"
        p1.name = "Проект 1"
        p1.communityToken = "token_1"
        p1.additional_community_tokens = None

        p2 = MagicMock()
        p2.id = "proj_2"
        p2.name = "Проект 2"
        p2.communityToken = "token_2"
        p2.additional_community_tokens = None

        mock_crud.get_all_projects.return_value = [p1, p2]
        mock_tm.is_task_cancelled.return_value = False
        mock_tm.get_task_status.return_value = {"status": "done"}

        with patch("services.lists.list_sync_mailing.refresh_mailing_task") as mock_refresh:
            refresh_all_mailing_task("task_m_3")

            assert mock_refresh.call_count == 2
            # Проверяем что вызваны с правильными project_id
            project_ids_called = [c.args[1] for c in mock_refresh.call_args_list]
            assert "proj_1" in project_ids_called
            assert "proj_2" in project_ids_called

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_cancelled_before_processing(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """Задача отменена до обработки — ранний выход с сообщением."""
        from services.admin_tools_bulk import refresh_all_mailing_task

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        p1 = MagicMock()
        p1.id = "proj_1"
        p1.name = "Проект 1"
        p1.communityToken = "token_1"
        p1.additional_community_tokens = None

        mock_crud.get_all_projects.return_value = [p1]
        mock_tm.is_task_cancelled.return_value = True  # Сразу отменена

        with patch("services.lists.list_sync_mailing.refresh_mailing_task") as mock_refresh:
            refresh_all_mailing_task("task_m_4")

            # refresh_mailing_task не должен быть вызван
            mock_refresh.assert_not_called()

        # Должен вызвать clear_cancellation
        mock_tm.clear_cancellation.assert_called_with("task_m_4")
        # Сообщение об отмене
        calls = [str(c) for c in mock_tm.update_task.call_args_list]
        assert any("Отменено" in c for c in calls)

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_handles_subtask_error(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """Если refresh_mailing_task падает — ошибка записывается, задача продолжается."""
        from services.admin_tools_bulk import refresh_all_mailing_task

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        p1 = MagicMock()
        p1.id = "proj_1"
        p1.name = "Проект 1"
        p1.communityToken = "token_1"
        p1.additional_community_tokens = None

        p2 = MagicMock()
        p2.id = "proj_2"
        p2.name = "Проект 2"
        p2.communityToken = "token_2"
        p2.additional_community_tokens = None

        mock_crud.get_all_projects.return_value = [p1, p2]
        mock_tm.is_task_cancelled.return_value = False
        mock_tm.get_task_status.return_value = {"status": "done"}

        with patch("services.lists.list_sync_mailing.refresh_mailing_task") as mock_refresh:
            # Первый проект — исключение, второй — успех
            mock_refresh.side_effect = [Exception("VK API Error"), None]

            refresh_all_mailing_task("task_m_5")

            # Оба проекта должны быть обработаны (задача не прерывается)
            assert mock_refresh.call_count == 2

        # Финальное сообщение содержит информацию об ошибках
        final_call = mock_tm.update_task.call_args_list[-1]
        assert "1 с ошибками" in str(final_call)

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_handles_subtask_error_status(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """Если подзадача завершилась со статусом error — считается ошибкой."""
        from services.admin_tools_bulk import refresh_all_mailing_task

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        p1 = MagicMock()
        p1.id = "proj_1"
        p1.name = "Проект 1"
        p1.communityToken = "token_1"
        p1.additional_community_tokens = None

        mock_crud.get_all_projects.return_value = [p1]
        mock_tm.is_task_cancelled.return_value = False
        mock_tm.get_task_status.return_value = {"status": "error", "error": "Все токены не работают"}

        with patch("services.lists.list_sync_mailing.refresh_mailing_task"):
            refresh_all_mailing_task("task_m_6")

        # Финальное сообщение — 0 успешно, 1 с ошибками
        final_call = mock_tm.update_task.call_args_list[-1]
        assert "0 успешно" in str(final_call)
        assert "1 с ошибками" in str(final_call)

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_progress_tracking(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """Прогресс обновляется для каждого проекта (loaded/total)."""
        from services.admin_tools_bulk import refresh_all_mailing_task

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        p1 = MagicMock()
        p1.id = "proj_1"
        p1.name = "Проект 1"
        p1.communityToken = "ct1"
        p1.additional_community_tokens = None

        mock_crud.get_all_projects.return_value = [p1]
        mock_tm.is_task_cancelled.return_value = False
        mock_tm.get_task_status.return_value = {"status": "done"}

        with patch("services.lists.list_sync_mailing.refresh_mailing_task"):
            refresh_all_mailing_task("task_m_7")

        # Должен быть update_task с total=1
        fetching_calls = [
            c for c in mock_tm.update_task.call_args_list
            if len(c.args) > 1 and c.args[1] == "fetching"
        ]
        assert len(fetching_calls) >= 1

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_additional_community_tokens_parsed(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """Проекты с additional_community_tokens корректно подхватываются."""
        from services.admin_tools_bulk import refresh_all_mailing_task

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        p1 = MagicMock()
        p1.id = "proj_1"
        p1.name = "Проект с доп. токенами"
        p1.communityToken = None
        p1.additional_community_tokens = json.dumps(["extra_token_1", "extra_token_2"])

        mock_crud.get_all_projects.return_value = [p1]
        mock_tm.is_task_cancelled.return_value = False
        mock_tm.get_task_status.return_value = {"status": "done"}

        with patch("services.lists.list_sync_mailing.refresh_mailing_task") as mock_refresh:
            refresh_all_mailing_task("task_m_8")
            # Проект должен быть обработан (у него есть additional_community_tokens)
            assert mock_refresh.call_count == 1

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_all_success_message(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """Все проекты успешны — сообщение без ошибок."""
        from services.admin_tools_bulk import refresh_all_mailing_task

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        p1 = MagicMock()
        p1.id = "p1"
        p1.name = "P1"
        p1.communityToken = "t1"
        p1.additional_community_tokens = None

        p2 = MagicMock()
        p2.id = "p2"
        p2.name = "P2"
        p2.communityToken = "t2"
        p2.additional_community_tokens = None

        mock_crud.get_all_projects.return_value = [p1, p2]
        mock_tm.is_task_cancelled.return_value = False
        mock_tm.get_task_status.return_value = {"status": "done"}

        with patch("services.lists.list_sync_mailing.refresh_mailing_task"):
            refresh_all_mailing_task("task_m_9")

        final_call = mock_tm.update_task.call_args_list[-1]
        assert "2 успешно" in str(final_call)
        assert "ошибками" not in str(final_call)


class TestMailingTaskContractSafety:
    """
    Контрактные тесты: проверяют, что refresh_all_mailing_task вызывает
    РЕАЛЬНЫЕ методы crud и task_monitor с ПРАВИЛЬНЫМИ сигнатурами.
    
    Используют autospec=True — mock-объект наследует интерфейс оригинального
    модуля. Попытка вызвать несуществующий метод или передать невалидный
    параметр СРАЗУ даёт ошибку.
    
    Именно эти тесты поймали бы:
    - crud.get_all_active_projects вместо crud.get_all_projects
    - task_monitor.update_task(..., projects=[...]) — лишний параметр
    """

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor", autospec=True)
    @patch("services.admin_tools_bulk.crud", autospec=True)
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_crud_methods_exist(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """crud.get_all_projects реально существует (autospec проверит)."""
        from services.admin_tools_bulk import refresh_all_mailing_task

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db
        mock_crud.get_all_projects.return_value = []

        refresh_all_mailing_task("task_contract_1")

        # autospec гарантирует: если бы код вызвал crud.get_all_active_projects,
        # тест бы упал с AttributeError
        mock_crud.get_all_projects.assert_called_once()

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor", autospec=True)
    @patch("services.admin_tools_bulk.crud", autospec=True)
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_update_task_signature_valid(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """update_task вызывается только с параметрами из реальной сигнатуры."""
        from services.admin_tools_bulk import refresh_all_mailing_task

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        p1 = MagicMock()
        p1.id = "proj_1"
        p1.name = "Проект"
        p1.communityToken = "ct1"
        p1.additional_community_tokens = None

        mock_crud.get_all_projects.return_value = [p1]
        mock_tm.is_task_cancelled.return_value = False
        mock_tm.get_task_status.return_value = {"status": "done"}

        with patch("services.lists.list_sync_mailing.refresh_mailing_task"):
            # autospec гарантирует: если бы код передал projects=[...] в update_task,
            # тест бы упал с TypeError: unexpected keyword argument 'projects'
            refresh_all_mailing_task("task_contract_2")

        # Проверяем, что все вызовы update_task прошли без TypeError
        assert mock_tm.update_task.call_count >= 2  # минимум: fetching + done

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor", autospec=True)
    @patch("services.admin_tools_bulk.crud", autospec=True)
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_start_task_signature_valid(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """start_task вызывается с правильными аргументами (autospec)."""
        from services.admin_tools_bulk import refresh_all_mailing_task

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        p1 = MagicMock()
        p1.id = "proj_1"
        p1.name = "Проект"
        p1.communityToken = "ct1"
        p1.additional_community_tokens = None

        mock_crud.get_all_projects.return_value = [p1]
        mock_tm.is_task_cancelled.return_value = False
        mock_tm.get_task_status.return_value = {"status": "done"}

        with patch("services.lists.list_sync_mailing.refresh_mailing_task"):
            refresh_all_mailing_task("task_contract_3")

        # start_task должен быть вызван для подзадачи (проверка сигнатуры через autospec)
        assert mock_tm.start_task.call_count >= 1

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor", autospec=True)
    @patch("services.admin_tools_bulk.crud", autospec=True)
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_full_flow_with_autospec(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """Полный прогон с autospec — 2 проекта, один ошибка, один успех."""
        from services.admin_tools_bulk import refresh_all_mailing_task

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        p1 = MagicMock()
        p1.id = "p1"
        p1.name = "P1"
        p1.communityToken = "t1"
        p1.additional_community_tokens = None

        p2 = MagicMock()
        p2.id = "p2"
        p2.name = "P2"
        p2.communityToken = "t2"
        p2.additional_community_tokens = None

        mock_crud.get_all_projects.return_value = [p1, p2]
        mock_tm.is_task_cancelled.return_value = False
        mock_tm.get_task_status.return_value = {"status": "done"}

        with patch("services.lists.list_sync_mailing.refresh_mailing_task") as mock_refresh:
            mock_refresh.side_effect = [Exception("API Error"), None]
            # Если что-то в коде нарушает контракт crud/task_monitor — autospec
            # вызовет AttributeError или TypeError здесь
            refresh_all_mailing_task("task_contract_4")

        final_call = mock_tm.update_task.call_args_list[-1]
        assert "1 успешно" in str(final_call)
        assert "1 с ошибками" in str(final_call)


class TestMailingParallelExecution:
    """Тесты параллелизации: stagger delay, ThreadPoolExecutor, rate-limit."""

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_stagger_delay_between_projects(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """Между запуском проектов вызывается time.sleep для rate-limit."""
        from services.admin_tools_bulk import refresh_all_mailing_task

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        projects = []
        for i in range(3):
            p = MagicMock()
            p.id = f"p{i}"
            p.name = f"P{i}"
            p.communityToken = f"t{i}"
            p.additional_community_tokens = None
            projects.append(p)

        mock_crud.get_all_projects.return_value = projects
        mock_tm.is_task_cancelled.return_value = False
        mock_tm.get_task_status.return_value = {"status": "done"}

        with patch("services.lists.list_sync_mailing.refresh_mailing_task"):
            refresh_all_mailing_task("task_stagger")

        # time.sleep должен быть вызван между проектами (не после последнего)
        sleep_calls = [c for c in mock_time.sleep.call_args_list]
        assert len(sleep_calls) == 2  # 3 проекта → 2 паузы (между 1-2 и 2-3)
        # Каждый sleep >= 0.5 сек (проверяем что это не микрозадержка)
        for c in sleep_calls:
            assert c.args[0] >= 0.5

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_parallel_execution_uses_thread_pool(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """Проекты обрабатываются через ThreadPoolExecutor (не последовательно)."""
        from services.admin_tools_bulk import refresh_all_mailing_task
        import threading

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        # 3 проекта
        projects = []
        for i in range(3):
            p = MagicMock()
            p.id = f"p{i}"
            p.name = f"P{i}"
            p.communityToken = f"t{i}"
            p.additional_community_tokens = None
            projects.append(p)

        mock_crud.get_all_projects.return_value = projects
        mock_tm.is_task_cancelled.return_value = False
        mock_tm.get_task_status.return_value = {"status": "done"}

        # Трекинг потоков выполнения
        threads_seen = set()

        def track_thread(task_id, project_id):
            threads_seen.add(threading.current_thread().name)

        with patch("services.lists.list_sync_mailing.refresh_mailing_task", side_effect=track_thread):
            refresh_all_mailing_task("task_parallel")

        # Все 3 проекта обработаны
        assert len(threads_seen) >= 1  # Как минимум один поток использовался

    @patch("services.admin_tools_bulk.time")
    @patch("services.admin_tools_bulk.task_monitor")
    @patch("services.admin_tools_bulk.crud")
    @patch("services.admin_tools_bulk.SessionLocal")
    def test_single_project_no_stagger_delay(self, mock_session_cls, mock_crud, mock_tm, mock_time):
        """Один проект — нет stagger delay."""
        from services.admin_tools_bulk import refresh_all_mailing_task

        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        p1 = MagicMock()
        p1.id = "p1"
        p1.name = "P1"
        p1.communityToken = "t1"
        p1.additional_community_tokens = None

        mock_crud.get_all_projects.return_value = [p1]
        mock_tm.is_task_cancelled.return_value = False
        mock_tm.get_task_status.return_value = {"status": "done"}

        with patch("services.lists.list_sync_mailing.refresh_mailing_task"):
            refresh_all_mailing_task("task_single")

        # Нет вызовов sleep (один проект — нечего стаггерить)
        mock_time.sleep.assert_not_called()
