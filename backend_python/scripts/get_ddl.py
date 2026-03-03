"""Вспомогательный скрипт для получения DDL таблиц."""
import sqlite3

conn = sqlite3.connect('vk_planner.db')
tables = [
    'project_dialogs', 'project_authors', 'post_interactions',
    'project_members', 'member_events', 'vk_profiles'
]
for t in tables:
    row = conn.execute("SELECT sql FROM sqlite_master WHERE tbl_name=?", (t,)).fetchone()
    print(f"=== {t} ===")
    print(row[0] if row else "NOT FOUND")
    # Показать индексы
    for idx in conn.execute("SELECT sql FROM sqlite_master WHERE tbl_name=? AND type='index' AND sql IS NOT NULL", (t,)):
        print(f"  INDEX: {idx[0]}")
    print()
conn.close()
