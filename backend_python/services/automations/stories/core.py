from sqlalchemy.orm import Session
from models_library.automations import StoriesAutomation
from models_library.projects import Project
from services import vk_service
from database import redis_client
from .logic import process_single_story_for_post
from datetime import datetime, timedelta

def process_stories_automation(db: Session, project_id: str, posts_from_vk: list[dict], user_token: str):
    """
    Checks posts against Stories Automation rules and posts to stories if matched.
    Оптимизировано: сначала фильтрация по дате и keywords, потом batch-проверка в БД.
    """
    # 1. Check settings
    settings = db.query(StoriesAutomation).filter(StoriesAutomation.project_id == project_id, StoriesAutomation.is_active == True).first()
    if not settings:
        return

    # Check for "All Posts" mode (*) or specific keywords
    is_all_mode = False
    keywords = []

    if settings.keywords and settings.keywords.strip() == '*':
        is_all_mode = True
    elif settings.keywords:
        keywords = [k.strip().lower() for k in settings.keywords.split(',')]
    
    # If not in "All Mode" and no valid keywords found, stop.
    if not is_all_mode and not keywords:
        return

    # Get numeric group ID
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return
        
    try:
        group_id = vk_service.resolve_vk_group_id(project.vkProjectId, user_token)
    except Exception as e:
        print(f"STORIES_AUTO: Failed to resolve group ID for {project_id}: {e}")
        return

    # 2. Предфильтрация: берём только последние 30 постов, свежие (24ч) и подходящие по keywords
    cutoff_time = datetime.now() - timedelta(hours=24)
    candidates = []
    
    for post in posts_from_vk[:30]:
        date_ts = post.get('date', 0)
        
        # Сначала проверяем дату — самая дешёвая операция
        if datetime.fromtimestamp(date_ts) < cutoff_time:
            continue

        # Проверяем keywords (если не "All Mode")
        if not is_all_mode:
            text = post.get('text', '').lower()
            if not any(k in text for k in keywords):
                continue
        
        candidates.append(post)
    
    if not candidates:
        return
    
    # 3. Batch-проверка: один запрос вместо N отдельных
    from models_library.automations import StoriesAutomationLog
    candidate_ids = [p.get('id') for p in candidates]
    already_processed = set(
        row[0] for row in db.query(StoriesAutomationLog.vk_post_id).filter(
            StoriesAutomationLog.project_id == project_id,
            StoriesAutomationLog.vk_post_id.in_(candidate_ids)
        ).all()
    )
    
    # 4. Обрабатываем только новые посты
    for post in candidates:
        post_id = post.get('id')
        
        if post_id in already_processed:
            continue
        
        # Redis-лок на уровне конкретного поста — предотвращает параллельную обработку
        # одного и того же поста несколькими Gunicorn-воркерами
        story_lock_key = f"vk_planner:story_publish:{project_id}:{post_id}"
        if redis_client:
            try:
                # Пытаемся захватить лок на 5 минут (достаточно для генерации + загрузки)
                if not redis_client.set(story_lock_key, "locked", nx=True, ex=300):
                    print(f"STORIES_AUTO: Post {post_id} is already being processed by another worker. Skipping.")
                    continue
            except Exception as e:
                print(f"STORIES_AUTO: Redis lock error for post {post_id}: {e}")
                # При ошибке Redis продолжаем — constraint в БД всё равно защитит
        
        process_single_story_for_post(db, project_id, post, group_id, user_token, force=False)
