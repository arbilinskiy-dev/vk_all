"""
Миграция: создание таблицы chat_actions.
Лог действий менеджеров в диалогах (вход/выход, метки, важное и т.д.).
"""

from sqlalchemy import Engine, inspect
from models_library.chat_actions import ChatAction


def migrate(engine: Engine):
    """Создаёт таблицу chat_actions если не существует."""
    inspector = inspect(engine)

    if not inspector.has_table("chat_actions"):
        print("  Creating table 'chat_actions'...")
        ChatAction.__table__.create(bind=engine)
        print("  ✓ Table 'chat_actions' created.")
    else:
        print("  Table 'chat_actions' already exists, skipping.")
