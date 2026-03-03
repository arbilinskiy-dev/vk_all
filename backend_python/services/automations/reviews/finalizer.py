
from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timezone, timedelta
import random
import json
import time

import crud
import models
import services.automations.reviews.crud as crud_automations
from services import vk_service, global_variable_service
# Импортируем низкоуровневый клиент для прямого вызова без ротации
from services.vk_api.api_client import call_vk_api as raw_vk_call
from services.vk_api.upload import upload_wall_photo
from config import settings
# Импортируем сервис получения постов для обновления кеша
from services import post_retrieval_service
# Импортируем генератор изображения-доказательства
from utils.random_proof_image import create_random_proof_image
# === PERSISTENT LOGGING ===
# Файловые логи, сохраняющиеся на Docker volume (переживают перезапуск контейнера)
from utils.persistent_logger import contest_log, contest_log_separator
# Фабрика сессий для изолированных операций (refresh_published_posts)
from database import _session_factory

def finalize_contest(db: Session, project_id: str) -> dict:
    """
    Подводит итоги конкурса: выбирает победителя, отправляет приз, публикует пост.
    Возвращает dict с результатом. Если участников мало для условий 'mixed'/'count',
    возвращает {skipped: True}, не выбирая победителя.
    
    PERSISTENT LOGGING: Все критические шаги пишутся в файл на Docker volume.
    Логи сохраняются при перезапуске контейнера: /app/data/contest_logs/
    """
    finalize_start = time.time()
    contest_log_separator(project_id, "FINALIZATION START")
    
    contest = crud_automations.get_contest_settings(db, project_id)
    if not contest:
        contest_log(project_id, "ABORT", details="Contest settings not found", level="ERROR")
        raise HTTPException(404, "Contest settings not found")
        
    project = crud.get_project_by_id(db, project_id)
    if not project:
        contest_log(project_id, "ABORT", details="Project not found", level="ERROR")
        raise HTTPException(404, "Project not found")

    contest_log(project_id, "SETTINGS_LOADED", data={
        "contest_id": contest.id,
        "use_proof_image": contest.use_proof_image,
        "finish_condition": contest.finish_condition,
        "target_count": contest.target_count,
        "auto_blacklist": contest.auto_blacklist,
        "project_name": project.name,
    })

    # 1. Получаем подходящих участников (статус 'commented')
    # Используем with_for_update() для защиты от race condition 
    # (ручной и автоматический запуск одновременно)
    all_participants = db.query(models.ReviewContestEntry).filter(
        models.ReviewContestEntry.contest_id == contest.id,
        models.ReviewContestEntry.status == 'commented'
    ).with_for_update().all()
    
    current_count = len(all_participants)
    target = contest.target_count or 0

    contest_log(project_id, "PARTICIPANTS_LOADED", data={
        "count": current_count, "target": target, "condition": contest.finish_condition
    })

    # 2. Проверка условий завершения
    if contest.finish_condition == 'mixed':
        if current_count < target:
            msg = f"Недостаточно постов для подведения итогов ({current_count} из {target}). Конкурс переносится на следующий цикл."
            contest_log(project_id, "SKIPPED", details=msg)
            return {"success": True, "skipped": True, "message": msg, "winner_name": None, "post_link": None}
            
    elif contest.finish_condition == 'count':
        if current_count < target:
            msg = f"Целевое количество постов не достигнуто ({current_count} из {target}). Ждем новых отзывов."
            contest_log(project_id, "SKIPPED", details=msg)
            return {"success": True, "skipped": True, "message": msg, "winner_name": None, "post_link": None}
    
    if current_count == 0:
        msg = "Нет постов (0 принятых отзывов). Розыгрыш не состоялся."
        contest_log(project_id, "SKIPPED", details=msg)
        return {"success": True, "skipped": True, "message": msg, "winner_name": None, "post_link": None}

    # --- ФИЛЬТРАЦИЯ ПО ЧЕРНОМУ СПИСКУ ---
    expired_count = crud_automations.cleanup_expired_blacklist(db, contest.id)
    if expired_count > 0:
        contest_log(project_id, "BLACKLIST_CLEANUP", details=f"Removed {expired_count} expired entries")
        
    blacklisted_ids = set(crud_automations.get_active_blacklist_user_ids(db, contest.id))
    valid_participants = [p for p in all_participants if p.user_vk_id not in blacklisted_ids]
    
    contest_log(project_id, "BLACKLIST_FILTER", data={
        "total": len(all_participants),
        "blocked": len(all_participants) - len(valid_participants),
        "valid": len(valid_participants),
        "blocked_ids": list(blacklisted_ids) if blacklisted_ids else []
    })
    
    if not valid_participants:
         msg = f"Все авторы постов ({len(all_participants)}) находятся в черном списке. Нет валидных кандидатов для победы."
         contest_log(project_id, "SKIPPED", details=msg, level="WARNING")
         return {"success": True, "skipped": True, "message": msg, "winner_name": None, "post_link": None}

    # 3. Проверка промокодов ДО выбора победителя
    promos = crud_automations.get_promocodes(db, project_id)
    promo = next((p for p in promos if not p.is_issued), None)
    
    if not promo:
        contest_log(project_id, "NO_PROMOS", details="Промокоды закончились", level="ERROR")
        raise HTTPException(400, "Ошибка: В базе закончились свободные промокоды. Розыгрыш не может быть проведен.")

    # 4. Выбор поста-победителя (из отфильтрованного списка)
    winner = random.choice(valid_participants)
    contest_log(project_id, "WINNER_SELECTED", data={
        "winner_vk_id": winner.user_vk_id,
        "winner_name": winner.user_name,
        "entry_number": winner.entry_number,
        "post_link": winner.post_link,
        "promo_code": promo.code
    })

    # 5. Отправка сообщения (ЛС или Комментарий)
    token_to_use = project.communityToken
    if not token_to_use:
        contest_log(project_id, "NO_TOKEN", details="Нет токена сообщества", level="ERROR")
        raise HTTPException(400, "Ошибка: Не настроен токен сообщества. Отправка сообщений невозможна.")
        
    log_msg = []
    
    dm_template = contest.template_dm or '{promo_code}'
    dm_text = dm_template\
        .replace('{promo_code}', promo.code)\
        .replace('{description}', promo.description or '')\
        .replace('{user_name}', winner.user_name)
    
    dm_text = global_variable_service.substitute_global_variables(db, dm_text, project_id)

    delivery_status = 'sent'
    error_details = None

    try:
        raw_vk_call('messages.send', {
            'user_id': winner.user_vk_id,
            'message': dm_text,
            'random_id': int(datetime.now().timestamp() * 1000000),
            'access_token': token_to_use
        })
        log_msg.append("DM sent")
        contest_log(project_id, "DM_SENT", details=f"ЛС отправлено пользователю {winner.user_vk_id}")
    except Exception as e:
        delivery_status = 'error'
        error_details = str(e)
        log_msg.append(f"DM failed: {e}")
        contest_log(project_id, "DM_FAILED", error=e, level="ERROR")
        
        # Fallback: Комментарий под постом победителя
        try:
            err_template = contest.template_error_comment or '{user_name}, напишите нам в сообщения сообщества!'
            err_comment = err_template.replace('{user_name}', f"[id{winner.user_vk_id}|{winner.user_name}]")
            err_comment = global_variable_service.substitute_global_variables(db, err_comment, project_id)
            
            raw_vk_call('wall.createComment', {
                'owner_id': winner.vk_owner_id,
                'post_id': winner.vk_post_id,
                'message': err_comment,
                'from_group': 1,
                'access_token': token_to_use
            })
            log_msg.append("Fallback comment posted")
            contest_log(project_id, "FALLBACK_COMMENT_SENT")
        except Exception as e2:
            log_msg.append(f"Error comment failed: {e2}")
            contest_log(project_id, "FALLBACK_COMMENT_FAILED", error=e2, level="ERROR")
            
    # СОХРАНЕНИЕ В ЖУРНАЛ ДОСТАВКИ
    # FIX: используем auto_commit=False, чтобы НЕ делать ранний commit.
    # Весь прогресс закоммитится ОДНИМ db.commit() в конце для атомарности.
    delivery_log = crud_automations.create_delivery_log(db, {
        "contest_id": contest.id,
        "user_vk_id": winner.user_vk_id,
        "user_name": winner.user_name,
        "promo_code": promo.code,
        "prize_description": promo.description,
        "message_text": dm_text,
        "status": delivery_status,
        "error_details": error_details,
        "winner_post_link": winner.post_link
    }, auto_commit=False)
    
    contest_log(project_id, "DELIVERY_LOG_CREATED", details=f"Log ID: {delivery_log.id}, status: {delivery_status}")

    results_link = None

    # 6. Публикация поста с итогами на стене
    numeric_group_id = vk_service.resolve_vk_group_id(project.vkProjectId, settings.vk_user_token)
    
    try:
        winners_list_str = f"1. [id{winner.user_vk_id}|{winner.user_name}] (№{winner.entry_number})"
        
        winner_template = contest.template_winner_post or 'Победитель: {user_name}'
        post_text = winner_template\
            .replace('{winners_list}', winners_list_str)\
            .replace('{user_name}', winner.user_name)\
            .replace('{user_id}', str(winner.user_vk_id))\
            .replace('{post_link}', winner.post_link or "")\
            .replace('{promo_code}', promo.code)\
            .replace('{description}', promo.description or '')
        
        post_text = global_variable_service.substitute_global_variables(db, post_text, project_id)
        
        images_data = json.loads(contest.winner_post_images) if contest.winner_post_images else []
        should_attach_user_media = (not contest.use_proof_image) or (contest.attach_additional_media)
        
        if should_attach_user_media:
            attachments_list = [img['id'] for img in images_data]
        else:
            attachments_list = []
        
        # --- ГЕНЕРАЦИЯ ИЗОБРАЖЕНИЯ-ДОКАЗАТЕЛЬСТВА ---
        # FIX BUG #1: Детальное логирование с таймингами + traceback при ошибке.
        # Ранее: ошибка проглатывалась молча, теперь — полный traceback в persistent файл.
        if contest.use_proof_image:
            proof_start = time.time()
            contest_log(project_id, "PROOF_IMAGE_START", data={
                "winner_number": winner.entry_number,
                "participants_count": len(valid_participants),
                "winner_vk_id": winner.user_vk_id
            })
            
            try:
                participants_ids = [p.user_vk_id for p in valid_participants]
                
                # Шаг 1: Генерация PIL-изображения
                gen_start = time.time()
                proof_image_bytes = create_random_proof_image(
                    winner_number=winner.entry_number,
                    winner_name=winner.user_name,
                    winner_vk_id=winner.user_vk_id,
                    total_participants=len(valid_participants),
                    participants_vk_ids=participants_ids,
                    group_name=project.name,
                    contest_name="Конкурс отзывов",
                    access_token=settings.vk_user_token
                )
                gen_elapsed = time.time() - gen_start
                
                contest_log(project_id, "PROOF_IMAGE_GENERATED", data={
                    "elapsed_sec": round(gen_elapsed, 2),
                    "image_size_kb": round(len(proof_image_bytes) / 1024, 1) if proof_image_bytes else 0,
                    "image_is_none": proof_image_bytes is None
                })
                
                # Шаг 2: Загрузка в VK
                if proof_image_bytes:
                    upload_start = time.time()
                    uploaded_photo = upload_wall_photo(
                        group_id=numeric_group_id,
                        file_bytes=proof_image_bytes,
                        file_name="proof_image.jpg",
                        user_token=settings.vk_user_token
                    )
                    upload_elapsed = time.time() - upload_start
                    
                    if uploaded_photo:
                        photo_id = f"photo{uploaded_photo['owner_id']}_{uploaded_photo['id']}"
                        attachments_list.insert(0, photo_id)
                        log_msg.append("Proof image generated")
                        
                        contest_log(project_id, "PROOF_IMAGE_UPLOADED", data={
                            "photo_id": photo_id,
                            "upload_elapsed_sec": round(upload_elapsed, 2),
                            "total_elapsed_sec": round(time.time() - proof_start, 2)
                        })
                    else:
                        contest_log(project_id, "PROOF_IMAGE_UPLOAD_RETURNED_NONE", 
                                    details="upload_wall_photo вернул None — фото не загрузилось в VK",
                                    level="ERROR")
                        log_msg.append("Proof image upload returned None")
                else:
                    contest_log(project_id, "PROOF_IMAGE_GENERATION_RETURNED_NONE",
                                details="create_random_proof_image вернул None — PIL не сгенерировал изображение",
                                level="ERROR")
                    log_msg.append("Proof image generation returned None")
                        
            except Exception as proof_err:
                proof_elapsed = time.time() - proof_start
                # FIX: Полный traceback в persistent файл (не теряется при рестарте контейнера)
                contest_log(project_id, "PROOF_IMAGE_FAILED", 
                            error=proof_err,
                            data={"elapsed_sec": round(proof_elapsed, 2)},
                            level="CRITICAL")
                log_msg.append(f"Proof image failed: {proof_err}")
                # Не прерываем публикацию, продолжаем без изображения
        
        attachments_str = ",".join(attachments_list)
        
        contest_log(project_id, "WALL_POST_START", data={
            "attachments": attachments_str,
            "has_proof_image": any("photo" in a for a in attachments_list),
            "attachments_count": len(attachments_list)
        })
        
        published_post = vk_service.publish_with_fallback({
            'owner_id': -numeric_group_id,
            'message': post_text,
            'attachments': attachments_str,
            'from_group': 1
        }, method='wall.post', preferred_token=token_to_use)
        
        log_msg.append("Winner post published")
        
        if published_post and 'post_id' in published_post:
            results_link = f"https://vk.com/wall-{numeric_group_id}_{published_post['post_id']}"
            delivery_log.results_post_link = results_link
            contest_log(project_id, "WALL_POST_PUBLISHED", data={
                "post_id": published_post['post_id'],
                "results_link": results_link,
                "attachments_sent": attachments_str
            })
        else:
            contest_log(project_id, "WALL_POST_NO_ID", 
                        details=f"publish_with_fallback вернул: {published_post}",
                        level="WARNING")

        # FIX BUG #2: Обновление кеша опубликованных постов в ОТДЕЛЬНОЙ сессии БД.
        # Ранее: refresh_published_posts использовала ту же сессию (db), и могла сломать её
        # промежуточными commit/rollback, что мешало финальному db.commit().
        # Теперь: отдельная сессия — если refresh упадёт, основная сессия не пострадает.
        try:
            cache_start = time.time()
            cache_db = _session_factory()
            try:
                post_retrieval_service.refresh_published_posts(cache_db, project_id, settings.vk_user_token)
                log_msg.append("Cache updated")
                contest_log(project_id, "CACHE_UPDATED", data={
                    "elapsed_sec": round(time.time() - cache_start, 2)
                })
            except Exception as cache_err:
                contest_log(project_id, "CACHE_UPDATE_FAILED", error=cache_err, level="WARNING")
            finally:
                cache_db.close()
        except Exception as session_err:
            contest_log(project_id, "CACHE_SESSION_FAILED", error=session_err, level="WARNING")
            
    except Exception as e:
        log_msg.append(f"Winner post failed: {e}")
        contest_log(project_id, "WALL_POST_FAILED", error=e, level="CRITICAL")

    # 7. Авто-бан победителя (Если включено)
    if contest.auto_blacklist:
        try:
            duration_days = contest.auto_blacklist_duration or 7
            ban_until = datetime.now(timezone.utc) + timedelta(days=duration_days)
            ban_until = ban_until.replace(hour=23, minute=59, second=59)
            
            user_data = [{
                'id': winner.user_vk_id,
                'name': winner.user_name,
                'screen_name': None
            }]
            
            crud_automations.add_to_blacklist(db, contest.id, user_data, ban_until)
            log_msg.append(f"User auto-banned for {duration_days} days")
            contest_log(project_id, "AUTO_BAN", data={
                "user_vk_id": winner.user_vk_id, "duration_days": duration_days,
                "ban_until": str(ban_until)
            })
        except Exception as e:
            log_msg.append(f"Auto-ban failed: {e}")
            contest_log(project_id, "AUTO_BAN_FAILED", error=e, level="ERROR")

    # 8. Обновление БД — ЕДИНЫЙ АТОМАРНЫЙ КОММИТ
    # FIX BUG #3: Все изменения статусов коммитятся одним db.commit().
    # Ранее: create_delivery_log делал ранний commit, потом refresh_published_posts —
    # ещё один commit на той же сессии. Если что-то падало между ними, данные
    # оказывались в inconsistent-состоянии (delivery_log есть, но winner/promo не обновлены).
    winner.status = 'winner'
    winner.log = "; ".join(log_msg)
    
    promo.is_issued = True
    promo.issued_at = datetime.now(timezone.utc)
    promo.issued_to_user_id = winner.user_vk_id
    promo.issued_to_user_name = winner.user_name
    
    other_valid = [p for p in valid_participants if p.id != winner.id]
    for p in other_valid:
        p.status = 'used'
    
    try:
        db.commit()
        finalize_elapsed = time.time() - finalize_start
        contest_log(project_id, "DB_COMMIT_SUCCESS", data={
            "winner_status": "winner",
            "used_count": len(other_valid),
            "promo_issued": promo.code,
            "results_link": results_link,
            "total_elapsed_sec": round(finalize_elapsed, 2)
        })
    except Exception as commit_err:
        db.rollback()
        contest_log(project_id, "DB_COMMIT_FAILED", error=commit_err, level="CRITICAL", data={
            "winner_vk_id": winner.user_vk_id,
            "promo_code": promo.code,
            "results_link": results_link
        })
        raise

    # 9. Обновляем метаданные списков (счетчик победителей)
    winners_count = db.query(models.ReviewContestEntry).filter(
        models.ReviewContestEntry.contest_id == contest.id,
        models.ReviewContestEntry.status == 'winner'
    ).count()
    
    crud.update_list_meta(db, project_id, {
        "reviews_winners_count": winners_count
    })
    
    return {
        "success": True, 
        "winner_name": winner.user_name, 
        "post_link": results_link,
        "log": log_msg, 
        "skipped": False
    }

