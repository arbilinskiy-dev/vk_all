"""
Модели для системы аутентификации: сессии и логи авторизации.

Архитектура спроектирована с заделом на:
- Принудительное завершение сессий (force-logout) при дублирующем логине
- Полный мониторинг действий пользователей (поле details — JSON)
- Поддержку VK-пользователей (user_type)
"""

from sqlalchemy import Column, String, DateTime, Boolean, Text, Index
from sqlalchemy.sql import func
from database import Base


class AuthSession(Base):
    """
    Активная сессия пользователя.
    Один пользователь может иметь несколько одновременных сессий.
    
    Задел на будущее:
    - force_logout: флаг is_active=False + terminated_by='force' при повторном логине
    - Мониторинг: связь с будущей таблицей activity_logs через session_id
    """
    __tablename__ = "auth_sessions"

    id = Column(String, primary_key=True, index=True)
    session_token = Column(String, unique=True, index=True, nullable=False)
    
    # Кто залогинился
    user_id = Column(String, nullable=False, index=True)  # users.id или 'admin'
    user_type = Column(String, default="system", nullable=False)  # 'system' | 'vk' — задел под разные типы
    username = Column(String, nullable=False)  # Имя для отображения в логах
    role = Column(String, nullable=False)  # 'admin' | 'user'
    
    # Метаданные клиента
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    # Временные метки
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    last_activity = Column(DateTime, server_default=func.now(), nullable=False)
    
    # Управление сессией
    is_active = Column(Boolean, default=True, nullable=False)
    # Причина завершения: 'user' (logout), 'timeout', 'force' (вход с другого устройства), 'system' (очистка)
    terminated_by = Column(String, nullable=True)


class AuthLog(Base):
    """
    Лог событий авторизации.
    Хранит историю: входы, выходы, таймауты, неудачные попытки.
    
    Задел на будущее:
    - Мониторинг действий: event_type='action', details={'action': 'create_post', ...}
    - Аналитика: запросы по user_id + created_at для отчётов
    """
    __tablename__ = "auth_logs"

    id = Column(String, primary_key=True, index=True)
    
    # Кто выполнил действие
    user_id = Column(String, nullable=True, index=True)  # null для failed_login (неизвестный пользователь)
    user_type = Column(String, default="system", nullable=False)  # 'system' | 'vk'
    username = Column(String, nullable=True)  # Имя для отображения
    
    # Тип события
    # login_success | login_failed | logout | timeout | force_logout | session_refresh
    # Задел: action (будущий мониторинг действий)
    event_type = Column(String, nullable=False, index=True)
    
    # Метаданные клиента
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    # Дополнительные данные (JSON) — задел под мониторинг
    # Для login_failed: {"attempted_username": "..."}
    # Для timeout: {"session_duration_minutes": 45}
    # Для будущего мониторинга: {"action": "create_post", "project_id": "..."}
    details = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Составной индекс для быстрых запросов по пользователю + времени
    __table_args__ = (
        Index('ix_auth_logs_user_created', 'user_id', 'created_at'),
    )
