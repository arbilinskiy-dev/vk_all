"""
CRUD операции для Конкурс 2.0
"""

from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from models_library.contest_v2 import ContestV2
from schemas.contest_v2 import ContestV2Create, ContestV2Update


def get_contests_by_project(db: Session, project_id: str) -> List[ContestV2]:
    """Получить все конкурсы проекта"""
    return db.query(ContestV2).filter(ContestV2.project_id == project_id).order_by(ContestV2.created_at.desc()).all()


def get_contest_by_id(db: Session, contest_id: str) -> Optional[ContestV2]:
    """Получить конкурс по ID"""
    return db.query(ContestV2).filter(ContestV2.id == contest_id).first()


def create_contest(db: Session, contest_data: ContestV2Create) -> ContestV2:
    """Создать новый конкурс"""
    contest = ContestV2(
        id=str(uuid.uuid4()),
        project_id=contest_data.project_id,
        is_active=contest_data.is_active if contest_data.is_active is not None else True,
        title=contest_data.title or "Новый конкурс",
        description=contest_data.description,
        start_type=contest_data.start_type or "new_post",
        existing_post_link=contest_data.existing_post_link,
        start_post_date=contest_data.start_post_date,
        start_post_time=contest_data.start_post_time,
        start_post_text=contest_data.start_post_text,
        start_post_images=contest_data.start_post_images,
        status="draft",
    )
    db.add(contest)
    db.commit()
    db.refresh(contest)
    return contest


def update_contest(db: Session, contest_id: str, contest_data: ContestV2Update) -> Optional[ContestV2]:
    """Обновить конкурс"""
    contest = db.query(ContestV2).filter(ContestV2.id == contest_id).first()
    if not contest:
        return None
    
    # Обновляем только переданные поля
    update_data = contest_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contest, field, value)
    
    db.commit()
    db.refresh(contest)
    return contest


def delete_contest(db: Session, contest_id: str) -> bool:
    """Удалить конкурс"""
    contest = db.query(ContestV2).filter(ContestV2.id == contest_id).first()
    if not contest:
        return False
    
    db.delete(contest)
    db.commit()
    return True
