# Процедура: Контрактные тесты (схемы фронт ↔ бэк)

**Триггер:** «контрактный тест», «проверь схемы», «drift фронт-бэк», «контракт API»
**Время:** 2-5 минут на модуль
**Приоритет:** 🟡 P1
**⚡ Параллельность:** БЕЗОПАСНО с backend-тестами. Пишет в `tests/contract/`. В СЛОЕ 3 — Саб-агент B параллельно с integration (Саб-агент A). Внутри себя: сбор Pydantic и TypeScript-типов — через 2 параллельных read_file батча.

## Проблема

Бэкенд возвращает `{ total_count: 5 }`, фронтенд ожидает `{ totalCount: 5 }` → `undefined`. Или бэкенд добавил обязательное поле, фронтенд не обновлён → crash.

## TODO-шаблон

1. [ ] Определить модуль для проверки
2. [ ] ⚡ Саб-агент A: Прочитать Pydantic-схемы (schemas/<module>.py) → поля, типы, optional
3. [ ] ⚡ Саб-агент B: Прочитать TypeScript-типы (features/<module>/types/ или shared/types/)
4. [ ] Сравнить поля: наличие, типы, optional/required, snake_case↔camelCase
5. [ ] Написать контрактный тест (Python через TestClient + TypeScript через Vitest)
6. [ ] Запустить → вердикт

## Что проверяет

1. Pydantic Response-схема совпадает с TypeScript-типом
2. Поля, типы, optional/required не расходятся
3. snake_case ↔ camelCase трансформируются корректно
4. Реальный ответ TestClient парсится фронтенд-типами

## Делегирование (⚡ параллельно)

| Саб-агент | Задача |
|---|---|
| A: Бэкенд | Прочитать `schemas/<module>.py` → поля, типы, Optional, default. Формат JSON |
| B: Фронтенд | Прочитать `features/<module>/types/` → interface/type → поля, типы. Формат JSON |

## Шаблоны

→ `references/contract_test_template.md`
