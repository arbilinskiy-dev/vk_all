"""
Тесты модулей, извлечённых при декомпозиции dlvry_client / orders_sync / stats_sync:

  1. dlvry_schemas.py     — DlvryDailyItem, DlvryStats, DlvryComparison, константы
  2. dlvry_parser.py      — build_filter, build_url, parse_statistics_response
  3. dlvry_sync_utils.py  — run_async
  4. order_parser.py      — save_order_from_api
  5. order_vk_profiles.py — ensure_vk_profile_for_order, кеш _vk_profile_cache
  6. stats_sync_core.py   — daily_item_to_dict, sync_date_range, sync_full_backwards_gen
"""

import sys
import os
import json
import asyncio
import pytest
from types import SimpleNamespace
from datetime import date, timedelta
from unittest.mock import patch, MagicMock, call

# Корень бэкенда в путь
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from services.dlvry.dlvry_schemas import (
    DlvryDailyItem, DlvryStats, DlvryComparison,
    DLVRY_API_BASE, DATE_FMT,
)
from services.dlvry.dlvry_parser import build_filter, build_url, parse_statistics_response
from services.dlvry.dlvry_sync_utils import run_async


# ═══════════════════════════════════════════════════════════════
# 1. dlvry_schemas
# ═══════════════════════════════════════════════════════════════


class TestDlvrySchemas:
    """Тесты типов данных и констант."""

    def test_constants(self):
        assert DLVRY_API_BASE == "https://dlvry.ru/api/v1"
        assert DATE_FMT == "%d.%m.%Y"

    def test_daily_item_defaults(self):
        item = DlvryDailyItem(
            date="01.01.2026", count=5, sum=3000.0,
            first_orders=1, avg_check=600.0,
        )
        assert item.canceled == 0
        assert item.source_vkapp == 0
        assert item.repeat_order_5 == 0

    def test_stats_to_dict(self):
        item = DlvryDailyItem(
            date="01.01.2026", count=2, sum=1000.0,
            first_orders=1, avg_check=500.0,
        )
        stats = DlvryStats(
            total_count=2, total_sum=1000.0,
            total_first_orders=1, avg_check=500.0,
            daily_items=[item],
        )
        d = stats.to_dict()
        assert d['total_count'] == 2
        assert len(d['daily_items']) == 1
        assert d['daily_items'][0]['date'] == "01.01.2026"

    def test_comparison_to_dict_with_none_previous(self):
        stats = DlvryStats(
            total_count=5, total_sum=2500.0,
            total_first_orders=2, avg_check=500.0,
        )
        comp = DlvryComparison(
            current=stats, previous=None,
            period_days=7, date_from="01.01.2026", date_to="07.01.2026",
        )
        d = comp.to_dict()
        assert d['previous'] is None
        assert d['current']['total_count'] == 5
        assert d['period_days'] == 7


# ═══════════════════════════════════════════════════════════════
# 2. dlvry_parser
# ═══════════════════════════════════════════════════════════════


class TestBuildFilter:
    """Тесты build_filter."""

    def test_base_filter(self):
        f = build_filter("aff-1", "01.01.2026", "07.01.2026")
        assert f['affiliate_id'] == "aff-1"
        assert f['date_from'] == "01.01.2026"
        assert f['date_to'] == "07.01.2026"
        assert f['source'] == "all"
        assert f['tags'] == []

    def test_extra_overrides(self):
        f = build_filter("aff-1", "01.01.2026", "07.01.2026", extra={"source": "vkapp"})
        assert f['source'] == "vkapp"


class TestBuildUrl:
    """Тесты build_url."""

    def test_url_contains_affiliate(self):
        f = build_filter("aff-42", "01.01.2026", "07.01.2026")
        url = build_url("aff-42", "01.01.2026", "07.01.2026", f)
        assert "/affiliates/aff-42/statistics" in url
        assert "date_from=01.01.2026" in url

    def test_url_has_encoded_filter(self):
        f = build_filter("aff-1", "01.01.2026", "07.01.2026")
        url = build_url("aff-1", "01.01.2026", "07.01.2026", f)
        assert "filter=" in url
        # JSON encoded в URL
        assert "%22" in url or "%7B" in url


