# Выявленные особенности Google AI API

> Этот документ описывает особенности, подводные камни и рекомендации при работе с Google Generative Language API (v1beta), обнаруженные в ходе тестирования в Тесте 4 Песочницы.

---

## 🔴 Критическое: model_id из документации не совпадают с реальными

**Проблема:** Использование model_id из официальной документации Google (например, `gemini-2.5-flash-preview-05-20`, `gemini-2.0-flash-001`) возвращает 404 — модель не найдена.

**Причина:** Google регулярно переименовывает и удаляет preview-модели. Документация не всегда актуальна. Реальные model_id отличаются от задокументированных.

**Решение:** Использовать `GET /v1beta/models?pageSize=100` для получения актуального списка моделей с правильными ID. Вызывать этот эндпоинт периодически для синхронизации.

**Пример:**
```
# Документация говорит:
gemini-2.5-flash-preview-05-20    → 404 Not Found

# Реальный ID из ListModels:
gemini-2.5-flash                  → 200 OK
```

---

## 🔴 Критическое: Preview-модели удаляются без предупреждения

**Проблема:** Модель `gemini-2.5-flash-preview-09-2025` возвращает 404 — полностью удалена с серверов Google.

**Причина:** Google не гарантирует доступность preview-моделей. Они могут быть удалены в любой момент после выхода стабильной версии.

**Решение:** Не использовать preview-модели в продакшене. Если используются — обязательно иметь fallback на стабильную модель.

```python
# Плохо — привязка к конкретному снапшоту:
model = "gemini-2.5-flash-preview-09-2025"  # Может исчезнуть!

# Хорошо — использование стабильного алиаса:
model = "gemini-2.5-flash"  # Всегда указывает на последнюю версию
```

---

## 🟡 Важное: 429 Rate Limit — не ошибка, а исчерпание квоты

**Проблема:** При массовом тестировании моделей (36 запросов подряд) большинство возвращают HTTP 429 `RESOURCE_EXHAUSTED`. Создаёт ложное впечатление, что модели не работают.

**Причина:** Free Tier Google AI API имеет строгие лимиты:

| Модель | RPM (запросов/мин) | RPD (запросов/день) |
|---|---|---|
| gemini-2.5-pro | 5 | 25 |
| gemini-2.5-flash | 10 | 500 |
| gemini-2.5-flash-lite | 30 | 14400 |
| gemini-2.0-flash | 10 | 1500 |
| gemma-3-*-it | 30 | 14400 |

**Решение:** 
1. Добавить задержку между запросами (минимум 2–3 секунды)
2. Обрабатывать 429 как отдельный статус «квота исчерпана», а не как ошибку
3. В продакшене — реализовать exponential backoff и fallback на другую модель

```python
if response.status_code == 429:
    # Это НЕ ошибка — модель рабочая, просто исчерпан лимит
    return {"status": "quota_exhausted", "model": model_id}
```

---

## 🟡 Важное: Imagen модели требуют billing (оплату)

**Проблема:** Модели Imagen 4 (`imagen-4.0-generate-preview-06-06`, `imagen-4.0-ultra-generate-preview-06-06`, `imagen-4.0-edit-preview-06-06`) существуют в API (GET /models/ возвращает метаданные), но `POST :predict` возвращает ошибку авторизации на Free Tier.

**Причина:** Google предоставляет генерацию изображений через Imagen только для платных аккаунтов. Free Tier не включает `predict` endpoint.

**Решение:** Для проверки существования модели использовать `GET /models/{id}`. Для реальной генерации — необходим billing аккаунт.

---

## 🟡 Важное: Таймауты на перегруженных моделях

**Проблема:** Модели `gemini-3-flash-preview` и `gemma-3-12b-it` не отвечают за 30 секунд — запрос завершается по таймауту.

**Причина:** Серверы Google могут быть перегружены, особенно для preview-моделей и моделей среднего размера (12B). Cold start может занимать значительное время.

