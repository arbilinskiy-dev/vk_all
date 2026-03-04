# 📋 Справочник типов событий VK Callback API

Полный перечень всех типов событий, поддерживаемых нашей системой.  
Источник: `services/vk_callback/models.py` → `EventType` enum.

---

## Категории и события

### 🔐 Подтверждение сервера (`confirmation`)

| Тип события | Enum | Описание |
|---|---|---|
| `confirmation` | `EventType.CONFIRMATION` | Подтверждение сервера при настройке Callback API |

> Обрабатывается **синхронно** в `dispatcher.py` — возвращает confirmation_code.

---

### 📝 Записи на стене (`wall`)

| Тип события | Enum | Хендлер | Описание |
|---|---|---|---|
| `wall_post_new` | `EventType.WALL_POST_NEW` | `WallPostNewHandler` | Новый пост (сразу или из отложки) |
| `wall_repost` | `EventType.WALL_REPOST` | `WallRepostHandler` | Репост записи |
| `wall_schedule_post_new` | `EventType.WALL_SCHEDULE_POST_NEW` | `WallSchedulePostNewHandler` | Создана отложенная запись |
| `wall_schedule_post_delete` | `EventType.WALL_SCHEDULE_POST_DELETE` | `WallSchedulePostDeleteHandler` | Удалена / отредактирована отложенная запись |
| `postponed_new` | `EventType.POSTPONED_NEW` | → `WallSchedulePostNewHandler` | Устаревший алиас |
| `postponed_delete` | `EventType.POSTPONED_DELETE` | → `WallSchedulePostDeleteHandler` | Устаревший алиас |

---

### 💬 Комментарии на стене (`wall_comments`)

| Тип события | Enum | Описание |
|---|---|---|
| `wall_reply_new` | `EventType.WALL_REPLY_NEW` | Новый комментарий |
| `wall_reply_edit` | `EventType.WALL_REPLY_EDIT` | Редактирование комментария |
| `wall_reply_restore` | `EventType.WALL_REPLY_RESTORE` | Восстановление комментария |
| `wall_reply_delete` | `EventType.WALL_REPLY_DELETE` | Удаление комментария |

---

### 📨 Сообщения (`messages`)

| Тип события | Enum | Описание |
|---|---|---|
| `message_new` | `EventType.MESSAGE_NEW` | Новое сообщение |
| `message_reply` | `EventType.MESSAGE_REPLY` | Ответ на сообщение |
| `message_edit` | `EventType.MESSAGE_EDIT` | Редактирование сообщения |
| `message_allow` | `EventType.MESSAGE_ALLOW` | Пользователь разрешил сообщения |
| `message_deny` | `EventType.MESSAGE_DENY` | Пользователь запретил сообщения |
| `message_typing_state` | `EventType.MESSAGE_TYPING_STATE` | Пользователь набирает текст |
| `message_read` | `EventType.MESSAGE_READ` | Сообщение прочитано |
| `message_event` | `EventType.MESSAGE_EVENT` | Действие с callback-кнопкой |

---

### 📷 Фотографии (`photos`)

| Тип события | Enum | Описание |
|---|---|---|
| `photo_new` | `EventType.PHOTO_NEW` | Добавлена фотография |
| `photo_comment_new` | `EventType.PHOTO_COMMENT_NEW` | Новый комментарий к фото |
| `photo_comment_edit` | `EventType.PHOTO_COMMENT_EDIT` | Редактирование комментария |
| `photo_comment_restore` | `EventType.PHOTO_COMMENT_RESTORE` | Восстановление комментария |
| `photo_comment_delete` | `EventType.PHOTO_COMMENT_DELETE` | Удаление комментария |

---

### 🎬 Видеозаписи (`videos`)

| Тип события | Enum | Описание |
|---|---|---|
| `video_new` | `EventType.VIDEO_NEW` | Добавлена видеозапись |
| `video_comment_new` | `EventType.VIDEO_COMMENT_NEW` | Новый комментарий к видео |
| `video_comment_edit` | `EventType.VIDEO_COMMENT_EDIT` | Редактирование комментария |
| `video_comment_restore` | `EventType.VIDEO_COMMENT_RESTORE` | Восстановление комментария |
| `video_comment_delete` | `EventType.VIDEO_COMMENT_DELETE` | Удаление комментария |

---

### 🎵 Аудиозаписи (`audio`)

| Тип события | Enum | Описание |
|---|---|---|
| `audio_new` | `EventType.AUDIO_NEW` | Добавлена аудиозапись |

---

### ❤️ Лайки (`likes`)

| Тип события | Enum | Описание |
|---|---|---|
| `like_add` | `EventType.LIKE_ADD` | Поставлен лайк |
| `like_remove` | `EventType.LIKE_REMOVE` | Снят лайк |

---

### 🗨️ Обсуждения (`board`)

| Тип события | Enum | Описание |
|---|---|---|
| `board_post_new` | `EventType.BOARD_POST_NEW` | Новое сообщение в обсуждении |
| `board_post_edit` | `EventType.BOARD_POST_EDIT` | Редактирование сообщения |
| `board_post_restore` | `EventType.BOARD_POST_RESTORE` | Восстановление сообщения |
| `board_post_delete` | `EventType.BOARD_POST_DELETE` | Удаление сообщения |