class TestParseStatisticsResponse:
    """Тесты parse_statistics_response."""

    def _make_api_item(self, **kw):
        """Одна запись из DLVRY API."""
        defaults = {
            'date': '15.03.2026', 'count': 10, 'sum': 5000,
            'first_orders': {'count': 3, 'sum': 1500, 'cost': 800},
            'canceled': 1, 'canceled_sum': 200,
            'cost': 2000, 'discount': 100,
            'unique_clients': 8,
            'sum_cash': 1000, 'count_payment_cash': 3,
            'sum_card': 2000, 'count_payment_card': 4,
            'count_payment_online': 3, 'sum_online_success': 2000, 'sum_online_fail': 0,
            'source_site': 2, 'sum_source_site': 1000,
            'source_vkapp': 5, 'sum_source_vkapp': 2500,
            'source_ios': 1, 'sum_source_ios': 500,
            'source_android': 2, 'sum_source_android': 1000,
            'delivery_self': {'count': 4, 'sum': 2000},
            'delivery_delivery': {'count': 6, 'sum': 3000},
            'client_orders_count_2': {'count': 2},
            'client_orders_count_3': {'count': 1},
            'client_orders_count_4': None,
            'client_orders_count_5': {'count': 0},
        }
        defaults.update(kw)
        return defaults

    def test_basic_parse(self):
        data = {'data': {'items': [self._make_api_item()]}}
        result = parse_statistics_response(data)
        assert result is not None
        assert result.total_count == 10
        assert result.total_sum == 5000
        assert result.total_first_orders == 3
        assert result.avg_check == 500.0
        assert len(result.daily_items) == 1

    def test_daily_item_fields(self):
        data = {'data': {'items': [self._make_api_item()]}}
        result = parse_statistics_response(data)
        d = result.daily_items[0]
        assert d.date == '15.03.2026'
        assert d.canceled == 1
        assert d.delivery_self_count == 4
        assert d.source_vkapp == 5
        assert d.repeat_order_2 == 2
        assert d.repeat_order_4 == 0  # None → 0

    def test_empty_items(self):
        data = {'data': {'items': []}}
        result = parse_statistics_response(data)
        assert result.total_count == 0
        assert result.avg_check == 0

    def test_multi_day_aggregation(self):
        items = [
            self._make_api_item(date='01.03.2026', count=5, sum=2000,
                                first_orders={'count': 1, 'sum': 500, 'cost': 200}),
            self._make_api_item(date='02.03.2026', count=3, sum=1500,
                                first_orders={'count': 2, 'sum': 1000, 'cost': 400}),
        ]
        data = {'data': {'items': items}}
        result = parse_statistics_response(data)
        assert result.total_count == 8
        assert result.total_sum == 3500
        assert result.total_first_orders == 3
        assert len(result.daily_items) == 2


# ═══════════════════════════════════════════════════════════════
# 3. dlvry_sync_utils
# ═══════════════════════════════════════════════════════════════


class TestRunAsync:
    """Тесты run_async."""

    def test_simple_coroutine(self):
        async def add(a, b):
            return a + b
        assert run_async(add(2, 3)) == 5

    def test_with_await(self):
        async def delayed():
            await asyncio.sleep(0)
            return "done"
        assert run_async(delayed()) == "done"


# ═══════════════════════════════════════════════════════════════
# 4. order_parser
# ═══════════════════════════════════════════════════════════════


