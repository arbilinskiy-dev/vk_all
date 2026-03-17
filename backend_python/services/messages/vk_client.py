"""
Утилиты для работы с проектом/токенами и запросы к VK API messages.
"""

import json
import logging
from typing import Dict, Any, Tuple, List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models_library.projects import Project as ProjectModel
from services.vk_api.token_manager import call_vk_api_for_group

logger = logging.getLogger(__name__)


def get_community_tokens(project: ProjectModel) -> list:
    """Извлекает все токены сообщества из проекта."""
    tokens = []
    if project and project.communityToken:
        tokens.append(project.communityToken)
    if project and project.additional_community_tokens:
        try:
            extras = json.loads(project.additional_community_tokens)
            if isinstance(extras, list):
                tokens.extend([t for t in extras if t])
        except:
            pass
    return tokens


def get_project_and_tokens(db: Session, project_id: str) -> Tuple[ProjectModel, List[str], int]:
    """
    Получает проект, токены и group_id.
    Выбрасывает HTTPException при ошибках.
    """
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")

    community_tokens = get_community_tokens(project)
    if not community_tokens:
        raise HTTPException(
            status_code=400,
            detail="У проекта нет токена сообщества. Добавьте токен в настройках проекта.",
        )

    group_id = project.vkProjectId
    if not group_id:
        raise HTTPException(status_code=400, detail="У проекта не указан VK Group ID")

    try:
        group_id_int = abs(int(group_id))
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail=f"Некорректный VK Group ID: {group_id}")

    return project, community_tokens, group_id_int


# Порог peer_id для групповых чатов VK
CHAT_PEER_ID_START = 2000000000


def fetch_from_vk(
    community_tokens: list,
    group_id_int: int,
    user_id: int,
    count: int,
    offset: int,
    project_id: str,
) -> Dict[str, Any]:
    """Прямой запрос к VK API messages.getHistory.
    Для групповых чатов (peer_id >= 2000000000) использует peer_id вместо user_id
    и добавляет extended=1 для получения профилей участников."""
    # Для групповых чатов VK API требует peer_id вместо user_id
    is_group_chat = user_id >= CHAT_PEER_ID_START
    if is_group_chat:
        id_param = {"peer_id": user_id}
    else:
        id_param = {"user_id": user_id}

    params = {
        **id_param,
        "count": count,
        "offset": offset,
        "rev": 0,
    }
    # Для групповых чатов запрашиваем профили участников
    if is_group_chat:
        params["extended"] = 1

    return call_vk_api_for_group(
        method="messages.getHistory",
        params=params,
        group_id=group_id_int,
        community_tokens=community_tokens,
        project_id=project_id,
    )
