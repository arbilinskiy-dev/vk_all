"""
СВЕРКА (Reconciliation) — ХАБ-ФАЙЛ.

Оркестрация параллельной сверки статистики с VK API.
Вся бизнес-логика вынесена в подмодули:
  - _aggregation.py   — агрегация сообщений по часовым слотам
  - _db_reconcile.py   — DB-обновление через MAX()-подход
  - _project_worker.py — обработка одного проекта в потоке

Этот файл содержит только:
  - reconcile_from_vk()           — синхронная обёртка
  - reconcile_from_vk_streaming() — SSE-генератор с ThreadPoolExecutor
"""

import time
import logging
from typing import Dict, List, Any, Set, Tuple, Optional, Generator
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from queue import Queue, Empty

from sqlalchemy.orm import Session

from models_library.message_stats import MessageStatsHourlyUsers
from models_library.projects import Project as ProjectModel
from services.messages.vk_client import get_community_tokens
from crud.message_stats._project_worker import process_single_project
from crud.message_stats._helpers import _hourly_users_date_filter

logger = logging.getLogger("crud.message_stats.reconcile")

# Максимальное количество параллельных потоков (= проектов одновременно)
# Каждый проект — свой токен, свой rate-limit, свой поток
MAX_PARALLEL_PROJECTS = 10


