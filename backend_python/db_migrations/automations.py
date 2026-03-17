
from sqlalchemy import Engine, inspect
from models import ReviewContest, PromoCode, ReviewContestEntry, ReviewContestDeliveryLog, ReviewContestBlacklist
from models_library.general_contests import GeneralContest, GeneralContestEntry
from .utils import check_and_add_column, check_and_add_unique_constraint

def migrate(engine: Engine):
    """Миграции для автоматизаций."""
    inspector = inspect(engine)

    if not inspector.has_table("review_contests"):
        print("Table 'review_contests' not found. Creating it...")
        ReviewContest.__table__.create(engine)
        print("Table 'review_contests' created successfully.")

    if not inspector.has_table("general_contests"):
        print("Table 'general_contests' not found. Creating it...")
        GeneralContest.__table__.create(engine)
        print("Table 'general_contests' created successfully.")

    if not inspector.has_table("general_contest_entries"):
        print("Table 'general_contest_entries' not found. Creating it...")
        GeneralContestEntry.__table__.create(engine)
        print("Table 'general_contest_entries' created successfully.")

    if not inspector.has_table("promo_codes"):
        print("Table 'promo_codes' not found. Creating it...")
        PromoCode.__table__.create(engine)
        print("Table 'promo_codes' created successfully.")

    if not inspector.has_table("review_contest_entries"):
        print("Table 'review_contest_entries' not found. Creating it...")
        ReviewContestEntry.__table__.create(engine)
        print("Table 'review_contest_entries' created successfully.")

    if not inspector.has_table("review_contest_delivery_logs"):
        print("Table 'review_contest_delivery_logs' not found. Creating it...")
        ReviewContestDeliveryLog.__table__.create(engine)
        print("Table 'review_contest_delivery_logs' created successfully.")
        
    if not inspector.has_table("review_contest_blacklist"):
        print("Table 'review_contest_blacklist' not found. Creating it...")
        ReviewContestBlacklist.__table__.create(engine)
        print("Table 'review_contest_blacklist' created successfully.")

    # Миграция: Добавление полей статуса доставки
    check_and_add_column(engine, 'promo_codes', 'delivery_status', 'VARCHAR')
    check_and_add_column(engine, 'promo_codes', 'delivery_message', 'TEXT')

    # Миграция: Добавление ссылок на посты в логи доставки (Winner Post & Results Post)
    check_and_add_column(engine, 'review_contest_delivery_logs', 'winner_post_link', 'VARCHAR')
    check_and_add_column(engine, 'review_contest_delivery_logs', 'results_post_link', 'VARCHAR')

    # Миграция: Настройки авто-бана
    check_and_add_column(engine, 'review_contests', 'auto_blacklist', 'BOOLEAN DEFAULT FALSE')
    check_and_add_column(engine, 'review_contests', 'auto_blacklist_duration', 'INTEGER DEFAULT 7')

    # Миграция: General Contests Support (Polymorphism)
    check_and_add_column(engine, 'promo_codes', 'general_contest_id', 'VARCHAR')
    check_and_add_column(engine, 'review_contest_delivery_logs', 'general_contest_id', 'VARCHAR')
    check_and_add_column(engine, 'review_contest_blacklist', 'general_contest_id', 'VARCHAR')

    # Миграция: Статистика для сторис
    check_and_add_column(engine, 'stories_automation_logs', 'stats', 'TEXT')
    check_and_add_column(engine, 'stories_automation_logs', 'stats_updated_at', 'TIMESTAMP WITH TIME ZONE')
    
    # Миграция: Контент истории
    check_and_add_column(engine, 'stories_automation_logs', 'image_url', 'VARCHAR')
    check_and_add_column(engine, 'stories_automation_logs', 'post_link', 'VARCHAR')
    check_and_add_column(engine, 'stories_automation_logs', 'post_text', 'TEXT')

    # Миграция: Зрители историй
    check_and_add_column(engine, 'stories_automation_logs', 'viewers', 'TEXT')
    check_and_add_column(engine, 'stories_automation_logs', 'viewers_updated_at', 'TIMESTAMP WITH TIME ZONE')

    # Миграция: Изображение-доказательство розыгрыша
    check_and_add_column(engine, 'review_contests', 'use_proof_image', 'BOOLEAN DEFAULT TRUE')
    check_and_add_column(engine, 'review_contests', 'attach_additional_media', 'BOOLEAN DEFAULT FALSE')

    # Миграция: Статус активности истории (активная/архивная)
    check_and_add_column(engine, 'stories_automation_logs', 'is_active', 'BOOLEAN DEFAULT FALSE')

    # Миграция: Флаг финализации — история архивная и данные больше не меняются
    check_and_add_column(engine, 'stories_automation_logs', 'stats_finalized', 'BOOLEAN DEFAULT FALSE')
    
    # Миграция: Флаг финализации зрителей — после финализации stats собираем viewers последний раз
    check_and_add_column(engine, 'stories_automation_logs', 'viewers_finalized', 'BOOLEAN DEFAULT FALSE')

    # Миграция: Дополнительные поля для записей конкурса отзывов
    check_and_add_column(engine, 'review_contest_entries', 'post_link', 'VARCHAR')
    check_and_add_column(engine, 'review_contest_entries', 'post_text', 'TEXT')
    check_and_add_column(engine, 'review_contest_entries', 'status', "VARCHAR DEFAULT 'new'")
    check_and_add_column(engine, 'review_contest_entries', 'entry_number', 'INTEGER')
    check_and_add_column(engine, 'review_contest_entries', 'created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()')

    # Миграция: Диагностический лог для записей конкурса отзывов
    check_and_add_column(engine, 'review_contest_entries', 'log', 'TEXT')

    # Миграция: Реальная дата поста VK для записей конкурса отзывов
    check_and_add_column(engine, 'review_contest_entries', 'post_date', 'TIMESTAMP WITH TIME ZONE')

    # Миграция: Режим интерпретации target_count (exact, minimum, maximum)
    check_and_add_column(engine, 'review_contests', 'target_count_mode', "VARCHAR DEFAULT 'exact'")

    # Миграция: Уникальный constraint для предотвращения дублирования историй
    # Защита от race condition при параллельном выполнении в нескольких Gunicorn-воркерах
    check_and_add_unique_constraint(
        engine, 'stories_automation_logs',
        'uq_stories_log_project_post',
        ['project_id', 'vk_post_id']
    )

