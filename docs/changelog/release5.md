# 📋 Release Log 5 — Журнал релизов

Продолжение журнала релизов. Предыдущий файл: `release4.md`.

---

## 🆕 Новые возможности

### Модуль сообщений: отображение VK-клавиатуры (кнопок) в чате

**Описание:**  
VK API при отправке сообщений через ботов/сообщества может прикреплять к сообщению клавиатуру с кнопками (inline keyboard). Раньше поле `keyboard` полностью игнорировалось на всех уровнях — от БД до интерфейса. Теперь кнопки отображаются прямо в пузыре сообщения.

**Реализация:**  
1. **Модель БД:** Добавлена колонка `keyboard_json` (Text, nullable) в `CachedMessage`. Миграция `ALTER TABLE` добавляет колонку если не существует.
2. **CRUD:** `save_vk_messages()` извлекает `keyboard` из VK-ответа и сохраняет как JSON. `get_cached_messages()` возвращает keyboard в ответе. Колонка добавлена в `update_columns` для bulk upsert.
3. **Callback API:** Обработчик `message_new`/`message_reply` прокидывает `keyboard` в SSE-событие и в `_format_vk_item()`.
4. **Фронтенд API:** Добавлены типы `VkKeyboard`, `VkKeyboardButton`, `VkKeyboardButtonAction` в `messages.api.ts`.
5. **Типы:** `MessageKeyboard`, `VkKeyboardButtonData` в `types.ts`. Поле `keyboard` добавлено в `ChatMessageData` и `SSENewMessageData`.
6. **Маппинг:** `useMessageHistory.mapVkMessage()` маппит VK keyboard → фронтенд-формат.
7. **UI-компоненты:** `KeyboardButton` и `KeyboardButtons` в `ChatMessage.tsx` — рендерят кнопки с цветами VK:
   - `primary` → `#5181b8` (синий)
   - `positive` → `#4bb34b` (зелёный)
   - `negative` → `#e64646` (красный)
   - `secondary` → белый
   - Типы кнопок: text, callback (инфо), open_link (ссылка), open_app, location, vkpay

**Файл(ы):**
- `backend_python/models_library/messages.py` — колонка `keyboard_json`
- `backend_python/crud/messages_crud.py` — сохранение/возврат keyboard
- `backend_python/db_migrations/messages.py` — миграция ALTER TABLE
- `backend_python/services/vk_callback/handlers/messages/handler.py` — keyboard в SSE и _format_vk_item
- `services/api/messages.api.ts` — типы VkKeyboard, keyboard в ответе
- `features/messages/types.ts` — MessageKeyboard, VkKeyboardButtonData
- `features/messages/hooks/useMessageHistory.ts` — маппинг keyboard
- `features/messages/components/ChatMessage.tsx` — компоненты KeyboardButton, KeyboardButtons

---

### Фильтры сайдбара проектов в модуле «Сообщения»: подключено/не подключено + есть новые

**Описание:**  
В сайдбаре проектов при активном модуле «Сообщения» добавлены два новых фильтра:
1. **Callback API** — фильтрация проектов по статусу подключения callback-сервера: «Все», «Подключено», «Не подключено». Проект считается подключённым если у него есть `communityToken` И `vk_confirmation_code`.
2. **Диалоги** — фильтрация по наличию непрочитанных диалогов: «Все», «Есть новые». Использует данные из `unreadDialogCounts`.

**Реализация:**  
1. **Типы:** Добавлены `CallbackFilter` и `UnreadDialogsFilter` в `features/projects/types.ts`.
2. **Sidebar:** Добавлены стейты `callbackFilter` и `unreadDialogsFilter`. Логика фильтрации — в `checkVisibility()` внутри useMemo, только при `activeView === 'messages-vk' || 'messages-tg'`. Зависимости useMemo обновлены.
3. **UI:** Два блока с кнопками-тегами (стиль `getTeamFilterButtonClasses`) отображаются только в модуле сообщений, после блока команд.
4. Проп `unreadDialogCounts` уже передавался в Sidebar из App.tsx.

**Файл(ы):**
- `features/projects/types.ts` — типы CallbackFilter, UnreadDialogsFilter
- `features/projects/components/Sidebar.tsx` — стейты, фильтрация, UI

---

---

## 🔧 Оптимизации

### Модуль сообщений: bulk upsert вместо поштучного merge

**Проблема:**  
Функция `save_vk_messages()` при сохранении сообщений в кэш БД выполняла `db.merge()` в цикле — каждое сообщение = отдельный SELECT + INSERT/UPDATE. При загрузке 200 сообщений — ~400 SQL-операций, при «Загрузить все» (5000 сообщений) — до 10000 операций.

**Решение:**  
Заменено на один `INSERT ... ON CONFLICT DO UPDATE` (bulk upsert). Все сообщения собираются в массив и записываются одним SQL-запросом. Работает и с SQLite (локальная разработка), и с PostgreSQL (прод) — диалект определяется автоматически через `inspect(db.bind).dialect.name`.

**Файл(ы):** `backend_python/crud/messages_crud.py`

---

### Модуль сообщений: Callback API → запись входящих в кэш

**Проблема:**  
Обработчик Callback API при получении `message_new` (входящее сообщение от пользователя) только логировал событие, но не записывал сообщение в таблицу `cached_messages`. Из-за этого менеджер не видел новые входящие сообщения до ручного обновления или фоновой синхронизации (раз в 24ч).

**Решение:**  
1. При событиях `message_new` и `message_reply` — сообщение извлекается из Callback-события и записывается в `cached_messages` через `messages_crud.save_vk_messages()`.
2. Memory-кэш (5мин TTL) инвалидируется для этого диалога.
3. Ошибки записи обёрнуты в try/except — не блокируют обработку Callback API (VK требует ответ `ok` за 5 сек).
4. Определяется `vk_user_id` собеседника: если `from_id > 0` — входящее, user_id = from_id; если `from_id < 0` — исходящее от сообщества, user_id = peer_id.

**Файл(ы):** `backend_python/services/vk_callback/handlers/messages/handler.py`

---

### Модуль сообщений: объединение запросов истории и данных пользователя

**Проблема:**  
При открытии диалога фронтенд делал два отдельных HTTP-запроса: один для загрузки истории сообщений (`/messages/history`), второй для получения информации о пользователе (`/messages/user-info`). Оба запроса обращались к одному и тому же бэкенду и часто работали с одними и теми же данными (профиль пользователя VK), что создавало лишнюю нагрузку.

**Решение:**  
1. В эндпоинт `/messages/history` добавлен параметр `include_user_info: bool = Query(False)`.
2. Создана helper-функция `_get_user_info_for_response()`, реплицирующая логику user-info (авто-обновление профиля по TTL 24ч, даты сообщений из кэша).
3. Фронтенд передаёт `includeUserInfo=true` при первой загрузке истории (offset=0).
4. Хук `useMailingUserInfo` принимает `initialData` — если данные пришли из истории, HTTP-запрос пропускается.
5. `MessagesPage` прокидывает `userInfoFromHistory` в `useMailingUserInfo.initialData`.

**Файл(ы):**
- `backend_python/routers/messages.py` — параметр include_user_info + helper
- `services/api/messages.api.ts` — параметр includeUserInfo + user_info в ответе
- `features/messages/hooks/useMessageHistory.ts` — передача includeUserInfo, состояние userInfoFromHistory
- `features/messages/hooks/useMailingUserInfo.ts` — параметр initialData, пропуск запроса
- `features/messages/components/MessagesPage.tsx` — прокидка данных

---

## 🔴 Открытые задачи

(пусто)

---

## 🆕 Новые возможности (продолжение)

### Модуль сообщений: «Отметить непрочитанным» диалог

**Описание:**  
Добавлена возможность пометить диалог с пользователем как непрочитанный. Если менеджер случайно открыл (и тем самым прочитал) диалог, он может вернуть флаг непрочитанного, чтобы обработать его позже. Доступно через dropdown-меню «...» (3 точки) в шапке чата.

