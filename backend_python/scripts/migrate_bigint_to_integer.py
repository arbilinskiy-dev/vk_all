"""
Миграция SQLite: BIGINT → INTEGER для PK-колонок с autoincrement.

Проблема:
  SQLite поддерживает autoincrement ТОЛЬКО для INTEGER PRIMARY KEY (точное слово "INTEGER").
  Колонки BIGINT PRIMARY KEY не получают автоинкремент, что приводит к ошибке:
    NOT NULL constraint failed: project_dialogs.id

Решение:
  Пересоздаём 6 таблиц с INTEGER вместо BIGINT для id-колонки.

Таблицы: vk_profiles, project_dialogs, project_authors, post_interactions,
          project_members, member_events

ВАЖНО: vk_profiles мигрируется ПЕРВОЙ, т.к. на неё ссылаются FK остальных таблиц.
"""
import sqlite3
import sys
import os
import shutil
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'vk_planner.db')
DB_PATH = os.path.abspath(DB_PATH)


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=OFF")  # Отключаем FK на время миграции
    return conn


def migrate_table(conn, table_name, new_ddl, indexes):
    """Мигрируем одну таблицу: rename → create → copy → drop old."""
    old_name = f"{table_name}_old_migration"
    
    # Проверяем существование
    exists = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
        (table_name,)
    ).fetchone()
    if not exists:
        print(f"  ⏭  Таблица {table_name} не существует — пропуск")
        return
    
    # Проверяем текущий DDL — если уже INTEGER, пропускаем
    current_ddl = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
        (table_name,)
    ).fetchone()[0]
    if "id INTEGER NOT NULL" in current_ddl or "id INTEGER PRIMARY KEY" in current_ddl:
        print(f"  ✅ Таблица {table_name} уже имеет INTEGER PK — пропуск")
        return
    
    count_before = conn.execute(f"SELECT COUNT(*) FROM [{table_name}]").fetchone()[0]
    print(f"  📊 Записей: {count_before}")
    
    # 1. Переименовать
    conn.execute(f"ALTER TABLE [{table_name}] RENAME TO [{old_name}]")
    
    # 2. Создать новую таблицу с INTEGER
    conn.execute(new_ddl)
    
    # 3. Скопировать данные
    conn.execute(f"INSERT INTO [{table_name}] SELECT * FROM [{old_name}]")
    
    # 4. Проверить количество
    count_after = conn.execute(f"SELECT COUNT(*) FROM [{table_name}]").fetchone()[0]
    if count_after != count_before:
        raise RuntimeError(
            f"ОШИБКА: {table_name} — было {count_before}, стало {count_after}!"
        )
    
    # 5. Удалить старую
    conn.execute(f"DROP TABLE [{old_name}]")
    
    # 6. Пересоздать индексы
    for idx_sql in indexes:
        conn.execute(idx_sql)
    
    print(f"  ✅ {table_name}: {count_after} записей, {len(indexes)} индексов")


