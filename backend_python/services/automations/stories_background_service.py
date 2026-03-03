from sqlalchemy.orm import Session
import logging
from datetime import datetime, timedelta

from models_library.automations import StoriesAutomation, StoriesAutomationLog
from models_library.projects import Project
from models_library.posts import Post
from services import vk_service
from services.automations import stories_service
from services.automations.stories.logic import process_single_story_for_post
from services.automations.stories.viewers import update_all_stats_and_viewers
from database import redis_client
from config import settings
import json as json_lib

# Setup logger
logger = logging.getLogger(__name__)


def _get_community_tokens(project) -> list:
    """Собирает все токены сообщества из проекта."""
    tokens = []
    if project.communityToken:
        tokens.append(project.communityToken)
    if project.additional_community_tokens:
        try:
            extras = json_lib.loads(project.additional_community_tokens)
            if isinstance(extras, list):
                tokens.extend([t for t in extras if t])
        except:
            pass
    return tokens


def run_stories_automation_cycle():
    """
    Фоновая задача (раз в час). Три обязанности:
    
    1. RECONCILIATION — подхват пропущенных постов.
       Если callback не дошёл (перезапуск, Redis down) — находим посты
       из таблицы `posts` за последние 1 час, для которых нет записи
       в `stories_automation_logs`, и публикуем историю.
       НЕ обращается к VK API за постами (работает по локальной БД).
    
    2. СБОР СТАТИСТИКИ И ЗРИТЕЛЕЙ — для всех активных историй.
       Получает stories → stats → viewers → user details.
       Использует community_token где возможно.
    
    3. СИНХРОНИЗАЦИЯ РУЧНЫХ ИСТОРИЙ — обнаружение историй,
       опубликованных вручную через VK (не через систему).
    """
    from database import SessionLocal
    import time
    
    db = SessionLocal()
    try:
        # Находим все проекты с активной автоматизацией историй
        active_configs = db.query(StoriesAutomation).filter(
            StoriesAutomation.is_active == True
        ).all()
        
        if not active_configs:
            return

        total = len(active_configs)
        print(f"STORIES_BG: Цикл запущен — {total} активных автоматизаций. {datetime.now()}")

        for index, config in enumerate(active_configs):
            project_id = config.project_id
            
            if not config.keywords:
                continue

            try:
                project = db.query(Project).filter(Project.id == project_id).first()
                if not project or project.disabled:
                    continue
                
                print(f"STORIES_BG: [{index+1}/{total}] Проект '{project.name}' ({project_id})")
                
                # Собираем community_tokens
                community_tokens = _get_community_tokens(project)
                
                # ─── 1. RECONCILIATION: подхват пропущенных постов ──────
                _reconcile_missed_posts(db, project, config, community_tokens)
                
                # ─── 2. СБОР СТАТИСТИКИ И ЗРИТЕЛЕЙ ──────────────────────
                _collect_stories_data(db, project, community_tokens)
                
                # ─── 3. СИНХРОНИЗАЦИЯ РУЧНЫХ ИСТОРИЙ ────────────────────
                try:
                    stories_service.get_community_stories(db, project_id, settings.vk_user_token)
                except Exception as e:
                    print(f"STORIES_BG: Ошибка синхронизации ручных историй: {e}")
                
                # Пауза между проектами — защита от rate limit
                time.sleep(2)

            except Exception as e:
                print(f"STORIES_BG: Ошибка на уровне проекта {project_id}: {e}")

    except Exception as e:
        print(f"STORIES_BG: Критическая ошибка цикла: {e}")
    finally:
        db.close()


