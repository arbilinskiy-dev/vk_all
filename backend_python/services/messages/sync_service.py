"""
Фоновая синхронизация — догружает новые сообщения из VK API в кэш БД.
"""

import logging

from database import SessionLocal
from crud import messages_crud
from services.messages.vk_client import fetch_from_vk

logger = logging.getLogger(__name__)


def sync_new_messages(
    db: "Session",
    project_id: str,
    vk_user_id: int,
    community_tokens: list,
    group_id_int: int,
) -> int:
    """
    Синхронная до-синхронизация: проверяет VK API на новые сообщения и дописывает в кэш.
    Используется при входе в диалог с протухшим кэшем.
    Возвращает количество дозагруженных сообщений.
    """
    # Самая свежая дата в нашем кэше
    newest_date = messages_crud.get_newest_cached_date(db, project_id, vk_user_id)

    # Запрашиваем последние 200 сообщений из VK
    result = fetch_from_vk(community_tokens, group_id_int, vk_user_id, 200, 0, project_id)
    items = result.get("items", [])
    total = result.get("count", 0)

    if not items:
        # Обновляем метку синхронизации даже если новых сообщений нет
        meta = messages_crud.get_cache_meta(db, project_id, vk_user_id)
        if meta:
            import time as _time
            meta.last_synced_at = _time.time()
            db.commit()
        return 0

    # Фильтруем только новые (те, что свежее нашего кэша)
    if newest_date:
        new_items = [i for i in items if i.get("date", 0) > newest_date]
    else:
        new_items = items

    saved = 0
    if new_items:
        saved = messages_crud.save_vk_messages(db, project_id, vk_user_id, new_items)
        logger.info(f"MESSAGES SYNC: +{saved} новых сообщений (project={project_id}, user={vk_user_id})")

    # Пересчитываем направленные счётчики
    dir_counts = messages_crud.recalc_direction_counts(db, project_id, vk_user_id)

    # Обновляем метаданные (включая last_synced_at → кэш снова свежий)
    cached_count = dir_counts["cached_total"]
    messages_crud.upsert_cache_meta(
        db, project_id, vk_user_id,
        total_count=total,
        cached_count=cached_count,
        incoming_count=dir_counts["incoming_count"],
        outgoing_count=dir_counts["outgoing_count"],
    )

    return saved


def background_sync_new_messages(
    project_id: str,
    vk_user_id: int,
    community_tokens: list,
    group_id_int: int,
):
    """
    Фоновая задача: обёртка над sync_new_messages для BackgroundTasks.
    Создаёт собственную сессию БД.
    """
    db = SessionLocal()
    try:
        sync_new_messages(db, project_id, vk_user_id, community_tokens, group_id_int)
    except Exception as e:
        logger.error(f"MESSAGES SYNC ERROR: {e}")
    finally:
        SessionLocal.remove()
