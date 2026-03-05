"""
Модель для хранения агрегированной дневной статистики DLVRY.
Данные получаются через DLVRY REST API (pull) и записываются в БД.

Таблица: dlvry_daily_stats — одна строка = один день для одного affiliate_id.
"""

from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Index
from sqlalchemy.sql import func
from database import Base


class DlvryDailyStats(Base):
    """
    Агрегированная статистика заказов DLVRY за один день.
    Заполняется через DLVRY API (GET /api/v1/affiliates/{id}/statistics).
    Уникальность: affiliate_id + stat_date.
    """
    __tablename__ = "dlvry_daily_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # ── Привязка ──────────────────────────────────────────────
    # ID филиала DLVRY
    affiliate_id = Column(String, nullable=False, index=True)
    # ID проекта в нашей системе (для быстрой выборки)
    project_id = Column(String, nullable=True, index=True)

    # ── Дата ──────────────────────────────────────────────────
    # Дата статистики (один день)
    stat_date = Column(Date, nullable=False, index=True)

    # ── Метрики (базовые) ───────────────────────────────────────
    orders_count = Column(Integer, nullable=False, default=0)
    revenue = Column(Float, nullable=False, default=0)
    first_orders = Column(Integer, nullable=False, default=0)
    avg_check = Column(Float, nullable=False, default=0)

    # ── Отмены ────────────────────────────────────────────────
    canceled = Column(Integer, nullable=False, default=0)
    canceled_sum = Column(Float, nullable=False, default=0)

    # ── Финансы ───────────────────────────────────────────────
    cost = Column(Float, nullable=False, default=0)
    discount = Column(Float, nullable=False, default=0)
    first_orders_sum = Column(Float, nullable=False, default=0)
    first_orders_cost = Column(Float, nullable=False, default=0)

    # ── Клиенты ───────────────────────────────────────────────
    unique_clients = Column(Integer, nullable=False, default=0)

    # ── Оплата (разбивка) ─────────────────────────────────────
    sum_cash = Column(Float, nullable=False, default=0)
    count_payment_cash = Column(Integer, nullable=False, default=0)
    sum_card = Column(Float, nullable=False, default=0)
    count_payment_card = Column(Integer, nullable=False, default=0)
    count_payment_online = Column(Integer, nullable=False, default=0)
    sum_online_success = Column(Float, nullable=False, default=0)
    sum_online_fail = Column(Float, nullable=False, default=0)

    # ── Источники ─────────────────────────────────────────────
    source_site = Column(Integer, nullable=False, default=0)
    sum_source_site = Column(Float, nullable=False, default=0)
    source_vkapp = Column(Integer, nullable=False, default=0)
    sum_source_vkapp = Column(Float, nullable=False, default=0)
    source_ios = Column(Integer, nullable=False, default=0)
    sum_source_ios = Column(Float, nullable=False, default=0)
    source_android = Column(Integer, nullable=False, default=0)
    sum_source_android = Column(Float, nullable=False, default=0)

    # ── Доставка ──────────────────────────────────────────────
    delivery_self_count = Column(Integer, nullable=False, default=0)
    delivery_self_sum = Column(Float, nullable=False, default=0)
    delivery_count = Column(Integer, nullable=False, default=0)
    delivery_sum = Column(Float, nullable=False, default=0)

    # ── Повторные заказы ──────────────────────────────────────
    repeat_order_2 = Column(Integer, nullable=False, default=0)
    repeat_order_3 = Column(Integer, nullable=False, default=0)
    repeat_order_4 = Column(Integer, nullable=False, default=0)
    repeat_order_5 = Column(Integer, nullable=False, default=0)

    # ── Метаданные ────────────────────────────────────────────
    # Когда запись была создана/обновлена
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # ── Индексы ───────────────────────────────────────────────
    __table_args__ = (
        # Уникальный индекс: один affiliate + одна дата = одна запись
        Index('ix_dlvry_daily_stats_unique', 'affiliate_id', 'stat_date', unique=True),
        # Составной индекс для выборок по проекту + диапазон дат
        Index('ix_dlvry_daily_stats_project_date', 'project_id', 'stat_date'),
    )
