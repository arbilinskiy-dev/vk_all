"""
Диагностический скрипт для анализа Fernet-токенов в БД.
1. Декодирует временные метки из Fernet-токенов (когда зашифрованы)
2. Проверяет структуру токенов
3. Ищет ВСЕ .env файлы на Desktop с ENCRYPTION_KEY
4. Пробует декодировать токены КАЖДЫМ найденным ключом
"""

import base64
import struct
import os
import glob
from datetime import datetime, timezone
from cryptography.fernet import Fernet
from sqlalchemy import create_engine, text

# === Константы ===
DB_URL = "postgresql://user1:asd232asd232@c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net:6432/db1"
KNOWN_KEY = "uvdbj3CxWuPL3DfPbItfioOeG6ToOLfdwdlPQv6AqlE="
DESKTOP_PATH = r"C:\Users\nikita79882\Desktop"

def decode_fernet_timestamp(token_str):
    """Декодирует Fernet-токен и извлекает timestamp (без проверки ключа)."""
    try:
        token_bytes = base64.urlsafe_b64decode(token_str.encode('utf-8'))
        if len(token_bytes) < 25:  # min: 1 version + 8 timestamp + 16 IV
            return None, "Слишком короткий"
        version = token_bytes[0]
        timestamp = struct.unpack('>Q', token_bytes[1:9])[0]
        dt = datetime.fromtimestamp(timestamp, tz=timezone.utc)
        return dt, f"version={version}, length={len(token_bytes)}"
    except Exception as e:
        return None, str(e)


