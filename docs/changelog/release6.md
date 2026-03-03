# 📋 Release Log 6 — Журнал релизов

Продолжение журнала релизов. Предыдущий файл: `release5.md`.

---

## 🆕 Новые возможности

### Просмотр текущих настроек Callback-сервера из VK

**Описание:**  
При открытии секции «Интеграции» в настройках проекта теперь автоматически подтягиваются текущие настройки Callback-сервера из VK API: какой сервер настроен (smmit/smmitloc), его статус (ok/wait/failed), URL и список включённых событий. Чекбоксы выбора событий автоматически проставляются по реальным настройкам VK. Ранее настройки не читались — чекбоксы всегда стартовали с «все выбраны».

**Реализация:**  
- Бэкенд: новая функция `get_callback_settings()` в `callback_setup.py` — вызывает VK API `groups.getCallbackSettings`
- Бэкенд: 2 новых эндпоинта в `vk_callback.py`:
  - `GET /vk/callback-settings/{project_id}/{server_id}` — настройки конкретного сервера
  - `GET /vk/callback-current/{project_id}` — «всё-в-одном»: находит наш сервер (smmit/smmitloc) + запрашивает его настройки
- Фронтенд: интерфейс `CallbackCurrentStateResponse` + функция `getCurrentCallbackState()` в `vk.api.ts`
- Фронтенд: `useEffect` в `IntegrationsSection.tsx` — автозагрузка при открытии секции + кнопка ручного обновления
- UI-блок с информацией: имя сервера, статус (зелёный/жёлтый/красный индикатор), URL, количество включённых событий

**Файл(ы):**
- `backend_python/services/callback_setup.py` — `get_callback_settings()`
- `backend_python/routers/vk_callback.py` — 2 новых эндпоинта
- `services/api/vk.api.ts` — `CallbackCurrentStateResponse`, `getCurrentCallbackState()`
- `features/projects/components/modals/settings-sections/IntegrationsSection.tsx` — `useEffect` автозагрузки, UI-блок

---

### Ссылки на настройки Callback API в VK

**Описание:**  
Добавлены прямые ссылки на страницу настроек API сообщества в ВК (`https://vk.com/club{id}?act=api`) в двух местах:
1. **Модальное окно настроек проекта** (секция «Интеграции») — ссылка «Настройки Callback API в VK (ручная настройка)» в блоке автонастройки, показывается всегда (не только при ошибке).
2. **Массовая настройка Callback-серверов** — при ошибке лимита серверов (code 2000) текст «настройки группы VK» стал кликабельной ссылкой, ведущей на `?act=api` конкретной группы.

**Реализация:**  
- `IntegrationsSection.tsx` — добавлена ссылка `vk.com/club{vkProjectId}?act=api` (fallback на `vkGroupShortName`) после инструкции автонастройки
- `BulkCallbackSetupModal.tsx` — добавлено поле `vkProjectId` в `ProjectSetupResult`, проброс из `Project`, кликабельная ссылка в блоке ошибки 2000

**Файл(ы):**
- `features/projects/components/modals/settings-sections/IntegrationsSection.tsx`
- `features/database-management/components/modals/BulkCallbackSetupModal.tsx`

---

---

## ✅ Решённые задачи

### SSE-события не доходят до фронтенда (нестабильная доставка сообщений)

**Проблема:**  
Модуль сообщений использует Server-Sent Events (SSE) для push-уведомлений: новые сообщения, прочтение диалогов, статус набора текста. Доставка событий работала нестабильно — иногда мгновенно, иногда события не доходили вообще. Причина — комплекс из 7 архитектурных проблем в цепочке `VK Callback → Worker (ThreadPool) → SSE Manager → asyncio.Queue → EventSource (браузер)`.