**Реализация:**  
1. **CRUD** (`message_read_crud.py`): новая функция `mark_dialog_as_unread()` — находит два последних входящих `vk_message_id` (DESC LIMIT 2), ставит `last_read_message_id` на предпоследний. Результат: последнее входящее сообщение считается непрочитанным (бейдж = 1). Если входящих ≤ 1 — сбрасывает `last_read_message_id` в 0.
2. **Роутер** (`messages.py`): `PUT /messages/mark-unread` — принимает `project_id`, `user_id`, `manager_id`. Вызывает CRUD, публикует SSE `unread_update` (per-project) и `unread_count_changed` (global) для синхронизации счётчиков в сайдбаре у всех менеджеров.
3. **Фронтенд API** (`messages.api.ts`): `markDialogAsUnread()` — вызов нового эндпоинта.
4. **ChatHeader** (`ChatHeader.tsx`): кнопка «...» (3 точки) переделана в dropdown-меню с пунктом «Отметить непрочитанным» (иконка конверта). Меню закрывается при клике вне (`mousedown` listener).
5. **ChatView** (`ChatView.tsx`): новый пропс `onMarkAsUnread` — пробрасывается в `ChatHeader`.
6. **MessagesPage** (`MessagesPage.tsx`): хэндлер `handleMarkAsUnread` — вызывает API → `updateUnreadCount(vkUserId, result.unread_count)` → `onSelectConversation(null)` (закрывает диалог, возвращая к списку).

**Файл(ы):**
- `backend_python/crud/message_read_crud.py` — `mark_dialog_as_unread()`
- `backend_python/routers/messages.py` — `PUT /messages/mark-unread`
- `services/api/messages.api.ts` — `markDialogAsUnread()`
- `features/messages/components/ChatHeader.tsx` — dropdown-меню
- `features/messages/components/ChatView.tsx` — пропс `onMarkAsUnread`
- `features/messages/components/MessagesPage.tsx` — `handleMarkAsUnread`

---

_(нет открытых задач)_

---

## 🔧 Улучшения

### Модуль сообщений: исходящие сообщения (чат-боты) не создают непрочитанных диалогов

**Описание:**  
При получении VK Callback API события `message_reply` (исходящее сообщение от имени группы — например, от стороннего чат-бота) система вызывала `get_unread_count()` и `_publish_global_unread_count()`, обновляя счётчик непрочитанных. Это приводило к тому, что исходящие сообщения от любых чат-ботов, подключённых к группе, создавали "мусорные" непрочитанные диалоги для менеджеров.

**Решение:**  
Добавлена проверка `is_incoming = from_id > 0` перед подсчётом непрочитанных:
1. **Бэкенд** (`_smart_save_and_notify`): `get_unread_count()` вызывается только для входящих (`from_id > 0`). Для исходящих — `unread_count = 0`. Глобальный SSE `unread_count_changed` публикуется только для входящих.
2. **Фронтенд** (`MessagesPage.handleNewMessage`): `updateUnreadCount` вызывается только при `data.is_incoming === true` — двойная защита на стороне клиента.

Сохранение сообщения в кэш и SSE-событие `new_message` по-прежнему происходят для всех сообщений (чтобы UI показывал исходящие в реальном времени).

**Файл(ы):**
- `backend_python/services/vk_callback/handlers/messages/handler.py` — условие `is_incoming` для unread + global SSE
- `features/messages/components/MessagesPage.tsx` — условие `data.is_incoming` для updateUnreadCount

---

## ✅ Решённые задачи

### Модуль сообщений: счётчик непрочитанных не сбрасывался при чтении диалога

**Проблема:**  
После входа в диалог пользователя и прочтения сообщений счётчик непрочитанных (badge) не обнулялся. При перезагрузке проекта диалог по-прежнему отображался как «2 непрочитанных», хотя сообщения были прочитаны.

**Причина:**  
Две проблемы одновременно:
1. **Race condition в `handleNewMessage`:** При получении нового сообщения в активном диалоге функция сначала выставляла `unreadCount` из данных VK (>0), затем асинхронно вызывала `markAsRead`. Если пользователь уходил со страницы до завершения mark-read запроса, badge оставался ненулевым.
2. **Отсутствующий обработчик SSE-события `unread_update`:** В хуке `useMessagesSSE` событие `unread_update` не имело case в switch — событие прослушивалось, но не обрабатывалось, поэтому обнуление badge с бэкенда не доходило до UI.

**Решение:**  
1. В `MessagesPage.handleNewMessage`: для активного диалога НЕ обновлять badge значением VK. Вместо этого сразу ставить `unreadCount = 0` и асинхронно вызывать `markAsRead` — badge остаётся нулевым независимо от таймингов.
2. В `useMessagesSSE.handleSSEEvent`: добавлен `case 'unread_update'`, который делегирует обработку в callback `onMessageRead` для корректного обнуления badge при событиях с бэкенда.

**Файл(ы):**
- `features/messages/components/MessagesPage.tsx` — логика handleNewMessage
- `features/messages/hooks/useMessagesSSE.ts` — обработчик unread_update

---

### Конкурс отзывов: отображалась дата сбора вместо реальной даты поста

**Проблема:**  
В таблице постов конкурса отзывов в колонке «Дата» отображалась дата добавления записи в БД (`created_at`) — т.е. момент нажатия кнопки «Собрать посты». Из-за этого все посты в таблице показывали одинаковую дату (дата сбора), а не реальную дату публикации поста ВКонтакте.

**Причина:**  
В модели `ReviewContestEntry` не было поля для хранения реальной даты поста VK. При создании записи в коллекторе заполнялось только `created_at`, а на фронтенде отображалось именно оно.

**Решение:**  
1. Добавлено поле `post_date` (DateTime с timezone) в модель `ReviewContestEntry`.
2. Добавлена миграция `check_and_add_column` для колонки `post_date`.
3. Схема `ContestEntryResponse` дополнена полем `post_date: Optional[datetime]`.
4. Коллектор теперь берёт `SystemListPost.date` (реальная дата поста VK) и записывает в `post_date`.
5. Фронтенд интерфейс `ContestEntry` дополнен `post_date?: string`.
6. В таблице `PostsTab.tsx` колонка «Дата» показывает `post_date`, с фоллбэком на `created_at` для старых записей.

**Файл(ы):**
- `backend_python/models_library/automations.py` — новое поле `post_date`
- `backend_python/schemas/automations.py` — `post_date` в схеме ответа
- `backend_python/db_migrations/automations.py` — миграция
- `backend_python/services/automations/reviews/collector.py` — заполнение `post_date` из `SystemListPost.date`
- `services/api/automations.api.ts` — `post_date` в интерфейсе
- `features/automations/reviews-contest/components/PostsTab.tsx` — отображение реальной даты

---

### Конкурс отзывов: неверная терминология «участники» вместо «посты»

**Проблема:**  
Интерфейс конкурса отзывов оперировал понятием «участники», хотя по бизнес-логике собираются и нумеруются **посты**. Один автор может оставить несколько отзывов (постов), каждому из которых присваивается свой номер. При подведении итогов выбирается **пост-победитель**, а приз вручается его автору. В UI же было «Найдено участников: 6», что вводило в заблуждение.

**Причина:**  
Исторически интерфейс проектировался под одну модель «1 автор = 1 участие». При изменении логики на «1 пост = 1 участие» тексты не были обновлены.

**Решение:**  
1. **Фронтенд** — все тексты в `PostsTab.tsx` переведены:
   - «Все участники» → «Все посты»
   - «Найдено участников: N» → «Найдено постов: N» + «Уникальных авторов: N»
   - Пустое состояние: «…найти отзывы»
   - Модалка финализации: «Будет выбран 1 случайный пост-победитель»
   - Модалка очистки: «удалить ВСЕ посты»
   - Title кнопок: «Присвоить номера новым постам», «Выбрать пост-победитель»
2. **Бэкенд** — тексты логов и сообщений обновлены:
   - `finalizer.py` — «Недостаточно постов», «Все авторы постов в ЧС», «Selected winning post»
   - `processor.py` — «Нет новых постов для обработки»

**Файл(ы):**
- `features/automations/reviews-contest/components/PostsTab.tsx` — все UI-тексты
- `backend_python/services/automations/reviews/finalizer.py` — сообщения финализации
- `backend_python/services/automations/reviews/processor.py` — сообщение процессора

---

### Сбор подписчиков: краш воркеров из-за несуществующего атрибута ProjectProgress.name

**Проблема:**  
При запуске массового сбора подписчиков из админ-панели (Админ инструменты → Сбор подписчиков) воркеры крашились с ошибкой `'ProjectProgress' object has no attribute 'name'`. В результате сбор завершался с результатом 0/206 обработанных проектов.