class TestSaveOrderFromApi:
    """Тесты save_order_from_api."""

    def _make_payload(self, **kw):
        """Минимальный payload заказа из hl-orders API."""
        defaults = {
            'id': 12345,
            'owner_id': 'owner-1',
            'date': '01.03.2026 10:30:00',
            'phone': '89001234567',
            'client': {'id': 'cl-1', 'name': 'Тест', 'phone': '', 'email': '', 'bday': ''},
            'address': {'city': 'Москва', 'street': 'Ленина', 'house': '1'},
            'items': [{'id': 'it-1', 'name': 'Пицца', 'price': 500, 'quantity': 2}],
            'source': {'code': 'site', 'name': 'Сайт'},
            'payment': {'code': 'cash', 'name': 'Наличные'},
            'delivery': {'code': 'delivery', 'name': 'Доставка'},
            'pickup_point': {},
            'promocode': {},
            'sum': 1000, 'discount': 0, 'total': 1000, 'cost': 400,
            'payment_bonus': 0, 'markup': 0, 'persons': 1,
            'comment': '', 'preorder': False,
            'vk_group_id': '123', 'vk_user_id': '456', 'vk_platform': 'desktop',
            'domain': 'test.dlvry.ru',
            'status': 'received',
        }
        defaults.update(kw)
        return defaults

    @patch('services.dlvry.order_parser.ensure_vk_profile_for_order', autospec=True, return_value=77)
    @patch('services.dlvry.order_parser.create_order', autospec=True)
    @patch('services.dlvry.order_parser.order_exists', autospec=True, return_value=False)
    def test_new_order_saved(self, mock_exists, mock_create, mock_vk):
        db = MagicMock()
        result = __import__('services.dlvry.order_parser', fromlist=['save_order_from_api']).save_order_from_api(
            db, self._make_payload(), affiliate_id="aff-1", project_id="proj-1",
        )
        assert result is True
        mock_exists.assert_called_once_with(db, "12345", "aff-1")
        mock_create.assert_called_once()
        # Проверяем что vk_profile_id попал в order_data
        order_data = mock_create.call_args[0][1]
        assert order_data['vk_profile_id'] == 77

    @patch('services.dlvry.order_parser.order_exists', autospec=True, return_value=True)
    def test_duplicate_skipped(self, mock_exists):
        db = MagicMock()
        from services.dlvry.order_parser import save_order_from_api
        result = save_order_from_api(db, self._make_payload(), "aff-1", "proj-1")
        assert result is False

    def test_no_id_returns_false(self):
        db = MagicMock()
        from services.dlvry.order_parser import save_order_from_api
        result = save_order_from_api(db, {'no_id': True}, "aff-1", "proj-1")
        assert result is False

    @patch('services.dlvry.order_parser.ensure_vk_profile_for_order', autospec=True, return_value=None)
    @patch('services.dlvry.order_parser.create_order', autospec=True)
    @patch('services.dlvry.order_parser.order_exists', autospec=True, return_value=False)
    def test_no_vk_profile(self, mock_exists, mock_create, mock_vk):
        """Без vk_user_id — vk_profile_id не добавляется."""
        db = MagicMock()
        payload = self._make_payload(vk_user_id='')
        from services.dlvry.order_parser import save_order_from_api
        result = save_order_from_api(db, payload, "aff-1", "proj-1")
        assert result is True
        order_data = mock_create.call_args[0][1]
        assert 'vk_profile_id' not in order_data

    @patch('services.dlvry.order_parser.create_order', autospec=True, side_effect=Exception("DB error"))
    @patch('services.dlvry.order_parser.order_exists', autospec=True, return_value=False)
    @patch('services.dlvry.order_parser.ensure_vk_profile_for_order', autospec=True, return_value=None)
    def test_exception_returns_false(self, mock_vk, mock_exists, mock_create):
        db = MagicMock()
        from services.dlvry.order_parser import save_order_from_api
        result = save_order_from_api(db, self._make_payload(), "aff-1", "proj-1")
        assert result is False
        db.rollback.assert_called_once()

    @patch('services.dlvry.order_parser.ensure_vk_profile_for_order', autospec=True, return_value=77)
    @patch('services.dlvry.order_parser.create_order', autospec=True)
    @patch('services.dlvry.order_parser.order_exists', autospec=True, return_value=False)
    def test_catalog_passed_through(self, mock_exists, mock_create, mock_vk):
        """catalog передаётся в parse_items."""
        db = MagicMock()
        catalog = {"item-1": "Корректное имя"}
        from services.dlvry.order_parser import save_order_from_api
        with patch('services.dlvry.order_parser.parse_items', autospec=True, return_value=([], '', 0, 0)) as mock_parse:
            save_order_from_api(db, self._make_payload(), "aff-1", "proj-1", catalog=catalog)
            mock_parse.assert_called_once()
            _, kwargs = mock_parse.call_args
            assert kwargs.get('catalog') == catalog or mock_parse.call_args[1].get('catalog') == catalog

    @patch('services.dlvry.order_parser.ensure_vk_profile_for_order', autospec=True, return_value=77)
    @patch('services.dlvry.order_parser.create_order', autospec=True)
    @patch('services.dlvry.order_parser.order_exists', autospec=True, return_value=False)
    def test_status_dict_parsed(self, mock_exists, mock_create, mock_vk):
        """status как dict → извлекается code."""
        db = MagicMock()
        payload = self._make_payload(status={'code': 'completed', 'name': 'Выполнен'})
        from services.dlvry.order_parser import save_order_from_api
        save_order_from_api(db, payload, "aff-1", "proj-1")
        order_data = mock_create.call_args[0][1]
        assert order_data['status'] == 'completed'


