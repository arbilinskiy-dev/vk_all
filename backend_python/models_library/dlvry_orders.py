"""
Модели для хранения заказов из DLVRY.
DLVRY шлёт webhook с JSON заказа → мы сохраняем в БД.
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, Index, BigInteger, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class DlvryOrder(Base):
    """
    Заказ из DLVRY. Одна строка = один заказ.
    Дубликаты проверяются по dlvry_order_id + affiliate_id.
    """
    __tablename__ = "dlvry_orders"

    # Внутренний PK (автоинкремент)
    id = Column(Integer, primary_key=True, autoincrement=True)

    # ── Идентификаторы DLVRY ──────────────────────────────────
    # ID заказа в системе DLVRY (уникален в рамках affiliate)
    dlvry_order_id = Column(String, nullable=False, index=True)
    # ID компании DLVRY
    owner_id = Column(String, nullable=True)
    # ID филиала DLVRY
    affiliate_id = Column(String, nullable=False, index=True)
    # ID проекта в нашей системе (привязка affiliate → project)
    project_id = Column(String, nullable=True, index=True)

    # ── VK данные ─────────────────────────────────────────────
    # ID группы VK (числовой)
    vk_group_id = Column(String, nullable=True, index=True)
    # VK user_id клиента
    vk_user_id = Column(String, nullable=True, index=True)
    # Платформа VK (desktop_web, mobile_iphone, etc.)
    vk_platform = Column(String, nullable=True)
    # Домен
    domain = Column(String, nullable=True)

    # ── Источник заказа ───────────────────────────────────────
    # Код источника (vkapp, site, app_ios, app_android)
    source_code = Column(String, nullable=True)
    # Название источника (ВК, Сайт, iOS, Android)
    source_name = Column(String, nullable=True)

    # ── Клиент ────────────────────────────────────────────────
    # ID клиента в DLVRY
    client_id = Column(String, nullable=True)
    # Имя клиента
    client_name = Column(String, nullable=True)
    # Телефон (сырой, как пришёл)
    phone_raw = Column(String, nullable=True)
    # Телефон нормализованный (+7XXXXXXXXXX)
    phone = Column(String, nullable=True, index=True)
    # Email клиента
    client_email = Column(String, nullable=True)
    # Дата рождения клиента
    client_bday = Column(String, nullable=True)

    # ── Оплата ────────────────────────────────────────────────
    # Код оплаты (card, cash, online)
    payment_code = Column(String, nullable=True)
    # Название оплаты (Карта, Наличные, Онлайн)
    payment_name = Column(String, nullable=True)

    # ── Доставка ──────────────────────────────────────────────
    # Тип доставки: код (delivery, self)
    delivery_code = Column(String, nullable=True)
    # Тип доставки: название (Доставка, Самовывоз)
    delivery_name = Column(String, nullable=True)
    # Стоимость доставки
    delivery_price = Column(Float, nullable=True, default=0)
    # Точка самовывоза: код
    pickup_point_code = Column(String, nullable=True)
    # Точка самовывоза: название
    pickup_point_name = Column(String, nullable=True)

    # ── Адрес доставки ────────────────────────────────────────
    address_country = Column(String, nullable=True)
    address_region = Column(String, nullable=True)
    address_city = Column(String, nullable=True, index=True)
    address_district = Column(String, nullable=True)
    address_street = Column(String, nullable=True)
    address_house = Column(String, nullable=True)
    address_block = Column(String, nullable=True)
    address_entrance = Column(String, nullable=True)
    address_floor = Column(String, nullable=True)
    address_apt = Column(String, nullable=True)
    # Полный адрес (собранный)
    address_full = Column(Text, nullable=True)

    # ── Товары / Суммы ────────────────────────────────────────
    # Текстовое описание товаров ("Пицца × 2\nРолл × 1")
    items_text = Column(Text, nullable=True)
    # Количество позиций
    items_count = Column(Integer, nullable=True, default=0)
    # Общее количество единиц товаров
    items_total_qty = Column(Integer, nullable=True, default=0)
    # Сумма заказа (до скидок)
    order_sum = Column(Float, nullable=True, default=0)
    # Скидка
    discount = Column(Float, nullable=True, default=0)
    # Оплата бонусами
    payment_bonus = Column(Float, nullable=True, default=0)
    # Наценка
    markup = Column(Float, nullable=True, default=0)
    # Итоговая сумма
    total = Column(Float, nullable=True, default=0)
    # Себестоимость
    cost = Column(Float, nullable=True, default=0)

    # ── Прочее ────────────────────────────────────────────────
    # Количество персон
    persons = Column(Integer, nullable=True, default=0)
    # Промокод (код)
    promocode = Column(String, nullable=True)
    # Комментарий к заказу
    comment = Column(Text, nullable=True)
    # Предзаказ (true/false)
    is_preorder = Column(Boolean, nullable=False, default=False)

    # ── Дата заказа ───────────────────────────────────────────
    # Дата/время заказа из DLVRY (строка "dd.MM.yyyy HH:mm:ss")
    order_date_str = Column(String, nullable=True)
    # Дата заказа (parsed datetime)
    order_date = Column(DateTime(timezone=True), nullable=True, index=True)
    # Год (для фильтрации/аналитики)
    order_year = Column(Integer, nullable=True)
    # Месяц (1-12)
    order_month = Column(Integer, nullable=True)
    # День недели (пн=1, вс=7)
    order_weekday = Column(Integer, nullable=True)

    # ── Связь с VK-профилем ────────────────────────────────────
    # FK на vk_profiles.id (заполняется при синке, если vk_user_id != '')
    vk_profile_id = Column(BigInteger, ForeignKey("vk_profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    vk_profile = relationship("VkProfile", foreign_keys=[vk_profile_id], lazy="joined")

    # ── Сырой JSON ────────────────────────────────────────────
    # Полный JSON запроса (для дебага и бэкфилла)
    raw_json = Column(Text, nullable=True)

    # ── Метаданные ────────────────────────────────────────────
    # Когда мы получили этот заказ
    received_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    # Статус обработки (received, processed, error)
    status = Column(String, nullable=False, default="received")

    # ── Индексы ───────────────────────────────────────────────
    __table_args__ = (
        # Уникальный индекс для защиты от дублей
        Index('ix_dlvry_orders_unique', 'dlvry_order_id', 'affiliate_id', unique=True),
        # Составной индекс для выборок по дате и филиалу
        Index('ix_dlvry_orders_affiliate_date', 'affiliate_id', 'order_date'),
        # Индекс для поиска по группе VK
        Index('ix_dlvry_orders_vk_group_date', 'vk_group_id', 'order_date'),
        # Составной индекс для выборок по проекту + дата (основной фильтр на фронтенде)
        Index('ix_dlvry_orders_project_date', 'project_id', 'order_date'),
    )


class DlvryOrderItem(Base):
    """
    Позиция (товар) в заказе DLVRY.
    Один заказ → много позиций.
    """
    __tablename__ = "dlvry_order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # FK на заказ (по dlvry_order_id, не по нашему id — для удобства)
    order_id = Column(Integer, nullable=False, index=True)

    # ID позиции в DLVRY
    dlvry_item_id = Column(String, nullable=True)
    # Артикул
    code = Column(String, nullable=True, index=True)
    # Название товара
    name = Column(String, nullable=False)
    # Цена за единицу
    price = Column(Float, nullable=True, default=0)
    # Количество
    quantity = Column(Integer, nullable=False, default=1)
    # Полная цена (до скидки)
    full_price = Column(Float, nullable=True, default=0)
    # Себестоимость
    cost_price = Column(Float, nullable=True, default=0)
    # Вес (граммы)
    weight = Column(String, nullable=True)
    # Объём
    volume = Column(String, nullable=True)
    # Опции / модификаторы (JSON)
    options_json = Column(Text, nullable=True)
    # SKU for (название варианта: "25 см", "Большая")
    sku_title = Column(String, nullable=True)
    # URL картинки
    image_url = Column(String, nullable=True)

    __table_args__ = (
        Index('ix_dlvry_order_items_order', 'order_id'),
    )


class DlvryWebhookLog(Base):
    """
    Лог входящих вебхуков от DLVRY.
    Записывается ВСЁ — и успешные, и ошибки, и дубли.
    """
    __tablename__ = "dlvry_webhook_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # IP отправителя
    remote_ip = Column(String, nullable=True)
    # affiliate_id из тела запроса
    affiliate_id = Column(String, nullable=True, index=True)
    # dlvry_order_id (если есть)
    dlvry_order_id = Column(String, nullable=True)
    # Результат обработки: ok, duplicate, error, rejected
    result = Column(String, nullable=False, default="ok")
    # Сообщение об ошибке
    error_message = Column(Text, nullable=True)
    # Полное тело запроса (JSON)
    payload = Column(Text, nullable=True)
    # Timestamp
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
