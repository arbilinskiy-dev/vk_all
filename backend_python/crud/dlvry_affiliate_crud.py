"""
CRUD-функции для таблицы dlvry_project_affiliates.
Управление привязкой филиалов DLVRY к проектам.
"""

import uuid
from typing import List, Optional
from sqlalchemy.orm import Session

from models_library.dlvry_affiliates import DlvryProjectAffiliate


def get_affiliates_by_project(db: Session, project_id: str) -> List[DlvryProjectAffiliate]:
    """Получить все филиалы DLVRY для проекта."""
    return (
        db.query(DlvryProjectAffiliate)
        .filter(DlvryProjectAffiliate.project_id == project_id)
        .order_by(DlvryProjectAffiliate.created_at)
        .all()
    )


def get_active_affiliates_by_project(db: Session, project_id: str) -> List[DlvryProjectAffiliate]:
    """Получить только активные филиалы DLVRY для проекта."""
    return (
        db.query(DlvryProjectAffiliate)
        .filter(
            DlvryProjectAffiliate.project_id == project_id,
            DlvryProjectAffiliate.is_active == True,
        )
        .order_by(DlvryProjectAffiliate.created_at)
        .all()
    )


def get_affiliate_by_id(db: Session, affiliate_record_id: str) -> Optional[DlvryProjectAffiliate]:
    """Получить филиал по его ID записи."""
    return db.query(DlvryProjectAffiliate).filter(DlvryProjectAffiliate.id == affiliate_record_id).first()


def get_affiliate_by_affiliate_id(db: Session, affiliate_id: str) -> Optional[DlvryProjectAffiliate]:
    """Найти запись филиала по affiliate_id (из DLVRY)."""
    return db.query(DlvryProjectAffiliate).filter(DlvryProjectAffiliate.affiliate_id == affiliate_id).first()


def find_project_id_by_affiliate_id(db: Session, affiliate_id: str) -> Optional[str]:
    """Найти project_id по affiliate_id. Используется при обработке webhook."""
    record = (
        db.query(DlvryProjectAffiliate.project_id)
        .filter(DlvryProjectAffiliate.affiliate_id == str(affiliate_id))
        .first()
    )
    return record[0] if record else None


def create_affiliate(
    db: Session,
    project_id: str,
    affiliate_id: str,
    name: Optional[str] = None,
) -> DlvryProjectAffiliate:
    """Создать новую привязку филиала к проекту."""
    record = DlvryProjectAffiliate(
        id=str(uuid.uuid4()),
        project_id=project_id,
        affiliate_id=affiliate_id,
        name=name,
        is_active=True,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_affiliate(
    db: Session,
    affiliate_record_id: str,
    name: Optional[str] = ...,
    is_active: Optional[bool] = ...,
) -> Optional[DlvryProjectAffiliate]:
    """Обновить филиал (имя, активность)."""
    record = get_affiliate_by_id(db, affiliate_record_id)
    if not record:
        return None
    if name is not ...:
        record.name = name
    if is_active is not ...:
        record.is_active = is_active
    db.commit()
    db.refresh(record)
    return record


def delete_affiliate(db: Session, affiliate_record_id: str) -> bool:
    """Удалить филиал. Возвращает True если был удалён."""
    record = get_affiliate_by_id(db, affiliate_record_id)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def get_active_affiliate_ids_for_project(db: Session, project_id: str) -> List[str]:
    """Получить список активных affiliate_id для проекта (только строки ID)."""
    rows = (
        db.query(DlvryProjectAffiliate.affiliate_id)
        .filter(
            DlvryProjectAffiliate.project_id == project_id,
            DlvryProjectAffiliate.is_active == True,
        )
        .all()
    )
    return [r[0] for r in rows]


def get_all_active_affiliates(db: Session) -> List[DlvryProjectAffiliate]:
    """Получить все активные филиалы всех проектов (для sync_all)."""
    return (
        db.query(DlvryProjectAffiliate)
        .filter(DlvryProjectAffiliate.is_active == True)
        .all()
    )
