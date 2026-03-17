"""
Общие утилиты для синхронизации DLVRY.
"""

import asyncio


def run_async(coro):
    """Запустить корутину синхронно (с учётом уже запущенного event loop)."""
    try:
        return asyncio.run(coro)
    except RuntimeError:
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(coro)
        finally:
            loop.close()
