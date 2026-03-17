"""
Фоновая полная синхронизация DLVRY статистики через SystemTask (task_monitor).
"""

import logging
import threading
import uuid
from datetime import timedelta, date
from typing import Optional

from config import settings

logger = logging.getLogger(__name__)


def run_full_sync_background(project_id: str, affiliate_id: str) -> Optional[str]:
    """
    Запускает полную синхронизацию DLVRY статистики в фоновом потоке.
    Используется при сохранении/изменении dlvry_affiliate_id в настройках проекта.
    Прогресс отслеживается через SystemTask (task_monitor).

    Returns:
        task_id если запущено, None если DLVRY_TOKEN не настроен.
    """
    token = settings.dlvry_token
    if not token:
        logger.warning("[DLVRY BG Sync] DLVRY_TOKEN не настроен — фоновая синхронизация пропущена")
        return None

    task_id = f"dlvry_full_sync_{project_id}_{uuid.uuid4().hex[:8]}"

    def _worker():
        from database import SessionLocal
        import services.task_monitor as task_monitor
        from services.dlvry.stats_sync_core import sync_full_backwards_gen

        task_monitor.start_task(task_id, project_id=project_id, list_type="dlvry_full_sync")
        task_monitor.update_task(
            task_id, status="fetching", loaded=0, total=0,
            message="Запуск полной загрузки DLVRY статистики..."
        )

        db = SessionLocal()
        try:
            yesterday = date.today() - timedelta(days=1)
            total_synced = 0
            chunk_num = 0

            for event in sync_full_backwards_gen(db, project_id, affiliate_id, token, yesterday):
                chunk_num = event.get("chunk", chunk_num)
                total_synced = event.get("total_days", total_synced)
                done = event.get("done", False)

                if done:
                    success = event.get("success", False)
                    error = event.get("error")
                    if success:
                        task_monitor.update_task(
                            task_id, status="done",
                            loaded=total_synced, total=total_synced,
                            message=f"Загружено {total_synced} дней статистики DLVRY"
                        )
                    else:
                        task_monitor.update_task(
                            task_id, status="error",
                            loaded=total_synced, total=total_synced,
                            message="Ошибка синхронизации DLVRY",
                            error=error or "Неизвестная ошибка"
                        )
                else:
                    task_monitor.update_task(
                        task_id, status="fetching",
                        loaded=total_synced, total=0,
                        message=f"Чанк {chunk_num}: загружено {total_synced} дней..."
                    )

            logger.info(f"[DLVRY BG Sync] Проект {project_id}: фоновая загрузка завершена, {total_synced} дней")

        except Exception as e:
            logger.error(f"[DLVRY BG Sync] Проект {project_id}: ошибка — {e}", exc_info=True)
            task_monitor.update_task(
                task_id, status="error",
                message="Ошибка фоновой синхронизации DLVRY",
                error=str(e)
            )
        finally:
            db.close()

    thread = threading.Thread(target=_worker, name=f"dlvry-sync-{project_id}", daemon=True)
    thread.start()
    logger.info(f"[DLVRY BG Sync] Проект {project_id}: фоновая полная загрузка запущена (task={task_id})")
    return task_id