def reconcile_from_vk(
    db: Session,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Сверка статистики с реальными данными VK API (синхронный вариант).
    Обёртка над генератором — возвращает финальный результат.
    """
    result = None
    for event in reconcile_from_vk_streaming(db, date_from, date_to):
        if event["type"] == "complete" or event["type"] == "error":
            result = event["stats"]
    return result or {"details": "Сверка завершилась без результата."}


def reconcile_from_vk_streaming(
    db: Session,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Generator[Dict[str, Any], None, None]:
    """
    Сверка статистики с реальными данными VK API.
    ПАРАЛЛЕЛЬНАЯ обработка: каждый проект — в своём потоке.
    
    Генератор, который yield-ит события прогресса для SSE-стриминга.

    Типы событий:
    - {"type": "start", "total_dialogs": N, "total_projects": N}
    - {"type": "progress", "processed": N, "total": N, "current_project": str, "stats": {...}}
    - {"type": "complete", "stats": {...}}
    - {"type": "error", "message": str, "stats": {...}}

    Архитектура:
    1. Подготовка: собираем пары (project_id, user_ids) + токены (в главном потоке)
    2. Запускаем ThreadPoolExecutor с N потоками (N = кол-во проектов, max 10)
    3. Каждый поток: свой DB-session, свой rate-limit, свои VK API вызовы
    4. Прогресс собирается через Queue → yield SSE-событий в главном потоке
    """
    stats = {
        "projects_total": 0,
        "projects_processed": 0,
        "projects_skipped": 0,
        "users_total": 0,
        "users_processed": 0,
        "users_errors": 0,
        "hourly_corrections": 0,
        "user_corrections": 0,
        "details": "",
    }

    # --- 1. Определяем пары (project_id, vk_user_id) для сверки ---
    # FIX M3: prep-фаза обёрнута в try/except → при ошибке БД отдаём {"type": "error"}
    try:
        # Запрос к нормализованной таблице — входящие пользователи (text + payload)
        users_q = db.query(
            MessageStatsHourlyUsers.project_id,
            MessageStatsHourlyUsers.vk_user_id,
        ).distinct().filter(
            MessageStatsHourlyUsers.user_type.in_([1, 2]),
        )
        users_q = _hourly_users_date_filter(users_q, date_from, date_to)

        if date_from or date_to:
            logger.info(
                f"Сверка: запрос к нормализованной таблице "
                f"за {date_from}T00 — {date_to}T23"
            )
        else:
            logger.info(
                "Сверка (всё время): запрос к нормализованной таблице"
            )

        period_pairs: Dict[str, Set[int]] = defaultdict(set)
        for pid, uid in users_q.all():
            if isinstance(uid, int) and uid > 0:
                period_pairs[pid].add(uid)

        project_ids = list(period_pairs.keys())
        total_dialogs = sum(len(v) for v in period_pairs.values())
        total_unique_users = len(set(uid for uids in period_pairs.values() for uid in uids))
        logger.info(
            f"Сверка: {len(project_ids)} проектов, "
            f"{total_dialogs} диалогов (проект×юзер), "
            f"{total_unique_users} уникальных юзеров"
        )
        for pid in project_ids:
            logger.info(f"  Проект {pid}: {len(period_pairs[pid])} юзеров")

        stats["projects_total"] = len(project_ids)

        if not project_ids:
            stats["details"] = "Нет данных за выбранный период."
            yield {"type": "complete", "stats": stats}
            return

        # --- 2. Для каждого проекта получаем токен + список юзеров ---
        project_tasks: Dict[str, Tuple[List[str], int, Set[int]]] = {}
        for pid in project_ids:
            project = db.query(ProjectModel).filter(ProjectModel.id == pid).first()
            if not project:
                logger.warning(f"Сверка: проект {pid} не найден в БД — пропускаем")
                stats["projects_skipped"] += 1
                continue
            tokens = get_community_tokens(project)
            if not tokens:
                logger.warning(f"Сверка: у проекта {pid} нет токенов — пропускаем")
                stats["projects_skipped"] += 1
                continue
            try:
                group_id_int = abs(int(project.vkProjectId))
            except (ValueError, TypeError):
                logger.warning(f"Сверка: некорректный vkProjectId у проекта {pid}")
                stats["projects_skipped"] += 1
                continue

            user_ids = period_pairs.get(pid, set())

            if user_ids:
                project_tasks[pid] = (tokens, group_id_int, user_ids)
                stats["users_total"] += len(user_ids)

        if not project_tasks:
            stats["details"] = "Нет проектов с данными для сверки."
            yield {"type": "complete", "stats": stats}
            return

    except Exception as e:
        logger.error(f"Сверка: ошибка подготовки: {e}")
        stats["details"] = f"Ошибка подготовки сверки: {str(e)}"
        yield {"type": "error", "message": str(e), "stats": stats}
        return

    # --- Событие «старт» ---
    num_threads = min(len(project_tasks), MAX_PARALLEL_PROJECTS)
    logger.info(
        f"Сверка: запуск {num_threads} параллельных потоков "
        f"для {len(project_tasks)} проектов, {stats['users_total']} юзеров"
    )
    yield {
        "type": "start",
        "total_dialogs": stats["users_total"],
        "total_projects": len(project_tasks),
    }

    # --- 3. Параллельная обработка через ThreadPoolExecutor ---
    progress_queue: Queue = Queue()
    global_processed = 0  # Общий счётчик обработанных юзеров
    last_progress_time = time.time()
    PROGRESS_INTERVAL = 1.0  # Отправляем прогресс не чаще раза в секунду

    try:
        with ThreadPoolExecutor(max_workers=num_threads) as executor:
            # Запускаем все проекты параллельно
            futures = {}
            for pid, (tokens, group_id_int, user_ids) in project_tasks.items():
                future = executor.submit(
                    process_single_project,
                    pid, tokens, group_id_int, user_ids,
                    date_from, date_to, progress_queue,
                )
                futures[future] = pid
                logger.info(f"Сверка: запущен поток для проекта {pid} ({len(user_ids)} юзеров)")

            # Собираем прогресс из очереди, пока потоки работают
            projects_completed = 0
            total_projects_to_complete = len(project_tasks)
            
            while projects_completed < total_projects_to_complete:
                try:
                    msg = progress_queue.get(timeout=0.5)
                except Empty:
                    # Таймаут — проверяем, не упали ли потоки
                    all_done = all(f.done() for f in futures)
                    if all_done:
                        # Все потоки завершились, но не все project_done получены —
                        # дочитываем остатки из очереди
                        while not progress_queue.empty():
                            try:
                                msg = progress_queue.get_nowait()
                                if msg[0] == "project_done":
                                    _, p, ls = msg
                                    projects_completed += 1
                                    stats["projects_processed"] += 1
                                    stats["users_processed"] += ls["users_processed"]
                                    stats["users_errors"] += ls["users_errors"]
                                    stats["hourly_corrections"] += ls["hourly_corrections"]
                                    stats["user_corrections"] += ls["user_corrections"]
                                elif msg[0] == "user_done":
                                    global_processed += msg[2]
                            except Empty:
                                break
                        # Если всё ещё не все — значит потоки упали без project_done
                        if projects_completed < total_projects_to_complete:
                            missing = total_projects_to_complete - projects_completed
                            logger.error(f"Сверка: {missing} потоков завершились без project_done")
                            stats["projects_skipped"] += missing
                            break
                    continue

                msg_type = msg[0]
                
                if msg_type == "user_done":
                    _, pid, count = msg
                    global_processed += count
                    
                    # Отправляем SSE-прогресс с throttling
                    now = time.time()
                    if now - last_progress_time >= PROGRESS_INTERVAL:
                        last_progress_time = now
                        yield {
                            "type": "progress",
                            "processed": global_processed,
                            "total": stats["users_total"],
                            "current_project": pid,
                            "stats": {**stats, "users_processed": global_processed},
                        }
                        
                elif msg_type == "project_done":
                    _, pid, local_stats = msg
                    projects_completed += 1
                    stats["projects_processed"] += 1
                    stats["users_processed"] += local_stats["users_processed"]
                    stats["users_errors"] += local_stats["users_errors"]
                    stats["hourly_corrections"] += local_stats["hourly_corrections"]
                    stats["user_corrections"] += local_stats["user_corrections"]
                    logger.info(
                        f"Сверка: проект {pid} завершён — "
                        f"{local_stats['users_processed']} юзеров, "
                        f"{local_stats['hourly_corrections']} hourly корр., "
                        f"{local_stats['user_corrections']} user корр. "
                        f"[{projects_completed}/{total_projects_to_complete}]"
                    )

        # Финальный progress на 100% перед событием complete
        if stats["users_total"] > 0:
            yield {
                "type": "progress",
                "processed": stats["users_total"],
                "total": stats["users_total"],
                "current_project": "",
                "stats": stats,
            }

    except Exception as e:
        logger.error(f"Сверка: критическая ошибка параллельной обработки: {e}")
        stats["details"] = f"Критическая ошибка сверки: {str(e)}"
        yield {"type": "error", "message": str(e), "stats": stats}
        return

    # --- Итоговая строка ---
    stats["details"] = (
        f"Сверка завершена: {stats['projects_processed']}/{stats['projects_total']} проектов, "
        f"{stats['users_processed']}/{stats['users_total']} юзеров. "
        f"Корректировок: {stats['hourly_corrections']} hourly, {stats['user_corrections']} user. "
        f"Пропущено проектов: {stats['projects_skipped']}, ошибок: {stats['users_errors']}. "
        f"(параллельно, {num_threads} потоков)"
    )
    logger.info(stats["details"])
    yield {"type": "complete", "stats": stats}
