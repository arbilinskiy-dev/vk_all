"""
Тесты для хаб-модуля callback_setup.

Проверяем, что все имена из __all__ реально импортируются
и доступны через хаб (from services.callback_setup import ...).
"""

import pytest

import services.callback_setup as hub


class TestHubAllExports:
    """Проверка __all__ и доступности реэкспортов."""

    def test_all_has_18_names(self):
        """__all__ содержит ровно 18 имён."""
        assert hasattr(hub, "__all__")
        assert len(hub.__all__) == 18

    def test_all_names_importable(self):
        """Каждое имя из __all__ реально существует в модуле."""
        for name in hub.__all__:
            assert hasattr(hub, name), f"{name} из __all__ отсутствует в модуле"


class TestHubConstants:
    """Константы доступны через хаб."""

    def test_vm_callback_url(self):
        assert hasattr(hub, "VM_CALLBACK_URL")
        assert isinstance(hub.VM_CALLBACK_URL, str)

    def test_vm_tunnel_callback_url(self):
        assert hasattr(hub, "VM_TUNNEL_CALLBACK_URL")

    def test_server_name_prod(self):
        assert hasattr(hub, "SERVER_NAME_PROD")

    def test_server_name_local(self):
        assert hasattr(hub, "SERVER_NAME_LOCAL")

    def test_ngrok_api_url(self):
        assert hasattr(hub, "NGROK_API_URL")

    def test_vk_settable_events(self):
        assert hasattr(hub, "VK_SETTABLE_EVENTS")
        assert isinstance(hub.VK_SETTABLE_EVENTS, list)

    def test_vk_always_on_events(self):
        assert hasattr(hub, "VK_ALWAYS_ON_EVENTS")

    def test_default_callback_events(self):
        assert hasattr(hub, "DEFAULT_CALLBACK_EVENTS")
        assert isinstance(hub.DEFAULT_CALLBACK_EVENTS, dict)


class TestHubVkClient:
    """VK API клиент функции доступны через хаб."""

    @pytest.mark.parametrize("func_name", [
        "get_callback_servers",
        "get_confirmation_code",
        "add_callback_server",
        "edit_callback_server",
        "set_callback_settings",
        "get_callback_settings",
        "find_server_by_title",
    ])
    def test_vk_client_function_available(self, func_name: str):
        """Функция VK-клиента доступна и вызываема."""
        func = getattr(hub, func_name, None)
        assert func is not None, f"{func_name} не найдена в хабе"
        assert callable(func)


class TestHubUtils:
    """Утилиты доступны через хаб."""

    def test_detect_ngrok_url(self):
        assert hasattr(hub, "detect_ngrok_url")
        assert callable(hub.detect_ngrok_url)

    def test_detect_ssh_tunnel(self):
        assert hasattr(hub, "detect_ssh_tunnel")
        assert callable(hub.detect_ssh_tunnel)


class TestHubService:
    """Главная функция доступна через хаб."""

    def test_auto_setup_callback(self):
        assert hasattr(hub, "auto_setup_callback")
        assert callable(hub.auto_setup_callback)
