"""
Тесты для утилит обнаружения туннелей callback_utils.

Все сетевые вызовы замоканы через requests.get.
"""

import pytest
from unittest.mock import patch, MagicMock

from services.callback_utils import detect_ngrok_url, detect_ssh_tunnel
from services.callback_constants import VM_TUNNEL_CALLBACK_URL

import requests


# Путь к requests.get для мока
_REQUESTS_GET = "services.callback_utils.requests.get"


class TestDetectNgrokUrl:
    """Обнаружение ngrok-туннеля."""

    @patch(_REQUESTS_GET)
    def test_https_tunnel_found(self, mock_get):
        """Ngrok запущен, есть https-туннель → возвращает HTTPS URL."""
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "tunnels": [
                {"public_url": "http://abc123.ngrok.io"},
                {"public_url": "https://abc123.ngrok.io"},
            ]
        }
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        url = detect_ngrok_url()
        assert url == "https://abc123.ngrok.io"

    @patch(_REQUESTS_GET)
    def test_only_http_tunnel_returns_first(self, mock_get):
        """Только http-туннель → возвращает первый URL."""
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "tunnels": [
                {"public_url": "http://xyz.ngrok.io"},
            ]
        }
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        url = detect_ngrok_url()
        assert url == "http://xyz.ngrok.io"

    @patch(_REQUESTS_GET)
    def test_connection_error_returns_none(self, mock_get):
        """Ngrok не запущен (ConnectionError) → None."""
        mock_get.side_effect = requests.exceptions.ConnectionError("Connection refused")
        url = detect_ngrok_url()
        assert url is None

    @patch(_REQUESTS_GET)
    def test_empty_tunnels_returns_none(self, mock_get):
        """Ngrok запущен, но список туннелей пуст → None."""
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"tunnels": []}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        url = detect_ngrok_url()
        assert url is None


class TestDetectSshTunnel:
    """Обнаружение SSH reverse tunnel."""

    @patch("services.callback_utils.requests.get")
    def test_status_405_means_active(self, mock_get):
        """Статус 405 (Method Not Allowed) → туннель активен → True."""
        mock_resp = MagicMock()
        mock_resp.status_code = 405
        mock_get.return_value = mock_resp

        result = detect_ssh_tunnel()
        assert result is True

    @patch("services.callback_utils.requests.get")
    def test_status_502_means_inactive(self, mock_get):
        """Статус 502 (Bad Gateway) → туннель не работает → False."""
        mock_resp = MagicMock()
        mock_resp.status_code = 502
        mock_get.return_value = mock_resp

        result = detect_ssh_tunnel()
        assert result is False

    @patch("services.callback_utils.requests.get")
    def test_connection_error_returns_false(self, mock_get):
        """ConnectionError → туннель недоступен → False."""
        mock_get.side_effect = requests.exceptions.ConnectionError("timeout")

        result = detect_ssh_tunnel()
        assert result is False

    @patch("services.callback_utils.requests.get")
    def test_status_200_means_active(self, mock_get):
        """Статус 200 → туннель активен → True."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_get.return_value = mock_resp

        result = detect_ssh_tunnel()
        assert result is True
