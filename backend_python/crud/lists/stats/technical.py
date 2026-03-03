
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_
import time
from .utils import apply_type_filter, get_count_expr

def get_platform_stats(db: Session, model, pm, project_id: str, needs_join: bool = False, r=None) -> dict:
    stats = {}
    if not hasattr(pm, 'platform'):
        return stats

    try:
        count_expr = get_count_expr(r) if r else func.count(model.id)
        q = db.query(pm.platform, count_expr).select_from(model).filter(model.project_id == project_id)
        if r:
            q = apply_type_filter(q, r)
        if needs_join:
            q = q.join(pm, pm.id == model.vk_profile_id)
        platform_counts = q.group_by(pm.platform).all()
        for platform, count in platform_counts:
            key = str(platform) if platform else "unknown"
            stats[key] = count
    except Exception as e:
        print(f"Error calculating platform stats: {e}")
    return stats

def get_online_stats(db: Session, model, pm, project_id: str, needs_join: bool = False, r=None) -> dict:
    stats = {
        "today": 0, "3_days": 0, "week": 0, 
        "month_plus": 0, "3_months_plus": 0, "6_months_plus": 0, "year_plus": 0, 
        "unknown": 0
    }
    
    now_ts = int(time.time())
    day_sec = 86400
    
    ts_today_start = now_ts - day_sec
    ts_3_days = now_ts - (3 * day_sec)
    ts_week = now_ts - (7 * day_sec)
    ts_month = now_ts - (30 * day_sec)
    ts_3_months_int = now_ts - (90 * day_sec)
    ts_6_months_int = now_ts - (180 * day_sec)
    ts_year_int = now_ts - (365 * day_sec)

    try:
        # Для aggregate_by_user: сначала получаем уникальных пользователей через подзапрос
        if r and r.aggregate_by_user:
            user_subq = db.query(pm.last_seen).select_from(model)\
                .filter(model.project_id == project_id)
            user_subq = apply_type_filter(user_subq, r)
            user_subq = user_subq.join(pm, pm.id == model.vk_profile_id)\
                .distinct(model.vk_profile_id).subquery()
            
            q = db.query(
                func.sum(case((user_subq.c.last_seen.is_(None), 1), else_=0)).label('unknown'),
                func.sum(case((user_subq.c.last_seen >= ts_today_start, 1), else_=0)).label('today'),
                func.sum(case((and_(user_subq.c.last_seen < ts_today_start, user_subq.c.last_seen >= ts_3_days), 1), else_=0)).label('3_days'),
                func.sum(case((and_(user_subq.c.last_seen < ts_3_days, user_subq.c.last_seen >= ts_week), 1), else_=0)).label('week'),
                func.sum(case((user_subq.c.last_seen < ts_month, 1), else_=0)).label('month_plus'),
                func.sum(case((user_subq.c.last_seen < ts_3_months_int, 1), else_=0)).label('3_months_plus'),
                func.sum(case((user_subq.c.last_seen < ts_6_months_int, 1), else_=0)).label('6_months_plus'),
                func.sum(case((user_subq.c.last_seen < ts_year_int, 1), else_=0)).label('year_plus'),
            ).select_from(user_subq)
        else:
            q = db.query(
                func.sum(case((pm.last_seen.is_(None), 1), else_=0)).label('unknown'),
                func.sum(case((pm.last_seen >= ts_today_start, 1), else_=0)).label('today'),
                func.sum(case((and_(pm.last_seen < ts_today_start, pm.last_seen >= ts_3_days), 1), else_=0)).label('3_days'),
                func.sum(case((and_(pm.last_seen < ts_3_days, pm.last_seen >= ts_week), 1), else_=0)).label('week'),
                func.sum(case((pm.last_seen < ts_month, 1), else_=0)).label('month_plus'),
                func.sum(case((pm.last_seen < ts_3_months_int, 1), else_=0)).label('3_months_plus'),
                func.sum(case((pm.last_seen < ts_6_months_int, 1), else_=0)).label('6_months_plus'),
                func.sum(case((pm.last_seen < ts_year_int, 1), else_=0)).label('year_plus'),
            ).select_from(model).filter(model.project_id == project_id)
            if r:
                q = apply_type_filter(q, r)
            if needs_join:
                q = q.join(pm, pm.id == model.vk_profile_id)
        
        online_case = q.first()
        
        if online_case:
            stats["unknown"] = online_case[0] or 0
            stats["today"] = online_case[1] or 0
            
            val_today = online_case[1] or 0
            val_3days_interval = online_case[2] or 0
            val_week_interval = online_case[3] or 0
            
            stats["3_days"] = val_today + val_3days_interval 
            stats["week"] = stats["3_days"] + val_week_interval
            
            stats["month_plus"] = online_case[4] or 0
            stats["3_months_plus"] = online_case[5] or 0
            stats["6_months_plus"] = online_case[6] or 0
            stats["year_plus"] = online_case[7] or 0
    except Exception:
        pass
    return stats
