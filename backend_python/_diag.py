from database import get_db
from sqlalchemy import text

db = next(get_db())

# Список таблиц
tables = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")).fetchall()
print("=== TABLES ===")
for t in tables:
    print(t[0])

print("\n=== TEST getStats for mailing ===")
try:
    import crud
    result = crud.get_list_stats_data(db, "ключиним", "mailing")
    print("SUCCESS:", list(result.keys()))
    print("total_users:", result.get("total_users"))
    print("mailing_stats:", result.get("mailing_stats"))
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")

print("\n=== TEST getStats for subscribers ===")
try:
    result = crud.get_list_stats_data(db, "ключиним", "subscribers")
    print("SUCCESS:", list(result.keys()))
    print("total_users:", result.get("total_users"))
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
