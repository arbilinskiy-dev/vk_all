
from sqlalchemy import Engine
from db_migrations import (
    projects,
    tags,
    media,
    posts,
    settings,
    market,
    lists,
    system,
    ai_tokens,
    automations,
    automations_general,
    vk_users,
    vk_profiles,
    members,
    interactions,
    dialogs_authors,
    messages,
    message_stats,
    message_templates,
    promo_lists,
    auth as auth_migration,
    cleanup_legacy_tables
)

def run_migrations(engine: Engine):
    """
    Главная функция для запуска всех необходимых миграций.
    Вызывает модульные миграции в строгом порядке.
    """
    print("Running database migrations...")
    
    projects.migrate(engine)
    tags.migrate(engine)
    media.migrate(engine)
    posts.migrate(engine)
    settings.migrate(engine)
    market.migrate(engine)
    lists.migrate(engine)
    system.migrate(engine)
    ai_tokens.migrate(engine)
    automations.migrate(engine)
    automations_general.migrate(engine)
    vk_users.migrate()
    vk_profiles.migrate(engine)
    members.migrate(engine)
    interactions.migrate(engine)
    dialogs_authors.migrate(engine)
    messages.migrate(engine)
    message_stats.migrate(engine)
    message_templates.migrate(engine)
    promo_lists.migrate(engine)
    auth_migration.migrate(engine)

    # ФИНАЛЬНЫЙ ШАГ: удаление старых таблиц (только после миграций данных)
    # ВНИМАНИЕ: cleanup теперь проверяет MIN_RATIO (≥50% данных) перед удалением
    cleanup_legacy_tables.migrate(engine)

    print("Migrations complete.")