**Причина:**  
В `worker.py` строке 69 обращение к `state.projects_progress[project_id].name`, тогда как dataclass `ProjectProgress` (определённый в `parallel_common/models.py`) имеет атрибут `project_name`, а не `name`.

**Решение:**  
Исправлено обращение `.name` → `.project_name` в файле `worker.py`.

**Файл(ы):** `backend_python/services/lists/parallel_subscribers/worker.py`

---

### Модуль сообщений: новый пользователь не появлялся в списке диалогов в реальном времени

**Проблема:**  
Когда новый пользователь (ещё не присутствующий в списке рассылки) писал сообщение в сообщество, его диалог не появлялся в sidebar модуля сообщений. Бэкенд корректно сохранял сообщение в кэш, добавлял пользователя в mailing list и публиковал SSE-события `mailing_user_updated` и `new_message`, но фронтенд их игнорировал для несуществующих пользователей.

**Причина:**  
Хук `useConversations` строил список диалогов одноразово при загрузке страницы (API `getSubscribers` с listType='mailing'). Методы `updateUnreadCount` и `updateLastMessage` работали только с уже существующими записями. Обработчик `handleMailingUserUpdated` в MessagesPage обновлял только инфо-панель текущего открытого диалога — новых пользователей не добавлял.

**Решение:**  
1. В `useConversations` добавлен метод `addNewConversationFromSSE(user: MailingUserInfo)` — при получении SSE `mailing_user_updated` маппит `MailingUserInfo` → `SystemListSubscriber` и вставляет в начало списка subscribers. Дедупликация по vk_user_id.
2. В `MessagesPage.handleMailingUserUpdated` — помимо обновления UserInfoPanel, теперь вызывает `addNewConversationFromSSE` для добавления нового пользователя в sidebar.
3. Проп прокинут через App.tsx → AppContent.tsx → MessagesPage.

**Обнаруженный сопутствующий баг:**  
При диагностике обнаружено, что callback-сервер VK для группы «тестовая группа 122» (206603931) был настроен на устаревший ngrok URL (`https://a8ee-...ngrok-free.app`), поэтому VK не доставлял события на сервер. URL был обновлён через `groups.editCallbackServer`.

**Файл(ы):**
- `features/messages/hooks/useConversations.ts` — метод addNewConversationFromSSE
- `features/messages/components/MessagesPage.tsx` — обработчик handleMailingUserUpdated
- `features/navigation/components/AppContent.tsx` — проброс пропа
- `App.tsx` — проброс addNewConversationFromSSE

---

### VK Callback: улучшено логирование ошибок парсинга JSON

**Проблема:**  
При ошибках парсинга JSON в callback-эндпоинте логировалась только строка «Не удалось распарсить JSON» без каких-либо деталей. Невозможно было определить, от какой группы пришёл запрос и почему он не распарсился.

**Решение:**  
Расширен лог ошибки: теперь включает IP-адрес клиента, Content-Type заголовок, тело запроса (первые 500 байт) и текст исключения.

**Файл(ы):** `backend_python/routers/vk_callback.py`

---

### Устаревший ngrok URL в callback-сервере VK

**Проблема:**  
Callback-сервер для группы «тестовая группа 122» (206603931) был настроен на старый ngrok URL, который протух после перезапуска. VK продолжал отправлять события (message_new, message_typing_state и др.) на недоступный URL, поэтому ни одно событие не попадало на бэкенд. При этом рабочая группа «Тест» (173525155) имела дополнительный ручной сервер с актуальным ngrok, поэтому работала корректно.

**Причина:**  
ngrok-туннель при перезапуске получает новый URL, но VK callback-сервер продолжает слать на старый. Автонастройка callback была выполнена однократно, после чего ngrok был перезапущен без повторной настройки callback-URL.

**Решение:**  
URL обновлён через VK API `groups.editCallbackServer` на актуальный ngrok-адрес. Это инфраструктурная проблема локальной разработки — при каждом перезапуске ngrok нужно нажимать «Настроить автоматически» в настройках проекта для каждой группы.

**Файл(ы):** Инфраструктурный фикс (обновление callback URL через VK API)

---

### Автонастройка Callback API из интерфейса

**Описание:**  
Добавлена возможность автоматически создать и настроить Callback-сервер VK прямо из настроек проекта. Одна кнопка заменяет ручную настройку: получение confirmation code, регистрация сервера, подписка на все события.

**Реализация:**  
1. **Бэкенд-сервис** `services/callback_setup.py` — вся логика автонастройки:
   - `detect_ngrok_url()` — определяет ngrok URL через локальный API (`127.0.0.1:4040/api/tunnels`)
   - `auto_setup_callback()` — получает confirmation code, создаёт/обновляет сервер, подписывает на 42 типа событий
   - Для продакшена: сервер «smmit» → `api.dosmmit.ru/api/vk/callback`
   - Для локалки: сервер «smmitloc» → `{ngrok_url}/api/vk/callback`
   - При повторном нажатии: если URL не изменился и статус ok — пропускает `editCallbackServer`, обновляет только подписку на события
2. **Роутер** `routers/vk_callback.py` — 3 новых эндпоинта:
   - `POST /api/vk/setup-callback` — запуск автонастройки
   - `GET /api/vk/detect-ngrok` — проверка ngrok
   - `GET /api/vk/callback-servers/{project_id}` — список серверов
3. **Фронтенд API** `services/api/vk.api.ts` — функции `setupCallbackAuto`, `detectNgrok`, `getCallbackServers`
4. **UI** `IntegrationsSection.tsx` — блок «Автонастройка Callback-сервера» с:
   - Автоопределением окружения (local/сервер)
   - Кнопкой с анимацией загрузки
   - Подсказками если нет токена или ID группы
   - Результатом (зелёный/красный блок с деталями)
   - Автосохранением confirmation code в проект

**Файл(ы):**
- `backend_python/services/callback_setup.py` — сервис автонастройки
- `backend_python/routers/vk_callback.py` — 3 эндпоинта
- `services/api/vk.api.ts` — API-функции фронтенда
- `features/projects/components/modals/settings-sections/IntegrationsSection.tsx` — UI кнопки

---

### Массовая автонастройка Callback-серверов VK

**Описание:**  
На странице «Управление базой проектов» добавлена кнопка «Настроить колбэки», которая одним нажатием настраивает Callback-серверы VK для всех проектов с заполненным токеном сообщества. Ранее нужно было заходить в настройки каждого проекта и нажимать «Настроить автоматически» — при 200+ проектах это нереально.

**Реализация:**  
1. **Фронтенд-модалка** `BulkCallbackSetupModal.tsx` — 3 состояния (подготовка → прогресс → итоги):
   - Фильтрация проектов: `communityToken` + `vkProjectId` + не архивные
   - Последовательные запросы к существующему `POST /vk/setup-callback` с задержкой 400мс для защиты от rate limit VK API
   - Живой прогресс-бар с именем текущего проекта и промежуточной статистикой
   - Кнопка «Остановить» (abort через useRef) для прерывания в любой момент
   - Итоговая сводка: создано / обновлено / подписка обновлена / ошибки
   - Ошибки с кодом 2000 (лимит 10 серверов) — с подсказкой для пользователя
2. **Кнопка в тулбаре** `DatabaseManagementPage.tsx` — фиолетовая кнопка с иконкой молнии между «Auto №» и «Администрируемые»
3. **0 изменений бэкенда** — полностью переиспользуется существующий эндпоинт `setup-callback`
4. **Автоопределение окружения** из `localStorage('api_environment')` → `is_local` для каждого запроса

**Файл(ы):**
- `features/database-management/components/modals/BulkCallbackSetupModal.tsx` — новый компонент
- `features/database-management/components/DatabaseManagementPage.tsx` — кнопка + подключение модалки

---

### Сайдбар проектов: бейдж непрочитанных диалогов в модуле сообщений

**Описание:**  
При работе в модуле «Сообщения ВКонтакте» в сайдбаре проектов теперь отображается количество диалогов с непрочитанными сообщениями для каждого проекта. Считаются именно диалоги (чаты), а не общее количество сообщений.

