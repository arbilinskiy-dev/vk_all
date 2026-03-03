# Release 8 — Технический журнал

**Период:** 02.03.2026 — 03.03.2026

---

## 1. Система промокодов (новый модуль)

### 🆕 Полный модуль управления промокодами

**Описание:**  
С нуля разработан полноценный модуль промокодов — от БД-моделей до UI. Позволяет создавать именованные списки промокодов, загружать коды массово, выдавать их автоматически при отправке сообщений через шаблоны и отслеживать каждую выдачу.

**Бэкенд — модели и CRUD:**
- **Модель `PromoList`** — список промокодов: `name` (отображаемое имя), `slug` (уникальный ключ в рамках проекта, латиница), `is_one_time` (одноразовые коды), привязка к `project_id` (CASCADE)
- **Модель `PromoListCode`** — отдельный промокод: `code`, `description`, `status` (`free`/`issued`), полная аудиторская цепочка выдачи (`issued_to_user_id`, `issued_to_user_name`, `issued_at`, `issued_in_project_id`, `issued_message_id`), `sort_order` для порядка выдачи
- **CRUD** (`promo_list_crud.py`): создание/обновление/удаление списков, массовое добавление кодов, атомарная выдача через `SELECT ... FOR UPDATE`
- **9 API-эндпоинтов** в роутере `/api/promo-lists`: CRUD списков, CRUD кодов, массовое добавление, удаление всех свободных, получение переменных для шаблонов

**Бэкенд — сервис подстановки (`promo_list_service.py`):**
- **`substitute_promo_variables()`** — regex-замена `{promo_<slug>_code}` и `{promo_<slug>_description}` в тексте сообщения
- **Два режима:**
  - `dry_run=True` (превью) — `peek_free_code()` подсматривает первый свободный код БЕЗ резервирования
  - `dry_run=False` (реальная отправка) — `acquire_free_code()` атомарно забирает код, помечает `status=issued` с данными получателя
- **Кэш в рамках одного сообщения** — если в тексте и `{promo_sale100_code}`, и `{promo_sale100_description}`, оба берутся из одного промокода
- **`get_variables()`** — возвращает список `PromoVariableInfo` для фронтенд-кнопок с количеством свободных кодов

**Фронтенд — вкладка «Промокоды» (`PromocodesTab.tsx`, 758 строк):**
- **5 UI-режимов:** `lists` (список списков), `codes` (просмотр кодов), `create-list` (создание списка), `edit-list` (редактирование), `add-codes` (массовое добавление)
- **Создание списка:** поле «Название» (авто-генерация slug из кириллицы → латиница), поле «Slug» (font-mono, фильтр `[^a-z0-9_]`), подсказка с переменными (`{promo_<slug>_code}`, `{promo_<slug>_description}`), чекбокс «Одноразовые промокоды»
- **Массовое добавление кодов:** textarea, формат `код;описание` по одному на строку, счётчик «Будет добавлено: N промокодов»
- **Просмотр кодов:** счётчики Всего/Свободных/Выданных, фильтр-pills (Все/Свободные/Выданные)
- **Карточка выданного кода:** имя получателя (ссылка на VK), VK ID, дата выдачи, кнопки «Перейти в чат» и «ЛС VK»
- **Удаление:** только свободные коды (защита выданных), массовая очистка «Очистить свободные» с подтверждением

**Фронтенд — хук `usePromoLists.ts` (253 строки):**
- CRUD-операции для списков и кодов
- Управление состоянием (загрузка, фильтрация по статусу)
- Загрузка промо-переменных для VariablesSelector

**Фронтенд — API-модуль `promo_lists.api.ts` (139 строк):**
- Типы: `PromoList`, `PromoCode`, `PromoVariableInfo`, `PromoCodesListResponse`
- 9 API-вызовов, соответствующих бэкенд-эндпоинтам

**Интеграция с отправкой сообщений (`send_service.py`):**
- При реальной отправке сообщения вызывается `substitute_promo_variables(dry_run=False)` — промокод атомарно выдаётся получателю
- Используется имя ПОЛУЧАТЕЛЯ (`recipient_name`), а не менеджера

**Файл(ы):**
- `backend_python/models_library/promo_lists.py` (новый) — ORM-модели PromoList, PromoListCode
- `backend_python/crud/promo_list_crud.py` (новый) — CRUD с атомарной выдачей
- `backend_python/services/promo_list_service.py` (новый) — подстановка переменных, peek/acquire
- `backend_python/routers/promo_lists.py` (новый) — 9 эндпоинтов
- `backend_python/services/messages/send_service.py` — интеграция подстановки при отправке
- `features/messages/components/promocodes/PromocodesTab.tsx` (новый) — UI вкладки
- `features/messages/hooks/usePromoLists.ts` (новый) — хук
- `services/api/promo_lists.api.ts` (новый) — API-модуль