def retry_delivery(db: Session, log_id: str) -> dict:
    """
    Повторная попытка отправки сообщения по ID лога.
    """
    log = crud_automations.get_delivery_log_by_id(db, log_id)
    if not log:
        raise HTTPException(404, "Log entry not found")
        
    if log.status != 'error':
        raise HTTPException(400, "Retry is available only for failed deliveries.")
        
    contest = crud_automations.get_contest_settings_by_id(db, log.contest_id)
    if not contest:
        raise HTTPException(404, "Contest not found")
        
    project = crud.get_project_by_id(db, contest.project_id)
    if not project or not project.communityToken:
        raise HTTPException(400, "Community token missing.")

    try:
        # Для повтора используем уже сохраненный текст сообщения из лога (в нем уже подставлены переменные)
        raw_vk_call('messages.send', {
            'user_id': log.user_vk_id,
            'message': log.message_text,
            'random_id': int(datetime.now().timestamp() * 1000000),
            'access_token': project.communityToken
        })
        
        # Обновляем статус при успехе
        log.status = 'sent'
        log.error_details = None
        db.commit()
        return {"success": True}
        
    except Exception as e:
        print(f"CONTEST: Retry delivery failed: {e}")
        # Обновляем ошибку
        log.error_details = str(e)
        db.commit()
        raise HTTPException(500, f"Retry failed: {str(e)}")

