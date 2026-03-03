"""
Загрузка и синхронизация единого списка историй (unified stories).
Объединяет данные из БД-логов с актуальными данными VK API.

Хаб-модуль: оркестрирует вызовы подмодулей.
"""
from sqlalchemy.orm import Session
from models_library.automations import StoriesAutomationLog

from .retrieval_helpers import extract_story_id_from_log
from .retrieval_unified_vk import _fetch_active_stories_from_vk, _rescue_missing_previews
from .retrieval_unified_healing import (
    _heal_log_preview, _heal_log_story_type,
    _recover_preview_from_log, _recover_preview_from_post
)
from .retrieval_unified_extract import (
    _extract_story_data, _get_date_from_log,
    _extract_stats, _extract_viewers
)
from .retrieval_unified_db import (
    _create_manual_story_log, _determine_activity_status,
    _commit_updates, _update_last_stories_timestamp
)


def get_community_stories(db: Session, project_id: str, user_token: str, refresh: bool = False):
    """
    Deprecated alias для get_unified_stories. Сохранён для обратной совместимости.
    """
    return get_unified_stories(db, project_id, refresh=refresh)


def get_unified_stories(db: Session, project_id: str, refresh: bool = False, include_viewers: bool = False, limit: int = 50, offset: int = 0):
    """
    Возвращает унифицированный список историй из БД-логов.
    При refresh=True — синхронизируется с VK API для обновления статусов и превью.
    
    Args:
        refresh (bool): If True, fetches live data from VK. If False, returns DB cache only.
        include_viewers (bool): If True, includes viewers data in response. Default False to avoid 502 on large projects.
        limit (int): Максимальное количество историй в ответе. 0 = без лимита.
        offset (int): Смещение для пагинации.
    
    Returns:
        { "items": [...], "total": N, "offset": N, "limit": N } dict
    """
    unified_list = []
    
    # Получаем логи из БД
    logs = db.query(StoriesAutomationLog).filter(StoriesAutomationLog.project_id == project_id).all()
    
    # FIX: Отключаем автоматическое expire объектов после commit,
    # чтобы избежать DetachedInstanceError при обращении к атрибутам после других DB-операций
    original_expire_on_commit = db.expire_on_commit
    db.expire_on_commit = False
    
    # Принудительно загружаем все атрибуты, чтобы избежать DetachedInstanceError
    # Это нужно потому что позже мы обращаемся к log.log после других DB-операций
    for log in logs:
        _ = log.id
        _ = log.project_id
        _ = log.vk_post_id
        _ = log.post_link
        _ = log.log  # Критически важно загрузить этот атрибут
        _ = log.created_at
        _ = log.image_url
        _ = log.status
        if hasattr(log, 'is_active'):
            _ = log.is_active
    
    active_stories_map = {}
    group_id = None
    
    # --- SYNC с VK API ---
    if refresh:
        active_stories_map, group_id = _fetch_active_stories_from_vk(db, project_id)

    # Строим карту логов по vk_story_id
    log_map = {}
    for log in logs:
        s_id = extract_story_id_from_log(log.log)
        if s_id:
            log_map[s_id] = log
            
    # Объединяем все известные ID
    all_seen_ids = set(active_stories_map.keys()) | set(log_map.keys())
    
    new_logs_to_add = []
    logs_to_update = []  # Для self-healing
    
    for s_id in all_seen_ids:
        vk_story = active_stories_map.get(s_id)
        log_obj = log_map.get(s_id)
        
        # --- Автосохранение ручных историй в БД ---
        if refresh and vk_story and not log_obj and group_id:
            log_obj = _create_manual_story_log(project_id, group_id, s_id, vk_story)
            new_logs_to_add.append(log_obj)
        
        # Определяем статус активности истории
        is_active = _determine_activity_status(refresh, vk_story, log_obj, logs_to_update)
        
        is_automated = log_obj is not None and (log_obj.vk_post_id is not None and log_obj.vk_post_id != 0)
        
        # Извлекаем данные (дата, тип, превью, ссылка)
        date_ts, type_str, views, preview, link, video_url = _extract_story_data(
            vk_story, log_obj, group_id, s_id
        )
        
        # Self-healing: обновляем превью в БД если есть из VK, но нет в логе
        if vk_story and log_obj and not log_obj.image_url and preview:
            _heal_log_preview(log_obj, preview, logs_to_update)
        
        # Self-healing: сохраняем story_type в JSON-лог если его там ещё нет
        if vk_story and log_obj and type_str:
            _heal_log_story_type(log_obj, type_str, logs_to_update)

        # Дата из лога (если не из VK)
        if log_obj and date_ts == 0:
            date_ts = _get_date_from_log(db, log_obj, project_id)
            
        # Восстановление превью из лога или поста
        if log_obj and not preview:
            preview = _recover_preview_from_log(log_obj)
        if log_obj and not preview:
            preview = _recover_preview_from_post(db, log_obj, project_id, logs_to_update)
        
        # Статистика и зрители
        detailed_stats = None
        stats_updated_at = None
        viewers_data = None
        viewers_updated_at = None
        
        if log_obj:
            detailed_stats, stats_updated_at = _extract_stats(log_obj, is_active, views)
            if include_viewers:
                viewers_data, viewers_updated_at = _extract_viewers(log_obj)
        
        if date_ts == 0:
            continue

        unified_list.append({
            'vk_story_id': s_id,
            'date': date_ts,
            'type': type_str,
            'preview': preview,
            'video_url': video_url,
            'link': link,
            'is_active': is_active,
            'is_automated': is_automated,
            'log_id': log_obj.id if log_obj else None,
            'vk_post_id': log_obj.vk_post_id if log_obj else None,
            'views': views,
            'detailed_stats': detailed_stats,
            'stats_updated_at': stats_updated_at,
            'viewers': viewers_data,
            'viewers_updated_at': viewers_updated_at,
            'stats_finalized': getattr(log_obj, 'stats_finalized', False) if log_obj else False
        })

    # Сортировка и дедупликация
    unified_list.sort(key=lambda x: x['date'], reverse=True)
    unique_unified = list({v['vk_story_id']: v for v in unified_list}.values())
    unique_unified.sort(key=lambda x: x['date'], reverse=True)
    
    # [RESCUE] Восстановление превью для архивных ручных историй
    if refresh and group_id:
        _rescue_missing_previews(group_id, log_map, active_stories_map, logs_to_update)

    # Пакетный коммит обновлений
    _commit_updates(db, logs_to_update, new_logs_to_add)
    
    # Обновляем last_stories_update при refresh
    if refresh:
        _update_last_stories_timestamp(db, project_id)
    
    # Восстанавливаем оригинальное значение expire_on_commit
    db.expire_on_commit = original_expire_on_commit
    
    # Пагинация: возвращаем срез + общее количество
    total = len(unique_unified)
    if limit > 0:
        paginated = unique_unified[offset:offset + limit]
    else:
        paginated = unique_unified
            
    return {'items': paginated, 'total': total, 'offset': offset, 'limit': limit}
