"""
API роутер для Конкурс 2.0
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas.contest_v2 import (
    ContestV2Response,
    ContestV2Create,
    ContestV2ListRequest,
    ContestV2GetRequest,
    ContestV2UpdateRequest,
    ContestV2DeleteRequest,
)
from crud import contest_v2_crud
import services.contest_v2_service as contest_v2_service

router = APIRouter(prefix="/api/contest-v2", tags=["contest-v2"])


@router.post("/list", response_model=List[ContestV2Response])
def list_contests(payload: ContestV2ListRequest, db: Session = Depends(get_db)):
    """Получить список конкурсов проекта"""
    contests = contest_v2_crud.get_contests_by_project(db, payload.project_id)
    return contests


@router.post("/get", response_model=ContestV2Response)
def get_contest(payload: ContestV2GetRequest, db: Session = Depends(get_db)):
    """Получить конкурс по ID"""
    contest = contest_v2_crud.get_contest_by_id(db, payload.contest_id)
    if not contest:
        raise HTTPException(status_code=404, detail="Конкурс не найден")
    return contest


@router.post("/create", response_model=ContestV2Response)
def create_contest(payload: ContestV2Create, db: Session = Depends(get_db)):
    """Создать новый конкурс"""
    contest = contest_v2_crud.create_contest(db, payload)
    
    # Синхронизируем стартовый пост с расписанием
    contest_v2_service.sync_contest_start_post(db, contest)
    
    # Перезагружаем для получения актуальных данных
    db.refresh(contest)
    return contest


@router.post("/update", response_model=ContestV2Response)
def update_contest(payload: ContestV2UpdateRequest, db: Session = Depends(get_db)):
    """Обновить конкурс"""
    contest = contest_v2_crud.update_contest(db, payload.contest_id, payload.contest)
    if not contest:
        raise HTTPException(status_code=404, detail="Конкурс не найден")
    
    # Синхронизируем стартовый пост с расписанием
    contest_v2_service.sync_contest_start_post(db, contest)
    
    # Перезагружаем для получения актуальных данных
    db.refresh(contest)
    return contest


@router.post("/delete")
def delete_contest(payload: ContestV2DeleteRequest, db: Session = Depends(get_db)):
    """Удалить конкурс"""
    # Сначала удаляем связанные посты
    contest_v2_service.delete_contest_posts(db, payload.contest_id)
    
    # Затем удаляем сам конкурс
    success = contest_v2_crud.delete_contest(db, payload.contest_id)
    if not success:
        raise HTTPException(status_code=404, detail="Конкурс не найден")
    return {"success": True, "message": "Конкурс удален"}
