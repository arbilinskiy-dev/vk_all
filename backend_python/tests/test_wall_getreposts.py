"""
Тест wall.getReposts для поста https://vk.com/wall-203623179_16129
Сравниваем ответ с сервисным ключом и пользовательским токеном.
Запуск: python tests/test_wall_getreposts.py
"""
import sys, os, json, datetime
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from config import settings

OWNER_ID = -203623179
POST_ID = 16129
VK_API_URL = "https://api.vk.com/method/wall.getReposts"
VK_API_VERSION = "5.199"


def test_get_reposts(token: str, label: str):
    print(f"\n--- {label} ---")
    resp = requests.post(VK_API_URL, data={
        "owner_id": OWNER_ID,
        "post_id": POST_ID,
        "count": 50,
        "access_token": token,
        "v": VK_API_VERSION,
    }, timeout=15)
    data = resp.json()

    if "error" in data:
        err = data["error"]
        print(f"  ОШИБКА code={err.get('error_code')}: {err.get('error_msg')}")
        return

    response = data.get("response", {})
    items = response.get("items", [])
    profiles = response.get("profiles", [])
    groups = response.get("groups", [])

    print(f"  count (total): {response.get('count', '?')}")
    print(f"  items (returned): {len(items)}")
    print(f"  profiles: {len(profiles)}")
    print(f"  groups: {len(groups)}")

    if items:
        print("\n  Репосты (первые 10):")
        for i, item in enumerate(items[:10]):
            from_id = item.get("from_id", "?")
            date_ts = item.get("date", 0)
            date_str = datetime.datetime.fromtimestamp(date_ts).strftime("%Y-%m-%d %H:%M") if date_ts else "?"
            text = item.get("text", "")
            text_preview = (text[:80] + "...") if len(text) > 80 else text
            print(f"    [{i+1}] from_id={from_id}, date={date_str}, text={text_preview!r}")

    if profiles:
        print("\n  Профили (первые 10):")
        for p in profiles[:10]:
            print(f"    id={p.get('id')}, {p.get('first_name')} {p.get('last_name')}")

    if groups:
        print("\n  Группы (первые 5):")
        for g in groups[:5]:
            print(f"    id={g.get('id')}, name={g.get('name')}")

    return response


def main():
    print("=" * 60)
    print(f"ТЕСТ: wall.getReposts для wall{OWNER_ID}_{POST_ID}")
    print("=" * 60)

    # 1. Сервисный ключ
    if settings.vk_service_key:
        r1 = test_get_reposts(settings.vk_service_key, "1. Сервисный ключ (VK_SERVICE_KEY)")
    else:
        print("\n--- 1. VK_SERVICE_KEY не задан, пропускаем ---")
        r1 = None

    # 2. Пользовательский токен
    r2 = test_get_reposts(settings.vk_user_token, "2. Пользовательский токен (vk_user_token)")

    # Сравнение
    print("\n" + "=" * 60)
    print("СРАВНЕНИЕ РЕЗУЛЬТАТОВ:")
    if r1 and r2:
        c1 = r1.get("count", 0)
        c2 = r2.get("count", 0)
        print(f"  Service key count: {c1}")
        print(f"  User token count:  {c2}")
        if c1 == c2:
            print("  ✅ Количество совпадает")
        else:
            print(f"  ⚠️ Разница: service={c1}, user={c2}")

        ids1 = set(item.get("from_id") for item in r1.get("items", []))
        ids2 = set(item.get("from_id") for item in r2.get("items", []))
        only_service = ids1 - ids2
        only_user = ids2 - ids1
        if only_service:
            print(f"  Только в service key: {only_service}")
        if only_user:
            print(f"  Только в user token: {only_user}")
        if not only_service and not only_user:
            print("  ✅ Одинаковые from_id")
    elif r1:
        print("  Только сервисный ключ вернул данные")
    elif r2:
        print("  Только пользовательский токен вернул данные")
    else:
        print("  ❌ Оба запроса не вернули данных")

    print("=" * 60)


if __name__ == "__main__":
    main()
