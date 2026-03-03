"""
Тесты для модуля upload_stories — загрузка историй VK (фото и видео).
Хелперы парсинга + функции загрузки.
"""

import pytest
from unittest.mock import MagicMock, patch


# Пути для патчей
VK_API_PATH = "services.vk_api.upload_stories._raw_call_vk_api"
REQUESTS_POST_PATH = "services.vk_api.upload_stories.requests.post"
ADMIN_TOKENS_PATH = "services.vk_api.upload_stories.get_admin_token_strings_for_group"


# ─── Хелперы парсинга ──────────────────────────────────────────────────


class TestParseStoryUploadResult:
    """Тесты для _parse_story_upload_result — извлечение upload_result."""

    def _parse(self, resp: dict) -> str:
        from services.vk_api.upload_stories import _parse_story_upload_result
        return _parse_story_upload_result(resp)

    def test_direct_upload_result(self):
        """upload_result на верхнем уровне."""
        assert self._parse({"upload_result": "res123"}) == "res123"

    def test_nested_in_response(self):
        """upload_result внутри response.upload_result."""
        resp = {"response": {"upload_result": "nested_res"}}
        assert self._parse(resp) == "nested_res"

    def test_no_upload_result(self):
        """Нет upload_result нигде — возвращает None."""
        assert self._parse({"something": "else"}) is None

    def test_empty_response(self):
        """Пустой словарь — None."""
        assert self._parse({}) is None

    def test_response_not_dict(self):
        """response — не словарь (например, строка) — None."""
        assert self._parse({"response": "not_a_dict"}) is None


class TestExtractStoryFromResponse:
    """Тесты для _extract_story_from_response — извлечение первой истории."""

    def _extract(self, resp: dict) -> dict:
        from services.vk_api.upload_stories import _extract_story_from_response
        return _extract_story_from_response(resp)

    def test_items_with_stories(self):
        """Стандартный ответ: items с историями."""
        story = {"id": 1, "owner_id": -100}
        assert self._extract({"items": [story]}) == story

    def test_items_empty(self):
        """items пуст — None."""
        assert self._extract({"items": []}) is None

    def test_count_with_items(self):
        """Ответ с count > 0 и items."""
        story = {"id": 2, "owner_id": -200}
        assert self._extract({"count": 1, "items": [story]}) == story

    def test_none_input(self):
        """None на входе — None."""
        assert self._extract(None) is None

    def test_empty_dict(self):
        """Пустой словарь — None."""
        assert self._extract({}) is None

    def test_returns_first_item(self):
        """Из нескольких историй возвращается первая."""
        stories = [{"id": 1}, {"id": 2}, {"id": 3}]
        assert self._extract({"items": stories})["id"] == 1


# ─── Загрузка фото-истории ──────────────────────────────────────────────


