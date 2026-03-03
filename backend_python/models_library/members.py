"""
Нормализованные таблицы участия в проектах — Фаза 2 рефакторинга БД.

project_members — заменяет system_list_subscribers (подписчики проекта)
member_events   — заменяет system_list_history_join + system_list_history_leave

Принцип:
- Профиль VK-пользователя хранится в vk_profiles (Фаза 1)
- Здесь только связь пользователь ↔ проект и события входа/выхода
- Никакого дублирования полей профиля
"""

from sqlalchemy import Column, BigInteger, Integer, String, DateTime, ForeignKey, Index, SmallInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class ProjectMember(Base):
    """
    Связь VK-пользователя с проектом (подписка на сообщество).
    
    Заменяет system_list_subscribers:
    - Убраны 15 полей профиля (тянутся из vk_profiles через JOIN)
    - Добавлен FK на vk_profiles.id
    - UNIQUE constraint на (project_id, vk_profile_id) — один пользователь в проекте один раз
    
    Запрос "подписчики проекта X":
        SELECT vp.*, pm.subscribed_at, pm.status
        FROM project_members pm
        JOIN vk_profiles vp ON vp.id = pm.vk_profile_id
        WHERE pm.project_id = 'X' AND pm.status = 'subscribed'
    """
    __tablename__ = "project_members"

    # SQLite: INTEGER для autoincrement, PostgreSQL: BIGINT
    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    
    # Связь с проектом
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Связь с глобальным профилем VK-пользователя
    vk_profile_id = Column(BigInteger, ForeignKey("vk_profiles.id", ondelete="CASCADE"), nullable=False)
    
    # Статус подписки
    # subscribed — активный подписчик
    # unsubscribed — отписался (сохраняем запись для истории)
    # banned — заблокирован в сообществе
    status = Column(String, nullable=False, default='subscribed')
    
    # Когда подписался (из VK callback или sync)
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Источник: sync (массовая загрузка), callback (VK Callback API), import (ручной импорт)
    source = Column(String, nullable=False, default='sync')

    # ── Relationship для JOIN-загрузки профиля ─────────────────
    vk_profile = relationship("VkProfile", foreign_keys=[vk_profile_id], lazy="joined")

    # ── Proxy-свойства: обратная совместимость со старым SystemListSubscriber ──
    # Позволяют обращаться к member.first_name, member.vk_user_id и т.д.
    # Pydantic from_attributes=True считывает эти свойства при сериализации.
    
    @property
    def vk_user_id(self):
        return self.vk_profile.vk_user_id if self.vk_profile else None
    
    @property
    def first_name(self):
        return self.vk_profile.first_name if self.vk_profile else None
    
    @property
    def last_name(self):
        return self.vk_profile.last_name if self.vk_profile else None
    
    @property
    def sex(self):
        return self.vk_profile.sex if self.vk_profile else None
    
    @property
    def photo_url(self):
        return self.vk_profile.photo_url if self.vk_profile else None
    
    @property
    def domain(self):
        return self.vk_profile.domain if self.vk_profile else None
    
    @property
    def bdate(self):
        return self.vk_profile.bdate if self.vk_profile else None
    
    @property
    def city(self):
        return self.vk_profile.city if self.vk_profile else None
    
    @property
    def country(self):
        return self.vk_profile.country if self.vk_profile else None
    
    @property
    def has_mobile(self):
        return self.vk_profile.has_mobile if self.vk_profile else None
    
    @property
    def is_closed(self):
        return self.vk_profile.is_closed if self.vk_profile else False
    
    @property
    def can_access_closed(self):
        return self.vk_profile.can_access_closed if self.vk_profile else None
    
    @property
    def deactivated(self):
        return self.vk_profile.deactivated if self.vk_profile else None
    
    @property
    def last_seen(self):
        return self.vk_profile.last_seen if self.vk_profile else None
    
    @property
    def platform(self):
        return self.vk_profile.platform if self.vk_profile else None
    
    @property
    def added_at(self):
        """Обратная совместимость: added_at → subscribed_at."""
        return self.subscribed_at
    
    # last_message_date — поле в базовой Pydantic-схеме ListMemberBase, но для subscribers всегда None
    @property
    def last_message_date(self):
        return None

    __table_args__ = (
        # Один пользователь — одна запись на проект
        Index('uq_project_members_project_profile', 'project_id', 'vk_profile_id', unique=True),
        # Быстрая выборка подписчиков проекта по статусу
        Index('ix_project_members_project_status', 'project_id', 'status'),
        # Поиск всех проектов конкретного пользователя
        Index('ix_project_members_profile', 'vk_profile_id'),
    )


