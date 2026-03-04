# ===============================================
# BATCH CRUD — отдельные функции для массовой загрузки
# каждого типа данных одним SQL-запросом.
# Замена старого get_all_data_for_project_ids,
# который грузил ВСЁ одним тяжёлым запросом.
# ===============================================

from sqlalchemy.orm import Session, subqueryload
import logging
import json
import re

import models
from schemas import ScheduledPost, SystemPost, SuggestedPost, Note

logger = logging.getLogger(__name__)


def get_posts_batch(db: Session, project_ids: list[str]) -> dict[str, list]:
    """Загружает опубликованные посты для массива проектов одним SQL-запросом."""
    result = {pid: [] for pid in project_ids}
    
    rows = (
        db.query(models.Post)
        .options(subqueryload(models.Post.tags))
        .filter(models.Post.projectId.in_(project_ids))
        .all()
    )
    
    for p in rows:
        try:
            result[p.projectId].append(
                ScheduledPost.model_validate(p, from_attributes=True)
            )
        except Exception as e:
            logger.warning(f"[batch] Пропускаем пост {getattr(p, 'id', '?')}: {e}")
    
    return result


def get_scheduled_posts_batch(db: Session, project_ids: list[str]) -> dict[str, list]:
    """Загружает отложенные посты для массива проектов одним SQL-запросом."""
    result = {pid: [] for pid in project_ids}
    
    rows = (
        db.query(models.ScheduledPost)
        .options(subqueryload(models.ScheduledPost.tags))
        .filter(models.ScheduledPost.projectId.in_(project_ids))
        .all()
    )
    
    for p in rows:
        try:
            result[p.projectId].append(
                ScheduledPost.model_validate(p, from_attributes=True)
            )
        except Exception as e:
            logger.warning(f"[batch] Пропускаем отложенный пост {getattr(p, 'id', '?')}: {e}")
    
    return result


def get_suggested_posts_batch(db: Session, project_ids: list[str]) -> dict[str, list]:
    """Загружает предложенные посты для массива проектов одним SQL-запросом."""
    result = {pid: [] for pid in project_ids}
    
    rows = (
        db.query(models.SuggestedPost)
        .filter(models.SuggestedPost.projectId.in_(project_ids))
        .all()
    )
    
    for p in rows:
        try:
            result[p.projectId].append(
                SuggestedPost.model_validate(p, from_attributes=True)
            )
        except Exception as e:
            logger.warning(f"[batch] Пропускаем предложенный пост {getattr(p, 'id', '?')}: {e}")
    
    return result


def get_system_posts_batch(db: Session, project_ids: list[str]) -> dict[str, list]:
    """Загружает активные системные посты для массива проектов одним SQL-запросом."""
    result = {pid: [] for pid in project_ids}
    
    rows = (
        db.query(models.SystemPost)
        .filter(
            models.SystemPost.project_id.in_(project_ids),
            models.SystemPost.is_active == True
        )
        .all()
    )
    
    for p in rows:
        try:
            result[p.project_id].append(
                SystemPost.model_validate(p, from_attributes=True)
            )
        except Exception as e:
            logger.warning(f"[batch] Пропускаем системный пост {getattr(p, 'id', '?')}: {e}")
    
    return result


def get_notes_batch(db: Session, project_ids: list[str]) -> dict[str, list]:
    """Загружает заметки для массива проектов одним SQL-запросом."""
    result = {pid: [] for pid in project_ids}
    
    rows = (
        db.query(models.Note)
        .filter(models.Note.projectId.in_(project_ids))
        .all()
    )
    
    for n in rows:
        try:
            result[n.projectId].append(
                Note.model_validate(n, from_attributes=True)
            )
        except Exception as e:
            logger.warning(f"[batch] Пропускаем заметку {getattr(n, 'id', '?')}: {e}")
    
    return result


def get_stories_batch(db: Session, project_ids: list[str]) -> dict[str, list]:
    """
    Загружает stories для массива проектов — ЛЁГКАЯ версия.
    Читает только StoriesAutomationLog из БД, без fallback-запросов к Post,
    без обращения к VK API. Это чистое чтение кеша.
    """
    from models_library.automations import StoriesAutomationLog
    
    result = {pid: [] for pid in project_ids}
    
    logs = (
        db.query(StoriesAutomationLog)
        .filter(StoriesAutomationLog.project_id.in_(project_ids))
        .all()
    )
    
    for log in logs:
        try:
            # Извлекаем story_link и image_url из JSON-поля log
            story_link = None
            log_image = None
            vk_story_id = None
            story_type = "photo"  # По умолчанию фото, но читаем реальный тип из JSON
            video_url = None
            
            if log.log:
                try:
                    data = json.loads(log.log)
                    story_link = data.get('story_link')
                    log_image = data.get('image_url')
                    
                    # Читаем story_type из JSON-лога (сохраняется при refresh)
                    saved_type = data.get('story_type')
                    if saved_type:
                        story_type = saved_type
                    
                    # Читаем video_url если есть
                    video_url = data.get('video_url')
                    
                    # Извлекаем VK story ID из ссылки (поддерживаем vk.com и vk.ru)
                    if story_link:
                        parts = re.sub(r'https?://vk\.(?:com|ru)/story', '', story_link).split('_')
                        if len(parts) >= 2:
                            vk_story_id = int(parts[-1].split('?')[0])
                except Exception:
                    pass
            
            # Формируем объект story в том же формате, что и get_unified_stories
            story_item = {
                "id": vk_story_id or log.id,
                "date": int(log.created_at.timestamp()) if log.created_at else 0,
                "type": story_type,
                "preview": log.image_url or log_image,
                "video_url": video_url,
                "link": story_link,
                "views": 0,
                "is_active": log.is_active if hasattr(log, 'is_active') else False,
                "is_automated": log.vk_post_id is not None and log.vk_post_id > 0,
                "db_log_id": log.id,
                "stats": None,
                "stats_updated_at": None,
                "viewers": None,
                "viewers_updated_at": None,
            }
            
            # Парсим статистику если есть
            if log.stats:
                try:
                    story_item["stats"] = json.loads(log.stats)
                except Exception:
                    pass
            
            if log.stats_updated_at:
                story_item["stats_updated_at"] = log.stats_updated_at.isoformat()
            
            # ВАЖНО: viewers НЕ включаем в batch-ответ!
            # Это огромные JSON-массивы, которые вызывают OOM/502 при загрузке
            # для 145 проектов. Viewers загружаются отдельно по требованию.
            
            if log.viewers_updated_at:
                story_item["viewers_updated_at"] = log.viewers_updated_at.isoformat()
            
            result[log.project_id].append(story_item)
            
        except Exception as e:
            logger.warning(f"[batch] Пропускаем story {getattr(log, 'id', '?')}: {e}")
    
    return result
