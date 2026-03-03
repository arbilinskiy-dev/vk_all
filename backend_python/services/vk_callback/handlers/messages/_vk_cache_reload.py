# Перезагрузка истории сообщений из VK API при устаревшем кэше.
# Загружает последние 200 сообщений — чтобы получить все пропущенные.

import json
import logging
from sqlalchemy.orm import Session

from crud import messages_crud

logger = logging.getLogger("vk_callback.handlers.messages")


def _reload_history_from_vk(db: Session, project_id: str, vk_user_id: int, project) -> bool:
    """
    Перезагружает историю сообщений из VK API при устаревшем кэше.
    Загружает последние 200 сообщений — чтобы получить все пропущенные.
    Возвращает True если загрузка успешна.
    """
    try:
        from services.vk_api.token_manager import call_vk_api_for_group

        # Получаем токены сообщества
        community_tokens = []
        if project and project.communityToken:
            community_tokens.append(project.communityToken)
        if project and project.additional_community_tokens:
            try:
                extras = json.loads(project.additional_community_tokens)
                if isinstance(extras, list):
                    community_tokens.extend([t for t in extras if t])
            except Exception:
                pass

        if not community_tokens:
            logger.warning(f"SMART CACHE: нет токенов для project={project_id}")
            return False

        group_id = abs(int(project.vkProjectId)) if project.vkProjectId else None
        if not group_id:
            return False

        # Загружаем последние 200 сообщений из VK API
        vk_response = call_vk_api_for_group(
            method="messages.getHistory",
            params={"user_id": vk_user_id, "count": 200, "offset": 0, "rev": 0},
            group_id=group_id,
            community_tokens=community_tokens,
            project_id=project_id,
        )

        items = vk_response.get("items", [])
        total_count = vk_response.get("count", 0)

        if items:
            messages_crud.save_vk_messages(db, project_id, vk_user_id, items)
            messages_crud.upsert_cache_meta(
                db, project_id, vk_user_id,
                total_count=total_count,
                cached_count=len(items),
            )

        logger.info(
            f"SMART CACHE: перезагрузили {len(items)} сообщений из VK API "
            f"для user={vk_user_id} в project={project_id}"
        )
        return True

    except Exception as e:
        logger.error(f"SMART CACHE RELOAD ERROR: {e}")
        return False
