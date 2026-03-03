"""
CRUD-операции для списков промокодов.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func, case
import uuid
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

import models

logger = logging.getLogger(__name__)


# ===============================================
# PROMO LISTS (списки промокодов)
# ===============================================

def get_lists_by_project_id(db: Session, project_id: str) -> List[Dict[str, Any]]:
    """
    Получить все списки промокодов проекта с агрегированными счётчиками.
    Один SQL-запрос: JOIN + GROUP BY вместо N+1.
    """
    results = (
        db.query(
            models.PromoList,
            sa_func.count(models.PromoListCode.id).label("total_count"),
            sa_func.sum(case((models.PromoListCode.status == "free", 1), else_=0)).label("free_count"),
            sa_func.sum(case((models.PromoListCode.status == "issued", 1), else_=0)).label("issued_count"),
        )
        .outerjoin(models.PromoListCode, models.PromoListCode.promo_list_id == models.PromoList.id)
        .filter(models.PromoList.project_id == project_id)
        .group_by(models.PromoList.id)
        .order_by(models.PromoList.created_at.desc())
        .all()
    )

    return [
        {
            "list": r[0],
            "total_count": r[1] or 0,
            "free_count": int(r[2] or 0),
            "issued_count": int(r[3] or 0),
        }
        for r in results
    ]


def get_list_by_id(db: Session, list_id: str) -> Optional[models.PromoList]:
    """Получить список по ID."""
    return db.query(models.PromoList).filter(models.PromoList.id == list_id).first()


def get_list_by_slug(db: Session, project_id: str, slug: str) -> Optional[models.PromoList]:
    """Получить список по slug в рамках проекта."""
    return (
        db.query(models.PromoList)
        .filter(models.PromoList.project_id == project_id, models.PromoList.slug == slug)
        .first()
    )


def create_list(
    db: Session,
    project_id: str,
    name: str,
    slug: str,
    is_one_time: bool = True,
) -> models.PromoList:
    """Создать новый список промокодов."""
    db_list = models.PromoList(
        id=str(uuid.uuid4()),
        project_id=project_id,
        name=name,
        slug=slug,
        is_one_time=is_one_time,
    )
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    return db_list


def update_list(
    db: Session,
    list_id: str,
    name: Optional[str] = None,
    slug: Optional[str] = None,
    is_one_time: Optional[bool] = None,
) -> Optional[models.PromoList]:
    """Обновить список. Возвращает None если не найден."""
    db_list = db.query(models.PromoList).filter(models.PromoList.id == list_id).first()
    if not db_list:
        return None

    if name is not None:
        db_list.name = name
    if slug is not None:
        db_list.slug = slug
    if is_one_time is not None:
        db_list.is_one_time = is_one_time

    db.commit()
    db.refresh(db_list)
    return db_list


def delete_list(db: Session, list_id: str) -> bool:
    """Удалить список (CASCADE удалит все промокоды). Возвращает True если удалён."""
    deleted_count = db.query(models.PromoList).filter(models.PromoList.id == list_id).delete()
    db.commit()
    return deleted_count > 0


# ===============================================
# PROMO CODES (промокоды внутри списков)
# ===============================================

def get_codes_by_list_id(
    db: Session,
    promo_list_id: str,
    status_filter: Optional[str] = None,
) -> List[models.PromoListCode]:
    """
    Получить промокоды списка. Свободные сверху, выданные снизу.
    status_filter: "free" | "issued" | None (все).
    """
    query = db.query(models.PromoListCode).filter(models.PromoListCode.promo_list_id == promo_list_id)

    if status_filter:
        query = query.filter(models.PromoListCode.status == status_filter)

    # Свободные первыми, затем по sort_order, затем по дате создания
    query = query.order_by(
        # free=0, issued=1 → свободные сверху
        case((models.PromoListCode.status == "free", 0), else_=1),
        models.PromoListCode.sort_order,
        models.PromoListCode.created_at,
    )

    return query.all()


def get_codes_count(db: Session, promo_list_id: str) -> Dict[str, int]:
    """Получить количество промокодов по статусам."""
    result = (
        db.query(
            sa_func.count(models.PromoListCode.id).label("total"),
            sa_func.sum(case((models.PromoListCode.status == "free", 1), else_=0)).label("free"),
            sa_func.sum(case((models.PromoListCode.status == "issued", 1), else_=0)).label("issued"),
        )
        .filter(models.PromoListCode.promo_list_id == promo_list_id)
        .first()
    )

    return {
        "total": result[0] or 0,
        "free": int(result[1] or 0),
        "issued": int(result[2] or 0),
    }


def bulk_add_codes(
    db: Session,
    promo_list_id: str,
    codes_data: List[Dict[str, str]],
) -> int:
    """
    Массовое добавление промокодов.
    codes_data: [{"code": "...", "description": "..."}]
    Возвращает количество добавленных.
    """
    if not codes_data:
        return 0

    # Получаем текущий max sort_order
    max_order = (
        db.query(sa_func.max(models.PromoListCode.sort_order))
        .filter(models.PromoListCode.promo_list_id == promo_list_id)
        .scalar()
    ) or 0

    new_codes = []
    for i, item in enumerate(codes_data):
        new_codes.append(models.PromoListCode(
            id=str(uuid.uuid4()),
            promo_list_id=promo_list_id,
            code=item["code"],
            description=item.get("description", ""),
            status="free",
            sort_order=max_order + i + 1,
        ))

    db.bulk_save_objects(new_codes)
    db.commit()
    return len(new_codes)


def delete_code(db: Session, code_id: str) -> bool:
    """Удалить один промокод. Возвращает True если удалён."""
    deleted = db.query(models.PromoListCode).filter(
        models.PromoListCode.id == code_id,
        models.PromoListCode.status == "free",  # Нельзя удалять выданные
    ).delete(synchronize_session=False)
    db.commit()
    return deleted > 0


def delete_all_free_codes(db: Session, promo_list_id: str) -> int:
    """Удалить все свободные промокоды в списке. Возвращает количество удалённых."""
    deleted = db.query(models.PromoListCode).filter(
        models.PromoListCode.promo_list_id == promo_list_id,
        models.PromoListCode.status == "free",
    ).delete(synchronize_session=False)
    db.commit()
    return deleted


def peek_free_code(db: Session, promo_list_id: str) -> Optional[models.PromoListCode]:
    """
    Подсмотреть первый свободный промокод БЕЗ его резервирования.
    Используется для предпросмотра (dry_run) — показывает реальные данные,
    но не меняет статус промокода.
    """
    return (
        db.query(models.PromoListCode)
        .filter(
            models.PromoListCode.promo_list_id == promo_list_id,
            models.PromoListCode.status == "free",
        )
        .order_by(models.PromoListCode.sort_order, models.PromoListCode.created_at)
        .first()
    )


def acquire_free_code(
    db: Session,
    promo_list_id: str,
    user_id: int,
    user_name: str,
    project_id: str,
    message_id: Optional[str] = None,
) -> Optional[models.PromoListCode]:
    """
    Атомарно забирает следующий свободный промокод и помечает его как выданный.
    Использует SELECT ... FOR UPDATE для предотвращения race condition.
    Возвращает None если свободных промокодов нет.
    """
    # Берём первый свободный промокод (с блокировкой строки)
    code = (
        db.query(models.PromoListCode)
        .filter(
            models.PromoListCode.promo_list_id == promo_list_id,
            models.PromoListCode.status == "free",
        )
        .order_by(models.PromoListCode.sort_order, models.PromoListCode.created_at)
        .with_for_update()
        .first()
    )

    if not code:
        return None

    # Помечаем как выданный
    code.status = "issued"
    code.issued_to_user_id = user_id
    code.issued_to_user_name = user_name
    code.issued_at = datetime.utcnow()
    code.issued_in_project_id = project_id
    code.issued_message_id = message_id

    db.commit()
    db.refresh(code)
    return code
