"""
Единая точка маппинга list_type → модели SQLAlchemy.

ВСЕ типы списков используют нормализованные таблицы (Фазы 1-5).
При переключении list_type на новую таблицу — меняем ТОЛЬКО здесь.

Использование:
    from crud.lists.model_resolver import resolve
    
    r = resolve('subscribers')
    query = db.query(r.query_model)
    if r.needs_join:
        query = query.join(r.profile_model, r.profile_model.id == r.query_model.vk_profile_id)
    if r.type_filter:
        col, val = r.type_filter
        query = query.filter(col == val)
    query = query.filter(r.query_model.project_id == project_id)
    query = query.order_by(r.date_col.desc())
"""

import models


class ListModels:
    """Набор моделей для конкретного типа списка."""
    
    __slots__ = ('query_model', 'profile_model', 'date_col', 'needs_join',
                 'meta_count_field', 'meta_date_field', 'type_filter', 'aggregate_by_user')
    
    def __init__(self, query_model, profile_model, date_col, *,
                 needs_join=False, meta_count_field=None, meta_date_field=None,
                 type_filter=None, aggregate_by_user=False):
        self.query_model = query_model       # Основная модель (ProjectMember, MemberEvent, ...)
        self.profile_model = profile_model   # Модель с полями профиля (VkProfile)
        self.date_col = date_col             # Колонка даты для сортировки (ORDER BY)
        self.needs_join = needs_join         # Нужен ли JOIN с vk_profiles
        self.meta_count_field = meta_count_field   # Поле в ProjectListMeta для счётчика
        self.meta_date_field = meta_date_field     # Поле в ProjectListMeta для даты обновления
        # Фильтр по типу: (column, value) — для MemberEvent.event_type / PostInteraction.type
        self.type_filter = type_filter
        # Агрегация по пользователю: для PostInteraction GROUP BY vk_profile_id
        self.aggregate_by_user = aggregate_by_user


def resolve(list_type: str) -> ListModels:
    """
    Определяет модели по типу списка.
    
    Возвращает ListModels с:
    - query_model: основная модель для FROM/WHERE
    - profile_model: модель с полями профиля (VkProfile)
    - date_col: колонка даты для ORDER BY
    - needs_join: нужен ли JOIN с vk_profiles
    - type_filter: (column, value) для WHERE по типу (MemberEvent, PostInteraction)
    - aggregate_by_user: группировка по пользователю (PostInteraction)
    """
    
    # ── Фаза 1: subscribers → ProjectMember + VkProfile ──────────
    if list_type == 'subscribers':
        return ListModels(
            models.ProjectMember, models.VkProfile,
            models.ProjectMember.subscribed_at,
            needs_join=True,
            meta_count_field='subscribers_count',
            meta_date_field='subscribers_last_updated',
        )
    
    # ── Фаза 2: history → MemberEvent + VkProfile ────────────────
    elif list_type == 'history_join':
        return ListModels(
            models.MemberEvent, models.VkProfile,
            models.MemberEvent.event_date,
            needs_join=True,
            meta_count_field='history_join_count',
            meta_date_field='history_join_last_updated',
            type_filter=(models.MemberEvent.event_type, 'join'),
        )
    elif list_type == 'history_leave':
        return ListModels(
            models.MemberEvent, models.VkProfile,
            models.MemberEvent.event_date,
            needs_join=True,
            meta_count_field='history_leave_count',
            meta_date_field='history_leave_last_updated',
            type_filter=(models.MemberEvent.event_type, 'leave'),
        )
    
    # ── Фаза 3: interactions → PostInteraction + VkProfile ───────
    elif list_type == 'likes':
        return ListModels(
            models.PostInteraction, models.VkProfile,
            models.PostInteraction.created_at,
            needs_join=True,
            meta_count_field='likes_count',
            meta_date_field='likes_last_updated',
            type_filter=(models.PostInteraction.type, 'like'),
            aggregate_by_user=True,
        )
    elif list_type == 'comments':
        return ListModels(
            models.PostInteraction, models.VkProfile,
            models.PostInteraction.created_at,
            needs_join=True,
            meta_count_field='comments_count',
            meta_date_field='comments_last_updated',
            type_filter=(models.PostInteraction.type, 'comment'),
            aggregate_by_user=True,
        )
    elif list_type == 'reposts':
        return ListModels(
            models.PostInteraction, models.VkProfile,
            models.PostInteraction.created_at,
            needs_join=True,
            meta_count_field='reposts_count',
            meta_date_field='reposts_last_updated',
            type_filter=(models.PostInteraction.type, 'repost'),
            aggregate_by_user=True,
        )
    
    # ── Фаза 4: mailing → ProjectDialog + VkProfile ─────────────
    elif list_type == 'mailing':
        return ListModels(
            models.ProjectDialog, models.VkProfile,
            models.ProjectDialog.last_message_date,
            needs_join=True,
            meta_count_field='mailing_count',
            meta_date_field='mailing_last_updated',
        )
    
    # ── Фаза 5: authors → ProjectAuthor + VkProfile ─────────────
    elif list_type == 'authors':
        return ListModels(
            models.ProjectAuthor, models.VkProfile,
            models.ProjectAuthor.first_seen_at,
            needs_join=True,
            meta_count_field='authors_count',
            meta_date_field='authors_last_updated',
        )
    
    # ── Не мигрированные (остаются без изменений) ────────────────
    elif list_type == 'posts':
        return ListModels(
            models.SystemListPost, models.SystemListPost,
            models.SystemListPost.date,
            meta_count_field='posts_count',
            meta_date_field='posts_last_updated',
        )
    elif list_type in ('reviews_participants', 'reviews_winners', 'reviews_posts'):
        return ListModels(
            models.ReviewContestEntry, models.ReviewContestEntry,
            models.ReviewContestEntry.created_at,
        )
    
    # Fallback
    return ListModels(
        models.ProjectMember, models.VkProfile,
        models.ProjectMember.subscribed_at,
        needs_join=True,
        meta_count_field='subscribers_count',
        meta_date_field='subscribers_last_updated',
    )
