"""
Тесты для services/messages/send_service.py — отправка сообщений.
"""

import pytest
from unittest.mock import MagicMock, patch

from fastapi import HTTPException


class TestSendMessage:
    """Тесты отправки сообщений через VK API."""

    @patch("services.messages.send_service.mem_invalidate_dialog")
    @patch("services.messages.send_service.messages_crud")
    @patch("services.messages.send_service.global_variable_service")
    @patch("services.messages.send_service.call_vk_api_for_group")
    def test_send_success(self, mock_vk_call, mock_global_var, mock_crud, mock_invalidate, mock_db):
        """Успешная отправка — VK API возвращает ID, сообщение сохраняется в кэш."""
        from services.messages.send_service import send_message

        mock_global_var.substitute_global_variables.return_value = "Привет!"
        mock_vk_call.return_value = 99999  # message_id

        result = send_message(mock_db, "proj-1", 12345, "Привет!", ["token"], 123456)

        assert result["success"] is True
        assert result["message_id"] == 99999
        assert result["item"]["text"] == "Привет!"
        assert result["item"]["out"] == 1
        assert result["item"]["from_id"] == -123456

        # Проверяем, что сохранили в кэш
        mock_crud.save_vk_messages.assert_called_once()
        mock_crud.recalc_direction_counts.assert_called_once()
        mock_invalidate.assert_called_once_with("proj-1", 12345)

    def test_send_empty_message(self, mock_db):
        """Пустое сообщение → HTTPException 400."""
        from services.messages.send_service import send_message

        with pytest.raises(HTTPException) as exc:
            send_message(mock_db, "proj-1", 12345, "   ", ["token"], 123456)
        assert exc.value.status_code == 400

    @patch("services.messages.send_service.global_variable_service")
    @patch("services.messages.send_service.call_vk_api_for_group")
    def test_send_vk_api_error(self, mock_vk_call, mock_global_var, mock_db):
        """Ошибка VK API → HTTPException 502."""
        from services.messages.send_service import send_message
        from services.vk_api.api_client import VkApiError

        mock_global_var.substitute_global_variables.return_value = "text"
        mock_vk_call.side_effect = VkApiError(code=7, message="Access denied")

        with pytest.raises(HTTPException) as exc:
            send_message(mock_db, "proj-1", 12345, "text", ["token"], 123456)
        assert exc.value.status_code == 502

    @patch("services.messages.send_service.global_variable_service")
    @patch("services.messages.send_service.call_vk_api_for_group")
    def test_send_global_variables_substituted(self, mock_vk_call, mock_global_var, mock_db):
        """Глобальные переменные подставляются в текст."""
        from services.messages.send_service import send_message

        mock_global_var.substitute_global_variables.return_value = "Привет, Мир!"
        mock_vk_call.return_value = 111

        with patch("services.messages.send_service.messages_crud"), \
             patch("services.messages.send_service.mem_invalidate_dialog"):
            result = send_message(mock_db, "proj-1", 12345, "Привет, {global_name}!", ["token"], 123456)

        mock_global_var.substitute_global_variables.assert_called_once_with(
            mock_db, "Привет, {global_name}!", "proj-1"
        )
        assert result["item"]["text"] == "Привет, Мир!"

    @patch("services.messages.send_service.mem_invalidate_dialog")
    @patch("services.messages.send_service.messages_crud")
    @patch("services.messages.send_service.global_variable_service")
    @patch("services.messages.send_service.call_vk_api_for_group")
    def test_send_result_dict_format(self, mock_vk_call, mock_global_var, mock_crud, mock_invalidate, mock_db):
        """Если VK API вернул dict — извлекаем response."""
        from services.messages.send_service import send_message

        mock_global_var.substitute_global_variables.return_value = "text"
        mock_vk_call.return_value = {"response": 55555}

        result = send_message(mock_db, "proj-1", 12345, "text", ["token"], 123456)
        assert result["message_id"] == 55555
