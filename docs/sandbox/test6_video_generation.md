# Тест 6: Генерация видео через Google AI (Veo)

> Проверка работы моделей генерации видео (Veo 2, 3, 3.1) через Google Generative Language API.

---

## Цель теста

Определить:
1. Какие модели Veo доступны и работают
2. Какой API-метод использовать для генерации видео
3. Какие параметры (durationSeconds, aspectRatio) допустимы
4. Как устроен асинхронный процесс: запуск → поллинг → получение видео

---

## Конфигурация

| Параметр | Значение |
|---|---|
| API endpoint | `https://generativelanguage.googleapis.com/v1beta` |
| Авторизация | API Key (query param `?key=`) |
| Основной метод | `predictLongRunning` (асинхронный) |
| Таймаут запуска | 60 секунд |
| Таймаут поллинга | 15 секунд |
| Таймаут скачивания видео | 120 секунд |

---

## Модели

| Модель | model_id | durationSeconds | Аудио | Результат |
|---|---|---|---|---|
| Veo 2 | `veo-2.0-generate-001` | 5, 6, 8 | ❌ Без звука | ✅ Работает (с billing) |
| Veo 3 | `veo-3.0-generate-001` | 4, 6, 8 | ✅ С аудио | ✅ Работает |
| Veo 3 Fast | `veo-3.0-fast-generate-001` | 4, 6, 8 | ✅ С аудио | ✅ Работает |
| Veo 3.1 (Preview) | `veo-3.1-generate-preview` | 4, 6, 8 | ✅ С аудио | ✅ Работает |
| Veo 3.1 Fast (Preview) | `veo-3.1-fast-generate-preview` | 4, 6, 8 | ✅ С аудио | ✅ Работает |

---

## Рабочий метод: `predictLongRunning`

### Формат запроса

```
POST /v1beta/models/{model_id}:predictLongRunning?key={api_key}
```

```json
{
  "instances": [{"prompt": "текстовый промпт"}],
  "parameters": {
    "sampleCount": 1,
    "durationSeconds": 8,
    "aspectRatio": "16:9"
  }
}
```

### Формат ответа (запуск)

```json
{
  "name": "models/veo-3.0-generate-001/operations/vb9yirsbpkqt"
}
```

Возвращает `operation_name` — идентификатор long-running операции.

### Поллинг статуса

```
GET /v1beta/{operation_name}?key={api_key}
```

Ответ, пока генерация идёт:
```json
{
  "name": "models/veo-3.0-generate-001/operations/vb9yirsbpkqt",
  "done": false
}
```

Ответ, когда видео готово:
```json
{
  "name": "models/veo-3.0-generate-001/operations/vb9yirsbpkqt",
  "done": true,
  "response": {
    "generated_videos": [
      {
        "video": {
          "uri": "https://generativelanguage.googleapis.com/v1beta/files/..."
        }
      }
    ]
  }
}
```

### Получение видео

Video URI требует API ключ для доступа:
```
GET {video_uri}?key={api_key}
```

В нашей реализации видео проксируется через бэкенд (`/api/sandbox/test6/proxy-video`), чтобы:
1. Обойти CORS (браузер не может напрямую обратиться к Google API)
2. Добавить API ключ к запросу
3. Отдать видео как mp4 stream для `<video>` элемента

---

## Нерабочие методы

### generateContent с VIDEO modality

```json
{
  "contents": [{"parts": [{"text": "промпт"}]}],
  "generationConfig": {
    "responseModalities": ["VIDEO"]
  }
}
```

**Результат:** 400 `INVALID_ARGUMENT` — `"VIDEO"` не является допустимой модальностью в AI Studio API. Работает **только** через Vertex AI (Google Cloud).

### predict (синхронный)

**Результат:** 404 — Veo модели не поддерживают синхронный `predict`. Только `predictLongRunning`.

### generateVideos

**Результат:** Пустой ответ (не JSON) — эндпоинт не существует в v1beta.

---

## Хронология отладки

### Итерация 1: Все методы возвращают ошибки

- **Проблема:** Все 4 метода не сработали. `generateContent` → 400 (VIDEO не поддерживается), `predictLongRunning` → 400 (durationSeconds out of bound), `predict` → 404, `generateVideos` → пустой ответ.
- **Причина:** `durationSeconds: 5` — вне допустимого диапазона `{4, 6, 8}` для Veo 3+.
- **Решение:** Ошибку заметили не сразу — API сообщает `between 4 and 8, inclusive`, создавая ложное впечатление, что любое значение в этом диапазоне допустимо. На самом деле допустимы **только дискретные значения**.

