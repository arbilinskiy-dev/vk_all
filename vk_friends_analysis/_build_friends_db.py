"""
Сборка полной базы данных друзей и подписчиков ВКонтакте.
Результат:
  - friends_db.sqlite  — SQLite-база со всеми данными
  - friends_db.html    — HTML-таблица с сортировкой и фильтрами (открывается в браузере)

Колонки:
  vk_id, ссылка, ФИО, роль (друг/подписчик), 
  статус аккаунта (активен/забанен/удалён), 
  последний раз онлайн, есть ли диалог
"""
import requests
import time
import sqlite3
import os
from datetime import datetime

TOKEN = "vk1.a.MepRLhKDuFBN9Nzggi2iPturCVl1QdXuwAVlHGKeL0WVjLWart-cXKQwPavxJU8QMYOO34qSoMBQi0IglOP0hXIGe7BTxMvFb-PaxQgkXDtyI3barOwHH5DHAkqS5mZq7WDilWo8gAN1HZTCGvUFQo-krGv0m3NlYpd10I3lz94hdlpUSnEAlNciaSmX6AUTSwMAqBn-uKslwMScvGsZ0Q"

DB_PATH = os.path.join(os.path.dirname(__file__), "friends_db.sqlite")
HTML_PATH = os.path.join(os.path.dirname(__file__), "friends_db.html")


# ── VK API helpers ──────────────────────────────────────────

def api_get(method, params):
    params["v"] = "5.199"
    params["access_token"] = TOKEN
    resp = requests.get(f"https://api.vk.com/method/{method}", params=params)
    return resp.json()

def api_post(method, data):
    data["v"] = "5.199"
    data["access_token"] = TOKEN
    resp = requests.post(f"https://api.vk.com/method/{method}", data=data)
    return resp.json()

def ts_to_str(ts):
    if not ts:
        return None
    return datetime.fromtimestamp(ts).strftime("%d.%m.%Y %H:%M")


# ── Шаг 1: Друзья (ID → данные) ───────────────────────────

print("=" * 60)
print("СБОРКА БАЗЫ ДАННЫХ ДРУЗЕЙ / ПОДПИСЧИКОВ")
print("=" * 60)

resp = api_get("users.get", {"fields": "counters"})
me = resp["response"][0]
counters = me.get("counters", {})
print(f"Пользователь: {me['first_name']} {me['last_name']} (id{me['id']})")
print(f"Друзей: {counters.get('friends', '?')}  |  Подписчиков: {counters.get('followers', '?')}")
print()

# -- Все ID друзей --
print("[1/4] Загрузка ID друзей...")
all_friend_ids = []
offset = 0
while True:
    data = api_post("friends.get", {"offset": offset, "count": 5000})
    if "error" in data:
        print(f"  ОШИБКА: {data['error']}")
        break
    total = data["response"]["count"]
    ids = data["response"]["items"]
    all_friend_ids.extend(ids)
    offset += 5000
    if offset >= total or not ids:
        break
    time.sleep(0.34)
print(f"  Получено ID: {len(all_friend_ids)}")

# -- Данные друзей батчами по 500 --
print("  Загрузка данных друзей...")
friend_data = {}
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
                "first_name": u.get("first_name", ""),
                "last_name": u.get("last_name", ""),
                "domain": u.get("domain", f'id{u["id"]}'),
                "deactivated": u.get("deactivated"),
                "last_seen_ts": ls.get("time"),
            }
    loaded = min(i + 500, len(all_friend_ids))
    print(f"  ... {loaded} / {len(all_friend_ids)}")
    time.sleep(0.34)
print(f"  Загружено друзей: {len(friend_data)}")
print()


# ── Шаг 2: Подписчики ──────────────────────────────────────

print("[2/4] Загрузка подписчиков...")
follower_ids = []
f_offset = 0
while True:
    data = api_get("users.getFollowers", {"count": 1000, "offset": f_offset})
    if "error" in data:
        print(f"  ОШИБКА: {data['error']}")
        break
    f_total = data["response"]["count"]
    ids = data["response"]["items"]
    follower_ids.extend(ids)
    f_offset += 1000
    if f_offset >= f_total or not ids:
        break
    time.sleep(0.34)
print(f"  ID подписчиков: {len(follower_ids)}")

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
                "first_name": u.get("first_name", ""),
                "last_name": u.get("last_name", ""),
                "domain": u.get("domain", f'id{u["id"]}'),
                "deactivated": u.get("deactivated"),
                "last_seen_ts": ls.get("time"),
            }
    loaded = min(i + 500, len(follower_ids))
    print(f"  ... {loaded} / {len(follower_ids)}")
    time.sleep(0.34)
