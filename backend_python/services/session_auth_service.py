"""
Сервис авторизации — серверные сессии, bcrypt, логирование.
Заменяет старый auth_service.py, добавляя полноценное управление сессиями.
"""

from sqlalchemy.orm import Session
from typing import Optional
import bcrypt
import logging

from config import settings
import crud
from crud import auth_session_crud, auth_log_crud

logger = logging.getLogger(__name__)


# ===================================================================
# ХЕШИРОВАНИЕ ПАРОЛЕЙ
# ===================================================================

def hash_password(password: str) -> str:
    """Хеширует пароль через bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Проверяет пароль. Поддерживает как bcrypt-хеши, так и plain-text
    (для обратной совместимости с существующими паролями).
    """
    # Если пароль начинается с $2b$ или $2a$ — это bcrypt хеш
    if hashed_password.startswith('$2b$') or hashed_password.startswith('$2a$'):
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    else:
        # Обратная совместимость: plain-text пароли (старые записи)
        return plain_password == hashed_password


# ===================================================================
# АУТЕНТИФИКАЦИЯ + СОЗДАНИЕ СЕССИИ
# ===================================================================

def authenticate_and_create_session(
    db: Session,
    username: str,
    password: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> Optional[dict]:
    """
    Полный цикл аутентификации:
    1. Проверяет логин/пароль (admin из .env или users из БД)
    2. Создаёт серверную сессию
    3. Пишет лог
    4. Возвращает данные для фронтенда + session_token
    
    Множественные одновременные сессии РАЗРЕШЕНЫ.
    ЗАДЕЛ: Для force-logout добавить вызов terminate_user_sessions() перед created session.
    """
    user_id = None
    role = None
    user_type = "system"
    
    # 1. Проверяем admin из .env
    full_name = ""
    if username == settings.admin_username and password == settings.admin_password:
        user_id = "admin"
        role = "admin"
    else:
        # 2. Ищем в БД
        db_user = crud.get_user_by_username(db, username)
        if db_user and verify_password(password, db_user.password):
            user_id = str(db_user.id)
            role = "user"
            full_name = db_user.full_name or ""
    
    # Если аутентификация не удалась
    if user_id is None:
        # Логируем неудачную попытку
        auth_log_crud.create_log(
            db=db,
            event_type="login_failed",
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"attempted_username": username},
        )
        logger.warning(f"❌ Неудачная попытка входа: username={username}, ip={ip_address}")
        return None
    
    # ======================================================
    # ЗАДЕЛ: Force-logout (закомментировано, включить когда нужно)
    # terminated = auth_session_crud.terminate_user_sessions(db, user_id, terminated_by="force")
    # if terminated > 0:
    #     auth_log_crud.create_log(
    #         db=db, event_type="force_logout", user_id=user_id,
    #         username=username, details={"terminated_sessions": terminated}
    #     )
    # ======================================================
    
    # 3. Создаём сессию
    session = auth_session_crud.create_session(
        db=db,
        user_id=user_id,
        username=username,
        role=role,
        user_type=user_type,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    # 4. Пишем лог
    active_count = auth_session_crud.get_active_sessions_count(db, user_id)
    auth_log_crud.create_log(
        db=db,
        event_type="login_success",
        user_id=user_id,
        username=username,
        ip_address=ip_address,
        user_agent=user_agent,
        details={"active_sessions": active_count},
    )
    
    logger.info(f"✅ Успешный вход: username={username}, role={role}, active_sessions={active_count}")
    
    return {
        "success": True,
        "username": username,
        "role": role,
        "full_name": full_name,
        "session_token": session.session_token,
    }


# ===================================================================
# ВЫХОД
# ===================================================================

def logout(
    db: Session,
    session_token: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> bool:
    """
    Завершает сессию и пишет лог.
    """
    # Получаем данные сессии перед деактивацией (для лога)
    session = auth_session_crud.get_session_by_token(db, session_token)
    if not session:
        return False
    
    # Деактивируем сессию
    auth_session_crud.terminate_session(db, session_token, terminated_by="user")
    
    # Пишем лог
    auth_log_crud.create_log(
        db=db,
        event_type="logout",
        user_id=session.user_id,
        username=session.username,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    logger.info(f"🚪 Выход: username={session.username}")
    return True


# ===================================================================
# ФОНОВАЯ ОЧИСТКА ПРОТУХШИХ СЕССИЙ
# ===================================================================

def cleanup_expired_sessions(db: Session, timeout_minutes: int = 20) -> int:
    """
    Деактивирует протухшие сессии и пишет логи для каждой.
    Вызывается из фоновой задачи.
    """
    # Сначала получаем протухшие сессии для логирования
    expired = auth_session_crud.get_expired_sessions_for_logging(db, timeout_minutes)
    
    for session in expired:
        from datetime import datetime
        duration = (datetime.utcnow() - session.created_at).total_seconds() / 60
        auth_log_crud.create_log(
            db=db,
            event_type="timeout",
            user_id=session.user_id,
            username=session.username,
            ip_address=session.ip_address,
            user_agent=session.user_agent,
            details={"session_duration_minutes": round(duration, 1)},
        )
    
    # Деактивируем все протухшие разом
    count = auth_session_crud.cleanup_expired_sessions(db, timeout_minutes)
    
    if count > 0:
        logger.info(f"🧹 Очищено протухших сессий: {count}")
    
    return count