**Решение:** 
1. Увеличить таймаут до 60–120 секунд для больших моделей
2. Не считать таймаут окончательным вердиктом — повторить тест позже
3. Для продакшена — использовать модели с гарантированной доступностью (flash, flash-lite)

---

## 🟡 Важное: Разные модели — разные эндпоинты

**Проблема:** Не все модели Google AI используют один и тот же API endpoint. Попытка вызвать `generateContent` для Imagen-модели возвращает ошибку.

**Причина:** Google AI API имеет разные методы для разных типов моделей:

| Тип модели | Endpoint | Пример |
|---|---|---|
| Текстовые (Gemini, Gemma) | `:generateContent` | `POST /models/gemini-2.5-flash:generateContent` |
| Embedding | `:embedContent` | `POST /models/gemini-embedding-001:embedContent` |
| Imagen (изображения) | `:predict` | `POST /models/imagen-4.0-generate-preview-06-06:predict` |
| Veo, TTS, Agents | Нет прямого endpoint | Только `GET /models/{id}` для проверки существования |

**Решение:** Определять тип модели заранее и использовать соответствующий endpoint. В нашем тесте это реализовано через поле `test_method` в массиве моделей.

---

## 🟢 Информационное: ListModels API — источник истины

**API:** `GET /v1beta/models?pageSize=100&key=...`

Возвращает полный список доступных моделей с метаданными:
- `name` — полный ID модели (e.g., `models/gemini-2.5-flash`)
- `displayName` — человекочитаемое имя
- `description` — описание возможностей
- `inputTokenLimit` / `outputTokenLimit` — лимиты токенов
- `supportedGenerationMethods` — поддерживаемые методы (generateContent, embedContent, и т.д.)

**Рекомендация:** Вызывать этот endpoint при старте приложения для актуализации списка доступных моделей.

---

## 🟢 Информационное: PowerShell портит UTF-8 файлы

**Проблема:** При обновлении файлов `.tsx` через PowerShell `Set-Content -Encoding UTF8` файл становится нечитаемым для esbuild/Vite.

**Причина:** PowerShell 5.1 добавляет BOM (Byte Order Mark, 0xEF 0xBB 0xBF) в начало файла. esbuild интерпретирует BOM как часть JavaScript-кода → ошибка синтаксиса.

**Решение:**
```powershell
# Плохо — добавляет BOM:
Set-Content -Path "file.tsx" -Value $content -Encoding UTF8

# Хорошо — UTF-8 без BOM:
[System.IO.File]::WriteAllText("file.tsx", $content, [System.Text.UTF8Encoding]::new($false))
```

---

## 🟢 Информационное: Gemma модели — open-source альтернатива

**Наблюдение:** Модели Gemma (gemma-3-1b-it, gemma-3-4b-it, gemma-3-27b-it, gemma-3n-*) доступны бесплатно с щедрыми лимитами: **30 RPM / 14400 RPD**.

**Применение:** Gemma-модели подходят как fallback, когда квота основных Gemini-моделей исчерпана. Качество ниже, чем у Gemini 2.5 Flash, но для простых задач (генерация коротких текстов, суммаризация) — достаточно.

```
Приоритет использования:
1. gemini-2.5-flash      (500 RPD)  — основная
2. gemini-2.5-flash-lite (14400 RPD) — массовые операции
3. gemma-3-27b-it        (14400 RPD) — fallback при исчерпании квоты Gemini
```

---

## 🔴 Критическое: durationSeconds для Veo — только дискретные значения

**Проблема:** При передаче `durationSeconds: 5` для моделей Veo 3+ API возвращает 400 `INVALID_ARGUMENT: The number value for durationSeconds is out of bound. Please provide a value between 4 and 8, inclusive.`

**Причина:** Сообщение об ошибке **вводит в заблуждение**. Фраза «between 4 and 8, inclusive» создаёт впечатление, что допустимо любое целое число от 4 до 8. На самом деле API принимает **ТОЛЬКО дискретные значения**:

