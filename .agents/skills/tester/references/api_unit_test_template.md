# Шаблон: Unit-тест API-файла (Vitest)

## Описание

Unit-тест для файла `services/api/<module>.api.ts`. Мокает `global.fetch` или `callApi`, вызывает каждую экспортированную функцию и проверяет: URL, метод, заголовки, тело запроса.

## Шаблон для файлов с getAuthHeaders + fetch

```typescript
/**
 * Unit-тесты для services/api/<module>.api.ts
 * Проверяет: URL, метод, заголовки, тело для каждой функции.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Мокаем getAuthHeaders
vi.mock('../../shared/utils/apiClient', () => ({
  getAuthHeaders: vi.fn((includeContentType = true) => {
    const headers: Record<string, string> = {
      'X-Session-Token': 'test-session-token',
    };
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }),
}));

// Мокаем config
vi.mock('../../shared/config', () => ({
  API_BASE_URL: 'http://localhost:8000/api',
}));

// Импортируем ПОСЛЕ моков
import {
  функция1,
  функция2,
  функция3,
} from '../../services/api/<module>.api';

// Хелпер: создать моковый Response
function mockResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers(),
  } as unknown as Response;
}

describe('<module>.api.ts', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn(() => Promise.resolve(mockResponse({})));
    global.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =====================================================================
  // функция1: GET-запрос
  // =====================================================================
  describe('функция1', () => {
    it('отправляет GET на правильный URL', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ items: [] }));

      await функция1(123);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/endpoint/123'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('включает X-Session-Token в заголовки', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({}));

      await функция1(123);

      const callArgs = fetchSpy.mock.calls[0];
      const headers = callArgs[1]?.headers;
      expect(headers).toHaveProperty('X-Session-Token', 'test-session-token');
    });

    it('передаёт query-параметры', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({}));

      await функция1(123, { page: 2, limit: 10 });

      const url = fetchSpy.mock.calls[0][0];
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
    });
  });

  // =====================================================================
  // функция2: POST-запрос (JSON)
  // =====================================================================
  describe('функция2', () => {
    it('отправляет POST с JSON-телом', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ id: 1 }));
      const payload = { name: 'test', value: 42 };

      await функция2(payload);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/endpoint'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        })
      );
    });

    it('включает Content-Type: application/json', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({}));

      await функция2({ name: 'test' });

      const headers = fetchSpy.mock.calls[0][1]?.headers;
      expect(headers).toHaveProperty('Content-Type', 'application/json');
    });
  });

  // =====================================================================
  // функция3: POST-запрос (FormData)
  // =====================================================================
  describe('функция3', () => {
    it('отправляет FormData БЕЗ Content-Type (браузер ставит boundary)', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ url: 'uploaded.jpg' }));
      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.jpg');

      await функция3(formData);

      const headers = fetchSpy.mock.calls[0][1]?.headers;
      // getAuthHeaders(false) — без Content-Type
      expect(headers).toHaveProperty('X-Session-Token');
      expect(headers).not.toHaveProperty('Content-Type');
    });
  });

  // =====================================================================
  // Обработка ошибок
  // =====================================================================
  describe('обработка ошибок', () => {
    it('бросает ошибку при 500', async () => {
      fetchSpy.mockResolvedValueOnce(mockResponse({ detail: 'Server Error' }, 500));

      await expect(функция1(123)).rejects.toThrow();
    });

    it('бросает ошибку при сетевой ошибке', async () => {
      fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(функция1(123)).rejects.toThrow('Failed to fetch');
    });
  });
});
```

## Шаблон для файлов с callApi

```typescript
/**
 * Unit-тесты для services/api/<module>.api.ts (callApi)
 * callApi уже проверен в apiClient_auth.test.ts на наличие X-Session-Token.
 * Здесь проверяем только: правильный URL, метод, тело, query-params.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Мокаем callApi
const mockCallApi = vi.fn();
vi.mock('../../shared/utils/apiClient', () => ({
  callApi: mockCallApi,
}));

import { функция1, функция2 } from '../../services/api/<module>.api';

describe('<module>.api.ts (callApi)', () => {
  beforeEach(() => {
    mockCallApi.mockReset();
    mockCallApi.mockResolvedValue({ data: {} });
  });

  it('функция1: вызывает callApi с правильными аргументами', async () => {
    await функция1(123, 'param');

    expect(mockCallApi).toHaveBeenCalledWith(
      '/endpoint/123?param=param',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('функция2: POST с JSON-телом', async () => {
    const payload = { name: 'test' };
    await функция2(payload);

    expect(mockCallApi).toHaveBeenCalledWith(
      '/endpoint',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  });
});
```

## Размещение

```
tests/api/<module>.api.test.ts
```

## Как адаптировать

1. Заменить `<module>` на реальное имя модуля
2. Прочитать `services/api/<module>.api.ts` — извлечь все экспортированные функции
3. Для каждой функции определить:
   - HTTP-метод (GET/POST/PUT/DELETE)
   - URL-паттерн
   - Тело (JSON или FormData)
   - Query-параметры
4. Определить паттерн: `callApi` или `fetch + getAuthHeaders`
5. Использовать соответствующий шаблон мока

## Запуск

```bash
npx vitest run tests/api/<module>.api.test.ts
```

## Массовая генерация

Для покрытия всех 34 файлов в `services/api/`:
1. Получить список: `ls services/api/*.ts`
2. Для каждого файла:
   a. Прочитать экспортированные функции
   b. Определить паттерн (callApi vs fetch)
   c. Сгенерировать тест по шаблону
3. Целевой порядок (по приоритету):
   - Сначала файлы с `fetch` (бывшие проблемные): messages, vk, media, market, dialog_labels, messages_stats, message_subscriptions, storyPublish, bulk_edit, lists, post
   - Потом файлы с `callApi`: ai, auth, automations, project, tag, note, batch, и т.д.
