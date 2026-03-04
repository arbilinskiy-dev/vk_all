"""
Модель UserAction — лог бизнес-действий пользователей.
Отдельная таблица от auth_logs, предназначена для:
- Мониторинга эффективности сотрудников
- Аудита действий (кто что удалил, опубликовал, изменил)
- Аналитики использования фич
- Построения отчётов продуктивности

НЕ хранит auth-события (login/logout/timeout) — они остаются в auth_logs.
"""

from sqlalchemy import Column, String, DateTime, Text, Integer, Index
from sqlalchemy.sql import func
from database import Base


class UserAction(Base):
    """
    Единичное бизнес-действие пользователя в системе.
    
    Примеры:
    - action_type='publish_post', entity_type='post', entity_id='abc123'
    - action_type='send_message', entity_type='message', project_id='proj1'
    - action_type='delete_post', entity_type='post', entity_id='xyz'
    - action_type='ai_generate', entity_type='ai_text', action_metadata='{"prompt_len": 150}'
    """
    __tablename__ = "user_actions"

    id = Column(String, primary_key=True, index=True)
    
    # Кто выполнил действие
    user_id = Column(String, nullable=False, index=True)
    username = Column(String, nullable=False)
    
    # Что сделал
    # Категории: post_*, message_*, market_*, contest_*, ai_*, settings_*, project_*, bulk_*
    action_type = Column(String, nullable=False, index=True)
    
    # Категория действия (для группировки в отчётах)
    # posts | messages | market | contests | ai | settings | projects | automations | other
    action_category = Column(String, nullable=False, index=True)
    
    # Над чем (опционально)
    entity_type = Column(String, nullable=True)   # post | message | market_item | contest | etc.
    entity_id = Column(String, nullable=True)      # ID сущности
    
    # В каком проекте (опционально)
    project_id = Column(String, nullable=True, index=True)
    
    # Дополнительные данные (JSON)
    # Примеры: {"post_title": "...", "vk_post_id": 123}, {"recipient_count": 5}
    action_metadata = Column(Text, nullable=True)
    
    # Когда
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        Index('ix_user_actions_user_created', 'user_id', 'created_at'),
        Index('ix_user_actions_category_created', 'action_category', 'created_at'),
        Index('ix_user_actions_project_created', 'project_id', 'created_at'),
    )
