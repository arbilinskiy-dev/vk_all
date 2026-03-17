
"""
Планировщик задач — ХАБ.

Инициализация APScheduler, Redis-блокировка, регистрация и запуск всех задач.
Реализация job-функций вынесена в отдельные модули:
  - scheduler_jobs_operational.py  — публикация постов, истории, сессии (высокая частота)
  - scheduler_jobs_log_rotation.py — ротация логов (раз в сутки)
  - scheduler_jobs_maintenance.py  — проверка токенов, очистка задач (средний приоритет)
  - scheduler_jobs_nightly.py      — ночные задачи (фиксированное время)
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
import logging

from database import redis_client

# Настройка логгера
logging.basicConfig()
logging.getLogger('apscheduler').setLevel(logging.WARNING)

scheduler = BackgroundScheduler()

# Ключ блокировки в Redis для предотвращения гонки воркеров
LOCK_KEY = "vk_planner:tracker_lock"
LOCK_TTL = 55  # Чуть больше интервала запуска (50 сек)


# ===============================================================
#                  УТИЛИТЫ: Redis Lock
# ===============================================================

def _acquire_lock(lock_key: str, ttl: int) -> bool:
    """Пытается получить Redis-блокировку. Возвращает True если лидер (или Redis не настроен)."""
    if redis_client:
        try:
            return bool(redis_client.set(lock_key, "locked", nx=True, ex=ttl))
        except Exception as e:
            print(f"SCHEDULER: Redis lock error ({lock_key}): {e}. Skipping.")
            return False
    # Локальная разработка — Redis не настроен, считаем себя лидером
    return True


# ===============================================================
#                        ЗАПУСК / ОСТАНОВКА
# ===============================================================

def start():
    """Инициализация и запуск планировщика со всеми задачами."""

    # Импорт job-модулей
    from services.scheduler_jobs_operational import (
        job_system_post_publisher, job_stories_automation, job_session_cleanup
    )
    from services.scheduler_jobs_log_rotation import (
        job_rotate_token_logs, job_rotate_ai_logs, job_rotate_auth_logs,
        job_rotate_callback_logs, job_cleanup_inactive_sessions
    )
    from services.scheduler_jobs_maintenance import (
        job_verify_vk_tokens, job_cleanup_system_tasks
    )
    from services.scheduler_jobs_nightly import (
        job_finalize_stories_logs, job_cleanup_expired_blacklist,
        job_enrich_stub_profiles, job_sync_dlvry_stats,
        job_sync_administered_groups, job_sync_all_group_admins,
        job_refresh_all_subscribers, job_refresh_all_mailing
    )

    # --- Группа 1: Оперативные задачи ---

    scheduler.add_job(
        job_system_post_publisher,
        IntervalTrigger(seconds=50),
        id='system_post_tracker',
        replace_existing=True
    )

    scheduler.add_job(
        job_stories_automation,
        IntervalTrigger(minutes=60),
        id='stories_automation_bg',
        replace_existing=True
    )

    scheduler.add_job(
        job_session_cleanup,
        IntervalTrigger(minutes=5),
        id='auth_session_cleanup',
        replace_existing=True
    )

    # --- Группа 2: Ротация логов (раз в сутки) ---

    scheduler.add_job(
        job_rotate_token_logs,
        IntervalTrigger(hours=24),
        id='rotate_token_logs',
        replace_existing=True
    )

    scheduler.add_job(
        job_rotate_ai_logs,
        IntervalTrigger(hours=24),
        id='rotate_ai_logs',
        replace_existing=True
    )

    scheduler.add_job(
        job_rotate_auth_logs,
        IntervalTrigger(hours=24),
        id='rotate_auth_logs',
        replace_existing=True
    )

    scheduler.add_job(
        job_rotate_callback_logs,
        IntervalTrigger(hours=24),
        id='rotate_callback_logs',
        replace_existing=True
    )

    scheduler.add_job(
        job_cleanup_inactive_sessions,
        IntervalTrigger(hours=24),
        id='cleanup_inactive_sessions',
        replace_existing=True
    )

    # --- Группа 3: Обслуживание (средний приоритет) ---

    scheduler.add_job(
        job_verify_vk_tokens,
        IntervalTrigger(hours=2),
        id='verify_vk_tokens',
        replace_existing=True
    )

    scheduler.add_job(
        job_cleanup_system_tasks,
        IntervalTrigger(hours=6),
        id='cleanup_system_tasks',
        replace_existing=True
    )

    # --- Группа 4: Ночные задачи (фиксированное время) ---

    scheduler.add_job(
        job_finalize_stories_logs,
        IntervalTrigger(hours=24),
        id='finalize_stories_logs',
        replace_existing=True
    )

    scheduler.add_job(
        job_cleanup_expired_blacklist,
        IntervalTrigger(hours=24),
        id='cleanup_expired_blacklist',
        replace_existing=True
    )

    # Обогащение профилей-заглушек — 03:00 MSK (00:00 UTC)
    scheduler.add_job(
        job_enrich_stub_profiles,
        CronTrigger(hour=0, minute=0, timezone='UTC'),
        id='enrich_stub_profiles',
        replace_existing=True
    )

    # Синхронизация DLVRY статистики — 02:00 MSK (23:00 UTC)
    scheduler.add_job(
        job_sync_dlvry_stats,
        CronTrigger(hour=23, minute=0, timezone='UTC'),
        id='sync_dlvry_stats',
        replace_existing=True
    )

    # Синхронизация администрируемых сообществ — 03:30 MSK (00:30 UTC)
    scheduler.add_job(
        job_sync_administered_groups,
        CronTrigger(hour=0, minute=30, timezone='UTC'),
        id='sync_administered_groups',
        replace_existing=True
    )

    # Сбор админов всех групп — 04:00 MSK (01:00 UTC)
    scheduler.add_job(
        job_sync_all_group_admins,
        CronTrigger(hour=1, minute=0, timezone='UTC'),
        id='sync_all_group_admins',
        replace_existing=True
    )

    # Ночное обновление подписчиков всех проектов — 01:00 MSK (22:00 UTC)
    scheduler.add_job(
        job_refresh_all_subscribers,
        CronTrigger(hour=22, minute=0, timezone='UTC'),
        id='refresh_all_subscribers_nightly',
        replace_existing=True
    )

    # Ночное обновление рассылки всех проектов — 01:30 MSK (22:30 UTC)
    scheduler.add_job(
        job_refresh_all_mailing,
        CronTrigger(hour=22, minute=30, timezone='UTC'),
        id='refresh_all_mailing_nightly',
        replace_existing=True
    )

    scheduler.start()
    print("✅ APScheduler started — 18 scheduled jobs registered.")


def shutdown():
    """Корректное завершение планировщика."""
    try:
        if scheduler.running:
            scheduler.shutdown(wait=False)
            print("✅ APScheduler stopped gracefully.")
    except Exception as e:
        print(f"⚠️ Error stopping APScheduler: {e}")
