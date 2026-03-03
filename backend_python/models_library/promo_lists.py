"""
Модели списков промокодов для шаблонов сообщений.
Список привязан к проекту; содержит промокоды с кодом, описанием и статусом выдачи.
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class PromoList(Base):
    """Список промокодов (привязан к проекту)."""
    __tablename__ = "promo_lists"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    # Название списка для UI: "Скидка 100 рублей"
    name = Column(String, nullable=False)
    # Slug для переменных шаблонов: "sale100" → {promo_sale100_code}
    slug = Column(String, nullable=False)
    # Одноразовые промокоды — каждый можно выдать только 1 раз
    is_one_time = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationship к промокодам (каскадное удаление)
    codes = relationship("PromoListCode", back_populates="promo_list", cascade="all, delete-orphan")


class PromoListCode(Base):
    """Один промокод внутри списка."""
    __tablename__ = "promo_list_codes"

    id = Column(String, primary_key=True, index=True)
    promo_list_id = Column(String, ForeignKey("promo_lists.id", ondelete="CASCADE"), index=True, nullable=False)
    # Сам промокод: "217831"
    code = Column(String, nullable=False)
    # Описание: "Даёт скидку 100 рублей на следующий заказ"
    description = Column(Text, nullable=True)
    # Статус: "free" | "issued"
    status = Column(String, default="free", nullable=False, index=True)
    # Данные о выдаче (заполняются при status="issued")
    issued_to_user_id = Column(Integer, nullable=True)
    issued_to_user_name = Column(String, nullable=True)
    issued_at = Column(DateTime, nullable=True)
    issued_in_project_id = Column(String, nullable=True)
    # ID сообщения в кэше — для быстрого перехода к диалогу
    issued_message_id = Column(String, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=func.now())

    # Relationship к списку
    promo_list = relationship("PromoList", back_populates="codes")

