"""
Модели меток (ярлыков) диалогов.

dialog_labels — определения меток в рамках проекта
dialog_label_assignments — привязка меток к диалогам (many-to-many)

Метки привязаны к проекту и диалогу — один пользователь в разных проектах
имеет разные метки.
"""

from sqlalchemy import Column, BigInteger, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from database import Base

# SQLite: autoincrement только для INTEGER PRIMARY KEY
_AutoPK = BigInteger().with_variant(Integer, "sqlite")


class DialogLabel(Base):
    """
    Определение метки диалога в рамках проекта.
    Примеры: «Клиент», «Ответить позже», «Передать в тех. отдел».
    """
    __tablename__ = "dialog_labels"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    color = Column(String, nullable=False, server_default='#6366f1')  # indigo-500 по умолчанию
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class DialogLabelAssignment(Base):
    """
    Привязка метки к конкретному диалогу (проект + VK-пользователь).
    Один диалог может иметь несколько меток.
    """
    __tablename__ = "dialog_label_assignments"

    id = Column(_AutoPK, primary_key=True, autoincrement=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    vk_user_id = Column(BigInteger, nullable=False)
    label_id = Column(String, ForeignKey("dialog_labels.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        # Уникальность: одна метка — один раз на диалог
        Index('ix_dla_unique', 'project_id', 'vk_user_id', 'label_id', unique=True),
        # Быстрый поиск: все метки диалога
        Index('ix_dla_dialog', 'project_id', 'vk_user_id'),
        # Быстрый поиск: все диалоги с меткой
        Index('ix_dla_label', 'label_id'),
    )
