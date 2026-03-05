"""
Сервис обработки заказов DLVRY.
Парсинг webhook payload → нормализованные данные → сохранение в БД.
"""

import json
import logging
import re
from datetime import datetime
from typing import Optional, Tuple, List

from sqlalchemy.orm import Session

from crud.dlvry_order_crud import (
    order_exists,
    create_order,
    log_webhook,
)
from schemas.dlvry_schemas import DlvryWebhookPayload
from models_library.projects import Project

logger = logging.getLogger(__name__)

# Формат даты DLVRY: "dd.MM.yyyy HH:mm:ss"
DLVRY_DATE_FMT = "%d.%m.%Y %H:%M:%S"

# Русские названия месяцев и дней недели (для совместимости с Google Sheets)
MONTHS_RU = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]
WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Нормализация телефона
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def normalize_phone(phone: Optional[str]) -> str:
    """
    Нормализация телефонного номера.
    8XXXXXXXXXX → +7XXXXXXXXXX
    7XXXXXXXXXX → +7XXXXXXXXXX
    10 цифр → +7XXXXXXXXXX
    """
    if not phone:
        return ""
    
    raw = str(phone).strip()
    digits_with_plus = re.sub(r'[^\d+]', '', raw)
    if not digits_with_plus:
        return ""

    only_digits = re.sub(r'\D', '', digits_with_plus)

    # 8XXXXXXXXXX → +7XXXXXXXXXX
    if re.match(r'^8\d{10}$', only_digits):
        return '+7' + only_digits[1:]

    # 7XXXXXXXXXX → +7XXXXXXXXXX
    if re.match(r'^7\d{10}$', only_digits):
        return '+7' + only_digits[1:]

    # 10 цифр → считаем РФ
    if re.match(r'^\d{10}$', only_digits):
        return '+7' + only_digits

    # Уже с + и адекватная длина
    if re.match(r'^\+\d{6,15}$', digits_with_plus):
        return digits_with_plus

    return raw


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Парсинг даты
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def parse_dlvry_date(date_str: Optional[str]) -> Optional[datetime]:
    """Парсит дату из формата DLVRY (dd.MM.yyyy HH:mm:ss)."""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str.strip(), DLVRY_DATE_FMT)
    except (ValueError, AttributeError):
        logger.warning(f"[DLVRY] Не удалось распарсить дату: {date_str}")
        return None


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Формирование адреса
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def format_address(address: Optional[dict]) -> str:
    """Собирает полный адрес из компонентов."""
    if not address or not isinstance(address, dict):
        return ""
    
    parts = []
    for field in ['country', 'city', 'street', 'house', 'block', 'entrance', 'floor', 'apt']:
        val = address.get(field, '')
        if val:
            parts.append(str(val))
    return ', '.join(parts)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Парсинг товаров
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _safe_float(val, default=0.0) -> float:
    """Безопасно конвертирует значение в float."""
    if val is None or val == '':
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def _safe_int(val, default=0) -> int:
    """Безопасно конвертирует значение в int."""
    if val is None or val == '':
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default


