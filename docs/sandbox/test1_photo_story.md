# Тест 1: Фото + История (Story)

## Цель

Загрузить фото и опубликовать историю (Story) от имени сообщества через VK API.

---

## Цепочка VK API (3 шага)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Шаг 1: stories.getPhotoUploadServer          [user_token]         │
│  Получение upload_url для загрузки фото истории                    │
│  Параметры: group_id, add_to_news=1                                │
│  Ответ: upload_url                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Шаг 2: POST multipart/form-data на upload_url  [без токена]       │
│  Загрузка файла изображения на VK сервер                           │
│  Поле формы: file (имя поля — "file")                              │
│  Ответ: { response: { upload_result: "go_upload:eyJ..." }, _sig }  │
├─────────────────────────────────────────────────────────────────────┤
│  Шаг 3: stories.save                           [user_token]        │
│  Финализация и публикация истории                                  │
│  Параметры: upload_results = значение upload_result из шага 2      │
│  Ответ: { response: { count: 1, items: [{ id, owner_id, ... }] }} │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Эндпоинты

| Эндпоинт | Метод | Входные данные | Описание |
|---|---|---|---|
| `/api/sandbox/test1/upload-story` | POST | `photo` (file), `group_id`, `community_token`, `user_token` | Полная цепочка: загрузка + публикация |
| `/api/sandbox/test1/upload-only` | POST | `photo` (file), `group_id`, `user_token` | Только загрузка (шаги 1-2, без stories.save) |

---

## Режимы работы (фронтенд)

- **Загрузить и опубликовать** — выполняет все 3 шага. Результат: `story_id`, `owner_id`, ссылка на историю.
- **Только загрузить** — выполняет шаги 1-2. Результат: `upload_result` строка и сырой ответ.

---

## Формат ответа

```json
{
  "overall_success": true,
  "failed_at_step": null,
  "steps": [
    {
      "step": 1,
      "name": "stories.getPhotoUploadServer",
      "description": "...",
      "success": true,
      "request": { "url": "...", "method": "POST", "params": { ... } },
      "response": { ... },
      "http_status": 200,
      "elapsed_ms": 1116,
      "error": null
    }
  ],
  "result": {
    "story_id": 456239123,
    "owner_id": -173525155,
    "story_url": "https://vk.com/story-173525155_456239123"
  }
}
```

---

## Приложение: Структура upload_result (base64)

Строка `upload_result` начинается с `go_upload:` и содержит base64-закодированный JSON:

```json
{
  "sha": "32e05e39589eaa06c1cee26a91cf8a4fdf9660e050eafcb01ee41685",
  "secret": "-2824579663113569310",
  "meta": {
    "height": "1697",
    "kid": "ade7569b9f6635fec31030d87c482010",
    "width": "1200"
  },
  "hash": "be5eff91aa180036b0fe39e52dd7af22",
  "server": "999999",
  "user_id": 18407603,
  "group_id": 173525155,
  "request_id": "K_G2Vl2fFQ_p7DRhRaNreOka7PmpMw",
  "album_id": -81,
  "app_id": 4208822090252062
}
```

Ключевое: `user_id` жёстко прописан — именно поэтому `stories.save` с другим токеном (community) не принимает эту загрузку.
