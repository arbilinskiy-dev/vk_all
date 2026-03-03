"""
Тесты для services/messages/parallel_loader.py — параллельная загрузка.
"""

import pytest
from unittest.mock import MagicMock, patch

from services.messages.parallel_loader import (
    _distribute_offsets,
)


class TestDistributeOffsets:
    """Тесты распределения offset-ов между токенами (round-robin)."""

    def test_basic_distribution(self):
        """1000 сообщений, 3 токена, batch=200 → 5 батчей."""
        buckets = _distribute_offsets(1000, 3, 200)
        assert len(buckets) == 3
        # token0: [0, 600], token1: [200, 800], token2: [400]
        assert buckets[0] == [0, 600]
        assert buckets[1] == [200, 800]
        assert buckets[2] == [400]

    def test_single_token(self):
        """1 токен — все offset-ы в одном ведре."""
        buckets = _distribute_offsets(500, 1, 200)
        assert len(buckets) == 1
        assert buckets[0] == [0, 200, 400]

    def test_two_tokens(self):
        """2 токена — чередуются."""
        buckets = _distribute_offsets(800, 2, 200)
        assert buckets[0] == [0, 400]
        assert buckets[1] == [200, 600]

    def test_small_total(self):
        """200 сообщений, 3 токена → 1 батч."""
        buckets = _distribute_offsets(200, 3, 200)
        assert buckets[0] == [0]
        assert buckets[1] == []
        assert buckets[2] == []

    def test_zero_total(self):
        """0 сообщений → пустые ведра."""
        buckets = _distribute_offsets(0, 3, 200)
        assert all(len(b) == 0 for b in buckets)

    def test_total_all_offsets_covered(self):
        """Все сообщения покрыты (нет дырок)."""
        buckets = _distribute_offsets(1000, 4, 200)
        all_offsets = sorted(o for bucket in buckets for o in bucket)
        expected = [0, 200, 400, 600, 800]
        assert all_offsets == expected


class TestSequentialFetchAllMessages:
    """Тесты последовательной загрузки."""

    @patch("services.messages.parallel_loader.fetch_from_vk")
    def test_sequential_basic(self, mock_fetch):
        """Базовый сценарий — 2 батча по 200."""
        from services.messages.parallel_loader import _sequential_fetch_all_messages

        mock_fetch.side_effect = [
            {"items": [{"id": i} for i in range(200)], "count": 350},
            {"items": [{"id": i} for i in range(200, 350)], "count": 350},
        ]

        result = _sequential_fetch_all_messages(["token"], 123, 12345, "proj-1")
        assert result["total_count"] == 350
        assert len(result["items"]) == 350
        assert result["parallel"] is False

    @patch("services.messages.parallel_loader.fetch_from_vk")
    def test_sequential_empty_dialog(self, mock_fetch):
        """Пустой диалог — 0 сообщений."""
        from services.messages.parallel_loader import _sequential_fetch_all_messages

        mock_fetch.return_value = {"items": [], "count": 0}

        result = _sequential_fetch_all_messages(["token"], 123, 12345, "proj-1")
        assert result["total_count"] == 0
        assert len(result["items"]) == 0


class TestLoadAllMessages:
    """Тесты оркестратора загрузки всех сообщений."""

    @patch("services.messages.parallel_loader.mem_invalidate_dialog")
    @patch("services.messages.parallel_loader.messages_crud")
    @patch("services.messages.parallel_loader.fetch_from_vk")
    def test_already_loaded(self, mock_fetch, mock_crud, mock_invalidate, mock_db):
        """Уже загружено → возвращаем already_loaded=True."""
        from services.messages.parallel_loader import load_all_messages

        meta = MagicMock()
        meta.is_fully_loaded = True
        meta.total_count = 500
        mock_crud.get_cache_meta.return_value = meta
        mock_crud.get_cached_messages_count.return_value = 500

        result = load_all_messages(mock_db, "proj-1", 12345, ["token"], 123456)
        assert result["already_loaded"] is True
        assert result["total_loaded"] == 500
        mock_fetch.assert_not_called()

    @patch("services.messages.parallel_loader.mem_invalidate_dialog")
    @patch("services.messages.parallel_loader.messages_crud")
    @patch("services.messages.parallel_loader.fetch_from_vk")
    def test_empty_dialog(self, mock_fetch, mock_crud, mock_invalidate, mock_db):
        """Пустой диалог (total_count=0) → fully loaded."""
        from services.messages.parallel_loader import load_all_messages

        mock_crud.get_cache_meta.return_value = None
        mock_fetch.return_value = {"items": [], "count": 0}

        result = load_all_messages(mock_db, "proj-1", 12345, ["token"], 123456)
        assert result["total_count"] == 0
        assert result["total_loaded"] == 0

    @patch("services.messages.parallel_loader._sequential_fetch_all_messages")
    @patch("services.messages.parallel_loader.mem_invalidate_dialog")
    @patch("services.messages.parallel_loader.messages_crud")
    @patch("services.messages.parallel_loader.fetch_from_vk")
    def test_sequential_mode_for_single_token(self, mock_fetch, mock_crud, mock_invalidate, mock_seq, mock_db):
        """Один токен → последовательный режим."""
        from services.messages.parallel_loader import load_all_messages

        mock_crud.get_cache_meta.return_value = None
        mock_fetch.return_value = {"items": [{"id": 1}], "count": 100}
        mock_seq.return_value = {
            "items": [{"id": i} for i in range(100)],
            "total_count": 100,
            "parallel": False,
            "workers_used": 1,
            "retry_count": 0,
        }
        mock_crud.recalc_direction_counts.return_value = {
            "cached_total": 100, "incoming_count": 50, "outgoing_count": 50,
        }

        result = load_all_messages(mock_db, "proj-1", 12345, ["token"], 123456)
        assert result["mode"] == "sequential"
        mock_seq.assert_called_once()

    @patch("services.messages.parallel_loader._parallel_fetch_all_messages")
    @patch("services.messages.parallel_loader.mem_invalidate_dialog")
    @patch("services.messages.parallel_loader.messages_crud")
    @patch("services.messages.parallel_loader.fetch_from_vk")
    def test_parallel_mode_for_multiple_tokens(self, mock_fetch, mock_crud, mock_invalidate, mock_par, mock_db):
        """Много токенов + > 400 сообщений → параллельный режим."""
        from services.messages.parallel_loader import load_all_messages

        mock_crud.get_cache_meta.return_value = None
        mock_fetch.return_value = {"items": [{"id": 1}], "count": 500}
        mock_par.return_value = {
            "items": [{"id": i} for i in range(500)],
            "total_count": 500,
            "parallel": True,
            "workers_used": 3,
            "retry_count": 0,
        }
        mock_crud.recalc_direction_counts.return_value = {
            "cached_total": 500, "incoming_count": 250, "outgoing_count": 250,
        }

        tokens = ["token_1", "token_2", "token_3"]
        result = load_all_messages(mock_db, "proj-1", 12345, tokens, 123456)
        assert result["mode"] == "parallel"
        mock_par.assert_called_once()
