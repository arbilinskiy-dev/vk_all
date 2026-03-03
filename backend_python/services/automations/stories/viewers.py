"""
Хаб-модуль для получения и обновления списка зрителей историй VK.
Реэкспортирует публичное API из подмодулей.

Структура:
  - viewers_vk_client.py  — VK API: запросы, retry, пагинация, трансформация
  - viewers_batch.py      — Батч-обработка: парсинг логов, сохранение в БД, финализация
  - viewers_details.py    — Детальное получение зрителей (одиночные запросы)
  - viewers_parallel.py   — Параллельная обработка (для батчей)
"""
from sqlalchemy.orm import Session
from models_library.automations import StoriesAutomationLog
from typing import List, Dict, Any

# Реэкспорт VK API клиента
from .viewers_vk_client import (
    transform_viewer_item,
    fetch_viewers_page,
    fetch_all_viewers,
    MAX_VIEWERS_PER_REQUEST,
    MAX_RETRIES,
    RETRY_DELAY,
    REQUEST_TIMEOUT,
)

# Реэкспорт батч-обработки
from .viewers_batch import batch_update_viewers


def update_all_stats_and_viewers(
    db: Session,
    logs: List[StoriesAutomationLog],
    user_token: str,
    project_id: str = None,
    community_tokens: list = None
) -> Dict[str, Any]:
    """
    Обновляет и статистику, и зрителей для списка историй.
    Сначала статистика, потом зрители.

    v2.0: Параллельная обработка и статистики, и зрителей.
    v3.0: Эксклюзивный режим community_tokens: если есть — ТОЛЬКО они.
    Возвращает объединённые обновлённые данные для локального обновления на фронте.
    """
    from .stats import batch_update_stats

    # Определяем project_id если не передан
    if not project_id and logs:
        project_id = logs[0].project_id

    # Обновляем статистику (параллельно, эксклюзивный режим community_tokens)
    stats_result = batch_update_stats(db, logs, user_token, project_id, community_tokens=community_tokens)

    # Обновляем зрителей (параллельно, эксклюзивный режим community_tokens)
    viewers_result = batch_update_viewers(db, logs, user_token, project_id, community_tokens=community_tokens)

    # Объединяем обновлённые данные
    # Создаём map для быстрого поиска
    updated_map = {}

    # Добавляем данные статистики
    for story in stats_result.get("updated_stories", []):
        key = story.get('log_id') or story.get('vk_story_id')
        if key:
            updated_map[key] = story.copy()

    # Мержим данные зрителей
    for story in viewers_result.get("updated_stories", []):
        key = story.get('log_id') or story.get('vk_story_id')
        if key:
            if key in updated_map:
                updated_map[key].update(story)
            else:
                updated_map[key] = story.copy()

    updated_stories = list(updated_map.values())

    return {
        "status": "ok",
        "updated": len(updated_stories),
        "stats": {
            "updated": stats_result.get("updated", 0)
        },
        "viewers": {
            "updated": viewers_result.get("updated", 0),
            "errors": viewers_result.get("errors", []),
            "stats": viewers_result.get("stats", {})
        },
        "updated_stories": updated_stories  # Объединённые данные
    }
