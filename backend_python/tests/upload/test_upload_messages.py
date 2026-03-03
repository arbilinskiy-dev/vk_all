"""
Тесты для модуля upload_messages — загрузка медиа для личных сообщений VK.
Хелперы определения MIME-типов + функции загрузки фото, документов и видео.
"""

import pytest
from unittest.mock import MagicMock, patch


# Пути для патчей
VK_API_PATH = "services.vk_api.upload_messages._raw_call_vk_api"
REQUESTS_POST_PATH = "services.vk_api.upload_messages.requests.post"
ADMIN_TOKENS_PATH = "services.vk_api.upload_messages.get_admin_token_strings_for_group"


# ─── Хелперы определения MIME-типов ───────────────────────────────────


class TestDetectImageContentType:
    """Тесты для _detect_image_content_type — определение content-type изображения."""

    def _detect(self, name: str) -> str:
        from services.vk_api.upload_messages import _detect_image_content_type
        return _detect_image_content_type(name)

    def test_jpg(self):
        assert self._detect("photo.jpg") == "image/jpeg"

    def test_jpeg(self):
        assert self._detect("photo.jpeg") == "image/jpeg"

    def test_png(self):
        assert self._detect("image.png") == "image/png"

    def test_gif(self):
        assert self._detect("anim.gif") == "image/gif"

    def test_bmp(self):
        assert self._detect("bitmap.bmp") == "image/bmp"

    def test_webp(self):
        assert self._detect("modern.webp") == "image/webp"

    def test_unknown_extension_defaults_to_jpeg(self):
        """Неизвестное расширение — по умолчанию image/jpeg."""
        assert self._detect("file.tiff") == "image/jpeg"

    def test_no_extension_defaults_to_jpeg(self):
        """Без расширения — image/jpeg."""
        assert self._detect("noext") == "image/jpeg"

    def test_none_defaults_to_jpeg(self):
        """None → фолбэк на 'photo.jpg' → image/jpeg."""
        assert self._detect(None) == "image/jpeg"

    def test_case_insensitive(self):
        """Регистр не влияет."""
        assert self._detect("PHOTO.PNG") == "image/png"


class TestDetectDocContentType:
    """Тесты для _detect_doc_content_type — определение content-type документа."""

    def _detect(self, name: str) -> str:
        from services.vk_api.upload_messages import _detect_doc_content_type
        return _detect_doc_content_type(name)

    def test_pdf(self):
        assert self._detect("document.pdf") == "application/pdf"

    def test_doc(self):
        assert self._detect("file.doc") == "application/msword"

    def test_docx(self):
        assert "wordprocessingml" in self._detect("file.docx")

    def test_xls(self):
        assert self._detect("table.xls") == "application/vnd.ms-excel"

    def test_xlsx(self):
        assert "spreadsheetml" in self._detect("table.xlsx")

    def test_ppt(self):
        assert self._detect("slides.ppt") == "application/vnd.ms-powerpoint"

    def test_pptx(self):
        assert "presentationml" in self._detect("slides.pptx")

    def test_zip(self):
        assert self._detect("archive.zip") == "application/zip"

    def test_rar(self):
        assert self._detect("archive.rar") == "application/x-rar-compressed"

    def test_txt(self):
        assert self._detect("readme.txt") == "text/plain"

    def test_csv(self):
        assert self._detect("data.csv") == "text/csv"

    def test_gif_in_docs(self):
        """GIF в списке документов — image/gif."""
        assert self._detect("anim.gif") == "image/gif"

    def test_unknown_extension(self):
        """Неизвестное расширение — application/octet-stream."""
        assert self._detect("data.bin") == "application/octet-stream"

    def test_no_extension(self):
        """Без расширения — octet-stream."""
        assert self._detect("noext") == "application/octet-stream"

    def test_none_input(self):
        """None → фолбэк на 'document' → octet-stream."""
        assert self._detect(None) == "application/octet-stream"


class TestDetectVideoMimeType:
    """Тесты для _detect_video_mime_type — определение MIME-типа видео."""

    def _detect(self, name: str) -> str:
        from services.vk_api.upload_messages import _detect_video_mime_type
        return _detect_video_mime_type(name)

    def test_mp4(self):
        assert self._detect("video.mp4") == "video/mp4"

    def test_avi(self):
        assert self._detect("clip.avi") == "video/x-msvideo"

    def test_mov(self):
        assert self._detect("movie.mov") == "video/quicktime"

    def test_wmv(self):
        assert self._detect("clip.wmv") == "video/x-ms-wmv"

    def test_flv(self):
        assert self._detect("flash.flv") == "video/x-flv"

    def test_mkv(self):
        assert self._detect("film.mkv") == "video/x-matroska"

    def test_3gp(self):
        assert self._detect("mobile.3gp") == "video/3gpp"

    def test_webm(self):
        assert self._detect("modern.webm") == "video/webm"

    def test_unknown_defaults_to_mp4(self):
        """Неизвестное расширение → video/mp4."""
        assert self._detect("file.ogv") == "video/mp4"

    def test_no_extension_defaults_to_mp4(self):
        """Без расширения → video/mp4."""
        assert self._detect("noext") == "video/mp4"


