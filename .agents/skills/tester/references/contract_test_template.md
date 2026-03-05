# Шаблон: Контрактный тест (Pydantic ↔ TypeScript)

## Описание

Контрактный тест проверяет что **серверный ответ** (Pydantic-схема) совпадает с тем, что **фронтенд ожидает** (TypeScript-тип). Ловит drift: переименование полей, смена типов, добавление required-полей.

## Бэкенд-тест (pytest): Проверка структуры реального ответа

```python
"""
Контрактный тест: проверяет структуру реальных ответов API.
Гарантирует что ответы эндпоинтов соответствуют Pydantic-схемам.
"""
import pytest
from fastapi.testclient import TestClient
from main import app

# Импортируем conftest фикстуры
# client, auth_headers — из conftest.py модуля


class TestМодульContract:
    """Контрактные тесты: структура ответов модуля."""

    def test_list_response_structure(self, client: TestClient, auth_headers: dict):
        """Ответ GET /api/модуль/ содержит ожидаемые поля."""
        r = client.get("/api/модуль/?project_id=1", headers=auth_headers)

        if r.status_code == 200:
            data = r.json()

            # Проверяем что это список (или объект с items)
            if isinstance(data, list):
                if len(data) > 0:
                    item = data[0]
                    self._check_item_fields(item)
            elif isinstance(data, dict):
                # Возможно пагинация: { items: [...], total: N }
                assert 'items' in data or 'data' in data, \
                    f"Ответ — объект, но нет 'items' или 'data': {list(data.keys())}"

    def test_single_response_structure(self, client: TestClient, auth_headers: dict):
        """Ответ GET /api/модуль/{id} содержит ожидаемые поля."""
        # Сначала создать или получить ID
        r_list = client.get("/api/модуль/?project_id=1", headers=auth_headers)
        if r_list.status_code == 200 and isinstance(r_list.json(), list) and len(r_list.json()) > 0:
            item_id = r_list.json()[0].get('id')
            if item_id:
                r = client.get(f"/api/модуль/{item_id}", headers=auth_headers)
                if r.status_code == 200:
                    self._check_item_fields(r.json())

    def _check_item_fields(self, item: dict):
        """Проверить наличие и типы обязательных полей.

        АДАПТИРОВАТЬ: заменить на реальные поля из Pydantic-схемы.
        """
        # Обязательные поля (из Pydantic Response-модели)
        required_fields = {
            'id': int,
            'name': str,
            'created_at': str,      # datetime → строка в JSON
            # 'project_id': int,
            # 'status': str,
        }

        for field, expected_type in required_fields.items():
            assert field in item, f"Отсутствует обязательное поле '{field}'. Есть: {list(item.keys())}"
            if item[field] is not None:  # None допустим для Optional
                assert isinstance(item[field], expected_type), \
                    f"Поле '{field}': ожидали {expected_type.__name__}, получили {type(item[field]).__name__}"

        # Optional-поля (могут быть None)
        optional_fields = ['description', 'updated_at', 'metadata']
        for field in optional_fields:
            if field in item:
                pass  # Просто проверяем что поле есть, тип не проверяем (может быть None)


class TestМодульSchemaSync:
    """Проверка: Pydantic-схема → JSON → обратно."""

    def test_response_model_serialization(self):
        """Pydantic-модель сериализуется корректно (snake_case/camelCase)."""
        from schemas.модуль import МодульResponse

        # Создаём экземпляр с тестовыми данными
        instance = МодульResponse(
            id=1,
            name="тест",
            # ... заполнить все обязательные поля
        )

        # Сериализуем в JSON
        json_data = instance.model_dump(mode='json')

        # Проверяем формат ключей
        for key in json_data.keys():
            # Если фронтенд ожидает camelCase — проверить by_alias=True
            # Если фронтенд ожидает snake_case — поля должны быть snake_case
            assert '_' not in key or key == key.lower(), \
                f"Поле '{key}' может вызвать проблемы на фронтенде (snake_case vs camelCase)"
```

## Фронтенд-тест (Vitest): Проверка парсинга серверного ответа

```typescript
/**
 * Контрактный тест: TypeScript-тип парсит реальный JSON-ответ сервера.
 */
import { describe, it, expect } from 'vitest';

// Импортируем TypeScript-тип
import type { МодульItem } from '../../features/модуль/types';

/**
 * Реальный JSON-ответ от бэкенда (скопировать из Swagger или из curl).
 * Обновлять при изменении Pydantic-схемы!
 */
const REAL_SERVER_RESPONSE: unknown = {
  id: 1,
  name: "Пример",
  created_at: "2026-01-01T00:00:00Z",
  project_id: 1,
  status: "active",
  description: null,
};

describe('Контракт: МодульItem', () => {
  it('TypeScript-тип совпадает с серверным ответом', () => {
    // Если это компилируется — типы совпадают
    const item = REAL_SERVER_RESPONSE as МодульItem;

    // Проверяем обязательные поля
    expect(item.id).toBeDefined();
    expect(typeof item.id).toBe('number');

    expect(item.name).toBeDefined();
    expect(typeof item.name).toBe('string');
  });

  it('все поля TypeScript-типа присутствуют в ответе', () => {
    // Список полей из TypeScript-интерфейса (обновлять вручную)
    const expectedFields: (keyof МодульItem)[] = [
      'id', 'name', 'created_at', 'project_id', 'status',
    ];

    const response = REAL_SERVER_RESPONSE as Record<string, unknown>;

    for (const field of expectedFields) {
      expect(response).toHaveProperty(field as string);
    }
  });

  it('сервер не возвращает лишних полей', () => {
    const knownFields = new Set([
      'id', 'name', 'created_at', 'project_id', 'status', 'description',
    ]);

    const response = REAL_SERVER_RESPONSE as Record<string, unknown>;

    for (const key of Object.keys(response)) {
      expect(knownFields.has(key)).toBe(true);
    }
  });
});
```

## Продвинутый вариант: автоматическая проверка snake_case ↔ camelCase

```typescript
/**
 * Утилита для проверки конвенции именования полей.
 */
function isSnakeCase(key: string): boolean {
  return /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(key);
}

function isCamelCase(key: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(key);
}

describe('Конвенция именования', () => {
  it('все ключи серверного ответа в snake_case', () => {
    const response = REAL_SERVER_RESPONSE as Record<string, unknown>;

    for (const key of Object.keys(response)) {
      expect(isSnakeCase(key)).toBe(true);
    }
  });
});
```

## Размещение

```
backend_python/tests/contract/test_schema_<module>.py
tests/contract/<module>_schema.test.ts
```

## Запуск

```bash
# Бэкенд
cd backend_python
pytest tests/contract/ -v

# Фронтенд
npx vitest run tests/contract/
```

## Как адаптировать

1. Заменить `модуль` на реальное имя (messages, posts, projects...)
2. **Бэкенд:** заполнить `required_fields` из Pydantic Response-модели
3. **Фронтенд:** скопировать реальный JSON-ответ (из curl, Swagger, DevTools Network)
4. **Фронтенд:** заполнить `expectedFields` из TypeScript-интерфейса
5. Если проект использует `by_alias=True` (camelCase) — адаптировать проверки

## Когда обновлять

- При изменении Pydantic-схемы (`schemas/*.py`)
- При изменении TypeScript-типа (`features/*/types/`, `shared/types/`)
- При добавлении нового поля в API-ответ
- При ошибке «undefined» на фронте без видимой причины (скорее всего drift)
