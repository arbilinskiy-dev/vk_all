# 🔗 Ссылки на документацию VK API — Callback и события сообществ

Централизованный справочник всех ссылок на официальную документацию VK,  
необходимых для разработки и поддержки системы обработки Callback-событий.

---

## 📌 Callback API — Основное

| Тема | Ссылка |
|---|---|
| **Начало работы с Callback API** | https://dev.vk.com/ru/api/callback/getting-started |
| **Настройка Callback API** | https://dev.vk.com/ru/api/callback/settings |
| **Подтверждение сервера** | https://dev.vk.com/ru/api/callback/confirmation |
| **Формат уведомлений** | https://dev.vk.com/ru/api/callback/notifications-format |

---

## 📋 События сообщества

| Тема | Ссылка |
|---|---|
| **Обзор событий сообществ** | https://dev.vk.com/ru/api/community-events/overview |
| **JSON-схемы всех событий** | https://dev.vk.com/ru/api/community-events/json-schema |

---

## 📨 Типы событий — Детальная документация

### Сообщения

| Событие | Описание | Ссылка |
|---|---|---|
| `message_new` | Новое сообщение | https://dev.vk.com/ru/api/community-events/json-schema#message_new |
| `message_reply` | Ответ на сообщение | https://dev.vk.com/ru/api/community-events/json-schema#message_reply |
| `message_edit` | Редактирование сообщения | https://dev.vk.com/ru/api/community-events/json-schema#message_edit |
| `message_allow` | Подписка на сообщения | https://dev.vk.com/ru/api/community-events/json-schema#message_allow |
| `message_deny` | Запрет сообщений | https://dev.vk.com/ru/api/community-events/json-schema#message_deny |
| `message_event` | Действие с callback-кнопкой | https://dev.vk.com/ru/api/community-events/json-schema#message_event |

### Записи на стене

| Событие | Описание | Ссылка |
|---|---|---|
| `wall_post_new` | Новая запись на стене | https://dev.vk.com/ru/api/community-events/json-schema#wall_post_new |
| `wall_repost` | Репост записи | https://dev.vk.com/ru/api/community-events/json-schema#wall_repost |
| `wall_reply_new` | Новый комментарий | https://dev.vk.com/ru/api/community-events/json-schema#wall_reply_new |
| `wall_reply_edit` | Редактирование комментария | https://dev.vk.com/ru/api/community-events/json-schema#wall_reply_edit |
| `wall_reply_restore` | Восстановление комментария | https://dev.vk.com/ru/api/community-events/json-schema#wall_reply_restore |
| `wall_reply_delete` | Удаление комментария | https://dev.vk.com/ru/api/community-events/json-schema#wall_reply_delete |

### Отложенные записи

| Событие | Описание | Ссылка |
|---|---|---|
| `wall_schedule_post_new` | Создана отложенная запись | https://dev.vk.com/ru/api/community-events/json-schema |
| `wall_schedule_post_delete` | Удалена отложенная запись | https://dev.vk.com/ru/api/community-events/json-schema |
| `postponed_new` | Устаревший алиас wall_schedule_post_new | — (не документирован VK) |
| `postponed_delete` | Устаревший алиас wall_schedule_post_delete | — (не документирован VK) |

> **⚠️ Внимание:** VK иногда присылает устаревшие имена `postponed_new` / `postponed_delete` вместо актуальных `wall_schedule_post_*`. Наша система обрабатывает оба варианта.

### Фотографии

| Событие | Описание | Ссылка |
|---|---|---|
| `photo_new` | Добавлена новая фотография | https://dev.vk.com/ru/api/community-events/json-schema#photo_new |
| `photo_comment_new` | Новый комментарий к фото | https://dev.vk.com/ru/api/community-events/json-schema#photo_comment_new |
| `photo_comment_edit` | Редактирование комментария к фото | https://dev.vk.com/ru/api/community-events/json-schema#photo_comment_edit |
| `photo_comment_restore` | Восстановление комментария к фото | https://dev.vk.com/ru/api/community-events/json-schema#photo_comment_restore |
| `photo_comment_delete` | Удаление комментария к фото | https://dev.vk.com/ru/api/community-events/json-schema#photo_comment_delete |

