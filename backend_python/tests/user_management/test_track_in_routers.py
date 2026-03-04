"""
Тесты для проверки вызова track() в бизнес-роутерах.
Проверяем, что action_tracker.track() вызывается с правильными параметрами
после выполнения бизнес-логики в posts.py и market.py.
"""
import pytest
import sys
import os
from unittest.mock import MagicMock, patch, ANY

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


def _make_user():
    """Создаёт мок текущего пользователя (CurrentUser)."""
    from services.auth_middleware import CurrentUser
    return CurrentUser(
        user_id="user-42",
        username="tester",
        role="admin",
        user_type="internal",
        session_id="sess-1",
        full_name="Test User",
    )


# =============================================
# posts.py — savePost
# =============================================

class TestPostsSavePostTrack:
    """Проверяем track() в POST /savePost."""

    @patch("routers.posts.track")
    @patch("routers.posts.post_service")
    def test_save_post_calls_track(self, mock_post_service, mock_track):
        """track() вызывается с action_type='post_save' и category='posts'."""
        from routers.posts import save_post

        # Мок результата save_post — объект с id
        mock_result = MagicMock()
        mock_result.id = 123
        mock_post_service.save_post.return_value = mock_result

        # Формируем payload через MagicMock (SavePostPayload)
        payload = MagicMock()
        payload.publishNow = False
        payload.projectId = "proj-1"

        mock_db = MagicMock()
        current_user = _make_user()

        # Мокаем settings
        with patch("routers.posts.settings") as mock_settings:
            mock_settings.vk_user_token = "fake-token"
            save_post(payload=payload, db=mock_db, current_user=current_user)

        # Проверяем вызов track
        mock_track.assert_called_once_with(
            mock_db, current_user, "post_save", "posts",
            entity_type="post", entity_id="123",
            project_id="proj-1",
        )

    @patch("routers.posts.track")
    @patch("routers.posts.post_service")
    def test_save_post_entity_id_none_when_no_id(self, mock_post_service, mock_track):
        """Если result.id is None — entity_id передаётся как None, а НЕ строка 'None'."""
        from routers.posts import save_post

        mock_result = MagicMock()
        mock_result.id = None
        mock_post_service.save_post.return_value = mock_result

        payload = MagicMock()
        payload.publishNow = False
        payload.projectId = "proj-2"

        mock_db = MagicMock()
        current_user = _make_user()

        with patch("routers.posts.settings") as mock_settings:
            mock_settings.vk_user_token = "fake-token"
            save_post(payload=payload, db=mock_db, current_user=current_user)

        # entity_id должен быть None, а не "None"
        call_kwargs = mock_track.call_args
        entity_id_value = call_kwargs.kwargs.get("entity_id") or call_kwargs[1].get("entity_id")
        # В коде: str(_entity_id) if _entity_id else None
        # Если _entity_id is None → entity_id=None
        assert entity_id_value is None, (
            f"entity_id должен быть None, а не '{entity_id_value}'"
        )

    @patch("routers.posts.track")
    @patch("routers.posts.post_service")
    def test_save_post_track_args_types(self, mock_post_service, mock_track):
        """entity_id — строка (а не int), когда result.id задан."""
        from routers.posts import save_post

        mock_result = MagicMock()
        mock_result.id = 999
        mock_post_service.save_post.return_value = mock_result

        payload = MagicMock()
        payload.publishNow = False
        payload.projectId = "proj-3"

        mock_db = MagicMock()
        current_user = _make_user()

        with patch("routers.posts.settings") as mock_settings:
            mock_settings.vk_user_token = "t"
            save_post(payload=payload, db=mock_db, current_user=current_user)

        call_kwargs = mock_track.call_args
        entity_id_value = call_kwargs.kwargs.get("entity_id") or call_kwargs[1].get("entity_id")
        assert isinstance(entity_id_value, str), "entity_id должен быть строкой"
        assert entity_id_value == "999"


# =============================================
# market.py — editAlbum
# =============================================

class TestMarketEditAlbumTrack:
    """Проверяем track() в POST /editAlbum."""

    @patch("routers.market.track")
    @patch("routers.market.market_service")
    def test_edit_album_calls_track(self, mock_market_service, mock_track):
        """track() вызывается с action_type='market_edit_album'."""
        from routers.market import edit_album

        mock_market_service.edit_market_album.return_value = MagicMock()

        payload = MagicMock()
        payload.projectId = "proj-m1"
        payload.albumId = 55
        payload.title = "Новая подборка"

        mock_db = MagicMock()
        current_user = _make_user()

        with patch("routers.market.settings") as mock_settings:
            mock_settings.vk_user_token = "tok"
            edit_album(payload=payload, db=mock_db, current_user=current_user)

        mock_track.assert_called_once_with(
            mock_db, current_user, "market_edit_album", "market",
            entity_type="album", entity_id=str(55),
            project_id="proj-m1",
        )

    @patch("routers.market.track")
    @patch("routers.market.market_service")
    def test_edit_album_track_category_is_market(self, mock_market_service, mock_track):
        """Категория трека — 'market'."""
        from routers.market import edit_album

        mock_market_service.edit_market_album.return_value = MagicMock()

        payload = MagicMock()
        payload.projectId = "p"
        payload.albumId = 1
        payload.title = "T"

        with patch("routers.market.settings") as mock_settings:
            mock_settings.vk_user_token = "t"
            edit_album(payload=payload, db=MagicMock(), current_user=_make_user())

        # Второй позиционный аргумент — action_type, третий — category
        call_args = mock_track.call_args[0]
        assert call_args[2] == "market_edit_album"
        assert call_args[3] == "market"


# =============================================
# market.py — uploadPhoto
# =============================================

class TestMarketUploadPhotoTrack:
    """Проверяем track() в POST /uploadPhoto."""

    @patch("routers.market.track")
    @patch("routers.market.market_service")
    def test_upload_photo_calls_track(self, mock_market_service, mock_track):
        """track() вызывается с action_type='market_upload_photo'."""
        from routers.market import upload_photo

        mock_market_service.upload_market_item_photo.return_value = MagicMock()

        mock_file = MagicMock()
        mock_db = MagicMock()
        current_user = _make_user()

        with patch("routers.market.settings") as mock_settings:
            mock_settings.vk_user_token = "tok"
            upload_photo(
                file=mock_file,
                projectId="proj-photo",
                itemId=777,
                db=mock_db,
                current_user=current_user,
            )

        mock_track.assert_called_once_with(
            mock_db, current_user, "market_upload_photo", "market",
            entity_type="market_item", entity_id="777",
            project_id="proj-photo",
        )

    @patch("routers.market.track")
    @patch("routers.market.market_service")
    def test_upload_photo_entity_id_is_string(self, mock_market_service, mock_track):
        """entity_id для uploadPhoto — строковое представление itemId."""
        from routers.market import upload_photo

        mock_market_service.upload_market_item_photo.return_value = MagicMock()

        with patch("routers.market.settings") as mock_settings:
            mock_settings.vk_user_token = "t"
            upload_photo(
                file=MagicMock(),
                projectId="p",
                itemId=42,
                db=MagicMock(),
                current_user=_make_user(),
            )

        call_kwargs = mock_track.call_args
        entity_id = call_kwargs.kwargs.get("entity_id") or call_kwargs[1].get("entity_id")
        assert entity_id == "42"
        assert isinstance(entity_id, str)