---

## 2. Промо-переменные в шаблонах ответов

### 🆕 Переменные `{promo_*}` для автоматической выдачи промокодов через шаблоны

**Описание:**  
Шаблоны ответов теперь поддерживают промо-переменные — при отправке сообщения через шаблон промокод автоматически выдаётся получателю. Для каждого списка промокодов доступны две переменные:
- `{promo_<slug>_code}` — подставляет код промокода (например `"217831"`)
- `{promo_<slug>_description}` — подставляет описание промокода (например `"Скидка 100 ₽ на следующий заказ"`)

**Как это работает:**
1. Администратор создаёт список промокодов со slug (например `sale100`) и загружает коды
2. В шаблоне ответа пишет: `Ваш промокод: {promo_sale100_code} — {promo_sale100_description}`
3. При **предпросмотре** — бэкенд показывает реальный свободный код без его резервирования
4. При **отправке сообщения** — бэкенд атомарно забирает свободный код, помечает как выданный с привязкой к получателю
5. Получатель видит: `Ваш промокод: 217831 — Скидка 100 ₽ на следующий заказ`

**Расширение VariablesSelector:**
- В компонент вставки переменных добавлена секция «Промокоды» (проп `promoVariables`)
- Для каждого списка — две кнопки: янтарная 🎫 «код» (с счётчиком свободных) и фиолетовая 📝 «описание»
- Кнопки вставляют плейсхолдер `{promo_<slug>_code}` или `{promo_<slug>_description}` в текст шаблона

**Расшифровка переменных в превью:**
- Под превью шаблона отображаются бейджи с описанием каждой переменной
- Для промо-переменных показывается источник (название списка) и количество свободных кодов

**Файл(ы):**
- `features/posts/components/VariablesSelector.tsx` — секция «Промокоды», проп `promoVariables`
- `features/messages/components/templates/TemplateInlineEditor.tsx` — передача `promoVariables` в VariablesSelector
- `features/messages/components/templates/TemplatesTab.tsx` — загрузка промо-переменных, бейджи расшифровки
- `backend_python/services/message_template_service.py` — `preview_template()` с цепочкой подстановок: global → promo (dry_run) → username
- `backend_python/services/messages/send_service.py` — подстановка при реальной отправке (dry_run=False)

---

### 🆕 Цепочка подстановки переменных при предпросмотре и отправке

**Описание:**  
Реализована двухуровневая система подстановки переменных с чёткой последовательностью:

**При предпросмотре (`preview_template`):**
1. Клиент подставляет `{username}` → реальное имя собеседника (до отправки на сервер)
2. Бэкенд: `substitute_global_variables()` — `{global_<key>}` → значения из таблицы глобальных переменных проекта
3. Бэкенд: `substitute_promo_variables(dry_run=True)` — `{promo_<slug>_code/description}` → реальный свободный код (peek, без резервирования)
4. Бэкенд: `{username}` → имя из VkProfile (fallback, если клиент не подставил)

**При реальной отправке (`send_service`):**
1. `substitute_global_variables()` — глобальные переменные
2. `substitute_promo_variables(dry_run=False)` — атомарная выдача промокода (acquire, `SELECT ... FOR UPDATE`)

**Файл(ы):**
- `backend_python/services/message_template_service.py` — `preview_template()`
- `backend_python/services/global_variable_service.py` — `substitute_global_variables()`
- `backend_python/services/promo_list_service.py` — `substitute_promo_variables()`
- `backend_python/services/messages/send_service.py` — подстановка при отправке

---

## 3. Мониторинг сообщений (Message Stats)

### 🆕 Кликабельные карточки сводки для суб-фильтрации входящих

**Описание:**  
9 карточек сводки на вкладке «Входящие» (Сообщения / Диалоги / Пользователи × 3 колонки) сделаны интерактивными. Клик по карточкам «Реальные (набранные)» / «С реальными сообщ.» / «Отправляли сообщ.» фильтрует график и таблицу — показываются только данные по текстовым (text) сообщениям. Аналогично «По кнопке / бот» / «С нажатием кнопки» / «Нажимали кнопки» — показываются только кнопочные (payload). Левая колонка (общие показатели) сбрасывает фильтр.

**Реализация:**  
1. **Тип** `IncomingSubFilter = 'all' | 'text' | 'payload'` в `messageStatsConstants.ts`
2. **Хук** `useMessageStatsLogic.ts`:
   - Состояние `incomingSubFilter`
   - Мемо `filteredChartData` — подменяет `incoming` на `incoming_text`/`incoming_payload`
   - Мемо `displayProjectsStats` — подменяет `total_incoming`/`incoming_dialogs` на суб-категории
   - `filteredProjectsStats` — фильтрует проекты без нужного типа сообщений
   - `toggleIncomingSubFilter` (toggle) и `setIncomingSubFilter` (set)
   - `handleSetActiveTab` — сброс суб-фильтра при смене вкладки
   - Сброс раскрытых проектов при изменении суб-фильтра
   - Передача `messageType` в `loadUsersForProject`
