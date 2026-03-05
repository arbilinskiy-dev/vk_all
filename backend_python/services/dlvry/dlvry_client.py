"""
DLVRY API Client — асинхронный клиент для получения статистики из DLVRY.

Платформа: https://dlvry.ru — SaaS для приёма и управления заказами (доставка еды).
API:        REST, авторизация по Bearer-токену.

Адаптирован из standalone-версии для интеграции в бэкенд VK Content Planner.
"""

import json
import logging
import urllib.parse
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Optional

import aiohttp

logger = logging.getLogger(__name__)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Константы
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DLVRY_API_BASE = "https://dlvry.ru/api/v1"
DATE_FMT = "%d.%m.%Y"  # формат дат, которые принимает DLVRY API


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Типы данных
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@dataclass
class DlvryDailyItem:
    """Статистика заказов за один день."""
    date: str           # DD.MM.YYYY
    count: int          # количество заказов
    sum: float          # выручка (₽)
    first_orders: int   # новые клиенты (первый заказ)
    avg_check: float    # средний чек (₽)

    # ── Отмены ────────────────────────────────────────────────
    canceled: int = 0               # кол-во отменённых заказов
    canceled_sum: float = 0         # сумма отменённых заказов

    # ── Финансы ───────────────────────────────────────────────
    cost: float = 0                 # себестоимость
    discount: float = 0             # сумма скидок
    first_orders_sum: float = 0     # выручка с первых заказов
    first_orders_cost: float = 0    # себестоимость первых заказов

    # ── Уникальные клиенты ────────────────────────────────────
    unique_clients: int = 0         # уникальных клиентов за день

    # ── Оплата (разбивка) ─────────────────────────────────────
    sum_cash: float = 0             # выручка наличными
    count_payment_cash: int = 0     # кол-во оплат наличными
    sum_card: float = 0             # выручка по карте
    count_payment_card: int = 0     # кол-во оплат по карте
    count_payment_online: int = 0   # кол-во оплат онлайн
    sum_online_success: float = 0   # сумма успешных онлайн-оплат
    sum_online_fail: float = 0      # сумма неуспешных онлайн-оплат

    # ── Источники ─────────────────────────────────────────────
    source_site: int = 0            # заказов с сайта
    sum_source_site: float = 0      # выручка с сайта
    source_vkapp: int = 0           # заказов из VK-приложения
    sum_source_vkapp: float = 0     # выручка из VK-приложения
    source_ios: int = 0             # заказов из iOS
    sum_source_ios: float = 0       # выручка из iOS
    source_android: int = 0         # заказов из Android
    sum_source_android: float = 0   # выручка из Android

    # ── Доставка ──────────────────────────────────────────────
    delivery_self_count: int = 0    # заказов самовывоз
    delivery_self_sum: float = 0    # выручка самовывоз
    delivery_count: int = 0         # заказов доставка
    delivery_sum: float = 0         # выручка доставка

    # ── Повторные заказы ──────────────────────────────────────
    repeat_order_2: int = 0         # клиенты со 2-м заказом
    repeat_order_3: int = 0         # клиенты с 3-м заказом
    repeat_order_4: int = 0         # клиенты с 4-м заказом
    repeat_order_5: int = 0         # клиенты с 5+ заказом


@dataclass
class DlvryStats:
    """Агрегированная статистика заказов за период."""
    total_count: int            # общее количество заказов
    total_sum: float            # общая выручка (₽)
    total_first_orders: int     # количество новых клиентов
    avg_check: float            # средний чек (₽)
    daily_items: list[DlvryDailyItem] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            'total_count': self.total_count,
            'total_sum': self.total_sum,
            'total_first_orders': self.total_first_orders,
            'avg_check': self.avg_check,
            'daily_items': [
                {
                    'date': d.date,
                    'count': d.count,
                    'sum': d.sum,
                    'first_orders': d.first_orders,
                    'avg_check': d.avg_check,
                    'canceled': d.canceled,
                    'canceled_sum': d.canceled_sum,
                    'cost': d.cost,
                    'discount': d.discount,
                    'first_orders_sum': d.first_orders_sum,
                    'first_orders_cost': d.first_orders_cost,
                    'unique_clients': d.unique_clients,
                    'sum_cash': d.sum_cash,
                    'count_payment_cash': d.count_payment_cash,
                    'sum_card': d.sum_card,
                    'count_payment_card': d.count_payment_card,
                    'count_payment_online': d.count_payment_online,
                    'sum_online_success': d.sum_online_success,
                    'sum_online_fail': d.sum_online_fail,
                    'source_site': d.source_site,
                    'sum_source_site': d.sum_source_site,
                    'source_vkapp': d.source_vkapp,
                    'sum_source_vkapp': d.sum_source_vkapp,
                    'source_ios': d.source_ios,
                    'sum_source_ios': d.sum_source_ios,
                    'source_android': d.source_android,
                    'sum_source_android': d.sum_source_android,
                    'delivery_self_count': d.delivery_self_count,
                    'delivery_self_sum': d.delivery_self_sum,
                    'delivery_count': d.delivery_count,
                    'delivery_sum': d.delivery_sum,
                    'repeat_order_2': d.repeat_order_2,
                    'repeat_order_3': d.repeat_order_3,
                    'repeat_order_4': d.repeat_order_4,
                    'repeat_order_5': d.repeat_order_5,
                }
                for d in self.daily_items
            ],
        }


