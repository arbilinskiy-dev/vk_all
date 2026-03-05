# Шаблон: API-lint тест (Vitest)

## Описание

Статический тест, который проверяет что **все fetch() вызовы** в `services/api/*.ts` используют `getAuthHeaders()` или `callApi()`. Ловит баг «голый fetch без X-Session-Token» за 0.5 секунды.

## Vitest-тест

```typescript
/**
 * API-lint: проверка что все fetch() в services/api/ используют авторизацию.
 *
 * Этот тест читает исходный код API-файлов и проверяет паттерны:
 * - Каждый fetch() должен использовать getAuthHeaders() или быть обёрнут в callApi()
 * - FormData-загрузки должны использовать getAuthHeaders(false)
 * - Исключение: management.api.ts (/version — публичный эндпоинт)
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Путь к папке services/api/ относительно корня проекта
const API_DIR = path.resolve(__dirname, '../../services/api');

// Файлы-исключения (содержат только публичные эндпоинты)
const EXCLUDED_FILES = ['management.api.ts'];

// Получить все .ts файлы в services/api/
function getApiFiles(): string[] {
  return fs.readdirSync(API_DIR)
    .filter(f => f.endsWith('.ts') && !EXCLUDED_FILES.includes(f));
}

// Найти все строки с fetch() и проверить контекст ±4 строки
function findBareFetchCalls(filePath: string): { line: number; text: string }[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const problems: { line: number; text: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    // Ищем строки с fetch( но не import fetch или комментарии
    if (/\bfetch\s*\(/.test(lines[i]) && !/^\s*\/\//.test(lines[i]) && !/import/.test(lines[i])) {
      // Проверяем блок ±4 строки на наличие getAuthHeaders или callApi
      const blockStart = Math.max(0, i - 2);
      const blockEnd = Math.min(lines.length - 1, i + 4);
      const block = lines.slice(blockStart, blockEnd + 1).join(' ');

      if (!block.includes('getAuthHeaders') && !block.includes('callApi')) {
        problems.push({ line: i + 1, text: lines[i].trim() });
      }
    }
  }

  return problems;
}

describe('API-lint: auth headers', () => {
  const apiFiles = getApiFiles();

  it('должен найти API-файлы для проверки', () => {
    expect(apiFiles.length).toBeGreaterThan(0);
  });

  apiFiles.forEach(fileName => {
    it(`${fileName}: все fetch() используют getAuthHeaders или callApi`, () => {
      const filePath = path.join(API_DIR, fileName);
      const problems = findBareFetchCalls(filePath);

      if (problems.length > 0) {
        const details = problems
          .map(p => `  строка ${p.line}: ${p.text}`)
          .join('\n');
        expect.fail(
          `${fileName} содержит ${problems.length} fetch() БЕЗ auth headers:\n${details}`
        );
      }
    });
  });

  it('management.api.ts: исключён (публичный /version)', () => {
    // Этот файл намеренно использует bare fetch для /version
    expect(EXCLUDED_FILES).toContain('management.api.ts');
  });
});
```

## Размещение

```
tests/api-lint/api_auth_lint.test.ts
```

## Запуск

```bash
cd "c:\Users\nikita79882\Desktop\vk planer code\12.02.2026"
npx vitest run tests/api-lint/api_auth_lint.test.ts
```

## Когда запускать

- **Каждый smoke-тест** (Процедура 2) — добавить как шаг 2.5
- После добавления нового файла в `services/api/`
- После рефакторинга API-слоя
- В CI/CD pipeline (когда появится)

## Что делать при провале

1. Открыть указанный файл и строку
2. Заменить `fetch(url, { headers: { 'Content-Type': 'application/json' } })` на:
   - `fetch(url, { headers: getAuthHeaders() })` — для JSON
   - `fetch(url, { headers: getAuthHeaders(false) })` — для FormData
3. Или использовать `callApi()` если подходит по логике
4. Добавить импорт: `import { getAuthHeaders } from '../../shared/utils/apiClient'`
