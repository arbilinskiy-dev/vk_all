"""
Модель для кэширования сообщений VK в локальной БД.
Каждая запись — одно сообщение из диалога с пользователем.
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, Float, Index
from database import Base


class CachedMessage(Base):
    """
    Кэшированное сообщение VK.
    Первичный ключ — составной (project_id + vk_message_id), 
    но т.к. SQLAlchemy требует единый PK, используем синтетический.
    """
    __tablename__ = "cached_messages"

    # Синтетический PK: "{project_id}_{vk_message_id}"
    id = Column(String, primary_key=True, index=True)
    
    # ID проекта (наш внутренний)
    project_id = Column(String, nullable=False, index=True)
    
    # VK user_id собеседника
    vk_user_id = Column(Integer, nullable=False, index=True)
    
    # VK message ID
    vk_message_id = Column(Integer, nullable=False)
    
    # ID отправителя (from_id в VK API)
    from_id = Column(Integer, nullable=False)
    
    # peer_id (VK API)
    peer_id = Column(Integer, nullable=True)
    
    # Текст сообщения
    text = Column(Text, nullable=True, default="")
    
    # Unix timestamp отправки (из VK API)
    date = Column(Integer, nullable=False)
    
    # Исходящее ли (out=1 в VK API)
    is_outgoing = Column(Boolean, nullable=False, default=False)
    
    # Прочитано ли (read_state в VK API)
    is_read = Column(Boolean, nullable=True, default=False)
    
    # Вложения — сериализованный JSON (сырые attachments из VK API)
    attachments_json = Column(Text, nullable=True)

    # Клавиатура бота — сериализованный JSON (поле keyboard из VK API)
    keyboard_json = Column(Text, nullable=True)

    # Payload кнопки бота — сериализованный JSON (поле payload из VK API)
    # Присутствует когда пользователь нажал кнопку бота или бот отправил сообщение
    payload_json = Column(Text, nullable=True)

    # Кто отправил сообщение через нашу систему (для исходящих)
    # sent_by_id — ID менеджера из localStorage (например, "mgr_1708123456_abc123")
    # sent_by_name — Имя менеджера (например, "admin" или "Иван Иванов")
    sent_by_id = Column(String, nullable=True)
    sent_by_name = Column(String, nullable=True)

    # Пометка: сообщение есть в нашей базе, но удалено из ВК
    is_deleted_from_vk = Column(Boolean, nullable=False, default=False)

    # Сообщение, на которое это ответ (reply_message из VK API) — JSON
    reply_message_json = Column(Text, nullable=True)

    # Пересланные сообщения (fwd_messages из VK API) — JSON
    fwd_messages_json = Column(Text, nullable=True)

    # conversation_message_id (VK API) — ID сообщения внутри диалога,
    # нужен для кросс-диалоговой пересылки через параметр forward
    conversation_message_id = Column(Integer, nullable=True)

    # Составной индекс для быстрого поиска диалога
    __table_args__ = (
        Index('ix_cached_messages_dialog', 'project_id', 'vk_user_id', 'date'),
    )


class MessageCacheMeta(Base):
    """
    Метаданные кэша сообщений для пары (project, user).
    Хранит время последней синхронизации и общее количество сообщений.
    """
    __tablename__ = "message_cache_meta"

    # PK: "{project_id}_{vk_user_id}"
    id = Column(String, primary_key=True, index=True)
    
    # ID проекта
    project_id = Column(String, nullable=False, index=True)
    
    # VK user_id собеседника
    vk_user_id = Column(Integer, nullable=False)
    
    # Unix timestamp последней синхронизации с VK API
    last_synced_at = Column(Float, nullable=False, default=0)
    
    # Общее количество сообщений в диалоге (из VK API count)
    total_count = Column(Integer, nullable=False, default=0)
    
    # Количество сообщений в нашем кэше
    cached_count = Column(Integer, nullable=False, default=0)
    
    # Количество входящих (от пользователя) в кэше
    incoming_count = Column(Integer, nullable=False, default=0)
    
    # Количество исходящих (от нас) в кэше
    outgoing_count = Column(Integer, nullable=False, default=0)
    
    # Все ли сообщения загружены (для "загрузить все")
    is_fully_loaded = Column(Boolean, nullable=False, default=False)