3. **Страница** `MessageStatsPage.tsx`: все 9 SummaryCard с `onClick` и `active`, график/таблица используют отфильтрованные данные
4. **API** `messages_stats.api.ts`: параметр `messageType` → `message_type`
5. **Роутер** `messages_stats.py`: параметр `message_type`, проброс в CRUD
6. **CRUD** `_users.py`: `message_type` в `_collect_active_user_ids`, `_count_per_user_from_hourly`, `get_project_users`

**Файл(ы):**
- `features/messages/components/stats/messageStatsConstants.ts`
- `features/messages/components/stats/useMessageStatsLogic.ts`
- `features/messages/components/stats/MessageStatsPage.tsx`
- `services/api/messages_stats.api.ts`
- `backend_python/routers/messages_stats.py`
- `backend_python/crud/message_stats/_users.py`

---

### 🆕 Обогащение профилей пользователей (фото и имена)

**Проблема:**  
В таблице пользователей модуля мониторинга сообщений вместо имён и фото отображались raw VK ID вида `id268847006`. VkProfile таблица заполнялась только при синхронизации подписчиков или открытии чата — но не при записи сообщений через callback.

**Причина:**  
VkProfile заполнялся только двумя путями: sync подписчиков (`getMembers` VK API) и открытие чата. Сервис статистики сообщений (`messages_stats`) не вызывал VK API `users.get` для получения профилей новых пользователей.

**Решение:**  
Создан сервис `profile_enrichment.py` — batch-обогащение профилей через VK API `users.get` (батчи по 1000). Вызывается автоматически в эндпоинте `GET /messages/stats/project/{project_id}/users` — если у возвращённых пользователей нет `first_name`, запрашивает VK API и upsert'ит в VkProfile. Фронтенд `MessageStatsUsersTable.tsx` обновлён — показывает аватар через `UserAvatar` компонент и имя через `first_name last_name`.

**Файл(ы):**
- `backend_python/services/messages/profile_enrichment.py` (новый)
- `backend_python/routers/messages_stats.py`
- `features/messages/components/stats/MessageStatsUsersTable.tsx`

---

### ✅ Данные пользователей не фильтровались по выбранному периоду

**Проблема:**  
При выборе периода «Сегодня» строка проекта показывала правильные цифры (например, 0 входящих), но при раскрытии — пользователи отображались с all-time данными (242 и 1 входящее). Данные проекта и пользователей кардинально расходились.

**Причина:**  
Эндпоинт `/project/{id}/users` читал из таблицы `MessageStatsUser` (кумулятивная all-time таблица) без фильтрации по датам, тогда как строки проектов считались из `MessageStatsHourly` с фильтром по `hour_slot`.

**Решение:**  
Полная цепочка фильтрации по дате от фронтенда до бэкенда:
1. **Бэкенд CRUD** (`_users.py`): полностью переписан — добавлены хелперы `_collect_active_user_ids()` и `_count_per_user_from_hourly()`, которые парсят JSON-массивы пользователей из hourly-слотов и пропорционально распределяют счётчики
2. **Бэкенд роутер** (`messages_stats.py`): добавлены query-параметры `date_from`, `date_to`
3. **API-сервис** (`messages_stats.api.ts`): добавлены `dateFrom`, `dateTo` параметры
4. **Хук** (`useMessageStatsLogic.ts`): передаёт `dateFrom`/`dateTo` в загрузку пользователей, сброс кеша при смене периода

**Файл(ы):**
- `backend_python/crud/message_stats/_users.py` — хелперы `_collect_active_user_ids`, `_count_per_user_from_hourly`, параметры `date_from`/`date_to`
- `backend_python/routers/messages_stats.py` — параметры `date_from`, `date_to`
- `services/api/messages_stats.api.ts` — параметры `dateFrom`, `dateTo`
- `features/messages/components/stats/useMessageStatsLogic.ts` — передача периода, сброс кеша

---

### ✅ Дублирование строк (React-ключей) в таблице мониторинга

**Проблема:**  
React-консоль показывала ошибки: `Encountered two children with the same key "18407603"`, `"808080709"`. Стек вёл в `ProjectsStatsTable.tsx:243`. Одни и те же пользователи отображались несколько раз внутри раскрытого проекта.

**Причина:**  
`_users.py` (CRUD детализации по пользователям) делал JOIN через промежуточную таблицу `ProjectDialog` только по `project_id` без `vk_user_id`. Если у пользователя было N диалогов в проекте, получался Cartesian product — N дублей строки.

