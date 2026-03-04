"""
Скрипт для парсинга всех постов со стены пользователя VK.
Сохраняет тексты публикаций в JSON для дальнейшего анализа стиля автора.
"""

import requests
import json
import time
import sys
from datetime import datetime
from pathlib import Path

VK_USER_TOKEN = "vk1.a.MepRLhKDuFBN9Nzggi2iPturCVl1QdXuwAVlHGKeL0WVjLWart-cXKQwPavxJU8QMYOO34qSoMBQi0IglOP0hXIGe7BTxMvFb-PaxQgkXDtyI3barOwHH5DHAkqS5mZq7WDilWo8gAN1HZTCGvUFQo-krGv0m3NlYpd10I3lz94hdlpUSnEAlNciaSmX6AUTSwMAqBn-uKslwMScvGsZ0Q"
VK_API_VERSION = "5.199"
VK_API_BASE = "https://api.vk.com/method"

# Путь для сохранения результатов
OUTPUT_DIR = Path(__file__).parent.parent / "data"
OUTPUT_FILE = OUTPUT_DIR / "wall_posts_for_style_analysis.json"


def vk_api_call(method: str, params: dict) -> dict:
    """Вызов VK API метода с обработкой ошибок."""
    params["access_token"] = VK_USER_TOKEN
    params["v"] = VK_API_VERSION
    
    response = requests.get(f"{VK_API_BASE}/{method}", params=params)
    data = response.json()
    
    if "error" in data:
        error = data["error"]
        print(f"  ❌ VK API ошибка [{error.get('error_code')}]: {error.get('error_msg')}")
        # Если слишком много запросов — ждём и повторяем
        if error.get("error_code") == 6:
            print("  ⏳ Слишком много запросов, ждём 1 секунду...")
            time.sleep(1)
            return vk_api_call(method, params)
        return None
    
    return data.get("response")


def get_user_info() -> dict:
    """Получаем информацию о текущем пользователе."""
    result = vk_api_call("users.get", {"fields": "screen_name"})
    if result and len(result) > 0:
        return result[0]
    return None


def get_wall_posts(owner_id: int, offset: int = 0, count: int = 100) -> dict:
    """Получаем посты со стены пользователя."""
    return vk_api_call("wall.get", {
        "owner_id": owner_id,
        "count": count,
        "offset": offset,
        "filter": "owner",  # Только посты самого автора (не репосты чужих)
    })


def parse_all_posts():
    """Основная функция — собирает все посты со стены."""
    print("=" * 60)
    print("🔍 Парсинг постов со стены VK")
    print("=" * 60)
    
    # 1. Определяем пользователя
    user = get_user_info()
    if not user:
        print("❌ Не удалось получить информацию о пользователе")
        sys.exit(1)
    
    user_id = user["id"]
    user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
    print(f"👤 Пользователь: {user_name} (id{user_id})")
    
    # 2. Первый запрос — узнаём общее количество постов
    first_batch = get_wall_posts(user_id, offset=0, count=1)
    if not first_batch:
        print("❌ Не удалось получить посты")
        sys.exit(1)
    
    total_posts = first_batch["count"]
    print(f"📊 Всего постов на стене (автор): {total_posts}")
    
    # 3. Собираем все посты пачками по 100
    all_posts = []
    offset = 0
    batch_size = 100
    
    while offset < total_posts:
        batch = get_wall_posts(user_id, offset=offset, count=batch_size)
        if not batch or not batch.get("items"):
            break
        
        items = batch["items"]
        
        for post in items:
            text = (post.get("text") or "").strip()
            
            # Пропускаем пустые посты (только картинки/видео без текста) и репосты
            if not text:
                continue
            
            # Определяем, есть ли репост (copy_history)
            is_repost = bool(post.get("copy_history"))
            
            # Собираем данные поста
            post_data = {
                "id": post["id"],
                "date": datetime.fromtimestamp(post["date"]).strftime("%Y-%m-%d %H:%M:%S"),
                "timestamp": post["date"],
                "text": text,
                "is_repost": is_repost,
                "likes": post.get("likes", {}).get("count", 0),
                "reposts": post.get("reposts", {}).get("count", 0),
                "views": post.get("views", {}).get("count", 0),
                "comments": post.get("comments", {}).get("count", 0),
                "has_attachments": bool(post.get("attachments")),
                "attachment_types": [
                    att.get("type") for att in post.get("attachments", [])
                ],
                "word_count": len(text.split()),
                "char_count": len(text),
            }
            
            # Если есть текст репоста — добавляем его отдельно
            if is_repost and post["copy_history"]:
                repost_text = (post["copy_history"][0].get("text") or "").strip()
                if repost_text:
                    post_data["repost_original_text"] = repost_text
            
            all_posts.append(post_data)
        
        collected = len(all_posts)
        print(f"  📥 Обработано {offset + len(items)}/{total_posts} постов, с текстом: {collected}")
        
        offset += batch_size
        # Задержка чтобы не превысить лимит VK API (3 запроса в секунду)
        time.sleep(0.35)
    
    # 4. Сортируем по дате (от новых к старым)
    all_posts.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # 5. Формируем итоговую структуру
    result = {
        "meta": {
            "user_id": user_id,
            "user_name": user_name,
            "parsed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_wall_posts": total_posts,
            "posts_with_text": len(all_posts),
            "posts_without_text_skipped": total_posts - len(all_posts),
            "total_words": sum(p["word_count"] for p in all_posts),
            "total_chars": sum(p["char_count"] for p in all_posts),
            "date_range": {
                "oldest": all_posts[-1]["date"] if all_posts else None,
                "newest": all_posts[0]["date"] if all_posts else None,
            },
            "purpose": "Анализ стиля автора для создания author-skill (генерация текстов в стиле автора)",
        },
        "posts": all_posts,
    }
    
    # 6. Сохраняем
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print()
    print("=" * 60)
    print(f"✅ Готово!")
    print(f"📁 Файл: {OUTPUT_FILE}")
    print(f"📝 Постов с текстом: {len(all_posts)}")
    print(f"📊 Всего слов: {result['meta']['total_words']}")
    print(f"📊 Всего символов: {result['meta']['total_chars']}")
    if all_posts:
        print(f"📅 Период: {all_posts[-1]['date']} — {all_posts[0]['date']}")
    print("=" * 60)


if __name__ == "__main__":
    parse_all_posts()
