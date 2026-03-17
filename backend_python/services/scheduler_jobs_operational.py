"""
Планировщик — оперативные задачи (высокая частота).

Публикация постов, автоматизация историй, очистка сессий.
"""

import services.post_tracker_service as post_tracker
import services.automations.stories_background_service as stories_bg
from services.scheduler_service import _acquire_lock, LOCK_KEY, LOCK_TTL


def job_system_post_publisher():
    """
    Публикация и верификация системных постов.
    Интервал: 50 секунд.
    Redis Lock: tracker_lock (TTL 55с).
    """
    if _acquire_lock(LOCK_KEY, LOCK_TTL):
        try:
            post_tracker._publication_check()
        except Exception as e:
            print(f"SCHEDULER ERROR (Post Tracker): {e}")


def job_stories_automation():
    """
    Фоновая задача автоматизации историй (раз в час).
    
    1. Reconciliation — подхват пропущенных постов из БД (без VK API).
    2. Сбор статистики и зрителей для активных историй.
    3. Синхронизация ручных историй.
    
    Основной путь публикации — через callback wall_post_new.
    Эта задача — страховочная сеть и сборщик данных.
    
    Интервал: 60 минут.
    Redis Lock: stories_bg_lock (TTL 3550с).
    """
    if _acquire_lock("vk_planner:stories_bg_lock", 3550):
        try:
            stories_bg.run_stories_automation_cycle()
        except Exception as e:
            print(f"SCHEDULER ERROR (Stories BG): {e}")


def job_session_cleanup():
    """
    Очистка протухших сессий авторизации.
    Интервал: 5 минут.
    Деактивирует сессии с last_activity старше 20 минут и пишет логи таймаута.
    """
    from database import SessionLocal
    import services.session_auth_service as session_auth_service

    db = SessionLocal()
    try:
        count = session_auth_service.cleanup_expired_sessions(db, timeout_minutes=20)
        if count > 0:
            print(f"SCHEDULER: Cleaned up {count} expired auth sessions.")
    except Exception as e:
        print(f"SCHEDULER ERROR (Session Cleanup): {e}")
    finally:
        db.close()
