from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func
from typing import Dict
import models

def get_list_meta(db: Session, project_id: str) -> models.ProjectListMeta:
    meta = db.query(models.ProjectListMeta).filter(models.ProjectListMeta.project_id == project_id).first()
    if not meta:
        # Создаём дефолтную запись, если её нет
        meta = models.ProjectListMeta(
            id=project_id,
            project_id=project_id,
            subscribers_count=0,
            history_join_count=0,
            history_leave_count=0,
            posts_count=0,
            likes_count=0,
            comments_count=0,
            reposts_count=0
        )
        db.add(meta)
        db.commit()
        db.refresh(meta)
    
    # Пересчитываем счётчики из реальных таблиц БД
    _sync_meta_counts(db, meta, project_id)
    
    return meta


def _sync_meta_counts(db: Session, meta: models.ProjectListMeta, project_id: str):
    """
    Пересчитывает все счётчики из реальных таблиц и обновляет мета-запись,
    если значения расходятся.
    """
    changed = False
    
    # Подписчики — project_members
    real_subscribers = db.query(sa_func.count(models.ProjectMember.id)).filter(
        models.ProjectMember.project_id == project_id
    ).scalar() or 0
    if meta.subscribers_count != real_subscribers:
        meta.subscribers_count = real_subscribers
        changed = True
    
    # В рассылке — project_dialogs
    real_mailing = db.query(sa_func.count(models.ProjectDialog.id)).filter(
        models.ProjectDialog.project_id == project_id
    ).scalar() or 0
    if meta.mailing_count != real_mailing:
        meta.mailing_count = real_mailing
        changed = True
    
    # Вступившие (История) — member_events WHERE event_type='join'
    real_join = db.query(sa_func.count(models.MemberEvent.id)).filter(
        models.MemberEvent.project_id == project_id,
        models.MemberEvent.event_type == 'join'
    ).scalar() or 0
    if meta.history_join_count != real_join:
        meta.history_join_count = real_join
        changed = True
    
    # Вышедшие (История) — member_events WHERE event_type='leave'
    real_leave = db.query(sa_func.count(models.MemberEvent.id)).filter(
        models.MemberEvent.project_id == project_id,
        models.MemberEvent.event_type == 'leave'
    ).scalar() or 0
    if meta.history_leave_count != real_leave:
        meta.history_leave_count = real_leave
        changed = True
    
    # Посты — system_list_posts (stored_posts_count)
    real_posts = db.query(sa_func.count(models.SystemListPost.id)).filter(
        models.SystemListPost.project_id == project_id
    ).scalar() or 0
    if meta.stored_posts_count != real_posts:
        meta.stored_posts_count = real_posts
        changed = True
    
    # Лайки — post_interactions WHERE type='like' (DISTINCT пользователи)
    real_likes = db.query(sa_func.count(sa_func.distinct(models.PostInteraction.vk_profile_id))).filter(
        models.PostInteraction.project_id == project_id,
        models.PostInteraction.type == 'like'
    ).scalar() or 0
    if meta.likes_count != real_likes:
        meta.likes_count = real_likes
        changed = True
    
    # Комментарии — post_interactions WHERE type='comment' (DISTINCT пользователи)
    real_comments = db.query(sa_func.count(sa_func.distinct(models.PostInteraction.vk_profile_id))).filter(
        models.PostInteraction.project_id == project_id,
        models.PostInteraction.type == 'comment'
    ).scalar() or 0
    if meta.comments_count != real_comments:
        meta.comments_count = real_comments
        changed = True
    
    # Репосты — post_interactions WHERE type='repost' (DISTINCT пользователи)
    real_reposts = db.query(sa_func.count(sa_func.distinct(models.PostInteraction.vk_profile_id))).filter(
        models.PostInteraction.project_id == project_id,
        models.PostInteraction.type == 'repost'
    ).scalar() or 0
    if meta.reposts_count != real_reposts:
        meta.reposts_count = real_reposts
        changed = True
    
    # Авторы — project_authors
    real_authors = db.query(sa_func.count(models.ProjectAuthor.id)).filter(
        models.ProjectAuthor.project_id == project_id
    ).scalar() or 0
    if meta.authors_count != real_authors:
        meta.authors_count = real_authors
        changed = True
    
    if changed:
        db.commit()
        db.refresh(meta)

def update_list_meta(db: Session, project_id: str, updates: Dict):
    meta = get_list_meta(db, project_id)
    for key, value in updates.items():
        setattr(meta, key, value)
    db.commit()