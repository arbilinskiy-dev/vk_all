"""
Миграция: создание таблицы message_templates.
Шаблоны быстрых ответов для сообщений сообщества.
"""

from sqlalchemy import Engine, inspect
from models import MessageTemplate


def migrate(engine: Engine):
    """Создаёт таблицу message_templates если не существует."""
    inspector = inspect(engine)

    if not inspector.has_table("message_templates"):
        print("  Creating table 'message_templates'...")
        MessageTemplate.__table__.create(bind=engine)
        print("  ✓ Table 'message_templates' created.")
    else:
        print("  Table 'message_templates' already exists, skipping.")
