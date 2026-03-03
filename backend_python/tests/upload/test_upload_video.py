"""
Тесты для модуля upload_video — загрузка видео в сообщество VK.
Функция upload_video + хелпер _fetch_video_thumbnail.
"""

import pytest
from unittest.mock import MagicMock, patch, call


# Пути для патчей
VK_API_PATH = "services.vk_api.upload_video._raw_call_vk_api"
REQUESTS_POST_PATH = "services.vk_api.upload_video.requests.post"
ADMIN_TOKENS_PATH = "services.vk_api.upload_video.get_admin_token_strings_for_group"
TIME_SLEEP_PATH = "services.vk_api.upload_video.time.sleep"


# ─── _fetch_video_thumbnail ─────────────────────────────────────────────


class TestFetchVideoThumbnail:
    """Тесты для _fetch_video_thumbnail — получение превью видео."""

    @patch(TIME_SLEEP_PATH)
    @patch(VK_API_PATH)
    def test_success_first_attempt(self, mock_vk, mock_sleep):
        """Получение превью с первой попытки."""
        from services.vk_api.upload_video import _fetch_video_thumbnail

        mock_vk.return_value = {
            "items": [{
                "image": [
                    {"url": "https://thumb.vk.com/small.jpg", "width": 130},
                    {"url": "https://thumb.vk.com/large.jpg", "width": 800},
                ],
                "player": "https://vk.com/video_ext.php?oid=-100&id=456"
            }]
        }

        thumb, player = _fetch_video_thumbnail("tok", -100, 456, "key", max_attempts=3)

        assert thumb == "https://thumb.vk.com/large.jpg"
        assert player == "https://vk.com/video_ext.php?oid=-100&id=456"
        # sleep не вызывался (успех с первой попытки)
        mock_sleep.assert_not_called()

    @patch(TIME_SLEEP_PATH)
    @patch(VK_API_PATH)
    def test_retry_on_missing_thumbnail(self, mock_vk, mock_sleep):
        """Ретрай когда превью не готово — пустые images."""
        from services.vk_api.upload_video import _fetch_video_thumbnail

        # Первые 2 попытки — нет превью, третья — есть
        mock_vk.side_effect = [
            {"items": [{"image": [], "player": ""}]},
            {"items": [{"image": [], "player": ""}]},
            {"items": [{"image": [{"url": "https://thumb.vk.com/ready.jpg"}], "player": "p"}]},
        ]

        thumb, player = _fetch_video_thumbnail("tok", -100, 456, "key", max_attempts=3)

        assert thumb == "https://thumb.vk.com/ready.jpg"
        # sleep вызывался перед 2-й и 3-й попытками
        assert mock_sleep.call_count == 2

    @patch(TIME_SLEEP_PATH)
    @patch(VK_API_PATH)
    def test_all_attempts_fail_returns_none(self, mock_vk, mock_sleep):
        """Все попытки провалились — возвращает (None, None)."""
        from services.vk_api.upload_video import _fetch_video_thumbnail

        mock_vk.side_effect = Exception("Network error")

        thumb, player = _fetch_video_thumbnail("tok", -100, 456, "key", max_attempts=2)

        assert thumb is None
        assert player is None

    @patch(TIME_SLEEP_PATH)
    @patch(VK_API_PATH)
    def test_fallback_to_photo_fields(self, mock_vk, mock_sleep):
        """Фолбэк на photo_800/photo_320 если нет image[]."""
        from services.vk_api.upload_video import _fetch_video_thumbnail

        mock_vk.return_value = {
            "items": [{
                "photo_800": "https://thumb.vk.com/photo_800.jpg",
                "photo_320": "https://thumb.vk.com/photo_320.jpg",
                "player": "p"
            }]
        }

        thumb, player = _fetch_video_thumbnail("tok", -100, 456, "key")

        assert thumb == "https://thumb.vk.com/photo_800.jpg"

    @patch(TIME_SLEEP_PATH)
    @patch(VK_API_PATH)
    def test_access_key_in_video_identifier(self, mock_vk, mock_sleep):
        """access_key добавляется в идентификатор видео."""
        from services.vk_api.upload_video import _fetch_video_thumbnail

        mock_vk.return_value = {"items": [{"image": [{"url": "u"}], "player": "p"}]}

        _fetch_video_thumbnail("tok", -100, 456, "my_key")

        params = mock_vk.call_args[0][1]
        assert params["videos"] == "-100_456_my_key"

    @patch(TIME_SLEEP_PATH)
    @patch(VK_API_PATH)
    def test_no_access_key(self, mock_vk, mock_sleep):
        """Без access_key — идентификатор без суффикса."""
        from services.vk_api.upload_video import _fetch_video_thumbnail

        mock_vk.return_value = {"items": [{"image": [{"url": "u"}], "player": "p"}]}

        _fetch_video_thumbnail("tok", -100, 456, "")

        params = mock_vk.call_args[0][1]
        assert params["videos"] == "-100_456"

    @patch(TIME_SLEEP_PATH)
    @patch(VK_API_PATH)
    def test_empty_items_returns_none(self, mock_vk, mock_sleep):
        """Пустой items — (None, None)."""
        from services.vk_api.upload_video import _fetch_video_thumbnail

        mock_vk.return_value = {"items": []}

        thumb, player = _fetch_video_thumbnail("tok", -100, 456, "", max_attempts=1)

        assert thumb is None
        assert player is None


