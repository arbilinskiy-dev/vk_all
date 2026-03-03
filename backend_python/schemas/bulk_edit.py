# Схемы для массового редактирования постов

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from .base_models import PhotoAttachment, Attachment


# ===============================================
# ЗАПРОС НА ПОИСК
# ===============================================

class SourcePostInfo(BaseModel):
    """Информация об исходном посте для поиска совпадений."""
    id: str
    postType: str  # 'published' | 'scheduled' | 'system'
    projectId: str
    text: str
    date: str  # ISO дата публикации
    attachmentIds: List[str] = []  # ID вложений (для обратной совместимости)


class MatchCriteria(BaseModel):
    """Критерии сопоставления постов."""
    byDateTime: bool = False      # Совпадение даты и времени
    byText: bool = False          # Полное совпадение текста


class TargetPostTypes(BaseModel):
    """Какие типы постов искать."""
    published: bool = True
    scheduled: bool = True
    system: bool = True


class BulkEditSearchRequest(BaseModel):
    """Запрос на поиск постов для массового редактирования."""
    sourcePost: SourcePostInfo
    matchCriteria: MatchCriteria
    searchFromDate: str  # ISO дата, не искать посты раньше этой даты
    targetProjectIds: List[str]  # В каких проектах искать
    targetPostTypes: TargetPostTypes


# ===============================================
# ОТВЕТ НА ПОИСК
# ===============================================

class FoundPost(BaseModel):
    """Найденный пост."""
    id: str
    postType: str  # 'published' | 'scheduled' | 'system'
    projectId: str
    projectName: str
    date: str
    textPreview: str  # Первые 100 символов
    attachmentPreviews: List[str] = []  # URL миниатюр вложений
    imageCount: int
    attachmentCount: int


class SearchStats(BaseModel):
    """Статистика поиска."""
    totalFound: int
    byType: Dict[str, int]  # {'published': X, 'scheduled': Y, 'system': Z}
    projectCount: int


class BulkEditSearchResponse(BaseModel):
    """Ответ на запрос поиска."""
    sourcePost: FoundPost
    matchedPosts: List[FoundPost]
    stats: SearchStats


# ===============================================
# ЗАПРОС НА ПРИМЕНЕНИЕ ИЗМЕНЕНИЙ
# ===============================================

class PostToEdit(BaseModel):
    """Пост для редактирования."""
    id: str
    postType: str  # 'published' | 'scheduled' | 'system'
    projectId: str


class BulkEditChanges(BaseModel):
    """Изменения для применения (null = не менять)."""
    text: Optional[str] = None
    images: Optional[List[PhotoAttachment]] = None
    attachments: Optional[List[Attachment]] = None
    date: Optional[str] = None  # Новая дата публикации (ISO)


class BulkEditApplyRequest(BaseModel):
    """Запрос на применение массового редактирования."""
    posts: List[PostToEdit]
    changes: BulkEditChanges


# ===============================================
# ОТВЕТ НА ПРИМЕНЕНИЕ
# ===============================================

class BulkEditApplyResponse(BaseModel):
    """Ответ на запрос применения (запуск фоновой задачи)."""
    taskId: str


class TaskProgress(BaseModel):
    """Прогресс выполнения задачи."""
    total: int
    completed: int
    failed: int
    current: Optional[str] = None  # Текущий проект/пост


class TaskError(BaseModel):
    """Ошибка при обработке поста."""
    postId: str
    projectName: str
    error: str


class BulkEditTaskStatus(BaseModel):
    """Статус фоновой задачи массового редактирования."""
    status: str  # 'pending' | 'running' | 'done' | 'error'
    progress: TaskProgress
    errors: List[TaskError] = []
    affectedProjectIds: List[str] = []
