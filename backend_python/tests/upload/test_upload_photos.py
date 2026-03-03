"""
Тесты для модуля upload_photos — загрузка фото на стену и в альбом VK.
"""

import pytest
from unittest.mock import MagicMock, patch


# Пути для патчей (относительно модуля upload_photos)
VK_API_PATH = "services.vk_api.upload_photos._raw_call_vk_api"
REQUESTS_POST_PATH = "services.vk_api.upload_photos.requests.post"
ADMIN_TOKENS_PATH = "services.vk_api.upload_photos.get_admin_token_strings_for_group"


class TestUploadWallPhoto:
    """Тесты для upload_wall_photo — загрузка фото на стену."""

    @patch(ADMIN_TOKENS_PATH, return_value=["token_admin1"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_success_full_flow(self, mock_vk, mock_post, mock_tokens):
        """Успешный путь: getWallUploadServer → POST → saveWallPhoto."""
        from services.vk_api.upload_photos import upload_wall_photo

        # getWallUploadServer возвращает upload_url
        mock_vk.side_effect = [
            {"upload_url": "https://upload.vk.com/wall123"},
            [{"id": 999, "owner_id": -100}],  # saveWallPhoto
        ]
        # POST на upload_url возвращает данные загрузки
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "photo": "photo_data",
            "server": 1,
            "hash": "abc123",
        }
        mock_post.return_value = mock_response

        result = upload_wall_photo(
            group_id=100, file_bytes=b"fake_img", file_name="test.jpg", user_token="token_admin1"
        )

        # Проверяем вызовы VK API
        assert mock_vk.call_count == 2
        first_call_args = mock_vk.call_args_list[0]
        assert first_call_args[0][0] == "photos.getWallUploadServer"
        second_call_args = mock_vk.call_args_list[1]
        assert second_call_args[0][0] == "photos.saveWallPhoto"

        # POST на upload_url
        mock_post.assert_called_once()
        assert result == {"id": 999, "owner_id": -100}

    @patch(ADMIN_TOKENS_PATH, return_value=["token_admin1"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_no_upload_url_raises(self, mock_vk, mock_post, mock_tokens):
        """getWallUploadServer без upload_url — выбрасывает исключение."""
        from services.vk_api.upload_photos import upload_wall_photo

        mock_vk.return_value = {}  # Нет upload_url

        with pytest.raises(Exception, match="upload_url"):
            upload_wall_photo(100, b"img", "test.jpg", "token_admin1")

    @patch(ADMIN_TOKENS_PATH, return_value=["token_admin1"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_bad_upload_response_raises(self, mock_vk, mock_post, mock_tokens):
        """Сервер загрузки возвращает неполный ответ — исключение."""
        from services.vk_api.upload_photos import upload_wall_photo

        mock_vk.side_effect = [{"upload_url": "https://upload.vk.com/wall123"}]
        mock_response = MagicMock()
        mock_response.json.return_value = {"photo": "data"}  # Нет server и hash
        mock_post.return_value = mock_response

        with pytest.raises(Exception, match="Bad upload response"):
            upload_wall_photo(100, b"img", "test.jpg", "token_admin1")

    @patch(ADMIN_TOKENS_PATH, return_value=["token_admin1"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_save_returns_empty_raises(self, mock_vk, mock_post, mock_tokens):
        """saveWallPhoto возвращает пустой список — исключение."""
        from services.vk_api.upload_photos import upload_wall_photo

        mock_vk.side_effect = [
            {"upload_url": "https://upload.vk.com/wall123"},
            [],  # Пустой результат от saveWallPhoto
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "photo": "data", "server": 1, "hash": "abc"
        }
        mock_post.return_value = mock_response

        with pytest.raises(Exception, match="photo data"):
            upload_wall_photo(100, b"img", "test.jpg", "token_admin1")

    @patch(ADMIN_TOKENS_PATH, return_value=["token_fail", "token_ok"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_token_rotation_on_failure(self, mock_vk, mock_post, mock_tokens):
        """Если первый токен упал — пробуем второй."""
        from services.vk_api.upload_photos import upload_wall_photo

        # Первый токен — ошибка, второй — успех
        mock_vk.side_effect = [
            Exception("Token expired"),  # Первый токен
            {"upload_url": "https://upload.vk.com/wall456"},  # Второй токен
            [{"id": 111, "owner_id": -200}],
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "photo": "data", "server": 1, "hash": "xyz"
        }
        mock_post.return_value = mock_response

        result = upload_wall_photo(100, b"img", "test.jpg", "token_new")
        assert result["id"] == 111

    @patch(ADMIN_TOKENS_PATH, return_value=[])
    @patch(VK_API_PATH, side_effect=Exception("fail"))
    def test_all_tokens_fail_raises(self, mock_vk, mock_tokens):
        """Все токены провалились — выбрасывается последнее исключение."""
        from services.vk_api.upload_photos import upload_wall_photo

        with pytest.raises(Exception):
            upload_wall_photo(100, b"img", "test.jpg", "bad_token")


class TestUploadAlbumPhoto:
    """Тесты для upload_album_photo — загрузка фото в альбом."""

    @patch(ADMIN_TOKENS_PATH, return_value=["token_admin1"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_success_full_flow(self, mock_vk, mock_post, mock_tokens):
        """Успешный путь: getUploadServer → POST → photos.save."""
        from services.vk_api.upload_photos import upload_album_photo

        mock_vk.side_effect = [
            {"upload_url": "https://upload.vk.com/album123"},
            [{"id": 555, "owner_id": -100, "album_id": 42}],
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "photos_list": "[1]",
            "server": 1,
            "hash": "hash123",
        }
        mock_post.return_value = mock_response

        result = upload_album_photo(
            group_id=100, album_id=42, file_bytes=b"album_img",
            file_name="album.jpg", user_token="token_admin1"
        )

        # Проверяем вызовы VK API
        assert mock_vk.call_count == 2
        assert mock_vk.call_args_list[0][0][0] == "photos.getUploadServer"
        assert mock_vk.call_args_list[1][0][0] == "photos.save"
        assert result["id"] == 555

    @patch(ADMIN_TOKENS_PATH, return_value=["token_admin1"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_album_id_passed_to_api(self, mock_vk, mock_post, mock_tokens):
        """album_id передаётся в getUploadServer и photos.save."""
        from services.vk_api.upload_photos import upload_album_photo

        mock_vk.side_effect = [
            {"upload_url": "https://upload.vk.com/a"},
            [{"id": 1}],
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "photos_list": "[1]", "server": 1, "hash": "h"
        }
        mock_post.return_value = mock_response

        upload_album_photo(100, 42, b"img", "test.jpg", "token_admin1")

        # getUploadServer должен передать album_id
        call_params = mock_vk.call_args_list[0][0][1]
        assert call_params["album_id"] == 42
        # photos.save тоже должен передать album_id
        save_params = mock_vk.call_args_list[1][0][1]
        assert save_params["album_id"] == 42

    @patch(ADMIN_TOKENS_PATH, return_value=["token_admin1"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_bad_upload_response_raises(self, mock_vk, mock_post, mock_tokens):
        """Ответ загрузки без photos_list — исключение."""
        from services.vk_api.upload_photos import upload_album_photo

        mock_vk.side_effect = [{"upload_url": "https://upload.vk.com/a"}]
        mock_response = MagicMock()
        mock_response.json.return_value = {"server": 1}  # Нет photos_list и hash
        mock_post.return_value = mock_response

        with pytest.raises(Exception, match="Bad upload response"):
            upload_album_photo(100, 42, b"img", "test.jpg", "token_admin1")

    @patch(ADMIN_TOKENS_PATH, return_value=[])
    @patch(VK_API_PATH, side_effect=Exception("no tokens"))
    def test_all_tokens_fail_raises(self, mock_vk, mock_tokens):
        """Все токены провалились — исключение."""
        from services.vk_api.upload_photos import upload_album_photo

        with pytest.raises(Exception):
            upload_album_photo(100, 42, b"img", "test.jpg", "bad")

    @patch(ADMIN_TOKENS_PATH, return_value=["tok1"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_user_token_placed_first(self, mock_vk, mock_post, mock_tokens):
        """user_token, отсутствующий в списке, добавляется в начало."""
        from services.vk_api.upload_photos import upload_album_photo

        mock_vk.side_effect = [
            {"upload_url": "https://up.vk.com/x"},
            [{"id": 1}],
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "photos_list": "[1]", "server": 1, "hash": "h"
        }
        mock_post.return_value = mock_response

        upload_album_photo(100, 42, b"img", "a.jpg", "my_token")

        # Первый вызов VK API должен использовать my_token (вставлен в начало)
        first_params = mock_vk.call_args_list[0][0][1]
        assert first_params["access_token"] == "my_token"