| Модель | Допустимые значения |
|---|---|
| Veo 2 | `5`, `6`, `8` |
| Veo 3 / 3.1 | `4`, `6`, `8` |

Значение `5` допустимо для Veo 2, но **не для Veo 3+**. Значения `7` не допустимо ни для одной модели.

**Решение:** Маппить запрошенную длительность к ближайшему валидному значению:
```python
def _get_valid_duration(model_id: str, requested: int) -> int:
    if "veo-2" in model_id:
        valid = [5, 6, 8]
    else:
        valid = [4, 6, 8]
    return min(valid, key=lambda x: abs(x - requested))
```

---

## 🔴 Критическое: Veo видео — единственный рабочий метод predictLongRunning

**Проблема:** Из 4 протестированных API-методов для генерации видео работает **только один** — `predictLongRunning`.

| Метод | Результат | Причина |
|---|---|---|
| `predictLongRunning` | ✅ 200 | Единственный рабочий метод для Veo через AI Studio |
| `generateContent` + VIDEO | ❌ 400 | Модальность `"VIDEO"` не поддерживается в AI Studio (только Vertex AI) |
| `predict` (sync) | ❌ 404 | Veo не поддерживает синхронный predict |
| `generateVideos` | ❌ ERR | Эндпоинт не существует в v1beta |

**Решение:** Использовать **только** `predictLongRunning` для Veo. Остальные методы — fallback для совместимости, но они не работают.

---

## 🟡 Важное: Video URI требует API ключ + проксирование

**Проблема:** После успешной генерации видео, Google возвращает `video.uri` (например, `https://generativelanguage.googleapis.com/v1beta/files/...`). Этот URI:
1. Требует `?key=` для авторизации
2. Блокируется CORS при прямом обращении из браузера

**Причина:** Google не настраивает CORS-заголовки на file-хранилище. Браузерные запросы из `<video>` или `fetch()` не могут напрямую скачать видео.

**Решение:** Проксирование через бэкенд:
```
GET /api/sandbox/test6/proxy-video?api_key=...&video_uri=...
```
Бэкенд скачивает видео с API ключом и отдаёт как `StreamingResponse(media_type="video/mp4")`.

---

## 🟡 Важное: Генерация изображений — нулевая квота на Free Tier

**Проблема:** Gemini Image модели (`gemini-2.5-flash-image`, `gemini-3-pro-image-preview`) отвечают на запросы, но возвращают 429 `RESOURCE_EXHAUSTED` с `limit: 0`.

**Причина:** Google установил **нулевую квоту** для генерации изображений на Free Tier:
```
Quota exceeded for metric: generate_content_free_tier_requests, limit: 0
```

Это не временное ограничение — квота буквально = 0.

**Решение:** Для генерации изображений через Gemini модели необходим billing. Imagen модели также требуют billing.

---

## 🟡 Важное: Veo генерация асинхронная — видео не готово сразу

**Проблема:** `predictLongRunning` возвращает 200 OK, но `video_uri: null` и `is_done: false`.

**Причина:** Генерация видео занимает от 30 секунд до 6 минут. API возвращает `operation_name` для поллинга.

**Решение:** Реализовать polling loop:
1. Сохранить `operation_name` из ответа
2. Каждые 10 секунд вызывать `GET /v1beta/{operation_name}?key=...`
3. Проверять `done: true`
4. Извлекать `response.generated_videos[0].video.uri`

---

## 🟢 Информационное: Veo 2 требует billing, Veo 3+ — нет

**Наблюдение:** При тестировании:
- **Veo 2** (`veo-2.0-generate-001`): `predictLongRunning` возвращает 400 `FAILED_PRECONDITION: The model is exclusively available to users with Google Cloud Platform billing enabled` (до подключения billing)
- **Veo 3, 3 Fast, 3.1, 3.1 Fast**: `predictLongRunning` возвращает 200 OK + operation_name даже на Free Tier

**Вывод:** На Free Tier доступны Veo 3+ модели. Veo 2 требует обязательного billing. После подключения billing все 5 моделей работают.
