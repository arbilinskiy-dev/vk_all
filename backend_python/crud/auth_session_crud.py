"""
CRUD операции для таблицы auth_sessions.
Управление серверными сессиями пользователей.
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List
from datetime import datetime, timedelta
import uuid
import secrets

import models


def create_session(
    db: Session,
    user_id: str,
    username: str,
    role: str,
    user_type: str = "system",
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> models.AuthSession:
    """
    Создаёт новую сессию для пользователя.
    Разрешает множественные одновременные сессии для одного пользователя.
    
    ЗАДЕЛ: Для force-logout при повторном логине — добавить вызов
    terminate_user_sessions() перед созданием новой сессии.
    """
    session = models.AuthSession(
        id=str(uuid.uuid4()),
        session_token=secrets.token_urlsafe(48),  # 64 символа — криптографически стойкий
        user_id=user_id,
        user_type=user_type,
        username=username,
        role=role,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session_by_token(db: Session, session_token: str) -> Optional[models.AuthSession]:
    """Находит активную сессию по токену."""
    return db.query(models.AuthSession).filter(
        and_(
            models.AuthSession.session_token == session_token,
            models.AuthSession.is_active == True,
        )
    ).first()


def update_last_activity(db: Session, session_id: str) -> None:
    """Обновляет время последней активности сессии (продление TTL)."""
    db.query(models.AuthSession).filter(
        models.AuthSession.id == session_id
    ).update({"last_activity": datetime.utcnow()})
    db.commit()


def terminate_session(db: Session, session_token: str, terminated_by: str = "user") -> bool:
    """
    Завершает конкретную сессию (logout).
    Возвращает True если сессия была найдена и деактивирована.
    """
    result = db.query(models.AuthSession).filter(
        and_(
            models.AuthSession.session_token == session_token,
            models.AuthSession.is_active == True,
        )
    ).update({
        "is_active": False,
        "terminated_by": terminated_by,
    })
    db.commit()
    return result > 0


def terminate_user_sessions(db: Session, user_id: str, terminated_by: str = "force") -> int:
    """
    Завершает ВСЕ активные сессии пользователя.
    ЗАДЕЛ: Используется для force-logout при повторном входе.
    Сейчас НЕ вызывается при логине (множественные сессии разрешены).
    
    Возвращает количество завершённых сессий.
    """
    result = db.query(models.AuthSession).filter(
        and_(
            models.AuthSession.user_id == user_id,
            models.AuthSession.is_active == True,
        )
    ).update({
        "is_active": False,
        "terminated_by": terminated_by,
    })
    db.commit()
    return result


def cleanup_expired_sessions(db: Session, timeout_minutes: int = 20) -> int:
    """
    Деактивирует сессии, у которых last_activity старше timeout_minutes.
    Возвращает количество протухших сессий.
    """
    cutoff = datetime.utcnow() - timedelta(minutes=timeout_minutes)
    result = db.query(models.AuthSession).filter(
        and_(
            models.AuthSession.is_active == True,
            models.AuthSession.last_activity < cutoff,
        )
    ).update({
        "is_active": False,
        "terminated_by": "timeout",
    })
    db.commit()
    return result


def get_expired_sessions_for_logging(db: Session, timeout_minutes: int = 20) -> List[models.AuthSession]:
    """
    Возвращает активные сессии, которые протухли (для логирования перед деактивацией).
    """
    cutoff = datetime.utcnow() - timedelta(minutes=timeout_minutes)
    return db.query(models.AuthSession).filter(
        and_(
            models.AuthSession.is_active == True,
            models.AuthSession.last_activity < cutoff,
        )
    ).all()


def get_active_sessions_count(db: Session, user_id: str) -> int:
    """Возвращает количество активных сессий пользователя."""
    return db.query(models.AuthSession).filter(
        and_(
            models.AuthSession.user_id == user_id,
            models.AuthSession.is_active == True,
        )
    ).count()


def get_all_active_sessions(db: Session) -> List[models.AuthSession]:
    """
    Возвращает ВСЕ активные сессии всех пользователей.
    Используется для отображения «кто сейчас в сети».
    Сортировка по last_activity DESC (самые свежие сверху).
    """
    return db.query(models.AuthSession).filter(
        models.AuthSession.is_active == True,
    ).order_by(models.AuthSession.last_activity.desc()).all()


def terminate_session_by_id(db: Session, session_id: str, terminated_by: str = "force") -> bool:
    """
    Завершает конкретную сессию по ID (принудительный кик).
    Возвращает True если сессия была найдена и деактивирована.
    """
    result = db.query(models.AuthSession).filter(
        and_(
            models.AuthSession.id == session_id,
            models.AuthSession.is_active == True,
        )
    ).update({
        "is_active": False,
        "terminated_by": terminated_by,
    })
    db.commit()
    return result > 0
