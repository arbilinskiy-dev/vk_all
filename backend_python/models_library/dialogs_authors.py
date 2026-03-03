"""
Нормализованные таблицы диалогов и авторов — Фаза 4 рефакторинга БД.

project_dialogs — заменяет system_list_mailing (пользователи с диалогом/рассылкой)
project_authors — заменяет system_list_authors (авторы постов в сообществе)

Принцип:
- Профиль VK-пользователя хранится в vk_profiles (Фаза 1)
- Здесь только проект-специфичные данные (статус диалога, дата первого сообщения и т.д.)
- Никакого дублирования полей профиля
"""

from sqlalchemy import Column, BigInteger, Integer, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# SQLite поддерживает autoincrement только для INTEGER PRIMARY KEY (не BIGINT).
# with_variant обеспечивает INTEGER для SQLite и BIGINT для PostgreSQL.
_AutoPK = BigInteger().with_variant(Integer, "sqlite")


class ProjectDialog(Base):
    """
    Диалог VK-пользователя с сообществом в рамках проекта.
    
    Заменяет system_list_mailing:
    - Убраны 15 полей профиля (тянутся из vk_profiles через JOIN)
    - Сохранены все проект-специфичные поля (статус, даты, счётчики)
    
    Запрос "пользователи в рассылке проекта X":
        SELECT vp.*, pd.status, pd.last_message_date, pd.can_write
        FROM project_dialogs pd
        JOIN vk_profiles vp ON vp.id = pd.vk_profile_id
        WHERE pd.project_id = 'X' AND pd.status = 'active'
    """
    __tablename__ = "project_dialogs"

    id = Column(_AutoPK, primary_key=True, autoincrement=True)
    
    # Связь с проектом
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Связь с глобальным профилем VK-пользователя
    vk_profile_id = Column(BigInteger, ForeignKey("vk_profiles.id", ondelete="CASCADE"), nullable=False)
    
    # === Проект-специфичные поля (НЕ профиль) ===
    
    # Статус диалога
    status = Column(String, nullable=True, default='active')  # active, blocked, etc
    
    # Можно ли писать пользователю
    can_write = Column(Boolean, nullable=True)
    
    # Даты сообщений
    first_message_date = Column(DateTime(timezone=True), nullable=True)
    last_message_date = Column(DateTime(timezone=True), nullable=True)
    
    # Кто написал первым (VK user_id - может быть отрицательным для сообщества)
    first_message_from_id = Column(BigInteger, nullable=True)
    
    # Пометка «Важное» (звёздочка) — менеджер помечает диалог как важный
    is_important = Column(Boolean, nullable=False, server_default='0')
    
    # Счётчики сообщений
    messages_received = Column(Integer, nullable=False, server_default='0')
    messages_sent = Column(Integer, nullable=False, server_default='0')
    
    # Источник: sync / callback / import
    source = Column(String, nullable=False, server_default='sync')
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)

    # === Relationship для JOIN с vk_profiles ===
    vk_profile = relationship("VkProfile", foreign_keys=[vk_profile_id], lazy="joined")

    # === Proxy properties для совместимости с Pydantic SystemListMailingItem ===
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
    def deactivated(self):
        return self.vk_profile.deactivated if self.vk_profile else None

    @property
    def last_seen(self):
        return self.vk_profile.last_seen if self.vk_profile else None

    @property
    def platform(self):
        return self.vk_profile.platform if self.vk_profile else None

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
        return self.vk_profile.is_closed if self.vk_profile else None

    @property
    def can_access_closed(self):
        """
        Backward compat: в старой schema ListMemberBase фронтенд читает can_access_closed
        для определения «можно ли писать пользователю». В новой архитектуре маппим на can_write.
        """
        return self.can_write

    @property
    def can_write_private_message(self):
        """Backward compat: старое имя поля → can_write."""
        return self.can_write

    @property
    def conversation_status(self):
        """Pydantic SystemListMailingItem читает conversation_status. Маппим на status."""
        return self.status

    __table_args__ = (
        # Один пользователь — один диалог на проект
        Index('uq_project_dialogs_project_profile', 'project_id', 'vk_profile_id', unique=True),
        # Быстрая выборка диалогов проекта
        Index('ix_project_dialogs_project_status', 'project_id', 'status'),
        # Поиск всех диалогов пользователя
        Index('ix_project_dialogs_profile', 'vk_profile_id'),
        # Сортировка по дате последнего сообщения
        Index('ix_project_dialogs_last_msg', 'project_id', 'last_message_date'),
    )


class ProjectAuthor(Base):
    """
    Автор постов в сообществе (проекте).
    
    Заменяет system_list_authors:
    - Убраны 15 полей профиля
    - Сохранены проект-специфичные поля (дата первого обнаружения, источник)
    
    Запрос "авторы постов проекта X":
        SELECT vp.first_name, vp.last_name, pa.first_seen_at
        FROM project_authors pa
        JOIN vk_profiles vp ON vp.id = pa.vk_profile_id
        WHERE pa.project_id = 'X'
    """
    __tablename__ = "project_authors"

    id = Column(_AutoPK, primary_key=True, autoincrement=True)
    
    # Связь с проектом
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Связь с глобальным профилем VK-пользователя
    vk_profile_id = Column(BigInteger, ForeignKey("vk_profiles.id", ondelete="CASCADE"), nullable=False)
    
    # Дата первого обнаружения как автора
    first_seen_at = Column(DateTime(timezone=True), nullable=True)
    
    # Источник: posts_sync / manual
    source = Column(String, nullable=False, default='posts_sync')

    # === Relationship для JOIN с vk_profiles ===
    vk_profile = relationship("VkProfile", foreign_keys=[vk_profile_id], lazy="joined")

    # === Proxy properties для совместимости с Pydantic SystemListAuthor ===
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
    def deactivated(self):
        return self.vk_profile.deactivated if self.vk_profile else None

    @property
    def last_seen(self):
        return self.vk_profile.last_seen if self.vk_profile else None

    @property
    def platform(self):
        return self.vk_profile.platform if self.vk_profile else None

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
        return self.vk_profile.is_closed if self.vk_profile else None

    @property
    def can_access_closed(self):
        return self.vk_profile.can_access_closed if self.vk_profile else None

    @property
    def last_message_date(self):
        """ListMemberBase ожидает это поле. Для авторов — None."""
        return None

    @property
    def event_date(self):
        """Pydantic SystemListAuthor читает event_date. Маппим на first_seen_at."""
        return self.first_seen_at

    __table_args__ = (
        # Один автор — одна запись на проект
        Index('uq_project_authors_project_profile', 'project_id', 'vk_profile_id', unique=True),
        # Поиск авторов по проекту
        Index('ix_project_authors_project', 'project_id'),
    )