# ─── Загрузка фото в сообщения ─────────────────────────────────────────


class TestUploadMessagePhoto:
    """Тесты для upload_message_photo — фото для ЛС."""

    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_success_full_flow(self, mock_vk, mock_post):
        """Успешный путь: getMessagesUploadServer → POST → saveMessagesPhoto."""
        from services.vk_api.upload_messages import upload_message_photo

        mock_vk.side_effect = [
            {"upload_url": "https://upload.vk.com/msg_photo"},
            [{"id": 777, "owner_id": -100}],
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "photo": "photo_data", "server": 1, "hash": "h123"
        }
        mock_post.return_value = mock_response

        result = upload_message_photo(
            group_id=100, peer_id=12345, file_bytes=b"img",
            file_name="pic.jpg", community_tokens=["comm_token"]
        )

        assert mock_vk.call_count == 2
        assert mock_vk.call_args_list[0][0][0] == "photos.getMessagesUploadServer"
        assert mock_vk.call_args_list[1][0][0] == "photos.saveMessagesPhoto"
        assert result["id"] == 777

    def test_no_community_tokens_raises(self):
        """Без community_tokens — исключение."""
        from services.vk_api.upload_messages import upload_message_photo

        with pytest.raises(Exception, match="токенов сообщества"):
            upload_message_photo(100, 12345, b"img", "pic.jpg", community_tokens=[])

    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_empty_photo_field_raises(self, mock_vk, mock_post):
        """Пустое поле photo в ответе upload-сервера — исключение."""
        from services.vk_api.upload_messages import upload_message_photo

        mock_vk.side_effect = [{"upload_url": "https://upload.vk.com/x"}]
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "photo": "[]", "server": 1, "hash": ""
        }
        mock_post.return_value = mock_response

        with pytest.raises(Exception, match="пустые данные"):
            upload_message_photo(100, 123, b"img", "pic.jpg", ["tok"])

    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_content_type_set_for_png(self, mock_vk, mock_post):
        """Для .png файла передаётся правильный content-type."""
        from services.vk_api.upload_messages import upload_message_photo

        mock_vk.side_effect = [
            {"upload_url": "https://upload.vk.com/x"},
            [{"id": 1}],
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "photo": "data", "server": 1, "hash": "h"
        }
        mock_post.return_value = mock_response

        upload_message_photo(100, 123, b"img", "pic.png", ["tok"])

        # Проверяем что в files передан правильный content-type
        call_kwargs = mock_post.call_args
        files_arg = call_kwargs[1].get("files") or call_kwargs[0][0] if call_kwargs[0] else call_kwargs[1]["files"]
        # files={'photo': (file_name, file_bytes, content_type)}
        photo_tuple = files_arg["photo"]
        assert photo_tuple[2] == "image/png"


# ─── Загрузка документов в сообщения ────────────────────────────────────


