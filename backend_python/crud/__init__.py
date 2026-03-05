
from .project_crud import (
    get_all_projects,
    get_project_by_id,
    get_project_by_vk_id,
    update_project_settings,
    update_project_last_update_time,
    get_project_variables,
    get_all_vk_project_ids,
    get_archived_projects,
    permanently_delete_project,
    get_max_sort_order,
)

from .post_crud import (
    get_posts_by_project_id,
    get_scheduled_posts_by_project_id,
    get_scheduled_post_count_for_project,
    get_suggested_posts_by_project_id,
    get_suggested_post_counts,
    replace_published_posts,
    replace_scheduled_posts,
    replace_suggested_posts,
    upsert_post,
    upsert_published_posts,
    delete_post_from_cache,
    get_all_data_for_project_ids,
    get_project_update_status,
    get_all_publication_times_for_project,
)

from .system_post_crud import (
    create_or_update_system_post,
    delete_system_post,
    get_system_post_by_id,
    get_system_posts_for_project_ids,
)

from .note_crud import (
    get_notes_by_project_id,
    save_note,
    delete_note,
)

from .tag_crud import (
    get_tags_by_project_id,
    create_tag,
    update_tag,
    delete_tag,
)

from .media_crud import (
    get_albums_by_project,
    get_album_by_id,
    update_album_photos_timestamp,
    replace_albums_for_project,
    get_photos_by_album,
    count_photos_in_album,
    replace_photos_for_album,
)

from .user_crud import (
    get_user_by_username,
    get_all_users,
    update_users,
)

from .ai_prompt_preset_crud import (
    get_presets_by_project_id,
    create_preset,
    update_preset,
    delete_preset,
)

from .global_variable_crud import (
    get_all_definitions,
    get_values_by_project_id,
    get_values_by_project_ids,
    update_all_definitions,
    update_values_for_project,
)

from .market_crud import (
    get_market_albums_by_project,
    replace_market_albums_for_project,
    get_market_items_by_project,
    get_market_item_by_vk_id,
    get_market_items_count_by_project,
    replace_market_items_for_project,
    update_market_item,
    get_market_categories_count,
    replace_market_categories,
    get_all_market_categories,
    create_market_album,
    update_market_album_title,
    delete_market_album,
    delete_market_item,
    decrement_market_album_count,
)

# Новые импорты для списков (ПРЯМЫЕ ИМПОРТЫ ИЗ МОДУЛЕЙ)
from .lists.meta import get_list_meta, update_list_meta
from .lists.stats import get_list_stats_data
from .lists.subscribers import (
    get_all_subscriber_vk_ids,
    bulk_add_subscribers,
    bulk_delete_subscribers,
    bulk_update_subscriber_details,
    get_subscribers_by_vk_ids,
    delete_all_subscribers # New
)
from .lists.history import (
    bulk_add_history_join,
    bulk_add_history_leave,
    get_all_history_vk_ids,
    bulk_update_history_details,
    delete_all_history_join, # New
    delete_all_history_leave # New
)
from .lists.posts import (
    bulk_upsert_posts,
    get_stored_posts_count,
    delete_all_posts # New
)
from .lists.interactions import (
    bulk_upsert_interactions,
    get_all_interaction_vk_ids,
    get_interaction_user_count,
    bulk_update_interaction_users,
    delete_all_interactions
)
from .lists.mailing import (
    bulk_upsert_mailing,
    get_all_mailing_vk_ids,
    delete_all_mailing # New
)
# NEW: Импорт для авторов
from .lists.authors import (
    bulk_upsert_authors,
    get_all_author_vk_ids,
    bulk_update_author_details,
    delete_all_authors
)
# NEW: История вступлений/выходов (аналитический лог)
from .lists.membership_history import (
    add_history_record as add_membership_history_record,
    get_last_action as get_last_membership_action,
    get_last_actions_bulk as get_last_membership_actions_bulk,
    bulk_add_history_records as bulk_add_membership_history,
    get_user_history as get_user_membership_history,
)

# Импорт для системных аккаунтов
from .system_accounts.account_crud import (
    get_all_accounts,
    get_existing_vk_ids,
    create_accounts,
    update_account,
    delete_account,
    get_active_account_tokens
)

# Импорт для массового редактирования постов
from .bulk_edit_crud import (
    search_matching_posts,
    update_system_post_bulk,
    update_cached_vk_post,
)

# Импорт batch-функций для параллельной загрузки данных
from . import batch_crud

# Импорт для шаблонов ответов сообщений
from .message_template_crud import (
    get_templates_by_project_id,
    get_template_by_id,
    create_template as create_message_template,
    update_template as update_message_template,
    delete_template as delete_message_template,
)

# Импорт для авторизации — сессии и логи
from . import auth_session_crud
from . import auth_log_crud

# Импорт для списков промокодов
from . import promo_list_crud
