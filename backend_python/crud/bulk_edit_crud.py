# CRUD операции для массового редактирования постов

from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import json

import models
import schemas
from utils.text_normalize import normalize_text_for_comparison


def search_matching_posts(
    db: Session,
    request: schemas.BulkEditSearchRequest
) -> Tuple[List[Dict], Dict[str, str]]:
    """
    Ищет посты по заданным критериям.
    
    Returns:
        Tuple[List[Dict], Dict[str, str]]: 
            - Список найденных постов (словари с данными)
            - Словарь project_id -> project_name для отображения
    """
    results = []
    project_names = {}
    
    # Получаем названия проектов
    projects = db.query(models.Project).filter(
        models.Project.id.in_(request.targetProjectIds)
    ).all()
    project_names = {p.id: p.name for p in projects}
    
    # === ДЕБАГ: Проекты ===
    print(f"[BULK_EDIT_CRUD] Найдено проектов в БД: {len(projects)} из {len(request.targetProjectIds)} запрошенных", flush=True)
    for p in projects:
        print(f"[BULK_EDIT_CRUD]   Проект: id={p.id}, name='{p.name}'", flush=True)
    missing_ids = set(request.targetProjectIds) - set(p.id for p in projects)
    if missing_ids:
        print(f"[BULK_EDIT_CRUD] ⚠️ Проекты НЕ найдены в БД: {missing_ids}", flush=True)
    # === /ДЕБАГ ===
    
    # Парсим дату начала поиска
    search_from_date = request.searchFromDate
    
    # Подготавливаем критерии сравнения
    source_text = request.sourcePost.text
    source_date = request.sourcePost.date
    
    # Нормализованный текст для сравнения (убирает VK-разметку, переменные и т.д.)
    source_text_normalized = normalize_text_for_comparison(source_text) if request.matchCriteria.byText else ''
    
    # === ДЕБАГ: Критерии поиска ===
    print(f"[BULK_EDIT_CRUD] Критерии сравнения:", flush=True)
    print(f"[BULK_EDIT_CRUD]   searchFromDate: '{search_from_date}'", flush=True)
    print(f"[BULK_EDIT_CRUD]   source_text ({len(source_text)} симв.): '{source_text[:80]}...'", flush=True)
    if request.matchCriteria.byText:
        print(f"[BULK_EDIT_CRUD]   source_text_normalized ({len(source_text_normalized)} симв.): '{source_text_normalized[:80]}...'", flush=True)
    print(f"[BULK_EDIT_CRUD]   source_date: '{source_date}'", flush=True)
    print(f"[BULK_EDIT_CRUD]   byText: {request.matchCriteria.byText}, byDateTime: {request.matchCriteria.byDateTime}", flush=True)
    # === /ДЕБАГ ===
    
    # === Поиск в опубликованных постах (Post) ===
    if request.targetPostTypes.published:
        query = db.query(models.Post).filter(
            models.Post.projectId.in_(request.targetProjectIds),
            models.Post.date >= search_from_date
        )
        
        # Применяем SQL-фильтры (только дата — текст сравниваем в Python с нормализацией)
        if request.matchCriteria.byDateTime:
            query = query.filter(models.Post.date == source_date)
        
        published_posts_raw = query.all()
        
        # Фильтруем по тексту в Python с нормализацией
        if request.matchCriteria.byText:
            published_posts = [
                p for p in published_posts_raw
                if normalize_text_for_comparison(p.text) == source_text_normalized
            ]
        else:
            published_posts = published_posts_raw
        
        # === ДЕБАГ ===
        print(f"[BULK_EDIT_CRUD] Опубликованные (Post): {len(published_posts_raw)} до фильтра текста, {len(published_posts)} после", flush=True)
        for pp in published_posts[:3]:
            pp_text = (pp.text or '')[:60]
            print(f"[BULK_EDIT_CRUD]   id={pp.id}, projectId={pp.projectId}, date={pp.date}, text='{pp_text}'", flush=True)
        if not published_posts and published_posts_raw:
            # Есть посты по дате, но текст не совпал — покажем первый пример
            sample = published_posts_raw[0]
            sample_norm = normalize_text_for_comparison(sample.text)
            print(f"[BULK_EDIT_CRUD]   Текст не совпал (нормализованный). Пример:", flush=True)
            print(f"[BULK_EDIT_CRUD]     Исходный норм ({len(source_text_normalized)} симв.): '{source_text_normalized[:80]}'", flush=True)
            print(f"[BULK_EDIT_CRUD]     БД норм ({len(sample_norm)} симв.): '{sample_norm[:80]}'", flush=True)
        # === /ДЕБАГ ===
        
        for post in published_posts:
            results.append({
                'id': post.id,
                'postType': 'published',
                'projectId': post.projectId,
                'date': post.date,
                'text': post.text,
                'images': post.images,
                'attachments': post.attachments
            })
    
    # === Поиск в отложенных постах (ScheduledPost) ===
    if request.targetPostTypes.scheduled:
        query = db.query(models.ScheduledPost).filter(
            models.ScheduledPost.projectId.in_(request.targetProjectIds),
            models.ScheduledPost.date >= search_from_date
        )
        
        # Применяем SQL-фильтры (только дата — текст сравниваем в Python с нормализацией)
        if request.matchCriteria.byDateTime:
            query = query.filter(models.ScheduledPost.date == source_date)
        
        scheduled_posts_raw = query.all()
        
        # Фильтруем по тексту в Python с нормализацией
        if request.matchCriteria.byText:
            scheduled_posts = [
                p for p in scheduled_posts_raw
                if normalize_text_for_comparison(p.text) == source_text_normalized
            ]
        else:
            scheduled_posts = scheduled_posts_raw
        
        # === ДЕБАГ ===
        print(f"[BULK_EDIT_CRUD] Отложенные (ScheduledPost): {len(scheduled_posts_raw)} до фильтра текста, {len(scheduled_posts)} после", flush=True)
        for sp in scheduled_posts[:3]:
            sp_text = (sp.text or '')[:60]
            print(f"[BULK_EDIT_CRUD]   id={sp.id}, projectId={sp.projectId}, date={sp.date}, text='{sp_text}'", flush=True)
        if not scheduled_posts and scheduled_posts_raw:
            sample = scheduled_posts_raw[0]
            sample_norm = normalize_text_for_comparison(sample.text)
            print(f"[BULK_EDIT_CRUD]   Текст не совпал (нормализованный). Пример:", flush=True)
            print(f"[BULK_EDIT_CRUD]     Исходный норм: '{source_text_normalized[:80]}'", flush=True)
            print(f"[BULK_EDIT_CRUD]     БД норм: '{sample_norm[:80]}'", flush=True)
        # === /ДЕБАГ ===
        
        for post in scheduled_posts:
            results.append({
                'id': post.id,
                'postType': 'scheduled',
                'projectId': post.projectId,
                'date': post.date,
                'text': post.text,
                'images': post.images,
                'attachments': post.attachments
            })
    
    # === Поиск в системных постах (SystemPost) ===
    if request.targetPostTypes.system:
        query = db.query(models.SystemPost).filter(
            models.SystemPost.project_id.in_(request.targetProjectIds),
            models.SystemPost.publication_date >= search_from_date,
            # Исключаем специальные типы постов
            models.SystemPost.post_type == 'regular'
        )
        
        # Применяем SQL-фильтры (только дата — текст сравниваем в Python с нормализацией)
        if request.matchCriteria.byDateTime:
            query = query.filter(models.SystemPost.publication_date == source_date)
        
        system_posts_raw = query.all()
        
        # Фильтруем по тексту в Python с нормализацией
        if request.matchCriteria.byText:
            system_posts = [
                p for p in system_posts_raw
                if normalize_text_for_comparison(p.text) == source_text_normalized
            ]
        else:
            system_posts = system_posts_raw
        
        # === ДЕБАГ ===
        print(f"[BULK_EDIT_CRUD] Системные (SystemPost): {len(system_posts_raw)} до фильтра текста, {len(system_posts)} после", flush=True)
        for sysp in system_posts[:3]:
            sysp_text = (sysp.text or '')[:60]
            print(f"[BULK_EDIT_CRUD]   id={sysp.id}, project_id={sysp.project_id}, date={sysp.publication_date}, text='{sysp_text}'", flush=True)
        if not system_posts and system_posts_raw:
            sample = system_posts_raw[0]
            sample_norm = normalize_text_for_comparison(sample.text)
            print(f"[BULK_EDIT_CRUD]   Текст не совпал (нормализованный). Пример:", flush=True)
            print(f"[BULK_EDIT_CRUD]     Исходный норм ({len(source_text_normalized)} симв.): '{source_text_normalized[:80]}'", flush=True)
            print(f"[BULK_EDIT_CRUD]     БД норм ({len(sample_norm)} симв.): '{sample_norm[:80]}'", flush=True)
        # === /ДЕБАГ ===
        
        for post in system_posts:
            results.append({
                'id': post.id,
                'postType': 'system',
                'projectId': post.project_id,
                'date': post.publication_date,
                'text': post.text,
                'images': post.images,
                'attachments': post.attachments
            })
    
    # === ДЕБАГ: Итого ===
    print(f"[BULK_EDIT_CRUD] ИТОГО: {len(results)} постов найдено, {len(project_names)} проектов", flush=True)
    # === /ДЕБАГ ===
    
    return results, project_names


