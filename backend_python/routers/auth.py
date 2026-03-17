from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import time
import collections

import crud
import schemas
import services.session_auth_service as session_auth_service
from database import get_db
from services.auth_middleware import get_current_user, CurrentUser

router = APIRouter()

# =====================================================
# Rate limiting для /auth/login — защита от перебора паролей
# 5 попыток в минуту на IP, потом 429 Too Many Requests
# =====================================================
_LOGIN_ATTEMPTS: dict[str, collections.deque] = {}
_LOGIN_MAX_ATTEMPTS = 5
_LOGIN_WINDOW_SECONDS = 60

def _check_login_rate_limit(ip: str):
    """Проверяет, не превышен ли лимит попыток входа для IP."""
    now = time.time()
    if ip not in _LOGIN_ATTEMPTS:
        _LOGIN_ATTEMPTS[ip] = collections.deque()
    
    attempts = _LOGIN_ATTEMPTS[ip]
    # Удаляем устаревшие попытки
    while attempts and attempts[0] < now - _LOGIN_WINDOW_SECONDS:
        attempts.popleft()
    
    if len(attempts) >= _LOGIN_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Слишком много попыток входа. Подождите минуту.",
        )
    attempts.append(now)


@router.post("/auth/login")
def login(payload: schemas.LoginPayload, request: Request, db: Session = Depends(get_db)):
    """
    Аутентифицирует пользователя по логину и паролю.
    Создаёт серверную сессию и возвращает session_token.
    Множественные одновременные сессии РАЗРЕШЕНЫ.
    """
    # Извлекаем IP и User-Agent из запроса
    ip_address = request.headers.get("X-Forwarded-For", request.client.host if request.client else None)
    user_agent = request.headers.get("User-Agent")
    
    # Rate limiting по IP
    _check_login_rate_limit(ip_address or "unknown")
    
    result = session_auth_service.authenticate_and_create_session(
        db=db,
        username=payload.username,
        password=payload.password,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    if not result:
        raise HTTPException(
            status_code=401,
            detail="Неправильный логин или пароль",
        )
    
    return result


@router.post("/auth/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    """
    Завершает текущую сессию пользователя.
    Фронтенд отправляет X-Session-Token в заголовке.
    """
    session_token = request.headers.get("X-Session-Token")
    if not session_token:
        raise HTTPException(status_code=400, detail="Токен сессии не предоставлен")
    
    ip_address = request.headers.get("X-Forwarded-For", request.client.host if request.client else None)
    user_agent = request.headers.get("User-Agent")
    
    success = session_auth_service.logout(
        db=db,
        session_token=session_token,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    return {"success": success}


@router.post("/auth/check-session")
def check_session(current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Проверяет, жива ли текущая сессия.
    Используется фронтендом при восстановлении сессии после перезагрузки.
    Если сессия протухла — middleware вернёт 401.
    """
    # Подтягиваем ФИО из БД для не-admin пользователей
    full_name = ""
    if current_user.role != "admin" and current_user.user_id != "admin":
        db_user = crud.get_user_by_username(db, current_user.username)
        if db_user:
            full_name = db_user.full_name or ""
    
    return {
        "valid": True,
        "username": current_user.username,
        "role": current_user.role,
        "full_name": full_name,
        "is_system_admin": current_user.user_id == "admin",
    }
