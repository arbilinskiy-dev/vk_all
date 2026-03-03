
from sqlalchemy.orm import Session
from .utils import apply_type_filter, get_count_expr

def get_core_counts(db: Session, model, pm, project_id: str, needs_join: bool = False, r=None) -> dict:
    """Считает общее количество, активных, забаненных и удаленных."""
    base_query = db.query(model).filter(model.project_id == project_id)
    if r:
        base_query = apply_type_filter(base_query, r)
    if needs_join:
        base_query = base_query.join(pm, pm.id == model.vk_profile_id)
    
    # Для aggregate_by_user (PostInteraction) считаем DISTINCT пользователей
    if r and r.aggregate_by_user:
        from sqlalchemy import func
        total = base_query.with_entities(func.count(func.distinct(model.vk_profile_id))).scalar() or 0
    else:
        total = base_query.count()
    
    if total == 0:
        return {
            "total_users": 0,
            "banned_count": 0,
            "deleted_count": 0,
            "active_count": 0
        }

    if r and r.aggregate_by_user:
        from sqlalchemy import func
        banned = base_query.filter(pm.deactivated == 'banned')\
            .with_entities(func.count(func.distinct(model.vk_profile_id))).scalar() or 0
        deleted = base_query.filter(pm.deactivated == 'deleted')\
            .with_entities(func.count(func.distinct(model.vk_profile_id))).scalar() or 0
    else:
        banned = base_query.filter(pm.deactivated == 'banned').count()
        deleted = base_query.filter(pm.deactivated == 'deleted').count()
    
    active = total - banned - deleted
    
    return {
        "total_users": total,
        "banned_count": banned,
        "deleted_count": deleted,
        "active_count": active
    }
