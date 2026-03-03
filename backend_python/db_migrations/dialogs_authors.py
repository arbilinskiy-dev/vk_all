"""
Миграция для таблиц project_dialogs и project_authors (Фаза 4 рефакторинга БД).

Шаг 1: Создание таблиц project_dialogs и project_authors
Шаг 2: Заполнение project_dialogs из system_list_mailing
Шаг 3: Заполнение project_authors из system_list_authors

Миграция безопасна: старые таблицы НЕ удаляются и НЕ модифицируются.
"""

from sqlalchemy import Engine, inspect, text
from models_library.dialogs_authors import ProjectDialog, ProjectAuthor


def migrate(engine: Engine):
    """Миграция для project_dialogs и project_authors — Фаза 4 рефакторинга БД."""
    inspector = inspect(engine)
    is_sqlite = 'sqlite' in engine.url.drivername
    
    # Проверяем зависимость от Фазы 1
    if not inspector.has_table("vk_profiles"):
        print("WARNING: vk_profiles table not found. Skipping dialogs/authors migration.")
        return
    
    # ── Шаг 1: Создание таблиц ──────────────────────────────────
    if not inspector.has_table("project_dialogs"):
        print("Creating table 'project_dialogs'...")
        ProjectDialog.__table__.create(engine)
        print("Table 'project_dialogs' created successfully.")
    
    if not inspector.has_table("project_authors"):
        print("Creating table 'project_authors'...")
        ProjectAuthor.__table__.create(engine)
        print("Table 'project_authors' created successfully.")
    
    # ── Шаг 1.5: Добавление колонки is_important (если отсутствует) ──
    if inspector.has_table("project_dialogs"):
        columns = [col['name'] for col in inspector.get_columns("project_dialogs")]
        if 'is_important' not in columns:
            print("Adding column 'is_important' to 'project_dialogs'...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE project_dialogs ADD COLUMN is_important BOOLEAN NOT NULL DEFAULT 0"))
                conn.commit()
            print("Column 'is_important' added successfully.")

    # ── Шаг 2: Заполнение project_dialogs ────────────────────────
    _populate_dialogs(engine, inspector, is_sqlite)
    
    # ── Шаг 3: Заполнение project_authors ────────────────────────
    _populate_authors(engine, inspector, is_sqlite)
    
    print("Dialogs/authors migration complete.")


