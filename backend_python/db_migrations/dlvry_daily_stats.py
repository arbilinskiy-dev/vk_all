"""
Миграция для таблицы dlvry_daily_stats.
Хранит агрегированную дневную статистику заказов, полученную через DLVRY API.
"""

from sqlalchemy import Engine, inspect, text

# Новые колонки, добавленные в v1.0.52 (расширенная статистика DLVRY)
_NEW_COLUMNS = [
    # (имя, тип_pg, тип_sqlite, дефолт)
    ('canceled', 'INTEGER', 'INTEGER', '0'),
    ('canceled_sum', 'FLOAT', 'REAL', '0'),
    ('cost', 'FLOAT', 'REAL', '0'),
    ('discount', 'FLOAT', 'REAL', '0'),
    ('first_orders_sum', 'FLOAT', 'REAL', '0'),
    ('first_orders_cost', 'FLOAT', 'REAL', '0'),
    ('unique_clients', 'INTEGER', 'INTEGER', '0'),
    ('sum_cash', 'FLOAT', 'REAL', '0'),
    ('count_payment_cash', 'INTEGER', 'INTEGER', '0'),
    ('sum_card', 'FLOAT', 'REAL', '0'),
    ('count_payment_card', 'INTEGER', 'INTEGER', '0'),
    ('count_payment_online', 'INTEGER', 'INTEGER', '0'),
    ('sum_online_success', 'FLOAT', 'REAL', '0'),
    ('sum_online_fail', 'FLOAT', 'REAL', '0'),
    ('source_site', 'INTEGER', 'INTEGER', '0'),
    ('sum_source_site', 'FLOAT', 'REAL', '0'),
    ('source_vkapp', 'INTEGER', 'INTEGER', '0'),
    ('sum_source_vkapp', 'FLOAT', 'REAL', '0'),
    ('source_ios', 'INTEGER', 'INTEGER', '0'),
    ('sum_source_ios', 'FLOAT', 'REAL', '0'),
    ('source_android', 'INTEGER', 'INTEGER', '0'),
    ('sum_source_android', 'FLOAT', 'REAL', '0'),
    ('delivery_self_count', 'INTEGER', 'INTEGER', '0'),
    ('delivery_self_sum', 'FLOAT', 'REAL', '0'),
    ('delivery_count', 'INTEGER', 'INTEGER', '0'),
    ('delivery_sum', 'FLOAT', 'REAL', '0'),
    ('repeat_order_2', 'INTEGER', 'INTEGER', '0'),
    ('repeat_order_3', 'INTEGER', 'INTEGER', '0'),
    ('repeat_order_4', 'INTEGER', 'INTEGER', '0'),
    ('repeat_order_5', 'INTEGER', 'INTEGER', '0'),
]


