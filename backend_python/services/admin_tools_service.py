"""
Админ-инструменты — ХАБ-МОДУЛЬ.

Реэкспорт всех функций для обратной совместимости.
Логика вынесена в:
  - admin_tools_crud.py     — CRUD/DB операции
  - admin_tools_sync.py     — синхронизация групп/админов через VK API
  - admin_tools_bulk.py     — фоновые задачи массового обновления
  - admin_tools_promote.py  — массовое назначение администраторов
"""

# CRUD / DB операции
from services.admin_tools_crud import (
    get_all_administered_groups,
    _process_and_save_admins,
)

# Синхронизация через VK API
from services.admin_tools_sync import (
    sync_administered_groups,
    sync_group_admins,
)

# Фоновые задачи массового обновления
from services.admin_tools_bulk import (
    refresh_all_group_admins_task,
    refresh_all_subscribers_task,
    refresh_all_posts_task,
)

# Массовое назначение администраторов
from services.admin_tools_promote import (
    promote_to_admins,
    _find_admin_token_for_group,
)

__all__ = [
    # CRUD
    "get_all_administered_groups",
    "_process_and_save_admins",
    # Синхронизация
    "sync_administered_groups",
    "sync_group_admins",
    # Фоновые задачи
    "refresh_all_group_admins_task",
    "refresh_all_subscribers_task",
    "refresh_all_posts_task",
    # Назначение админов
    "promote_to_admins",
    "_find_admin_token_for_group",
]
