# Обработчик подтверждения сервера (confirmation)
#
# VK отправляет это событие при настройке Callback API.
# Ожидает получить в ответ confirmation_code из настроек группы.
#
# ВАЖНО: Этот хендлер вызывается СИНХРОННО в роутере (не через очередь).
# Событие confirmation требует немедленного ответа.

from sqlalchemy.orm import Session
from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult


class ConfirmationHandler(BaseEventHandler):
    """
    Обработчик события подтверждения сервера.
    
    VK отправляет это событие при настройке Callback API,
    ожидая получить в ответ confirmation_code из настроек группы.
    """
    
    HANDLES_EVENTS = ["confirmation"]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        """Возвращает код подтверждения для группы."""
        
        if not project:
            self._log(f"Проект не найден для group_id={event.group_id}", event)
            return HandlerResult(
                success=False,
                message="Проект не найден"
            )
        
        if not project.vk_confirmation_code:
            self._log(f"Код подтверждения не настроен для проекта '{project.name}'", event)
            return HandlerResult(
                success=False,
                message="Код подтверждения не настроен"
            )
        
        code = project.vk_confirmation_code.strip()
        self._log(f"Возвращаем код подтверждения для проекта '{project.name}'", event)
        
        return HandlerResult(
            success=True,
            message="Код подтверждения найден",
            action_taken="confirmation",
            data={"confirmation_code": code}
        )
