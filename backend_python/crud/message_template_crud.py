"""
CRUD-операции для шаблонов ответов сообщений.
"""

from sqlalchemy.orm import Session
import uuid
import json
from typing import Optional, List

import models


# ===============================================
# MESSAGE TEMPLATES
# ===============================================

def get_templates_by_project_id(db: Session, project_id: str) -> List[models.MessageTemplate]:
    """Получить все шаблоны проекта, отсортированные по sort_order."""
    return (
        db.query(models.MessageTemplate)
        .filter(models.MessageTemplate.project_id == project_id)
        .order_by(models.MessageTemplate.sort_order, models.MessageTemplate.created_at)
        .all()
    )


def get_template_by_id(db: Session, template_id: str) -> Optional[models.MessageTemplate]:
    """Получить шаблон по ID."""
    return db.query(models.MessageTemplate).filter(models.MessageTemplate.id == template_id).first()


def create_template(
    db: Session,
    project_id: str,
    name: str,
    text: str,
    attachments_json: Optional[str] = None,
    sort_order: int = 0,
) -> models.MessageTemplate:
    """Создать новый шаблон."""
    db_template = models.MessageTemplate(
        id=str(uuid.uuid4()),
        project_id=project_id,
        name=name,
        text=text,
        attachments_json=attachments_json,
        sort_order=sort_order,
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


def update_template(
    db: Session,
    template_id: str,
    name: Optional[str] = None,
    text: Optional[str] = None,
    attachments_json: Optional[str] = None,
    sort_order: Optional[int] = None,
) -> Optional[models.MessageTemplate]:
    """Обновить шаблон. Возвращает None если не найден."""
    db_template = db.query(models.MessageTemplate).filter(models.MessageTemplate.id == template_id).first()
    if not db_template:
        return None

    if name is not None:
        db_template.name = name
    if text is not None:
        db_template.text = text
    if attachments_json is not None:
        db_template.attachments_json = attachments_json
    if sort_order is not None:
        db_template.sort_order = sort_order

    db.commit()
    db.refresh(db_template)
    return db_template


def delete_template(db: Session, template_id: str) -> bool:
    """Удалить шаблон. Возвращает True если удалён."""
    deleted_count = db.query(models.MessageTemplate).filter(models.MessageTemplate.id == template_id).delete()
    db.commit()
    return deleted_count > 0