class TestUploadStory:
    """Тесты для upload_story — фото-история."""

    @patch(ADMIN_TOKENS_PATH, return_value=["admin_tok"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_success_full_flow(self, mock_vk, mock_post, mock_tokens):
        """Успешный путь: getPhotoUploadServer → POST → stories.save."""
        from services.vk_api.upload_stories import upload_story

        mock_vk.side_effect = [
            {"upload_url": "https://upload.vk.com/story"},
            {"items": [{"id": 111, "owner_id": -100}]},
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {"upload_result": "result_token"}
        mock_post.return_value = mock_response

        result = upload_story(
            group_id=100, file_bytes=b"img", file_name="story.jpg",
            user_token="admin_tok"
        )

        assert mock_vk.call_count == 2
        assert mock_vk.call_args_list[0][0][0] == "stories.getPhotoUploadServer"
        assert mock_vk.call_args_list[1][0][0] == "stories.save"
        assert result["id"] == 111

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_link_params_passed_to_get_server(self, mock_vk, mock_post, mock_tokens):
        """link_text и link_url передаются в getPhotoUploadServer."""
        from services.vk_api.upload_stories import upload_story

        mock_vk.side_effect = [
            {"upload_url": "https://up.vk.com/s"},
            {"items": [{"id": 1}]},
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {"upload_result": "r"}
        mock_post.return_value = mock_response

        upload_story(
            100, b"img", "s.jpg", "tok",
            link_text="go_to", link_url="https://vk.com/wall-100_1"
        )

        params = mock_vk.call_args_list[0][0][1]
        assert params["link_text"] == "go_to"
        assert params["link_url"] == "https://vk.com/wall-100_1"

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_attachment_passed_to_save(self, mock_vk, mock_post, mock_tokens):
        """attachment передаётся в stories.save."""
        from services.vk_api.upload_stories import upload_story

        mock_vk.side_effect = [
            {"upload_url": "https://up.vk.com/s"},
            {"items": [{"id": 1}]},
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {"upload_result": "r"}
        mock_post.return_value = mock_response

        upload_story(
            100, b"img", "s.jpg", "tok",
            attachment="wall-100_456"
        )

        save_params = mock_vk.call_args_list[1][0][1]
        assert save_params["attachment"] == "wall-100_456"

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_bad_upload_result_raises(self, mock_vk, mock_post, mock_tokens):
        """Ответ без upload_result — исключение."""
        from services.vk_api.upload_stories import upload_story

        mock_vk.side_effect = [{"upload_url": "https://up.vk.com/s"}]
        mock_response = MagicMock()
        mock_response.json.return_value = {"error": "bad"}
        mock_post.return_value = mock_response

        with pytest.raises(Exception, match="Bad upload response"):
            upload_story(100, b"img", "s.jpg", "tok")

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_no_story_in_save_response_raises(self, mock_vk, mock_post, mock_tokens):
        """stories.save без items — исключение."""
        from services.vk_api.upload_stories import upload_story

        mock_vk.side_effect = [
            {"upload_url": "https://up.vk.com/s"},
            {"items": []},  # Пустой результат
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {"upload_result": "r"}
        mock_post.return_value = mock_response

        with pytest.raises(Exception, match="No story data"):
            upload_story(100, b"img", "s.jpg", "tok")

    @patch(ADMIN_TOKENS_PATH, return_value=[])
    @patch(VK_API_PATH, side_effect=Exception("fail"))
    def test_all_tokens_fail_raises(self, mock_vk, mock_tokens):
        """Все токены провалились — исключение."""
        from services.vk_api.upload_stories import upload_story

        with pytest.raises(Exception):
            upload_story(100, b"img", "s.jpg", "bad_tok")


# ─── Загрузка видео-истории ─────────────────────────────────────────────


class TestUploadVideoStory:
    """Тесты для upload_video_story — видео-история."""

    @patch(ADMIN_TOKENS_PATH, return_value=["admin_tok"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_success_full_flow(self, mock_vk, mock_post, mock_tokens):
        """Успешный путь: getVideoUploadServer → POST → stories.save."""
        from services.vk_api.upload_stories import upload_video_story

        mock_vk.side_effect = [
            {"upload_url": "https://upload.vk.com/vstory"},
            {"items": [{"id": 222, "owner_id": -100, "type": "video"}]},
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {"upload_result": "vtoken"}
        mock_post.return_value = mock_response

        result = upload_video_story(
            group_id=100, file_bytes=b"video", file_name="story.mp4",
            user_token="admin_tok"
        )

        assert mock_vk.call_args_list[0][0][0] == "stories.getVideoUploadServer"
        assert mock_vk.call_args_list[1][0][0] == "stories.save"
        assert result["id"] == 222

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_video_file_field_name(self, mock_vk, mock_post, mock_tokens):
        """Видео загружается с полем 'video_file', а не 'photo'."""
        from services.vk_api.upload_stories import upload_video_story

        mock_vk.side_effect = [
            {"upload_url": "https://up.vk.com/vs"},
            {"items": [{"id": 1}]},
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {"upload_result": "r"}
        mock_post.return_value = mock_response

        upload_video_story(100, b"vid", "s.mp4", "tok")

        call_kwargs = mock_post.call_args
        files_arg = call_kwargs[1].get("files") or call_kwargs.kwargs.get("files")
        assert "video_file" in files_arg

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_link_params_passed_to_get_server(self, mock_vk, mock_post, mock_tokens):
        """link_text и link_url передаются в getVideoUploadServer."""
        from services.vk_api.upload_stories import upload_video_story

        mock_vk.side_effect = [
            {"upload_url": "https://up.vk.com/vs"},
            {"items": [{"id": 1}]},
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {"upload_result": "r"}
        mock_post.return_value = mock_response

        upload_video_story(
            100, b"vid", "s.mp4", "tok",
            link_text="more", link_url="https://vk.com/wall-100_2"
        )

        params = mock_vk.call_args_list[0][0][1]
        assert params["link_text"] == "more"
        assert params["link_url"] == "https://vk.com/wall-100_2"

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    def test_mime_type_for_mov(self, mock_vk, mock_post, mock_tokens):
        """Для .mov файла передаётся правильный MIME-тип."""
        from services.vk_api.upload_stories import upload_video_story

        mock_vk.side_effect = [
            {"upload_url": "https://up.vk.com/vs"},
            {"items": [{"id": 1}]},
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {"upload_result": "r"}
        mock_post.return_value = mock_response

        upload_video_story(100, b"vid", "story.mov", "tok")

        call_kwargs = mock_post.call_args
        files_arg = call_kwargs[1].get("files") or call_kwargs.kwargs.get("files")
        video_tuple = files_arg["video_file"]
        assert video_tuple[2] == "video/quicktime"

    @patch(ADMIN_TOKENS_PATH, return_value=[])
    @patch(VK_API_PATH, side_effect=Exception("fail"))
    def test_all_tokens_fail_raises(self, mock_vk, mock_tokens):
        """Все токены провалились — исключение."""
        from services.vk_api.upload_stories import upload_video_story

        with pytest.raises(Exception):
            upload_video_story(100, b"vid", "s.mp4", "bad_tok")
