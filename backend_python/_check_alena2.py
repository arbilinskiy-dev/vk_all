"""Диагностика: полный анализ данных для user 489282588 и проекта Сушняк"""
import sqlite3, json

db = sqlite3.connect('vk_planner.db')
cur = db.cursor()

USER_ID = 489282588
# project_id из скриншота
PROJECT_PREFIX = 'a3b62beb'

print("=== 1. Все project_id содержащие prefix ===")
cur.execute("SELECT DISTINCT project_id FROM message_stats_hourly WHERE project_id LIKE ?", (f'{PROJECT_PREFIX}%',))
for r in cur.fetchall():
    print(f"  {r[0]}")

print()
print("=== 2. MessageStatsUser для user_id 489282588 ===")
cur.execute("""
SELECT project_id, vk_user_id, incoming_count, outgoing_count, first_message_at, last_message_at
FROM message_stats_user
WHERE vk_user_id = ?
""", (USER_ID,))
for r in cur.fetchall():
    print(f"  pid={r[0]} inc={r[2]} out={r[3]} first={r[4]} last={r[5]}")

print()
print("=== 3. Все hourly записи проекта a3b62beb* за сегодня (02.03) ===")
cur.execute("""
SELECT hour_slot, incoming_count, incoming_text_count, incoming_payload_count,
       unique_text_users_json, unique_payload_users_json, unique_users_json
FROM message_stats_hourly 
WHERE project_id LIKE ? AND hour_slot >= '2026-03-02'
ORDER BY hour_slot
""", (f'{PROJECT_PREFIX}%',))
for r in cur.fetchall():
    slot, inc, text_c, payload_c, text_j, payload_j, users_j = r
    text_ids = json.loads(text_j or '[]')
    payload_ids = json.loads(payload_j or '[]')
    all_ids = json.loads(users_j or '[]')
    print(f"  slot={slot} inc={inc} text={text_c} payload={payload_c}")
    print(f"    text_users={text_ids}")
    print(f"    payload_users={payload_ids}")
    print(f"    all_users={all_ids}")
    print(f"    489282588 in text={USER_ID in text_ids} in payload={USER_ID in payload_ids} in all={USER_ID in all_ids}")
    print()

print()
print("=== 4. Все hourly за ВСЁ ВРЕМЯ для этого проекта где 489282588 ===")
cur.execute("""
SELECT hour_slot, unique_text_users_json, unique_payload_users_json, unique_users_json
FROM message_stats_hourly 
WHERE project_id LIKE ?
ORDER BY hour_slot
""", (f'{PROJECT_PREFIX}%',))
found = 0
for r in cur.fetchall():
    slot, text_j, payload_j, users_j = r
    text_ids = json.loads(text_j or '[]')
    payload_ids = json.loads(payload_j or '[]')
    all_ids = json.loads(users_j or '[]')
    if USER_ID in text_ids or USER_ID in payload_ids or USER_ID in all_ids:
        found += 1
        print(f"  slot={slot} in_text={USER_ID in text_ids} in_payload={USER_ID in payload_ids} in_all={USER_ID in all_ids}")
print(f"  Найдено слотов: {found}")

db.close()
