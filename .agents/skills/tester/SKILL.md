```skill
# Скилл: Тестировщик (Tester)

## Описание

Комплексное тестирование бэкенда и фронтенда. Модульная архитектура: каждая процедура в отдельном файле `procedures/`. **Загружай ТОЛЬКО нужную процедуру** — не все сразу.

## Ключевые слова активации

- «протестируй», «покрой тестами», «проверь что работает»
- «smoke-тест», «тест API», «проверь импорты», «тест после рефакторинга»
- «тест бизнес-логики», «интеграционные тесты»
- «проверь авторизацию», «auth», «тест безопасности»
- «контрактный тест», «lint API», «проверь fetch вызовы»
- «e2e тест», «playwright», «визуальный тест», «тест UI»
- «model-field тест», «проверь поля модели»
- «посмотри логи», «прочитай логи»

---

## Роутер процедур

**⚠️ Правило: прочитай ТОЛЬКО файл нужной процедуры. Не загружай все.**

| Запрос пользователя | Файл процедуры | Приоритет |
|---|---|---|
| «smoke-тест», «проверь импорты», «тест после рефакторинга» | `procedures/01_smoke.md` | 🔴 P0 |
| «покрой тестами», «интеграционные тесты» | `procedures/02_integration.md` | 🟡 P1 |
| «протестируй папку X», «проверь модуль Y» | `procedures/03_target_area.md` | — |
| «посмотри логи», «что в логах» | `procedures/04_logs.md` | — |
| «тест фронтенда», «tsc», «vitest» | `procedures/05_frontend.md` | — |
| «lint API», «проверь auth headers» | `procedures/06_api_lint.md` | 🔴 P0 |
| «тест API-слоя», «unit-тест services/api» | `procedures/07_api_unit.md` | 🔴 P0 |
| «контрактный тест», «проверь схемы» | `procedures/08_contract.md` | 🟡 P1 |
| «тест безопасности», «auth boundary» | `procedures/09_security.md` | 🟡 P1 |
| «e2e тест», «playwright» | `procedures/10_e2e.md` | 🟢 P2 |
| «визуальный тест», «тест UI», «a11y» | `procedures/11_visual.md` | 🟡 P1 |
| «model-field тест», «проверь поля модели» | `procedures/12_model_field.md` | 🔴 P0 |
| Первый запуск, нет `tests/` | `procedures/00_setup.md` | — |

---

## TODO-driven подход (ключевой паттерн)

**КАЖДАЯ процедура выполняется через TODO-лист** (manage_todo_list). Это даёт:
- **Чекпоинты** — при сбросе контекста видно что сделано и что осталось
- **Итеративность** — один слой за раз, не всё сразу
- **Прозрачность** — пользователь видит прогресс в реальном времени

### Алгоритм работы

```
1. Определить запрос → выбрать процедуру из роутера
2. Прочитать файл процедуры (ТОЛЬКО один файл)
3. Создать TODO-лист из шаблона процедуры (manage_todo_list)
4. Выполнять по одному: in-progress → работа → completed
5. После завершения → вердикт пользователю
6. Если нужна следующая процедура → прочитать её файл → новый TODO-лист
```

### Полное тестирование (при запросе «покрой тестами всё»)

Выполнять СЛОЯМИ. Внутри каждого слоя — **параллельные саб-агенты** (`runSubagent`).
Каждый слой завершается чекпоинтом. При исчерпании контекста — прочитать сводку предыдущего слоя и продолжить.

---

### ⚡ Параллелизация через саб-агентов

**Принцип:** если задачи работают с РАЗНЫМИ файлами/экосистемами и не пишут в один файл — запускай параллельно через `runSubagent`.

**Ограничения:**
- Каждый саб-агент пишет в СВОЮ директорию тестов (не пересекаются)
- Backend (pytest) и Frontend (vitest) — всегда безопасно параллельно
- Статический анализ (чтение файлов) — всегда безопасно параллельно
- E2E (Playwright) — только последовательно (общие серверы)

```
СЛОЙ 1 — Диагностика (~30 сек, 3 параллельных саб-агента + основной поток):
  ⚡ Саб-агент A: Python-импорты → check_imports.py
  ⚡ Саб-агент B: TypeScript → get_errors() или tsc --noEmit
  ⚡ Саб-агент C: API-lint → grep services/api/*.ts на fetch без auth
  🔄 Основной поток: smoke эндпоинтов (нужен uvicorn)
  → Чекпоинт: объединить 4 результата

СЛОЙ 2 — Unit-тесты (~5 мин, 2 параллельных саб-агента):
  ⚡ Саб-агент A [frontend]: API unit → читает services/api/ → пишет tests/api/ → vitest
  ⚡ Саб-агент B [backend]: Model-field → читает models/ → пишет tests/<модуль>/ → pytest
  → Чекпоинт: vitest ✅/❌ + pytest ✅/❌

СЛОЙ 3 — Глубокие тесты (~10 мин, 2 параллельных саб-агента):
  ⚡ Саб-агент A [backend]: Integration → TestClient CRUD/валидация → pytest
  ⚡ Саб-агент B [смешанный]: Contract → читает schemas/*.py + types/*.ts → сравнивает
  → Чекпоинт: integration ✅/❌ + contract ✅/❌

СЛОЙ 4 — Безопасность + UI (~7 мин, 3 параллельных саб-агента):
  ⚡ Саб-агент A [backend]: Security → скан роутеров → auth boundary → pytest
  ⚡ Саб-агент B [frontend]: Visual lint уровни 1-4 → grep + vitest
  ⚡ Саб-агент C [frontend]: A11y audit уровни 5-6 → aria/role/alt → vitest
  → Чекпоинт: security ✅/❌ + visual ✅/❌ + a11y ✅/❌

СЛОЙ 5 — E2E (опционально, последовательно):
  🔄 Playwright (нужны оба сервера)
  → Финальная сводка
```

### Карта безопасности параллелизации

| Процедура | Экосистема | Пишет в | Параллельна с |
|---|---|---|---|
| 01_smoke (imports) | backend | — (read-only) | всеми |
| 01_smoke (tsc) | frontend | — (read-only) | всеми |
| 06_api_lint | frontend | — (read-only) | всеми |
| 07_api_unit | frontend | tests/api/ | 12, 02, 09 |
| 12_model_field | backend | tests/<модуль>/ | 07, 11, 06 |
| 02_integration | backend | tests/integration/ | 07, 08, 11 |
| 08_contract | смешанный | tests/contract/ | 02, 09, 11 |
| 09_security | backend | tests/security/ | 07, 08, 11 |
| 11_visual | frontend | tests/visual/ | 02, 09, 12 |
| 10_e2e | оба | tests/e2e/ | ❌ ни с чем |

### Промпт для саб-агента (шаблон)

При делегировании саб-агенту указывать:
1. **Какую процедуру выполнить** (файл + reference если нужен)
2. **Область** (модуль/папка)
3. **Куда писать тесты** (точный путь)
4. **Что вернуть** (статус ✅/❌ + список проверок + найденные баги)

---

## Порядок приоритетов

```
 1. 🔴 API-lint (auth headers)       — 5 сек
 2. 🔴 Импорты (Python)              — 10 сек
 3. 🔴 Эндпоинты (smoke)             — 15 сек
 4. 🔴 TypeScript (tsc --noEmit)     — 20 сек
 5. 🔴 Model-Field Contract          — 30 сек - 2 мин
 6. 🟡 Unit-тесты API-слоя           — 1-3 мин
 7. 🟡 Интеграционные HTTP-тесты     — 1-5 мин
 8. 🟡 Контрактные тесты             — 2-5 мин
 9. 🟡 Тесты безопасности            — 2-5 мин
10. 🟡 Визуально-компонентные        — 1-5 мин
11. 🟢 E2E (Playwright)              — 5-15 мин
```

---

## Архитектура тестирования

```
БЭКЕНД (backend_python/tests/):
  conftest.py, smoke/, imports/, integration/,
  security/, contract/, <модуль>/, utils/

ФРОНТЕНД (tests/):
  setup.ts, api-lint/, api/, contract/,
  visual/, visual-regression/, <модуль>/
```

> Тесты НЕ трогают прод и предпрод. Только локальная SQLite in-memory.

---

## Правила

1. Тесты НЕ трогают прод/предпрод — только локальная SQLite
2. API-lint ОБЯЗАТЕЛЕН при каждом smoke-тесте
3. Всегда показывать вердикт: что проверено + ✅/❌
4. Smoke перед интеграционными
5. Убедиться что uvicorn запущен перед тестом эндпоинтов
6. `getAuthHeaders(false)` для FormData
7. `StaticPool` ОБЯЗАТЕЛЕН для SQLite in-memory + TestClient
8. Пустая таблица → 200 (не 500), несуществующий ресурс → 404 (не 500)
9. При создании/изменении роутера → model-field contract тест

---

## References (загружать лениво, только при необходимости)

- `references/conftest_template.md` — conftest.py с фикстурами
- `references/integration_template.md` — интеграционный тест
- `references/api_lint_template.md` — Vitest lint для auth headers
- `references/api_unit_test_template.md` — unit-тест API-файла
- `references/contract_test_template.md` — контрактный тест
- `references/security_test_template.md` — тест безопасности
- `references/endpoint_map.md` — карта роутеров
- `references/visual_component_test_template.md` — визуальный тест
- `references/model_field_contract_template.md` — model-field contract

## Scripts

- `scripts/smoke_test.py` — автономный smoke-тест
- `scripts/check_imports.py` — проверка импортов Python
```
