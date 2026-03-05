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
from datetime import datetime, date, timedelta
import logging
import json

from schemas.dlvry_schemas import (
    DlvryWebhookPayload,
    DlvryWebhookResponse,
    DlvryOrderResponse,
    DlvryOrdersListResponse,
    DlvryOrderStatsResponse,
    DlvryWebhookLogResponse,
)
from services.dlvry.order_service import process_dlvry_webhook
from services.dlvry.dlvry_client import DlvryApiClient
import crud.dlvry_order_crud as dlvry_crud

router = APIRouter()
logger = logging.getLogger(__name__)


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
        result = process_dlvry_webhook(db, body, raw_json=raw_json, remote_ip=client_ip)
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
        orders=[
            DlvryOrderResponse(
                id=o.id,
                dlvry_order_id=o.dlvry_order_id,
                affiliate_id=o.affiliate_id,
                order_date=o.order_date.isoformat() if o.order_date else None,
                client_name=o.client_name,
                client_phone=o.phone,
                total=o.total,
                payment_type=o.payment_name,
                delivery_type=o.delivery_name,
                source_name=o.source_name,
                status=o.status,
                items_count=o.items_count,
                created_at=o.received_at.isoformat() if o.received_at else None,
            )
            for o in orders
        ],
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

@router.get("/orders/{order_id}")
def get_order_detail(order_id: int, db: Session = Depends(get_db)):
    """Получить полную информацию о заказе с позициями."""
    order = dlvry_crud.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    items = dlvry_crud.get_order_items(db, order.id)

    return {
        "order": {
            "id": order.id,
            "dlvry_order_id": order.dlvry_order_id,
            "affiliate_id": order.affiliate_id,
            "order_date": order.order_date.isoformat() if order.order_date else None,
            "client_name": order.client_name,
            "client_phone": order.phone,
            "client_email": order.client_email,
            "client_birthday": order.client_bday,
            "vk_user_id": order.vk_user_id,
            "vk_group_id": order.vk_group_id,
            "vk_platform": order.vk_platform,
            "address_full": order.address_full,
            "address_city": order.address_city,
            "address_street": order.address_street,
            "address_house": order.address_house,
            "address_flat": order.address_apt,
            "total": order.total,
            "subtotal": order.order_sum,
            "discount": order.discount,
            "delivery_price": order.delivery_price,
            "payment_type": order.payment_name,
            "payment_code": order.payment_code,
            "delivery_type": order.delivery_name,
            "delivery_code": order.delivery_code,
            "source_name": order.source_name,
            "source_code": order.source_code,
            "pickup_point_name": order.pickup_point_name,
            "promocode": order.promocode,
            "comment": order.comment,
            "preorder": order.is_preorder,
            "status": order.status,
            "items_count": order.items_count,
            "items_json": order.items_text,
            "raw_json": order.raw_json,
            "created_at": order.received_at.isoformat() if order.received_at else None,
        },
        "items": [
            {
                "id": item.id,
                "name": item.name,
                "price": item.price,
                "quantity": item.quantity,
                "total": round(float(item.price or 0) * int(item.quantity or 1), 2),
                "code": item.code,
                "weight": item.weight,
                "options": item.options_json,
            }
            for item in items
        ],
    }


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
        "logs": [
            DlvryWebhookLogResponse(
                id=log.id,
                remote_ip=log.remote_ip,
                affiliate_id=log.affiliate_id,
                dlvry_order_id=log.dlvry_order_id,
                result=log.result,
                error_message=log.error_message,
                timestamp=log.timestamp,
            )
            for log in logs
        ],
        "total": total,
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DELETE /webhook-logs — очистка журнала
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.delete("/webhook-logs")
def clear_webhook_logs(db: Session = Depends(get_db)):
    """Удалить все записи из журнала вебхуков."""
    from models_library.dlvry_orders import DlvryWebhookLog
    count = db.query(DlvryWebhookLog).count()
    db.query(DlvryWebhookLog).delete()
    db.commit()
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
    token = settings.dlvry_token
    if not token:
        raise HTTPException(
            status_code=503,
            detail="DLVRY_TOKEN не настроен. Добавьте в .env",
        )

    # Если передан project_id — ищем affiliate_id в настройках проекта
    if not affiliate_id and project_id:
        from models_library.projects import Project
        project = db.query(Project).filter(Project.id == project_id).first()
        if project and project.dlvry_affiliate_id:
            affiliate_id = project.dlvry_affiliate_id
    
    if not affiliate_id:
        raise HTTPException(
            status_code=400,
            detail="Нужен affiliate_id или project_id с настроенной DLVRY интеграцией",
        )

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
    token = settings.dlvry_token
    if not token:
        raise HTTPException(
            status_code=503,
            detail="DLVRY_TOKEN не настроен. Добавьте в .env",
        )
    
    # Если передан project_id — ищем affiliate_id в настройках проекта
    if not affiliate_id and project_id:
        from models_library.projects import Project
        project = db.query(Project).filter(Project.id == project_id).first()
        if project and project.dlvry_affiliate_id:
            affiliate_id = project.dlvry_affiliate_id
    
    if not affiliate_id:
        raise HTTPException(
            status_code=400,
            detail="Нужен affiliate_id или project_id с настроенной DLVRY интеграцией",
        )

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

    # Если передан project_id без affiliate_id — подставляем
    if not affiliate_id and project_id:
        from models_library.projects import Project as ProjectModel
        project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
        if project and project.dlvry_affiliate_id:
            affiliate_id = project.dlvry_affiliate_id

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
        "days": [
            {
                "date": row.stat_date.isoformat(),
                "orders_count": row.orders_count,
                "revenue": row.revenue,
                "first_orders": row.first_orders,
                "avg_check": row.avg_check,
                # Отмены
                "canceled": row.canceled,
                "canceled_sum": row.canceled_sum,
                # Финансы
                "cost": row.cost,
                "discount": row.discount,
                "first_orders_sum": row.first_orders_sum,
                "first_orders_cost": row.first_orders_cost,
                # Клиенты
                "unique_clients": row.unique_clients,
                # Оплата (разбивка)
                "sum_cash": row.sum_cash,
                "count_payment_cash": row.count_payment_cash,
                "sum_card": row.sum_card,
                "count_payment_card": row.count_payment_card,
                "count_payment_online": row.count_payment_online,
                "sum_online_success": row.sum_online_success,
                "sum_online_fail": row.sum_online_fail,
                # Источники
                "source_site": row.source_site,
                "sum_source_site": row.sum_source_site,
                "source_vkapp": row.source_vkapp,
                "sum_source_vkapp": row.sum_source_vkapp,
                "source_ios": row.source_ios,
                "sum_source_ios": row.sum_source_ios,
                "source_android": row.source_android,
                "sum_source_android": row.sum_source_android,
                # Доставка
                "delivery_self_count": row.delivery_self_count,
                "delivery_self_sum": row.delivery_self_sum,
                "delivery_count": row.delivery_count,
                "delivery_sum": row.delivery_sum,
                # Повторные заказы
                "repeat_order_2": row.repeat_order_2,
                "repeat_order_3": row.repeat_order_3,
                "repeat_order_4": row.repeat_order_4,
                "repeat_order_5": row.repeat_order_5,
            }
            for row in rows
        ],
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

    if not affiliate_id and project_id:
        from models_library.projects import Project as ProjectModel
        project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
        if project and project.dlvry_affiliate_id:
            affiliate_id = project.dlvry_affiliate_id

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

    # Определяем affiliate_id
    real_affiliate_id = affiliate_id
    real_project_id = project_id

    if not real_affiliate_id and project_id:
        from models_library.projects import Project as ProjectModel
        project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
        if project and project.dlvry_affiliate_id:
            real_affiliate_id = project.dlvry_affiliate_id

    if not real_affiliate_id:
        raise HTTPException(
            status_code=400,
            detail="Нужен affiliate_id или project_id с настроенной DLVRY интеграцией",
        )

    result = sync_dlvry_stats_for_project(
        db=db,
        project_id=real_project_id,
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
    from services.dlvry.stats_sync_service import _sync_full_backwards_gen

    real_affiliate_id = affiliate_id
    real_project_id = project_id

    if not real_affiliate_id and project_id:
        from models_library.projects import Project as ProjectModel
        project_obj = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
        if project_obj and project_obj.dlvry_affiliate_id:
            real_affiliate_id = project_obj.dlvry_affiliate_id

    if not real_affiliate_id:
        raise HTTPException(
            status_code=400,
            detail="Нужен affiliate_id или project_id с настроенной DLVRY интеграцией",
        )

    token = settings.dlvry_token
    if not token:
        raise HTTPException(status_code=500, detail="DLVRY_TOKEN не настроен")

    yesterday = date.today() - timedelta(days=1)

    def generate():
        for event in _sync_full_backwards_gen(
            db=db,
            project_id=real_project_id,
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
    from services.dlvry.stats_sync_service import sync_all_projects

    result = sync_all_projects(db)
    return result