def find_all_encryption_keys():
    """Ищет все .env файлы на Desktop и извлекает ENCRYPTION_KEY."""
    keys = set()
    keys.add(KNOWN_KEY)  # Добавляем известный ключ
    
    print("\n" + "="*70)
    print("ПОИСК ВСЕХ ENCRYPTION_KEY НА DESKTOP")
    print("="*70)
    
    # Ищем все .env файлы рекурсивно
    for root, dirs, files in os.walk(DESKTOP_PATH):
        # Пропускаем node_modules, .git и подобные
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', '__pycache__', 'venv', '.venv')]
        
        for filename in files:
            if filename in ('.env', '.env.local', '.env.production', '.env.development'):
                filepath = os.path.join(root, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    for line in content.splitlines():
                        line = line.strip()
                        if line.startswith('#'):
                            continue
                        if 'ENCRYPTION_KEY' in line and 'ENCRYPTION_KEY_NEW' not in line:
                            # Парсим значение
                            parts = line.split('=', 1)
                            if len(parts) == 2:
                                key_value = parts[1].strip()
                                # Убираем кавычки
                                key_value_clean = key_value.strip('"').strip("'")
                                keys.add(key_value_clean)
                                if key_value_clean != key_value:
                                    keys.add(key_value)  # Добавляем и с кавычками на всякий случай
                                print(f"  Файл: {filepath}")
                                print(f"  Сырое значение: [{key_value}]")
                                print(f"  Очищенное:      [{key_value_clean}]")
                                print()
                except Exception as e:
                    print(f"  Ошибка чтения {filepath}: {e}")
    
    # Также ищем в deploy_preprod.bat файлах
    for root, dirs, files in os.walk(DESKTOP_PATH):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', '__pycache__', 'venv', '.venv')]
        for filename in files:
            if filename == 'deploy_preprod.bat':
                filepath = os.path.join(root, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    # Ищем ENCRYPTION_KEY= в bat файле
                    for line in content.splitlines():
                        if 'ENCRYPTION_KEY=' in line and 'ENCRYPTION_KEY_NEW' not in line:
                            # Извлечь значение из формата --environment "ENCRYPTION_KEY=xxx"
                            import re
                            matches = re.findall(r'ENCRYPTION_KEY=([^\s"]+)', line)
                            for m in matches:
                                keys.add(m)
                                print(f"  BAT файл: {filepath}")
                                print(f"  Ключ: [{m}]")
                                print()
                except Exception as e:
                    pass
    
    # Также ищем в config.py файлах (вдруг там захардкожен)
    for root, dirs, files in os.walk(DESKTOP_PATH):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', '__pycache__', 'venv', '.venv')]
        for filename in files:
            if filename == 'config.py':
                filepath = os.path.join(root, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    if 'encryption_key' in content.lower():
                        # Ищем дефолтное значение
                        import re
                        matches = re.findall(r'encryption_key["\']?\s*[:=]\s*["\']([^"\']+)["\']', content, re.IGNORECASE)
                        for m in matches:
                            if len(m) > 20:  # Фильтруем слишком короткие
                                keys.add(m)
                                print(f"  config.py: {filepath}")
                                print(f"  Ключ: [{m}]")
                except Exception:
                    pass
    
    print(f"\nВсего найдено уникальных ключей: {len(keys)}")
    for k in keys:
        print(f"  - [{k}]  (len={len(k)})")
    
    return keys


def main():
    engine = create_engine(DB_URL)
    
    # === 1. Анализ временных меток Fernet-токенов ===
    print("="*70)
    print("АНАЛИЗ ВРЕМЕННЫХ МЕТОК FERNET-ТОКЕНОВ")
    print("="*70)
    
    with engine.connect() as conn:
        # --- Проекты: communityToken ---
        result = conn.execute(text("""
            SELECT id, name, "communityToken",
                   LENGTH("communityToken") as token_len
            FROM projects 
            WHERE "communityToken" IS NOT NULL 
            ORDER BY id
            LIMIT 20
        """))
        rows = result.fetchall()
        
        print(f"\n--- projects.communityToken (первые 20) ---")
        encrypted_samples = []
        for row in rows:
            pid, name, token, tlen = row
            if token and token.startswith("gAAAAA"):
                dt, info = decode_fernet_timestamp(token)
                ts_str = dt.strftime('%Y-%m-%d %H:%M:%S UTC') if dt else "ОШИБКА"
                print(f"  ID={str(pid)[:8]} | {ts_str} | {info} | len={tlen} | {str(name)[:30]}")
                if len(encrypted_samples) < 3:
                    encrypted_samples.append((pid, name, token))
            else:
                print(f"  ID={str(pid)[:8]} | PLAIN TEXT | len={tlen} | {str(name)[:30]}")
        
        # --- Считаем уникальные даты ---
        result2 = conn.execute(text("""
            SELECT "communityToken"
            FROM projects 
            WHERE "communityToken" IS NOT NULL AND "communityToken" LIKE 'gAAAAA%'
        """))
        all_encrypted = result2.fetchall()
        timestamps = {}
        for (token,) in all_encrypted:
            dt, _ = decode_fernet_timestamp(token)
            if dt:
                date_str = dt.strftime('%Y-%m-%d %H:%M:%S')
                timestamps[date_str] = timestamps.get(date_str, 0) + 1
        
        print(f"\n--- Уникальные временные метки шифрования (communityToken) ---")
        for ts, count in sorted(timestamps.items()):
            print(f"  {ts} UTC : {count} записей")
        
        # --- system_accounts.token ---
        result3 = conn.execute(text("""
            SELECT id, name, token, LENGTH(token) as token_len
            FROM system_accounts 
            WHERE token IS NOT NULL
            LIMIT 10
        """))
        rows3 = result3.fetchall()
        
        print(f"\n--- system_accounts.token ---")
        for row in rows3:
            sid, name, token, tlen = row
            if not name:
                name = "unnamed"
            if token and token.startswith("gAAAAA"):
                dt, info = decode_fernet_timestamp(token)
                ts_str = dt.strftime('%Y-%m-%d %H:%M:%S UTC') if dt else "ОШИБКА"
                print(f"  ID={str(sid)[:8]} | {ts_str} | {info} | len={tlen} | {str(name)[:30]}")
            else:
                print(f"  ID={str(sid)[:8]} | PLAIN TEXT | len={tlen} | {str(name)[:30]}")
        
        # --- ai_tokens ---
        result4 = conn.execute(text("""
            SELECT id, provider, token, LENGTH(token) as token_len
            FROM ai_tokens 
            WHERE token IS NOT NULL
            LIMIT 10
        """))
        rows4 = result4.fetchall()
        
        print(f"\n--- ai_tokens.token ---")
        for row in rows4:
            aid, provider, token, tlen = row
            if token and token.startswith("gAAAAA"):
                dt, info = decode_fernet_timestamp(token)
                ts_str = dt.strftime('%Y-%m-%d %H:%M:%S UTC') if dt else "ОШИБКА"
                print(f"  ID={str(aid)[:8]} | {ts_str} | {info} | len={tlen} | {str(provider)[:30]}")
            else:
                print(f"  ID={str(aid)[:8]} | PLAIN TEXT | len={tlen} | {str(provider)[:30]}")
    
    # === 2. Поиск всех ключей ===
    all_keys = find_all_encryption_keys()
    
    # === 3. Пробуем каждый ключ на зашифрованных токенах ===
    if encrypted_samples:
        print("\n" + "="*70)
        print("ПОПЫТКА РАСШИФРОВКИ КАЖДЫМ НАЙДЕННЫМ КЛЮЧОМ")
        print("="*70)
        
        for key in all_keys:
            try:
                cipher = Fernet(key.encode('utf-8') if isinstance(key, str) else key)
            except Exception as e:
                print(f"\n  Ключ [{key[:20]}...] — невалидный Fernet-ключ: {e}")
                continue
            
            print(f"\n  Ключ: [{key}]")
            for pid, name, token in encrypted_samples:
                try:
                    decrypted = cipher.decrypt(token.encode('utf-8')).decode('utf-8')
                    print(f"    ✅ ID={str(pid)[:8]} УСПЕХ! Расшифровано: {decrypted[:50]}...")
                except Exception as e:
                    print(f"    ❌ ID={str(pid)[:8]} ПРОВАЛ: {type(e).__name__}")
    
    # === 4. Генерируем ключ из разных вариаций ===
    print("\n" + "="*70)
    print("ПРОВЕРКА ДОПОЛНИТЕЛЬНЫХ ВАРИАЦИЙ КЛЮЧА")
    print("="*70)
    
    variations = {}
    # Базовый ключ
    base = "uvdbj3CxWuPL3DfPbItfioOeG6ToOLfdwdlPQv6AqlE="
    
    # Вариация 1: UTF-8 BOM prefix
    variations["UTF-8 BOM prefix"] = "\ufeff" + base
    
    # Вариация 2: с пробелом в конце
    variations["trailing space"] = base + " "
    
    # Вариация 3: с табом в конце  
    variations["trailing tab"] = base + "\t"
    
    # Вариация 4: с \r\n в конце
    variations["trailing CRLF"] = base + "\r\n"
    
    # Вариация 5: с \n в конце
    variations["trailing LF"] = base + "\n"
    
    # Вариация 6: lowercase
    variations["lowercase"] = base.lower()
    
    # Вариация 7: без trailing =
    variations["no trailing ="] = base.rstrip("=")
    
    # Вариация 8: с двумя ==
    variations["double =="] = base.rstrip("=") + "=="
    
    for desc, key_var in variations.items():
        try:
            cipher = Fernet(key_var.encode('utf-8'))
            print(f"\n  Вариация [{desc}]: ключ валиден!")
            if encrypted_samples:
                pid, name, token = encrypted_samples[0]
                try:
                    decrypted = cipher.decrypt(token.encode('utf-8')).decode('utf-8')
                    print(f"    ✅ УСПЕХ! ID={str(pid)[:8]}: {decrypted[:50]}...")
                except Exception as e:
                    print(f"    ❌ Не декодирует: {type(e).__name__}")
        except Exception as e:
            print(f"  Вариация [{desc}]: невалидный ключ — {e}")
    
    # === 5. Проверяем: может проблема в ДАННЫХ, а не в ключе? ===
    print("\n" + "="*70)
    print("ПРОВЕРКА ЦЕЛОСТНОСТИ ДАННЫХ")
    print("="*70)
    
    if encrypted_samples:
        pid, name, token = encrypted_samples[0]
        token_bytes = base64.urlsafe_b64decode(token.encode('utf-8'))
        print(f"  Token ID={pid}:")
        print(f"    Raw length: {len(token_bytes)} bytes")
        print(f"    Version: {token_bytes[0]} (ожидается 128 / 0x80)")
        print(f"    Ciphertext blocks: {(len(token_bytes) - 57) / 16:.1f} (должно быть целое число)")
        
        # Fernet token: version(1) + time(8) + iv(16) + ciphertext(N*16) + hmac(32)
        payload_len = len(token_bytes) - 1 - 8 - 16 - 32
        print(f"    Payload (ciphertext) length: {payload_len} bytes")
        print(f"    Кратно 16: {'да' if payload_len % 16 == 0 else 'НЕТ — данные повреждены!'}")
        
        # Hex dump первых и последних байт
        print(f"    First 25 bytes (hex): {token_bytes[:25].hex()}")
        print(f"    Last 32 bytes (HMAC hex): {token_bytes[-32:].hex()}")
    
    engine.dispose()
    print("\n✅ Диагностика завершена.")


if __name__ == "__main__":
    main()
