"""
Сервисный слой для списков промокодов.
Бизнес-логика: CRUD для списков и промокодов + подстановка переменных.
"""

import re
import logging
from typing import List, Optional, Dict, Any, Tuple

from sqlalchemy.orm import Session
from fastapi import HTTPException

from crud import promo_list_crud
from schemas.models.promo_lists import (
    PromoList as PromoListSchema,
    PromoCode as PromoCodeSchema,
    PromoListCreate,
    PromoListUpdate,
    PromoCodeCreate,
    PromoCodesListResponse,
    PromoVariableInfo,
)

logger = logging.getLogger(__name__)


def _serialize_list(db_list, total_count: int = 0, free_count: int = 0, issued_count: int = 0) -> PromoListSchema:
    """Конвертация ORM-объекта списка в Pydantic-схему."""
    return PromoListSchema(
        id=db_list.id,
        project_id=db_list.project_id,
        name=db_list.name,
        slug=db_list.slug,
        is_one_time=db_list.is_one_time,
        created_at=db_list.created_at,
        updated_at=db_list.updated_at,
        total_count=total_count,
        free_count=free_count,
        issued_count=issued_count,
    )


def _serialize_code(db_code) -> PromoCodeSchema:
    """Конвертация ORM-объекта промокода в Pydantic-схему."""
    return PromoCodeSchema(
        id=db_code.id,
        promo_list_id=db_code.promo_list_id,
        code=db_code.code,
        description=db_code.description,
        status=db_code.status,
        issued_to_user_id=db_code.issued_to_user_id,
        issued_to_user_name=db_code.issued_to_user_name,
        issued_at=db_code.issued_at,
        issued_in_project_id=db_code.issued_in_project_id,
        issued_message_id=db_code.issued_message_id,
        sort_order=db_code.sort_order,
        created_at=db_code.created_at,
    )


# ===== Списки =====

def get_lists(db: Session, project_id: str) -> List[PromoListSchema]:
    """Получить все списки промокодов проекта с агрегацией."""
    results = promo_list_crud.get_lists_by_project_id(db, project_id)
    return [
        _serialize_list(
            r["list"],
            total_count=r["total_count"],
            free_count=r["free_count"],
            issued_count=r["issued_count"],
        )
        for r in results
    ]


def create_list(db: Session, project_id: str, data: PromoListCreate) -> PromoListSchema:
    """Создать новый список промокодов."""
    # Проверяем уникальность slug в рамках проекта
    existing = promo_list_crud.get_list_by_slug(db, project_id, data.slug)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Список с slug '{data.slug}' уже существует в этом проекте"
        )

    db_list = promo_list_crud.create_list(
        db=db,
        project_id=project_id,
        name=data.name,
        slug=data.slug,
        is_one_time=data.is_one_time,
    )
    return _serialize_list(db_list, total_count=0, free_count=0, issued_count=0)


def update_list(db: Session, list_id: str, data: PromoListUpdate) -> PromoListSchema:
    """Обновить список промокодов."""
    # Если меняется slug — проверяем уникальность
    if data.slug is not None:
        existing_list = promo_list_crud.get_list_by_id(db, list_id)
        if existing_list and data.slug != existing_list.slug:
            dup = promo_list_crud.get_list_by_slug(db, existing_list.project_id, data.slug)
            if dup:
                raise HTTPException(
                    status_code=400,
                    detail=f"Список с slug '{data.slug}' уже существует в этом проекте"
                )

    db_list = promo_list_crud.update_list(
        db=db,
        list_id=list_id,
        name=data.name,
        slug=data.slug,
        is_one_time=data.is_one_time,
    )
    if not db_list:
        raise HTTPException(status_code=404, detail=f"Список с id {list_id} не найден")

    counts = promo_list_crud.get_codes_count(db, list_id)
    return _serialize_list(db_list, **counts)


def delete_list(db: Session, list_id: str) -> dict:
    """Удалить список (CASCADE удалит все промокоды)."""
    success = promo_list_crud.delete_list(db, list_id)
    if not success:
        logger.warning(f"Список промокодов с id {list_id} не найден для удаления, продолжаем.")
    return {"success": True}


# ===== Промокоды =====

def get_codes(db: Session, promo_list_id: str, status_filter: Optional[str] = None) -> PromoCodesListResponse:
    """Получить промокоды списка с фильтрацией."""
    codes = promo_list_crud.get_codes_by_list_id(db, promo_list_id, status_filter)
    counts = promo_list_crud.get_codes_count(db, promo_list_id)

    return PromoCodesListResponse(
        codes=[_serialize_code(c) for c in codes],
        total=counts["total"],
        free_count=counts["free"],
        issued_count=counts["issued"],
    )


