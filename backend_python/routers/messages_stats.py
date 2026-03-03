"""
Роутер для статистики нагрузки модуля сообщений.
Кросс-проектный дашборд мониторинга: общая сводка, графики, детализация по пользователям.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import json
import logging

from database import get_db
from crud import message_stats_crud
from models_library.projects import Project as ProjectModel

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
# СИНХРОНИЗАЦИЯ ИЗ CALLBACK-ЛОГОВ
# =============================================================================

@router.post("/sync-from-logs")
def sync_stats_from_callback_logs(db: Session = Depends(get_db)):
    """
    Синхронизирует статистику из существующих VkCallbackLog.
    
    Парсит логи message_new/message_reply, извлекает project_id, user_id, timestamp
    и заполняет таблицы статистики. Идемпотентна — можно вызывать повторно.
    Используется для первоначального заполнения статистики из уже накопленных логов.
    """
    result = message_stats_crud.sync_from_callback_logs(db)
    return {
        "success": True,
        **result,
    }


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
    
    Для каждого проекта+пользователя запрашивает 200 последних сообщений,
    считает реальные входящие/исходящие и корректирует через MAX()-подход.
    Идемпотентна — повторный вызов не увеличивает счётчики.
    """
    try:
        result = message_stats_crud.reconcile_from_vk(db, date_from, date_to)
        return {
            "success": True,
            **result,
        }
    except Exception as e:
        logger.error(f"Ошибка сверки: {e}")
        return {
            "success": False,
            "details": f"Ошибка сверки: {str(e)}",
        }


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