print(f"  Загружено подписчиков: {len(follower_data)}")
print()


# ── Шаг 3: Диалоги ─────────────────────────────────────────

print("[3/4] Загрузка диалогов...")
conversation_peers = set()
conv_offset = 0
conv_total = None

while True:
    data = api_get("messages.getConversations", {
        "count": 200, "offset": conv_offset, "extended": 0
    })
    if "error" in data:
        print(f"  ОШИБКА: {data['error']}")
        break
    if conv_total is None:
        conv_total = data["response"]["count"]
        print(f"  Всего диалогов: {conv_total}")
    items = data["response"]["items"]
    for item in items:
        peer = item.get("conversation", {}).get("peer", {})
        if peer.get("type") == "user":
            conversation_peers.add(peer["id"])
    conv_offset += 200
    print(f"  Обработано: {conv_offset} / {conv_total}  (личных: {len(conversation_peers)})")
    if conv_offset >= conv_total or not items:
        break
    time.sleep(0.34)
print(f"  Личных диалогов: {len(conversation_peers)}")
print()


# ── Шаг 4: Сохранение в SQLite ─────────────────────────────

print("[4/4] Сохранение в SQLite...")

friend_ids_set = set(friend_data.keys())
follower_ids_set = set(follower_data.keys())
# «Чистые» подписчики — те, кто не в друзьях
pure_follower_ids = follower_ids_set - friend_ids_set

# Удаляем старую БД если есть
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("""
CREATE TABLE users (
    vk_id          INTEGER PRIMARY KEY,
    link           TEXT,
    first_name     TEXT,
    last_name      TEXT,
    full_name      TEXT,
    role           TEXT,       -- 'друг' / 'подписчик' / 'друг+подписчик'
    account_status TEXT,       -- 'активен' / 'забанен' / 'удалён'
    last_seen_ts   INTEGER,
    last_seen_str  TEXT,
    has_dialog     INTEGER     -- 1/0
)
""")

rows = []

# Друзья
for uid, info in friend_data.items():
    deact = info["deactivated"]
    if deact == "banned":
        acc = "забанен"
    elif deact == "deleted":
        acc = "удалён"
    else:
        acc = "активен"
    
    role = "друг+подписчик" if uid in follower_ids_set else "друг"
    
    rows.append((
        uid,
        f"https://vk.com/{info['domain']}",
        info["first_name"],
        info["last_name"],
        f"{info['first_name']} {info['last_name']}",
        role,
        acc,
        info["last_seen_ts"],
        ts_to_str(info["last_seen_ts"]),
        1 if uid in conversation_peers else 0,
    ))

# Чистые подписчики (не в друзьях)
for uid in pure_follower_ids:
    info = follower_data[uid]
    deact = info["deactivated"]
    if deact == "banned":
        acc = "забанен"
    elif deact == "deleted":
        acc = "удалён"
    else:
        acc = "активен"
    
    rows.append((
        uid,
        f"https://vk.com/{info['domain']}",
        info["first_name"],
        info["last_name"],
        f"{info['first_name']} {info['last_name']}",
        "подписчик",
        acc,
        info["last_seen_ts"],
        ts_to_str(info["last_seen_ts"]),
        1 if uid in conversation_peers else 0,
    ))

