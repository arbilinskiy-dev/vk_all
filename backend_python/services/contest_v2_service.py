"""
Сервис для Конкурс 2.0
Управляет синхронизацией конкурса с системными постами в расписании.
"""

from sqlalchemy.orm import Session
from models_library.contest_v2 import ContestV2
from models_library.posts import SystemPost
from datetime import datetime
from typing import Any, cast
import logging
import uuid
import json
import re

logger = logging.getLogger(__name__)

# Типы постов для Конкурс 2.0
POST_TYPE_CONTEST_V2_START = 'contest_v2_start'


def sync_contest_start_post(db: Session, contest: ContestV2):
    """
    Синхронизирует стартовый пост конкурса с системными постами в расписании.
    
    Логика:
    - Если start_type='new_post' и есть данные поста:
      - Создаём или обновляем SystemPost с post_type='contest_v2_start' и related_id=contest.id
    - Если start_type='existing_post':
      - Удаляем связанный SystemPost (если был) и парсим VK post ID из ссылки
    """
    logger.info(f"[ContestV2: {contest.id}] Синхронизация стартового поста.")
    
    # Ищем существующий связанный пост
    existing_post = db.query(SystemPost).filter(
        SystemPost.related_id == contest.id,
        SystemPost.post_type == POST_TYPE_CONTEST_V2_START
    ).first()
    
    # Получаем значения атрибутов конкурса (SQLAlchemy runtime)
    contest_is_active: bool = cast(Any, contest.is_active)
    contest_start_type: str = cast(Any, contest.start_type)
    contest_start_post_date: str | None = cast(Any, contest.start_post_date)
    contest_start_post_time: str | None = cast(Any, contest.start_post_time)
    contest_start_post_text: str | None = cast(Any, contest.start_post_text)
    contest_start_post_images: str | None = cast(Any, contest.start_post_images)
    contest_title: str = cast(Any, contest.title)
    contest_description: str | None = cast(Any, contest.description)
    contest_existing_post_link: str | None = cast(Any, contest.existing_post_link)
    
    # Определяем статус поста на основе is_active конкурса
    target_status = 'pending_publication' if contest_is_active else 'paused'
    
    if contest_start_type == 'new_post':
        # Нужно создать/обновить SystemPost
        
        # Собираем дату публикации из date + time (с дефолтами если None)
        date_for_pub = contest_start_post_date or datetime.now().strftime('%Y-%m-%d')
        time_for_pub = contest_start_post_time or '12:00'
        publication_date = _build_publication_datetime(date_for_pub, time_for_pub)
        
        if existing_post:
            # Обновляем существующий пост
            logger.info(f"[ContestV2: {contest.id}] Обновление существующего SystemPost: {existing_post.id}")
            existing_post.publication_date = publication_date  # type: ignore[assignment]
            existing_post.text = contest_start_post_text or ''  # type: ignore[assignment]
            existing_post.images = contest_start_post_images or '[]'  # type: ignore[assignment]
            existing_post.status = target_status  # type: ignore[assignment]
            existing_post.title = f"🎁 Конкурс 2.0: {contest_title} (Старт)"  # type: ignore[assignment]
            existing_post.description = contest_description  # type: ignore[assignment]
            existing_post.is_active = contest_is_active  # type: ignore[assignment]
        else:
            # Создаём новый пост
            logger.info(f"[ContestV2: {contest.id}] Создание нового SystemPost")
            new_post = SystemPost(
                id=str(uuid.uuid4()),
                project_id=cast(Any, contest.project_id),
                post_type=POST_TYPE_CONTEST_V2_START,
                related_id=cast(Any, contest.id),
                status=target_status,
                publication_date=publication_date,
                text=contest_start_post_text or '',
                images=contest_start_post_images or '[]',
                title=f"🎁 Конкурс 2.0: {contest_title} (Старт)",
                description=contest_description,
                is_active=contest_is_active
            )
            db.add(new_post)
            db.flush()
            logger.info(f"[ContestV2: {contest.id}] Создан SystemPost: {new_post.id}")
    
    elif contest_start_type == 'existing_post':
        # Удаляем связанный пост если был (пользователь переключился на существующий)
        if existing_post:
            logger.info(f"[ContestV2: {contest.id}] Удаление SystemPost (переключение на existing_post): {existing_post.id}")
            db.delete(existing_post)
        
        # Парсим VK post ID из ссылки
        if contest_existing_post_link:
            match = re.search(r"wall(-?\d+)_(\d+)", contest_existing_post_link)
            if match:
                owner_id = int(match.group(1))
                post_id = int(match.group(2))
                contest.vk_start_post_id = post_id  # type: ignore[assignment]
                logger.info(f"[ContestV2: {contest.id}] Извлечён VK post ID: {post_id} из ссылки")
                
                # Если конкурс активен и есть ссылка, сразу переводим в статус active
                if contest_is_active:
                    contest.status = 'active'  # type: ignore[assignment]
            else:
                logger.warning(f"[ContestV2: {contest.id}] Некорректная ссылка на пост: {contest_existing_post_link}")
    
    db.commit()
    logger.info(f"[ContestV2: {contest.id}] Синхронизация завершена.")


