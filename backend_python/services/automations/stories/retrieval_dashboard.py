"""
Агрегированная статистика дашборда историй.
Один лёгкий SQL-запрос → числовые метрики + демография зрителей.
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_
from models_library.automations import StoriesAutomationLog
from datetime import datetime, timezone, timedelta
import json

from .retrieval_helpers import extract_story_id_from_log


def get_stories_dashboard_stats(db: Session, project_id: str, period_type: str = 'all',
                                 filter_type: str = 'all', custom_start: str = None,
                                 custom_end: str = None) -> dict:
    """
    Рассчитывает агрегированную статистику дашборда прямо из БД.
    Включает числовые метрики (views, clicks, CTR, ER) и демографию зрителей.
    
    Args:
        period_type: all/week/month/quarter/year/custom
        filter_type: all/auto/manual
        custom_start: ISO дата начала (для custom периода)
        custom_end: ISO дата конца (для custom периода)
    """
    # Базовый запрос по проекту
    query = db.query(StoriesAutomationLog).filter(
        StoriesAutomationLog.project_id == project_id
    )
    
    # Фильтр по типу (auto = vk_post_id != 0, manual = vk_post_id == 0 или NULL)
    query = _apply_type_filter(query, filter_type)
    
    # Фильтр по периоду
    query = _apply_period_filter(query, period_type, custom_start, custom_end)
    
    # Загружаем логи, отсортированные хронологически (для графиков)
    logs = query.order_by(StoriesAutomationLog.created_at.asc()).all()
    
    # Агрегируем основную статистику
    result = _aggregate_stats(logs)
    
    # Агрегируем демографию зрителей
    result['demographics'] = _aggregate_demographics(logs)
    
    # Рассчитываем средние/мин/макс метрики по просмотрам и зрителям
    result.update(_calculate_averages(logs, result))
    
    return result


# ============================================================
# Фильтры запросов
# ============================================================

def _apply_type_filter(query, filter_type: str):
    """Применяет фильтр по типу истории (auto/manual)."""
    if filter_type == 'auto':
        query = query.filter(
            StoriesAutomationLog.vk_post_id != None,
            StoriesAutomationLog.vk_post_id > 0
        )
    elif filter_type == 'manual':
        query = query.filter(
            or_(
                StoriesAutomationLog.vk_post_id == None,
                StoriesAutomationLog.vk_post_id <= 0
            )
        )
    return query


def _apply_period_filter(query, period_type: str, custom_start: str = None, custom_end: str = None):
    """Применяет фильтр по временному периоду."""
    now = datetime.now(timezone.utc)
    
    period_days = {
        'week': 7,
        'month': 30,
        'quarter': 90,
        'year': 365,
    }
    
    if period_type in period_days:
        query = query.filter(
            StoriesAutomationLog.created_at >= now - timedelta(days=period_days[period_type])
        )
    elif period_type == 'custom':
        if custom_start:
            try:
                start_dt = datetime.fromisoformat(custom_start.replace('Z', '+00:00'))
                if start_dt.tzinfo is None:
                    start_dt = start_dt.replace(tzinfo=timezone.utc)
                query = query.filter(StoriesAutomationLog.created_at >= start_dt)
            except:
                pass
        if custom_end:
            try:
                end_dt = datetime.fromisoformat(custom_end.replace('Z', '+00:00'))
                if end_dt.tzinfo is None:
                    end_dt = end_dt.replace(tzinfo=timezone.utc)
                end_dt = end_dt.replace(hour=23, minute=59, second=59)
                query = query.filter(StoriesAutomationLog.created_at <= end_dt)
            except:
                pass
    
    return query


# ============================================================
# Агрегация основной статистики
# ============================================================

def _get_count(field) -> int:
    """Хелпер для извлечения числа из stat-поля (может быть int или {count: N})."""
    if not field:
        return 0
    if isinstance(field, (int, float)):
        return int(field)
    if isinstance(field, dict) and 'count' in field:
        return field['count']
    return 0


def _aggregate_stats(logs: list) -> dict:
    """Агрегирует числовую статистику из списка логов с дедупликацией."""
    seen_story_ids = set()
    
    result = {
        'count': 0,
        'views': 0,
        'likes': 0,
        'replies': 0,
        'clicks': 0,
        'shares': 0,
        'subscribers': 0,
        'hides': 0,
        'msg': 0,
        'ctr': 0,
        'er': 0,
        'moneySaved': 0,
        'history': []  # Для спарклайнов: [{views, likes, clicks}, ...]
    }
    
    for log in logs:
        # Дедупликация по vk_story_id
        vk_story_id = extract_story_id_from_log(log.log)
        if vk_story_id:
            if vk_story_id in seen_story_ids:
                continue
            seen_story_ids.add(vk_story_id)
        
        result['count'] += 1
        
        # Агрегируем stats из JSON
        if log.stats:
            try:
                s = json.loads(log.stats)
                views = _get_count(s.get('views'))
                likes = _get_count(s.get('likes'))
                replies = _get_count(s.get('replies'))
                answer = _get_count(s.get('answer'))
                clicks = _get_count(s.get('open_link'))
                shares = _get_count(s.get('shares'))
                subscribers = _get_count(s.get('subscribers'))
                hides = _get_count(s.get('bans'))
                
                result['views'] += views
                result['likes'] += likes
                result['replies'] += replies + answer
                result['clicks'] += clicks
                result['shares'] += shares
                result['subscribers'] += subscribers
                result['hides'] += hides
                result['msg'] += answer
                
                result['history'].append({
                    'views': views,
                    'likes': likes,
                    'clicks': clicks
                })
            except:
                pass
    
    # Расчёт производных метрик
    if result['views'] > 0:
        result['ctr'] = round((result['clicks'] / result['views']) * 100, 2)
        engagements = result['likes'] + result['shares'] + result['replies'] + result['msg']
        result['er'] = round((engagements / result['views']) * 100, 2)
    
    # Экономия бюджета (1000 показов = 150 рублей)
    result['moneySaved'] = int((result['views'] / 1000) * 150)
    
    return result


# ============================================================
# Средние/мин/макс метрики по просмотрам и зрителям
# ============================================================

def _calculate_averages(logs: list, aggregated: dict) -> dict:
    """
    Рассчитывает средние/мин/макс значения просмотров и зрителей на историю.
    Использует ту же дедупликацию по vk_story_id, что и _aggregate_stats.
    """
    seen_story_ids = set()
    per_story_views = []   # просмотры (views) каждой уникальной истории
    per_story_viewers = [] # количество зрителей каждой уникальной истории
    
    for log in logs:
        # Дедупликация по vk_story_id
        vk_story_id = extract_story_id_from_log(log.log)
        if vk_story_id:
            if vk_story_id in seen_story_ids:
                continue
            seen_story_ids.add(vk_story_id)
        
        # Просмотры из stats
        views = 0
        if log.stats:
            try:
                s = json.loads(log.stats)
                views = _get_count(s.get('views'))
            except:
                pass
        per_story_views.append(views)
        
        # Количество зрителей из viewers
        viewer_count = 0
        if log.viewers:
            try:
                viewers_data = json.loads(log.viewers)
                items = viewers_data.get('items') or []
                viewer_count = len(items)
            except (json.JSONDecodeError, TypeError):
                pass
        per_story_viewers.append(viewer_count)
    
    count = aggregated.get('count', 0)
    
    # Средние просмотры
    avg_views = round(sum(per_story_views) / count, 1) if count > 0 else 0
    
    # Средние/мин/макс зрители
    # Для мин/макс берём только истории, у которых есть данные по зрителям (viewer_count > 0)
    viewers_with_data = [v for v in per_story_viewers if v > 0]
    avg_viewers = round(sum(per_story_viewers) / count, 1) if count > 0 else 0
    min_viewers = min(viewers_with_data) if viewers_with_data else 0
    max_viewers = max(viewers_with_data) if viewers_with_data else 0
    
    return {
        'avgViews': avg_views,
        'avgViewers': avg_viewers,
        'minViewers': min_viewers,
        'maxViewers': max_viewers,
    }


# ============================================================
# Агрегация демографии зрителей
# ============================================================

def _aggregate_demographics(logs: list) -> dict:
    """
    Агрегирует демографию уникальных зрителей из JSON-поля viewers каждого лога.
    Возвращает: { uniqueCount, gender, membership, platform, topCities, ageGroups }.
    """
    all_viewers = {}  # user_id → True (дедупликация)
    gender_count = {'male': 0, 'female': 0, 'unknown': 0}
    membership_count = {'members': 0, 'viral': 0}
    platform_count = {'android': 0, 'iphone': 0, 'ipad': 0, 'web': 0, 'other': 0}
    city_count = {}  # city_name → count
    age_groups = {'13-17': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0}
    current_year = datetime.now().year
    
    for log in logs:
        if not log.viewers:
            continue
        try:
            viewers_data = json.loads(log.viewers)
            items = viewers_data.get('items') or []
            for viewer in items:
                uid = viewer.get('user_id')
                if not uid or uid in all_viewers:
                    continue
                all_viewers[uid] = True
                
                # Подписка
                is_member = viewer.get('is_member')
                if is_member is True:
                    membership_count['members'] += 1
                elif is_member is False:
                    membership_count['viral'] += 1
                
                user = viewer.get('user') or {}
                
                # Пол
                sex = user.get('sex')
                if sex == 2:
                    gender_count['male'] += 1
                elif sex == 1:
                    gender_count['female'] += 1
                else:
                    gender_count['unknown'] += 1
                
                # Город
                city = user.get('city')
                if city:
                    city_count[city] = city_count.get(city, 0) + 1
                
                # Платформа
                platform = user.get('platform')
                if platform == 4:
                    platform_count['android'] += 1
                elif platform == 2:
                    platform_count['iphone'] += 1
                elif platform == 3:
                    platform_count['ipad'] += 1
                elif platform == 7:
                    platform_count['web'] += 1
                elif platform:
                    platform_count['other'] += 1
                
                # Возраст из bdate (формат: "день.месяц.год")
                bdate = user.get('bdate', '')
                if bdate:
                    parts = bdate.split('.')
                    if len(parts) == 3:
                        try:
                            birth_year = int(parts[2])
                            age = current_year - birth_year
                            if 13 <= age <= 17:
                                age_groups['13-17'] += 1
                            elif 18 <= age <= 24:
                                age_groups['18-24'] += 1
                            elif 25 <= age <= 34:
                                age_groups['25-34'] += 1
                            elif 35 <= age <= 44:
                                age_groups['35-44'] += 1
                            elif age >= 45:
                                age_groups['45+'] += 1
                        except (ValueError, TypeError):
                            pass
        except (json.JSONDecodeError, TypeError):
            continue
    
    # Топ-5 городов, отсортированных по количеству
    top_cities = sorted(city_count.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        'uniqueCount': len(all_viewers),
        'gender': gender_count,
        'membership': membership_count,
        'platform': platform_count,
        'topCities': top_cities,
        'ageGroups': age_groups,
    }
