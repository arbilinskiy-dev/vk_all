
import time
import threading
from datetime import datetime, timezone, timedelta
import calendar
import json
import re
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from database import SessionLocal, redis_client
import crud
import models
from services import vk_service, post_service, update_tracker, global_variable_service
# Импортируем сервисы контекста и товаров для получения свежих данных
import crud.project_context_crud as context_crud
import crud.market_crud as market_crud
import services.automations.reviews.service as contest_service
import services.automations.ai_posts_service as ai_posts_service # NEW
import services.automations.general.service as general_contest_service # NEW
import services.contest_v2_service as contest_v2_service # NEW: Конкурс 2.0
from config import settings
from schemas import PublishPostPayload, ScheduledPost as ScheduledPostSchema

TRACKER_INTERVAL_SECONDS = 50
LOCK_KEY = "vk_planner:tracker_lock"
LOCK_TTL = 55 

def _add_months(source_date: datetime, months: int) -> datetime:
    """Добавляет месяцы к дате, корректно обрабатывая переход года."""
    month = source_date.month - 1 + months
    year = source_date.year + month // 12
    month = month % 12 + 1
    day = min(source_date.day, calendar.monthrange(year, month)[1])
    return source_date.replace(year=year, month=month, day=day)

def _calculate_next_occurrence(post: models.SystemPost) -> str:
    """Вычисляет следующую дату публикации на основе настроек поста."""
    try:
        current_dt = datetime.fromisoformat(post.publication_date.replace('Z', '+00:00'))
        r_type = post.recurrence_type
        r_interval = post.recurrence_interval or 1
        
        next_dt = current_dt

        if r_type == 'minutes':
            next_dt = current_dt + timedelta(minutes=r_interval)
        elif r_type == 'hours':
            next_dt = current_dt + timedelta(hours=r_interval)
        elif r_type == 'days':
            next_dt = current_dt + timedelta(days=r_interval)
        elif r_type == 'weeks':
            next_dt = current_dt + timedelta(weeks=r_interval)
        elif r_type == 'months':
            # Расчет для месяцев с учетом специальных настроек
            
            # 1. Сначала просто добавляем месяцы к текущей дате
            next_dt = _add_months(current_dt, r_interval)
            
            # 2. Применяем фиксацию дня, если нужно
            if post.recurrence_is_last_day:
                # Устанавливаем на последний день этого нового месяца
                last_day = calendar.monthrange(next_dt.year, next_dt.month)[1]
                next_dt = next_dt.replace(day=last_day)
            elif post.recurrence_fixed_day and post.recurrence_fixed_day > 0:
                # Устанавливаем на конкретный день. 
                # Если в месяце дней меньше, чем fixed_day (например, 31-е в феврале), берем последний день.
                last_day_in_month = calendar.monthrange(next_dt.year, next_dt.month)[1]
                target_day = min(post.recurrence_fixed_day, last_day_in_month)
                next_dt = next_dt.replace(day=target_day)
            
        else:
            # Если тип неизвестен, добавляем 5 минут, чтобы не зациклиться
            print(f"Unknown recurrence type '{r_type}', adding 5 minutes fallback.")
            next_dt = current_dt + timedelta(minutes=5)

        return next_dt.isoformat().replace('+00:00', 'Z')
    except Exception as e:
        print(f"Error calculating next recurrence: {e}")
        # Fallback: +1 day
        return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')

