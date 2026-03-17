"""
Сервис синхронизации заказов DLVRY через hl-orders API.
Хаб-модуль: парсинг → order_parser, VK-профили → order_vk_profiles,
утилиты → dlvry_sync_utils.
"""

import logging
from datetime import datetime, timedelta, date
from typing import Optional, Dict, Any, Generator

from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func

from config import settings
from services.dlvry.dlvry_client import DlvryApiClient, DATE_FMT
from services.dlvry.dlvry_sync_utils import run_async
from services.dlvry.order_parser import save_order_from_api
from services.dlvry.order_vk_profiles import _vk_profile_cache
from services.dlvry.order_service import _safe_float
from models_library.dlvry_orders import DlvryOrder

logger = logging.getLogger(__name__)

# Лимит одного запроса к DLVRY API (дней).
MAX_CHUNK_DAYS = 30


def _get_last_order_date(db: Session, affiliate_id: str) -> Optional[date]:
    """Получить дату последнего заказа для affiliate."""
    row = db.query(sa_func.max(DlvryOrder.order_date)).filter(
        DlvryOrder.affiliate_id == affiliate_id,
    ).scalar()
    if row and isinstance(row, datetime):
        return row.date()
    return row


def sync_dlvry_orders_for_project(
    db: Session,
    project_id: str,
    affiliate_id: str,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> Dict[str, Any]:
    """
    Синхронизирует заказы DLVRY для одного проекта (инкрементально или за диапазон).

    Логика:
    1. Если date_from/date_to указаны — запрашиваем именно этот диапазон
    2. Иначе — инкрементально: от последнего заказа в БД до сегодня
    """
    token = settings.dlvry_token
    if not token:
        return {"success": False, "new_orders": 0, "error": "DLVRY_TOKEN не настроен"}

    today = date.today()

    if date_from and date_to:
        dt_from = date_from
        dt_to = date_to
    else:
        # Инкрементальная: от последнего заказа (- 2 дня запас) до сегодня
        last_date = _get_last_order_date(db, affiliate_id)
        if last_date:
            dt_from = last_date - timedelta(days=2)
        else:
            dt_from = today - timedelta(days=90)
        dt_to = today

    return _sync_orders_date_range(db, project_id, affiliate_id, token, dt_from, dt_to)


def _sync_orders_date_range(
    db: Session,
    project_id: str,
    affiliate_id: str,
    token: str,
    dt_from: date,
    dt_to: date,
) -> Dict[str, Any]:
    """Синхронизация заказов за конкретный диапазон (разбивается на чанки по 89 дней)."""
    _vk_profile_cache.clear()
    chunks = []
    chunk_start = dt_from
    while chunk_start <= dt_to:
        chunk_end = min(chunk_start + timedelta(days=MAX_CHUNK_DAYS), dt_to)
        chunks.append((chunk_start, chunk_end))
        chunk_start = chunk_end + timedelta(days=1)

    logger.info(
        f"[DLVRY Orders Sync] Проект {project_id}: диапазон {dt_from}—{dt_to}, "
        f"{len(chunks)} чанк(ов)"
    )

    client = DlvryApiClient(token=token)
    total_new = 0
    total_skipped = 0
    total_revenue = 0.0
    chunk_errors = []

    # Загружаем каталог товаров для маппинга item_id → name
    catalog = run_async(client.fetch_affiliate_items(affiliate_id))
    if catalog:
        logger.info(f"[DLVRY Orders Sync] Каталог загружен: {len(catalog)} товаров")

    for i, (c_from, c_to) in enumerate(chunks, 1):
        logger.info(f"[DLVRY Orders Sync]   чанк {i}/{len(chunks)}: {c_from}—{c_to}")
        try:
            orders = run_async(
                client.fetch_hl_orders(
                    affiliate_id=affiliate_id,
                    date_from=c_from.strftime(DATE_FMT),
                    date_to=c_to.strftime(DATE_FMT),
                )
            )
        except Exception as e:
            logger.error(f"[DLVRY Orders Sync]   чанк {i} ошибка: {e}")
            chunk_errors.append(f"чанк {c_from}—{c_to}: {e}")
            continue

        for order_payload in orders:
            saved = save_order_from_api(db, order_payload, affiliate_id, project_id, catalog=catalog)
            if saved:
                total_new += 1
                total_revenue += _safe_float(order_payload.get('total'))
            else:
                total_skipped += 1

    logger.info(
        f"[DLVRY Orders Sync] Проект {project_id}: "
        f"новых={total_new}, дубликатов={total_skipped}"
    )

    return {
        "success": True,
        "new_orders": total_new,
        "skipped_duplicates": total_skipped,
        "total_revenue": total_revenue,
        "date_from": dt_from.isoformat(),
        "date_to": dt_to.isoformat(),
        "error": "; ".join(chunk_errors) if chunk_errors else None,
    }


def sync_orders_full_backwards_gen(
    db: Session,
    project_id: str,
    affiliate_id: str,
    token: str,
    end_date: date,
    max_empty_chunks: int = 2,
) -> Generator[Dict[str, Any], None, None]:
    """
    Генератор полной загрузки заказов: идёт батчами назад от end_date.
    После каждого чанка сохраняет заказы в БД и yield-ит прогресс.
    Останавливается после max_empty_chunks подряд пустых ответов.

    Yields:
        {"chunk": N, "new_orders": M, "total_new": X, "total_revenue": Z,
         "date_from": str, "date_to": str, "done": False}
    Финальный yield:
        {..., "done": True, "success": True}
    """
    client = DlvryApiClient(token=token)
    total_new = 0
    total_skipped = 0
    total_revenue = 0.0
    chunk_errors = []
    consecutive_empty = 0
    earliest_date = end_date
    latest_date = end_date

    chunk_to = end_date
    chunk_num = 0

    # Загружаем каталог товаров для маппинга item_id → name
    catalog = run_async(client.fetch_affiliate_items(affiliate_id))
    if catalog:
        logger.info(f"[DLVRY Orders Sync] Каталог загружен: {len(catalog)} товаров")

    logger.info(
        f"[DLVRY Orders Sync] Проект {project_id}: полная загрузка (streaming), "
        f"батчами назад от {end_date}"
    )

    while True:
        chunk_num += 1
        chunk_from = chunk_to - timedelta(days=MAX_CHUNK_DAYS)

        logger.info(f"[DLVRY Orders Sync]   чанк {chunk_num}: {chunk_from}—{chunk_to}")

        try:
            orders = run_async(
                client.fetch_hl_orders(
                    affiliate_id=affiliate_id,
                    date_from=chunk_from.strftime(DATE_FMT),
                    date_to=chunk_to.strftime(DATE_FMT),
                )
            )
        except Exception as e:
            logger.error(f"[DLVRY Orders Sync]   чанк {chunk_num} ошибка: {e}")
            chunk_errors.append(f"чанк {chunk_from}—{chunk_to}: {e}")
            chunk_to = chunk_from - timedelta(days=1)
            continue

        if not orders:
            consecutive_empty += 1
            logger.info(
                f"[DLVRY Orders Sync]   чанк {chunk_num}: пустой "
                f"({consecutive_empty}/{max_empty_chunks} подряд)"
            )
            if consecutive_empty >= max_empty_chunks:
                logger.info(
                    f"[DLVRY Orders Sync]   Получено {max_empty_chunks} пустых чанков подряд — "
                    f"считаем, что данных больше нет"
                )
                break
        else:
            consecutive_empty = 0
            chunk_new = 0
            chunk_revenue = 0.0

            for order_payload in orders:
                saved = save_order_from_api(db, order_payload, affiliate_id, project_id, catalog=catalog)
                if saved:
                    chunk_new += 1
                    chunk_revenue += _safe_float(order_payload.get('total'))
                else:
                    total_skipped += 1

            total_new += chunk_new
            total_revenue += chunk_revenue

            if chunk_from < earliest_date:
                earliest_date = chunk_from

            # Yield прогресс
            yield {
                "chunk": chunk_num,
                "new_orders": chunk_new,
                "total_new": total_new,
                "total_skipped": total_skipped,
                "total_revenue": total_revenue,
                "date_from": earliest_date.isoformat(),
                "date_to": latest_date.isoformat(),
                "done": False,
            }

        # Двигаемся к предыдущему чанку
        chunk_to = chunk_from - timedelta(days=1)

        # Защита от бесконечного цикла: максимум ~10 лет назад
        if chunk_num > 40:
            logger.warning("[DLVRY Orders Sync]   Достигнут лимит глубины (40 чанков)")
            break

    logger.info(
        f"[DLVRY Orders Sync] Проект {project_id} (affiliate={affiliate_id}): "
        f"полная загрузка — {total_new} новых, {total_skipped} дубликатов, "
        f"{chunk_num} чанков ({earliest_date} — {latest_date})"
    )

    # Финальный event
    yield {
        "chunk": chunk_num,
        "new_orders": 0,
        "total_new": total_new,
        "total_skipped": total_skipped,
        "total_revenue": total_revenue,
        "date_from": earliest_date.isoformat(),
        "date_to": latest_date.isoformat(),
        "done": True,
        "success": True,
        "error": "; ".join(chunk_errors) if chunk_errors else None,
    }
