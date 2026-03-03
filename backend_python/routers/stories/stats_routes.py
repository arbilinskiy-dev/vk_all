"""
Эндпоинты статистики и зрителей историй.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models_library.automations import StoriesAutomationLog
from models_library.projects import Project
from services.automations import stories_service
from services.automations.stories import viewers as viewers_service
import json

from .schemas import GetPayload, UpdateStatsPayload
from .dependencies import get_db, get_community_tokens, get_user_token, resolve_logs_by_mode

router = APIRouter()


@router.post("/getStoriesStats")
def get_stories_stats(payload: GetPayload, db: Session = Depends(get_db)):
    """
    Get statistics for published stories from DB.
    """
    logs = db.query(StoriesAutomationLog).filter(
        StoriesAutomationLog.project_id == payload.projectId,
        StoriesAutomationLog.status == 'published'
    ).order_by(StoriesAutomationLog.created_at.desc()).limit(100).all()

    result = []
    
    for log in logs:
        try:
            stats_data = json.loads(log.stats) if log.stats else None
        except:
            stats_data = None
            
        story_link = None
        if log.log:
             try:
                 log_data = json.loads(log.log)
                 story_link = log_data.get('story_link')
             except: pass
        
        result.append({
            "logId": log.id,
            "vkPostId": log.vk_post_id,
            "date": log.created_at,
            "stats": stats_data,
            "statsUpdatedAt": log.stats_updated_at,
            "storyLink": story_link
        })
        
    return result


@router.post("/updateStoriesStats")
def update_stories_stats(payload: UpdateStatsPayload, db: Session = Depends(get_db)):
    """
    Updates statistics for stories based on criteria.
    """
    user_token = get_user_token()
    
    # Извлекаем все токены сообщества
    project = db.query(Project).filter(Project.id == payload.projectId).first()
    community_tokens = get_community_tokens(project)
    
    logs, error = resolve_logs_by_mode(db, payload, project, user_token)
    if error:
        return {"status": "error", "message": error}
    
    return stories_service.batch_update_stats(db, logs, user_token, community_tokens=community_tokens)


@router.post("/updateStoriesViewers")
def update_stories_viewers(payload: UpdateStatsPayload, db: Session = Depends(get_db)):
    """
    Обновляет данные о зрителях для историй.
    Поддерживает те же режимы, что и updateStoriesStats.
    """
    user_token = get_user_token()
    
    # Извлекаем все токены сообщества
    project = db.query(Project).filter(Project.id == payload.projectId).first()
    community_tokens = get_community_tokens(project)
    
    def _log_viewers_result(result):
        try:
            print(f"[Viewers Response] {json.dumps(result, ensure_ascii=False, default=str)[:5000]}")
        except Exception as e:
            print(f"[Viewers Response] Failed to serialize: {e}")
        return result
    
    logs, error = resolve_logs_by_mode(db, payload, project, user_token)
    if error:
        return {"status": "error", "message": error}
    
    return _log_viewers_result(viewers_service.batch_update_viewers(db, logs, user_token, community_tokens=community_tokens))


@router.post("/updateStoriesAll")
def update_stories_all(payload: UpdateStatsPayload, db: Session = Depends(get_db)):
    """
    Обновляет и статистику, и зрителей для историй.
    """
    user_token = get_user_token()
    
    # Извлекаем все токены сообщества
    project = db.query(Project).filter(Project.id == payload.projectId).first()
    community_tokens = get_community_tokens(project)
    
    def _log_all_result(result):
        try:
            print(f"[UpdateAll Response] {json.dumps(result, ensure_ascii=False, default=str)[:5000]}")
        except Exception as e:
            print(f"[UpdateAll Response] Failed to serialize: {e}")
        return result
    
    logs, error = resolve_logs_by_mode(db, payload, project, user_token)
    if error:
        return {"status": "error", "message": error}
    
    return _log_all_result(viewers_service.update_all_stats_and_viewers(db, logs, user_token, community_tokens=community_tokens))
