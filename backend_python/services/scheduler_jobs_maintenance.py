"""
Планировщик — задачи обслуживания (средний приоритет).

Проверка валидности VK-токенов, очистка системных задач.
"""

import time
from services.scheduler_service import _acquire_lock


def job_verify_vk_tokens():
    """
    Автопроверка валидности всех VK-токенов (system_accounts).
    Интервал: 1 раз в 2 часа.
    Обновляет поле status у каждого аккаунта: 'active' или 'error'.
    Позволяет заранее обнаружить протухшие токены до ошибки публикации.
    """
    if not _acquire_lock("vk_planner:verify_tokens_lock", 7100):
        return
    from database import SessionLocal
    from services.vk_api.api_client import call_vk_api as raw_vk_call
    import models

    db = SessionLocal()
    try:
        accounts = db.query(models.SystemAccount).all()
        checked = 0
        errors = 0
        for account in accounts:
            if not account.token:
                continue
            try:
                response = raw_vk_call('users.get', {
                    'fields': 'photo_100',
                    'access_token': account.token
                })
                if response and len(response) > 0:
                    account.status = 'active'
                else:
                    account.status = 'error'
                    errors += 1
            except Exception:
                account.status = 'error'
                errors += 1
            checked += 1
            # Пауза между запросами, чтобы не превысить rate limit VK API
            time.sleep(0.5)

        db.commit()
        if errors > 0:
            print(f"SCHEDULER: Token verify — {checked} checked, {errors} ERRORS found!")
        else:
            print(f"SCHEDULER: Token verify — {checked} accounts OK.")
    except Exception as e:
        print(f"SCHEDULER ERROR (Token Verify): {e}")
    finally:
        db.close()


def job_cleanup_system_tasks():
    """
    Очистка завершённых системных задач (system_tasks).
    Интервал: 1 раз в 6 часов.
    Удаляет задачи старше 24 часов (дублирует inline-очистку из get_all_tasks,
    но гарантирует работу даже если никто не заходит в UI).
    """
    if not _acquire_lock("vk_planner:cleanup_tasks_lock", 21500):
        return
    from database import SessionLocal
    import models

    db = SessionLocal()
    try:
        cleanup_threshold = time.time() - 86400  # 24 часа
        count = db.query(models.SystemTask).filter(
            models.SystemTask.updated_at < cleanup_threshold
        ).delete(synchronize_session=False)
        db.commit()
        if count > 0:
            print(f"SCHEDULER: Cleaned up {count} old system_tasks (>24h).")
    except Exception as e:
        print(f"SCHEDULER ERROR (System Tasks Cleanup): {e}")
    finally:
        db.close()
