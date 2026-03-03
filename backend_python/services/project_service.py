
from sqlalchemy.orm import Session
from fastapi import HTTPException
import time

import crud
import services.automations.reviews.crud as crud_automations # Import automations crud
import schemas
from database import SessionLocal
from models_library.automations import StoriesAutomation
# ИЗМЕНЕНО: Прямые импорты модулей вместо from services import ...
import services.task_monitor as task_monitor
import services.post_retrieval_service as post_retrieval_service
# Добавляем сервис товаров для массового обновления
import services.market_service as market_service
from config import settings

def get_initial_data(db: Session) -> dict:
    projects = crud.get_all_projects(db)
    suggested_counts = crud.get_suggested_post_counts(db)
    
    # Fill in counts for projects with 0 suggested posts
    for p in projects:
        if p.id not in suggested_counts:
            suggested_counts[p.id] = 0
            
    # Получаем статусы конкурсов отзывов
    reviews_contest_statuses = crud_automations.get_all_contest_statuses(db)
    
    # Получаем статусы автоматизации историй (is_active для каждого проекта)
    stories_rows = db.query(
        StoriesAutomation.project_id,
        StoriesAutomation.is_active
    ).all()
    stories_automation_statuses = {row.project_id: row.is_active for row in stories_rows}
            
    return {
        "projects": projects,
        "allPosts": {},
        "suggestedPostCounts": suggested_counts,
        "reviewsContestStatuses": reviews_contest_statuses,
        "storiesAutomationStatuses": stories_automation_statuses
    }

def get_project_details(db: Session, project_id: str) -> schemas.Project:
    project = crud.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found.")
    return project

def update_project_settings(db: Session, project_data: schemas.Project) -> schemas.Project:
    updated_project = crud.update_project_settings(db, project_data)
    if not updated_project:
        raise HTTPException(status_code=404, detail=f"Project with id {project_data.id} not found for update.")
    return updated_project

def get_project_variables(db: Session, project_id: str) -> list[dict]:
    return crud.get_project_variables(db, project_id)

# --- Background Tasks ---

def refresh_all_projects_task(task_id: str, view_type: str = 'schedule'):
    """
    Фоновая задача для последовательного обновления всех активных проектов.
    Запрашивает данные в зависимости от view_type.
    
    ВАЖНО: Использует Session Rotation - для каждого проекта создаётся новая сессия,
    чтобы не держать одно соединение открытым на протяжении всего обновления.
    """
    
    # === ЭТАП 1: ПОЛУЧЕНИЕ СПИСКА ПРОЕКТОВ (короткая сессия) ===
    projects_list = []
    
    db = SessionLocal()
    try:
        projects = crud.get_all_projects(db)
        # Фильтруем disabled-проекты: они не имеют прав в VK и генерируют Error 15
        projects_list = [{'id': p.id, 'name': p.name} for p in projects if not p.disabled]
    finally:
        db.close()  # ЗАКРЫВАЕМ СРАЗУ
    
    total_count = len(projects_list)
    
    if total_count == 0:
        task_monitor.update_task(task_id, "done", message="Нет проектов для обновления")
        return
    
    # === ПРОГРЕВ КЭША (один раз перед циклом) ===
    # Загружаем admin-токены + community tokens для ВСЕХ групп за 2 запроса к БД,
    # а не по N запросов на каждый проект. Также предзаполняет stories.get и wall.get кэш.
    try:
        from services.vk_api.admin_tokens import warmup_cache_for_all_groups
        warmup_cache_for_all_groups()
    except Exception as warmup_err:
        print(f"TASK {task_id}: Warmup failed (non-critical): {warmup_err}")
    
    # === ЭТАП 2: ОБРАБОТКА ПРОЕКТОВ (Session Rotation) ===
    target_name = "расписание"
    if view_type == 'suggested':
        target_name = "предложенные посты"
    elif view_type == 'products':
        target_name = "товары"
        
    task_monitor.update_task(task_id, "processing", loaded=0, total=total_count, message=f"Найдено {total_count} проектов. Обновляем {target_name}.")
    
    success_count = 0
    error_count = 0
    
    for i, project_data in enumerate(projects_list):
        current_progress = i + 1
        project_id = project_data['id']
        project_name = project_data['name']
        
        # ВАЖНО: Добавляем спец. маркер [PID:...] в начало сообщения
        status_message = f"[PID:{project_id}] Обработка: {project_name}"
        
        task_monitor.update_task(
            task_id, 
            "processing", 
            loaded=current_progress, 
            total=total_count, 
            message=status_message
        )
        
        # Для каждого проекта создаём НОВУЮ короткую сессию
        db_project = SessionLocal()
        try:
            if view_type == 'suggested':
                post_retrieval_service.refresh_suggested_posts(db_project, project_id, settings.vk_user_token)
            elif view_type == 'products':
                market_service.refresh_all_market_data(db_project, project_id, settings.vk_user_token)
            else:
                # Default: schedule (scheduled + published + stories)
                post_retrieval_service.refresh_scheduled_posts(db_project, project_id, settings.vk_user_token)
                post_retrieval_service.refresh_published_posts(db_project, project_id, settings.vk_user_token)
                # Обновляем истории — они живут 24ч, поэтому важно держать кэш свежим
                try:
                    from services.automations.stories_service import get_unified_stories
                    get_unified_stories(db_project, project_id, refresh=True)
                except Exception as stories_err:
                    print(f"TASK {task_id}: Stories refresh failed for {project_name}: {stories_err}")
            
            success_count += 1
        except Exception as e:
            print(f"TASK {task_id}: Error refreshing project {project_name}: {e}")
            error_count += 1
            # Не прерываем цикл, идем к следующему проекту
        finally:
            db_project.close()  # Закрываем сессию для этого проекта
        
        # Небольшая пауза, чтобы не задушить VK API
        time.sleep(0.5)

    result_msg = f"Завершено. Успешно: {success_count}, Ошибок: {error_count}"
    task_monitor.update_task(task_id, "done", message=result_msg)