# Обработчик событий товаров (market_comment_*, market_order_*)
#
# Возможные действия:
# - Уведомление о новых заказах
# - Обновление статуса заказов в БД
# - Модерация комментариев к товарам

import logging
from sqlalchemy.orm import Session

from ..base import BaseEventHandler
from ...models import CallbackEvent, HandlerResult

logger = logging.getLogger("vk_callback.handlers.market")


class MarketHandler(BaseEventHandler):
    """
    Обработчик событий товаров и заказов.
    
    Сейчас: логирование.
    Расширение: синхронизация заказов, уведомления, CRM.
    """
    
    HANDLES_EVENTS = [
        "market_comment_new",
        "market_comment_edit",
        "market_comment_restore",
        "market_comment_delete",
        "market_order_new",
        "market_order_edit",
    ]
    
    def handle(self, db: Session, event: CallbackEvent, project) -> HandlerResult:
        obj = event.object or {}
        
        if event.type.startswith("market_order"):
            order_id = obj.get("id")
            user_id = obj.get("user_id")
            status = obj.get("status")
            self._log(
                f"{event.type}: order={order_id}, user={user_id}, status={status}",
                event
            )
        else:
            item_id = obj.get("item_id")
            comment_id = obj.get("id")
            self._log(
                f"{event.type}: item={item_id}, comment={comment_id}",
                event
            )
        
        # TODO: Реализовать:
        # - Синхронизация заказов с БД
        # - Уведомление администратора о новых заказах
        # - Автоматическое обновление статуса
        
        return HandlerResult(
            success=True,
            message=f"Событие товаров ({event.type})",
            action_taken="logged"
        )
