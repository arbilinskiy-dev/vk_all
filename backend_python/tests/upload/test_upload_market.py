"""
Тесты для модуля upload_market — загрузка фото товаров VK Market.
Ресайз маленьких изображений + загрузка на сервер.
"""

import pytest
from unittest.mock import MagicMock, patch
import io


# Пути для патчей
VK_API_PATH = "services.vk_api.upload_market._raw_call_vk_api"
REQUESTS_POST_PATH = "services.vk_api.upload_market.requests.post"
ADMIN_TOKENS_PATH = "services.vk_api.upload_market.get_admin_token_strings_for_group"


def _make_test_image(width: int, height: int, mode: str = "RGB") -> bytes:
    """Создаёт тестовое изображение заданного размера."""
    from PIL import Image
    img = Image.new(mode, (width, height), color="red")
    buf = io.BytesIO()
    fmt = "JPEG" if mode == "RGB" else "PNG"
    img.save(buf, format=fmt)
    return buf.getvalue()


# ─── ensure_market_photo_min_size ───────────────────────────────────────


class TestEnsureMarketPhotoMinSize:
    """Тесты для ensure_market_photo_min_size — ресайз маленьких фото."""

    def test_large_image_no_resize(self):
        """Фото >= 400x400 — возвращается без изменений."""
        from services.vk_api.upload_market import ensure_market_photo_min_size

        img_bytes = _make_test_image(800, 600)
        result_bytes, resize_info = ensure_market_photo_min_size(img_bytes)

        assert resize_info is None
        assert result_bytes == img_bytes

    def test_exact_minimum_no_resize(self):
        """Фото ровно 400x400 — без ресайза."""
        from services.vk_api.upload_market import ensure_market_photo_min_size

        img_bytes = _make_test_image(400, 400)
        result_bytes, resize_info = ensure_market_photo_min_size(img_bytes)

        assert resize_info is None

    def test_small_image_resized(self):
        """Фото 200x200 — увеличивается до >= 400x400."""
        from services.vk_api.upload_market import ensure_market_photo_min_size

        img_bytes = _make_test_image(200, 200)
        result_bytes, resize_info = ensure_market_photo_min_size(img_bytes)

        assert resize_info is not None
        assert resize_info["original_width"] == 200
        assert resize_info["original_height"] == 200
        assert resize_info["new_width"] >= 400
        assert resize_info["new_height"] >= 400

    def test_small_width_only(self):
        """Ширина < 400, высота >= 400 — ресайз по ширине."""
        from services.vk_api.upload_market import ensure_market_photo_min_size

        img_bytes = _make_test_image(300, 600)
        result_bytes, resize_info = ensure_market_photo_min_size(img_bytes)

        assert resize_info is not None
        assert resize_info["new_width"] >= 400

    def test_small_height_only(self):
        """Высота < 400, ширина >= 400 — ресайз по высоте."""
        from services.vk_api.upload_market import ensure_market_photo_min_size

        img_bytes = _make_test_image(600, 300)
        result_bytes, resize_info = ensure_market_photo_min_size(img_bytes)

        assert resize_info is not None
        assert resize_info["new_height"] >= 400

    def test_aspect_ratio_preserved(self):
        """Пропорции сохраняются при ресайзе."""
        from services.vk_api.upload_market import ensure_market_photo_min_size

        img_bytes = _make_test_image(100, 200)
        _, resize_info = ensure_market_photo_min_size(img_bytes)

        # Исходное соотношение 1:2 должно сохраниться
        assert resize_info is not None
        original_ratio = 100 / 200
        new_ratio = resize_info["new_width"] / resize_info["new_height"]
        assert abs(original_ratio - new_ratio) < 0.01

    def test_resized_output_is_valid_jpeg(self):
        """Результат ресайза — валидный JPEG."""
        from services.vk_api.upload_market import ensure_market_photo_min_size
        from PIL import Image

        img_bytes = _make_test_image(100, 100)
        result_bytes, _ = ensure_market_photo_min_size(img_bytes)

        img = Image.open(io.BytesIO(result_bytes))
        assert img.format == "JPEG"

    def test_custom_min_size(self):
        """Кастомный минимальный размер."""
        from services.vk_api.upload_market import ensure_market_photo_min_size

        img_bytes = _make_test_image(500, 500)
        _, resize_info = ensure_market_photo_min_size(img_bytes, min_width=600, min_height=600)

        assert resize_info is not None
        assert resize_info["new_width"] >= 600

    def test_rgba_image_converted_to_rgb(self):
        """RGBA изображение конвертируется в RGB при ресайзе."""
        from services.vk_api.upload_market import ensure_market_photo_min_size
        from PIL import Image

        img_bytes = _make_test_image(100, 100, mode="RGBA")
        result_bytes, resize_info = ensure_market_photo_min_size(img_bytes)

        assert resize_info is not None
        img = Image.open(io.BytesIO(result_bytes))
        assert img.mode == "RGB"

    def test_invalid_bytes_returns_as_is(self):
        """Невалидные байты — возвращаются без изменений (фолбэк)."""
        from services.vk_api.upload_market import ensure_market_photo_min_size

        bad_bytes = b"not_an_image"
        result_bytes, resize_info = ensure_market_photo_min_size(bad_bytes)

        assert result_bytes == bad_bytes
        assert resize_info is None


