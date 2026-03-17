"""
Планировщик — ночные задачи (раз в сутки, фиксированное время).

Финализация историй, очистка чёрного списка, обогащение профилей,
синхронизация DLVRY, синхронизация сообществ и сбор админов.
"""

from datetime import datetime
from services.scheduler_service import _acquire_lock


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


def job_sync_dlvry_stats():
    """
    Синхронизация агрегированной статистики из DLVRY API для всех проектов.
    Интервал: 1 раз в сутки в 02:00 MSK (23:00 UTC предыдущего дня).
    
    Находит все проекты с настроенным dlvry_affiliate_id,
    запрашивает дневную статистику через DLVRY API,
    записывает/обновляет данные в таблице dlvry_daily_stats.
    """
    if not _acquire_lock("vk_planner:dlvry_sync_lock", 3600):
        return

    try:
        from database import SessionLocal
        from services.dlvry.stats_sync_all import sync_all_projects

        db = SessionLocal()
        try:
            result = sync_all_projects(db)
            total = result.get('total_projects', 0)
            synced = result.get('synced', 0)
            errors = result.get('errors', 0)
            if total > 0:
                print(f"SCHEDULER: DLVRY stats sync done — {synced}/{total} projects synced, {errors} errors.")
            else:
                print("SCHEDULER: DLVRY stats sync — no projects with DLVRY configured.")
        finally:
            db.close()
    except Exception as e:
        print(f"SCHEDULER ERROR (DLVRY Stats Sync): {e}")


def job_sync_administered_groups():
    """
    Синхронизация списка администрируемых сообществ с VK.
    Интервал: 1 раз в сутки в 03:30 MSK (00:30 UTC).
    
    Собирает токены (ENV + System Accounts), для каждого вызывает
    groups.get(filter=admin) и обновляет таблицу AdministeredGroup.
    """
    if not _acquire_lock("vk_planner:sync_admin_groups_lock", 3600):
        return
    from database import SessionLocal
    import services.admin_tools_sync as admin_tools_sync

    db = SessionLocal()
    try:
        result = admin_tools_sync.sync_administered_groups(db)
        total = result.get('total_groups', 0)
        errors = result.get('errors', 0)
        print(f"SCHEDULER: Administered groups sync done — {total} groups, {errors} errors.")
    except Exception as e:
        print(f"SCHEDULER ERROR (Administered Groups Sync): {e}")
    finally:
        db.close()


def job_sync_all_group_admins():
    """
    Сбор администраторов для ВСЕХ администрируемых групп.
    Интервал: 1 раз в сутки в 04:00 MSK (01:00 UTC).
    Запускается после job_sync_administered_groups (с отступом 30 мин).
    
    Распределяет группы по токенам, параллельно собирает groups.getMembers
    и сохраняет данные об админах в БД.
    """
    if not _acquire_lock("vk_planner:sync_all_admins_lock", 3600):
        return
    import uuid
    import services.task_monitor as task_monitor
    import services.admin_tools_bulk as admin_tools_bulk

    PROJECT_ID_GLOBAL = "GLOBAL"
    TASK_TYPE = "sync_admins_bulk"

    # Проверяем, не запущена ли задача уже (например, пользователем вручную)
    existing_task_id = task_monitor.get_active_task_id(PROJECT_ID_GLOBAL, TASK_TYPE)
    if existing_task_id:
        print(f"SCHEDULER: Admins bulk sync skipped — task {existing_task_id} already running.")
        return

    task_id = str(uuid.uuid4())
    task_monitor.start_task(task_id, PROJECT_ID_GLOBAL, TASK_TYPE)
    try:
        admin_tools_bulk.refresh_all_group_admins_task(task_id)
        print(f"SCHEDULER: Admins bulk sync done (task {task_id}).")
    except Exception as e:
        print(f"SCHEDULER ERROR (Admins Bulk Sync): {e}")


def job_refresh_all_subscribers():
    """
    Ночное обновление подписчиков для ВСЕХ активных проектов.
    Интервал: 1 раз в сутки в 01:00 MSK (22:00 UTC предыдущего дня).
    
    Параллельно обновляет подписчиков для всех проектов, используя
    оптимальное распределение токенов. К утру данные актуальны:
    количество подписчиков, входы/выходы, история.
    
    TTL блокировки: 4 часа — задача для десятков проектов может быть долгой.
    """
    if not _acquire_lock("vk_planner:refresh_all_subscribers_lock", 14400):
        return
    import uuid
    import services.task_monitor as task_monitor
    import services.admin_tools_bulk as admin_tools_bulk
    from config import settings

    PROJECT_ID_GLOBAL = "GLOBAL"
    TASK_TYPE = "refresh_all_subscribers"

    # Проверяем, не запущена ли задача уже (например, пользователем вручную)
    existing_task_id = task_monitor.get_active_task_id(PROJECT_ID_GLOBAL, TASK_TYPE)
    if existing_task_id:
        print(f"SCHEDULER: Subscribers bulk refresh skipped — task {existing_task_id} already running.")
        return

    task_id = str(uuid.uuid4())
    task_monitor.start_task(task_id, PROJECT_ID_GLOBAL, TASK_TYPE)
    try:
        admin_tools_bulk.refresh_all_subscribers_task(task_id, settings.vk_user_token)
        print(f"SCHEDULER: Subscribers bulk refresh done (task {task_id}).")
    except Exception as e:
        print(f"SCHEDULER ERROR (Subscribers Bulk Refresh): {e}")


def job_refresh_all_mailing():
    """
    Ночное обновление рассылки (dialogs) для ВСЕХ проектов с community-токенами.
    Интервал: 1 раз в сутки в 01:30 MSK (22:30 UTC предыдущего дня).
    
    Последовательно обновляет рассылку для каждого проекта.
    Каждый проект использует свои community-токены для параллельного сбора.
    
    TTL блокировки: 4 часа — задача для десятков проектов может быть долгой.
    """
    if not _acquire_lock("vk_planner:refresh_all_mailing_lock", 14400):
        return
    import uuid
    import services.task_monitor as task_monitor
    import services.admin_tools_bulk as admin_tools_bulk

    PROJECT_ID_GLOBAL = "GLOBAL"
    TASK_TYPE = "refresh_all_mailing"

    # Проверяем, не запущена ли задача уже (например, пользователем вручную)
    existing_task_id = task_monitor.get_active_task_id(PROJECT_ID_GLOBAL, TASK_TYPE)
    if existing_task_id:
        print(f"SCHEDULER: Mailing bulk refresh skipped — task {existing_task_id} already running.")
        return

    task_id = str(uuid.uuid4())
    task_monitor.start_task(task_id, PROJECT_ID_GLOBAL, TASK_TYPE)
    try:
        admin_tools_bulk.refresh_all_mailing_task(task_id)
        print(f"SCHEDULER: Mailing bulk refresh done (task {task_id}).")
    except Exception as e:
        print(f"SCHEDULER ERROR (Mailing Bulk Refresh): {e}")
