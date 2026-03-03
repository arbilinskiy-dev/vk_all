"""
CRUD операции для таблицы auth_logs.
Логирование событий авторизации.
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from datetime import datetime, timedelta
import uuid
import json

import models


def create_log(
    db: Session,
    event_type: str,
    user_id: Optional[str] = None,
    user_type: str = "system",
    username: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[dict] = None,
) -> models.AuthLog:
    """
    Создаёт запись лога авторизации.
    
    event_type:
    - login_success: Успешный вход
    - login_failed: Неудачная попытка входа
    - logout: Пользователь вышел из системы
    - timeout: Сессия завершена по таймауту
    - force_logout: Сессия завершена принудительно (задел)
    - session_refresh: Продление сессии (задел)
    """
    log = models.AuthLog(
        id=str(uuid.uuid4()),
        user_id=user_id,
        user_type=user_type,
        username=username,
        event_type=event_type,
        ip_address=ip_address,
        user_agent=user_agent,
        details=json.dumps(details, ensure_ascii=False) if details else None,
    )
    db.add(log)
    db.commit()
    return log


def get_logs(
    db: Session,
    page: int = 1,
    page_size: int = 50,
    user_id: Optional[str] = None,
    event_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> tuple[List[models.AuthLog], int]:
    """
    Получает логи авторизации с фильтрацией и пагинацией.
    Возвращает (список логов, общее количество).
    """
    query = db.query(models.AuthLog)
    
    if user_id:
        query = query.filter(models.AuthLog.user_id == user_id)
    if event_type:
        query = query.filter(models.AuthLog.event_type == event_type)
    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            query = query.filter(models.AuthLog.created_at >= dt_from)
        except ValueError:
            pass
    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to)
            query = query.filter(models.AuthLog.created_at <= dt_to)
        except ValueError:
            pass
    
    total = query.count()
    
    logs = query.order_by(desc(models.AuthLog.created_at))\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    return logs, total


def get_unique_users_from_logs(db: Session) -> List[dict]:
    """Возвращает список уникальных пользователей из логов (для фильтрации на фронте)."""
    from sqlalchemy import distinct
    results = db.query(
        distinct(models.AuthLog.user_id),
        models.AuthLog.username
    ).filter(
        models.AuthLog.user_id != None
    ).all()
    
    return [{"user_id": r[0], "username": r[1]} for r in results]


def clear_logs(db: Session, older_than_days: Optional[int] = None) -> int:
    """
    Очищает логи. Если указано older_than_days — удаляет только старше N дней,
    иначе удаляет всё.
    """
    query = db.query(models.AuthLog)
    if older_than_days:
        cutoff = datetime.utcnow() - timedelta(days=older_than_days)
        query = query.filter(models.AuthLog.created_at < cutoff)
    
    count = query.count()
    query.delete(synchronize_session=False)
    db.commit()
    return count