**Причина:**  
1. **`_loop = None` при publish из Worker'а.** SSE Manager сохранял ссылку на asyncio event loop только при первом подключении клиента (`subscribe()`). Если callback worker вызывал `publish()` до подключения клиента — `_loop` был `None`, и `put_nowait()` вызывался напрямую из чужого потока. `await queue.get()` в SSE-генераторе не пробуждался — событие «зависало» в очереди.
2. **QueueFull — молчаливая потеря событий.** `call_soon_threadsafe()` планирует выполнение `_put_nowait_safe()` позже в event loop. При переполнении очереди (maxsize=100) событие терялось, а `publish()` об этом не узнавал — `call_soon_threadsafe` не пробрасывает исключения callback'ов. Блок `except asyncio.QueueFull` в `publish()` был мёртвым кодом.
3. **`send_service.py` не публиковал SSE.** При отправке сообщения через API менеджером SSE-событие `new_message` не генерировалось. Другие менеджеры не видели исходящие сообщения до прихода VK callback `message_reply` (0.5–5 сек).
4. **LVC-кэш не кешировал `message_read`.** При reconnect клиент получал из LVC только `new_message`, но пропущенные `message_read` терялись — бейджи непрочитанных оставались фантомными.
5. **Fallback `put_nowait()` из чужого потока** нарушал потокобезопасность asyncio.Queue.
6. **maxsize=100** легко переполнялся при пакетной обработке callback'ов.

**Решение:**  
1. Добавлен метод `SSEManager.initialize_loop()` — вызывается из `main.py` в async `startup_event()`, гарантирует валидный event loop до подключения клиентов. В `publish()`/`publish_global()` добавлен fallback через `asyncio.get_running_loop()`.
2. `_put_nowait_safe()` реализует **eviction-стратегию**: при переполнении вытесняет старейшее событие (`get_nowait()`) и записывает новое. События не теряются молча.
3. В `send_service.py` добавлен `sse_manager.publish_via_redis(SSEEvent("new_message", ...))` после успешной отправки — другие менеджеры видят исходящие мгновенно. Дедупликация на фронтенде (`sentMessageIdsRef`) защищает от дублей.
4. Per-project LVC теперь кеширует и `new_message`, и `message_read` по составному ключу `{event_type}:{vk_user_id}`.
5. Fallback заменён на `self._put_nowait_safe()` с eviction-логикой.
6. Размер очередей увеличен с 100 до 500 (subscribe + subscribe_global).
7. Удалён мёртвый код `except asyncio.QueueFull` из `publish()` и `publish_global()`.

**Файл(ы):**
- `backend_python/services/sse_manager.py` — 7 правок: `initialize_loop()`, eviction в `_put_nowait_safe()`, fallback в `publish()`/`publish_global()`, LVC для `message_read`, maxsize 500
- `backend_python/main.py` — вызов `sse_manager.initialize_loop()` в startup
- `backend_python/services/messages/send_service.py` — SSE publish после отправки

---

### Карточка «В рассылке» показывала 0 при добавлении пользователей через Callback

**Проблема:**  
Когда пользователь писал сообществу и Callback API добавлял его в список рассылки (SystemListMailing), карточка «В рассылке» продолжала показывать 0. Пользователь был виден в таблице, но счётчик на карточке не обновлялся.

**Причина:**  
Цепочка из 2 багов:
1. **Бэкенд (критический):** В `_upsert_mailing_and_notify()` отсутствовал `import models`, из-за чего пересчёт `mailing_count` в `project_list_meta` падал с `NameError`. Ошибка поглощалась внешним `try/except`, поэтому SSE-уведомление также не отправлялось.
2. **Фронтенд:** SSE-хук `useMailingSSEUpdater` вызывал `fetchMeta()` только при `activeList === 'mailing'`, но карточка «В рассылке» видна во вкладке «Подписчики» — мета не перезагружалась.

**Решение:**  
1. Добавлен `import models` в `_cache_reload.py`
2. После `bulk_upsert_mailing()` добавлен пересчёт `mailing_count` и обновление `mailing_last_updated` через `update_list_meta()`
3. В `useMailingSSEUpdater.ts` — `fetchMeta()` теперь вызывается ВСЕГДА при SSE-событии, независимо от активной вкладки

**Бонус — аналогичные баги:**
- `interactions/user_task.py` — обновление профилей лайков/комментариев/репостов не обновляло мету — добавлен пересчёт `*_count` и `*_last_updated`
- `list_sync_mailing_analysis.py` — анализ рассылки не обновлял `mailing_last_updated` — добавлено

