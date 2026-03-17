"""
Хелперы для DLVRY-роутера — общие утилиты, убирающие дублирование.
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException


def resolve_affiliate_id(
    db: Session,
    project_id: Optional[str],
    affiliate_id: Optional[str],
    *,
    raise_if_missing: bool = True,
) -> Optional[str]:
    """
    Определить affiliate_id по project_id (если не передан напрямую).
    Возвращает ПЕРВЫЙ активный affiliate_id.

    Для обратной совместимости — сначала смотрит в новую таблицу,
    потом fallback на Project.dlvry_affiliate_id.
    """
    if affiliate_id:
        return affiliate_id

    if project_id:
        # Сначала пробуем новую таблицу
        ids = resolve_affiliate_ids(db, project_id)
        if ids:
            return ids[0]

        # Fallback: старое поле в projects
        from models_library.projects import Project
        project = db.query(Project).filter(Project.id == project_id).first()
        if project and project.dlvry_affiliate_id:
            return project.dlvry_affiliate_id

    if raise_if_missing:
        raise HTTPException(
            status_code=400,
            detail="Нужен affiliate_id или project_id с настроенной DLVRY интеграцией",
        )
    return None


def resolve_affiliate_ids(
    db: Session,
    project_id: str,
    *,
    include_inactive: bool = False,
) -> List[str]:
    """
    Получить ВСЕ affiliate_id для проекта из таблицы dlvry_project_affiliates.
    По умолчанию — только активные (is_active=True).

    Если новая таблица пуста — fallback на Project.dlvry_affiliate_id.
    """
    from crud.dlvry_affiliate_crud import get_active_affiliates_by_project, get_affiliates_by_project

    if include_inactive:
        affiliates = get_affiliates_by_project(db, project_id)
    else:
        affiliates = get_active_affiliates_by_project(db, project_id)

    ids = [a.affiliate_id for a in affiliates]

    if not ids:
        # Fallback: старое поле
        from models_library.projects import Project
        project = db.query(Project).filter(Project.id == project_id).first()
        if project and project.dlvry_affiliate_id:
            ids = [project.dlvry_affiliate_id]

    return ids
