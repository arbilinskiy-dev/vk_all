"""
Модуль воркера для обработки постов одним токеном.

Воркер берёт проекты из очереди и обрабатывает их последовательно.
При flood control отключает токен и завершается.
"""

import time
import services.task_monitor as task_monitor
from services.lists.parallel_common import BulkRefreshState, ProjectStatus

from .processor import process_single_project_posts


def token_worker_posts(
    state: BulkRefreshState, 
    token: str, 
    token_name: str, 
    limit: int = 1000, 
    mode: str = 'limit', 
    warmup: int = 3
):
    """
    Воркер для обработки постов одним токеном.
    
    Последовательно обрабатывает все назначенные проекты.
    При получении flood control (Error 9) отключает токен и завершается,
    позволяя другим воркерам подхватить оставшиеся проекты.
    
    Args:
        state: Общее состояние задачи
        token: Токен VK
        token_name: Имя токена для логов
        limit: Лимит постов на проект
        mode: 'limit' или 'actual'
        warmup: Количество первых проектов с увеличенной паузой
    """
    ts = state.tokens_state.get(token)
    if not ts:
        return
    
    project_idx = 0
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
            break
        
        # Обрабатываем проект
        success = process_single_project_posts(state, project_id, token, token_name, limit, mode)
        
        if not success:
            # Flood control — отключаем токен
            state.disable_token(token, "flood_control")
            break
        
        ts.processed_count += 1
        project_idx += 1
        
        # Пауза между проектами
        # Первые warmup проектов — увеличенная пауза для "прогрева"
        if project_idx < warmup:
            time.sleep(2.0)
        else:
            time.sleep(1.0)
    
    print(f"PARALLEL_BULK_POSTS: Воркер '{token_name}' завершён. Обработано: {ts.processed_count}")
