"""
Сервис синхронизации статистики DLVRY.
Запрашивает данные из DLVRY API и записывает в таблицу dlvry_daily_stats.
Поддерживает инкрементальную дозапись (sync с последней даты).
"""

import asyncio
import logging
import json
from datetime import datetime, timedelta, date
from typing import Optional, Dict, Any, Generator

from sqlalchemy.orm import Session

from config import settings
from services.dlvry.dlvry_client import DlvryApiClient
from crud.dlvry_daily_stats_crud import bulk_upsert_daily_stats, get_last_synced_date
from models_library.projects import Project

logger = logging.getLogger(__name__)

# Формат дат DLVRY API
DATE_FMT = "%d.%m.%Y"

# Лимит DLVRY API на один запрос (дней)
MAX_CHUNK_DAYS = 89  # API лимит 90, берём 89 для безопасности


def _run_async(coro):
    """Запустить корутину синхронно (с учётом уже запущенного event loop)."""
    try:
        return asyncio.run(coro)
    except RuntimeError:
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(coro)
        finally:
            loop.close()


def _daily_item_to_dict(d) -> dict:
    """Преобразовать DlvryDailyItem в dict для bulk_upsert."""
    return {
        'date': d.date,
        'count': d.count,
        'sum': d.sum,
        'first_orders': d.first_orders,
        'avg_check': d.avg_check,
        # Отмены
        'canceled': d.canceled,
        'canceled_sum': d.canceled_sum,
        # Финансы
        'cost': d.cost,
        'discount': d.discount,
        'first_orders_sum': d.first_orders_sum,
        'first_orders_cost': d.first_orders_cost,
        # Клиенты
        'unique_clients': d.unique_clients,
        # Оплата
        'sum_cash': d.sum_cash,
        'count_payment_cash': d.count_payment_cash,
        'sum_card': d.sum_card,
        'count_payment_card': d.count_payment_card,
        'count_payment_online': d.count_payment_online,
        'sum_online_success': d.sum_online_success,
        'sum_online_fail': d.sum_online_fail,
        # Источники
        'source_site': d.source_site,
        'sum_source_site': d.sum_source_site,
        'source_vkapp': d.source_vkapp,
        'sum_source_vkapp': d.sum_source_vkapp,
        'source_ios': d.source_ios,
        'sum_source_ios': d.sum_source_ios,
        'source_android': d.source_android,
        'sum_source_android': d.sum_source_android,
        # Доставка
        'delivery_self_count': d.delivery_self_count,
        'delivery_self_sum': d.delivery_self_sum,
        'delivery_count': d.delivery_count,
        'delivery_sum': d.delivery_sum,
        # Повторные заказы
        'repeat_order_2': d.repeat_order_2,
        'repeat_order_3': d.repeat_order_3,
        'repeat_order_4': d.repeat_order_4,
        'repeat_order_5': d.repeat_order_5,
    }


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
    """
    Полная загрузка (не стриминг): вызывает генератор и собирает итоговый результат.
    """
    result: Dict[str, Any] = {
        "success": False, "synced_days": 0,
        "date_from": end_date.isoformat(), "date_to": end_date.isoformat(),
    }
    for event in _sync_full_backwards_gen(db, project_id, affiliate_id, token, end_date, max_empty_chunks):
        if event.get("done"):
            result = event
    return result