**Файл(ы):**
- `backend_python/services/vk_callback/handlers/messages/_cache_reload.py` — `import models` + пересчёт `mailing_count`
- `features/lists/hooks/useMailingSSEUpdater.ts` — `fetchMeta()` вынесен из условия `activeList === 'mailing'`
- `backend_python/services/lists/interactions/user_task.py` — обновление меты после рефреша профилей
- `backend_python/services/lists/list_sync_mailing_analysis.py` — обновление `mailing_last_updated`

---

### Кнопка «Собрать все сообщения» в заголовке диалогов

**Описание:**  
В заголовок сайдбара «Диалоги» (модуль Сообщения) добавлена кнопка быстрого сбора подписчиков рассылки — аналог функции «Сбор подписчиков в рассылку» из раздела «Списки». Кнопка позволяет запустить `refreshMailingStream` прямо из чата, не переходя в другой модуль.

**Реализация:**  
- Используется уже подключённый хук `useMailingCollection` (уже был в `ConversationsSidebar` для проверки готовности callback/токена)
- Кнопка с иконкой ↓ (download) появляется справа от счётчика и кнопки обновления в заголовке «Диалоги»
- Отображается только когда проект активен и нет блокировки по токену/callback (`!isBlocked`)
- Во время сбора: кнопка показывает спиннер и блокируется
- Подзаголовок (вместо имени проекта) показывает прогресс: «Сбор: 123/456»
- По завершении: «✓ Сбор завершён»
- При ошибке: красный текст «Ошибка сбора»
- После завершения сбора вызывается `onDataAvailable` → автоматическое обновление списка диалогов

**Файл(ы):** `features/messages/components/ConversationsSidebar.tsx`

---

### Массовая настройка Callback не работала с первого раза (race condition)

**Проблема:**  
При нажатии кнопки «Авто-настройка колбэков» (массовая настройка через `BulkCallbackSetupModal` или индивидуальная через `IntegrationsSection`) — VK API отвечал confirmation, в логах всё выглядело успешно, но реально callback-сервер оставался в статусе `wait`. Сообщения и события не приходили. Чтобы починить, нужно было зайти в модальное окно настроек проекта и повторно перенастроить колбэк вручную — тогда всё начинало работать.

**Причина:**  
Race condition в роутере `setup_callback_auto()`. Confirmation code сохранялся в БД **ПОСЛЕ** завершения `auto_setup_callback()`, но VK шлёт `confirmation`-запрос **ВО ВРЕМЯ** вызова `addCallbackServer` / `editCallbackServer`. Хронология гонки:
1. `auto_setup_callback()` вызывает `groups.getCallbackConfirmationCode` → получает код
2. Вызывает `groups.addCallbackServer` → VK шлёт `confirmation` на наш URL
3. Наш callback-хендлер ищет `project.vk_confirmation_code` в БД → **его ещё нет!** → отвечает `code_not_found`
4. VK помечает сервер как `wait` (не подтверждён) → события не пойдут
5. `auto_setup_callback()` возвращает `success: True` (API вернул server_id)
6. Роутер только теперь сохраняет код в БД → **уже поздно**

При повторной ручной настройке из модалки — код УЖЕ был в БД (с первой попытки), поэтому confirmation проходил успешно.

**Решение:**  
Добавлено предварительное сохранение confirmation code в БД **ДО** вызова `auto_setup_callback()`. Роутер теперь:
1. Вызывает `get_confirmation_code(group_id, community_token)` — получает код через VK API
2. Сохраняет его в `project.vk_confirmation_code` + `db.commit()`
3. Только после этого вызывает `auto_setup_callback()`
4. Когда VK шлёт confirmation — код уже в БД → хендлер отвечает правильно → сервер подтверждён
5. После завершения `auto_setup_callback()` код обновляется финально (на случай если изменился)

**Файл(ы):** `backend_python/routers/vk_callback.py` — функция `setup_callback_auto()`

---

### Расширенные фильтры периодов в мониторинге сообщений

**Описание:**  
Переработаны фильтры периодов на странице «Мониторинг сообщений». Вместо старого набора (За всё время / Сегодня / Вчера / За неделю / За месяц / Свой период) теперь доступны 8 периодов в логичном порядке: Сегодня → Вчера → Эта неделя → Прошлая неделя → Этот месяц → Прошлый месяц → Всё время → Свой период.

