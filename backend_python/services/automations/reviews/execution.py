
from sqlalchemy.orm import Session
from fastapi import HTTPException
import uuid
from datetime import datetime, timezone

from .collector import collect_participants
from .processor import process_new_participants
from .finalizer import finalize_contest
import services.automations.reviews.crud as crud_automations
import crud
import models
from utils.persistent_logger import contest_log

def _create_alert_note(db: Session, project_id: str, message: str):
    """Создает заметку об ошибке/пропуске в календаре."""
    try:
        now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
        
        note = models.Note(
            id=f"new-note-{uuid.uuid4()}",
            projectId=project_id,
            date=now_iso,
            title="Ошибка КО",
            text=f"Не удалось провести конкурс отзывов.\nПричина: {message}",
            color="#FEE2E2" # Красный (red-100)
        )
        db.add(note)
        db.commit()
        print(f"AUTOMATION ({project_id}): Created alert note.")
    except Exception as e:
        print(f"AUTOMATION ({project_id}): Failed to create alert note: {e}")

def execute_scheduled_contest(db: Session, project_id: str) -> dict:
    """
    Оркестратор полного цикла конкурса отзывов.
    Запускается планировщиком (Post Tracker) при наступлении времени подведения итогов.
    
    Этапы:
    1. Сбор постов (Collect).
    2. Присвоение номеров (Process).
    3. Подведение итогов (Finalize) - может быть пропущено, если мало участников.
    """
    print(f"AUTOMATION: Starting full contest cycle for project {project_id}...")
    
    # 1. Проверка настроек
    contest = crud_automations.get_contest_settings(db, project_id)
    if not contest or not contest.is_active:
        raise Exception(f"Contest automation is disabled or settings not found for project {project_id}")

    logs = []

    # 2. Сбор постов (Collect)
    print(f"AUTOMATION ({project_id}): Step 1 - Collecting participants...")
    try:
        collect_res = collect_participants(db, project_id)
        logs.append(f"Collected: {collect_res.get('added', 0)}")
    except Exception as e:
        print(f"AUTOMATION ERROR (Collect): {e}")
        # Если сбор упал, попробуем продолжить (вдруг были старые участники)
        logs.append(f"Collect Error: {e}")



    # 3. Обработка и нумерация (Process)
    print(f"AUTOMATION ({project_id}): Step 2 - Processing entries...")
    process_failed = False
    try:
        process_res = process_new_participants(db, project_id)
        logs.append(f"Processed: {process_res.get('processed', 0)}")
        if process_res.get('errors', 0) > 0:
            logs.append(f"Process Errors: {process_res['errors']}")
    except Exception as e:
        print(f"AUTOMATION ERROR (Process): {e}")
        _create_alert_note(db, project_id, f"Ошибка при обработке новых участников: {e}")
        logs.append(f"Process Error: {e}")
        process_failed = True
        # НЕ пробрасываем ошибку — цикл должен продолжаться.
        # Финализацию пропустим, но следующий еженедельный пост будет создан.

    # 4. Подведение итогов (Finalize)
    if process_failed:
        print(f"AUTOMATION ({project_id}): Skipping finalize due to process failure.")
        return {"success": False, "error": "Process stage failed, finalize skipped", "logs": "; ".join(logs)}

    print(f"AUTOMATION ({project_id}): Step 3 - Finalizing...")
    try:
        # Финализация может вернуть {skipped: True}, если условий недостаточно.
        # Это НЕ ошибка, это нормальное поведение для Mixed/Count режимов.
        finalize_res = finalize_contest(db, project_id)
        
        if finalize_res.get("skipped"):
            msg = finalize_res.get("message", "Skipped")
            logs.append(f"Status: Postponed ({msg})")
            print(f"AUTOMATION ({project_id}): Contest postponed. Reason: {msg}")
            
            # ВАЖНО: Создаем заметку в календаре, чтобы пользователь знал причину
            _create_alert_note(db, project_id, msg)
            
        else:
            logs.append(f"Winner: {finalize_res.get('winner', 'Unknown')}")
            print(f"AUTOMATION ({project_id}): Contest finalized successfully. Winner: {finalize_res.get('winner')}")
        
        return {
            "success": True,
            "logs": "; ".join(logs)
        }
        
    except HTTPException as http_e:
        # Перехватываем известные бизнес-ошибки (например, нет промокодов)
        print(f"AUTOMATION ({project_id}): Known Logic Error: {http_e.detail}")
        contest_log(project_id, "EXECUTION_LOGIC_ERROR", details=http_e.detail, level="ERROR")
        _create_alert_note(db, project_id, http_e.detail)
        return {"success": False, "error": http_e.detail}
        
    except Exception as e:
        # Перехватываем неожиданные ошибки
        print(f"AUTOMATION ERROR (Finalize): {e}")
        contest_log(project_id, "EXECUTION_CRITICAL_ERROR", error=e, level="CRITICAL")
        _create_alert_note(db, project_id, f"Критическая ошибка при подведении итогов: {e}")
        return {"success": False, "error": str(e)}
