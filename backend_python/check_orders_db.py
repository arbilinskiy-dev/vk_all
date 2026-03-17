"""Быстрая проверка: сколько заказов в БД после синхронизации."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()

from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    count = db.execute(text("SELECT COUNT(*) FROM dlvry_orders")).scalar()
    total = db.execute(text("SELECT SUM(total) FROM dlvry_orders")).scalar()
    min_date = db.execute(text("SELECT MIN(order_date) FROM dlvry_orders")).scalar()
    max_date = db.execute(text("SELECT MAX(order_date) FROM dlvry_orders")).scalar()
    print(f"Orders: {count}")
    print(f"Total revenue: {total}")
    print(f"Date range: {min_date} — {max_date}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
