"""
Тесты для модуля констант callback_constants.

Проверяем корректность URL, длину имён серверов (лимит VK — 14 символов),
наличие ключевых событий и структуру DEFAULT_CALLBACK_EVENTS.
"""

import pytest

from services.callback_constants import (
    VM_CALLBACK_URL,
    VM_TUNNEL_CALLBACK_URL,
    SERVER_NAME_PROD,
    SERVER_NAME_LOCAL,
    NGROK_API_URL,
    VK_SETTABLE_EVENTS,
    VK_ALWAYS_ON_EVENTS,
    DEFAULT_CALLBACK_EVENTS,
)


class TestURLConstants:
    """Проверка URL-констант."""

    def test_vm_callback_url_is_https(self):
        """VM_CALLBACK_URL должен быть валидным HTTPS-адресом."""
        assert VM_CALLBACK_URL.startswith("https://")

    def test_vm_callback_url_contains_callback_path(self):
        """VM_CALLBACK_URL должен содержать путь /api/vk/callback."""
        assert "/api/vk/callback" in VM_CALLBACK_URL

    def test_vm_tunnel_callback_url_is_https(self):
        """VM_TUNNEL_CALLBACK_URL должен быть HTTPS."""
        assert VM_TUNNEL_CALLBACK_URL.startswith("https://")

    def test_ngrok_api_url_points_to_localhost(self):
        """NGROK_API_URL должен указывать на localhost:4040."""
        assert "127.0.0.1:4040" in NGROK_API_URL


class TestServerNames:
    """Проверка имён серверов (VK API: максимум 14 символов)."""

    def test_server_name_prod_length(self):
        """SERVER_NAME_PROD ≤ 14 символов."""
        assert len(SERVER_NAME_PROD) <= 14

    def test_server_name_local_length(self):
        """SERVER_NAME_LOCAL ≤ 14 символов."""
        assert len(SERVER_NAME_LOCAL) <= 14

    def test_server_name_prod_not_empty(self):
        """SERVER_NAME_PROD не пустая строка."""
        assert SERVER_NAME_PROD

    def test_server_name_local_not_empty(self):
        """SERVER_NAME_LOCAL не пустая строка."""
        assert SERVER_NAME_LOCAL


class TestSettableEvents:
    """Проверка списка настраиваемых событий VK_SETTABLE_EVENTS."""

    def test_is_non_empty_list(self):
        """Список не пустой."""
        assert isinstance(VK_SETTABLE_EVENTS, list)
        assert len(VK_SETTABLE_EVENTS) > 0

    def test_all_elements_are_strings(self):
        """Все элементы — строки."""
        for event in VK_SETTABLE_EVENTS:
            assert isinstance(event, str), f"Событие {event!r} не строка"

    @pytest.mark.parametrize("event", [
        "message_new",
        "wall_post_new",
        "group_join",
        "group_leave",
        "like_add",
    ])
    def test_contains_key_event(self, event: str):
        """Ключевые события должны присутствовать в списке."""
        assert event in VK_SETTABLE_EVENTS

    def test_no_duplicates(self):
        """Событий-дубликатов быть не должно."""
        assert len(VK_SETTABLE_EVENTS) == len(set(VK_SETTABLE_EVENTS))


class TestAlwaysOnEvents:
    """Проверка VK_ALWAYS_ON_EVENTS."""

    def test_is_non_empty_list(self):
        """Список не пустой."""
        assert isinstance(VK_ALWAYS_ON_EVENTS, list)
        assert len(VK_ALWAYS_ON_EVENTS) > 0

    def test_no_overlap_with_settable(self):
        """VK_ALWAYS_ON_EVENTS не должны пересекаться с VK_SETTABLE_EVENTS."""
        overlap = set(VK_ALWAYS_ON_EVENTS) & set(VK_SETTABLE_EVENTS)
        assert not overlap, f"Пересечение: {overlap}"


class TestDefaultCallbackEvents:
    """Проверка словаря DEFAULT_CALLBACK_EVENTS."""

    def test_length_matches_settable(self):
        """Длина словаря == длина VK_SETTABLE_EVENTS."""
        assert len(DEFAULT_CALLBACK_EVENTS) == len(VK_SETTABLE_EVENTS)

    def test_all_values_are_one(self):
        """Все значения == 1 (все события включены по умолчанию)."""
        for key, value in DEFAULT_CALLBACK_EVENTS.items():
            assert value == 1, f"Событие {key}: ожидалось 1, получено {value}"

    def test_keys_match_settable_events(self):
        """Ключи словаря совпадают с VK_SETTABLE_EVENTS."""
        assert set(DEFAULT_CALLBACK_EVENTS.keys()) == set(VK_SETTABLE_EVENTS)