def _sync_full_backwards_gen(
    db: Session,
    project_id: str,
    affiliate_id: str,
    token: str,
    end_date: date,
    max_empty_chunks: int = 2,
) -> Generator[Dict[str, Any], None, None]:
    """
    Генератор полной загрузки: идёт батчами назад от end_date.
    После каждого непустого чанка сохраняет данные в БД и yield-ит прогресс.
    Останавливается после max_empty_chunks подряд пустых ответов.

    Yields:
        {"chunk": N, "synced_days": M, "total_days": X, "total_orders": Y,
         "total_revenue": Z, "date_from": str, "date_to": str, "done": False}
    Финальный yield:
        {..., "done": True, "success": True}
    """
    client = DlvryApiClient(token=token)
    total_synced = 0
    total_count = 0
    total_sum = 0.0
    chunk_errors = []
    consecutive_empty = 0
    earliest_date = end_date
    latest_date = end_date

    chunk_to = end_date
    chunk_num = 0

    logger.info(
        f"[DLVRY Sync] Проект {project_id}: полная загрузка (streaming), "
        f"батчами назад от {end_date}"
    )

    while True:
        chunk_num += 1
        chunk_from = chunk_to - timedelta(days=MAX_CHUNK_DAYS)

        logger.info(f"[DLVRY Sync]   чанк {chunk_num}: {chunk_from}—{chunk_to}")

        try:
            stats = _run_async(
                client.get_orders_stats(
                    affiliate_id=affiliate_id,
                    date_from=chunk_from.strftime(DATE_FMT),
                    date_to=chunk_to.strftime(DATE_FMT),
                )
            )
        except Exception as e:
            logger.error(f"[DLVRY Sync]   чанк {chunk_num} ошибка: {e}")
            chunk_errors.append(f"чанк {chunk_from}—{chunk_to}: {e}")
            chunk_to = chunk_from - timedelta(days=1)
            continue

        if stats is None or len(stats.daily_items) == 0:
            consecutive_empty += 1
            logger.info(
                f"[DLVRY Sync]   чанк {chunk_num}: пустой "
                f"({consecutive_empty}/{max_empty_chunks} подряд)"
            )
            if consecutive_empty >= max_empty_chunks:
                logger.info(
                    f"[DLVRY Sync]   Получено {max_empty_chunks} пустых чанков подряд — "
                    f"считаем, что данных больше нет"
                )
                break
        else:
            consecutive_empty = 0
            total_count += stats.total_count or 0
            total_sum += stats.total_sum or 0

            items = [_daily_item_to_dict(d) for d in stats.daily_items]

            # Сохраняем чанк в БД СРАЗУ — данные доступны в интерфейсе
            synced = bulk_upsert_daily_stats(
                db=db,
                affiliate_id=affiliate_id,
                project_id=project_id,
                items=items,
            )
            total_synced += synced

            if chunk_from < earliest_date:
                earliest_date = chunk_from

            # Yield прогресс
            yield {
                "chunk": chunk_num,
                "synced_days": synced,
                "total_days": total_synced,
                "total_orders": total_count,
                "total_revenue": total_sum,
                "date_from": earliest_date.isoformat(),
                "date_to": latest_date.isoformat(),
                "done": False,
            }

        # Двигаемся к предыдущему чанку
        chunk_to = chunk_from - timedelta(days=1)

        # Защита от бесконечного цикла: максимум ~10 лет назад
        if chunk_num > 40:
            logger.warning("[DLVRY Sync]   Достигнут лимит глубины (40 чанков), останавливаемся")
            break

    logger.info(
        f"[DLVRY Sync] Проект {project_id} (affiliate={affiliate_id}): "
        f"полная загрузка — {total_synced} дней ({earliest_date} — {latest_date}), "
        f"{chunk_num} чанков запрошено"
    )

    # Финальный event
    yield {
        "chunk": chunk_num,
        "synced_days": 0,
        "total_days": total_synced,
        "total_orders": total_count,
        "total_revenue": total_sum,
        "date_from": earliest_date.isoformat(),
        "date_to": latest_date.isoformat(),
        "done": True,
        "success": total_synced > 0 or not chunk_errors,
        "error": "; ".join(chunk_errors) if chunk_errors else None,
    }