**Реализация:**  
1. **Хук `useUnreadDialogCounts`** (`features/messages/hooks/useUnreadDialogCounts.ts`) — при входе в модуль сообщений параллельно (Promise.all) запрашивает `getUnreadCounts` для каждого активного проекта. Из ответа считает количество диалогов с `count > 0`.
2. **App.tsx** — хук подключён, результат `unreadDialogCounts` передаётся в `Sidebar`. useEffect синхронизирует счётчик активного проекта из `conversations` (обновляется в реальном времени через SSE).
3. **Sidebar.tsx** — принимает новый пропс `unreadDialogCounts` и передаёт `unreadDialogsCount` в `ProjectListItem` только при `activeView === 'messages-vk' | 'messages-tg'`.
4. **ProjectListItem.tsx** — новый пропс `unreadDialogsCount`. Если > 0 — рендерит индиго-бейдж с числом. Если 0 — ничего не отображается.

**Файл(ы):**
- `features/messages/hooks/useUnreadDialogCounts.ts` — новый хук
- `App.tsx` — подключение хука, useEffect-синхронизация
- `features/projects/components/Sidebar.tsx` — пропс unreadDialogCounts
- `features/projects/components/ProjectListItem.tsx` — пропс unreadDialogsCount, рендер бейджа

---

### Информативное сообщение при лимите Callback-серверов VK (ошибка 2000)

**Описание:**  
VK ограничивает количество Callback-серверов до 10 штук на сообщество. Раньше при достижении лимита пользователь видел непонятное сообщение «VK_API_ERROR: Servers number limit is reached (Code: 2000)» без какой-либо инструкции. Теперь бэкенд возвращает `error_code` из VK API, а фронтенд показывает понятное сообщение со ссылкой на страницу управления Callback-серверами в VK.

**Реализация:**  
1. **Бэкенд:** В `callback_setup.py` → `auto_setup_callback()` в результат добавлено поле `error_code` (None по умолчанию, заполняется из `VkApiError.code`). В `vk_callback.py` → `CallbackSetupResponse` добавлены поля `error_code: Optional[int]` и `vk_group_short_name: Optional[str]` для формирования прямой ссылки на фронте.
2. **Фронтенд API:** В `vk.api.ts` → `CallbackSetupResponse` добавлены `error_code` и `vk_group_short_name`.
3. **Модалка настроек:** В `IntegrationsSection.tsx` при `error_code === 2000` отображается amber-плашка «Достигнут лимит Callback-серверов» с кнопкой-ссылкой на `https://vk.com/{shortname}?act=api`.
4. **Модуль сообщений:** В `useMailingCollection.ts` добавлены `callbackErrorCode` и `vkApiSettingsUrl`. В `MailingOnboarding.tsx` при `callbackErrorCode === 2000` показывается шаг «Лимит Callback-серверов» со ссылкой на настройки API сообщества.

**Файл(ы):**
- `backend_python/services/callback_setup.py` — поле error_code в результате
- `backend_python/routers/vk_callback.py` — error_code + vk_group_short_name в CallbackSetupResponse
- `services/api/vk.api.ts` — интерфейс CallbackSetupResponse
- `features/projects/components/modals/settings-sections/IntegrationsSection.tsx` — amber-блок при лимите
- `features/messages/hooks/useMailingCollection.ts` — callbackErrorCode, vkApiSettingsUrl
- `features/messages/components/MailingOnboarding.tsx` — UI при лимите серверов

---

### Модуль сообщений: непрочитанные диалоги автоматически в топе списка

**Описание:**  
При входе в проект (модуль «Сообщения») диалоги отображались в порядке загрузки из API, без учёта непрочитанных. Пользователю приходилось прокручивать весь список, чтобы найти диалоги с новыми сообщениями.

**Реализация:**  
В хуке `useConversations.ts` добавлена сортировка в `useMemo` при маппинге подписчиков в диалоги:
1. **Непрочитанные диалоги всегда сверху** — отсортированы по убыванию количества непрочитанных сообщений (больше → выше)
2. **Прочитанные ниже** — отсортированы по дате последнего сообщения (новее → выше)
3. Сортировка пересчитывается автоматически при обновлении `unreadCountsMap` (в т.ч. через SSE)

**Файл(ы):** `features/messages/hooks/useConversations.ts`

---

### Модуль сообщений: глобальный SSE-стрим счётчиков непрочитанных диалогов

**Описание:**  
Ранее счётчики непрочитанных диалогов в сайдбаре проектов загружались однократно при входе в модуль «Сообщения» через HTTP-запросы `getUnreadCounts` для каждого проекта. Затем в реальном времени обновлялся только активный проект (через per-project SSE → useConversations → useMemo). Счётчики неактивных проектов не обновлялись: при получении нового сообщения в другой проект бейдж не появлялся, при чтении диалога другим менеджером бейдж не уменьшался.

**Реализация:**  

**Бэкенд:**
1. `SSEManager` (sse_manager.py) — добавлена глобальная подписка:
   - `_global_subscribers: Set[asyncio.Queue]` — набор очередей без привязки к project_id
   - `subscribe_global() / unsubscribe_global()` — подключение/отключение клиента
   - `publish_global()` — потокобезопасная публикация всем глобальным подписчикам
   - `publish_global_via_redis()` — через Redis (канал `sse:global:unread`) с fallback
   - Redis listener обновлён: теперь слушает `sse:global:unread` помимо `sse:messages:*`

2. `GET /messages/global-unread-stream` (messages.py) — новый SSE-эндпоинт:
   - Один EventSource на все проекты, пушит событие `unread_count_changed: { project_id, unread_dialogs_count }`
   - Heartbeat каждые 30с, автоматическое переподключение

3. `_publish_global_unread_count()` (handler.py) — вызывается при:
   - `message_new` (VK Callback) — после сохранения в кэш и per-project SSE
   - `PUT /messages/mark-read` — после пометки диалога прочитанным
   - Считает количество диалогов с непрочитанными через `get_unread_dialogs_count()`

4. `get_unread_dialogs_count()` (message_read_crud.py) — новая CRUD-функция:
   - Один SQL-запрос: подзапрос MAX(vk_message_id) входящих по группам → LEFT JOIN с MessageReadStatus → COUNT где max_msg_id > last_read_message_id

**Фронтенд:**
5. `useGlobalUnreadSSE` (useGlobalUnreadSSE.ts) — новый хук:
   - Один EventSource к `/messages/global-unread-stream`
   - Слушает `unread_count_changed` → вызывает `onUnreadCountChanged(projectId, count)`
   - Включается при `activeModule === 'am'`, автоматическое переподключение

6. `App.tsx` — интеграция:
   - `useGlobalUnreadSSE({ enabled: activeModule === 'am', onUnreadCountChanged: updateUnreadDialogCount })`
   - Работает параллельно с существующим `useUnreadDialogCounts` (начальная загрузка) и per-project SSE (активный проект)

**Файл(ы):**
- `backend_python/services/sse_manager.py` — глобальная подписка
- `backend_python/routers/messages.py` — эндпоинт global-unread-stream + publish при mark-read
- `backend_python/services/vk_callback/handlers/messages/handler.py` — publish при message_new
- `backend_python/crud/message_read_crud.py` — get_unread_dialogs_count
- `features/messages/hooks/useGlobalUnreadSSE.ts` — хук глобального SSE
- `App.tsx` — интеграция хука

---

### Модуль сообщений: фильтры отображения в чате

**Описание:**  
Добавлена панель фильтров отображения внутри диалога — компактные toggle-фильтры для уменьшения визуального шума в чате. Позволяют: показывать только наши / только пользовательские сообщения, скрывать вложения, скрывать кнопки бота.

**Реализация:**  
1. **Типы** (`types.ts`): добавлен интерфейс `ChatDisplayFilters` с полями `hideAttachments` (boolean) и `hideKeyboard` (boolean).
2. **ChatView.tsx**: state `displayFilters`, передаётся вниз в `ChatHeader` и `ChatMessageList`.
3. **ChatHeader.tsx**: новая кнопка-воронка рядом с поиском + раскрывающаяся панель `isFiltersOpen`:
   - Табы направления: Все / Наши / Пользователя (синхронизированы с `searchFilter`)
   - Toggle «Скрыть вложения» (`hideAttachments`)
   - Toggle «Скрыть кнопки» (`hideKeyboard`)
   - Кнопка «Сбросить» при наличии активных фильтров
   - Точка-индикатор (`hasActiveDisplayFilters`) на иконке при активных фильтрах
