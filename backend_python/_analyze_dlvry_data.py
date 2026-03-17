"""Анализ данных DLVRY в БД для выявления доступных метрик."""
import sqlite3
import os

db_path = './vk_planner.db'
if not os.path.exists(db_path):
    db_path = '../vk_planner.db'

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Таблицы
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%dlvry%'")
tables = [r[0] for r in cur.fetchall()]
print('=== DLVRY TABLES ===')
for t in tables:
    print(f'  {t}')

# Подсчёт записей
print('\n=== ROW COUNTS ===')
for t in tables:
    cur.execute(f'SELECT COUNT(*) FROM [{t}]')
    print(f'  {t}: {cur.fetchone()[0]} rows')

# Daily stats диапазон
print('\n=== DAILY STATS: Date range ===')
cur.execute('SELECT MIN(stat_date), MAX(stat_date), COUNT(*) FROM dlvry_daily_stats')
row = cur.fetchone()
print(f'  From: {row[0]}, To: {row[1]}, Total days: {row[2]}')

cur.execute('SELECT DISTINCT affiliate_id FROM dlvry_daily_stats')
affiliates = [r[0] for r in cur.fetchall()]
print(f'  Affiliates: {affiliates}')

# Последние 5 дней
print('\n=== LAST 5 DAYS ===')
cur.execute('SELECT stat_date, orders_count, revenue, avg_check, first_orders, unique_clients, canceled, cost, discount FROM dlvry_daily_stats ORDER BY stat_date DESC LIMIT 5')
for r in cur.fetchall():
    print(f'  {r[0]}: orders={r[1]}, revenue={r[2]}, avg_check={r[3]}, first={r[4]}, unique={r[5]}, canceled={r[6]}, cost={r[7]}, discount={r[8]}')

# Источники
print('\n=== SOURCES (last 5 days) ===')
cur.execute('SELECT stat_date, source_vkapp, sum_source_vkapp, source_android, sum_source_android, source_site, sum_source_site, source_ios, sum_source_ios FROM dlvry_daily_stats ORDER BY stat_date DESC LIMIT 5')
for r in cur.fetchall():
    print(f'  {r[0]}: VK={r[1]}({r[2]}), Android={r[3]}({r[4]}), Site={r[5]}({r[6]}), iOS={r[7]}({r[8]})')

# Оплата
print('\n=== PAYMENTS (last 5 days) ===')
cur.execute('SELECT stat_date, sum_cash, count_payment_cash, sum_card, count_payment_card, count_payment_online, sum_online_success FROM dlvry_daily_stats ORDER BY stat_date DESC LIMIT 5')
for r in cur.fetchall():
    print(f'  {r[0]}: cash={r[1]}({r[2]}), card={r[3]}({r[4]}), online_cnt={r[5]}, online_sum={r[6]}')

# Доставка
print('\n=== DELIVERY (last 5 days) ===')
cur.execute('SELECT stat_date, delivery_self_count, delivery_self_sum, delivery_count, delivery_sum FROM dlvry_daily_stats ORDER BY stat_date DESC LIMIT 5')
for r in cur.fetchall():
    print(f'  {r[0]}: self={r[1]}({r[2]}), delivery={r[3]}({r[4]})')

# Повторные заказы
print('\n=== REPEAT ORDERS (last 5 days) ===')
cur.execute('SELECT stat_date, repeat_order_2, repeat_order_3, repeat_order_4, repeat_order_5 FROM dlvry_daily_stats ORDER BY stat_date DESC LIMIT 5')
for r in cur.fetchall():
    print(f'  {r[0]}: x2={r[1]}, x3={r[2]}, x4={r[3]}, x5+={r[4]}')

# Orders table
print('\n=== ORDERS TABLE ===')
cur.execute('SELECT COUNT(*), MIN(order_date), MAX(order_date) FROM dlvry_orders')
row = cur.fetchone()
print(f'  Total: {row[0]}, From: {row[1]}, To: {row[2]}')

