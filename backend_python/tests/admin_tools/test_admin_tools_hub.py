"""Тесты для хаб-модуля admin_tools_service.py — проверка реэкспорта."""
import pytest
import sys
import os

# Добавляем путь к бэкенду для корректного импорта
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


class TestAdminToolsHub:
    """Проверяем, что хаб правильно реэкспортирует все функции."""

    def test_all_exports_defined(self):
        """__all__ содержит ожидаемое количество элементов (10 функций)."""
        from services.admin_tools_service import __all__ as exports
        assert len(exports) == 10, f"Ожидалось 10 элементов в __all__, получено {len(exports)}"

    def test_all_names_present(self):
        """Все ожидаемые имена присутствуют в __all__."""
        from services.admin_tools_service import __all__ as exports

        expected_names = [
            "get_all_administered_groups",
            "_process_and_save_admins",
            "sync_administered_groups",
            "sync_group_admins",
            "refresh_all_group_admins_task",
            "refresh_all_subscribers_task",
            "refresh_all_posts_task",
            "refresh_all_mailing_task",
            "promote_to_admins",
            "_find_admin_token_for_group",
        ]
        for name in expected_names:
            assert name in exports, f"Имя '{name}' отсутствует в __all__"

    def test_all_exports_are_callable(self):
        """Каждый элемент __all__ — вызываемый объект (функция)."""
        import services.admin_tools_service as hub

        for name in hub.__all__:
            obj = getattr(hub, name, None)
            assert obj is not None, f"Атрибут '{name}' не найден в хаб-модуле"
            assert callable(obj), f"'{name}' не является callable"

    def test_crud_functions_importable(self):
        """CRUD-функции импортируются без ошибок."""
        from services.admin_tools_service import get_all_administered_groups, _process_and_save_admins
        assert callable(get_all_administered_groups)
        assert callable(_process_and_save_admins)

    def test_sync_functions_importable(self):
        """Функции синхронизации импортируются без ошибок."""
        from services.admin_tools_service import sync_administered_groups, sync_group_admins
        assert callable(sync_administered_groups)
        assert callable(sync_group_admins)

    def test_bulk_functions_importable(self):
        """Фоновые задачи импортируются без ошибок."""
        from services.admin_tools_service import (
            refresh_all_group_admins_task,
            refresh_all_subscribers_task,
            refresh_all_posts_task,
            refresh_all_mailing_task,
        )
        assert callable(refresh_all_group_admins_task)
        assert callable(refresh_all_subscribers_task)
        assert callable(refresh_all_posts_task)
        assert callable(refresh_all_mailing_task)

    def test_promote_functions_importable(self):
        """Функции назначения админов импортируются без ошибок."""
        from services.admin_tools_service import promote_to_admins, _find_admin_token_for_group
        assert callable(promote_to_admins)
        assert callable(_find_admin_token_for_group)
