"""
Роутер для CRUD шаблонов ответов сообщений.
Prefix: /api/message-templates
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from typing import Optional

from database import get_db
from schemas.models.message_templates import (
    MessageTemplate,
    MessageTemplateCreate,
    MessageTemplateUpdate,
    MessageTemplatePreviewRequest,
    MessageTemplatePreviewResponse,
)
from services import message_template_service

router = APIRouter()


# --- Payload-схемы для единообразия с остальным API ---

class ListTemplatesPayload(BaseModel):
    """Запрос списка шаблонов проекта."""
    projectId: str


class CreateTemplatePayload(BaseModel):
    """Запрос создания шаблона."""
    projectId: str
    template: MessageTemplateCreate


class UpdateTemplatePayload(BaseModel):
    """Запрос обновления шаблона."""
    templateId: str
    template: MessageTemplateUpdate


class DeleteTemplatePayload(BaseModel):
    """Запрос удаления шаблона."""
    templateId: str


class PreviewTemplatePayload(BaseModel):
    """Запрос предпросмотра шаблона."""
    projectId: str
    text: str
    userId: Optional[int] = None


# --- Эндпоинты ---

@router.post("/list", response_model=List[MessageTemplate])
def list_templates(payload: ListTemplatesPayload, db: Session = Depends(get_db)):
    """Получить все шаблоны проекта."""
    return message_template_service.get_templates(db, payload.projectId)


@router.post("/create", response_model=MessageTemplate)
def create_template(payload: CreateTemplatePayload, db: Session = Depends(get_db)):
    """Создать новый шаблон."""
    return message_template_service.create_template(db, payload.projectId, payload.template)


@router.post("/update", response_model=MessageTemplate)
def update_template(payload: UpdateTemplatePayload, db: Session = Depends(get_db)):
    """Обновить существующий шаблон."""
    return message_template_service.update_template(db, payload.templateId, payload.template)


@router.post("/delete")
def delete_template(payload: DeleteTemplatePayload, db: Session = Depends(get_db)):
    """Удалить шаблон."""
    return message_template_service.delete_template(db, payload.templateId)


@router.post("/preview", response_model=MessageTemplatePreviewResponse)
def preview_template(payload: PreviewTemplatePayload, db: Session = Depends(get_db)):
    """Предпросмотр шаблона с подстановкой переменных."""
    result = message_template_service.preview_template(
        db=db,
        project_id=payload.projectId,
        text=payload.text,
        user_id=payload.userId,
    )
    return MessageTemplatePreviewResponse(**result)
