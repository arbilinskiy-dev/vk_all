"""
Сервис обогащения профилей-заглушек (VkProfile без имени/фото).

Запускается ежедневно в 03:00 MSK через APScheduler.
Находит VkProfile с пустым first_name (заглушки, созданные из callback),
вызывает VK API users.get батчами по 1000 и заполняет данные.

Используемый токен: VK_SERVICE_KEY (сервисный ключ приложения).
"""

import logging
import time

from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import SessionLocal, redis_client
from config import settings
from models_library.vk_profiles import VkProfile

logger = logging.getLogger("services.profile_enrichment")

# ── Константы ──────────────────────────────────────────────────────

# VK API users.get принимает до 1000 user_ids за один запрос
VK_BATCH_SIZE = 1000

# Задержка между батчами (секунды) — не перегружаем VK API
BATCH_DELAY = 0.35

# Поля, которые запрашиваем у VK API
VK_FIELDS = "sex,photo_100,domain,bdate,city,country,has_mobile,last_seen"

# Redis lock — предотвращение запуска на нескольких воркерах одновременно
LOCK_KEY = "vk_planner:profile_enrichment_lock"
LOCK_TTL = 3600  # 1 час — максимальное время работы задачи


# ── Основная функция ──────────────────────────────────────────────

def enrich_stub_profiles() -> dict:
    """
    Обогащает VkProfile-заглушки данными из VK API.
    
    Заглушка — запись с first_name IS NULL (создана callback-хендлером
    при message_new / message_allow без реального профиля).
    
    Returns:
        dict с результатами: total_stubs, enriched, failed, skipped
    """
    service_key = settings.vk_service_key
    if not service_key:
        logger.warning(
            "PROFILE ENRICHMENT: VK_SERVICE_KEY не задан в .env — "
            "обогащение профилей невозможно. Пропускаем."
        )
        return {"error": "VK_SERVICE_KEY not configured"}
    
    # Redis-lock: не запускаем на нескольких воркерах одновременно
    if redis_client:
        try:
            acquired = redis_client.set(LOCK_KEY, "1", nx=True, ex=LOCK_TTL)
            if not acquired:
                logger.info("PROFILE ENRICHMENT: Задача уже запущена другим воркером. Пропускаем.")
                return {"skipped": True, "reason": "locked_by_another_worker"}
        except Exception as e:
            logger.warning(f"PROFILE ENRICHMENT: Не удалось получить Redis-lock: {e}")
    
    db: Session = SessionLocal()
    stats = {"total_stubs": 0, "enriched": 0, "failed": 0, "errors": []}
    
    try:
        # Находим все заглушки: first_name IS NULL
        stub_profiles = db.query(VkProfile).filter(
            or_(VkProfile.first_name == None, VkProfile.first_name == "")  # noqa: E711
        ).all()
        
        stats["total_stubs"] = len(stub_profiles)
        
        if not stub_profiles:
            logger.info("PROFILE ENRICHMENT: Заглушек не найдено. Всё актуально.")
            return stats
        
        logger.info(
            f"PROFILE ENRICHMENT: Найдено {len(stub_profiles)} профилей-заглушек. "
            f"Обогащаем батчами по {VK_BATCH_SIZE}..."
        )
        
        # Разбиваем на батчи по 1000
        for i in range(0, len(stub_profiles), VK_BATCH_SIZE):
            batch = stub_profiles[i:i + VK_BATCH_SIZE]
            batch_ids = [str(p.vk_user_id) for p in batch]
            
            try:
                vk_data = _fetch_users_from_vk(service_key, batch_ids)
                _apply_vk_data(db, batch, vk_data, stats)
            except Exception as e:
                error_msg = f"Ошибка батча {i // VK_BATCH_SIZE + 1}: {e}"
                logger.error(f"PROFILE ENRICHMENT: {error_msg}")
                stats["errors"].append(error_msg)
            
            # Задержка между батчами
            if i + VK_BATCH_SIZE < len(stub_profiles):
                time.sleep(BATCH_DELAY)
        
        logger.info(
            f"PROFILE ENRICHMENT: Завершено. "
            f"Заглушек: {stats['total_stubs']}, обогащено: {stats['enriched']}, "
            f"ошибок: {stats['failed']}"
        )
    except Exception as e:
        logger.error(f"PROFILE ENRICHMENT: Критическая ошибка: {e}")
        stats["errors"].append(str(e))
    finally:
        db.close()
        # Снимаем Redis-lock
        if redis_client:
            try:
                redis_client.delete(LOCK_KEY)
            except Exception:
                pass
    
    return stats


