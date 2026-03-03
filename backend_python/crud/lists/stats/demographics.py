
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime
from typing import Dict
from .utils import apply_type_filter, get_count_expr

def _base_query(db, model, pm, project_id, needs_join, r=None):
    """Строит базовый запрос с JOIN-ом и type_filter при необходимости."""
    q = db.query(model).filter(model.project_id == project_id)
    if r:
        q = apply_type_filter(q, r)
    if needs_join:
        q = q.join(pm, pm.id == model.vk_profile_id)
    return q

def get_gender_stats(db: Session, model, pm, project_id: str, needs_join: bool = False, r=None) -> Dict[str, int]:
    stats = {"male": 0, "female": 0, "unknown": 0}
    try:
        count_expr = get_count_expr(r) if r else func.count(model.id)
        q = db.query(pm.sex, count_expr).select_from(model)
        if r:
            q = apply_type_filter(q, r)
        if needs_join:
            q = q.join(pm, pm.id == model.vk_profile_id)
        gender_counts = q.filter(model.project_id == project_id).group_by(pm.sex).all()
        for sex, count in gender_counts:
            if sex == 1: stats["female"] = count
            elif sex == 2: stats["male"] = count
            else: stats["unknown"] = count
    except Exception:
        pass
    return stats

def get_geo_stats(db: Session, model, pm, project_id: str, needs_join: bool = False, r=None) -> Dict[str, int]:
    stats = {}
    try:
        count_expr = get_count_expr(r) if r else func.count(model.id)
        q = db.query(pm.city, count_expr).select_from(model)
        if r:
            q = apply_type_filter(q, r)
        if needs_join:
            q = q.join(pm, pm.id == model.vk_profile_id)
        city_counts = q.filter(model.project_id == project_id)\
            .group_by(pm.city)\
            .order_by(desc(count_expr))\
            .all()
        
        for city_name, count in city_counts:
            key = city_name if city_name and city_name.strip() else "Не указано"
            stats[key] = stats.get(key, 0) + count
    except Exception as e:
        print(f"Error calculating geo stats: {e}")
    return stats

def get_age_and_bdate_stats(db: Session, model, pm, project_id: str, needs_join: bool = False, r=None) -> Dict:
    bdate_stats = {str(i): 0 for i in range(1, 14)} # 1-12 month, 13=unknown
    age_stats = {
        "u16": 0, "16-20": 0, "20-25": 0, "25-30": 0, "30-35": 0, "35-40": 0, "40-45": 0, "45p": 0, "unknown": 0
    }
    
    if not hasattr(pm, 'bdate'):
        return {"bdate_stats": bdate_stats, "age_stats": age_stats}

    try:
        q = db.query(pm.bdate).select_from(model).filter(model.project_id == project_id, pm.bdate.isnot(None))
        if r:
            q = apply_type_filter(q, r)
        if needs_join:
            q = q.join(pm, pm.id == model.vk_profile_id)
        # Для aggregate_by_user: DISTINCT по vk_profile_id, чтобы не считать одного пользователя несколько раз
        if r and r.aggregate_by_user:
            q = q.distinct(model.vk_profile_id)
        bdates = q.all()
        current_year = datetime.now().year
        
        for (bdate_str,) in bdates:
            if not bdate_str: continue
            parts = bdate_str.split('.')
            
            # 1. Месяц рождения
            if len(parts) >= 2:
                month_raw = parts[1]
                month = str(int(month_raw)) if month_raw.isdigit() else month_raw
                if month in bdate_stats:
                    bdate_stats[month] += 1
                else:
                    bdate_stats["13"] += 1
            else:
                bdate_stats["13"] += 1

            # 2. Возраст
            if len(parts) == 3:
                year_str = parts[2]
                if year_str.isdigit():
                    year = int(year_str)
                    age = current_year - year
                    
                    if age < 16: age_stats["u16"] += 1
                    elif 16 <= age < 20: age_stats["16-20"] += 1
                    elif 20 <= age < 25: age_stats["20-25"] += 1
                    elif 25 <= age < 30: age_stats["25-30"] += 1
                    elif 30 <= age < 35: age_stats["30-35"] += 1
                    elif 35 <= age < 40: age_stats["35-40"] += 1
                    elif 40 <= age < 45: age_stats["40-45"] += 1
                    else: age_stats["45p"] += 1
                else:
                    age_stats["unknown"] += 1
            else:
                age_stats["unknown"] += 1

        # Добавляем тех, у кого bdate is None
        count_expr = get_count_expr(r) if r else func.count(model.id)
        none_q = db.query(count_expr).select_from(model).filter(model.project_id == project_id, pm.bdate.is_(None))
        if r:
            none_q = apply_type_filter(none_q, r)
        if needs_join:
            none_q = none_q.join(pm, pm.id == model.vk_profile_id)
        none_bdate_count = none_q.scalar() or 0
        bdate_stats["13"] += none_bdate_count
        age_stats["unknown"] += none_bdate_count
        
    except Exception as e:
        print(f"Error calculating bdate/age stats: {e}")
        
    return {"bdate_stats": bdate_stats, "age_stats": age_stats}
