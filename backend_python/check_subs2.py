"""Проверяем формат project_id в проектах и подписках."""
import sqlite3

conn = sqlite3.connect("vk_planner.db")
cur = conn.cursor()

# Проверяем, есть ли проекты с UUID
cur.execute("SELECT id, vkProjectId, name FROM projects WHERE id LIKE '%-%' LIMIT 5")
uuid_projects = cur.fetchall()
print(f"Проекты с UUID id: {len(uuid_projects)}")
for p in uuid_projects:
    print(f"  id={p[0]}, vkId={p[1]}, name={p[2]}")

# Проекты без UUID
cur.execute("SELECT id, vkProjectId, name FROM projects WHERE id NOT LIKE '%-%' LIMIT 5")
non_uuid = cur.fetchall()
print(f"\nПроекты без UUID id: {len(non_uuid)}")
for p in non_uuid:
    print(f"  id={p[0]}, vkId={p[1]}, name={p[2]}")

# Общее число
cur.execute("SELECT COUNT(*) FROM projects")
print(f"\nВсего проектов: {cur.fetchone()[0]}")

# Все данные подписок  
cur.execute("SELECT * FROM message_subscriptions ORDER BY id")
rows = cur.fetchall()
cur.execute("PRAGMA table_info(message_subscriptions)")
cols = [c[1] for c in cur.fetchall()]
print(f"\n=== Все подписки ({len(rows)}) ===")
for row in rows:
    d = dict(zip(cols, row))
    # Ищем проект
    cur.execute("SELECT name FROM projects WHERE id=?", (d['project_id'],))
    pname = cur.fetchone()
    d['_project_name'] = pname[0] if pname else '???НЕ НАЙДЕН???'
    print(d)

conn.close()
