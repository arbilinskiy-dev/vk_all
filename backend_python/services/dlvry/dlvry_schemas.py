"""
Типы данных для DLVRY API.
Dataclass-схемы статистики и константы.
"""

from dataclasses import dataclass, field
from typing import Optional


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
