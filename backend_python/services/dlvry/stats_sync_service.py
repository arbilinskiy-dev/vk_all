"""
Сервис синхронизации статистики DLVRY.
Хаб-модуль: ядро синхронизации → stats_sync_core, nightly job → stats_sync_all,
фоновая загрузка → stats_sync_background.
"""

import logging
from datetime import timedelta, date
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session

from config import settings
from crud.dlvry_daily_stats_crud import get_last_synced_date
from services.dlvry.stats_sync_core import (
    sync_full_backwards_gen as _sync_full_backwards_gen,
    sync_date_range as _sync_date_range,
)

logger = logging.getLogger(__name__)

# Формат дат DLVRY API
DATE_FMT = "%d.%m.%Y"

def sync_dlvry_stats_for_project(
    db: Session,
    project_id: str,
    affiliate_id: str,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    force_full: bool = False,
) -> Dict[str, Any]:
    """
    Синхронизирует статистику DLVRY для одного проекта.

    Логика:
    1. Если date_from/date_to указаны — запрашиваем именно этот диапазон (чанками по 89 дней)
    2. Если force_full — идём батчами назад от вчера, пока не получим пустой ответ
    3. Иначе — инкрементально: от последней даты в БД до вчера

    Returns:
        {"success": bool, "synced_days": int, "date_from": str, "date_to": str, "error": str|None}
    """
    token = settings.dlvry_token
    if not token:
        return {"success": False, "synced_days": 0, "error": "DLVRY_TOKEN не настроен"}

    today = date.today()
    yesterday = today - timedelta(days=1)

    # ── force_full: идём батчами назад до пустого ответа ──────────────
    if force_full and not (date_from and date_to):
        return _sync_full_backwards(
            db=db,
            project_id=project_id,
            affiliate_id=affiliate_id,
            token=token,
            end_date=yesterday,
        )

    # ── Конкретный диапазон или инкрементальная синхронизация ──────────
    if date_from and date_to:
        dt_from = date_from
        dt_to = date_to
    else:
        # Инкрементальная синхронизация
        last_date = get_last_synced_date(db, affiliate_id)
        if last_date:
            # Перезаписываем последние 3 дня (на случай неполных данных) + дозаписываем новые
            dt_from = last_date - timedelta(days=2)
        else:
            # Первая синхронизация — берём последние 90 дней
            dt_from = today - timedelta(days=90)
        dt_to = yesterday

    return _sync_date_range(
        db=db,
        project_id=project_id,
        affiliate_id=affiliate_id,
        token=token,
        dt_from=dt_from,
        dt_to=dt_to,
    )


def _sync_full_backwards(
    db: Session,
    project_id: str,
    affiliate_id: str,
    token: str,
    end_date: date,
    max_empty_chunks: int = 2,
) -> Dict[str, Any]:
    """Полная загрузка (не стриминг): вызывает генератор и собирает итоговый результат."""
    result: Dict[str, Any] = {
        "success": False, "synced_days": 0,
        "date_from": end_date.isoformat(), "date_to": end_date.isoformat(),
    }
    for event in _sync_full_backwards_gen(db, project_id, affiliate_id, token, end_date, max_empty_chunks):
        if event.get("done"):
            result = event
    return result
