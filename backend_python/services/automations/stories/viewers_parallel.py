"""
Модуль-хаб для ПАРАЛЛЕЛЬНОГО получения зрителей историй VK.

Оркестрирует 4 фазы:
1. Параллельный сбор user_ids со всех историй (viewers_vk_workers)
2. Объединение уникальных user_ids
3. Execute-батчи для массовой загрузки users.get (viewers_vk_workers)
4. Маппинг данных обратно к историям (viewers_mapper)

Ускорение: 10-20x по сравнению с последовательной обработкой.

Декомпозиция:
- viewers_vk_workers.py — воркеры VK API (ротация токенов, пагинация, execute-батчи)
- viewers_mapper.py — маппинг raw-данных VK в структуры ответа
"""
import concurrent.futures
import time
from typing import List, Dict, Any, Tuple

from services.vk_api.admin_tokens import get_admin_token_strings_for_group
from .viewers_details import _fetch_members_status
from .viewers_vk_workers import (
    StoryViewersData,
    _fetch_story_viewers_ids,
    _fetch_users_batch_execute,
    MAX_USERS_PER_REQUEST,
    EXECUTE_USERS_BATCH,
)
from .viewers_mapper import map_stories_results

# Константы оркестрации
MAX_WORKERS = 15  # Максимум параллельных потоков


def fetch_viewers_parallel(
    stories_data: List[Tuple[str, str]],  # [(owner_id, story_id), ...]
    group_id: int,
    project_id: str,
    community_tokens: list = None
) -> Dict[str, Any]:
    """
    Основная функция: параллельно загружает зрителей для списка историй.
    
    Аргументы:
        stories_data: список кортежей (owner_id, story_id)
        group_id: ID группы VK (для получения админ-токенов)
        project_id: ID проекта
        community_tokens: список токенов сообщества (если есть — используются ЭКСКЛЮЗИВНО)
    
    Возвращает:
        {
            "success": True,
            "stories": { "owner_id_story_id": { "items": [...], "count": N, "reactions_count": M }, ... },
            "stats": { "total_stories": N, "total_viewers": M, "time_elapsed": X.XX }
        }
    """
    start_time = time.time()

    if not stories_data:
        return {"success": True, "stories": {}, "stats": {"total_stories": 0, "total_viewers": 0, "time_elapsed": 0}}

    # Получаем токены: community_tokens → ТОЛЬКО они, иначе админ-токены
    tokens = list(community_tokens) if community_tokens else get_admin_token_strings_for_group(group_id, include_non_admins=True)

    print(f"[ViewersParallel] Starting parallel fetch for {len(stories_data)} stories, {len(tokens)} tokens")

    if not tokens:
        return {"success": False, "error": "No tokens available", "stories": {}}

    # ========== ФАЗА 1: Параллельный сбор user_ids ==========
    stories_viewers = _phase1_collect_viewers(stories_data, tokens)

    # ========== ФАЗА 2: Собираем уникальные user_ids ==========
    all_user_ids = set()
    for sv in stories_viewers:
        all_user_ids.update(sv.user_ids)
    unique_user_ids = list(all_user_ids)

    # ========== ФАЗА 3: Execute-батчи для users.get ==========
    users_map = _phase3_load_user_details(unique_user_ids, tokens, project_id)
    print(f"[ViewersParallel] Loaded details for {len(users_map)}/{len(unique_user_ids)} users")

    # ========== ФАЗА 3.5: Проверка подписки через groups.isMember ==========
    members_map = _phase35_check_membership(unique_user_ids, group_id, tokens)

    # ========== ФАЗА 4: Маппинг данных обратно к историям ==========
    result_stories, total_viewers = map_stories_results(stories_viewers, users_map, members_map)

    elapsed = time.time() - start_time
    print(f"[ViewersParallel] Done: {len(stories_data)} stories, {total_viewers} viewers, {len(unique_user_ids)} unique in {elapsed:.2f}s")

    return {
        "success": True,
        "stories": result_stories,
        "stats": {
            "total_stories": len(stories_data),
            "total_viewers": total_viewers,
            "unique_users": len(unique_user_ids),
            "time_elapsed": round(elapsed, 2)
        }
    }


# ─── Внутренние фазы оркестрации ───────────────────────────────────────────


def _phase1_collect_viewers(
    stories_data: List[Tuple[str, str]],
    tokens: List[str]
) -> List[StoryViewersData]:
    """Фаза 1: параллельный сбор user_ids со всех историй."""
    stories_viewers: List[StoryViewersData] = []
    max_workers = min(len(tokens), MAX_WORKERS, len(stories_data))

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {}
        for i, (owner_id, story_id) in enumerate(stories_data):
            future = executor.submit(_fetch_story_viewers_ids, owner_id, story_id, tokens, i)
            futures[future] = (owner_id, story_id)

        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            stories_viewers.append(result)

            if result.success:
                print(f"[ViewersParallel] Story {result.owner_id}_{result.story_id}: {len(result.user_ids)} viewers")
            else:
                print(f"[ViewersParallel] ✗ Story {result.owner_id}_{result.story_id}: {result.error}")

    return stories_viewers


def _phase3_load_user_details(
    unique_user_ids: List[int],
    tokens: List[str],
    project_id: str
) -> Dict[int, Dict]:
    """Фаза 3: загрузка деталей пользователей через execute-батчи."""
    users_map: Dict[int, Dict] = {}

    if not unique_user_ids:
        return users_map

    # Супер-батчи (25 × 100 = 2500 пользователей за execute)
    super_batch_size = EXECUTE_USERS_BATCH * MAX_USERS_PER_REQUEST
    super_batches = [unique_user_ids[i:i + super_batch_size] for i in range(0, len(unique_user_ids), super_batch_size)]

    with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(tokens), len(super_batches), 5)) as executor:
        futures = {
            executor.submit(_fetch_users_batch_execute, batch, tokens, i, project_id): i
            for i, batch in enumerate(super_batches)
        }

        for future in concurrent.futures.as_completed(futures):
            batch_idx = futures[future]
            try:
                users_data = future.result()
                for user in users_data:
                    if user and 'id' in user:
                        users_map[user['id']] = user
            except Exception as e:
                print(f"[ViewersParallel] Execute batch {batch_idx + 1} error: {e}")

    return users_map


def _phase35_check_membership(
    unique_user_ids: List[int],
    group_id: int,
    tokens: List[str]
) -> Dict[int, bool]:
    """Фаза 3.5: проверка подписки пользователей через groups.isMember."""
    members_map: Dict[int, bool] = {}

    if not unique_user_ids or not group_id:
        return members_map

    effective_group_id = abs(group_id) if group_id < 0 else group_id
    membership_token = tokens[0] if tokens else None

    if membership_token:
        members_map = _fetch_members_status(effective_group_id, unique_user_ids, membership_token)

    return members_map
