"""
Проверяем гипотезу двойного шифрования:
1. Может EncryptedString.process_bind_param зашифровал уже зашифрованный токен
2. Нужно расшифровать дважды
"""
import psycopg2
from cryptography.fernet import Fernet, InvalidToken

DB_URL = "postgresql://user1:asd232asd232@c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net:6432/db1"
KEY = "uvdbj3CxWuPL3DfPbItfioOeG6ToOLfdwdlPQv6AqlE="

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()
f = Fernet(KEY)

# Берем 3 нерасшифровывающихся токена проектов
cur.execute("""
    SELECT name, "communityToken" 
    FROM projects 
    WHERE "communityToken" IS NOT NULL 
    AND "communityToken" LIKE 'gAAAAA%%' 
    LIMIT 3
""")
rows = cur.fetchall()

for name, token in rows:
    print(f"\n{'='*60}")
    print(f"Project: {name}")
    print(f"Token len: {len(token)}")
    
    # Попытка 1: обычная расшифровка
    try:
        result = f.decrypt(token.encode('utf-8')).decode('utf-8')
        print(f"  Single decrypt OK: {result[:30]}...")
        continue
    except InvalidToken:
        print(f"  Single decrypt: FAIL")
    
    # Попытка 2: двойная расшифровка (если токен зашифровался дважды)
    # Нужно расшифровать -> получить gAAAAA -> расшифровать снова
    # Но первый decrypt уже фейлится... Значит внешний слой - другой ключ
    
    # Попытка 3: Может ключ пришел в .env с кавычками и Fernet работал с кавычками?
    # Pydantic V2 strip quotes, но может старая версия не стрипала?
    for test_key_name, test_key in [
        ("with double quotes", '"uvdbj3CxWuPL3DfPbItfioOeG6ToOLfdwdlPQv6AqlE="'),
        ("without trailing =", 'uvdbj3CxWuPL3DfPbItfioOeG6ToOLfdwdlPQv6AqlE'),
        ("with newline", 'uvdbj3CxWuPL3DfPbItfioOeG6ToOLfdwdlPQv6AqlE=\n'),
    ]:
        try:
            tf = Fernet(test_key.strip().encode())
            result = tf.decrypt(token.encode('utf-8')).decode('utf-8')
            print(f"  Variant '{test_key_name}' WORKED: {result[:30]}...")
            break
        except Exception as e:
            print(f"  Variant '{test_key_name}': {type(e).__name__}")

    # Попытка 4: brute-force - может process_bind_param зашифровал gAAAAA токен 
    # (двойное шифрование), но нужно проверить через EncryptedString.process_result_value
    # Симуляция: encrypt(encrypt(plain)) -> decrypt -> gAAAAA -> decrypt -> plain
    print()
    print("  Checking if this could be double-encrypted output...")
    
    # Если двойное шифрование, то decrypt(token) должен дать gAAAAA...
    # Но decrypt уже фейлится. Это значит проблема НЕ в двойном шифровании с тем же ключом.
    
    # Попытка 5: Проверяем все ключи из ВСЕХ .env файлов на диске
    # (уже проверили - все одинаковые)

# Новая гипотеза: может process_bind_param НЕ шифровал, а данные были зашифрованы 
# через скрипт encrypt_existing_data.py с другим ключом?
print("\n" + "="*60)
print("Checking encrypt_existing_data.py and rotate_keys.py history...")

# Проверяем: а были ли токены когда-то plain, и были ли зашифрованы скриптом?
cur.execute("""
    SELECT name, "communityToken" 
    FROM projects 
    WHERE "communityToken" IS NOT NULL 
    AND "communityToken" NOT LIKE 'gAAAAA%%' 
    LIMIT 5
""")
plain_rows = cur.fetchall()
print(f"\nPlain text tokens ({len(plain_rows)} found):")
for name, token in plain_rows:
    print(f"  {name}: {token[:30]}...")

# Проверяем additional_community_tokens
cur.execute("""
    SELECT name, additional_community_tokens 
    FROM projects 
    WHERE additional_community_tokens IS NOT NULL 
    AND additional_community_tokens != '[]'
    LIMIT 3
""")
add_rows = cur.fetchall()
print(f"\nAdditional tokens ({len(add_rows)} found):")
for name, tokens in add_rows:
    print(f"  {name}: {str(tokens)[:60]}...")

cur.close()
conn.close()
