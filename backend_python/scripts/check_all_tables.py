"""Список всех таблиц в БД и их размеры."""
from database import engine
from sqlalchemy import text

with engine.connect() as c:
    # Все таблицы
    r = c.execute(text("""
        SELECT tablename FROM pg_catalog.pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
    """))
    tables = [row[0] for row in r]
    
    print("=" * 60)
    print(f"Всего таблиц: {len(tables)}")
    print("=" * 60)
    
    # Проверяем старые таблицы отдельно
    old_tables = [t for t in tables if t.startswith('system_list_')]
    if old_tables:
        print(f"\nСТАРЫЕ таблицы system_list_*: {old_tables}")
    else:
        print("\nСТАРЫЕ таблицы system_list_*: ВСЕ УДАЛЕНЫ")
    
    # Размеры ключевых таблиц
    print("\nРазмеры таблиц (записей):")
    for t in sorted(tables):
        try:
            r2 = c.execute(text(f'SELECT COUNT(*) FROM "{t}"'))
            cnt = r2.scalar()
            if cnt > 0:
                print(f"  {t}: {cnt:,}")
        except:
            pass
