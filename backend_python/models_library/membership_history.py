"""
Таблица истории вступлений/выходов пользователей из сообществ.

user_membership_history — хронология КАЖДОГО действия join/leave.
Используется для аналитики поведения (сколько раз вступал/выходил, паттерны).

Отличие от member_events:
- member_events — системный список для UI (вкладки «Вступившие», «Вышедшие»)
- user_membership_history — аналитический append-only лог ВСЕХ действий пользователя

Записывается:
- Через VK Callback (group_join/group_leave) — ВСЕГДА
- Через sync — ТОЛЬКО если последнее действие в истории НЕ совпадает (дедупликация)
"""

from sqlalchemy import Column, BigInteger, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from database import Base


class UserMembershipHistory(Base):
    """
    Хронология вступлений/выходов пользователя из сообщества.
    
    Каждая запись = одно действие (вступил / вышел).
    Append-only: только вставки, без обновлений и удалений.
    
    Пример: пользователь 3 раза вступал и 2 раза выходил →
    5 записей с чередованием action='join'/'leave'.
    """
    __tablename__ = "user_membership_history"

    # SQLite: INTEGER для autoincrement, PostgreSQL: BIGINT
    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    
    # Связь с проектом
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # VK ID пользователя (не FK на vk_profiles — может ещё не существовать)
    vk_user_id = Column(BigInteger, nullable=False)
    
    # Действие: 'join' (вступил) / 'leave' (вышел)
    action = Column(String, nullable=False)
    
    # Когда произошло действие
    action_date = Column(DateTime(timezone=True), nullable=False)
    
    # Откуда узнали: 'callback' (VK Callback API) / 'sync' (синхронизация подписчиков)
    source = Column(String, nullable=False, default='callback')
    
    # Когда запись создана (техническое поле)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        # Основной запрос: все действия пользователя в проекте (хронология)
        Index('ix_umh_project_user_date', 'project_id', 'vk_user_id', 'action_date'),
        # Поиск последнего действия пользователя в проекте (для дедупликации sync)
        Index('ix_umh_project_user', 'project_id', 'vk_user_id'),
        # Быстрая выборка по дате (аналитика за период)
        Index('ix_umh_project_date', 'project_id', 'action_date'),
    )
