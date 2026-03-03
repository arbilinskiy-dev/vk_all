"""
ЧТЕНИЕ: Сводки статистики — глобальная, по проекту, по всем проектам.
"""

import json
import logging
from typing import Optional, List, Dict, Any, Set
from sqlalchemy.orm import Session
from sqlalchemy import func

from models_library.message_stats import MessageStatsHourly, MessageStatsUser

from crud.message_stats._helpers import _hourly_date_filter, _collect_unique_users_from_json

logger = logging.getLogger("crud.message_stats")


# =============================================================================
# ГЛОБАЛЬНАЯ СВОДКА
# =============================================================================

def get_global_summary(
    db: Session,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Глобальная сводка по ВСЕМ проектам — расширенная.
    
    Возвращает:
    - Общие счётчики (входящие/исходящие/всего)
    - Детализация входящих: кнопочные vs живые
    - Детализация исходящих: система vs боты
    - Уникальные пользователи и диалоги
    """
    # Основной агрегирующий запрос
    hourly_q = db.query(
        func.count(func.distinct(MessageStatsHourly.project_id)).label("total_projects"),
        func.sum(MessageStatsHourly.incoming_count).label("total_incoming"),
        func.sum(MessageStatsHourly.outgoing_count).label("total_outgoing"),
        func.sum(MessageStatsHourly.incoming_payload_count).label("incoming_payload"),
        func.sum(MessageStatsHourly.incoming_text_count).label("incoming_text"),
        func.sum(MessageStatsHourly.outgoing_system_count).label("outgoing_system"),
        func.sum(MessageStatsHourly.outgoing_bot_count).label("outgoing_bot"),
    )
    hourly_q = _hourly_date_filter(hourly_q, date_from, date_to)
    result = hourly_q.first()
    
    # Уникальные пользователи
    if date_from or date_to:
        all_users = _collect_unique_users_from_json(db, MessageStatsHourly.unique_users_json, date_from, date_to)
        text_users = _collect_unique_users_from_json(db, MessageStatsHourly.unique_text_users_json, date_from, date_to)
        payload_users = _collect_unique_users_from_json(db, MessageStatsHourly.unique_payload_users_json, date_from, date_to)
        outgoing_users = _collect_unique_users_from_json(db, MessageStatsHourly.outgoing_users_json, date_from, date_to)
        unique_users = len(all_users)
        unique_text_users = len(text_users - payload_users)
        unique_payload_users = len(payload_users)
        # Входящие юзеры = отправляли текст ∪ нажимали кнопки
        incoming_users_set = text_users | payload_users
        unique_incoming_users = len(incoming_users_set)
        outgoing_recipients = len(outgoing_users)
    else:
        unique_users = db.query(func.count(func.distinct(MessageStatsUser.vk_user_id))).scalar() or 0
        # Входящие юзеры — те, у кого incoming_count > 0
        unique_incoming_users = db.query(func.count(func.distinct(MessageStatsUser.vk_user_id))).filter(
            MessageStatsUser.incoming_count > 0
        ).scalar() or 0
        unique_text_users = unique_incoming_users  # За всё время — приблизительно
        unique_payload_users = 0  # За всё время — нет точных данных в MessageStatsUser
        # Уникальные получатели исходящих — те, кому мы писали
        outgoing_recipients = db.query(func.count(func.distinct(MessageStatsUser.vk_user_id))).filter(
            MessageStatsUser.outgoing_count > 0
        ).scalar() or 0
    
    # Уникальные диалоги = уникальные пары (project_id × vk_user_id)
    # + отдельно для payload и text
    if date_from or date_to:
        dialogs_q = db.query(
            MessageStatsHourly.project_id,
            MessageStatsHourly.unique_users_json,
            MessageStatsHourly.unique_text_users_json,
            MessageStatsHourly.unique_payload_users_json,
            MessageStatsHourly.incoming_text_count,
        )
        dialogs_q = _hourly_date_filter(dialogs_q, date_from, date_to)
        # Считаем уникальные пары по типам
        all_pairs: Set[str] = set()
        text_pairs: Set[str] = set()
        payload_pairs: Set[str] = set()
        # Скорректированный подсчёт текстовых сообщений (только от text-only юзеров)
        filtered_incoming_text_sum = 0.0
        for pid, json_str, text_json, payload_json, slot_text_cnt in dialogs_q.all():
            if json_str:
                try:
                    for uid in json.loads(json_str):
                        all_pairs.add(f"{pid}_{uid}")
                except Exception:
                    pass
            t_slot_set: Set[int] = set()
            p_slot_set: Set[int] = set()
            if text_json:
                try:
                    t_slot_set = set(json.loads(text_json))
                    for uid in t_slot_set:
                        text_pairs.add(f"{pid}_{uid}")
                except Exception:
                    pass
            if payload_json:
                try:
                    p_slot_set = set(json.loads(payload_json))
                    for uid in p_slot_set:
                        payload_pairs.add(f"{pid}_{uid}")
                except Exception:
                    pass
            # Пропорциональная коррекция: из incoming_text_count оставляем долю text-only юзеров
            text_only_slot = t_slot_set - p_slot_set
            if t_slot_set and text_only_slot and (slot_text_cnt or 0) > 0:
                filtered_incoming_text_sum += (slot_text_cnt or 0) * len(text_only_slot) / len(t_slot_set)
        unique_dialogs = len(all_pairs)
        dialogs_with_text = len(text_pairs - payload_pairs)
        dialogs_with_payload = len(payload_pairs)
        filtered_incoming_text = round(filtered_incoming_text_sum)
        # Входящие диалоги = text_pairs ∪ payload_pairs
        incoming_dialog_pairs = text_pairs | payload_pairs
        incoming_dialogs = len(incoming_dialog_pairs)
    else:
        unique_dialogs = db.query(func.count(MessageStatsUser.id)).scalar() or 0
        # Входящие диалоги — пары (project × user) где incoming > 0
        incoming_dialogs = db.query(func.count(MessageStatsUser.id)).filter(
            MessageStatsUser.incoming_count > 0
        ).scalar() or 0
        dialogs_with_text = incoming_dialogs  # Приблизительно
        dialogs_with_payload = 0
        filtered_incoming_text = 0  # Без фильтра по дате — нет точных данных
    
    return {
        "total_projects": result.total_projects or 0,
        # --- Общие ---
        "total_incoming": result.total_incoming or 0,
        "total_outgoing": result.total_outgoing or 0,
        "total_messages": (result.total_incoming or 0) + (result.total_outgoing or 0),
        # --- Входящие детализация ---
        "incoming_payload": result.incoming_payload or 0,
        "incoming_text": result.incoming_text or 0,
        # --- Исходящие детализация ---
        "outgoing_system": result.outgoing_system or 0,
        "outgoing_bot": result.outgoing_bot or 0,
        # --- Пользователи и диалоги ---
        "unique_users": unique_users,
        "unique_text_users": unique_text_users,
        "unique_payload_users": unique_payload_users,
        "unique_dialogs": unique_dialogs,
        "incoming_dialogs": incoming_dialogs,
        "dialogs_with_text": dialogs_with_text,
        "dialogs_with_payload": dialogs_with_payload,
        "outgoing_recipients": outgoing_recipients,
        # Скорректированные текстовые (только от text-only юзеров)
        "filtered_incoming_text": filtered_incoming_text,
        # Обратная совместимость
        "incoming_users": unique_incoming_users,
        "outgoing_users": outgoing_recipients,
    }


# =============================================================================
# СВОДКА ПО КОНКРЕТНОМУ ПРОЕКТУ
# =============================================================================

def get_project_summary(db: Session, project_id: str) -> Dict[str, Any]:
    """Сводка по конкретному проекту."""
    result = db.query(
        func.sum(MessageStatsHourly.incoming_count).label("total_incoming"),
        func.sum(MessageStatsHourly.outgoing_count).label("total_outgoing"),
        func.sum(MessageStatsHourly.incoming_payload_count).label("incoming_payload"),
        func.sum(MessageStatsHourly.incoming_text_count).label("incoming_text"),
        func.sum(MessageStatsHourly.outgoing_system_count).label("outgoing_system"),
        func.sum(MessageStatsHourly.outgoing_bot_count).label("outgoing_bot"),
    ).filter(
        MessageStatsHourly.project_id == project_id
    ).first()
    
    unique_users = db.query(func.count(MessageStatsUser.id)).filter(
        MessageStatsUser.project_id == project_id
    ).scalar() or 0
    
    return {
        "project_id": project_id,
        "total_incoming": result.total_incoming or 0,
        "total_outgoing": result.total_outgoing or 0,
        "total_messages": (result.total_incoming or 0) + (result.total_outgoing or 0),
        "incoming_payload": result.incoming_payload or 0,
        "incoming_text": result.incoming_text or 0,
        "outgoing_system": result.outgoing_system or 0,
        "outgoing_bot": result.outgoing_bot or 0,
        "unique_users": unique_users,
    }


# =============================================================================
# СВОДКА ПО КАЖДОМУ ПРОЕКТУ
# =============================================================================

def get_projects_summary(
    db: Session,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Сводка по каждому проекту (таблица проектов на дашборде).
    Один запрос — без N+1.
    """
    # Часовые агрегаты по проектам
    hourly_q = db.query(
        MessageStatsHourly.project_id,
        func.sum(MessageStatsHourly.incoming_count).label("total_incoming"),
        func.sum(MessageStatsHourly.outgoing_count).label("total_outgoing"),
        func.sum(MessageStatsHourly.incoming_payload_count).label("incoming_payload"),
        func.sum(MessageStatsHourly.incoming_text_count).label("incoming_text"),
        func.sum(MessageStatsHourly.outgoing_system_count).label("outgoing_system"),
        func.sum(MessageStatsHourly.outgoing_bot_count).label("outgoing_bot"),
    )
    hourly_q = _hourly_date_filter(hourly_q, date_from, date_to)
    hourly_agg = hourly_q.group_by(MessageStatsHourly.project_id).all()
    
    # Уникальные пользователи и диалоги
    if date_from or date_to:
        rows_q = db.query(
            MessageStatsHourly.project_id,
            MessageStatsHourly.unique_users_json,
            MessageStatsHourly.unique_text_users_json,
            MessageStatsHourly.unique_payload_users_json,
            MessageStatsHourly.outgoing_users_json,
            MessageStatsHourly.incoming_text_count,
        )
        rows_q = _hourly_date_filter(rows_q, date_from, date_to)
        project_users_sets: Dict[str, set] = {}
        project_text_users_sets: Dict[str, set] = {}
        project_payload_users_sets: Dict[str, set] = {}
        project_outgoing_users_sets: Dict[str, set] = {}
        # Скорректированный подсчёт текстовых сообщений (по проектам)
        project_filtered_text: Dict[str, float] = {}
        for pid, json_str, text_json_str, payload_json_str, out_json_str, slot_text_cnt in rows_q.all():
            if json_str:
                try:
                    if pid not in project_users_sets:
                        project_users_sets[pid] = set()
                    project_users_sets[pid].update(json.loads(json_str))
                except Exception:
                    pass
            if text_json_str:
                try:
                    if pid not in project_text_users_sets:
                        project_text_users_sets[pid] = set()
                    project_text_users_sets[pid].update(json.loads(text_json_str))
                except Exception:
                    pass
            if payload_json_str:
                try:
                    if pid not in project_payload_users_sets:
                        project_payload_users_sets[pid] = set()
                    project_payload_users_sets[pid].update(json.loads(payload_json_str))
                except Exception:
                    pass
            if out_json_str:
                try:
                    if pid not in project_outgoing_users_sets:
                        project_outgoing_users_sets[pid] = set()
                    project_outgoing_users_sets[pid].update(json.loads(out_json_str))
                except Exception:
                    pass
            # Скорректированный подсчёт: incoming_text_count × доля text-only юзеров в слоте
            t_slot = set()
            p_slot = set()
            if text_json_str:
                try:
                    t_slot = set(json.loads(text_json_str))
                except Exception:
                    pass
            if payload_json_str:
                try:
                    p_slot = set(json.loads(payload_json_str))
                except Exception:
                    pass
            text_only_slot = t_slot - p_slot
            if t_slot and text_only_slot and (slot_text_cnt or 0) > 0:
                if pid not in project_filtered_text:
                    project_filtered_text[pid] = 0.0
                project_filtered_text[pid] += (slot_text_cnt or 0) * len(text_only_slot) / len(t_slot)
        users_map = {}
        all_pids = set(
            list(project_users_sets.keys()) + list(project_text_users_sets.keys()) +
            list(project_payload_users_sets.keys()) + list(project_outgoing_users_sets.keys())
        )
        for pid in all_pids:
            u_set = project_users_sets.get(pid, set())
            t_set = project_text_users_sets.get(pid, set())
            p_set = project_payload_users_sets.get(pid, set())
            o_set = project_outgoing_users_sets.get(pid, set())
            users_map[pid] = {
                "unique_users": len(u_set),
                "unique_text_users": len(t_set - p_set),
                "unique_payload_users": len(p_set),
                # Входящие юзеры = text ∪ payload (DISTINCT)
                "incoming_users": len(t_set | p_set),
                # Внутри одного проекта: 1 user = 1 диалог
                "unique_dialogs": len(u_set),
                "incoming_dialogs": len(t_set | p_set),
                "dialogs_with_text": len(t_set - p_set),
                "dialogs_with_payload": len(p_set),
                "outgoing_recipients": len(o_set),
                # Скорректированные текстовые сообщения (от text-only юзеров)
                "filtered_incoming_text": round(project_filtered_text.get(pid, 0)),
            }
    else:
        users_agg = db.query(
            MessageStatsUser.project_id,
            func.count(MessageStatsUser.id).label("unique_users"),
        ).group_by(MessageStatsUser.project_id).all()
        
        # Получатели исходящих по проектам
        out_agg = db.query(
            MessageStatsUser.project_id,
            func.count(MessageStatsUser.id).label("out_users"),
        ).filter(
            MessageStatsUser.outgoing_count > 0
        ).group_by(MessageStatsUser.project_id).all()
        out_map = {row.project_id: row.out_users for row in out_agg}
        
        # Входящие юзеры по проектам
        in_agg = db.query(
            MessageStatsUser.project_id,
            func.count(MessageStatsUser.id).label("in_users"),
        ).filter(
            MessageStatsUser.incoming_count > 0
        ).group_by(MessageStatsUser.project_id).all()
        in_map = {row.project_id: row.in_users for row in in_agg}
        
        users_map = {
            row.project_id: {
                "unique_users": row.unique_users,
                "unique_text_users": row.unique_users,
                "unique_payload_users": 0,
                "incoming_users": in_map.get(row.project_id, 0),
                "unique_dialogs": row.unique_users,
                "incoming_dialogs": in_map.get(row.project_id, 0),
                "dialogs_with_text": in_map.get(row.project_id, 0),
                "dialogs_with_payload": 0,
                "outgoing_recipients": out_map.get(row.project_id, 0),
            }
            for row in users_agg
        }
    
    result = []
    for row in hourly_agg:
        ud = users_map.get(row.project_id, {
            "unique_users": 0, "unique_text_users": 0, "unique_payload_users": 0,
            "incoming_users": 0, "unique_dialogs": 0, "incoming_dialogs": 0,
            "dialogs_with_text": 0, "dialogs_with_payload": 0,
            "outgoing_recipients": 0,
        })
        result.append({
            "project_id": row.project_id,
            "total_incoming": row.total_incoming or 0,
            "total_outgoing": row.total_outgoing or 0,
            "total_messages": (row.total_incoming or 0) + (row.total_outgoing or 0),
            "incoming_payload": row.incoming_payload or 0,
            "incoming_text": row.incoming_text or 0,
            "filtered_incoming_text": ud.get("filtered_incoming_text", row.incoming_text or 0),
            "outgoing_system": row.outgoing_system or 0,
            "outgoing_bot": row.outgoing_bot or 0,
            "unique_users": ud["unique_users"],
            "unique_text_users": ud["unique_text_users"],
            "unique_payload_users": ud["unique_payload_users"],
            "incoming_users": ud["incoming_users"],
            "unique_dialogs": ud["unique_dialogs"],
            "incoming_dialogs": ud["incoming_dialogs"],
            "dialogs_with_text": ud["dialogs_with_text"],
            "dialogs_with_payload": ud["dialogs_with_payload"],
            "outgoing_recipients": ud["outgoing_recipients"],
            # Обратная совместимость
            "outgoing_users": ud["outgoing_recipients"],
        })
    
    return result
