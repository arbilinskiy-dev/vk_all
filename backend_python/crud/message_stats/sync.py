"""
СИНХРОНИЗАЦИЯ: заполнение статистики из существующих callback-логов.
Вызывается через POST /messages/stats/sync-from-logs как фоновая задача.

Оптимизирована для больших объёмов (20-30к+ логов):
- Стримовое чтение из БД (yield_per) — не загружает все логи в память
- Bulk pre-fetch существующих записей — один запрос вместо N SELECT'ов
- Батч-коммиты каждые BATCH_SIZE записей
- Прогресс через task_monitor
"""

import json
import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Callable
from sqlalchemy.orm import Session
from sqlalchemy import func

from models_library.message_stats import MessageStatsHourly, MessageStatsUser

logger = logging.getLogger("crud.message_stats")

# Размер чанка для стримового чтения из БД
READ_CHUNK_SIZE = 1000

# Батч-коммит: после каждых N агрегатов — коммит
UPSERT_BATCH_SIZE = 500


def sync_from_callback_logs(db: Session) -> Dict[str, Any]:
    """
    Обёртка для обратной совместимости — синхронный вариант без прогресса.
    """
    result = {"synced": 0, "skipped": 0, "errors": 0, "details": ""}
    for event in sync_from_callback_logs_with_progress(db):
        if event.get("type") in ("complete", "error"):
            result = event.get("result", result)
    return result


