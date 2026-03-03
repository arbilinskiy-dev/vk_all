"""
тилиты и типы для модуля статистики историй VK.

Содержит: константы, dataclass StoryStatsData, хелперы для сравнения статистики.
"""
from typing import Dict, Any, Optional
from dataclasses import dataclass


# онстанты
MAX_RETRIES = 3
RETRY_DELAY = 0.3
REQUEST_TIMEOUT = 30


def _extract_stat_value(stat_obj: Any) -> int:
    """
    звлекает числовое значение из объекта статистики VK.
    VK возвращает статистику в формате {"views": {"count": 123, "state": "on"}}
    или иногда просто число.
    """
    if isinstance(stat_obj, dict):
        return stat_obj.get('count', 0)
    if isinstance(stat_obj, (int, float)):
        return int(stat_obj)
    return 0


def _stats_are_equal(old_stats: Dict, new_stats: Dict) -> bool:
    """
    Сравнивает ключевые метрики статистики двух историй.
    сли все основные показатели совпадают - данные не изменились.
    """
    # лючевые поля статистики VK stories.getStats
    keys_to_compare = ['views', 'replies', 'answer', 'shares', 'subscribers', 'bans', 'likes']

    for key in keys_to_compare:
        old_val = _extract_stat_value(old_stats.get(key, 0))
        new_val = _extract_stat_value(new_stats.get(key, 0))
        if old_val != new_val:
            return False

    return True


@dataclass
class StoryStatsData:
    """анные статистики одной истории."""
    owner_id: str
    story_id: str
    stats: Optional[Dict]
    success: bool
    error: Optional[str] = None
    log: Any = None  # Ссылка на объект лога для сохранения
