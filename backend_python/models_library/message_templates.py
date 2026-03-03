"""
Модель шаблонов ответов для сообщений сообщества.
Шаблон привязан к проекту и содержит текст (с переменными) + вложения.
"""

from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class MessageTemplate(Base):
    """Шаблон быстрого ответа в сообщениях сообщества."""
    __tablename__ = "message_templates"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    # JSON-массив вложений: [{type, vk_id, preview_url, name}]
    attachments_json = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