def _sync_date_range(
    db: Session,
    project_id: str,
    affiliate_id: str,
    token: str,
    dt_from: date,
    dt_to: date,
) -> Dict[str, Any]:
    """
    Синхронизация за конкретный диапазон дат (разбивается на чанки по MAX_CHUNK_DAYS).
    Используется для инкрементальной синхронизации и пресетов с конкретным периодом.
    """

    # Разбиваем на чанки по MAX_CHUNK_DAYS (API лимит 90 дней)
    chunks = []
    chunk_start = dt_from
    while chunk_start <= dt_to:
        chunk_end = min(chunk_start + timedelta(days=MAX_CHUNK_DAYS), dt_to)
        chunks.append((chunk_start, chunk_end))
        chunk_start = chunk_end + timedelta(days=1)

    logger.info(
        f"[DLVRY Sync] Проект {project_id}: диапазон {dt_from}—{dt_to}, "
        f"разбито на {len(chunks)} чанк(ов)"
    )

    # Запрашиваем данные из DLVRY API чанками
    client = DlvryApiClient(token=token)
    items = []
    total_count = 0
    total_sum = 0.0
    chunk_errors = []

    for i, (c_from, c_to) in enumerate(chunks, 1):
        logger.info(f"[DLVRY Sync]   чанк {i}/{len(chunks)}: {c_from}—{c_to}")
        try:
            stats = _run_async(
                client.get_orders_stats(
                    affiliate_id=affiliate_id,
                    date_from=c_from.strftime(DATE_FMT),
                    date_to=c_to.strftime(DATE_FMT),
                )
            )
        except Exception as e:
            logger.error(f"[DLVRY Sync]   чанк {i} ошибка: {e}")
            chunk_errors.append(f"чанк {c_from}—{c_to}: {e}")
            continue

        if stats is None:
            chunk_errors.append(f"чанк {c_from}—{c_to}: пустой ответ")
            continue

        total_count += stats.total_count or 0
        total_sum += stats.total_sum or 0

        for d in stats.daily_items:
            items.append(_daily_item_to_dict(d))

    if not items and chunk_errors:
        return {
            "success": False,
            "synced_days": 0,
            "date_from": dt_from.isoformat(),
            "date_to": dt_to.isoformat(),
            "error": "; ".join(chunk_errors),
        }

    # Записываем в БД
    synced = bulk_upsert_daily_stats(
        db=db,
        affiliate_id=affiliate_id,
        project_id=project_id,
        items=items,
    )

    logger.info(
        f"[DLVRY Sync] Проект {project_id} (affiliate={affiliate_id}): "
        f"синхронизировано {synced} дней ({dt_from} — {dt_to})"
    )

    return {
        "success": True,
        "synced_days": synced,
        "date_from": dt_from.isoformat(),
        "date_to": dt_to.isoformat(),
        "total_orders": total_count,
        "total_revenue": total_sum,
        "error": "; ".join(chunk_errors) if chunk_errors else None,
    }


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

    # Находим все проекты с DLVRY
    projects = db.query(Project).filter(
        Project.dlvry_affiliate_id.isnot(None),
        Project.dlvry_affiliate_id != '',
    ).all()

    if not projects:
        logger.info("[DLVRY Sync] Нет проектов с настроенным DLVRY — пропускаем")
        return {"total_projects": 0, "synced": 0, "errors": 0, "details": []}

    results = []
    synced_count = 0
    error_count = 0

    for project in projects:
        try:
            result = sync_dlvry_stats_for_project(
                db=db,
                project_id=project.id,
                affiliate_id=project.dlvry_affiliate_id,
            )
            results.append({
                "project_id": project.id,
                "project_name": project.name,
                "affiliate_id": project.dlvry_affiliate_id,
                **result,
            })
            if result["success"]:
                synced_count += 1
            else:
                error_count += 1
        except Exception as e:
            logger.error(f"[DLVRY Sync] Ошибка проекта {project.id}: {e}", exc_info=True)
            results.append({
                "project_id": project.id,
                "project_name": project.name,
                "affiliate_id": project.dlvry_affiliate_id,
                "success": False,
                "error": str(e),
            })
            error_count += 1

    logger.info(
        f"[DLVRY Sync] Итого: {len(projects)} проектов, "
        f"{synced_count} синхронизировано, {error_count} ошибок"
    )

    return {
        "total_projects": len(projects),
        "synced": synced_count,
        "errors": error_count,
        "details": results,
    }
