"""
Роутер для просмотра логов авторизации.
Доступен ТОЛЬКО администраторам.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from database import get_db
from services.auth_middleware import get_current_admin, CurrentUser
from crud import auth_log_crud

router = APIRouter(prefix="/auth-logs", tags=["Auth Logs"])


# --- Pydantic схемы ---

class GetAuthLogsPayload(BaseModel):
    page: int = 1
    page_size: int = 50
    user_id: Optional[str] = None
    event_type: Optional[str] = None
    date_from: Optional[str] = None  # ISO формат: 2026-02-25T00:00:00
    date_to: Optional[str] = None

class ClearAuthLogsPayload(BaseModel):
    older_than_days: Optional[int] = None  # null = удалить все


# --- Эндпоинты ---

@router.post("/get")
def get_auth_logs(
    payload: GetAuthLogsPayload,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    """
    Получает логи авторизации с фильтрацией и пагинацией.
    Только для администраторов.
    """
    logs, total = auth_log_crud.get_logs(
        db=db,
        page=payload.page,
        page_size=payload.page_size,
        user_id=payload.user_id,
        event_type=payload.event_type,
        date_from=payload.date_from,
        date_to=payload.date_to,
    )
    
    import json
    
    return {
        "logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "user_type": log.user_type,
                "username": log.username,
                "event_type": log.event_type,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "details": json.loads(log.details) if log.details else None,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
        "total": total,
        "page": payload.page,
        "page_size": payload.page_size,
    }


@router.post("/users")
def get_log_users(
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    """
    Возвращает список уникальных пользователей из логов (для фильтра на фронте).
    Только для администраторов.
    """
    return auth_log_crud.get_unique_users_from_logs(db)


@router.post("/clear")
def clear_auth_logs(
    payload: ClearAuthLogsPayload,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    """
    Очищает логи авторизации.
    Только для администраторов.
    """
    count = auth_log_crud.clear_logs(db, older_than_days=payload.older_than_days)
    return {"success": True, "deleted": count}
