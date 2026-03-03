"""
Финальный диагностический скрипт: поиск всех ключей и попытка расшифровки.
"""
import base64
import struct
import os
import re
from datetime import datetime, timezone
from cryptography.fernet import Fernet
from sqlalchemy import create_engine, text

DB_URL = "postgresql://user1:asd232asd232@c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net:6432/db1"
KNOWN_KEY = "uvdbj3CxWuPL3DfPbItfioOeG6ToOLfdwdlPQv6AqlE="
DESKTOP_PATH = r"C:\Users\nikita79882\Desktop"

def find_all_encryption_keys():
    """Ищет все ENCRYPTION_KEY на Desktop (в .env, .bat, config, инструкциях)."""
    keys = set()
    keys.add(KNOWN_KEY)
    
    print("=" * 70)
    print("ПОИСК ВСЕХ ENCRYPTION_KEY НА DESKTOP")
    print("=" * 70)
    
    skip_dirs = {'node_modules', '.git', '__pycache__', 'venv', '.venv', 'dist', '.next'}
    
    for root, dirs, files in os.walk(DESKTOP_PATH):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        
        for filename in files:
            filepath = os.path.join(root, filename)
            # Ищем только в текстовых файлах
            if not any(filename.endswith(ext) for ext in 
                       ('.env', '.bat', '.py', '.md', '.txt', '.yaml', '.yml', '.json', '.toml', '.cfg', '.ini', '.sh')):
                if filename not in ('.env', '.env.local', '.env.production'):
                    continue
            
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
            except Exception:
                continue

            # Ищем паттерн ENCRYPTION_KEY = значение
            matches = re.findall(r'ENCRYPTION_KEY["\']?\s*[=:]\s*["\']?([A-Za-z0-9+/=_-]{20,})["\']?', content)
            for m in matches:
                if m not in keys and 'ENCRYPTION_KEY_NEW' not in content[max(0, content.index(m)-30):content.index(m)]:
                    keys.add(m)
                    rel_path = os.path.relpath(filepath, DESKTOP_PATH)
                    print(f"  НОВЫЙ ключ: [{m}]")
                    print(f"  Файл: {rel_path}")
                    print()
            
            # Также ищем значения в формате 'uvdbj3...' (Fernet-совместимые ключи)
            fernet_keys = re.findall(r'[A-Za-z0-9_-]{42,44}=', content)
            for fk in fernet_keys:
                if len(fk) == 44 and fk not in keys:
                    try:
                        Fernet(fk.encode())
                        keys.add(fk)
                        rel_path = os.path.relpath(filepath, DESKTOP_PATH)
                        print(f"  Потенциальный Fernet ключ: [{fk}]")
                        print(f"  Файл: {rel_path}")
                    except Exception:
                        pass
    
    print(f"\nВсего уникальных ключей: {len(keys)}")
    for k in sorted(keys):
        print(f"  [{k}]")
    
    return keys


def main():
    engine = create_engine(DB_URL)
    
    # Собираем 3 зашифрованных токена из projects
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, "communityToken"
            FROM projects 
            WHERE "communityToken" IS NOT NULL 
            AND "communityToken" LIKE 'gAAAAA%'
            LIMIT 3
        """))
        samples = [(str(row[0])[:8], row[1]) for row in result.fetchall()]
    
    print(f"\nТестовых токенов: {len(samples)}")
    for pid, token in samples:
        # Декодируем timestamp
        try:
            token_bytes = base64.urlsafe_b64decode(token.encode())
            ts = struct.unpack('>Q', token_bytes[1:9])[0]
            dt = datetime.fromtimestamp(ts, tz=timezone.utc)
            print(f"  ID={pid} | Зашифрован: {dt.strftime('%Y-%m-%d %H:%M:%S')} UTC | len={len(token)}")
        except Exception as e:
            print(f"  ID={pid} | Ошибка timestamp: {e}")
    
    # Ищем все ключи
    all_keys = find_all_encryption_keys()
    
    # Пробуем каждый ключ
    print("\n" + "=" * 70)
    print("ПОПЫТКА РАСШИФРОВКИ КАЖДЫМ КЛЮЧОМ")
    print("=" * 70)
    
    for key in sorted(all_keys):
        try:
            cipher = Fernet(key.encode())
        except Exception:
            print(f"\n  [{key[:30]}...] — невалидный Fernet ключ")
            continue
        
        successes = 0
        for pid, token in samples:
            try:
                decrypted = cipher.decrypt(token.encode()).decode()
                successes += 1
                print(f"\n  🔑 КЛЮЧ [{key}] — РАБОТАЕТ!")
                print(f"    ID={pid}: {decrypted[:60]}...")
            except Exception:
                pass
        
        if successes == 0:
            print(f"  [{key}] — не подходит")
    
    # Проверяем целостность данных первого токена
    print("\n" + "=" * 70)
    print("СТРУКТУРА FERNET-ТОКЕНА")
    print("=" * 70)
    
    if samples:
        _, token = samples[0]
        token_bytes = base64.urlsafe_b64decode(token.encode())
        version = token_bytes[0]
        payload_len = len(token_bytes) - 1 - 8 - 16 - 32
        
        print(f"  Длина raw: {len(token_bytes)} байт")
        print(f"  Версия: {version} (ожидаем 128)")
        print(f"  Payload: {payload_len} байт")
        print(f"  Кратно 16: {'ДА' if payload_len % 16 == 0 else 'НЕТ (повреждён!)'}")
        print(f"  Первые 9 hex: {token_bytes[:9].hex()}")
    
    engine.dispose()
    print("\n✅ Диагностика завершена.")


if __name__ == "__main__":
    main()
