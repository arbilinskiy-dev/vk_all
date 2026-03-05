"""
CRUD-операции для DLVRY-заказов.
Создание, чтение, проверка дубликатов, статистика.
"""

import json
import logging
from datetime import datetime
from typing import Optional, List, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func, desc, and_, or_

from models_library.dlvry_orders import DlvryOrder, DlvryOrderItem, DlvryWebhookLog

logger = logging.getLogger(__name__)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Проверка дубликатов
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def order_exists(db: Session, dlvry_order_id: str, affiliate_id: str) -> bool:
    """Проверяет, есть ли уже заказ с таким ID в БД."""
    return db.query(DlvryOrder).filter(
        DlvryOrder.dlvry_order_id == str(dlvry_order_id),
        DlvryOrder.affiliate_id == str(affiliate_id),
    ).first() is not None


def get_order_by_dlvry_id(db: Session, dlvry_order_id: str, affiliate_id: str) -> Optional[DlvryOrder]:
    """Получить заказ по ID DLVRY."""
    return db.query(DlvryOrder).filter(
        DlvryOrder.dlvry_order_id == str(dlvry_order_id),
        DlvryOrder.affiliate_id == str(affiliate_id),
    ).first()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Создание заказа
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def create_order(db: Session, order_data: dict, items_data: List[dict], raw_json: str) -> DlvryOrder:
    """
    Создаёт заказ + позиции в БД.
    order_data — словарь полей для DlvryOrder.
    items_data — список словарей для DlvryOrderItem.
    raw_json — оригинальный JSON строкой.
    """
    order = DlvryOrder(**order_data, raw_json=raw_json)
    db.add(order)
    db.flush()  # Получаем order.id

    # Создаём позиции
    for item in items_data:
        db_item = DlvryOrderItem(order_id=order.id, **item)
        db.add(db_item)

    db.commit()
    db.refresh(order)
    
    logger.info(
        f"[DLVRY] Заказ #{order.dlvry_order_id} сохранён (id={order.id}, "
        f"affiliate={order.affiliate_id}, total={order.total}, items={len(items_data)})"
    )
    return order


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Чтение заказов
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_orders(
    db: Session,
    affiliate_id: Optional[str] = None,
    vk_group_id: Optional[str] = None,
    project_id: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[DlvryOrder], int]:
    """
    Получить список заказов с фильтрацией и пагинацией.
    Возвращает (orders, total_count).
    """
    query = db.query(DlvryOrder)

    # Фильтры
    if project_id:
        query = query.filter(DlvryOrder.project_id == project_id)
    if affiliate_id:
        query = query.filter(DlvryOrder.affiliate_id == affiliate_id)
    if vk_group_id:
        query = query.filter(DlvryOrder.vk_group_id == vk_group_id)
    if date_from:
        query = query.filter(DlvryOrder.order_date >= date_from)
    if date_to:
        query = query.filter(DlvryOrder.order_date <= date_to)
    if search:
        search_term = f"%{search}%"
        query = query.filter(or_(
            DlvryOrder.dlvry_order_id.ilike(search_term),
            DlvryOrder.client_name.ilike(search_term),
            DlvryOrder.phone.ilike(search_term),
            DlvryOrder.items_text.ilike(search_term),
            DlvryOrder.comment.ilike(search_term),
        ))

    total_count = query.count()

    orders = (
        query
        .order_by(desc(DlvryOrder.order_date))
        .offset(skip)
        .limit(limit)
        .all()
    )

    return orders, total_count


def get_order_by_id(db: Session, order_id: int) -> Optional[DlvryOrder]:
    """Получить заказ по внутреннему ID."""
    return db.query(DlvryOrder).filter(DlvryOrder.id == order_id).first()


def get_order_items(db: Session, order_id: int) -> List[DlvryOrderItem]:
    """Получить позиции заказа."""
    return db.query(DlvryOrderItem).filter(DlvryOrderItem.order_id == order_id).all()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Статистика
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_orders_stats(
    db: Session,
    affiliate_id: Optional[str] = None,
    vk_group_id: Optional[str] = None,
    project_id: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> dict:
    """Агрегированная статистика заказов."""
    query = db.query(
        sa_func.count(DlvryOrder.id).label('total_orders'),
        sa_func.coalesce(sa_func.sum(DlvryOrder.total), 0).label('total_revenue'),
        sa_func.coalesce(sa_func.avg(DlvryOrder.total), 0).label('avg_check'),
        sa_func.coalesce(sa_func.sum(DlvryOrder.items_total_qty), 0).label('total_items'),
        sa_func.count(sa_func.distinct(DlvryOrder.vk_user_id)).label('unique_clients'),
    )

    if project_id:
        query = query.filter(DlvryOrder.project_id == project_id)
    if affiliate_id:
        query = query.filter(DlvryOrder.affiliate_id == affiliate_id)
    if vk_group_id:
        query = query.filter(DlvryOrder.vk_group_id == vk_group_id)
    if date_from:
        query = query.filter(DlvryOrder.order_date >= date_from)
    if date_to:
        query = query.filter(DlvryOrder.order_date <= date_to)

    result = query.one()
    return {
        'total_orders': result.total_orders or 0,
        'total_revenue': float(result.total_revenue or 0),
        'avg_check': round(float(result.avg_check or 0), 2),
        'total_items': result.total_items or 0,
        'unique_clients': result.unique_clients or 0,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Логирование вебхуков
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def log_webhook(
    db: Session,
    remote_ip: Optional[str],
    affiliate_id: Optional[str],
    dlvry_order_id: Optional[str],
    result: str,
    error_message: Optional[str] = None,
    payload: Optional[str] = None,
) -> DlvryWebhookLog:
    """Записать лог входящего вебхука."""
    log = DlvryWebhookLog(
        remote_ip=remote_ip,
        affiliate_id=affiliate_id,
        dlvry_order_id=dlvry_order_id,
        result=result,
        error_message=error_message,
        payload=payload[:50000] if payload else None,  # Лимит 50KB на запись
    )
    db.add(log)
    db.commit()
    return log


def get_webhook_logs(
    db: Session,
    limit: int = 100,
    offset: int = 0,
    result_filter: Optional[str] = None,
) -> Tuple[List[DlvryWebhookLog], int]:
    """Получить логи вебхуков."""
    query = db.query(DlvryWebhookLog)
    if result_filter:
        query = query.filter(DlvryWebhookLog.result == result_filter)

    total = query.count()
    logs = query.order_by(desc(DlvryWebhookLog.timestamp)).offset(offset).limit(limit).all()
    return logs, total