# ── VK API вызов ──────────────────────────────────────────────────

def _fetch_users_from_vk(service_key: str, user_ids: list[str]) -> dict[int, dict]:
    """
    Вызывает VK API users.get с сервисным ключом.
    
    Args:
        service_key: VK_SERVICE_KEY
        user_ids: Список строковых VK user_id (до 1000)
    
    Returns:
        dict {vk_user_id: {first_name, last_name, ...}}
    """
    import requests
    
    response = requests.post(
        "https://api.vk.com/method/users.get",
        data={
            "user_ids": ",".join(user_ids),
            "fields": VK_FIELDS,
            "access_token": service_key,
            "v": "5.199",
            # ОБЯЗАТЕЛЬНО lang=ru для сервисного ключа!
            # Без этого VK API возвращает имена и города транслитом на латинице
            # (Василий → Vasily, Новомосковск → Novomoskovsk).
            "lang": "ru",
        },
        timeout=30,
    )
    
    data = response.json()
    
    if "error" in data:
        error_code = data["error"].get("error_code", "?")
        error_msg = data["error"].get("error_msg", "unknown")
        raise RuntimeError(f"VK API error {error_code}: {error_msg}")
    
    result = {}
    for user in data.get("response", []):
        uid = user.get("id")
        if uid:
            result[uid] = user
    
    return result


# ── Применение данных к БД ────────────────────────────────────────

def _apply_vk_data(db: Session, batch: list[VkProfile], vk_data: dict[int, dict], stats: dict) -> None:
    """
    Обновляет VkProfile из данных VK API.
    
    Args:
        db: SQLAlchemy Session
        batch: Список VkProfile-объектов (заглушек)
        vk_data: Данные от VK API {vk_user_id: {...}}
        stats: Словарь статистики (мутируется)
    """
    for profile in batch:
        user = vk_data.get(profile.vk_user_id)
        
        if not user:
            # Пользователь не найден (удалён/заблокирован) — помечаем как deactivated
            profile.deactivated = profile.deactivated or "deleted"
            stats["failed"] += 1
            continue
        
        try:
            profile.first_name = user.get("first_name")
            profile.last_name = user.get("last_name")
            profile.sex = user.get("sex")
            profile.photo_url = user.get("photo_100")
            profile.domain = user.get("domain") or user.get("screen_name")
            profile.bdate = user.get("bdate")
            profile.is_closed = user.get("is_closed", False)
            profile.can_access_closed = user.get("can_access_closed")
            profile.deactivated = user.get("deactivated")
            profile.has_mobile = bool(user.get("has_mobile"))
            
            # Город/страна — VK возвращает объект {id: ..., title: "..."}
            city = user.get("city")
            if city and isinstance(city, dict):
                profile.city = city.get("title")
            
            country = user.get("country")
            if country and isinstance(country, dict):
                profile.country = country.get("title")
            
            # Онлайн-статус
            last_seen = user.get("last_seen")
            if last_seen and isinstance(last_seen, dict):
                profile.last_seen = last_seen.get("time")
                profile.platform = last_seen.get("platform")
            
            stats["enriched"] += 1
        except Exception as e:
            logger.warning(
                f"PROFILE ENRICHMENT: Ошибка обновления профиля "
                f"user={profile.vk_user_id}: {e}"
            )
            stats["failed"] += 1
    
    try:
        db.commit()
    except Exception as e:
        logger.error(f"PROFILE ENRICHMENT: Ошибка commit: {e}")
        db.rollback()
        stats["failed"] += len(batch)
