"""
Параллельная и последовательная загрузка ВСЕХ сообщений диалога через VK API.

Если токенов >= 2 и сообщений > 400 — делим диапазон offset-ов между
токенами и качаем параллельно через ThreadPoolExecutor.
Если токен один или сообщений мало — последовательный fallback.
"""

import time
import logging
import concurrent.futures
from typing import Dict, Any, List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from crud import messages_crud
from services.vk_api.api_client import VkApiError
from services.vk_api.token_manager import call_vk_api_for_group
from services.messages.vk_client import fetch_from_vk

logger = logging.getLogger(__name__)

# === Константы параллельной загрузки ===
_PARALLEL_BATCH_SIZE = 200       # Размер одного запроса к VK API
_PARALLEL_MIN_TOTAL = 400        # Минимальный порог для параллелизации
_PARALLEL_MIN_TOKENS = 2         # Минимум токенов для параллелизации
_PARALLEL_MAX_WORKERS = 5        # Макс. параллельных воркеров
_PARALLEL_STAGGER_SEC = 1.5      # Задержка между стартом воркеров (VK flood protection)
_PARALLEL_INTER_BATCH_SEC = 0.3  # Пауза между запросами внутри одного воркера
_PARALLEL_MAX_RETRIES = 2        # Макс. повторов для проваленного диапазона


def _distribute_offsets(
    total_count: int,
    num_tokens: int,
    batch_size: int = _PARALLEL_BATCH_SIZE,
) -> List[List[int]]:
    """
    Распределяет offset-ы между N токенами.

    Пример: total_count=1000, num_tokens=3, batch_size=200
    → 5 батчей (offsets 0,200,400,600,800)
    → token0: [0, 600], token1: [200, 800], token2: [400]

    Возвращает список из N списков offset-ов (round-robin).
    """
    all_offsets = list(range(0, total_count, batch_size))
    buckets: List[List[int]] = [[] for _ in range(num_tokens)]
    for i, offset in enumerate(all_offsets):
        buckets[i % num_tokens].append(offset)
    return buckets


def _worker_fetch_range(
    token: str,
    token_index: int,
    group_id_int: int,
    user_id: int,
    offsets: List[int],
    batch_size: int,
    project_id: str,
) -> Dict[str, Any]:
    """
    Воркер: один токен последовательно качает свои offset-диапазоны.

    Возвращает:
        {
            "items": [...],          # Все скачанные сообщения
            "total_count": int,      # count из VK API (последний ответ)
            "failed_offsets": [...],  # Offset-ы, на которых произошла ошибка
            "error": str | None,     # Описание фатальной ошибки
        }
    """
    items = []
    failed_offsets = []
    total_count = 0
    fatal_error = None

    for offset in offsets:
        try:
            # Используем ТОЛЬКО этот токен (эксклюзивный режим)
            result = call_vk_api_for_group(
                method="messages.getHistory",
                params={
                    "user_id": user_id,
                    "count": batch_size,
                    "offset": offset,
                    "rev": 0,
                },
                group_id=group_id_int,
                community_tokens=[token],
                project_id=project_id,
            )

            batch_items = result.get("items", [])
            total_count = result.get("count", total_count)

            if batch_items:
                items.extend(batch_items)

            logger.debug(
                f"PARALLEL WORKER #{token_index}: offset={offset}, "
                f"got {len(batch_items)}, total so far {len(items)}"
            )

            # Пауза между запросами для одного токена (VK rate limit ~3 req/sec)
            time.sleep(_PARALLEL_INTER_BATCH_SEC)

        except VkApiError as e:
            # Flood control (Error 9) — фатальная ошибка для этого воркера
            if e.code == 9:
                logger.warning(
                    f"PARALLEL WORKER #{token_index}: FLOOD CONTROL на offset={offset}, "
                    f"остановка воркера. Скачано {len(items)} сообщений."
                )
                # Все оставшиеся offset-ы тоже считаем проваленными
                current_idx = offsets.index(offset)
                failed_offsets.extend(offsets[current_idx:])
                fatal_error = f"Flood control (Error 9) на offset={offset}"
                break

            # Другие VK ошибки — пропускаем этот offset, продолжаем
            logger.warning(
                f"PARALLEL WORKER #{token_index}: VK Error {e.code} на offset={offset}: {e}"
            )
            failed_offsets.append(offset)

        except Exception as e:
            # Неизвестная ошибка — пропускаем offset, продолжаем
            logger.error(
                f"PARALLEL WORKER #{token_index}: неожиданная ошибка на offset={offset}: {e}"
            )
            failed_offsets.append(offset)

    return {
        "items": items,
        "total_count": total_count,
        "failed_offsets": failed_offsets,
        "error": fatal_error,
    }


