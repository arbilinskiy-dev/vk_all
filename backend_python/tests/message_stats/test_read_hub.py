"""Тесты для хаб-модуля crud.message_stats.read — проверка реэкспорта."""

import pytest


class TestReadHub:
    """Проверяем, что хаб read.py корректно реэкспортирует все функции."""

    def test_all_contains_expected_count(self):
        """__all__ содержит ровно 9 элементов."""
        from crud.message_stats.read import __all__ as all_names
        assert len(all_names) == 9

    def test_all_names_list(self):
        """__all__ содержит все ожидаемые имена."""
        from crud.message_stats.read import __all__ as all_names
        expected = {
            "_hourly_date_filter",
            "_collect_unique_users_from_json",
            "get_global_summary",
            "get_project_summary",
            "get_projects_summary",
            "get_hourly_chart",
            "get_project_users",
            "get_admin_stats",
            "get_admin_dialogs",
        }
        assert set(all_names) == expected

    @pytest.mark.parametrize("name", [
        "_hourly_date_filter",
        "_collect_unique_users_from_json",
        "get_global_summary",
        "get_project_summary",
        "get_projects_summary",
        "get_hourly_chart",
        "get_project_users",
        "get_admin_stats",
        "get_admin_dialogs",
    ])
    def test_each_name_is_importable(self, name):
        """Каждое имя из __all__ можно импортировать через хаб."""
        import crud.message_stats.read as hub
        obj = getattr(hub, name, None)
        assert obj is not None, f"{name} не найден в read.py"

    @pytest.mark.parametrize("name", [
        "_hourly_date_filter",
        "_collect_unique_users_from_json",
        "get_global_summary",
        "get_project_summary",
        "get_projects_summary",
        "get_hourly_chart",
        "get_project_users",
        "get_admin_stats",
        "get_admin_dialogs",
    ])
    def test_each_name_is_callable(self, name):
        """Каждое имя из __all__ — вызываемый объект (функция)."""
        import crud.message_stats.read as hub
        obj = getattr(hub, name)
        assert callable(obj), f"{name} не callable"