**Решение:**  
1. Убран промежуточный JOIN через `ProjectDialog`
2. Заменён на прямой `outerjoin(VkProfile, VkProfile.vk_user_id == MessageStatsUser.vk_user_id)`
3. Добавлен фронтенд safety-net: дедупликация по `vk_user_id` в `ProjectsStatsTable.tsx`

**Файл(ы):**
- `backend_python/crud/message_stats/_users.py` — замена JOIN
- `features/messages/components/stats/ProjectsStatsTable.tsx` — дедупликация

---

### ✅ Суб-фильтр «реальные (набранные)» показывал пользователей с кнопочными сообщениями

**Проблема:**  
При нажатии на карточку «Реальные (набранные)» или «Отправляли сообщ.» в таблице отображались пользователи, которые только нажимали кнопки бота (payload), но не отправляли текстовые сообщения. Например, Алена Горелова (id493282588) жала только кнопку «Вызвать меню», но отображалась в выборке «реальных».

**Причина:**  
Сверка `reconcile.py` получает историю через VK API `messages.getHistory`, который **не возвращает** поле `payload` — невозможно отличить текстовое сообщение от нажатия кнопки. При создании новой hourly-строки все входящие пользователи записываются в `unique_text_users_json`, а `unique_payload_users_json` остаётся `"[]"`. Callback/sync корректно разделяют text/payload по наличию `message.payload`, но reconcile затирает эту информацию.

**Решение:**  
Логика исключения на уровне чтения (CRUD `_users.py`):
1. `_collect_active_user_ids` при `message_type='text'`: собирает ОБА множества (text и payload) из всех hourly-слотов и возвращает `text_users - payload_users`. Поскольку callback/sync достоверно записывают payload-юзеров, любой пользователь из `unique_payload_users_json` точно жал кнопку → исключается из «реальных»
2. `_count_per_user_from_hourly`: добавлено пересечение `inc_users &= active_ids` чтобы исключённые payload-юзеры не участвовали в распределении счётчиков

**Файл(ы):**
- `backend_python/crud/message_stats/_users.py` — `_collect_active_user_ids` (text - payload), `_count_per_user_from_hourly` (пересечение с active_ids)

---

### ✅ Фильтр «только текст» показывал пользователей с кнопками (фронтенд + бэкенд)

**Проблема:**  
При активации суб-фильтра «Реальные (набранные)» в статистике сообщений в раскрытом проекте отображались пользователи, которые отправляли ТОЛЬКО кнопочные сообщения (payload). Также карточки сводки «Реальные (набранные)», «С реальными сообщ.» и «Отправляли сообщ.» показывали завышенные числа.

**Причина:**  
Три независимых бага:
1. **Фронтенд (`messages_stats.api.ts`):** Функция `fetchMessageStatsUsers` принимала `messageType` в интерфейсе, но НЕ добавляла его в URL query string → бэкенд получал запрос без `message_type` → возвращал ВСЕХ пользователей
2. **Бэкенд (`_summary.py`):** `unique_text_users` считался как `len(text_users)` без вычитания payload-пользователей. Из-за reconcile (VK API history не различает text/payload) пользователи попадали в оба JSON-массива → завышение
3. **Бэкенд (`_summary.py`):** `dialogs_with_text` аналогично считался без вычитания → завышение

**Решение:**  
1. `services/api/messages_stats.api.ts` — добавлена строка `if (params?.messageType) searchParams.set('message_type', params.messageType)`
2. `_summary.py` — глобальная сводка: `unique_text_users = len(text_users - payload_users)`, `dialogs_with_text = len(text_pairs - payload_pairs)`
3. `_summary.py` — per-project сводка: аналогичное вычитание `t_set - p_set`

**Файл(ы):**
- `services/api/messages_stats.api.ts`
- `backend_python/crud/message_stats/_summary.py`

---

### ✅ Несоответствие счётчика «Входящих» и количества пользователей при фильтре «только текст»

**Проблема:**  
В карточке проекта при суб-фильтре «Реальные (набранные)» столбец «Входящих» показывал 2, а в раскрытом списке — только 1 пользователь с 1 сообщением. Аналогично в глобальной карточке «Реальные (набранные)».

**Причина:**  
`incoming_text` — SQL-сумма `incoming_text_count` по hourly-слотам — включала сообщения ОТ ВСЕХ пользователей из `text_json`, в т.ч. тех, кто одновременно в `payload_json` (overlapping users). Список пользователей корректно фильтровал через `text - payload`, но счётчик сообщений не фильтровался.

**Решение:**  
Добавлено поле `filtered_incoming_text` — пропорциональный подсчёт: `incoming_text_count × len(text_only_users) / len(all_text_users)` в каждом hourly-слоте. Фронтенд карточка «Реальные (набранные)» и столбец «Входящих» при суб-фильтре text теперь берут `filtered_incoming_text`.

**Файл(ы):**
- `backend_python/crud/message_stats/_summary.py`
- `features/messages/components/stats/useMessageStatsLogic.ts`
- `features/messages/components/stats/MessageStatsPage.tsx`

