"""
Обработчик события group_join (вступление в сообщество).

При получении callback от VK:
1. Находит проект по group_id
2. Запрашивает профиль пользователя через VK API (users.get)
3. Upsert профиль в vk_profiles
4. Добавляет пользователя в project_members (подписчики)
5. Записывает событие в member_events (системный список «Вступившие (история)»)
6. Записывает в user_membership_history (аналитический лог)
7. Обновляет счётчики в ProjectListMeta
"""

import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult
from ._helpers import (
    fetch_vk_user_profile,
    parse_vk_profile_data,
    upsert_vk_profile,
    add_to_subscribers,
    add_member_event,
    add_membership_history,
    update_list_meta_counters,
)

logger = logging.getLogger("vk_callback.handlers.members")


class GroupJoinHandler(BaseEventHandler):
    """
    Обработчик вступления пользователя в сообщество (group_join).
    
    Цепочка обработки:
    1. VK Profile → upsert (с данными из users.get)
    2. ProjectMember → добавить (source='callback')
    3. MemberEvent → записать (event_type='join', source='callback')
    4. UserMembershipHistory → записать (action='join', source='callback')
    5. ProjectListMeta → обновить счётчики
    """
    
    HANDLES_EVENTS = ["group_join"]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        user_id = obj.get("user_id")
        join_type = obj.get("join_type", "unknown")
        
        if not user_id:
            self._log("group_join без user_id — пропуск", event, "warning")
            return HandlerResult(success=False, message="Нет user_id", action_taken="skipped")
        
        if not project:
            self._log(f"Проект не найден для group_id={event.group_id}", event, "warning")
            return HandlerResult(success=False, message="Проект не найден", action_taken="skipped")
        
        project_id = project.id
        now = datetime.now(timezone.utc)
        
        self._log(f"Вступление: user={user_id}, join_type={join_type}", event)
        
        try:
            # 1. Получаем профиль из VK API
            vk_data = fetch_vk_user_profile(user_id, event.group_id, project_id)
            
            if vk_data:
                profile_data = parse_vk_profile_data(vk_data)
            else:
                # Минимальный профиль — только vk_user_id
                profile_data = {"vk_user_id": user_id}
            
            # 2. Upsert профиль в vk_profiles
            vk_profile_id = upsert_vk_profile(db, profile_data)
            if not vk_profile_id:
                self._log(f"Не удалось создать/обновить профиль user={user_id}", event, "error")
                return HandlerResult(success=False, message="Ошибка upsert профиля", action_taken="error")
            
            # 3. Добавляем в подписчики
            was_added = add_to_subscribers(db, project_id, vk_profile_id, source='callback')
            
            # 4. Записываем в системный список «Вступившие (история)»
            event_record = add_member_event(db, project_id, vk_profile_id, event_type='join', event_date=now, source='callback')
            # Проверяем: запись новая или дубликат (по времени создания)
            is_new_event = event_record and abs((event_record.event_date - now).total_seconds()) < 5
            
            # 5. Записываем в аналитическую историю
            add_membership_history(db, project_id, user_id, action='join', action_date=now, source='callback')
            
            # 6. Обновляем счётчики (только если новая запись)
            update_list_meta_counters(
                db, project_id,
                join_delta=1 if is_new_event else 0,
                subscribers_delta=1 if was_added else 0,
            )
            
            db.commit()
            
            name = f"{profile_data.get('first_name', '')} {profile_data.get('last_name', '')}".strip()
            self._log(
                f"Обработано: user={user_id} ({name}), "
                f"added_to_subs={was_added}, join_type={join_type}",
                event
            )
            
            return HandlerResult(
                success=True,
                message=f"Вступление обработано: user={user_id}",
                action_taken="join_processed",
                data={
                    "user_id": user_id,
                    "join_type": join_type,
                    "added_to_subscribers": was_added,
                    "name": name,
                }
            )
            
        except Exception as e:
            logger.error(f"Ошибка обработки group_join user={user_id}: {e}", exc_info=True)
            try:
                db.rollback()
            except Exception:
                pass
            return HandlerResult(
                success=False,
                message=f"Ошибка: {e}",
                action_taken="error",
                should_retry=True,
            )