**Реализация:**  
- Обновлён тип `PeriodType` — добавлены `this_week`, `last_week`, `this_month`, `last_month`; удалены `week`, `month`
- Массив `PERIOD_OPTIONS` перестроен в новом порядке с новыми лейблами
- Функция `computeDateRange()` дополнена кейсами для новых периодов:
  - «Эта неделя» — с понедельника текущей недели по сегодня
  - «Прошлая неделя» — понедельник–воскресенье прошлой недели
  - «Этот месяц» — с 1-го числа текущего месяца по сегодня
  - «Прошлый месяц» — полный предыдущий месяц
- Добавлена вспомогательная функция `getMonday()` для корректного определения понедельника

**Файл(ы):** `features/messages/components/messageStatsConstants.ts`

---

### Полная переработка дашборда «Мониторинг сообщений»

**Описание:**  
Комплексная переработка страницы мониторинга сообщений: расширенная аналитика входящих/исходящих по типам, отслеживание активности администраторов, подсчёт уникальных получателей. Реализована полная цепочка от записи данных на уровне VK Callback до отображения на фронтенде.

**Реализация:**

**Бэкенд — модели и миграция:**
- `MessageStatsHourly` расширена колонками: `incoming_payload_count`, `incoming_text_count`, `outgoing_system_count`, `outgoing_bot_count`, `unique_text_users_json`, `outgoing_users_json`, `unique_dialogs_count`
- Новая модель `MessageStatsAdmin` (sender_id, sender_name, project_id, date, messages_sent, unique_dialogs)
- Миграция в `db_migrations/message_stats.py`: ALTER TABLE + CREATE TABLE

**Бэкенд — запись (write.py):**
- `record_message()` принимает `has_payload`, `sender_id`, `sender_name`
- Входящие: `has_payload=True` → `incoming_payload_count`, иначе → `incoming_text_count`; уникальные текстовые пользователи в `unique_text_users_json`
- Исходящие: `sender_id` есть → `outgoing_system_count` + UPSERT в `MessageStatsAdmin`; нет → `outgoing_bot_count`
- Уникальные получатели: `outgoing_users_json` (JSON-список user_id)

**Бэкенд — чтение (read.py):**
- `get_global_summary()` / `get_projects_summary()` — аггрегация всех расширенных полей + `outgoing_recipients` (число уникальных)
- `get_admin_stats()` — список администраторов за период (sender_name, messages_sent, unique_dialogs, projects_count)
- `get_admin_dialogs()` — плоский список диалогов администратора (user info JOIN, фото, имя, проект)

**Бэкенд — синхронизация (sync.py):**
- Агрегация из `VkCallbackLog`: определение `has_payload` через `json.loads(raw_data).get("payload")`, подсчёт `outgoing_users_set`, UPSERT со всеми расширенными столбцами

**Бэкенд — интеграция:**
- `handler.py` (VK Callback) — передаёт `has_payload=bool(message.get("payload"))` в `record_message()`
- `send_service.py` — записывает статистику с `sender_id`/`sender_name` после отправки
- `routers/messages_stats.py` — эндпоинты `/admins` и `/admin/{sender_id}/dialogs`

**Фронтенд — API (messages_stats.api.ts):**
- Расширены типы `MessageStatsGlobalSummary` и `MessageStatsProjectSummary` полями: `incoming_payload`, `incoming_text`, `outgoing_system`, `outgoing_bot`, `unique_text_users`, `unique_dialogs`, `outgoing_recipients`
- Новые типы `AdminStatsItem`, `AdminDialogItem`, `AdminStatsResponse`, `AdminDialogsResponse`
- Новые функции `fetchAdminStats()`, `fetchAdminDialogs()`

**Фронтенд — логика (useMessageStatsLogic.ts):**
- Загрузка `adminStats` в `loadDashboard()`
- Управление состоянием: `expandedAdmins`, `adminDialogsMap`
- Обработчик `toggleAdminExpand()` для раскрытия строк

