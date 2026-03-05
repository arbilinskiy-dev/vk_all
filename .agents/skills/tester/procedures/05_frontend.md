# Процедура: Фронтенд тестирование

**Триггер:** «тест фронтенда», «проверь типы», «tsc», «vitest»
**Время:** 1-5 минут

## TODO-шаблон

1. [ ] Быстрая проверка типов: `tsc --noEmit`
2. [ ] Проверка сборки: `npm run build`
3. [ ] Unit-тесты (если есть): `npx vitest run <путь>`
4. [ ] Вердикт

## Быстрая проверка (без vitest)

```bash
cd "c:\Users\nikita79882\Desktop\vk planer code\12.02.2026"
npx tsc --noEmit
npm run build
```

## Расширенная проверка (vitest — уже установлен)

Vitest v4.0.18 + @testing-library/react 16.3.2 уже установлены.

```bash
npx vitest run tests/<модуль>/
```

Для нового теста — писать в `tests/<модуль>/*.test.tsx` рядом с компонентами.
