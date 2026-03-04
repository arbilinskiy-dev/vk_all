"""
Роутер для дашборда активности пользователей.
Агрегирует данные из auth_sessions и auth_logs для мониторинга рабочих процессов.
Доступен ТОЛЬКО администраторам.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case, distinct, and_, or_, desc, cast, Float, extract
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

from database import get_db
from services.auth_middleware import get_current_admin, CurrentUser
from crud import user_action_crud
import models

router = APIRouter(prefix="/user-activity", tags=["User Activity"])


# --- Pydantic схемы ---

class ActivityDashboardPayload(BaseModel):
    """Параметры запроса дашборда."""
    period_days: int = 30  # За сколько дней считать статистику (7, 14, 30, 90)


# --- Эндпоинты ---

@router.post("/dashboard")
def get_activity_dashboard(
    payload: ActivityDashboardPayload,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    """
    Главный эндпоинт — возвращает полную статистику активности пользователей.
    
    Содержит:
    - Общие метрики (KPI-карточки)
    - Статистику по каждому пользователю
    - Данные для графика активности по дням
    - Распределение событий
    """
    now = datetime.utcnow()
    period_start = now - timedelta(days=payload.period_days)
    
    # ===============================
    # 1. ОБЩИЕ МЕТРИКИ (KPI-карточки)
    # ===============================
    
    # Всего уникальных пользователей за период
    total_active_users = db.query(
        func.count(distinct(models.AuthLog.user_id))
    ).filter(
        models.AuthLog.created_at >= period_start,
        models.AuthLog.user_id != None,
    ).scalar() or 0
    
    # Успешных входов за период
    total_logins = db.query(func.count(models.AuthLog.id)).filter(
        models.AuthLog.created_at >= period_start,
        models.AuthLog.event_type == "login_success",
    ).scalar() or 0
    
    # Неудачных попыток входа
    total_failed_logins = db.query(func.count(models.AuthLog.id)).filter(
        models.AuthLog.created_at >= period_start,
        models.AuthLog.event_type == "login_failed",
    ).scalar() or 0
    
    # Таймаутов
    total_timeouts = db.query(func.count(models.AuthLog.id)).filter(
        models.AuthLog.created_at >= period_start,
        models.AuthLog.event_type == "timeout",
    ).scalar() or 0
    
    # Принудительных выходов
    total_force_logouts = db.query(func.count(models.AuthLog.id)).filter(
        models.AuthLog.created_at >= period_start,
        models.AuthLog.event_type == "force_logout",
    ).scalar() or 0
    
    # Сейчас онлайн
    online_now = db.query(func.count(models.AuthSession.id)).filter(
        models.AuthSession.is_active == True,
    ).scalar() or 0
    
    # Среднее время сессии за период (в минутах) — из завершённых сессий
    # Считаем разницу между last_activity и created_at у завершённых сессий
    avg_session_query = db.query(
        func.avg(
            (extract('epoch', models.AuthSession.last_activity) - extract('epoch', models.AuthSession.created_at)) / 60
        )
    ).filter(
        models.AuthSession.created_at >= period_start,
        models.AuthSession.is_active == False,
    ).scalar()
    avg_session_minutes = round(avg_session_query, 1) if avg_session_query else 0
    
    # ===============================
    # 2. СТАТИСТИКА ПО ПОЛЬЗОВАТЕЛЯМ
    # ===============================
    
    # Собираем все user_id из логов за период
    user_stats_raw = db.query(
        models.AuthLog.user_id,
        models.AuthLog.username,
        func.count(case(
            (models.AuthLog.event_type == "login_success", 1),
        )).label("login_count"),
        func.count(case(
            (models.AuthLog.event_type == "login_failed", 1),
        )).label("failed_count"),
        func.count(case(
            (models.AuthLog.event_type == "logout", 1),
        )).label("logout_count"),
        func.count(case(
            (models.AuthLog.event_type == "timeout", 1),
        )).label("timeout_count"),
        func.count(case(
            (models.AuthLog.event_type == "force_logout", 1),
        )).label("force_logout_count"),
        func.max(models.AuthLog.created_at).label("last_event_at"),
    ).filter(
        models.AuthLog.created_at >= period_start,
        models.AuthLog.user_id != None,
    ).group_by(
        models.AuthLog.user_id,
        models.AuthLog.username,
    ).all()
    
    # Подтягиваем ФИО из таблицы users
    user_ids = [r.user_id for r in user_stats_raw if r.user_id]
    users_map = {}
    if user_ids:
        users_db = db.query(models.User.id, models.User.full_name).filter(
            models.User.id.in_(user_ids)
        ).all()
        users_map = {u.id: u.full_name for u in users_db}
    
    # Среднее время сессии по каждому пользователю
    user_session_stats = db.query(
        models.AuthSession.user_id,
        func.avg(
            (extract('epoch', models.AuthSession.last_activity) - extract('epoch', models.AuthSession.created_at)) / 60
        ).label("avg_session_min"),
        func.sum(
            (extract('epoch', models.AuthSession.last_activity) - extract('epoch', models.AuthSession.created_at)) / 60
        ).label("total_time_min"),
        func.count(models.AuthSession.id).label("session_count"),
    ).filter(
        models.AuthSession.created_at >= period_start,
        models.AuthSession.is_active == False,
    ).group_by(
        models.AuthSession.user_id,
    ).all()
    session_stats_map = {s.user_id: s for s in user_session_stats}
    
    # Формируем список статистики по пользователям
    user_stats = []
    for r in user_stats_raw:
        sess = session_stats_map.get(r.user_id)
        
        # Проверяем, онлайн ли сейчас этот пользователь
        is_online = db.query(func.count(models.AuthSession.id)).filter(
            models.AuthSession.user_id == r.user_id,
            models.AuthSession.is_active == True,
        ).scalar() > 0
        
        user_stats.append({
            "user_id": r.user_id,
            "username": r.username,
            "full_name": users_map.get(r.user_id),
            "is_online": is_online,
            "login_count": r.login_count,
            "failed_count": r.failed_count,
            "logout_count": r.logout_count,
            "timeout_count": r.timeout_count,
            "force_logout_count": r.force_logout_count,
            "last_event_at": r.last_event_at.isoformat() if r.last_event_at else None,
            "avg_session_minutes": round(sess.avg_session_min, 1) if sess and sess.avg_session_min else 0,
            "total_time_minutes": round(sess.total_time_min, 1) if sess and sess.total_time_min else 0,
            "session_count": sess.session_count if sess else 0,
        })
    
    # Сортируем: онлайн сверху, потом по login_count DESC
    user_stats.sort(key=lambda x: (-int(x["is_online"]), -x["login_count"]))
    
    # ===============================
    # 3. ГРАФИК АКТИВНОСТИ ПО ДНЯМ
    # ===============================
    
    daily_activity = db.query(
        func.date(models.AuthLog.created_at).label("day"),
        func.count(case(
            (models.AuthLog.event_type == "login_success", 1),
        )).label("logins"),
        func.count(case(
            (models.AuthLog.event_type == "logout", 1),
        )).label("logouts"),
        func.count(case(
            (models.AuthLog.event_type == "timeout", 1),
        )).label("timeouts"),
        func.count(case(
            (models.AuthLog.event_type == "login_failed", 1),
        )).label("failed"),
        func.count(distinct(models.AuthLog.user_id)).label("unique_users"),
    ).filter(
        models.AuthLog.created_at >= period_start,
    ).group_by(
        func.date(models.AuthLog.created_at),
    ).order_by(
        func.date(models.AuthLog.created_at),
    ).all()
    
    daily_chart = [
        {
            "date": str(d.day),
            "logins": d.logins,
            "logouts": d.logouts,
            "timeouts": d.timeouts,
            "failed": d.failed,
            "unique_users": d.unique_users,
        }
        for d in daily_activity
    ]
    
    # ===============================
    # 4. РАСПРЕДЕЛЕНИЕ ПО ЧАСАМ (тепловая карта)
    # ===============================
    
    hourly_activity = db.query(
        extract('hour', models.AuthLog.created_at).label("hour"),
        func.count(models.AuthLog.id).label("count"),
    ).filter(
        models.AuthLog.created_at >= period_start,
        models.AuthLog.event_type == "login_success",
    ).group_by(
        extract('hour', models.AuthLog.created_at),
    ).all()
    
    # Заполняем все 24 часа
    hourly_map = {int(h.hour): h.count for h in hourly_activity}
    hourly_chart = [{"hour": h, "count": hourly_map.get(h, 0)} for h in range(24)]
    
    # ===============================
    # 5. СОБЫТИЯ ПО ТИПАМ (круговая диаграмма)
    # ===============================
    
    event_distribution = db.query(
        models.AuthLog.event_type,
        func.count(models.AuthLog.id).label("count"),
    ).filter(
        models.AuthLog.created_at >= period_start,
    ).group_by(
        models.AuthLog.event_type,
    ).all()
    
    events_chart = [
        {"event_type": e.event_type, "count": e.count}
        for e in event_distribution
    ]
    
    # ===============================
    # 6. БИЗНЕС-ДЕЙСТВИЯ (трекер действий)
    # ===============================
    
    # Сводка по действиям (общие KPI)
    actions_summary = user_action_crud.get_actions_summary(db, payload.period_days)
    
    # Действия по пользователям (кто что делает)
    user_actions_stats = user_action_crud.get_user_actions_stats(db, payload.period_days)
    
    # Действия по дням (для графика)
    daily_actions = user_action_crud.get_daily_actions(db, payload.period_days)
    
    return {
        # KPI-карточки
        "summary": {
            "total_active_users": total_active_users,
            "total_logins": total_logins,
            "total_failed_logins": total_failed_logins,
            "total_timeouts": total_timeouts,
            "total_force_logouts": total_force_logouts,
            "online_now": online_now,
            "avg_session_minutes": avg_session_minutes,
            "period_days": payload.period_days,
        },
        # Подробная статистика по пользователям
        "user_stats": user_stats,
        # График по дням
        "daily_chart": daily_chart,
        # Тепловая карта по часам
        "hourly_chart": hourly_chart,
        # Распределение событий
        "events_chart": events_chart,
        # Бизнес-действия — сводка
        "actions_summary": actions_summary,
        # Бизнес-действия — по пользователям
        "user_actions_stats": user_actions_stats,
        # Бизнес-действия — по дням
        "daily_actions": daily_actions,
    }