---

## 4. Диалоги и сайдбар сообщений

### 🆕 Маркер «Важное» (звёздочка) для диалогов

**Описание:**  
Полноценная система пометки диалогов как «Важные» со звёздочкой — бэкенд-персистенция + фронтенд UI + фильтрация.

**Реализация:**  
**Бэкенд:**
- Добавлено поле `is_important` (Boolean, default=False) в модель `ProjectDialog` (ORM)
- Создана миграция ALTER TABLE project_dialogs ADD COLUMN is_important (Step 1.5)
- Новый эндпоинт `PUT /messages/toggle-important` с Pydantic-схемой `ToggleImportantRequest`
- В `conversations_init_service` добавлена ветка `filter_unread='important'` для серверной фильтрации + словарь `important_dialogs` в ответе

**Фронтенд:**
- Интерфейс `Conversation` расширен полем `isImportant?: boolean`
- API: `toggleDialogImportant()` + парсинг `important_dialogs` в ответе init
- Маппер: `importantMap` параметр в `mapSubscriberToConversation`
- Хук `useConversations`: состояние importantMap, оптимистичный toggle, колбэк `toggleImportant`
- `ChatHeader.tsx`: кнопка-звёздочка (SVG filled/outline, amber) с пропсами isImportant/onToggleImportant
- `ConversationItem.tsx`: маленькая amber-звёздочка рядом с именем при isImportant=true
- `ConversationsSidebar.tsx`: новая вкладка фильтра «Важные» (звезда SVG)
- Тип `filterUnread` расширен значением `'important'`

**Файл(ы):**
- `backend_python/models_library/dialogs_authors.py`
- `backend_python/db_migrations/dialogs_authors.py`
- `backend_python/schemas/messages_schemas.py`
- `backend_python/routers/messages.py`
- `backend_python/services/messages/conversations_init_service.py`
- `features/messages/types.ts`
- `services/api/messages.api.ts`
- `features/messages/hooks/chat/conversationsMappers.ts`
- `features/messages/hooks/chat/conversationsTypes.ts`
- `features/messages/hooks/chat/useConversations.ts`
- `features/messages/components/chat/ChatHeader.tsx`
- `features/messages/components/chat/ChatView.tsx`
- `features/messages/components/conversations/ConversationItem.tsx`
- `features/messages/components/conversations/ConversationsSidebar.tsx`
- `App.tsx`
- `features/navigation/components/AppContent.tsx`

---

### 🆕 SVG-иконки фильтров в сайдбаре диалогов

**Описание:**  
Замена текстовых кнопок фильтрации диалогов на компактные SVG-иконки для экономии пространства.

**Реализация:**  
Четыре иконки-кнопки:
- «Все» — chat bubble SVG
- «Непрочитанные» — конверт с бейджем SVG
- «Важные» — звезда SVG
- «Прочитать все» — галочка SVG

Размеры: кнопки `w-6 h-6`, иконки `h-3.5 w-3.5`. Стиль: белый fill при активном, gray-400 при неактивном, hover-эффекты. Gap между кнопками `gap-0.5`, padding `py-1`, badge `12px` height.

**Файл(ы):**
- `features/messages/components/conversations/ConversationsSidebar.tsx`

---

### 🆕 Сворачиваемая правая панель с компактным режимом

**Описание:**  
Правая информационная панель (UserInfoPanel) теперь сворачивается/разворачивается. В свёрнутом состоянии показывается компактная карточка пользователя (CompactUserInfo) с навигацией по вкладкам.

**Реализация:**  
**Состояние панели:**
- `isInfoPanelExpanded` в MessagesPage, сохраняется в localStorage ключ `vk-planner-info-panel-expanded`
- `toggleInfoPanel` переключает expand/collapse
- Кнопка-стрелка (ChevronRight/ChevronLeft SVG) в шапке панели (слева от лейбла «Инфо»)

**CompactUserInfo (новый компонент):**
- Аватар (w-11), имя (text-[13px]), online-статус
- Статистика: посты, вложения, сообщения (text-base числа)
- Данные: город, первый контакт, «клиент написал», «мы написали», источник, онлайн (text-xs, иконки h-3.5)
- 5 кликабельных вкладок (Профиль, Посты, Вложения, Шаблоны, Промокоды) — при клике разворачивается панель на выбранной вкладке
- Экспорт типа `InfoTab` для типизации навигации
- Стрелка навигации → на каждой вкладке (opacity-0, group-hover:opacity-100)

**Навигация вкладок:**
- `initialTab` state + `handleExpandToTab` callback в MessagesPage
- `initialTab` prop в UserInfoPanel с useEffect для переключения активной вкладки

**Адаптивная ширина:**
- Expanded: ChatView `w-1/2`, UserInfoPanel `flex-1` (≈320px)
- Collapsed: ChatView `flex-1`, CompactUserInfo фиксированная ширина

