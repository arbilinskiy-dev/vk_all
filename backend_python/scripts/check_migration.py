"""Quick check: verify normalized table and new columns exist."""
from database import engine
from sqlalchemy import inspect, text

i = inspect(engine)
tables = [t for t in i.get_table_names() if "hourly" in t]
print("hourly tables:", tables)

has_new = i.has_table("message_stats_hourly_users")
print("has message_stats_hourly_users:", has_new)

if has_new:
    with engine.connect() as conn:
        cnt = conn.execute(text("SELECT COUNT(*) FROM message_stats_hourly_users")).scalar()
        print("rows in hourly_users:", cnt)

cols = [c["name"] for c in i.get_columns("message_stats_hourly")]
new_cols = [c for c in cols if "users_count" in c]
print("new integer columns:", new_cols)