def retry_delivery_all(db: Session, project_id: str) -> dict:
    """
    Массовая повторная отправка сообщений для всех логов с ошибкой.
    """
    contest = crud_automations.get_contest_settings(db, project_id)
    if not contest:
        raise HTTPException(404, "Contest settings not found")
        
    project = crud.get_project_by_id(db, project_id)
    if not project or not project.communityToken:
        raise HTTPException(400, "Community token missing.")
        
    failed_logs = db.query(models.ReviewContestDeliveryLog).filter(
        models.ReviewContestDeliveryLog.contest_id == contest.id,
        models.ReviewContestDeliveryLog.status == 'error'
    ).all()
    
    if not failed_logs:
        return {"success": True, "processed": 0, "errors": 0}
    
    processed = 0
    errors = 0
    
    for log in failed_logs:
        try:
            raw_vk_call('messages.send', {
                'user_id': log.user_vk_id,
                'message': log.message_text,
                'random_id': int(datetime.now().timestamp() * 1000000),
                'access_token': project.communityToken
            })
            
            log.status = 'sent'
            log.error_details = None
            processed += 1
        except Exception as e:
            print(f"CONTEST: Retry delivery failed for log {log.id}: {e}")
            log.error_details = str(e)
            errors += 1
            
    db.commit()
    return {"success": True, "processed": processed, "errors": errors}
