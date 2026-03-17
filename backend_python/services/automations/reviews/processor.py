
from sqlalchemy.orm import Session
from sqlalchemy import func

import crud
import models
import services.automations.reviews.crud as crud_automations
from services import vk_service, global_variable_service
from config import settings

def process_new_participants(db: Session, project_id: str) -> dict:
    """
    Присваивает номера и комментирует новые посты.
    Учитывает лимиты конкурса (finishCondition: count/mixed).
    """
    contest = crud_automations.get_contest_settings(db, project_id)
    if not contest:
        return {"processed": 0, "message": "Настройки не найдены"}
        
    # Получаем проект, чтобы использовать токен сообщества
    project = crud.get_project_by_id(db, project_id)
    if not project:
        return {"processed": 0, "message": "Проект не найден"}

    # Статусы, которые считаются "Активными" в текущем розыгрыше.
    # Исключаем 'winner' и 'used', так как это архивные статусы прошлых раундов.
    active_statuses = ['commented']

    # 1. Получаем текущее количество УЖЕ обработанных участников в ТЕКУЩЕМ раунде
    # Считаем ТОЛЬКО 'commented' — после финализации (commented → used/winner) счётчик сбрасывается для нового раунда.
    current_processed_count = db.query(models.ReviewContestEntry).filter(
        models.ReviewContestEntry.contest_id == contest.id,
        models.ReviewContestEntry.status.in_(active_statuses)
    ).count()

    # 2. Получаем максимальный номер среди АКТИВНЫХ записей текущего раунда.
    # После финализации (commented → used/winner) max_number = 0, и нумерация
    # начинается заново с 1 — каждый цикл розыгрыша имеет свою нумерацию.
    max_number = db.query(func.max(models.ReviewContestEntry.entry_number)).filter(
        models.ReviewContestEntry.contest_id == contest.id,
        models.ReviewContestEntry.status.in_(active_statuses)
    ).scalar() or 0

    # 3. Получаем список новых кандидатов, отсортированных по реальной дате поста VK (старые первыми)
    # Фоллбэк на created_at для записей без post_date (старые данные)
    new_entries = db.query(models.ReviewContestEntry).filter(
        models.ReviewContestEntry.contest_id == contest.id,
        models.ReviewContestEntry.status == 'new'
    ).order_by(
        func.coalesce(models.ReviewContestEntry.post_date, models.ReviewContestEntry.created_at).asc()
    ).all()

    if not new_entries:
        return {"processed": 0, "message": "Нет новых постов для обработки"}

    processed_now = 0
    errors_now = 0
    target_limit = contest.target_count if contest.target_count else 0
    is_limit_active = contest.finish_condition in ['count', 'mixed']
    count_mode = getattr(contest, 'target_count_mode', 'exact') or 'exact'
    
    # Режим minimum — нумеруем ВСЕХ без ограничения (лимит только для проверки при финализации)
    # Режимы exact и maximum — нумеруем до target_limit и останавливаемся
    should_cap = count_mode in ('exact', 'maximum')

    print(f"CONTEST: Processing entries for project {project_id}. Found {len(new_entries)} new. Current max: {max_number}. Limit: {target_limit if is_limit_active else 'None'}. Mode: {count_mode}")

    for entry in new_entries:
        # Проверка лимита:
        # Если условие "по количеству", режим с капом (exact/maximum) и мы уже достигли лимита
        if is_limit_active and should_cap and (current_processed_count + processed_now) >= target_limit:
            print(f"CONTEST: Target limit ({target_limit}) reached (mode={count_mode}). Stopping numbering.")
            break
        
        current_number = max_number + 1
        
        try:
            # Формируем текст комментария (защита от None)
            template = contest.template_comment or '#{number}'
            comment_text = template.replace('{number}', str(current_number))
            
            # Подстановка глобальных переменных
            comment_text = global_variable_service.substitute_global_variables(db, comment_text, project_id)
            
            # Отправляем комментарий в VK
            # ВАЖНО: Используем project.communityToken для ответа от имени сообщества.
            # Если он не задан, сработает fallback на settings.vk_user_token.
            token_to_use = project.communityToken if project.communityToken else settings.vk_user_token
            
            vk_service.create_comment(
                owner_id=entry.vk_owner_id, 
                post_id=entry.vk_post_id, 
                message=comment_text, 
                token=token_to_use
            )
            
            # Обновляем статус в БД
            entry.status = 'commented'
            entry.entry_number = current_number
            
            max_number = current_number # Обновляем локальный макс для следующей итерации
            processed_now += 1
            
            # Коммитим каждый успех, чтобы не потерять прогресс при ошибке следующего
            db.commit() 
            
        except Exception as e:
            print(f"CONTEST: Error commenting post {entry.vk_post_id}: {e}")
            entry.status = 'error'
            entry.log = str(e)
            db.commit()
            errors_now += 1

    return {
        "processed": processed_now,
        "errors": errors_now,
        "limit_reached": is_limit_active and should_cap and (current_processed_count + processed_now) >= target_limit,
        "count_mode": count_mode
    }
