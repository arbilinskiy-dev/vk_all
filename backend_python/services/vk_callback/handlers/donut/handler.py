# Обработчик VK Donut (donut_subscription_*, donut_money_*)

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

logger = logging.getLogger("vk_callback.handlers.donut")


class DonutHandler(BaseEventHandler):
    """
    Обработчик событий VK Donut.
    
    Сейчас: логирование.
    Расширение: управление подписками, статистика дохода.
    """
    
    HANDLES_EVENTS = [
        "donut_subscription_create",
        "donut_subscription_prolonged",
        "donut_subscription_expired",
        "donut_subscription_cancelled",
        "donut_subscription_price_changed",
        "donut_money_withdraw",
        "donut_money_withdraw_error",
    ]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        user_id = obj.get("user_id")
        amount = obj.get("amount")
        
        self._log(f"{event.type}: user={user_id}, amount={amount}", event)
        
        return HandlerResult(
            success=True,
            message=f"Событие Donut ({event.type})",
            action_taken="logged",
            data={"user_id": user_id, "amount": amount}
        )
