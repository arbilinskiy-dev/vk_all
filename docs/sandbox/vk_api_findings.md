# Выявленные особенности VK API

---

## 🔴 Критическое: Токен должен быть одинаковым на всю цепочку

**Проблема:** При использовании `user_token` для `stories.getPhotoUploadServer` и `community_token` для `stories.save`, VK возвращает `{ count: 0, items: [] }` — история **не публикуется**, ошибки нет.

**Причина:** VK привязывает загрузку к конкретному `user_id` (виден в base64-строке `upload_result`). Метод `stories.save` **обязан** вызываться тем же токеном, что инициировал `getPhotoUploadServer`. Community token — это «другой автор», и VK молча отклоняет операцию.

**Решение:** Использовать `user_token` для **всех трёх шагов**. Параметр `group_id` в `getPhotoUploadServer` уже указывает VK, что история публикуется от имени сообщества.

```
stories.getPhotoUploadServer  →  user_token  ✅
Загрузка файла                →  без токена  ✅
stories.save                  →  user_token  ✅  (НЕ community_token!)
```

---

## 🔴 Критическое: Вложенная структура ответа upload-сервера

**Проблема:** Ответ VK upload-сервера для сторис имеет **вложенную** структуру:

```json
{
  "response": {
    "upload_result": "go_upload:eyJ..."
  },
  "_sig": "c50a6e7d109ec8faa5d722fafc864f24"
}
```

Наивный вызов `upload_response.get("upload_result")` на верхнем уровне возвращает `None`. Код фоллбэчит на `json.dumps(upload_response)` — вся JSON-обёртка отправляется в `stories.save` как строка, VK принимает запрос но возвращает пустой `items`.

**Решение:** Сначала проверять `upload_response["response"]["upload_result"]`, затем фоллбэк на `upload_response.get("upload_result")`.

```python
upload_result = None
if isinstance(upload_response.get("response"), dict):
    upload_result = upload_response["response"].get("upload_result")
if not upload_result:
    upload_result = upload_response.get("upload_result")
```

---

## 🔴 Критическое: Non-standalone токен не работает со stories

**Проблема:** Токен пользователя, полученный НЕ через standalone-приложение (например, через VK Login для сайта), возвращает ошибку `error_code: 15, error_subcode: 1134` на **всех** методах stories: `stories.get`, `stories.getStats`, `stories.getViewers`.

**Причина:** VK требует standalone-приложение (Implicit Flow) для доступа к stories API. Токены, выданные через авторизацию сайтов/платформ, не имеют нужных прав.

**Решение:** Использовать **только standalone-токен** (Implicit Flow, `response_type=token`) для всех операций со stories.

---

## 🔴 Критическое: Service Token не работает со stories

**Проблема:** Сервисный ключ приложения возвращает `error_code: 28` ("method is unavailable with service token") на **всех** методах stories.

**Причина:** VK не предоставляет доступ к stories API через сервисные ключи. Stories API требует авторизацию от имени пользователя или сообщества.

**Решение:** Не использовать service token для stories. Альтернативы: user token (standalone) или community token.

---

## 🟡 Важное: Community Token не возвращает country и has_mobile в users.get

**Проблема:** При вызове `users.get` с community token поля `country` и `has_mobile` **не возвращаются**, даже если они явно запрошены в `fields`. User token возвращает оба поля.

**Причина:** VK ограничивает объём данных, доступных community token. Некоторые поля профиля считаются «пользовательскими» и недоступны токену сообщества.

**Решение:** Для полной демографии зрителей (страна, наличие мобильного) использовать **user token**. Для базовой статистики (пол, возраст, город) community token достаточен.

---

## 🟡 Важное: stories.get v5.199 — вложенная структура items

**Проблема:** `stories.get` в v5.199 возвращает `items` как массив контейнеров: `items: [{ type: "stories", stories: [...] }]`. Наивный подсчёт `items.length` показывает 1, хотя историй 4.

**Причина:** Каждый контейнер группирует истории одного владельца. Реальные истории вложены в `container.stories[]`.

**Решение:** Парсить двухуровневую структуру:
```python
for container in items:
    nested = container.get("stories", [])
    if nested:
        total += len(nested)
        story_ids.extend([s["id"] for s in nested])
```

---

## 🟡 Важное: Разница между upload-серверами для стены и сторис

| Параметр | Стена (Wall) | Истории (Stories) |
|---|---|---|
| Метод получения URL | `photos.getWallUploadServer` | `stories.getPhotoUploadServer` |
| Имя поля загрузки | `photo` | `file` |
| Метод сохранения | `photos.saveWallPhoto` → `wall.post` | `stories.save` |
| Количество шагов | 4 (getServer → upload → save → post) | 3 (getServer → upload → save) |
| Токен загрузки | `user_token` | `user_token` |
| Токен публикации | `community_token` (wall.post) | `user_token` (stories.save) |

---

## 🟢 Информационное: groups.getById — персональные поля только у user token

**Проблема:** При вызове `groups.getById` с community token или service key не возвращаются поля `is_admin`, `admin_level`, `is_member`, `is_advertiser`.

**Причина:** Эти поля описывают связь **конкретного пользователя** с группой. Community token и service key не привязаны к пользователю, поэтому VK не может определить эту связь.

**Решение:** Для проверки прав пользователя в группе (является ли админом, подписчиком и т.д.) использовать **user token**. Для получения публичных данных о группе подойдёт любой токен.

---

## 🟡 Важное: Ошибка 27 при использовании Community Token

`photos.getWallUploadServer` с community token возвращает **Error 27 (Group authorization failed)**. Загрузка фото на стену через VK API всегда требует `user_token`.

---

## 🟡 Важное: Фото из messages-альбома нельзя прикрепить к стене

Фото, загруженные через `photos.getMessagesUploadServer` + `photos.saveMessagesPhoto`, попадают в `album_id: -64` (альбом сообщений). Такие фото **не могут** быть прикреплены к посту на стене через `wall.post` — VK молча игнорирует attachment.
