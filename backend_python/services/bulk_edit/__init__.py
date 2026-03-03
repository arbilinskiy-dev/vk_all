# Сервисы массового редактирования постов
# Этот файл является хабом для всех функций bulk_edit

from .search_service import search_posts
from .execution_service import execute_bulk_edit_task
from .async_execution_service import (
    execute_bulk_edit_async,
    execute_bulk_edit_task_async
)

__all__ = [
    'search_posts',
    'execute_bulk_edit_task',           # Синхронная версия (legacy)
    'execute_bulk_edit_async',          # Асинхронная версия с воркерами
    'execute_bulk_edit_task_async',     # Async обёртка для BackgroundTasks
]
