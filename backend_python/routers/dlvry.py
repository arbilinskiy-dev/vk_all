"""
Роутер DLVRY Orders — приём вебхуков от DLVRY и управление заказами.

Эндпоинты:
  POST   /api/dlvry/webhook            — приём вебхука от DLVRY (колбэк по заказу)
  GET    /api/dlvry/orders              — список заказов (фильтрация + пагинация)
  GET    /api/dlvry/orders/stats        — агрегированная статистика
  GET    /api/dlvry/orders/{order_id}   — детали заказа (с позициями)
  GET    /api/dlvry/webhook-logs        — журнал вебхуков
  DELETE /api/dlvry/webhook-logs        — очистка журнала
  GET    /api/dlvry/stats/external      — статистика из DLVRY API (внешняя)
"""

from fastapi import APIRouter, Request, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from config import settings
from typing import Optional
from datetime import date, timedelta
import logging
import json

from schemas.dlvry_schemas import (
    DlvryWebhookResponse,
    DlvryOrdersListResponse,
    DlvryOrderStatsResponse,
    DlvryAffiliateResponse,
    DlvryAffiliateCreatePayload,
    DlvryAffiliateUpdatePayload,
    DlvryProductsListResponse,
    DlvryProductsSummaryResponse,
    DlvryProductRelatedResponse,
)
from services.dlvry.order_service import process_dlvry_webhook
from services.dlvry.dlvry_client import DlvryApiClient
from services.dlvry.dlvry_helpers import resolve_affiliate_id
from services.dlvry.dlvry_formatters import (
    format_order_list_item,
    format_order_detail,
    format_webhook_log,
    format_daily_stats_row,
)
import crud.dlvry_order_crud as dlvry_crud

router = APIRouter()
logger = logging.getLogger(__name__)