# Источники заказов
print('\n=== ORDER SOURCES ===')
cur.execute('SELECT source_name, COUNT(*), ROUND(SUM(total), 0), ROUND(AVG(total), 2) FROM dlvry_orders WHERE total > 0 GROUP BY source_name ORDER BY COUNT(*) DESC')
for r in cur.fetchall():
    print(f'  {r[0]}: {r[1]} orders, revenue={r[2]}, avg_check={r[3]}')

# Типы оплаты
print('\n=== PAYMENT TYPES ===')
cur.execute('SELECT payment_name, COUNT(*), ROUND(SUM(total), 0) FROM dlvry_orders WHERE total > 0 GROUP BY payment_name ORDER BY COUNT(*) DESC')
for r in cur.fetchall():
    print(f'  {r[0]}: {r[1]} orders, revenue={r[2]}')

# Типы доставки
print('\n=== DELIVERY TYPES ===')
cur.execute('SELECT delivery_name, COUNT(*), ROUND(SUM(total), 0) FROM dlvry_orders WHERE total > 0 GROUP BY delivery_name ORDER BY COUNT(*) DESC')
for r in cur.fetchall():
    print(f'  {r[0]}: {r[1]} orders, revenue={r[2]}')

# Top товары
print('\n=== ORDER ITEMS STATS ===')
cur.execute('SELECT COUNT(*) FROM dlvry_order_items')
print(f'  Total items: {cur.fetchone()[0]}')
cur.execute('SELECT name, COUNT(*) as cnt, SUM(quantity) as qty, ROUND(AVG(price), 2) as avg_price FROM dlvry_order_items GROUP BY name ORDER BY qty DESC LIMIT 15')
print('  Top 15 products by quantity:')
for r in cur.fetchall():
    print(f'    {r[0]}: ordered {r[1]} times, qty={r[2]}, avg_price={r[3]}')

# По месяцам
print('\n=== MONTHLY STATS ===')
cur.execute("""
    SELECT 
        strftime('%Y-%m', stat_date) as month,
        SUM(orders_count) as orders,
        ROUND(SUM(revenue), 0) as revenue,
        ROUND(SUM(revenue) * 1.0 / NULLIF(SUM(orders_count), 0), 2) as avg_check,
        SUM(first_orders) as new_clients,
        SUM(canceled) as canceled,
        ROUND(SUM(cost), 0) as total_cost,
        ROUND(SUM(discount), 0) as total_discount
    FROM dlvry_daily_stats
    GROUP BY strftime('%Y-%m', stat_date)
    ORDER BY month DESC
    LIMIT 12
""")
print('  Month | Orders | Revenue | Avg Check | New | Canceled | Cost | Discount')
for r in cur.fetchall():
    print(f'  {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} | {r[6]} | {r[7]}')

# По дням недели
print('\n=== ORDERS BY WEEKDAY ===')
cur.execute("""
    SELECT order_weekday, COUNT(*), ROUND(SUM(total), 0), ROUND(AVG(total), 2)
    FROM dlvry_orders WHERE total > 0 AND order_weekday IS NOT NULL
    GROUP BY order_weekday ORDER BY order_weekday
""")
weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
for r in cur.fetchall():
    wd = weekdays[r[0]-1] if r[0] and 1 <= r[0] <= 7 else f'?{r[0]}'
    print(f'  {wd}: {r[1]} orders, revenue={r[2]}, avg_check={r[3]}')

# Часовое распределение
print('\n=== ORDERS BY HOUR ===')
cur.execute("""
    SELECT CAST(strftime('%H', order_date) AS INTEGER) as hour, COUNT(*), ROUND(SUM(total), 0), ROUND(AVG(total), 2)
    FROM dlvry_orders WHERE total > 0 AND order_date IS NOT NULL
    GROUP BY hour ORDER BY hour
""")
for r in cur.fetchall():
    print(f'  {r[0]:02d}:00 - {r[1]} orders, revenue={r[2]}, avg_check={r[3]}')

