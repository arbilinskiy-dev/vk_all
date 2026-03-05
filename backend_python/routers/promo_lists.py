"""
Роутер для CRUD списков промокодов.
Prefix: /api/promo-lists
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from services.auth_middleware import get_current_user, CurrentUser
from services.action_tracker import track
from schemas.models.promo_lists import (
    PromoList,
    PromoListCreate,
    PromoListUpdate,
    PromoCodeCreate,
    PromoCodesListResponse,
    PromoVariableInfo,
)
from services import promo_list_service

router = APIRouter()


# --- Payload-схемы ---

class ListPromoListsPayload(BaseModel):
    """Запрос списков промокодов проекта."""
    projectId: str


class CreatePromoListPayload(BaseModel):
    """Запрос создания списка промокодов."""
    projectId: str
    data: PromoListCreate


class UpdatePromoListPayload(BaseModel):
    """Запрос обновления списка промокодов."""
    listId: str
    data: PromoListUpdate


class DeletePromoListPayload(BaseModel):
    """Запрос удаления списка промокодов."""
    listId: str


class ListCodesPayload(BaseModel):
    """Запрос промокодов конкретного списка."""
    promoListId: str
    statusFilter: Optional[str] = None  # "free" | "issued" | None


class AddCodesPayload(BaseModel):
    """Запрос добавления промокодов."""
    promoListId: str
    codes: List[PromoCodeCreate]


class DeleteCodePayload(BaseModel):
    """Запрос удаления одного промокода."""
    codeId: str


class DeleteAllFreePayload(BaseModel):
    """Запрос удаления всех свободных промокодов."""
    promoListId: str


class GetVariablesPayload(BaseModel):
    """Запрос доступных переменных промокодов."""
    projectId: str


# --- Эндпоинты: Списки ---

@router.post("/list", response_model=List[PromoList])
def list_promo_lists(payload: ListPromoListsPayload, db: Session = Depends(get_db)):
    """Получить все списки промокодов проекта."""
    return promo_list_service.get_lists(db, payload.projectId)


@router.post("/create", response_model=PromoList)
def create_promo_list(payload: CreatePromoListPayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """Создать новый список промокодов."""
    result = promo_list_service.create_list(db, payload.projectId, payload.data)
    track(db, current_user, "promo_list_create", "messages",
          entity_type="promo_list", entity_id=result.id if hasattr(result, 'id') else None,
          project_id=payload.projectId,
          metadata={"name": payload.data.name if hasattr(payload.data, 'name') else None})
    return result


@router.post("/update", response_model=PromoList)
def update_promo_list(payload: UpdatePromoListPayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """Обновить список промокодов."""
    result = promo_list_service.update_list(db, payload.listId, payload.data)
    track(db, current_user, "promo_list_update", "messages",
          entity_type="promo_list", entity_id=payload.listId)
    return result


@router.post("/delete")
def delete_promo_list(payload: DeletePromoListPayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """Удалить список промокодов."""
    result = promo_list_service.delete_list(db, payload.listId)
    track(db, current_user, "promo_list_delete", "messages",
          entity_type="promo_list", entity_id=payload.listId)
    return result


# --- Эндпоинты: Промокоды ---

@router.post("/codes/list", response_model=PromoCodesListResponse)
def list_codes(payload: ListCodesPayload, db: Session = Depends(get_db)):
    """Получить промокоды конкретного списка."""
    return promo_list_service.get_codes(db, payload.promoListId, payload.statusFilter)


@router.post("/codes/add")
def add_codes(payload: AddCodesPayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """Добавить промокоды в список (bulk)."""
    result = promo_list_service.add_codes(db, payload.promoListId, payload.codes)
    track(db, current_user, "promo_codes_add", "messages",
          entity_type="promo_list", entity_id=payload.promoListId,
          metadata={"codes_count": len(payload.codes)})
    return result


@router.post("/codes/delete")
def delete_code(payload: DeleteCodePayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """Удалить один промокод (только свободный)."""
    result = promo_list_service.delete_code(db, payload.codeId)
    track(db, current_user, "promo_code_delete", "messages",
          entity_type="promo_code", entity_id=payload.codeId)
    return result


@router.post("/codes/delete-all-free")
def delete_all_free(payload: DeleteAllFreePayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """Удалить все свободные промокоды в списке."""
    result = promo_list_service.delete_all_free(db, payload.promoListId)
    track(db, current_user, "promo_codes_delete_all_free", "messages",
          entity_type="promo_list", entity_id=payload.promoListId)
    return result


# --- Эндпоинты: Переменные ---

@router.post("/variables", response_model=List[PromoVariableInfo])
def get_variables(payload: GetVariablesPayload, db: Session = Depends(get_db)):
    """Получить доступные переменные промокодов для шаблонов."""
    return promo_list_service.get_variables(db, payload.projectId)
