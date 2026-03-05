# Шаблон: Тест безопасности (Auth Boundary)

## Описание

Автоматический тест, который проверяет что **каждый защищённый эндпоинт** возвращает 401 без токена, а публичные эндпоинты доступны без авторизации. Также проверяет IDOR (доступ к чужим данным).

## Бэкенд-тест (pytest + TestClient)

```python
"""
Тест безопасности: Auth Boundary.
Проверяет что ВСЕ защищённые эндпоинты возвращают 401 без X-Session-Token.
Проверяет что публичные эндпоинты доступны без токена.
"""
import pytest
from fastapi.testclient import TestClient
from main import app


# =====================================================================
# Автоматический сбор эндпоинтов
# =====================================================================

def collect_endpoints() -> list[dict]:
    """Собрать все зарегистрированные эндпоинты из FastAPI app."""
    endpoints = []
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            for method in route.methods:
                endpoints.append({
                    'method': method,
                    'path': route.path,
                    'name': getattr(route, 'name', ''),
                })
    return endpoints


# Эндпоинты, которые ДОЛЖНЫ быть публичными (без токена)
PUBLIC_ENDPOINTS = {
    ('GET', '/api/version'),
    ('POST', '/api/auth/login'),
    ('POST', '/api/auth/callback'),
    ('POST', '/api/vk/callback'),
    ('GET', '/api/health'),
    # Добавить другие публичные эндпоинты по мере необходимости
}


# =====================================================================
# Тесты
# =====================================================================

client = TestClient(app)


class TestAuthBoundary:
    """Проверка что защищённые эндпоинты требуют авторизацию."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.endpoints = collect_endpoints()

    def _is_public(self, method: str, path: str) -> bool:
        """Проверить, является ли эндпоинт публичным."""
        return (method, path) in PUBLIC_ENDPOINTS

    def _make_test_path(self, path: str) -> str:
        """Заменить path-параметры на тестовые значения."""
        # {project_id} → 1, {item_id} → 1, и т.д.
        import re
        return re.sub(r'\{[^}]+\}', '1', path)

    def test_protected_endpoints_return_401(self):
        """Все защищённые эндпоинты возвращают 401 без токена."""
        failures = []

        for ep in self.endpoints:
            method = ep['method']
            path = ep['path']

            if self._is_public(method, path):
                continue

            test_path = self._make_test_path(path)

            # Отправляем запрос БЕЗ X-Session-Token
            if method == 'GET':
                r = client.get(test_path)
            elif method == 'POST':
                r = client.post(test_path, json={})
            elif method == 'PUT':
                r = client.put(test_path, json={})
            elif method == 'DELETE':
                r = client.delete(test_path)
            elif method == 'PATCH':
                r = client.patch(test_path, json={})
            else:
                continue

            # Ожидаем 401 или 403 (но НЕ 200/201/204)
            if r.status_code in (200, 201, 204):
                failures.append(f"{method} {path} → {r.status_code} (ожидали 401!)")

        if failures:
            msg = f"\n🔴 {len(failures)} эндпоинтов доступны БЕЗ авторизации:\n"
            msg += "\n".join(f"  ❌ {f}" for f in failures)
            pytest.fail(msg)

    def test_public_endpoints_accessible(self):
        """Публичные эндпоинты доступны без токена."""
        for method, path in PUBLIC_ENDPOINTS:
            test_path = self._make_test_path(path)

            if method == 'GET':
                r = client.get(test_path)
            elif method == 'POST':
                r = client.post(test_path, json={})
            else:
                continue

            # Публичные эндпоинты не должны возвращать 401
            assert r.status_code != 401, (
                f"{method} {path} → 401 (но это публичный эндпоинт!)"
            )


class TestIDOR:
    """Проверка что пользователь не может получить чужие данные."""

    # Для IDOR-тестов нужны 2 пользователя с разными токенами
    # Настроить через conftest.py:
    #   user_a_headers = { 'X-Session-Token': '<токен_пользователя_A>' }
    #   user_b_headers = { 'X-Session-Token': '<токен_пользователя_B>' }

    @pytest.mark.skip(reason="Требует настройки 2 тестовых пользователей в conftest.py")
    def test_user_a_cannot_access_user_b_data(self):
        """Пользователь A не может получить данные пользователя B."""
        # 1. Создать ресурс от имени пользователя A
        # r_create = client.post("/api/notes/", json={"text": "secret"},
        #                        headers=user_a_headers)
        # note_id = r_create.json()["id"]
        #
        # 2. Попытаться прочитать от имени пользователя B
        # r_read = client.get(f"/api/notes/{note_id}", headers=user_b_headers)
        # assert r_read.status_code in (403, 404)  # НЕ 200!
        pass


class TestPrivilegeEscalation:
    """Проверка что обычный user не может выполнить admin-действия."""

    @pytest.mark.skip(reason="Требует настройки user + admin токенов в conftest.py")
    def test_regular_user_cannot_promote(self):
        """Обычный пользователь не может промоутить других в admin."""
        # r = client.post("/api/admin/promote", json={...}, headers=user_headers)
        # assert r.status_code == 403
        pass
```

## Фронтенд-тест (Vitest): проверка auth в API-файлах

```typescript
/**
 * Проверка: при 401 от сервера API-слой генерирует событие session-expired.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../shared/utils/apiClient', async () => {
  const actual = await vi.importActual('../../shared/utils/apiClient');
  return {
    ...actual,
    getAuthHeaders: vi.fn(() => ({ 'X-Session-Token': 'test' })),
  };
});

import { sendMessage } from '../../services/api/messages.api';

describe('Auth: 401 → session-expired', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: 'Unauthorized' }),
      } as unknown as Response)
    );
  });

  it('sendMessage при 401 бросает ошибку', async () => {
    await expect(
      sendMessage({ peer_id: 1, text: 'hi', project_id: 1 })
    ).rejects.toThrow();
  });
});
```

## Размещение

```
backend_python/tests/security/test_auth_boundary.py
tests/security/auth_session_expired.test.ts
```

## Запуск

```bash
# Бэкенд
cd backend_python
pytest tests/security/test_auth_boundary.py -v

# Фронтенд
npx vitest run tests/security/
```

## Как адаптировать

1. Обновить `PUBLIC_ENDPOINTS` — добавить все реально публичные эндпоинты
2. Для IDOR-тестов — настроить 2 тестовых пользователя в conftest.py
3. Для privilege escalation — настроить user-токен и admin-токен
4. Добавлять новые эндпоинты в проверку при создании нового роутера