---

### 🛒 Товары (`market`)

| Тип события | Enum | Описание |
|---|---|---|
| `market_comment_new` | `EventType.MARKET_COMMENT_NEW` | Новый комментарий к товару |
| `market_comment_edit` | `EventType.MARKET_COMMENT_EDIT` | Редактирование комментария |
| `market_comment_restore` | `EventType.MARKET_COMMENT_RESTORE` | Восстановление комментария |
| `market_comment_delete` | `EventType.MARKET_COMMENT_DELETE` | Удаление комментария |
| `market_order_new` | `EventType.MARKET_ORDER_NEW` | Новый заказ |
| `market_order_edit` | `EventType.MARKET_ORDER_EDIT` | Изменение заказа |

---

### 👥 Участники (`members`)

| Тип события | Enum | Описание |
|---|---|---|
| `group_join` | `EventType.GROUP_JOIN` | Вступление в сообщество |
| `group_leave` | `EventType.GROUP_LEAVE` | Выход из сообщества |
| `user_block` | `EventType.USER_BLOCK` | Блокировка пользователя |
| `user_unblock` | `EventType.USER_UNBLOCK` | Разблокировка пользователя |

---

### ⚙️ Управление сообществом (`group_management`)

| Тип события | Enum | Описание |
|---|---|---|
| `group_officers_edit` | `EventType.GROUP_OFFICERS_EDIT` | Изменение руководителей |
| `group_change_settings` | `EventType.GROUP_CHANGE_SETTINGS` | Изменение настроек |
| `group_change_photo` | `EventType.GROUP_CHANGE_PHOTO` | Изменение фото сообщества |

---

### 📊 Опросы (`polls`)

| Тип события | Enum | Описание |
|---|---|---|
| `poll_vote_new` | `EventType.POLL_VOTE_NEW` | Голос в опросе |

---

### 🍩 VK Donut (`donut`)

| Тип события | Enum | Описание |
|---|---|---|
| `donut_subscription_create` | `EventType.DONUT_SUBSCRIPTION_CREATE` | Оформлена подписка |
| `donut_subscription_prolonged` | `EventType.DONUT_SUBSCRIPTION_PROLONGED` | Продлена подписка |
| `donut_subscription_expired` | `EventType.DONUT_SUBSCRIPTION_EXPIRED` | Подписка истекла |
| `donut_subscription_cancelled` | `EventType.DONUT_SUBSCRIPTION_CANCELLED` | Подписка отменена |
| `donut_subscription_price_changed` | `EventType.DONUT_SUBSCRIPTION_PRICE_CHANGED` | Изменена стоимость |
| `donut_money_withdraw` | `EventType.DONUT_MONEY_WITHDRAW` | Вывод средств |
| `donut_money_withdraw_error` | `EventType.DONUT_MONEY_WITHDRAW_ERROR` | Ошибка вывода |

---

### ❓ Прочие

| Тип события | Enum | Описание |
|---|---|---|
| `vkpay_transaction` | `EventType.VKPAY_TRANSACTION` | Транзакция VK Pay |
| `app_payload` | `EventType.APP_PAYLOAD` | Событие от Mini App |
| `unknown` | `EventType.UNKNOWN` | Неизвестный тип (fallback) |

---

## Статус реализации хендлеров

| Категория | Статус | Файл хендлера |
|---|---|---|
| `confirmation` | ✅ Полная реализация | `handlers/confirmation/handler.py` |
| `wall` (post_new) | ✅ Полная реализация | `handlers/wall/post_new.py` |
| `wall` (repost) | ✅ Полная реализация | `handlers/wall/repost.py` |
| `wall` (schedule_new) | ✅ Полная реализация | `handlers/wall/schedule_post_new.py` |
| `wall` (schedule_delete) | ✅ Полная реализация | `handlers/wall/schedule_post_delete.py` |
| `wall_comments` | 🔲 Stub (логирование) | `handlers/wall_comments/handler.py` |
| `message_new` | ✅ Полная реализация | `handlers/messages/message_new.py` |
| `message_allow/deny` | ✅ Полная реализация | `handlers/messages/message_allow_deny.py` |
| `message_reply/edit/read/typing/event` | 🔲 Stub (логирование) | `handlers/messages/` |
| `photos` | 🔲 Stub (логирование) | `handlers/photos/handler.py` |
| `videos` | 🔲 Stub (логирование) | `handlers/videos/handler.py` |
| `audio` | 🔲 Stub (логирование) | `handlers/audio/handler.py` |
| `likes` | 🔲 Stub (логирование) | `handlers/likes/handler.py` |
| `board` | 🔲 Stub (логирование) | `handlers/board/handler.py` |
| `market` | 🔲 Stub (логирование) | `handlers/market/handler.py` |
| `members` | 🔲 Stub (логирование) | `handlers/members/handler.py` |
| `group_management` | 🔲 Stub (логирование) | `handlers/group_management/handler.py` |
| `polls` | 🔲 Stub (логирование) | `handlers/polls/handler.py` |
| `donut` | 🔲 Stub (логирование) | `handlers/donut/handler.py` |