def _create_next_cyclic_post(db: Session, post: models.SystemPost):
    """Создает следующую итерацию циклического поста."""
    if not post.is_cyclic or not post.recurrence_interval or post.recurrence_interval <= 0:
        return

    # По умолчанию следующая итерация наследует активность родителя
    next_is_active = post.is_active
    next_end_count = post.recurrence_end_count
    
    # Проверка лимита по количеству
    if post.recurrence_end_type == 'count':
        if post.recurrence_end_count is not None and post.recurrence_end_count > 1:
            next_end_count = post.recurrence_end_count - 1
        else:
            # Лимит достигнут!
            # Вместо остановки создания (should_create_next = False), мы создаем следующий пост,
            # но делаем его НЕАКТИВНЫМ. Это сохраняет настройки автоматизации в базе.
            print(f"  -> Cycle limit reached (count). Creating next post as INACTIVE to preserve settings.")
            next_is_active = False
            # Сбрасываем счетчик на 0 или оставляем 1, чтобы пользователь видел, что он кончился
            next_end_count = 0 
    
    # Проверка лимита по дате
    next_date = _calculate_next_occurrence(post)
    if post.recurrence_end_type == 'date' and post.recurrence_end_date:
        if next_date > post.recurrence_end_date:
            print(f"  -> Cycle limit reached (date). Next date {next_date} > Limit {post.recurrence_end_date}. Creating next post as INACTIVE.")
            next_is_active = False

    # Для AI постов текст генерируется "Just-in-Time" перед публикацией.
    # Поэтому следующий пост в цикле создаем с текущим текстом (как плейсхолдер).
    next_text = post.text 
    
    print(f"  -> Creating next occurrence for {next_date} (Active: {next_is_active})...")
    
    new_cyclic_post = models.SystemPost(
        id=f"cyclic-{uuid.uuid4()}",
        project_id=post.project_id,
        publication_date=next_date,
        text=next_text,
        images=post.images,
        attachments=post.attachments,
        status='pending_publication',
        post_type=post.post_type, 
        # Переносим настройки цикличности
        is_cyclic=True,
        recurrence_type=post.recurrence_type,
        recurrence_interval=post.recurrence_interval,
        recurrence_end_type=post.recurrence_end_type,
        recurrence_end_count=next_end_count, 
        recurrence_end_date=post.recurrence_end_date,
        recurrence_fixed_day=post.recurrence_fixed_day,
        recurrence_is_last_day=post.recurrence_is_last_day,
        # ВАЖНО: Переносим параметры генерации
        ai_generation_params=post.ai_generation_params,
        
        # Переносим настройки автоматизации
        title=post.title,
        description=post.description,
        # Устанавливаем вычисленный статус активности (True, если лимит не достигнут, False, если достигнут)
        is_active=next_is_active,
        # Переносим закрепление и первый комментарий
        is_pinned=getattr(post, 'is_pinned', False),
        first_comment_text=getattr(post, 'first_comment_text', None)
    )
    db.add(new_cyclic_post)
    print(f"  -> Created next cyclic post {new_cyclic_post.id}")