def _populate_dialogs(engine: Engine, inspector, is_sqlite: bool):
    """
    Переливает данные из system_list_mailing в project_dialogs.
    Профиль не копируется — только проект-специфичные поля.
    """
    if not inspector.has_table("system_list_mailing"):
        return
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM project_dialogs"))
        if result.scalar() > 0:
            print("project_dialogs already has data, skipping population.")
            return
        
        result = conn.execute(text("SELECT COUNT(*) FROM system_list_mailing"))
        source_count = result.scalar()
        if source_count == 0:
            print("system_list_mailing is empty, nothing to migrate.")
            return
        
        print(f"Migrating {source_count:,} dialogs to project_dialogs...")
        
        # Проверяем какие колонки есть в источнике
        columns = {c['name'] for c in inspector.get_columns('system_list_mailing')}
        
        # Формируем SELECT с проверкой наличия колонок
        first_msg_date = "m.first_message_date" if 'first_message_date' in columns else "NULL"
        first_msg_from = "m.first_message_from_id" if 'first_message_from_id' in columns else "NULL"
        can_write = "m.can_write_private_message" if 'can_write_private_message' in columns else "NULL"
        conv_status = "m.conversation_status" if 'conversation_status' in columns else "NULL"
        last_msg_date = "m.last_message_date" if 'last_message_date' in columns else "NULL"
        source_col = "COALESCE(m.source, 'sync')" if 'source' in columns else "'sync'"
        added_at_col = "m.added_at" if 'added_at' in columns else "CURRENT_TIMESTAMP"
        
        if is_sqlite:
            sql = f"""
                INSERT OR IGNORE INTO project_dialogs (
                    id, project_id, vk_profile_id, status, can_write,
                    first_message_date, last_message_date, first_message_from_id,
                    source, added_at
                )
                SELECT
                    (SELECT COALESCE(MAX(id), 0) FROM project_dialogs) + ROW_NUMBER() OVER (ORDER BY m.rowid),
                    m.project_id,
                    vp.id,
                    COALESCE({conv_status}, 'active'),
                    {can_write},
                    {first_msg_date},
                    {last_msg_date},
                    {first_msg_from},
                    {source_col},
                    COALESCE({added_at_col}, CURRENT_TIMESTAMP)
                FROM system_list_mailing m
                JOIN vk_profiles vp ON vp.vk_user_id = m.vk_user_id
                WHERE m.project_id IS NOT NULL
                AND m.vk_user_id IS NOT NULL
            """
        else:
            sql = f"""
                INSERT INTO project_dialogs (
                    project_id, vk_profile_id, status, can_write,
                    first_message_date, last_message_date, first_message_from_id,
                    source, added_at
                )
                SELECT
                    m.project_id,
                    vp.id,
                    COALESCE({conv_status}, 'active'),
                    {can_write},
                    {first_msg_date},
                    {last_msg_date},
                    {first_msg_from},
                    {source_col},
                    COALESCE({added_at_col}, NOW())
                FROM system_list_mailing m
                JOIN vk_profiles vp ON vp.vk_user_id = m.vk_user_id
                WHERE m.project_id IS NOT NULL
                AND m.vk_user_id IS NOT NULL
                ON CONFLICT (project_id, vk_profile_id) DO NOTHING
            """
        
        try:
            result = conn.execute(text(sql))
            rows = result.rowcount if result.rowcount and result.rowcount > 0 else 0
            conn.commit()
            print(f"project_dialogs: {rows:,} records migrated.")
        except Exception as e:
            print(f"Error migrating dialogs: {e}")
            conn.rollback()


def _populate_authors(engine: Engine, inspector, is_sqlite: bool):
    """
    Переливает данные из system_list_authors в project_authors.
    """
    if not inspector.has_table("system_list_authors"):
        return
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM project_authors"))
        if result.scalar() > 0:
            print("project_authors already has data, skipping population.")
            return
        
        result = conn.execute(text("SELECT COUNT(*) FROM system_list_authors"))
        source_count = result.scalar()
        if source_count == 0:
            print("system_list_authors is empty, nothing to migrate.")
            return
        
        print(f"Migrating {source_count:,} authors to project_authors...")
        
        columns = {c['name'] for c in inspector.get_columns('system_list_authors')}
        source_col = "COALESCE(a.source, 'posts_sync')" if 'source' in columns else "'posts_sync'"
        event_date = "a.event_date" if 'event_date' in columns else "NULL"
        
        if is_sqlite:
            sql = f"""
                INSERT OR IGNORE INTO project_authors (
                    id, project_id, vk_profile_id, first_seen_at, source
                )
                SELECT
                    (SELECT COALESCE(MAX(id), 0) FROM project_authors) + ROW_NUMBER() OVER (ORDER BY a.rowid),
                    a.project_id,
                    vp.id,
                    {event_date},
                    {source_col}
                FROM system_list_authors a
                JOIN vk_profiles vp ON vp.vk_user_id = a.vk_user_id
                WHERE a.project_id IS NOT NULL
                AND a.vk_user_id IS NOT NULL
            """
        else:
            sql = f"""
                INSERT INTO project_authors (
                    project_id, vk_profile_id, first_seen_at, source
                )
                SELECT
                    a.project_id,
                    vp.id,
                    {event_date},
                    {source_col}
                FROM system_list_authors a
                JOIN vk_profiles vp ON vp.vk_user_id = a.vk_user_id
                WHERE a.project_id IS NOT NULL
                AND a.vk_user_id IS NOT NULL
                ON CONFLICT (project_id, vk_profile_id) DO NOTHING
            """
        
        try:
            result = conn.execute(text(sql))
            rows = result.rowcount if result.rowcount and result.rowcount > 0 else 0
            conn.commit()
            print(f"project_authors: {rows:,} records migrated.")
        except Exception as e:
            print(f"Error migrating authors: {e}")
            conn.rollback()
