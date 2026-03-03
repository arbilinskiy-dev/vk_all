
from sqlalchemy.orm import Session
from typing import List, Dict
import models
from utils.db_retry import bulk_operation_with_retry, db_operation_with_retry

def bulk_upsert_posts(db: Session, posts: List[Dict]):
    """Массовое добавление/обновление постов с retry-логикой."""
    if not posts: return
    post_ids = [p['id'] for p in posts]
    
    # Удаление старых записей с retry
    CHUNK_SIZE_DELETE = 500
    for i in range(0, len(post_ids), CHUNK_SIZE_DELETE):
        chunk = post_ids[i:i + CHUNK_SIZE_DELETE]
        
        def delete_chunk(ids=chunk):
            db.query(models.SystemListPost).filter(models.SystemListPost.id.in_(ids)).delete(synchronize_session=False)
        
        db_operation_with_retry(
            db=db,
            operation=delete_chunk,
            operation_name=f"delete_posts_chunk_{i//CHUNK_SIZE_DELETE + 1}",
            max_retries=3
        )
        db.commit()
    
    # Пакетная вставка с retry
    def insert_chunk(chunk: List[Dict]):
        db.bulk_insert_mappings(models.SystemListPost, chunk)
    
    bulk_operation_with_retry(
        db=db,
        items=posts,
        chunk_operation=insert_chunk,
        operation_name="bulk_upsert_posts",
        chunk_size=100,
        max_retries=3
    )

def get_stored_posts_count(db: Session, project_id: str) -> int:
    return db.query(models.SystemListPost).filter(models.SystemListPost.project_id == project_id).count()

def delete_all_posts(db: Session, project_id: str):
    """Полное удаление всех постов списка с retry-логикой."""
    
    def do_delete():
        db.query(models.SystemListPost).filter(
            models.SystemListPost.project_id == project_id
        ).delete(synchronize_session=False)
    
    db_operation_with_retry(
        db=db,
        operation=do_delete,
        operation_name="delete_all_posts",
        max_retries=3
    )
    db.commit()


def get_posts_by_author(db: Session, project_id: str, vk_user_id: int, page: int = 1, page_size: int = 20):
    """
    Получает посты конкретного пользователя (автора) в сообществе.
    Ищет по signer_id или post_author_id.
    Возвращает (items, total_count).
    """
    from sqlalchemy import or_
    
    query = db.query(models.SystemListPost).filter(
        models.SystemListPost.project_id == project_id,
        or_(
            models.SystemListPost.signer_id == vk_user_id,
            models.SystemListPost.post_author_id == vk_user_id,
        )
    ).order_by(models.SystemListPost.date.desc())
    
    total_count = query.count()
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    
    return items, total_count
