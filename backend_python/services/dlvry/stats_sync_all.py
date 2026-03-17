"""
Синхронизация статистики DLVRY для всех проектов (nightly job).
"""

import logging
from typing import Dict, Any

from sqlalchemy.orm import Session

from config import settings
from services.dlvry.stats_sync_service import sync_dlvry_stats_for_project
from crud.dlvry_affiliate_crud import get_all_active_affiliates
from models_library.projects import Project

logger = logging.getLogger(__name__)


def sync_all_projects(db: Session) -> Dict[str, Any]:
    """
    Синхронизирует статистику DLVRY для ВСЕХ проектов с настроенным dlvry_affiliate_id.
    Используется планировщиком (раз в сутки).

    Returns:
        {"total_projects": int, "synced": int, "errors": int, "details": [...]}
    """
    token = settings.dlvry_token
    if not token:
        logger.warning("[DLVRY Sync] DLVRY_TOKEN не настроен — пропускаем синхронизацию")
        return {"total_projects": 0, "synced": 0, "errors": 0, "details": []}

    # --- Новая таблица: собираем все активные affiliate-записи ---
    active_affiliates = get_all_active_affiliates(db)

    # --- Fallback: проекты со старым полем, которых нет в новой таблице ---
    new_table_project_ids = {a.project_id for a in active_affiliates}
    legacy_projects = db.query(Project).filter(
        Project.dlvry_affiliate_id.isnot(None),
        Project.dlvry_affiliate_id != '',
        ~Project.id.in_(new_table_project_ids) if new_table_project_ids else True,
    ).all()

    # Формируем единый список (project_id, affiliate_id, project_name) для итерации
    sync_items: list[tuple[str, str, str]] = []
    for a in active_affiliates:
        project = db.query(Project).filter(Project.id == a.project_id).first()
        project_name = project.name if project else "?"
        sync_items.append((a.project_id, a.affiliate_id, project_name))
    for p in legacy_projects:
        sync_items.append((p.id, p.dlvry_affiliate_id, p.name))

    if not sync_items:
        logger.info("[DLVRY Sync] Нет проектов с настроенным DLVRY — пропускаем")
        return {"total_projects": 0, "synced": 0, "errors": 0, "details": []}

    results = []
    synced_count = 0
    error_count = 0

    for project_id, affiliate_id, project_name in sync_items:
        try:
            result = sync_dlvry_stats_for_project(
                db=db,
                project_id=project_id,
                affiliate_id=affiliate_id,
            )
            results.append({
                "project_id": project_id,
                "project_name": project_name,
                "affiliate_id": affiliate_id,
                **result,
            })
            if result["success"]:
                synced_count += 1
            else:
                error_count += 1
        except Exception as e:
            logger.error(f"[DLVRY Sync] Ошибка проекта {project_id} / affiliate {affiliate_id}: {e}", exc_info=True)
            results.append({
                "project_id": project_id,
                "project_name": project_name,
                "affiliate_id": affiliate_id,
                "success": False,
                "error": str(e),
            })
            error_count += 1

    unique_projects = len({item[0] for item in sync_items})
    logger.info(
        f"[DLVRY Sync] Итого: {unique_projects} проектов ({len(sync_items)} филиалов), "
        f"{synced_count} синхронизировано, {error_count} ошибок"
    )

    return {
        "total_projects": unique_projects,
        "total_affiliates": len(sync_items),
        "synced": synced_count,
        "errors": error_count,
        "details": results,
    }
