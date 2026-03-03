"""
Роутер для мониторинга активных сессий.
Позволяет администраторам видеть, кто сейчас в сети, и принудительно завершать сессии.
Доступен ТОЛЬКО администраторам.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from services.auth_middleware import get_current_admin, CurrentUser
from crud import auth_session_crud, auth_log_crud

router = APIRouter(prefix="/active-sessions", tags=["Active Sessions"])


# --- Pydantic схемы ---

class TerminateSessionPayload(BaseModel):
    session_id: str


# --- Эндпоинты ---

@router.post("/get")
def get_active_sessions(
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    """
    Возвращает список всех активных сессий.
    Только для администраторов.
    """
    sessions = auth_session_crud.get_all_active_sessions(db)
    
    now = datetime.utcnow()
    
    return {
        "sessions": [
            {
                "id": s.id,
                "user_id": s.user_id,
                "username": s.username,
                "role": s.role,
                "user_type": s.user_type,
                "ip_address": s.ip_address,
                "user_agent": s.user_agent,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "last_activity": s.last_activity.isoformat() if s.last_activity else None,
                # Длительность сессии в минутах
                "session_duration_minutes": round(
                    (now - s.created_at).total_seconds() / 60, 1
                ) if s.created_at else None,
                # Время бездействия в минутах
                "idle_minutes": round(
                    (now - s.last_activity).total_seconds() / 60, 1
                ) if s.last_activity else None,
            }
            for s in sessions
        ],
        "total": len(sessions),
    }


@router.post("/terminate")
def terminate_session(
    payload: TerminateSessionPayload,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    """
    Принудительно завершает сессию пользователя (кик).
    Только для администраторов.
    Записывает событие в лог авторизации.
    """
    # Получаем информацию о сессии до завершения (для логирования)
    from sqlalchemy import and_
    import models
    session = db.query(models.AuthSession).filter(
        and_(
            models.AuthSession.id == payload.session_id,
            models.AuthSession.is_active == True,
        )
    ).first()
    
    if not session:
        return {"success": False, "message": "Сессия не найдена или уже завершена"}
    
    target_username = session.username
    target_user_id = session.user_id
    target_ip = session.ip_address
    target_ua = session.user_agent
    
    # Завершаем сессию
    success = auth_session_crud.terminate_session_by_id(db, payload.session_id, terminated_by="force")
    
    if success:
        # Логируем принудительное завершение
        import json
        auth_log_crud.create_log(
            db=db,
            user_id=target_user_id,
            username=target_username,
            event_type="force_logout",
            ip_address=target_ip,
            user_agent=target_ua,
            details=json.dumps({
                "terminated_by_admin": admin.username,
                "session_id": payload.session_id,
            }),
        )
    
    return {"success": success}
