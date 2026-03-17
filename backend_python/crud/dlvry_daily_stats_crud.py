"""
CRUD-операции для таблицы dlvry_daily_stats.
Чтение, запись (upsert), агрегация статистики DLVRY.
"""

import logging
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func, and_, desc

from models_library.dlvry_daily_stats import DlvryDailyStats

logger = logging.getLogger(__name__)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Upsert (запись / обновление)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def upsert_daily_stat(
    db: Session,
    affiliate_id: str,
    project_id: Optional[str],
    stat_date: date,
    orders_count: int,
    revenue: float,
    first_orders: int,
    avg_check: float,
    # Расширенные поля
    canceled: int = 0,
    canceled_sum: float = 0,
    cost: float = 0,
    discount: float = 0,
    first_orders_sum: float = 0,
    first_orders_cost: float = 0,
    unique_clients: int = 0,
    sum_cash: float = 0,
    count_payment_cash: int = 0,
    sum_card: float = 0,
    count_payment_card: int = 0,
    count_payment_online: int = 0,
    sum_online_success: float = 0,
    sum_online_fail: float = 0,
    source_site: int = 0,
    sum_source_site: float = 0,
    source_vkapp: int = 0,
    sum_source_vkapp: float = 0,
    source_ios: int = 0,
    sum_source_ios: float = 0,
    source_android: int = 0,
    sum_source_android: float = 0,
    delivery_self_count: int = 0,
    delivery_self_sum: float = 0,
    delivery_count: int = 0,
    delivery_sum: float = 0,
    repeat_order_2: int = 0,
    repeat_order_3: int = 0,
    repeat_order_4: int = 0,
    repeat_order_5: int = 0,
) -> DlvryDailyStats:
    """
    Создаёт или обновляет запись дневной статистики.
    Ключ уникальности: affiliate_id + stat_date.
    """
    existing = db.query(DlvryDailyStats).filter(
        DlvryDailyStats.affiliate_id == affiliate_id,
        DlvryDailyStats.stat_date == stat_date,
    ).first()

    # Общий словарь всех полей
    fields = dict(
        orders_count=orders_count,
        revenue=revenue,
        first_orders=first_orders,
        avg_check=avg_check,
        project_id=project_id,
        canceled=canceled,
        canceled_sum=canceled_sum,
        cost=cost,
        discount=discount,
        first_orders_sum=first_orders_sum,
        first_orders_cost=first_orders_cost,
        unique_clients=unique_clients,
        sum_cash=sum_cash,
        count_payment_cash=count_payment_cash,
        sum_card=sum_card,
        count_payment_card=count_payment_card,
        count_payment_online=count_payment_online,
        sum_online_success=sum_online_success,
        sum_online_fail=sum_online_fail,
        source_site=source_site,
        sum_source_site=sum_source_site,
        source_vkapp=source_vkapp,
        sum_source_vkapp=sum_source_vkapp,
        source_ios=source_ios,
        sum_source_ios=sum_source_ios,
        source_android=source_android,
        sum_source_android=sum_source_android,
        delivery_self_count=delivery_self_count,
        delivery_self_sum=delivery_self_sum,
        delivery_count=delivery_count,
        delivery_sum=delivery_sum,
        repeat_order_2=repeat_order_2,
        repeat_order_3=repeat_order_3,
        repeat_order_4=repeat_order_4,
        repeat_order_5=repeat_order_5,
    )

    if existing:
        for k, v in fields.items():
            setattr(existing, k, v)
        existing.updated_at = datetime.utcnow()
        db.commit()
        return existing
    else:
        row = DlvryDailyStats(
            affiliate_id=affiliate_id,
            stat_date=stat_date,
            **fields,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row


def bulk_upsert_daily_stats(
    db: Session,
    affiliate_id: str,
    project_id: Optional[str],
    items: List[Dict[str, Any]],
) -> int:
    """
    Массовый upsert дневной статистики.
    items — список dict из DLVRY API:
      [{"date": "01.03.2026", "count": 15, "sum": 22500, "first_orders": 3, "avg_check": 1500}, ...]
    Возвращает количество обработанных записей.
    """
    count = 0
    for item in items:
        # Парсим дату формата DD.MM.YYYY
        try:
            stat_dt = datetime.strptime(item['date'], '%d.%m.%Y').date()
        except (ValueError, KeyError):
            logger.warning(f"[DLVRY Stats] Пропускаем запись с невалидной датой: {item}")
            continue

        upsert_daily_stat(
            db=db,
            affiliate_id=affiliate_id,
            project_id=project_id,
            stat_date=stat_dt,
            orders_count=item.get('count', 0),
            revenue=item.get('sum', 0),
            first_orders=item.get('first_orders', 0),
            avg_check=item.get('avg_check', 0),
            # Расширенные поля
            canceled=item.get('canceled', 0),
            canceled_sum=item.get('canceled_sum', 0),
            cost=item.get('cost', 0),
            discount=item.get('discount', 0),
            first_orders_sum=item.get('first_orders_sum', 0),
            first_orders_cost=item.get('first_orders_cost', 0),
            unique_clients=item.get('unique_clients', 0),
            sum_cash=item.get('sum_cash', 0),
            count_payment_cash=item.get('count_payment_cash', 0),
            sum_card=item.get('sum_card', 0),
            count_payment_card=item.get('count_payment_card', 0),
            count_payment_online=item.get('count_payment_online', 0),
            sum_online_success=item.get('sum_online_success', 0),
            sum_online_fail=item.get('sum_online_fail', 0),
            source_site=item.get('source_site', 0),
            sum_source_site=item.get('sum_source_site', 0),
            source_vkapp=item.get('source_vkapp', 0),
            sum_source_vkapp=item.get('sum_source_vkapp', 0),
            source_ios=item.get('source_ios', 0),
            sum_source_ios=item.get('sum_source_ios', 0),
            source_android=item.get('source_android', 0),
            sum_source_android=item.get('sum_source_android', 0),
            delivery_self_count=item.get('delivery_self_count', 0),
            delivery_self_sum=item.get('delivery_self_sum', 0),
            delivery_count=item.get('delivery_count', 0),
            delivery_sum=item.get('delivery_sum', 0),
            repeat_order_2=item.get('repeat_order_2', 0),
            repeat_order_3=item.get('repeat_order_3', 0),
            repeat_order_4=item.get('repeat_order_4', 0),
            repeat_order_5=item.get('repeat_order_5', 0),
        )
        count += 1

    return count


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Чтение
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_daily_stats(
    db: Session,
    project_id: Optional[str] = None,
    affiliate_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: Optional[int] = None,
    offset: int = 0,
) -> List[DlvryDailyStats]:
    """Получить дневную статистику с фильтрацией и пагинацией."""
    query = db.query(DlvryDailyStats)

    if project_id:
        query = query.filter(DlvryDailyStats.project_id == project_id)
    if affiliate_id:
        query = query.filter(DlvryDailyStats.affiliate_id == affiliate_id)
    if date_from:
        query = query.filter(DlvryDailyStats.stat_date >= date_from)
    if date_to:
        query = query.filter(DlvryDailyStats.stat_date <= date_to)

    query = query.order_by(desc(DlvryDailyStats.stat_date))

    if offset:
        query = query.offset(offset)
    if limit is not None:
        query = query.limit(limit)

    return query.all()


def count_daily_stats(
    db: Session,
    project_id: Optional[str] = None,
    affiliate_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> int:
    """Посчитать количество записей дневной статистики с фильтрацией."""
    query = db.query(sa_func.count(DlvryDailyStats.id))

    if project_id:
        query = query.filter(DlvryDailyStats.project_id == project_id)
    if affiliate_id:
        query = query.filter(DlvryDailyStats.affiliate_id == affiliate_id)
    if date_from:
        query = query.filter(DlvryDailyStats.stat_date >= date_from)
    if date_to:
        query = query.filter(DlvryDailyStats.stat_date <= date_to)

    return query.scalar() or 0


def get_aggregated_stats(
    db: Session,
    project_id: Optional[str] = None,
    affiliate_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> Dict[str, Any]:
    """Получить агрегированные итоги за период (все поля)."""
    query = db.query(
        # Базовые
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.orders_count), 0).label('total_orders'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.revenue), 0).label('total_revenue'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.first_orders), 0).label('total_first_orders'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.unique_clients), 0).label('total_unique_clients'),
        # Отмены
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.canceled), 0).label('total_canceled'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.canceled_sum), 0).label('total_canceled_sum'),
        # Финансы
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.cost), 0).label('total_cost'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.discount), 0).label('total_discount'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.first_orders_sum), 0).label('total_first_orders_sum'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.first_orders_cost), 0).label('total_first_orders_cost'),
        # Оплата
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.count_payment_cash), 0).label('total_count_payment_cash'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.sum_cash), 0).label('total_sum_cash'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.count_payment_card), 0).label('total_count_payment_card'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.sum_card), 0).label('total_sum_card'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.count_payment_online), 0).label('total_count_payment_online'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.sum_online_success), 0).label('total_sum_online_success'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.sum_online_fail), 0).label('total_sum_online_fail'),
        # Источники
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.source_vkapp), 0).label('total_source_vkapp'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.sum_source_vkapp), 0).label('total_sum_source_vkapp'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.source_site), 0).label('total_source_site'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.sum_source_site), 0).label('total_sum_source_site'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.source_ios), 0).label('total_source_ios'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.sum_source_ios), 0).label('total_sum_source_ios'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.source_android), 0).label('total_source_android'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.sum_source_android), 0).label('total_sum_source_android'),
        # Доставка
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.delivery_count), 0).label('total_delivery_count'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.delivery_sum), 0).label('total_delivery_sum'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.delivery_self_count), 0).label('total_delivery_self_count'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.delivery_self_sum), 0).label('total_delivery_self_sum'),
        # Повторные заказы
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.repeat_order_2), 0).label('total_repeat_order_2'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.repeat_order_3), 0).label('total_repeat_order_3'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.repeat_order_4), 0).label('total_repeat_order_4'),
        sa_func.coalesce(sa_func.sum(DlvryDailyStats.repeat_order_5), 0).label('total_repeat_order_5'),
    )

    if project_id:
        query = query.filter(DlvryDailyStats.project_id == project_id)
    if affiliate_id:
        query = query.filter(DlvryDailyStats.affiliate_id == affiliate_id)
    if date_from:
        query = query.filter(DlvryDailyStats.stat_date >= date_from)
    if date_to:
        query = query.filter(DlvryDailyStats.stat_date <= date_to)

    r = query.one()
    total_orders = r.total_orders or 0
    total_revenue = float(r.total_revenue or 0)

    return {
        # Базовые
        'total_orders': total_orders,
        'total_revenue': total_revenue,
        'total_first_orders': r.total_first_orders or 0,
        'avg_check': round(total_revenue / total_orders, 2) if total_orders > 0 else 0,
        'total_unique_clients': r.total_unique_clients or 0,
        # Отмены
        'total_canceled': r.total_canceled or 0,
        'total_canceled_sum': float(r.total_canceled_sum or 0),
        # Финансы
        'total_cost': float(r.total_cost or 0),
        'total_discount': float(r.total_discount or 0),
        'total_first_orders_sum': float(r.total_first_orders_sum or 0),
        'total_first_orders_cost': float(r.total_first_orders_cost or 0),
        # Оплата
        'total_count_payment_cash': r.total_count_payment_cash or 0,
        'total_sum_cash': float(r.total_sum_cash or 0),
        'total_count_payment_card': r.total_count_payment_card or 0,
        'total_sum_card': float(r.total_sum_card or 0),
        'total_count_payment_online': r.total_count_payment_online or 0,
        'total_sum_online_success': float(r.total_sum_online_success or 0),
        'total_sum_online_fail': float(r.total_sum_online_fail or 0),
        # Источники
        'total_source_vkapp': r.total_source_vkapp or 0,
        'total_sum_source_vkapp': float(r.total_sum_source_vkapp or 0),
        'total_source_site': r.total_source_site or 0,
        'total_sum_source_site': float(r.total_sum_source_site or 0),
        'total_source_ios': r.total_source_ios or 0,
        'total_sum_source_ios': float(r.total_sum_source_ios or 0),
        'total_source_android': r.total_source_android or 0,
        'total_sum_source_android': float(r.total_sum_source_android or 0),
        # Доставка
        'total_delivery_count': r.total_delivery_count or 0,
        'total_delivery_sum': float(r.total_delivery_sum or 0),
        'total_delivery_self_count': r.total_delivery_self_count or 0,
        'total_delivery_self_sum': float(r.total_delivery_self_sum or 0),
        # Повторные заказы
        'total_repeat_order_2': r.total_repeat_order_2 or 0,
        'total_repeat_order_3': r.total_repeat_order_3 or 0,
        'total_repeat_order_4': r.total_repeat_order_4 or 0,
        'total_repeat_order_5': r.total_repeat_order_5 or 0,
    }


def get_last_synced_date(
    db: Session,
    affiliate_id: str,
) -> Optional[date]:
    """Получить дату последней синхронизированной записи для affiliate."""
    row = db.query(sa_func.max(DlvryDailyStats.stat_date)).filter(
        DlvryDailyStats.affiliate_id == affiliate_id,
    ).scalar()
    return row


def get_available_months(
    db: Session,
    project_id: Optional[str] = None,
    affiliate_id: Optional[str] = None,
) -> List[Dict[str, int]]:
    """
    Получить список год-месяц, по которым есть хотя бы одна запись.
    Возвращает [{year: 2021, month: 1}, {year: 2021, month: 2}, ...]
    """
    from sqlalchemy import extract

    year_col = extract('year', DlvryDailyStats.stat_date).label('y')
    month_col = extract('month', DlvryDailyStats.stat_date).label('m')

    query = db.query(year_col, month_col)

    if project_id:
        query = query.filter(DlvryDailyStats.project_id == project_id)
    if affiliate_id:
        query = query.filter(DlvryDailyStats.affiliate_id == affiliate_id)

    rows = query.group_by(year_col, month_col).order_by(desc(year_col), desc(month_col)).all()
    return [{'year': int(r.y), 'month': int(r.m)} for r in rows]
