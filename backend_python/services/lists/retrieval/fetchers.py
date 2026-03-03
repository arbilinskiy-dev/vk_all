
from sqlalchemy.orm import Session
from typing import List, Optional, Any
from types import SimpleNamespace
import models
import services.automations.reviews.crud as crud_automations
from .filters import apply_filters
from crud.lists.model_resolver import resolve as resolve_models

def fetch_list_items(
    db: Session, 
    project_id: str, 
    list_type: str, 
    page: int, 
    page_size: int, 
    search_query: Optional[str] = None,
    filter_quality: str = 'all',
    filter_sex: str = 'all',
    filter_online: str = 'any',
    filter_can_write: str = 'all',
    filter_bdate_month: str = 'any',
    filter_platform: str = 'any',
    filter_age: str = 'any',
    filter_unread: str = 'all'
) -> List[Any]:
    
    # 1. SPECIAL CASE: Automation lists (mapped from ReviewContestEntry)
    if list_type in ['reviews_participants', 'reviews_winners', 'reviews_posts']:
        contest = crud_automations.get_contest_settings(db, project_id)
        if not contest:
            return []
            
        query = db.query(models.ReviewContestEntry).filter(models.ReviewContestEntry.contest_id == contest.id)
        
        if list_type == 'reviews_participants':
             query = query.filter(models.ReviewContestEntry.status != 'new')
        elif list_type == 'reviews_winners':
             query = query.filter(models.ReviewContestEntry.status == 'winner')
        
        query = apply_filters(query, list_type, search_query)
        
        offset = (page - 1) * page_size
        entries = query.order_by(models.ReviewContestEntry.created_at.desc()).offset(offset).limit(page_size).all()
        
        # MAPPING TO STANDARD MODELS
        mapped_items = []
        if list_type == 'reviews_posts':
            vk_post_ids = [e.vk_post_id for e in entries]
            
            system_posts = db.query(models.SystemListPost).filter(
                models.SystemListPost.project_id == project_id,
                models.SystemListPost.vk_post_id.in_(vk_post_ids)
            ).all()
            
            posts_map = {p.vk_post_id: p for p in system_posts}
            
            for entry in entries:
                full_post = posts_map.get(entry.vk_post_id)
                
                mapped_items.append(models.SystemListPost(
                    id=entry.id,
                    project_id=project_id,
                    vk_post_id=entry.vk_post_id,
                    date=full_post.date if full_post else entry.created_at,
                    text=full_post.text if full_post else entry.post_text,
                    image_url=full_post.image_url if full_post else None,
                    vk_link=entry.post_link,
                    
                    likes_count=full_post.likes_count if full_post else 0,
                    comments_count=full_post.comments_count if full_post else 0,
                    reposts_count=full_post.reposts_count if full_post else 0,
                    views_count=full_post.views_count if full_post else 0,
                    
                    can_post_comment=full_post.can_post_comment if full_post else True,
                    can_like=full_post.can_like if full_post else True,
                    user_likes=full_post.user_likes if full_post else False,
                    
                    signer_id=full_post.signer_id if full_post else None,
                    post_author_id=entry.user_vk_id,
                    
                    last_updated=full_post.last_updated if full_post else entry.created_at
                ))
        else:
            for entry in entries:
                parts = (entry.user_name or "").split(' ', 1)
                first = parts[0]
                last = parts[1] if len(parts) > 1 else ""
                
                # Маппинг ReviewContestEntry → DTO (SimpleNamespace вместо удалённой модели)
                mapped_items.append(SimpleNamespace(
                    id=entry.id,
                    project_id=project_id,
                    vk_user_id=entry.user_vk_id,
                    first_name=first,
                    last_name=last,
                    sex=0,
                    photo_url=entry.user_photo,
                    domain=None,
                    bdate=None,
                    city=None,
                    country=None,
                    has_mobile=None,
                    is_closed=False,
                    can_access_closed=None,
                    deactivated=None,
                    last_seen=None,
                    platform=None,
                    added_at=entry.created_at,
                    source=f"contest:{entry.status}"
                ))
                
        return mapped_items

    # 2. STANDARD CASE — используем model_resolver
    r = resolve_models(list_type)
    model = r.query_model
    profile_model = r.profile_model
    date_col = r.date_col

    # ── AGGREGATE MODE: PostInteraction → GROUP BY vk_profile_id ──
    if r.aggregate_by_user:
        from sqlalchemy import func
        from .interaction_wrapper import InteractionUserResult
        
        # Подзапрос: агрегируем PostInteraction по vk_profile_id
        agg_subq = db.query(
            model.vk_profile_id,
            func.count().label('interaction_count'),
            func.max(model.created_at).label('last_interaction_date'),
        ).filter(model.project_id == project_id)
        
        if r.type_filter:
            col, val = r.type_filter
            agg_subq = agg_subq.filter(col == val)
        
        agg_subq = agg_subq.group_by(model.vk_profile_id).subquery()
        
        # Основной запрос: VkProfile + агрегированные данные
        query = db.query(
            profile_model, agg_subq.c.interaction_count, agg_subq.c.last_interaction_date
        ).join(agg_subq, profile_model.id == agg_subq.c.vk_profile_id)
        
        # Фильтры применяем по profile_model (VkProfile)
        query = apply_filters(query, list_type, search_query, filter_quality, filter_sex, 
                              filter_online, filter_can_write, filter_bdate_month, filter_platform, 
                              filter_age, profile_model=profile_model)
        
        offset = (page - 1) * page_size
        rows = query.order_by(agg_subq.c.last_interaction_date.desc().nulls_last())\
                     .offset(offset).limit(page_size).all()
        
        # Оборачиваем в InteractionUserResult для совместимости с Pydantic-схемой
        return [InteractionUserResult(vp, cnt, last_dt, project_id) for vp, cnt, last_dt in rows]

    # ── STANDARD MODE: прямой запрос к модели ─────────────────────
    query = db.query(model).filter(model.project_id == project_id)
    
    # Фильтр по типу (для MemberEvent: event_type = 'join'/'leave')
    if r.type_filter:
        col, val = r.type_filter
        query = query.filter(col == val)
    
    # Для нормализованных таблиц добавляем JOIN с vk_profiles
    if r.needs_join:
        query = query.join(profile_model, profile_model.id == model.vk_profile_id)
    
    # Фильтр непрочитанных (только для mailing)
    if list_type == 'mailing' and filter_unread == 'unread':
        from .unread_filter import get_unread_user_ids
        unread_ids = get_unread_user_ids(db, project_id)
        if unread_ids:
            # Для нормализованных таблиц фильтруем по profile_model.vk_user_id
            vk_user_id_col = profile_model.vk_user_id if r.needs_join else model.vk_user_id
            query = query.filter(vk_user_id_col.in_(unread_ids))
        else:
            return []
    
    # Применяем фильтры (передаём profile_model для фильтрации по полям профиля)
    query = apply_filters(query, list_type, search_query, filter_quality, filter_sex, filter_online, filter_can_write, filter_bdate_month, filter_platform, filter_age, profile_model=profile_model)

    offset = (page - 1) * page_size
    return query.order_by(date_col.desc().nulls_last())\
                .offset(offset)\
                .limit(page_size)\
                .all()

