"""Тесты для sse_event.py — dataclass SSEEvent и метод to_sse_string()."""

import json
import time
import pytest

from services.sse_event import SSEEvent


class TestSSEEventCreation:
    """Создание SSEEvent с правильными полями."""

    def test_required_fields(self):
        """SSEEvent создаётся с обязательными полями."""
        evt = SSEEvent(event_type="new_message", project_id="p1", data={"key": "val"})
        assert evt.event_type == "new_message"
        assert evt.project_id == "p1"
        assert evt.data == {"key": "val"}

    def test_timestamp_auto_generated(self):
        """Поле timestamp заполняется автоматически (time.time)."""
        before = time.time()
        evt = SSEEvent(event_type="test", project_id="p1", data={})
        after = time.time()
        assert before <= evt.timestamp <= after

    def test_custom_timestamp(self):
        """Можно передать кастомный timestamp."""
        evt = SSEEvent(event_type="test", project_id="p1", data={}, timestamp=1000.0)
        assert evt.timestamp == 1000.0

    def test_data_dict_preserved(self):
        """Сложный dict в data сохраняется без изменений."""
        data = {"users": [1, 2, 3], "nested": {"a": True}}
        evt = SSEEvent(event_type="test", project_id="p1", data=data)
        assert evt.data == data


class TestSSEEventToSSEString:
    """Метод to_sse_string() — формирование SSE-протокольной строки."""

    def test_basic_format(self):
        """Базовый формат: event: ...\ndata: ...\n\n."""
        evt = SSEEvent(event_type="new_message", project_id="p1", data={"x": 1}, timestamp=100.0)
        result = evt.to_sse_string()
        # Строка должна начинаться с event: и заканчиваться двойным \n
        assert result.startswith("event: new_message\n")
        assert result.endswith("\n\n")

    def test_data_is_valid_json(self):
        """data-строка содержит валидный JSON с правильными полями."""
        evt = SSEEvent(event_type="test", project_id="p_abc", data={"msg": "hello"}, timestamp=42.0)
        result = evt.to_sse_string()
        # Извлекаем JSON из data: ...\n
        lines = result.strip().split("\n")
        data_line = [l for l in lines if l.startswith("data: ")][0]
        json_str = data_line[len("data: "):]
        payload = json.loads(json_str)
        assert payload["type"] == "test"
        assert payload["project_id"] == "p_abc"
        assert payload["data"] == {"msg": "hello"}
        assert payload["timestamp"] == 42.0

    def test_unicode_data(self):
        """Русские символы в data сериализуются без escape (ensure_ascii=False)."""
        evt = SSEEvent(event_type="test", project_id="p1", data={"текст": "Привет"}, timestamp=1.0)
        result = evt.to_sse_string()
        assert "Привет" in result
        assert "\\u" not in result  # Без unicode-escape

    def test_empty_data(self):
        """Пустой dict в data — корректная сериализация."""
        evt = SSEEvent(event_type="ping", project_id="p1", data={}, timestamp=0.0)
        result = evt.to_sse_string()
        assert "event: ping\n" in result
        payload = json.loads(result.split("data: ")[1].strip())
        assert payload["data"] == {}

    def test_complex_nested_data(self):
        """Вложенные структуры в data корректно сериализуются."""
        data = {
            "vk_user_id": 12345,
            "message": {"text": "Тест", "attachments": [{"type": "photo"}]},
            "is_read": False,
        }
        evt = SSEEvent(event_type="new_message", project_id="proj_42", data=data, timestamp=999.0)
        result = evt.to_sse_string()
        payload = json.loads(result.split("data: ")[1].strip())
        assert payload["data"]["vk_user_id"] == 12345
        assert payload["data"]["message"]["attachments"][0]["type"] == "photo"
        assert payload["data"]["is_read"] is False

    def test_event_type_in_first_line(self):
        """Первая строка содержит event: <тип>."""
        evt = SSEEvent(event_type="user_typing", project_id="p1", data={}, timestamp=0.0)
        first_line = evt.to_sse_string().split("\n")[0]
        assert first_line == "event: user_typing"
