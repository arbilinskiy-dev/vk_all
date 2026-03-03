"""Скрипт проверки друзей + подписчиков ВК: забаненные и удалённые (через execute для >5000)"""
import requests
import time
import json

TOKEN = "vk1.a.MepRLhKDuFBN9Nzggi2iPturCVl1QdXuwAVlHGKeL0WVjLWart-cXKQwPavxJU8QMYOO34qSoMBQi0IglOP0hXIGe7BTxMvFb-PaxQgkXDtyI3barOwHH5DHAkqS5mZq7WDilWo8gAN1HZTCGvUFQo-krGv0m3NlYpd10I3lz94hdlpUSnEAlNciaSmX6AUTSwMAqBn-uKslwMScvGsZ0Q"

# === Шаг 0: Информация о странице ===
print("=== Информация о странице ===")
resp = requests.get("https://api.vk.com/method/users.get", params={
    "fields": "counters",
    "v": "5.199",
    "access_token": TOKEN
})
user_data = resp.json()
if "response" in user_data and user_data["response"]:
    u = user_data["response"][0]
    counters = u.get("counters", {})
    print(f"Пользователь: {u.get('first_name')} {u.get('last_name')} (id{u['id']})")
    print(f"Друзей (по counters): {counters.get('friends', '?')}")
    print(f"Подписчиков (по counters): {counters.get('followers', '?')}")
print()

# === Шаг 1: Получаем всех друзей через execute (VKScript) ===
# Сначала узнаём точное количество друзей (без fields — count не ограничен 5000)
print("=== Загрузка друзей (через execute) ===")

# Получаем только ID — без лимита 5000
resp = requests.post("https://api.vk.com/method/friends.get", data={
    "v": "5.199",
    "access_token": TOKEN
})
data = resp.json()
if "error" in data:
    print("ОШИБКА:", data["error"])
    exit()

total_friends = data["response"]["count"]
all_friend_ids = data["response"]["items"]
print(f"Всего друзей (только ID): {total_friends}, получено ID: {len(all_friend_ids)}")

# Если ID < total — пагинируем
if len(all_friend_ids) < total_friends:
    offset = len(all_friend_ids)
    while offset < total_friends:
        resp = requests.post("https://api.vk.com/method/friends.get", data={
            "offset": offset,
            "count": 5000,
            "v": "5.199",
            "access_token": TOKEN
        })
        data = resp.json()
        if "error" in data:
            print("ОШИБКА:", data["error"])
            break
        items = data["response"]["items"]
        all_friend_ids.extend(items)
        offset += 5000
        print(f"  ID загружено: {len(all_friend_ids)} / {total_friends}")
        time.sleep(0.35)

print(f"Итого ID друзей: {len(all_friend_ids)}")

# Получаем данные о друзьях батчами по 500 через users.get (POST)
print(f"Загружаю данные о {len(all_friend_ids)} друзьях...")
all_items = []
for i in range(0, len(all_friend_ids), 500):
    chunk = all_friend_ids[i:i+500]
    resp = requests.post("https://api.vk.com/method/users.get", data={
        "user_ids": ",".join(str(x) for x in chunk),
        "fields": "deactivated,first_name,last_name,domain",
        "v": "5.199",
        "access_token": TOKEN
    })
    data = resp.json()
    if "response" in data:
        all_items.extend(data["response"])
    print(f"  Данные: {len(all_items)} / {len(all_friend_ids)}")
    time.sleep(0.35)

print()

banned = [u for u in all_items if u.get("deactivated") == "banned"]
deleted = [u for u in all_items if u.get("deactivated") == "deleted"]
active = len(all_items) - len(banned) - len(deleted)

total = total_friends
print(f"=== Друзья страницы ===")
print(f"Всего друзей: {total}")
print(f"Загружено: {len(all_items)}")
print(f"Активных: {active}")
print(f"Забаненных (banned): {len(banned)}")
print(f"Удалённых (deleted): {len(deleted)}")
print()

