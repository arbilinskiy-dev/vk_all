"""Диагностика: проверяем в каких JSON-массивах Алена Горелова (489282588)"""
import sqlite3, json

db = sqlite3.connect('vk_planner.db')
cur = db.cursor()

USER_ID = 489282588

# Все hourly записи, где упоминается этот user_id
cur.execute("""
SELECT project_id, hour_slot, 
       unique_text_users_json, unique_payload_users_json, unique_users_json,
       incoming_count, incoming_text_count, incoming_payload_count
FROM message_stats_hourly 
WHERE unique_text_users_json LIKE ? 
   OR unique_payload_users_json LIKE ?
   OR unique_users_json LIKE ?
ORDER BY hour_slot
""", (f'%{USER_ID}%', f'%{USER_ID}%', f'%{USER_ID}%'))

rows = cur.fetchall()
print(f"=== Hourly записи с user_id {USER_ID} ({len(rows)} шт.) ===")
for row in rows:
    pid, slot, text_j, payload_j, users_j, inc, text_c, payload_c = row
    text_ids = json.loads(text_j or '[]')
    payload_ids = json.loads(payload_j or '[]')
    in_text = USER_ID in text_ids
    in_payload = USER_ID in payload_ids
    print(f"  slot={slot} | pid={pid[:50]}")
    print(f"    in_text_json={in_text} | in_payload_json={in_payload}")
    print(f"    inc={inc} text_cnt={text_c} payload_cnt={payload_c}")
    print()

# Проверяем MessageStatsUser
cur.execute("""
SELECT project_id, vk_user_id, incoming_count, outgoing_count, first_message_at, last_message_at
FROM message_stats_user
WHERE vk_user_id = ?
""", (USER_ID,))
user_rows = cur.fetchall()
print(f"=== MessageStatsUser для {USER_ID} ({len(user_rows)} шт.) ===")
for r in user_rows:
    print(f"  pid={r[0][:50]} inc={r[2]} out={r[3]} first={r[4]} last={r[5]}")

db.close()
