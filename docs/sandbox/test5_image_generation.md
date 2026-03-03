# Тест 5: Генерация изображений через Google AI

> Проверка работы моделей генерации изображений (Gemini Image + Imagen) через Google Generative Language API.

---

## Цель теста

Определить, какие модели Google AI способны генерировать изображения по текстовому промпту, и какие API-методы для этого используются.

---

## Конфигурация

| Параметр | Значение |
|---|---|
| API endpoint | `https://generativelanguage.googleapis.com/v1beta` |
| Авторизация | API Key (query param `?key=`) |
| Таймаут | 120 секунд |
| Прокси | Опционально |

---

## Модели и методы

### Gemini Image модели (метод: `generateContent`)

Используют стандартный `generateContent` с параметром `responseModalities: ["IMAGE", "TEXT"]`.
Ответ содержит `inlineData.data` (base64) + `inlineData.mimeType`.

| Модель | model_id | Метод | Результат |
|---|---|---|---|
| Gemini 2.5 Flash Image | `gemini-2.5-flash-image` | generateContent | ⏳ Квота (429) — модель доступна, но лимит Free Tier исчерпан |
| Gemini 3 Pro Image Preview | `gemini-3-pro-image-preview` | generateContent | ⏳ Квота (429) — модель доступна, но лимит Free Tier исчерпан |

### Imagen модели (метод: `predict`)

Используют специализированный endpoint `:predict`.
Ответ содержит `predictions[0].bytesBase64Encoded`.

| Модель | model_id | Метод | Результат |
|---|---|---|---|
| Imagen 4 (Preview) | `imagen-4.0-generate-preview-06-06` | predict | ❌ Требует billing |
| Imagen 4 (Stable) | `imagen-4.0-generate-001` | predict | ❌ Требует billing |
| Imagen 4 Ultra (Preview) | `imagen-4.0-ultra-generate-preview-06-06` | predict | ❌ Требует billing |
| Imagen 4 Ultra (Stable) | `imagen-4.0-ultra-generate-001` | predict | ❌ Требует billing |
| Imagen 4 Fast (Stable) | `imagen-4.0-fast-generate-001` | predict | ❌ Требует billing |

---

## Результаты тестирования

### Gemini Image: generateContent + responseModalities

**Формат запроса:**
```json
{
  "contents": [{"parts": [{"text": "промпт"}]}],
  "generationConfig": {
    "responseModalities": ["IMAGE", "TEXT"]
  }
}
```

**Результат:** Обе Gemini Image модели доступны (отвечают на запрос), но на Free Tier получают 429 `RESOURCE_EXHAUSTED`. Это означает:
- Модели **работают** — API принимает формат запроса
- Квота Free Tier для генерации изображений через Gemini **очень ограничена** (0 RPM на момент теста)
- При наличии платного аккаунта модели будут генерировать изображения

**Пример ответа (429):**
```
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests,
limit: 0, model: gemini-2.5-flash-preview-image
```

### Imagen: predict endpoint

**Формат запроса:**
```json
{
  "instances": [{"prompt": "промпт"}],
  "parameters": {
    "sampleCount": 1,
    "aspectRatio": "1:1"
  }
}
```

**Результат:** Все 5 Imagen моделей возвращают 400 `INVALID_ARGUMENT`:
```
Imagen API is only accessible to billed users at this time.
```

Imagen **полностью заблокирован** на Free Tier — даже формат запроса не проверяется, отклонение происходит на уровне авторизации.

---

## Сводка

| Категория | Количество | Статус |
|---|---|---|
| Gemini Image | 2 | ⏳ Доступны, но квота 0 на Free Tier |
| Imagen 4 | 5 | ❌ Требуют billing (платный аккаунт) |
| **Итого** | **7** | **0 работающих на Free Tier** |

---

## Вывод

**Генерация изображений через Google AI на Free Tier невозможна.** Все модели либо заблокированы (Imagen), либо имеют нулевую квоту (Gemini Image). Для реальной генерации необходим Google Cloud Platform аккаунт с активным billing.

### Рекомендация для продакшена

При подключении billing:
1. **Gemini 2.5 Flash Image** — оптимальный выбор (быстрая, дешёвая, встроена в Gemini экосистему)
2. **Imagen 4 Fast** — для массовой генерации (быстрая версия Imagen)
3. **Imagen 4 Ultra** — для максимального качества (медленнее, дороже)

---

## Файлы теста

| Файл | Назначение |
|---|---|
| `backend_python/services/sandbox/image_generation_test.py` | Сервис генерации изображений (7 моделей, 2 метода) |
| `backend_python/routers/sandbox.py` | Эндпоинты: `GET test5/models`, `POST test5/generate` |
| `features/sandbox/components/tests/test5-image-generation/useImageGenerationTest.ts` | Хук логики фронтенда |
| `features/sandbox/components/tests/test5-image-generation/ImageGenerationTest.tsx` | UI компонент (фиолетовая тема) |
