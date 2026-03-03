"""
Скрипт миграции: перешифровка токенов со старого ключа на новый.
Старый ключ (predprod2): aq-sMA9Y6jhyssTJewDmpcAS_3Qu9rXq35wZjZdDV-Q=
Новый ключ (текущий):    uvdbj3CxWuPL3DfPbItfioOeG6ToOLfdwdlPQv6AqlE=
"""
import psycopg2
import json
from cryptography.fernet import Fernet, InvalidToken

DB_URL = "postgresql://user1:asd232asd232@c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net:6432/db1"
OLD_KEY = "aq-sMA9Y6jhyssTJewDmpcAS_3Qu9rXq35wZjZdDV-Q="
NEW_KEY = "uvdbj3CxWuPL3DfPbItfioOeG6ToOLfdwdlPQv6AqlE="

old_f = Fernet(OLD_KEY)
new_f = Fernet(NEW_KEY)

conn = psycopg2.connect(DB_URL)
conn.autocommit = False
cur = conn.cursor()

def re_encrypt(value):
    if not value or not value.startswith("gAAAAA"):
        return value, "skip"
    try:
        new_f.decrypt(value.encode())
        return value, "already_new"
    except InvalidToken:
        pass
    try:
        dec = old_f.decrypt(value.encode()).decode("utf-8")
        enc = new_f.encrypt(dec.encode("utf-8")).decode("utf-8")
        return enc, "migrated"
    except InvalidToken:
        return value, "unknown"
    except Exception as e:
        return value, "error"

# === 1. communityToken ===
print("=== communityToken ===")
cur.execute('SELECT id, name, "communityToken" FROM projects WHERE "communityToken" IS NOT NULL')
rows = cur.fetchall()
m1 = 0
for pid, name, token in rows:
    nv, st = re_encrypt(token)
    if st == "migrated":
        cur.execute('UPDATE projects SET "communityToken" = %s WHERE id = %s', (nv, pid))
        m1 += 1
        print(f"  migrated | {name[:50]}")
    elif st == "unknown":
        print(f"  UNKNOWN  | {name[:50]}")
print(f"Migrated: {m1}/{len(rows)}")

# === 2. additional_community_tokens ===
print("\n=== additional_community_tokens ===")
cur.execute('SELECT id, name, additional_community_tokens FROM projects WHERE additional_community_tokens IS NOT NULL')
rows = cur.fetchall()
m2 = 0
for pid, name, tj in rows:
    if not tj:
        continue
    try:
        tl = json.loads(tj) if isinstance(tj, str) else tj
    except:
        continue
    changed = False
    for item in tl:
        if isinstance(item, dict) and "token" in item:
            nv, st = re_encrypt(item["token"])
            if st == "migrated":
                item["token"] = nv
                changed = True
    if changed:
        cur.execute('UPDATE projects SET additional_community_tokens = %s WHERE id = %s',
                    (json.dumps(tl, ensure_ascii=False), pid))
        m2 += 1
        print(f"  migrated | {name[:50]}")
print(f"Migrated: {m2}")

conn.commit()
print("\nDONE - committed")
cur.close()
conn.close()