def update_system_post_bulk(
    db: Session,
    post_id: str,
    changes: schemas.BulkEditChanges
) -> bool:
    """
    Обновляет системный пост с заданными изменениями.
    Возвращает True если успешно.
    """
    db_post = db.query(models.SystemPost).filter(models.SystemPost.id == post_id).first()
    if not db_post:
        return False
    
    if changes.text is not None:
        db_post.text = changes.text
    
    if changes.images is not None:
        db_post.images = json.dumps([img.model_dump() for img in changes.images])
    
    if changes.attachments is not None:
        db_post.attachments = json.dumps([att.model_dump() for att in changes.attachments])
    
    if changes.date is not None:
        db_post.publication_date = changes.date
    
    # Сбрасываем статус на ожидание
    db_post.status = 'pending_publication'
    
    return True


def update_cached_vk_post(
    db: Session,
    post_id: str,
    post_type: str,  # 'published' | 'scheduled'
    changes: schemas.BulkEditChanges
) -> bool:
    """
    Обновляет кешированный VK пост в базе данных.
    Используется после успешного wall.edit.
    """
    if post_type == 'published':
        db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    else:  # scheduled
        db_post = db.query(models.ScheduledPost).filter(models.ScheduledPost.id == post_id).first()
    
    if not db_post:
        return False
    
    if changes.text is not None:
        db_post.text = changes.text
    
    if changes.images is not None:
        db_post.images = json.dumps([img.model_dump() for img in changes.images])
    
    if changes.attachments is not None:
        db_post.attachments = json.dumps([att.model_dump() for att in changes.attachments])
    
    if changes.date is not None:
        db_post.date = changes.date
    
    # Обновляем timestamp
    db_post._lastUpdated = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')
    
    return True
