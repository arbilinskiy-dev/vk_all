"""
Тест: сравнение dlvry.ru vs api2.dlvry.ru для hl-orders endpoint.
Проверяем какой URL возвращает валидный JSON.
"""
import asyncio
import os
import json
import aiohttp
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("DLVRY_TOKEN", "").strip('"')
AFFILIATE_ID = "2579645"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "User-Agent": "smmgame",
}

URLS = {
    "dlvry.ru": f"https://dlvry.ru/api/v1/affiliates/{AFFILIATE_ID}/hl-orders",
    "api2.dlvry.ru": f"https://api2.dlvry.ru/api/v1/affiliates/{AFFILIATE_ID}/hl-orders",
}


async def test_url(name: str, base_url: str):
    params = {"date_from": "01.03.2025", "date_to": "12.03.2025"}
    url = f"{base_url}?date_from={params['date_from']}&date_to={params['date_to']}"
    print(f"\n{'='*60}")
    print(f"[{name}] GET {url}")
    print(f"{'='*60}")

    timeout = aiohttp.ClientTimeout(total=30)
    try:
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, headers=HEADERS) as resp:
                raw = await resp.text()
                print(f"  Status: {resp.status}")
                print(f"  Content-Type: {resp.headers.get('Content-Type', 'N/A')}")
                print(f"  Body length: {len(raw)}")
                print(f"  Body[:500]: {raw[:500]}")

                try:
                    data = json.loads(raw)
                    print(f"  JSON Valid: YES")
                    if isinstance(data, dict):
                        print(f"  Keys: {list(data.keys())}")
                        if "data" in data and "orders" in data.get("data", {}):
                            orders = data["data"]["orders"]
                            print(f"  Orders count: {len(orders)}")
                            if orders:
                                print(f"  First order keys: {list(orders[0].keys())}")
                except json.JSONDecodeError as e:
                    print(f"  JSON Valid: NO — {e}")
    except Exception as e:
        print(f"  ERROR: {e}")


async def main():
    print(f"Token present: {bool(TOKEN)} (len={len(TOKEN)})")
    for name, url in URLS.items():
        await test_url(name, url)


if __name__ == "__main__":
    asyncio.run(main())