class MemberEvent(Base):
    """
    Событие входа/выхода пользователя из сообщества.
    
    Заменяет system_list_history_join + system_list_history_leave:
    - Две таблицы → одна, с полем event_type
    - Убраны 15 полей профиля
    - Append-only: только вставки, без обновлений
    
    Запрос "история вступлений в проект X за последний месяц":
        SELECT vp.first_name, vp.last_name, me.event_date, me.event_type
        FROM member_events me
        JOIN vk_profiles vp ON vp.id = me.vk_profile_id
        WHERE me.project_id = 'X' AND me.event_type = 'join'
        AND me.event_date >= now() - interval '1 month'
        ORDER BY me.event_date DESC
    """
    __tablename__ = "member_events"

    # SQLite: INTEGER для autoincrement, PostgreSQL: BIGINT
    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    
    # Связь с проектом
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Связь с глобальным профилем VK-пользователя
    vk_profile_id = Column(BigInteger, ForeignKey("vk_profiles.id", ondelete="CASCADE"), nullable=False)
    
    # Тип события: 'join' (вступил) / 'leave' (вышел)
    event_type = Column(String, nullable=False)
    
    # Когда произошло событие
    event_date = Column(DateTime(timezone=True), nullable=False)
    
    # Источник: callback (VK Callback API), sync (синхронизация), manual (ручная запись)
    source = Column(String, nullable=False, default='callback')

    # ── Relationship для JOIN-загрузки профиля ─────────────────
    vk_profile = relationship("VkProfile", foreign_keys=[vk_profile_id], lazy="joined")

    # ── Proxy-свойства: обратная совместимость со старым SystemListHistory ──
    @property
    def vk_user_id(self):
        return self.vk_profile.vk_user_id if self.vk_profile else None
    
    @property
    def first_name(self):
        return self.vk_profile.first_name if self.vk_profile else None
    
    @property
    def last_name(self):
        return self.vk_profile.last_name if self.vk_profile else None
    
    @property
    def sex(self):
        return self.vk_profile.sex if self.vk_profile else None
    
    @property
    def photo_url(self):
        return self.vk_profile.photo_url if self.vk_profile else None
    
    @property
    def domain(self):
        return self.vk_profile.domain if self.vk_profile else None
    
    @property
    def bdate(self):
        return self.vk_profile.bdate if self.vk_profile else None
    
    @property
    def city(self):
        return self.vk_profile.city if self.vk_profile else None
    
    @property
    def country(self):
        return self.vk_profile.country if self.vk_profile else None
    
    @property
    def has_mobile(self):
        return self.vk_profile.has_mobile if self.vk_profile else None
    
    @property
    def is_closed(self):
        return self.vk_profile.is_closed if self.vk_profile else False
    
    @property
    def can_access_closed(self):
        return self.vk_profile.can_access_closed if self.vk_profile else None
    
    @property
    def deactivated(self):
        return self.vk_profile.deactivated if self.vk_profile else None
    
    @property
    def last_seen(self):
        return self.vk_profile.last_seen if self.vk_profile else None
    
    @property
    def platform(self):
        return self.vk_profile.platform if self.vk_profile else None
    
    @property
    def added_at(self):
        """Обратная совместимость: added_at → event_date."""
        return self.event_date
    
    @property
    def last_message_date(self):
        """Поле из базовой Pydantic-схемы ListMemberBase, для history всегда None."""
        return None

    __table_args__ = (
        # Основной индекс для выборки по проекту + тип + дата (сортировка DESC)
        Index('ix_member_events_project_type_date', 'project_id', 'event_type', 'event_date'),
        # Поиск всех событий конкретного пользователя
        Index('ix_member_events_profile', 'vk_profile_id'),
        # Быстрая выборка последних событий проекта
        Index('ix_member_events_project_date', 'project_id', 'event_date'),
    )