def main():
    if not os.path.exists(DB_PATH):
        print(f"❌ БД не найдена: {DB_PATH}")
        sys.exit(1)
    
    # Бэкап
    backup_path = DB_PATH + f".backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    print(f"📦 Бэкап: {backup_path}")
    shutil.copy2(DB_PATH, backup_path)
    
    conn = get_connection()
    
    # === Определяем миграции ===
    # Порядок: vk_profiles первым (на него ссылаются FK)
    
    migrations = [
        # 1. vk_profiles
        (
            "vk_profiles",
            """CREATE TABLE vk_profiles (
                id INTEGER NOT NULL,
                vk_user_id BIGINT NOT NULL,
                first_name VARCHAR,
                last_name VARCHAR,
                sex SMALLINT,
                photo_url VARCHAR,
                domain VARCHAR,
                bdate VARCHAR,
                city VARCHAR,
                country VARCHAR,
                has_mobile BOOLEAN,
                is_closed BOOLEAN,
                can_access_closed BOOLEAN,
                deactivated VARCHAR,
                last_seen BIGINT,
                platform SMALLINT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            )""",
            [
                "CREATE UNIQUE INDEX ix_vk_profiles_vk_user_id ON vk_profiles (vk_user_id)",
                "CREATE INDEX ix_vk_profiles_name ON vk_profiles (first_name, last_name)",
            ]
        ),
        # 2. project_dialogs
        (
            "project_dialogs",
            """CREATE TABLE project_dialogs (
                id INTEGER NOT NULL,
                project_id VARCHAR NOT NULL,
                vk_profile_id BIGINT NOT NULL,
                status VARCHAR,
                can_write BOOLEAN,
                first_message_date DATETIME,
                last_message_date DATETIME,
                first_message_from_id BIGINT,
                messages_received INTEGER DEFAULT '0' NOT NULL,
                messages_sent INTEGER DEFAULT '0' NOT NULL,
                source VARCHAR DEFAULT 'sync' NOT NULL,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME,
                PRIMARY KEY (id),
                FOREIGN KEY(project_id) REFERENCES projects (id) ON DELETE CASCADE,
                FOREIGN KEY(vk_profile_id) REFERENCES vk_profiles (id) ON DELETE CASCADE
            )""",
            [
                "CREATE INDEX ix_project_dialogs_profile ON project_dialogs (vk_profile_id)",
                "CREATE INDEX ix_project_dialogs_last_msg ON project_dialogs (project_id, last_message_date)",
                "CREATE UNIQUE INDEX uq_project_dialogs_project_profile ON project_dialogs (project_id, vk_profile_id)",
                "CREATE INDEX ix_project_dialogs_project_status ON project_dialogs (project_id, status)",
            ]
        ),
        # 3. project_authors
        (
            "project_authors",
            """CREATE TABLE project_authors (
                id INTEGER NOT NULL,
                project_id VARCHAR NOT NULL,
                vk_profile_id BIGINT NOT NULL,
                first_seen_at DATETIME,
                source VARCHAR NOT NULL,
                PRIMARY KEY (id),
                FOREIGN KEY(project_id) REFERENCES projects (id) ON DELETE CASCADE,
                FOREIGN KEY(vk_profile_id) REFERENCES vk_profiles (id) ON DELETE CASCADE
            )""",
            [
                "CREATE UNIQUE INDEX uq_project_authors_project_profile ON project_authors (project_id, vk_profile_id)",
                "CREATE INDEX ix_project_authors_project ON project_authors (project_id)",
            ]
        ),
        # 4. post_interactions
        (
            "post_interactions",
            """CREATE TABLE post_interactions (
                id INTEGER NOT NULL,
                project_id VARCHAR NOT NULL,
                vk_profile_id BIGINT NOT NULL,
                vk_post_id BIGINT NOT NULL,
                type VARCHAR NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY(project_id) REFERENCES projects (id) ON DELETE CASCADE,
                FOREIGN KEY(vk_profile_id) REFERENCES vk_profiles (id) ON DELETE CASCADE
            )""",
            [
                "CREATE INDEX ix_post_interactions_post ON post_interactions (project_id, vk_post_id, type)",
                "CREATE INDEX ix_post_interactions_user ON post_interactions (project_id, vk_profile_id)",
                "CREATE INDEX ix_post_interactions_date ON post_interactions (project_id, type, created_at)",
                "CREATE UNIQUE INDEX uq_post_interactions_unique ON post_interactions (project_id, vk_profile_id, vk_post_id, type)",
            ]
        ),
        # 5. project_members
        (
            "project_members",
            """CREATE TABLE project_members (
                id INTEGER NOT NULL,
                project_id VARCHAR NOT NULL,
                vk_profile_id BIGINT NOT NULL,
                status VARCHAR NOT NULL,
                subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                source VARCHAR NOT NULL,
                PRIMARY KEY (id),
                FOREIGN KEY(project_id) REFERENCES projects (id) ON DELETE CASCADE,
                FOREIGN KEY(vk_profile_id) REFERENCES vk_profiles (id) ON DELETE CASCADE
            )""",
            [
                "CREATE INDEX ix_project_members_project_status ON project_members (project_id, status)",
                "CREATE INDEX ix_project_members_profile ON project_members (vk_profile_id)",
                "CREATE UNIQUE INDEX uq_project_members_project_profile ON project_members (project_id, vk_profile_id)",
            ]
        ),
        # 6. member_events
        (
            "member_events",
            """CREATE TABLE member_events (
                id INTEGER NOT NULL,
                project_id VARCHAR NOT NULL,
                vk_profile_id BIGINT NOT NULL,
                event_type VARCHAR NOT NULL,
                event_date DATETIME NOT NULL,
                source VARCHAR NOT NULL,
                PRIMARY KEY (id),
                FOREIGN KEY(project_id) REFERENCES projects (id) ON DELETE CASCADE,
                FOREIGN KEY(vk_profile_id) REFERENCES vk_profiles (id) ON DELETE CASCADE
            )""",
            [
                "CREATE INDEX ix_member_events_project_type_date ON member_events (project_id, event_type, event_date)",
                "CREATE INDEX ix_member_events_profile ON member_events (vk_profile_id)",
                "CREATE INDEX ix_member_events_project_date ON member_events (project_id, event_date)",
            ]
        ),
    ]
    
    print(f"\n🔧 Миграция BIGINT → INTEGER для PK-колонок ({len(migrations)} таблиц)\n")
    
    try:
        for table_name, ddl, indexes in migrations:
            print(f"📋 {table_name}:")
            migrate_table(conn, table_name, ddl, indexes)
        
        conn.commit()
        print(f"\n✅ Миграция завершена успешно!")
        
        # Верификация
        print("\n🔍 Верификация DDL:")
        for table_name, _, _ in migrations:
            row = conn.execute(
                "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
                (table_name,)
            ).fetchone()
            if row:
                has_integer = "id INTEGER NOT NULL" in row[0]
                print(f"  {'✅' if has_integer else '❌'} {table_name}: {'INTEGER' if has_integer else 'BIGINT (!)'}")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ ОШИБКА миграции: {e}")
        print(f"🔄 Восстановите из бэкапа: {backup_path}")
        sys.exit(1)
    finally:
        conn.execute("PRAGMA foreign_keys=ON")
        conn.close()
    
    print(f"\n📦 Бэкап сохранён: {backup_path}")


if __name__ == "__main__":
    main()
