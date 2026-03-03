---
name: sandbox
description: Изолированная среда для экспериментов с VK API. Каждый тест — самостоятельная цепочка вызовов API с логированием результатов. Триггеры — «песочница», «sandbox», «тест VK API», «запиши итоги теста», «итоги тестирования», «результаты теста», «обнови итоги песочницы», «допиши в итоги», «новый тест в песочнице».
---

# Скилл: Песочница (Sandbox) — Тестирование VK API

## Описание

Изолированная среда для экспериментов с VK API. Каждый тест — самостоятельная цепочка вызовов API с логированием результатов. Модуль **полностью изолирован** от основного кода приложения.

## MCP-ускорение

При работе с песочницей активно использовать MCP-серверы:

| Задача | MCP-инструмент | Пример |
|---|---|---|
| Быстрый тест VK API метода | `mcp_fetch` | GET `https://api.vk.com/method/wall.get?owner_id=-xxx&v=5.199&access_token=xxx` |
| Проверить документацию VK API через интернет | `mcp_brave-search` (если подключён) | Поиск «VK API stories.getById parameters» |
| Уточнить API FastAPI/Pydantic | `context7` | query-docs для fastapi, pydantic |
| Проверить UI теста в браузере | `playwright` | Открыть localhost:5173 → Песочница → скриншот |

**Принцип:** Для быстрой проверки гипотезы о VK API — сначала `mcp_fetch` (секунды), потом полноценный тест в песочнице (если нужна повторяемость и логирование).

---

## ⚠️ КРИТИЧЕСКОЕ ПРАВИЛО: Изоляция

Редактировать **ТОЛЬКО**:
```
backend_python/routers/sandbox.py
backend_python/services/sandbox/
features/sandbox/
docs/sandbox/
```

**Запрещено** редактировать: основные сервисы, crud, модели, схемы, shared/, hooks/, features/posts/, features/products/ и т.д.

**Исключение:** `App.tsx`, `PrimarySidebar.tsx`, `AppContent.tsx`, `main.py` — только для добавления/удаления роутинга песочницы (import + 1 строка). Логику не менять.

**Разрешено читать** весь остальной код как справку по паттернам и архитектуре.

---

## Процедура 1: Создание нового теста

### Бэкенд

1. Создать файл сервиса в `backend_python/services/sandbox/` (напр. `video_upload_test.py`)
2. Добавить эндпоинты в `backend_python/routers/sandbox.py` с комментарием-разделителем
3. Сервис **полностью изолирован** — свои `_make_vk_request`, `_upload_file_to_url` (или импорт общих из `sandbox/`)
4. Логировать каждый шаг в JSON-формате: `request`, `response`, `elapsed_ms`, `error`

### Фронтенд

1. Создать папку в `features/sandbox/components/tests/` (напр. `test2-video-upload/`)
2. Внутри: компонент UI (`.tsx`) + хук логики (`use*.ts`)
3. Зарегистрировать в массиве `SANDBOX_TESTS` в `SandboxPage.tsx`
4. Хук использует `API_BASE_URL` из `shared/config.ts`

### Документация

1. Создать `docs/sandbox/testN_название.md`
2. Обновить оглавление в `docs/sandbox/README.md`

---

## Процедура 2: Запись итогов теста

**Триггер:** «запиши итоги теста», «итоги тестирования», «результаты теста», «обнови итоги песочницы», «допиши в итоги»

### Шаг 1: Сбор контекста

Прочитать файлы (подробный список в `references/documentation_workflow.md`):
- `docs/sandbox/README.md` — оглавление и статусы
- Файл конкретного теста из `docs/sandbox/`
- `docs/sandbox/vk_api_findings.md` — находки
- `docs/sandbox/debug_chronology.md` — хронология
- Код сервиса теста из `backend_python/services/sandbox/`
- Роутер `backend_python/routers/sandbox.py`
- Фронтенд-хук теста из `features/sandbox/`
- Контекст диалога — что тестировали, результаты, баги

### Шаг 2: Определение типа записи

