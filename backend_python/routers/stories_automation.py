"""
Хаб-роутер автоматизации историй.
Собирает все эндпоинты из подмодулей routers/stories/.

Структура:
  stories/
    schemas.py              — Pydantic-схемы запросов/ответов
    dependencies.py         — get_db(), хелперы (токены, резолвер логов, парсинг VK)
    settings_routes.py      — Настройки автоматизации и логи
    retrieval_routes.py     — Получение/обновление списка историй, дашборд
    stats_routes.py         — Статистика, зрители, комбинированное обновление
    publish_routes.py       — Ручная и прямая публикация историй
    multi_publish_routes.py — Мультипроектная параллельная публикация
"""
from fastapi import APIRouter

from routers.stories.settings_routes import router as settings_router
from routers.stories.retrieval_routes import router as retrieval_router
from routers.stories.stats_routes import router as stats_router
from routers.stories.publish_routes import router as publish_router
from routers.stories.multi_publish_routes import router as multi_publish_router

router = APIRouter()

# Настройки и логи автоматизации
router.include_router(settings_router)

# Получение и обновление списка историй
router.include_router(retrieval_router)

# Статистика и зрители
router.include_router(stats_router)

# Публикация историй (ручная + прямая)
router.include_router(publish_router)

# Мультипроектная публикация
router.include_router(multi_publish_router)

