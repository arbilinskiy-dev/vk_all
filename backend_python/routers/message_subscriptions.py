"""
Роутер для статистики подписок/отписок на сообщения сообщества.
События message_allow / message_deny из VK Callback API.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import logging

from database import get_db
from crud import message_subscriptions_crud

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/messages/subscriptions", tags=["Message Subscriptions"])


# =============================================================================
# ГЛОБАЛЬНАЯ СВОДКА
# =============================================================================

@router.get("/summary")
def get_subscriptions_summary(
    date_from: Optional[str] = Query(None, description="Начало диапазона YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="Конец диапазона YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Глобальная сводка: всего подписок, отписок, уникальных пользователей, проектов.
    """
    return {
        "success": True,
        **message_subscriptions_crud.get_subscriptions_summary(db, date_from, date_to),
    }


# =============================================================================
# ГРАФИК (часовые слоты)
# =============================================================================

@router.get("/chart")
def get_subscriptions_chart(
    project_id: Optional[str] = Query(None, description="ID проекта (None = все)"),
    date_from: Optional[str] = Query(None, description="Начало диапазона YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="Конец диапазона YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Данные для графика подписок/отписок по часовым слотам.
    """
    chart_data = message_subscriptions_crud.get_subscriptions_chart(
        db, project_id, date_from, date_to
    )
    return {
        "success": True,
        "chart": chart_data,
    }


# =============================================================================
# СВОДКА ПО ПРОЕКТАМ
# =============================================================================

@router.get("/projects")
def get_subscriptions_by_projects(
    date_from: Optional[str] = Query(None, description="Начало диапазона YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="Конец диапазона YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Подписки/отписки по каждому проекту.
    """
    return {
        "success": True,
        "projects": message_subscriptions_crud.get_subscriptions_by_projects(
            db, date_from, date_to
        ),
    }


# =============================================================================
# ЛЕНТА СОБЫТИЙ (пользователи проекта)
# =============================================================================

@router.get("/project/{project_id}/users")
def get_subscriptions_project_users(
    project_id: str,
    event_type: Optional[str] = Query(None, description="Фильтр: allow / deny"),
    date_from: Optional[str] = Query(None, description="Начало диапазона YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="Конец диапазона YYYY-MM-DD"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Пользователи проекта с агрегированными подписками/отписками.
    """
    data = message_subscriptions_crud.get_subscriptions_project_users(
        db, project_id, event_type, date_from, date_to, limit, offset
    )
    return {
        "success": True,
        **data,
    }


# =============================================================================
# ЛЕНТА СОБЫТИЙ (все события)
# =============================================================================

@router.get("/events")
def get_subscriptions_events(
    project_id: Optional[str] = Query(None, description="ID проекта"),
    event_type: Optional[str] = Query(None, description="Фильтр: allow / deny"),
    date_from: Optional[str] = Query(None, description="Начало диапазона YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="Конец диапазона YYYY-MM-DD"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Лента отдельных событий подписки/отписки с пагинацией.
    """
    data = message_subscriptions_crud.get_subscriptions_events(
        db, project_id, event_type, date_from, date_to, limit, offset
    )
    return {
        "success": True,
        **data,
    }
