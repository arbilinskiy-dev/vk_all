# ===============================================
# BATCH ROUTER — раздельные эндпоинты для массовой
# загрузки каждого типа данных.
# Каждый эндпоинт = 1 SQL-запрос + 1 HTTP-запрос.
# Фронтенд вызывает все 6 параллельно через Promise.all.
# ===============================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

import schemas
from crud import batch_crud
from database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/getPostsBatch")
def get_posts_batch(
    payload: schemas.ProjectIdsPayload,
    db: Session = Depends(get_db)
):
    """Опубликованные посты для массива проектов (1 SQL-запрос)."""
    try:
        result = batch_crud.get_posts_batch(db, payload.projectIds)
        return result
    except Exception as e:
        logger.error(f"[getPostsBatch] Ошибка: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/getScheduledPostsBatch")
def get_scheduled_posts_batch(
    payload: schemas.ProjectIdsPayload,
    db: Session = Depends(get_db)
):
    """Отложенные посты для массива проектов (1 SQL-запрос)."""
    return batch_crud.get_scheduled_posts_batch(db, payload.projectIds)


@router.post("/getSuggestedPostsBatch")
def get_suggested_posts_batch(
    payload: schemas.ProjectIdsPayload,
    db: Session = Depends(get_db)
):
    """Предложенные посты для массива проектов (1 SQL-запрос)."""
    return batch_crud.get_suggested_posts_batch(db, payload.projectIds)


@router.post("/getSystemPostsBatch")
def get_system_posts_batch(
    payload: schemas.ProjectIdsPayload,
    db: Session = Depends(get_db)
):
    """Активные системные посты для массива проектов (1 SQL-запрос)."""
    return batch_crud.get_system_posts_batch(db, payload.projectIds)


@router.post("/getNotesBatch")
def get_notes_batch(
    payload: schemas.ProjectIdsPayload,
    db: Session = Depends(get_db)
):
    """Заметки для массива проектов (1 SQL-запрос)."""
    return batch_crud.get_notes_batch(db, payload.projectIds)


@router.post("/getStoriesBatch")
def get_stories_batch(
    payload: schemas.ProjectIdsPayload,
    db: Session = Depends(get_db)
):
    """Stories из кеша БД для массива проектов (1 SQL-запрос, без VK API)."""
    try:
        logger.info(f"[getStoriesBatch] Загрузка stories для {len(payload.projectIds)} проектов")
        result = batch_crud.get_stories_batch(db, payload.projectIds)
        total = sum(len(v) for v in result.values())
        logger.info(f"[getStoriesBatch] Загружено {total} stories")
        return result
    except Exception as e:
        logger.error(f"[getStoriesBatch] Ошибка: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