4. **ChatMessageList.tsx**: прокидывает `displayFilters` в каждый `ChatMessage`.
5. **ChatMessage.tsx**: при `hideAttachments` — вложения не рендерятся, вместо них компактный индикатор «📎 N влож.». При `hideKeyboard` — клавиатура бота не рендерится, вместо неё индикатор «кнопки». Корректно обрабатывает стикеры/граффити/подарки (без бабла) при скрытии вложений.

**Файл(ы):**
- `features/messages/types.ts` — `ChatDisplayFilters`
- `features/messages/components/ChatView.tsx` — state + пропсы
- `features/messages/components/ChatHeader.tsx` — кнопка + панель фильтров
- `features/messages/components/ChatMessageList.tsx` — проброс `displayFilters`
- `features/messages/components/ChatMessage.tsx` — условное скрытие вложений/кнопок

---

### Модуль сообщений: вкладка «Вложения» в профиле переписки

**Описание:**  
В правой панели информации о пользователе (UserInfoPanel) добавлена третья вкладка «Вложения» (рядом с «Профиль» и «Посты»). Показывает все вложения из загруженных сообщений переписки, сгруппированные по 4 подразделам: Фото / Видео / Ссылки / Файлы.

**Реализация:**  
1. **Хук `useConversationAttachments`** — извлекает вложения из массива `ChatMessageData[]` через `useMemo`, группирует по категориям (photo/graffiti → photos, video → videos, link/wall → links, document → files). Каждое вложение обогащается контекстом: `messageId`, `messageDate`, `direction`.
2. **Компонент `AttachmentsTab`** — основная вкладка с подкатегориями (SubTab). Подкомпоненты:
   - `PhotosGrid` — сетка 3×3, превью по клику (ImagePreviewModal), кнопка скачивания при наведении (fetch → blob → download, с fallback на window.open при CORS).
   - `VideosList` — карточки с превью, длительностью и датой.
   - `LinksList` — карточки с крупным превью, заголовком, описанием, URL + кнопка копирования ссылки в буфер.
   - `FilesList` — список с иконкой, размером и кнопкой скачивания.
   - `EmptyCategory` — заглушка при отсутствии вложений.
3. **Плашка «Загрузить все»** — если история неполная (`!isFullyLoaded`), показывается amber-плашка с количеством загруженных сообщений и кнопкой вызова `onLoadAll`.
4. **UserInfoPanel** — тип `InfoTab` расширен на `'attachments'`, добавлены пропсы `messages`, `isFullyLoaded`, `isLoadingAll`, `onLoadAll`. Третья кнопка-вкладка.
5. **MessagesPage** — проброшены `messages`, `isFullyLoaded`, `isLoadingAll`, `loadAll` из `useMessageHistory` в `UserInfoPanel`.

**Файл(ы):**
- `features/messages/hooks/useConversationAttachments.ts` — новый хук
- `features/messages/components/AttachmentsTab.tsx` — новый компонент
- `features/messages/components/UserInfoPanel.tsx` — третья вкладка + пропсы
- `features/messages/components/MessagesPage.tsx` — проброс данных

---

### Модуль сообщений: onboarding-flow сбора подписчиков (рассылки)

**Описание:**  
В модуль «Сообщения» добавлен полноценный onboarding-flow для сбора подписчиков рассылки, аналогичный функционалу из раздела «Списки → Рассылка». Пока токен или Callback API не настроены — сайдбар диалогов полностью заблокирован и показывает пошаговую инструкцию. После готовности — кнопка «Загрузить подписчиков» запускает SSE-стриминг сбора.

**Реализация:**  
1. **Хук `useMailingCollection`** (`useMailingCollection.ts`) — стейт-машина с состояниями: `checking`, `no-token`, `no-callback`, `setting-up-callback`, `callback-error`, `ready`, `collecting`, `done`, `error`. Проверяет: наличие `communityToken` → наличие `vk_confirmation_code` (локальная проверка без VK API). Методы: `checkReadiness()`, `setupCallback()` (вызывает `setupCallbackAuto`), `startCollection()` (вызывает `refreshMailingStream` с SSE-прогрессом). Использует `projectRef.current` для стабильных колбэков, зависимости оптимизированы до примитивов (`project?.id`, `project?.communityToken`, `project?.vk_confirmation_code`).
2. **Компонент `MailingOnboarding`** (`MailingOnboarding.tsx`, ~294 строк) — UI для каждого состояния: иконки, описания, кнопки действий. Прогресс-бар при `collecting`. Кнопка «Открыть интеграции» при `no-token` / `no-callback`. Кнопка «Настроить автоматически» при `no-callback`. Кнопка «Загрузить подписчиков» при `ready`.
3. **ConversationsSidebar** — хук `useMailingCollection` вызывается на верхнем уровне. Множество `BLOCKING_STATES = new Set(['checking', 'no-token', 'no-callback', 'setting-up-callback', 'callback-error'])`. Если `isBlocked` — весь блок поиска/фильтров/списка скрыт, вместо него `MailingOnboarding`. Новые пропсы: `activeProject`, `onOpenIntegrations`.
4. **App.tsx** — новый стейт `settingsInitialSection: AccordionSectionKey | null`. Колбэк `handleOpenIntegrations` — устанавливает секцию `'integrations'` и открывает модальное окно настроек проекта. Передаёт `activeProject` и `onOpenIntegrations` в `ConversationsSidebar`. `ProjectSettingsModal` получает `initialOpenSection`.

**Файл(ы):**
- `features/messages/hooks/useMailingCollection.ts` — новый хук
- `features/messages/components/MailingOnboarding.tsx` — новый компонент
- `features/messages/components/ConversationsSidebar.tsx` — блокировка + интеграция
- `App.tsx` — проброс пропсов + модальное окно с начальной секцией

---

### Модуль сообщений: исправление проверки Callback API

**Проблема:**  
Проверка подключения Callback API работала непоследовательно — в одних проектах callback отображался как подключённый (хотя бэкенд не мог принимать события), в других — как неподключённый (хотя всё работало). Причина: хук `useMailingCollection` использовал VK API `getCallbackServers`, который возвращал серверы, настроенные извне (например, чат-ботами), с `status: 'ok'`, даже если на бэкенде отсутствовал `vk_confirmation_code` для подтверждения.

**Причина:**  
VK API `groups.getCallbackServers` возвращает ВСЕ callback-серверы группы, включая созданные через другие сервисы. Сервер с `status: 'ok'` не означает, что наш бэкенд готов обрабатывать события — для этого нужен `vk_confirmation_code`.

**Решение:**  
Заменена проверка через VK API на локальную проверку поля `project.vk_confirmation_code`. Если поле заполнено — callback считается настроенным. Удалены импорты `getCallbackServers` и `CallbackServer` из хука.

**Файл(ы):**
- `features/messages/hooks/useMailingCollection.ts` — замена VK API проверки на локальную

---

---

### одуль сообщений: фильтр «епрочитанные» в сайдбаре диалогов

**писание:**
обавлен фильтр по непрочитанным диалогам в сайдбаре модуля «Сообщения». ильтрация происходит на стороне базы данных (не на фронте), с корректной пагинацией и total_count.

**еализация:**
1. **экенд (ариант 3 — расширение существующего flow):**
   - `SystemListPayload` (api_payloads.py) — новый параметр `filterUnread: Optional[str] = 'all'` (значения: `'all'` / `'unread'`).
   - `routers/lists.py` — прокидывает `filter_unread` в сервис.
   - `services/lists/list_retrieval.py` — прокидывает `filter_unread` в `fetch_list_items` / `fetch_list_count`.
   - `services/lists/retrieval/fetchers.py` — при `filter_unread='unread'` + `listType='mailing'` вызывает `get_unread_user_ids()` и фильтрует query через `model.vk_user_id.in_(unread_ids)`.
   - **овый файл `services/lists/retrieval/unread_filter.py`** — SQL-запрос: LEFT JOIN `CachedMessage` + `MessageReadStatus`, GROUP BY `vk_user_id`, HAVING `SUM(CASE WHEN vk_message_id > COALESCE(last_read_message_id, 0) THEN 1 ELSE 0 END) > 0`. дин запрос вместо N.
2. **ронтенд:**
   - `services/api/lists.api.ts` — параметр `filterUnread` в `getSubscribers()`.
   - `features/messages/hooks/useConversations.ts` — параметр `filterUnread` в интерфейсе хука; `fetchData` зависит от `filterUnread`, при смене — автоматическая перезагрузка данных.
   - `features/messages/components/ConversationsSidebar.tsx` — кнопки-переключатель «се / епрочитанные» между поиском и списком; пустое состояние «се диалоги прочитаны» при `filterUnread='unread'` и нет результатов.
   - `App.tsx` — состояние `conversationFilterUnread`, прокинуто в `useConversations` и `ConversationsSidebar`.

