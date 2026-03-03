
from sqlalchemy.orm import Session
from typing import Dict, Optional

# Импорт новых модулей
from .stats.utils import get_model_by_list_type, get_resolver
from .stats.core import get_core_counts
from .stats.demographics import get_gender_stats, get_geo_stats, get_age_and_bdate_stats
from .stats.technical import get_platform_stats, get_online_stats
from .stats.mailing import get_mailing_specific_stats

def get_user_stats(
    db: Session, 
    project_id: str, 
    list_type: str,
    period: str = 'all',
    group_by: str = 'month',
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    filter_can_write: str = 'all'
) -> Dict:
    """
    Фасад для агрегации статистики по пользователям.
    Собирает данные из модульных функций.
    """
    
    # 1. Выбор модели (кортеж: query_model, profile_model, needs_join)
    model, pm, needs_join = get_model_by_list_type(list_type)
    # Полный resolver для type_filter и aggregate_by_user
    r = get_resolver(list_type)
    
    # 2. Базовые счетчики (Total/Active/Banned/Deleted)
    core_stats = get_core_counts(db, model, pm, project_id, needs_join, r=r)
    
    # Инициализация структуры ответа
    stats = {
        **core_stats,
        "gender_stats": {"male": 0, "female": 0, "unknown": 0},
        "online_stats": {
            "today": 0, "3_days": 0, "week": 0, 
            "month_plus": 0, "3_months_plus": 0, "6_months_plus": 0, "year_plus": 0, 
            "unknown": 0
        },
        "geo_stats": {},
        "bdate_stats": {str(i): 0 for i in range(1, 14)},
        "platform_stats": {},
        "age_stats": {
            "u16": 0, "16-20": 0, "20-25": 0, "25-30": 0, "30-35": 0, "35-40": 0, "40-45": 0, "45p": 0, "unknown": 0
        },
        "last_contact_stats": None,
        "lifetime_stats": None,
        "mailing_chart_data": [],
        "mailing_stats": None
    }

    if stats["total_users"] == 0:
        return stats

    # 3. Демография
    stats["gender_stats"] = get_gender_stats(db, model, pm, project_id, needs_join, r=r)
    stats["geo_stats"] = get_geo_stats(db, model, pm, project_id, needs_join, r=r)
    
    age_data = get_age_and_bdate_stats(db, model, pm, project_id, needs_join, r=r)
    stats["bdate_stats"] = age_data["bdate_stats"]
    stats["age_stats"] = age_data["age_stats"]

    # 4. Технические данные
    stats["platform_stats"] = get_platform_stats(db, model, pm, project_id, needs_join, r=r)
    stats["online_stats"] = get_online_stats(db, model, pm, project_id, needs_join, r=r)

    # 5. Специфика Рассылки
    if list_type == 'mailing':
        mailing_data = get_mailing_specific_stats(
            db, model, pm, project_id, stats["total_users"],
            period, group_by, date_from, date_to, filter_can_write, needs_join
        )
        stats.update(mailing_data)

    return stats
