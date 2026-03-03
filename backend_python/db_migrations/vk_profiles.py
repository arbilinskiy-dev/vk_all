"""
Миграция для таблицы vk_profiles (Фаза 1 рефакторинга БД).

Шаг 1: Создание таблицы vk_profiles
Шаг 2: Заполнение данными из существующих таблиц (subscribers, mailing, likes, comments, reposts, history, authors)
Шаг 3: Добавление колонки vk_profile_id в существующие таблицы (FK-ссылка)
Шаг 4: Заполнение vk_profile_id в существующих таблицах

Миграция безопасна: старые колонки профиля НЕ удаляются.
Удаление старых колонок — отдельная миграция после проверки работоспособности.
"""

from sqlalchemy import Engine, inspect, text
from models_library.vk_profiles import VkProfile
from .utils import check_and_add_column


# Таблицы-источники, из которых извлекаем уникальных VK-пользователей
# Формат: (table_name, has_can_access_closed)
SOURCE_TABLES = [
    'system_list_subscribers',
    'system_list_mailing',
    'system_list_likes',
    'system_list_comments',
    'system_list_reposts',
    'system_list_history_join',
    'system_list_history_leave',
    'system_list_authors',
]

# Все общие поля профиля, которые есть в каждой таблице-источнике
PROFILE_FIELDS = [
    'vk_user_id', 'first_name', 'last_name', 'sex', 'photo_url',
    'domain', 'bdate', 'city', 'country', 'has_mobile',
    'is_closed', 'can_access_closed', 'deactivated', 'last_seen', 'platform'
]


def migrate(engine: Engine):
    """Миграция для vk_profiles — Фаза 1 рефакторинга БД."""
    inspector = inspect(engine)
    is_sqlite = 'sqlite' in engine.url.drivername
    
    # ── Шаг 1: Создание таблицы ──────────────────────────────────
    if not inspector.has_table("vk_profiles"):
        print("Creating table 'vk_profiles'...")
        VkProfile.__table__.create(engine)
        print("Table 'vk_profiles' created successfully.")
    
    # ── Шаг 2: Заполнение данными из существующих таблиц ─────────
    # Проверяем, пуста ли таблица (первичная миграция)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM vk_profiles"))
        count = result.scalar()
    
    if count == 0:
        print("Populating vk_profiles from existing tables...")
        _populate_vk_profiles(engine, inspector, is_sqlite)
    else:
        print(f"vk_profiles already has {count} records, skipping population.")
    
    # ── Шаг 3: Добавить vk_profile_id в существующие таблицы ─────
    for table in SOURCE_TABLES:
        if inspector.has_table(table):
            check_and_add_column(engine, table, 'vk_profile_id', 'BIGINT')
    
    # ── Шаг 4: Заполнить vk_profile_id ──────────────────────────
    _backfill_profile_ids(engine, inspector, is_sqlite)
    
    print("vk_profiles migration complete.")


