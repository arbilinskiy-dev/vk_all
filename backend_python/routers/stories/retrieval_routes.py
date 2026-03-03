"""
Эндпоинты получения и обновления списка историй.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from services.automations import stories_service

from .schemas import GetPayload, DashboardStatsPayload
from .dependencies import get_db, get_user_token

router = APIRouter()


@router.post("/getUnifiedStories")
def get_unified_stories_endpoint(payload: GetPayload, db: Session = Depends(get_db)):
    """
    Get active stories. Defaults to DB cache unless refresh=True.
    """
    return stories_service.get_unified_stories(db, payload.projectId, refresh=payload.refresh)


@router.post("/getCachedStories")
def get_cached_stories_endpoint(payload: GetPayload, db: Session = Depends(get_db)):
    """
    Получение историй только из кэша БД (без VK API запросов).
    Поддерживает пагинацию (limit/offset).
    Viewers НЕ включаются.
    """
    return stories_service.get_unified_stories(
        db, payload.projectId, refresh=False, include_viewers=True,
        limit=payload.limit, offset=payload.offset
    )


@router.post("/refreshStories")
def refresh_stories_endpoint(payload: GetPayload, db: Session = Depends(get_db)):
    """
    Принудительное обновление историй из VK API.
    Поддерживает пагинацию (limit/offset). Viewers НЕ включаются.
    """
    return stories_service.get_unified_stories(
        db, payload.projectId, refresh=True, include_viewers=True,
        limit=payload.limit, offset=payload.offset
    )


@router.post("/getStoriesDashboardStats")
def get_stories_dashboard_stats_endpoint(payload: DashboardStatsPayload, db: Session = Depends(get_db)):
    """
    Агрегированная статистика для дашборда историй.
    Лёгкий эндпоинт (~1KB ответ) с фильтрацией по периоду и типу.
    """
    return stories_service.get_stories_dashboard_stats(
        db, payload.projectId,
        period_type=payload.periodType,
        filter_type=payload.filterType,
        custom_start=payload.customStartDate,
        custom_end=payload.customEndDate
    )


@router.post("/getCommunityStories")
def get_community_stories_endpoint(payload: GetPayload, db: Session = Depends(get_db)):
    """
    Get all active stories from the community (VK).
    """
    user_token = get_user_token()
    result = stories_service.get_community_stories(db, payload.projectId, user_token)
    if 'error' in result:
         # Return a simplified error if needed, or raise HTTPException
         # For this specific case, 200 OK with error field is often easier for frontend to handle gracefully
         # But let's raise HTTPException for consistency if it's a hard failure
         if 'Project not found' in result['error']: 
             raise HTTPException(404, detail=result['error'])
         # We'll return the error object so frontend can show the VK message
         return result
    return result
