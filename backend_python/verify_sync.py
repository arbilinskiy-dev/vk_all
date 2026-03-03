"""
Проверка: заполнились ли unique_payload_users_json после sync.
"""
import json
import sys
sys.path.insert(0, ".")
from database import SessionLocal
from models_library.message_stats import MessageStatsHourly

db = SessionLocal()

# Все записи с payload_count > 0
rows = db.query(MessageStatsHourly).filter(
    MessageStatsHourly.incoming_payload_count > 0
).all()

total_payload_users = set()
fixed = 0
still_empty = 0

for r in rows:
    payload_users = json.loads(r.unique_payload_users_json or "[]")
    if payload_users:
        fixed += 1
        total_payload_users.update(payload_users)
    else:
        still_empty += 1
    
print(f"=== Проверка после sync ===")
print(f"Записей с incoming_payload_count > 0: {len(rows)}")
print(f"  С заполненным payload_users: {fixed}")
print(f"  Ещё пустых: {still_empty}")
print(f"  Всего уникальных payload-юзеров: {len(total_payload_users)}")
print(f"  Юзеры: {total_payload_users}")

# Подсчёт того, что покажет дашборд за "Вчера"
from sqlalchemy import func
from crud.message_stats.read import _hourly_date_filter
rows_yesterday = db.query(MessageStatsHourly).filter(
    *_hourly_date_filter("2026-02-25", "2026-02-25")
).all()

payload_users_yesterday = set()
payload_pairs_yesterday = set()
for r in rows_yesterday:
    pu = json.loads(r.unique_payload_users_json or "[]")
    for uid in pu:
        payload_users_yesterday.add(uid)
        payload_pairs_yesterday.add(f"{r.project_id}_{uid}")

print(f"\n=== За вчера (2026-02-25) ===")
print(f"  Уникальных payload юзеров: {len(payload_users_yesterday)}")
print(f"  Уникальных payload пар (project+user): {len(payload_pairs_yesterday)}")

db.close()
