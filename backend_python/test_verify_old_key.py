"""
Верификация: старый ключ от predprod2 дешифрует проектные токены?
"""
from cryptography.fernet import Fernet
from sqlalchemy import create_engine, text

OLD_KEY = "aq-sMA9Y6jhyssTJewDmpcAS_3Qu9rXq35wZjZdDV-Q="
NEW_KEY = "uvdbj3CxWuPL3DfPbItfioOeG6ToOLfdwdlPQv6AqlE="
DB_URL = "postgresql://user1:asd232asd232@c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net:6432/db1"

cipher_old = Fernet(OLD_KEY.encode())
cipher_new = Fernet(NEW_KEY.encode())

engine = create_engine(DB_URL)

with engine.connect() as conn:
    # Тест на проектных токенах
    result = conn.execute(text(
        "SELECT id, \"communityToken\" FROM projects "
        "WHERE \"communityToken\" LIKE 'gAAAAA%' LIMIT 5"
    ))
    rows = result.fetchall()
    
    print("=== PROJECTS.communityToken ===")
    old_ok = 0
    new_ok = 0
    for pid, token in rows:
        pid_short = str(pid)[:8]
        
        # Старый ключ
        try:
            decrypted = cipher_old.decrypt(token.encode()).decode()
            print(f"  OLD KEY OK  | ID={pid_short} | {decrypted[:60]}...")
            old_ok += 1
        except Exception:
            print(f"  OLD KEY FAIL | ID={pid_short}")
        
        # Новый ключ
        try:
            decrypted = cipher_new.decrypt(token.encode()).decode()
            print(f"  NEW KEY OK  | ID={pid_short} | {decrypted[:60]}...")
            new_ok += 1
        except Exception:
            print(f"  NEW KEY FAIL | ID={pid_short}")
    
    print(f"\nИтог: Old key: {old_ok}/{len(rows)} | New key: {new_ok}/{len(rows)}")

engine.dispose()
