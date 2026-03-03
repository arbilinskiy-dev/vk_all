"""
Роутер для CRUD списков промокодов.
Prefix: /api/promo-lists
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
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
def create_promo_list(payload: CreatePromoListPayload, db: Session = Depends(get_db)):
    """Создать новый список промокодов."""
    return promo_list_service.create_list(db, payload.projectId, payload.data)


@router.post("/update", response_model=PromoList)
def update_promo_list(payload: UpdatePromoListPayload, db: Session = Depends(get_db)):
    """Обновить список промокодов."""
    return promo_list_service.update_list(db, payload.listId, payload.data)


@router.post("/delete")
def delete_promo_list(payload: DeletePromoListPayload, db: Session = Depends(get_db)):
    """Удалить список промокодов."""
    return promo_list_service.delete_list(db, payload.listId)


# --- Эндпоинты: Промокоды ---

@router.post("/codes/list", response_model=PromoCodesListResponse)
def list_codes(payload: ListCodesPayload, db: Session = Depends(get_db)):
    """Получить промокоды конкретного списка."""
    return promo_list_service.get_codes(db, payload.promoListId, payload.statusFilter)


@router.post("/codes/add")
def add_codes(payload: AddCodesPayload, db: Session = Depends(get_db)):
    """Добавить промокоды в список (bulk)."""
    return promo_list_service.add_codes(db, payload.promoListId, payload.codes)


@router.post("/codes/delete")
def delete_code(payload: DeleteCodePayload, db: Session = Depends(get_db)):
    """Удалить один промокод (только свободный)."""
    return promo_list_service.delete_code(db, payload.codeId)


@router.post("/codes/delete-all-free")
def delete_all_free(payload: DeleteAllFreePayload, db: Session = Depends(get_db)):
    """Удалить все свободные промокоды в списке."""
    return promo_list_service.delete_all_free(db, payload.promoListId)


# --- Эндпоинты: Переменные ---

@router.post("/variables", response_model=List[PromoVariableInfo])
def get_variables(payload: GetVariablesPayload, db: Session = Depends(get_db)):
    """Получить доступные переменные промокодов для шаблонов."""
    return promo_list_service.get_variables(db, payload.projectId)