**айл(ы):**
- `backend_python/schemas/api_payloads.py`
- `backend_python/routers/lists.py`
- `backend_python/services/lists/list_retrieval.py`
- `backend_python/services/lists/retrieval/fetchers.py`
- `backend_python/services/lists/retrieval/unread_filter.py` — новый
- `services/api/lists.api.ts`
- `features/messages/hooks/useConversations.ts`
- `features/messages/components/ConversationsSidebar.tsx`
- `App.tsx`
---

### Модуль сообщений: вкладка «Посты пользователя» в профиле переписки

**Описание:**  
При открытии диалога с пользователем в модуле «Сообщения» теперь доступна отдельная вкладка «Посты» в правой панели информации о пользователе. Во вкладке отображаются все записи, опубликованные этим пользователем (от его имени) в сообществе — с текстом, фото, статистикой (лайки, комментарии, репосты, просмотры) и ссылкой на пост ВК.

**Реализация:**  
1. **Бэкенд:**
   - `crud/lists/posts.py` — новая CRUD-функция `get_posts_by_author(db, project_id, vk_user_id, page, page_size)`: запрос в `SystemListPost` по `signer_id OR post_author_id`, с пагинацией (OFFSET/LIMIT), возвращает `(items, total_count)`.
   - `schemas/api_payloads.py` — схема `UserPostsPayload(projectId, vkUserId, page=1, pageSize=20)`.
   - `schemas/api_responses.py` — схема `UserPostsResponse(items: List[SystemListPost], total_count, page, page_size)`.
   - `schemas/__init__.py` — регистрация новых схем.
   - `routers/lists.py` — новый эндпоинт `POST /lists/system/getUserPosts`.
2. **Фронтенд:**
   - `services/api/lists.api.ts` — функция `getUserPosts(projectId, vkUserId, page, pageSize)`.
   - `features/messages/hooks/useUserPosts.ts` — новый хук с пагинацией (`PAGE_SIZE=20`), автозагрузкой, `loadMore`.
   - `features/messages/components/UserPostsTab.tsx` — новый компонент: карточки постов с фото, текстом, статистикой, IntersectionObserver для бесконечного скролла, ImagePreviewModal, пустое состояние.
   - `features/messages/components/UserInfoPanel.tsx` — расширен `InfoTab` на `'posts'`, добавлена вкладка с бейджем количества постов.
   - `features/messages/components/MessagesPage.tsx` — интеграция `useUserPosts`, проброс данных в `UserInfoPanel`.

**Файл(ы):**
- `backend_python/crud/lists/posts.py`
- `backend_python/schemas/api_payloads.py`
- `backend_python/schemas/api_responses.py`
- `backend_python/schemas/__init__.py`
- `backend_python/routers/lists.py`
- `services/api/lists.api.ts`
- `features/messages/hooks/useUserPosts.ts` — новый
- `features/messages/components/UserPostsTab.tsx` — новый
- `features/messages/components/UserInfoPanel.tsx`
- `features/messages/components/MessagesPage.tsx`

---

### Модуль сообщений: оптимизация пагинации — 50 в UI / 200 из VK API

**Описание:**  
При открытии диалога раньше загружалась сразу вся страница из 200 сообщений. Теперь в интерфейсе отображается 50, а бэкенд при первом запросе к VK API всегда загружает и кэширует 200 — для ускорения последующих пагинаций.

**Реализация:**  
1. **Бэкенд** (`routers/messages.py`): параметр `count` по умолчанию = 50. Добавлена константа `VK_FETCH_SIZE = 200`. При запросе к VK API всегда запрашивается 200 сообщений, все сохраняются в БД через bulk upsert. Клиенту возвращается `items_for_client = all_items[:count]`.
2. **Фронтенд** (`useMessageHistory.ts`): `PAGE_SIZE` изменён с 200 на 50.

**Файл(ы):**
- `backend_python/routers/messages.py`
- `features/messages/hooks/useMessageHistory.ts`

---

### Модуль сообщений: обновление превью последнего сообщения в сайдбаре при первой загрузке

**Описание:**  
При открытии диалога, для которого не было кэша в БД, сообщения подгружались из VK API и отображались в чате, но в превью сайдбара (список диалогов) по-прежнему показывалось «Нет сообщений». Превью обновлялось только через SSE (при новых сообщениях) или при отправке.

**Причина:**  
`loadInitial()` в `useMessageHistory` получал `data.items` (массив `VkMessageItem`), маппил их в `ChatMessageData` и отображал. Но raw VK-элемент не передавался в `updateLastMessage()` из `useConversations`, поэтому `lastMessagesMap` не обновлялся.

**Решение:**  
1. **useMessageHistory.ts**: добавлен стейт `lastRawVkItem: VkMessageItem | null`. В `loadInitial()` после успешного ответа сохраняется `data.items[0]` (самое новое сообщение). Экспортируется в return.
2. **MessagesPage.tsx**: `useEffect` при изменении `lastRawVkItem` вызывает `updateLastMessage(vkUserId, lastRawVkItem)` → превью в сайдбаре обновляется.

**Файл(ы):**
- `features/messages/hooks/useMessageHistory.ts`
- `features/messages/components/MessagesPage.tsx`

---

### Модуль сообщений: обратная анимация — новые сообщения появляются первыми

**Описание:**  
При входе в диалог сообщения появлялись с анимацией сверху вниз — delay нарастал от первого (старого) к последнему (новому). При 50 сообщениях пользователю приходилось ждать ~1 сек, пока анимация дойдёт до последнего сообщения, и только тогда можно было начинать работать.

**Решение:**  
В `ChatMessageList.tsx` порядок delay инвертирован: последнее (новое) сообщение получает `delay = 0ms`, а старые (верхние) — нарастающий delay. Шаг уменьшен с 20ms до 15ms. Поскольку чат автоскроллится вниз, пользователь сразу видит последнее сообщение, а верхние (невидимые) подгружаются в фоне.

**Файл(ы):** `features/messages/components/ChatMessageList.tsx`

---

### Модуль сообщений: исправлен скролл к последнему сообщению при входе в диалог

**Описание:**  
При входе в диалог последнее сообщение обрезалось снизу — изображение или часть текста уходили за нижнюю границу экрана. Пользователь видел сообщение не полностью.

**Причина:**  
`scrollIntoView({ behavior: 'auto' })` срабатывал мгновенно после рендера, когда изображения ещё не загрузились (их высота = 0). После загрузки картинок контент увеличивался, а скролл уже не обновлялся.

**Решение:**  
Заменён `scrollIntoView` на `containerRef.scrollTop = containerRef.scrollHeight` с повторами через 150ms и 500ms — компенсирует загрузку изображений и анимации.

**Файл(ы):** `features/messages/components/ChatMessageList.tsx`

---

### Модуль сообщений: кнопка «Прочитать все» — массовая пометка диалогов прочитанными

**Описание:**  
Добавлена кнопка «✓ Прочитать все» в сайдбаре диалогов, которая помечает ВСЕ непрочитанные диалоги проекта как прочитанные одним запросом. При нажатии открывается модалка подтверждения.

**Реализация:**  
- Бэкенд: новая CRUD-функция `mark_all_dialogs_as_read()` в `message_read_crud.py` — для каждого `vk_user_id` с входящими сообщениями ставит `last_read = max(vk_message_id)` за один проход по БД.
- Бэкенд: новый эндпоинт `PUT /messages/mark-all-read` в `routers/messages.py` — принимает `project_id` + `manager_id`, публикует SSE-события (`all_read` + глобальный `unread_count_changed`).
- Фронтенд: API-функция `markAllDialogsAsRead()` в `messages.api.ts`.
- Фронтенд: метод `resetAllUnreadCounts()` в `useConversations` — обнуляет `unreadCountsMap`.
- Фронтенд: кнопка «✓ Прочитать все» в `ConversationsSidebar` с `ConfirmationModal`.
- Проброс через `App.tsx`: `onMarkAllRead` → `markAllDialogsAsRead` + `resetAllUnreadCounts`.

