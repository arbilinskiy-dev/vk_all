# Хендлеры: сообщения (message_*)
#
# Каждый тип события — отдельный файл и хендлер.
# Общие утилиты (SSE, format) — в _helpers.py.

from .message_new import MessageNewHandler
from .message_reply import MessageReplyHandler
from .message_read import MessageReadHandler
from .message_typing import MessageTypingHandler
from .message_allow_deny import MessageAllowDenyHandler
from .message_edit import MessageEditHandler
from .message_event import MessageEventHandler

MESSAGE_HANDLERS = [
    MessageNewHandler(),
    MessageReplyHandler(),
    MessageReadHandler(),
    MessageTypingHandler(),
    MessageAllowDenyHandler(),
    MessageEditHandler(),
    MessageEventHandler(),
]

__all__ = [
    'MessageNewHandler',
    'MessageReplyHandler',
    'MessageReadHandler',
    'MessageTypingHandler',
    'MessageAllowDenyHandler',
    'MessageEditHandler',
    'MessageEventHandler',
    'MESSAGE_HANDLERS',
]