cur.executemany("""
INSERT INTO users (vk_id, link, first_name, last_name, full_name, role, account_status, last_seen_ts, last_seen_str, has_dialog)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", rows)

conn.commit()
print(f"  Записей в БД: {len(rows)}")

# Создаём индексы для быстрых фильтров
cur.execute("CREATE INDEX idx_role ON users(role)")
cur.execute("CREATE INDEX idx_status ON users(account_status)")
cur.execute("CREATE INDEX idx_dialog ON users(has_dialog)")
cur.execute("CREATE INDEX idx_last_seen ON users(last_seen_ts)")
conn.commit()


# ── Статистика ──────────────────────────────────────────────

stats = {}
for label, sql in [
    ("Всего записей", "SELECT COUNT(*) FROM users"),
    ("Друзей", "SELECT COUNT(*) FROM users WHERE role LIKE '%друг%'"),
    ("Подписчиков (не друг)", "SELECT COUNT(*) FROM users WHERE role = 'подписчик'"),
    ("Друг+подписчик", "SELECT COUNT(*) FROM users WHERE role = 'друг+подписчик'"),
    ("Активных", "SELECT COUNT(*) FROM users WHERE account_status = 'активен'"),
    ("Забаненных", "SELECT COUNT(*) FROM users WHERE account_status = 'забанен'"),
    ("Удалённых", "SELECT COUNT(*) FROM users WHERE account_status = 'удалён'"),
    ("С диалогом", "SELECT COUNT(*) FROM users WHERE has_dialog = 1"),
    ("Без диалога", "SELECT COUNT(*) FROM users WHERE has_dialog = 0"),
]:
    cur.execute(sql)
    val = cur.fetchone()[0]
    stats[label] = val
    print(f"  {label}: {val}")

conn.close()
print()
print(f"  SQLite: {DB_PATH}")


# ── Генерация HTML-просмотрщика ─────────────────────────────

print("Генерация HTML-таблицы...")

# Сортируем: друзья первые, потом подписчики; внутри — по имени
rows.sort(key=lambda r: (0 if "друг" in r[5] else 1, r[4]))

html_rows = ""
for r in rows:
    vk_id, link, fn, ln, full, role, acc, ls_ts, ls_str, has_d = r
    
    # Цветовая маркировка статуса
    if acc == "забанен":
        status_badge = '<span class="badge bg-danger">забанен</span>'
    elif acc == "удалён":
        status_badge = '<span class="badge bg-warning text-dark">удалён</span>'
    else:
        status_badge = '<span class="badge bg-success">активен</span>'
    
    # Роль
    if role == "друг+подписчик":
        role_badge = '<span class="badge bg-primary">друг+подписчик</span>'
    elif role == "друг":
        role_badge = '<span class="badge bg-info text-dark">друг</span>'
    else:
        role_badge = '<span class="badge bg-secondary">подписчик</span>'
    
    dialog_icon = "✅" if has_d else "—"
    ls_display = ls_str if ls_str else "—"
    ls_sort = ls_ts if ls_ts else 0

    html_rows += f"""<tr>
  <td>{vk_id}</td>
  <td><a href="{link}" target="_blank">{link}</a></td>
  <td>{full}</td>
  <td data-role="{role}">{role_badge}</td>
  <td data-status="{acc}">{status_badge}</td>
  <td data-sort="{ls_sort}">{ls_display}</td>
  <td data-dialog="{has_d}">{dialog_icon}</td>
</tr>
"""

html = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Друзья и подписчики ВК — {me['first_name']} {me['last_name']}</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<style>
  body {{ font-family: system-ui, -apple-system, sans-serif; background: #f8f9fa; padding: 20px; }}
  .table-container {{ background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.08); }}
  table {{ font-size: 13px; }}
  th {{ cursor: pointer; user-select: none; white-space: nowrap; }}
  th:hover {{ background: #e9ecef; }}
  .badge {{ font-size: 11px; }}
  .filters {{ margin-bottom: 16px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }}
  .filters select, .filters input {{ font-size: 13px; }}
  .stats {{ display: flex; gap: 24px; margin-bottom: 16px; flex-wrap: wrap; }}
  .stat-card {{ background: #f1f3f5; border-radius: 8px; padding: 8px 16px; }}
  .stat-card .num {{ font-size: 20px; font-weight: 700; }}
  .stat-card .lbl {{ font-size: 11px; color: #666; }}
  #count {{ font-weight: 700; }}
  a {{ color: #2a5885; }}
  .sort-asc::after {{ content: " ▲"; }}
  .sort-desc::after {{ content: " ▼"; }}
</style>
</head>
<body>
<div class="container-fluid">
  <h4 class="mb-1">Друзья и подписчики ВК</h4>
  <p class="text-muted mb-3">{me['first_name']} {me['last_name']} (id{me['id']}) &mdash; собрано {datetime.now().strftime('%d.%m.%Y %H:%M')}</p>

  <div class="stats">
    <div class="stat-card"><div class="num">{stats['Всего записей']}</div><div class="lbl">всего</div></div>
    <div class="stat-card"><div class="num">{stats['Друзей']}</div><div class="lbl">друзей</div></div>
    <div class="stat-card"><div class="num">{stats['Подписчиков (не друг)']}</div><div class="lbl">подписчиков</div></div>
    <div class="stat-card"><div class="num">{stats['Активных']}</div><div class="lbl">активных</div></div>
    <div class="stat-card"><div class="num">{stats['Забаненных']}</div><div class="lbl">забанено</div></div>
    <div class="stat-card"><div class="num">{stats['Удалённых']}</div><div class="lbl">удалено</div></div>
    <div class="stat-card"><div class="num">{stats['С диалогом']}</div><div class="lbl">с диалогом</div></div>
  </div>

  <div class="filters">
    <div>
      <label class="form-label mb-0 small">Роль</label>
      <select id="fRole" class="form-select form-select-sm">
        <option value="">Все</option>
        <option value="друг">Друг</option>
        <option value="подписчик">Подписчик</option>
        <option value="друг+подписчик">Друг+подписчик</option>
      </select>
    </div>
    <div>
      <label class="form-label mb-0 small">Статус</label>
      <select id="fStatus" class="form-select form-select-sm">
        <option value="">Все</option>
        <option value="активен">Активен</option>
        <option value="забанен">Забанен</option>
        <option value="удалён">Удалён</option>
      </select>
    </div>
    <div>
      <label class="form-label mb-0 small">Диалог</label>
      <select id="fDialog" class="form-select form-select-sm">
        <option value="">Все</option>
        <option value="1">Есть</option>
        <option value="0">Нет</option>
      </select>
    </div>
    <div>
      <label class="form-label mb-0 small">Поиск</label>
      <input id="fSearch" class="form-control form-control-sm" placeholder="Имя, ID..." style="width:220px;">
    </div>
    <div class="ms-auto align-self-end">
      <span>Показано: <span id="count">0</span></span>
    </div>
  </div>

  <div class="table-container">
    <table class="table table-sm table-hover table-striped mb-0" id="tbl">
      <thead class="table-light">
        <tr>
          <th data-col="0" data-type="num">VK ID</th>
          <th data-col="1">Ссылка</th>
          <th data-col="2">ФИО</th>
          <th data-col="3">Роль</th>
          <th data-col="4">Статус</th>
          <th data-col="5" data-type="num">Последний раз онлайн</th>
          <th data-col="6">Диалог</th>
        </tr>
      </thead>
      <tbody>
{html_rows}
      </tbody>
    </table>
  </div>
</div>

<script>
// Фильтрация
const tbl = document.getElementById('tbl');
const tbody = tbl.querySelector('tbody');
const allRows = Array.from(tbody.querySelectorAll('tr'));
const fRole = document.getElementById('fRole');
const fStatus = document.getElementById('fStatus');
const fDialog = document.getElementById('fDialog');
const fSearch = document.getElementById('fSearch');
const countEl = document.getElementById('count');

function applyFilters() {{
  const role = fRole.value;
  const status = fStatus.value;
  const dialog = fDialog.value;
  const search = fSearch.value.toLowerCase();
  let shown = 0;
  allRows.forEach(row => {{
    const cells = row.children;
    const rRole = cells[3].dataset.role;
    const rStatus = cells[4].dataset.status;
    const rDialog = cells[6].dataset.dialog;
    const text = row.textContent.toLowerCase();
    
    let vis = true;
    if (role && !rRole.includes(role)) vis = false;
    if (status && rStatus !== status) vis = false;
    if (dialog && rDialog !== dialog) vis = false;
    if (search && !text.includes(search)) vis = false;
    
    row.style.display = vis ? '' : 'none';
    if (vis) shown++;
  }});
  countEl.textContent = shown;
}}

fRole.addEventListener('change', applyFilters);
fStatus.addEventListener('change', applyFilters);
fDialog.addEventListener('change', applyFilters);
fSearch.addEventListener('input', applyFilters);

// Сортировка по клику на заголовок
let sortCol = -1, sortDir = 1;
tbl.querySelector('thead').addEventListener('click', (e) => {{
  const th = e.target.closest('th');
  if (!th) return;
  const col = parseInt(th.dataset.col);
  const type = th.dataset.type || 'str';
  
  if (sortCol === col) {{ sortDir *= -1; }}
  else {{ sortCol = col; sortDir = 1; }}
  
  // Обновить стрелки
  tbl.querySelectorAll('th').forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
  th.classList.add(sortDir === 1 ? 'sort-asc' : 'sort-desc');
  
  allRows.sort((a, b) => {{
    let va, vb;
    if (col === 5) {{
      va = parseFloat(a.children[col].dataset.sort) || 0;
      vb = parseFloat(b.children[col].dataset.sort) || 0;
    }} else if (type === 'num') {{
      va = parseFloat(a.children[col].textContent) || 0;
      vb = parseFloat(b.children[col].textContent) || 0;
    }} else {{
      va = a.children[col].textContent.toLowerCase();
      vb = b.children[col].textContent.toLowerCase();
    }}
    if (va < vb) return -1 * sortDir;
    if (va > vb) return 1 * sortDir;
    return 0;
  }});
  
  allRows.forEach(r => tbody.appendChild(r));
}});

// Начальное отображение
applyFilters();
</script>
</body>
</html>
"""

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html)

print(f"  HTML: {HTML_PATH}")
print()
print("=" * 60)
print("ГОТОВО!")
print(f"  SQLite: {DB_PATH}")
print(f"  HTML:   {HTML_PATH}")
print("=" * 60)
