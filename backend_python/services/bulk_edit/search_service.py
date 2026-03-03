# Сервис поиска постов для массового редактирования

from sqlalchemy.orm import Session
from typing import List, Dict
import json

import crud
import schemas


def search_posts(
    db: Session,
    request: schemas.BulkEditSearchRequest
) -> schemas.BulkEditSearchResponse:
    """
    Ищет посты по заданным критериям и формирует ответ для фронтенда.
    """
    print(f"[BULK_EDIT] Searching posts with criteria: {request.matchCriteria}", flush=True)
    print(f"[BULK_EDIT] Search from date: {request.searchFromDate}", flush=True)
    print(f"[BULK_EDIT] Target projects: {len(request.targetProjectIds)}", flush=True)
    
    # Получаем сырые данные из БД
    raw_results, project_names = crud.search_matching_posts(db, request)
    
    print(f"[BULK_EDIT] Found {len(raw_results)} matching posts", flush=True)
    
    # Формируем ответ
    source_post_data = None
    matched_posts = []
    
    stats_by_type = {'published': 0, 'scheduled': 0, 'system': 0}
    project_ids_found = set()
    
    for post_data in raw_results:
        found_post = _format_found_post(post_data, project_names)
        
        # Проверяем, является ли это исходным постом — запоминаем для sourcePost,
        # но ТАКЖЕ добавляем в matched_posts, чтобы он тоже был доступен для редактирования
        if (post_data['id'] == request.sourcePost.id and 
            post_data['postType'] == request.sourcePost.postType):
            source_post_data = found_post
        
        # Все найденные посты (включая исходный) попадают в matched_posts
        matched_posts.append(found_post)
        stats_by_type[post_data['postType']] += 1
        project_ids_found.add(post_data['projectId'])
    
    # Если исходный пост не найден в результатах, создаём его из запроса
    if source_post_data is None:
        source_post_data = schemas.FoundPost(
            id=request.sourcePost.id,
            postType=request.sourcePost.postType,
            projectId=request.sourcePost.projectId,
            projectName=project_names.get(request.sourcePost.projectId, 'Неизвестный проект'),
            date=request.sourcePost.date,
            textPreview=request.sourcePost.text[:100] if request.sourcePost.text else '',
            attachmentPreviews=[],
            imageCount=0,
            attachmentCount=len(request.sourcePost.attachmentIds)
        )
    
    return schemas.BulkEditSearchResponse(
        sourcePost=source_post_data,
        matchedPosts=matched_posts,
        stats=schemas.SearchStats(
            totalFound=len(matched_posts),
            byType=stats_by_type,
            projectCount=len(project_ids_found)
        )
    )


def _format_found_post(post_data: Dict, project_names: Dict[str, str]) -> schemas.FoundPost:
    """Форматирует данные поста в схему FoundPost."""
    
    # Считаем количество изображений и собираем URL миниатюр
    image_count = 0
    attachment_previews = []
    if post_data.get('images'):
        try:
            images = post_data['images']
            if isinstance(images, str):
                images = json.loads(images)
            if images:
                image_count = len(images)
                # Извлекаем URL миниатюр (preview130 или sizes[0].url)
                for img in images:
                    if isinstance(img, dict):
                        # Пробуем разные поля с URL миниатюр
                        preview_url = (
                            img.get('preview130') or 
                            img.get('preview') or 
                            img.get('photo_130') or
                            img.get('url')
                        )
                        # Если есть sizes, берём первую миниатюру
                        if not preview_url and img.get('sizes'):
                            sizes = img['sizes']
                            if sizes and isinstance(sizes, list) and len(sizes) > 0:
                                preview_url = sizes[0].get('url')
                        if preview_url:
                            attachment_previews.append(preview_url)
        except (json.JSONDecodeError, TypeError):
            pass
    
    # Считаем количество вложений
    attachment_count = 0
    if post_data.get('attachments'):
        try:
            attachments = post_data['attachments']
            if isinstance(attachments, str):
                attachments = json.loads(attachments)
            attachment_count = len(attachments) if attachments else 0
        except (json.JSONDecodeError, TypeError):
            pass
    
    # Обрезаем текст для preview
    text = post_data.get('text', '') or ''
    text_preview = text[:100] + ('...' if len(text) > 100 else '')
    
    return schemas.FoundPost(
        id=post_data['id'],
        postType=post_data['postType'],
        projectId=post_data['projectId'],
        projectName=project_names.get(post_data['projectId'], 'Неизвестный проект'),
        date=post_data['date'],
        textPreview=text_preview,
        attachmentPreviews=attachment_previews,
        imageCount=image_count,
        attachmentCount=attachment_count
    )