def _require_dlvry_token() -> str:
    """Получить DLVRY_TOKEN или выбросить 503."""
    token = settings.dlvry_token
    if not token:
        raise HTTPException(
            status_code=503,
            detail="DLVRY_TOKEN не настроен. Добавьте в .env",
        )
    return token


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# POST /webhook — приём колбэка от DLVRY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/webhook", response_model=DlvryWebhookResponse)
async def dlvry_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Принимает колбэк от DLVRY с данными заказа.

    DLVRY отправляет POST-запрос с JSON-телом при каждом новом/обновлённом заказе.
    Заказ сохраняется в БД с защитой от дублирования (по dlvry_order_id + affiliate_id).
    
    Все входящие вебхуки логируются в таблицу dlvry_webhook_logs.
    """
    client_ip = request.client.host if request.client else "unknown"

    try:
        body = await request.json()
    except Exception as e:
        # Логируем невалидный JSON
        raw = ""
        try:
            raw = (await request.body()).decode("utf-8", errors="replace")[:500]
        except Exception:
            pass
        logger.warning(
            "DLVRY webhook: невалидный JSON. IP=%s, Body=%s, Error=%s",
            client_ip, raw, e,
        )
        dlvry_crud.log_webhook(
            db,
            remote_ip=client_ip,
            affiliate_id=None,
            dlvry_order_id=None,
            result="error",
            error_message=f"Invalid JSON: {e}",
            payload=raw,
        )
        raise HTTPException(status_code=400, detail="Invalid JSON")

    try:
        raw_json = json.dumps(body, ensure_ascii=False)
        # Подтягиваем каталог товаров для маппинга item_id → name
        aff_id = str(body.get('affiliate_id') or '')
        catalog = await _get_catalog(aff_id) if aff_id else {}
        result = process_dlvry_webhook(db, body, raw_json=raw_json, remote_ip=client_ip, catalog=catalog)
        return DlvryWebhookResponse(**result)

    except Exception as e:
        logger.error("DLVRY webhook processing error: %s", e, exc_info=True)
        # Логируем ошибку обработки
        dlvry_crud.log_webhook(
            db,
            remote_ip=client_ip,
            affiliate_id=body.get("affiliate_id"),
            dlvry_order_id=body.get("id"),
            result="error",
            error_message=str(e),
            payload=json.dumps(body, ensure_ascii=False)[:5000],
        )
        raise HTTPException(status_code=500, detail=f"Processing error: {e}")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /orders — список заказов
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/orders", response_model=DlvryOrdersListResponse)
def get_orders(
    db: Session = Depends(get_db),
    project_id: Optional[str] = Query(None, description="Фильтр по проекту"),
    affiliate_id: Optional[str] = Query(None, description="Фильтр по филиалу"),
    vk_group_id: Optional[str] = Query(None, description="Фильтр по VK группе"),
    date_from: Optional[date] = Query(None, description="Начало периода (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Конец периода (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Поиск по клиенту/телефону/ID"),
    skip: int = Query(0, ge=0, description="Пропустить N записей"),
    limit: int = Query(50, ge=1, le=500, description="Количество записей"),
):
    """Получить список заказов DLVRY с фильтрацией и пагинацией."""
    orders, total = dlvry_crud.get_orders(
        db,
        project_id=project_id,
        affiliate_id=affiliate_id,
        vk_group_id=vk_group_id,
        date_from=date_from,
        date_to=date_to,
        search=search,
        skip=skip,
        limit=limit,
    )

    return DlvryOrdersListResponse(
        orders=[format_order_list_item(o) for o in orders],
        total=total,
        skip=skip,
        limit=limit,
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /orders/stats — статистика заказов
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/orders/stats", response_model=DlvryOrderStatsResponse)
def get_orders_stats(
    db: Session = Depends(get_db),
    project_id: Optional[str] = Query(None, description="Фильтр по проекту"),
    affiliate_id: Optional[str] = Query(None, description="Фильтр по филиалу"),
    date_from: Optional[date] = Query(None, description="Начало периода"),
    date_to: Optional[date] = Query(None, description="Конец периода"),
):
    """Получить агрегированную статистику по заказам."""
    stats = dlvry_crud.get_orders_stats(
        db,
        project_id=project_id,
        affiliate_id=affiliate_id,
        date_from=date_from,
        date_to=date_to,
    )
    return DlvryOrderStatsResponse(**stats)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /orders/{order_id} — детали заказа
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Кеш каталога товаров DLVRY (affiliate_id → {item_id → name})
_catalog_cache: dict[str, tuple[float, dict[str, str]]] = {}
_CATALOG_TTL = 3600  # 1 час


async def _get_catalog(affiliate_id: str) -> dict[str, str]:
    """Получить каталог товаров с кешированием (TTL 1 час)."""
    import time
    now = time.time()
    if affiliate_id in _catalog_cache:
        ts, catalog = _catalog_cache[affiliate_id]
        if now - ts < _CATALOG_TTL:
            return catalog

    token = settings.dlvry_token
    if not token:
        return {}

    client = DlvryApiClient(token=token)
    catalog = await client.fetch_affiliate_items(affiliate_id)
    _catalog_cache[affiliate_id] = (now, catalog)
    return catalog


@router.get("/orders/{order_id}")
async def get_order_detail(order_id: int, db: Session = Depends(get_db)):
    """Получить полную информацию о заказе с позициями."""
    order = dlvry_crud.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    items = dlvry_crud.get_order_items(db, order.id)

    # Подгружаем каталог для обогащения названий позиций
    catalog = await _get_catalog(order.affiliate_id) if order.affiliate_id else {}

    return format_order_detail(order, items, catalog=catalog)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /webhook-logs — журнал вебхуков
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/webhook-logs")
def get_webhook_logs(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """Получить журнал входящих вебхуков."""
    logs, total = dlvry_crud.get_webhook_logs(db, limit=limit, offset=skip)
    return {
        "logs": [format_webhook_log(log) for log in logs],
        "total": total,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DELETE /webhook-logs — очистка журнала
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.delete("/webhook-logs")
def clear_webhook_logs(db: Session = Depends(get_db)):
    """Удалить все записи из журнала вебхуков."""
    count = dlvry_crud.clear_webhook_logs(db)
    return {"deleted": count}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /stats/external — статистика из внешнего DLVRY API
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/stats/external")
async def get_external_stats(
    db: Session = Depends(get_db),
    project_id: Optional[str] = Query(None, description="ID проекта (берём affiliate_id из настроек)"),
    affiliate_id: Optional[str] = Query(None, description="ID филиала DLVRY (напрямую)"),
    date_from: str = Query(..., description="Дата начала DD.MM.YYYY"),
    date_to: str = Query(..., description="Дата окончания DD.MM.YYYY"),
):
    """
    Получить статистику напрямую из DLVRY API.
    Требует настроенный DLVRY_TOKEN в конфиге.
    affiliate_id можно передать напрямую или через project_id.
    """
    token = _require_dlvry_token()
    affiliate_id = resolve_affiliate_id(db, project_id, affiliate_id)

    client = DlvryApiClient(token=token)
    stats = await client.get_orders_stats(affiliate_id, date_from, date_to)

    if stats is None:
        raise HTTPException(status_code=502, detail="Не удалось получить данные из DLVRY API")

    return stats.to_dict()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /stats/comparison — сравнение периодов (DLVRY API)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/stats/comparison")
async def get_comparison_stats(
    db: Session = Depends(get_db),
    project_id: Optional[str] = Query(None, description="ID проекта"),
    affiliate_id: Optional[str] = Query(None, description="ID филиала DLVRY"),
    period_days: int = Query(7, ge=1, le=365, description="Количество дней для сравнения"),
    date_from: Optional[str] = Query(None, description="Дата начала DD.MM.YYYY (опционально)"),
    date_to: Optional[str] = Query(None, description="Дата окончания DD.MM.YYYY (опционально)"),
):
    """
    Сравнить два периода — текущий и предыдущий (получает из DLVRY API).
    """
    token = _require_dlvry_token()
    affiliate_id = resolve_affiliate_id(db, project_id, affiliate_id)

    client = DlvryApiClient(token=token)
    comparison = await client.get_orders_comparison(
        affiliate_id,
        period_days=period_days,
        date_from=date_from,
        date_to=date_to,
    )

    if comparison is None:
        raise HTTPException(status_code=502, detail="Не удалось получить данные из DLVRY API")

    return comparison.to_dict()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /stats/daily — сохранённая дневная статистика из БД
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/stats/daily")
def get_daily_stats(
    db: Session = Depends(get_db),
    project_id: Optional[str] = Query(None, description="ID проекта"),
    affiliate_id: Optional[str] = Query(None, description="ID филиала DLVRY"),
    date_from: Optional[date] = Query(None, description="Начало периода (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Конец периода (YYYY-MM-DD)"),
    limit: Optional[int] = Query(None, description="Макс. записей (пагинация)"),
    offset: int = Query(0, description="Смещение (пагинация)"),
):
    """
    Получить сохранённую дневную статистику DLVRY из БД.
    Данные заполняются через синхронизацию с DLVRY API.
    """
    import crud.dlvry_daily_stats_crud as stats_crud

    affiliate_id = resolve_affiliate_id(db, project_id, affiliate_id, raise_if_missing=False)

    rows = stats_crud.get_daily_stats(
        db,
        project_id=project_id,
        affiliate_id=affiliate_id,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )

    # Общее количество записей (для пагинации)
    total_count = stats_crud.count_daily_stats(
        db,
        project_id=project_id,
        affiliate_id=affiliate_id,
        date_from=date_from,
        date_to=date_to,
    )

    # Агрегаты за запрошенный период (всегда по полному диапазону, без limit/offset)
    aggregated = stats_crud.get_aggregated_stats(
        db,
        project_id=project_id,
        affiliate_id=affiliate_id,
        date_from=date_from,
        date_to=date_to,
    )

    return {
        "days": [format_daily_stats_row(row) for row in rows],
        "total": len(rows),
        "total_count": total_count,
        "has_more": (offset + len(rows)) < total_count,
        "aggregated": aggregated,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /stats/available-months — год-месяцы, по которым есть данные
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/stats/available-months")
def get_available_months(
    db: Session = Depends(get_db),
    project_id: Optional[str] = Query(None, description="ID проекта"),
    affiliate_id: Optional[str] = Query(None, description="ID филиала DLVRY"),
):
    """Вернуть список год-месяц, по которым есть хотя бы одна запись."""
    import crud.dlvry_daily_stats_crud as stats_crud

    affiliate_id = resolve_affiliate_id(db, project_id, affiliate_id, raise_if_missing=False)

    months = stats_crud.get_available_months(
        db,
        project_id=project_id,
        affiliate_id=affiliate_id,
    )
    return {"months": months}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# POST /stats/sync — синхронизация данных из DLVRY API в БД
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/stats/sync")
def sync_stats(
    db: Session = Depends(get_db),
    project_id: Optional[str] = Query(None, description="ID проекта"),
    affiliate_id: Optional[str] = Query(None, description="ID филиала DLVRY"),
    date_from: Optional[date] = Query(None, description="Начало периода (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Конец периода (YYYY-MM-DD)"),
    force_full: bool = Query(False, description="Полная пересинхронизация (за год)"),
):
    """
    Запросить данные из DLVRY API и записать в БД.
    Инкрементальная дозапись — от последней сохранённой даты до вчера.
    """
    from services.dlvry.stats_sync_service import sync_dlvry_stats_for_project

    real_affiliate_id = resolve_affiliate_id(db, project_id, affiliate_id)

    result = sync_dlvry_stats_for_project(
        db=db,
        project_id=project_id,
        affiliate_id=real_affiliate_id,
        date_from=date_from,
        date_to=date_to,
        force_full=force_full,
    )

    if not result["success"]:
        raise HTTPException(status_code=502, detail=result.get("error", "Ошибка синхронизации"))

    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# POST /stats/sync-full-stream — полная загрузка с SSE-стримингом
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/stats/sync-full-stream")
def sync_full_stream(
    db: Session = Depends(get_db),
    project_id: Optional[str] = Query(None, description="ID проекта"),
    affiliate_id: Optional[str] = Query(None, description="ID филиала DLVRY"),
):
    """
    Полная загрузка с SSE-стримингом прогресса.
    Каждый чанк сохраняется в БД сразу — данные видны в интерфейсе.
    Прогресс передаётся через Server-Sent Events.
    """
    from services.dlvry.stats_sync_core import sync_full_backwards_gen as _sync_full_backwards_gen

    real_affiliate_id = resolve_affiliate_id(db, project_id, affiliate_id)
    token = _require_dlvry_token()

    yesterday = date.today() - timedelta(days=1)

    def generate():
        for event in _sync_full_backwards_gen(
            db=db,
            project_id=project_id,
            affiliate_id=real_affiliate_id,
            token=token,
            end_date=yesterday,
        ):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# POST /stats/sync-all — синхронизация всех проектов (для админа)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/stats/sync-all")
def sync_all_stats(db: Session = Depends(get_db)):
    """
    Синхронизировать статистику DLVRY для ВСЕХ проектов с настроенным affiliate_id.
    Используется кнопкой «Обновить всё» или планировщиком.
    """
    from services.dlvry.stats_sync_all import sync_all_projects

    result = sync_all_projects(db)
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# POST /orders/sync — синхронизация заказов из DLVRY hl-orders API
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/orders/sync")
def sync_orders(
    db: Session = Depends(get_db),
    project_id: Optional[str] = Query(None, description="ID проекта"),
    affiliate_id: Optional[str] = Query(None, description="ID филиала DLVRY"),
    date_from: Optional[date] = Query(None, description="Начало периода (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Конец периода (YYYY-MM-DD)"),
):
    """
    Запросить заказы из DLVRY hl-orders API и записать в БД.
    Инкрементальная дозапись — от последнего заказа до сегодня.
    """
    from services.dlvry.orders_sync_service import sync_dlvry_orders_for_project

    real_affiliate_id = resolve_affiliate_id(db, project_id, affiliate_id)

    result = sync_dlvry_orders_for_project(
        db=db,
        project_id=project_id,
        affiliate_id=real_affiliate_id,
        date_from=date_from,
        date_to=date_to,
    )

    if not result["success"]:
        raise HTTPException(status_code=502, detail=result.get("error", "Ошибка синхронизации заказов"))

    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# POST /orders/sync-full-stream — полная загрузка заказов с SSE-стримингом
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/orders/sync-full-stream")
def sync_orders_full_stream(
    db: Session = Depends(get_db),
    project_id: Optional[str] = Query(None, description="ID проекта"),
    affiliate_id: Optional[str] = Query(None, description="ID филиала DLVRY"),
):
    """
    Полная загрузка заказов с SSE-стримингом прогресса.
    Каждый чанк сохраняется в БД сразу — данные видны в интерфейсе.
    """
    from services.dlvry.orders_sync_service import sync_orders_full_backwards_gen

    real_affiliate_id = resolve_affiliate_id(db, project_id, affiliate_id)
    token = _require_dlvry_token()

    today = date.today()

    def generate():
        for event in sync_orders_full_backwards_gen(
            db=db,
            project_id=project_id,
            affiliate_id=real_affiliate_id,
            token=token,
            end_date=today,
        ):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /products — аналитика товаров (агрегация позиций заказов)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/products", response_model=DlvryProductsListResponse)
def get_products_analytics(
    db: Session = Depends(get_db),
    project_id: Optional[str] = Query(None, description="Фильтр по проекту"),
    affiliate_id: Optional[str] = Query(None, description="Фильтр по филиалу"),
    date_from: Optional[date] = Query(None, description="Начало периода"),
    date_to: Optional[date] = Query(None, description="Конец периода"),
    search: Optional[str] = Query(None, description="Поиск по названию товара"),
    sort_by: Optional[str] = Query("total_qty", description="Сортировка: total_qty, orders_count, total_revenue, avg_price, name"),
    sort_dir: Optional[str] = Query("desc", description="Направление: asc, desc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
):
    """Список товаров с агрегированной статистикой продаж."""
    products, total = dlvry_crud.get_products_analytics(
        db,
        project_id=project_id,
        affiliate_id=affiliate_id,
        date_from=date_from,
        date_to=date_to,
        search=search,
        sort_by=sort_by or "total_qty",
        sort_dir=sort_dir or "desc",
        skip=skip,
        limit=limit,
    )
    return DlvryProductsListResponse(
        products=products,
        total=total,
        skip=skip,
        limit=limit,
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /products/summary — сводка по товарам
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/products/summary", response_model=DlvryProductsSummaryResponse)
def get_products_summary(
    db: Session = Depends(get_db),
    project_id: Optional[str] = Query(None, description="Фильтр по проекту"),
    affiliate_id: Optional[str] = Query(None, description="Фильтр по филиалу"),
    date_from: Optional[date] = Query(None, description="Начало периода"),
    date_to: Optional[date] = Query(None, description="Конец периода"),
):
    """Сводная статистика по товарам за период."""
    summary = dlvry_crud.get_products_summary(
        db,
        project_id=project_id,
        affiliate_id=affiliate_id,
        date_from=date_from,
        date_to=date_to,
    )
    return DlvryProductsSummaryResponse(**summary)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GET /products/{item_id}/related — сопутствующие товары (co-occurrence)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/products/{item_id}/related", response_model=DlvryProductRelatedResponse)
def get_product_related(
    item_id: str,
    db: Session = Depends(get_db),
    project_id: Optional[str] = Query(None),
    affiliate_id: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    limit: int = Query(15, ge=1, le=50),
):
    """Сопутствующие товары — что берут вместе с данным товаром."""
    result = dlvry_crud.get_product_related(
        db,
        dlvry_item_id=item_id,
        project_id=project_id,
        affiliate_id=affiliate_id,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
    )
    return DlvryProductRelatedResponse(**result)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# POST /orders/backfill-names — заполнение названий товаров из каталога
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.post("/orders/backfill-names")
async def backfill_item_names(
    db: Session = Depends(get_db),
    project_id: Optional[str] = Query(None, description="ID проекта"),
    affiliate_id: Optional[str] = Query(None, description="ID филиала DLVRY"),
):
    """
    Заполняет пустые названия товаров (name) для существующих позиций заказов.
    Загружает каталог через /affiliates/{id}/items и обновляет items с пустым name.
    """
    from models_library.dlvry_orders import DlvryOrderItem, DlvryOrder

    real_affiliate_id = resolve_affiliate_id(db, project_id, affiliate_id)
    catalog = await _get_catalog(real_affiliate_id)
    if not catalog:
        raise HTTPException(status_code=502, detail="Не удалось загрузить каталог товаров DLVRY")

    # Находим items с пустым name, привязанные к заказам данного affiliate
    empty_items = (
        db.query(DlvryOrderItem)
        .join(DlvryOrder, DlvryOrderItem.order_id == DlvryOrder.id)
        .filter(
            DlvryOrder.affiliate_id == real_affiliate_id,
            (DlvryOrderItem.name == '') | (DlvryOrderItem.name.is_(None)),
        )
        .all()
    )

    updated = 0
    for item in empty_items:
        new_name = catalog.get(str(item.dlvry_item_id), '')
        if new_name:
            item.name = new_name
            updated += 1

    # Также обновим items_text у заказов, чьи позиции обновились
    if updated > 0:
        # Собираем order_id → список items для пересчёта items_text
        updated_order_ids = set()
        for item in empty_items:
            if catalog.get(str(item.dlvry_item_id)):
                updated_order_ids.add(item.order_id)

        for oid in updated_order_ids:
            order_items = db.query(DlvryOrderItem).filter(DlvryOrderItem.order_id == oid).all()
            lines = [f"{it.name or ''} × {it.quantity or 1}" for it in order_items]
            db.query(DlvryOrder).filter(DlvryOrder.id == oid).update(
                {"items_text": "\n".join(lines)}
            )

        db.commit()

    logger.info(
        f"[DLVRY Backfill] affiliate={real_affiliate_id}: "
        f"{updated} позиций обновлено из {len(empty_items)} пустых, "
        f"каталог={len(catalog)} товаров"
    )

    return {
        "success": True,
        "catalog_size": len(catalog),
        "empty_items_found": len(empty_items),
        "items_updated": updated,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CRUD филиалов DLVRY (привязка к проекту)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/affiliates/{project_id}", response_model=list[DlvryAffiliateResponse])
def list_affiliates(project_id: str, db: Session = Depends(get_db)):
    """Получить все филиалы DLVRY для проекта."""
    import crud.dlvry_affiliate_crud as aff_crud
    affiliates = aff_crud.get_affiliates_by_project(db, project_id)
    return [
        DlvryAffiliateResponse(
            id=a.id,
            project_id=a.project_id,
            affiliate_id=a.affiliate_id,
            name=a.name,
            is_active=a.is_active,
            created_at=str(a.created_at) if a.created_at else None,
        )
        for a in affiliates
    ]


@router.post("/affiliates/{project_id}", response_model=DlvryAffiliateResponse)
def create_affiliate(
    project_id: str,
    payload: DlvryAffiliateCreatePayload,
    db: Session = Depends(get_db),
):
    """Добавить филиал DLVRY к проекту. Запускает фоновую синхронизацию статистики."""
    import crud.dlvry_affiliate_crud as aff_crud

    # Проверка дубликата
    existing = aff_crud.get_affiliate_by_affiliate_id(db, payload.affiliate_id)
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Филиал {payload.affiliate_id} уже привязан к проекту {existing.project_id}",
        )

    record = aff_crud.create_affiliate(
        db,
        project_id=project_id,
        affiliate_id=payload.affiliate_id,
        name=payload.name,
    )

    # Запускаем фоновую синхронизацию для нового филиала
    try:
        from services.dlvry.stats_sync_background import run_full_sync_background
        run_full_sync_background(project_id, payload.affiliate_id)
        logger.info(f"[DLVRY] Запущена фоновая синхронизация для нового филиала {payload.affiliate_id}")
    except Exception as e:
        logger.warning(f"[DLVRY] Не удалось запустить синхронизацию для {payload.affiliate_id}: {e}")

    return DlvryAffiliateResponse(
        id=record.id,
        project_id=record.project_id,
        affiliate_id=record.affiliate_id,
        name=record.name,
        is_active=record.is_active,
        created_at=str(record.created_at) if record.created_at else None,
    )


@router.put("/affiliates/record/{record_id}", response_model=DlvryAffiliateResponse)
def update_affiliate(
    record_id: str,
    payload: DlvryAffiliateUpdatePayload,
    db: Session = Depends(get_db),
):
    """Обновить филиал (имя, активность)."""
    import crud.dlvry_affiliate_crud as aff_crud

    record = aff_crud.update_affiliate(
        db, record_id,
        name=payload.name if payload.name is not None else ...,
        is_active=payload.is_active if payload.is_active is not None else ...,
    )
    if not record:
        raise HTTPException(status_code=404, detail="Филиал не найден")

    return DlvryAffiliateResponse(
        id=record.id,
        project_id=record.project_id,
        affiliate_id=record.affiliate_id,
        name=record.name,
        is_active=record.is_active,
        created_at=str(record.created_at) if record.created_at else None,
    )


@router.delete("/affiliates/record/{record_id}")
def delete_affiliate(record_id: str, db: Session = Depends(get_db)):
    """Удалить филиал."""
    import crud.dlvry_affiliate_crud as aff_crud

    deleted = aff_crud.delete_affiliate(db, record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Филиал не найден")
    return {"success": True}
