"""
Модель для отслеживания прочтения диалогов менеджерами.

Общий статус прочтения — если один менеджер прочитал диалог,
это видно всем остальным менеджерам (как в реальном мессенджере службы поддержки).
"""

from sqlalchemy import Column, String, Integer, Float, Index
from database import Base


class MessageReadStatus(Base):
    """
    Статус прочтения диалога.
    Хранит ID последнего прочитанного сообщения для пары (проект, пользователь).
    Общий для всех менеджеров — если один прочитал, видно всем.
    """
    __tablename__ = "message_read_status"

    # PK: "{project_id}_{vk_user_id}"
    id = Column(String, primary_key=True, index=True)

    # ID проекта
    project_id = Column(String, nullable=False, index=True)

    # VK user_id собеседника
    vk_user_id = Column(Integer, nullable=False)

    # VK message_id последнего прочитанного входящего сообщения
    last_read_message_id = Column(Integer, nullable=False, default=0)

    # Когда прочитано (unix timestamp)
    read_at = Column(Float, nullable=False, default=0)

    # Кто прочитал (manager_id — для аудита)
    read_by = Column(String, nullable=True)

    # Составной индекс для быстрого поиска
    __table_args__ = (
        Index('ix_message_read_status_dialog', 'project_id', 'vk_user_id'),
    )
