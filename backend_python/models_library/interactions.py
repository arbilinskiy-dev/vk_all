"""
Нормализованная таблица взаимодействий с постами — Фаза 3 рефакторинга БД.

post_interactions — заменяет system_list_likes + system_list_comments + system_list_reposts

Принцип:
- Старые таблицы хранили АГРЕГАТ: одна строка = (проект, пользователь, счётчик, JSON-массив post_ids)
- Новая таблица хранит СОБЫТИЕ: одна строка = (проект, пользователь, пост, тип взаимодействия)
- Профиль пользователя тянется из vk_profiles через JOIN (без дублирования)

Что это даёт:
- Запрос "кто лайкнул пост X?" — простой WHERE, без парсинга JSON
- Запрос "лайкнувшие, но не подписанные" — один JOIN с project_members
- Подсчёт ER (engagement rate) по каждому посту — GROUP BY
"""

from sqlalchemy import Column, BigInteger, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from database import Base


class PostInteraction(Base):
    """
    Одно взаимодействие пользователя с постом.
    
    Заменяет 3 таблицы (likes, comments, reposts):
    - Убраны 15 полей профиля
    - Убран JSON-массив post_ids
    - Каждое взаимодействие = отдельная строка
    
    Примеры запросов:
    
    1. Кто лайкнул пост 123 в проекте X:
        SELECT vp.first_name, vp.last_name
        FROM post_interactions pi
        JOIN vk_profiles vp ON vp.id = pi.vk_profile_id
        WHERE pi.project_id = 'X' AND pi.vk_post_id = 123 AND pi.type = 'like'
    
    2. Лайкнувшие пост 123, но не подписанные на проект:
        SELECT vp.*
        FROM post_interactions pi
        JOIN vk_profiles vp ON vp.id = pi.vk_profile_id
        LEFT JOIN project_members pm 
            ON pm.vk_profile_id = pi.vk_profile_id AND pm.project_id = pi.project_id
        WHERE pi.project_id = 'X' AND pi.vk_post_id = 123 AND pi.type = 'like'
        AND pm.id IS NULL
    
    3. Топ-10 самых активных пользователей проекта:
        SELECT vp.first_name, vp.last_name, COUNT(*) as total
        FROM post_interactions pi
        JOIN vk_profiles vp ON vp.id = pi.vk_profile_id
        WHERE pi.project_id = 'X'
        GROUP BY vp.id, vp.first_name, vp.last_name
        ORDER BY total DESC LIMIT 10
    """
    __tablename__ = "post_interactions"

    # SQLite: INTEGER для autoincrement, PostgreSQL: BIGINT
    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    
    # Связь с проектом
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Связь с глобальным профилем VK-пользователя
    vk_profile_id = Column(BigInteger, ForeignKey("vk_profiles.id", ondelete="CASCADE"), nullable=False)
    
    # VK post ID (числовой, из VK API)
    vk_post_id = Column(BigInteger, nullable=False)
    
    # Тип взаимодействия: 'like', 'comment', 'repost'
    type = Column(String, nullable=False)
    
    # Когда зафиксировано (момент синхронизации или callback)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        # Уникальность: один пользователь — один тип взаимодействия на пост
        Index('uq_post_interactions_unique', 'project_id', 'vk_profile_id', 'vk_post_id', 'type', unique=True),
        # Быстрая выборка "кто взаимодействовал с постом X"
        Index('ix_post_interactions_post', 'project_id', 'vk_post_id', 'type'),
        # Быстрая выборка "все взаимодействия пользователя в проекте"
        Index('ix_post_interactions_user', 'project_id', 'vk_profile_id'),
        # Хронологическая выборка
        Index('ix_post_interactions_date', 'project_id', 'type', 'created_at'),
    )
