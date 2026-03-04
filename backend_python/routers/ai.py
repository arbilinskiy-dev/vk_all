
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict

# Импортируем все необходимые схемы из корневого пакета schemas
import schemas

import services.ai_service as ai_service
from database import get_db
from config import settings
from services.auth_middleware import get_current_user, CurrentUser
from services.action_tracker import track

router = APIRouter()

@router.post("/generatePostText", response_model=schemas.GeneratedTextResponse)
def generate_post_text(payload: schemas.GenerateTextPayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """
    Генерирует текст для поста с помощью Gemini.
    Принимает основной промпт и опциональный системный промпт.
    """
    result = ai_service.generate_text_from_prompt(
        prompt=payload.prompt,
        system_prompt=payload.system_prompt
    )
    track(db, current_user, "ai_generate", "ai",
          metadata={"prompt_length": len(payload.prompt or "")})
    return result

@router.post("/generateBatchPostTexts", response_model=schemas.GeneratedBatchTextResponse)
def generate_batch_post_texts(payload: schemas.GenerateBatchTextPayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """
    Генерирует {count} уникальных вариаций текста поста.
    """
    variations = ai_service.generate_batch_post_text(
        prompt=payload.prompt,
        count=payload.count,
        system_prompt=payload.system_prompt
    )
    track(db, current_user, "ai_generate_batch", "ai",
          metadata={"count": payload.count})
    return {"variations": variations}

@router.post("/defaultSystemPrompt", response_model=Dict[str, str])
def get_default_system_prompt():
    """Возвращает системный промпт по умолчанию для генератора текста."""
    return {"default_prompt": ai_service.DEFAULT_SYSTEM_PROMPT}


@router.post("/correctSuggestedPostText", response_model=schemas.CorrectedTextResponse)
def correct_text(payload: schemas.CorrectTextPayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    corrected_text = ai_service.correct_suggested_text(db, payload.text, payload.projectId, settings.vk_user_token)
    track(db, current_user, "ai_correct", "ai",
          project_id=payload.projectId)
    return {"correctedText": corrected_text}

@router.post("/bulkCorrectSuggestedPosts", response_model=schemas.BulkCorrectedSuggestedPostsResponse)
def bulk_correct_suggested_posts(payload: schemas.BulkCorrectSuggestedPostsPayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """
    Массовая коррекция всех предложенных постов одним запросом.
    Принимает массив [{id, text}], возвращает [{id, correctedText}].
    """
    results = ai_service.bulk_correct_suggested_texts(db, payload.posts, payload.projectId, settings.vk_user_token)
    track(db, current_user, "ai_bulk_correct", "ai",
          project_id=payload.projectId,
          metadata={"posts_count": len(payload.posts)})
    return {"results": results}

@router.post("/runAiVariableSetup", response_model=schemas.AiVariableSetupResponse)
def run_ai_variable_setup(payload: schemas.AiVariablePayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    result = ai_service.run_ai_variable_setup(db, payload, settings.vk_user_token)
    track(db, current_user, "ai_variable_setup", "ai")
    return result

@router.post("/processPostText", response_model=schemas.GeneratedTextResponse)
def process_post_text(payload: schemas.ProcessTextPayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """
    Обрабатывает текст поста с помощью AI по заданному действию (рерайт, исправление ошибок).
    """
    result = ai_service.process_post_text(
        text=payload.text,
        action=payload.action
    )
    track(db, current_user, "ai_process_text", "ai",
          metadata={"action": payload.action})
    return result
