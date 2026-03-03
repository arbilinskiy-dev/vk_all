"""
ЧТЕНИЕ: Агрегация статистики для дашборда мониторинга.
Все функции — read-only, не модифицируют данные.

Хаб-модуль: реэкспортирует функции из подмодулей.
Логика вынесена в:
  _helpers.py  — вспомогательные функции фильтрации
  _summary.py  — сводки (глобальная, по проекту, по проектам)
  _charts.py   — данные для графиков пиковых нагрузок
  _users.py    — детализация по пользователям проекта
  _admin.py    — статистика по администраторам
"""

# --- Хелперы (используются внешними модулями: reconcile, verify_sync) ---
from crud.message_stats._helpers import (  # noqa: F401
    _hourly_date_filter,
    _collect_unique_users_from_json,
)

# --- Сводки ---
from crud.message_stats._summary import (  # noqa: F401
    get_global_summary,
    get_project_summary,
    get_projects_summary,
)

# --- Графики ---
from crud.message_stats._charts import get_hourly_chart  # noqa: F401

# --- Пользователи ---
from crud.message_stats._users import get_project_users  # noqa: F401

# --- Администраторы ---
from crud.message_stats._admin import (  # noqa: F401
    get_admin_stats,
    get_admin_dialogs,
)

__all__ = [
    # Хелперы
    "_hourly_date_filter",
    "_collect_unique_users_from_json",
    # Сводки
    "get_global_summary",
    "get_project_summary",
    "get_projects_summary",
    # Графики
    "get_hourly_chart",
    # Пользователи
    "get_project_users",
    # Администраторы
    "get_admin_stats",
    "get_admin_dialogs",
]
