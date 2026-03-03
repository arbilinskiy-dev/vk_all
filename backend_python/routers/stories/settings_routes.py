"""
Эндпоинты настроек и логов автоматизации историй.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models_library.automations import StoriesAutomation, StoriesAutomationLog
from models_library.projects import Project
from datetime import datetime, timedelta, timezone
import uuid

from .schemas import GetPayload, UpdatePayload, StoriesFreshnessResponse
from .dependencies import get_db

router = APIRouter()


@router.post("/getStoriesFreshness")
def get_stories_freshness(payload: GetPayload, db: Session = Depends(get_db)):
    """
    Проверяет свежесть данных историй для проекта.
    Возвращает is_stale=True если данные устарели (старше 5 минут).
    """
    project = db.query(Project).filter(Project.id == payload.projectId).first()
    if not project:
        raise HTTPException(404, "Project not found")
    
    stale_minutes = 5
    is_stale = True
    last_update = project.last_stories_update
    
    if last_update:
        try:
            # Парсим ISO формат
            update_time = datetime.fromisoformat(last_update.replace('Z', '+00:00'))
            threshold = datetime.now(timezone.utc) - timedelta(minutes=stale_minutes)
            is_stale = update_time < threshold
        except Exception:
            is_stale = True
    
    return StoriesFreshnessResponse(
        is_stale=is_stale,
        last_update=last_update,
        stale_minutes=stale_minutes
    )


@router.post("/getStoriesAutomation")
def get_stories_automation(payload: GetPayload, db: Session = Depends(get_db)):
    """
    Get settings for stories automation.
    Using POST because many other endpoints here use POST for getters.
    """
    settings = db.query(StoriesAutomation).filter(StoriesAutomation.project_id == payload.projectId).first()
    if not settings:
        return {"is_active": False, "keywords": ""}
    return {"is_active": settings.is_active, "keywords": settings.keywords}


@router.post("/getStoriesAutomationLogs")
def get_stories_automation_logs(payload: GetPayload, db: Session = Depends(get_db)):
    """
    Get logs for stories automation.
    Исключаем тяжёлые поля (viewers, stats) и ограничиваем количество записей,
    чтобы ответ не превышал лимит Serverless Container (~3.5 МБ).
    """
    logs = db.query(
        StoriesAutomationLog.id,
        StoriesAutomationLog.project_id,
        StoriesAutomationLog.vk_post_id,
        StoriesAutomationLog.created_at,
        StoriesAutomationLog.post_link,
        StoriesAutomationLog.post_text,
        StoriesAutomationLog.image_url,
        StoriesAutomationLog.status,
        StoriesAutomationLog.entry_number,
        StoriesAutomationLog.log,
        StoriesAutomationLog.is_active,
        StoriesAutomationLog.stats_finalized,
    ).filter(
        StoriesAutomationLog.project_id == payload.projectId
    ).order_by(
        StoriesAutomationLog.created_at.desc()
    ).limit(200).all()
    
    # Преобразуем Row-объекты в словари
    return [
        {
            "id": row.id,
            "project_id": row.project_id,
            "vk_post_id": row.vk_post_id,
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "post_link": row.post_link,
            "post_text": row.post_text,
            "image_url": row.image_url,
            "status": row.status,
            "entry_number": row.entry_number,
            "log": row.log,
            "is_active": row.is_active,
            "stats_finalized": row.stats_finalized,
        }
        for row in logs
    ]


@router.post("/updateStoriesAutomation")
def update_stories_automation(payload: UpdatePayload, db: Session = Depends(get_db)):
    settings = db.query(StoriesAutomation).filter(StoriesAutomation.project_id == payload.projectId).first()
    if not settings:
        settings = StoriesAutomation(id=str(uuid.uuid4()), project_id=payload.projectId)
        db.add(settings)
    
    settings.is_active = payload.settings.is_active
    settings.keywords = payload.settings.keywords
    db.commit()
    return {"status": "ok", "settings": {"is_active": settings.is_active, "keywords": settings.keywords}}
