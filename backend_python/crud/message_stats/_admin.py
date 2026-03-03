"""
ЧТЕНИЕ: Статистика по администраторам — агрегация и детализация диалогов.
"""

import json
import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from models_library.message_stats import MessageStatsAdmin

logger = logging.getLogger("crud.message_stats")


# =============================================================================
# СТАТИСТИКА ПО АДМИНИСТРАТОРАМ
# =============================================================================

def get_admin_stats(
    db: Session,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Агрегированная статистика по администраторам.
    Возвращает: sender_id, sender_name, messages_sent, unique_dialogs, projects_count.
    """
    query = db.query(
        MessageStatsAdmin.sender_id,
        func.max(MessageStatsAdmin.sender_name).label("sender_name"),
        func.sum(MessageStatsAdmin.messages_sent).label("messages_sent"),
        func.count(func.distinct(MessageStatsAdmin.project_id)).label("projects_count"),
    )
    if date_from:
        query = query.filter(MessageStatsAdmin.date >= date_from)
    if date_to:
        query = query.filter(MessageStatsAdmin.date <= date_to)
    
    rows = query.group_by(MessageStatsAdmin.sender_id).all()
    
    # Для уникальных диалогов нужен JSON — считаем отдельно
    result = []
    for row in rows:
        # Собираем уникальные диалоги из JSON
        dialogs_q = db.query(MessageStatsAdmin.unique_dialogs_json).filter(
            MessageStatsAdmin.sender_id == row.sender_id
        )
        if date_from:
            dialogs_q = dialogs_q.filter(MessageStatsAdmin.date >= date_from)
        if date_to:
            dialogs_q = dialogs_q.filter(MessageStatsAdmin.date <= date_to)
        
        all_dialog_users: set = set()
        for (dj,) in dialogs_q.all():
            if dj:
                try:
                    all_dialog_users.update(json.loads(dj))
                except Exception:
                    pass
        
        result.append({
            "sender_id": row.sender_id,
            "sender_name": row.sender_name or "Неизвестный",
            "messages_sent": row.messages_sent or 0,
            "unique_dialogs": len(all_dialog_users),
            "projects_count": row.projects_count or 0,
        })
    
    # Сортировка по количеству сообщений (убывание)
    result.sort(key=lambda x: x["messages_sent"], reverse=True)
    return result


def get_admin_dialogs(
    db: Session,
    sender_id: str,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Диалоги конкретного администратора — плоский список.
    Каждый элемент: {project_id, vk_user_id, messages_sent, first_name, last_name, photo_url}.
    """
    from models_library.dialogs_authors import ProjectDialog
    from models_library.vk_profiles import VkProfile
    
    query = db.query(
        MessageStatsAdmin.project_id,
        MessageStatsAdmin.messages_sent,
        MessageStatsAdmin.unique_dialogs_json,
        MessageStatsAdmin.sender_name,
        MessageStatsAdmin.date,
    ).filter(
        MessageStatsAdmin.sender_id == sender_id
    )
    if date_from:
        query = query.filter(MessageStatsAdmin.date >= date_from)
    if date_to:
        query = query.filter(MessageStatsAdmin.date <= date_to)
    
    rows = query.all()
    
    # Агрегируем по (project_id, vk_user_id)
    sender_name = "Неизвестный"
    pair_msgs: Dict[str, int] = {}  # "pid_uid" → messages
    all_user_ids: set = set()
    
    for row in rows:
        if row.sender_name:
            sender_name = row.sender_name
        pid = row.project_id
        if row.unique_dialogs_json:
            try:
                uids = json.loads(row.unique_dialogs_json)
                # Распределяем сообщения примерно поровну на диалоги
                per_user = max(1, (row.messages_sent or 0) // max(1, len(uids)))
                for uid in uids:
                    key = f"{pid}_{uid}"
                    pair_msgs[key] = pair_msgs.get(key, 0) + per_user
                    all_user_ids.add(uid)
            except Exception:
                pass
    
    # Загружаем ФИО одним запросом (через ProjectDialog + VkProfile)
    users_info: Dict[str, Dict[str, Any]] = {}
    if all_user_ids:
        mailing_rows = (
            db.query(
                ProjectDialog.project_id,
                VkProfile.vk_user_id,
                VkProfile.first_name,
                VkProfile.last_name,
                VkProfile.photo_url,
            )
            .join(VkProfile, VkProfile.id == ProjectDialog.vk_profile_id)
            .filter(VkProfile.vk_user_id.in_(list(all_user_ids)))
            .all()
        )
        for mr in mailing_rows:
            users_info[f"{mr.project_id}_{mr.vk_user_id}"] = {
                "first_name": mr.first_name,
                "last_name": mr.last_name,
                "photo_url": mr.photo_url,
            }
    
    # Формируем плоский список
    dialogs = []
    for key, msgs in pair_msgs.items():
        pid, uid_str = key.split("_", 1)
        uid = int(uid_str)
        info = users_info.get(key, {})
        dialogs.append({
            "project_id": pid,
            "vk_user_id": uid,
            "messages_sent": msgs,
            "first_name": info.get("first_name"),
            "last_name": info.get("last_name"),
            "photo_url": info.get("photo_url"),
        })
    
    dialogs.sort(key=lambda x: x["messages_sent"], reverse=True)
    return {
        "sender_name": sender_name,
        "dialogs": dialogs,
    }
