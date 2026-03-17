"""
Глобальное состояние для bulk refresh задачи.

Класс BulkRefreshState обеспечивает потокобезопасный доступ
к прогрессу проектов и состоянию токенов.
"""

import json
import threading
from typing import List, Dict, Tuple

from .models import ProjectStatus, ProjectProgress, TokenState


class BulkRefreshState:
    """
    Глобальное состояние для bulk refresh задачи.
    
    Обеспечивает потокобезопасный доступ к:
    - Прогрессу каждого проекта
    - Состоянию каждого токена
    - Очереди осиротевших проектов
    - Тротлингу обновлений прогресса
    """
    
    def __init__(
        self, 
        task_id: str, 
        projects: List[dict], 
        tokens: List[Tuple[str, str]], 
        admin_map: Dict[str, List[str]]
    ):
        """
        Инициализирует состояние задачи.
        
        Args:
            task_id: ID задачи для отслеживания
            projects: Список проектов [{'id', 'name', 'vk_id'}]
            tokens: Список токенов [(token, name)]
            admin_map: Словарь {token: [vk_group_ids]} — где токен админ
        """
        self.task_id = task_id
        self.lock = threading.Lock()
        
        # Инициализируем прогресс проектов
        self.projects_progress: Dict[str, ProjectProgress] = {}
        for p in projects:
            self.projects_progress[p['id']] = ProjectProgress(
                project_id=p['id'],
                project_name=p['name'],
                vk_id=p['vk_id']
            )
        
        # Инициализируем состояние токенов
        self.tokens_state: Dict[str, TokenState] = {}
        for token, name in tokens:
            self.tokens_state[token] = TokenState(
                token=token,
                name=name,
                admin_in_groups=admin_map.get(token, [])
            )
        
        # Очередь проектов для переназначения
        self.orphaned_projects: List[str] = []
        
        # Community-токены по проектам (read-only после инициализации)
        # {project_id: [community_token_1, community_token_2, ...]}
        self.community_tokens_map: Dict[str, List[str]] = {}
        
        # Статистика
        self.total_done = 0
        self.total_errors = 0
        
        # Тротлинг обновления прогресса
        self._last_progress_update: float = 0.0
        self._progress_update_interval: float = 5.0  # Обновлять не чаще чем раз в 5 секунд
    
    def assign_project(self, project_id: str, token: str):
        """Назначает проект на токен."""
        with self.lock:
            if token in self.tokens_state:
                self.tokens_state[token].assigned_projects.append(project_id)
                pp = self.projects_progress.get(project_id)
                if pp:
                    pp.token_name = self.tokens_state[token].name
                    pp.is_admin = pp.vk_id in self.tokens_state[token].admin_in_groups
    
    def update_project(self, project_id: str, **kwargs):
        """Обновляет прогресс проекта."""
        with self.lock:
            pp = self.projects_progress.get(project_id)
            if pp:
                for key, value in kwargs.items():
                    if hasattr(pp, key):
                        setattr(pp, key, value)
    
    def mark_project_done(self, project_id: str, added: int = 0, left: int = 0):
        """Помечает проект как завершённый."""
        with self.lock:
            pp = self.projects_progress.get(project_id)
            if pp:
                pp.status = ProjectStatus.DONE
                pp.added = added
                pp.left = left
            self.total_done += 1
    
    def mark_project_error(self, project_id: str, error: str):
        """Помечает проект как ошибку."""
        with self.lock:
            pp = self.projects_progress.get(project_id)
            if pp:
                pp.status = ProjectStatus.ERROR
                pp.error = error
            self.total_errors += 1
    
    def disable_token(self, token: str, reason: str = "flood_control"):
        """Отключает токен и собирает его необработанные проекты."""
        with self.lock:
            ts = self.tokens_state.get(token)
            if ts and ts.is_active:
                ts.is_active = False
                ts.flood_control = (reason == "flood_control")
                
                # Собираем необработанные проекты
                for pid in ts.assigned_projects:
                    pp = self.projects_progress.get(pid)
                    if pp and pp.status in [ProjectStatus.PENDING, ProjectStatus.PROCESSING]:
                        pp.status = ProjectStatus.REASSIGNED
                        pp.token_name = ""
                        self.orphaned_projects.append(pid)
                
                print(f"PARALLEL_BULK: Токен '{ts.name}' отключён ({reason}). "
                      f"Осиротевших проектов: {len(self.orphaned_projects)}")
    
    def get_active_tokens(self) -> List[TokenState]:
        """Возвращает список активных токенов."""
        with self.lock:
            return [ts for ts in self.tokens_state.values() if ts.is_active]
    
    def pop_orphaned_projects(self) -> List[str]:
        """Забирает список осиротевших проектов."""
        with self.lock:
            orphaned = self.orphaned_projects.copy()
            self.orphaned_projects.clear()
            return orphaned
    
    def get_progress_json(self) -> str:
        """Возвращает JSON со всеми проектами для UI."""
        with self.lock:
            projects_list = [pp.to_dict() for pp in self.projects_progress.values()]
            # Сортируем: processing сначала, потом pending, потом done/error
            status_order = {
                ProjectStatus.FETCHING: 0,
                ProjectStatus.PROCESSING: 1,
                ProjectStatus.SAVING: 2,
                ProjectStatus.PENDING: 3,
                ProjectStatus.REASSIGNED: 4,
                ProjectStatus.DONE: 5,
                ProjectStatus.ERROR: 6
            }
            projects_list.sort(key=lambda x: (status_order.get(x['status'], 99), x['project_name']))
            return json.dumps(projects_list, ensure_ascii=False)
    
    def get_summary(self) -> dict:
        """Возвращает сводку для основного прогресс-бара."""
        with self.lock:
            total = len(self.projects_progress)
            done = sum(1 for pp in self.projects_progress.values() if pp.status == ProjectStatus.DONE)
            errors = sum(1 for pp in self.projects_progress.values() if pp.status == ProjectStatus.ERROR)
            processing = sum(1 for pp in self.projects_progress.values() 
                           if pp.status in [ProjectStatus.PROCESSING, ProjectStatus.FETCHING, ProjectStatus.SAVING])
            
            active_tokens = [ts.name for ts in self.tokens_state.values() if ts.is_active]
            disabled_tokens = [ts.name for ts in self.tokens_state.values() if not ts.is_active]
            
            return {
                'total': total,
                'done': done,
                'errors': errors,
                'processing': processing,
                'active_tokens': active_tokens,
                'disabled_tokens': disabled_tokens
            }
