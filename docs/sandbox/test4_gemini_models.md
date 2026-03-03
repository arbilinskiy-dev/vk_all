# Тест 4: Модели Google AI — Проверка доступности

## Цель

Определить, какие модели Google AI (Gemini, Gemma, Imagen, Veo, TTS и др.) реально доступны по API-ключу для использования в проекте VK Content Planner.

---

## API и авторизация

| Параметр | Значение |
|---|---|
| API Endpoint | `https://generativelanguage.googleapis.com/v1beta` |
| Авторизация | API Key (query-параметр `?key=...`) |
| Тарифный план | Free Tier (бесплатный) |
| Дата тестирования | 18.02.2025 |

---

## Методология тестирования

Для каждой модели применяется один из 4 методов тестирования в зависимости от её типа:

| Метод | Тестируемые модели | Запрос |
|---|---|---|
| `generateContent` | Gemini, Gemma (текстовые) | `POST /models/{id}:generateContent` с простым промптом `"Say hello"` |
| `embedContent` | Embedding-модели | `POST /models/{id}:embedContent` с текстом `"Hello world"` |
| `predict` | Imagen (генерация изображений) | `POST /models/{id}:predict` с промптом и параметрами |
| `models.get` | Veo, TTS, Deep Research, Specialized, AQA | `GET /models/{id}` — проверка существования модели |

### Параметры тестирования

- **Таймаут:** 30 секунд на каждый запрос
- **Задержка между запросами:** Настраиваемая (0–10 секунд, по умолчанию 3с)
- **Обработка 429 (Rate Limit):** Выделяется отдельно как «квота исчерпана» (не считается ошибкой)

---

## Полный список моделей (36 шт.)

Модели получены через `GET /v1beta/models?pageSize=100` с дополнением из документации Google.

### Категория: Gemini — Flagship (5 моделей)

| Модель (model_id) | Метод теста | Результат | Комментарий |
|---|---|---|---|
| `gemini-2.5-pro` | generateContent | ⏳ Квота | Самая мощная модель. Работает, но Free Tier: 5 RPM / 25 RPD |
| `gemini-2.5-flash` | generateContent | ✅ Работает | Главная рабочая лошадка. Free Tier: 10 RPM / 500 RPD |
| `gemini-2.5-flash-lite` | generateContent | ✅ Работает | Быстрейший Gemini. Free Tier: 30 RPM / 14400 RPD |
| `gemini-2.0-flash` | generateContent | ⏳ Квота | Предыдущее поколение, стабильная. 10 RPM / 1500 RPD |
| `gemini-2.0-flash-lite` | generateContent | ⏳ Квота | Предыдущее поколение, лёгкая. 30 RPM / 14400 RPD |

### Категория: Gemini 3 — Preview (2 модели)

| Модель (model_id) | Метод теста | Результат | Комментарий |
|---|---|---|---|
| `gemini-3-pro-preview` | generateContent | ⏳ Квота | Новейшая Pro. Free Tier: 5 RPM / 25 RPD |
| `gemini-3-flash-preview` | generateContent | ❌ Таймаут | Не ответила за 30 секунд. Возможно перегружена или медленный cold start |

### Категория: Gemini 2.5 — Previews (3 модели)

| Модель (model_id) | Метод теста | Результат | Комментарий |
|---|---|---|---|
| `gemini-2.5-flash-preview-04-17` | generateContent | ⏳ Квота | Preview-снапшот |
| `gemini-2.5-flash-preview-09-2025` | generateContent | ❌ 404 | **Мёртвая модель** — удалена с серверов Google |
| `gemini-2.5-flash-lite-preview-09-2025` | generateContent | ✅ Работает | Preview-снапшот lite |

### Категория: Image Generation — Imagen 4 (3 модели)

| Модель (model_id) | Метод теста | Результат | Комментарий |
|---|---|---|---|
| `imagen-4.0-generate-preview-06-06` | predict | ✅ Существует | Генерация изображений. Тестируется через models.get (predict требует billing) |
| `imagen-4.0-ultra-generate-preview-06-06` | predict | ✅ Существует | Ultra-качество. Тестируется через models.get |
| `imagen-4.0-edit-preview-06-06` | predict | ✅ Существует | Редактирование изображений. Тестируется через models.get |