def _publication_check():
    """Находит и публикует посты, время которых пришло."""
    db: Session = SessionLocal()
    try:
        # Используем UTC и нормализуем формат для корректного строкового сравнения
        # publication_date хранится как '2026-02-09T12:00:00.000Z'
        now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
        
        # Ищем посты, время которых пришло. Поддерживаем regular, contest_winner и ai_feed
        # ВАЖНО: Фильтруем только АКТИВНЫЕ посты (is_active == True)
        # Используем with_for_update() для атомарной блокировки — предотвращает параллельную обработку
        posts_to_publish = db.query(models.SystemPost).filter(
            models.SystemPost.status == 'pending_publication',
            models.SystemPost.post_type.in_(['regular', 'contest_winner', 'ai_feed', 'general_contest_start', 'general_contest_result', 'contest_v2_start']),
            models.SystemPost.publication_date <= now_iso,
            models.SystemPost.is_active == True # Игнорируем выключенные автоматизации
        ).with_for_update().all()

        if not posts_to_publish:
            return

        print(f"POST_TRACKER: Found {len(posts_to_publish)} system post(s) to process.")

        for post in posts_to_publish:
            # --- ПРОВЕРКА АКТИВНОСТИ МЕХАНИКИ ДЛЯ CONTEST_V2_START ---
            # Если это пост Конкурс 2.0, проверяем активность самого конкурса
            if post.post_type == 'contest_v2_start' and post.related_id:
                contest = db.query(models.ContestV2).filter(
                    models.ContestV2.id == post.related_id
                ).first()
                
                if not contest:
                    print(f"  -> CONTEST V2: Contest not found for post {post.id}. Skipping.")
                    continue
                
                if not contest.is_active:
                    print(f"  -> CONTEST V2: Contest {contest.id} is not active. Skipping publication.")
                    continue
            
            # Атомарно блокируем пост
            post.status = 'publishing'
            db.commit()
            
            # --- ВЕТВЛЕНИЕ ПО ТИПУ ПОСТА ---
            
            # СЦЕНАРИЙ 1: АВТОМАТИЗАЦИЯ КОНКУРСА
            if post.post_type == 'contest_winner':
                print(f"  -> Triggering CONTEST AUTOMATION for project {post.project_id}...")
                try:
                    contest_service.execute_scheduled_contest(db, post.project_id)
                    print(f"  -> Contest automation finished successfully.")
                    
                    _create_next_cyclic_post(db, post)
                    
                    print(f"  -> Deleting trigger post {post.id}.")
                    crud.delete_system_post(db, post.id)
                    update_tracker.add_updated_project(post.project_id)
                    
                except Exception as e:
                    print(f"  -> AUTOMATION ERROR for project {post.project_id}: {e}")
                    post.status = 'error'
                    db.commit()
                    update_tracker.add_updated_project(post.project_id)
                
                continue 

            # СЦЕНАРИЙ 2: AI FEED POST (Генерация контента на лету)
            if post.post_type == 'ai_feed':
                print(f"  -> Triggering AI FEED GENERATION for project {post.project_id}...")
                try:
                    # Делегируем генерацию и публикацию специализированному сервису
                    # Сервис вернет ID поста в VK
                    vk_post_id = ai_posts_service.generate_and_publish_post(db, post)
                    
                    # VK вернул post_id — пост гарантированно на стене
                    print(f"  -> AI Feed Post published. VK ID: {vk_post_id}.")
                    
                    _create_next_cyclic_post(db, post)
                    
                    print(f"  -> Deleting AI feed system post {post.id}.")
                    crud.delete_system_post(db, post.id)
                    update_tracker.add_updated_project(post.project_id)
                except Exception as e:
                     print(f"  -> AI FEED ERROR for project {post.project_id}: {e}")
                     post.status = 'error'
                     db.commit()
                     update_tracker.add_updated_project(post.project_id)
                
                continue

            # СЦЕНАРИЙ 4: ИТОГИ УНИВЕРСАЛЬНОГО КОНКУРСА
            if post.post_type == 'general_contest_result':
                print(f"  -> Processing GENERAL CONTEST RESULTS for project {post.project_id}...")
                try:
                    general_contest_service.process_results(db, post)
                    print(f"  -> General contest results processed.")
                    update_tracker.add_updated_project(post.project_id)
                except Exception as e:
                    print(f"  -> GENERAL CONTEST ERROR for project {post.project_id}: {e}")
                    post.status = 'error'
                    db.commit()
                    update_tracker.add_updated_project(post.project_id)
                continue

            # СЦЕНАРИЙ 3: ОБЫЧНЫЙ РЕГУЛЯРНЫЙ ПОСТ
            print(f"  -> Publishing REGULAR post {post.id} for project {post.project_id}...")
            try:
                # Подстановка глобальных переменных
                text_to_process = post.text or ""
                substituted_text = global_variable_service.substitute_global_variables(db, text_to_process, post.project_id)
                
                has_attachments = False
                if post.images and post.images != '[]': has_attachments = True
                if post.attachments and post.attachments != '[]': has_attachments = True
                
                if not substituted_text.strip() and not has_attachments:
                    raise Exception("Cannot publish empty post (no text and no attachments). Check content.")

                post_schema = ScheduledPostSchema(
                    id=post.id,
                    date=post.publication_date,
                    text=substituted_text, 
                    images=json.loads(post.images) if post.images else [],
                    attachments=json.loads(post.attachments) if post.attachments else [],
                    is_pinned=getattr(post, 'is_pinned', False),
                    first_comment_text=getattr(post, 'first_comment_text', None)
                )
                payload = PublishPostPayload(post=post_schema, projectId=post.project_id)
                
                vk_post_id = post_service.publish_now(db, payload, settings.vk_user_token, delete_original=False)

                # HOOK: Если это старт конкурса
                if post.post_type == 'general_contest_start':
                     general_contest_service.on_start_post_published(db, post, vk_post_id)
                     # Мы не удаляем системный пост сразу здесь, т.к. "create_next_cyclic_post" потенциально может понадобиться
                     # Но для "general_contest_start" цикличность реализована через сам сервис конкурсов
                     # Поэтому, чтобы избежать дублирования в расписании (Published Post из VK vs System Post),
                     # мы помечаем его как executed/deleted или даем ему статус, который скроет его из выдачи,
                     # если он больше не нужен для повторений.
                     # Если это НЕ циклический, то можно удалить.
                     if not post.is_cyclic:
                         print(f"  -> Cleaning up non-cyclic general contest start post {post.id}")
                         crud.delete_system_post(db, post.id)
                     else:
                        print(f"  -> Creating next cyclic post for GENERAL CONTEST {post.id}")
                        _create_next_cyclic_post(db, post) # Создаем следующий до того, как скроем текущий?
                        # Если мы создали следующий, текущий "отработал".
                        # В обычном расписании "отработанные" посты VK сами удаляются из "Отложки" VK.
                        # А системные посты мы должны удалять.
                        crud.delete_system_post(db, post.id)
                
                # HOOK: Конкурс 2.0 - старт
                if post.post_type == 'contest_v2_start':
                    print(f"  -> Processing CONTEST V2 START for post {post.id}")
                    contest_v2_service.on_start_post_published(db, post, vk_post_id)
                    
                    # Помечаем опубликованный пост как связанный с конкурсом 2.0
                    # Это нужно сделать ЗДЕСЬ, т.к. пост уже в БД после publish_now
                    from models_library.posts import Post as PublishedPost
                    published_post = db.query(PublishedPost).filter(PublishedPost.id == vk_post_id).first()
                    if published_post:
                        published_post.post_type = 'contest_v2_start'  # type: ignore[assignment]
                        published_post.related_id = post.related_id  # type: ignore[assignment]
                        db.commit()
                        print(f"  -> Marked published post {vk_post_id} as contest_v2_start")
                    
                    # Удаляем системный пост после публикации (он не циклический)
                    crud.delete_system_post(db, post.id)

                # Для обычных regular-постов (не конкурсов): сразу создаём следующий цикл и удаляем
                if post.post_type not in ('general_contest_start', 'contest_v2_start'):
                    _create_next_cyclic_post(db, post)
                    print(f"  -> Deleting system post {post.id}.")
                    crud.delete_system_post(db, post.id)

                print(f"  -> Successfully published post {post.id} to VK. VK ID: {vk_post_id}.")
                update_tracker.add_updated_project(post.project_id)

            except Exception as e:
                print(f"  -> ERROR publishing post {post.id}: {e}")
                post.status = 'error'
                db.commit()
                update_tracker.add_updated_project(post.project_id)
    
    finally:
        db.close()


# _verification_check удалена: VK API возвращает post_id при успешной публикации,
# что гарантирует наличие поста на стене. Верификация через wall.get больше не нужна.


def _tracker_loop():
    """Бесконечный цикл, запускающий проверки с распределенной блокировкой Redis."""
    print("POST_TRACKER: Loop started.")
    while True:
        try:
            is_leader = False
            if redis_client:
                try:
                    if redis_client.set(LOCK_KEY, "locked", nx=True, ex=LOCK_TTL):
                        is_leader = True
                except Exception as e:
                    print(f"POST_TRACKER: Redis lock error: {e}. Skipping cycle.")
            else:
                is_leader = True 
            
            if is_leader:
                _publication_check()
            
        except Exception as e:
            print(f"POST_TRACKER: Critical error in main loop: {e}")
        
        time.sleep(TRACKER_INTERVAL_SECONDS)

def start_post_tracker():
    """Запускает Пост-трекер в отдельном фоновом потоке."""
    tracker_thread = threading.Thread(target=_tracker_loop, daemon=True)
    tracker_thread.start()