def _parallel_fetch_all_messages(
    community_tokens: List[str],
    group_id_int: int,
    user_id: int,
    total_count: int,
    project_id: str,
) -> Dict[str, Any]:
    """
    Оркестратор параллельной загрузки всех сообщений диалога.

    Этапы:
    1. Распределяет offset-ы по токенам (round-robin)
    2. Запускает воркеры через ThreadPoolExecutor со staggered start
    3. Собирает результаты, дедуплицирует по message_id
    4. Retry проваленных offset-ов последовательно через первый рабочий токен
    5. Проверяет порог успешности (90%)
    """
    num_tokens = len(community_tokens)
    num_workers = min(num_tokens, _PARALLEL_MAX_WORKERS)
    tokens_to_use = community_tokens[:num_workers]

    logger.info(
        f"PARALLEL LOAD: total_count={total_count}, "
        f"tokens={num_tokens}, workers={num_workers} "
        f"(project={project_id}, user={user_id})"
    )

    # --- Этап 1: Распределение offset-ов ---
    buckets = _distribute_offsets(total_count, num_workers)

    for i, bucket in enumerate(buckets):
        logger.debug(f"PARALLEL LOAD: token #{i} → {len(bucket)} батчей (offsets: {bucket[:3]}...)")

    # --- Этап 2: Запуск параллельных воркеров ---
    worker_results: List[Dict[str, Any]] = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = {}
        for idx, token in enumerate(tokens_to_use):
            # Staggered start — небольшая задержка между воркерами
            if idx > 0:
                time.sleep(_PARALLEL_STAGGER_SEC)

            future = executor.submit(
                _worker_fetch_range,
                token, idx, group_id_int, user_id,
                buckets[idx], _PARALLEL_BATCH_SIZE, project_id,
            )
            futures[future] = idx

        # Собираем результаты по мере готовности
        for future in concurrent.futures.as_completed(futures):
            worker_idx = futures[future]
            try:
                result = future.result()
                worker_results.append(result)
                logger.info(
                    f"PARALLEL LOAD: worker #{worker_idx} завершён — "
                    f"{len(result['items'])} сообщений, "
                    f"{len(result['failed_offsets'])} failed offsets"
                )
            except Exception as e:
                logger.error(f"PARALLEL LOAD: worker #{worker_idx} CRASHED: {e}")
                worker_results.append({
                    "items": [],
                    "total_count": total_count,
                    "failed_offsets": buckets[worker_idx],
                    "error": f"Worker crash: {e}",
                })

    # --- Этап 3: Сбор + дедупликация ---
    seen_ids = set()
    all_items = []
    final_total_count = total_count
    all_failed_offsets = []

    for wr in worker_results:
        final_total_count = max(final_total_count, wr.get("total_count", 0))
        all_failed_offsets.extend(wr.get("failed_offsets", []))

        for item in wr.get("items", []):
            msg_id = item.get("id")
            if msg_id and msg_id not in seen_ids:
                seen_ids.add(msg_id)
                all_items.append(item)

    logger.info(
        f"PARALLEL LOAD: после дедупликации — {len(all_items)} уник. сообщений, "
        f"{len(all_failed_offsets)} failed offsets"
    )

    # --- Этап 4: Retry проваленных offset-ов ---
    retry_count = 0
    if all_failed_offsets:
        retry_count = _retry_failed_offsets(
            all_failed_offsets, worker_results, community_tokens,
            group_id_int, user_id, project_id,
            seen_ids, all_items,
        )

    # --- Этап 5: Финальная проверка порога ---
    threshold = int(final_total_count * 0.90) if final_total_count > 0 else 0
    if len(all_items) < threshold:
        logger.warning(
            f"PARALLEL LOAD: порог не пройден — {len(all_items)}/{final_total_count} "
            f"({int(len(all_items)/max(final_total_count,1)*100)}%). "
            f"Данные всё равно сохраняются (partial load)."
        )

    logger.info(
        f"PARALLEL LOAD: ГОТОВО — {len(all_items)} сообщений из {final_total_count}, "
        f"workers={num_workers}, retried={retry_count}"
    )

    return {
        "items": all_items,
        "total_count": final_total_count,
        "parallel": True,
        "workers_used": num_workers,
        "retry_count": retry_count,
    }


