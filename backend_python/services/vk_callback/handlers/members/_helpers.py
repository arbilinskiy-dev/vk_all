"""
Вспомогательные функции для обработчиков событий участников (members).

Содержит:
- Получение профиля VK-пользователя через VK API
- Upsert профиля в vk_profiles
- Upsert/удаление пользователя из project_members
- Запись события в member_events
- Запись в user_membership_history
- Обновление метаданных (счётчики)
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session

from models_library.vk_profiles import VkProfile
from models_library.members import ProjectMember, MemberEvent
from models_library.membership_history import UserMembershipHistory

logger = logging.getLogger("vk_callback.handlers.members")


def fetch_vk_user_profile(
    vk_user_id: int,
    group_id: int,
    project_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Запрашивает профиль пользователя через VK API (users.get).
    
    Использует сервисный токен приложения (vk_service_key) через token_manager.
    Возвращает словарь с полями профиля или None при ошибке.
    """
    try:
        from services.vk_api.token_manager import call_vk_api
        
        result = call_vk_api(
            method="users.get",
            params={
                "user_ids": str(vk_user_id),
                "fields": "sex,bdate,city,country,photo_100,domain,has_mobile,last_seen,is_closed,can_access_closed,deactivated",
            },
        )
        
        if result and 'response' in result and result['response']:
            return result['response'][0]
        
        logger.warning(f"VK users.get вернул пустой ответ для user_id={vk_user_id}")
        return None
        
    except Exception as e:
        logger.error(f"Ошибка VK users.get для user_id={vk_user_id}: {e}")
        return None


