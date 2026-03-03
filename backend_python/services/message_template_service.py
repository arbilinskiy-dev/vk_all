"""
Сервисный слой для шаблонов ответов сообщений.
Бизнес-логика: CRUD + предпросмотр с подстановкой переменных.
"""

import json
import logging
from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session
from fastapi import HTTPException

from crud import message_template_crud
from schemas.models.message_templates import (
    MessageTemplate,
    MessageTemplateCreate,
    MessageTemplateUpdate,
    MessageTemplateAttachment,
)
from services import global_variable_service
from services import promo_list_service

logger = logging.getLogger(__name__)


def _serialize_template(db_template) -> MessageTemplate:
    """Конвертация ORM-объекта в Pydantic-схему с парсингом attachments_json."""
    attachments = None
    if db_template.attachments_json:
        try:
            raw = json.loads(db_template.attachments_json)
            attachments = [MessageTemplateAttachment(**a) for a in raw]
        except (json.JSONDecodeError, Exception) as e:
            logger.warning(f"Ошибка парсинга attachments_json шаблона {db_template.id}: {e}")
            attachments = []

    return MessageTemplate(
        id=db_template.id,
        project_id=db_template.project_id,
        name=db_template.name,
        text=db_template.text,
        attachments=attachments,
        sort_order=db_template.sort_order or 0,
        created_at=db_template.created_at,
        updated_at=db_template.updated_at,
    )


def get_templates(db: Session, project_id: str) -> List[MessageTemplate]:
    """Получить все шаблоны проекта."""
    db_templates = message_template_crud.get_templates_by_project_id(db, project_id)
    return [_serialize_template(t) for t in db_templates]


def create_template(db: Session, project_id: str, data: MessageTemplateCreate) -> MessageTemplate:
    """Создать новый шаблон."""
    attachments_json = None
    if data.attachments:
        attachments_json = json.dumps([a.model_dump() for a in data.attachments], ensure_ascii=False)

    db_template = message_template_crud.create_template(
        db=db,
        project_id=project_id,
        name=data.name,
        text=data.text,
        attachments_json=attachments_json,
        sort_order=data.sort_order or 0,
    )
    return _serialize_template(db_template)


def update_template(db: Session, template_id: str, data: MessageTemplateUpdate) -> MessageTemplate:
    """Обновить шаблон."""
    attachments_json = None
    if data.attachments is not None:
        attachments_json = json.dumps([a.model_dump() for a in data.attachments], ensure_ascii=False)

    db_template = message_template_crud.update_template(
        db=db,
        template_id=template_id,
        name=data.name,
        text=data.text,
        attachments_json=attachments_json,
        sort_order=data.sort_order,
    )
    if not db_template:
        raise HTTPException(status_code=404, detail=f"Шаблон с id {template_id} не найден")
    return _serialize_template(db_template)


def delete_template(db: Session, template_id: str) -> dict:
    """Удалить шаблон."""
    success = message_template_crud.delete_template(db, template_id)
    if not success:
        logger.warning(f"Шаблон с id {template_id} не найден для удаления, продолжаем.")
    return {"success": True}


def preview_template(
    db: Session,
    project_id: str,
    text: str,
    user_id: Optional[int] = None,
) -> Dict[str, str]:
    """
    Предпросмотр шаблона: подстановка всех переменных.
    1. {global_*} → значения глобальных переменных проекта
    2. {username} → имя пользователя из VK-профиля (если указан user_id)
    3. Проектные переменные (ссылка на сообщество и т.д.) — подставляются на фронте
    """
    original_text = text
    preview_text = text

    # 1. Подстановка {global_*} переменных
    preview_text = global_variable_service.substitute_global_variables(db, preview_text, project_id)

    # 1.5. Подстановка {promo_*_code} и {promo_*_description} (сухой прогон — не выдаём промокоды)
    preview_text = promo_list_service.substitute_promo_variables(
        db, preview_text, project_id, dry_run=True
    )

    # 2. Подстановка {username} если указан user_id
    if user_id and '{username}' in preview_text:
        try:
            from models_library.vk_profiles import VkProfile
            profile = db.query(VkProfile).filter(VkProfile.id == user_id).first()
            if profile and profile.first_name:
                preview_text = preview_text.replace('{username}', profile.first_name)
            else:
                # Если профиль не найден, оставляем как есть для наглядности
                preview_text = preview_text.replace('{username}', '[Имя пользователя]')
        except Exception as e:
            logger.warning(f"Ошибка подстановки {{username}}: {e}")
            preview_text = preview_text.replace('{username}', '[Имя пользователя]')
    elif '{username}' in preview_text:
        preview_text = preview_text.replace('{username}', '[Имя пользователя]')

    return {
        "preview_text": preview_text,
        "original_text": original_text,
    }