class TestUploadMessageDoc:
    """Тесты для upload_message_doc — документы для ЛС."""

    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_success_full_flow(self, mock_vk, mock_post):
        """Успешный путь: getMessagesUploadServer → POST → docs.save."""
        from services.vk_api.upload_messages import upload_message_doc

        mock_vk.side_effect = [
            {"upload_url": "https://upload.vk.com/msg_doc"},
            {"type": "doc", "doc": {"id": 888, "owner_id": -100, "title": "report.pdf"}},
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {"file": "file_token_abc"}
        mock_post.return_value = mock_response

        result = upload_message_doc(
            group_id=100, peer_id=12345, file_bytes=b"pdf_data",
            file_name="report.pdf", community_tokens=["comm_token"]
        )

        assert mock_vk.call_count == 2
        assert mock_vk.call_args_list[0][0][0] == "docs.getMessagesUploadServer"
        assert mock_vk.call_args_list[1][0][0] == "docs.save"
        assert result["id"] == 888

    def test_no_community_tokens_raises(self):
        """Без community_tokens — исключение."""
        from services.vk_api.upload_messages import upload_message_doc

        with pytest.raises(Exception, match="токенов сообщества"):
            upload_message_doc(100, 12345, b"data", "doc.pdf", community_tokens=[])

    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_empty_file_field_raises(self, mock_vk, mock_post):
        """Пустое поле file в ответе upload-сервера — исключение."""
        from services.vk_api.upload_messages import upload_message_doc

        mock_vk.side_effect = [{"upload_url": "https://upload.vk.com/x"}]
        mock_response = MagicMock()
        mock_response.json.return_value = {"file": ""}
        mock_post.return_value = mock_response

        with pytest.raises(Exception, match="пустые данные"):
            upload_message_doc(100, 123, b"data", "doc.pdf", ["tok"])

    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_doc_type_passed_to_server(self, mock_vk, mock_post):
        """Параметр type='doc' передаётся в getMessagesUploadServer."""
        from services.vk_api.upload_messages import upload_message_doc

        mock_vk.side_effect = [
            {"upload_url": "https://upload.vk.com/x"},
            {"doc": {"id": 1, "owner_id": -1}},
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {"file": "token"}
        mock_post.return_value = mock_response

        upload_message_doc(100, 123, b"data", "doc.pdf", ["tok"])

        params = mock_vk.call_args_list[0][0][1]
        assert params["type"] == "doc"


# ─── Загрузка видео в сообщения ─────────────────────────────────────────


class TestUploadMessageVideo:
    """Тесты для upload_message_video — видео для ЛС."""

    @patch(ADMIN_TOKENS_PATH, return_value=["user_token_1"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_success_full_flow(self, mock_vk, mock_post, mock_tokens):
        """Успешный путь: video.save → POST файл."""
        from services.vk_api.upload_messages import upload_message_video

        mock_vk.return_value = {
            "upload_url": "https://upload.vk.com/video",
            "video_id": 456,
            "owner_id": -100,
            "access_key": "key123",
            "title": "my_video",
        }
        mock_response = MagicMock()
        mock_response.json.return_value = {"size": 1024}
        mock_post.return_value = mock_response

        result = upload_message_video(
            group_id=100, peer_id=12345, file_bytes=b"video_data",
            file_name="clip.mp4", community_tokens=None, name="Ролик"
        )

        assert mock_vk.call_args[0][0] == "video.save"
        assert result["video_id"] == 456
        assert result["owner_id"] == -100
        assert result["access_key"] == "key123"

    @patch(ADMIN_TOKENS_PATH, return_value=[])
    def test_no_user_tokens_raises(self, mock_tokens):
        """Без user-токенов — исключение (video.save требует user-token)."""
        from services.vk_api.upload_messages import upload_message_video

        with pytest.raises(Exception, match="user-токенов"):
            upload_message_video(100, 123, b"vid", "clip.mp4")

    @patch(ADMIN_TOKENS_PATH, return_value=["tok1"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_is_private_flag_set(self, mock_vk, mock_post, mock_tokens):
        """video.save вызывается с is_private=1."""
        from services.vk_api.upload_messages import upload_message_video

        mock_vk.return_value = {
            "upload_url": "https://up.vk.com/v",
            "video_id": 1, "owner_id": -1, "access_key": "k"
        }
        mock_response = MagicMock()
        mock_response.json.return_value = {}
        mock_post.return_value = mock_response

        upload_message_video(100, 123, b"vid", "clip.mp4")

        params = mock_vk.call_args[0][1]
        assert params["is_private"] == 1

    @patch(ADMIN_TOKENS_PATH, return_value=["tok1"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_upload_error_in_response_raises(self, mock_vk, mock_post, mock_tokens):
        """Ошибка в JSON-ответе загрузки видео — пробрасывается."""
        from services.vk_api.upload_messages import upload_message_video

        mock_vk.return_value = {
            "upload_url": "https://up.vk.com/v",
            "video_id": 1, "owner_id": -1, "access_key": "k"
        }
        mock_response = MagicMock()
        mock_response.json.return_value = {"error": "upload failed"}
        mock_post.return_value = mock_response

        with pytest.raises(Exception, match="Ошибка загрузки видео"):
            upload_message_video(100, 123, b"vid", "clip.mp4")

    @patch(ADMIN_TOKENS_PATH, return_value=["tok1"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_name_truncated_to_128(self, mock_vk, mock_post, mock_tokens):
        """Имя видео обрезается до 128 символов."""
        from services.vk_api.upload_messages import upload_message_video

        mock_vk.return_value = {
            "upload_url": "https://up.vk.com/v",
            "video_id": 1, "owner_id": -1, "access_key": "k"
        }
        mock_response = MagicMock()
        mock_response.json.return_value = {}
        mock_post.return_value = mock_response

        long_name = "A" * 200
        upload_message_video(100, 123, b"vid", "clip.mp4", name=long_name)

        params = mock_vk.call_args[0][1]
        assert len(params["name"]) == 128