**Файл(ы):**  
- `backend_python/crud/message_read_crud.py`
- `backend_python/routers/messages.py`
- `services/api/messages.api.ts`
- `features/messages/hooks/useConversations.ts`
- `features/messages/components/ConversationsSidebar.tsx`
- `App.tsx`

---

### Модуль рассылки: автоматический upsert подписчика при входящем сообщении (message_new)

**Описание:**  
При получении VK Callback API события `message_new` (входящее сообщение от пользователя) система теперь автоматически добавляет или обновляет пользователя в списке рассылки (SystemListMailing) с полным набором данных. Ранее для попадания в список рассылки требовался ручной запуск «Обновить подписчиков» из интерфейса или фоновая синхронизация.

**Реализация:**  
1. **Бэкенд** — новая функция `_upsert_mailing_and_notify()` в `handler.py`:
   - Вызывается из `_smart_save_and_notify()` только для входящих сообщений (`is_incoming` guard)
   - Получает данные пользователя через VK API `users.get` (поля: photo_200, sex, bdate, city, country, last_seen, online, can_write_private_message, is_closed)
   - Формирует entry dict в формате, идентичном `list_sync_mailing.py` (first_name, last_name, photo_url, sex, bdate, city, country, last_seen, online, can_write_private_message, is_closed, added_at, source='callback')
   - Вызывает `bulk_upsert_mailing(db, project_id, [entry])` — Split Upsert: при INSERT заполняет все поля, при UPDATE сохраняет `added_at`, `source`, `first_message_date`, `first_message_from_id`
   - Читает обратно обновлённую запись через `get_mailing_user_by_vk_id()` для получения актуальных полей (включая вычисляемые)
   - Обогащает данные датами первого/последнего сообщений из cached_messages
   - Публикует SSE-событие `mailing_user_updated` с полным объектом MailingUserInfo через `publish_via_redis()`
   - Все ошибки обёрнуты в try/except — не блокируют основной flow Callback API

2. **SSE-типы фронтенд** — в `features/messages/types.ts`:
   - Добавлен тип `'mailing_user_updated'` в union `SSEEventType`
   - Добавлен интерфейс `SSEMailingUserUpdatedData { user: MailingUserInfo }`
   - Расширен `SSEMessageEvent.data` на `SSEMailingUserUpdatedData`

3. **SSE-обработчик в Сообщениях** (`useMessagesSSE.ts`):
   - Добавлен callback `onMailingUserUpdated` в `SSECallbacks`
   - Добавлен `case 'mailing_user_updated'` в switch
   - Добавлен `addEventListener('mailing_user_updated', ...)` на EventSource

4. **UserInfoPanel обновление** (`useMailingUserInfo.ts`):
   - Добавлен метод `updateFromSSE(data: MailingUserInfo)` — мгновенно обновляет данные пользователя в правой панели без HTTP-запроса

5. **MessagesPage** → обработчик `handleMailingUserUpdated`:
   - Проверяет `vkUserIdRef.current === data.user.vk_user_id`
   - Вызывает `updateUserInfoFromSSE(data.user)` для обновления UserInfoPanel

6. **Модуль «Списки»** — новый хук `useMailingSSEUpdater`:
   - Подключается к `/messages/stream` с суффиксом `_lists` в `manager_id`
   - Слушает SSE-событие `mailing_user_updated`
   - При активном списке `mailing` — с debounce 500мс вызывает `fetchItems(1, search, true)` + `fetchStats('mailing')` + `fetchMeta()` для обновления таблицы, статистики и мета-информации
   - Подключён в `useSystemListsManager`

**Файл(ы):**
- `backend_python/services/vk_callback/handlers/messages/handler.py` — `_upsert_mailing_and_notify()`
- `features/messages/types.ts` — SSE-типы `mailing_user_updated`, `SSEMailingUserUpdatedData`
- `features/messages/hooks/useMessagesSSE.ts` — callback + addEventListener
- `features/messages/hooks/useMailingUserInfo.ts` — метод `updateFromSSE()`
- `features/messages/components/MessagesPage.tsx` — `handleMailingUserUpdated`
- `features/lists/hooks/useMailingSSEUpdater.ts` — новый хук
- `features/lists/hooks/useSystemListsManager.ts` — подключение хука

---

### Модуль сообщений: прикрепление медиа-вложений в чате (фото / видео / документы)

**Описание:**  
Реализован полный цикл прикрепления файлов к сообщениям в чате: фото, видео и документы. Система автоматически определяет тип файла по MIME-type и использует соответствующий VK API для загрузки. Вложения отображаются в сообщении сразу после отправки (оптимистичное отображение).

**Реализация:**  
1. **Бэкенд — upload-функции** (`services/vk_api/upload.py`):
   - `upload_message_photo()` — photos.getMessagesUploadServer → upload → photos.saveMessagesPhoto (community token)
   - `upload_message_doc()` — docs.getMessagesUploadServer → upload → docs.save (community token)
   - `upload_message_video()` — video.save → upload (user-token, т.к. video.save недоступен с group auth — VK Code 27)
2. **Бэкенд — роутер** (`routers/messages.py`): эндпоинт `POST /messages/upload-attachment` автоматически определяет тип файла по content-type:
   - `image/*` → `upload_message_photo`
   - `video/*` → `upload_message_video` (с user-token через `get_admin_token_strings_for_group`)
   - всё остальное → `upload_message_doc`
   - Возвращает `attachment_id`, `attachment_type` (photo/video/document), `preview_url`, `file_name`, `file_size`, `file_url`
3. **Бэкенд — send_service** (`services/messages/send_service.py`): `sent_item` теперь включает `attachments` для всех типов (photo, video, doc) — парсит attachment строку и формирует VK-совместимый формат для корректного маппинга на фронтенде.
4. **Фронтенд — API** (`services/api/messages.api.ts`): `UploadMessageAttachmentResponse` расширен полями `attachment_type`, `file_name`, `file_size`, `file_url`.
5. **Фронтенд — хук** (`features/messages/hooks/useMessageHistory.ts`): `handleSendMessage` загружает ВСЕ файлы (без фильтра по типу), строит оптимистичные превью по `attachment_type`, подставляет их при отсутствии данных в ответе бэкенда.
6. **Фронтенд — input** (`features/messages/hooks/useChatInputLogic.ts`): тип `AttachedFile` расширен до `'document'`, убран фильтр `image/*`.
7. **Фронтенд — UI превью** (`features/messages/components/ChatInputAttachments.tsx`): добавлено отображение документов (иконка файла + расширение).
8. **Фронтенд — accept** (`ChatInput.tsx`): добавлены документарные форматы (.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .zip, .rar, .txt, .csv).

**Важные находки при отладке:**
- `photos.getMessagesUploadServer` требует ТОКЕН СООБЩЕСТВА (user-токены получают Access denied, Code 15)
- `video.save` требует USER-ТОКЕН (community token получает Code 27: method is unavailable with group auth)
- `docs.getMessagesUploadServer` работает с community token
- Для `photos.saveMessagesPhoto` нужно передавать ВСЕ поля upload response через `dict(upload_response)`, а не только photo/server/hash — иначе Invalid hash (Code 121)

**Файл(ы):**
- `backend_python/services/vk_api/upload.py` — `upload_message_photo()`, `upload_message_doc()`, `upload_message_video()`
- `backend_python/services/vk_service.py` — экспорт новых функций
- `backend_python/routers/messages.py` — эндпоинт upload-attachment (авто-определение типа)
- `backend_python/services/messages/send_service.py` — attachments в sent_item
- `backend_python/schemas/messages_schemas.py` — поле attachment в SendMessageRequest
- `services/api/messages.api.ts` — UploadMessageAttachmentResponse, uploadMessageAttachment(), sendMessage()
- `features/messages/hooks/useMessageHistory.ts` — upload + оптимистичные превью
- `features/messages/hooks/useChatInputLogic.ts` — тип document
- `features/messages/components/chatInputConstants.ts` — AttachedFile type
- `features/messages/components/ChatInputAttachments.tsx` — превью документов
- `features/messages/components/ChatInput.tsx` — accept

---

## ✅ Решённые задачи

### Модуль «Списки — Рассылка»: таблица не обновлялась при SSE-событии mailing_user_updated

**Проблема:**  
После реализации real-time обновления списка рассылки через SSE, статистика (количество подписчиков, счётчики) обновлялась корректно, но таблица с пользователями не показывала новых или обновлённых записей. Требовалась ручная перезагрузка страницы для отображения изменений в таблице.