def parse_vk_profile_data(vk_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Парсит ответ VK API users.get в словарь для upsert в vk_profiles.
    """
    return {
        "vk_user_id": vk_data.get("id"),
        "first_name": vk_data.get("first_name"),
        "last_name": vk_data.get("last_name"),
        "sex": vk_data.get("sex"),
        "photo_url": vk_data.get("photo_100"),
        "domain": vk_data.get("domain"),
        "bdate": vk_data.get("bdate"),
        "city": vk_data.get("city", {}).get("title") if vk_data.get("city") else None,
        "country": vk_data.get("country", {}).get("title") if vk_data.get("country") else None,
        "has_mobile": bool(vk_data.get("has_mobile")) if vk_data.get("has_mobile") is not None else None,
        "is_closed": vk_data.get("is_closed"),
        "can_access_closed": vk_data.get("can_access_closed"),
        "deactivated": vk_data.get("deactivated"),
        "last_seen": vk_data.get("last_seen", {}).get("time") if vk_data.get("last_seen") else None,
        "platform": vk_data.get("last_seen", {}).get("platform") if vk_data.get("last_seen") else None,
    }


def upsert_vk_profile(db: Session, profile_data: Dict[str, Any]) -> Optional[int]:
    """
    Создаёт или обновляет VK-профиль. Возвращает vk_profiles.id.
    
    Если профиль уже существует — обновляет поля.
    Если нет — создаёт новый.
    """
    vk_user_id = profile_data.get("vk_user_id")
    if not vk_user_id:
        return None
    
    existing = db.query(VkProfile).filter(VkProfile.vk_user_id == vk_user_id).first()
    
    if existing:
        # Обновляем только ненулевые поля
        for field in ('first_name', 'last_name', 'sex', 'photo_url', 'domain', 'bdate',
                      'city', 'country', 'has_mobile', 'is_closed', 'can_access_closed',
                      'deactivated', 'last_seen', 'platform'):
            value = profile_data.get(field)
            if value is not None:
                setattr(existing, field, value)
        db.flush()
        return existing.id
    else:
        # Создаём новый профиль
        new_profile = VkProfile(**{k: v for k, v in profile_data.items() if v is not None})
        db.add(new_profile)
        db.flush()
        return new_profile.id


def add_to_subscribers(
    db: Session,
    project_id: str,
    vk_profile_id: int,
    source: str = 'callback'
) -> bool:
    """
    Добавляет пользователя в список подписчиков (project_members).
    
    Если уже есть — пропускает (duplicate-safe).
    Возвращает True если запись создана, False если уже существовала.
    """
    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.vk_profile_id == vk_profile_id,
    ).first()
    
    if existing:
        return False
    
    member = ProjectMember(
        project_id=project_id,
        vk_profile_id=vk_profile_id,
        status='subscribed',
        source=source,
    )
    db.add(member)
    db.flush()
    return True


def remove_from_subscribers(
    db: Session,
    project_id: str,
    vk_profile_id: int
) -> bool:
    """
    Удаляет пользователя из списка подписчиков (project_members).
    
    Возвращает True если запись была удалена, False если не найдена.
    """
    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.vk_profile_id == vk_profile_id,
    ).first()
    
    if not existing:
        return False
    
    db.delete(existing)
    db.flush()
    return True


def add_member_event(
    db: Session,
    project_id: str,
    vk_profile_id: int,
    event_type: str,
    event_date: datetime,
    source: str = 'callback'
) -> Optional[MemberEvent]:
    """
    Добавляет запись в системный список вступивших/вышедших (member_events).
    Это для UI — вкладки «Вступившие (история)» / «Вышедшие (история)».
    
    Дедупликация: если за последние 10 минут уже есть такая же запись — пропускаем.
    Защищает от дублей при повторных callback-ах от VK (retry).
    """
    from datetime import timedelta
    threshold = event_date - timedelta(minutes=10)
    existing = db.query(MemberEvent).filter(
        MemberEvent.project_id == project_id,
        MemberEvent.vk_profile_id == vk_profile_id,
        MemberEvent.event_type == event_type,
        MemberEvent.event_date >= threshold,
    ).first()
    if existing:
        logger.info(
            f"Дубликат member_event пропущен: project={project_id}, "
            f"profile={vk_profile_id}, type={event_type}"
        )
        return existing
    
    event = MemberEvent(
        project_id=project_id,
        vk_profile_id=vk_profile_id,
        event_type=event_type,
        event_date=event_date,
        source=source,
    )
    db.add(event)
    db.flush()
    return event


def add_membership_history(
    db: Session,
    project_id: str,
    vk_user_id: int,
    action: str,
    action_date: datetime,
    source: str = 'callback'
) -> Optional[UserMembershipHistory]:
    """
    Добавляет запись в аналитическую историю вступлений/выходов.
    Append-only лог для анализа поведения пользователя.
    
    Дедупликация: если за последние 10 минут уже есть такая же запись — пропускаем.
    """
    from datetime import timedelta
    threshold = action_date - timedelta(minutes=10)
    existing = db.query(UserMembershipHistory).filter(
        UserMembershipHistory.project_id == project_id,
        UserMembershipHistory.vk_user_id == vk_user_id,
        UserMembershipHistory.action == action,
        UserMembershipHistory.action_date >= threshold,
    ).first()
    if existing:
        logger.info(
            f"Дубликат membership_history пропущен: project={project_id}, "
            f"user={vk_user_id}, action={action}"
        )
        return existing
    
    record = UserMembershipHistory(
        project_id=project_id,
        vk_user_id=vk_user_id,
        action=action,
        action_date=action_date,
        source=source,
    )
    db.add(record)
    db.flush()
    return record


def update_list_meta_counters(
    db: Session,
    project_id: str,
    join_delta: int = 0,
    leave_delta: int = 0,
    subscribers_delta: int = 0,
):
    """
    Обновляет счётчики в ProjectListMeta.
    
    Для history_join/history_leave — пересчитывает реальный COUNT(*) из member_events,
    чтобы исключить рассинхронизацию кэшированного счётчика с реальными данными.
    Для subscribers — использует дельта-инкремент (быстрее, и там есть UNIQUE constraint).
    """
    import crud
    from services.post_helpers import get_rounded_timestamp
    
    meta = crud.get_list_meta(db, project_id)
    updates = {}
    timestamp = get_rounded_timestamp()
    
    if subscribers_delta != 0:
        updates["subscribers_count"] = max(0, (meta.subscribers_count or 0) + subscribers_delta)
        updates["subscribers_last_updated"] = timestamp
    
    if join_delta != 0:
        real_count = db.query(MemberEvent).filter(
            MemberEvent.project_id == project_id,
            MemberEvent.event_type == 'join',
        ).count()
        updates["history_join_count"] = real_count
        updates["history_join_last_updated"] = timestamp
    
    if leave_delta != 0:
        real_count = db.query(MemberEvent).filter(
            MemberEvent.project_id == project_id,
            MemberEvent.event_type == 'leave',
        ).count()
        updates["history_leave_count"] = real_count
        updates["history_leave_last_updated"] = timestamp
    
    if updates:
        crud.update_list_meta(db, project_id, updates)