def add_codes(db: Session, promo_list_id: str, codes_data: List[PromoCodeCreate]) -> dict:
    """Массовое добавление промокодов."""
    # Проверяем что список существует
    db_list = promo_list_crud.get_list_by_id(db, promo_list_id)
    if not db_list:
        raise HTTPException(status_code=404, detail="Список промокодов не найден")

    items = [{"code": c.code, "description": c.description or ""} for c in codes_data]
    added = promo_list_crud.bulk_add_codes(db, promo_list_id, items)
    return {"success": True, "added_count": added}


def delete_code(db: Session, code_id: str) -> dict:
    """Удалить один промокод (только свободный)."""
    success = promo_list_crud.delete_code(db, code_id)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Промокод не найден или уже выдан (выданные нельзя удалять)"
        )
    return {"success": True}


def delete_all_free(db: Session, promo_list_id: str) -> dict:
    """Удалить все свободные промокоды в списке."""
    deleted = promo_list_crud.delete_all_free_codes(db, promo_list_id)
    return {"success": True, "deleted_count": deleted}


def get_variables(db: Session, project_id: str) -> List[PromoVariableInfo]:
    """Получить список доступных переменных промокодов для шаблонов."""
    results = promo_list_crud.get_lists_by_project_id(db, project_id)
    variables = []
    for r in results:
        lst = r["list"]
        variables.append(PromoVariableInfo(
            list_name=lst.name,
            slug=lst.slug,
            code_variable=f"{{promo_{lst.slug}_code}}",
            description_variable=f"{{promo_{lst.slug}_description}}",
            free_count=r["free_count"],
        ))
    return variables


# ===== Подстановка переменных промокодов в текст =====

def substitute_promo_variables(
    db: Session,
    text: str,
    project_id: str,
    user_id: Optional[int] = None,
    user_name: Optional[str] = None,
    message_id: Optional[str] = None,
    dry_run: bool = False,
) -> str:
    """
    Находит плейсхолдеры {promo_<slug>_code} и {promo_<slug>_description} в тексте
    и заменяет их на значения из таблицы промокодов.

    При dry_run=True (для предпросмотра) — НЕ помечает промокоды как выданные,
    показывает плейсхолдеры вида [Промокод: sale100] / [Описание: sale100].

    При dry_run=False (для реальной отправки) — атомарно забирает свободный промокод
    и помечает как выданный.
    """
    if not text or '{promo_' not in text:
        return text

    logger.info(f"PROMO: Подстановка промо-переменных для проекта {project_id} (dry_run={dry_run})...")

    # Находим все уникальные slug из плейсхолдеров
    slugs = set(re.findall(r'\{promo_(\w+?)_(?:code|description)\}', text))

    if not slugs:
        return text

    # Кэш: slug → acquired PromoCode (чтобы _code и _description брались из одного промокода)
    acquired_codes: Dict[str, Any] = {}

    for slug in slugs:
        # Находим список по slug
        promo_list = promo_list_crud.get_list_by_slug(db, project_id, slug)
        if not promo_list:
            logger.warning(f"PROMO: Список с slug '{slug}' не найден, плейсхолдеры останутся пустыми.")
            acquired_codes[slug] = None
            continue

        if dry_run:
            # Для предпросмотра — подсматриваем реальный свободный промокод,
            # но НЕ забираем его (статус не меняется)
            peeked = promo_list_crud.peek_free_code(db, promo_list.id)
            if peeked:
                acquired_codes[slug] = {
                    "code": peeked.code,
                    "description": peeked.description or "",
                }
            else:
                # Нет свободных — показываем предупреждение
                acquired_codes[slug] = {
                    "code": "[нет свободных промокодов]",
                    "description": "[нет свободных промокодов]",
                }
        else:
            # Реальная отправка — атомарно забираем свободный промокод
            code = promo_list_crud.acquire_free_code(
                db=db,
                promo_list_id=promo_list.id,
                user_id=user_id or 0,
                user_name=user_name or "Неизвестный",
                project_id=project_id,
                message_id=message_id,
            )
            if code:
                acquired_codes[slug] = {
                    "code": code.code,
                    "description": code.description or "",
                }
                logger.info(f"PROMO: Выдан промокод '{code.code}' из списка '{slug}' пользователю {user_id}")
            else:
                logger.warning(f"PROMO: Нет свободных промокодов в списке '{slug}'!")
                acquired_codes[slug] = None

    # Подстановка
    def replace_match(match):
        full = match.group(0)
        slug_name = match.group(1)
        var_type = match.group(2)  # "code" или "description"

        data = acquired_codes.get(slug_name)
        if data is None:
            # Нет свободных или список не найден → пустая строка
            return ''

        return data.get(var_type, '')

    result = re.sub(r'\{promo_(\w+?)_(code|description)\}', replace_match, text)
    logger.info("PROMO: Подстановка завершена.")
    return result