if banned:
    print("--- Забаненные пользователи ---")
    for i, u in enumerate(banned, 1):
        uid = u["id"]
        name = f'{u["first_name"]} {u["last_name"]}'
        domain = u.get("domain", f"id{uid}")
        print(f"  {i}. id{uid} — {name} (vk.com/{domain})")
    print()

if deleted:
    print("--- Удалённые пользователи ---")
    for i, u in enumerate(deleted, 1):
        uid = u["id"]
        name = f'{u["first_name"]} {u["last_name"]}'
        domain = u.get("domain", f"id{uid}")
        print(f"  {i}. id{uid} — {name} (vk.com/{domain})")

# === Шаг 2: Подписчики с пагинацией ===
print()
print("=" * 50)
print("=== Загрузка подписчиков (followers) ===")
follower_ids_all = []
f_offset = 0
f_total = None
F_BATCH = 1000

while True:
    resp = requests.get("https://api.vk.com/method/users.getFollowers", params={
        "count": F_BATCH,
        "offset": f_offset,
        "v": "5.199",
        "access_token": TOKEN
    })
    data = resp.json()
    if "error" in data:
        print("ОШИБКА followers:", data["error"])
        break
    if f_total is None:
        f_total = data["response"]["count"]
        print(f"Всего подписчиков: {f_total}. Загружаю ID...")
    ids = data["response"]["items"]
    follower_ids_all.extend(ids)
    f_offset += F_BATCH
    print(f"  Загружено ID: {len(follower_ids_all)} / {f_total}")
    if f_offset >= f_total or len(ids) == 0:
        break
    time.sleep(0.35)

# Получаем инфо о подписчиках батчами по 500 (users.get POST)
print(f"\nЗагружаю данные о {len(follower_ids_all)} подписчиках...")
follower_items = []
for i in range(0, len(follower_ids_all), 500):
    chunk = follower_ids_all[i:i+500]
    resp = requests.post("https://api.vk.com/method/users.get", data={
        "user_ids": ",".join(str(x) for x in chunk),
        "fields": "deactivated,first_name,last_name,domain",
        "v": "5.199",
        "access_token": TOKEN
    })
    data = resp.json()
    if "response" in data:
        follower_items.extend(data["response"])
    print(f"  Данные: {len(follower_items)} / {len(follower_ids_all)}")
    time.sleep(0.35)

f_banned = [u for u in follower_items if u.get("deactivated") == "banned"]
f_deleted = [u for u in follower_items if u.get("deactivated") == "deleted"]
f_active = len(follower_items) - len(f_banned) - len(f_deleted)

print()
print(f"=== Подписчики страницы ===")
print(f"Всего подписчиков: {f_total}")
print(f"Загружено: {len(follower_items)}")
print(f"Активных: {f_active}")
print(f"Забаненных (banned): {len(f_banned)}")
print(f"Удалённых (deleted): {len(f_deleted)}")
print()

if f_banned:
    print("--- Забаненные подписчики ---")
    for i, u in enumerate(f_banned, 1):
        uid = u["id"]
        name = f'{u["first_name"]} {u["last_name"]}'
        domain = u.get("domain", f"id{uid}")
        print(f"  {i}. id{uid} — {name} (vk.com/{domain})")
    print()

if f_deleted:
    print("--- Удалённые подписчики ---")
    for i, u in enumerate(f_deleted, 1):
        uid = u["id"]
        name = f'{u["first_name"]} {u["last_name"]}'
        domain = u.get("domain", f"id{uid}")
        print(f"  {i}. id{uid} — {name} (vk.com/{domain})")

# Общая сводка
print()
print("=" * 50)
print("=== ИТОГОВАЯ СВОДКА ===")
print(f"Друзей: {total} (banned={len(banned)}, deleted={len(deleted)}, active={active})")
print(f"Подписчиков: {f_total} (banned={len(f_banned)}, deleted={len(f_deleted)}, active={f_active})")
print(f"ВСЕГО друзей + подписчиков: {(total or 0) + (f_total or 0)}")
