"""
Главный модуль оркестрации параллельной обработки подписчиков.

Координирует работу воркеров, распределяет проекты по токенам,
обрабатывает fallback при отключении токенов.
"""

import time
import json
import logging
import concurrent.futures
from datetime import datetime

import crud
from database import SessionLocal
import services.task_monitor as task_monitor
from services.lists.parallel_common import (
    BulkRefreshState,
    ProjectStatus,
    get_all_tokens_with_names,
    check_admin_rights_batch,
    distribute_projects_to_state,
)
from utils.db_diagnostics import log_pool_status, OperationTimer

from .progress import update_task_progress
from .worker import token_worker

logger = logging.getLogger(__name__)


def run_parallel_subscribers_refresh_v2(task_id: str, user_token: str):
    """
    Главная функция параллельного обновления подписчиков с fallback.
    
    Использует Split Session паттерн — получаем данные из БД
    и СРАЗУ закрываем сессию, чтобы не держать соединение часами.
    
    Args:
        task_id: ID задачи для отслеживания прогресса
        user_token: Токен пользователя (для совместимости, не используется напрямую)
    """
    task_start = datetime.now()
    logger.info(f"[ORCHESTRATOR_START] Task: {task_id} | Time: {task_start.isoformat()}")
    log_pool_status("ORCHESTRATOR_START")
    
    # === ЭТАП 1: ПОЛУЧЕНИЕ ДАННЫХ (короткая сессия) ===
    with OperationTimer("load_initial_data", task_id):
        projects_list, tokens = _load_initial_data()
    
    log_pool_status("AFTER_LOAD_DATA")
    
    # === ЭТАП 2: ВАЛИДАЦИЯ ===
    if not _validate_data(task_id, projects_list, tokens):
        return
    
    logger.info(f"[ORCHESTRATOR] Tokens: {len(tokens)} | Projects: {len(projects_list)}")
    print(f"PARALLEL_BULK: Найдено {len(tokens)} токенов, {len(projects_list)} проектов")
    
    # === ЭТАП 3: ПРОВЕРКА АДМИНСКИХ ПРАВ ===
    with OperationTimer("check_admin_rights", f"{len(tokens)} tokens, {len(projects_list)} groups"):
        group_ids = [p['vk_id'] for p in projects_list]
        admin_map = check_admin_rights_batch(tokens, group_ids)
    
    log_pool_status("AFTER_ADMIN_CHECK")
    
    # Пауза после проверки админских прав
    print("PARALLEL_BULK: Пауза 3 секунды для восстановления API лимитов...")
    time.sleep(3)
    
    # === ЭТАП 4: ПОДГОТОВКА СОСТОЯНИЯ ===
    state = BulkRefreshState(task_id, projects_list, tokens, admin_map)
    distribute_projects_to_state(state)
    _log_distribution(state)
    update_task_progress(state, force=True)
    
    # === ЭТАП 5: ПАРАЛЛЕЛЬНАЯ ОБРАБОТКА ===
    try:
        _run_parallel_workers(state)
        _finalize_task(state, task_id)
    except Exception as e:
        print(f"PARALLEL_BULK CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        task_monitor.update_task(task_id, "error", error=str(e))
        task_monitor.clear_cancellation(task_id)


def _load_initial_data():
    """
    Загружает начальные данные из БД (проекты и токены).
    
    Использует короткую сессию — закрываем сразу после чтения.
    
    Returns:
        Tuple[projects_list, tokens]
    """
    projects_list = []
    tokens = []
    
    db = SessionLocal()
    try:
        # Получаем все проекты
        projects_db = crud.get_all_projects(db)
        projects_list = [
            {'id': p.id, 'name': p.name, 'vk_id': str(p.vkProjectId)}
            for p in projects_db if p.vkProjectId is not None
        ]
        
        # Получаем все токены
        tokens = get_all_tokens_with_names(db)
    finally:
        db.close()  # ЗАКРЫВАЕМ СРАЗУ после получения данных!
    
    return projects_list, tokens


def _validate_data(task_id: str, projects_list: list, tokens: list) -> bool:
    """
    Проверяет валидность данных перед обработкой.
    
    Returns:
        True если данные валидны, False если нужно завершить задачу
    """
    if len(projects_list) == 0:
        task_monitor.update_task(task_id, "done", message="Нет проектов для обработки")
        return False
    
    if not tokens:
        task_monitor.update_task(task_id, "error", error="Нет доступных токенов")
        return False
    
    return True


def _log_distribution(state: BulkRefreshState):
    """Логирует распределение проектов по токенам."""
    print("PARALLEL_BULK: Распределение проектов:")
    for ts in state.tokens_state.values():
        admin_count = sum(
            1 for pid in ts.assigned_projects 
            if state.projects_progress[pid].is_admin
        )
        print(f"   -> {ts.name}: {len(ts.assigned_projects)} проектов (админ в {admin_count})")


def _run_parallel_workers(state: BulkRefreshState):
    """
    Запускает параллельную обработку с fallback.
    
    При отключении токенов из-за flood control, перераспределяет
    осиротевшие проекты между оставшимися активными токенами.
    """
    max_rounds = 3  # Максимум раундов перераспределения
    
    logger.info(f"[PARALLEL_WORKERS_START] Task: {state.task_id} | max_rounds: {max_rounds}")
    log_pool_status("PARALLEL_WORKERS_START")
    
    for round_num in range(max_rounds):
        round_start = datetime.now()
        active_tokens = state.get_active_tokens()
        if not active_tokens:
            logger.warning("[PARALLEL_WORKERS] Нет активных токенов, завершаем!")
            print("PARALLEL_BULK: Нет активных токенов, завершаем!")
            break
        
        logger.info(f"[ROUND_{round_num + 1}_START] Active tokens: {len(active_tokens)}")
        print(f"\nPARALLEL_BULK: Раунд {round_num + 1}, активных токенов: {len(active_tokens)}")
        
        # Ограничиваем количество параллельных воркеров
        # Причина: Каждый воркер создаёт свои DB сессии
        MAX_PARALLEL_WORKERS = 3
        num_workers = min(len(active_tokens), MAX_PARALLEL_WORKERS)
        
        logger.info(f"[THREAD_POOL] Creating ThreadPoolExecutor with {num_workers} workers")
        log_pool_status(f"BEFORE_EXECUTOR_ROUND_{round_num + 1}")
        
        # Запускаем воркеры
        with concurrent.futures.ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = {}
            for idx, ts in enumerate(active_tokens):
                # Стаггеред старт — интервал между запусками воркеров
                if idx > 0:
                    time.sleep(8.0)
                logger.info(f"[WORKER_SUBMIT] Token: {ts.name} | Index: {idx}")
                print(f"PARALLEL_BULK: Запуск воркера {ts.name}...")
                future = executor.submit(token_worker, state, ts.token, ts.name)
                futures[future] = ts.name
            
            # Ждём завершения
            for future in concurrent.futures.as_completed(futures):
                name = futures[future]
                try:
                    future.result()
                    logger.info(f"[WORKER_DONE] Token: {name} | Success")
                except Exception as e:
                    logger.error(f"[WORKER_CRASHED] Token: {name} | Error: {e}", exc_info=True)
                    print(f"PARALLEL_BULK: Воркер '{name}' упал: {e}")
        
        round_duration = (datetime.now() - round_start).total_seconds()
        logger.info(f"[ROUND_{round_num + 1}_END] Duration: {round_duration:.1f}s")
        log_pool_status(f"AFTER_EXECUTOR_ROUND_{round_num + 1}")
        
        # Проверяем осиротевшие проекты
        orphaned = state.pop_orphaned_projects()
        if not orphaned:
            logger.info("[PARALLEL_WORKERS] Нет осиротевших проектов, завершаем.")
            print("PARALLEL_BULK: Нет осиротевших проектов, завершаем.")
            break
        
        logger.info(f"[REDISTRIBUTE] Orphaned projects: {len(orphaned)}")
        print(f"PARALLEL_BULK: Перераспределяем {len(orphaned)} осиротевших проектов...")
        
        # Очищаем assigned_projects у активных токенов
        for ts in state.get_active_tokens():
            ts.assigned_projects = []
        
        # Перераспределяем
        distribute_projects_to_state(state, orphaned)


def _finalize_task(state: BulkRefreshState, task_id: str):
    """Финализирует задачу — обновляет статус и логирует результат."""
    logger.info(f"[FINALIZE_START] Task: {task_id}")
    log_pool_status("FINALIZE_START")
    
    summary = state.get_summary()
    
    logger.info(f"[SUMMARY] done={summary['done']} | total={summary['total']} | errors={summary['errors']}")
    
    # Формируем финальное сообщение
    final_message = f"Готово: {summary['done']}/{summary['total']}"
    if summary['errors'] > 0:
        final_message += f", ошибок: {summary['errors']}"
    if summary['disabled_tokens']:
        final_message += f" | Отключены: {', '.join(summary['disabled_tokens'])}"
    
    # Собираем ошибки для JSON
    error_details = []
    for pp in state.projects_progress.values():
        if pp.status == ProjectStatus.ERROR:
            error_details.append({
                'project_id': pp.project_id,
                'project_name': pp.project_name,
                'error': pp.error
            })
            logger.warning(f"[PROJECT_ERROR] ID: {pp.project_id} | Name: {pp.project_name} | Error: {pp.error}")
    
    error_json = json.dumps({'errors': error_details}, ensure_ascii=False) if error_details else None
    
    task_monitor.update_task(
        task_id, "done",
        loaded=summary['done'],
        total=summary['total'],
        message=final_message,
        sub_message=state.get_progress_json(),  # Полный JSON только в конце
        error=error_json or ""
    )
    task_monitor.clear_cancellation(task_id)
    
    logger.info(f"[FINALIZE_END] Task: {task_id} | {final_message}")
    log_pool_status("FINALIZE_END")
    
    print(f"\nPARALLEL_BULK: Завершено! {final_message}")
