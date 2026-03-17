"""
Планировщик — ротация логов (раз в сутки).

Удаление устаревших записей из token_logs, ai_token_logs, auth_logs,
vk_callback_logs и неактивных сессий авторизации.
"""

from datetime import datetime
from services.scheduler_service import _acquire_lock


def job_rotate_token_logs():
    """
    Ротация логов VK API вызовов (token_logs).
    Интервал: 1 раз в сутки.
    Удаляет записи старше 30 дней.
    """
    if not _acquire_lock("vk_planner:rotate_token_logs_lock", 86000):
        return
    from database import SessionLocal
    import crud.token_log_crud as token_log_crud

    db = SessionLocal()
    try:
        count = token_log_crud.clear_old_logs(db, older_than_days=30)
        if count > 0:
            print(f"SCHEDULER: Rotated {count} old token_logs (>30 days).")
    except Exception as e:
        print(f"SCHEDULER ERROR (Token Logs Rotation): {e}")
    finally:
        db.close()


def job_rotate_ai_logs():
    """
    Ротация логов AI API вызовов (ai_token_logs).
    Интервал: 1 раз в сутки.
    Удаляет записи старше 30 дней.
    """
    if not _acquire_lock("vk_planner:rotate_ai_logs_lock", 86000):
        return
    from database import SessionLocal
    import crud.ai_log_crud as ai_log_crud

    db = SessionLocal()
    try:
        count = ai_log_crud.clear_old_logs(db, older_than_days=30)
        if count > 0:
            print(f"SCHEDULER: Rotated {count} old ai_token_logs (>30 days).")
    except Exception as e:
        print(f"SCHEDULER ERROR (AI Logs Rotation): {e}")
    finally:
        db.close()


def job_rotate_auth_logs():
    """
    Ротация логов авторизации (auth_logs).
    Интервал: 1 раз в сутки.
    Удаляет записи старше 90 дней.
    """
    if not _acquire_lock("vk_planner:rotate_auth_logs_lock", 86000):
        return
    from database import SessionLocal
    import crud.auth_log_crud as auth_log_crud

    db = SessionLocal()
    try:
        count = auth_log_crud.clear_logs(db, older_than_days=90)
        if count > 0:
            print(f"SCHEDULER: Rotated {count} old auth_logs (>90 days).")
    except Exception as e:
        print(f"SCHEDULER ERROR (Auth Logs Rotation): {e}")
    finally:
        db.close()


def job_rotate_callback_logs():
    """
    Ротация логов VK Callback API (vk_callback_logs).
    Интервал: 1 раз в день.
    Удаляет записи старше 30 дней.
    """
    if not _acquire_lock("vk_planner:rotate_callback_logs_lock", 86000):
        return
    from database import SessionLocal
    from datetime import timedelta
    import models

    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(days=30)
        count = db.query(models.VkCallbackLog).filter(
            models.VkCallbackLog.timestamp < cutoff
        ).delete(synchronize_session=False)
        db.commit()
        if count > 0:
            print(f"SCHEDULER: Rotated {count} old vk_callback_logs (>30 days).")
    except Exception as e:
        print(f"SCHEDULER ERROR (Callback Logs Rotation): {e}")
    finally:
        db.close()


def job_cleanup_inactive_sessions():
    """
    Удаление неактивных (завершённых) сессий авторизации из БД.
    Интервал: 1 раз в сутки.
    Удаляет записи с is_active=False, старше 7 дней.
    (job_session_cleanup деактивирует протухшие, но строки остаются — эта задача их физически удаляет)
    """
    if not _acquire_lock("vk_planner:cleanup_dead_sessions_lock", 86000):
        return
    from database import SessionLocal
    from datetime import timedelta
    import models

    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(days=7)
        count = db.query(models.AuthSession).filter(
            models.AuthSession.is_active == False,
            models.AuthSession.last_activity < cutoff
        ).delete(synchronize_session=False)
        db.commit()
        if count > 0:
            print(f"SCHEDULER: Purged {count} inactive auth_sessions (>7 days).")
    except Exception as e:
        print(f"SCHEDULER ERROR (Inactive Sessions Cleanup): {e}")
    finally:
        db.close()