**Причина:**  
Оптимистичное обновление через `setItems` использовало функцию `mapSSEUserToListItem`, которая маппила SSE-данные (`MailingUserInfo`) в `SystemListSubscriber`. Однако таблица рассылки ожидала расширенный тип `SystemListMailingItem`, который содержит дополнительные поля (`conversation_status`, `first_message_date`, `last_message_date`, `messages_received`, `messages_sent` и др.), отсутствующие в базовом `SystemListSubscriber`. Из-за несоответствия типов компонент таблицы не мог корректно отобразить данные.

**Решение:**  
Заменён оптимистичный подход (`setItems` с маппингом) на надёжный HTTP-рефетч: при получении SSE-события `mailing_user_updated`, хук `useMailingSSEUpdater` с debounce 500мс вызывает `fetchItems(1, searchQuery, true)` (перезагрузка первой страницы из API), `fetchStats('mailing')` и `fetchMeta()`. Бэкенд возвращает данные в полном формате `SystemListMailingItem`, что гарантирует корректное отображение в таблице.

**Файл(ы):** `features/lists/hooks/useMailingSSEUpdater.ts`

---

### Утилита «В админы» — массовое назначение системных страниц администраторами в группах VK

**Описание:**  
Новый инструмент в «Управлении базой проектов» для массового назначения системных страниц (System Accounts) администраторами в выбранных группах VK. Решает задачу: выбрал N проектов + M системных страниц → система автоматически проверяет членство, вступает в группы при необходимости и назначает роль.

**Реализация:**  
1. **Бэкенд — сервис** (`admin_tools_service.py`): функция `promote_to_admins()` выполняет полный цикл:
   - Собирает карту `vk_user_id → token` из ENV + System Accounts
   - Для каждой группы батчем проверяет членство через `groups.isMember` (до 500 user_ids за запрос)
   - Не-участников вступает через `groups.join` (токен самого пользователя)
   - Находит токен действующего админа группы через `_find_admin_token_for_group()` (по admins_data из БД, fallback — перебор через groups.getMembers)
   - Назначает роль через `groups.editManager`
   - Обрабатывает VK код 224 (уже администратор)
   - Rate-limit: пауза 0.35с между VK API запросами
2. **Бэкенд — эндпоинт** (`management.py`): `POST /management/administered-groups/promote-to-admins`
3. **Бэкенд — схемы**: `PromoteToAdminsPayload` (group_ids, user_ids, role), `PromoteUserResult`, `PromoteToAdminsResponse`
4. **Фронтенд — API**: `promoteToAdmins()` + TypeScript-интерфейсы `PromoteToAdminsResponse`, `PromoteUserResult`
5. **Фронтенд — модалка** (`PromoteAdminsModal.tsx`): широкое модальное окно (max-w-5xl) с двумя столбцами:
   - Левый: проекты (группы VK) с аватарками, поиском, «Все/Сброс»
   - Правый: системные страницы (загружаются при открытии) с аватарками, поиском
   - Футер: выбор роли (Администратор/Редактор/Модератор), счётчик операций, кнопка «В админы»
   - Результат: таблица с цветной статистикой (назначено ✓, уже админ ℹ, вступил →, ошибка ✗)
6. **Фронтенд — интеграция** (`DatabaseManagementPage.tsx`): кнопка «В админы» (amber стиль) в панели действий

**Файл(ы):**
- `backend_python/services/admin_tools_service.py` — `promote_to_admins()`, `_find_admin_token_for_group()`
- `backend_python/routers/management.py` — эндпоинт promote-to-admins
- `backend_python/schemas/api_payloads.py` — `PromoteToAdminsPayload`
- `backend_python/schemas/api_responses.py` — `PromoteUserResult`, `PromoteToAdminsResponse`
- `services/api/management.api.ts` — `promoteToAdmins()`, TypeScript-интерфейсы
- `features/database-management/components/modals/PromoteAdminsModal.tsx` — модальное окно
- `features/database-management/components/DatabaseManagementPage.tsx` — кнопка + подключение

---

### Модуль сообщений: входящие сообщения не отрисовывались в чате в реальном времени (SSE new_message)

**Проблема:**  
При получении входящего сообщения от пользователя VK, Callback API корректно доставлял событие на бэкенд, обработчик сохранял сообщение в БД и публиковал SSE-события. Глобальное SSE-событие `unread_count_changed` доходило до фронтенда (бейдж непрочитанных обновлялся), per-project SSE-событие `user_typing` также доходило, но `new_message` — нет. Сообщение не появлялось в чате до ручного обновления страницы.

**Причина:**  
Комбинация трёх факторов:
1. **BaseHTTPMiddleware буферизировал StreamingResponse.** Middleware `add_no_cache_headers` через `@app.middleware("http")` (Starlette BaseHTTPMiddleware) оборачивал ВСЕ ответы, включая SSE-стримы. BaseHTTPMiddleware полностью потребляет итератор StreamingResponse перед отдачей клиенту, что ломает real-time семантику SSE. Мелкие события (`user_typing` — несколько байт) проходили из-за буферизации и таймаута, а более тяжёлые `new_message` (сотни байт JSON с текстом, вложениями, клавиатурой) блокировались.
2. **Отсутствие LVC (Last Value Cache) для per-project SSE.** Глобальный SSE-канал имел LVC, а per-project — нет. Если EventSource переподключался (автоматический reconnect после обрыва), все события за время разрыва терялись безвозвратно.
3. **Нет механизма восстановления после reconnect.** Фронтенд не различал первое подключение и переподключение EventSource, поэтому не мог подтянуть пропущенные сообщения.

**Решение:**  
1. **Исключение SSE из BaseHTTPMiddleware** (`main.py`): пути `/stream` и `/global-unread-stream` обходят middleware через early return — `StreamingResponse` идёт напрямую клиенту без буферизации.
2. **Per-project LVC** (`sse_manager.py`): добавлен кеш `_project_lvc: Dict[project_id, Dict[vk_user_id, sse_str]]`. При `publish("new_message")` событие кешируется ПЕРЕД проверкой подписчиков. При `subscribe()` — все кешированные события отправляются новому подписчику через `queue.put_nowait()`. Это решает race condition: если callback приходит раньше, чем клиент подключил EventSource.
3. **Reconnect-aware фронтенд** (`useMessagesSSE.ts` + `useMessagesPageLogic.ts`): добавлен `hadConnectionRef` для отслеживания reconnect. При повторном получении `connected` от SSE вызывается `onReconnect()` → `forceReload()` — фронтенд подтягивает свежую историю из API для открытого диалога.

**Файл(ы):**
- `backend_python/main.py` — early return для SSE-путей в middleware
- `backend_python/services/sse_manager.py` — `_project_lvc`, LVC replay в `subscribe()`, LVC cache в `publish()`
- `features/messages/hooks/useMessagesSSE.ts` — `hadConnectionRef`, `onReconnect` callback
- `features/messages/hooks/useMessagesPageLogic.ts` — `handleReconnect` → `forceReload()`

---

### Модуль сообщений: статус «Можно/Нельзя писать» отображал некорректные данные

**Проблема:**  
В панели информации о пользователе (справа в диалоге) badge «Можно писать / Нельзя писать» показывал неверный статус. Использовалось поле `can_write_private_message` из VK API `users.get`, которое отражает возможность отправки **личного сообщения** от владельца токена, а не возможность писать **от лица сообщества**. При наличии активной переписки с пользователем статус мог показывать «Нельзя писать».

**Причина:**  
Метод `users.get` с полем `can_write_private_message` проверяет, может ли вызывающий аккаунт (в данном случае сообщество) отправить **личное сообщение** (ЛС) — это другая семантика, чем возможность отправки сообщений от имени сообщества. Для корректной проверки нужен метод `messages.isMessagesFromGroupAllowed`, который возвращает `is_allowed: 0/1` — разрешил ли пользователь получать сообщения от конкретного сообщества.

**Решение:**  
В функцию `_refresh_profile_from_vk()` добавлен дополнительный вызов `messages.isMessagesFromGroupAllowed` после `users.get`. Результат (`is_allowed`) перезаписывает `can_write_private_message` перед сохранением в БД. Если вызов `isMessagesFromGroupAllowed` падает — остаётся значение из `users.get` (fail-safe).

**Файл(ы):** `backend_python/services/messages/user_info_service.py`

---