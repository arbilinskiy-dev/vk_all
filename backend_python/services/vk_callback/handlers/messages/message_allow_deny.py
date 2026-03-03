# Обработчик message_allow / message_deny — Подписка и отписка от сообщений
#
# message_allow — пользователь разрешил сообщения от сообщества
# message_deny  — пользователь запретил сообщения от сообщества
#
# Действия:
# 1. Запись в таблицу подписок/отписок (аналитика)
# 2. Обновление статуса can_write в ProjectDialog
# 3. SSE mailing_user_updated (обновление UI рассылки)

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

from ._helpers import _publish_sse_event

logger = logging.getLogger("vk_callback.handlers.messages")


class MessageAllowDenyHandler(BaseEventHandler):
    """
    Подписка / отписка пользователя от сообщений сообщества.
    
    Обновляет аналитику подписок и статус can_write в рассылке.
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
            action_taken="logged"
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
    
    def _update_mailing_status(self, db: Session, project_id: str, user_id: int, is_allow: bool) -> None:
        """Обновляем статус can_write в ProjectDialog + SSE."""
        try:
            from models_library.vk_profiles import VkProfile
            from models_library.dialogs_authors import ProjectDialog
            
            # Ищем vk_profile_id
            vp = db.query(VkProfile).filter(VkProfile.vk_user_id == user_id).first()
            if not vp:
                logger.warning(
                    f"MAILING STATUS: VK profile для user={user_id} не найден "
                    f"— статус не обновлён"
                )
                return
            
            row = db.query(ProjectDialog).filter(
                ProjectDialog.project_id == project_id,
                ProjectDialog.vk_profile_id == vp.id
            ).first()
            
            if row:
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
            else:
                logger.warning(
                    f"MAILING STATUS: user={user_id} не найден в рассылке "
                    f"проекта {project_id} — статус не обновлён"
                )
        except Exception as e:
            logger.error(f"Ошибка обновления статуса рассылки: {e}")