@dataclass
class DlvryComparison:
    """Сравнение двух периодов."""
    current: Optional[DlvryStats]
    previous: Optional[DlvryStats]
    period_days: int
    date_from: str   # DD.MM.YYYY
    date_to: str     # DD.MM.YYYY

    def to_dict(self) -> dict:
        return {
            'period_days': self.period_days,
            'date_from': self.date_from,
            'date_to': self.date_to,
            'current': self.current.to_dict() if self.current else None,
            'previous': self.previous.to_dict() if self.previous else None,
        }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Клиент
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class DlvryApiClient:
    """
    Асинхронный клиент для DLVRY API (получение статистики).

    Параметры:
        token:   Bearer-токен DLVRY (обязательный)
        timeout: HTTP-таймаут в секундах (по умолчанию 30)
    """

    def __init__(self, token: str, timeout: int = 30):
        if not token:
            raise ValueError("DLVRY token обязателен")
        self._token = token
        self._timeout = aiohttp.ClientTimeout(total=timeout)

    # ── Публичные методы ─────────────────────────────────────

    async def get_orders_stats(
        self,
        affiliate_id: str,
        date_from: str,
        date_to: str,
        *,
        extra_filter: dict | None = None,
    ) -> Optional[DlvryStats]:
        """
        Получить статистику заказов за произвольный период.

        Args:
            affiliate_id: ID филиала DLVRY (строка)
            date_from:    Начальная дата DD.MM.YYYY
            date_to:      Конечная дата  DD.MM.YYYY
            extra_filter: Дополнительные поля фильтра (UTM, теги и т.д.)

        Returns:
            DlvryStats или None при ошибке
        """
        return await self._fetch_statistics(affiliate_id, date_from, date_to, extra_filter)

    async def get_orders_by_period(
        self,
        affiliate_id: str,
        period_days: int = 7,
        *,
        extra_filter: dict | None = None,
    ) -> Optional[DlvryStats]:
        """Получить статистику заказов за последние N дней."""
        now = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        dt_to = now - timedelta(days=1)
        dt_from = now - timedelta(days=period_days)
        return await self._fetch_statistics(
            affiliate_id,
            dt_from.strftime(DATE_FMT),
            dt_to.strftime(DATE_FMT),
            extra_filter,
        )

    async def get_orders_comparison(
        self,
        affiliate_id: str,
        period_days: int = 7,
        *,
        date_from: str | None = None,
        date_to: str | None = None,
        extra_filter: dict | None = None,
    ) -> Optional[DlvryComparison]:
        """Получить текущий и предыдущий периоды для сравнения."""
        now = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

        if date_from and date_to:
            dt_from = datetime.strptime(date_from, DATE_FMT)
            dt_to = datetime.strptime(date_to, DATE_FMT)
            delta = (dt_to - dt_from).days + 1
        else:
            dt_to = now - timedelta(days=1)
            dt_from = now - timedelta(days=period_days)
            delta = period_days
            date_from = dt_from.strftime(DATE_FMT)
            date_to = dt_to.strftime(DATE_FMT)

        prev_end = dt_from - timedelta(days=1)
        prev_start = prev_end - timedelta(days=delta - 1)

        current = await self._fetch_statistics(
            affiliate_id, date_from, date_to, extra_filter,
        )
        previous = await self._fetch_statistics(
            affiliate_id,
            prev_start.strftime(DATE_FMT),
            prev_end.strftime(DATE_FMT),
            extra_filter,
        )

        return DlvryComparison(
            current=current,
            previous=previous,
            period_days=delta,
            date_from=date_from,
            date_to=date_to,
        )

    # ── Внутренняя реализация ────────────────────────────────

    def _build_filter(
        self,
        affiliate_id: str,
        date_from: str,
        date_to: str,
        extra: dict | None = None,
    ) -> dict:
        """Собрать объект фильтра для DLVRY API."""
        base = {
            "date_from": date_from,
            "date_to": date_to,
            "affiliate_id": str(affiliate_id),
            "source": "all",
            "domain": "all",
            "delivery": "all",
            "pickup_point": "all",
            "pickup_points": [],
            "delivery_areas": [],
            "delivery_area": "all",
            "tags": [],
            "clients_tags": [],
            "is_bday": 0,
            "is_discount": 0,
            "is_gift": 0,
            "utm_source": "",
            "utm_medium": "",
            "utm_campaign": "",
            "utm_content": "",
            "utm_term": "",
        }
        if extra:
            base.update(extra)
        return base

    def _build_url(self, affiliate_id: str, date_from: str, date_to: str, filter_obj: dict) -> str:
        """Собрать полный URL запроса."""
        encoded = urllib.parse.quote(json.dumps(filter_obj))
        return (
            f"{DLVRY_API_BASE}/affiliates/{affiliate_id}/statistics"
            f"?type=orders&date_from={date_from}&date_to={date_to}&filter={encoded}"
        )

    def _parse_response(self, data: dict) -> Optional[DlvryStats]:
        """Распарсить успешный ответ DLVRY API в DlvryStats."""
        items = data.get('data', {}).get('items', [])

        total_count = sum(i.get('count', 0) for i in items)
        total_sum = sum(i.get('sum', 0) for i in items)
        total_first = sum(i.get('first_orders', {}).get('count', 0) for i in items)

        daily = []
        for i in items:
            fo = i.get('first_orders', {}) or {}
            ds = i.get('delivery_self', {}) or {}
            dd = i.get('delivery_delivery', {}) or {}
            cnt = i.get('count', 0)

            daily.append(DlvryDailyItem(
                date=i.get('date', ''),
                count=cnt,
                sum=i.get('sum', 0),
                first_orders=fo.get('count', 0),
                avg_check=round(i['sum'] / cnt, 2) if cnt > 0 else 0,
                # Отмены
                canceled=i.get('canceled', 0),
                canceled_sum=i.get('canceled_sum', 0),
                # Финансы
                cost=i.get('cost', 0),
                discount=i.get('discount', 0),
                first_orders_sum=fo.get('sum', 0),
                first_orders_cost=fo.get('cost', 0),
                # Клиенты
                unique_clients=i.get('unique_clients', 0),
                # Оплата
                sum_cash=i.get('sum_cash', 0),
                count_payment_cash=i.get('count_payment_cash', 0),
                sum_card=i.get('sum_card', 0),
                count_payment_card=i.get('count_payment_card', 0),
                count_payment_online=i.get('count_payment_online', 0),
                sum_online_success=i.get('sum_online_success', 0),
                sum_online_fail=i.get('sum_online_fail', 0),
                # Источники
                source_site=i.get('source_site', 0),
                sum_source_site=i.get('sum_source_site', 0),
                source_vkapp=i.get('source_vkapp', 0),
                sum_source_vkapp=i.get('sum_source_vkapp', 0),
                source_ios=i.get('source_ios', 0),
                sum_source_ios=i.get('sum_source_ios', 0),
                source_android=i.get('source_android', 0),
                sum_source_android=i.get('sum_source_android', 0),
                # Доставка
                delivery_self_count=ds.get('count', 0),
                delivery_self_sum=ds.get('sum', 0),
                delivery_count=dd.get('count', 0),
                delivery_sum=dd.get('sum', 0),
                # Повторные заказы
                repeat_order_2=(i.get('client_orders_count_2', {}) or {}).get('count', 0),
                repeat_order_3=(i.get('client_orders_count_3', {}) or {}).get('count', 0),
                repeat_order_4=(i.get('client_orders_count_4', {}) or {}).get('count', 0),
                repeat_order_5=(i.get('client_orders_count_5', {}) or {}).get('count', 0),
            ))

        return DlvryStats(
            total_count=total_count,
            total_sum=total_sum,
            total_first_orders=total_first,
            avg_check=round(total_sum / total_count, 2) if total_count > 0 else 0,
            daily_items=daily,
        )

    async def _fetch_statistics(
        self,
        affiliate_id: str,
        date_from: str,
        date_to: str,
        extra_filter: dict | None = None,
    ) -> Optional[DlvryStats]:
        """
        Запрос к DLVRY API.

        Endpoint:
            GET https://dlvry.ru/api/v1/affiliates/{affiliate_id}/statistics

        Headers:
            Authorization: Bearer <token>

        Query params:
            type      = "orders"
            date_from = DD.MM.YYYY
            date_to   = DD.MM.YYYY
            filter    = URL-encoded JSON (объект фильтра)
        """
        filter_obj = self._build_filter(affiliate_id, date_from, date_to, extra_filter)
        url = self._build_url(affiliate_id, date_from, date_to, filter_obj)

        try:
            async with aiohttp.ClientSession(timeout=self._timeout) as session:
                async with session.get(
                    url,
                    headers={"Authorization": f"Bearer {self._token}"},
                ) as resp:
                    raw_text = await resp.text()
                    logger.debug(
                        "DLVRY API raw response: affiliate=%s, status_code=%s, body=%s",
                        affiliate_id, resp.status, raw_text,
                    )

                    import json as _json
                    try:
                        result = _json.loads(raw_text)
                    except Exception:
                        logger.error("DLVRY API: не удалось распарсить JSON, raw=%s", raw_text)
                        return None

                    if result and result.get('status') == 'success':
                        return self._parse_response(result)

                    # Ошибка от API
                    error_info = result.get('error', {}) if result else {}
                    error_code = error_info.get('error_code', resp.status)
                    error_msg = error_info.get('error_msg', 'unknown')
                    logger.warning(
                        "DLVRY API error: affiliate=%s, code=%s, msg=%s, full_response=%s",
                        affiliate_id, error_code, error_msg, raw_text,
                    )
                    return None

        except Exception as e:
            logger.error("DLVRY API request failed for affiliate %s: %s", affiliate_id, e)
            return None
