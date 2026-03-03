# Middleware: Валидация секретного ключа
#
# Если у проекта настроен secret key для Callback API,
# проверяем что входящее событие содержит правильный ключ.

import logging
from ..models import CallbackEvent, MiddlewareResult
from .base import BaseMiddleware

logger = logging.getLogger("vk_callback.middleware.secret")


class SecretValidatorMiddleware(BaseMiddleware):
    """
    Проверка секретного ключа VK Callback.
    
    VK присылает поле 'secret' в каждом событии, если ключ настроен.
    Мы сравниваем его с ключом, сохранённым в проекте.
    
    Если ключ не настроен в проекте — пропускаем проверку.
    """
    
    def process(self, event: CallbackEvent) -> MiddlewareResult:
        # Confirmation-события проходят без проверки 
        # (на этапе confirmation мы ещё только подтверждаем сервер)
        if event.type == "confirmation":
            return MiddlewareResult(allow=True)
        
        # Если в событии нет секрета — пропускаем проверку
        # (VK не присылает secret если он не настроен)
        if not event.secret:
            return MiddlewareResult(allow=True)
        
        # Проверяем секрет через БД
        # Примечание: это lazy-валидация на уровне worker'а,
        # не на уровне API-эндпоинта (чтобы не задерживать ответ VK)
        try:
            from database import SessionLocal
            import crud
            
            with SessionLocal() as db:
                project = crud.get_project_by_vk_id(db, event.group_id)
                
                if not project:
                    # Проект не найден — пропускаем (хендлер сам обработает)
                    return MiddlewareResult(allow=True)
                
                # Если у проекта нет настроенного секрета — пропускаем
                project_secret = getattr(project, 'vk_callback_secret', None)
                if not project_secret:
                    return MiddlewareResult(allow=True)
                
                # Сравниваем
                if event.secret != project_secret:
                    logger.warning(
                        f"SECRET: Неверный ключ для group={event.group_id} "
                        f"(ожидался '{project_secret[:4]}...', получен '{event.secret[:4]}...')"
                    )
                    return MiddlewareResult(
                        allow=False,
                        reason=f"Invalid secret key for group {event.group_id}"
                    )
        
        except Exception as e:
            logger.error(f"SECRET: Ошибка проверки: {e}")
            # При ошибке — пропускаем (лучше обработать чем потерять)
        
        return MiddlewareResult(allow=True)
