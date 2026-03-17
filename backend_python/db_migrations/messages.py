"""
Миграция для создания таблиц кэша сообщений.
Таблицы: cached_messages, message_cache_meta, message_read_status
"""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from models_library.messages import CachedMessage, MessageCacheMeta
from models_library.message_read_status import MessageReadStatus


def migrate(engine: Engine):
    """Создаёт таблицы кэша сообщений если их нет."""
    inspector = inspect(engine)
    
    # Таблица cached_messages
    if not inspector.has_table("cached_messages"):
        print("🔄 Creating cached_messages table...")
        CachedMessage.__table__.create(engine)
        print("✅ cached_messages table created!")
    else:
        print("ℹ️ cached_messages table already exists, skipping...")
        # Миграция: добавляем колонку keyboard_json если её нет
        columns = [col["name"] for col in inspector.get_columns("cached_messages")]
        if "keyboard_json" not in columns:
            print("🔄 Adding keyboard_json column to cached_messages...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE cached_messages ADD COLUMN keyboard_json TEXT"))
                conn.commit()
            print("✅ keyboard_json column added!")
        # Миграция: добавляем колонки sent_by_id/sent_by_name если их нет
        if "sent_by_id" not in columns:
            print("🔄 Adding sent_by_id/sent_by_name columns to cached_messages...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE cached_messages ADD COLUMN sent_by_id TEXT"))
                conn.execute(text("ALTER TABLE cached_messages ADD COLUMN sent_by_name TEXT"))
                conn.commit()
            print("✅ sent_by_id/sent_by_name columns added!")
        # Миграция: добавляем колонку payload_json для хранения payload кнопок бота
        if "payload_json" not in columns:
            print("🔄 Adding payload_json column to cached_messages...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE cached_messages ADD COLUMN payload_json TEXT"))
                conn.commit()
            print("✅ payload_json column added!")
        # Миграция: добавляем колонку is_deleted_from_vk — пометка удалённых из ВК сообщений
        if "is_deleted_from_vk" not in columns:
            print("🔄 Adding is_deleted_from_vk column to cached_messages...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE cached_messages ADD COLUMN is_deleted_from_vk BOOLEAN NOT NULL DEFAULT 0"))
                conn.commit()
            print("✅ is_deleted_from_vk column added!")
        # Миграция: добавляем reply_message_json для хранения цитируемого сообщения
        if "reply_message_json" not in columns:
            print("🔄 Adding reply_message_json column to cached_messages...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE cached_messages ADD COLUMN reply_message_json TEXT"))
                conn.commit()
            print("✅ reply_message_json column added!")
        # Миграция: добавляем conversation_message_id для кросс-диалоговой пересылки
        if "conversation_message_id" not in columns:
            print("🔄 Adding conversation_message_id column to cached_messages...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE cached_messages ADD COLUMN conversation_message_id INTEGER"))
                conn.commit()
            print("✅ conversation_message_id column added!")
        # Миграция: добавляем fwd_messages_json для хранения пересланных сообщений
        if "fwd_messages_json" not in columns:
            print("🔄 Adding fwd_messages_json column to cached_messages...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE cached_messages ADD COLUMN fwd_messages_json TEXT"))
                conn.commit()
            print("✅ fwd_messages_json column added!")
        # Миграция: добавляем колонку is_outgoing если её нет (старые БД до появления фильтров)
        if "is_outgoing" not in columns:
            print("🔄 Adding is_outgoing column to cached_messages...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE cached_messages ADD COLUMN is_outgoing BOOLEAN NOT NULL DEFAULT 0"))
                conn.commit()
            print("✅ is_outgoing column added!")
        # Миграция: backfill NULL значений is_outgoing на основе from_id (safety net)
        # from_id < 0 = сообщество (исходящее), from_id > 0 = пользователь (входящее)
        if "is_outgoing" in columns or "is_outgoing" not in columns:
            # Всегда пытаемся починить NULL значения — это безопасная операция
            with engine.connect() as conn:
                result = conn.execute(text(
                    "UPDATE cached_messages SET is_outgoing = (from_id < 0) "
                    "WHERE is_outgoing IS NULL"
                ))
                if result.rowcount > 0:
                    print(f"🔄 Backfilled {result.rowcount} NULL is_outgoing values based on from_id")
                conn.commit()

    # Таблица message_cache_meta
    if not inspector.has_table("message_cache_meta"):
        print("🔄 Creating message_cache_meta table...")
        MessageCacheMeta.__table__.create(engine)
        print("✅ message_cache_meta table created!")
    else:
        print("ℹ️ message_cache_meta table already exists, skipping...")
        # Миграция: добавляем колонки incoming_count/outgoing_count если их нет
        meta_columns = [col["name"] for col in inspector.get_columns("message_cache_meta")]
        if "incoming_count" not in meta_columns:
            print("🔄 Adding incoming_count/outgoing_count columns to message_cache_meta...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE message_cache_meta ADD COLUMN incoming_count INTEGER NOT NULL DEFAULT 0"))
                conn.execute(text("ALTER TABLE message_cache_meta ADD COLUMN outgoing_count INTEGER NOT NULL DEFAULT 0"))
                conn.commit()
            print("✅ incoming_count/outgoing_count columns added!")

    # Таблица message_read_status (трекинг прочтения диалогов)
    if not inspector.has_table("message_read_status"):
        print("🔄 Creating message_read_status table...")
        MessageReadStatus.__table__.create(engine)
        print("✅ message_read_status table created!")
    else:
        print("ℹ️ message_read_status table already exists, skipping...")
