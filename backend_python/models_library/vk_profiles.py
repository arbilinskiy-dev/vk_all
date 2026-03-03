"""
Глобальная таблица VK-профилей — единый справочник всех VK-пользователей.

Фаза 1 рефакторинга БД: вынос дублирующихся полей профиля из 8 таблиц
(subscribers, mailing, likes, comments, reposts, history_join, history_leave, authors)
в одну нормализованную таблицу.

Принцип:
- Один VK-пользователь = одна запись в vk_profiles (независимо от количества проектов)
- Все таблицы, которым нужен профиль, ссылаются через FK vk_profile_id → vk_profiles.id
- При обновлении профиля из VK API — обновляется в одном месте, актуально везде
"""

from sqlalchemy import Column, BigInteger, Integer, String, SmallInteger, Boolean, DateTime, Index
from sqlalchemy.sql import func
from database import Base


class VkProfile(Base):
    """
    Глобальный профиль VK-пользователя.
    
    Хранит только данные профиля из VK API (users.get).
    Не хранит проект-специфичные данные (подписка, рассылка, активность).
    
    Объём: ~700к записей при 100 проектах с пересечением подписчиков.
    """
    __tablename__ = "vk_profiles"

    # Внутренний автоинкрементный PK для эффективных FK-связей
    # SQLite: INTEGER для autoincrement, PostgreSQL: BIGINT
    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    
    # VK ID пользователя — уникальный, основной бизнес-ключ
    vk_user_id = Column(BigInteger, nullable=False, unique=True, index=True)
    
    # === Основные поля профиля (из VK API users.get) ===
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    sex = Column(SmallInteger, nullable=True)          # 0 — не указан, 1 — женский, 2 — мужской
    photo_url = Column(String, nullable=True)           # photo_100 или photo_200
    domain = Column(String, nullable=True)              # screen_name (короткий адрес)
    
    # === Дополнительные поля профиля ===
    bdate = Column(String, nullable=True)               # Дата рождения ("1.1.1990" или "1.1")
    city = Column(String, nullable=True)                # Название города
    country = Column(String, nullable=True)             # Название страны
    has_mobile = Column(Boolean, nullable=True)         # Есть ли мобильный телефон
    
    # === Статус аккаунта ===
    is_closed = Column(Boolean, default=False)          # Закрытый профиль
    can_access_closed = Column(Boolean, nullable=True)  # Можно ли видеть закрытый профиль
    deactivated = Column(String, nullable=True)         # 'deleted' / 'banned' / null
    
    # === Онлайн-статус ===
    last_seen = Column(BigInteger, nullable=True)       # Unix timestamp последнего визита
    platform = Column(SmallInteger, nullable=True)      # 1-7: тип устройства
    
    # === Служебные поля ===
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Индекс для быстрого поиска по имени (опционально, для будущего поиска)
    __table_args__ = (
        Index('ix_vk_profiles_name', 'first_name', 'last_name'),
    )