# ═══════════════════════════════════════════════════════════════
# 5. order_vk_profiles
# ═══════════════════════════════════════════════════════════════


class TestEnsureVkProfile:
    """Тесты ensure_vk_profile_for_order."""

    def setup_method(self):
        # Очищаем кеш перед каждым тестом
        from services.dlvry import order_vk_profiles
        order_vk_profiles._vk_profile_cache.clear()

    @patch('services.dlvry.order_vk_profiles.ProjectMember', autospec=True)
    @patch('services.dlvry.order_vk_profiles.VkProfile', autospec=True)
    def test_creates_new_profile(self, MockVkProfile, MockMember):
        from services.dlvry.order_vk_profiles import ensure_vk_profile_for_order
        db = MagicMock()
        # Профиль не найден
        db.query.return_value.filter.return_value.first.return_value = None
        # flush назначит id
        new_profile = MagicMock()
        new_profile.id = 42
        MockVkProfile.return_value = new_profile

        result = ensure_vk_profile_for_order(db, "100", "proj-1")
        assert result == 42
        db.add.assert_called()

    @patch('services.dlvry.order_vk_profiles.ProjectMember', autospec=True)
    @patch('services.dlvry.order_vk_profiles.VkProfile', autospec=True)
    def test_uses_cache(self, MockVkProfile, MockMember):
        from services.dlvry.order_vk_profiles import ensure_vk_profile_for_order, _vk_profile_cache
        _vk_profile_cache[100] = 42
        db = MagicMock()

        # Второй вызов — не должен лезть в БД на поиск профиля
        result = ensure_vk_profile_for_order(db, "100", "proj-1")
        assert result == 42

    def test_invalid_vk_user_id(self):
        from services.dlvry.order_vk_profiles import ensure_vk_profile_for_order
        db = MagicMock()
        assert ensure_vk_profile_for_order(db, "", None) is None
        assert ensure_vk_profile_for_order(db, "abc", None) is None
        assert ensure_vk_profile_for_order(db, "0", None) is None
        assert ensure_vk_profile_for_order(db, "-5", None) is None

    @patch('services.dlvry.order_vk_profiles.ProjectMember', autospec=True)
    @patch('services.dlvry.order_vk_profiles.VkProfile', autospec=True)
    def test_no_project_id_skips_member(self, MockVkProfile, MockMember):
        from services.dlvry.order_vk_profiles import ensure_vk_profile_for_order
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = SimpleNamespace(id=10)

        result = ensure_vk_profile_for_order(db, "200", None)
        assert result == 10
        # ProjectMember не создаётся без project_id
        MockMember.assert_not_called()


