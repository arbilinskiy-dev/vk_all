"""
Middleware аутентификации — FastAPI Dependency.
Проверяет серверную сессию по заголовку X-Session-Token.
"""

from fastapi import Request, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from crud import auth_session_crud

# Данные текущего пользователя, доступные через Depends
class CurrentUser:
    """Объект текущего авторизованного пользователя."""
    def __init__(self, user_id: str, username: str, role: str, user_type: str, session_id: str, full_name: str = ""):
        self.user_id = user_id
        self.username = username
        self.role = role
        self.user_type = user_type
        self.session_id = session_id
        self.full_name = full_name
    
    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


async def get_current_user(request: Request, db: Session = Depends(get_db)) -> CurrentUser:
    """
    FastAPI dependency — извлекает и проверяет серверную сессию.
    Обновляет last_activity при каждом запросе (продление TTL).
    
    Использование:
        @router.post("/endpoint")
        def my_endpoint(current_user: CurrentUser = Depends(get_current_user)):
            if current_user.is_admin: ...
    """
    session_token = request.headers.get("X-Session-Token")
    
    if not session_token:
        raise HTTPException(
            status_code=401,
            detail="Сессия не найдена. Пожалуйста, авторизуйтесь.",
        )
    
    session = auth_session_crud.get_session_by_token(db, session_token)
    
    if not session:
        raise HTTPException(
            status_code=401,
            detail="Сессия истекла или недействительна. Пожалуйста, авторизуйтесь заново.",
        )
    
    # Проверяем таймаут бездействия (20 минут)
    from datetime import datetime, timedelta
    SESSION_TIMEOUT_MINUTES = 20
    
    if session.last_activity < datetime.utcnow() - timedelta(minutes=SESSION_TIMEOUT_MINUTES):
        # Сессия протухла — деактивируем
        auth_session_crud.terminate_session(db, session_token, terminated_by="timeout")
        raise HTTPException(
            status_code=401,
            detail="Сессия завершена по таймауту бездействия. Пожалуйста, авторизуйтесь заново.",
        )
    
    # Продлеваем TTL — обновляем last_activity
    auth_session_crud.update_last_activity(db, session.id)
    
    return CurrentUser(
        user_id=session.user_id,
        username=session.username,
        role=session.role,
        user_type=session.user_type,
        session_id=session.id,
    )


async def get_current_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """
    FastAPI dependency — проверяет, что текущий пользователь — администратор.
    
    Использование:
        @router.post("/admin-endpoint")
        def my_admin_endpoint(admin: CurrentUser = Depends(get_current_admin)):
            ...
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Доступ запрещён. Требуются права администратора.",
        )
    return current_user


async def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[CurrentUser]:
    """
    Опциональная аутентификация — не блокирует запрос если токена нет.
    Полезно для эндпоинтов, доступных и авторизованным, и анонимным пользователям.
    """
    session_token = request.headers.get("X-Session-Token")
    
    if not session_token:
        return None
    
    session = auth_session_crud.get_session_by_token(db, session_token)
    
    if not session:
        return None
    
    # Проверяем таймаут
    from datetime import datetime, timedelta
    if session.last_activity < datetime.utcnow() - timedelta(minutes=20):
        auth_session_crud.terminate_session(db, session_token, terminated_by="timeout")
        return None
    
    # Продлеваем TTL
    auth_session_crud.update_last_activity(db, session.id)
    
    return CurrentUser(
        user_id=session.user_id,
        username=session.username,
        role=session.role,
        user_type=session.user_type,
        session_id=session.id,
    )