def fetch_list_count(
    db: Session, 
    project_id: str, 
    list_type: str, 
    search_query: Optional[str] = None,
    filter_quality: str = 'all',
    filter_sex: str = 'all',
    filter_online: str = 'any',
    filter_can_write: str = 'all',
    filter_bdate_month: str = 'any',
    filter_platform: str = 'any',
    filter_age: str = 'any',
    filter_unread: str = 'all'
) -> int:
    """
    Возвращает количество записей, соответствующих фильтрам.
    """
    # 1. SPECIAL CASE: Automation lists
    if list_type in ['reviews_participants', 'reviews_winners', 'reviews_posts']:
        contest = crud_automations.get_contest_settings(db, project_id)
        if not contest: return 0
        
        query = db.query(models.ReviewContestEntry).filter(models.ReviewContestEntry.contest_id == contest.id)
        
        if list_type == 'reviews_participants':
             query = query.filter(models.ReviewContestEntry.status != 'new')
        elif list_type == 'reviews_winners':
             query = query.filter(models.ReviewContestEntry.status == 'winner')
             
        query = apply_filters(query, list_type, search_query)
        return query.count()

    # 2. STANDARD CASE — используем model_resolver
    r = resolve_models(list_type)
    model = r.query_model
    profile_model = r.profile_model

    # ── AGGREGATE MODE: PostInteraction → COUNT DISTINCT users ────
    if r.aggregate_by_user:
        # Подзапрос: уникальные vk_profile_id по типу взаимодействия
        agg_subq = db.query(
            model.vk_profile_id
        ).filter(model.project_id == project_id)
        
        if r.type_filter:
            col, val = r.type_filter
            agg_subq = agg_subq.filter(col == val)
        
        agg_subq = agg_subq.group_by(model.vk_profile_id).subquery()
        
        query = db.query(profile_model).join(
            agg_subq, profile_model.id == agg_subq.c.vk_profile_id
        )
        
        query = apply_filters(query, list_type, search_query, filter_quality, filter_sex,
                              filter_online, filter_can_write, filter_bdate_month, filter_platform,
                              filter_age, profile_model=profile_model)
        return query.count()

    # ── STANDARD MODE ─────────────────────────────────────────────
    query = db.query(model).filter(model.project_id == project_id)
    
    # Фильтр по типу (для MemberEvent)
    if r.type_filter:
        col, val = r.type_filter
        query = query.filter(col == val)
    
    # Для нормализованных таблиц добавляем JOIN
    if r.needs_join:
        query = query.join(profile_model, profile_model.id == model.vk_profile_id)
    
    # Фильтр непрочитанных (только для mailing)
    if list_type == 'mailing' and filter_unread == 'unread':
        from .unread_filter import get_unread_user_ids
        unread_ids = get_unread_user_ids(db, project_id)
        if unread_ids:
            vk_user_id_col = profile_model.vk_user_id if r.needs_join else model.vk_user_id
            query = query.filter(vk_user_id_col.in_(unread_ids))
        else:
            return 0
    
    query = apply_filters(query, list_type, search_query, filter_quality, filter_sex, filter_online, filter_can_write, filter_bdate_month, filter_platform, filter_age, profile_model=profile_model)
    
    return query.count()
