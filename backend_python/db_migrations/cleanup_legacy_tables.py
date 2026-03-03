"""
Финальная очистка: DROP устаревших денормализованных таблиц.

ВАЖНО: Этот модуль ДОЛЖЕН вызываться ПОСЛЕ миграций данных:
  - vk_profiles.migrate()      → Фаза 1 (профили)
  - members.migrate()          → Фаза 2 (подписчики, история)
  - interactions.migrate()     → Фаза 3 (лайки, комменты, репосты)
  - dialogs_authors.migrate()  → Фаза 4 (рассылка, авторы)

Только после того, как все данные скопированы в новые таблицы,
старые таблицы безопасно удаляются.

Маппинг:
  system_list_subscribers      → project_members + vk_profiles
  system_list_history_join     → member_events (type='join') + vk_profiles
  system_list_history_leave    → member_events (type='leave') + vk_profiles
  system_list_likes            → post_interactions (type='like') + vk_profiles
  system_list_comments         → post_interactions (type='comment') + vk_profiles
  system_list_reposts          → post_interactions (type='repost') + vk_profiles
  system_list_mailing          → project_dialogs + vk_profiles
  system_list_authors          → project_authors + vk_profiles
"""

from sqlalchemy import Engine, inspect, text


# Список старых таблиц для удаления
OLD_TABLES = [
    'system_list_subscribers',
    'system_list_history_join',
    'system_list_history_leave',
    'system_list_likes',
    'system_list_comments',
    'system_list_reposts',
    'system_list_mailing',
    'system_list_authors',
]

# Новые таблицы, которые должны содержать данные перед DROP
# Формат: (table_name, min_expected_description)
NEW_TABLES_CHECK = [
    'vk_profiles',
    'project_members',
    'member_events',
    'post_interactions',
    'project_dialogs',
    'project_authors',
]


# Минимальные пороги для безопасного удаления старых таблиц.
# Если в новых таблицах меньше данных чем MIN_RATIO от старых — cleanup НЕ запускается.
MIN_RATIO = 0.5  # новые таблицы должны содержать ≥50% от старых

# Маппинг: новая таблица → [старые таблицы-источники для сравнения]
NEW_TO_OLD_MAP = {
    'vk_profiles': ['system_list_subscribers'],
    'project_members': ['system_list_subscribers'],
    'member_events': ['system_list_history_join', 'system_list_history_leave'],
    'post_interactions': ['system_list_likes', 'system_list_comments', 'system_list_reposts'],
    'project_dialogs': ['system_list_mailing'],
    'project_authors': ['system_list_authors'],
}


def migrate(engine: Engine):
    """Удаляет старые денормализованные таблицы ПОСЛЕ миграции данных.
    
    БЕЗОПАСНОСТЬ: Проверяет что объём данных в новых таблицах составляет
    ≥50% от объёма в старых (защита от повторения потери данных).
    """
    inspector = inspect(engine)
    is_postgres = 'postgresql' in str(engine.url)

    # ── Предпроверка: убедиться, что новые таблицы существуют и заполнены ──
    for new_table in NEW_TABLES_CHECK:
        if not inspector.has_table(new_table):
            print(f"[CLEANUP] ABORT: новая таблица '{new_table}' не найдена. "
                  f"Миграция данных ещё не выполнена. Старые таблицы НЕ удаляются.")
            return

    # ── Проверяем ОБЪЁМ данных (не просто count > 0) ──
    with engine.connect() as conn:
        for new_table in NEW_TABLES_CHECK:
            result = conn.execute(text(f'SELECT COUNT(*) FROM "{new_table}"'))
            new_count = result.scalar()
            if new_count == 0:
                print(f"[CLEANUP] ABORT: таблица '{new_table}' пуста (0 записей). "
                      f"Миграция данных ещё не завершена. Старые таблицы НЕ удаляются.")
                return
            
            # Сверяем с объёмом старых таблиц-источников
            old_tables = NEW_TO_OLD_MAP.get(new_table, [])
            old_total = 0
            for old_table in old_tables:
                if inspector.has_table(old_table):
                    r = conn.execute(text(f'SELECT COUNT(*) FROM "{old_table}"'))
                    old_total += r.scalar()
            
            if old_total > 0:
                ratio = new_count / old_total
                if ratio < MIN_RATIO:
                    print(f"[CLEANUP] ABORT: '{new_table}' содержит {new_count:,} записей, "
                          f"но старые таблицы содержат {old_total:,}. "
                          f"Ratio={ratio:.2%} < {MIN_RATIO:.0%}. Миграция неполная!")
                    return
                print(f"[CLEANUP] ✓ {new_table}: {new_count:,} записей (ratio={ratio:.2%} от старых {old_total:,})")
            else:
                # Старые таблицы уже удалены или пусты — проверяем только count > 0
                print(f"[CLEANUP] ✓ {new_table}: {new_count:,} записей (старые таблицы уже удалены)")

    # ── DROP старых таблиц ────────────────────────────────────────
    dropped = 0
    for table_name in OLD_TABLES:
        if inspector.has_table(table_name):
            print(f"[CLEANUP] Dropping legacy table '{table_name}'...")
            with engine.begin() as conn:
                if is_postgres:
                    conn.execute(text(f'DROP TABLE IF EXISTS "{table_name}" CASCADE'))
                else:
                    conn.execute(text(f'DROP TABLE IF EXISTS "{table_name}"'))
            print(f"[CLEANUP] Table '{table_name}' dropped successfully.")
            dropped += 1

    if dropped > 0:
        print(f"[CLEANUP] Удалено {dropped} устаревших таблиц.")
    else:
        print("[CLEANUP] Старые таблицы уже были удалены ранее.")
