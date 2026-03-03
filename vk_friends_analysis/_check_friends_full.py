"""
Полный анализ друзей и подписчиков:
- last_seen (когда был онлайн)
- есть ли переписка
- статус аккаунта (активен/забанен/удалён)
Результат — итоговая таблица
"""
import requests
import time
import json
from datetime import datetime

TOKEN = "vk1.a.MepRLhKDuFBN9Nzggi2iPturCVl1QdXuwAVlHGKeL0WVjLWart-cXKQwPavxJU8QMYOO34qSoMBQi0IglOP0hXIGe7BTxMvFb-PaxQgkXDtyI3barOwHH5DHAkqS5mZq7WDilWo8gAN1HZTCGvUFQo-krGv0m3NlYpd10I3lz94hdlpUSnEAlNciaSmX6AUTSwMAqBn-uKslwMScvGsZ0Q"

def api_get(method, params):
    """GET запрос к VK API"""
    params["v"] = "5.199"
    params["access_token"] = TOKEN
    resp = requests.get(f"https://api.vk.com/method/{method}", params=params)
    return resp.json()

def api_post(method, data):
    """POST запрос к VK API"""
    data["v"] = "5.199"
    data["access_token"] = TOKEN
    resp = requests.post(f"https://api.vk.com/method/{method}", data=data)
    return resp.json()

def ts_to_str(ts):
    """Unix timestamp → строка даты"""
    if not ts:
        return "—"
    return datetime.fromtimestamp(ts).strftime("%d.%m.%Y %H:%M")

def days_ago(ts):
    """Сколько дней назад от сейчас"""
    if not ts:
        return None
    return (datetime.now() - datetime.fromtimestamp(ts)).days

# ===========================================================
# Шаг 1: Информация о странице
# ===========================================================
print("=" * 60)
print("ПОЛНЫЙ АНАЛИЗ ДРУЗЕЙ И ПОДПИСЧИКОВ")
print("=" * 60)

resp = api_get("users.get", {"fields": "counters"})
me = resp["response"][0]
counters = me.get("counters", {})
print(f"Пользователь: {me['first_name']} {me['last_name']} (id{me['id']})")
print(f"Друзей: {counters.get('friends', '?')}")
print(f"Подписчиков: {counters.get('followers', '?')}")
print()

# ===========================================================
# Шаг 2: Загрузка всех друзей (ID + данные)
# ===========================================================
print("[1/3] Загрузка друзей...")

# Получаем все ID друзей (без лимита 5000 на fields)
all_friend_ids = []
offset = 0
while True:
    data = api_post("friends.get", {"offset": offset, "count": 5000})
    if "error" in data:
        print("  ОШИБКА friends.get:", data["error"])
        break
    total_friends = data["response"]["count"]
    ids = data["response"]["items"]
    all_friend_ids.extend(ids)
    offset += 5000
    if offset >= total_friends or len(ids) == 0:
        break
    time.sleep(0.3)

print(f"  ID друзей: {len(all_friend_ids)} / {total_friends}")

# Получаем данные (имя, last_seen, deactivated) батчами по 500
friend_data = {}  # id -> {name, last_seen_ts, last_seen_str, deactivated, platform}
for i in range(0, len(all_friend_ids), 500):
    chunk = all_friend_ids[i:i+500]
    data = api_post("users.get", {
        "user_ids": ",".join(str(x) for x in chunk),
        "fields": "deactivated,first_name,last_name,last_seen,domain"
    })
    if "response" in data:
        for u in data["response"]:
            ls = u.get("last_seen", {})
            friend_data[u["id"]] = {
                "name": f'{u.get("first_name", "?")} {u.get("last_name", "?")}',
                "domain": u.get("domain", f'id{u["id"]}'),
                "deactivated": u.get("deactivated"),
                "last_seen_ts": ls.get("time"),
                "last_seen_str": ts_to_str(ls.get("time")),
                "last_seen_days": days_ago(ls.get("time")),
                "platform": ls.get("platform"),
            }
    print(f"  Данные друзей: {len(friend_data)} / {len(all_friend_ids)}")
    time.sleep(0.3)

print(f"  Загружено друзей: {len(friend_data)}")
print()

# ===========================================================
# Шаг 3: Загрузка подписчиков
# ===========================================================
print("[2/3] Загрузка подписчиков...")

follower_ids = []
f_offset = 0
f_total = 0
while True:
    data = api_get("users.getFollowers", {"count": 1000, "offset": f_offset})
    if "error" in data:
        print("  ОШИБКА followers:", data["error"])
        break
    f_total = data["response"]["count"]
    ids = data["response"]["items"]
    follower_ids.extend(ids)
    f_offset += 1000
    if f_offset >= f_total or len(ids) == 0:
        break
    time.sleep(0.3)

print(f"  ID подписчиков: {len(follower_ids)} / {f_total}")

