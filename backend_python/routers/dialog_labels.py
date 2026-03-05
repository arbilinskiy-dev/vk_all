"""
Роутер меток (ярлыков) диалогов.
CRUD меток + назначение/снятие + фильтрация диалогов по метке.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session

from database import get_db
from crud import dialog_label_crud
from services.auth_middleware import get_current_user, CurrentUser
from services.action_tracker import track
from schemas.dialog_label_schemas import (
    DialogLabelCreate,
    DialogLabelUpdate,
    DialogLabelAssignRequest,
    DialogLabelBulkAssignRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dialog-labels")


# =============================================================================
# CRUD меток
# =============================================================================

@router.get("/list")
def list_labels(
    project_id: str = Query(..., description="ID проекта"),
    db: Session = Depends(get_db),
):
    """Все метки проекта + количество диалогов на каждой."""
    labels = dialog_label_crud.get_labels_by_project(db, project_id)
    counts = dialog_label_crud.get_label_counts(db, project_id)

    return {
        "success": True,
        "labels": [
            {
                "id": l.id,
                "project_id": l.project_id,
                "name": l.name,
                "color": l.color,
                "sort_order": l.sort_order,
                "dialog_count": counts.get(l.id, 0),
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in labels
        ],
    }


@router.post("/create")
def create_label(
    body: DialogLabelCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Создать метку в проекте."""
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Название метки не может быть пустым")

    label = dialog_label_crud.create_label(
        db, body.project_id, body.name, body.color,
    )
    track(db, current_user, "dialog_label_create", "messages",
          entity_type="dialog_label", entity_id=label.id,
          project_id=body.project_id,
          metadata={"name": body.name, "color": body.color})
    return {
        "success": True,
        "label": {
            "id": label.id,
            "project_id": label.project_id,
            "name": label.name,
            "color": label.color,
            "sort_order": label.sort_order,
            "dialog_count": 0,
            "created_at": label.created_at.isoformat() if label.created_at else None,
        },
    }


@router.put("/{label_id}")
def update_label(
    label_id: str,
    body: DialogLabelUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Обновить метку."""
    label = dialog_label_crud.update_label(
        db, label_id,
        name=body.name,
        color=body.color,
        sort_order=body.sort_order,
    )
    if not label:
        raise HTTPException(status_code=404, detail="Метка не найдена")

    track(db, current_user, "dialog_label_update", "messages",
          entity_type="dialog_label", entity_id=label_id,
          project_id=label.project_id,
          metadata={"name": body.name, "color": body.color})
    return {
        "success": True,
        "label": {
            "id": label.id,
            "project_id": label.project_id,
            "name": label.name,
            "color": label.color,
            "sort_order": label.sort_order,
            "created_at": label.created_at.isoformat() if label.created_at else None,
        },
    }


@router.delete("/{label_id}")
def delete_label(
    label_id: str,
    project_id: str = Query(..., description="ID проекта"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Удалить метку (каскадно снимает со всех диалогов)."""
    ok = dialog_label_crud.delete_label(db, label_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Метка не найдена")
    track(db, current_user, "dialog_label_delete", "messages",
          entity_type="dialog_label", entity_id=label_id,
          project_id=project_id)
    return {"success": True}


# =============================================================================
# Назначение / снятие меток с диалогов
# =============================================================================

@router.post("/assign")
def assign_label(
    body: DialogLabelAssignRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Прикрепить метку к диалогу."""
    created = dialog_label_crud.assign_label(
        db, body.project_id, body.vk_user_id, body.label_id,
    )
    track(db, current_user, "dialog_label_assign", "messages",
          entity_type="dialog_label", entity_id=body.label_id,
          project_id=body.project_id,
          metadata={"vk_user_id": body.vk_user_id})
    return {"success": True, "created": created}


@router.post("/unassign")
def unassign_label(
    body: DialogLabelAssignRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Открепить метку от диалога."""
    removed = dialog_label_crud.unassign_label(
        db, body.project_id, body.vk_user_id, body.label_id,
    )
    track(db, current_user, "dialog_label_unassign", "messages",
          entity_type="dialog_label", entity_id=body.label_id,
          project_id=body.project_id,
          metadata={"vk_user_id": body.vk_user_id})
    return {"success": True, "removed": removed}


@router.post("/set-dialog-labels")
def set_dialog_labels(
    body: DialogLabelBulkAssignRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Заменить все метки диалога на указанный набор."""
    label_ids = dialog_label_crud.set_dialog_labels(
        db, body.project_id, body.vk_user_id, body.label_ids,
    )
    track(db, current_user, "dialog_label_set", "messages",
          entity_type="dialog_label", project_id=body.project_id,
          metadata={"vk_user_id": body.vk_user_id, "label_ids": body.label_ids})
    return {"success": True, "label_ids": label_ids}


@router.get("/dialog")
def get_dialog_labels(
    project_id: str = Query(..., description="ID проекта"),
    vk_user_id: int = Query(..., description="VK user ID"),
    db: Session = Depends(get_db),
):
    """Получить метки конкретного диалога."""
    label_ids = dialog_label_crud.get_dialog_labels(db, project_id, vk_user_id)
    return {"success": True, "label_ids": label_ids}
