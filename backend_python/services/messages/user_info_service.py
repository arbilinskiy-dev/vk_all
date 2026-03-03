"""
Сервис авто-обновления профиля пользователя из VK API.
Используется в /user-info и /history?include_user_info=true.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session

from crud import messages_crud
from crud.lists.mailing import get_mailing_user_by_vk_id, update_mailing_user_profile
from services.vk_api.token_manager import call_vk_api_for_group

logger = logging.getLogger(__name__)

# Поля VK API users.get, запрашиваемые при обновлении профиля
_USER_FIELDS = "sex,bdate,city,country,photo_100,domain,has_mobile,last_seen,is_closed,can_access_closed,can_write_private_message,deactivated"


def _needs_profile_refresh(updated_at_str: Optional[str], force: bool = False) -> bool:
    """Определяет, нужно ли обновлять профиль (TTL 24 часа)."""
    if force:
        return True
    if not updated_at_str:
        return True
    try:
        updated_at = datetime.fromisoformat(updated_at_str)
        return (datetime.utcnow() - updated_at) > timedelta(hours=24)
    except (ValueError, TypeError):
        return True


def _refresh_profile_from_vk(
    db: Session,
    project_id: str,
    user_id: int,
    community_tokens: list,
    group_id_int: int,
) -> bool:
    """
    Обновляет профиль пользователя из VK API users.get + messages.isMessagesFromGroupAllowed.
    Возвращает True если обновление прошло успешно.
    """
    try:
        vk_result = call_vk_api_for_group(
            method="users.get",
            params={
                "user_ids": user_id,
                "fields": _USER_FIELDS,
            },
            group_id=group_id_int,
            community_tokens=community_tokens,
            project_id=project_id,
        )
        if isinstance(vk_result, list) and len(vk_result) > 0:
            vk_user = vk_result[0]

            # Проверяем, может ли сообщество писать пользователю
            # (messages.isMessagesFromGroupAllowed — точный статус от лица сообщества)
            try:
                group_allowed_result = call_vk_api_for_group(
                    method="messages.isMessagesFromGroupAllowed",
                    params={
                        "group_id": group_id_int,
                        "user_id": user_id,
                    },
                    group_id=group_id_int,
                    community_tokens=community_tokens,
                    project_id=project_id,
                )
                if isinstance(group_allowed_result, dict) and "is_allowed" in group_allowed_result:
                    # Перезаписываем can_write_private_message реальным статусом от сообщества
                    vk_user["can_write_private_message"] = group_allowed_result["is_allowed"]
                    logger.debug(f"USER-INFO: isMessagesFromGroupAllowed для user={user_id}: {group_allowed_result['is_allowed']}")
            except Exception as e:
                logger.warning(f"USER-INFO: ошибка проверки isMessagesFromGroupAllowed для user={user_id}: {e}")

            update_mailing_user_profile(db, project_id, user_id, vk_user)
            return True
    except Exception as e:
        logger.warning(f"USER-INFO: ошибка обновления профиля из VK API: {e}")
    return False


def _enrich_with_message_dates(
    db: Session,
    project_id: str,
    user_id: int,
    user_data: Dict[str, Any],
    profile_refreshed: bool,
) -> Dict[str, Any]:
    """Добавляет даты последних сообщений и флаг обновления к данным пользователя."""
    message_dates = messages_crud.get_last_message_dates(db, project_id, user_id)

    incoming_ts = message_dates.get("last_incoming_date")
    user_data["last_incoming_message_date"] = (
        datetime.utcfromtimestamp(incoming_ts).isoformat() if incoming_ts else None
    )

    outgoing_ts = message_dates.get("last_outgoing_date")
    user_data["last_outgoing_message_date"] = (
        datetime.utcfromtimestamp(outgoing_ts).isoformat() if outgoing_ts else None
    )

    user_data["profile_refreshed"] = profile_refreshed
    return user_data


def get_user_info(
    db: Session,
    project_id: str,
    user_id: int,
    community_tokens: list,
    group_id_int: int,
    force_refresh: bool = False,
) -> Dict[str, Any]:
    """
    Полная логика получения данных пользователя с авто-обновлением.
    Возвращает dict ответа: {success, found, user}.
    """
    user_data = get_mailing_user_by_vk_id(db, project_id, user_id)

    if not user_data:
        return {"success": True, "found": False, "user": None}

    # Авто-обновление профиля (TTL 24 часа)
    profile_refreshed = False
    need_refresh = _needs_profile_refresh(user_data.get("updated_at"), force_refresh)

    if need_refresh:
        refreshed = _refresh_profile_from_vk(db, project_id, user_id, community_tokens, group_id_int)
        if refreshed:
            user_data = get_mailing_user_by_vk_id(db, project_id, user_id)
            profile_refreshed = True
            logger.info(f"USER-INFO: профиль обновлён из VK API (project={project_id}, user={user_id})")

    # Добавляем даты сообщений
    if user_data:
        user_data = _enrich_with_message_dates(db, project_id, user_id, user_data, profile_refreshed)

    return {"success": True, "found": True, "user": user_data}


def get_user_info_for_response(
    db: Session,
    project_id: str,
    user_id: int,
    project,
    community_tokens: list,
    group_id_int: int,
) -> Optional[Dict[str, Any]]:
    """
    Получает данные пользователя из рассылки с авто-обновлением (TTL 24ч).
    Возвращает словарь user_data или None.
    Используется в /history?include_user_info=true для объединения запросов.
    """
    user_data = get_mailing_user_by_vk_id(db, project_id, user_id)

    if not user_data:
        return None

    # Авто-обновление профиля (TTL 24 часа)
    profile_refreshed = False
    need_refresh = _needs_profile_refresh(user_data.get("updated_at"))

    if need_refresh:
        refreshed = _refresh_profile_from_vk(db, project_id, user_id, community_tokens, group_id_int)
        if refreshed:
            user_data = get_mailing_user_by_vk_id(db, project_id, user_id)
            profile_refreshed = True
            logger.info(f"USER-INFO (inline): профиль обновлён из VK API (project={project_id}, user={user_id})")

    # Добавляем даты сообщений
    if user_data:
        user_data = _enrich_with_message_dates(db, project_id, user_id, user_data, profile_refreshed)

    return user_data
