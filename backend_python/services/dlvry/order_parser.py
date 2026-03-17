"""
Парсинг и сохранение одного заказа из DLVRY hl-orders API.
"""

import json
import logging
from typing import Optional

from sqlalchemy.orm import Session

from services.dlvry.order_service import (
    parse_dlvry_date,
    normalize_phone,
    format_address,
    parse_items,
    _safe_float,
    _safe_int,
)
from services.dlvry.order_vk_profiles import ensure_vk_profile_for_order
from crud.dlvry_order_crud import order_exists, create_order

logger = logging.getLogger(__name__)


def save_order_from_api(
    db: Session,
    payload: dict,
    affiliate_id: str,
    project_id: Optional[str],
    catalog: Optional[dict] = None,
) -> bool:
    """
    Сохраняет один заказ из hl-orders API в БД.
    Возвращает True если заказ новый, False если дубликат.
    Формат hl-orders совпадает с webhook payload.
    """
    dlvry_order_id = payload.get('id')
    if not dlvry_order_id:
        return False

    # Дедупликация
    if order_exists(db, str(dlvry_order_id), str(affiliate_id)):
        return False

    try:
        # Парсинг (переиспользуем логику из order_service)
        order_date = parse_dlvry_date(payload.get('date'))

        client = payload.get('client') or {}
        # hl-orders возвращает phone на верхнем уровне
        phone_raw = str(
            payload.get('phone') or client.get('phone') or ''
        ).strip()
        phone = normalize_phone(phone_raw)

        address = payload.get('address') or {}
        address_full = format_address(address)

        items_data, items_text, items_count, items_total_qty = parse_items(
            payload.get('items'), catalog=catalog
        )

        source = payload.get('source') or {}
        payment = payload.get('payment') or {}
        delivery = payload.get('delivery') or {}
        pickup = payload.get('pickup_point') or {}
        promo = payload.get('promocode') or {}

        order_data = {
            'dlvry_order_id': str(dlvry_order_id),
            'owner_id': str(payload.get('owner_id') or ''),
            'affiliate_id': str(affiliate_id),
            'project_id': project_id,
            # VK
            'vk_group_id': str(payload.get('vk_group_id') or ''),
            'vk_user_id': str(payload.get('vk_user_id') or ''),
            'vk_platform': payload.get('vk_platform') or '',
            'domain': payload.get('domain') or '',
            # Источник
            'source_code': source.get('code') or '',
            'source_name': source.get('name') or '',
            # Клиент
            'client_id': str(client.get('id') or ''),
            'client_name': client.get('name') or '',
            'phone_raw': phone_raw,
            'phone': phone,
            'client_email': client.get('email') or '',
            'client_bday': client.get('bday') or '',
            # Оплата
            'payment_code': payment.get('code') or '',
            'payment_name': payment.get('name') or '',
            # Доставка
            'delivery_code': delivery.get('code') or '',
            'delivery_name': delivery.get('name') or '',
            'delivery_price': _safe_float(payload.get('delivery_price')),
            'pickup_point_code': pickup.get('code') or '',
            'pickup_point_name': pickup.get('name') or '',
            # Адрес
            'address_country': address.get('country') or '',
            'address_region': address.get('region') or '',
            'address_city': address.get('city') or '',
            'address_district': address.get('district') or '',
            'address_street': address.get('street') or '',
            'address_house': address.get('house') or '',
            'address_block': address.get('block') or '',
            'address_entrance': address.get('entrance') or '',
            'address_floor': address.get('floor') or '',
            'address_apt': address.get('apt') or '',
            'address_full': address_full,
            # Товары / суммы
            'items_text': items_text,
            'items_count': items_count,
            'items_total_qty': items_total_qty,
            'order_sum': _safe_float(payload.get('sum')),
            'discount': _safe_float(payload.get('discount')),
            'payment_bonus': _safe_float(payload.get('payment_bonus')),
            'markup': _safe_float(payload.get('markup')),
            'total': _safe_float(payload.get('total')),
            'cost': _safe_float(payload.get('cost')),
            # Прочее
            'persons': _safe_int(payload.get('persons')),
            'promocode': promo.get('code') or '' if isinstance(promo, dict) else str(promo or ''),
            'comment': payload.get('comment') or '',
            'is_preorder': payload.get('preorder') is True,
            # Дата
            'order_date_str': payload.get('date') or '',
            'order_date': order_date,
            'order_year': order_date.year if order_date else None,
            'order_month': order_date.month if order_date else None,
            'order_weekday': order_date.isoweekday() if order_date else None,
            # Статус — из API (может быть dict {"code": "...", "name": "..."} или строка)
            'status': (
                (payload['status'].get('code') or payload['status'].get('name') or 'received')
                if isinstance(payload.get('status'), dict)
                else str(payload.get('status') or 'received')
            ),
        }

        # Привязка к VK-профилю (upsert vk_profiles + project_members)
        vk_profile_id = ensure_vk_profile_for_order(
            db,
            order_data['vk_user_id'],
            project_id,
        )
        if vk_profile_id:
            order_data['vk_profile_id'] = vk_profile_id

        raw_json = json.dumps(payload, ensure_ascii=False, default=str)
        create_order(db, order_data, items_data, raw_json)
        return True

    except Exception as e:
        logger.error(
            f"[DLVRY Orders Sync] Ошибка сохранения заказа #{dlvry_order_id}: {e}",
            exc_info=True,
        )
        try:
            db.rollback()
        except Exception:
            pass
        return False
