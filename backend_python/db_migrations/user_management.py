"""
Миграция для таблиц user_roles, user_actions и колонки users.role_id.
"""

from sqlalchemy import text, Engine, inspect


def migrate(engine: Engine):
    """Создаёт таблицы user_roles, user_actions и добавляет users.role_id."""
    inspector = inspect(engine)

    # --- user_roles ---
    if not inspector.has_table("user_roles"):
        print("🔄 Creating user_roles table...")
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE user_roles (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    description TEXT,
                    color TEXT,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
            """))
            conn.commit()
        print("✅ user_roles table created!")
    else:
        print("ℹ️ user_roles table already exists, skipping...")

    # --- users.role_id ---
    existing_columns = {col["name"] for col in inspector.get_columns("users")}
    if "role_id" not in existing_columns:
        print("🔄 Adding role_id column to users...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN role_id TEXT REFERENCES user_roles(id) ON DELETE SET NULL"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_role_id ON users (role_id)"))
            conn.commit()
        print("✅ users.role_id column added!")
    else:
        print("ℹ️ users.role_id already exists, skipping...")

    # --- user_actions ---
    if not inspector.has_table("user_actions"):
        print("🔄 Creating user_actions table...")
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE user_actions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    username TEXT NOT NULL,
                    action_type TEXT NOT NULL,
                    action_category TEXT NOT NULL,
                    entity_type TEXT,
                    entity_id TEXT,
                    project_id TEXT,
                    action_metadata TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_actions_id ON user_actions (id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_actions_user_id ON user_actions (user_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_actions_action_type ON user_actions (action_type)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_actions_action_category ON user_actions (action_category)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_actions_project_id ON user_actions (project_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_actions_user_created ON user_actions (user_id, created_at)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_actions_category_created ON user_actions (action_category, created_at)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_user_actions_project_created ON user_actions (project_id, created_at)"))
            conn.commit()
        print("✅ user_actions table created!")
    else:
        print("ℹ️ user_actions table already exists, checking columns...")
        # Переименование колонки metadata → action_metadata (metadata зарезервировано в SQLAlchemy)
        try:
            with engine.connect() as conn:
                cols = [row[1] for row in conn.execute(text("PRAGMA table_info(user_actions)"))]
                if "metadata" in cols and "action_metadata" not in cols:
                    conn.execute(text("ALTER TABLE user_actions RENAME COLUMN metadata TO action_metadata"))
                    conn.commit()
                    print("✅ user_actions: renamed column metadata → action_metadata")
        except Exception as e:
            print(f"⚠️ user_actions column rename skipped: {e}")
