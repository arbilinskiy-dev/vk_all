"""
Миграция для таблиц auth_sessions и auth_logs.
Система серверных сессий + логирование авторизации.
"""

from sqlalchemy import text, Engine, inspect

def migrate(engine: Engine):
    """Создаёт таблицы auth_sessions и auth_logs если их нет."""
    inspector = inspect(engine)
    
    # --- auth_sessions ---
    if not inspector.has_table("auth_sessions"):
        print("🔄 Creating auth_sessions table...")
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE auth_sessions (
                    id TEXT PRIMARY KEY,
                    session_token TEXT NOT NULL UNIQUE,
                    user_id TEXT NOT NULL,
                    user_type TEXT NOT NULL DEFAULT 'system',
                    username TEXT NOT NULL,
                    role TEXT NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    is_active BOOLEAN DEFAULT 1 NOT NULL,
                    terminated_by TEXT
                )
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_auth_sessions_session_token ON auth_sessions (session_token)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_auth_sessions_user_id ON auth_sessions (user_id)"))
            conn.commit()
        print("✅ auth_sessions table created!")
    else:
        print("ℹ️ auth_sessions table already exists, skipping...")

    # --- auth_logs ---
    if not inspector.has_table("auth_logs"):
        print("🔄 Creating auth_logs table...")
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE auth_logs (
                    id TEXT PRIMARY KEY,
                    user_id TEXT,
                    user_type TEXT NOT NULL DEFAULT 'system',
                    username TEXT,
                    event_type TEXT NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_auth_logs_user_id ON auth_logs (user_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_auth_logs_event_type ON auth_logs (event_type)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_auth_logs_user_created ON auth_logs (user_id, created_at)"))
            conn.commit()
        print("✅ auth_logs table created!")
    else:
        print("ℹ️ auth_logs table already exists, skipping...")