def _retry_failed_offsets(
    all_failed_offsets: List[int],
    worker_results: List[Dict[str, Any]],
    community_tokens: List[str],
    group_id_int: int,
    user_id: int,
    project_id: str,
    seen_ids: set,
    all_items: list,
) -> int:
    """Перекачивает проваленные offset-ы последовательно. Возвращает количество успешных retry."""
    logger.info(f"PARALLEL LOAD: retry {len(all_failed_offsets)} failed offsets последовательно...")

    # Находим «живой» токен
    working_tokens = []
    for wr in worker_results:
        if not wr.get("error"):
            working_tokens = community_tokens
            break

    if not working_tokens:
        working_tokens = community_tokens

    retry_count = 0
    for attempt in range(_PARALLEL_MAX_RETRIES):
        if not all_failed_offsets:
            break

        still_failed = []
        for offset in all_failed_offsets:
            try:
                result = fetch_from_vk(
                    working_tokens, group_id_int, user_id,
                    _PARALLEL_BATCH_SIZE, offset, project_id,
                )
                batch_items = result.get("items", [])

                for item in batch_items:
                    msg_id = item.get("id")
                    if msg_id and msg_id not in seen_ids:
                        seen_ids.add(msg_id)
                        all_items.append(item)

                retry_count += 1
                time.sleep(_PARALLEL_INTER_BATCH_SEC)

            except Exception as e:
                logger.warning(f"PARALLEL LOAD: retry offset={offset} attempt={attempt+1} failed: {e}")
                still_failed.append(offset)
                time.sleep(1.0)

        all_failed_offsets = still_failed
        if still_failed:
            logger.info(f"PARALLEL LOAD: retry attempt {attempt+1} — ещё {len(still_failed)} failed")
            time.sleep(2.0)

    if all_failed_offsets:
        logger.warning(
            f"PARALLEL LOAD: {len(all_failed_offsets)} offset-ов не удалось загрузить "
            f"после {_PARALLEL_MAX_RETRIES} попыток"
        )

    return retry_count


def _sequential_fetch_all_messages(
    community_tokens: List[str],
    group_id_int: int,
    user_id: int,
    project_id: str,
) -> Dict[str, Any]:
    """
    Последовательная загрузка всех сообщений (fallback для 1 токена).
    Аналог старой логики load_all_messages.
    """
    all_items = []
    offset = 0
    total_count = 0
    batch_size = _PARALLEL_BATCH_SIZE
    # Защита: макс 500 итераций = до 100 000 сообщений
    max_iterations = 500

    for i in range(max_iterations):
        result = fetch_from_vk(
            community_tokens, group_id_int, user_id, batch_size, offset, project_id,
        )
        items = result.get("items", [])
        total_count = result.get("count", 0)

        if not items:
            break

        all_items.extend(items)
        offset += len(items)

        logger.info(
            f"MESSAGES LOAD ALL (seq): batch {i+1}, "
            f"got {len(items)}, total so far {len(all_items)}/{total_count}"
        )

        if offset >= total_count or len(items) < batch_size:
            break

    return {
        "items": all_items,
        "total_count": total_count,
        "parallel": False,
        "workers_used": 1,
        "retry_count": 0,
    }