follower_data = {}
for i in range(0, len(follower_ids), 500):
    chunk = follower_ids[i:i+500]
    data = api_post("users.get", {
        "user_ids": ",".join(str(x) for x in chunk),
        "fields": "deactivated,first_name,last_name,last_seen,domain"
    })
    if "response" in data:
        for u in data["response"]:
            ls = u.get("last_seen", {})
            follower_data[u["id"]] = {
                "name": f'{u.get("first_name", "?")} {u.get("last_name", "?")}',
                "domain": u.get("domain", f'id{u["id"]}'),
                "deactivated": u.get("deactivated"),
                "last_seen_ts": ls.get("time"),
                "last_seen_str": ts_to_str(ls.get("time")),
                "last_seen_days": days_ago(ls.get("time")),
                "platform": ls.get("platform"),
            }
    print(f"  Данные подписчиков: {len(follower_data)} / {len(follower_ids)}")
    time.sleep(0.3)

print(f"  Загружено подписчиков: {len(follower_data)}")
print()

# ===========================================================
# Шаг 4: Загрузка всех диалогов
# ===========================================================
print("[3/3] Загрузка диалогов (переписок)...")

conversation_peers = {}  # user_id -> {last_message_date, unread_count}
conv_offset = 0
conv_total = None
CONV_BATCH = 200

while True:
    data = api_get("messages.getConversations", {
        "count": CONV_BATCH,
        "offset": conv_offset,
        "extended": 0
    })
    if "error" in data:
        print(f"  ОШИБКА messages.getConversations: {data['error']}")
        break

    if conv_total is None:
        conv_total = data["response"]["count"]
        print(f"  Всего диалогов: {conv_total}")

    items = data["response"]["items"]
    for item in items:
        peer = item.get("conversation", {}).get("peer", {})
        if peer.get("type") == "user":
            user_id = peer["id"]
            last_msg = item.get("last_message", {})
            last_msg_ts = last_msg.get("date")
            unread = item.get("conversation", {}).get("unread_count", 0)
            conversation_peers[user_id] = {
                "last_msg_ts": last_msg_ts,
                "last_msg_str": ts_to_str(last_msg_ts),
                "last_msg_days": days_ago(last_msg_ts),
                "unread": unread,
            }

    conv_offset += CONV_BATCH
    print(f"  Обработано диалогов: {conv_offset} / {conv_total} (личных: {len(conversation_peers)})")

    if conv_offset >= conv_total or len(items) == 0:
        break
    time.sleep(0.3)

print(f"  Всего личных диалогов: {len(conversation_peers)}")
print()

# ===========================================================
# Шаг 5: Анализ и построение таблицы
# ===========================================================
print("=" * 60)
print("АНАЛИЗ ДАННЫХ")
print("=" * 60)

friend_ids_set = set(friend_data.keys())
follower_ids_set = set(follower_data.keys())
conv_ids_set = set(conversation_peers.keys())

# Друзья с перепиской
friends_with_conv = friend_ids_set & conv_ids_set
friends_no_conv = friend_ids_set - conv_ids_set

# Подписчики с перепиской (без друзей)
pure_followers = follower_ids_set - friend_ids_set
followers_with_conv = pure_followers & conv_ids_set
followers_no_conv = pure_followers - conv_ids_set

# Статистика по друзьям
f_banned = sum(1 for uid in friend_data if friend_data[uid]["deactivated"] == "banned")
f_deleted = sum(1 for uid in friend_data if friend_data[uid]["deactivated"] == "deleted")
f_active = len(friend_data) - f_banned - f_deleted

# Статистика last_seen друзей
f_ls_today = sum(1 for uid in friend_data if friend_data[uid]["last_seen_days"] is not None and friend_data[uid]["last_seen_days"] == 0)
f_ls_week = sum(1 for uid in friend_data if friend_data[uid]["last_seen_days"] is not None and friend_data[uid]["last_seen_days"] <= 7)
f_ls_month = sum(1 for uid in friend_data if friend_data[uid]["last_seen_days"] is not None and friend_data[uid]["last_seen_days"] <= 30)
f_ls_year = sum(1 for uid in friend_data if friend_data[uid]["last_seen_days"] is not None and friend_data[uid]["last_seen_days"] <= 365)
f_ls_never = sum(1 for uid in friend_data if friend_data[uid]["last_seen_ts"] is None)

# Статистика по подписчикам (без друзей)
s_banned = sum(1 for uid in pure_followers if follower_data[uid]["deactivated"] == "banned")
s_deleted = sum(1 for uid in pure_followers if follower_data[uid]["deactivated"] == "deleted")
s_active = len(pure_followers) - s_banned - s_deleted

