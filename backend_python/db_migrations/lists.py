
from sqlalchemy import Engine, inspect, text
from .utils import check_and_add_column
from models import (
    ProjectListMeta,
    SystemListPost,
)

def migrate(engine: Engine):
    """Миграции для системных списков.
    
    ВНИМАНИЕ: Старые таблицы (system_list_subscribers, system_list_history_join/leave,
    system_list_likes/comments/reposts, system_list_mailing, system_list_authors)
    были удалены в рамках миграции на нормализованную архитектуру.
    Данные мигрированы в vk_profiles + project_members/member_events/post_interactions/
    project_dialogs/project_authors.
    """
    inspector = inspect(engine)

    # Миграция 20: Создать основные таблицы списков (только активные)
    if not inspector.has_table("project_list_meta"):
        print("Table 'project_list_meta' not found. Creating it...")
        ProjectListMeta.__table__.create(engine)
        print("Table 'project_list_meta' created successfully.")
        
    # Миграция 21: Добавить поля счетчиков в project_list_meta
    check_and_add_column(engine, 'project_list_meta', 'subscribers_count', 'INTEGER DEFAULT 0')
    check_and_add_column(engine, 'project_list_meta', 'history_join_count', 'INTEGER DEFAULT 0')
    check_and_add_column(engine, 'project_list_meta', 'history_leave_count', 'INTEGER DEFAULT 0')
    
    # Миграция 23: Создать таблицу system_list_posts и добавить поля в project_list_meta
    if not inspector.has_table("system_list_posts"):
        print("Table 'system_list_posts' not found. Creating it...")
        SystemListPost.__table__.create(engine)
        print("Table 'system_list_posts' created successfully.")
    
    check_and_add_column(engine, 'project_list_meta', 'posts_count', 'INTEGER DEFAULT 0')
    check_and_add_column(engine, 'project_list_meta', 'posts_last_updated', 'VARCHAR')
        
    # Добавить мета-поля для взаимодействий
    check_and_add_column(engine, 'project_list_meta', 'likes_count', 'INTEGER DEFAULT 0')
    check_and_add_column(engine, 'project_list_meta', 'comments_count', 'INTEGER DEFAULT 0')
    check_and_add_column(engine, 'project_list_meta', 'reposts_count', 'INTEGER DEFAULT 0')

    # Миграция 28: Добавить поле stored_posts_count в project_list_meta
    check_and_add_column(engine, 'project_list_meta', 'stored_posts_count', 'INTEGER DEFAULT 0')
    
    # Мета-поля для рассылки
    check_and_add_column(engine, 'project_list_meta', 'mailing_count', 'INTEGER DEFAULT 0')
    check_and_add_column(engine, 'project_list_meta', 'mailing_last_updated', 'VARCHAR')

    # Миграция 35: Добавить поля времени обновления для взаимодействий
    check_and_add_column(engine, 'project_list_meta', 'likes_last_updated', 'VARCHAR')
    check_and_add_column(engine, 'project_list_meta', 'comments_last_updated', 'VARCHAR')
    check_and_add_column(engine, 'project_list_meta', 'reposts_last_updated', 'VARCHAR')

    # Миграция 38: Добавить поле signer_id в system_list_posts
    check_and_add_column(engine, 'system_list_posts', 'signer_id', 'BIGINT')
    
    # Миграция 39: Добавить поле post_author_id в system_list_posts
    check_and_add_column(engine, 'system_list_posts', 'post_author_id', 'BIGINT')

    # Миграция 40: Добавить счетчики для автоматизаций (конкурсы)
    check_and_add_column(engine, 'project_list_meta', 'reviews_participants_count', 'INTEGER DEFAULT 0')
    check_and_add_column(engine, 'project_list_meta', 'reviews_winners_count', 'INTEGER DEFAULT 0')
    check_and_add_column(engine, 'project_list_meta', 'reviews_posts_count', 'INTEGER DEFAULT 0')

    # Мета-поля для авторов
    check_and_add_column(engine, 'project_list_meta', 'authors_count', 'INTEGER DEFAULT 0')
    check_and_add_column(engine, 'project_list_meta', 'authors_last_updated', 'VARCHAR')

    # ПРИМЕЧАНИЕ: DROP старых таблиц выполняется в cleanup_legacy_tables.migrate()
    # ПОСЛЕ миграций данных (vk_profiles, members, interactions, dialogs_authors)