### Видеозаписи

| Событие | Описание | Ссылка |
|---|---|---|
| `video_new` | Добавлена новая видеозапись | https://dev.vk.com/ru/api/community-events/json-schema#video_new |
| `video_comment_new` | Новый комментарий к видео | https://dev.vk.com/ru/api/community-events/json-schema#video_comment_new |
| `video_comment_edit` | Редактирование комментария к видео | https://dev.vk.com/ru/api/community-events/json-schema#video_comment_edit |
| `video_comment_restore` | Восстановление комментария к видео | https://dev.vk.com/ru/api/community-events/json-schema#video_comment_restore |
| `video_comment_delete` | Удаление комментария к видео | https://dev.vk.com/ru/api/community-events/json-schema#video_comment_delete |

### Аудиозаписи

| Событие | Описание | Ссылка |
|---|---|---|
| `audio_new` | Добавлена аудиозапись | https://dev.vk.com/ru/api/community-events/json-schema#audio_new |

### Лайки

| Событие | Описание | Ссылка |
|---|---|---|
| `like_add` | Поставлен лайк | https://dev.vk.com/ru/api/community-events/json-schema#like_add |
| `like_remove` | Снят лайк | https://dev.vk.com/ru/api/community-events/json-schema#like_remove |

### Товары (Market)

| Событие | Описание | Ссылка |
|---|---|---|
| `market_comment_new` | Новый комментарий к товару | https://dev.vk.com/ru/api/community-events/json-schema#market_comment_new |
| `market_comment_edit` | Редактирование комментария к товару | https://dev.vk.com/ru/api/community-events/json-schema#market_comment_edit |
| `market_comment_restore` | Восстановление комментария | https://dev.vk.com/ru/api/community-events/json-schema#market_comment_restore |
| `market_comment_delete` | Удаление комментария к товару | https://dev.vk.com/ru/api/community-events/json-schema#market_comment_delete |
| `market_order_new` | Новый заказ | https://dev.vk.com/ru/api/community-events/json-schema#market_order_new |
| `market_order_edit` | Изменение заказа | https://dev.vk.com/ru/api/community-events/json-schema#market_order_edit |

### Обсуждения (Board)

| Событие | Описание | Ссылка |
|---|---|---|
| `board_post_new` | Новое сообщение в обсуждении | https://dev.vk.com/ru/api/community-events/json-schema#board_post_new |
| `board_post_edit` | Редактирование сообщения | https://dev.vk.com/ru/api/community-events/json-schema#board_post_edit |
| `board_post_restore` | Восстановление сообщения | https://dev.vk.com/ru/api/community-events/json-schema#board_post_restore |
| `board_post_delete` | Удаление сообщения | https://dev.vk.com/ru/api/community-events/json-schema#board_post_delete |

### Участники

| Событие | Описание | Ссылка |
|---|---|---|
| `group_join` | Вступление в сообщество | https://dev.vk.com/ru/api/community-events/json-schema#group_join |
| `group_leave` | Выход из сообщества | https://dev.vk.com/ru/api/community-events/json-schema#group_leave |
| `user_block` | Блокировка пользователя | https://dev.vk.com/ru/api/community-events/json-schema#user_block |
| `user_unblock` | Разблокировка пользователя | https://dev.vk.com/ru/api/community-events/json-schema#user_unblock |

### Управление сообществом

| Событие | Описание | Ссылка |
|---|---|---|
| `group_officers_edit` | Изменение руководителей | https://dev.vk.com/ru/api/community-events/json-schema#group_officers_edit |
| `group_change_settings` | Изменение настроек | https://dev.vk.com/ru/api/community-events/json-schema#group_change_settings |
| `group_change_photo` | Изменение фото сообщества | https://dev.vk.com/ru/api/community-events/json-schema#group_change_photo |

