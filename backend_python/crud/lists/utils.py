
from sqlalchemy.orm import Session
from sqlalchemy import func
import models

def deduplicate_users(db: Session, model, project_id: str, event_type: str = None) -> int:
    """
    Удаляет дубликаты записей пользователей в рамках проекта.
    Оставляет одну (первую найденную) запись.
    После удаления ОБНОВЛЯЕТ счетчик в project_list_meta.
    
    Для старых моделей: группирует по vk_user_id.
    Для нормализованных моделей: группирует по vk_profile_id.
    
    event_type — дополнительный фильтр для MemberEvent (join/leave) и PostInteraction (like/comment/repost).
    """
    # Определяем колонку группировки
    if hasattr(model, 'vk_profile_id'):
        # Нормализованные таблицы (ProjectMember, MemberEvent, PostInteraction, ProjectDialog, ProjectAuthor)
        group_col = model.vk_profile_id
    elif hasattr(model, 'vk_user_id') and hasattr(model.vk_user_id, 'property'):
        # SQLAlchemy column (старые модели — на случай если ещё используются)
        group_col = model.vk_user_id
    else:
        print(f"DEDUPLICATION: Model {model.__tablename__} has no grouping column. Skipping.")
        return 0
    
    # Базовый фильтр
    base_filter = [model.project_id == project_id]
    
    # Дополнительный фильтр по типу события
    if event_type is not None:
        if hasattr(model, 'event_type'):
            base_filter.append(model.event_type == event_type)
        elif hasattr(model, 'type'):
            base_filter.append(model.type == event_type)
    
    # 1. Находим значения group_col, у которых более 1 записи
    duplicates = db.query(group_col).filter(
        *base_filter
    ).group_by(group_col).having(func.count(model.id) > 1).all()
    
    if not duplicates:
        return 0

    print(f"DEDUPLICATION: Found {len(duplicates)} users with duplicates for {model.__tablename__} in project {project_id}.")

    deleted_count = 0
    for (group_val,) in duplicates:
        # Получаем все записи дубликатов
        entry_filter = [model.project_id == project_id, group_col == group_val]
        if event_type is not None:
            if hasattr(model, 'event_type'):
                entry_filter.append(model.event_type == event_type)
            elif hasattr(model, 'type'):
                entry_filter.append(model.type == event_type)
        
        entries = db.query(model).filter(*entry_filter).all()
        
        # Если записей > 1, оставляем одну (первую), остальные удаляем
        if len(entries) > 1:
            remove_entries = entries[1:]
            for entry in remove_entries:
                db.delete(entry)
                deleted_count += 1
    
    if deleted_count > 0:
        print(f"DEDUPLICATION: Committing deletion of {deleted_count} duplicate entries...")
        db.commit()

        # --- ОБНОВЛЕНИЕ МЕТАДАННЫХ (СЧЕТЧИКОВ) ---
        table_name = model.__tablename__
        meta_field = None
        
        # Нормализованные таблицы
        if table_name == "project_members": meta_field = "subscribers_count"
        elif table_name == "member_events":
            if event_type == 'join': meta_field = "history_join_count"
            elif event_type == 'leave': meta_field = "history_leave_count"
        elif table_name == "project_dialogs": meta_field = "mailing_count"
        elif table_name == "project_authors": meta_field = "authors_count"
        elif table_name == "post_interactions":
            if event_type == 'like': meta_field = "likes_count"
            elif event_type == 'comment': meta_field = "comments_count"
            elif event_type == 'repost': meta_field = "reposts_count"
        
        if meta_field:
            # Для post_interactions считаем DISTINCT пользователей, а не все записи
            if table_name == "post_interactions":
                actual_count = db.query(func.count(func.distinct(model.vk_profile_id))).filter(
                    *base_filter
                ).scalar() or 0
            else:
                actual_count = db.query(model).filter(*base_filter).count()
            
            meta = db.query(models.ProjectListMeta).filter(models.ProjectListMeta.project_id == project_id).first()
            if meta:
                setattr(meta, meta_field, actual_count)
                db.commit()
                print(f"DEDUPLICATION: Updated metadata '{meta_field}' to {actual_count} for project {project_id}.")
        
    print(f"DEDUPLICATION: Successfully removed {deleted_count} duplicate entries for {model.__tablename__} in project {project_id}.")
    return deleted_count
