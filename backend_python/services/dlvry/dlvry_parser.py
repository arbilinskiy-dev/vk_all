"""
Парсинг ответов и построение запросов для DLVRY API.
Вынесено из DlvryApiClient для модульности.
"""

import json
import urllib.parse
from typing import Optional

from services.dlvry.dlvry_schemas import DlvryDailyItem, DlvryStats, DLVRY_API_BASE


def build_filter(
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


def build_url(affiliate_id: str, date_from: str, date_to: str, filter_obj: dict) -> str:
    """Собрать полный URL запроса статистики."""
    encoded = urllib.parse.quote(json.dumps(filter_obj))
    return (
        f"{DLVRY_API_BASE}/affiliates/{affiliate_id}/statistics"
        f"?type=orders&date_from={date_from}&date_to={date_to}&filter={encoded}"
    )


def parse_statistics_response(data: dict) -> Optional[DlvryStats]:
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