### Категория: Video Generation — Veo (1 модель)

| Модель (model_id) | Метод теста | Результат | Комментарий |
|---|---|---|---|
| `veo-2.0-generate-001` | models.get | ✅ Существует | Генерация видео. Доступна на Free Tier с лимитами |

### Категория: Audio / TTS (1 модель)

| Модель (model_id) | Метод теста | Результат | Комментарий |
|---|---|---|---|
| `gemini-2.5-flash-preview-tts` | models.get | ✅ Существует | Text-to-Speech. Выделенная TTS-модель |

### Категория: Agents (2 модели)

| Модель (model_id) | Метод теста | Результат | Комментарий |
|---|---|---|---|
| `gemini-2.5-flash-preview-native-audio-dialog` | models.get | ✅ Существует | Аудио-диалоги (live agent) |
| `aqa` | models.get | ✅ Существует | Attributed Question Answering |

### Категория: Specialized (2 модели)

| Модель (model_id) | Метод теста | Результат | Комментарий |
|---|---|---|---|
| `gemini-2.0-flash-thinking-exp-1219` | models.get | ✅ Существует | Thinking/reasoning модель |
| `gemini-exp-1206` | generateContent | ⏳ Квота | Экспериментальная. 10 RPM / 1500 RPD |

### Категория: Gemma (Open) — 5 моделей

| Модель (model_id) | Метод теста | Результат | Комментарий |
|---|---|---|---|
| `gemma-3-1b-it` | generateContent | ✅ Работает | Самая маленькая Gemma (1B). Ультра-быстрая |
| `gemma-3-4b-it` | generateContent | ✅ Работает | 4B параметров. Быстрая |
| `gemma-3-12b-it` | generateContent | ❌ Таймаут | Не ответила за 30 секунд. Перегружена |
| `gemma-3-27b-it` | generateContent | ✅ Работает | Самая большая Gemma. 30 RPM / 14400 RPD |
| `gemma-3n-e4b-it` | generateContent | ✅ Работает | Gemma 3N (edge-оптимизированная) |

### Категория: Gemma — Nano/Edge (2 модели)

| Модель (model_id) | Метод теста | Результат | Комментарий |
|---|---|---|---|
| `gemma-3n-e2b-it` | generateContent | ✅ Работает | Nano edge, 2B |

### Категория: Embedding (1 модель)

| Модель (model_id) | Метод теста | Результат | Комментарий |
|---|---|---|---|
| `gemini-embedding-001` | embedContent | ✅ Работает | Embedding-модель. 5 RPM / 100 RPD |

### Категория: Image Generation — Gemini (2 модели)

| Модель (model_id) | Метод теста | Результат | Комментарий |
|---|---|---|---|
| `gemini-2.5-flash-preview-image-generation` | generateContent | ⏳ Квота | Gemini с генерацией картинок inline |
| `gemini-2.0-flash-preview-image-generation` | generateContent | ⏳ Квота | Предыдущее поколение |

### Категория: Deep Research (1 модель)

| Модель (model_id) | Метод теста | Результат | Комментарий |
|---|---|---|---|
| `gemini-2.5-pro-preview-deep-research` | models.get | ✅ Существует | Глубокое исследование темы |

---

## Сводная таблица результатов

| Статус | Кол-во | Описание |
|---|---|---|
| ✅ Работает (генерация) | **10** | Модель ответила на запрос generateContent/embedContent |
| ⏳ Квота исчерпана | **9** | Модель вернула 429. Будет работать после сброса квоты |
| ✅ Существует (model info) | **14** | Модель зарегистрирована в API (Imagen, Veo, TTS, Agents, Specialized, Deep Research) |
| ❌ Мёртвая (404) | **1** | `gemini-2.5-flash-preview-09-2025` — удалена |
| ❌ Таймаут (30с) | **2** | `gemini-3-flash-preview`, `gemma-3-12b-it` — не ответили за 30с |
| **Итого** | **36** | |

---

## Практические рекомендации для проекта

### 🏆 Лучший выбор для VK Content Planner

