import sqlite3

conn = sqlite3.connect('vk_planner.db')
c = conn.cursor()

# Все таблицы
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("=== Таблицы ===")
for t in c.fetchall():
    print(t[0])

# system_accounts
try:
    c.execute("SELECT id, full_name, status, vk_user_id, substr(token, 1, 20) as token_prefix FROM system_accounts")
    rows = c.fetchall()
    print(f"\n=== system_accounts ({len(rows)} записей) ===")
    for r in rows:
        print(f"  id={r[0]}, name={r[1]}, status={r[2]}, vk_id={r[3]}, token={r[4]}...")
except Exception as e:
    print(f"system_accounts error: {e}")

# project 173525155
try:
    c.execute("SELECT id, vkProjectId, substr(communityToken, 1, 20) as ct_prefix FROM projects WHERE id='173525155'")
    rows = c.fetchall()
    print(f"\n=== project 173525155 ===")
    for r in rows:
        print(f"  id={r[0]}, vkProjectId={r[1]}, communityToken={r[2]}...")
except Exception as e:
    print(f"projects error: {e}")

# administered_groups
try:
    c.execute("SELECT id, admins_data FROM administered_groups LIMIT 5")
    rows = c.fetchall()
    print(f"\n=== administered_groups ({len(rows)} записей) ===")
    for r in rows:
        print(f"  group_id={r[0]}, has_admins_data={'yes' if r[1] else 'no'}")
except Exception as e:
    print(f"administered_groups error: {e}")

conn.close()
