# Обработчик wall_post_new — Новый пост опубликован
#
# Событие приходит когда пост опубликован:
# - Сразу при создании
# - Из отложки (вручную или по таймеру)
# - Предложенный пост (post_type == "suggest")
#
# Действия:
# 1. Suggest-посты → обновляем список предложенных
# 2. Опубликованные → upsert в БД + назначение тегов + триггер автоматизаций
# 3. Debounce для обновления published-списка

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult
from ...debounce import should_debounce

logger = logging.getLogger("vk_callback.handlers.wall")


class WallPostNewHandler(BaseEventHandler):
    """
    Обработчик события wall_post_new.
    
    Обрабатывает как опубликованные, так и предложенные посты.
    Переносит логику из старого vk_callback_service.py (без потерь).
    """
    
    HANDLES_EVENTS = ["wall_post_new"]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        if not project:
            return HandlerResult(success=False, message="Проект не найден")
        
        obj = event.object or {}
        post_type = obj.get("post_type", "post")
        postponed_id = obj.get("postponed_id")
        
        # ── Предложенные посты ──────────────────────────────
        if post_type == "suggest":
            return self._handle_suggest(db, event, project)
        
        # ── Опубликованные посты ────────────────────────────
        return self._handle_published(db, event, project, obj, postponed_id)
    
    def _handle_suggest(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        """Обработка предложенного поста."""
        self._log(f"Предложенный пост для проекта '{project.name}'", event)
        
        try:
            from services.post_retrieval_service import refresh_suggested_posts
            from services import update_tracker
            from config import settings
            
            refresh_suggested_posts(db, project.id, settings.vk_user_token)
            update_tracker.add_updated_project(project.id)
            
            self._log(f"Список предложенных постов обновлён", event)
            return HandlerResult(
                success=True,
                message="Предложенные посты обновлены",
                action_taken="refresh_suggested"
            )
        except Exception as e:
            self._log(f"ОШИБКА обновления предложенных: {e}", event, "error")
            return HandlerResult(
                success=False,
                message=f"Ошибка: {e}",
                should_retry=True
            )
    
    def _handle_published(self, db, event, project, obj, postponed_id) -> HandlerResult:
        """Обработка опубликованного поста."""
        
        if postponed_id:
            self._log(f"Опубликован из отложки (postponed_id={postponed_id})", event)
        else:
            self._log(f"Новый опубликованный пост", event)
        
        # Debounce: если был недавний refresh — пропускаем
        if should_debounce(event.group_id, "refresh_published"):
            self._log(f"Debounced — обновление уже запланировано", event)
            return HandlerResult(
                success=True,
                message="Debounced",
                action_taken="debounced"
            )
        
        try:
            from services import vk_service, update_tracker
            from services.post_helpers import assign_tags_to_post
            from config import settings
            import crud
            
            # ─── 1. Upsert поста в БД ──────────────────────
            post_data = dict(obj)
            if 'owner_id' not in post_data:
                post_data['owner_id'] = -int(project.vkProjectId)
            if 'id' not in post_data and 'post_id' in post_data:
                post_data['id'] = post_data['post_id']
            
            formatted_post = vk_service.format_vk_post(post_data, is_published=True)
            assign_tags_to_post(db, formatted_post, project.id)
            crud.upsert_post(db, formatted_post, is_published=True, project_id=project.id)
            update_tracker.add_updated_project(project.id)
            
            # ─── 2. Триггер автоматизаций ──────────────────
            self._trigger_automations(db, project)
            
            # ─── 2.5. Триггер автоматизации «Посты → Истории» ──
            self._trigger_stories_automation(db, project, post_data, event)
            
            # ─── 3. Обновляем список опубликованных ────────
            try:
                from services.post_retrieval import refresh_published_posts
                refresh_published_posts(db, project.id, settings.vk_user_token)
            except Exception as refresh_err:
                self._log(f"Ошибка refresh published: {refresh_err}", event, "warning")
            
            self._log(
                f"Пост обработан: id={formatted_post.get('id')}, project='{project.name}'",
                event
            )
            return HandlerResult(
                success=True,
                message="Пост обработан и сохранён",
                action_taken="upsert_post",
                data={"post_id": formatted_post.get("id"), "postponed_id": postponed_id}
            )
            
        except Exception as e:
            self._log(f"ОШИБКА обработки поста: {e}", event, "error")
            return HandlerResult(
                success=False,
                message=f"Ошибка: {e}",
                should_retry=True
            )
    
    def _trigger_automations(self, db, project):
        """Запуск автоматизаций при публикации поста (конкурс отзывов и т.д.)."""
        try:
            import services.automations.reviews.service as contest_service
            import services.automations.reviews.crud as crud_automations
            
            contest = crud_automations.get_contest_settings(db, project.id)
            if contest and contest.is_active:
                logger.info(f"EVENT TRIGGER: Запуск автоматизации конкурса для '{project.name}'")
                contest_service.collect_participants(db, project.id)
                contest_service.process_new_participants(db, project.id)
        except Exception as e:
            logger.warning(f"EVENT TRIGGER: Ошибка автоматизации: {e}")

    def _trigger_stories_automation(self, db, project, post_data, event):
        """
        Триггер автоматизации «Посты → Истории» из callback wall_post_new.
        
        Проверяет настройки StoriesAutomation для проекта.
        Если активна и пост подходит по критериям (keywords / режим «все посты»)
        — генерирует и публикует историю.
        
        Дедупликация: 4 уровня (event_id → SQL check → Redis lock → DB constraint).
        """
        try:
            from models_library.automations import StoriesAutomation, StoriesAutomationLog
            from services.automations.stories.logic import process_single_story_for_post
            from services import vk_service
            from config import settings
            from database import redis_client
            from datetime import datetime, timedelta
            import json as json_lib
            
            # 1. Проверяем: есть ли активная автоматизация для проекта
            automation = db.query(StoriesAutomation).filter(
                StoriesAutomation.project_id == project.id,
                StoriesAutomation.is_active == True
            ).first()
            
            if not automation:
                return
            
            if not automation.keywords:
                return
            
            # 2. Определяем режим: «все посты» (*) или по ключевым словам
            is_all_mode = automation.keywords.strip() == '*'
            keywords = []
            if not is_all_mode:
                keywords = [k.strip().lower() for k in automation.keywords.split(',') if k.strip()]
                if not keywords:
                    return
            
            # 3. Проверяем текст поста по критериям keywords
            post_text = post_data.get('text', '').lower()
            if not is_all_mode:
                if not any(k in post_text for k in keywords):
                    logger.info(f"STORIES CALLBACK: Пост не подходит по keywords для '{project.name}'")
                    return
            
            # 4. Проверяем свежесть поста (последние 24ч)
            post_date = post_data.get('date', 0)
            if post_date:
                cutoff = datetime.now() - timedelta(hours=24)
                if datetime.fromtimestamp(post_date) < cutoff:
                    logger.info(f"STORIES CALLBACK: Пост старше 24ч, пропускаем")
                    return
            
            post_id = post_data.get('id')
            if not post_id:
                return
            
            # 5. SQL-проверка: пост уже обработан?
            existing = db.query(StoriesAutomationLog).filter(
                StoriesAutomationLog.project_id == project.id,
                StoriesAutomationLog.vk_post_id == post_id
            ).first()
            
            if existing:
                logger.info(f"STORIES CALLBACK: Пост {post_id} уже обработан, пропускаем")
                return
            
            # 6. Redis-лок: предотвращаем параллельную обработку
            story_lock_key = f"vk_planner:story_publish:{project.id}:{post_id}"
            if redis_client:
                try:
                    if not redis_client.set(story_lock_key, "locked", nx=True, ex=300):
                        logger.info(f"STORIES CALLBACK: Пост {post_id} уже обрабатывается другим воркером")
                        return
                except Exception as e:
                    logger.warning(f"STORIES CALLBACK: Redis lock ошибка: {e}")
                    # Продолжаем — DB constraint защитит от дубля
            
            # 7. Собираем community_tokens проекта
            community_tokens = []
            if project.communityToken:
                community_tokens.append(project.communityToken)
            if project.additional_community_tokens:
                try:
                    extras = json_lib.loads(project.additional_community_tokens)
                    if isinstance(extras, list):
                        community_tokens.extend([t for t in extras if t])
                except:
                    pass
            
            # 8. Резолвим group_id
            try:
                group_id = vk_service.resolve_vk_group_id(project.vkProjectId, settings.vk_user_token)
            except Exception as e:
                logger.warning(f"STORIES CALLBACK: Не удалось определить group_id: {e}")
                return
            
            # 9. Публикуем историю
            logger.info(f"STORIES CALLBACK: Публикуем историю для поста {post_id}, проект '{project.name}'")
            result = process_single_story_for_post(
                db=db,
                project_id=project.id,
                post=post_data,
                group_id=group_id,
                user_token=settings.vk_user_token,
                force=False,
                community_tokens=community_tokens if community_tokens else None
            )
            
            if result and result.get('status') == 'success':
                logger.info(f"STORIES CALLBACK: ✅ История опубликована для поста {post_id}")
            else:
                logger.warning(f"STORIES CALLBACK: Результат: {result}")
                
        except Exception as e:
            logger.warning(f"STORIES CALLBACK: Ошибка автоматизации историй: {e}")