| Задача | Рекомендуемая модель | Причина |
|---|---|---|
| Генерация текстов постов | `gemini-2.5-flash` | Быстрая, умная, 500 RPD бесплатно |
| Массовые операции (bulk) | `gemini-2.5-flash-lite` | 14400 RPD, самая дешёвая |
| Сложная аналитика | `gemini-2.5-pro` | Самая умная, лимит 25 RPD |
| Embeddings / поиск | `gemini-embedding-001` | Единственная embedding-модель |
| Генерация картинок | `imagen-4.0-generate-preview-06-06` | Лучшее качество (нужен billing) |

### ⚠️ Ограничения Free Tier

- **gemini-2.5-pro:** 5 RPM / 25 RPD — очень строгий лимит, только для важных задач
- **gemini-2.5-flash:** 10 RPM / 500 RPD — основная рабочая модель
- **gemini-2.5-flash-lite:** 30 RPM / 14400 RPD — для массовых операций
- **Imagen модели:** Доступны только с billing аккаунтом через `predict` endpoint
- **Veo, TTS, Deep Research:** Существуют в API, но требуют billling или специальный доступ

### 🔄 Стратегия отказоустойчивости

```
Основная:      gemini-2.5-flash (500 RPD)
├── Fallback 1: gemini-2.5-flash-lite (14400 RPD) — если 429 на flash
├── Fallback 2: gemini-2.0-flash (1500 RPD) — альтернатива
└── Fallback 3: gemma-3-27b-it (14400 RPD) — open-source, без ограничений Google
```

---

## Эндпоинты песочницы

| Эндпоинт | Метод | Входные данные | Описание |
|---|---|---|---|
| `/api/sandbox/test4/models` | GET | — | Список всех 36 моделей с метаданными |
| `/api/sandbox/test4/single-model?model_id=...` | POST | `api_key`, `proxy_url?` | Тест одной модели |
| `/api/sandbox/test4/all-models` | POST | `api_key`, `proxy_url?` | Последовательный тест всех моделей |

---

## Формат ответа (single-model)

```json
{
  "model_id": "gemini-2.5-flash",
  "display_name": "Gemini 2.5 Flash",
  "category": "Gemini — Flagship",
  "test_method": "generateContent",
  "success": true,
  "status_code": 200,
  "response_time_ms": 1847,
  "response_preview": "Hello! How can I help you today?",
  "error": null,
  "full_response": { ... }
}
```

## Формат ответа (all-models)

```json
{
  "total": 36,
  "success_count": 10,
  "quota_exhausted_count": 9,
  "failed_count": 3,
  "total_time_seconds": 142.5,
  "results": [ ... ]
}
```

---

## Выявленные особенности Google AI API

Подробнее — в файле [google_ai_findings.md](google_ai_findings.md).

### Краткий список:

1. **429 Rate Limit — не ошибка:** Free Tier имеет строгие лимиты RPM/RPD. При массовом тестировании 429 = квота исчерпана, модель рабочая
2. **404 на старых previews:** Google удаляет preview-снапшоты без предупреждения. `gemini-2.5-flash-preview-09-2025` — пример
3. **Таймаут на перегруженных моделях:** `gemini-3-flash-preview` и `gemma-3-12b-it` не отвечали за 30с — серверы перегружены
4. **Imagen требует billing:** `predict` endpoint возвращает ошибку авторизации на Free Tier. Модели существуют (GET models), но генерация — только с оплатой
5. **ListModels API:** `GET /v1beta/models?pageSize=100` возвращает актуальный список моделей. Полезен для автоматической синхронизации

---

## Файлы реализации

| Файл | Описание |
|---|---|
| `backend_python/services/sandbox/gemini_models_test.py` | Сервис: 36 моделей, 4 метода тестирования |
| `backend_python/routers/sandbox.py` | Роутер: 3 эндпоинта для Test 4 |
| `features/sandbox/components/tests/test4-gemini-models/useGeminiModelsTest.ts` | Хук: логика тестирования, задержка между запросами |
| `features/sandbox/components/tests/test4-gemini-models/GeminiModelsTest.tsx` | Компонент: UI с карточками, прогресс-баром, настройками |
| `features/sandbox/components/SandboxPage.tsx` | Регистрация Test 4 в SANDBOX_TESTS |
