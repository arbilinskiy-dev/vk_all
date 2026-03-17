"""Тест: большой диапазон дат для hl-orders — результат в файл"""
import asyncio, os, json, aiohttp, sys
from dotenv import load_dotenv
load_dotenv()

TOKEN = os.getenv("DLVRY_TOKEN", "").strip('"')
OUT = os.path.join(os.path.dirname(__file__), "test_hl_result.txt")

async def test():
    lines = []
    url = f"https://dlvry.ru/api/v1/affiliates/2579645/hl-orders?date_from=12.12.2025&date_to=11.03.2026"
    lines.append(f"URL: {url}")
    headers = {"Authorization": f"Bearer {TOKEN}", "User-Agent": "smmgame"}
    timeout = aiohttp.ClientTimeout(total=60)
    try:
        async with aiohttp.ClientSession(timeout=timeout) as s:
            async with s.get(url, headers=headers) as r:
                raw = await r.text()
                lines.append(f"Status: {r.status}")
                lines.append(f"Content-Type: {r.headers.get('Content-Type')}")
                lines.append(f"Body length: {len(raw)}")
                try:
                    data = json.loads(raw)
                    lines.append(f"JSON: YES, keys={list(data.keys())}")
                    if "data" in data:
                        d = data["data"]
                        lines.append(f"data keys: {list(d.keys())}")
                        if "items" in d:
                            lines.append(f"items count: {len(d['items'])}")
                        if "orders" in d:
                            lines.append(f"orders count: {len(d['orders'])}")
                        if "count" in d:
                            lines.append(f"count: {d['count']}")
                except json.JSONDecodeError as e:
                    lines.append(f"JSON: NO, error={e}")
                    lines.append(f"Body[:500]: {raw[:500]}")
    except Exception as e:
        lines.append(f"REQUEST ERROR: {e}")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Done -> {OUT}")

asyncio.run(test())