def _populate_vk_profiles(engine: Engine, inspector, is_sqlite: bool):
    """
    Извлекает уникальных VK-пользователей из всех таблиц-источников
    и вставляет в vk_profiles.
    
    Стратегия: для каждого vk_user_id берём самую «свежую» запись
    (с наибольшим last_seen), чтобы профиль был максимально актуальным.
    """
    total_inserted = 0
    
    with engine.connect() as conn:
        for table in SOURCE_TABLES:
            if not inspector.has_table(table):
                continue
            
            # Проверяем, какие колонки реально есть в таблице
            columns = {c['name'] for c in inspector.get_columns(table)}
            
            # Формируем список доступных полей профиля
            available_fields = [f for f in PROFILE_FIELDS if f in columns]
            
            if 'vk_user_id' not in available_fields:
                print(f"  Skipping {table}: no vk_user_id column")
                continue
            
            # Формируем SELECT с доступными полями
            select_cols = ', '.join(f's.{f}' for f in available_fields)
            
            # Формируем INSERT-колонки (только доступные поля)
            insert_cols = ', '.join(available_fields)
            
            if is_sqlite:
                # SQLite: BigInteger PK не поддерживает автоинкремент (только INTEGER PRIMARY KEY).
                # Генерируем ID вручную через ROW_NUMBER() + текущий MAX(id).
                sql = f"""
                    INSERT OR IGNORE INTO vk_profiles (id, {insert_cols})
                    SELECT 
                        (SELECT COALESCE(MAX(id), 0) FROM vk_profiles) + ROW_NUMBER() OVER (ORDER BY s.vk_user_id),
                        {select_cols}
                    FROM {table} s
                    WHERE s.vk_user_id IS NOT NULL
                """
            else:
                # PostgreSQL: INSERT ... ON CONFLICT DO UPDATE для обновления более свежими данными
                # Обновляем профиль если last_seen в источнике новее
                update_fields = [f for f in available_fields if f != 'vk_user_id']
                
                if update_fields:
                    update_clause = ', '.join(
                        f'{f} = COALESCE(EXCLUDED.{f}, vk_profiles.{f})'
                        for f in update_fields
                    )
                    # Обновляем только если last_seen в новых данных больше или текущий last_seen NULL
                    where_clause = """
                        WHERE EXCLUDED.last_seen IS NOT NULL 
                        AND (vk_profiles.last_seen IS NULL OR EXCLUDED.last_seen > vk_profiles.last_seen)
                    """
                    conflict_action = f"DO UPDATE SET {update_clause} {where_clause}"
                else:
                    conflict_action = "DO NOTHING"
                
                sql = f"""
                    INSERT INTO vk_profiles ({insert_cols})
                    SELECT {', '.join(f'd.{f}' for f in available_fields)}
                    FROM (
                        SELECT DISTINCT ON (s.vk_user_id) {select_cols}
                        FROM {table} s
                        WHERE s.vk_user_id IS NOT NULL
                        ORDER BY s.vk_user_id, s.last_seen DESC NULLS LAST
                    ) d
                    ON CONFLICT (vk_user_id) {conflict_action}
                """
            
            try:
                result = conn.execute(text(sql))
                rows = result.rowcount if result.rowcount and result.rowcount > 0 else 0
                total_inserted += rows
                print(f"  {table}: {rows} profiles upserted")
            except Exception as e:
                print(f"  Error processing {table}: {e}")
        
        conn.commit()
    
    # Итог
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM vk_profiles"))
        final_count = result.scalar()
    
    print(f"vk_profiles populated: {final_count} unique profiles total.")


def _backfill_profile_ids(engine: Engine, inspector, is_sqlite: bool):
    """
    Заполняет колонку vk_profile_id в существующих таблицах,
    связывая записи с vk_profiles через vk_user_id.
    """
    with engine.connect() as conn:
        for table in SOURCE_TABLES:
            if not inspector.has_table(table):
                continue
            
            columns = {c['name'] for c in inspector.get_columns(table)}
            if 'vk_profile_id' not in columns or 'vk_user_id' not in columns:
                continue
            
            # Проверяем, есть ли незаполненные записи
            check_sql = f"SELECT COUNT(*) FROM {table} WHERE vk_profile_id IS NULL AND vk_user_id IS NOT NULL"
            result = conn.execute(text(check_sql))
            null_count = result.scalar()
            
            if null_count == 0:
                continue
            
            print(f"  Backfilling vk_profile_id in {table} ({null_count} records)...")
            
            if is_sqlite:
                # SQLite не поддерживает UPDATE ... FROM, используем подзапрос
                sql = f"""
                    UPDATE {table}
                    SET vk_profile_id = (
                        SELECT vp.id FROM vk_profiles vp 
                        WHERE vp.vk_user_id = {table}.vk_user_id
                    )
                    WHERE vk_profile_id IS NULL 
                    AND vk_user_id IS NOT NULL
                """
            else:
                # PostgreSQL: UPDATE ... FROM (эффективнее)
                sql = f"""
                    UPDATE {table} t
                    SET vk_profile_id = vp.id
                    FROM vk_profiles vp
                    WHERE vp.vk_user_id = t.vk_user_id
                    AND t.vk_profile_id IS NULL
                """
            
            try:
                result = conn.execute(text(sql))
                rows = result.rowcount if result.rowcount and result.rowcount > 0 else 0
                print(f"  {table}: {rows} records linked to vk_profiles")
            except Exception as e:
                print(f"  Error backfilling {table}: {e}")
        
        conn.commit()
