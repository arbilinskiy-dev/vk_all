"""
CRUD-операции для меток (ярлыков) диалогов.
"""

import uuid
import logging
from typing import List, Dict, Set, Optional

from sqlalchemy.orm import Session
from sqlalchemy import and_

from models_library.dialog_labels import DialogLabel, DialogLabelAssignment

logger = logging.getLogger(__name__)


# =============================================================================
# МЕТКИ — определения (dialog_labels)
# =============================================================================

def get_labels_by_project(db: Session, project_id: str) -> List[DialogLabel]:
    """Все метки проекта, отсортированные по sort_order."""
    return (
        db.query(DialogLabel)
        .filter(DialogLabel.project_id == project_id)
        .order_by(DialogLabel.sort_order, DialogLabel.created_at)
        .all()
    )


def get_label_by_id(db: Session, label_id: str) -> Optional[DialogLabel]:
    """Получить метку по ID."""
    return db.query(DialogLabel).filter(DialogLabel.id == label_id).first()


def create_label(db: Session, project_id: str, name: str, color: str = '#6366f1') -> DialogLabel:
    """Создать новую метку в проекте."""
    label = DialogLabel(
        id=str(uuid.uuid4()),
        project_id=project_id,
        name=name.strip(),
        color=color,
        sort_order=0,
    )
    db.add(label)
    db.commit()
    db.refresh(label)
    logger.info(f"LABEL_CREATE: project={project_id}, id={label.id}, name='{name}'")
    return label


def update_label(db: Session, label_id: str, name: Optional[str] = None, color: Optional[str] = None, sort_order: Optional[int] = None) -> Optional[DialogLabel]:
    """Обновить метку."""
    label = get_label_by_id(db, label_id)
    if not label:
        return None
    if name is not None:
        label.name = name.strip()
    if color is not None:
        label.color = color
    if sort_order is not None:
        label.sort_order = sort_order
    db.commit()
    db.refresh(label)
    logger.info(f"LABEL_UPDATE: id={label_id}, name='{label.name}', color='{label.color}'")
    return label


def delete_label(db: Session, label_id: str) -> bool:
    """Удалить метку (каскадно удалит все назначения)."""
    label = get_label_by_id(db, label_id)
    if not label:
        return False

    # Удаляем все назначения этой метки
    db.query(DialogLabelAssignment).filter(
        DialogLabelAssignment.label_id == label_id
    ).delete(synchronize_session=False)

    db.delete(label)
    db.commit()
    logger.info(f"LABEL_DELETE: id={label_id}, name='{label.name}'")
    return True


# =============================================================================
# НАЗНАЧЕНИЯ (dialog_label_assignments)
# =============================================================================

def assign_label(db: Session, project_id: str, vk_user_id: int, label_id: str) -> bool:
    """Назначить метку диалогу. Возвращает True если создано, False если уже есть."""
    existing = db.query(DialogLabelAssignment).filter(
        and_(
            DialogLabelAssignment.project_id == project_id,
            DialogLabelAssignment.vk_user_id == vk_user_id,
            DialogLabelAssignment.label_id == label_id,
        )
    ).first()

    if existing:
        return False

    assignment = DialogLabelAssignment(
        project_id=project_id,
        vk_user_id=vk_user_id,
        label_id=label_id,
    )
    db.add(assignment)
    db.commit()
    logger.info(f"LABEL_ASSIGN: project={project_id}, user={vk_user_id}, label={label_id}")
    return True


def unassign_label(db: Session, project_id: str, vk_user_id: int, label_id: str) -> bool:
    """Снять метку с диалога. Возвращает True если снято."""
    count = db.query(DialogLabelAssignment).filter(
        and_(
            DialogLabelAssignment.project_id == project_id,
            DialogLabelAssignment.vk_user_id == vk_user_id,
            DialogLabelAssignment.label_id == label_id,
        )
    ).delete(synchronize_session=False)
    db.commit()
    if count > 0:
        logger.info(f"LABEL_UNASSIGN: project={project_id}, user={vk_user_id}, label={label_id}")
    return count > 0


def set_dialog_labels(db: Session, project_id: str, vk_user_id: int, label_ids: List[str]) -> List[str]:
    """
    Установить метки диалога (полная замена).
    Удаляет все текущие метки диалога и назначает новые.
    Возвращает список назначенных label_id.
    """
    # Удаляем все текущие
    db.query(DialogLabelAssignment).filter(
        and_(
            DialogLabelAssignment.project_id == project_id,
            DialogLabelAssignment.vk_user_id == vk_user_id,
        )
    ).delete(synchronize_session=False)

    # Назначаем новые
    for lid in label_ids:
        db.add(DialogLabelAssignment(
            project_id=project_id,
            vk_user_id=vk_user_id,
            label_id=lid,
        ))

    db.commit()
    logger.info(f"LABEL_SET: project={project_id}, user={vk_user_id}, labels={label_ids}")
    return label_ids


def get_dialog_labels(db: Session, project_id: str, vk_user_id: int) -> List[str]:
    """Получить список label_id для диалога."""
    rows = db.query(DialogLabelAssignment.label_id).filter(
        and_(
            DialogLabelAssignment.project_id == project_id,
            DialogLabelAssignment.vk_user_id == vk_user_id,
        )
    ).all()
    return [r.label_id for r in rows]


def get_labels_batch(db: Session, project_id: str, vk_user_ids: List[int]) -> Dict[int, List[str]]:
    """
    Пакетное получение меток для группы диалогов.
    Возвращает: {vk_user_id: [label_id, ...]}
    """
    if not vk_user_ids:
        return {}

    rows = db.query(
        DialogLabelAssignment.vk_user_id,
        DialogLabelAssignment.label_id,
    ).filter(
        and_(
            DialogLabelAssignment.project_id == project_id,
            DialogLabelAssignment.vk_user_id.in_(vk_user_ids),
        )
    ).all()

    result: Dict[int, List[str]] = {}
    for row in rows:
        uid = row.vk_user_id
        if uid not in result:
            result[uid] = []
        result[uid].append(row.label_id)

    return result


def get_user_ids_by_label(db: Session, project_id: str, label_id: str) -> List[int]:
    """Получить все vk_user_id с определённой меткой в проекте."""
    rows = db.query(DialogLabelAssignment.vk_user_id).filter(
        and_(
            DialogLabelAssignment.project_id == project_id,
            DialogLabelAssignment.label_id == label_id,
        )
    ).all()
    return [r.vk_user_id for r in rows]


def get_label_counts(db: Session, project_id: str) -> Dict[str, int]:
    """
    Получить количество диалогов для каждой метки в проекте.
    Возвращает: {label_id: count}
    """
    from sqlalchemy import func as sa_func

    rows = db.query(
        DialogLabelAssignment.label_id,
        sa_func.count(DialogLabelAssignment.id).label('cnt'),
    ).filter(
        DialogLabelAssignment.project_id == project_id,
    ).group_by(
        DialogLabelAssignment.label_id,
    ).all()

    return {r.label_id: r.cnt for r in rows}