# Промокоды
print('\n=== PROMOCODES USAGE ===')
cur.execute("SELECT COUNT(*) FROM dlvry_orders WHERE promocode IS NOT NULL AND promocode != ''")
promo_cnt = cur.fetchone()[0]
cur.execute('SELECT COUNT(*) FROM dlvry_orders')
total_orders = cur.fetchone()[0]
print(f'  Orders with promocode: {promo_cnt} / {total_orders} ({round(promo_cnt*100/max(total_orders,1), 1)}%)')

cur.execute("SELECT promocode, COUNT(*), ROUND(AVG(total), 2) FROM dlvry_orders WHERE promocode IS NOT NULL AND promocode != '' GROUP BY promocode ORDER BY COUNT(*) DESC LIMIT 10")
for r in cur.fetchall():
    print(f'  "{r[0]}": {r[1]} uses, avg_total={r[2]}')

# Предзаказы
print('\n=== PREORDERS ===')
cur.execute('SELECT is_preorder, COUNT(*) FROM dlvry_orders GROUP BY is_preorder')
for r in cur.fetchall():
    print(f'  is_preorder={r[0]}: {r[1]}')

# VK профили
print('\n=== VK PROFILE LINKS ===')
cur.execute("SELECT COUNT(*) FROM dlvry_orders WHERE vk_user_id IS NOT NULL AND vk_user_id != ''")
vk_linked = cur.fetchone()[0]
print(f'  Orders with VK user_id: {vk_linked} / {total_orders}')

cur.execute("SELECT COUNT(DISTINCT vk_user_id) FROM dlvry_orders WHERE vk_user_id IS NOT NULL AND vk_user_id != ''")
print(f'  Unique VK users: {cur.fetchone()[0]}')

# Клиенты: повторные покупки
print('\n=== CLIENT RETENTION (from orders) ===')
cur.execute("""
    SELECT orders_per_client, COUNT(*) as clients
    FROM (
        SELECT phone, COUNT(*) as orders_per_client
        FROM dlvry_orders
        WHERE phone IS NOT NULL AND phone != ''
        GROUP BY phone
    )
    GROUP BY orders_per_client
    ORDER BY orders_per_client
    LIMIT 20
""")
for r in cur.fetchall():
    print(f'  {r[0]} orders: {r[1]} clients')

# Средний items_count
print('\n=== ITEMS PER ORDER ===')
cur.execute('SELECT ROUND(AVG(items_count), 2), ROUND(AVG(items_total_qty), 2), MAX(items_count), MAX(items_total_qty) FROM dlvry_orders WHERE items_count > 0')
r = cur.fetchone()
print(f'  Avg positions: {r[0]}, Avg items qty: {r[1]}, Max positions: {r[2]}, Max items qty: {r[3]}')

# Маржинальность
print('\n=== MARGIN ANALYSIS (monthly) ===')
cur.execute("""
    SELECT 
        strftime('%Y-%m', stat_date) as month,
        ROUND(SUM(revenue), 0) as revenue,
        ROUND(SUM(cost), 0) as cost,
        ROUND(SUM(revenue) - SUM(cost), 0) as margin,
        ROUND((SUM(revenue) - SUM(cost)) * 100.0 / NULLIF(SUM(revenue), 0), 1) as margin_pct,
        ROUND(SUM(discount), 0) as discount,
        ROUND(SUM(canceled_sum), 0) as canceled_sum
    FROM dlvry_daily_stats
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
""")
print('  Month | Revenue | Cost | Margin | Margin% | Discount | Canceled')
for r in cur.fetchall():
    print(f'  {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]}% | {r[5]} | {r[6]}')

# Конверсия self vs delivery по источникам
print('\n=== DELIVERY TYPE BY SOURCE ===')
cur.execute("""
    SELECT source_name, delivery_name, COUNT(*), ROUND(AVG(total), 2)
    FROM dlvry_orders
    WHERE total > 0 AND source_name IS NOT NULL AND delivery_name IS NOT NULL
    GROUP BY source_name, delivery_name
    ORDER BY source_name, delivery_name
""")
for r in cur.fetchall():
    print(f'  {r[0]} + {r[1]}: {r[2]} orders, avg={r[3]}')

conn.close()
print('\n=== DONE ===')
