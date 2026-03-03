"""
БД-операции для unified stories: создание логов, коммит, статус активности.
"""
from sqlalchemy.orm import Session
from models_library.automations import StoriesAutomationLog
from models_library.projects import Project
from datetime import datetime, timezone
import json
import uuid

from .retrieval_helpers import get_story_preview


def _create_manual_story_log(project_id: str, group_id: int, s_id: int, vk_story: dict) -> StoriesAutomationLog:
    """Создаёт запись лога для ручной истории, найденной в VK."""
    story_link = f"https://vk.com/story-{group_id}_{s_id}"
    current_preview = get_story_preview(vk_story)
    
    return StoriesAutomationLog(
        id=str(uuid.uuid4()),
        project_id=project_id,
        vk_post_id=0,  # Manual
        status='published',
        created_at=datetime.fromtimestamp(vk_story.get('date', 0), tz=timezone.utc),
        image_url=current_preview,
        is_active=True,
        log=json.dumps({
            "story_link": story_link, 
            "image_url": current_preview, 
            "story_type": vk_story.get('type', 'photo'),
            "source": "manual",
            "imported_at": datetime.now().isoformat()
        })
    )


def _determine_activity_status(refresh: bool, vk_story: dict | None, log_obj, logs_to_update: list) -> bool:
    """Определяет статус активности истории и обновляет лог при необходимости."""
    if refresh:
        is_active = vk_story is not None
        if log_obj and log_obj.is_active != is_active:
            log_obj.is_active = is_active
            # Если история снова стала активной — сбрасываем финализацию
            if is_active and getattr(log_obj, 'stats_finalized', False):
                log_obj.stats_finalized = False
                log_obj.viewers_finalized = False
            if log_obj not in logs_to_update:
                logs_to_update.append(log_obj)
        return is_active
    else:
        return log_obj.is_active if log_obj else False


def _commit_updates(db: Session, logs_to_update: list, new_logs_to_add: list):
    """Пакетный коммит обновлённых и новых логов."""
    if logs_to_update:
        try:
            db.add_all(logs_to_update)
            db.commit()
        except Exception as e:
            print(f"STORIES: Failed to save healed logs: {e}")

    if new_logs_to_add:
        try:
            db.add_all(new_logs_to_add)
            db.commit()
        except Exception:
            pass


def _update_last_stories_timestamp(db: Session, project_id: str):
    """Обновляет метку последнего обновления историй для проекта."""
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            project.last_stories_update = datetime.now(timezone.utc).isoformat()
            db.commit()
    except Exception as e:
        print(f"STORIES: Failed to update last_stories_update: {e}")
