"""
Утилита для трекинга действий пользователей.
Вызывается из роутеров после успешного выполнения операции.

Использование:
    from services.action_tracker import track
    
    @router.post("/publish")
    def publish_post(..., current_user: CurrentUser = Depends(get_current_user)):
        # ... бизнес-логика ...
        track(db, current_user, "post_publish", "posts",
              entity_type="post", entity_id=post_id, project_id=project_id)
        return result
"""

from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from services.auth_middleware import CurrentUser
from crud import user_action_crud


def track(
    db: Session,
    user: CurrentUser,
    action_type: str,
    category: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    project_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    commit: bool = True,
) -> None:
    """
    Записывает бизнес-действие пользователя.
    
    Параметры:
        db: сессия БД
        user: текущий пользователь из Depends
        action_type: тип действия (post_publish, message_send, ...)
        category: категория (posts, messages, market, ai, ...)
        entity_type: тип сущности (post, message, market_item, ...)
        entity_id: ID сущности
        project_id: ID проекта
        metadata: доп. данные (dict → JSON)
        commit: делать ли коммит (False если внутри чужой транзакции)
    """
    try:
        if commit:
            user_action_crud.log_action(
                db=db,
                user_id=user.user_id,
                username=user.username,
                action_type=action_type,
                action_category=category,
                entity_type=entity_type,
                entity_id=entity_id,
                project_id=project_id,
                metadata=metadata,
            )
        else:
            user_action_crud.log_action_no_commit(
                db=db,
                user_id=user.user_id,
                username=user.username,
                action_type=action_type,
                action_category=category,
                entity_type=entity_type,
                entity_id=entity_id,
                project_id=project_id,
                metadata=metadata,
            )
    except Exception as e:
        # Трекинг НЕ должен ломать бизнес-логику.
        # Если запись не удалась — логируем и продолжаем.
        print(f"⚠️ action_tracker.track failed: {e}")
