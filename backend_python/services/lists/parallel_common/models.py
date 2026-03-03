"""
Модели данных для параллельной обработки.

Содержит структуры для отслеживания прогресса проектов и состояния токенов.
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import List


class ProjectStatus(str, Enum):
    """Статусы проекта в процессе обработки."""
    PENDING = "pending"           # Ожидает обработки
    PROCESSING = "processing"     # Запущена обработка
    FETCHING = "fetching"         # Скачивание данных из VK
    SAVING = "saving"             # Сохранение в БД
    DONE = "done"                 # Успешно завершён
    ERROR = "error"               # Ошибка
    REASSIGNED = "reassigned"     # Переназначен на другой токен


@dataclass
class ProjectProgress:
    """Прогресс обработки одного проекта."""
    project_id: str
    project_name: str
    vk_id: str
    status: str = ProjectStatus.PENDING
    token_name: str = ""           # Какой токен обрабатывает
    loaded: int = 0                # Скачано элементов
    total: int = 0                 # Всего элементов
    added: int = 0                 # Новых элементов
    left: int = 0                  # Ушедших элементов
    error: str = ""                # Текст ошибки
    is_admin: bool = False         # Токен — админ в этой группе
    
    def to_dict(self) -> dict:
        """Конвертация в словарь для JSON."""
        return {
            'project_id': self.project_id,
            'project_name': self.project_name,
            'vk_id': self.vk_id,
            'status': self.status,
            'token_name': self.token_name,
            'loaded': self.loaded,
            'total': self.total,
            'added': self.added,
            'left': self.left,
            'error': self.error,
            'is_admin': self.is_admin
        }


@dataclass
class TokenState:
    """Состояние токена в процессе обработки."""
    token: str
    name: str
    admin_in_groups: List[str] = field(default_factory=list)
    assigned_projects: List[str] = field(default_factory=list)  # ID проектов
    is_active: bool = True         # Активен ли токен
    flood_control: bool = False    # Получил flood control
    processed_count: int = 0
    error_count: int = 0
