"""
ХАБ: CRUD-операции для подписок/отписок на сообщения.

Тонкий реэкспорт из подмодулей:
  - message_subscriptions.write  — запись (insert из callback)
  - message_subscriptions.read   — чтение (агрегация для дашборда)
"""

# === ЗАПИСЬ ===
from crud.message_subscriptions.write import record_subscription

# === ЧТЕНИЕ ===
from crud.message_subscriptions.read import (
    get_subscriptions_summary,
    get_subscriptions_chart,
    get_subscriptions_by_projects,
    get_subscriptions_events,
    get_subscriptions_project_users,
)

__all__ = [
    # Запись
    "record_subscription",
    # Чтение
    "get_subscriptions_summary",
    "get_subscriptions_chart",
    "get_subscriptions_by_projects",
    "get_subscriptions_events",
    "get_subscriptions_project_users",
]