def migrate(engine: Engine):
    """Создание таблицы dlvry_daily_stats + добавление новых колонок."""
    inspector = inspect(engine)
    is_postgres = 'postgresql' in str(engine.url)

    if not inspector.has_table('dlvry_daily_stats'):
        print("[DLVRY] Создаём таблицу dlvry_daily_stats...")
        with engine.begin() as conn:
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE dlvry_daily_stats (
                        id SERIAL PRIMARY KEY,
                        affiliate_id VARCHAR NOT NULL,
                        project_id VARCHAR,
                        stat_date DATE NOT NULL,
                        orders_count INTEGER NOT NULL DEFAULT 0,
                        revenue FLOAT NOT NULL DEFAULT 0,
                        first_orders INTEGER NOT NULL DEFAULT 0,
                        avg_check FLOAT NOT NULL DEFAULT 0,
                        canceled INTEGER NOT NULL DEFAULT 0,
                        canceled_sum FLOAT NOT NULL DEFAULT 0,
                        cost FLOAT NOT NULL DEFAULT 0,
                        discount FLOAT NOT NULL DEFAULT 0,
                        first_orders_sum FLOAT NOT NULL DEFAULT 0,
                        first_orders_cost FLOAT NOT NULL DEFAULT 0,
                        unique_clients INTEGER NOT NULL DEFAULT 0,
                        sum_cash FLOAT NOT NULL DEFAULT 0,
                        count_payment_cash INTEGER NOT NULL DEFAULT 0,
                        sum_card FLOAT NOT NULL DEFAULT 0,
                        count_payment_card INTEGER NOT NULL DEFAULT 0,
                        count_payment_online INTEGER NOT NULL DEFAULT 0,
                        sum_online_success FLOAT NOT NULL DEFAULT 0,
                        sum_online_fail FLOAT NOT NULL DEFAULT 0,
                        source_site INTEGER NOT NULL DEFAULT 0,
                        sum_source_site FLOAT NOT NULL DEFAULT 0,
                        source_vkapp INTEGER NOT NULL DEFAULT 0,
                        sum_source_vkapp FLOAT NOT NULL DEFAULT 0,
                        source_ios INTEGER NOT NULL DEFAULT 0,
                        sum_source_ios FLOAT NOT NULL DEFAULT 0,
                        source_android INTEGER NOT NULL DEFAULT 0,
                        sum_source_android FLOAT NOT NULL DEFAULT 0,
                        delivery_self_count INTEGER NOT NULL DEFAULT 0,
                        delivery_self_sum FLOAT NOT NULL DEFAULT 0,
                        delivery_count INTEGER NOT NULL DEFAULT 0,
                        delivery_sum FLOAT NOT NULL DEFAULT 0,
                        repeat_order_2 INTEGER NOT NULL DEFAULT 0,
                        repeat_order_3 INTEGER NOT NULL DEFAULT 0,
                        repeat_order_4 INTEGER NOT NULL DEFAULT 0,
                        repeat_order_5 INTEGER NOT NULL DEFAULT 0,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                """))
                conn.execute(text('CREATE UNIQUE INDEX IF NOT EXISTS ix_dlvry_daily_stats_unique ON dlvry_daily_stats (affiliate_id, stat_date)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_daily_stats_project_date ON dlvry_daily_stats (project_id, stat_date)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_daily_stats_affiliate ON dlvry_daily_stats (affiliate_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_daily_stats_date ON dlvry_daily_stats (stat_date)'))
            else:
                conn.execute(text("""
                    CREATE TABLE dlvry_daily_stats (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        affiliate_id VARCHAR NOT NULL,
                        project_id VARCHAR,
                        stat_date DATE NOT NULL,
                        orders_count INTEGER NOT NULL DEFAULT 0,
                        revenue REAL NOT NULL DEFAULT 0,
                        first_orders INTEGER NOT NULL DEFAULT 0,
                        avg_check REAL NOT NULL DEFAULT 0,
                        canceled INTEGER NOT NULL DEFAULT 0,
                        canceled_sum REAL NOT NULL DEFAULT 0,
                        cost REAL NOT NULL DEFAULT 0,
                        discount REAL NOT NULL DEFAULT 0,
                        first_orders_sum REAL NOT NULL DEFAULT 0,
                        first_orders_cost REAL NOT NULL DEFAULT 0,
                        unique_clients INTEGER NOT NULL DEFAULT 0,
                        sum_cash REAL NOT NULL DEFAULT 0,
                        count_payment_cash INTEGER NOT NULL DEFAULT 0,
                        sum_card REAL NOT NULL DEFAULT 0,
                        count_payment_card INTEGER NOT NULL DEFAULT 0,
                        count_payment_online INTEGER NOT NULL DEFAULT 0,
                        sum_online_success REAL NOT NULL DEFAULT 0,
                        sum_online_fail REAL NOT NULL DEFAULT 0,
                        source_site INTEGER NOT NULL DEFAULT 0,
                        sum_source_site REAL NOT NULL DEFAULT 0,
                        source_vkapp INTEGER NOT NULL DEFAULT 0,
                        sum_source_vkapp REAL NOT NULL DEFAULT 0,
                        source_ios INTEGER NOT NULL DEFAULT 0,
                        sum_source_ios REAL NOT NULL DEFAULT 0,
                        source_android INTEGER NOT NULL DEFAULT 0,
                        sum_source_android REAL NOT NULL DEFAULT 0,
                        delivery_self_count INTEGER NOT NULL DEFAULT 0,
                        delivery_self_sum REAL NOT NULL DEFAULT 0,
                        delivery_count INTEGER NOT NULL DEFAULT 0,
                        delivery_sum REAL NOT NULL DEFAULT 0,
                        repeat_order_2 INTEGER NOT NULL DEFAULT 0,
                        repeat_order_3 INTEGER NOT NULL DEFAULT 0,
                        repeat_order_4 INTEGER NOT NULL DEFAULT 0,
                        repeat_order_5 INTEGER NOT NULL DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                conn.execute(text('CREATE UNIQUE INDEX IF NOT EXISTS ix_dlvry_daily_stats_unique ON dlvry_daily_stats (affiliate_id, stat_date)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS ix_dlvry_daily_stats_project_date ON dlvry_daily_stats (project_id, stat_date)'))

        print("[DLVRY] ✅ Таблица dlvry_daily_stats создана.")
    else:
        print("[DLVRY] ℹ️ Таблица dlvry_daily_stats уже существует.")

    # Добавляем новые колонки, если их ещё нет (миграция)
    _add_missing_columns(engine, is_postgres)


def _add_missing_columns(engine: Engine, is_postgres: bool):
    """Добавляет недостающие колонки в существующую таблицу."""
    inspector = inspect(engine)
    if not inspector.has_table('dlvry_daily_stats'):
        return

    existing = {col['name'] for col in inspector.get_columns('dlvry_daily_stats')}
    added = []

    with engine.begin() as conn:
        for col_name, pg_type, sqlite_type, default in _NEW_COLUMNS:
            if col_name not in existing:
                col_type = pg_type if is_postgres else sqlite_type
                conn.execute(text(
                    f"ALTER TABLE dlvry_daily_stats ADD COLUMN {col_name} {col_type} NOT NULL DEFAULT {default}"
                ))
                added.append(col_name)

    if added:
        print(f"[DLVRY] ✅ Добавлено {len(added)} новых колонок: {', '.join(added)}")
    else:
        print("[DLVRY] ℹ️ Все колонки dlvry_daily_stats актуальны.")
