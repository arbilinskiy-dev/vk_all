"""
Модуль обновления прогресса задачи для подписчиков.

Содержит функции для тротлинга и обновления состояния в task_monitor.
"""

import time
import services.task_monitor as task_monitor
from services.lists.parallel_common import BulkRefreshState


def update_task_progress(state: BulkRefreshState, force: bool = False):
    """
    Обновляет прогресс в task_monitor с тротлингом.
    
    Для снижения нагрузки на БД, обновления происходят не чаще
    чем раз в _progress_update_interval секунд (по умолчанию 5).
    
    Args:
        state: Состояние задачи BulkRefreshState
        force: Если True, обновляет независимо от интервала (для важных событий)
    """
    current_time = time.time()
    
    # Проверяем тротлинг (если не принудительное обновление)
    if not force:
        with state.lock:
            if current_time - state._last_progress_update < state._progress_update_interval:
                return  # Слишком рано для обновления
            state._last_progress_update = current_time
    else:
        with state.lock:
            state._last_progress_update = current_time
    
    summary = state.get_summary()
    
    # Формируем компактное сообщение
    message = f"Обработано: {summary['done']}/{summary['total']}"
    if summary['errors'] > 0:
        message += f", ошибок: {summary['errors']}"
    if summary['processing'] > 0:
        message += f", в процессе: {summary['processing']}"
    if summary['disabled_tokens']:
        message += f" | Отключены: {', '.join(summary['disabled_tokens'])}"
    
    # Всегда отправляем полный JSON с проектами для UI (фронтенд ожидает project_id)
    task_monitor.update_task(
        state.task_id, "processing",
        loaded=summary['done'],
        total=summary['total'],
        message=message,
        sub_message=state.get_progress_json()
    )
