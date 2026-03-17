
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import uuid

import schemas
import services.management_service as management_service
import services.admin_tools_service as admin_tools_service # New import
import services.task_monitor as task_monitor
from database import get_db
from config import settings

router = APIRouter(prefix="/management", tags=["Database Management"])

@router.post("/getAllProjects", response_model=List[schemas.Project])
def get_all_projects(db: Session = Depends(get_db)):
    """Возвращает полный список всех АКТИВНЫХ проектов для страницы управления."""
    data = management_service.get_all_projects_for_management(db)
    return data

@router.post("/getArchivedProjects", response_model=List[schemas.Project])
def get_archived_projects(db: Session = Depends(get_db)):
    """Возвращает список всех архивированных проектов."""
    return management_service.get_archived_projects(db)

@router.post("/permanentlyDeleteProject", response_model=schemas.GenericSuccess)
def permanently_delete_project(payload: schemas.ProjectIdPayload, db: Session = Depends(get_db)):
    """Безвозвратно удаляет проект и все связанные с ним данные."""
    management_service.permanently_delete_project(db, payload.projectId)
    return {"success": True}


@router.post("/updateProjects", response_model=schemas.GenericSuccess)
def update_projects(payload: schemas.UpdateProjectsPayload, db: Session = Depends(get_db)):
    """Массово обновляет данные для списка проектов."""
    management_service.update_projects(db, payload.projects)
    return {"success": True}

@router.post("/addProjectsByUrls", response_model=schemas.AddProjectsByUrlsResponse)
def add_projects_by_urls(payload: schemas.AddProjectsByUrlsPayload, db: Session = Depends(get_db)):
    """Добавляет новые проекты из списка URL-адресов VK."""
    return management_service.add_projects_by_urls(db, payload.urls, settings.vk_user_token)

# --- Administered Groups Endpoints (NEW) ---

@router.post("/administered-groups/get", response_model=List[schemas.AdministeredGroup])
def get_administered_groups(db: Session = Depends(get_db)):
    """Получает список администрируемых групп из БД."""
    return admin_tools_service.get_all_administered_groups(db)

@router.post("/administered-groups/sync", response_model=schemas.SyncAdministeredGroupsResponse)
def sync_administered_groups(db: Session = Depends(get_db)):
    """Запускает процесс синхронизации администрируемых групп с VK."""
    return admin_tools_service.sync_administered_groups(db)

@router.post("/administered-groups/promote-to-admins", response_model=schemas.PromoteToAdminsResponse)
def promote_to_admins(payload: schemas.PromoteToAdminsPayload, db: Session = Depends(get_db)):
    """
    Массовое назначение системных страниц администраторами в группах VK.
    Автоматически вступает в группы, если пользователь не является участником.
    """
    return admin_tools_service.promote_to_admins(
        db, 
        group_ids=payload.group_ids, 
        user_ids=payload.user_ids, 
        role=payload.role,
        include_env_token=payload.include_env_token
    )

@router.post("/administered-groups/{group_id}/sync-admins", response_model=schemas.AdministeredGroup)
def sync_group_admins(group_id: int, db: Session = Depends(get_db)):
    """Сканирует и обновляет список администраторов для указанной группы (синхронно)."""
    return admin_tools_service.sync_group_admins(db, group_id)

@router.post("/administered-groups/sync-admins-bulk", response_model=schemas.TaskStartResponse)
def sync_admins_bulk(background_tasks: BackgroundTasks):
    """
    Запускает фоновую задачу умного сбора админов для ВСЕХ групп.
    """
    PROJECT_ID_GLOBAL = "GLOBAL"
    TASK_TYPE = "sync_admins_bulk"
    
    # Проверяем, не запущена ли уже
    existing_task_id = task_monitor.get_active_task_id(PROJECT_ID_GLOBAL, TASK_TYPE)
    if existing_task_id:
        return {"taskId": existing_task_id}
    
    new_task_id = str(uuid.uuid4())
    task_monitor.start_task(new_task_id, PROJECT_ID_GLOBAL, TASK_TYPE)
    
    background_tasks.add_task(
        admin_tools_service.refresh_all_group_admins_task,
        new_task_id
    )
    
    return {"taskId": new_task_id}


# --- BULK REFRESH ALL PROJECTS ENDPOINTS ---

@router.post("/refresh-all-subscribers", response_model=schemas.TaskStartResponse)
def refresh_all_subscribers(background_tasks: BackgroundTasks):
    """
    Запускает фоновую задачу для последовательного обновления подписчиков ВСЕХ активных проектов.
    Это тяжелая операция, которую можно "пнуть" если что-то пошло не так.
    """
    PROJECT_ID_GLOBAL = "GLOBAL"
    TASK_TYPE = "refresh_all_subscribers"
    
    # Проверяем, не запущена ли уже
    existing_task_id = task_monitor.get_active_task_id(PROJECT_ID_GLOBAL, TASK_TYPE)
    if existing_task_id:
        return {"taskId": existing_task_id}
    
    new_task_id = str(uuid.uuid4())
    task_monitor.start_task(new_task_id, PROJECT_ID_GLOBAL, TASK_TYPE)
    
    background_tasks.add_task(
        admin_tools_service.refresh_all_subscribers_task,
        new_task_id,
        settings.vk_user_token
    )
    
    return {"taskId": new_task_id}


@router.post("/refresh-all-posts", response_model=schemas.TaskStartResponse)
def refresh_all_posts(payload: schemas.RefreshAllPostsPayload, background_tasks: BackgroundTasks):
    """
    Запускает фоновую задачу для параллельного сбора постов ВСЕХ активных проектов.
    
    mode:
      - 'limit': скачивает limit постов для каждого проекта
      - 'actual': проверяет БД, если постов >= VK — пропускает (быстрая актуализация)
    """
    PROJECT_ID_GLOBAL = "GLOBAL"
    TASK_TYPE = "refresh_all_posts"
    
    # Проверяем, не запущена ли уже
    existing_task_id = task_monitor.get_active_task_id(PROJECT_ID_GLOBAL, TASK_TYPE)
    if existing_task_id:
        return {"taskId": existing_task_id}
    
    new_task_id = str(uuid.uuid4())
    task_monitor.start_task(new_task_id, PROJECT_ID_GLOBAL, TASK_TYPE)
    
    background_tasks.add_task(
        admin_tools_service.refresh_all_posts_task,
        new_task_id,
        settings.vk_user_token,
        payload.limit or '1000',
        payload.mode or 'limit'
    )
    
    return {"taskId": new_task_id}


@router.post("/refresh-all-mailing", response_model=schemas.TaskStartResponse)
def refresh_all_mailing(background_tasks: BackgroundTasks):
    """
    Запускает фоновую задачу для обновления рассылки (dialogs) ВСЕХ проектов с community-токенами.
    Каждый проект использует свои community-токены для параллельного сбора.
    """
    PROJECT_ID_GLOBAL = "GLOBAL"
    TASK_TYPE = "refresh_all_mailing"
    
    # Проверяем, не запущена ли уже
    existing_task_id = task_monitor.get_active_task_id(PROJECT_ID_GLOBAL, TASK_TYPE)
    if existing_task_id:
        return {"taskId": existing_task_id}
    
    new_task_id = str(uuid.uuid4())
    task_monitor.start_task(new_task_id, PROJECT_ID_GLOBAL, TASK_TYPE)
    
    background_tasks.add_task(
        admin_tools_service.refresh_all_mailing_task,
        new_task_id
    )
    
    return {"taskId": new_task_id}
