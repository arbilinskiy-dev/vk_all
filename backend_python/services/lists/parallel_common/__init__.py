"""
Общие структуры данных и утилиты для параллельной обработки.

Используется модулями:
- parallel_subscribers/ — для обработки подписчиков
- parallel_posts/ — для обработки постов
"""

from .models import ProjectStatus, ProjectProgress, TokenState
from .state import BulkRefreshState
from .utils import (
    get_all_tokens_with_names,
    check_admin_rights_batch,
    distribute_projects_to_state
)

__all__ = [
    'ProjectStatus',
    'ProjectProgress',
    'TokenState',
    'BulkRefreshState',
    'get_all_tokens_with_names',
    'check_admin_rights_batch',
    'distribute_projects_to_state'
]