| Ситуация | Действие |
|---|---|
| Новый тест создан | Новый раздел (цепочка, эндпоинты, параметры) |
| Баг найден и починен | Запись в `vk_api_findings.md` + итерация в `debug_chronology.md` |
| Конфигурация изменилась | Обновить `config.md` |
| Тест успешно пройден | Статус ⏳ → ✅ |
| Тест провален | Новая итерация с ❌ |

### Шаг 3: Запись

Обновить соответствующие файлы в `docs/sandbox/`. Форматы записей — в `references/documentation_workflow.md`.

### Шаг 4: Подтверждение

Кратко сообщить пользователю, что записано и какие разделы обновлены.

---

## Текущее состояние тестов

| ID | Название | Статус |
|---|---|---|
| test1 | Фото + История (Story) | ✅ |
| test2 | Получение данных историй | ✅ |
| test3 | groups.getById — сравнение токенов | ✅ |
| test4 | Gemini Models | (см. docs) |
| test5 | Image Generation | (см. docs) |
| test6 | Video Generation | (см. docs) |

---

## Файловая структура

```
backend_python/
  routers/sandbox.py                    ← Роутер
  services/sandbox/
    photo_upload_test.py                ← Тест 1
    stories_data_test.py                ← Тест 2
    gemini_models_test.py               ← Тест 4
    image_generation_test.py            ← Тест 5
    video_generation_test.py            ← Тест 6

features/sandbox/
  components/                           ← UI тестов

docs/sandbox/
  README.md                             ← Оглавление + статусы
  architecture.md                       ← Архитектура
  test1_photo_story.md … test6_*.md     ← Описания тестов
  vk_api_findings.md                    ← Особенности VK API
  google_ai_findings.md                 ← Особенности Google AI
  config.md                             ← Конфигурация
  debug_chronology.md                   ← Хронология отладки
```

## References

- `references/documentation_workflow.md` — форматы записей, шаблоны итераций, шаблоны находок
- `references/isolation_rules.md` — полный список разрешённых/запрещённых директорий, исключения

---

## Делегирование саб-агентам

Для экономии контекстного окна следующие шаги рекомендуется выполнять через `runSubagent`:

| Шаг | Что делегировать | Промпт для саб-агента |
|---|---|---|
| ⚡ Процедура 1, бэкенд — Сбор паттернов | Чтение всех *_test.py + роутера sandbox.py | «Прочитай backend_python/services/sandbox/ (все *_test.py) и routers/sandbox.py. Для каждого теста верни: имя, функции, импорты, паттерн _make_vk_request. Из роутера — все эндпоинты и номер строки конца файла» |
| ⚡ Процедура 1, фронтенд — Сбор паттернов | Чтение тестовых компонентов + SandboxPage | «Просмотри features/sandbox/components/tests/ — найди последний по номеру тест. Верни полный код .tsx и use*.ts. Из SandboxPage.tsx верни массив SANDBOX_TESTS и строку для вставки» |
| Процедура 2, Шаг 1 — Сбор контекста (⚡ ГЛАВНЫЙ) | Чтение 8 файлов из разных частей проекта | «Собери информацию по тесту {testN}: README.md (статус), testN_*.md (полный текст), vk_api_findings.md (записи testN), debug_chronology.md (последние 3 итерации), сервис testN.py (функции), роутер (эндпоинты testN), фронт-хук (состояния и API-вызовы), references/documentation_workflow.md (шаблоны). Верни структурированный JSON» |
| Процедура 2, Шаг 3 — Генерация записей | Генерация форматированного текста по шаблонам | «На основе данных {из Шага 1} и шаблонов сгенерируй готовые блоки для вставки в testN_*.md, vk_api_findings.md, debug_chronology.md и README.md» |

**⚡ ПАРАЛЛЕЛЬНО:** «Процедура 1, бэкенд» + «Процедура 1, фронтенд» — запускать **одновременно** (один читает Python-сервисы, другой — TypeScript-компоненты). Процедура 2 — последовательно (Шаг 3 зависит от Шага 1).
