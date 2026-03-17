"""
CRUD-операции для DLVRY-заказов.
Создание, чтение, проверка дубликатов, статистика.
"""

import json
import logging
from datetime import datetime, date as date_type, timedelta
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
        # date_to — это date (полночь), а order_date — datetime.
        # Чтобы включить весь последний день, сравниваем < date_to + 1 день.
        if isinstance(date_to, date_type) and not isinstance(date_to, datetime):
            query = query.filter(DlvryOrder.order_date < date_to + timedelta(days=1))
        else:
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
        if isinstance(date_to, date_type) and not isinstance(date_to, datetime):
            query = query.filter(DlvryOrder.order_date < date_to + timedelta(days=1))
        else:
            query = query.filter(DlvryOrder.order_date <= date_to)

    result = query.one()

    # Подсчёт заказов за сегодня (всегда, независимо от фильтра дат)
    today = date_type.today()
    today_query = db.query(sa_func.count(DlvryOrder.id))
    if project_id:
        today_query = today_query.filter(DlvryOrder.project_id == project_id)
    if affiliate_id:
        today_query = today_query.filter(DlvryOrder.affiliate_id == affiliate_id)
    if vk_group_id:
        today_query = today_query.filter(DlvryOrder.vk_group_id == vk_group_id)
    today_query = today_query.filter(
        DlvryOrder.order_date >= today,
        DlvryOrder.order_date < today + timedelta(days=1),
    )
    orders_today = today_query.scalar() or 0

    return {
        'total_orders': result.total_orders or 0,
        'total_revenue': float(result.total_revenue or 0),
        'avg_check': round(float(result.avg_check or 0), 2),
        'total_items': result.total_items or 0,
        'unique_clients': result.unique_clients or 0,
        'orders_today': orders_today,
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


def clear_webhook_logs(db: Session) -> int:
    """Удалить все записи из журнала вебхуков. Возвращает количество удалённых."""
    count = db.query(DlvryWebhookLog).count()
    db.query(DlvryWebhookLog).delete()
    db.commit()
    return count


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Аналитика товаров (агрегация по позициям заказов)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _apply_product_filters(
    query,
    project_id: Optional[str] = None,
    affiliate_id: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    """Применить общие фильтры для товарных запросов (JOIN с dlvry_orders)."""
    if project_id:
        query = query.filter(DlvryOrder.project_id == project_id)
    if affiliate_id:
        query = query.filter(DlvryOrder.affiliate_id == affiliate_id)
    if date_from:
        query = query.filter(DlvryOrder.order_date >= date_from)
    if date_to:
        if isinstance(date_to, date_type) and not isinstance(date_to, datetime):
            query = query.filter(DlvryOrder.order_date < date_to + timedelta(days=1))
        else:
            query = query.filter(DlvryOrder.order_date <= date_to)
    return query


def get_products_analytics(
    db: Session,
    project_id: Optional[str] = None,
    affiliate_id: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
    sort_by: str = "total_qty",
    sort_dir: str = "desc",
    skip: int = 0,
    limit: int = 50,
) -> Tuple[list, int]:
    """
    Агрегированная аналитика товаров.
    Группировка по dlvry_item_id + name.
    Возвращает (products, total_count).
    """
    # Базовый запрос: агрегация по item_id + name
    query = (
        db.query(
            DlvryOrderItem.dlvry_item_id,
            DlvryOrderItem.name,
            sa_func.max(DlvryOrderItem.code).label("code"),
            sa_func.max(DlvryOrderItem.sku_title).label("sku_title"),
            sa_func.sum(DlvryOrderItem.quantity).label("total_qty"),
            sa_func.count(DlvryOrderItem.id).label("orders_count"),
            sa_func.sum(DlvryOrderItem.price * DlvryOrderItem.quantity).label("total_revenue"),
            sa_func.avg(DlvryOrderItem.price).label("avg_price"),
            sa_func.min(DlvryOrderItem.price).label("min_price"),
            sa_func.max(DlvryOrderItem.price).label("max_price"),
        )
        .join(DlvryOrder, DlvryOrderItem.order_id == DlvryOrder.id)
        .group_by(DlvryOrderItem.dlvry_item_id, DlvryOrderItem.name)
    )

    query = _apply_product_filters(query, project_id, affiliate_id, date_from, date_to)

    # Поиск по названию товара
    if search:
        query = query.having(DlvryOrderItem.name.ilike(f"%{search}%"))

    # Считаем общее количество уникальных товаров (subquery)
    count_subquery = query.subquery()
    total_count = db.query(sa_func.count()).select_from(count_subquery).scalar() or 0

    # Сортировка
    sort_columns = {
        "total_qty": "total_qty",
        "orders_count": "orders_count",
        "total_revenue": "total_revenue",
        "avg_price": "avg_price",
        "min_price": "min_price",
        "max_price": "max_price",
        "name": DlvryOrderItem.name,
    }
    sort_col = sort_columns.get(sort_by, "total_qty")
    if sort_dir == "asc":
        query = query.order_by(sort_col)
    else:
        query = query.order_by(desc(sort_col))

    products = query.offset(skip).limit(limit).all()

    return [
        {
            "dlvry_item_id": row.dlvry_item_id or "",
            "name": row.name or "",
            "code": row.code or "",
            "sku_title": row.sku_title or "",
            "total_qty": row.total_qty or 0,
            "orders_count": row.orders_count or 0,
            "total_revenue": round(float(row.total_revenue or 0), 2),
            "avg_price": round(float(row.avg_price or 0), 2),
            "min_price": round(float(row.min_price or 0), 2),
            "max_price": round(float(row.max_price or 0), 2),
        }
        for row in products
    ], total_count


def get_products_summary(
    db: Session,
    project_id: Optional[str] = None,
    affiliate_id: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> dict:
    """Сводная статистика по товарам за период."""
    query = (
        db.query(
            sa_func.count(sa_func.distinct(
                sa_func.concat(DlvryOrderItem.dlvry_item_id, ':', DlvryOrderItem.name)
            )).label("unique_products"),
            sa_func.coalesce(sa_func.sum(DlvryOrderItem.quantity), 0).label("total_qty"),
            sa_func.coalesce(
                sa_func.sum(DlvryOrderItem.price * DlvryOrderItem.quantity), 0
            ).label("total_revenue"),
            sa_func.count(sa_func.distinct(DlvryOrderItem.order_id)).label("total_orders"),
        )
        .join(DlvryOrder, DlvryOrderItem.order_id == DlvryOrder.id)
    )

    query = _apply_product_filters(query, project_id, affiliate_id, date_from, date_to)
    result = query.one()

    total_qty = int(result.total_qty or 0)
    total_revenue = float(result.total_revenue or 0)
    total_orders = int(result.total_orders or 0)

    return {
        "unique_products": result.unique_products or 0,
        "total_qty": total_qty,
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "avg_qty_per_order": round(total_qty / total_orders, 1) if total_orders else 0,
        "avg_revenue_per_product": round(total_revenue / result.unique_products, 2) if result.unique_products else 0,
    }


def get_product_related(
    db: Session,
    dlvry_item_id: str,
    project_id: Optional[str] = None,
    affiliate_id: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = 15,
) -> dict:
    """
    Сопутствующие товары (co-occurrence).
    Находит все заказы, содержащие целевой товар,
    и считает, какие другие товары в них встречаются.
    Возвращает {target_orders_count, related: [{name, dlvry_item_id, co_orders, pct, avg_qty}]}.
    """
    from sqlalchemy.orm import aliased

    # 1. Подзапрос: order_id заказов, содержащих целевой товар
    target_orders = (
        db.query(DlvryOrderItem.order_id)
        .join(DlvryOrder, DlvryOrderItem.order_id == DlvryOrder.id)
        .filter(DlvryOrderItem.dlvry_item_id == dlvry_item_id)
    )
    target_orders = _apply_product_filters(target_orders, project_id, affiliate_id, date_from, date_to)
    target_orders_sub = target_orders.subquery()

    # Сколько всего таких заказов
    target_count = db.query(sa_func.count(sa_func.distinct(target_orders_sub.c.order_id))).scalar() or 0
    if target_count == 0:
        return {"target_orders_count": 0, "related": []}

    # 2. В этих заказах считаем все ДРУГИЕ товары
    OtherItem = aliased(DlvryOrderItem)
    related_query = (
        db.query(
            OtherItem.dlvry_item_id,
            OtherItem.name,
            sa_func.count(sa_func.distinct(OtherItem.order_id)).label("co_orders"),
            sa_func.avg(OtherItem.quantity).label("avg_qty"),
        )
        .filter(OtherItem.order_id.in_(db.query(target_orders_sub.c.order_id)))
        .filter(OtherItem.dlvry_item_id != dlvry_item_id)
        .group_by(OtherItem.dlvry_item_id, OtherItem.name)
        .order_by(desc("co_orders"))
        .limit(limit)
    )

    rows = related_query.all()
    related = []
    for row in rows:
        co = row.co_orders or 0
        related.append({
            "dlvry_item_id": row.dlvry_item_id or "",
            "name": row.name or "",
            "co_orders": co,
            "pct": round(co / target_count * 100, 1),
            "avg_qty": round(float(row.avg_qty or 0), 1),
        })

    return {"target_orders_count": target_count, "related": related}