def sync_from_callback_logs_with_progress(
    db: Session,
    on_progress: Optional[Callable[[Dict[str, Any]], None]] = None,
) -> Any:
    """
    Синхронизирует таблицы статистики из существующих VkCallbackLog.
    Генератор, который yield-ит события прогресса.
    
    Оптимизации:
    1. yield_per(READ_CHUNK_SIZE) — стримовое чтение, не загружает все логи в ORM
    2. Предварительная загрузка маппинга group_id → project_id (один запрос)
    3. Пре-агрегация в Python-словарях (без обращения к БД)
    4. Bulk pre-fetch существующих hourly/user записей (2 запроса вместо N)
    5. Батч-коммиты каждые UPSERT_BATCH_SIZE записей
    
    Идемпотентна: повторный вызов не меняет данные (max от одинаковых = то же).
    
    Типы событий:
    - {"type": "start", "total_logs": N}
    - {"type": "reading", "processed": N, "total": N}
    - {"type": "upserting", "processed": N, "total": N, "phase": "hourly"|"user"}
    - {"type": "complete", "result": {...}}
    - {"type": "error", "result": {...}}
    """
    from models_library.logs import VkCallbackLog
    from models_library.projects import Project
    
    # 1. Считаем общее количество логов (быстрый COUNT, без загрузки данных)
    total_logs = db.query(func.count(VkCallbackLog.id)).filter(
        VkCallbackLog.type.in_(["message_new", "message_reply"])
    ).scalar() or 0
    
    if total_logs == 0:
        result = {"synced": 0, "skipped": 0, "errors": 0, "details": "Нет callback-логов для синхронизации"}
        yield {"type": "complete", "result": result}
        return
    
    yield {"type": "start", "total_logs": total_logs}
    
    # 2. Загрузка маппинга group_id → project_id (одним запросом)
    projects_rows = db.query(Project.id, Project.vkProjectId).all()
    group_to_project: Dict[int, str] = {}
    for pid, vk_id in projects_rows:
        try:
            gid = int(vk_id)
            group_to_project[gid] = str(pid)
        except (ValueError, TypeError):
            pass
    
    logger.info(f"SYNC FROM LOGS: {total_logs} логов, {len(group_to_project)} проектов")
    
    # 3. ПРЕ-АГРЕГАЦИЯ: стримовое чтение логов через yield_per
    hourly_agg: Dict[str, Dict[str, Any]] = {}
    user_agg: Dict[str, Dict[str, Any]] = {}
    
    synced = 0
    skipped = 0
    errors = 0
    processed = 0
    
    # yield_per читает из БД порциями по READ_CHUNK_SIZE, не создавая все ORM-объекты разом
    logs_query = db.query(
        VkCallbackLog.id,
        VkCallbackLog.group_id,
        VkCallbackLog.payload,
        VkCallbackLog.timestamp,
        VkCallbackLog.type,
    ).filter(
        VkCallbackLog.type.in_(["message_new", "message_reply"])
    ).order_by(VkCallbackLog.timestamp.asc()).yield_per(READ_CHUNK_SIZE)
    
    for log_id, group_id, payload_str, timestamp, log_type in logs_query:
        processed += 1
        try:
            # Определяем project_id
            project_id = group_to_project.get(group_id)
            if not project_id:
                skipped += 1
                continue
            
            # Парсим payload
            payload = json.loads(payload_str) if payload_str else None
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
            
            if not msg_date and timestamp:
                # Фоллбэк на timestamp лога
                msg_date = int(timestamp.timestamp())
            
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
            logger.warning(f"SYNC FROM LOGS: ошибка обработки лога id={log_id}: {e}")
        
        # Прогресс чтения каждые READ_CHUNK_SIZE записей
        if processed % READ_CHUNK_SIZE == 0:
            yield {
                "type": "reading",
                "processed": processed,
                "total": total_logs,
            }
    
    # Финальное событие чтения
    yield {"type": "reading", "processed": processed, "total": total_logs}
    
    logger.info(
        f"SYNC FROM LOGS: агрегация завершена — "
        f"{synced} обработано, {skipped} пропущено, {errors} ошибок. "
        f"Hourly-слотов: {len(hourly_agg)}, юзеров: {len(user_agg)}"
    )
    
    # 4. BULK PRE-FETCH существующих записей (2 запроса вместо N)
    #    Загружаем все hourly и user записи, которые уже есть в БД
    hourly_keys = list(hourly_agg.keys())
    existing_hourly: Dict[str, MessageStatsHourly] = {}
    # Батчированный pre-fetch (SQLite/PG имеют лимит на IN-clause, берём по 500)
    for i in range(0, len(hourly_keys), 500):
        batch_keys = hourly_keys[i:i+500]
        rows = db.query(MessageStatsHourly).filter(
            MessageStatsHourly.id.in_(batch_keys)
        ).all()
        for row in rows:
            existing_hourly[row.id] = row
    
    user_keys = list(user_agg.keys())
    existing_users: Dict[str, MessageStatsUser] = {}
    for i in range(0, len(user_keys), 500):
        batch_keys = user_keys[i:i+500]
        rows = db.query(MessageStatsUser).filter(
            MessageStatsUser.id.in_(batch_keys)
        ).all()
        for row in rows:
            existing_users[row.id] = row
    
    logger.info(
        f"SYNC FROM LOGS: pre-fetch — "
        f"{len(existing_hourly)}/{len(hourly_keys)} hourly, "
        f"{len(existing_users)}/{len(user_keys)} user записей уже есть"
    )
    
    # 5. UPSERT hourly с батч-коммитами
    now = time.time()
    upsert_count = 0
    total_upserts = len(hourly_agg) + len(user_agg)
    
    for row_id, h in hourly_agg.items():
        upsert_count += 1
        existing = existing_hourly.get(row_id)
        
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
            users_list = list(h["users_set"])
            text_users_list = list(h["text_users_set"])
            payload_users_list = list(h["payload_users_set"])
            outgoing_users_list = list(h["outgoing_users_set"])
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
        
        # Батч-коммит
        if upsert_count % UPSERT_BATCH_SIZE == 0:
            try:
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"SYNC FROM LOGS: ошибка батч-коммита hourly: {e}")
            yield {
                "type": "upserting",
                "processed": upsert_count,
                "total": total_upserts,
                "phase": "hourly",
            }
    
    # 6. UPSERT user с батч-коммитами
    for row_id, u in user_agg.items():
        upsert_count += 1
        existing = existing_users.get(row_id)
        
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
        
        # Батч-коммит
        if upsert_count % UPSERT_BATCH_SIZE == 0:
            try:
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"SYNC FROM LOGS: ошибка батч-коммита user: {e}")
            yield {
                "type": "upserting",
                "processed": upsert_count,
                "total": total_upserts,
                "phase": "user",
            }
    
    # 7. Финальный коммит оставшихся изменений
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"SYNC FROM LOGS: ошибка commit: {e}")
        result = {"synced": 0, "skipped": skipped, "errors": errors + synced, "details": f"Ошибка сохранения: {e}"}
        yield {"type": "error", "result": result}
        return
    
    details = (
        f"Обработано {total_logs} логов: {synced} синхронизировано, "
        f"{skipped} пропущено, {errors} ошибок. "
        f"Часовых слотов: {len(hourly_agg)}, пользователей: {len(user_agg)}"
    )
    logger.info(f"SYNC FROM LOGS: {details}")
    
    result = {"synced": synced, "skipped": skipped, "errors": errors, "details": details}
    yield {"type": "complete", "result": result}
