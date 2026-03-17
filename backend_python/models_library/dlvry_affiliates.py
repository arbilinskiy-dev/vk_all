"""
Модель филиалов DLVRY, привязанных к проектам.
Один проект может иметь несколько филиалов DLVRY (1:N).
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, func
from database import Base


class DlvryProjectAffiliate(Base):
    __tablename__ = "dlvry_project_affiliates"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    affiliate_id = Column(String, nullable=False, unique=True, index=True)
    name = Column(String, nullable=True)  # Человекочитаемое название филиала
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
