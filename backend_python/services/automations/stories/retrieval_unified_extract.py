"""
Извлечение данных из VK-объектов и логов для unified stories.
"""
from sqlalchemy.orm import Session
from models_library.posts import Post
from datetime import datetime, timezone
import json

from .retrieval_helpers import get_story_preview, get_story_video_url


def _extract_story_data(vk_story: dict | None, log_obj, group_id: int | None, s_id: int) -> tuple:
    """
    Извлекает основные данные истории (дата, тип, просмотры, превью, ссылка, видео).
    Возвращает (date_ts, type_str, views, preview, link, video_url).
    """
    date_ts = 0
    type_str = 'photo'
    views = 0
    preview = None
    link = None
    video_url = None
    
    # Ссылка и тип из JSON-лога (для случаев без VK-данных)
    if log_obj and log_obj.log:
        try:
            d = json.loads(log_obj.log)
            link = d.get('story_link')
            # Восстанавливаем тип истории из лога (если сохранён ранее)
            saved_type = d.get('story_type')
            if saved_type in ('photo', 'video'):
                type_str = saved_type
        except:
            pass
    
    # Ссылка по умолчанию (если нет в логе)
    if not link and group_id and s_id:
        link = f"https://vk.com/story-{group_id}_{s_id}"
    
    # Данные из VK-объекта (если история активна) — перезаписывают данные из лога
    if vk_story:
        date_ts = vk_story.get('date', 0)
        type_str = vk_story.get('type', 'photo')
        views = vk_story.get('views', 0)
        preview = get_story_preview(vk_story)
        video_url = get_story_video_url(vk_story)
    
    return date_ts, type_str, views, preview, link, video_url


def _get_date_from_log(db: Session, log_obj, project_id: str) -> int:
    """Извлекает дату из лога, с фолбэком на дату связанного поста."""
    date_ts = int(log_obj.created_at.replace(tzinfo=timezone.utc).timestamp())
    
    if date_ts == 0:
        try:
            if log_obj.vk_post_id and log_obj.vk_post_id != 0:
                post_match = db.query(Post).filter(
                    Post.projectId == project_id,
                    Post.vkPostUrl.like(f"%_{log_obj.vk_post_id}")
                ).first()
                if post_match and post_match.date:
                    try:
                        dt = datetime.fromisoformat(post_match.date.replace('Z', '+00:00'))
                        date_ts = int(dt.timestamp())
                    except ValueError:
                        date_ts = int(post_match.date)
        except Exception:
            pass
    
    return date_ts


def _extract_stats(log_obj, is_active: bool, views: int) -> tuple:
    """Извлекает детальную статистику из лога. Возвращает (detailed_stats, stats_updated_at)."""
    if not log_obj.stats:
        return None, None
    try:
        stats_json = json.loads(log_obj.stats)
        # Для активной истории — берём максимум из VK и сохранённых данных
        if is_active and 'views' in stats_json and isinstance(stats_json['views'], dict):
            stats_json['views']['count'] = max(stats_json['views']['count'], views)
        stats_updated_at = log_obj.stats_updated_at.isoformat() if log_obj.stats_updated_at else None
        return stats_json, stats_updated_at
    except:
        return None, None


def _extract_viewers(log_obj) -> tuple:
    """Извлекает данные зрителей из лога. Возвращает (viewers_data, viewers_updated_at)."""
    if not log_obj.viewers:
        return None, None
    try:
        viewers_data = json.loads(log_obj.viewers)
        viewers_updated_at = log_obj.viewers_updated_at.isoformat() if log_obj.viewers_updated_at else None
        return viewers_data, viewers_updated_at
    except:
        return None, None
