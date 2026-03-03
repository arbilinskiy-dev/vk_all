"""
Утилиты для работы с токенами и распределения проектов.

Содержит функции:
- get_all_tokens_with_names — сбор токенов из ENV и System Accounts
- check_admin_rights_batch — проверка админских прав для токенов
- distribute_projects_to_state — распределение проектов по токенам
"""

import time
from typing import List, Dict, Tuple, Optional

import crud
from services.vk_api.api_client import call_vk_api as raw_vk_call
from config import settings

from .models import ProjectStatus
from .state import BulkRefreshState


def get_all_tokens_with_names(db) -> List[Tuple[str, str]]:
    """
    Собирает все доступные токены с их названиями.
    
    Источники:
    1. Основной токен из ENV (VK_USER_TOKEN)
    2. System Accounts из БД со статусом 'active'
    
    Args:
        db: Сессия БД
        
    Returns:
        Список кортежей (token, name)
    """
    tokens = []
    
    # Токен из ENV
    if settings.vk_user_token:
        tokens.append((settings.vk_user_token, "Основной (ENV)"))
    
    # System Accounts из БД
    system_accounts = crud.get_all_accounts(db)
    for acc in system_accounts:
        if acc.token is not None and str(acc.status) == 'active':
            tokens.append((str(acc.token), acc.full_name or f"Аккаунт {acc.vk_user_id}"))
    
    return tokens


def check_admin_rights_batch(tokens: List[Tuple[str, str]], group_ids: List[str]) -> Dict[str, List[str]]:
    """
    Проверяет админские права для всех токенов.
    
    Для каждого токена запрашивает список групп, где он админ,
    и сопоставляет с переданными group_ids.
    
    Args:
        tokens: Список кортежей (token, name)
        group_ids: Список VK ID групп для проверки
        
    Returns:
        Словарь {token: [matching_group_ids]}
    """
    admin_map = {token: [] for token, _ in tokens}
    group_ids_set = set(group_ids)
    
    print(f"PARALLEL_BULK: Проверяем админские права {len(tokens)} токенов...")
    
    for token, name in tokens:
        try:
            response = raw_vk_call('groups.get', {
                'filter': 'admin',
                'extended': 0,
                'count': 1000,
                'access_token': token
            })
            
            admin_group_ids = response.get('items', [])
            matching_groups = [str(gid) for gid in admin_group_ids if str(gid) in group_ids_set]
            admin_map[token] = matching_groups
            
            print(f"   -> {name}: админ в {len(matching_groups)} группах из наших проектов")
            time.sleep(2.0)
            
        except Exception as e:
            print(f"   -> {name}: ошибка проверки - {e}")
    
    return admin_map


def distribute_projects_to_state(state: BulkRefreshState, project_ids: Optional[List[str]] = None):
    """
    Распределяет проекты по активным токенам.
    
    Алгоритм:
    1. Если у проекта есть токен-админ — назначаем на него
    2. Иначе — на наименее загруженный токен
    
    Args:
        state: Состояние задачи
        project_ids: Список ID проектов для распределения.
                    Если None — распределяет все pending/reassigned проекты.
    """
    active_tokens = state.get_active_tokens()
    if not active_tokens:
        print("PARALLEL_BULK: Нет активных токенов для распределения!")
        return
    
    with state.lock:
        # Определяем проекты для распределения
        if project_ids is None:
            project_ids = [
                pid for pid, pp in state.projects_progress.items() 
                if pp.status in [ProjectStatus.PENDING, ProjectStatus.REASSIGNED]
            ]
        
        # Подсчитываем текущую нагрузку токенов
        token_loads = {ts.token: len(ts.assigned_projects) for ts in active_tokens}
        
        for project_id in project_ids:
            pp = state.projects_progress.get(project_id)
            if not pp:
                continue
            
            # Находим токены с админскими правами
            admin_tokens = [ts for ts in active_tokens if pp.vk_id in ts.admin_in_groups]
            
            if admin_tokens:
                # Выбираем наименее загруженный среди админов
                target = min(admin_tokens, key=lambda x: token_loads[x.token])
            else:
                # Выбираем наименее загруженный токен
                target = min(active_tokens, key=lambda x: token_loads[x.token])
            
            # Назначаем проект
            target.assigned_projects.append(project_id)
            token_loads[target.token] += 1
            pp.token_name = target.name
            pp.is_admin = pp.vk_id in target.admin_in_groups
            pp.status = ProjectStatus.PENDING