# ═══════════════════════════════════════════════════════════════
# 6. stats_sync_core
# ═══════════════════════════════════════════════════════════════


class TestDailyItemToDict:
    """Тесты daily_item_to_dict."""

    def test_converts_all_fields(self):
        from services.dlvry.stats_sync_core import daily_item_to_dict
        item = DlvryDailyItem(
            date="15.03.2026", count=10, sum=5000.0,
            first_orders=3, avg_check=500.0,
            canceled=1, source_vkapp=5,
            repeat_order_2=2,
        )
        d = daily_item_to_dict(item)
        assert d['date'] == "15.03.2026"
        assert d['count'] == 10
        assert d['canceled'] == 1
        assert d['source_vkapp'] == 5
        assert d['repeat_order_2'] == 2
        # Дефолтные нули
        assert d['sum_online_fail'] == 0


class TestSyncDateRange:
    """Тесты sync_date_range."""

    @patch('services.dlvry.stats_sync_core.bulk_upsert_daily_stats', autospec=True, return_value=7)
    @patch('services.dlvry.stats_sync_core.run_async', autospec=True)
    @patch('services.dlvry.stats_sync_core.DlvryApiClient', autospec=True)
    def test_single_chunk(self, MockClient, mock_run_async, mock_bulk):
        from services.dlvry.stats_sync_core import sync_date_range

        # API возвращает stats с 7 днями
        mock_stats = DlvryStats(
            total_count=50, total_sum=25000.0,
            total_first_orders=10, avg_check=500.0,
            daily_items=[
                DlvryDailyItem(date=f"{d:02d}.03.2026", count=7, sum=3500,
                               first_orders=1, avg_check=500.0)
                for d in range(1, 8)
            ],
        )
        mock_run_async.return_value = mock_stats

        db = MagicMock()
        result = sync_date_range(
            db, "proj-1", "aff-1", "token",
            date(2026, 3, 1), date(2026, 3, 7),
        )

        assert result['success'] is True
        assert result['synced_days'] == 7
        mock_bulk.assert_called_once()

    @patch('services.dlvry.stats_sync_core.bulk_upsert_daily_stats', autospec=True, return_value=0)
    @patch('services.dlvry.stats_sync_core.run_async', autospec=True, side_effect=Exception("API down"))
    @patch('services.dlvry.stats_sync_core.DlvryApiClient', autospec=True)
    def test_api_error(self, MockClient, mock_run_async, mock_bulk):
        from services.dlvry.stats_sync_core import sync_date_range
        db = MagicMock()
        result = sync_date_range(
            db, "proj-1", "aff-1", "token",
            date(2026, 3, 1), date(2026, 3, 7),
        )
        assert result['success'] is False
        assert "API down" in result['error']

    @patch('services.dlvry.stats_sync_core.bulk_upsert_daily_stats', autospec=True, return_value=180)
    @patch('services.dlvry.stats_sync_core.run_async', autospec=True)
    @patch('services.dlvry.stats_sync_core.DlvryApiClient', autospec=True)
    def test_multi_chunk_split(self, MockClient, mock_run_async, mock_bulk):
        """Период >89 дней разбивается на 2+ чанка."""
        from services.dlvry.stats_sync_core import sync_date_range

        mock_stats = DlvryStats(
            total_count=100, total_sum=50000.0,
            total_first_orders=20, avg_check=500.0,
            daily_items=[
                DlvryDailyItem(date="01.01.2026", count=1, sum=500,
                               first_orders=0, avg_check=500.0)
            ],
        )
        mock_run_async.return_value = mock_stats

        db = MagicMock()
        result = sync_date_range(
            db, "proj-1", "aff-1", "token",
            date(2026, 1, 1), date(2026, 7, 1),  # 182 дня → 3 чанка
        )
        assert result['success'] is True
        # run_async должен быть вызван 3 раза (3 чанка)
        assert mock_run_async.call_count == 3


