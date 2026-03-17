"""
Тест: можно ли запросить заказы за другие дни через orders/hl-orders?
Пробуем разные варианты передачи дат.
"""

import asyncio
import json
import sqlite3
import os
from datetime import datetime, timedelta

import aiohttp
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("DLVRY_TOKEN", "").strip('"')
BASE = "https://api2.dlvry.ru/api/v1"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "User-Agent": "smmgame",
}

# affiliate_id из БД
def get_aff_id():
    db_path = os.path.join(os.path.dirname(__file__), "vk_planner.db")
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.execute("SELECT DISTINCT affiliate_id FROM dlvry_project_affiliates WHERE is_active = 1 LIMIT 1")
        row = cur.fetchone()
        return row[0] if row else None
    finally:
        conn.close()


async def test(session, url, label):
    print(f"\n{'─'*60}")
    print(f"📡 {label}")
    print(f"   GET {url}")
    try:
        async with session.get(url, headers=HEADERS) as resp:
            text = await resp.text()
            try:
                data = json.loads(text)
                count = data.get('data', {}).get('count', '?')
                items = data.get('data', {}).get('items', [])
                
                # Показываем даты первого и последнего заказа
                dates = []
                for item in items:
                    d = item.get('date', '')
                    if d:
                        dates.append(d)
                
                print(f"   Status: {resp.status} | count: {count} | items в ответе: {len(items)}")
                if dates:
                    print(f"   Даты: {dates[0]} ... {dates[-1]}")
                
                # Если ошибка
                if data.get('error'):
                    print(f"   Error: {data['error']}")
                    
            except json.JSONDecodeError:
                print(f"   Status: {resp.status} | Raw: {text[:200]}")
    except Exception as e:
        print(f"   ❌ {e}")


async def main():
    aff = get_aff_id()
    if not aff:
        print("Нет affiliate_id")
        return
    
    print(f"affiliate_id: {aff}")
    
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%d.%m.%Y")
    week_ago = (datetime.now() - timedelta(days=7)).strftime("%d.%m.%Y")
    month_ago = (datetime.now() - timedelta(days=30)).strftime("%d.%m.%Y")
    today = datetime.now().strftime("%d.%m.%Y")
    
    # ISO формат тоже попробуем
    yesterday_iso = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    week_ago_iso = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    
    timeout = aiohttp.ClientTimeout(total=30)
    async with aiohttp.ClientSession(timeout=timeout) as s:
        
        # ── Базовый запрос (без дат) ─────────────────────────
        await test(s,
            f"{BASE}/affiliates/{aff}/hl-orders",
            "hl-orders БЕЗ параметров (baseline)")
        
        # ── Вариант 1: date_from / date_to ───────────────────
        await test(s,
            f"{BASE}/affiliates/{aff}/hl-orders?date_from={week_ago}&date_to={today}",
            f"hl-orders ?date_from={week_ago}&date_to={today}")
        
        await test(s,
            f"{BASE}/affiliates/{aff}/hl-orders?date_from={month_ago}&date_to={yesterday}",
            f"hl-orders ?date_from={month_ago}&date_to={yesterday}")
        
        # ── Вариант 2: date ──────────────────────────────────
        await test(s,
            f"{BASE}/affiliates/{aff}/hl-orders?date={yesterday}",
            f"hl-orders ?date={yesterday}")
        
        # ── Вариант 3: ISO формат ────────────────────────────
        await test(s,
            f"{BASE}/affiliates/{aff}/hl-orders?date_from={week_ago_iso}&date_to={yesterday_iso}",
            f"hl-orders ?date_from={week_ago_iso}&date_to={yesterday_iso} (ISO)")
        
        # ── Вариант 4: filter JSON (как в statistics) ────────
        import urllib.parse
        filter_obj = {"date_from": week_ago, "date_to": today, "affiliate_id": str(aff)}
        encoded = urllib.parse.quote(json.dumps(filter_obj))
        await test(s,
            f"{BASE}/affiliates/{aff}/hl-orders?filter={encoded}",
            f"hl-orders ?filter={{date_from, date_to}} (как в statistics)")
        
        # ── Вариант 5: page/per_page ────────────────────────
        await test(s,
            f"{BASE}/affiliates/{aff}/hl-orders?page=1&per_page=100",
            f"hl-orders ?page=1&per_page=100")
        
        # ── Вариант 6: offset/limit ─────────────────────────
        await test(s,
            f"{BASE}/affiliates/{aff}/hl-orders?offset=0&limit=100",
            f"hl-orders ?offset=0&limit=100")
        
        # ── То же для обычного orders ────────────────────────
        await test(s,
            f"{BASE}/affiliates/{aff}/orders?date_from={week_ago}&date_to={today}",
            f"orders ?date_from={week_ago}&date_to={today}")
        
        await test(s,
            f"{BASE}/affiliates/{aff}/orders?date_from={month_ago}&date_to={yesterday}",
            f"orders ?date_from={month_ago}&date_to={yesterday}")


if __name__ == "__main__":
    asyncio.run(main())
