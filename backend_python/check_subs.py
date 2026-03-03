"""Быстрая проверка данных в таблице message_subscriptions."""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "vk_planner.db")
print(f"БД: {db_path}")
print(f"Файл существует: {os.path.exists(db_path)}")

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Проверяем таблицу
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%subscript%'")
tables = cur.fetchall()
print(f"\nТаблицы с 'subscript': {tables}")

if tables:
    cur.execute("SELECT COUNT(*) FROM message_subscriptions")
    count = cur.fetchone()[0]
    print(f"Всего записей: {count}")
    
    cur.execute("SELECT * FROM message_subscriptions ORDER BY id DESC LIMIT 10")
    rows = cur.fetchall()
    
    # Получаем имена колонок
    cur.execute("PRAGMA table_info(message_subscriptions)")
    cols = [c[1] for c in cur.fetchall()]
    print(f"Колонки: {cols}")
    
    for row in rows:
        print(dict(zip(cols, row)))
else:
    print("Таблица message_subscriptions НЕ НАЙДЕНА!")
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    all_tables = cur.fetchall()
    print(f"Все таблицы: {[t[0] for t in all_tables]}")

conn.close()