class TestSyncFullBackwardsGen:
    """Тесты sync_full_backwards_gen."""

    @patch('services.dlvry.stats_sync_core.bulk_upsert_daily_stats', autospec=True, return_value=89)
    @patch('services.dlvry.stats_sync_core.run_async', autospec=True)
    @patch('services.dlvry.stats_sync_core.DlvryApiClient', autospec=True)
    def test_stops_after_empty_chunks(self, MockClient, mock_run_async, mock_bulk):
        from services.dlvry.stats_sync_core import sync_full_backwards_gen

        # Первый чанк — данные, второй+третий — пусто
        mock_stats = DlvryStats(
            total_count=50, total_sum=25000.0,
            total_first_orders=10, avg_check=500.0,
            daily_items=[
                DlvryDailyItem(date="01.03.2026", count=5, sum=2500,
                               first_orders=1, avg_check=500.0)
            ],
        )
        mock_run_async.side_effect = [mock_stats, None, None]

        db = MagicMock()
        events = list(sync_full_backwards_gen(
            db, "proj-1", "aff-1", "token", date(2026, 3, 31),
            max_empty_chunks=2,
        ))

        # Последний event — done=True
        assert events[-1]['done'] is True
        assert events[-1]['success'] is True
        # Непустой чанк выдал 1 промежуточный event
        progress_events = [e for e in events if not e['done']]
        assert len(progress_events) == 1

    @patch('services.dlvry.stats_sync_core.bulk_upsert_daily_stats', autospec=True)
    @patch('services.dlvry.stats_sync_core.run_async', autospec=True, return_value=None)
    @patch('services.dlvry.stats_sync_core.DlvryApiClient', autospec=True)
    def test_all_empty(self, MockClient, mock_run_async, mock_bulk):
        from services.dlvry.stats_sync_core import sync_full_backwards_gen

        db = MagicMock()
        events = list(sync_full_backwards_gen(
            db, "proj-1", "aff-1", "token", date(2026, 3, 31),
            max_empty_chunks=2,
        ))
        final = events[-1]
        assert final['done'] is True
        assert final['total_days'] == 0


# ═══════════════════════════════════════════════════════════════
# Контрактная безопасность (autospec)
# ═══════════════════════════════════════════════════════════════


class TestContractSafety:
    """
    Контрактные тесты: проверяют, что основные подписи функций
    не изменились (через autospec mock).
    """

    @patch('services.dlvry.dlvry_parser.build_filter', autospec=True)
    def test_build_filter_signature(self, mock_fn):
        mock_fn("aff-1", "01.01.2026", "07.01.2026")
        mock_fn.assert_called_once()

    @patch('services.dlvry.dlvry_parser.parse_statistics_response', autospec=True)
    def test_parse_statistics_response_signature(self, mock_fn):
        mock_fn({'data': {'items': []}})
        mock_fn.assert_called_once()

    @patch('services.dlvry.order_parser.save_order_from_api', autospec=True)
    def test_save_order_signature(self, mock_fn):
        mock_fn(MagicMock(), {}, "aff-1", "proj-1", catalog=None)
        mock_fn.assert_called_once()

    @patch('services.dlvry.stats_sync_core.sync_date_range', autospec=True)
    def test_sync_date_range_signature(self, mock_fn):
        mock_fn(MagicMock(), "proj", "aff", "tok", date(2026, 1, 1), date(2026, 1, 7))
        mock_fn.assert_called_once()
