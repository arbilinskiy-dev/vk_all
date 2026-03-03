"""
СИНХРОНИЗАЦИЯ: заполнение статистики из существующих callback-логов.
Разовая операция — вызывается вручную через POST /messages/stats/sync-from-logs.
"""

import json
import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session

from models_library.message_stats import MessageStatsHourly, MessageStatsUser

logger = logging.getLogger("crud.message_stats")


def sync_from_callback_logs(db: Session) -> Dict[str, Any]:
    """
    Синхронизирует таблицы статистики из существующих VkCallbackLog.
    
    Читает логи с type='message_new' и 'message_reply', парсит payload,
    извлекает project_id (через group_id → Project), vk_user_id, timestamp,
    и записывает в обе таблицы статистики.
    
    Подход: предварительная агрегация → UPSERT с MAX.
    НЕ удаляет данные — только актуализирует. Живые данные от record_message
    сохраняются: берём max(существующее, из_логов) для счётчиков,
    union для unique_users, min для first_message_at, max для last_message_at.
    
    Идемпотентна: повторный вызов не меняет данные (max от одинаковых = то же).
    
    Возвращает: { synced: int, skipped: int, errors: int, details: str }
    """
    from models_library.logs import VkCallbackLog
    from models_library.projects import Project
    
    # 1. Считываем все message_new/message_reply логи одним запросом
    logs = db.query(VkCallbackLog).filter(
        VkCallbackLog.type.in_(["message_new", "message_reply"])
    ).order_by(VkCallbackLog.timestamp.asc()).all()
    
    if not logs:
        return {"synced": 0, "skipped": 0, "errors": 0, "details": "Нет callback-логов для синхронизации"}
    
    # 2. Собираем все уникальные group_id и маппим на project_id одним запросом (без N+1)
    group_ids = list(set(log.group_id for log in logs if log.group_id))
    group_id_strs = [str(gid) for gid in group_ids]
    
    projects_rows = db.query(Project).filter(
        Project.vkProjectId.in_(group_id_strs)
    ).all()
    
    # group_id (int) → project.id (str)
    group_to_project: Dict[int, str] = {}
    for p in projects_rows:
        try:
            gid = int(p.vkProjectId)
            group_to_project[gid] = str(p.id)
        except (ValueError, TypeError):
            pass
    
    logger.info(f"SYNC FROM LOGS: найдено {len(logs)} логов, {len(group_to_project)} проектов по group_id")
    
    # 3. ПРЕ-АГРЕГАЦИЯ в Python-словарях (без обращения к БД)
    #    hourly_agg[row_id] = { project_id, hour_slot, incoming, outgoing, users_set }
    #    user_agg[row_id]   = { project_id, vk_user_id, incoming, outgoing, first_msg, last_msg }
    hourly_agg: Dict[str, Dict[str, Any]] = {}
    user_agg: Dict[str, Dict[str, Any]] = {}
    
    synced = 0
    skipped = 0
    errors = 0
    
    for log in logs:
        try:
            # Определяем project_id
            project_id = group_to_project.get(log.group_id)
            if not project_id:
                skipped += 1
                continue
            
            # Парсим payload
            payload = json.loads(log.payload) if log.payload else None
            if not payload:
                skipped += 1
                continue
            
            obj = payload.get("object", {})
            event_type = payload.get("type", "")
            
            # message_new: вложенная структура { message: {...}, client_info: {...} }
            if event_type == "message_new":
                message = obj.get("message", obj)
            else:
                # message_reply: объект и есть сообщение
                message = obj
            
            from_id = message.get("from_id", 0)
            peer_id = message.get("peer_id", 0)
            msg_date = message.get("date", 0)
            
            if not msg_date and log.timestamp:
                # Фоллбэк на timestamp лога
                msg_date = int(log.timestamp.timestamp())
            
            if not from_id and not peer_id:
                skipped += 1
                continue
            
            # Определяем vk_user_id и направление
            if from_id > 0:
                vk_user_id = from_id
                is_incoming = True
            else:
                vk_user_id = peer_id
                is_incoming = False
            
            # Определяем наличие payload (кнопка/бот) для входящих
            has_payload = bool(message.get("payload")) if is_incoming else False
            
            # --- Агрегируем в hourly ---
            dt = datetime.fromtimestamp(msg_date, tz=timezone.utc)
            hour_slot = dt.strftime("%Y-%m-%dT%H")
            hourly_key = f"{project_id}_{hour_slot}"
            
            if hourly_key not in hourly_agg:
                hourly_agg[hourly_key] = {
                    "project_id": project_id,
                    "hour_slot": hour_slot,
                    "incoming": 0,
                    "outgoing": 0,
                    "incoming_payload": 0,
                    "incoming_text": 0,
                    "outgoing_system": 0,
                    "outgoing_bot": 0,
                    "users_set": set(),
                    "text_users_set": set(),
                    "payload_users_set": set(),
                    "outgoing_users_set": set(),
                }
            h = hourly_agg[hourly_key]
            if is_incoming:
                h["incoming"] += 1
                if has_payload:
                    h["incoming_payload"] += 1
                    h["payload_users_set"].add(vk_user_id)
                else:
                    h["incoming_text"] += 1
                    h["text_users_set"].add(vk_user_id)
            else:
                h["outgoing"] += 1
                # Из логов не знаем sender_id → все исходящие = бот/рассылка
                h["outgoing_bot"] += 1
                h["outgoing_users_set"].add(vk_user_id)
            h["users_set"].add(vk_user_id)
            
            # --- Агрегируем в user ---
            user_key = f"{project_id}_{vk_user_id}"
            
            if user_key not in user_agg:
                user_agg[user_key] = {
                    "project_id": project_id,
                    "vk_user_id": vk_user_id,
                    "incoming": 0,
                    "outgoing": 0,
                    "first_msg": msg_date,
                    "last_msg": msg_date,
                }
            u = user_agg[user_key]
            if is_incoming:
                u["incoming"] += 1
            else:
                u["outgoing"] += 1
            if msg_date < u["first_msg"]:
                u["first_msg"] = msg_date
            if msg_date > u["last_msg"]:
                u["last_msg"] = msg_date
            
            synced += 1
            
        except Exception as e:
            errors += 1
            logger.warning(f"SYNC FROM LOGS: ошибка обработки лога id={log.id}: {e}")
    
    # 4. UPSERT с MAX — не теряем live-данные от record_message
    now = time.time()
    
    for row_id, h in hourly_agg.items():
        users_list = list(h["users_set"])
        text_users_list = list(h["text_users_set"])
        payload_users_list = list(h["payload_users_set"])
        outgoing_users_list = list(h["outgoing_users_set"])
        existing = db.query(MessageStatsHourly).filter(MessageStatsHourly.id == row_id).first()
        if existing:
            # MAX: берём наибольшее из текущего и посчитанного из логов
            existing.incoming_count = max(existing.incoming_count or 0, h["incoming"])
            existing.outgoing_count = max(existing.outgoing_count or 0, h["outgoing"])
            existing.incoming_payload_count = max(existing.incoming_payload_count or 0, h["incoming_payload"])
            existing.incoming_text_count = max(existing.incoming_text_count or 0, h["incoming_text"])
            existing.outgoing_system_count = max(existing.outgoing_system_count or 0, h["outgoing_system"])
            existing.outgoing_bot_count = max(existing.outgoing_bot_count or 0, h["outgoing_bot"])
            # UNION: объединяем множества пользователей
            try:
                old_users = set(json.loads(existing.unique_users_json or "[]"))
            except (json.JSONDecodeError, TypeError):
                old_users = set()
            merged_users = old_users | h["users_set"]
            existing.unique_users_json = json.dumps(list(merged_users))
            existing.unique_users_count = len(merged_users)
            # UNION: text users
            try:
                old_text_users = set(json.loads(existing.unique_text_users_json or "[]"))
            except (json.JSONDecodeError, TypeError):
                old_text_users = set()
            merged_text_users = old_text_users | h["text_users_set"]
            existing.unique_text_users_json = json.dumps(list(merged_text_users))
            # UNION: payload users
            try:
                old_payload_users = set(json.loads(existing.unique_payload_users_json or "[]"))
            except (json.JSONDecodeError, TypeError):
                old_payload_users = set()
            merged_payload_users = old_payload_users | h["payload_users_set"]
            existing.unique_payload_users_json = json.dumps(list(merged_payload_users))
            # UNION: outgoing users
            try:
                old_out_users = set(json.loads(existing.outgoing_users_json or "[]"))
            except (json.JSONDecodeError, TypeError):
                old_out_users = set()
            merged_out_users = old_out_users | h["outgoing_users_set"]
            existing.outgoing_users_json = json.dumps(list(merged_out_users))
            # unique_dialogs_count: MAX
            existing.unique_dialogs_count = max(existing.unique_dialogs_count or 0, len(h["users_set"]))
            existing.updated_at = now
        else:
            db.add(MessageStatsHourly(
                id=row_id,
                project_id=h["project_id"],
                hour_slot=h["hour_slot"],
                incoming_count=h["incoming"],
                outgoing_count=h["outgoing"],
                incoming_payload_count=h["incoming_payload"],
                incoming_text_count=h["incoming_text"],
                outgoing_system_count=h["outgoing_system"],
                outgoing_bot_count=h["outgoing_bot"],
                unique_users_count=len(users_list),
                unique_users_json=json.dumps(users_list),
                unique_text_users_json=json.dumps(text_users_list),
                unique_payload_users_json=json.dumps(payload_users_list),
                outgoing_users_json=json.dumps(outgoing_users_list),
                unique_dialogs_count=len(users_list),
                created_at=now,
                updated_at=now,
            ))
    
    for row_id, u in user_agg.items():
        existing = db.query(MessageStatsUser).filter(MessageStatsUser.id == row_id).first()
        if existing:
            # MAX для счётчиков, MIN для first, MAX для last
            existing.incoming_count = max(existing.incoming_count or 0, u["incoming"])
            existing.outgoing_count = max(existing.outgoing_count or 0, u["outgoing"])
            existing.first_message_at = min(existing.first_message_at or float("inf"), u["first_msg"])
            existing.last_message_at = max(existing.last_message_at or 0, u["last_msg"])
        else:
            db.add(MessageStatsUser(
                id=row_id,
                project_id=u["project_id"],
                vk_user_id=u["vk_user_id"],
                incoming_count=u["incoming"],
                outgoing_count=u["outgoing"],
                first_message_at=u["first_msg"],
                last_message_at=u["last_msg"],
            ))
    
    # 5. Один commit
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"SYNC FROM LOGS: ошибка commit: {e}")
        return {"synced": 0, "skipped": skipped, "errors": errors + synced, "details": f"Ошибка сохранения: {e}"}
    
    details = (
        f"Обработано {len(logs)} логов: {synced} синхронизировано, "
        f"{skipped} пропущено, {errors} ошибок. "
        f"Часовых слотов: {len(hourly_agg)}, пользователей: {len(user_agg)}"
    )
    logger.info(f"SYNC FROM LOGS: {details}")
    
    return {"synced": synced, "skipped": skipped, "errors": errors, "details": details}
