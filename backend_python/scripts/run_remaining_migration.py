"""
Скрипт для запуска оставшихся фаз миграции (3, 4) на VM.
Запускать внутри Docker-контейнера.
"""
import sys
sys.stdout.reconfigure(line_buffering=True)

from database import engine
from sqlalchemy import text

# Проверяем текущее состояние
print("=== ТЕКУЩЕЕ СОСТОЯНИЕ ===")
tables = ["vk_profiles", "project_members", "member_events", "post_interactions", "project_dialogs", "project_authors"]
with engine.connect() as conn:
    for t in tables:
        r = conn.execute(text(f"SELECT COUNT(*) FROM {t}"))
        print(f"  {t}: {r.scalar():,}")

# Запускаем Фазу 3 (interactions)
print("\n=== ФАЗА 3: INTERACTIONS ===")
with engine.connect() as conn:
    cnt = conn.execute(text("SELECT COUNT(*) FROM post_interactions")).scalar()
    if cnt > 0:
        print(f"post_interactions уже содержит {cnt:,} записей, пропускаем.")
    else:
        from db_migrations import interactions
        interactions.migrate(engine)

# Запускаем Фазу 4 (dialogs + authors)
print("\n=== ФАЗА 4: DIALOGS + AUTHORS ===")
with engine.connect() as conn:
    d_cnt = conn.execute(text("SELECT COUNT(*) FROM project_dialogs")).scalar()
    a_cnt = conn.execute(text("SELECT COUNT(*) FROM project_authors")).scalar()
    if d_cnt > 0 and a_cnt > 0:
        print(f"project_dialogs ({d_cnt:,}) и project_authors ({a_cnt:,}) уже заполнены, пропускаем.")
    else:
        from db_migrations import dialogs_authors
        dialogs_authors.migrate(engine)

# Итоговая проверка
print("\n=== ИТОГОВОЕ СОСТОЯНИЕ ===")
with engine.connect() as conn:
    for t in tables:
        r = conn.execute(text(f"SELECT COUNT(*) FROM {t}"))
        print(f"  {t}: {r.scalar():,}")

print("\n=== МИГРАЦИЯ ЗАВЕРШЕНА ===")
