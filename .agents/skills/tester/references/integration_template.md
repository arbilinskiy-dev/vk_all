# Шаблон интеграционного теста

## Структура теста модуля

```python
"""
Интеграционные тесты для модуля <название>.
Тестирует CRUD-операции, валидацию и граничные случаи.
"""
import pytest


# =====================================================================
# Тестовые данные
# =====================================================================
VALID_ITEM = {
    "name": "Тестовый элемент",
    "description": "Описание",
    # ... остальные обязательные поля
}

INVALID_ITEM = {
    # Пустое тело — должно вызвать 422
}


class TestМодульCRUD:
    """Тесты CRUD-операций."""

    def test_create(self, client, auth_headers):
        """Создание нового элемента."""
        r = client.post("/api/модуль/", json=VALID_ITEM, headers=auth_headers)
        assert r.status_code == 200, f"Ожидали 200, получили {r.status_code}: {r.text}"
        data = r.json()
        assert data["name"] == VALID_ITEM["name"]
        assert "id" in data

    def test_read_list(self, client, auth_headers):
        """Получение списка элементов."""
        # Создаём
        client.post("/api/модуль/", json=VALID_ITEM, headers=auth_headers)
        # Читаем
        r = client.get("/api/модуль/", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_read_single(self, client, auth_headers):
        """Получение одного элемента по ID."""
        create_r = client.post("/api/модуль/", json=VALID_ITEM, headers=auth_headers)
        item_id = create_r.json()["id"]

        r = client.get(f"/api/модуль/{item_id}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["id"] == item_id

    def test_update(self, client, auth_headers):
        """Обновление элемента."""
        create_r = client.post("/api/модуль/", json=VALID_ITEM, headers=auth_headers)
        item_id = create_r.json()["id"]

        updated = {**VALID_ITEM, "name": "Обновлённое имя"}
        r = client.put(f"/api/модуль/{item_id}", json=updated, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["name"] == "Обновлённое имя"

    def test_delete(self, client, auth_headers):
        """Удаление элемента."""
        create_r = client.post("/api/модуль/", json=VALID_ITEM, headers=auth_headers)
        item_id = create_r.json()["id"]

        r = client.delete(f"/api/модуль/{item_id}", headers=auth_headers)
        assert r.status_code == 200

        # Проверяем что удалён
        r = client.get(f"/api/модуль/{item_id}", headers=auth_headers)
        assert r.status_code == 404


class TestМодульValidation:
    """Тесты валидации."""

    def test_create_empty_body(self, client, auth_headers):
        """Создание с пустым телом → 422."""
        r = client.post("/api/модуль/", json={}, headers=auth_headers)
        assert r.status_code == 422

    def test_create_invalid_type(self, client, auth_headers):
        """Создание с неправильным типом данных → 422."""
        r = client.post("/api/модуль/", json={"name": 12345}, headers=auth_headers)
        assert r.status_code == 422

    def test_read_nonexistent(self, client, auth_headers):
        """Запрос несуществующего элемента → 404."""
        r = client.get("/api/модуль/99999", headers=auth_headers)
        assert r.status_code == 404


class TestМодульAuth:
    """Тесты авторизации."""

    def test_no_token(self, client):
        """Запрос без токена → 401."""
        r = client.get("/api/модуль/")
        assert r.status_code == 401

    def test_invalid_token(self, client):
        """Запрос с невалидным токеном → 401."""
        r = client.get("/api/модуль/", headers={"Authorization": "Bearer invalid"})
        assert r.status_code == 401
```

## Как адаптировать

1. Заменить `/api/модуль/` на реальный путь роутера
2. Заменить `VALID_ITEM` на реальные поля из Pydantic-схемы
3. Добавить специфические тесты для модуля (бизнес-логика)
4. Если модуль не требует авторизации — убрать `auth_headers`
5. Если есть query-параметры (pagination, filters) — добавить тесты

## Запуск

```bash
cd "c:\Users\nikita79882\Desktop\vk planer code\12.02.2026\backend_python"
pytest tests/integration/test_модуль.py -v
```
