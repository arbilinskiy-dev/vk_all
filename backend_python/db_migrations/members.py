"""
Миграция для таблиц project_members и member_events (Фаза 2 рефакторинга БД).

Шаг 1: Создание таблиц project_members и member_events
Шаг 2: Заполнение project_members из system_list_subscribers
Шаг 3: Заполнение member_events из system_list_history_join + system_list_history_leave

Миграция безопасна: старые таблицы НЕ удаляются и НЕ модифицируются.
"""

from sqlalchemy import Engine, inspect, text
from models_library.members import ProjectMember, MemberEvent


def migrate(engine: Engine):
    """Миграция для project_members и member_events — Фаза 2 рефакторинга БД."""
    inspector = inspect(engine)
    is_sqlite = 'sqlite' in engine.url.drivername
    
    # Проверяем, что vk_profiles уже существует (зависимость от Фазы 1)
    if not inspector.has_table("vk_profiles"):
        print("WARNING: vk_profiles table not found. Skipping members migration (run vk_profiles migration first).")
        return
    
    # ── Шаг 1: Создание таблиц ──────────────────────────────────
    if not inspector.has_table("project_members"):
        print("Creating table 'project_members'...")
        ProjectMember.__table__.create(engine)
        print("Table 'project_members' created successfully.")
    
    if not inspector.has_table("member_events"):
        print("Creating table 'member_events'...")
        MemberEvent.__table__.create(engine)
        print("Table 'member_events' created successfully.")
    
    # ── Шаг 2: Заполнение project_members из system_list_subscribers ─
    _populate_project_members(engine, inspector, is_sqlite)
    
    # ── Шаг 3: Заполнение member_events из history_join + history_leave ─
    _populate_member_events(engine, inspector, is_sqlite)
    
    print("Members migration complete.")


def _populate_project_members(engine: Engine, inspector, is_sqlite: bool):
    """
    Переливает данные из system_list_subscribers в project_members.
    Связывает через vk_profiles.id (а не через дублированные поля).
    """
    if not inspector.has_table("system_list_subscribers"):
        return
    
    with engine.connect() as conn:
        # Проверяем, есть ли уже данные
        result = conn.execute(text("SELECT COUNT(*) FROM project_members"))
        if result.scalar() > 0:
            print("project_members already has data, skipping population.")
            return
        
        # Проверяем, есть ли что переливать
        result = conn.execute(text("SELECT COUNT(*) FROM system_list_subscribers"))
        source_count = result.scalar()
        if source_count == 0:
            print("system_list_subscribers is empty, nothing to migrate.")
            return
        
        print(f"Migrating {source_count} subscribers to project_members...")
        
        if is_sqlite:
            # SQLite: BigInteger PK не поддерживает автоинкремент — генерируем ID вручную
            sql = """
                INSERT OR IGNORE INTO project_members (id, project_id, vk_profile_id, status, subscribed_at, source)
                SELECT 
                    (SELECT COALESCE(MAX(id), 0) FROM project_members) + ROW_NUMBER() OVER (ORDER BY s.rowid),
                    s.project_id,
                    vp.id,
                    'subscribed',
                    COALESCE(s.added_at, CURRENT_TIMESTAMP),
                    COALESCE(s.source, 'sync')
                FROM system_list_subscribers s
                JOIN vk_profiles vp ON vp.vk_user_id = s.vk_user_id
                WHERE s.project_id IS NOT NULL 
                AND s.vk_user_id IS NOT NULL
            """
        else:
            # PostgreSQL: ON CONFLICT DO NOTHING
            sql = """
                INSERT INTO project_members (project_id, vk_profile_id, status, subscribed_at, source)
                SELECT 
                    s.project_id,
                    vp.id,
                    'subscribed',
                    COALESCE(s.added_at, NOW()),
                    COALESCE(s.source, 'sync')
                FROM system_list_subscribers s
                JOIN vk_profiles vp ON vp.vk_user_id = s.vk_user_id
                WHERE s.project_id IS NOT NULL 
                AND s.vk_user_id IS NOT NULL
                ON CONFLICT (project_id, vk_profile_id) DO NOTHING
            """
        
        try:
            result = conn.execute(text(sql))
            rows = result.rowcount if result.rowcount and result.rowcount > 0 else 0
            conn.commit()
            print(f"project_members: {rows} records migrated from system_list_subscribers.")
        except Exception as e:
            print(f"Error migrating subscribers: {e}")
            conn.rollback()


