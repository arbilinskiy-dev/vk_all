"""
Миграция для таблицы user_membership_history.

Создаёт таблицу для хранения полной хронологии вступлений/выходов
пользователей из сообществ (аналитический append-only лог).
"""

from sqlalchemy import Engine, inspect
from models_library.membership_history import UserMembershipHistory


def migrate(engine: Engine):
    """Миграция для user_membership_history."""
    inspector = inspect(engine)
    
    if not inspector.has_table("user_membership_history"):
        print("Creating table 'user_membership_history'...")
        UserMembershipHistory.__table__.create(engine)
        print("Table 'user_membership_history' created successfully.")
    else:
        print("ℹ️ user_membership_history table already exists, skipping...")