def parse_items(items: Optional[list]) -> Tuple[List[dict], str, int, int]:
    """
    Парсит массив товаров из DLVRY.
    
    Returns:
        (items_data, items_text, items_count, items_total_qty)
        items_data — список dict для DlvryOrderItem
        items_text — текстовое описание ("Товар × 2\nТовар2 × 1")
        items_count — количество позиций
        items_total_qty — суммарное количество единиц
    """
    if not items or not isinstance(items, list):
        return [], '', 0, 0

    parsed = []
    lines = []
    total_qty = 0

    for item in items:
        if not item:
            continue

        data = item.get('data', {}) or {}
        
        name = data.get('name') or item.get('title') or ''
        qty = _safe_int(data.get('quantity') or item.get('quantity'), 1)
        total_qty += qty

        item_dict = {
            'dlvry_item_id': item.get('id'),
            'code': data.get('code'),
            'name': name,
            'price': _safe_float(data.get('price')),
            'quantity': qty,
            'full_price': _safe_float(data.get('full_price')),
            'cost_price': _safe_float(data.get('cost_price')),
            'weight': data.get('weight'),
            'volume': data.get('volume'),
            'options_json': json.dumps(data.get('options', []), ensure_ascii=False) if data.get('options') else None,
            'sku_title': (data.get('sku_for') or {}).get('title') or None,
            'image_url': (data.get('img') or {}).get('src') or None,
        }
        parsed.append(item_dict)
        lines.append(f"{name} × {qty}")

    items_text = '\n'.join(lines)
    return parsed, items_text, len(parsed), total_qty


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Главная функция обработки вебхука
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def process_dlvry_webhook(
    db: Session,
    payload: dict,
    raw_json: str,
    remote_ip: Optional[str] = None,
) -> dict:
    """
    Обрабатывает входящий webhook от DLVRY.
    
    1. Валидирует данные
    2. Проверяет дубликат по dlvry_order_id + affiliate_id
    3. Парсит товары, адрес, телефон
    4. Сохраняет заказ + позиции в БД
    5. Логирует результат
    
    Returns:
        {"success": bool, "order_id": str|None, "message": str, "is_duplicate": bool}
    """
    dlvry_order_id = payload.get('id')
    affiliate_id = payload.get('affiliate_id')

    # ── Валидация обязательных полей ──────────────────────────
    if not dlvry_order_id:
        log_webhook(db, remote_ip, affiliate_id, None, 'error', 'Отсутствует id заказа', raw_json)
        return {"success": False, "order_id": None, "message": "Отсутствует id заказа", "is_duplicate": False}

    if not affiliate_id:
        log_webhook(db, remote_ip, None, dlvry_order_id, 'error', 'Отсутствует affiliate_id', raw_json)
        return {"success": False, "order_id": None, "message": "Отсутствует affiliate_id", "is_duplicate": False}

    # ── Проверка дубликата ────────────────────────────────────
    if order_exists(db, str(dlvry_order_id), str(affiliate_id)):
        log_webhook(db, remote_ip, str(affiliate_id), str(dlvry_order_id), 'duplicate')
        logger.info(f"[DLVRY] Дубликат заказа #{dlvry_order_id} (affiliate={affiliate_id})")
        return {"success": True, "order_id": str(dlvry_order_id), "message": "Дубликат — заказ уже существует", "is_duplicate": True}

    # ── Привязка к проекту по affiliate_id ────────────────────
    project = db.query(Project).filter(Project.dlvry_affiliate_id == str(affiliate_id)).first()
    project_id = project.id if project else None
    if not project:
        logger.warning(f"[DLVRY] Проект для affiliate_id={affiliate_id} не найден — заказ будет сохранён без привязки")

    # ── Парсинг данных ────────────────────────────────────────
    try:
        # Дата
        order_date = parse_dlvry_date(payload.get('date'))
        
        # Клиент
        client = payload.get('client') or {}
        phone_raw = str(client.get('phone') or '').strip()
        phone = normalize_phone(phone_raw)
        
        # Адрес
        address = payload.get('address') or {}
        address_full = format_address(address)
        
        # Товары
        items_data, items_text, items_count, items_total_qty = parse_items(payload.get('items'))
        
        # Источник
        source = payload.get('source') or {}
        
        # Оплата
        payment = payload.get('payment') or {}
        
        # Доставка
        delivery = payload.get('delivery') or {}
        pickup = payload.get('pickup_point') or {}
        
        # Промокод
        promo = payload.get('promocode') or {}

        # ── Формируем данные заказа ───────────────────────────
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
            'promocode': promo.get('code') or '',
            'comment': payload.get('comment') or '',
            'is_preorder': payload.get('preorder') is True,
            
            # Дата
            'order_date_str': payload.get('date') or '',
            'order_date': order_date,
            'order_year': order_date.year if order_date else None,
            'order_month': order_date.month if order_date else None,
            'order_weekday': order_date.isoweekday() if order_date else None,  # пн=1, вс=7
            
            # Статус
            'status': 'received',
        }

        # ── Сохраняем ────────────────────────────────────────
        order = create_order(db, order_data, items_data, raw_json)
        
        # Логируем успех
        log_webhook(db, remote_ip, str(affiliate_id), str(dlvry_order_id), 'ok')
        
        return {
            "success": True,
            "order_id": str(dlvry_order_id),
            "message": f"Заказ #{dlvry_order_id} принят ({items_count} позиций, {order.total} ₽)",
            "is_duplicate": False,
        }

    except Exception as e:
        logger.error(f"[DLVRY] Ошибка обработки заказа #{dlvry_order_id}: {e}", exc_info=True)
        try:
            db.rollback()
        except Exception:
            pass
        
        log_webhook(db, remote_ip, str(affiliate_id), str(dlvry_order_id), 'error', str(e), raw_json)
        
        return {
            "success": False,
            "order_id": str(dlvry_order_id),
            "message": f"Ошибка обработки: {e}",
            "is_duplicate": False,
        }
