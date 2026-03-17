"""
Модель ChatAction — лог действий менеджеров внутри диалога.

Хранит действия: вход/выход из чата, пометка важным/непрочитанным,
прикрепление/открепление меток. Отображается в хронологии чата
наряду с сообщениями (мелким шрифтом).

НЕ дублирует user_actions — та таблица для глобальной аналитики,
эта — для визуализации в конкретном диалоге.
"""

from sqlalchemy import Column, String, BigInteger, Integer, DateTime, Text, Index
from sqlalchemy.sql import func
from database import Base

# SQLite: autoincrement только для INTEGER PRIMARY KEY
_AutoPK = BigInteger().with_variant(Integer, "sqlite")


class ChatAction(Base):
    """
    Действие менеджера в диалоге (отображается в хронологии чата).
    
    action_type:
      - chat_enter    — менеджер зашёл в чат
      - chat_leave    — менеджер вышел из чата
      - mark_important — пометил важным
      - unmark_important — снял важное
      - mark_unread   — пометил непрочитанным
      - label_assign  — прикрепил метку
      - label_unassign — открепил метку
      - forward_to_chat — переслал сообщения в групповой чат
      - message_send  — отправил сообщение (записывается для полноты лога)
    """
    __tablename__ = "chat_actions"

    id = Column(_AutoPK, primary_key=True, autoincrement=True)
    project_id = Column(String, nullable=False, index=True)
    vk_user_id = Column(BigInteger, nullable=False)

    # Кто выполнил
    manager_id = Column(String, nullable=False)
    manager_name = Column(String, nullable=False)

    # Что сделал
    action_type = Column(String, nullable=False)

    # Доп. данные (JSON-строка): название метки, цвет и т.п.
    # NB: имя "metadata" зарезервировано SQLAlchemy Declarative API
    action_metadata = Column(Text, nullable=True)

    # Когда (unix timestamp, как в CachedMessage.date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        # Основной запрос: все действия диалога, отсортированные по времени
        Index('ix_chat_actions_dialog', 'project_id', 'vk_user_id'),
    )
