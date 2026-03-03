"""
Миграция для создания таблиц статистики сообщений.
Таблицы: message_stats_hourly, message_stats_user, message_stats_admin
"""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from models_library.message_stats import MessageStatsHourly, MessageStatsUser, MessageStatsAdmin, MessageSubscription


def migrate(engine: Engine):
    """Создаёт таблицы статистики сообщений если их нет + добавляет новые колонки."""
    inspector = inspect(engine)

    # Таблица message_stats_hourly
    if not inspector.has_table("message_stats_hourly"):
        print("🔄 Creating message_stats_hourly table...")
        MessageStatsHourly.__table__.create(engine)
        print("✅ message_stats_hourly table created!")
    else:
        print("ℹ️ message_stats_hourly table already exists, checking columns...")
        _add_hourly_columns(engine, inspector)

    # Таблица message_stats_user
    if not inspector.has_table("message_stats_user"):
        print("🔄 Creating message_stats_user table...")
        MessageStatsUser.__table__.create(engine)
        print("✅ message_stats_user table created!")
    else:
        print("ℹ️ message_stats_user table already exists, skipping...")

    # Таблица message_stats_admin
    if not inspector.has_table("message_stats_admin"):
        print("🔄 Creating message_stats_admin table...")
        MessageStatsAdmin.__table__.create(engine)
        print("✅ message_stats_admin table created!")
    else:
        print("ℹ️ message_stats_admin table already exists, skipping...")

    # Таблица message_subscriptions (подписки/отписки)
    if not inspector.has_table("message_subscriptions"):
        print("🔄 Creating message_subscriptions table...")
        MessageSubscription.__table__.create(engine)
        print("✅ message_subscriptions table created!")
    else:
        print("ℹ️ message_subscriptions table already exists, skipping...")


def _add_hourly_columns(engine: Engine, inspector):
    """Добавляет новые колонки в message_stats_hourly если их нет."""
    existing_cols = {col["name"] for col in inspector.get_columns("message_stats_hourly")}
    
    # Новые колонки, которые должны быть
    new_columns = {
        "incoming_payload_count": "INTEGER NOT NULL DEFAULT 0",
        "incoming_text_count": "INTEGER NOT NULL DEFAULT 0",
        "outgoing_system_count": "INTEGER NOT NULL DEFAULT 0",
        "outgoing_bot_count": "INTEGER NOT NULL DEFAULT 0",
        "unique_text_users_json": "VARCHAR DEFAULT '[]'",
        "unique_payload_users_json": "VARCHAR DEFAULT '[]'",
        "outgoing_users_json": "VARCHAR DEFAULT '[]'",
        "unique_dialogs_count": "INTEGER NOT NULL DEFAULT 0",
    }
    
    with engine.connect() as conn:
        for col_name, col_type in new_columns.items():
            if col_name not in existing_cols:
                print(f"  🔄 Adding column {col_name} to message_stats_hourly...")
                conn.execute(text(f"ALTER TABLE message_stats_hourly ADD COLUMN {col_name} {col_type}"))
                print(f"  ✅ Column {col_name} added!")
            else:
                print(f"  ℹ️ Column {col_name} already exists")
        conn.commit()