def _populate_member_events(engine: Engine, inspector, is_sqlite: bool):
    """
    Переливает данные из system_list_history_join и system_list_history_leave
    в единую таблицу member_events.
    """
    with engine.connect() as conn:
        # Проверяем, есть ли уже данные
        result = conn.execute(text("SELECT COUNT(*) FROM member_events"))
        if result.scalar() > 0:
            print("member_events already has data, skipping population.")
            return
    
    total = 0
    
    # Миграция history_join → member_events (event_type='join')
    if inspector.has_table("system_list_history_join"):
        total += _migrate_history_table(engine, inspector, is_sqlite, 
                                         "system_list_history_join", "join")
    
    # Миграция history_leave → member_events (event_type='leave')
    if inspector.has_table("system_list_history_leave"):
        total += _migrate_history_table(engine, inspector, is_sqlite, 
                                         "system_list_history_leave", "leave")
    
    print(f"member_events: {total} total events migrated.")


def _migrate_history_table(engine: Engine, inspector, is_sqlite: bool, 
                           source_table: str, event_type: str) -> int:
    """
    Переливает записи из одной таблицы истории в member_events.
    """
    with engine.connect() as conn:
        # Проверяем наличие данных
        result = conn.execute(text(f"SELECT COUNT(*) FROM {source_table}"))
        source_count = result.scalar()
        if source_count == 0:
            print(f"  {source_table}: empty, skipping.")
            return 0
        
        print(f"  Migrating {source_count} records from {source_table} (type='{event_type}')...")
        
        # Проверяем наличие колонки source в таблице-источнике
        columns = {c['name'] for c in inspector.get_columns(source_table)}
        source_col = "COALESCE(h.source, 'sync')" if 'source' in columns else "'sync'"
        
        if is_sqlite:
            # SQLite: BigInteger PK не поддерживает автоинкремент — генерируем ID вручную
            sql = f"""
                INSERT OR IGNORE INTO member_events (id, project_id, vk_profile_id, event_type, event_date, source)
                SELECT 
                    (SELECT COALESCE(MAX(id), 0) FROM member_events) + ROW_NUMBER() OVER (ORDER BY h.rowid),
                    h.project_id,
                    vp.id,
                    '{event_type}',
                    h.event_date,
                    {source_col}
                FROM {source_table} h
                JOIN vk_profiles vp ON vp.vk_user_id = h.vk_user_id
                WHERE h.project_id IS NOT NULL 
                AND h.vk_user_id IS NOT NULL
                AND h.event_date IS NOT NULL
            """
        else:
            sql = f"""
                INSERT INTO member_events (project_id, vk_profile_id, event_type, event_date, source)
                SELECT 
                    h.project_id,
                    vp.id,
                    '{event_type}',
                    h.event_date,
                    {source_col}
                FROM {source_table} h
                JOIN vk_profiles vp ON vp.vk_user_id = h.vk_user_id
                WHERE h.project_id IS NOT NULL 
                AND h.vk_user_id IS NOT NULL
                AND h.event_date IS NOT NULL
            """
        
        try:
            result = conn.execute(text(sql))
            rows = result.rowcount if result.rowcount and result.rowcount > 0 else 0
            conn.commit()
            print(f"  {source_table}: {rows} events migrated.")
            return rows
        except Exception as e:
            print(f"  Error migrating {source_table}: {e}")
            conn.rollback()
            return 0
