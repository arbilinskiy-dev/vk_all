"""
Миграция для таблицы dlvry_project_affiliates.
Хранит связь проект → филиалы DLVRY (1:N).

При первом запуске:
1. Создаёт таблицу dlvry_project_affiliates
2. Мигрирует существующие данные из projects.dlvry_affiliate_id в новую таблицу
   (старое поле НЕ удаляется для обратной совместимости)
"""

import uuid
from sqlalchemy import Engine, inspect, text


def migrate(engine: Engine):
    """Создание таблицы dlvry_project_affiliates + миграция данных из projects.dlvry_affiliate_id."""
    inspector = inspect(engine)
    is_postgres = 'postgresql' in str(engine.url)

    if not inspector.has_table('dlvry_project_affiliates'):
        print("[DLVRY] Создаём таблицу dlvry_project_affiliates...")
        with engine.begin() as conn:
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE dlvry_project_affiliates (
                        id VARCHAR PRIMARY KEY,
                        project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                        affiliate_id VARCHAR NOT NULL UNIQUE,
                        name VARCHAR,
                        is_active BOOLEAN NOT NULL DEFAULT TRUE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                """))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_proj_aff_project_id ON dlvry_project_affiliates (project_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_proj_aff_affiliate_id ON dlvry_project_affiliates (affiliate_id)'))
            else:
                conn.execute(text("""
                    CREATE TABLE dlvry_project_affiliates (
                        id VARCHAR PRIMARY KEY,
                        project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                        affiliate_id VARCHAR NOT NULL UNIQUE,
                        name VARCHAR,
                        is_active BOOLEAN NOT NULL DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_proj_aff_project_id ON dlvry_project_affiliates (project_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_proj_aff_affiliate_id ON dlvry_project_affiliates (affiliate_id)'))

        print("[DLVRY] Таблица dlvry_project_affiliates создана.")
    else:
        print("[DLVRY] Таблица dlvry_project_affiliates уже существует.")

    # Миграция данных — ВСЕГДА (проверка дубликатов внутри _migrate_existing_affiliates)
    _migrate_existing_affiliates(engine)


def _migrate_existing_affiliates(engine: Engine):
    """
    Переносит существующие dlvry_affiliate_id из таблицы projects в dlvry_project_affiliates.
    Старое поле projects.dlvry_affiliate_id НЕ удаляется (backward compat).
    """
    with engine.begin() as conn:
        rows = conn.execute(text("""
            SELECT id, dlvry_affiliate_id FROM projects
            WHERE dlvry_affiliate_id IS NOT NULL AND dlvry_affiliate_id != ''
        """)).fetchall()

        if not rows:
            print("[DLVRY] Нет проектов с dlvry_affiliate_id для миграции.")
            return

        migrated = 0
        for row in rows:
            project_id = row[0]
            affiliate_id = row[1]

            # Проверяем, не был ли уже мигрирован
            existing = conn.execute(text(
                "SELECT id FROM dlvry_project_affiliates WHERE affiliate_id = :aff_id"
            ), {"aff_id": affiliate_id}).fetchone()

            if existing:
                continue

            new_id = str(uuid.uuid4())
            conn.execute(text("""
                INSERT INTO dlvry_project_affiliates (id, project_id, affiliate_id, name, is_active)
                VALUES (:id, :project_id, :affiliate_id, :name, :is_active)
            """), {
                "id": new_id,
                "project_id": project_id,
                "affiliate_id": affiliate_id,
                "name": None,  # Имя можно задать позже через UI
                "is_active": True,
            })
            migrated += 1

        print(f"[DLVRY] Мигрировано {migrated} филиалов из projects.dlvry_affiliate_id.")
