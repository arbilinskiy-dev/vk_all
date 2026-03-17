"""
CRUD-операции для chat_actions — действия менеджеров в диалогах.

Запись действий + получение для отображения в хронологии чата.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from sqlalchemy.orm import Session
from sqlalchemy import desc

from models_library.chat_actions import ChatAction

logger = logging.getLogger(__name__)


def log_chat_action(
    db: Session,
    project_id: str,
    vk_user_id: int,
    manager_id: str,
    manager_name: str,
    action_type: str,
    metadata: Optional[Dict[str, Any]] = None,
    commit: bool = True,
) -> ChatAction:
    """
    Записывает действие менеджера в диалоге.
    Возвращает созданную запись.
    """
    action = ChatAction(
        project_id=project_id,
        vk_user_id=vk_user_id,
        manager_id=manager_id,
        manager_name=manager_name,
        action_type=action_type,
        action_metadata=json.dumps(metadata, ensure_ascii=False) if metadata else None,
    )
    db.add(action)
    if commit:
        db.commit()
        db.refresh(action)
    return action


def get_chat_actions(
    db: Session,
    project_id: str,
    vk_user_id: int,
    limit: int = 200,
    before_ts: Optional[str] = None,
) -> List[dict]:
    """
    Получает действия в диалоге для отображения в хронологии.
    Возвращает список словарей (JSON-ready).
    
    before_ts — ISO-строка, ограничивает сверху (для пагинации).
    """
    query = (
        db.query(ChatAction)
        .filter(
            ChatAction.project_id == project_id,
            ChatAction.vk_user_id == vk_user_id,
        )
    )
    if before_ts:
        query = query.filter(ChatAction.created_at < before_ts)

    actions = query.order_by(desc(ChatAction.created_at)).limit(limit).all()

    result = []
    for a in reversed(actions):  # старые → новые (как сообщения)
        item = {
            "id": f"action_{a.id}",
            "action_type": a.action_type,
            "manager_id": a.manager_id,
            "manager_name": a.manager_name,
            "timestamp": a.created_at.isoformat() if a.created_at else None,
        }
        if a.action_metadata:
            try:
                item["metadata"] = json.loads(a.action_metadata)
            except (json.JSONDecodeError, TypeError):
                item["metadata"] = {}
        result.append(item)

    return result