def on_start_post_published(db: Session, system_post: SystemPost, vk_post_id: str):
    """
    Вызывается когда стартовый пост конкурса опубликован в VK.
    Обновляет статус конкурса.
    
    ВАЖНО: Пометка опубликованного поста (post_type) происходит НЕ здесь,
    а в mark_published_contest_posts(), которая вызывается после загрузки постов с VK.
    Это связано с тем, что в момент публикации пост ещё не сохранён в таблицу posts.
    
    Args:
        vk_post_id: Полный ID поста в формате "owner_id_post_id", например "-173525155_1303"
    """
    contest_id = system_post.related_id
    logger.info(f"[ContestV2: {contest_id}] Стартовый пост опубликован. VK Post ID: {vk_post_id}")
    
    contest = db.query(ContestV2).filter(ContestV2.id == contest_id).first()
    if not contest:
        logger.error(f"[ContestV2: {contest_id}] Конкурс не найден для поста {system_post.id}")
        return
    
    # Извлекаем только числовой post_id из формата "owner_id_post_id"
    # Например: "-173525155_1303" -> 1303
    try:
        post_id_only = int(str(vk_post_id).split('_')[-1])
    except (ValueError, IndexError):
        logger.error(f"[ContestV2: {contest_id}] Не удалось извлечь post_id из: {vk_post_id}")
        post_id_only = None
    
    # Обновляем конкурс
    contest.vk_start_post_id = post_id_only  # type: ignore[assignment]
    contest.status = 'active'  # type: ignore[assignment]
    
    db.commit()
    logger.info(f"[ContestV2: {contest_id}] Конкурс активирован. Post ID: {post_id_only}")


def delete_contest_posts(db: Session, contest_id: str):
    """
    Удаляет все связанные с конкурсом системные посты.
    Вызывается при удалении конкурса.
    """
    logger.info(f"[ContestV2: {contest_id}] Удаление связанных постов.")
    deleted_count = db.query(SystemPost).filter(SystemPost.related_id == contest_id).delete()
    db.commit()
    logger.info(f"[ContestV2: {contest_id}] Удалено постов: {deleted_count}")
    return deleted_count


def mark_published_contest_posts(db: Session, project_id: str):
    """
    Помечает опубликованные посты, связанные с активными конкурсами 2.0.
    Вызывается после загрузки постов с VK (replace_published_posts).
    
    Логика:
    - Находим все активные конкурсы с vk_start_post_id
    - Для каждого конкурса ищем пост с соответствующим ID
    - Проставляем post_type и related_id
    """
    from models_library.posts import Post
    from crud.project_crud import get_project_by_id
    
    # Получаем проект для извлечения owner_id
    project = get_project_by_id(db, project_id)
    if not project:
        return
    
    # Находим все активные конкурсы проекта с опубликованными постами
    contests = db.query(ContestV2).filter(
        ContestV2.project_id == project_id,
        ContestV2.status == 'active',
        ContestV2.vk_start_post_id.isnot(None)
    ).all()
    
    if not contests:
        return
    
    logger.info(f"[ContestV2] Проект {project_id}: найдено {len(contests)} активных конкурсов для пометки постов")
    
    for contest in contests:
        # Формируем ID поста в формате "-owner_id_post_id"
        # project.vkProjectId - это ID группы без минуса (например, "173525155")
        vk_post_full_id = f"-{project.vkProjectId}_{contest.vk_start_post_id}"
        
        # Ищем пост в базе
        published_post = db.query(Post).filter(Post.id == vk_post_full_id).first()
        
        if published_post:
            if published_post.post_type != POST_TYPE_CONTEST_V2_START:
                published_post.post_type = POST_TYPE_CONTEST_V2_START  # type: ignore[assignment]
                published_post.related_id = contest.id  # type: ignore[assignment]
                logger.info(f"[ContestV2: {contest.id}] Пост {vk_post_full_id} помечен как contest_v2_start")
        else:
            logger.debug(f"[ContestV2: {contest.id}] Пост {vk_post_full_id} не найден в кэше")
    
    db.commit()


def _build_publication_datetime(date_str: str, time_str: str) -> str:
    """
    Собирает ISO datetime строку из отдельных date и time.
    """
    if not date_str:
        date_str = datetime.now().strftime('%Y-%m-%d')
    if not time_str:
        time_str = '12:00'
    
    try:
        # Парсим дату и время
        dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        return dt.isoformat()
    except ValueError:
        # Fallback
        return datetime.now().isoformat()
