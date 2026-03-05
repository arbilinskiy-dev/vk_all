"""
Pydantic-схемы для DLVRY интеграции.
Webhook payload, ответы API, фильтры.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Входящий webhook от DLVRY (формат заказа)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class DlvryItemData(BaseModel):
    """Данные товара внутри items[].data"""
    price: Optional[str] = None
    quantity: Optional[Any] = 1
    options: Optional[List[Any]] = None
    code: Optional[str] = None
    name: Optional[str] = None
    cost_price: Optional[str] = None
    weight: Optional[str] = None
    volume: Optional[str] = None
    unit: Optional[dict] = None
    img: Optional[dict] = None
    sku_for: Optional[dict] = None
    parent_section_ids: Optional[List[str]] = None
    full_price: Optional[str] = None
    min_quantity: Optional[str] = None


class DlvryItem(BaseModel):
    """Позиция в заказе"""
    id: Optional[str] = None
    data: Optional[DlvryItemData] = None
    # Альтернативная структура (плоские поля)
    title: Optional[str] = None
    quantity: Optional[Any] = None


class DlvryClient(BaseModel):
    """Данные клиента"""
    id: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[Any] = None
    email: Optional[str] = None
    bday: Optional[str] = None


class DlvryAddress(BaseModel):
    """Адрес доставки"""
    zip: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    street: Optional[str] = None
    house: Optional[str] = None
    block: Optional[str] = None
    entrance: Optional[str] = None
    floor: Optional[str] = None
    apt: Optional[str] = None


class DlvryPayment(BaseModel):
    """Тип оплаты"""
    code: Optional[str] = None
    name: Optional[str] = None


class DlvrySource(BaseModel):
    """Источник заказа"""
    code: Optional[str] = None
    name: Optional[str] = None


class DlvryDelivery(BaseModel):
    """Тип доставки"""
    code: Optional[str] = None
    name: Optional[str] = None


class DlvryPickupPoint(BaseModel):
    """Точка самовывоза"""
    code: Optional[str] = None
    name: Optional[str] = None


class DlvryPromocode(BaseModel):
    """Промокод"""
    code: Optional[str] = None
    data: Optional[Any] = None


class DlvryWebhookPayload(BaseModel):
    """
    Полный JSON заказа, приходящий от DLVRY через webhook.
    Все поля опциональны — DLVRY может менять формат.
    """
    id: Optional[str] = None
    date: Optional[str] = None
    items: Optional[List[DlvryItem]] = None
    owner_id: Optional[str] = None
    affiliate_id: Optional[str] = None
    sum: Optional[Any] = None
    discount: Optional[Any] = None
    discount_descriptions: Optional[Any] = None
    markup: Optional[Any] = None
    total: Optional[Any] = None
    cost: Optional[Any] = None
    payment: Optional[DlvryPayment] = None
    payment_breakast: Optional[str] = None
    payment_bonus: Optional[Any] = None
    source: Optional[DlvrySource] = None
    vk_group_id: Optional[str] = None
    vk_app_id: Optional[str] = None
    vk_platform: Optional[str] = None
    native_app_version: Optional[str] = None
    domain: Optional[str] = None
    client_id: Optional[str] = None
    vk_user_id: Optional[str] = None
    address: Optional[DlvryAddress] = None
    delivery_area: Optional[dict] = None
    delivery: Optional[DlvryDelivery] = None
    delivery_price: Optional[Any] = None
    pickup_point: Optional[DlvryPickupPoint] = None
    persons: Optional[Any] = None
    promocode: Optional[DlvryPromocode] = None
    comment: Optional[str] = None
    preorder: Optional[Any] = None
    delivery_coordinates: Optional[Any] = None
    custom_fields: Optional[Any] = None
    client: Optional[DlvryClient] = None
    affiliate_name: Optional[str] = None

    class Config:
        extra = "allow"  # Принимаем неизвестные поля без ошибки


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Ответы API
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class DlvryWebhookResponse(BaseModel):
    """Ответ на webhook"""
    success: bool
    order_id: Optional[str] = None
    message: str = ""
    is_duplicate: bool = False


class DlvryOrderResponse(BaseModel):
    """Заказ DLVRY для списка (совпадает с фронтенд-типом DlvryOrder)"""
    id: int
    dlvry_order_id: str
    affiliate_id: str
    order_date: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    total: Optional[float] = None
    payment_type: Optional[str] = None
    delivery_type: Optional[str] = None
    source_name: Optional[str] = None
    status: str = "received"
    items_count: Optional[int] = None
    created_at: Optional[str] = None


class DlvryOrdersListResponse(BaseModel):
    """Список заказов с пагинацией"""
    orders: List[DlvryOrderResponse]
    total: int
    skip: int = 0
    limit: int = 50


class DlvryOrderStatsResponse(BaseModel):
    """Агрегированная статистика заказов"""
    total_orders: int = 0
    total_revenue: float = 0
    avg_check: float = 0
    total_items: int = 0
    unique_clients: int = 0
    period_from: Optional[str] = None
    period_to: Optional[str] = None


class DlvryWebhookLogResponse(BaseModel):
    """Лог вебхука"""
    id: int
    remote_ip: Optional[str] = None
    affiliate_id: Optional[str] = None
    dlvry_order_id: Optional[str] = None
    result: str
    error_message: Optional[str] = None
    timestamp: Optional[datetime] = None