print()
print("╔══════════════════════════════════════════════════════════╗")
print("║              ИТОГОВАЯ СВОДНАЯ ТАБЛИЦА                   ║")
print("╠══════════════════════════════════════════════════════════╣")
print(f"║ ДРУЗЬЯ                                                  ║")
print(f"║   Всего:                {len(friend_data):>8}                        ║")
print(f"║   Активных:             {f_active:>8}                        ║")
print(f"║   Забаненных:           {f_banned:>8}                        ║")
print(f"║   Удалённых:            {f_deleted:>8}                        ║")
print(f"║   С перепиской:         {len(friends_with_conv):>8}                        ║")
print(f"║   Без переписки:        {len(friends_no_conv):>8}                        ║")
print(f"╠══════════════════════════════════════════════════════════╣")
print(f"║ LAST SEEN (друзья)                                      ║")
print(f"║   Сегодня:              {f_ls_today:>8}                        ║")
print(f"║   За неделю:            {f_ls_week:>8}                        ║")
print(f"║   За месяц:             {f_ls_month:>8}                        ║")
print(f"║   За год:               {f_ls_year:>8}                        ║")
print(f"║   Нет данных:           {f_ls_never:>8}                        ║")
print(f"╠══════════════════════════════════════════════════════════╣")
print(f"║ ПОДПИСЧИКИ (не в друзьях)                               ║")
print(f"║   Всего:                {len(pure_followers):>8}                        ║")
print(f"║   Активных:             {s_active:>8}                        ║")
print(f"║   Забаненных:           {s_banned:>8}                        ║")
print(f"║   Удалённых:            {s_deleted:>8}                        ║")
print(f"║   С перепиской:         {len(followers_with_conv):>8}                        ║")
print(f"║   Без переписки:        {len(followers_no_conv):>8}                        ║")
print(f"╠══════════════════════════════════════════════════════════╣")
print(f"║ ПЕРЕПИСКИ                                               ║")
print(f"║   Всего личных диалогов:{len(conversation_peers):>8}                        ║")
print(f"║   С друзьями:           {len(friends_with_conv):>8}                        ║")
print(f"║   С подписчиками:       {len(followers_with_conv):>8}                        ║")
print(f"║   С НЕ друзьями/подп.:  {len(conv_ids_set - friend_ids_set - follower_ids_set):>8}                        ║")
print(f"╚══════════════════════════════════════════════════════════╝")

# ===========================================================
# Подробности: друзья с перепиской, отсортированные по дате последнего сообщения
# ===========================================================
print()
print("=" * 100)
print("ТОП-50 друзей с самой давней перепиской (давно не писали)")
print("=" * 100)
print(f"{'#':>4} {'Имя':<30} {'Статус':<10} {'Последнее сообщение':<22} {'Дней назад':>10} {'Last seen':<22}")
print("-" * 100)

friends_convs = []
for uid in friends_with_conv:
    fd = friend_data[uid]
    cd = conversation_peers[uid]
    friends_convs.append((uid, fd, cd))

# Сортируем по дате последнего сообщения (самые давние первые)
friends_convs.sort(key=lambda x: x[2]["last_msg_ts"] or 0)

for i, (uid, fd, cd) in enumerate(friends_convs[:50], 1):
    status = fd["deactivated"] or "активен"
    msg_days = cd["last_msg_days"]
    msg_days_str = str(msg_days) if msg_days is not None else "—"
    print(f"{i:>4} {fd['name']:<30} {status:<10} {cd['last_msg_str']:<22} {msg_days_str:>10} {fd['last_seen_str']:<22}")

# Друзья БЕЗ переписки, давно не были онлайн
print()
print("=" * 100)
print("ТОП-50 друзей БЕЗ переписки, давно не были онлайн")
print("=" * 100)
print(f"{'#':>4} {'Имя':<30} {'Статус':<10} {'Last seen':<22} {'Дней оффлайн':>12}")
print("-" * 100)

friends_no_conv_list = []
for uid in friends_no_conv:
    fd = friend_data[uid]
    friends_no_conv_list.append((uid, fd))

# Сортируем по last_seen (самые давние первые), None — в конец
friends_no_conv_list.sort(key=lambda x: x[1]["last_seen_ts"] or 0)

for i, (uid, fd) in enumerate(friends_no_conv_list[:50], 1):
    status = fd["deactivated"] or "активен"
    ls_days = fd["last_seen_days"]
    ls_days_str = str(ls_days) if ls_days is not None else "—"
    print(f"{i:>4} {fd['name']:<30} {status:<10} {fd['last_seen_str']:<22} {ls_days_str:>12}")

# Забаненные друзья с перепиской
print()
print("=" * 100)
print("Забаненные/удалённые друзья, с которыми ЕСТЬ переписка")
print("=" * 100)
print(f"{'#':>4} {'Имя':<30} {'Статус':<10} {'Последнее сообщение':<22} {'Дней назад':>10}")
print("-" * 100)

banned_with_conv = [(uid, friend_data[uid], conversation_peers[uid])
                    for uid in friends_with_conv
                    if friend_data[uid]["deactivated"] in ("banned", "deleted")]
banned_with_conv.sort(key=lambda x: x[2]["last_msg_ts"] or 0, reverse=True)

for i, (uid, fd, cd) in enumerate(banned_with_conv, 1):
    status = fd["deactivated"]
    msg_days = cd["last_msg_days"]
    msg_days_str = str(msg_days) if msg_days is not None else "—"
    print(f"{i:>4} {fd['name']:<30} {status:<10} {cd['last_msg_str']:<22} {msg_days_str:>10}")

print()
print("Готово!")
