"""
Модуль воркера для обработки подписчиков одним токеном.

Воркер берёт проекты из очереди и обрабатывает их последовательно.
При flood control отключает токен и завершается.
"""

import time
import logging
from datetime import datetime

import services.task_monitor as task_monitor
from services.lists.parallel_common import BulkRefreshState, ProjectStatus
from utils.db_diagnostics import log_pool_status, OperationTimer

from .processor import process_single_project

logger = logging.getLogger(__name__)


def token_worker(
    state: BulkRefreshState, 
    token: str, 
    token_name: str, 
    warmup: int = 3
):
    """
    Воркер для обработки подписчиков одним токеном.
    
    Последовательно обрабатывает все назначенные проекты.
    При получении flood control (Error 9) отключает токен и завершается,
    позволяя другим воркерам подхватить оставшиеся проекты.
    
    Args:
        state: Общее состояние задачи
        token: Токен VK
        token_name: Имя токена для логов
        warmup: Количество первых проектов с увеличенной паузой
    """
    ts = state.tokens_state.get(token)
    if not ts:
        return
    
    worker_start = datetime.now()
    project_idx = 0
    
    # === ДИАГНОСТИКА: Старт воркера ===
    logger.info(f"[WORKER_START] {token_name} | Time: {worker_start.isoformat()}")
    log_pool_status(f"WORKER_START:{token_name}")
    
    try:
        while ts.is_active:
            # Берём следующий необработанный проект
            with state.lock:
                pending = [
                    pid for pid in ts.assigned_projects 
                    if state.projects_progress[pid].status in [ProjectStatus.PENDING, ProjectStatus.REASSIGNED]
                ]
                if not pending:
                    break
                project_id = pending[0]
            
            # Проверяем отмену задачи
            if task_monitor.is_task_cancelled(state.task_id):
                logger.info(f"[WORKER_CANCELLED] {token_name} | Task cancelled by user")
                break
            
            # === ДИАГНОСТИКА: Начало обработки проекта ===
            project_name = state.projects_progress[project_id].project_name if project_id in state.projects_progress else project_id
            logger.info(f"[PROJECT_START] {token_name} | Project: {project_name} | Index: {project_idx}")
            log_pool_status(f"BEFORE_PROJECT:{project_name}")
            
            # Обрабатываем проект с замером времени
            community_tokens = state.community_tokens_map.get(project_id, [])
            with OperationTimer(f"process_project", f"{token_name}:{project_name}") as timer:
                success = process_single_project(state, project_id, token, token_name, community_tokens)
            
            if not success:
                # Flood control — отключаем токен
                logger.warning(f"[FLOOD_CONTROL] {token_name} | Disabling token after {project_idx} projects")
                log_pool_status(f"FLOOD_CONTROL:{token_name}")
                state.disable_token(token, "flood_control")
                break
            
            ts.processed_count += 1
            project_idx += 1
            
            # === ДИАГНОСТИКА: Проект обработан ===
            logger.info(f"[PROJECT_DONE] {token_name} | Project: {project_name} | Duration: {timer.duration:.2f}s | Total: {project_idx}")
            
            # Периодически логируем состояние пула (каждые 5 проектов)
            if project_idx % 5 == 0:
                log_pool_status(f"PERIODIC:{token_name}:after_{project_idx}_projects")
            
            # Пауза между проектами
            # Первые warmup проектов — увеличенная пауза для "прогрева"
            if project_idx < warmup:
                time.sleep(3.0)
            else:
                time.sleep(1.5)
    
    except Exception as e:
        # === ДИАГНОСТИКА: Критическая ошибка воркера ===
        logger.critical(
            f"[WORKER_CRASH] {token_name} | "
            f"Error: {e} | "
            f"Projects processed: {project_idx}"
        )
        log_pool_status(f"WORKER_CRASH:{token_name}")
        import traceback
        logger.error(f"[WORKER_CRASH_TRACE] {token_name} | {traceback.format_exc()}")
        raise
    
    finally:
        worker_duration = (datetime.now() - worker_start).total_seconds()
        logger.info(
            f"[WORKER_END] {token_name} | "
            f"Duration: {worker_duration:.2f}s | "
            f"Projects: {project_idx}"
        )
        log_pool_status(f"WORKER_END:{token_name}")
