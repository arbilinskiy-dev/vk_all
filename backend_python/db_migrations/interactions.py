"""
Миграция для таблицы post_interactions (Фаза 3 рефакторинга БД).

Шаг 1: Создание таблицы post_interactions
Шаг 2: Развёртка JSON post_ids из system_list_likes → отдельные строки (type='like')
Шаг 3: Развёртка JSON post_ids из system_list_comments → отдельные строки (type='comment')
Шаг 4: Развёртка JSON post_ids из system_list_reposts → отдельные строки (type='repost')

Ключевой момент: старые таблицы хранят АГРЕГАТ (пользователь → JSON [post_id1, post_id2, ...]).
Новая таблица хранит СОБЫТИЕ (пользователь × post_id × type = одна строка).
Поэтому миграция "разворачивает" JSON-массив в отдельные строки.
"""

import json
from sqlalchemy import Engine, inspect, text
from models_library.interactions import PostInteraction


# Размер батча для insert — не перегружаем память
BATCH_SIZE = 5000


def migrate(engine: Engine):
    """Миграция для post_interactions — Фаза 3 рефакторинга БД."""
    inspector = inspect(engine)
    is_sqlite = 'sqlite' in engine.url.drivername
    
    # Проверяем зависимость от Фазы 1
    if not inspector.has_table("vk_profiles"):
        print("WARNING: vk_profiles table not found. Skipping interactions migration.")
        return
    
    # ── Шаг 1: Создание таблицы ──────────────────────────────────
    if not inspector.has_table("post_interactions"):
        print("Creating table 'post_interactions'...")
        PostInteraction.__table__.create(engine)
        print("Table 'post_interactions' created successfully.")
    
    # ── Шаг 2-4: Развёртка данных из старых таблиц ──────────────
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM post_interactions"))
        if result.scalar() > 0:
            print("post_interactions already has data, skipping population.")
            return
    
    # Переливаем из каждой таблицы
    source_tables = [
        ('system_list_likes', 'like'),
        ('system_list_comments', 'comment'),
        ('system_list_reposts', 'repost'),
    ]
    
    total = 0
    for table_name, interaction_type in source_tables:
        if inspector.has_table(table_name):
            total += _unpack_interactions(engine, table_name, interaction_type, is_sqlite)
    
    print(f"post_interactions: {total:,} total interactions migrated.")
    print("Interactions migration complete.")


def _unpack_interactions(engine: Engine, source_table: str, interaction_type: str, is_sqlite: bool) -> int:
    """
    Разворачивает JSON-массив post_ids из агрегированной таблицы
    в отдельные строки post_interactions.
    
    Стратегия:
    1. Читаем (project_id, vk_user_id, post_ids, last_interaction_date) батчами
    2. Парсим JSON post_ids → список чисел
    3. Для каждого post_id создаём строку в post_interactions
    4. vk_profile_id получаем через JOIN с vk_profiles
    """
    total_inserted = 0
    
    with engine.connect() as conn:
        # Считаем записи в источнике
        result = conn.execute(text(f"SELECT COUNT(*) FROM {source_table}"))
        source_count = result.scalar()
        if source_count == 0:
            print(f"  {source_table}: empty, skipping.")
            return 0
        
        print(f"  Unpacking {source_count:,} aggregated records from {source_table} (type='{interaction_type}')...")
        
        # Получаем все записи с post_ids и соответствующим vk_profile_id
        # JOIN с vk_profiles сразу получает нужный FK
        fetch_sql = f"""
            SELECT s.project_id, vp.id as vk_profile_id, s.post_ids, s.last_interaction_date
            FROM {source_table} s
            JOIN vk_profiles vp ON vp.vk_user_id = s.vk_user_id
            WHERE s.project_id IS NOT NULL
            AND s.vk_user_id IS NOT NULL
            AND s.post_ids IS NOT NULL
        """
        
        rows = conn.execute(text(fetch_sql)).fetchall()
        
        # Собираем батч для вставки
        batch = []
        next_id = _get_max_id(conn) + 1
        
        for row in rows:
            project_id = row[0]
            vk_profile_id = row[1]
            post_ids_json = row[2]
            interaction_date = row[3]
            
            # Парсим JSON-массив post_ids
            try:
                post_ids = json.loads(post_ids_json) if post_ids_json else []
            except (json.JSONDecodeError, TypeError):
                continue
            
            if not isinstance(post_ids, list):
                continue
            
            for post_id in post_ids:
                if post_id is None:
                    continue
                    
                batch.append({
                    'id': next_id,
                    'project_id': project_id,
                    'vk_profile_id': vk_profile_id,
                    'vk_post_id': int(post_id),
                    'type': interaction_type,
                })
                next_id += 1
                
                # Вставляем батчами
                if len(batch) >= BATCH_SIZE:
                    inserted = _insert_batch(conn, batch, is_sqlite)
                    total_inserted += inserted
                    batch = []
        
        # Вставляем оставшееся
        if batch:
            inserted = _insert_batch(conn, batch, is_sqlite)
            total_inserted += inserted
        
        conn.commit()
    
    print(f"  {source_table}: {total_inserted:,} interactions unpacked.")
    return total_inserted


def _get_max_id(conn) -> int:
    """Получает текущий максимальный ID в post_interactions."""
    result = conn.execute(text("SELECT COALESCE(MAX(id), 0) FROM post_interactions"))
    return result.scalar()


def _insert_batch(conn, batch: list, is_sqlite: bool) -> int:
    """Вставляет батч взаимодействий, игнорируя дубликаты."""
    if not batch:
        return 0
    
    inserted = 0
    
    for item in batch:
        try:
            if is_sqlite:
                sql = text("""
                    INSERT OR IGNORE INTO post_interactions (id, project_id, vk_profile_id, vk_post_id, type)
                    VALUES (:id, :project_id, :vk_profile_id, :vk_post_id, :type)
                """)
            else:
                sql = text("""
                    INSERT INTO post_interactions (id, project_id, vk_profile_id, vk_post_id, type)
                    VALUES (:id, :project_id, :vk_profile_id, :vk_post_id, :type)
                    ON CONFLICT DO NOTHING
                """)
            
            result = conn.execute(sql, item)
            if result.rowcount and result.rowcount > 0:
                inserted += 1
        except Exception:
            # Пропускаем дубликаты или ошибки отдельных записей
            continue
    
    return inserted
