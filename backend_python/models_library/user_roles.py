"""
Модели для ролей пользователей.
Упрощённая система:
- UserRole — справочник ролей (SMM-менеджер, Контент-мейкер, Админ и т.д.)
- User.role_id — FK на UserRole (добавляется миграцией)

Роли — это бизнес-роли (должности), НЕ системные права (admin/user).
Системные права по-прежнему в auth_sessions.role.
"""

from sqlalchemy import Column, String, Text, Integer, DateTime
from sqlalchemy.sql import func
from database import Base


class UserRole(Base):
    """
    Бизнес-роль (должность) пользователя.
    
    Примеры:
    - SMM-менеджер
    - Контент-мейкер
    - Руководитель отдела
    - Стажёр
    - Аналитик
    """
    __tablename__ = "user_roles"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)         # "SMM-менеджер"
    description = Column(Text, nullable=True)                  # Описание обязанностей
    color = Column(String, nullable=True)                      # Цвет бейджа (Tailwind: "indigo", "green", etc.)
    sort_order = Column(Integer, default=0, nullable=False)    # Порядок отображения
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
