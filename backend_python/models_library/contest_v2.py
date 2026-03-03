"""
Модели SQLAlchemy для Конкурс 2.0
Отдельная таблица для новой версии конкурсов
"""

from sqlalchemy import Column, String, Integer, Text, Boolean, ForeignKey, DateTime, BigInteger
from sqlalchemy.sql import func
from database import Base


class ContestV2(Base):
    """
    Основная модель конкурса версии 2.0
    Этап 1: Основные параметры + Стартовый пост
    """
    __tablename__ = "contests_v2"
    
    id = Column(String, primary_key=True, index=True)  # UUID
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    
    # === Основные параметры ===
    is_active = Column(Boolean, default=True)  # Активность механики
    title = Column(String, nullable=False, default="Новый конкурс")  # Название (внутреннее)
    description = Column(Text, nullable=True)  # Описание (опционально)
    
    # === Конкурсный пост (старт) ===
    start_type = Column(String, default="new_post")  # 'new_post' | 'existing_post'
    existing_post_link = Column(String, nullable=True)  # Ссылка на существующий пост
    
    # Данные нового поста (если start_type='new_post')
    start_post_date = Column(String, nullable=True)  # Дата публикации (YYYY-MM-DD)
    start_post_time = Column(String, nullable=True)  # Время публикации (HH:mm)
    start_post_text = Column(Text, nullable=True)  # Текст поста
    start_post_images = Column(Text, nullable=True)  # JSON массив изображений
    
    # === Служебные поля ===
    status = Column(String, default="draft")  # draft, scheduled, active, finished, archived
    vk_start_post_id = Column(BigInteger, nullable=True)  # ID опубликованного поста в VK
    
    # === Timestamps ===
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
