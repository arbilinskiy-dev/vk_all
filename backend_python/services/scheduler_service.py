
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
import logging
import time
from datetime import datetime

from database import redis_client
import services.post_tracker_service as post_tracker
import services.automations.stories_background_service as stories_bg

# Настройка логгера
logging.basicConfig()
logging.getLogger('apscheduler').setLevel(logging.WARNING)

scheduler = BackgroundScheduler()

# Ключ блокировки в Redis для предотвращения гонки воркеров
LOCK_KEY = "vk_planner:tracker_lock"
LOCK_TTL = 55 # Чуть больше интервала запуска (50 сек)


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
#       ГРУППА 1: ОПЕРАТИВНЫЕ ЗАДАЧИ (высокая частота)
# ===============================================================

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


# ===============================================================
#       ГРУППА 2: РОТАЦИЯ ЛОГОВ (раз в сутки / раз в день)
# ===============================================================

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


# ===============================================================
#       ГРУППА 3: ОБСЛУЖИВАНИЕ (средний приоритет)
# ===============================================================

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


# ===============================================================
#       ГРУППА 4: НИЗКИЙ ПРИОРИТЕТ (раз в сутки)
# ===============================================================

def job_finalize_stories_logs():
    """
    Финализация подвешенных записей stories_automation_logs.
    Интервал: 1 раз в сутки.
    Автоматически финализирует записи старше 48 часов с is_active=False.
    """
    if not _acquire_lock("vk_planner:finalize_stories_lock", 86000):
        return
    from database import SessionLocal
    from datetime import timedelta
    import models

    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(hours=48)
        count = db.query(models.StoriesAutomationLog).filter(
            models.StoriesAutomationLog.is_active == False,
            models.StoriesAutomationLog.created_at < cutoff,
            (
                (models.StoriesAutomationLog.stats_finalized == False) |
                (models.StoriesAutomationLog.viewers_finalized == False)
            )
        ).update({
            models.StoriesAutomationLog.stats_finalized: True,
            models.StoriesAutomationLog.viewers_finalized: True
        }, synchronize_session=False)
        db.commit()
        if count > 0:
            print(f"SCHEDULER: Finalized {count} stale stories_automation_logs (>48h, inactive).")
    except Exception as e:
        print(f"SCHEDULER ERROR (Stories Finalization): {e}")
    finally:
        db.close()


def job_cleanup_expired_blacklist():
    """
    Очистка истёкших записей в чёрном списке конкурсов отзывов.
    Интервал: 1 раз в сутки.
    Удаляет записи review_contest_blacklist с until_date < NOW для всех конкурсов.
    """
    if not _acquire_lock("vk_planner:cleanup_blacklist_lock", 86000):
        return
    from database import SessionLocal
    from datetime import timezone
    import models

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        count = db.query(models.ReviewContestBlacklist).filter(
            models.ReviewContestBlacklist.until_date.isnot(None),
            models.ReviewContestBlacklist.until_date < now
        ).delete(synchronize_session=False)
        db.commit()
        if count > 0:
            print(f"SCHEDULER: Cleaned up {count} expired blacklist entries.")
    except Exception as e:
        print(f"SCHEDULER ERROR (Blacklist Cleanup): {e}")
    finally:
        db.close()


# ===============================================================
#         ОБОГАЩЕНИЕ ПРОФИЛЕЙ-ЗАГЛУШЕК (раз в сутки, 03:00 MSK)
# ===============================================================

def job_enrich_stub_profiles():
    """
    Обогащение VkProfile-заглушек данными из VK API.
    Интервал: 1 раз в сутки в 03:00 MSK.
    
    Находит профили с first_name IS NULL (созданные callback-хендлерами),
    вызывает VK API users.get через service key батчами по 1000,
    заполняет имя, фото, город, пол и остальные поля.
    """
    try:
        from services.profile_enrichment_service import enrich_stub_profiles
        result = enrich_stub_profiles()
        total = result.get('total_stubs', 0)
        enriched = result.get('enriched', 0)
        if total > 0:
            print(f"SCHEDULER: Profile enrichment done — {enriched}/{total} profiles enriched.")
        else:
            print("SCHEDULER: Profile enrichment — no stubs found.")
    except Exception as e:
        print(f"SCHEDULER ERROR (Profile Enrichment): {e}")


