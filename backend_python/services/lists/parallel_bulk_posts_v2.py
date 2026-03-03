"""
Сервис параллельной обработки постов с умным распределением токенов.

ФАЙЛ-ХАБ: Логика вынесена в модуль parallel_posts/.
Этот файл сохранён для обратной совместимости импортов.

Структура модуля:
- parallel_posts/fetcher.py    — скачивание постов из VK
- parallel_posts/processor.py  — обработка одного проекта
- parallel_posts/progress.py   — обновление прогресса задачи
- parallel_posts/worker.py     — воркер для токена
- parallel_posts/orchestrator.py — главная функция координации
"""

# Реэкспорт главной функции для обратной совместимости
from .parallel_posts import run_parallel_posts_refresh_v2

__all__ = ['run_parallel_posts_refresh_v2']