**Файл(ы):**
- `features/messages/components/user-info/CompactUserInfo.tsx` (новый)
- `features/messages/components/user-info/UserInfoPanel.tsx`
- `features/messages/components/MessagesPage.tsx`

---

### ✅ Фильтр «Непрочитанные» не фильтровал диалоги

**Проблема:**  
При переключении фильтра на «Непрочитанные» в модуле сообщений список показывал обычную страницу из 50 подписчиков — без фильтрации по непрочитанным. Счётчик непрочитанных при этом показывал 0, хотя на вкладке «Все» непрочитанные корректно отображались (например, 21 из 71).

**Причина:**  
Оптимизированный эндпоинт `POST /messages/conversations-init` (заменяющий 4 отдельных запроса) не поддерживал параметр `filter_unread`. Фронтенд-хук `useConversations` вычислял `sortUnreadFirst = (filterUnread === 'all')` — при `filterUnread='unread'` это давало `false`, и далее:
1. **Фронтенд:** передавал только `{ sort_unread_first: false }` без `filter_unread`
2. **Бэкенд-схема:** `ConversationsInitRequest` не содержала поля `filter_unread`
3. **Бэкенд-сервис:** при `sort_unread_first=False` пропускал вызов `get_unread_user_ids()` и загружал обычную страницу из 50 подписчиков через `fetch_list_items()` без фильтрации
4. Результат: 50 случайных подписчиков, 0 из которых с непрочитанными

При этом старый путь через `getSubscribers` → `fetch_list_items(filter_unread='unread')` работал корректно — он вызывал `get_unread_user_ids()` и фильтровал SQL-запрос `.filter(vk_user_id_col.in_(unread_ids))`.

**Решение:**  
Добавлена поддержка параметра `filter_unread` во всю цепочку `conversations-init`:

1. **Бэкенд-схема** (`messages_schemas.py`): добавлено поле `filter_unread: str = 'all'` в `ConversationsInitRequest`
2. **Бэкенд-роутер** (`routers/messages.py`): прокидывается `body.filter_unread` в сервис
3. **Бэкенд-сервис** (`conversations_init_service.py`):
   - Условие вызова `get_unread_user_ids()` изменено с `if sort_unread_first` на `if sort_unread_first or filter_unread == 'unread'`
   - Параметр `filter_unread` передаётся в `fetch_list_items()` и `fetch_list_count()`
   - `fetch_list_items` при `filter_unread='unread'` фильтрует SQL-запрос по `vk_user_id.in_(unread_ids)` (существующая логика в `fetchers.py`)
4. **Фронтенд-API** (`messages.api.ts`): добавлен параметр `filterUnread` в `getConversationsInit()` и поле `filter_unread` в тело запроса
5. **Фронтенд-хук** (`useConversations.ts`): передаёт `filterUnread` в `getConversationsInit()`

**Файл(ы):**
- `backend_python/schemas/messages_schemas.py` — поле `filter_unread` в `ConversationsInitRequest`
- `backend_python/routers/messages.py` — проброс `body.filter_unread`
- `backend_python/services/messages/conversations_init_service.py` — параметр `filter_unread`, передача в `fetch_list_items/fetch_list_count`
- `services/api/messages.api.ts` — параметр `filterUnread` в `getConversationsInit()`
- `features/messages/hooks/chat/useConversations.ts` — передача `filterUnread` в вызов API

---

## 5. Шаблоны ответов

### 🆕 Два режима применения шаблона: «Вставить» и «Заменить»

**Описание:**  
При применении шаблона ответа из правой панели теперь доступны два режима:
- **Вставить** (indigo кнопка) — добавляет текст шаблона в конец текущего текста в поле ввода чата (через перенос строки)
- **Заменить** (amber кнопка) — полностью заменяет текст в поле ввода на текст шаблона

**Реализация:**  
Добавлен параметр `mode: 'insert' | 'replace'` в цепочку из 5 файлов:
1. `TemplatesTab.tsx` — две кнопки «Вставить» и «Заменить» с передачей `mode`
2. `UserInfoPanel.tsx` — обновлена сигнатура `onApplyTemplate(template, mode)`
3. `MessagesPage.tsx` — `pendingTemplate` расширен полем `mode`, передаётся в ChatView
4. `ChatView.tsx` — `pendingTemplate` prop с полем `mode`
5. `ChatInput.tsx` — useEffect при `mode === 'insert'` дописывает текст к концу (с `\n`), при `mode === 'replace'` заменяет целиком

**Файл(ы):**
- `features/messages/components/templates/TemplatesTab.tsx`
- `features/messages/components/user-info/UserInfoPanel.tsx`
- `features/messages/components/MessagesPage.tsx`
- `features/messages/components/chat/ChatView.tsx`
- `features/messages/components/chat/ChatInput.tsx`