# ===============================================================
#                        ЗАПУСК / ОСТАНОВКА
# ===============================================================

def start():
    """Инициализация и запуск планировщика со всеми задачами."""

    # --- Группа 1: Оперативные задачи ---

    # Публикация системных постов — каждые 50 секунд
    scheduler.add_job(
        job_system_post_publisher,
        IntervalTrigger(seconds=50),
        id='system_post_tracker',
        replace_existing=True
    )

    # Автоматизация историй — каждый час (reconciliation + сбор статистики/зрителей)
    scheduler.add_job(
        job_stories_automation,
        IntervalTrigger(minutes=60),
        id='stories_automation_bg',
        replace_existing=True
    )

    # Деактивация протухших сессий авторизации — каждые 5 минут
    scheduler.add_job(
        job_session_cleanup,
        IntervalTrigger(minutes=5),
        id='auth_session_cleanup',
        replace_existing=True
    )

    # --- Группа 2: Ротация логов (раз в сутки) ---

    # Ротация логов VK API (token_logs) — каждые 24 часа
    scheduler.add_job(
        job_rotate_token_logs,
        IntervalTrigger(hours=24),
        id='rotate_token_logs',
        replace_existing=True
    )

    # Ротация логов AI API (ai_token_logs) — каждые 24 часа
    scheduler.add_job(
        job_rotate_ai_logs,
        IntervalTrigger(hours=24),
        id='rotate_ai_logs',
        replace_existing=True
    )

    # Ротация логов авторизации (auth_logs) — каждые 24 часа (удаляет >90 дней)
    scheduler.add_job(
        job_rotate_auth_logs,
        IntervalTrigger(hours=24),
        id='rotate_auth_logs',
        replace_existing=True
    )

    # Ротация логов VK Callback (vk_callback_logs) — каждые 24 часа
    scheduler.add_job(
        job_rotate_callback_logs,
        IntervalTrigger(hours=24),
        id='rotate_callback_logs',
        replace_existing=True
    )

    # Физическое удаление неактивных сессий — каждые 24 часа
    scheduler.add_job(
        job_cleanup_inactive_sessions,
        IntervalTrigger(hours=24),
        id='cleanup_inactive_sessions',
        replace_existing=True
    )

    # --- Группа 3: Обслуживание (средний приоритет) ---

    # Автопроверка валидности VK-токенов — каждые 2 часа
    scheduler.add_job(
        job_verify_vk_tokens,
        IntervalTrigger(hours=2),
        id='verify_vk_tokens',
        replace_existing=True
    )

    # Очистка завершённых системных задач — каждые 6 часов
    scheduler.add_job(
        job_cleanup_system_tasks,
        IntervalTrigger(hours=6),
        id='cleanup_system_tasks',
        replace_existing=True
    )

    # --- Группа 4: Низкий приоритет (раз в сутки) ---

    # Финализация подвешенных историй — каждые 24 часа
    scheduler.add_job(
        job_finalize_stories_logs,
        IntervalTrigger(hours=24),
        id='finalize_stories_logs',
        replace_existing=True
    )

    # Очистка истёкших записей чёрного списка — каждые 24 часа
    scheduler.add_job(
        job_cleanup_expired_blacklist,
        IntervalTrigger(hours=24),
        id='cleanup_expired_blacklist',
        replace_existing=True
    )

    # --- Группа 5: Обогащение данных (раз в сутки, фиксированное время) ---

    # Обогащение профилей-заглушек (VkProfile без имени/фото) — 03:00 MSK (00:00 UTC)
    scheduler.add_job(
        job_enrich_stub_profiles,
        CronTrigger(hour=0, minute=0, timezone='UTC'),  # 03:00 MSK = 00:00 UTC
        id='enrich_stub_profiles',
        replace_existing=True
    )

    scheduler.start()
    print("✅ APScheduler started — 13 scheduled jobs registered.")

def shutdown():
    """Корректное завершение планировщика."""
    try:
        if scheduler.running:
            scheduler.shutdown(wait=False)
            print("✅ APScheduler stopped gracefully.")
    except Exception as e:
        print(f"⚠️ Error stopping APScheduler: {e}")