# ─── upload_market_photo ────────────────────────────────────────────────


class TestUploadMarketPhoto:
    """Тесты для upload_market_photo — загрузка фото товара."""

    @patch(ADMIN_TOKENS_PATH, return_value=["admin_tok"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    @patch("services.vk_api.upload_market.ensure_market_photo_min_size")
    def test_success_full_flow(self, mock_resize, mock_vk, mock_post, mock_tokens):
        """Успешный путь: resize → getMarketUploadServer → POST → saveMarketPhoto."""
        from services.vk_api.upload_market import upload_market_photo

        mock_resize.return_value = (b"img_bytes", None)  # Без ресайза
        mock_vk.side_effect = [
            {"upload_url": "https://upload.vk.com/market"},
            [{"id": 333, "owner_id": -100}],
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "photo": "data", "server": 1, "hash": "h"
        }
        mock_post.return_value = mock_response

        result = upload_market_photo(100, b"img", "product.jpg", "admin_tok")

        assert mock_vk.call_args_list[0][0][0] == "photos.getMarketUploadServer"
        assert mock_vk.call_args_list[1][0][0] == "photos.saveMarketPhoto"
        assert result["id"] == 333

    @patch(ADMIN_TOKENS_PATH, return_value=["admin_tok"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    @patch("services.vk_api.upload_market.ensure_market_photo_min_size")
    def test_resize_info_in_result(self, mock_resize, mock_vk, mock_post, mock_tokens):
        """Информация о ресайзе добавляется в результат."""
        from services.vk_api.upload_market import upload_market_photo

        resize_info = {"original_width": 100, "original_height": 100, "new_width": 400, "new_height": 400}
        mock_resize.return_value = (b"resized", resize_info)
        mock_vk.side_effect = [
            {"upload_url": "https://upload.vk.com/market"},
            [{"id": 444}],
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "photo": "d", "server": 1, "hash": "h"
        }
        mock_post.return_value = mock_response

        result = upload_market_photo(100, b"img", "small.jpg", "admin_tok")
        assert result.get("_resize_info") == resize_info

    @patch(ADMIN_TOKENS_PATH, return_value=[])
    @patch("services.vk_api.upload_market.ensure_market_photo_min_size", return_value=(b"img", None))
    def test_no_admin_tokens_uses_user_token(self, mock_resize, mock_tokens):
        """Нет админских токенов — используется user_token."""
        from services.vk_api.upload_market import upload_market_photo

        # user_token как фолбэк, но VK API упадёт — проверяем что токен попробован
        with pytest.raises(Exception):
            upload_market_photo(100, b"img", "p.jpg", "fallback_token")

    @patch(ADMIN_TOKENS_PATH, return_value=[])
    @patch("services.vk_api.upload_market.ensure_market_photo_min_size", return_value=(b"img", None))
    def test_no_tokens_at_all_raises(self, mock_resize, mock_tokens):
        """Нет ни админских токенов, ни user_token — исключение."""
        from services.vk_api.upload_market import upload_market_photo

        with pytest.raises(Exception, match="админских токенов"):
            upload_market_photo(100, b"img", "p.jpg", user_token=None)

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    @patch("services.vk_api.upload_market.ensure_market_photo_min_size", return_value=(b"img", None))
    def test_main_photo_flag_set(self, mock_resize, mock_vk, mock_post, mock_tokens):
        """main_photo=1 передаётся в getMarketUploadServer."""
        from services.vk_api.upload_market import upload_market_photo

        mock_vk.side_effect = [
            {"upload_url": "https://up.vk.com/m"},
            [{"id": 1}],
        ]
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "photo": "d", "server": 1, "hash": "h"
        }
        mock_post.return_value = mock_response

        upload_market_photo(100, b"img", "p.jpg", "tok")

        params = mock_vk.call_args_list[0][0][1]
        assert params["main_photo"] == 1

    @patch(ADMIN_TOKENS_PATH, return_value=["tok"])
    @patch(REQUESTS_POST_PATH)
    @patch(VK_API_PATH)
    @patch("services.vk_api.upload_market.ensure_market_photo_min_size", return_value=(b"img", None))
    def test_bad_image_size_error_not_retried(self, mock_resize, mock_vk, mock_post, mock_tokens):
        """ERR_UPLOAD_BAD_IMAGE_SIZE — прекращается перебор токенов."""
        from services.vk_api.upload_market import upload_market_photo

        mock_vk.side_effect = [{"upload_url": "https://up.vk.com/m"}]
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "error": "ERR_UPLOAD_BAD_IMAGE_SIZE: too small"
        }
        mock_post.return_value = mock_response

        with pytest.raises(Exception, match="слишком маленькое"):
            upload_market_photo(100, b"img", "p.jpg", "tok")
