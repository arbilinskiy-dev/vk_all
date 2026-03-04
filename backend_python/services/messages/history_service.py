"""
Сервис истории сообщений.

При каждом входе в диалог:
1. Запрашиваем последние 200 сообщений из VK API
2. Upsert в БД (дозаписываем чего нет, обновляем изменённое)
3. Читаем из БД нужную страницу и возвращаем клиенту

Никакого TTL и проверки свежести — всегда свежие данные из VK.
"""

import logging
from typing import Dict, Any, Optional

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from crud import messages_crud
from services.vk_api.api_client import VkApiError
from services.messages.vk_client import fetch_from_vk
from services.messages.user_info_service import get_user_info_for_response

logger = logging.getLogger(__name__)

# Количество сообщений, запрашиваемых из VK за один раз
VK_FETCH_SIZE = 200


def get_history(
    db: Session,
    project_id: str,
    user_id: int,
    count: int,
    offset: int,
    force_refresh: bool,
    include_user_info: bool,
    project,
    community_tokens: list,
    group_id_int: int,
    background_tasks: Optional[BackgroundTasks] = None,
    direction: Optional[str] = None,
    search_text: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Получает историю сообщений.

    Логика:
    1. Синхронизация с VK API (пропускается если есть фильтры — данные уже в базе)
    2. Читаем из БД нужную страницу (count/offset) с учётом фильтров
    
    direction: "incoming" | "outgoing" | None (все)
    search_text: подстрока для поиска по тексту
    """
    has_filters = direction is not None or bool(search_text and search_text.strip())
    vk_available = True
    
    # --- 1. Синхронизация с VK API (пропускаем если есть фильтры — данные уже в базе) ---
    if not has_filters:
        try:
            result = fetch_from_vk(community_tokens, group_id_int, user_id, VK_FETCH_SIZE, 0, project_id)
            vk_items = result.get("items", [])
            total = result.get("count", 0)
            
            # Upsert в БД
            if vk_items:
                messages_crud.save_vk_messages(db, project_id, user_id, vk_items)
                # Сравниваем с кэшем и помечаем удалённые из ВК сообщения
                messages_crud.mark_deleted_from_vk(db, project_id, user_id, vk_items)
            
            # Обновляем метаданные
            dir_counts = messages_crud.recalc_direction_counts(db, project_id, user_id)
            cached_count = dir_counts["cached_total"]
            messages_crud.upsert_cache_meta(
                db, project_id, user_id,
                total_count=total,
                cached_count=cached_count,
                incoming_count=dir_counts["incoming_count"],
                outgoing_count=dir_counts["outgoing_count"],
            )
            
            logger.info(
                f"MESSAGES: VK API → DB upsert {len(vk_items)} msgs "
                f"(project={project_id}, user={user_id})"
            )
            
        except VkApiError as e:
            logger.warning(
                f"MESSAGES: VK API недоступен, отдаём данные из БД — {e} "
                f"(project={project_id}, user={user_id})"
            )
            vk_available = False
        except Exception as e:
            logger.warning(
                f"MESSAGES: ошибка синхронизации с VK, отдаём данные из БД — {e} "
                f"(project={project_id}, user={user_id})"
            )
            vk_available = False
    else:
        # Фильтры активны — пропускаем VK sync, читаем только из кэша
        logger.info(
            f"MESSAGES: фильтры активны (direction={direction}, search={search_text}), "
            f"пропускаем VK sync (project={project_id}, user={user_id})"
        )
    
    # --- 2. Читаем данные из БД (после upsert — всегда актуальные) ---
    items, total_in_cache = messages_crud.get_cached_messages(
        db, project_id, user_id, count, offset,
        direction=direction, search_text=search_text,
    )
    
    # Диагностика: если фильтр активен, но результатов нет — логируем подробно
    if has_filters and total_in_cache == 0:
        meta_diag = messages_crud.get_cache_meta(db, project_id, user_id)
        logger.warning(
            f"MESSAGES FILTER BUG DIAG: фильтр вернул 0 результатов! "
            f"direction={direction}, search_text={search_text}, offset={offset}, "
            f"project={project_id}, user={user_id}, "
            f"meta.cached_count={meta_diag.cached_count if meta_diag else 'NO META'}, "
            f"meta.is_fully_loaded={meta_diag.is_fully_loaded if meta_diag else 'NO META'}"
        )
    
    meta = messages_crud.get_cache_meta(db, project_id, user_id)
    
    # count: при фильтрации — отфильтрованное количество (для корректной пагинации),
    # без фильтров — total из VK (как раньше)
    if has_filters:
        response_count = total_in_cache
        response_source = "cache_filtered"
    else:
        response_count = meta.total_count if meta else total_in_cache
        response_source = "vk_synced" if vk_available else "cache_fallback"

    response = {
        "success": True,
        "count": response_count,
        "items": items,
        "source": response_source,
        "cached_count": total_in_cache,
        "is_fully_loaded": meta.is_fully_loaded if meta else False,
    }
    
    # Статистика по направлению сообщений (при первичной загрузке)
    if offset == 0:
        direction_stats = messages_crud.get_message_direction_counts(db, project_id, user_id)
        # Добавляем количество удалённых из ВК сообщений
        direction_stats["deleted_from_vk_count"] = messages_crud.get_deleted_from_vk_count(db, project_id, user_id)
        response["message_stats"] = direction_stats
    
    # Добавляем данные пользователя если запросили
    if include_user_info:
        response["user_info"] = get_user_info_for_response(
            db, project_id, user_id, project, community_tokens, group_id_int
        )
    
    return response
