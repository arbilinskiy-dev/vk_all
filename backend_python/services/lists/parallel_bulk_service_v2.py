"""
Сервис параллельной обработки проектов с умным распределением токенов.

ФАЙЛ-ХАБ: Логика вынесена в модули parallel_common/ и parallel_subscribers/.
Этот файл сохранён для обратной совместимости импортов.

Структура модулей:
- parallel_common/models.py    — ProjectStatus, ProjectProgress, TokenState
- parallel_common/state.py     — BulkRefreshState
- parallel_common/utils.py     — get_all_tokens_with_names, check_admin_rights_batch, distribute_projects_to_state
- parallel_subscribers/processor.py  — обработка одного проекта
- parallel_subscribers/progress.py   — обновление прогресса задачи
- parallel_subscribers/worker.py     — воркер для токена
- parallel_subscribers/orchestrator.py — главная функция координации
"""

# Реэкспорт общих структур (используются в parallel_posts и других модулях)
from .parallel_common import (
    ProjectStatus,
    ProjectProgress,
    TokenState,
    BulkRefreshState,
    get_all_tokens_with_names,
    check_admin_rights_batch,
    distribute_projects_to_state
)

# Реэкспорт главной функции
from .parallel_subscribers import run_parallel_subscribers_refresh_v2

__all__ = [
    # Модели
    'ProjectStatus',
    'ProjectProgress',
    'TokenState',
    'BulkRefreshState',
    # Утилиты
    'get_all_tokens_with_names',
    'check_admin_rights_batch',
    'distribute_projects_to_state',
    # Главная функция
    'run_parallel_subscribers_refresh_v2'
]
