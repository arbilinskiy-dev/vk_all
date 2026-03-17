"""
Модель для кэширования групповых чатов (бесед) сообщества VK в локальной БД.
Каждая запись — один групповой чат (peer_id >= 2000000001).
"""

import json
from sqlalchemy import Column, String, Text, Integer, Float, Index
from database import Base


class CommunityGroupChat(Base):
    """
    Кэшированный групповой чат сообщества VK.
    Хранит метаданные чата (название, участники, фото, последнее сообщение).
    """
    __tablename__ = "community_group_chats"

    # Синтетический PK: "{project_id}_{peer_id}"
    id = Column(String, primary_key=True, index=True)

    # ID проекта (наш внутренний)
    project_id = Column(String, nullable=False, index=True)

    # peer_id чата (>= 2000000001)
    peer_id = Column(Integer, nullable=False)

    # Локальный chat_id (peer_id - 2000000000)
    chat_id = Column(Integer, nullable=False)

    # Название чата
    title = Column(String, nullable=False, default="Чат")

    # Количество участников
    members_count = Column(Integer, nullable=False, default=0)

    # URL фото чата
    photo_url = Column(String, nullable=True)

    # Статус: 'in' | 'kicked' | 'left'
    state = Column(String, nullable=True)

    # Количество непрочитанных
    unread_count = Column(Integer, nullable=False, default=0)

    # Последнее сообщение — сериализованный JSON
    last_message_json = Column(Text, nullable=True)

    # Имя отправителя последнего сообщения
    last_message_sender = Column(String, nullable=True)

    # Unix timestamp последней синхронизации с VK API
    last_synced_at = Column(Float, nullable=False, default=0)

    __table_args__ = (
        Index('ix_community_group_chats_project', 'project_id'),
    )

    def to_dict(self) -> dict:
        """Конвертация в словарь для API-ответа."""
        last_message = None
        if self.last_message_json:
            try:
                last_message = json.loads(self.last_message_json)
            except (json.JSONDecodeError, TypeError):
                pass

        return {
            "peer_id": self.peer_id,
            "chat_id": self.chat_id,
            "title": self.title,
            "members_count": self.members_count,
            "photo_url": self.photo_url,
            "state": self.state,
            "unread_count": self.unread_count,
            "last_message": last_message,
            "last_message_sender": self.last_message_sender,
        }