### Итерация 2: Исправление durationSeconds

- **Изменения:**
  1. Порядок методов: `predictLongRunning` → `generateVideos` → `predict` → `generateContent` (от наиболее вероятного)
  2. `durationSeconds` клэмпится к 4–8 (простой clamp)
- **Результат:** ❌ Veo 3+ всё ещё ошибка `durationSeconds out of bound` — значение `5` не допустимо.

### Итерация 3: Дискретные значения durationSeconds

- **Открытие (из документации Google):**
  - Veo 2: допустимые значения `{5, 6, 8}`
  - Veo 3 / 3.1: допустимые значения `{4, 6, 8}`
- **Изменения:**
  1. Функция `_get_valid_duration()` — маппит запрошенное значение к ближайшему допустимому для конкретной модели
  2. UI: слайдер заменён на 3 кнопки (4с / 6с / 8с)
  3. Default duration: 8с (универсальное значение для всех моделей)
  4. Обновлён парсер ответа — добавлен формат `generated_videos[0].video.uri`
- **Результат:** ✅ Все 5 моделей возвращают операцию. predictLongRunning → 200.

### Итерация 4: Проксирование видео

- **Проблема:** Видео URI от Google требует API ключ, а `<video src="...">` не может его передать. Плюс CORS.
- **Решение:** Бэкенд-эндпоинт `/api/sandbox/test6/proxy-video` (GET + POST):
  1. GET — для `<video>` элемента (source src)
  2. POST — для кнопки «Скачать» (fetch → blob → download)
  3. Добавляет `?key=` к URI и проксирует видео как mp4 stream
- **Результат:** ✅ Видео воспроизводится в плеере и скачивается.

---

## Особенности durationSeconds

⚠ **КРИТИЧЕСКИ ВАЖНО:** `durationSeconds` принимает **ТОЛЬКО дискретные значения**, а не диапазон!

| Модель | Допустимые значения |
|---|---|
| Veo 2 | `5`, `6`, `8` |
| Veo 3, 3 Fast | `4`, `6`, `8` |
| Veo 3.1, 3.1 Fast | `4`, `6`, `8` |

Ошибка API (`between 4 and 8, inclusive`) **вводит в заблуждение** — она означает «одно из значений в наборе {4, 6, 8}», а не «любое число от 4 до 8».

---

## Сводка результатов

| Модель | predictLongRunning | generateContent | predict | generateVideos |
|---|---|---|---|---|
| Veo 2 | ✅ 200 (billing) | ❌ 400 | ❌ 404 | ❌ ERR |
| Veo 3 | ✅ 200 | ❌ 400 | ❌ 404 | ❌ ERR |
| Veo 3 Fast | ✅ 200 | ❌ 400 | ❌ 404 | ❌ ERR |
| Veo 3.1 (Preview) | ✅ 200 | ❌ 400 | ❌ 404 | ❌ ERR |
| Veo 3.1 Fast (Preview) | ✅ 200 | ❌ 400 | ❌ 404 | ❌ ERR |

**Единственный рабочий метод: `predictLongRunning`**

---

## Вывод

Генерация видео через Google AI (Veo) **работает** через метод `predictLongRunning`. Все 5 моделей (Veo 2, 3, 3 Fast, 3.1, 3.1 Fast) успешно принимают запрос и возвращают operation_name для поллинга.

Для получения/просмотра видео необходим:
- **Billing аккаунт** (для Veo 2 — обязательно, для Veo 3+ — может работать на Free Tier при наличии квоты)
- **Прокси через бэкенд** (video URI требует API ключ + CORS)

---

## Файлы теста

| Файл | Назначение |
|---|---|
| `backend_python/services/sandbox/video_generation_test.py` | Сервис генерации видео (5 моделей, 4 метода, поллинг, парсинг URI) |
| `backend_python/routers/sandbox.py` | Эндпоинты: `GET test6/models`, `POST test6/start`, `POST test6/check`, `GET/POST test6/proxy-video` |
| `features/sandbox/components/tests/test6-video-generation/useVideoGenerationTest.ts` | Хук логики (старт, поллинг, стоп) |
| `features/sandbox/components/tests/test6-video-generation/VideoGenerationTest.tsx` | UI компонент (розовая тема, видеоплеер, скачивание) |
