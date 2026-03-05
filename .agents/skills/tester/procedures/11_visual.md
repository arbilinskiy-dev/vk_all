# Процедура: Визуально-компонентное тестирование (UI Design System)

**Триггер:** «визуальный тест», «тест UI», «тест дизайн-системы», «проверь визуал», «тест компонентов», «a11y тест», «visual test»
**Время:** 1-5 минут на модуль
**Приоритет:** 🟡 P1
**⚡ Параллельность:** БЕЗОПАСНО с backend-тестами. Пишет в `tests/visual/`. В СЛОЕ 4 — Саб-агент B (уровни 1-4) + Саб-агент C (уровни 5-6 a11y) параллельно с security (A).

## 7 уровней проверки

| Уровень | Что | Инструмент |
|---|---|---|
| 1 | Tailwind Design Tokens (цвета, размеры, скругления) | Vitest + className |
| 2 | Запреты (нет hex/rgb, нет inline-style, нет alert) | grep / статический lint |
| 3 | Состояния (default → hover → disabled → loading) | Vitest + render |
| 4 | Анимации (animate-pulse, animate-spin, fade-in) | Vitest + querySelector |
| 5 | Responsive (sm/md/lg классы) | Vitest + className.toMatch |
| 6 | A11y (aria, role, tabIndex, alt) | Vitest + getByRole |
| 7 | Visual Regression (pixel-perfect) | Playwright + toHaveScreenshot |

## TODO-шаблон (итеративный, по уровням)

**Итерация 1 — Уровни 1-2 (быстрые, статические):**
1. [ ] Прочитать исходный код компонента (.tsx)
2. [ ] Проверить Tailwind-классы vs эталоны из docs/ui-kit/
3. [ ] Проверить запреты: hex/rgb, inline-style, alert/confirm
4. [ ] Написать тесты → `tests/visual/<модуль>/<Компонент>.visual.test.tsx`
5. [ ] Вердикт Уровней 1-2

**Итерация 2 — Уровни 3-4 (состояния, анимации):**
1. [ ] Проверить состояния: default, disabled (opacity-50), loading (animate-spin)
2. [ ] Проверить анимации: скелетоны, спиннеры, fade-in, transition
3. [ ] Дописать тесты
4. [ ] Вердикт Уровней 3-4

**Итерация 3 — Уровни 5-6 (responsive, a11y):**
1. [ ] Проверить responsive-классы (sm:/md:/lg:)
2. [ ] Проверить a11y: кнопки с aria-label, img с alt, modal с role=dialog
3. [ ] Дописать тесты
4. [ ] Вердикт Уровней 5-6

**Итерация 4 — Уровень 7 (Playwright VR, опционально):**
1. [ ] Убедиться что фронтенд запущен
2. [ ] Написать Playwright-тест в `tests/visual-regression/`
3. [ ] Первый запуск: `npx playwright test --update-snapshots` (baseline)
4. [ ] Вердикт Уровня 7

## Структура файлов тестов

```
tests/visual/<модуль>/<Компонент>.visual.test.tsx
tests/visual/design-system-lint.test.ts
tests/visual/a11y-audit.test.tsx
tests/visual-regression/<модуль>.vr.spec.ts
```

## Связь с uiux-refactor

uiux-refactor находит → исправляет (однократно). Визуальные тесты предотвращают регрессию (навсегда).

## Шаблоны

→ `references/visual_component_test_template.md`

## Делегирование (⚡ параллельно)

| Саб-агент | Задача |
|---|---|
| Visual lint | Найти хардкод цветов, inline-стили, alert/confirm во всех .tsx |
| A11y audit | Найти кнопки без aria-label, img без alt, modal без role=dialog |
