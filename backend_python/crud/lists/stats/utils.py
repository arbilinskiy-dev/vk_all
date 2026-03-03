
import models
from sqlalchemy import func
from crud.lists.model_resolver import resolve as resolve_models

def get_model_by_list_type(list_type: str):
    """
    Определяет модель SQLAlchemy на основе типа списка.
    Возвращает кортеж (query_model, profile_model, needs_join).
    
    Для нормализованных таблиц:
      query_model = ProjectMember, profile_model = VkProfile, needs_join = True
    Для старых таблиц:
      query_model = model, profile_model = model, needs_join = False
    """
    r = resolve_models(list_type)
    return r.query_model, r.profile_model, r.needs_join


def get_resolver(list_type: str):
    """Возвращает полный объект ListModels для расширенной работы (type_filter, aggregate_by_user)."""
    return resolve_models(list_type)


def apply_type_filter(query, r):
    """Применяет фильтр по типу, если задан (MemberEvent.event_type, PostInteraction.type)."""
    if r.type_filter:
        col, val = r.type_filter
        query = query.filter(col == val)
    return query


def get_count_expr(r):
    """
    Возвращает выражение для подсчёта.
    
    Для aggregate_by_user (PostInteraction): COUNT(DISTINCT vk_profile_id) — считаем уникальных пользователей.
    Для остальных: COUNT(id) — считаем строки (каждая строка = один пользователь).
    """
    model = r.query_model
    if r.aggregate_by_user:
        return func.count(func.distinct(model.vk_profile_id))
    return func.count(model.id)
