# Сервис распределения токенов для массового редактирования

from typing import List, Dict, Set, Tuple
from sqlalchemy.orm import Session

import crud
from config import settings
from services.vk_api.admin_tokens import get_admin_tokens_for_group


def distribute_posts_to_admins(
    posts: List[dict],  # List of PostToEdit dicts
    db: Session
) -> Dict[str, List[dict]]:
    """
    Распределяет посты между админ-токенами для обработки.
    Каждый проект назначается на один токен-админ.
    
    Args:
        posts: Список постов для редактирования
        db: Сессия БД
        
    Returns:
        Dict[token_string, List[posts_to_edit]]
    """
    print(f"[BULK_EDIT] Distributing {len(posts)} posts to admin tokens...", flush=True)
    
    # 1. Группируем посты по project_id
    posts_by_project: Dict[str, List[dict]] = {}
    for post in posts:
        project_id = post['projectId']
        if project_id not in posts_by_project:
            posts_by_project[project_id] = []
        posts_by_project[project_id].append(post)
    
    print(f"[BULK_EDIT] Posts grouped into {len(posts_by_project)} projects", flush=True)
    
    # 2. Для каждого проекта получаем vkProjectId и список админ-токенов
    project_admins: Dict[str, List[str]] = {}  # project_id -> [token_strings]
    project_vk_ids: Dict[str, int] = {}  # project_id -> vkProjectId
    
    for project_id in posts_by_project.keys():
        project = crud.get_project_by_id(db, project_id)
        if project and project.vkProjectId:
            try:
                vk_id = int(project.vkProjectId)
                project_vk_ids[project_id] = vk_id
                
                # Получаем токены админов этой группы (из кэша/БД)
                admin_tokens = get_admin_tokens_for_group(vk_id)
                token_strings = [t.token for t in admin_tokens if t.token]
                
                if token_strings:
                    project_admins[project_id] = token_strings
                    print(f"[BULK_EDIT] Project {project_id}: found {len(token_strings)} admin tokens", flush=True)
                else:
                    print(f"[BULK_EDIT] Project {project_id}: no admin tokens found", flush=True)
                    
            except (ValueError, TypeError) as e:
                print(f"[BULK_EDIT] Project {project_id}: invalid vkProjectId - {e}", flush=True)
    
    # 3. Собираем все уникальные токены и их проекты
    token_to_projects: Dict[str, Set[str]] = {}
    for project_id, tokens in project_admins.items():
        for token in tokens:
            if token not in token_to_projects:
                token_to_projects[token] = set()
            token_to_projects[token].add(project_id)
    
    print(f"[BULK_EDIT] Total unique admin tokens: {len(token_to_projects)}", flush=True)
    
    # 4. Распределяем — жадный алгоритм
    token_assignments: Dict[str, List[dict]] = {}
    assigned_projects: Set[str] = set()
    
    # Сортируем токены по количеству проектов (больше = выше приоритет)
    sorted_tokens = sorted(
        token_to_projects.keys(),
        key=lambda t: len(token_to_projects[t]),
        reverse=True
    )
    
    for token in sorted_tokens:
        for project_id in token_to_projects[token]:
            if project_id not in assigned_projects:
                # Назначаем все посты этого проекта этому токену
                if token not in token_assignments:
                    token_assignments[token] = []
                token_assignments[token].extend(posts_by_project[project_id])
                assigned_projects.add(project_id)
    
    # 5. Fallback: если какие-то проекты не назначены, используем user_token
    unassigned_projects = set(posts_by_project.keys()) - assigned_projects
    if unassigned_projects:
        fallback_token = settings.vk_user_token
        print(f"[BULK_EDIT] {len(unassigned_projects)} projects unassigned, using fallback token", flush=True)
        
        if fallback_token:
            if fallback_token not in token_assignments:
                token_assignments[fallback_token] = []
            for project_id in unassigned_projects:
                token_assignments[fallback_token].extend(posts_by_project[project_id])
    
    # Логируем распределение
    for token, assigned_posts in token_assignments.items():
        token_preview = f"...{token[-4:]}" if len(token) > 4 else token
        print(f"[BULK_EDIT] Token {token_preview}: {len(assigned_posts)} posts assigned", flush=True)
    
    return token_assignments


def get_all_available_tokens(db: Session) -> List[str]:
    """
    Получает все доступные токены для fallback.
    """
    tokens = []
    
    # Токен из настроек
    if settings.vk_user_token:
        tokens.append(settings.vk_user_token)
    
    # Токены системных аккаунтов
    try:
        system_tokens = crud.get_active_account_tokens(db)
        tokens.extend(system_tokens)
    except Exception as e:
        print(f"[BULK_EDIT] Warning: Failed to get system tokens: {e}", flush=True)
    
    # Убираем дубликаты
    seen = set()
    unique = []
    for t in tokens:
        if t and t not in seen:
            unique.append(t)
            seen.add(t)
    
    return unique