def _reconcile_missed_posts(db: Session, project, config: StoriesAutomation, community_tokens: list):
    """
    Подхват пропущенных постов: ищем посты за последний 1 час в таблице posts,
    которые не имеют записи в stories_automation_logs.
    
    Работает БЕЗ обращения к VK API — только по локальной БД.
    """
    try:
        from datetime import datetime, timedelta
        
        project_id = project.id
        
        # Определяем режим keywords
        is_all_mode = config.keywords.strip() == '*'
        keywords = []
        if not is_all_mode:
            keywords = [k.strip().lower() for k in config.keywords.split(',') if k.strip()]
            if not keywords:
                return
        
        # Ищем посты за последний 1 час (интервал фоновой задачи)
        cutoff = datetime.now() - timedelta(hours=1)
        
        recent_posts = db.query(Post).filter(
            Post.projectId == project_id,
            Post.date >= cutoff.isoformat()
        ).all()
        
        if not recent_posts:
            return
        
        # Batch-проверка: какие посты уже обработаны?
        post_ids = []
        for p in recent_posts:
            # Post.id может быть "wall-{group_id}_{post_id}" или просто число
            # Извлекаем числовой vk_post_id
            vk_id = _extract_vk_post_id(p)
            if vk_id:
                post_ids.append(vk_id)
        
        if not post_ids:
            return
        
        already_processed = set(
            row[0] for row in db.query(StoriesAutomationLog.vk_post_id).filter(
                StoriesAutomationLog.project_id == project_id,
                StoriesAutomationLog.vk_post_id.in_(post_ids)
            ).all()
        )
        
        missed_count = 0
        for post_obj in recent_posts:
            vk_id = _extract_vk_post_id(post_obj)
            if not vk_id or vk_id in already_processed:
                continue
            
            # Проверяем keywords
            post_text = (post_obj.text or '').lower()
            if not is_all_mode:
                if not any(k in post_text for k in keywords):
                    continue
            
            # Redis-лок
            story_lock_key = f"vk_planner:story_publish:{project_id}:{vk_id}"
            if redis_client:
                try:
                    if not redis_client.set(story_lock_key, "locked", nx=True, ex=300):
                        continue
                except:
                    pass
            
            # Формируем данные поста для process_single_story_for_post
            post_data = _post_model_to_dict(post_obj, project)
            
            try:
                group_id = vk_service.resolve_vk_group_id(project.vkProjectId, settings.vk_user_token)
            except Exception as e:
                print(f"STORIES_BG RECONCILE: Не удалось определить group_id: {e}")
                return
            
            print(f"STORIES_BG RECONCILE: Подхватываем пропущенный пост {vk_id} для '{project.name}'")
            result = process_single_story_for_post(
                db=db,
                project_id=project_id,
                post=post_data,
                group_id=group_id,
                user_token=settings.vk_user_token,
                force=False,
                community_tokens=community_tokens if community_tokens else None
            )
            
            if result and result.get('status') == 'success':
                missed_count += 1
                print(f"STORIES_BG RECONCILE: ✅ История опубликована для поста {vk_id}")
            
        if missed_count > 0:
            print(f"STORIES_BG RECONCILE: Подхвачено {missed_count} пропущенных постов для '{project.name}'")
            
    except Exception as e:
        print(f"STORIES_BG RECONCILE: Ошибка: {e}")


def _collect_stories_data(db: Session, project, community_tokens: list):
    """
    Сбор статистики и зрителей для всех активных (не финализированных) историй проекта.
    
    Поток: получаем stories logs → stats → viewers → user details.
    Использует community_token где возможно (stats, viewers, users.get).
    """
    try:
        project_id = project.id
        
        # Получаем все нефинализированные истории (is_active или stats/viewers не финализированы)
        logs = db.query(StoriesAutomationLog).filter(
            StoriesAutomationLog.project_id == project_id,
            StoriesAutomationLog.status == 'published',
            # Берём только истории, у которых остался хотя бы один не финализированный показатель
            (
                (StoriesAutomationLog.stats_finalized == False) |
                (StoriesAutomationLog.viewers_finalized == False)
            )
        ).all()
        
        if not logs:
            return
        
        print(f"STORIES_BG STATS: Обработка {len(logs)} историй для '{project.name}' "
              f"(community_tokens: {len(community_tokens)})")
        
        # Вызываем hub-функцию: обновление и статистики, и зрителей
        # Если есть community_tokens — они используются ЭКСКЛЮЗИВНО
        result = update_all_stats_and_viewers(
            db=db,
            logs=logs,
            user_token=settings.vk_user_token,
            project_id=project_id,
            community_tokens=community_tokens if community_tokens else None
        )
        
        stats_updated = result.get('stats', {}).get('updated', 0)
        viewers_updated = result.get('viewers', {}).get('updated', 0)
        
        if stats_updated > 0 or viewers_updated > 0:
            print(f"STORIES_BG STATS: ✅ Обновлено: stats={stats_updated}, viewers={viewers_updated}")
            
    except Exception as e:
        print(f"STORIES_BG STATS: Ошибка сбора данных: {e}")


def _extract_vk_post_id(post_obj) -> int | None:
    """
    Извлекает числовой VK post_id из модели Post.
    Post.id может быть 'wall-{group_id}_{post_id}' или просто '{post_id}'.
    """
    try:
        post_id_str = str(post_obj.id)
        if '_' in post_id_str:
            # wall-173525155_1428 → 1428
            return int(post_id_str.split('_')[-1])
        return int(post_id_str)
    except (ValueError, TypeError):
        return None


def _post_model_to_dict(post_obj, project) -> dict:
    """
    Конвертирует модель Post в dict формата VK API для process_single_story_for_post.
    """
    import json as json_lib
    
    vk_id = _extract_vk_post_id(post_obj)
    
    # Парсим attachments
    attachments = []
    if post_obj.attachments:
        try:
            attachments = json_lib.loads(post_obj.attachments) if isinstance(post_obj.attachments, str) else post_obj.attachments
        except:
            pass
    
    # Парсим images
    images = []
    if post_obj.images:
        try:
            images = json_lib.loads(post_obj.images) if isinstance(post_obj.images, str) else post_obj.images
        except:
            pass
    
    # Если attachments пусты, но images есть — создаём attachments из images
    if not attachments and images:
        attachments = []
        for img_url in images:
            if isinstance(img_url, str):
                attachments.append({
                    'type': 'photo',
                    'photo': {
                        'sizes': [{'type': 'w', 'url': img_url}]
                    }
                })
    
    return {
        'id': vk_id,
        'text': post_obj.text or '',
        'date': int(datetime.fromisoformat(post_obj.date).timestamp()) if post_obj.date else 0,
        'owner_id': -int(project.vkProjectId),
        'attachments': attachments,
    }
