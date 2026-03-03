"""
Модель SSE-события (Server-Sent Events).

Сериализация события в формат SSE-протокола.
"""

import json
import time
from typing import Dict, Any
from dataclasses import dataclass, field


@dataclass
class SSEEvent:
    """Событие для отправки через SSE."""
    event_type: str         # "new_message" | "message_read" | "unread_update" | "user_read" | "user_typing" | "dialog_focus"
    project_id: str         # ID проекта
    data: Dict[str, Any]    # Payload события
    timestamp: float = field(default_factory=time.time)

    def to_sse_string(self) -> str:
        """Форматирование в SSE-протокол."""
        payload = json.dumps({
            "type": self.event_type,
            "project_id": self.project_id,
            "data": self.data,
            "timestamp": self.timestamp,
        }, ensure_ascii=False)
        return f"event: {self.event_type}\ndata: {payload}\n\n"
