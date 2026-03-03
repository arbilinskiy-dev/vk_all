
from sqlalchemy import inspect, text, Engine

def check_and_add_unique_constraint(engine: Engine, table_name: str, constraint_name: str, columns: list[str]):
    """
    Проверяет наличие уникального constraint/индекса и создаёт его, если отсутствует.
    Используется для предотвращения дублирования данных при параллельной обработке.
    """
    inspector = inspect(engine)
    if not inspector.has_table(table_name):
        return
    
    # Проверяем существующие уникальные constraints
    existing_constraints = inspector.get_unique_constraints(table_name)
    existing_names = {c['name'] for c in existing_constraints if c.get('name')}
    
    # Также проверяем индексы (constraint может быть реализован как индекс)
    existing_indexes = inspector.get_indexes(table_name)
    for idx in existing_indexes:
        if idx.get('unique'):
            existing_names.add(idx.get('name'))
    
    if constraint_name in existing_names:
        return
    
    cols = ', '.join(columns)
    print(f"Adding UNIQUE constraint '{constraint_name}' on ({cols}) to '{table_name}'...")
    try:
        with engine.connect() as connection:
            # Сначала удаляем дубликаты, оставляя запись с минимальным id
            # (иначе CREATE UNIQUE INDEX упадёт на IntegrityError)
            cols_joined = ', '.join(columns)
            delete_dupes_sql = f"""
                DELETE FROM {table_name}
                WHERE rowid NOT IN (
                    SELECT MIN(rowid)
                    FROM {table_name}
                    GROUP BY {cols_joined}
                )
            """
            # rowid — универсальный для SQLite; для PostgreSQL используем ctid
            if 'sqlite' in engine.url.drivername:
                result = connection.execute(text(delete_dupes_sql))
            else:
                # PostgreSQL: используем ctid вместо rowid
                delete_dupes_sql_pg = f"""
                    DELETE FROM {table_name} a
                    USING {table_name} b
                    WHERE a.ctid < b.ctid
                      AND {' AND '.join(f'a.{c} = b.{c}' for c in columns)}
                """
                result = connection.execute(text(delete_dupes_sql_pg))
            
            deleted = result.rowcount
            if deleted:
                print(f"  Удалено {deleted} дубликатов из '{table_name}' перед созданием UNIQUE constraint.")
            
            connection.execute(text(
                f'CREATE UNIQUE INDEX IF NOT EXISTS {constraint_name} ON {table_name} ({cols})'
            ))
            connection.commit()
        print(f"UNIQUE constraint '{constraint_name}' added successfully.")
    except Exception as e:
        print(f"Error adding UNIQUE constraint '{constraint_name}': {e}")


def check_and_add_column(engine: Engine, table_name: str, column_name: str, column_definition: str):
    """
    Проверяет наличие колонки в таблице и добавляет ее, если она отсутствует.
    """
    inspector = inspect(engine)
    
    # Проверка существования таблицы перед проверкой колонки
    if not inspector.has_table(table_name):
        return

    columns = inspector.get_columns(table_name)
    column_names = {c['name'] for c in columns}
    
    if column_name not in column_names:
        print(f"Column '{column_name}' not found in table '{table_name}'. Adding it...")
        try:
            with engine.connect() as connection:
                # Для SQLite и PostgreSQL синтаксис немного разный, особенно для DEFAULT
                if 'sqlite' in engine.url.drivername:
                    connection.execute(text(f'ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}'))
                else: # PostgreSQL
                    connection.execute(text(f'ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}'))
                connection.commit()
            print(f"Column '{column_name}' added successfully to '{table_name}'.")
        except Exception as e:
            print(f"Error adding column '{column_name}' to table '{table_name}': {e}")