**Фронтенд — UI (MessageStatsPage.tsx):**
- Сводка переработана: 4 верхних карточки + блок «Входящие» (живые / по кнопкам) + блок «Исходящие» (администраторы / бот / уникальных получателей)
- Таблица администраторов `AdminStatsTable` всегда отображается (пустое состояние: «Нет данных»)

**Фронтенд — AdminStatsTable.tsx (НОВЫЙ):**
- Таблица администраторов: sender_name, messages_sent, unique_dialogs, projects_count
- Раскрываемые строки с плоским списком диалогов (фото, имя, проект, кол-во сообщений, ссылка VK, кнопка «Написать»)

**Фронтенд — ProjectsStatsTable.tsx:**
- Расширенные колонки: «Входящих» с подстрокой «X жив. / Y кн.», «Исходящих» с подстрокой «X адм. / Y бот», новая колонка «Диалогов»

**Файл(ы):**
- `backend_python/models_library/message_stats.py`
- `backend_python/db_migrations/message_stats.py`
- `backend_python/crud/message_stats/write.py`
- `backend_python/crud/message_stats/read.py`
- `backend_python/crud/message_stats/sync.py`
- `backend_python/crud/message_stats_crud.py`
- `backend_python/services/vk_callback/handlers/messages/handler.py`
- `backend_python/services/messages/send_service.py`
- `backend_python/routers/messages_stats.py`
- `services/api/messages_stats.api.ts`
- `features/messages/components/useMessageStatsLogic.ts`
- `features/messages/components/MessageStatsPage.tsx`
- `features/messages/components/AdminStatsTable.tsx`
- `features/messages/components/ProjectsStatsTable.tsx`

---

### Фильтр «Скрыть сообщения бота/рассылки» в чате

**Описание:**  
В панель «Фильтры отображения» в чате добавлен третий тумблер «Скрыть бот/рассылку». При включении из переписки полностью скрываются сообщения с метками «Бот / Рассылка» и «Кнопка» (сообщения с `isBotMessage === true` или с `keyboard`). Это позволяет менеджеру быстро отфильтровать автоматические сообщения и видеть только живую переписку с пользователем.

**Реализация:**  
- Только фронтенд. Интерфейс `ChatDisplayFilters` в `types.ts` расширен полем `hideBotMessages: boolean`
- `ChatView.tsx`: добавлена фильтрация в `filteredMessages` — `result.filter(m => !m.isBotMessage && !m.keyboard)` при `hideBotMessages === true`
- `ChatHeader.tsx`: новый toggle «Скрыть бот/рассылку», обновлён `hasActiveDisplayFilters` и кнопка «Сбросить»
- Начальное состояние: `hideBotMessages: false`

**Файл(ы):**
- `features/messages/types.ts` — `ChatDisplayFilters` + `hideBotMessages`
- `features/messages/components/ChatView.tsx` — фильтрация в `filteredMessages`
- `features/messages/components/ChatHeader.tsx` — тумблер + `hasActiveDisplayFilters` + сброс

---

### Автоматическая пометка «Прочитано» при входящем сообщении от пользователя

**Описание:**  
Если пользователь VK прислал нам сообщение, значит он видел все наши предыдущие исходящие — автоматически помечаем их как прочитанные (зелёный кружок). Это дополнительная страховка к существующему механизму `user_read` через VK Callback API, который не всегда срабатывает.

**Реализация:**  
- Утилитарная функция `autoMarkReadByIncoming()` в `useMessageHistory.ts`: находит последнее входящее сообщение и помечает все исходящие до него как `isRead: true`
- Применяется при первичной загрузке (`loadInitial`), пагинации (`loadMore`) и загрузке всех (`loadAll`)
- В `addIncomingMessage`: при получении нового входящего через SSE в реальном времени — все предыдущие непрочитанные исходящие помечаются прочитанными
- Работает как фоллбэк к SSE `user_read` — если callback не пришёл, но пользователь ответил — статус всё равно обновится

**Файл(ы):**
- `features/messages/hooks/useMessageHistory.ts` — `autoMarkReadByIncoming()`, обновлён `addIncomingMessage`, `loadInitial`, `loadMore`, `loadAll`

---

## 🔴 Открытые задачи

_(пока нет записей)_
