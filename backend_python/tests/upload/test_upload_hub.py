"""
Тесты для хаб-модуля upload.

Проверяем, что все имена из __all__ реально импортируются
и доступны через хаб (from services.vk_api.upload import ...).
"""

import pytest

import services.vk_api.upload as hub


# Полный список ожидаемых экспортов
EXPECTED_NAMES = [
    "upload_wall_photo",
    "upload_album_photo",
    "upload_message_photo",
    "upload_message_doc",
    "upload_message_video",
    "upload_story",
    "upload_video_story",
    "ensure_market_photo_min_size",
    "upload_market_photo",
    "upload_video",
]


class TestHubAllExports:
    """Проверка __all__ и доступности реэкспортов."""

    def test_all_exists(self):
        """Модуль имеет атрибут __all__."""
        assert hasattr(hub, "__all__")

    def test_all_has_correct_count(self):
        """__all__ содержит ровно 10 имён."""
        assert len(hub.__all__) == 10

    def test_all_names_importable(self):
        """Каждое имя из __all__ реально существует в модуле."""
        for name in hub.__all__:
            assert hasattr(hub, name), f"{name} из __all__ отсутствует в модуле"

    def test_all_names_are_callable(self):
        """Каждое имя из __all__ — вызываемый объект (функция)."""
        for name in hub.__all__:
            obj = getattr(hub, name)
            assert callable(obj), f"{name} не является callable"

    def test_expected_names_present(self):
        """Все ожидаемые имена присутствуют в __all__."""
        for name in EXPECTED_NAMES:
            assert name in hub.__all__, f"{name} отсутствует в __all__"

    def test_no_extra_names(self):
        """__all__ не содержит лишних имён."""
        extra = set(hub.__all__) - set(EXPECTED_NAMES)
        assert not extra, f"Лишние имена в __all__: {extra}"


class TestHubImportPaths:
    """Проверка что функции импортируются конкретно из подмодулей."""

    def test_upload_wall_photo_from_hub(self):
        """upload_wall_photo доступна через хаб."""
        from services.vk_api.upload import upload_wall_photo
        assert callable(upload_wall_photo)

    def test_upload_album_photo_from_hub(self):
        """upload_album_photo доступна через хаб."""
        from services.vk_api.upload import upload_album_photo
        assert callable(upload_album_photo)

    def test_upload_message_photo_from_hub(self):
        """upload_message_photo доступна через хаб."""
        from services.vk_api.upload import upload_message_photo
        assert callable(upload_message_photo)

    def test_upload_message_doc_from_hub(self):
        """upload_message_doc доступна через хаб."""
        from services.vk_api.upload import upload_message_doc
        assert callable(upload_message_doc)

    def test_upload_message_video_from_hub(self):
        """upload_message_video доступна через хаб."""
        from services.vk_api.upload import upload_message_video
        assert callable(upload_message_video)

    def test_upload_story_from_hub(self):
        """upload_story доступна через хаб."""
        from services.vk_api.upload import upload_story
        assert callable(upload_story)

    def test_upload_video_story_from_hub(self):
        """upload_video_story доступна через хаб."""
        from services.vk_api.upload import upload_video_story
        assert callable(upload_video_story)

    def test_ensure_market_photo_min_size_from_hub(self):
        """ensure_market_photo_min_size доступна через хаб."""
        from services.vk_api.upload import ensure_market_photo_min_size
        assert callable(ensure_market_photo_min_size)

    def test_upload_market_photo_from_hub(self):
        """upload_market_photo доступна через хаб."""
        from services.vk_api.upload import upload_market_photo
        assert callable(upload_market_photo)

    def test_upload_video_from_hub(self):
        """upload_video доступна через хаб."""
        from services.vk_api.upload import upload_video
        assert callable(upload_video)
