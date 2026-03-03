"""
Модуль параллельной обработки подписчиков с умным распределением токенов.

Экспортирует главную функцию для использования в других частях приложения.
"""

from .orchestrator import run_parallel_subscribers_refresh_v2

__all__ = ['run_parallel_subscribers_refresh_v2']
