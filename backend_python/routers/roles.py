"""
Роутер для управления бизнес-ролями пользователей.
Роли — это должности (SMM-менеджер, Контент-мейкер и т.д.), НЕ системные права.
Доступен ТОЛЬКО администраторам.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from database import get_db
from services.auth_middleware import get_current_admin, CurrentUser
from crud import user_role_crud

router = APIRouter(prefix="/roles", tags=["User Roles"])


# --- Pydantic схемы ---

class RolePayload(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None  # Tailwind-цвет: "indigo", "green", "red", ...


class RoleUpdatePayload(BaseModel):
    role_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class AssignRolePayload(BaseModel):
    user_id: str
    role_id: Optional[str] = None  # None = убрать роль


# --- Эндпоинты ---

@router.post("/list")
def list_roles(
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    """Список всех ролей."""
    roles = user_role_crud.get_all_roles(db)
    return {
        "success": True,
        "roles": [
            {
                "id": r.id,
                "name": r.name,
                "description": r.description,
                "color": r.color,
                "sort_order": r.sort_order,
            }
            for r in roles
        ],
    }


@router.post("/create")
def create_role(
    payload: RolePayload,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    """Создать новую роль."""
    try:
        role = user_role_crud.create_role(
            db, name=payload.name, description=payload.description, color=payload.color
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Не удалось создать роль: {e}")
    return {
        "success": True,
        "role": {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "color": role.color,
            "sort_order": role.sort_order,
        },
    }


@router.post("/update")
def update_role(
    payload: RoleUpdatePayload,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    """Обновить роль."""
    role = user_role_crud.update_role(
        db,
        role_id=payload.role_id,
        name=payload.name,
        description=payload.description,
        color=payload.color,
    )
    if not role:
        raise HTTPException(status_code=404, detail="Роль не найдена")
    return {
        "success": True,
        "role": {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "color": role.color,
            "sort_order": role.sort_order,
        },
    }


class DeleteRolePayload(BaseModel):
    role_id: str


@router.post("/delete")
def delete_role(
    payload: DeleteRolePayload,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    """Удалить роль. Пользователи с этой ролью получат пустую роль."""
    role_id = payload.role_id
    ok = user_role_crud.delete_role(db, role_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Роль не найдена")
    return {"success": True}


@router.post("/assign")
def assign_role(
    payload: AssignRolePayload,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    """Назначить роль пользователю (или убрать — role_id=null)."""
    ok = user_role_crud.assign_role_to_user(db, payload.user_id, payload.role_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Пользователь или роль не найдены")
    return {"success": True}


@router.post("/users")
def get_users_with_roles(
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    """Все пользователи с их ролями (для страницы управления)."""
    users = user_role_crud.get_users_with_roles(db)
    return {"success": True, "users": users}
