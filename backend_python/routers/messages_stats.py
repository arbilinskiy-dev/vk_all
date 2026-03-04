"""
Роутер для статистики нагрузки модуля сообщений.
Кросс-проектный дашборд мониторинга: общая сводка, графики, детализация по пользователям.
"""

from fastapi import APIRouter, Depends, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import json
import logging
import uuid

from database import get_db, get_background_session, SessionLocal
from crud import message_stats_crud
from models_library.projects import Project as ProjectModel
from services import task_monitor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/messages/stats", tags=["Messages Stats"])


# =============================================================================
# ГЛОБАЛЬНАЯ СВОДКА (все проекты)
# =============================================================================

@router.get("/summary")
def get_stats_summary(
    date_from: Optional[str] = Query(None, description="Начало диапазона YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="Конец диапазона YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Глобальная сводка по всем проектам:
    общее кол-во сообщений, уникальных пользователей, проектов.
    Поддерживает фильтрацию по периоду.
    """
    return {
        "success": True,
        **message_stats_crud.get_global_summary(db, date_from, date_to),
    }


# =============================================================================
# СВОДКА ПО КАЖДОМУ ПРОЕКТУ (таблица)
# =============================================================================

@router.get("/projects")
def get_stats_by_projects(
    date_from: Optional[str] = Query(None, description="Начало диапазона YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="Конец диапазона YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Сводка по каждому проекту: входящие, исходящие, уникальные пользователи.
    Поддерживает фильтрацию по периоду.
    """
    return {
        "success": True,
        "projects": message_stats_crud.get_projects_summary(db, date_from, date_to),
    }


# =============================================================================
# СВОДКА ПО КОНКРЕТНОМУ ПРОЕКТУ
# =============================================================================

@router.get("/project/{project_id}")
def get_project_stats(
    project_id: str,
    db: Session = Depends(get_db),
):
    """Сводка по конкретному проекту."""
    return {
        "success": True,
        **message_stats_crud.get_project_summary(db, project_id),
    }


# =============================================================================
# ГРАФИК ПИКОВЫХ НАГРУЗОК (часовые слоты)
# =============================================================================

@router.get("/chart")
def get_stats_chart(
    project_id: Optional[str] = Query(None, description="ID проекта (None = все)"),
    date_from: Optional[str] = Query(None, description="Начало диапазона YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="Конец диапазона YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Данные для графика пиковых нагрузок — часовые слоты.
    Без project_id — агрегат по всем проектам.
    """
    chart_data = message_stats_crud.get_hourly_chart(db, project_id, date_from, date_to)
    return {
        "success": True,
        "chart": chart_data,
    }


# =============================================================================
# ДЕТАЛИЗАЦИЯ ПО ПОЛЬЗОВАТЕЛЯМ (таблица внутри проекта)
# =============================================================================

@router.get("/project/{project_id}/users")
def get_project_users_stats(
    project_id: str,
    sort_by: str = Query("last_message_at", description="Поле сортировки"),
    sort_order: str = Query("desc", description="Порядок: asc/desc"),
    limit: int = Query(50, ge=1, le=200, description="Лимит записей"),
    offset: int = Query(0, ge=0, description="Смещение"),
    date_from: Optional[str] = Query(None, description="Начало диапазона YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="Конец диапазона YYYY-MM-DD"),
    message_type: Optional[str] = Query(None, description="Тип сообщений: text (реальные) или payload (кнопки)"),
    db: Session = Depends(get_db),
):
    """
    Список пользователей проекта с детализацией:
    кто, сколько сообщений, первое/последнее — для таблицы с переходом в чат.
    Поддерживает фильтрацию по периоду и типу сообщений.
    Автоматически обогащает профили без ФИО/фото через VK API users.get.
    """
    data = message_stats_crud.get_project_users(
        db, project_id, sort_by, sort_order, limit, offset,
        date_from=date_from, date_to=date_to, message_type=message_type,
    )

    # Обогащение: если у пользователей нет ФИО — запрашиваем VK API
    users = data.get("users", [])
    missing_ids = [u["vk_user_id"] for u in users if not u.get("first_name")]

    if missing_ids:
        try:
            # Получаем токены проекта
            project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
            if project and project.communityToken:
                community_tokens = [project.communityToken]
                if project.additional_community_tokens:
                    try:
                        extras = json.loads(project.additional_community_tokens)
                        if isinstance(extras, list):
                            community_tokens.extend([t for t in extras if t])
                    except Exception:
                        pass

                group_id = project.vkProjectId
                if group_id:
                    group_id_int = abs(int(group_id))

                    from services.messages.profile_enrichment import enrich_missing_profiles
                    enriched = enrich_missing_profiles(
                        db=db,
                        user_ids=missing_ids,
                        community_tokens=community_tokens,
                        group_id_int=group_id_int,
                        project_id=project_id,
                    )

                    # Дописываем обогащённые данные в ответ
                    if enriched:
                        for u in users:
                            uid = u["vk_user_id"]
                            if uid in enriched:
                                u["first_name"] = enriched[uid].get("first_name") or u.get("first_name")
                                u["last_name"] = enriched[uid].get("last_name") or u.get("last_name")
                                u["photo_url"] = enriched[uid].get("photo_url") or u.get("photo_url")

                        logger.info(
                            f"STATS-USERS: обогащено {len(enriched)}/{len(missing_ids)} "
                            f"профилей для проекта {project_id}"
                        )
        except Exception as e:
            logger.warning(f"STATS-USERS: ошибка обогащения профилей: {e}")

    return {
        "success": True,
        **data,
    }


# =============================================================================
# СИНХРОНИЗАЦИЯ ИЗ CALLBACK-ЛОГОВ (фоновая задача)
# =============================================================================

def _sync_from_logs_task(task_id: str):
    """
    Фоновая задача синхронизации из callback-логов.
    Использует task_monitor для отслеживания прогресса.
    """
    db = get_background_session()
    try:
        task_monitor.update_task(task_id, "processing", message="Чтение callback-логов...")
        
        for event in message_stats_crud.sync_from_callback_logs_with_progress(db):
            # Проверяем отмену задачи
            if task_monitor.is_task_cancelled(task_id):
                task_monitor.update_task(task_id, "error", error="Задача отменена пользователем")
                task_monitor.clear_cancellation(task_id)
                return
            
            event_type = event.get("type")
            
            if event_type == "start":
                total_logs = event.get("total_logs", 0)
                task_monitor.update_task(
                    task_id, "processing",
                    loaded=0, total=total_logs,
                    message=f"Чтение {total_logs} логов..."
                )
            elif event_type == "reading":
                processed = event.get("processed", 0)
                total = event.get("total", 0)
                task_monitor.update_task(
                    task_id, "processing",
                    loaded=processed, total=total,
                    message=f"Чтение логов: {processed}/{total}"
                )
            elif event_type == "upserting":
                processed = event.get("processed", 0)
                total = event.get("total", 0)
                phase = event.get("phase", "")
                phase_name = "часовых слотов" if phase == "hourly" else "пользователей"
                task_monitor.update_task(
                    task_id, "processing",
                    sub_loaded=processed, sub_total=total,
                    sub_message=f"Сохранение {phase_name}: {processed}/{total}"
                )
            elif event_type == "complete":
                result = event.get("result", {})
                task_monitor.update_task(
                    task_id, "done",
                    loaded=result.get("synced", 0),
                    total=result.get("synced", 0) + result.get("skipped", 0) + result.get("errors", 0),
                    message=result.get("details", "Синхронизация завершена")
                )
            elif event_type == "error":
                result = event.get("result", {})
                task_monitor.update_task(
                    task_id, "error",
                    error=result.get("details", "Ошибка синхронизации")
                )
                
    except Exception as e:
        logger.error(f"SYNC FROM LOGS TASK: ошибка: {e}")
        task_monitor.update_task(task_id, "error", error=f"Ошибка: {str(e)}")
    finally:
        SessionLocal.remove()


@router.post("/sync-from-logs")
def sync_stats_from_callback_logs(background_tasks: BackgroundTasks):
    """
    Запускает фоновую синхронизацию статистики из существующих VkCallbackLog.
    
    Возвращает taskId для отслеживания прогресса через GET /lists/system/getTaskStatus/{taskId}.
    Парсит логи message_new/message_reply, извлекает project_id, user_id, timestamp
    и заполняет таблицы статистики. Идемпотентна — можно вызывать повторно.
    """
    PROJECT_ID_GLOBAL = "GLOBAL"
    TASK_TYPE = "sync_from_logs"
    
    # Проверяем, не запущена ли уже
    existing_task_id = task_monitor.get_active_task_id(PROJECT_ID_GLOBAL, TASK_TYPE)
    if existing_task_id:
        return {"taskId": existing_task_id}
    
    new_task_id = str(uuid.uuid4())
    task_monitor.start_task(new_task_id, PROJECT_ID_GLOBAL, TASK_TYPE)
    
    background_tasks.add_task(_sync_from_logs_task, new_task_id)
    
    return {"taskId": new_task_id}


# =============================================================================
# СВЕРКА С VK API (Reconciliation)
# =============================================================================

@router.post("/reconcile")
def reconcile_stats_from_vk(
    date_from: Optional[str] = Query(None, description="Фильтр: начало диапазона YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="Фильтр: конец диапазона YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Сверяет статистику с реальными данными из VK API (messages.getHistory).
    
    Возвращает SSE-поток с событиями прогресса:
    - start: начало сверки (total_dialogs, total_projects)
    - progress: промежуточный прогресс (processed/total)
    - complete: сверка завершена (финальные stats)
    - error: ошибка сверки
    
    Идемпотентна — повторный вызов не увеличивает счётчики.
    """
    def event_generator():
        try:
            for event in message_stats_crud.reconcile_from_vk_streaming(db, date_from, date_to):
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        except Exception as e:
            logger.error(f"Ошибка сверки: {e}")
            error_event = {
                "type": "error",
                "message": str(e),
                "stats": {"details": f"Ошибка сверки: {str(e)}"},
            }
            yield f"data: {json.dumps(error_event, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Отключаем буферизацию nginx
        },
    )


# =============================================================================
# СТАТИСТИКА ПО АДМИНИСТРАТОРАМ
# =============================================================================

@router.get("/admins")
def get_admin_stats(
    date_from: Optional[str] = Query(None, description="Начало диапазона YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="Конец диапазона YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Агрегированная статистика по администраторам/менеджерам.
    Кто сколько сообщений отправил, в скольких диалогах участвовал.
    """
    admins = message_stats_crud.get_admin_stats(db, date_from, date_to)
    return {
        "success": True,
        "admins": admins,
    }


@router.get("/admin/{sender_id}/dialogs")
def get_admin_dialogs(
    sender_id: str,
    date_from: Optional[str] = Query(None, description="Начало диапазона YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="Конец диапазона YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    Диалоги конкретного администратора с детализацией по проектам.
    Позволяет увидеть какие диалоги вёл менеджер и перейти в них.
    """
    dialogs_data = message_stats_crud.get_admin_dialogs(db, sender_id, date_from, date_to)
    return {
        "success": True,
        "sender_id": sender_id,
        **dialogs_data,
    }
