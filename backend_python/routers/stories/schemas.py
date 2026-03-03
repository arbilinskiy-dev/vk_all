"""
Pydantic-схемы для эндпоинтов автоматизации историй.
"""
from pydantic import BaseModel


class StoriesAutomationSchema(BaseModel):
    is_active: bool
    keywords: str | None = None


class GetPayload(BaseModel):
    projectId: str
    refresh: bool = False
    limit: int = 50  # 0 = без лимита
    offset: int = 0


class DashboardStatsPayload(BaseModel):
    """ Параметры для агрегированной статистики дашборда """
    projectId: str
    periodType: str = 'all'       # all/week/month/quarter/year/custom
    filterType: str = 'all'       # all/auto/manual
    customStartDate: str | None = None
    customEndDate: str | None = None


class UpdatePayload(BaseModel):
    projectId: str
    settings: StoriesAutomationSchema


class ManualPublishPayload(BaseModel):
    projectId: str
    vkPostId: int


class UpdateStatsPayload(BaseModel):
    projectId: str
    mode: str 
    logId: str | None = None
    vkStoryId: int | None = None
    count: int | None = None
    days: int | None = None


class StoriesFreshnessResponse(BaseModel):
    is_stale: bool
    last_update: str | None = None
    stale_minutes: int = 5  # Порог в минутах