---

### 🆕 Превью шаблона как inline-аккордеон

**Описание:**  
Превью шаблона теперь открывается как разворачивающийся блок (аккордеон) прямо под карточкой шаблона в списке, а не в отдельной вкладке/режиме. Кнопка «Превью» → «Скрыть» переключает видимость. Удалён лишний `TabMode = 'preview'`.

**Реализация:**  
1. Убран `mode === 'preview'` из `TabMode` (было `'list' | 'create' | 'edit' | 'preview'`, стало `'list' | 'create' | 'edit'`)
2. Добавлены состояния: `previewingId: string | null`, `previewTexts: Record<string, string>`, `previewLoadingIds: Set<string>`
3. `handleTogglePreview` — при клике вызывает API `previewTemplate()`, подставляя `{username}` на клиенте до отправки на сервер
4. Аккордеон рендерится под карточкой: заголовок «Как увидит пользователь», текст превью, расшифровка переменных (бейджи)
5. Позиционирование кнопки удаления — подтверждение выровнено вправо (`flex justify-end`, текст `mr-auto`)
6. Убрано дублирование расшифровок переменных — бейджи переменных показываются только в превью-аккордеоне, а не в карточке

**Файл(ы):**
- `features/messages/components/templates/TemplatesTab.tsx`

---

### ✅ Превью шаблона показывал `[Имя пользователя]` вместо реального имени

**Проблема:**  
При предпросмотре шаблона ответа с переменной `{username}` в тексте превью отображалось `[Имя пользователя]` — серверный плейсхолдер — вместо реального имени пользователя (например, «Евгения»).

**Причина:**  
Бэкенд при обработке превью заменял `{username}` на плейсхолдер `[Имя пользователя]`, потому что на сервере нет контекста текущего диалога. Фронтенд отправлял текст шаблона «как есть», без предварительной подстановки клиентских переменных.

**Решение:**  
Клиентская подстановка `{username}` → реальное имя пользователя (`user.firstName`) выполняется ПЕРЕД отправкой текста на сервер для превью. Исправлено в двух файлах:
1. `TemplateInlineEditor.tsx` — превью в редакторе шаблона
2. `TemplatesTab.tsx` — превью в списке шаблонов

**Файл(ы):**
- `features/messages/components/templates/TemplateInlineEditor.tsx`
- `features/messages/components/templates/TemplatesTab.tsx`

---

### ✅ Кеш превью шаблонов не обновлялся после редактирования

**Проблема:**  
В списке шаблонов превью показывало устаревшие данные:
1. Кеш превью (`previewTexts`) проверял наличие ключа и пропускал повторный запрос — после редактирования шаблона превью показывало старый текст
2. При повторном нажатии «Превью» сервер не вызывался, отображались закешированные данные

**Причина:**  
Условие `if (!previewTexts[template.id])` пропускало повторную загрузку, если превью уже было загружено хотя бы раз. Кеш не инвалидировался при сохранении отредактированного шаблона.

**Решение:**  
1. Убрана проверка кеша — каждый клик «Превью» делает свежий запрос к серверу
2. Добавлена инвалидация кеша в `handleSave` — при сохранении шаблона удаляется его запись из `previewTexts`

**Файл(ы):**
- `features/messages/components/templates/TemplatesTab.tsx`

---

## 6. Автоматизация конкурсов отзывов

### ✅ Картинка «авто-генерация итогов» не прикреплялась к посту

**Проблема:**  
При автоматическом подведении итогов конкурса отзывов (проект 152651211 «Мега Вкусно», пост wall-152651211_1338033) proof-изображение не было прикреплено к опубликованному посту — пост вышел с 0 вложений. При этом статусы участников (winner/used) и промокод не были обновлены в БД — все 10 записей остались в статусе `commented`, промокод `89001` остался `is_issued: False`, `results_post_link: None`.

**Причина:**  
Диагностика выявила 3 взаимосвязанных бага:

1. **Silent except в proof image** — генерация картинки обёрнута в `try/except`, который проглатывал ошибку молча. Docker-контейнер перезапустился через 2 часа после финализации, и stdout-логи с ошибкой были утеряны. Точная ошибка неизвестна (предположительно: timeout HTTP-запросов к VK API за аватарками участников, или PIL-ошибка при генерации).

2. **DB session corruption** — `refresh_published_posts(db, ...)` вызывался на той же сессии БД, что и остальная финализация. Внутри `refresh_published_posts` вызывается `replace_published_posts`, который делает DELETE + INSERT + `db.commit()`. Если этот вызов падал (VK API error, SQL error), сессия оказывалась в broken-состоянии и финальный `db.commit()` не мог быть выполнен.

