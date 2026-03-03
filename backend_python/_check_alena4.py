import sqlite3
db = sqlite3.connect('vk_planner.db')
cur = db.cursor()

# Ищем Алену по имени
cur.execute("SELECT vk_user_id, first_name, last_name FROM vk_profiles WHERE first_name LIKE '%лена%' AND last_name LIKE '%орел%'")
for r in cur.fetchall():
    print(f'  vk_user_id={r[0]} name={r[1]} {r[2]}')

# Проверим оба ID
for uid in [489282588, 493282588]:
    cur.execute('SELECT vk_user_id, first_name, last_name FROM vk_profiles WHERE vk_user_id = ?', (uid,))
    r = cur.fetchone()
    if r:
        print(f'Profile {uid}: {r[1]} {r[2]}')
    else:
        print(f'Profile {uid}: NOT FOUND')

    cur.execute('SELECT project_id, incoming_count, outgoing_count, last_message_at FROM message_stats_user WHERE vk_user_id = ?', (uid,))
    rows = cur.fetchall()
    for row in rows:
        print(f'  MSU pid={row[0][:40]} inc={row[1]} out={row[2]} last={row[3]}')

db.close()