# ─── upload_video ────────────────────────────────────────────────────────


class TestUploadVideo:
    """Тесты для upload_video — загрузка видео в сообщество."""

    @patch(ADMIN_TOKENS_PATH, return_value=["admin_tok"])
    @patch("services.vk_api.upload_video._fetch_video_thumbnail", return_value=("thumb.jpg", "player_url"))
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_success_full_flow(self, mock_vk, mock_post, mock_thumb, mock_tokens):
        """Успешный путь: video.save → POST → thumbnail."""
        from services.vk_api.upload_video import upload_video

        mock_vk.return_value = {
            "upload_url": "https://upload.vk.com/video",
            "video_id": 789,
            "owner_id": -100,
            "access_key": "abc",
            "title": "My Video",
            "description": "desc",
        }
        mock_response = MagicMock()
        mock_response.json.return_value = {"size": 1024}
        mock_post.return_value = mock_response

        result = upload_video(
            group_id=100, file_bytes=b"video_data", file_name="clip.mp4",
            user_token="admin_tok", name="Тест", description="Описание"
        )

        assert mock_vk.call_args[0][0] == "video.save"
        assert result["video_id"] == 789
        assert result["owner_id"] == -100
        assert result["access_key"] == "abc"
        assert result["thumbnail_url"] == "thumb.jpg"
        assert result["player_url"] == "player_url"

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch("services.vk_api.upload_video._fetch_video_thumbnail", return_value=(None, None))
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_name_and_description_passed(self, mock_vk, mock_post, mock_thumb, mock_tokens):
        """name и description передаются в video.save."""
        from services.vk_api.upload_video import upload_video

        mock_vk.return_value = {
            "upload_url": "https://up.vk.com/v",
            "video_id": 1, "owner_id": -1, "access_key": ""
        }
        mock_response = MagicMock()
        mock_response.json.return_value = {}
        mock_post.return_value = mock_response

        upload_video(100, b"vid", "c.mp4", "tok", name="Ролик", description="Описание")

        params = mock_vk.call_args[0][1]
        assert params["name"] == "Ролик"
        assert params["description"] == "Описание"

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch("services.vk_api.upload_video._fetch_video_thumbnail", return_value=(None, None))
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_name_truncated_to_128(self, mock_vk, mock_post, mock_thumb, mock_tokens):
        """Имя видео обрезается до 128 символов."""
        from services.vk_api.upload_video import upload_video

        mock_vk.return_value = {
            "upload_url": "https://up.vk.com/v",
            "video_id": 1, "owner_id": -1, "access_key": ""
        }
        mock_response = MagicMock()
        mock_response.json.return_value = {}
        mock_post.return_value = mock_response

        long_name = "Б" * 200
        upload_video(100, b"vid", "c.mp4", "tok", name=long_name)

        params = mock_vk.call_args[0][1]
        assert len(params["name"]) == 128

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch("services.vk_api.upload_video._fetch_video_thumbnail", return_value=(None, None))
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_description_truncated_to_5000(self, mock_vk, mock_post, mock_thumb, mock_tokens):
        """Описание обрезается до 5000 символов."""
        from services.vk_api.upload_video import upload_video

        mock_vk.return_value = {
            "upload_url": "https://up.vk.com/v",
            "video_id": 1, "owner_id": -1, "access_key": ""
        }
        mock_response = MagicMock()
        mock_response.json.return_value = {}
        mock_post.return_value = mock_response

        long_desc = "X" * 6000
        upload_video(100, b"vid", "c.mp4", "tok", description=long_desc)

        params = mock_vk.call_args[0][1]
        assert len(params["description"]) == 5000

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch(VK_API_PATH)
    def test_no_upload_url_raises(self, mock_vk, mock_tokens):
        """video.save без upload_url — исключение."""
        from services.vk_api.upload_video import upload_video

        mock_vk.return_value = {"video_id": 1, "owner_id": -1}

        with pytest.raises(Exception, match="upload_url"):
            upload_video(100, b"vid", "c.mp4", "tok")

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_upload_error_in_response_raises(self, mock_vk, mock_post, mock_tokens):
        """Ошибка в JSON-ответе загрузки — пробрасывается."""
        from services.vk_api.upload_video import upload_video

        mock_vk.return_value = {
            "upload_url": "https://up.vk.com/v",
            "video_id": 1, "owner_id": -1, "access_key": ""
        }
        mock_response = MagicMock()
        mock_response.json.return_value = {"error": "upload failed"}
        mock_post.return_value = mock_response

        with pytest.raises(Exception, match="Ошибка загрузки видео"):
            upload_video(100, b"vid", "c.mp4", "tok")

    @patch(ADMIN_TOKENS_PATH, return_value=["tok1", "tok2"])
    @patch("services.vk_api.upload_video._fetch_video_thumbnail", return_value=(None, None))
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_token_rotation_on_failure(self, mock_vk, mock_post, mock_thumb, mock_tokens):
        """Первый токен упал — используется второй."""
        from services.vk_api.upload_video import upload_video

        mock_vk.side_effect = [
            Exception("Token expired"),  # Первый токен
            {  # Второй токен — успех
                "upload_url": "https://up.vk.com/v",
                "video_id": 10, "owner_id": -100, "access_key": "k"
            },
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {}
        mock_post.return_value = mock_response

        result = upload_video(100, b"vid", "c.mp4", "new_tok")
        assert result["video_id"] == 10

    @patch(ADMIN_TOKENS_PATH, return_value=[])
    @patch(VK_API_PATH, side_effect=Exception("fail"))
    def test_all_tokens_fail_raises(self, mock_vk, mock_tokens):
        """Все токены провалились — исключение."""
        from services.vk_api.upload_video import upload_video

        with pytest.raises(Exception):
            upload_video(100, b"vid", "c.mp4", "bad_tok")

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch("services.vk_api.upload_video._fetch_video_thumbnail", return_value=(None, None))
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_mime_type_for_avi(self, mock_vk, mock_post, mock_thumb, mock_tokens):
        """Для .avi файла передаётся правильный MIME-тип."""
        from services.vk_api.upload_video import upload_video

        mock_vk.return_value = {
            "upload_url": "https://up.vk.com/v",
            "video_id": 1, "owner_id": -1, "access_key": ""
        }
        mock_response = MagicMock()
        mock_response.json.return_value = {}
        mock_post.return_value = mock_response

        upload_video(100, b"vid", "clip.avi", "tok")

        call_kwargs = mock_post.call_args
        files_arg = call_kwargs[1].get("files") or call_kwargs.kwargs.get("files")
        video_tuple = files_arg["video_file"]
        assert video_tuple[2] == "video/x-msvideo"

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch("services.vk_api.upload_video._fetch_video_thumbnail", return_value=("t.jpg", "p.url"))
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_no_json_response_ok(self, mock_vk, mock_post, mock_thumb, mock_tokens):
        """Upload-сервер вернул не JSON (200 OK без тела) — не падает."""
        from services.vk_api.upload_video import upload_video

        mock_vk.return_value = {
            "upload_url": "https://up.vk.com/v",
            "video_id": 1, "owner_id": -1, "access_key": ""
        }
        mock_response = MagicMock()
        mock_response.json.side_effect = ValueError("No JSON")
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        result = upload_video(100, b"vid", "c.mp4", "tok")
        assert result["video_id"] == 1
