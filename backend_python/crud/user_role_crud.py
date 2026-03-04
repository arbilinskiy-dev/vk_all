"""
CRUD для бизнес-ролей пользователей (user_roles).
Роли — это должности (SMM-менеджер и т.д.), не системные права.
"""

from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

import models


def get_all_roles(db: Session) -> List[models.UserRole]:
    """Все роли, отсортированные по sort_order."""
    return db.query(models.UserRole).order_by(models.UserRole.sort_order, models.UserRole.name).all()


def get_role_by_id(db: Session, role_id: str) -> Optional[models.UserRole]:
    """Получить роль по ID."""
    return db.query(models.UserRole).filter(models.UserRole.id == role_id).first()


def create_role(
    db: Session,
    name: str,
    description: Optional[str] = None,
    color: Optional[str] = None,
) -> models.UserRole:
    """Создать новую роль."""
    role = models.UserRole(
        id=str(uuid.uuid4()),
        name=name,
        description=description,
        color=color,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def update_role(
    db: Session,
    role_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    color: Optional[str] = None,
) -> Optional[models.UserRole]:
    """Обновить роль."""
    role = get_role_by_id(db, role_id)
    if not role:
        return None
    if name is not None:
        role.name = name
    if description is not None:
        role.description = description
    if color is not None:
        role.color = color
    db.commit()
    db.refresh(role)
    return role


def delete_role(db: Session, role_id: str) -> bool:
    """Удалить роль. Пользователи с этой ролью получат role_id=NULL."""
    role = get_role_by_id(db, role_id)
    if not role:
        return False
    # Сбрасываем role_id у пользователей с этой ролью
    db.query(models.User).filter(models.User.role_id == role_id).update(
        {"role_id": None}, synchronize_session=False
    )
    db.delete(role)
    db.commit()
    return True


def assign_role_to_user(db: Session, user_id: str, role_id: Optional[str]) -> bool:
    """Назначить (или убрать) роль пользователю. role_id=None — убрать роль."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return False
    if role_id:
        role = get_role_by_id(db, role_id)
        if not role:
            return False
    user.role_id = role_id
    db.commit()
    return True


def get_users_with_roles(db: Session) -> list:
    """Все пользователи с информацией о ролях."""
    users = db.query(models.User).order_by(models.User.full_name).all()
    
    # Собираем все role_id
    role_ids = list({u.role_id for u in users if u.role_id})
    roles_map = {}
    if role_ids:
        roles = db.query(models.UserRole).filter(models.UserRole.id.in_(role_ids)).all()
        roles_map = {r.id: {"id": r.id, "name": r.name, "color": r.color} for r in roles}
    
    result = []
    for u in users:
        role = roles_map.get(u.role_id) if u.role_id else None
        result.append({
            "user_id": u.id,
            "full_name": u.full_name,
            "username": u.username,
            "role_id": u.role_id,
            "role_name": role["name"] if role else None,
            "role_color": role["color"] if role else None,
        })
    return result
