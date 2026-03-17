"""
Тест-скрипт: проверка эндпоинтов DLVRY API.
Пробивает все 4 указанных метода и выводит raw-ответы.
"""

import asyncio
import json
import sqlite3
import sys
import os

import aiohttp

# ── Конфигурация ──────────────────────────────────────────────
# Загружаем из .env
from dotenv import load_dotenv
load_dotenv()

TOKEN = os.getenv("DLVRY_TOKEN", "").strip('"')
if not TOKEN:
    print("❌ DLVRY_TOKEN не найден в .env")
    sys.exit(1)

# Оба базовых URL для проверки
BASE_V1_OLD = "https://dlvry.ru/api/v1"
BASE_V1_NEW = "https://api2.dlvry.ru/api/v1"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "User-Agent": "smmgame",
    "Content-Type": "application/json",
}

# ── Ищем реальный affiliate_id из локальной БД ────────────────
def find_affiliate_ids():
    db_path = os.path.join(os.path.dirname(__file__), "vk_planner.db")
    if not os.path.exists(db_path):
        print(f"⚠️  БД не найдена: {db_path}")
        return []

    conn = sqlite3.connect(db_path)
    ids = []

    # Сначала из новой таблицы dlvry_project_affiliates
    try:
        cur = conn.execute("SELECT DISTINCT affiliate_id FROM dlvry_project_affiliates WHERE is_active = 1 LIMIT 5")
        ids = [row[0] for row in cur.fetchall()]
        if ids:
            print(f"✅ Найдены affiliate_id из dlvry_project_affiliates: {ids}")
    except Exception as e:
        print(f"⚠️  dlvry_project_affiliates: {e}")

    # Fallback — старое поле
    if not ids:
        try:
            cur = conn.execute("SELECT DISTINCT dlvry_affiliate_id FROM projects WHERE dlvry_affiliate_id IS NOT NULL AND dlvry_affiliate_id != '' LIMIT 5")
            ids = [row[0] for row in cur.fetchall()]
            if ids:
                print(f"✅ Найдены affiliate_id из projects: {ids}")
        except Exception as e:
            print(f"⚠️  projects.dlvry_affiliate_id: {e}")

    conn.close()
    return ids


# ── HTTP-запросы ──────────────────────────────────────────────
async def test_endpoint(session: aiohttp.ClientSession, method: str, url: str, label: str, body: dict = None):
    """Выполнить запрос и вернуть подробный результат."""
    print(f"\n{'='*70}")
    print(f"📡 {label}")
    print(f"   {method} {url}")
    print(f"{'='*70}")

    try:
        if method == "GET":
            async with session.get(url, headers=HEADERS) as resp:
                status = resp.status
                text = await resp.text()
        elif method == "POST":
            async with session.post(url, headers=HEADERS, json=body or {}) as resp:
                status = resp.status
                text = await resp.text()
        else:
            print(f"   ❌ Неизвестный метод: {method}")
            return

        print(f"   Status: {status}")

        # Попробуем разобрать JSON
        try:
            data = json.loads(text)
            pretty = json.dumps(data, ensure_ascii=False, indent=2)
            # Обрезаем если слишком длинный
            if len(pretty) > 3000:
                print(f"   Response (первые 3000 символов):\n{pretty[:3000]}\n   ... (обрезано, всего {len(pretty)} символов)")
            else:
                print(f"   Response:\n{pretty}")
        except json.JSONDecodeError:
            if len(text) > 1000:
                print(f"   Raw (первые 1000 символов): {text[:1000]}...")
            else:
                print(f"   Raw: {text}")

    except Exception as e:
        print(f"   ❌ Ошибка: {e}")


