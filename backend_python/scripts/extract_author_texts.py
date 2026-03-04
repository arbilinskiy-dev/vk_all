"""
Извлечение облегчённых данных из спарсенных постов VK.
Только текст + краткое описание вложений — для анализа стиля автора нейронкой.
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
INPUT_FILE = DATA_DIR / "wall_posts_for_style_analysis.json"
OUTPUT_FILE = DATA_DIR / "author_texts_for_analysis.json"

# Маппинг типов вложений на понятные описания
ATTACHMENT_LABELS = {
    "photo": "фото",
    "video": "видео",
    "audio": "аудио",
    "doc": "документ",
    "link": "ссылка",
    "poll": "опрос",
    "sticker": "стикер",
    "graffiti": "граффити",
    "audio_message": "голосовое сообщение",
    "wall": "репост записи",
    "market": "товар",
    "article": "статья",
    "podcast": "подкаст",
    "mini_app": "мини-приложение",
    "event": "событие",
    "note": "заметка",
    "page": "вики-страница",
    "album": "альбом",
    "photos_list": "список фото",
    "pretty_cards": "карточки",
}


def describe_attachments(types: list[str]) -> str:
    """Формирует краткое описание вложений."""
    if not types:
        return ""
    
    # Считаем количество каждого типа
    counts = {}
    for t in types:
        label = ATTACHMENT_LABELS.get(t, t)
        counts[label] = counts.get(label, 0) + 1
    
    parts = []
    for label, count in counts.items():
        if count > 1:
            parts.append(f"{label} x{count}")
        else:
            parts.append(label)
    
    return ", ".join(parts)


def main():
    print("📖 Читаю исходный файл...")
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    posts = data["posts"]
    meta = data["meta"]
    
    # Формируем облегчённый список
    light_posts = []
    
    for p in posts:
        # Пропускаем репосты — для анализа стиля автора они не нужны
        if p.get("is_repost"):
            continue
        
        entry = {
            "date": p["date"],
            "text": p["text"],
        }
        
        # Добавляем описание вложений только если они есть
        attachments_desc = describe_attachments(p.get("attachment_types", []))
        if attachments_desc:
            entry["attachments"] = attachments_desc
        
        light_posts.append(entry)
    
    # Считаем статистику
    total_words = sum(len(e["text"].split()) for e in light_posts)
    total_chars = sum(len(e["text"]) for e in light_posts)
    
    result = {
        "info": {
            "author": meta["user_name"],
            "posts_count": len(light_posts),
            "total_words": total_words,
            "total_chars": total_chars,
            "period": f"{light_posts[-1]['date'][:10]} — {light_posts[0]['date'][:10]}" if light_posts else "",
            "note": "Тексты публикаций автора для анализа стиля и создания author-skill. Репосты исключены.",
        },
        "posts": light_posts,
    }
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    # Размер файлов для сравнения
    input_size = INPUT_FILE.stat().st_size / 1024
    output_size = OUTPUT_FILE.stat().st_size / 1024
    
    print(f"✅ Готово!")
    print(f"📁 Файл: {OUTPUT_FILE}")
    print(f"📝 Постов автора (без репостов): {len(light_posts)}")
    print(f"📊 Слов: {total_words}, символов: {total_chars}")
    print(f"📦 Размер: {input_size:.0f} KB → {output_size:.0f} KB (сокращение в {input_size/output_size:.1f}x)")


if __name__ == "__main__":
    main()