### Опросы

| Событие | Описание | Ссылка |
|---|---|---|
| `poll_vote_new` | Новый голос в опросе | https://dev.vk.com/ru/api/community-events/json-schema#poll_vote_new |

### VK Donut

| Событие | Описание | Ссылка |
|---|---|---|
| `donut_subscription_create` | Оформлена подписка | https://dev.vk.com/ru/api/community-events/json-schema#donut_subscription_create |
| `donut_subscription_prolonged` | Продление подписки | https://dev.vk.com/ru/api/community-events/json-schema#donut_subscription_prolonged |
| `donut_subscription_expired` | Подписка истекла | https://dev.vk.com/ru/api/community-events/json-schema#donut_subscription_expired |
| `donut_subscription_cancelled` | Подписка отменена | https://dev.vk.com/ru/api/community-events/json-schema#donut_subscription_cancelled |
| `donut_subscription_price_changed` | Изменена стоимость подписки | https://dev.vk.com/ru/api/community-events/json-schema#donut_subscription_price_changed |
| `donut_money_withdraw` | Вывод средств | https://dev.vk.com/ru/api/community-events/json-schema#donut_money_withdraw |
| `donut_money_withdraw_error` | Ошибка при выводе средств | https://dev.vk.com/ru/api/community-events/json-schema#donut_money_withdraw_error |

---

## 🔧 VK API Методы — используемые в хендлерах

| Метод | Описание | Ссылка |
|---|---|---|
| `wall.get` | Получение записей стены | https://dev.vk.com/ru/method/wall.get |
| `wall.getById` | Получение записи по ID | https://dev.vk.com/ru/method/wall.getById |
| `wall.post` | Публикация записи | https://dev.vk.com/ru/method/wall.post |
| `wall.edit` | Редактирование записи | https://dev.vk.com/ru/method/wall.edit |
| `wall.delete` | Удаление записи | https://dev.vk.com/ru/method/wall.delete |
| `groups.getCallbackConfirmationCode` | Получение кода подтверждения | https://dev.vk.com/ru/method/groups.getCallbackConfirmationCode |
| `groups.getCallbackServers` | Список Callback-серверов | https://dev.vk.com/ru/method/groups.getCallbackServers |
| `groups.addCallbackServer` | Добавление Callback-сервера | https://dev.vk.com/ru/method/groups.addCallbackServer |
| `groups.editCallbackServer` | Редактирование Callback-сервера | https://dev.vk.com/ru/method/groups.editCallbackServer |
| `groups.deleteCallbackServer` | Удаление Callback-сервера | https://dev.vk.com/ru/method/groups.deleteCallbackServer |
| `groups.setCallbackSettings` | Настройка типов событий | https://dev.vk.com/ru/method/groups.setCallbackSettings |
| `groups.getCallbackSettings` | Получение настроек событий | https://dev.vk.com/ru/method/groups.getCallbackSettings |

---

## 📖 Дополнительные разделы документации VK

| Тема | Ссылка |
|---|---|
| Общая документация VK API | https://dev.vk.com/ru/api/overview |
| Авторизация (токены) | https://dev.vk.com/ru/api/access-token/getting-started |
| Сервисный ключ доступа | https://dev.vk.com/ru/api/access-token/authcode-flow-community |
| Ключ доступа сообщества | https://dev.vk.com/ru/api/community-messages/getting-started |
| Ошибки API | https://dev.vk.com/ru/reference/errors |
| Лимиты и ограничения | https://dev.vk.com/ru/api/api-requests |
| Bots Long Poll API (альтернатива Callback) | https://dev.vk.com/ru/api/bots-long-poll/getting-started |

---

> **Последнее обновление:** Июль 2025  
> **Заметка:** Якоря вида `#event_name` на странице JSON-схемы работают не всегда — VK периодически меняет формат. Если якорь не срабатывает, открой основную страницу и найди нужное событие поиском (Ctrl+F).
