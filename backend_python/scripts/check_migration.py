"""
Диагностический скрипт: проверяет состояние миграции данных
из старых денормализованных таблиц в новые нормализованные.
"""
from database import engine
from sqlalchemy import text, inspect as sa_inspect

OLD_TABLES = [
    'system_list_subscribers',
    'system_list_mailing',
    'system_list_likes',
    'system_list_comments',
    'system_list_reposts',
    'system_list_history_join',
    'system_list_history_leave',
    'system_list_authors',
]

NEW_TABLES = [
    'vk_profiles',
    'project_members',
    'member_events',
    'post_interactions',
    'project_dialogs',
    'project_authors',
]

def main():
    inspector = sa_inspect(engine)
    existing = set(inspector.get_table_names())
    
    print("=" * 60)
    print("ДИАГНОСТИКА МИГРАЦИИ БД")
    print("=" * 60)
    
    print("\n--- СТАРЫЕ таблицы (source) ---")
    for t in OLD_TABLES:
        if t in existing:
            with engine.connect() as c:
                r = c.execute(text(f"SELECT COUNT(*) FROM {t}"))
                print(f"  {t}: {r.scalar():,}")
        else:
            print(f"  {t}: НЕ СУЩЕСТВУЕТ (удалена)")
    
    print("\n--- НОВЫЕ таблицы (target) ---")
    for t in NEW_TABLES:
        if t in existing:
            with engine.connect() as c:
                r = c.execute(text(f"SELECT COUNT(*) FROM {t}"))
                print(f"  {t}: {r.scalar():,}")
        else:
            print(f"  {t}: НЕ СУЩЕСТВУЕТ")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