async def main():
    affiliate_ids = find_affiliate_ids()

    if not affiliate_ids:
        print("\n⚠️  Реальных affiliate_id не найдено в БД.")
        print("   Укажите вручную или добавьте в БД.")
        # Всё равно попробуем тесты без affiliate_id — проверим ответ API
        affiliate_ids = ["0"]

    aff_id = affiliate_ids[0]

    timeout = aiohttp.ClientTimeout(total=30)
    async with aiohttp.ClientSession(timeout=timeout) as session:

        # ═══════════════════════════════════════════════════════
        # 1. GET /affiliates/{id}/orders  (старый домен)
        # ═══════════════════════════════════════════════════════
        await test_endpoint(
            session, "GET",
            f"{BASE_V1_OLD}/affiliates/{aff_id}/orders",
            f"1a. ORDERS (старый домен) — affiliate_id={aff_id}"
        )

        # То же на новом домене
        await test_endpoint(
            session, "GET",
            f"{BASE_V1_NEW}/affiliates/{aff_id}/orders",
            f"1b. ORDERS (api2.dlvry.ru) — affiliate_id={aff_id}"
        )

        # ═══════════════════════════════════════════════════════
        # 2. GET /affiliates/{id}/hl-orders  (рекомендован Игорем)
        # ═══════════════════════════════════════════════════════
        await test_endpoint(
            session, "GET",
            f"{BASE_V1_OLD}/affiliates/{aff_id}/hl-orders",
            f"2a. HL-ORDERS (старый домен) — affiliate_id={aff_id}"
        )

        await test_endpoint(
            session, "GET",
            f"{BASE_V1_NEW}/affiliates/{aff_id}/hl-orders",
            f"2b. HL-ORDERS (api2.dlvry.ru) — affiliate_id={aff_id}"
        )

        # ═══════════════════════════════════════════════════════
        # 3. GET /affiliates/{id}/tags?type=promocodes
        # ═══════════════════════════════════════════════════════
        await test_endpoint(
            session, "GET",
            f"{BASE_V1_OLD}/affiliates/{aff_id}/tags?type=promocodes",
            f"3a. TAGS/PROMOCODES (старый домен) — affiliate_id={aff_id}"
        )

        await test_endpoint(
            session, "GET",
            f"{BASE_V1_NEW}/affiliates/{aff_id}/tags?type=promocodes",
            f"3b. TAGS/PROMOCODES (api2.dlvry.ru) — affiliate_id={aff_id}"
        )

        # ═══════════════════════════════════════════════════════
        # 4. GET /affiliates/{id}/statistics  (через текущую интеграцию)
        # ═══════════════════════════════════════════════════════
        import urllib.parse
        from datetime import datetime, timedelta

        dt_to = datetime.now() - timedelta(days=1)
        dt_from = datetime.now() - timedelta(days=7)
        d_from = dt_from.strftime("%d.%m.%Y")
        d_to = dt_to.strftime("%d.%m.%Y")

        filter_obj = {
            "date_from": d_from,
            "date_to": d_to,
            "affiliate_id": str(aff_id),
            "source": "all",
            "domain": "all",
            "delivery": "all",
        }
        encoded = urllib.parse.quote(json.dumps(filter_obj))

        await test_endpoint(
            session, "GET",
            f"{BASE_V1_OLD}/affiliates/{aff_id}/statistics?type=orders&date_from={d_from}&date_to={d_to}&filter={encoded}",
            f"4. STATISTICS (orders) за {d_from}-{d_to} — affiliate_id={aff_id}"
        )

        # ═══════════════════════════════════════════════════════
        # 5. POST /owners/new  — пробуем (ожидаем ошибку, просто смотрим формат)
        # ═══════════════════════════════════════════════════════
        await test_endpoint(
            session, "POST",
            f"{BASE_V1_NEW}/owners/new",
            "5. POST /owners/new (пустой body — проверка формата ответа)",
            body={}
        )

        # ═══════════════════════════════════════════════════════
        # 6. Дополнительно: проверим orders с параметрами
        # ═══════════════════════════════════════════════════════
        await test_endpoint(
            session, "GET",
            f"{BASE_V1_NEW}/affiliates/{aff_id}/hl-orders?page=1&per_page=5",
            f"6. HL-ORDERS с пагинацией (page=1, per_page=5) — affiliate_id={aff_id}"
        )


if __name__ == "__main__":
    asyncio.run(main())
