# Тест 2: Получение данных историй

## Цель

Определить, какие данные и с каким типом токена можно получить по историям сообщества. Тестируются 4 метода с 4 типами токенов.

---

## Файловая структура

```
backend_python/
  services/sandbox/stories_data_test.py        ← Сервис: 4 метода × 4 токена
  routers/sandbox.py                           ← Эндпоинты test2/*

features/sandbox/components/tests/
  test2-stories-data/
    StoriesDataTest.tsx                        ← UI компонент
    useStoriesDataTest.ts                      ← Хук: логика + состояние
```

---

## Тестируемые методы

| Метод | Описание | Требует story_id |
|---|---|---|
| `stories.get` | Список активных историй сообщества | Нет |
| `stories.getStats` | Статистика конкретной истории | Да |
| `stories.getViewers` | Список зрителей с реакциями | Да |
| `viewers_details` | Цепочка: getViewers → users.get (демография) | Да |

---

## Тестируемые токены

| Тип токена | Описание |
|---|---|
| 👤 User (admin) | Standalone-токен администратора сообщества |
| 👥 User (не админ) | Non-standalone токен пользователя, НЕ админа |
| 🏠 Community | Ключ доступа сообщества |
| 🔑 Service | Сервисный ключ приложения |

---

## Результат: Матрица совместимости (17.02.2026)

| Метод | 👤 User (admin) | 👥 User (не админ) | 🏠 Community | 🔑 Service |
|---|---|---|---|---|
| `stories.get` | ✅ 672ms | ❌ err 15.1134 | ✅ 610ms | ❌ err 28 |
| `stories.getStats` | ✅ 569ms | ❌ err 15.1134 | ✅ 567ms | ❌ err 28 |
| `stories.getViewers` | ✅ 913ms | ❌ err 15.1134 | ✅ 549ms | ❌ err 28 |
| `viewers_details` | ✅ 2509ms | ❌ err 15.1134 | ✅ 1151ms | ❌ err 28 |

**Паттерн**: идентичен по всем 4 методам — работают **только** user-admin (standalone) и community token.

---

## Цепочка viewers_details (2 шага)

```
┌────────────────────────────────────────────────────────────────────────┐
│  Шаг 1: stories.getViewers                    [user / community]      │
│  Параметры: owner_id, story_id, count, extended=1                     │
│  Ответ: { count, items: [{ user_id, is_liked, reaction_id }] }        │
├────────────────────────────────────────────────────────────────────────┤
│  Шаг 2: users.get                             [тот же токен]          │
│  Параметры: user_ids (из шага 1),                                     │
│    fields: sex,bdate,city,country,photo_100,domain,                   │
│            has_mobile,last_seen,deactivated,is_closed,                 │
│            can_access_closed                                          │
│  Ответ: детальные профили пользователей                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Расхождения между токенами

### stories.get: User (admin) vs Community

Основные данные (id, owner_id, date, photo, link, clickable_stickers, views, likes_count) — **идентичны**.

**Поля, присутствующие ТОЛЬКО у user-admin:**

| Поле | Значение |
|---|---|
| `can_comment` | `1` |
| `can_reply` | `1` |
| `can_like` | `true` |
| `can_share` | `1` |
| `can_hide` | `1` |
| `is_ads` | `false` |
| `no_sound` | `false` |
| `can_ask` | `0` |
| `can_ask_anonymous` | `0` |
| `preloading_enabled` | `true` |

**Поля groups[], присутствующие ТОЛЬКО у user-admin:**

| Поле | Значение |
|---|---|
| `is_admin` | `1` |
| `admin_level` | `3` |
| `is_member` | `1` |
| `is_advertiser` | `1` |

### users.get (шаг 2 viewers_details): User vs Community

| Поле | 👤 User token | 🏠 Community token |
|---|---|---|
| `country` | `{"id": 1, "title": "Россия"}` | **отсутствует** |
| `has_mobile` | `1` | **отсутствует** |
| `photo_100` URL | `&u=e5Y-...NT8c&cs=100x100` | `&cs=100x100` (без `&u=`) |

Остальные поля (id, domain, bdate, last_seen, sex, first_name, last_name, is_closed, can_access_closed) — **идентичны**.

---

## Эндпоинты

| Эндпоинт | Метод | Описание |
|---|---|---|
| `/api/sandbox/test2/single-method?method=...` | POST | Один метод × все токены |
| `/api/sandbox/test2/full-test` | POST | Все 4 метода × все токены (матрица) |
