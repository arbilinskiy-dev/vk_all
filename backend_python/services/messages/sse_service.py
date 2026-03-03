"""
SSE (Server-Sent Events) генераторы для push-уведомлений модуля сообщений.
"""

import time
import asyncio
import logging

from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)


async def create_global_unread_stream() -> StreamingResponse:
    """
    Глобальный SSE-стрим для счётчиков непрочитанных диалогов по ВСЕМ проектам.

    Типы событий:
    - unread_count_changed: { project_id, unread_dialogs_count }
    """
    from services.sse_manager import sse_manager

    queue = sse_manager.subscribe_global()

    async def event_generator():
        """Генератор SSE-событий для глобального потока."""
        try:
            # Начальное событие подключения
            yield f"event: connected\ndata: {{\"status\": \"ok\"}}\n\n"

            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)
                    # Диагностика: логируем каждый yield события клиенту
                    try:
                        import json as _json
                        # Извлекаем project_id из SSE-строки для лога
                        lines = message.strip().split('\n')
                        data_line = next((l for l in lines if l.startswith('data: ')), None)
                        if data_line:
                            parsed = _json.loads(data_line[6:])
                            proj = parsed.get('project_id', '?')
                            evt = parsed.get('type', '?')
                            logger.info(
                                f"SSE GLOBAL YIELD: {evt} → project={proj}, "
                                f"qsize_after={queue.qsize()}"
                            )
                    except Exception:
                        pass
                    yield message
                except asyncio.TimeoutError:
                    yield f": heartbeat {int(time.time())}\n\n"
                except asyncio.CancelledError:
                    break
        finally:
            sse_manager.unsubscribe_global(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def create_project_stream(
    project_id: str,
    manager_id: str = "anonymous",
    manager_name: str = "",
) -> StreamingResponse:
    """
    SSE поток для получения push-уведомлений по конкретному проекту.

    Типы событий:
    - new_message: новое входящее/исходящее сообщение
    - message_read: диалог прочитан (другим менеджером)
    - unread_update: обновление счётчика непрочитанных
    - user_read: пользователь VK прочитал наши исходящие сообщения
    - user_typing: пользователь VK печатает сообщение
    - dialog_focus: менеджер открыл/покинул диалог
    """
    from services.sse_manager import sse_manager

    queue = sse_manager.subscribe(project_id, manager_id, manager_name)

    async def event_generator():
        """Генератор SSE-событий."""
        try:
            yield f"event: connected\ndata: {{\"project_id\": \"{project_id}\", \"manager_id\": \"{manager_id}\"}}\n\n"

            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield message
                except asyncio.TimeoutError:
                    yield f": heartbeat {int(time.time())}\n\n"
                except asyncio.CancelledError:
                    break
        finally:
            sse_manager.unsubscribe(project_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Отключаем буферизацию Nginx
        },
    )
