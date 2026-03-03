# Обработчик message_new — Входящее сообщение от пользователя
#
# Действия:
# 1. Upsert сообщения в БД (CachedMessage)
# 2. Подсчёт непрочитанных
# 3. SSE push менеджерам (new_message)
# 4. Global SSE (unread_count_changed) — бейдж в сайдбаре
# 5. Запись в статистику
# 6. Лёгкий upsert в рассылку (last_message_date)

import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult
from crud import messages_crud
from crud.message_read_crud import get_unread_count

from ._helpers import _publish_sse_event, _publish_global_unread_count, format_vk_item

logger = logging.getLogger("vk_callback.handlers.messages")


class MessageNewHandler(BaseEventHandler):
    """
    Входящее сообщение от пользователя.
    
    Основной поток: upsert в БД → SSE push менеджерам → обновление счётчиков.
    """
    
    HANDLES_EVENTS = ["message_new"]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        # message_new имеет вложенную структуру { message: {...}, client_info: {...} }
        message = obj.get("message", obj)
        from_id = message.get("from_id")
        text = message.get("text", "")[:100]
        self._log(f"Новое сообщение от user={from_id}: '{text}'", event)
        
        self._save_and_notify(db, message, project)
        
        return HandlerResult(
            success=True,
            message=f"Сообщение обработано (message_new)",
            action_taken="cached+sse"
        )
    
    def _save_and_notify(self, db: Session, message: dict, project) -> None:
        """
        Дозапись входящего сообщения в БД + SSE Push.
        
        1. Определяем project_id, vk_user_id
        2. Дозаписываем одно сообщение в БД (upsert)
        3. Считаем непрочитанные
        4. Публикуем SSE-событие менеджерам
        5. Обновляем глобальный счётчик непрочитанных
        6. Записываем статистику
        7. Обновляем рассылку (для входящих)
        """
        try:
            project_id = str(project.id) if project else None
            if not project_id:
                return
            
            msg_id = message.get("id")
            from_id = message.get("from_id", 0)
            peer_id = message.get("peer_id", 0)
            
            if not msg_id:
                return
            
            # Определяем vk_user_id собеседника
            vk_user_id = from_id if from_id > 0 else peer_id
            
            # --- Дозаписываем одно сообщение в БД (upsert) ---
            vk_item = format_vk_item(message)
            messages_crud.save_vk_messages(db, project_id, vk_user_id, [vk_item])
            logger.info(f"CALLBACK SAVE: msg_id={msg_id}, user={vk_user_id}, event=message_new")
            
            is_incoming = from_id > 0
            
            # Счётчик непрочитанных
            unread_count = get_unread_count(db, project_id, vk_user_id)
            
            # Формируем данные сообщения для фронтенда
            message_data = {
                "vk_user_id": vk_user_id,
                "message": {
                    "id": msg_id,
                    "from_id": from_id,
                    "peer_id": peer_id,
                    "text": message.get("text", ""),
                    "date": message.get("date", 0),
                    "out": message.get("out", 0),
                    "attachments": message.get("attachments", []),
                    "keyboard": message.get("keyboard"),
                    "payload": message.get("payload"),
                },
                "unread_count": unread_count,
                "is_incoming": is_incoming,
                "cache_action": "append",
            }
            
            # Публикуем SSE-событие
            _publish_sse_event("new_message", project_id, message_data)
            
            logger.info(
                f"CALLBACK → CACHE+SSE: msg_id={msg_id}, from={from_id}, "
                f"project={project_id}, unread={unread_count}, "
                f"incoming={is_incoming}"
            )
            
            # --- GLOBAL SSE: обновляем счётчик непрочитанных диалогов для сайдбара ---
            _publish_global_unread_count(db, project_id)
            
            # --- STATS: записываем в статистику нагрузки ---
            try:
                from crud.message_stats_crud import record_message
                has_payload = bool(message.get("payload")) if is_incoming else False
                record_message(
                    db, project_id, vk_user_id, is_incoming,
                    message.get("date", 0),
                    has_payload=has_payload,
                )
            except Exception as stats_err:
                logger.warning(f"STATS RECORD ERROR (не критично): {stats_err}")
            
            # --- MAILING: лёгкое обновление last_message_date ---
            # Только для входящих сообщений (от реального пользователя, from_id > 0).
            if is_incoming:
                self._lightweight_mailing_upsert(db, project_id, vk_user_id, message.get("date", 0))
            
        except Exception as e:
            logger.error(f"CALLBACK → SAVE+NOTIFY ERROR: {e}")

    def _lightweight_mailing_upsert(self, db: Session, project_id: str, vk_user_id: int, message_date: int) -> None:
        """
        Лёгкий upsert пользователя в список рассылки (ProjectDialog).
        
        БЕЗ VK API users.get — только обновляем last_message_date.
        Если пользователя нет — создаём запись-заглушку (vk_user_id + дата).
        Профиль (имя, фото, город) заполнится при входе менеджера в диалог.
        """
        try:
            from models_library.vk_profiles import VkProfile
            from models_library.dialogs_authors import ProjectDialog
            
            last_msg_date = datetime.fromtimestamp(message_date, timezone.utc) if message_date else datetime.now(timezone.utc)
            
            # Ищем vk_profile_id
            vp = db.query(VkProfile).filter(VkProfile.vk_user_id == vk_user_id).first()
            
            if not vp:
                # Создаём минимальный VK-профиль (без данных — заполнится при синхронизации)
                # ФИКС: SQLite не автоинкрементирует BigInteger PK — вычисляем id вручную
                from database import SQLALCHEMY_DATABASE_URL
                vp = VkProfile(vk_user_id=vk_user_id)
                if 'sqlite' in SQLALCHEMY_DATABASE_URL:
                    from sqlalchemy import func as sa_func
                    max_id = db.query(sa_func.coalesce(sa_func.max(VkProfile.id), 0)).scalar()
                    vp.id = max_id + 1
                db.add(vp)
                try:
                    db.flush()
                except Exception:
                    # Race condition: повторяем попытку (другой воркер мог вставить тот же vk_user_id)
                    db.rollback()
                    vp = db.query(VkProfile).filter(VkProfile.vk_user_id == vk_user_id).first()
                    if not vp:
                        raise
            
            # Проверяем: есть ли пользователь в рассылке?
            existing = db.query(ProjectDialog.id).filter(
                ProjectDialog.project_id == project_id,
                ProjectDialog.vk_profile_id == vp.id
            ).first()
            
            if existing:
                # Есть — обновляем только дату последнего сообщения (1 UPDATE)
                db.query(ProjectDialog).filter(
                    ProjectDialog.project_id == project_id,
                    ProjectDialog.vk_profile_id == vp.id
                ).update({
                    "last_message_date": last_msg_date,
                    "can_write": True,  # Написал нам → может получать ответы
                })
                db.commit()
            else:
                # Нет — создаём запись-заглушку без профиля
                new_entry = ProjectDialog(
                    project_id=project_id,
                    vk_profile_id=vp.id,
                    last_message_date=last_msg_date,
                    first_message_date=last_msg_date,
                    first_message_from_id=vk_user_id,
                    can_write=True,
                    source="callback",
                    status="active",
                )
                db.add(new_entry)
                db.commit()
                logger.info(
                    f"MAILING LIGHT: новый пользователь user={vk_user_id} "
                    f"добавлен в рассылку проекта {project_id} (без профиля)"
                )
        except Exception as e:
            logger.error(f"MAILING LIGHT UPSERT ERROR: {e}")
            try:
                db.rollback()
            except Exception:
                pass
