# Процедура: Unit-тесты API-слоя (services/api/*.ts)

**Триггер:** «покрой API тестами», «тест API-слоя», «unit-тест services/api»
**Время:** 1-3 минуты на файл
**Приоритет:** 🔴 P0
**⚡ Параллельность:** БЕЗОПАСНО с backend-тестами. Пишет в `tests/api/`. В СЛОЕ 2 — Саб-агент A параллельно с model-field (Саб-агент B).

**Предыстория:** Из 34 файлов в `services/api/` только 2 имели тесты. Ошибки в формировании запросов (URL, заголовки, тело) не ловились.

## TODO-шаблон

1. [ ] Прочитать целевой файл `services/api/<module>.api.ts`
2. [ ] Составить список всех экспортируемых функций
3. [ ] Для каждой функции определить: URL, метод, заголовки, тело, query-params
4. [ ] Написать тесты: мокнуть `global.fetch`, вызвать функцию, проверить аргументы
5. [ ] Написать тесты на ошибку: fetch → Response(401) → проверить поведение
6. [ ] Создать `tests/api/<module>.api.test.ts`
7. [ ] Запустить `npx vitest run tests/api/<module>.api.test.ts`
8. [ ] Вердикт

## Два паттерна API-вызовов

| Паттерн | Как тестировать |
|---|---|
| `callApi('/endpoint', ..)` | Мокнуть callApi, проверить args |
| `fetch(url, { headers: getAuthHeaders() })` | Мокнуть global.fetch, проверить X-Session-Token |
| `fetch(url, { headers: getAuthHeaders(false) })` | Проверить что НЕТ Content-Type (FormData) |

## Шаблоны

→ `references/api_unit_test_template.md`
