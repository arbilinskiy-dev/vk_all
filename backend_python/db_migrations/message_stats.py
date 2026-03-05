"""
Миграция для создания таблиц статистики сообщений.
Таблицы: message_stats_hourly, message_stats_user, message_stats_admin,
         message_stats_hourly_users (нормализованная замена JSON)
"""

import json
import logging
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from models_library.message_stats import (
    MessageStatsHourly, MessageStatsUser, MessageStatsAdmin,
    MessageSubscription, MessageStatsHourlyUsers,
)

logger = logging.getLogger("db_migrations.message_stats")


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

    # Таблица message_stats_hourly_users (нормализованная замена JSON)
    if not inspector.has_table("message_stats_hourly_users"):
        print("🔄 Creating message_stats_hourly_users table...")
        MessageStatsHourlyUsers.__table__.create(engine)
        print("✅ message_stats_hourly_users table created!")
        # Мигрируем существующие JSON данные в нормализованную таблицу
        _migrate_json_to_normalized(engine)
    else:
        print("ℹ️ message_stats_hourly_users table already exists, skipping...")

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
    
    # Колонки, которые должны быть (включая новые integer-счётчики и устаревшие JSON)
    new_columns = {
        "incoming_payload_count": "INTEGER NOT NULL DEFAULT 0",
        "incoming_text_count": "INTEGER NOT NULL DEFAULT 0",
        "outgoing_system_count": "INTEGER NOT NULL DEFAULT 0",
        "outgoing_bot_count": "INTEGER NOT NULL DEFAULT 0",
        "unique_text_users_json": "VARCHAR DEFAULT '[]'",
        "unique_payload_users_json": "VARCHAR DEFAULT '[]'",
        "outgoing_users_json": "VARCHAR DEFAULT '[]'",
        "unique_dialogs_count": "INTEGER NOT NULL DEFAULT 0",
        # Новые integer-счётчики (замена JSON)
        "unique_text_users_count": "INTEGER NOT NULL DEFAULT 0",
        "unique_payload_users_count": "INTEGER NOT NULL DEFAULT 0",
        "outgoing_users_count": "INTEGER NOT NULL DEFAULT 0",
        "incoming_users_count": "INTEGER NOT NULL DEFAULT 0",
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


def _migrate_json_to_normalized(engine: Engine):
    """
    Одноразовая миграция: JSON-массивы из message_stats_hourly → message_stats_hourly_users.
    Также заполняет integer-счётчики.
    Идемпотентна: INSERT ON CONFLICT DO NOTHING.
    """
    print("🔄 Migrating JSON data to message_stats_hourly_users...")
    
    with engine.connect() as conn:
        # Читаем все hourly строки с JSON
        rows = conn.execute(text("""
            SELECT project_id, hour_slot,
                   unique_text_users_json, unique_payload_users_json, outgoing_users_json
            FROM message_stats_hourly
        """)).fetchall()
        
        if not rows:
            print("  ℹ️ No hourly rows to migrate")
            return
        
        print(f"  📊 Processing {len(rows)} hourly rows...")
        
        # Собираем все строки для batch INSERT
        batch = []
        for pid, slot, text_json, payload_json, out_json in rows:
            try:
                text_users = set(json.loads(text_json or "[]"))
            except (json.JSONDecodeError, TypeError):
                text_users = set()
            try:
                payload_users = set(json.loads(payload_json or "[]"))
            except (json.JSONDecodeError, TypeError):
                payload_users = set()
            try:
                out_users = set(json.loads(out_json or "[]"))
            except (json.JSONDecodeError, TypeError):
                out_users = set()
            
            for uid in text_users:
                batch.append({"project_id": pid, "hour_slot": slot, "vk_user_id": int(uid), "user_type": 1})
            for uid in payload_users:
                batch.append({"project_id": pid, "hour_slot": slot, "vk_user_id": int(uid), "user_type": 2})
            for uid in out_users:
                batch.append({"project_id": pid, "hour_slot": slot, "vk_user_id": int(uid), "user_type": 3})
        
        # Batch INSERT ON CONFLICT DO NOTHING (чанками по 5000)
        if batch:
            CHUNK = 5000
            for i in range(0, len(batch), CHUNK):
                chunk = batch[i:i+CHUNK]
                # Используем raw SQL для совместимости
                for row in chunk:
                    conn.execute(text(
                        "INSERT INTO message_stats_hourly_users (project_id, hour_slot, vk_user_id, user_type) "
                        "VALUES (:project_id, :hour_slot, :vk_user_id, :user_type) "
                        "ON CONFLICT DO NOTHING"
                    ), row)
            conn.commit()
            print(f"  ✅ Inserted {len(batch)} user rows into normalized table")
        
        # Обновляем integer-счётчики из нормализованной таблицы (одним запросом)
        conn.execute(text("""
            UPDATE message_stats_hourly h SET
                unique_text_users_count = COALESCE(sub.text_cnt, 0),
                unique_payload_users_count = COALESCE(sub.payload_cnt, 0),
                outgoing_users_count = COALESCE(sub.out_cnt, 0),
                incoming_users_count = COALESCE(sub.inc_cnt, 0)
            FROM (
                SELECT project_id, hour_slot,
                    COUNT(DISTINCT CASE WHEN user_type = 1 THEN vk_user_id END) as text_cnt,
                    COUNT(DISTINCT CASE WHEN user_type = 2 THEN vk_user_id END) as payload_cnt,
                    COUNT(DISTINCT CASE WHEN user_type = 3 THEN vk_user_id END) as out_cnt,
                    COUNT(DISTINCT CASE WHEN user_type IN (1,2) THEN vk_user_id END) as inc_cnt
                FROM message_stats_hourly_users
                GROUP BY project_id, hour_slot
            ) sub
            WHERE h.project_id = sub.project_id AND h.hour_slot = sub.hour_slot
        """))
        conn.commit()
        print("  ✅ Integer count columns updated from normalized data")
