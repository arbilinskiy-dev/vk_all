# Обработчик message_allow / message_deny — Подписка и отписка от сообщений
#
# message_allow — пользователь разрешил сообщения от сообщества
# message_deny  — пользователь запретил сообщения от сообщества
#
# Действия:
# 1. Запись в таблицу подписок/отписок (аналитика)
# 2. Upsert VkProfile + ProjectDialog (если пользователя нет в БД — создаём заглушку)
# 3. Обновление статуса can_write в ProjectDialog
# 4. SSE mailing_user_updated (обновление UI рассылки)

import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

from ._helpers import _publish_sse_event

logger = logging.getLogger("vk_callback.handlers.messages")


class MessageAllowDenyHandler(BaseEventHandler):
    """
    Подписка / отписка пользователя от сообщений сообщества.
    
    Создаёт VkProfile + ProjectDialog при первом контакте,
    обновляет аналитику подписок и статус can_write в рассылке.
    """
    
    HANDLES_EVENTS = ["message_allow", "message_deny"]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        user_id = obj.get("user_id")
        is_allow = event.type == "message_allow"
        action = "разрешил" if is_allow else "запретил"
        self._log(f"Пользователь {user_id} {action} сообщения", event)
        
        if user_id and project:
            project_id = str(project.id)
            self._record_subscription(db, project_id, user_id, is_allow)
            self._update_mailing_status(db, project_id, user_id, is_allow)
        
        return HandlerResult(
            success=True,
            message=f"Сообщение обработано ({event.type})",
            action_taken="upsert+logged"
        )
    
    def _record_subscription(self, db: Session, project_id: str, user_id: int, is_allow: bool) -> None:
        """Записываем в таблицу подписок/отписок (аналитика)."""
        try:
            from crud.message_subscriptions.write import record_subscription
            sub_type = "allow" if is_allow else "deny"
            record_subscription(
                db=db,
                project_id=project_id,
                vk_user_id=int(user_id),
                event_type=sub_type,
            )
        except Exception as e:
            logger.error(f"Ошибка записи подписки: {e}")
    
    # ── Вспомогательный метод: получить или создать VkProfile ──────────
    
    def _get_or_create_vk_profile(self, db: Session, vk_user_id: int):
        """
        Возвращает VkProfile по vk_user_id.
        Если профиля нет — создаёт заглушку (только vk_user_id, без имени/фото).
        Данные заполнятся daily-задачей обогащения профилей.
        """
        from models_library.vk_profiles import VkProfile
        
        vp = db.query(VkProfile).filter(VkProfile.vk_user_id == vk_user_id).first()
        if vp:
            return vp
        
        # Создаём минимальный профиль-заглушку
        from database import SQLALCHEMY_DATABASE_URL
        vp = VkProfile(vk_user_id=vk_user_id)
        if 'sqlite' in SQLALCHEMY_DATABASE_URL:
            from sqlalchemy import func as sa_func
            max_id = db.query(sa_func.coalesce(sa_func.max(VkProfile.id), 0)).scalar()
            vp.id = max_id + 1
        db.add(vp)
        try:
            db.flush()
            logger.info(f"VK PROFILE STUB: создан профиль-заглушка для user={vk_user_id}")
        except Exception:
            # Race condition: другой воркер мог вставить тот же vk_user_id
            db.rollback()
            vp = db.query(VkProfile).filter(VkProfile.vk_user_id == vk_user_id).first()
            if not vp:
                raise
        return vp
    
    def _update_mailing_status(self, db: Session, project_id: str, user_id: int, is_allow: bool) -> None:
        """
        Обновляем статус can_write в ProjectDialog + SSE.
        
        Если пользователя нет в БД — создаём VkProfile-заглушку и запись
        в ProjectDialog (рассылку проекта), чтобы данные о подписке не терялись.
        """
        try:
            from models_library.dialogs_authors import ProjectDialog
            
            # Получаем или создаём VkProfile
            vp = self._get_or_create_vk_profile(db, user_id)
            
            row = db.query(ProjectDialog).filter(
                ProjectDialog.project_id == project_id,
                ProjectDialog.vk_profile_id == vp.id
            ).first()
            
            if row:
                # Есть запись — обновляем статус
                row.can_write = is_allow
                if not is_allow:
                    row.status = "blocked"
                else:
                    # Если пользователь снова разрешил — восстанавливаем статус
                    if row.status == "blocked":
                        row.status = "active"
                db.commit()
                logger.info(
                    f"MAILING STATUS: user={user_id}, project={project_id}, "
                    f"can_write={is_allow}, status={row.status}"
                )
            else:
                # Нет записи — создаём новую в рассылке проекта
                now = datetime.now(timezone.utc)
                status = "active" if is_allow else "blocked"
                new_entry = ProjectDialog(
                    project_id=project_id,
                    vk_profile_id=vp.id,
                    can_write=is_allow,
                    status=status,
                    source="callback",
                    first_message_date=now,
                    last_message_date=now,
                    first_message_from_id=user_id,
                )
                db.add(new_entry)
                db.commit()
                logger.info(
                    f"MAILING NEW: user={user_id} добавлен в рассылку проекта "
                    f"{project_id} (can_write={is_allow}, status={status}, "
                    f"источник: {('message_allow' if is_allow else 'message_deny')})"
                )
            
            # SSE mailing_user_updated для обновления UI
            from crud.lists.mailing import get_mailing_user_by_vk_id
            updated_user = get_mailing_user_by_vk_id(db, project_id, int(user_id))
            if updated_user:
                _publish_sse_event("mailing_user_updated", project_id, {
                    "user": updated_user,
                })
                logger.info(
                    f"SSE mailing_user_updated: user={user_id}, "
                    f"can_write={is_allow}, project={project_id}"
                )
        except Exception as e:
            logger.error(f"Ошибка обновления статуса рассылки: {e}")
            try:
                db.rollback()
            except Exception:
                pass
