"""
ХАБ: CRUD-операции для статистики нагрузки сообщений.

Тонкий реэкспорт из подмодулей:
  - message_stats.write  — запись (upsert при каждом callback)
  - message_stats.read   — чтение (агрегация для дашборда)
  - message_stats.sync   — синхронизация из callback-логов
"""

# === ЗАПИСЬ ===
from crud.message_stats.write import record_message

# === ЧТЕНИЕ ===
from crud.message_stats.read import (
    get_global_summary,
    get_project_summary,
    get_projects_summary,
    get_hourly_chart,
    get_project_users,
    get_admin_stats,
    get_admin_dialogs,
)

# === СИНХРОНИЗАЦИЯ ===
from crud.message_stats.sync import sync_from_callback_logs, sync_from_callback_logs_with_progress

# === СВЕРКА (Reconciliation) ===
from crud.message_stats.reconcile import reconcile_from_vk, reconcile_from_vk_streaming

__all__ = [
    # Запись
    "record_message",
    # Чтение
    "get_global_summary",
    "get_project_summary",
    "get_projects_summary",
    "get_hourly_chart",
    "get_project_users",
    "get_admin_stats",
    "get_admin_dialogs",
    # Синхронизация
    "sync_from_callback_logs",
    "sync_from_callback_logs_with_progress",
    # Сверка
    "reconcile_from_vk",
    "reconcile_from_vk_streaming",
]
