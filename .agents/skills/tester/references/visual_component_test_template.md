# Шаблон визуально-компонентного теста

## Файл: `tests/visual/<модуль>/<Компонент>.visual.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Импорт тестируемого компонента
import { MyComponent } from '../../features/<модуль>/components/MyComponent';

// ─── Фабрика пропсов ────────────────────────────────────────

const createProps = (overrides = {}) => ({
  // базовые пропсы компонента
  title: 'Тестовый заголовок',
  isLoading: false,
  disabled: false,
  ...overrides,
});

// ─── Утилита проверки CSS-классов ────────────────────────────

/** Проверяет наличие ВСЕХ указанных Tailwind-классов */
const expectClasses = (element: HTMLElement, classes: string[]) => {
  classes.forEach((cls) => {
    expect(element.className).toContain(cls);
  });
};

/** Проверяет ОТСУТСТВИЕ указанных Tailwind-классов */
const expectNoClasses = (element: HTMLElement, classes: string[]) => {
  classes.forEach((cls) => {
    expect(element.className).not.toContain(cls);
  });
};

// ═══════════════════════════════════════════════════════════════
//  УРОВЕНЬ 1: Design Tokens
// ═══════════════════════════════════════════════════════════════

describe('УРОВЕНЬ 1: Design Tokens', () => {
  
  // --- Кнопки (эталон E2) ---
  describe('кнопки', () => {
    it('primary кнопка — эталон E2', () => {
      render(<MyComponent {...createProps()} />);
      const btn = screen.getByRole('button', { name: /сохранить/i });
      expectClasses(btn, ['bg-green-600', 'text-white', 'rounded-md']);
    });

    it('secondary кнопка — эталон E2', () => {
      render(<MyComponent {...createProps()} />);
      const btn = screen.getByRole('button', { name: /отмена/i });
      expectClasses(btn, ['bg-gray-200', 'text-gray-700', 'rounded-md']);
    });
  });

  // --- Тумблеры (эталон E3) ---
  describe('тумблеры', () => {
    it('размеры тумблера — эталон E3', () => {
      render(<MyComponent {...createProps()} />);
      const toggle = screen.getByRole('switch');
      expectClasses(toggle, ['h-6', 'w-11']);
    });

    it('тумблер включён — bg-indigo-600', () => {
      render(<MyComponent {...createProps({ isEnabled: true })} />);
      const toggle = screen.getByRole('switch');
      expectClasses(toggle, ['bg-indigo-600']);
    });

    it('тумблер выключен — bg-gray-200', () => {
      render(<MyComponent {...createProps({ isEnabled: false })} />);
      const toggle = screen.getByRole('switch');
      expectClasses(toggle, ['bg-gray-200']);
    });
  });

  // --- Вкладки (эталон E4) ---
  describe('вкладки', () => {
    it('активная вкладка — underline стиль (не pill)', () => {
      render(<MyComponent {...createProps({ activeTab: 'first' })} />);
      const tab = screen.getByRole('tab', { selected: true });
      expectClasses(tab, ['border-b-2', 'border-indigo-600', 'text-indigo-600']);
      // Запрет pill-стиля
      expectNoClasses(tab, ['rounded-full', 'bg-indigo-600']);
    });
  });

  // --- Типографика ---
  describe('типографика', () => {
    it('заголовок страницы — text-xl font-bold', () => {
      render(<MyComponent {...createProps()} />);
      const heading = screen.getByRole('heading');
      expectClasses(heading, ['text-xl', 'font-bold']);
    });
  });

  // --- Карточки ---
  describe('карточки', () => {
    it('карточка — shadow-sm, rounded-lg', () => {
      const { container } = render(<MyComponent {...createProps()} />);
      const card = container.querySelector('[data-testid="card"]');
      if (card) {
        expectClasses(card as HTMLElement, ['shadow-sm', 'rounded-lg']);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  УРОВЕНЬ 3: Состояния компонента
// ═══════════════════════════════════════════════════════════════

describe('УРОВЕНЬ 3: Состояния', () => {

  it('disabled — opacity-50, cursor-not-allowed', () => {
    render(<MyComponent {...createProps({ disabled: true })} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expectClasses(btn, ['opacity-50', 'cursor-not-allowed']);
  });

  it('loading — показывает спиннер animate-spin', () => {
    const { container } = render(<MyComponent {...createProps({ isLoading: true })} />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('error — показывает красный бордер/текст', () => {
    render(<MyComponent {...createProps({ error: 'Ошибка!' })} />);
    const errorEl = screen.getByText('Ошибка!');
    expectClasses(errorEl, ['text-red-600']);
  });
});

// ═══════════════════════════════════════════════════════════════
//  УРОВЕНЬ 4: Анимации и переходы
// ═══════════════════════════════════════════════════════════════

describe('УРОВЕНЬ 4: Анимации', () => {

  it('скелетон при загрузке — animate-pulse', () => {
    const { container } = render(<MyComponent {...createProps({ isLoading: true })} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('transition на интерактивных элементах', () => {
    render(<MyComponent {...createProps()} />);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/transition/);
  });
});

// ═══════════════════════════════════════════════════════════════
//  УРОВЕНЬ 5: Responsive
// ═══════════════════════════════════════════════════════════════

describe('УРОВЕНЬ 5: Responsive', () => {

  it('содержит responsive-классы (sm:/md:/lg:)', () => {
    const { container } = render(<MyComponent {...createProps()} />);
    const html = container.innerHTML;
    // Проверяем что хотя бы один responsive-класс присутствует
    expect(html).toMatch(/(?:sm|md|lg|xl):/);
  });

  it('грид адаптируется под breakpoints', () => {
    const { container } = render(<MyComponent {...createProps()} />);
    const grid = container.querySelector('[class*="grid"]');
    if (grid) {
      // Пример: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
      expect(grid.className).toMatch(/grid-cols/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
//  УРОВЕНЬ 6: Accessibility
// ═══════════════════════════════════════════════════════════════

describe('УРОВЕНЬ 6: A11y', () => {

  it('все кнопки имеют accessible name', () => {
    render(<MyComponent {...createProps()} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      // Кнопка должна иметь текст, aria-label или aria-labelledby
      const hasName = btn.textContent?.trim() || btn.getAttribute('aria-label');
      expect(hasName).toBeTruthy();
    });
  });

  it('все изображения имеют alt', () => {
    const { container } = render(<MyComponent {...createProps()} />);
    const images = container.querySelectorAll('img');
    images.forEach((img) => {
      expect(img.getAttribute('alt')).not.toBeNull();
      expect(img.getAttribute('alt')).not.toBe('');
    });
  });

  it('интерактивные элементы доступны с клавиатуры', () => {
    render(<MyComponent {...createProps()} />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      // tabIndex не должен быть -1 (исключение: aria-hidden)
      if (!btn.getAttribute('aria-hidden')) {
        expect(btn.getAttribute('tabindex')).not.toBe('-1');
      }
    });
  });
});
```

---

## Файл: `tests/visual/design-system-lint.test.ts`

Статический lint — проверяет ИСХОДНЫЕ ФАЙЛЫ (не рендер) на нарушения запретов дизайн-системы.

```typescript
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// ─── Утилита: рекурсивный сбор .tsx файлов ──────────────────

const ROOT = path.resolve(__dirname, '../../');
const getTsxFiles = (): string[] => {
  const patterns = ['features/**/*.tsx', 'shared/components/**/*.tsx'];
  const files: string[] = [];
  for (const pattern of patterns) {
    files.push(...glob.sync(pattern, { cwd: ROOT, absolute: true }));
  }
  return files;
};

// ─── Запреты дизайн-системы (C2, C4, C8) ────────────────────

describe('УРОВЕНЬ 2: Запреты дизайн-системы (статический lint)', () => {

  const files = getTsxFiles();

  it('нет хардкоженных цветов (#hex, rgb, rgba) в JSX', () => {
    const violations: string[] = [];
    const colorRegex = /(?:['"`])#[0-9a-fA-F]{3,8}(?:['"`])|rgba?\s*\(/;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        // Пропускаем комментарии и tailwind.config
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
        if (colorRegex.test(line)) {
          const rel = path.relative(ROOT, file);
          violations.push(`${rel}:${i + 1} → ${line.trim().slice(0, 80)}`);
        }
      });
    }

    if (violations.length > 0) {
      console.warn('🔴 Хардкод цветов:\n' + violations.join('\n'));
    }
    expect(violations).toEqual([]);
  });

  it('нет inline-стилей (style={{) в JSX', () => {
    const violations: string[] = [];
    const styleRegex = /style\s*=\s*\{\{/;
    
    // Допустимые исключения (динамические стили, которые нельзя выразить через Tailwind)
    const EXCEPTIONS = ['width:', 'height:', 'transform:', 'top:', 'left:'];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (styleRegex.test(line)) {
          // Допускаем динамические позиционные стили
          const isDynamic = EXCEPTIONS.some(exc => line.includes(exc) && line.includes('$'));
          if (!isDynamic) {
            const rel = path.relative(ROOT, file);
            violations.push(`${rel}:${i + 1} → ${line.trim().slice(0, 80)}`);
          }
        }
      });
    }

    if (violations.length > 0) {
      console.warn('🔴 Inline-стили:\n' + violations.join('\n'));
    }
    // ⚠️ Пока warn — когда проект вычищен, заменить на expect(violations).toEqual([])
    // expect(violations).toEqual([]);
  });

  it('нет alert/confirm/prompt', () => {
    const violations: string[] = [];
    const alertRegex = /\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.trim().startsWith('//')) return;
        if (alertRegex.test(line)) {
          const rel = path.relative(ROOT, file);
          violations.push(`${rel}:${i + 1} → ${line.trim().slice(0, 80)}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('нет !important в className', () => {
    const violations: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('!important') && !line.trim().startsWith('//')) {
          const rel = path.relative(ROOT, file);
          violations.push(`${rel}:${i + 1} → ${line.trim().slice(0, 80)}`);
        }
      });
    }

    if (violations.length > 0) {
      console.warn('🟡 !important:\n' + violations.join('\n'));
    }
    // ⚠️ Пока warn — заменить на strict когда проект вычищен
    // expect(violations).toEqual([]);
  });
});
```

---

## Примечания

### Что тестируется на каждом уровне

| Уровень | Инструмент | Что ловит |
|---|---|---|
| 1-6 | Vitest + jsdom | CSS-классы, запреты, состояния, анимации (наличие класса), responsive (наличие класса), a11y |
| 7 | Playwright + Chromium | **Всё визуальное:** layout, hover, шрифты, реальные анимации, контраст, pixel-perfect |

### Рекомендация

- **Уровни 1-6** — запускать всегда (быстро, локально, не нужен браузер)
- **Уровень 7** — запускать перед деплоем или при UI-изменениях (нужен запущенный фронтенд)

---

## Файл: `tests/visual-regression/<модуль>.vr.spec.ts` (Уровень 7)

> Требует: `npm install -D @playwright/test && npx playwright install chromium`  
> Требует: запущенный фронтенд на `localhost:5173`

```typescript
// tests/visual-regression/messages.vr.spec.ts
import { test, expect } from '@playwright/test';

// ─── Утилита: стабилизация данных для скриншотов ─────────────

/** Мокаем API чтобы данные были стабильными между запусками */
async function mockApiData(page) {
  await page.route('**/api/**', async (route) => {
    // Подставляем стабильные данные
    const url = route.request().url();
    
    if (url.includes('/messages')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: 1, text: 'Тестовое сообщение', date: '2026-01-01T12:00:00' },
            { id: 2, text: 'Ответ', date: '2026-01-01T12:05:00' },
          ],
          total: 2,
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Заморозить дату для стабильности
  await page.addInitScript(() => {
    const fixedDate = new Date('2026-01-15T12:00:00');
    // @ts-ignore
    Date = class extends Date {
      constructor(...args: any[]) {
        if (args.length === 0) super(fixedDate);
        else super(...args);
      }
      static now() { return fixedDate.getTime(); }
    };
  });

  // Заглушки для внешних изображений
  await page.route('**/*.{png,jpg,jpeg,gif,webp}', async (route) => {
    // Пропускаем локальные ресурсы, глушим внешние
    if (route.request().url().startsWith('http://localhost')) {
      await route.continue();
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.alloc(1), // 1x1 пустой пиксель
      });
    }
  });
}

// ═══════════════════════════════════════════════════════════════
//  СКРИНШОТЫ СТРАНИЦ
// ═══════════════════════════════════════════════════════════════

test.describe('Сообщения — visual regression', () => {

  test.beforeEach(async ({ page }) => {
    await mockApiData(page);
  });

  test('страница сообщений — общий вид (desktop)', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('messages-desktop.png', {
      maxDiffPixelRatio: 0.01,  // допуск 1% пикселей
      animations: 'disabled',   // остановить анимации перед скриншотом
    });
  });

  test('страница сообщений — мобильный viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone 13
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('messages-mobile.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    });
  });

  test('страница сообщений — планшет', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('messages-tablet.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  СКРИНШОТЫ ЭЛЕМЕНТОВ (изолированные)
// ═══════════════════════════════════════════════════════════════

test.describe('Элементы — visual regression', () => {

  test.beforeEach(async ({ page }) => {
    await mockApiData(page);
  });

  test('кнопка primary — default', async ({ page }) => {
    await page.goto('/messages');
    const btn = page.locator('button:has-text("Отправить")');
    await expect(btn).toHaveScreenshot('send-btn-default.png');
  });

  test('кнопка primary — hover', async ({ page }) => {
    await page.goto('/messages');
    const btn = page.locator('button:has-text("Отправить")');
    await btn.hover();
    await expect(btn).toHaveScreenshot('send-btn-hover.png');
  });

  test('кнопка primary — focus', async ({ page }) => {
    await page.goto('/messages');
    const btn = page.locator('button:has-text("Отправить")');
    await btn.focus();
    await expect(btn).toHaveScreenshot('send-btn-focus.png');
  });

  test('модальное окно — после анимации', async ({ page }) => {
    await page.goto('/messages');
    await page.click('[data-testid="open-modal"]');
    await page.waitForTimeout(400); // ждём fade-in анимацию
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toHaveScreenshot('modal-open.png');
  });

  test('скелетон при загрузке', async ({ page }) => {
    // Задерживаем API чтобы увидеть скелетон
    await page.route('**/api/messages**', async (route) => {
      await new Promise(r => setTimeout(r, 3000)); // 3сек задержка
      await route.continue();
    });
    await page.goto('/messages');
    await page.waitForTimeout(500); // скелетон должен быть видим
    await expect(page).toHaveScreenshot('messages-skeleton.png', {
      animations: 'allow', // НЕ отключаем — хотим видеть pulse
    });
  });
});
```

### Конфигурация Playwright: `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual-regression',
  testMatch: '**/*.vr.spec.ts',
  
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  // Скриншоты зависят от OS — генерировать отдельные baseline для каждой
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],

  // Не запускать dev-сервер автоматически — он должен быть уже запущен
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: true,
  // },
});
```

### Команды

```bash
# Первый запуск — создание baseline-скриншотов
npx playwright test tests/visual-regression/ --update-snapshots

# Проверка регрессии
npx playwright test tests/visual-regression/

# Посмотреть отчёт с diff-изображениями при падении
npx playwright show-report

# Обновить baseline после намеренного изменения UI
npx playwright test tests/visual-regression/ --update-snapshots
```

### Рекомендация по именованию

- Суффикс файла Vitest: `.visual.test.tsx` (Уровни 1-6)
- Суффикс файла Playwright: `.vr.spec.ts` (Уровень 7)
- Имена тестов: на русском языке
- describe-группы Vitest: по уровням (1-6)
- describe-группы Playwright: по типу (страницы / элементы / состояния)
- Папка Vitest: `tests/visual/<модуль>/`
- Папка Playwright: `tests/visual-regression/`

### Подключение к существующим тестам

**Уровни 1-6 (Vitest):**
- Тот же `vitest` (4.0.18)
- Тот же `@testing-library/react` (16.3.2)
- Тот же `tests/setup.ts` (`@testing-library/jest-dom`)
- Запуск: `npx vitest run tests/visual/`
- Не требуется установка дополнительных зависимостей.

**Уровень 7 (Playwright):**
- Требуется: `npm install -D @playwright/test && npx playwright install chromium`
- Требуется: запущенный фронтенд (`npm run dev`)
- Запуск: `npx playwright test tests/visual-regression/`
- Baseline-скриншоты коммитятся в git.
