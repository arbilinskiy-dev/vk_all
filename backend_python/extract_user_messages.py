"""
Скрипт выгрузки входящих текстовых сообщений пользователей (не кнопок) из БД.
Шаг 1: Пробуем локальную SQLite
Шаг 2: Если мало данных — подключаемся к продовой PostgreSQL
"""
import sqlite3
import json
import os
from datetime import datetime
from collections import Counter

# === КОНФИГУРАЦИЯ ===
LOCAL_DB = os.path.join(os.path.dirname(__file__), "vk_planner.db")
PROD_DB_URL = "postgresql://user1:asd232asd232@c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net:6432/db1"
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "..", "user_messages_analysis.json")


def extract_from_sqlite(db_path: str):
    """Извлекаем входящие текстовые сообщения из SQLite."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    # Проверяем наличие таблицы
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='cached_messages'")
    if not cur.fetchone():
        print("[SQLite] Таблица cached_messages не найдена")
        conn.close()
        return []
    
    # Считаем общее количество
    cur.execute("SELECT COUNT(*) FROM cached_messages")
    total = cur.fetchone()[0]
    print(f"[SQLite] Всего сообщений в БД: {total}")
    
    # Считаем входящие
    cur.execute("SELECT COUNT(*) FROM cached_messages WHERE is_outgoing = 0")
    incoming = cur.fetchone()[0]
    print(f"[SQLite] Входящих сообщений: {incoming}")
    
    # Считаем входящие без payload (реальные текстовые)
    cur.execute("SELECT COUNT(*) FROM cached_messages WHERE is_outgoing = 0 AND (payload_json IS NULL OR payload_json = '')")
    text_msgs = cur.fetchone()[0]
    print(f"[SQLite] Входящих текстовых (не кнопки): {text_msgs}")
    
    # Выгружаем входящие текстовые сообщения
    cur.execute("""
        SELECT 
            id, project_id, vk_user_id, vk_message_id, from_id, peer_id,
            text, date, attachments_json, payload_json
        FROM cached_messages 
        WHERE is_outgoing = 0 
          AND (payload_json IS NULL OR payload_json = '')
          AND text IS NOT NULL 
          AND text != ''
        ORDER BY date DESC
    """)
    
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def extract_from_postgres(db_url: str):
    """Извлекаем входящие текстовые сообщения из PostgreSQL."""
    try:
        import psycopg2
        import psycopg2.extras
    except ImportError:
        print("[PostgreSQL] psycopg2 не установлен, устанавливаю...")
        os.system("pip install psycopg2-binary")
        import psycopg2
        import psycopg2.extras
    
    conn = psycopg2.connect(db_url)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Общее количество
    cur.execute("SELECT COUNT(*) as cnt FROM cached_messages")
    total = cur.fetchone()['cnt']
    print(f"[PostgreSQL] Всего сообщений в БД: {total}")
    
    # Входящие
    cur.execute("SELECT COUNT(*) as cnt FROM cached_messages WHERE is_outgoing = false")
    incoming = cur.fetchone()['cnt']
    print(f"[PostgreSQL] Входящих сообщений: {incoming}")
    
    # Входящие без payload (реальные текстовые)
    cur.execute("SELECT COUNT(*) as cnt FROM cached_messages WHERE is_outgoing = false AND (payload_json IS NULL OR payload_json = '')")
    text_msgs = cur.fetchone()['cnt']
    print(f"[PostgreSQL] Входящих текстовых (не кнопки): {text_msgs}")
    
    # Входящие с payload (кнопки) — для сравнения
    cur.execute("SELECT COUNT(*) as cnt FROM cached_messages WHERE is_outgoing = false AND payload_json IS NOT NULL AND payload_json != ''")
    btn_msgs = cur.fetchone()['cnt']
    print(f"[PostgreSQL] Входящих кнопочных: {btn_msgs}")
    
    # Выгружаем входящие текстовые сообщения
    cur.execute("""
        SELECT 
            id, project_id, vk_user_id, vk_message_id, from_id, peer_id,
            text, date, attachments_json, payload_json
        FROM cached_messages 
        WHERE is_outgoing = false 
          AND (payload_json IS NULL OR payload_json = '')
          AND text IS NOT NULL 
          AND text != ''
        ORDER BY date DESC
    """)
    
    rows = cur.fetchall()
    
    # Также вытащим кнопочные для контекста
    cur.execute("""
        SELECT DISTINCT text, payload_json
        FROM cached_messages 
        WHERE is_outgoing = false 
          AND payload_json IS NOT NULL 
          AND payload_json != ''
        LIMIT 50
    """)
    button_samples = cur.fetchall()
    
    conn.close()
    return [dict(r) for r in rows], [dict(r) for r in button_samples]


def analyze_messages(messages: list) -> dict:
    """Анализируем типы обращений пользователей."""
    
    analysis = {
        "total_text_messages": len(messages),
        "unique_users": len(set(m.get("vk_user_id") for m in messages)),
        "unique_projects": len(set(m.get("project_id") for m in messages)),
        "date_range": {},
        "message_lengths": {},
        "has_attachments": 0,
        "categories": {},
        "all_messages": [],  # Полный список для ручного анализа
    }
    
    if not messages:
        return analysis
    
    # Временной диапазон
    dates = [m.get("date") for m in messages if m.get("date")]
    if dates:
        min_date = min(dates)
        max_date = max(dates)
        # date может быть int (unix) или строка
        if isinstance(min_date, (int, float)):
            analysis["date_range"] = {
                "from": datetime.fromtimestamp(min_date).isoformat(),
                "to": datetime.fromtimestamp(max_date).isoformat()
            }
        else:
            analysis["date_range"] = {"from": str(min_date), "to": str(max_date)}
    
    # Длина сообщений
    lengths = [len(m.get("text", "")) for m in messages]
    analysis["message_lengths"] = {
        "min": min(lengths) if lengths else 0,
        "max": max(lengths) if lengths else 0,
        "avg": round(sum(lengths) / len(lengths), 1) if lengths else 0,
        "median": sorted(lengths)[len(lengths) // 2] if lengths else 0,
    }
    
    # Сообщения с вложениями
    for m in messages:
        att = m.get("attachments_json")
        if att and att != "[]" and att != "null":
            analysis["has_attachments"] += 1
    
    # Категоризация по ключевым словам
    categories = {
        "приветствие": ["привет", "здравствуйте", "добрый день", "доброе утро", "добрый вечер", "здрасте", "хай", "hi", "hello"],
        "вопрос_о_товаре": ["товар", "продукт", "цена", "стоимость", "сколько стоит", "прайс", "каталог", "ассортимент", "наличие", "есть ли", "скидка", "акция"],
        "заказ": ["заказ", "оформить", "купить", "оплатить", "доставка", "отправить", "забрать", "самовывоз", "когда доставят", "отправка"],
        "жалоба_проблема": ["проблема", "не работает", "сломано", "не могу", "ошибка", "жалоба", "претензия", "возврат", "брак", "некачественн", "обмен"],
        "вопрос_о_услуге": ["услуг", "запис", "время", "приём", "консультация", "прием", "свободн", "расписание"],
        "контакты_адрес": ["адрес", "находитесь", "телефон", "номер", "контакт", "где вы", "как добраться", "карта", "расположен"],
        "график_работы": ["работаете", "график", "время работы", "во сколько", "открыт", "закрыт", "выходн"],
        "благодарность": ["спасибо", "благодарю", "спс", "пасиб"],
        "отписка_стоп": ["отписа", "стоп", "хватит", "не пишите", "надоел", "отстаньте"],
        "промокод_купон": ["промо", "купон", "код", "промокод", "скидочн"],
        "отзыв": ["отзыв", "отзовус", "оценк", "звезд", "оценить", "рейтинг"],
        "фото_видео": ["фото", "видео", "картинк", "изображение", "снимок"],
        "номер_телефона": [],  # Определяем по паттерну
        "числовой_ответ": [],  # Просто число
        "эмодзи": [],  # Только эмодзи
    }
    
    category_counts = Counter()
    uncategorized = []
    
    for m in messages:
        text = (m.get("text") or "").strip().lower()
        if not text:
            continue
        
        found_categories = []
        
        # Проверяем по ключевым словам
        for cat, keywords in categories.items():
            if keywords and any(kw in text for kw in keywords):
                found_categories.append(cat)
        
        # Номер телефона (паттерн)
        import re
        if re.search(r'[\+]?[78]\d{10}|\d{3}[\s-]\d{3}[\s-]\d{2}[\s-]\d{2}', text):
            found_categories.append("номер_телефона")
        
        # Чисто числовой ответ
        if re.match(r'^\d+$', text):
            found_categories.append("числовой_ответ")
        
        # Чисто эмодзи (или вложение без текста)
        import unicodedata
        text_clean = re.sub(r'[\s]', '', text)
        if text_clean and all(unicodedata.category(c).startswith(('So', 'Sk', 'Sm')) or ord(c) > 0x1F000 for c in text_clean):
            found_categories.append("эмодзи")
        
        if not found_categories:
            found_categories.append("другое")
            uncategorized.append(text[:200])
        
        for cat in found_categories:
            category_counts[cat] += 1
        
        # Формируем запись для полного списка
        msg_entry = {
            "text": m.get("text", ""),
            "user_id": m.get("vk_user_id"),
            "project_id": m.get("project_id"),
            "categories": found_categories,
        }
        if m.get("date"):
            d = m["date"]
            if isinstance(d, (int, float)):
                msg_entry["date"] = datetime.fromtimestamp(d).isoformat()
            else:
                msg_entry["date"] = str(d)
        
        has_att = m.get("attachments_json")
        if has_att and has_att != "[]" and has_att != "null":
            msg_entry["has_attachment"] = True
        
        analysis["all_messages"].append(msg_entry)
    
    analysis["categories"] = dict(category_counts.most_common())
    analysis["uncategorized_samples"] = uncategorized[:100]  # Первые 100 нераспознанных
    
    # Группировка по проектам
    projects_counter = Counter(m.get("project_id") for m in messages)
    analysis["messages_per_project"] = dict(projects_counter.most_common())
    
    # Группировка по пользователям (топ-20 самых активных)
    users_counter = Counter(m.get("vk_user_id") for m in messages)
    analysis["top_active_users"] = dict(users_counter.most_common(20))
    
    return analysis


if __name__ == "__main__":
    print("=" * 60)
    print("ВЫГРУЗКА ВХОДЯЩИХ ТЕКСТОВЫХ СООБЩЕНИЙ ПОЛЬЗОВАТЕЛЕЙ")
    print("=" * 60)
    
    messages = []
    button_samples = []
    source = "unknown"
    
    # Шаг 1: Пробуем локальную SQLite
    print(f"\n--- Шаг 1: Проверяем локальную SQLite ({LOCAL_DB}) ---")
    if os.path.exists(LOCAL_DB):
        messages = extract_from_sqlite(LOCAL_DB)
        source = "sqlite"
        print(f"[SQLite] Выгружено текстовых сообщений: {len(messages)}")
    else:
        print("[SQLite] Файл БД не найден")
    
    # Шаг 2: Если мало данных — идём в прод
    if len(messages) < 10:
        print(f"\n--- Шаг 2: Мало данных ({len(messages)}), подключаемся к PostgreSQL ---")
        try:
            result = extract_from_postgres(PROD_DB_URL)
            messages = result[0]
            button_samples = result[1] if len(result) > 1 else []
            source = "postgresql"
            print(f"[PostgreSQL] Выгружено текстовых сообщений: {len(messages)}")
        except Exception as e:
            print(f"[PostgreSQL] Ошибка подключения: {e}")
            if not messages:
                print("КРИТИЧЕСКАЯ ОШИБКА: Нет данных из обеих БД")
                exit(1)
    
    # Шаг 3: Анализ
    print(f"\n--- Шаг 3: Анализ сообщений (источник: {source}) ---")
    analysis = analyze_messages(messages)
    
    # Добавляем примеры кнопочных сообщений для контекста
    if button_samples:
        analysis["button_samples"] = [
            {"text": b.get("text"), "payload": b.get("payload_json")} 
            for b in button_samples
        ]
    
    analysis["source"] = source
    analysis["extracted_at"] = datetime.now().isoformat()
    
    # Выводим сводку
    print(f"\nВсего текстовых сообщений: {analysis['total_text_messages']}")
    print(f"Уникальных пользователей: {analysis['unique_users']}")
    print(f"Проектов: {analysis['unique_projects']}")
    print(f"Диапазон дат: {analysis.get('date_range', {})}")
    print(f"Длины сообщений: {analysis.get('message_lengths', {})}")
    print(f"С вложениями: {analysis['has_attachments']}")
    print(f"\nКатегории обращений:")
    for cat, count in sorted(analysis.get("categories", {}).items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")
    
    # Шаг 4: Сохранение
    print(f"\n--- Шаг 4: Сохранение в {OUTPUT_FILE} ---")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(analysis, f, ensure_ascii=False, indent=2, default=str)
    
    print(f"Файл сохранён: {OUTPUT_FILE}")
    print(f"Размер файла: {os.path.getsize(OUTPUT_FILE) / 1024:.1f} KB")
    print("ГОТОВО!")
