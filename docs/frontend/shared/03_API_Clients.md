# API-клиенты (services/api/)

## Обзор

Папка `services/api/` содержит типизированные API-клиенты для взаимодействия с бэкендом. Каждый файл соответствует определённому домену функционала.

---

## Структура файлов

```
services/api/
├── ai.api.ts              # AI генерация текстов
├── ai_preset.api.ts       # Шаблоны AI-инструкций
├── ai_token.api.ts        # Управление AI-токенами
├── auth.api.ts            # Аутентификация
├── automations.api.ts     # Автоматизации (сторис)
├── automations_ai.api.ts  # AI-посты автоматизации
├── automations_general.api.ts  # Общие конкурсы
├── bulk_edit.api.ts       # Массовое редактирование
├── contestV2.api.ts       # Конкурс 2.0
├── global_variable.api.ts # Глобальные переменные
├── lists.api.ts           # Системные списки
├── management.api.ts      # Управление БД
├── market.api.ts          # Товары
├── media.api.ts           # Галерея/медиа
├── note.api.ts            # Заметки
├── post.api.ts            # Посты
├── project.api.ts         # Проекты
├── project_context.api.ts # Контекст проекта
├── stories.api.ts         # Сторис
├── system_accounts.api.ts # Системные аккаунты
├── tag.api.ts             # Теги
└── vk.api.ts              # VK методы
```

---

## Паттерн API-клиента

Каждый API-клиент экспортирует типизированные функции:

```typescript
// Пример: bulk_edit.api.ts

import { callApi } from '../../shared/utils/apiClient';
import { API_BASE_URL } from '../../shared/config';

// Типы запросов и ответов
export interface BulkEditSearchRequest {
  sourcePost: SourcePostInfo;
  matchCriteria: MatchCriteria;
  // ...
}

export interface BulkEditSearchResponse {
  matchedPosts: FoundPost[];
  stats: SearchStats;
}

// Функции API
export async function searchPosts(
  request: BulkEditSearchRequest
): Promise<BulkEditSearchResponse> {
  return callApi<BulkEditSearchResponse>(
    `${API_BASE_URL}/bulkEdit/search`,
    { method: 'POST', body: JSON.stringify(request) }
  );
}

export async function applyBulkEdit(
  request: BulkEditApplyRequest
): Promise<BulkEditApplyResponse> {
  return callApi<BulkEditApplyResponse>(
    `${API_BASE_URL}/bulkEdit/apply`,
    { method: 'POST', body: JSON.stringify(request) }
  );
}

export async function getTaskStatus(
  taskId: string
): Promise<BulkEditTaskStatus> {
  return callApi<BulkEditTaskStatus>(
    `${API_BASE_URL}/bulkEdit/status/${taskId}`
  );
}
```

---

## Ключевые API-клиенты

### `bulk_edit.api.ts`

Массовое редактирование постов.

| Функция | Описание |
|---------|----------|
| `searchPosts(request)` | Поиск совпадающих постов |
| `applyBulkEdit(request)` | Применение изменений |
| `getTaskStatus(taskId)` | Статус фоновой задачи |
| `getWorkerStats()` | Статистика воркеров |

---

### `contestV2.api.ts`

Управление конкурсами 2.0.

| Функция | Описание |
|---------|----------|
| `list({ project_id })` | Список конкурсов проекта |
| `get({ contest_id })` | Получить конкурс по ID |
| `create(data)` | Создать конкурс |
| `update({ contest_id, contest })` | Обновить конкурс |
| `delete({ contest_id })` | Удалить конкурс |

---

### `ai_token.api.ts`

Управление AI-токенами.

| Функция | Описание |
|---------|----------|
| `getAll()` | Все токены |
| `updateAll({ tokens })` | Массовое обновление |
| `delete({ tokenId })` | Удаление токена |
| `verify()` | Проверка валидности всех токенов |

---

### `system_accounts.api.ts`

Системные аккаунты VK.

| Функция | Описание |
|---------|----------|
| `getAll()` | Все аккаунты |
| `addByUrls({ urls })` | Добавить по ссылкам |
| `update(payload)` | Обновить аккаунт |
| `delete({ accountId })` | Удалить аккаунт |
| `verifyToken({ token })` | Проверить токен |
| `getLogs(payload)` | Логи использования |
| `getStats({ accountId })` | Статистика аккаунта |

---

## Базовый клиент

Все API-функции используют общий `callApi` из `shared/utils/apiClient.ts`:

```typescript
// shared/utils/apiClient.ts

export async function callApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error.detail || 'Unknown error', response.status);
  }

  return response.json();
}
```

---

## Обработка ошибок

```typescript
import { searchPosts } from '../services/api/bulk_edit.api';

try {
  const result = await searchPosts(request);
  // Обработка результата
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 422) {
      // Ошибка валидации
      showValidationErrors(error.details);
    } else if (error.status === 404) {
      // Не найдено
      showNotFound();
    } else {
      // Общая ошибка
      showError(error.message);
    }
  }
}
```

---

## См. также

- [API Communication](../03_API_COMMUNICATION.md) — паттерны взаимодействия
- [API Client Architecture](./01_Api_Client_Architecture.md) — архитектура HTTP-клиента