def load_all_messages(
    db: Session,
    project_id: str,
    user_id: int,
    community_tokens: List[str],
    group_id_int: int,
) -> Dict[str, Any]:
    """
    Оркестратор загрузки ВСЕХ сообщений.

    Стратегия:
    - Если токенов >= 2 и сообщений > 400 → параллельная загрузка
    - Иначе → последовательная загрузка

    Возвращает dict ответа для клиента.
    """
    # Проверяем, может уже всё загружено
    meta = messages_crud.get_cache_meta(db, project_id, user_id)
    if meta and meta.is_fully_loaded:
        cached_count = messages_crud.get_cached_messages_count(db, project_id, user_id)
        return {
            "success": True,
            "total_loaded": cached_count,
            "total_count": meta.total_count,
            "already_loaded": True,
        }

    try:
        # --- Шаг 1: Узнаём total_count через пробный запрос (1 сообщение) ---
        probe = fetch_from_vk(
            community_tokens, group_id_int, user_id, 1, 0, project_id,
        )
        total_count = probe.get("count", 0)

        if total_count == 0:
            # Диалог пуст
            messages_crud.upsert_cache_meta(
                db, project_id, user_id,
                total_count=0, cached_count=0, is_fully_loaded=True,
            )
            return {
                "success": True, "total_loaded": 0,
                "total_count": 0, "already_loaded": False,
            }

        # --- Шаг 2: Выбираем стратегию загрузки ---
        use_parallel = (
            len(community_tokens) >= _PARALLEL_MIN_TOKENS
            and total_count > _PARALLEL_MIN_TOTAL
        )

        if use_parallel:
            logger.info(
                f"MESSAGES LOAD ALL: ПАРАЛЛЕЛЬНЫЙ режим — "
                f"{total_count} сообщений, {len(community_tokens)} токенов "
                f"(project={project_id}, user={user_id})"
            )
            fetch_result = _parallel_fetch_all_messages(
                community_tokens, group_id_int, user_id, total_count, project_id,
            )
        else:
            logger.info(
                f"MESSAGES LOAD ALL: ПОСЛЕДОВАТЕЛЬНЫЙ режим — "
                f"{total_count} сообщений, {len(community_tokens)} токен(ов) "
                f"(project={project_id}, user={user_id})"
            )
            fetch_result = _sequential_fetch_all_messages(
                community_tokens, group_id_int, user_id, project_id,
            )

        all_items = fetch_result["items"]
        final_total = fetch_result["total_count"]

        # --- Шаг 3: Сохраняем в БД ---
        if all_items:
            messages_crud.save_vk_messages(db, project_id, user_id, all_items)

        # Пересчитываем направленные счётчики
        dir_counts = messages_crud.recalc_direction_counts(db, project_id, user_id)

        # Считаем is_fully_loaded: если скачали >= 90% от total
        threshold = int(final_total * 0.90) if final_total > 0 else 0
        is_fully_loaded = len(all_items) >= threshold

        # Обновляем метаданные
        cached_count = dir_counts["cached_total"]
        messages_crud.upsert_cache_meta(
            db, project_id, user_id,
            total_count=final_total,
            cached_count=cached_count,
            is_fully_loaded=is_fully_loaded,
            incoming_count=dir_counts["incoming_count"],
            outgoing_count=dir_counts["outgoing_count"],
        )

        mode_str = "parallel" if fetch_result.get("parallel") else "sequential"
        logger.info(
            f"MESSAGES LOAD ALL: Done ({mode_str})! {cached_count} msgs saved, "
            f"workers={fetch_result.get('workers_used', 1)}, "
            f"retried={fetch_result.get('retry_count', 0)} "
            f"(project={project_id}, user={user_id})"
        )

        return {
            "success": True,
            "total_loaded": cached_count,
            "total_count": final_total,
            "already_loaded": False,
            "mode": mode_str,
            "workers_used": fetch_result.get("workers_used", 1),
        }

    except VkApiError as e:
        logger.error(f"MESSAGES LOAD ALL: VK API error — {e}")
        raise HTTPException(status_code=502, detail=f"Ошибка VK API: {str(e)}")
    except Exception as e:
        logger.error(f"MESSAGES LOAD ALL: Unexpected error — {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка: {str(e)}")