3. **Нарушение атомарности транзакций** — три точки `db.commit()` в одной бизнес-операции: (a) `create_delivery_log()` делал ранний commit, (b) `replace_published_posts()` — свой commit, (c) финальный `db.commit()` обновлял winner/promo статусы. Если что-то падало между (a) и (c), данные оказывались в inconsistent-состоянии: delivery_log создан, но winner не обновлён.

**Решение:**  

1. **Persistent file logging** — создан модуль `utils/persistent_logger.py`, который пишет логи в файл на Docker volume (`/app/data/contest_logs/`). Этот volume монтируется через docker-compose.yml и сохраняется при перезапуске контейнера. Каждый критический шаг финализации логируется с таймингами (генерация PIL, загрузка в VK, wall.post, db.commit). При ошибках сохраняется полный traceback.

2. **Изоляция DB session** — `refresh_published_posts` теперь вызывается в отдельной сессии БД (`_session_factory()`). Если refresh упадёт, основная сессия финализации не пострадает.

3. **Атомарный коммит** — `create_delivery_log` получил параметр `auto_commit=False`. В финализации все изменения (delivery_log, winner status, promo issued, used statuses) коммитятся одним `db.commit()` в конце. При ошибке — `db.rollback()` с логированием в persistent файл.

**Файл(ы):**
- `backend_python/utils/persistent_logger.py` (новый) — файловый логгер для Docker volume
- `backend_python/services/automations/reviews/finalizer.py` — persistent-логи на всех шагах, отдельная сессия для refresh, единый atomic commit
- `backend_python/services/automations/reviews/crud.py` — параметр `auto_commit` в `create_delivery_log`
- `backend_python/services/automations/reviews/execution.py` — persistent-логи в оркестраторе

---

### Сворачиваемое подменю основного сайдбара

**Описание:**  
Добавлена возможность сворачивать/разворачивать текстовое подменю (колонка 2) основного сайдбара. В свёрнутом состоянии остаётся только колонка иконок шириной 64px, что экономит горизонтальное пространство.

**Реализация:**  
- Состояние `isCollapsed` с сохранением в `localStorage` (ключ `primarySidebarCollapsed`) — запоминается между сессиями.
- Кнопка «Свернуть» (иконка `«`) размещена в верхней части подменю, всегда видна.
- Кнопка «Развернуть» (иконка `»`) появляется в колонке иконок, когда подменю свёрнуто — подсвечена индиго для заметности.
- Плавная CSS-анимация через `transition-all duration-300` и `max-w-0` / `max-w-xs`.

**Файл(ы):** `features/navigation/components/PrimarySidebar.tsx`

---

### Минималистичные превью фото в карточках постов

**Описание:**  
Превью изображений в карточках постов переделано на компактные квадратики вместо растянутых на всю ширину фотографий. Затронуты два компонента: ImageGrid (карточка поста в ленте) и PostImage (вкладка «Посты» в панели пользователя).

**Реализация:**  
- `ImageGrid` — вместо `aspect-video` (16:9) для одного фото и `grid-cols-2` для нескольких теперь одна горизонтальная строка маленьких квадратов 40×40px (`w-10 h-10`). До 5 квадратиков видны одновременно, при большем кол-ве — плашка `+N`. Используется `flex` layout с `gap-1.5`.
- `PostImage` (в `UserPostsTab`) — вместо `w-full max-h-48` (растянутое фото на всю ширину) теперь один квадратик 40×40px с `object-cover`, skeleton и fade-in.

**Файл(ы):** `features/posts/components/postcard/ImageGrid.tsx`, `features/messages/components/user-info/UserPostsTab.tsx`

---

### Редизайн вкладки промокодов в правой панели: табличный формат

**Описание:**  
Модуль промокодов в правой панели чата (вкладка «Промокоды» панели пользователя) переделан с карточного макета на компактный табличный формат. Таблица состоит из 5 колонок: Промокод (код + бейдж статуса «Выдан» / «Свободен»), Описание, Выдан (дата и время), Кому (ссылка на профиль пользователя + ID), Кнопки (открыть чат / перейти в ВК ЛС / удалить). Кнопки действий стали всегда видимыми (убран hover-эффект). Убраны ограничения `max-width` на колонках — ширина подстраивается под содержимое.

**Реализация:**  
- Замена `div`-карточек на HTML `<table>` с `<thead>` и `<tbody>`, строки с `hover:bg-gray-50`.
- 5 колонок с семантичными заголовками: код + статус-бейдж, описание, дата выдачи (toLocaleDateString + toLocaleTimeString), информация о получателе (кликабельное имя), кнопки действий.
- Кнопки «В чат» и «В ВК ЛС»: убран `opacity-0 group-hover:opacity-100` — теперь всегда видимы.
- Убраны `max-w-[140px]` (описание) и `max-w-[150px]` (кому) — ширина колонок определяется содержимым.

**Файл(ы):** `features/messages/components/promocodes/PromoCodesTable.tsx`

---
