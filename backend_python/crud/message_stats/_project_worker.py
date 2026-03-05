"""
Worker для обработки одного проекта в отдельном потоке.

Каждый проект:
- Создаёт свою DB-сессию (thread-safe через SessionLocal)
- Проходит по юзерам последовательно с rate-limit
- Использует hourly_cache для предотвращения UNIQUE constraint дубликатов
- Пишет прогресс в thread-safe Queue
- Коммитит батчами по BATCH_SIZE юзеров
"""

import time
import logging
from typing import Dict, List, Any, Set, Optional
from queue import Queue

from models_library.message_stats import MessageStatsHourly
from crud.message_stats._aggregation import aggregate_messages
from crud.message_stats._db_reconcile import reconcile_hourly, reconcile_user
from crud.message_stats._helpers import _bulk_recount_hourly_users

logger = logging.getLogger("crud.message_stats.reconcile")

# Размер батча: после каждого батча — коммит в БД и отправка прогресса
BATCH_SIZE = 25

# Задержка между VK API вызовами ВНУТРИ одного проекта (проактивный rate-limit)
# VK ограничивает ~3 req/sec на один токен сообщества
API_CALL_DELAY = 0.35


def process_single_project(
    pid: str,
    tokens: List[str],
    group_id_int: int,
    user_ids: Set[int],
    date_from: Optional[str],
    date_to: Optional[str],
    progress_queue: Queue,
) -> Dict[str, Any]:
    """
    Обработка одного проекта в отдельном потоке.
    
    Каждый проект создаёт свою DB-сессию (thread-safe),
    проходит по своим юзерам последовательно с rate-limit,
    пишет прогресс в thread-safe queue.
    
    Возвращает локальные stats проекта.
    
    ГАРАНТИИ:
    - project_done ВСЕГДА отправляется в queue (в finally)
    - DB-сессия ВСЕГДА закрывается (в finally)
    - hourly_cache очищается при rollback (pending объекты evicted)
    - Ошибка одного юзера не останавливает остальных
    - Пустой ответ VK API не считается ошибкой (users_processed += 1)
    """
    from services.vk_api.token_manager import call_vk_api_for_group
    from database import SessionLocal

    local_stats = {
        "users_processed": 0,
        "users_errors": 0,
        "hourly_corrections": 0,
        "user_corrections": 0,
    }
    
    # Своя DB-сессия для потока (инициализируем None для безопасного finally)
    thread_db = None
    batch_counter = 0
    # FIX H1: считаем users_processed только ПОСЛЕ успешного коммита.
    # До коммита юзеры «pending» — при rollback их данные теряются.
    batch_users_pending = 0
    
    try:
        thread_db = SessionLocal()
        
        # Кэш hourly-записей на уровне проекта.
        # autoflush=False → db.query() НЕ видит pending db.add() объекты.
        # Кэш решает это: первый вызов ищет в БД и кэширует,
        # последующие — берут из кэша и обновляют in-memory.
        hourly_cache: Dict[str, MessageStatsHourly] = {}
        
        for idx, vk_user_id in enumerate(user_ids, 1):
            batch_counter += 1
            
            try:
                # Проактивный rate-limit ДЛЯ ЭТОГО ТОКЕНА
                time.sleep(API_CALL_DELAY)

                # Запрос истории из VK API
                response = call_vk_api_for_group(
                    method="messages.getHistory",
                    params={
                        "user_id": vk_user_id,
                        "count": 200,
                        "offset": 0,
                        "rev": 0,
                    },
                    group_id=group_id_int,
                    community_tokens=tokens,
                    project_id=pid,
                )

                # Защита: пустой/невалидный ответ VK API
                if not response or "items" not in response:
                    local_stats["users_errors"] += 1
                    progress_queue.put(("user_done", pid, 1))
                    continue

                items = response["items"]
                
                # Защита: пустой список сообщений — не ошибка, юзер обработан
                # (empty items не требует DB-записи → сразу в processed)
                if not items:
                    local_stats["users_processed"] += 1
                    progress_queue.put(("user_done", pid, 1))
                    continue

                # Агрегируем по часовым слотам
                hourly_agg, user_totals = aggregate_messages(items, group_id_int, date_from, date_to)

                # Защита: агрегация вернула пустые данные (все сообщения за пределами фильтра)
                if not hourly_agg and user_totals.get("incoming", 0) == 0 and user_totals.get("outgoing", 0) == 0:
                    local_stats["users_processed"] += 1
                    progress_queue.put(("user_done", pid, 1))
                    continue

                # Обновляем message_stats_hourly через MAX (с кэшем)
                corrections_h = reconcile_hourly(thread_db, pid, hourly_agg, hourly_cache)
                local_stats["hourly_corrections"] += corrections_h

                # Обновляем message_stats_user через MAX
                corrections_u = reconcile_user(thread_db, pid, vk_user_id, user_totals)
                local_stats["user_corrections"] += corrections_u

                # Юзер pending до коммита — НЕ считаем processed, пока коммит не прошёл
                batch_users_pending += 1

                # Батч-коммит каждые BATCH_SIZE юзеров
                if batch_counter >= BATCH_SIZE:
                    thread_db.commit()
                    # FIX H1: только после успешного коммита считаем юзеров обработанными
                    local_stats["users_processed"] += batch_users_pending
                    batch_users_pending = 0
                    batch_counter = 0

                # Отправляем прогресс в очередь
                progress_queue.put(("user_done", pid, 1))

            except Exception as e:
                if thread_db:
                    thread_db.rollback()
                # После rollback все pending-объекты из кэша expunged → очищаем кэш
                hourly_cache.clear()
                # FIX H1: при rollback ВСЕ pending юзеры батча теряются — считаем ошибками
                local_stats["users_errors"] += batch_users_pending + 1  # +1 = текущий юзер
                batch_users_pending = 0
                batch_counter = 0
                logger.error(f"Сверка: ошибка для проект {pid}, юзер {vk_user_id}: {e}")
                progress_queue.put(("user_done", pid, 1))

        # Финальный коммит остатков
        try:
            if thread_db:
                thread_db.commit()
                # FIX H2: считаем хвост батча обработанным только после успешного коммита
                local_stats["users_processed"] += batch_users_pending
                batch_users_pending = 0
        except Exception as e:
            if thread_db:
                thread_db.rollback()
            # FIX H2: при ошибке финального коммита — хвост батча потерян
            local_stats["users_errors"] += batch_users_pending
            batch_users_pending = 0
            logger.error(f"Сверка: ошибка финального коммита проекта {pid}: {e}")
        
        # Bulk-пересчёт счётчиков юзеров из нормализованной таблицы
        # Один SQL-запрос на весь проект вместо N пересчётов при каждом юзере
        try:
            if thread_db:
                _bulk_recount_hourly_users(thread_db, pid)
                thread_db.commit()
                logger.info(f"Сверка: bulk recount проекта {pid} завершён")
        except Exception as e:
            if thread_db:
                thread_db.rollback()
            logger.error(f"Сверка: ошибка bulk recount проекта {pid}: {e}")

    except Exception as e:
        logger.error(f"Сверка: критическая ошибка проекта {pid}: {e}")
    finally:
        if thread_db:
            thread_db.close()
            SessionLocal.remove()
        # Сигнал о завершении проекта — ВСЕГДА отправляем, даже при ошибке
        progress_queue.put(("project_done", pid, local_stats))

    return local_stats
