"""
Сервис обогащения VK-профилей для модуля статистики сообщений.

Когда пользователь пишет в сообщество, создаётся MessageStatsUser (счётчики),
но VkProfile (ФИО, фото) может отсутствовать — профиль заполняется только при
синхронизации подписчиков или при открытии чата.

Этот модуль решает проблему:
- Получает список user_id без VkProfile
- Batch-запрашивает VK API users.get (до 1000 за раз)
- Upsert'ит результат в таблицу vk_profiles
"""

import logging
from typing import List, Dict, Any, Optional

from sqlalchemy.orm import Session

from models_library.vk_profiles import VkProfile
from services.vk_api.token_manager import call_vk_api_for_group

logger = logging.getLogger("services.profile_enrichment")

# Поля VK API users.get для обогащения
_PROFILE_FIELDS = "sex,bdate,city,country,photo_100,domain,has_mobile,last_seen,is_closed,can_access_closed,deactivated"

# Максимум ID за один вызов VK API users.get
_VK_BATCH_SIZE = 1000


def _extract_profile_data(vk_user: Dict[str, Any]) -> Dict[str, Any]:
    """Извлекает данные профиля из ответа VK API users.get."""
    city_obj = vk_user.get("city")
    country_obj = vk_user.get("country")
    last_seen_obj = vk_user.get("last_seen")

    return {
        "vk_user_id": vk_user["id"],
        "first_name": vk_user.get("first_name"),
        "last_name": vk_user.get("last_name"),
        "sex": vk_user.get("sex"),
        "photo_url": vk_user.get("photo_100"),
        "domain": vk_user.get("domain"),
        "bdate": vk_user.get("bdate"),
        "city": city_obj.get("title") if isinstance(city_obj, dict) else None,
        "country": country_obj.get("title") if isinstance(country_obj, dict) else None,
        "has_mobile": vk_user.get("has_mobile"),
        "is_closed": vk_user.get("is_closed"),
        "can_access_closed": vk_user.get("can_access_closed"),
        "deactivated": vk_user.get("deactivated"),
        "last_seen": last_seen_obj.get("time") if isinstance(last_seen_obj, dict) else None,
        "platform": last_seen_obj.get("platform") if isinstance(last_seen_obj, dict) else None,
    }


def enrich_missing_profiles(
    db: Session,
    user_ids: List[int],
    community_tokens: List[str],
    group_id_int: int,
    project_id: str,
) -> Dict[int, Dict[str, Any]]:
    """
    Обогащает отсутствующие VkProfile для указанных user_id.
    
    1. Проверяет, какие user_ids не имеют VkProfile (или имеют пустой first_name)
    2. Batch-запрашивает VK API users.get
    3. Upsert'ит в vk_profiles
    4. Возвращает словарь {user_id: {first_name, last_name, photo_url}} для обновления ответа
    
    Args:
        db: Сессия БД
        user_ids: Все user_id из текущей страницы результатов
        community_tokens: Токены сообщества для VK API
        group_id_int: ID группы VK (положительное число)
        project_id: ID проекта (для логирования)
    
    Returns:
        Словарь {vk_user_id: {first_name, last_name, photo_url}} с обогащёнными данными
    """
    if not user_ids or not community_tokens:
        return {}

    # Находим ID без профиля или с пустым first_name
    existing = db.query(
        VkProfile.vk_user_id,
        VkProfile.first_name,
    ).filter(
        VkProfile.vk_user_id.in_(user_ids)
    ).all()

    existing_with_name = {row.vk_user_id for row in existing if row.first_name}
    existing_ids = {row.vk_user_id for row in existing}
    missing_ids = [uid for uid in user_ids if uid not in existing_with_name]

    if not missing_ids:
        return {}

    logger.info(
        f"PROFILE-ENRICH: проект={project_id}, "
        f"всего={len(user_ids)}, без профиля={len(missing_ids)}, "
        f"запрашиваем VK API users.get"
    )

    # Batch-запрос к VK API
    enriched: Dict[int, Dict[str, Any]] = {}

    for i in range(0, len(missing_ids), _VK_BATCH_SIZE):
        batch = missing_ids[i:i + _VK_BATCH_SIZE]
        try:
            vk_result = call_vk_api_for_group(
                method="users.get",
                params={
                    "user_ids": ",".join(str(uid) for uid in batch),
                    "fields": _PROFILE_FIELDS,
                },
                group_id=group_id_int,
                community_tokens=community_tokens,
                project_id=project_id,
            )

            if not isinstance(vk_result, list):
                logger.warning(f"PROFILE-ENRICH: неожиданный ответ VK API: {type(vk_result)}")
                continue

            # Разделяем на новые и обновляемые
            new_profiles = []
            update_profiles = []

            for vk_user in vk_result:
                profile_data = _extract_profile_data(vk_user)
                uid = profile_data["vk_user_id"]

                enriched[uid] = {
                    "first_name": profile_data["first_name"],
                    "last_name": profile_data["last_name"],
                    "photo_url": profile_data["photo_url"],
                }

                if uid not in existing_ids:
                    new_profiles.append(profile_data)
                else:
                    update_profiles.append(profile_data)

            # INSERT новых профилей
            if new_profiles:
                for profile in new_profiles:
                    try:
                        db.add(VkProfile(**profile))
                    except Exception:
                        db.rollback()
                        # При конфликте (concurrent insert) — пропускаем
                        pass
                try:
                    db.flush()
                except Exception as e:
                    db.rollback()
                    logger.warning(f"PROFILE-ENRICH: ошибка вставки профилей: {e}")

            # UPDATE существующих (у которых пустое имя)
            if update_profiles:
                for profile_data in update_profiles:
                    uid = profile_data["vk_user_id"]
                    try:
                        db.query(VkProfile).filter(
                            VkProfile.vk_user_id == uid
                        ).update({
                            VkProfile.first_name: profile_data.get("first_name"),
                            VkProfile.last_name: profile_data.get("last_name"),
                            VkProfile.photo_url: profile_data.get("photo_url"),
                            VkProfile.sex: profile_data.get("sex"),
                            VkProfile.domain: profile_data.get("domain"),
                            VkProfile.bdate: profile_data.get("bdate"),
                            VkProfile.city: profile_data.get("city"),
                            VkProfile.country: profile_data.get("country"),
                            VkProfile.last_seen: profile_data.get("last_seen"),
                            VkProfile.platform: profile_data.get("platform"),
                        })
                    except Exception as e:
                        logger.warning(f"PROFILE-ENRICH: ошибка обновления профиля {uid}: {e}")
                try:
                    db.flush()
                except Exception as e:
                    logger.warning(f"PROFILE-ENRICH: ошибка flush после обновления: {e}")

            try:
                db.commit()
            except Exception:
                db.rollback()

            logger.info(
                f"PROFILE-ENRICH: обогащено {len(vk_result)} профилей "
                f"(новых: {len(new_profiles)}, обновлённых: {len(update_profiles)})"
            )

        except Exception as e:
            logger.warning(f"PROFILE-ENRICH: ошибка VK API users.get: {e}")
            continue

    return enriched
