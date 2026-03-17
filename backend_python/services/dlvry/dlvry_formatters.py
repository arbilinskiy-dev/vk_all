"""
Форматирование ответов DLVRY — вынесено из роутера для читаемости.

Каждая функция принимает ORM-объект(ы) и возвращает dict/Pydantic-модель,
готовую к отдаче через FastAPI.
"""

from typing import List
from schemas.dlvry_schemas import (
    DlvryOrderResponse,
    DlvryWebhookLogResponse,
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Заказы
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def format_order_list_item(order) -> DlvryOrderResponse:
    """Формат одного заказа для списка /orders."""
    return DlvryOrderResponse(
        id=order.id,
        dlvry_order_id=order.dlvry_order_id,
        affiliate_id=order.affiliate_id,
        order_date=order.order_date.isoformat() if order.order_date else None,
        client_name=order.client_name,
        client_phone=order.phone,
        total=order.total,
        payment_type=order.payment_name,
        delivery_type=order.delivery_name,
        source_name=order.source_name,
        status=order.status,
        items_count=order.items_count,
        created_at=order.received_at.isoformat() if order.received_at else None,
        # Расширенные поля для переключаемых групп колонок
        cost=order.cost,
        discount=order.discount,
        delivery_price=order.delivery_price,
        subtotal=order.order_sum,
        payment_bonus=order.payment_bonus,
        markup=order.markup,
        vk_platform=order.vk_platform,
        vk_user_id=order.vk_user_id,
        address_city=order.address_city,
        persons=order.persons,
        items_total_qty=order.items_total_qty,
        promocode=order.promocode,
        comment=order.comment,
        is_preorder=order.is_preorder or False,
    )


def format_order_detail(order, items: list, catalog: dict[str, str] | None = None) -> dict:
    """Формат полных деталей заказа для /orders/{order_id}.
    
    catalog — опциональный маппинг {dlvry_item_id: name} из каталога DLVRY.
    """
    return {
        "order": {
            "id": order.id,
            "dlvry_order_id": order.dlvry_order_id,
            "affiliate_id": order.affiliate_id,
            "order_date": order.order_date.isoformat() if order.order_date else None,
            "client_name": order.client_name,
            "client_phone": order.phone,
            "client_email": order.client_email,
            "client_birthday": order.client_bday,
            "vk_user_id": order.vk_user_id,
            "vk_group_id": order.vk_group_id,
            "vk_platform": order.vk_platform,
            "address_full": order.address_full,
            "address_city": order.address_city,
            "address_street": order.address_street,
            "address_house": order.address_house,
            "address_flat": order.address_apt,
            "total": order.total,
            "subtotal": order.order_sum,
            "discount": order.discount,
            "delivery_price": order.delivery_price,
            "payment_type": order.payment_name,
            "payment_code": order.payment_code,
            "delivery_type": order.delivery_name,
            "delivery_code": order.delivery_code,
            "source_name": order.source_name,
            "source_code": order.source_code,
            "pickup_point_name": order.pickup_point_name,
            "promocode": order.promocode,
            "comment": order.comment,
            "preorder": order.is_preorder,
            "status": order.status,
            "items_count": order.items_count,
            "items_json": order.items_text,
            "raw_json": order.raw_json,
            "created_at": order.received_at.isoformat() if order.received_at else None,
            # Расширенные поля
            "cost": order.cost,
            "payment_bonus": order.payment_bonus,
            "markup": order.markup,
            "persons": order.persons,
            "items_total_qty": order.items_total_qty,
        },
        "items": [
            {
                "id": item.id,
                "name": item.name or (catalog or {}).get(str(item.dlvry_item_id), '') or '',
                "price": item.price,
                "quantity": item.quantity,
                "total": round(float(item.price or 0) * int(item.quantity or 1), 2),
                "code": item.code,
                "weight": item.weight,
                "options": item.options_json,
            }
            for item in items
        ],
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Webhook-логи
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def format_webhook_log(log) -> DlvryWebhookLogResponse:
    """Формат одной записи лога вебхука."""
    return DlvryWebhookLogResponse(
        id=log.id,
        remote_ip=log.remote_ip,
        affiliate_id=log.affiliate_id,
        dlvry_order_id=log.dlvry_order_id,
        result=log.result,
        error_message=log.error_message,
        timestamp=log.timestamp,
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Дневная статистика
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def format_daily_stats_row(row) -> dict:
    """Формат одной строки дневной статистики для /stats/daily."""
    return {
        "date": row.stat_date.isoformat(),
        "orders_count": row.orders_count,
        "revenue": row.revenue,
        "first_orders": row.first_orders,
        "avg_check": row.avg_check,
        # Отмены
        "canceled": row.canceled,
        "canceled_sum": row.canceled_sum,
        # Финансы
        "cost": row.cost,
        "discount": row.discount,
        "first_orders_sum": row.first_orders_sum,
        "first_orders_cost": row.first_orders_cost,
        # Клиенты
        "unique_clients": row.unique_clients,
        # Оплата (разбивка)
        "sum_cash": row.sum_cash,
        "count_payment_cash": row.count_payment_cash,
        "sum_card": row.sum_card,
        "count_payment_card": row.count_payment_card,
        "count_payment_online": row.count_payment_online,
        "sum_online_success": row.sum_online_success,
        "sum_online_fail": row.sum_online_fail,
        # Источники
        "source_site": row.source_site,
        "sum_source_site": row.sum_source_site,
        "source_vkapp": row.source_vkapp,
        "sum_source_vkapp": row.sum_source_vkapp,
        "source_ios": row.source_ios,
        "sum_source_ios": row.sum_source_ios,
        "source_android": row.source_android,
        "sum_source_android": row.sum_source_android,
        # Доставка
        "delivery_self_count": row.delivery_self_count,
        "delivery_self_sum": row.delivery_self_sum,
        "delivery_count": row.delivery_count,
        "delivery_sum": row.delivery_sum,
        # Повторные заказы
        "repeat_order_2": row.repeat_order_2,
        "repeat_order_3": row.repeat_order_3,
        "repeat_order_4": row.repeat_order_4,
        "repeat_order_5": row.repeat_order_5,
    }
