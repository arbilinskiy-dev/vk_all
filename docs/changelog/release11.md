# Release 9 + 10 + 11 — Метки диалогов, статистика сообщений, Callback-система, полные данные DLVRY, группы колонок + исправление багов (05.03.2026)

## 🆕 Новые возможности

### Callback-обработка group_join / group_leave

**Описание:**  
Реализована полноценная обработка VK Callback событий `group_join` и `group_leave`. При вступлении/выходе пользователя из сообщества автоматически обновляются системные списки «Вступившие (история)» и «Вышедшие (история)», профиль пользователя создаётся/обновляется через VK API `users.get`, а также ведётся аналитический лог в таблице `user_membership_history`.

**Реализация:**  
- Новая модель `UserMembershipHistory` — append-only таблица для аналитики вступлений/выходов (project_id, vk_user_id, action, action_date, source)
- Миграция `db_migrations/membership_history.py` — создание таблицы при старте
- CRUD-модуль `crud/lists/membership_history.py` — функции `add_history_record`, `get_last_action`, `get_last_actions_bulk`, `bulk_add_history_records`, `get_user_history`
- Хелперы `handlers/members/_helpers.py` — `fetch_vk_user_profile`, `parse_vk_profile_data`, `upsert_vk_profile`, `add_to_subscribers`, `remove_from_subscribers`, `add_member_event`, `add_membership_history`, `update_list_meta_counters`
- `GroupJoinHandler` — обработчик вступления: upsert профиля → добавление в подписчики → запись в member_events + user_membership_history → обновление счётчиков
- `GroupLeaveHandler` — обработчик выхода: upsert профиля → удаление из подписчиков → запись в member_events + user_membership_history → обновление счётчиков
- Старый `MembersHandler` переименован в `MembersBlockHandler` (только user_block/user_unblock)
- Дедупликация в sync-пути: `sync_task.py` и `processor.py` проверяют `get_last_membership_actions_bulk` перед записью в user_membership_history

**Файл(ы):** `backend_python/models_library/membership_history.py`, `backend_python/db_migrations/membership_history.py`, `backend_python/crud/lists/membership_history.py`, `backend_python/services/vk_callback/handlers/members/_helpers.py`, `backend_python/services/vk_callback/handlers/members/group_join.py`, `backend_python/services/vk_callback/handlers/members/group_leave.py`, `backend_python/services/vk_callback/handlers/members/handler.py`, `backend_python/services/vk_callback/handlers/__init__.py`, `backend_python/models.py`, `backend_python/migrations.py`, `backend_python/crud/__init__.py`, `backend_python/services/lists/subscribers/sync_task.py`, `backend_python/services/lists/parallel_subscribers/processor.py`

---

### Хронология — объединённый список вступлений и выходов

**Описание:**  
Новая карточка «Хронология» в группе «Подписчики» — показывает все события вступлений и выходов в хронологическом порядке в едином списке. Каждая строка содержит бейдж типа события (🟢 Вступил / 🔴 Вышел), полные данные профиля пользователя и переиспользует существующую статистику (города, пол, возраст, онлайн, платформы).

**Реализация:**  
- **Backend:** Новый тип `history_timeline` в `model_resolver.py` — запрашивает `MemberEvent` без фильтра по `event_type` (все события). Добавлено поле `event_type: Optional[str]` в Pydantic-схему `SystemListHistoryItem` — ранее поле терялось при сериализации.
- **Frontend:**
  - `types.ts` — добавлен `'history_timeline'` в `ListType`
  - `ListsNavigation.tsx` — карточка «Хронология» (фиолетовая, иконка часов), счётчик = `join_count + leave_count`
  - `MembersTable.tsx` — колонка «Событие» с бейджами `Вступил` (зелёный) / `Вышел` (красный), функция `getEventTypeBadge()`
  - `ListStatisticsPanel.tsx` — `history_timeline` в типах → попадает в `UserStatsView` (города, пол, возраст)
  - `useSystemListsManager.ts` — `history_timeline` в `getGroupForList` (группа subscribers) и `refreshStates`
- **Без миграции БД** — счётчик вычисляется на фронте, кнопка обновления не нужна (данные приходят через callback).

**Файл(ы):** `backend_python/crud/lists/model_resolver.py`, `backend_python/schemas/models/lists.py`, `features/lists/types.ts`, `features/lists/components/sections/ListsNavigation.tsx`, `features/lists/components/MembersTable.tsx`, `features/lists/components/ListStatisticsPanel.tsx`, `features/lists/hooks/useSystemListsManager.ts`

---

### Вставка скриншотов из буфера обмена (Ctrl+V) в чат сообщений

**Описание:**  
Реализована возможность вставки изображений из буфера обмена (clipboard) напрямую в поле ввода сообщения в чате модуля «Сообщения сообщества». Пользователь делает скриншот, переходит в чат и нажимает Ctrl+V — изображение автоматически прикрепляется как вложение с превью.

**Реализация:**  
- В хуке `useChatInputLogic` добавлен обработчик `handlePaste` — перехватывает событие `paste` на textarea, проверяет `clipboardData.items` на наличие изображений (`image/*`), при наличии вызывает `e.preventDefault()` и добавляет файлы в массив `attachedFiles` с превью через `URL.createObjectURL`.
- В компоненте `ChatInput` на `<textarea>` добавлен атрибут `onPaste={actions.handlePaste}`.
- Обычная вставка текста работает без изменений — перехват срабатывает только при наличии изображений в буфере.

**Файл(ы):** `features/messages/hooks/chat/useChatInputLogic.ts`, `features/messages/components/chat/ChatInput.tsx`

---

### Интеграция с сервисом доставки DLVRY

**Описание:**  
Реализована полная двусторонняя интеграция с сервисом доставки DLVRY. Система принимает webhook-уведомления о заказах, сохраняет данные в БД и предоставляет фронтенд-дашборд для просмотра заказов, статистики и истории webhook-ов.

**Реализация:**  
- **Бэкенд (8 файлов):**
  - Модель `DlvryOrder` + `DlvryOrderItem` + `DlvryWebhookLog` (`models_library/dlvry_orders.py`)
  - Миграция `db_migrations/dlvry_migration.py` — создание таблиц при старте
  - CRUD-модуль `crud/dlvry_order_crud.py` — `save_order_from_webhook`, `get_orders`, `get_order_detail`, `get_orders_stats`, `get_webhook_logs`, `log_webhook`
  - Роутер `routers/dlvry.py` — POST `/api/dlvry/webhook` (приём webhook), GET `/api/dlvry/orders` (список заказов с пагинацией), GET `/api/dlvry/orders/stats` (статистика), GET `/api/dlvry/orders/{id}` (детали заказа), GET `/api/dlvry/webhook-logs` (логи webhook-ов)
  - Схемы `schemas/dlvry_schemas.py` — `DlvryOrderResponse`, `DlvryOrdersListResponse`, `DlvryWebhookLogResponse`, `DlvryStatsResponse`
  - Архитектурное решение: `affiliate_id` хранится per-project в `project_settings`, а не глобально
- **Фронтенд (8 файлов):**
  - `features/schedule/components/statistics/DlvryOrdersPage.tsx` — страница дашборда заказов
  - `features/schedule/components/statistics/DlvryOrderDetailModal.tsx` — модалка деталей заказа
  - `features/schedule/hooks/useDlvryOrders.ts` — хук данных (загрузка, пагинация, поиск)
  - `services/api/dlvry.ts` — API-сервис
  - Типы, состояние, навигация обновлены
- **Тесты фронтенда (62 теста, 5 файлов):**
  - `tests/statistics/dlvry.api.test.ts` — 15 тестов (API-слой)
  - `tests/statistics/useDlvryOrders.test.ts` — 12 тестов (хук)
  - `tests/statistics/DlvryOrdersPage.test.tsx` — 10 тестов (компонент)
  - `tests/statistics/DlvryOrderDetailModal.test.tsx` — 10 тестов (модалка)
  - `tests/statistics/useAppState-stats.test.ts` — 15 тестов (состояние)

**Файл(ы):** `backend_python/models_library/dlvry_orders.py`, `backend_python/db_migrations/dlvry_migration.py`, `backend_python/crud/dlvry_order_crud.py`, `backend_python/routers/dlvry.py`, `backend_python/schemas/dlvry_schemas.py`, `features/schedule/components/statistics/DlvryOrdersPage.tsx`, `features/schedule/components/statistics/DlvryOrderDetailModal.tsx`, `features/schedule/hooks/useDlvryOrders.ts`, `services/api/dlvry.ts`

---

### Backend-тесты Model-Field Contract для DLVRY

**Описание:**  
Создана система интеграционных тестов, проверяющих контракт между ORM-моделями, CRUD-функциями, роутерами и Pydantic-схемами. 23 теста используют in-memory SQLite с реальными ORM-объектами (не Mock), полностью покрывая цепочку router → CRUD → model → schema.

**Реализация:**  
- Файл `backend_python/tests/dlvry/test_dlvry_integration.py` — 23 теста, 5 классов:
  - `TestGetOrders` (7 тестов) — список заказов, пагинация, фильтрация, поиск
  - `TestGetOrdersStats` (4) — статистика, пустые данные
  - `TestGetOrderDetail` (5) — детали заказа, товары, 404
  - `TestWebhookLogs` (4) — логи, фильтрация, пагинация
  - `TestApiContract` (3) — проверка полей ответа vs модели
- Фикстуры: `test_db` (SQLite `:memory:` + `StaticPool`), `client` (TestClient + `dependency_overrides[get_db]`)
- Хелперы: `_insert_test_order`, `_insert_test_item`, `_insert_test_webhook_log`
- **Критический fix:** `poolclass=StaticPool` обязателен для SQLite in-memory с FastAPI TestClient (иначе `anyio.to_thread.run_sync` создаёт новые потоки → новые подключения → пустая БД)

**Файл(ы):** `backend_python/tests/dlvry/test_dlvry_integration.py`

---

### Обновление скилла тестирования — Процедура 13 «Model-Field Contract»

**Описание:**  
Добавлена новая процедура в скилл тестирования, кодифицирующая паттерн Model-Field Contract тестов. Включает полный шаблон, правила, приоритеты и reference-файл. Предотвращает класс багов, когда имена полей в router/CRUD/schema расходятся с ORM-моделью.

**Реализация:**  
- **SKILL.md** — Процедура 13 с полным описанием: сравнительная таблица (vi.mock vs MagicMock vs Model-Field), алгоритм, 5 обязательных категорий тестов, формат отчёта, сценарии запуска
- **Новые правила 14–18:** StaticPool обязателен, тесты пустых данных, 404-не-500, model-field при каждом новом роутере
- **Приоритеты обновлены:** Model-Field Contract на 2-м месте (P0)
- **Матрица покрытия:** +столбец Model-Field, +строка dlvry (✅ 23)
- **Reference-шаблон:** `references/model_field_contract_template.md` (~300 строк) — готовый шаблон для любого нового модуля

**Файл(ы):** `.agents/skills/tester/SKILL.md`, `.agents/skills/tester/references/model_field_contract_template.md`

---

### Сброс статуса непрочитанности диалога в VK при прочтении менеджером

**Описание:**  
Теперь когда менеджер открывает непрочитанный диалог в планере, система автоматически вызывает VK API `messages.markAsRead` с параметром `mark_conversation_as_read=1`, что сбрасывает статус непрочитанности диалога в самом VK. Раньше прочтение было только локальным — в интерфейсе VK диалог оставался непрочитанным.

**Реализация:**  
- В `read_service.py` добавлена функция `_mark_as_read_in_vk()` — вызывает `messages.markAsRead` через `call_vk_api_for_group` с токенами сообщества. Ошибки VK API логируются, но не блокируют основной процесс.
- В роутере `messages.py` эндпоинт `PUT /mark-read` теперь получает токены проекта через `get_project_and_tokens()` и передаёт их в сервис.
- Сигнатура `mark_dialog_read()` расширена опциональными `community_tokens` и `group_id_int` — обратная совместимость сохранена.

**Файл(ы):** `backend_python/services/messages/read_service.py`, `backend_python/routers/messages.py`

---

### Статистика продаж DLVRY через API (pull-модель)

**Описание:**  
Реализована вторая модель получения данных из DLVRY — pull-запросы к API `GET /api/v1/affiliates/{id}/statistics?type=orders`. В дополнение к webhook-ам (push), система теперь может запрашивать агрегированную дневную статистику: количество заказов, выручку, первые заказы, средний чек — за любой период. Инкрементальная синхронизация (от последней даты), автоматический запуск раз в сутки в 02:00 MSK.

**Реализация:**  
- **Модель** `DlvryDailyStats` — поля: affiliate_id, project_id, stat_date (Date), orders_count, revenue, first_orders, avg_check. Уникальный индекс (affiliate_id, stat_date).
- **Миграция** `db_migrations/dlvry_daily_stats_migration.py` — автосоздание таблицы при старте
- **CRUD** `crud/dlvry_daily_stats_crud.py` — `upsert_daily_stat`, `bulk_upsert_daily_stats` (парсинг DD.MM.YYYY), `get_daily_stats` (фильтры), `get_aggregated_stats` (суммы + avg_check), `get_last_synced_date`
- **API-клиент** `services/dlvry/dlvry_client.py` — `DlvryApiClient` с Bearer-токеном, `fetch_daily_stats(affiliate_id, date_from, date_to)`, retry-логика
- **Sync-сервис** `services/dlvry/stats_sync_service.py` — инкрементальная синхронизация (last_date - 2 дня → вчера, 90 дней при первом запуске, 365 при force_full), `sync_all_projects()` для всех проектов с `dlvry_affiliate_id`
- **Роутер** (3 новых эндпоинта в `routers/dlvry.py`):
  - `GET /api/dlvry/stats/daily` — дневная статистика из БД (фильтры date_from/date_to/project_id/affiliate_id), ответ `{days, total, aggregated}`
  - `POST /api/dlvry/stats/sync` — ручная синхронизация для проекта
  - `POST /api/dlvry/stats/sync-all` — синхронизация всех проектов
- **Планировщик** — APScheduler cron job `sync_dlvry_daily_stats` (02:00 MSK ежедневно)
- **Фронтенд:**
  - `services/api/dlvryStats.api.ts` — типы `DlvryDayStat`, `DlvryAggregated`, `DlvryDailyStatsResponse`, `DlvrySyncResult` + API-функции
  - `features/statistics/dlvry-stats/useDlvryDailyStats.ts` — хук с состоянием, загрузкой, синхронизацией, фильтрами дат

**Файл(ы):** `backend_python/models_library/dlvry_daily_stats.py`, `backend_python/db_migrations/dlvry_daily_stats_migration.py`, `backend_python/crud/dlvry_daily_stats_crud.py`, `backend_python/services/dlvry/dlvry_client.py`, `backend_python/services/dlvry/stats_sync_service.py`, `backend_python/routers/dlvry.py`, `backend_python/main.py`, `services/api/dlvryStats.api.ts`, `features/statistics/dlvry-stats/useDlvryDailyStats.ts`

---

### Объединение заказов и статистики DLVRY в единую страницу с табами

**Описание:**  
Ранее статистика продаж и заказы DLVRY были раздельными страницами с отдельной навигацией. Интерфейс объединён в одну страницу `DlvryOrdersPage` с переключателем вкладок: «Статистика продаж» (API-данные) и «Заказы» (webhook-данные). Удалена отдельная навигационная кнопка «Продажи» и view-тип `stats-dlvry-sales`.

**Реализация:**  
- `DlvryOrdersPage.tsx` перезаписан: добавлен TabSwitcher с двумя вкладками, `SalesTabContent` (useDlvryDailyStats) и `OrdersTabContent` (useDlvryOrders)
- Удалена отдельная навигация: `stats-dlvry-sales` из `AppView`, кнопка из `PrimarySidebar.tsx`, роутинг из `AppContent.tsx`
- Удалены/деактивированы: `DlvrySalesPage.tsx` (больше не используется)

**Файл(ы):** `features/statistics/dlvry/DlvryOrdersPage.tsx`, `App.tsx`, `features/navigation/components/sidebars/PrimarySidebar.tsx`, `features/navigation/AppContent.tsx`

---

### Интеграционные тесты DLVRY Daily Stats (39 тестов)

**Описание:**  
Создана полная система интеграционных тестов для нового функционала статистики продаж DLVRY. 39 тестов в 7 классах — покрывают весь стек: CRUD-функции, эндпоинты API, контракт с фронтенд-типами, фильтрацию, агрегацию, резолв project_id → affiliate_id. Паттерн: in-memory SQLite + StaticPool + TestClient.

**Реализация:**  
- `TestGetDailyStats` (13 тестов) — smoke 200, пустые данные, field contract (days[].date/orders_count/revenue/first_orders/avg_check, aggregated.total_orders/total_revenue/total_first_orders/avg_check), value mapping, сортировка desc
- `TestDateFilters` (4) — date_from, date_to, диапазон, агрегаты по фильтру
- `TestProjectIdResolve` (2) — резолв project_id → affiliate_id, проект без DLVRY
- `TestSyncStats` (3) — 400 без affiliate, несуществующий проект, проект без dlvry
- `TestSyncAll` (3) — smoke 200, структура ответа, нули без проектов
- `TestCrudDailyStats` (10) — upsert create/update, bulk DD.MM.YYYY, невалидная дата, фильтры, агрегаты, last_synced_date
- `TestDailyStatsContract` (5) — ключи ответа, типы значений, маппинг DlvryDayStat/DlvryAggregated

**Файл(ы):** `backend_python/tests/dlvry/test_dlvry_daily_stats_integration.py`

---

## ✅ Решённые задачи

### Дубликаты записей в списках «Вступившие/Вышедшие (История)»

**Проблема:**  
Один и тот же пользователь появлялся несколько раз в списках «Вступившие (история)» и «Вышедшие (история)». VK ретраил callback при медленном ответе сервера, а Redis не был настроен (in-memory mode), поэтому дедупликация по event_id не работала. Функция `add_member_event()` вставляла новую строку без проверки на существующие записи.

**Причина:**  
`add_member_event()` и `add_membership_history()` в `_helpers.py` всегда делали INSERT без проверки на дубликат. В таблице `member_events` нет UNIQUE constraint на (project_id, vk_profile_id, event_type) — и не должен быть, т.к. пользователь может легитимно вступить/выйти повторно. Также `_bulk_add_events()` в sync-пути делал `bulk_insert_mappings` без проверки existing.

**Решение:**  
- `add_member_event()` — добавлена проверка: есть ли запись с тем же (project_id, vk_profile_id, event_type) за последние 10 минут. Если есть — возвращает существующую запись без вставки.
- `add_membership_history()` — аналогичная проверка по (project_id, vk_user_id, action) за 10 минут.
- `_bulk_add_events()` в `crud/lists/history.py` — перед bulk insert фильтрует пользователей, у которых уже есть такое событие за последний час.
- В `group_join.py` и `group_leave.py` — счётчик `join_delta`/`leave_delta` увеличивается только если событие реально новое (не дубликат).

**Файл(ы):** `backend_python/services/vk_callback/handlers/members/_helpers.py`, `backend_python/crud/lists/history.py`, `backend_python/services/vk_callback/handlers/members/group_join.py`, `backend_python/services/vk_callback/handlers/members/group_leave.py`

---

### «Invalid Date» в колонке «Дата события» для списков истории

**Проблема:**  
Во всех записях списков «Вступившие (история)» и «Вышедшие (история)» в колонке «Дата события» отображалось «Invalid Date» вместо реальной даты.

**Причина:**  
В `routers/lists.py` эндпоинт `getSubscribers` использовал `response_model=Union[SubscribersResponse, PostsResponse, HistoryResponse, ...]`. Pydantic V2 при `Union` пробует модели слева направо и берёт первую подходящую. `MemberEvent` имеет proxy-свойство `added_at → event_date`, поэтому `SystemListSubscribersResponse` совпадала первой. Но в схеме `SystemListSubscriber` нет поля `event_date` — оно исключалось из ответа. Фронтенд получал `undefined`, `String(undefined)` → `"undefined"`, `new Date("undefined")` → Invalid Date.

**Решение:**  
- Backend: переупорядочен Union — `HistoryResponse` и `AuthorsResponse` теперь **перед** `SubscribersResponse`, чтобы для `MemberEvent` Pydantic выбирал правильную схему с полем `event_date`.
- Frontend: добавлен fallback в `getDateField()` — `event_date || added_at`, чтобы даже при неправильной сериализации дата отображалась корректно.

**Файл(ы):** `backend_python/routers/lists.py`, `features/lists/components/MembersTable.tsx`

---

### Неверный счётчик записей в карточках «Вступившие/Вышедшие (История)»

**Проблема:**  
Карточка «Вышедшие (История)» показывала «2» записи, хотя в БД — только 1. Аналогично могло происходить с «Вступившие (История)».

**Причина:**  
`update_list_meta_counters()` использовал дельта-инкремент (`+1`), а не реальный `COUNT(*)` из `member_events`. При повторных callback-ах или гонке callback/sync счётчик рассинхронизировался с реальным количеством записей.

**Решение:**  
Заменён дельта-инкремент на реальный `COUNT(*)` из таблицы `member_events` для полей `history_join_count` и `history_leave_count`. Теперь при каждом обновлении счётчик пересчитывается из БД и всегда соответствует реальности.

**Файл(ы):** `backend_python/services/vk_callback/handlers/members/_helpers.py`

---

### CORS + 500 ошибка на эндпоинте `/api/dlvry/orders`

**Проблема:**  
При открытии страницы дашборда заказов DLVRY фронтенд получал ошибку CORS (из-за 500-го статуса ответа) на запрос `GET /api/dlvry/orders`. Дашборд не загружался.

**Причина:**  
12+ несоответствий имён полей между 4-мя слоями:
- **Router → CRUD:** вызов `get_orders(page=..., page_size=...)`, а CRUD принимает `skip, limit`
- **Router → Response:** `o.phone` как `client_phone`, `o.payment_name` как `payment_type`, `o.delivery_name` как `delivery_type`, `o.received_at` как `created_at`
- **Router (detail) → Response:** `address_apt` как `address_flat`, `order_sum` как `subtotal`, `client_bday` как `client_birthday`, `is_preorder` как `preorder`, `items_text` как `items_json`, отсутствовал расчёт `item.total = price × quantity`
- **Schema → Response:** `total_count/page/page_size` вместо `total/skip/limit`
- **Webhook log:** `ip` вместо `remote_ip`, `created_at` вместо `timestamp`

Баг не был выявлен фронтенд-тестами (используют `vi.mock()` — подменяют API полностью) и не мог быть выявлен юнит-тестами бэкенда с `MagicMock` (mock молча принимает любые атрибуты, маскируя ошибки).

**Решение:**  
- `crud/dlvry_order_crud.py` — исправлены параметры `get_orders()`: `page/page_size` → `skip/limit`, `.offset(skip).limit(limit)`
- `routers/dlvry.py` — исправлены 12+ маппингов полей в эндпоинтах `/orders`, `/orders/{id}`, `/webhook-logs`
- `schemas/dlvry_schemas.py` — исправлены `DlvryOrdersListResponse` (`total/skip/limit`), обновлены response-схемы

**Файл(ы):** `backend_python/crud/dlvry_order_crud.py`, `backend_python/routers/dlvry.py`, `backend_python/schemas/dlvry_schemas.py`

---

### Полные данные DLVRY API (30 полей)

**Описание:**  
Ранее из DLVRY API использовались только 4 из 36 полей (orders_count, revenue, avg_check, first_orders). Проведён полный анализ raw-ответа API, выявлены 30 неиспользуемых полей — все реализованы через полный стек.

**Реализация:**  
- `DlvryDailyItem` dataclass расширен 30 полями (canceled, canceled_sum, cost, discount, unique_clients, first_orders_sum, first_orders_cost, count_payment_cash/card/online, sum_cash/card/online_success/online_fail, source_vkapp/site/ios/android + суммы, delivery_count/sum, delivery_self_count/sum, repeat_order_2/3/4/5)
- `_parse_response()` извлекает все вложенные JSON-поля (first_orders.count/sum/cost, client_orders_count_2..5 и т.д.)
- SQLAlchemy модель: 40 колонок
- Миграция: ALTER TABLE ADD COLUMN для каждого нового поля
- CRUD: upsert + read по всем полям
- Sync service: `_daily_item_to_dict()` хелпер
- Router: все 30+ полей в JSON-ответе
- Frontend: `DlvryDayStat` интерфейс со всеми полями

**Файл(ы):** `backend_python/services/dlvry/dlvry_client.py`, `backend_python/models_library/dlvry_daily_stats.py`, `backend_python/db_migrations/dlvry_daily_stats.py`, `backend_python/crud/dlvry_daily_stats_crud.py`, `backend_python/services/dlvry/stats_sync_service.py`, `backend_python/routers/dlvry.py`, `services/api/dlvryStats.api.ts`

---

### Группы колонок в таблице статистики DLVRY

**Описание:**  
25 колонок в таблице не помещались на экране (CSS `w-full` сжимал правые колонки до нулевой ширины). Реализована система групп колонок с тогглами.

**Реализация:**  
- 6 групп: Основное (всегда), Финансы, Оплата, Источники, Доставка, Повторные
- Кнопки-тогглы с иконками и цветовыми акцентами
- Кнопка «Все» для показа всех групп
- Условный рендеринг `<th>`, `<td>`, футера по `activeGroups.has()`
- `min-w-max` + `whitespace-nowrap` + горизонтальный скролл
- Sticky-колонка «Дата» при скролле
- Цветовое кодирование заголовков по группам (amber, violet, blue, teal, gray)
- `useMemo` для подсчёта итогов по всем 30+ полям

**Файл(ы):** `features/statistics/dlvry/DlvryOrdersPage.tsx`

---

### Пресеты периодов для фильтрации

**Описание:**  
Вместо двух date-инпутов добавлены быстрые пресеты периодов: Всё время, Сегодня, Вчера, Эта/прошлая неделя, Этот/прошлый месяц, Этот/прошлый квартал, Этот/прошлый год, Свой период.

**Реализация:**  
- `PeriodPreset` тип с 12 вариантами
- `applyPreset()` — вычисляет `dateFrom`/`dateTo` по текущей дате
- Корректная обработка: понедельник недели (ISO, Вс=7), квартальные границы, последний день месяца
- При выборе «Свой» показываются date-инпуты
- Пресеты в виде rounded-pill кнопок

**Файл(ы):** `features/statistics/dlvry/DlvryOrdersPage.tsx`

---

### Ошибка «Превышен максимальный период (90 дней)» при полной загрузке DLVRY

**Проблема:**  
При вызове `force_full=true` (полная загрузка за год) DLVRY API возвращал HTTP 400 — у них лимит 90 дней на один запрос. Все 365 дней шли одним запросом.

**Причина:**  
`sync_dlvry_stats_for_project()` отправлял один запрос `client.get_orders_stats(dt_from, dt_to)` с диапазоном до 365 дней.

**Решение:**  
- Добавлены константы `MAX_HISTORY_DAYS = 365`, `MAX_CHUNK_DAYS = 89`
- Цикл `while chunk_start <= dt_to` разбивает период на чанки по 89 дней
- Каждый чанк — отдельный API-вызов
- Результаты `all_items` объединяются
- Хелпер `_run_async()` для вызова asyncio из sync-контекста
- Хелпер `_daily_item_to_dict()` для конвертации dataclass → dict

**Файл(ы):** `backend_python/services/dlvry/stats_sync_service.py`

---

### Начата декомпозиция DlvryOrdersPage.tsx (771 → модули)

**Описание:**  
Файл вырос до 870 строк. Выделены утилиты в отдельный модуль. Полная декомпозиция (SalesTabContent, OrdersTabContent, хаб-контейнер) запланирована следующим шагом.

**Файл(ы):** `features/statistics/dlvry/dlvryFormatUtils.ts`

---


---

# Из Release 9

# Release 9 — Технический журнал

**Период:** 04.03.2026 — ...

---

## 1. Шаблоны: анимация, блокировка промокодов, декомпозиция

*(Записи из release9Data.ts, сессия до текущего чата)*

---

## 2. Метки (labels) для диалогов — полный модуль

### 🆕 Бэкенд: модели, миграция, CRUD, роутер

**Описание:**  
С нуля разработан полный бэкенд-модуль меток для диалогов. Метки — внутренние ярлыки, привязанные к проекту, назначаемые на диалоги (many-to-many).

**Реализация:**
- **Модель `DialogLabel`** — `name`, `color`, `project_id` (CASCADE), уникальность `(project_id, name)`
- **Модель `DialogLabelAssignment`** — связь `dialog_label_id` ↔ `conversation_peer_id` + `project_id`, уникальность `(dialog_label_id, conversation_peer_id)`
- **Миграция** в `db_migrations/dialog_labels.py` — создание таблиц + индексы
- **Схемы** в `schemas/dialog_label_schemas.py` — Pydantic-схемы для CRUD + BatchAssign
- **CRUD** в `crud/dialog_label_crud.py` — CRUD меток + batch assign/unassign + подсчёт `dialog_count`
- **Роутер** `/api/dialog-labels` — 7 эндпоинтов: CRUD, assign, unassign, batch-состояние
- **Интеграция в conversations-init** (`services/messages/conversations_init_service.py`) — загрузка `dialog_labels` одним batch-запросом, фильтрация по `label:<id>`

**Файл(ы):**
- `backend_python/models_library/dialog_labels.py` (новый)
- `backend_python/db_migrations/dialog_labels.py` (новый)
- `backend_python/schemas/dialog_label_schemas.py` (новый)
- `backend_python/crud/dialog_label_crud.py` (новый)
- `backend_python/routers/dialog_labels.py` (новый)
- `backend_python/services/messages/conversations_init_service.py` (доработан)

---

### 🆕 Фронтенд: API-клиент, хук, UI-компоненты, интеграция

**Описание:**  
Полный фронтенд-модуль меток: API-слой, хук с оптимистичными обновлениями, два UI-компонента, интеграция через всю цепочку App → Sidebar → Header.

**Реализация:**
- **API-клиент** `services/api/dialog_labels.api.ts` — типы + 7 API-вызовов
- **Хук** `features/messages/hooks/useDialogLabels.ts` — CRUD, assign/unassign, `dialogLabelsMap`, оптимистичные обновления, подсчёт `dialog_count`
- **DialogLabelsBar** — горизонтальная панель чипов в сайдбаре: фильтрация по клику, inline-создание/редактирование с палитрой 5 цветов, контекстное меню (ПКМ), кнопка удаления при наведении, `ConfirmationModal`, сброс фильтра
- **DialogLabelsDropdown** — выпадающий список чекбоксов в ChatHeader для назначения/снятия меток с диалога
- **ChatHeader** — чипы назначенных меток показываются прямо в шапке (как бейдж «Можно писать»)
- **ConversationItem** — цветные точки (до 4) около имени пользователя для быстрой визуальной идентификации
- **ConversationsSidebar** — рендеринг DialogLabelsBar, проброс `dialogLabels` в ConversationItem, фильтрация `filteredConversations` по метке
- **App.tsx** — wrapper-коллбэки для синхронизации useDialogLabels и useConversations

**Файл(ы):**
- `services/api/dialog_labels.api.ts` (новый)
- `features/messages/hooks/useDialogLabels.ts` (новый)
- `features/messages/components/conversations/DialogLabelsBar.tsx` (новый)
- `features/messages/components/conversations/DialogLabelsDropdown.tsx` (новый)
- `features/messages/components/chat/ChatHeader.tsx` (доработан)
- `features/messages/components/conversations/ConversationItem.tsx` (доработан)
- `features/messages/components/conversations/ConversationsSidebar.tsx` (доработан)
- `App.tsx` (доработан)

---

### 🔧 UI-полиш меток: дизайн-аудит + 9 нарушений дизайн-системы

**Описание:**  
Комплексный UI/UX аудит модуля меток по правилам дизайн-системы проекта. Выявлено и исправлено 9 нарушений.

**Исправления:**
1. ❌ `overflow-x-auto` без `custom-scrollbar` → ✅ `flex-wrap overflow-visible` (вместо горизонтального скролла — перенос)
2. ❌ счётчик в скобках `(5)` → ✅ разделитель `— 5` (по стандарту)
3. ❌ нет `focus:ring-2` → ✅ добавлено `ring-2 ring-offset-1` для активных чипов
4. ❌ нет `animate-fade-in-up` → ✅ добавлена анимация раскрытия контекстного меню и дропдауна
5. ❌ `rounded-lg` → ✅ `rounded-md` (по стандарту)
6. ❌ `z-50` → ✅ `z-[100]` (по стандарту дропдаунов)
7. ❌ `${count} диалогов` → ✅ `plural()` для корректной плюрализации
8. ❌ пункты меню мелкие → ✅ `py-2 text-sm` (по стандарту)
9. ❌ нет индикации удаления → ✅ кнопка × при наведении

**Файл(ы):**
- `features/messages/components/conversations/DialogLabelsBar.tsx`
- `features/messages/components/conversations/DialogLabelsDropdown.tsx`

---

### 🔧 Фикс: палитра цветов закрывалась при клике

**Проблема:**  
При клике на кнопку цвета в палитре (создание/редактирование метки) инпут терял фокус, вызывался `onBlur`, и блок создания/редактирования закрывался.

**Причина:**  
`onBlur` на инпуте не проверял, куда перешёл фокус — закрывал блок при любом blur-событии.

**Решение:**  
Добавлена проверка `e.relatedTarget` — если клик по элементу внутри того же контейнера (кнопка палитры), `onBlur` не вызывает закрытие.

**Файл(ы):** `features/messages/components/conversations/DialogLabelsBar.tsx`

---

### 🔧 Увеличение размеров элементов меток

**Проблема:**  
Чипы, кнопки, инпуты, палитра цветов были слишком мелкими — сложно читать и кликать.

**Решение:**
- Чипы: `text-[11px] px-2 py-0.5` → `text-xs px-2.5 py-1`, точка `w-2` → `w-2.5`
- Кнопка «+ Метка»: `text-[11px]` → `text-xs`, иконка `h-3` → `h-3.5`
- Инпуты: `w-20 text-[11px]` → `w-24 text-xs`
- Палитра цветов: `w-3.5 h-3.5` → `w-5 h-5` (нестандартный `w-4.5` заменён на валидный)
- Кнопка удаления ×: `w-4` → `w-5`, иконка `h-2.5` → `h-3`
- ChatHeader чипы: `text-[11px]` → `text-xs`, точка `w-1.5` → `w-2`

**Файл(ы):**
- `features/messages/components/conversations/DialogLabelsBar.tsx`
- `features/messages/components/chat/ChatHeader.tsx`

---

### 🔧 Палитра цветов: 8 → 5 цветов

**Описание:**  
Уменьшено количество цветов в палитре с 8 до 5 для компактности.

**Оставлены:** indigo (#6366f1), emerald (#10b981), red (#ef4444), blue (#3b82f6), amber (#f59e0b)

**Файл(ы):** `features/messages/components/conversations/DialogLabelsBar.tsx`

---

### 🔧 Обводки для чипов меток

**Описание:**  
Добавлен тонкий контур (`border`) в тон цвета метки (25% прозрачности — `${color}40`) для лучшей визуальной обособленности чипов.

**Файл(ы):**
- `features/messages/components/conversations/DialogLabelsBar.tsx`
- `features/messages/components/chat/ChatHeader.tsx`

---

### 🔧 Унификация иконок сайдбара диалогов с сайдбаром проектов

**Проблема:**  
Иконки в шапке и фильтрах сайдбара диалогов (`h-3.5 w-3.5`, кнопки `w-6 h-6 rounded`) были меньше, чем в сайдбаре проектов (`h-4 w-4`, кнопки `p-2 rounded-full`).

**Решение:**
- Иконки: `h-3.5 w-3.5` → `h-4 w-4` (16px)
- Кнопки: `w-6 h-6 rounded` → `p-2 rounded-full`
- Затронуты: обновить, скачать, все/непрочитанные/важные/прочитать все

**Файл(ы):** `features/messages/components/conversations/ConversationsSidebar.tsx`

---

## 3. UI/UX рефакторинг области «Вложения» (Attachments) — 23 нарушения дизайн-системы

### 🔧 Дизайн-аудит и исправление области «Вложения»

**Описание:**  
Комплексный UI/UX аудит области «Вложения» (вкладка в панели информации о пользователе) по 13 правилам дизайн-системы (7 общих концепций + 6 частных эталонов). Выявлено и исправлено 23 нарушения в 8 файлах.

**Проверенные правила:**
- C1 (чеклист), C2 (цвета) ✅, C4 (запреты), C5 (анимации), C6 (склонение), C7 (изоляция) ✅
- E1 (скроллбары) ✅, E2 (кнопки) ✅, E4 (табы) ✅, E5 (счётчики), E7 (SVG-иконки), E8 (изображения)

**Исправления по категориям:**

**C5 — Анимации (8 нарушений):**
1. AttachmentsTab: смена табов без анимации → `key={activeSubTab}` + `opacity-0 animate-fade-in-up` + `animationDelay: 50ms`
2. AttachmentsTab: плашка загрузки появлялась мгновенно → `animate-expand-down`
3. VideosList: элементы без stagger → `opacity-0 animate-fade-in-row` + `animationDelay: ${idx * 25}ms`
4. LinksList: элементы без stagger → аналогично
5. FilesList: элементы без stagger → аналогично
6. EmptyCategory: заглушка без анимации → `animate-fade-in`
7. ImagePreviewModal (shared): без анимаций → `animate-fade-in` на backdrop + `animate-fade-in-up` на контенте
8. PhotosGrid: ячейки сетки без stagger → `opacity-0 animate-fade-in-row` + `animationDelay: ${idx * 30}ms`

**C6 — Склонение числительных (2 нарушения):**
9. «из N загруженных сообщений» → `plural(loadedMessagesCount, ['загруженного сообщения', 'загруженных сообщений', 'загруженных сообщений'])`
10. «Всего вложений: N» → `Всего ${plural(totalCount, ['вложение', 'вложения', 'вложений'])}`

**E5 — Счётчики (1 нарушение):**
11. «Всего вложений: N» формат с двоеточием → формат через `plural()` без двоеточия

**E7 — SVG-иконки (6 нарушений):**
12. FilesList: `strokeWidth={1.5}` → `{2}` (иконка файла)
13. FilesList: `h-4 w-4` → `h-5 w-5` (иконка скачивания)
14. VideosList: `strokeWidth={1.5}` → `{2}` (плейсхолдер видео)
15. LinksList: `strokeWidth={1.5}` → `{2}` (декоративная ссылка)
16. LinksList: `hover:text-indigo-500` → `hover:text-indigo-600` (иконка копирования)
17. EmptyCategory: `strokeWidth={1.5}` → `{2}` (иконка пустого состояния)

**E8 — Изображения (6 нарушений):**
18. ImagePreviewModal: `z-[100]` → `z-[9999]`
19. ImagePreviewModal: добавлен `cursor-zoom-out` на оверлей
20. ImagePreviewModal: добавлен обработчик `Escape` через `useEffect`
21. ImagePreviewModal: `max-w-full max-h-[85vh]` → `max-w-[90vw] max-h-[90vh]`
22. PhotoLightbox: добавлен `cursor-zoom-out` на оверлей
23. VideosList: `<img>` без skeleton + fade-in → `useState<Set>` + `animate-pulse` + `transition-opacity duration-300`
24. LinksList: `<img>` без skeleton + fade-in → аналогично

**Файл(ы):**
- `features/messages/components/attachments/AttachmentsTab.tsx`
- `features/messages/components/attachments/PhotosGrid.tsx`
- `features/messages/components/attachments/VideosList.tsx`
- `features/messages/components/attachments/LinksList.tsx`
- `features/messages/components/attachments/FilesList.tsx`
- `features/messages/components/attachments/EmptyCategory.tsx`
- `shared/components/modals/ImagePreviewModal.tsx`
- `features/messages/components/attachments/PhotoLightbox.tsx`

---



---

# Из Release 10

# Release 10 — Технический журнал

**Период:** 04.03.2026 — ...

---

## 🆕 Новые возможности

### Оптимизация синхронизации статистики сообщений из callback-логов

**Описание:**  
Полная переработка механизма синхронизации (`sync_from_callback_logs`) для работы с большими объёмами данных (20–30k записей в callback-логах). Синхронизация вынесена в фоновую задачу с отслеживанием прогресса и двухфазной индикацией на фронтенде.

**Реализация:**  
1. **Потоковое чтение** — `yield_per(1000)` + запрос только нужных колонок вместо `.all()` с полными ORM-объектами (экономия ~500MB–1GB RAM при 30k записей)
2. **Bulk pre-fetch** — предварительная загрузка существующих hourly/user записей батчами по 500 через `IN`-клаузу (2 запроса вместо N индивидуальных SELECT)
3. **Batch commit** — коммит каждые 500 записей вместо одного гигантского коммита (защита от полного rollback)
4. **Фоновая задача** — эндпоинт мгновенно возвращает `taskId`, синхронизация идёт через `BackgroundTasks` + `task_monitor` (защита от nginx 60s timeout)
5. **Защита от двойного запуска** — проверка `task_monitor.get_active_task_id("GLOBAL", "sync_from_logs")`
6. **Поддержка отмены** — `task_monitor.is_task_cancelled()` проверяется на каждой итерации
7. **Двухфазный прогресс-бар** — фаза чтения логов (loaded/total) + фаза сохранения (sub_loaded/sub_total, sub_message)
8. **Polling на фронтенде** — опрос статуса задачи каждые 1.5 секунды

**Файл(ы):**
- `backend_python/crud/message_stats/sync.py` — полная переработка: генератор с yield_per, bulk pre-fetch, batch commit
- `backend_python/routers/messages_stats.py` — конвертация в фоновую задачу через task_monitor
- `backend_python/crud/message_stats_crud.py` — добавлен экспорт sync_from_callback_logs_with_progress
- `services/api/messages_stats.api.ts` — новые интерфейсы SyncFromLogsStartResponse, SyncFromLogsProgress + getSyncFromLogsStatus()
- `features/messages/components/stats/useMessageStatsLogic.ts` — polling логика + состояние syncProgress
- `features/messages/components/stats/MessageStatsPage.tsx` — двухфазный прогресс-бар (чтение + сохранение)

---

## ✅ Решённые задачи

### Фильтры направления сообщений показывают пустой список

**Проблема:**  
При переключении фильтра направления сообщений в чате («Наши сообщения» / «Пользовательские сообщения») отображался пустой список, хотя сообщения существовали в базе данных. Баг не был зафиксирован и не исправлялся в релизах 5–9.

**Причина:**  
Race condition на фронтенде: при смене фильтра хук `useMessageHistory` запускал новый `loadInitial` (только из кэша, без VK sync), но предыдущий запрос (с VK sync, без фильтра) всё ещё был в полёте. Когда устаревший ответ возвращался, он перезаписывал отфильтрованные данные пустым/нефильтрованным результатом через `setMessages()`.

Дополнительные риски на бэкенде:
- SQLAlchemy `== False` / `== True` вместо `.is_(False)` / `.is_(True)` — потенциально небезопасно для NULL-значений и разных СУБД.
- Отсутствие миграции для `is_outgoing` колонки в старых БД — если таблица создавалась до появления этого поля, колонка могла отсутствовать.

**Решение:**

1. **Frontend — race condition protection** (`useMessageHistory.ts`):
   - Добавлен `requestIdRef = useRef(0)` — счётчик идентификаторов запросов
   - При каждой смене параметров (paramsKey) или фильтров (filterKey) счётчик инкрементируется
   - В `loadInitial` и `loadAll`: перед выполнением захватывается `const myRequestId = requestIdRef.current`, после каждого `await` проверяется актуальность — если `myRequestId !== requestIdRef.current`, ответ отбрасывается с логом `[STALE]`

2. **Backend — SQLAlchemy boolean safety** (`crud/messages_crud.py`):
   - Все `CachedMessage.is_outgoing == False` → `.is_(False)` (6 мест)
   - Все `CachedMessage.is_outgoing == True` → `.is_(True)` (6 мест)
   - `CachedMessage.is_deleted_from_vk == True` → `.is_(True)` (1 место)
   - Безопаснее для NULL-значений и кроссплатформенно между SQLite и PostgreSQL

3. **Backend — диагностическое логирование** (`services/messages/history_service.py`):
   - При `has_filters=True` и `total_in_cache == 0` — WARNING-лог с полным контекстом: direction, search_text, project_id, user_id, meta.cached_count, meta.is_fully_loaded

4. **Backend — миграция** (`db_migrations/messages.py`):
   - ALTER TABLE для добавления `is_outgoing` если колонка отсутствует (старые БД)
   - Backfill NULL-значений: `UPDATE cached_messages SET is_outgoing = (from_id < 0) WHERE is_outgoing IS NULL`

**Файл(ы):**
- `features/messages/hooks/chat/useMessageHistory.ts`
- `backend_python/crud/messages_crud.py`
- `backend_python/services/messages/history_service.py`
- `backend_python/db_migrations/messages.py`

---

### Зависание страницы мониторинга сообщений при фильтре «Всё время»

**Проблема:**  
При выборе фильтра периода «Всё время» на странице мониторинга сообщений (вкладки «Входящие» / «Исходящие») страница полностью зависала и переставала отвечать. Причина — бэкенд возвращал все часовые точки за всю историю, `fillGaps()` заполнял пропуски (тысячи/десятки тысяч точек), а SVG рендерил на каждую точку отдельный `<rect>` hover-зону + `<circle>` + обработчик `onMouseMove` = десятки тысяч DOM-элементов.

**Причина:**  
4 корневых проблемы:
1. **Нет авто-гранулярности** — при `period='all'` гранулярность оставалась `'hours'`, `fillGaps` создавал точку на каждый пропущенный час (6 мес. ≈ 4320 точек)
2. **Нет downsampling** — все точки после fillGaps рендерились в SVG без ограничений
3. **Отдельная hover-зона на каждую точку** — N `<rect>` с `onMouseMove` + N `<circle>` = ~N×4 DOM-элементов
4. **`Math.min(...values)` / `Math.max(...values)` со spread** — на массивах >100K элементов может вызвать stack overflow

**Решение:**

1. **Авто-гранулярность** (`useMessageStatsChartLogic.ts`):
   - Функция `suggestGranularity(dataLength)` — если >168 часовых точек (7 дней) → автоматически `'days'`
   - `granularityOverride` (useState) позволяет пользователю вручную переключить обратно
   - При смене данных (нового периода) override сбрасывается через `useEffect`

2. **Downsampling** (`messageStatsChartUtils.ts`):
   - Новая функция `downsamplePoints(data, MAX_CHART_POINTS=200)` — группирует соседние точки, суммирует метрики
   - Константа `MAX_CHART_POINTS = 200` — баланс детализации и производительности
   - Pipeline: `fillGaps()` → `downsamplePoints()` — оба через `useMemo`

3. **Единая hover-зона с бинарным поиском** (`MessageStatsChartSVG.tsx`):
   - Вместо N `<rect>` — один `<rect>` на всю область SVG
   - Массив X-координат кэшируется в `useMemo`
   - `findNearestIndex(mouseX)` — бинарный поиск O(log N) ближайшей точки
   - `onMouseMove` конвертирует экранную координату → SVG viewBox → бинарный поиск
   - Circles рендерятся ТОЛЬКО для hovered точки + min/max метки

4. **Безопасный minMaxPoints** (`useMessageStatsChartLogic.ts`):
   - Заменён `Math.min(...values)` / `Math.max(...values)` на цикл `for` с отслеживанием min/max
   - `getCoords` обёрнут в `useCallback` для стабильной ссылки

5. **UI-индикаторы** (`MessageStatsChartHeader.tsx`):
   - Бейдж «данные агрегированы» при downsampling
   - Бейдж «авто: по дням» при автоматическом переключении гранулярности

**Результат:**
- DOM-элементов: ~17 000 → ~250
- Точки SVG (6 мес.): ~4320 → ≤200
- Hover-обработчики: N → 1
- Math.min/max: spread → безопасный цикл

**Файл(ы):**
- `features/messages/components/stats/messageStatsChartUtils.ts` — downsamplePoints, suggestGranularity, MAX_CHART_POINTS
- `features/messages/hooks/stats/useMessageStatsChartLogic.ts` — авто-гранулярность, downsampling pipeline, безопасный minMaxPoints, useCallback getCoords
- `features/messages/components/stats/MessageStatsChartSVG.tsx` — единая hover-зона, бинарный поиск, hover-only circles
- `features/messages/components/stats/MessageStatsChart.tsx` — проброс isDownsampled/autoGranularity
- `features/messages/components/stats/MessageStatsChartHeader.tsx` — UI-индикаторы агрегации

**Дизайн-система обновлена:**
- `.agents/skills/uiux-refactor/references/svg_chart_performance.md` — новый reference-файл
- `.agents/skills/uiux-refactor/references/checklist.md` — пункт 24 (SVG Performance)
- `.agents/skills/uiux-refactor/references/prohibitions.md` — запреты 23–25
- `.agents/skills/uiux-refactor/SKILL.md` — проверки C13–C15

---

### Callback message_allow/deny не создавал запись для новых пользователей

**Проблема:**  
При получении VK Callback события `message_allow` или `message_deny` от пользователя, которого ещё нет в БД, хендлер записывал warning в лог и пропускал событие. Пользователь не добавлялся ни в `vk_profiles`, ни в `project_dialogs` (рассылку проекта). Данные о подписке терялись.

**Причина:**  
Хендлер `MessageAllowDenyHandler._update_mailing_status()` искал пользователя по `vk_user_id` в `VkProfile`, и если не находил — просто логировал `"user not found in DB"` без создания записи. В отличие от `message_new`, где `_lightweight_mailing_upsert()` уже создавал VkProfile-заглушку.

**Решение:**

1. **Метод `_get_or_create_vk_profile()`** (`message_allow_deny.py`):
   - Ищет VkProfile по `vk_user_id`
   - Если нет — создаёт заглушку (только `vk_user_id`, без имени/фото)
   - SQLite PK workaround: `max(id) + 1`
   - Race condition protection: `try/flush` → `except/rollback` → `re-query`

2. **Upsert в `_update_mailing_status()`** (`message_allow_deny.py`):
   - Если `ProjectDialog` не найден — создаёт новую запись с `source='callback'`, `status='active'/'blocked'`, `can_write=True/False`
   - Если найден — обновляет `can_write` и `status`
   - SSE `mailing_user_updated` отправляется в обоих случаях

3. **`action_taken`** изменён с `"logged"` на `"upsert+logged"`

**Файл(ы):**
- `backend_python/services/vk_callback/handlers/messages/message_allow_deny.py`

---

### Ежедневная задача обогащения профилей-заглушек (VK_SERVICE_KEY)

**Описание:**  
Создан новый сервис и задача APScheduler для автоматического обогащения VkProfile-заглушек (профилей без имени / фото, созданных callback-хендлерами). Задача запускается ежедневно в 03:00 MSK.

**Реализация:**

1. **Сервис `profile_enrichment_service.py`** (новый файл):
   - `enrich_stub_profiles()` — основная функция
   - Находит все `VkProfile` с `first_name IS NULL` (заглушки)
   - Вызывает VK API `users.get` с `VK_SERVICE_KEY` (сервисный ключ приложения)
   - Батчи по 1000 user_ids, задержка 0.35с между батчами
   - Заполняет: `first_name`, `last_name`, `sex`, `photo_url`, `domain`, `bdate`, `city`, `country`, `has_mobile`, `is_closed`, `can_access_closed`, `deactivated`, `last_seen`, `platform`
   - Redis Lock (`vk_planner:profile_enrichment_lock`, TTL 1ч) для мультипроцессности
   - Возвращает dict с `total_stubs`, `enriched`, `failed`, `errors`

2. **Конфиг** (`config.py`):
   - Добавлено поле `vk_service_key: Optional[str] = None`
   - Переменная окружения: `VK_SERVICE_KEY`

3. **Регистрация в APScheduler** (`scheduler_service.py`):
   - `job_enrich_stub_profiles()` — wrapper для задачи
   - `CronTrigger(hour=0, minute=0, timezone='UTC')` = 03:00 MSK
   - ID: `enrich_stub_profiles`
   - Общее число задач: 12 → 13

4. **Тесты** (`tests/test_e2e_enrichment.py`):
   - E2E тест: создание заглушки → enrichment → проверка заполнения
   - Проверена идемпотентность: повторный запуск → 0 заглушек

**Файл(ы):**
- `backend_python/services/profile_enrichment_service.py` (новый)
- `backend_python/config.py`
- `backend_python/services/scheduler_service.py`
- `backend_python/.env`, `backend_python/vm_deploy/.env.production`
- `backend_python/tests/test_e2e_enrichment.py` (новый)

---

### Динамический VK Redirect URI в LoginPage

**Проблема:**  
В `LoginPage.tsx` был захардкожен `VK_REDIRECT_URI = 'https://3828ad0cd7bd.ngrok-free.app'` — мёртвый ngrok URL. Из-за этого VK ID SDK при авторизации пытался редиректить на несуществующий адрес.

**Причина:**  
URL был задан как константа при первоначальной настройке VK ID и не обновлялся после перехода на новые окружения (localhost, preprod, prod).

**Решение:**

1. Удалена константа `VK_REDIRECT_URI`
2. Добавлена функция `getVkRedirectUri()`:
   ```typescript
   const getVkRedirectUri = () => window.location.origin;
   ```
3. Заменены все 3 использования:
   - `VKID.Config.init()` для OneTap
   - `exchange-token` body (POST-запрос обмена кода на токен)
   - `VKID.Config.init()` для popup-авторизации

Теперь redirect URI автоматически соответствует текущему окружению: `http://localhost:5173` (dev), `https://dosmmit.ru` (prod).

**Файл(ы):**
- `features/auth/components/LoginPage.tsx`

---

### Декомпозиция reconcile.py — модульная архитектура сверки сообщений

**Описание:**  
Монолитный файл `reconcile.py` (694 строк) разбит на 4 модуля по принципу «тонкий хаб + специализированные модули». Дополнительно внедрены 3 исправления надёжности: точный подсчёт обработанных пользователей при batch-коммитах и защита фазы подготовки.

**Реализация:**

1. **Хаб `reconcile.py`** (694 → 317 строк):
   - SSE-оркестрация, ThreadPoolExecutor, генератор `reconcile_from_vk_streaming()`
   - Экспортирует только `reconcile_from_vk` и `reconcile_from_vk_streaming`
   - Импортирует `process_single_project` из `_project_worker`

2. **`_aggregation.py`** (84 строки):
   - Чистая функция `aggregate_messages()` — агрегация сообщений VK API по часовым слотам
   - Early return для пустых items, явные type annotations

3. **`_db_reconcile.py`** (246 строк):
   - DB-операции через MAX()-подход с `hourly_cache`
   - Функции: `reconcile_hourly()`, `reconcile_user()`, `_update_existing_hourly()`, `_merge_users_json()`, `_create_new_hourly()`
   - `.get()` с defaults для безопасного доступа к dict

4. **`_project_worker.py`** (185 строк):
   - Thread worker для обработки одного проекта
   - Константы: `BATCH_SIZE=25`, `API_CALL_DELAY=0.35`

5. **Robustness H1+H2 — точный подсчёт batch-статистики** (`_project_worker.py`):
   - Добавлен `batch_users_pending` — счётчик пользователей в текущем незакоммиченном батче
   - `users_processed` инкрементируется ТОЛЬКО после успешного `commit()`
   - При rollback все pending пользователи считаются как `users_errors`
   - Финальный коммит также корректно учитывает ошибки

6. **Robustness M3 — защита фазы подготовки** (`reconcile.py`):
   - Prep-фаза (загрузка проектов, формирование списка диалогов) обёрнута в try/except
   - При ошибке отправляется структурированный SSE-ответ с `"error"` вместо сломанного стрима

**Файл(ы):**
- `backend_python/crud/message_stats/reconcile.py` — хаб (317 строк)
- `backend_python/crud/message_stats/_aggregation.py` — новый (84 строки)
- `backend_python/crud/message_stats/_db_reconcile.py` — новый (246 строк)
- `backend_python/crud/message_stats/_project_worker.py` — новый (185 строк)

---

### Сверка запускалась на 34 000 диалогов вместо ~500 при фильтре «Всё время»

**Проблема:**  
При запуске сверки сообщений с фильтром «Всё время» (без указания дат) система обрабатывала ~34 388 диалогов вместо ~487 реально активных. Прогресс-бар показывал «Сверка: 0 / 34388 диалогов», процесс занимал десятки минут вместо нескольких.

**Причина:**  
Когда `date_from=None` и `date_to=None` (фильтр «Всё время»), код попадал в ветку `else`, которая запрашивала список пользователей из таблицы `MessageStatsUser`. Эта таблица содержит **кумулятивные** записи — одна строка на каждый `(project, user, direction)`, поэтому 34K строк для всех проектов. При наличии дат код использовал `MessageStatsHourly` — таблицу часовых слотов, где в JSON-полях `incoming_users` / `outgoing_users` хранятся только реально активные пользователи. Два пути давали кардинально разные множества user_id.

**Решение:**

1. Удалена ветка `else` с запросом `MessageStatsUser` — унификация на единственный путь через `MessageStatsHourly`
2. Функция `_hourly_date_filter()` при `date_from=None, date_to=None` просто не применяет фильтр по дате — возвращает все часовые записи
3. Активные пользователи извлекаются из JSON-полей `incoming_users` / `outgoing_users` hourly-записей — только реально общавшиеся user_id
4. Удалён импорт `MessageStatsUser` из `reconcile.py`

**Результат:**  
34 388 диалогов → 487 диалогов при «Всё время». Время сверки сократилось с ~40 минут до ~3 минут.

**Файл(ы):**
- `backend_python/crud/message_stats/reconcile.py` — удалена ветка else с MessageStatsUser

---

### 28+ лишних ре-рендеров StoriesTable — каскадная нестабильность ссылок

**Проблема:**  
После захода на страницу «Автоматизации → Истории» и нажатия «Обновить статистику» в dev-консоли фиксировалось 28+ ре-рендеров `StoriesTable`, при этом данные не менялись. Каждое изменение state вызывало 4× render вместо ожидаемого 2× (StrictMode). Карточки историй «мигали», а при большом количестве записей (120+) рендеры ощутимо тормозили UI.

**Причина:**  
7 корневых проблем, образующих каскад сквозь 4 хука (`useStoriesLoader`, `useStoriesUpdater`, `useStoriesDashboard`) → view-компоненты (`StoriesStatsView`, `StoriesTable`):

1. **`loadMoreStories` зависел от `[projectId, stories.length, totalStories]`** — useCallback пересоздавал функцию при каждом изменении stories, ломая React.memo всех дочерних компонентов, получающих эту функцию через props
2. **`setIsLoadingStories(false)` в `finally` после фоновой проверки свежести** — вызывал лишний setState рендер после того, как компонент уже показал данные из кэша
3. **`StoriesStatsView` не обёрнут в `React.memo`** — каждый ре-рендер родителя каскадно ре-рендерил StoriesStatsView → StoriesTable
4. **`loadDashboardStats` зависел от `[projectId]`** — useCallback пересоздавался при каждом изменении projectId, каскадно ломая стабильность `refreshDashboard` → `onSuccess` → `handleUpdateAll`
5. **`mergeStories()` всегда создавал новый массив** — `.map()` + spread `{...existing, ...item}` даже если все поля одинаковы → React видел новую ссылку → ре-рендер
6. **`mergeStories()` сравнивал ссылки на объекты** (`detailed_stats !== existing.detailed_stats`) — при десериализации из JSON ссылки всегда разные, даже при идентичных данных → `hasChanges=true` всегда
7. **Все обработчики в `useStoriesUpdater`** (`handleUpdateStats`, `handleUpdateViewers`, `handleUpdateAll`) имели нестабильные зависимости через closure-переменные projectId, setStories, onSuccess

**Решение:**

1. **useCallback([], ...) + ref-паттерн для всех основных функций:**
   - `useStoriesLoader.ts`: `loadStories`, `forceRefreshStories`, `loadMoreStories` — все useCallback([]) с `currentProjectIdRef`, `storiesLengthRef` (refs обновляются через useEffect)
   - `useStoriesUpdater.ts`: `handleUpdateStats`, `handleUpdateViewers`, `handleUpdateAll` — все useCallback([]) с `projectIdRef`, `setStoriesRef`, `onSuccessRef`
   - `useStoriesDashboard.ts`: `loadDashboardStats`, `refreshDashboard` — useCallback([]) с `currentProjectIdRef`

2. **Атомарная загрузка кэша** (`loadAllBatchesLocal`):
   - `loadStories()` загружает ВСЕ батчи из кэша в локальную переменную, затем делает ОДИН `setStories()` вместо серии useState на каждый батч
   - `setIsLoadingStories(false)` вызывается сразу после показа кэша, фоновая проверка свежести работает «молча»

3. **`mergeStories()` возвращает `prev` по ссылке при отсутствии реальных изменений:**
   - Выделена функция `buildMerged(prev, newItems)` — строит новый массив
   - После построения — `hasChanges` проверка ТОЛЬКО по примитивным полям: `stats_updated_at`, `viewers_updated_at`, `story_link`, `vk_story_id`
   - Если ни одно примитивное поле не изменилось → возвращается `prev` (та же ссылка) → React.memo не ре-рендерит

4. **React.memo обёртки:**
   - `StoriesTable` — `React.memo(StoriesTableInner)` с мемоизированными внутренними обработчиками (`handleMouseEnter`, `handleMouseLeave`, `toggleViewers`, `handleClickPreview`)
   - `StoriesStatsView` — `React.memo(StoriesStatsViewInner)` с `useCallback` для `handleBatchUpdate`

5. **Удалён мёртвый код:** `loadRemainingBatches`, `loadRemainingBatchesWithCancel` из `useStoriesLoader.ts`

**Результат:**
- 120 историй: 28+ рендеров → 6 (3 реальных + 3 StrictMode)
- 1 история: → 4 рендера (2 + 2 StrictMode)
- 0 историй: → 2 рендера (1 + 1 StrictMode)

**Файл(ы):**
- `features/automations/stories-automation/hooks/useStoriesLoader.ts` — loadAllBatchesLocal, mergeStories с примитивной проверкой, useCallback+refs, удалён dead code
- `features/automations/stories-automation/hooks/useStoriesUpdater.ts` — 3 хендлера на useCallback+refs
- `features/automations/stories-automation/hooks/useStoriesDashboard.ts` — loadDashboardStats+refreshDashboard на useCallback+refs
- `features/automations/stories-automation/components/table/StoriesTable.tsx` — React.memo + мемоизированные обработчики
- `features/automations/stories-automation/components/StoriesStatsView.tsx` — React.memo
- `backend_python/services/automations/stories/stats.py` — no_link_count/failed_count в ответе API

---

### Кнопка обновления статистики историй не работает (UNIQUE constraint + сломанная сессия)

**Проблема:**  
При нажатии кнопки обновления статистики историй (`updateStoriesAll`) бэкенд возвращал `{"updated": 0}`. В логах — ошибка `UNIQUE constraint failed: stories_automation_logs.project_id, stories_automation_logs.vk_post_id` при попытке вставить ручные истории. После этого сессия БД оставалась в сломанном состоянии (`This Session's transaction has been rolled back due to a previous exception during flush`), что ломало все последующие операции в рамках запроса.

**Причина:**  
3 корневых проблемы:
1. **`vk_post_id=0` для всех ручных историй** — `_create_manual_story_log()` создавал записи с `vk_post_id=0`, а UNIQUE constraint на `(project_id, vk_post_id)` не позволял >1 ручной истории на проект
2. **Отсутствие `db.rollback()` в except-блоках** — `_commit_updates()` и `_update_last_stories_timestamp()` ловили IntegrityError, но не откатывали транзакцию → сессия оставалась навсегда сломанной
3. **`find_or_create_log_by_story_link()`** в `dependencies.py` тоже вставлял записи с `vk_post_id=0` без обработки IntegrityError

**Решение:**

1. **Уникальный `vk_post_id` для ручных историй** (`retrieval_unified_db.py`):
   - `vk_post_id = -s_id` (отрицательный VK story ID) вместо `0`
   - Конвенция: `vk_post_id > 0` = автоматическая (ID поста на стене), `vk_post_id <= 0` = ручная

2. **`db.rollback()` во всех except-блоках** (`retrieval_unified_db.py`):
   - `_commit_updates()` — rollback в обоих except (logs_to_update и new_logs_to_add)
   - `_update_last_stories_timestamp()` — rollback при ошибке commit

3. **`find_or_create_log_by_story_link()`** (`dependencies.py`):
   - `vk_post_id = -story_id` (извлечённый из story_link через regex)
   - try/except вокруг commit с rollback + повторный поиск записи

4. **Обновление всех проверок is_automated** (5 файлов):
   - `!= 0` → `> 0` (автоматическая)
   - `== 0` → `<= 0` (ручная)

5. **Миграция данных:** 51 существующая запись с `vk_post_id=0` мигрирована на `-story_id`

**Файл(ы):**
- `backend_python/services/automations/stories/retrieval_unified_db.py` — ядро исправления
- `backend_python/routers/stories/dependencies.py` — find_or_create_log_by_story_link
- `backend_python/services/automations/stories/retrieval_unified.py` — is_automated check
- `backend_python/services/automations/stories/retrieval_unified_healing.py` — is manual check
- `backend_python/services/automations/stories/retrieval_unified_extract.py` — is manual check
- `backend_python/services/automations/stories/retrieval_dashboard.py` — filter auto/manual
- `backend_python/crud/batch_crud.py` — is_automated check

---
## ✅ UI/UX рефакторинг вкладки «Роли»

| Поле | Значение |
|------|----------|
| **Тип** | improvement |
| **Раздел** | Управление пользователями — Роли |
| **Влияние** | visual |

**Описание:**
Полный UI/UX рефакторинг компонента RolesTab.tsx по дизайн-системе проекта. Аудит выявил 7 категорий нарушений, все исправлены.

**Что сделано:**

1. **Цвета: hex → Tailwind** — `ROLE_COLORS` переведены из `string[]` hex-значений в `RoleColor[]` c `{ hex, tw, label }`. Все `style={{ backgroundColor }}` заменены на Tailwind-классы через маппинг `HEX_TO_TW` и хелпер `getTwBg()`. Убрано 6 inline-стилей.

2. **confirm() → ConfirmationModal** — нативный `confirm()` заменён на shared-компонент `ConfirmationModal` + состояния `deleteTarget` и `isDeleting`.

3. **Плюрализация** — добавлена `plural()` из `shared/utils/plural.ts`: `plural(count, ['человек', 'человека', 'человек'])`.

4. **Тосты** — добавлен `showAppToast()` при успешном создании, обновлении, удалении и назначении роли.

5. **Кнопки** — «Создать роль» с `bg-indigo-600 rounded-lg` → `bg-green-600 rounded-md` (primary action). Все `rounded-lg` → `rounded-md` на кнопках, инпутах, селектах.

6. **Анимации** — `animate-fade-in-up` на блоке ошибки, stagger-анимации на карточках ролей и строках таблицы пользователей.

7. **Палитра цветов** — радио-кнопки выбора цвета роли переведены с inline-style на Tailwind `bg-*` классы.

**Файл(ы):**
- `features/users/components/RolesTab.tsx` — основной компонент (полная перезапись)

---

## ✅ Устранение мерцания скелетона при переключении на вкладку «Роли»

| Поле | Значение |
|------|----------|
| **Тип** | improvement |
| **Раздел** | Управление пользователями — Роли |
| **Влияние** | visual |

**Описание:**
При переключении с вкладки «Аналитика» на «Роли» появлялся кратковременный скелетон-лоадер (animate-pulse), вызывавший визуальное мерцание ~100–200ms.

**Причина:**
Компонент перемонтируется при каждом переключении вкладок (`{activeTab === 'roles' && <RolesTab />}`). При монтировании `isLoading` начинался как `true`, рендерился скелетон, затем данные загружались и скелетон исчезал — менее чем за 200ms.

**Что сделано:**

1. Удалён `setIsLoading(true)` из `loadData()` — при повторных загрузках данные обновляются «на месте».

2. Полностью удалён блок скелетона (`if (isLoading) return <div animate-pulse ...>`) — компонент рендерит пустое состояние мгновенно, данные появляются при получении ответа от API.

**Диагностика:**
Проверено через Playwright MCP — переключение между вкладками «Аналитика» ↔ «Роли» теперь происходит без мерцания.

**Файл(ы):**
- `features/users/components/RolesTab.tsx` — удалён skeleton-блок и setIsLoading(true)

---

## 🆕 Новые возможности

### Метрика «Прочтения непрочитанных диалогов» в АМ Анализе

**Описание:**  
Новая метрика в дашборде АМ Анализ, которая отслеживает именно прочтение непрочитанных диалогов — когда сотрудник открывает диалог, в котором были непрочитанные сообщения. Ранее существовала только общая метрика «Входы в диалоги» (любые открытия), теперь она дополнена метрикой качественных входов — прочтений.

**Реализация:**  
1. **Бэкенд — детекция `was_unread`** (`read_service.py`): перед вызовом `mark_dialog_as_read()` сохраняется `prev_last_read = get_last_read_message_id()`, затем вычисляется `was_unread = max_msg_id > prev_last_read`. Результат возвращается в ответе сервиса.
2. **Бэкенд — условный трек** (`routers/messages.py`): эндпоинт PUT mark-read всегда трекает `message_dialog_read`, а при `was_unread=True` дополнительно трекает `message_unread_dialog_read`.
3. **Бэкенд — дашборд** (`routers/message_actions.py`): новый action_type `message_unread_dialog_read` добавлен в `ACTION_TYPE_LABELS` (label: «Прочтение непрочитанного»), `ACTION_GROUPS["dialogs"]`, KPI (`total_unread_dialogs_read`), user_rows SQL-запрос, user_stats вывод, daily_rows SQL-запрос, daily_chart вывод.
4. **Фронтенд — типы** (`am_analysis.api.ts`): добавлены `total_unread_dialogs_read` в `AmAnalysisSummary`, `unread_dialogs_read` в `AmUserStat` и `AmDailyPoint`.
5. **Фронтенд — компонент** (`AmAnalysisPage.tsx`): KPI-карточка «Прочтено» переименована в «Входы» (в диалоги), добавлена новая KPI-карточка «Прочтения» (непрочитанных, синяя тема, иконка глаза). Таблица: колонка «📖 Прочтено» → «💬 Входы» + новая «📖 Прочтения». График: новая синяя линия `unread_dialogs_read`. Сетка KPI расширена с 6 до 7 колонок.

**Тесты:**  
- Бэкенд: 55 тестов (pytest) — `test_am_track_calls.py` (3 новых: was_unread=True/False сценарии), `test_message_actions_router.py` (обновлённые проверки полей), `test_read_service.py` (3 новых: was_unread логика)
- Фронтенд: 29 тестов (vitest) — `AmAnalysisPage.test.tsx` (5 новых: KPI «Прочтения», KPI «Входы», таблица, значения, легенда графика), `am_analysis_api.test.ts` (обновлённые моки)

**Файл(ы):**
- `backend_python/services/messages/read_service.py` — детекция was_unread
- `backend_python/routers/messages.py` — условный трек message_unread_dialog_read
- `backend_python/routers/message_actions.py` — дашборд: KPI, user_stats, daily_chart
- `services/api/am_analysis.api.ts` — типы: total_unread_dialogs_read, unread_dialogs_read
- `features/messages/components/stats/AmAnalysisPage.tsx` — KPI, таблица, график
- `backend_python/tests/messages/test_am_track_calls.py` — 3 новых теста
- `backend_python/tests/messages/test_message_actions_router.py` — обновлённые проверки
- `backend_python/tests/messages/test_read_service.py` — 3 новых теста
- `tests/messages/AmAnalysisPage.test.tsx` — 5 новых тестов
- `tests/messages/am_analysis_api.test.ts` — обновлённые моки

---

## ✅ Решённые задачи

### «Прочтения» не отображались в дашборде АМ Анализ

**Проблема:**  
После добавления метрики «Прочтения непрочитанных диалогов» колонка `unread_dialogs_read` не отображалась в таблице сотрудников — значения были пустыми (0) для всех пользователей, несмотря на наличие трекинговых записей в базе.

**Причина:**  
Две операции `multi_replace_string_in_file` завершились с ошибкой «Multiple matches found» при первоначальном добавлении кода. В файле `message_actions.py` секции user_rows (секция 2) и daily_rows (секция 4) имели идентичные паттерны строк SQL-агрегации. В результате колонка `unread_dialogs_read` была добавлена в daily_rows, но **пропущена** в user_rows SQL-запросе и в словаре `user_stats`.

**Решение:**  
1. Добавлена колонка `func.count(case(...)).label("unread_dialogs_read")` в user_rows SQL-запрос (секция 2 — группировка по пользователям).
2. Добавлено поле `"unread_dialogs_read": r.unread_dialogs_read` в словарь user_stats, возвращаемый клиенту.
3. Использованы более специфичные контекстные якоря для `replace_string_in_file`, чтобы однозначно идентифицировать целевую секцию.

**Файл(ы):**
- `backend_python/routers/message_actions.py` — user_rows query + user_stats dict

---

## ✅ Решённые задачи

### 401 Unauthorized — 11 API-файлов (55 fetch-вызовов) отправляли запросы без X-Session-Token

| Поле | Значение |
|------|----------|
| **Тип** | bugfix |
| **Раздел** | Общее — API-слой фронтенда |
| **Влияние** | both |

**Проблема:**  
`POST /api/messages/send` возвращал 401 Unauthorized. При анализе выяснилось, что `services/api/messages.api.ts` использует голый `fetch()` с `headers: { 'Content-Type': 'application/json' }` — без заголовка `X-Session-Token`. Бэкенд-эндпоинт `/send` имеет `Depends(get_current_user)`, который проверяет этот заголовок.

**Причина:**  
Системная проблема: **11 из 34 файлов** в `services/api/` использовали голый `fetch()` вместо `callApi()` из `shared/utils/apiClient.ts`. Вероятно, эти файлы были написаны до появления `callApi()` или параллельно разработчиком, не знавшим о его существовании. Для FormData-загрузок (media, market, storyPublish) `callApi()` не подходил — он жёстко ставит `Content-Type: application/json`, что ломает multipart. Вместо расширения `callApi()` авторы просто использовали `fetch()` без токена.

**Решение:**  
1. Создана shared-утилита `getAuthHeaders(includeContentType: boolean = true)` в `shared/utils/apiClient.ts` — читает `sessionStorage.getItem('vk-planner-session-token')`, возвращает `{ 'X-Session-Token': token }` + опциональный `Content-Type: application/json`.
2. Все 55 вызовов `fetch()` в 11 файлах обновлены:
   - JSON-запросы: `headers: getAuthHeaders()` (с Content-Type)
   - FormData-запросы: `headers: getAuthHeaders(false)` (без Content-Type — браузер ставит boundary)
   - Голые GET: `fetch(url)` → `fetch(url, { headers: getAuthHeaders() })`
3. Верификация: 0 ошибок компиляции, PowerShell-скан ±4 строки вокруг каждого `fetch(` — 0 пропущенных.

**Масштаб исправления (11 файлов, 55 вызовов):**

| Файл | Вызовов | Паттерн |
|---|---|---|
| `messages.api.ts` | 16 | getAuthHeaders() / getAuthHeaders(false) |
| `vk.api.ts` | 10 | getAuthHeaders() |
| `messages_stats.api.ts` | 10 | getAuthHeaders() / getAuthHeaders(false) |
| `dialog_labels.api.ts` | 7 | getAuthHeaders() |
| `message_subscriptions.api.ts` | 5 | getAuthHeaders() |
| `media.api.ts` | 4 | getAuthHeaders(false) |
| `storyPublish.api.ts` | 2 | getAuthHeaders(false) |
| `market.api.ts` | 2 | getAuthHeaders(false) |
| `lists.api.ts` | 2 | getAuthHeaders() |
| `bulk_edit.api.ts` | 1 | getAuthHeaders() |
| `post.api.ts` | 1 | getAuthHeaders() |

**Файл(ы):**
- `shared/utils/apiClient.ts` — новая функция `getAuthHeaders()` (экспорт)
- `services/api/messages.api.ts` — 16 fetch-вызовов обновлены
- `services/api/vk.api.ts` — 10 fetch-вызовов обновлены
- `services/api/messages_stats.api.ts` — 10 fetch-вызовов обновлены
- `services/api/dialog_labels.api.ts` — 7 fetch-вызовов обновлены
- `services/api/message_subscriptions.api.ts` — 5 fetch-вызовов обновлены
- `services/api/media.api.ts` — 4 fetch-вызова обновлены
- `services/api/storyPublish.api.ts` — 2 fetch-вызова обновлены
- `services/api/market.api.ts` — 2 fetch-вызова обновлены
- `services/api/lists.api.ts` — 2 fetch-вызова обновлены
- `services/api/bulk_edit.api.ts` — 1 fetch-вызов обновлён
- `services/api/post.api.ts` — 1 fetch-вызов обновлён

---

## 🆕 Новые возможности

### Расширение скилла тестировщика — 5 новых процедур тестирования

| Поле | Значение |
|------|----------|
| **Тип** | improvement |
| **Раздел** | Общее — Инфраструктура тестирования |
| **Влияние** | logic |

**Описание:**  
По результатам анализа бага с auth headers (55 bare fetch) проведён аудит тестовой инфраструктуры. Выявлено 10 отсутствующих слоёв тестирования. Скилл тестировщика (`.agents/skills/tester/SKILL.md`) расширен с 6 до 11 процедур, добавлены 4 reference-шаблона.

**Что добавлено:**

1. **Процедура 7: API-lint (auth headers)** 🔴 P0 — статический скан всех `fetch()` в `services/api/*.ts`, проверка наличия `getAuthHeaders` или `callApi`. PowerShell-скрипт (5 сек) + Vitest-тест.
2. **Процедура 8: Unit-тесты API-слоя** 🔴 P0 — шаблон для unit-тестирования каждого файла в `services/api/`: мок fetch/callApi, проверка URL, метода, заголовков, тела.
3. **Процедура 9: Контрактные тесты** 🟡 P1 — проверка совпадения Pydantic-схем (бэк) с TypeScript-типами (фронт). Ловит drift: переименование полей, смена типов.
4. **Процедура 10: Тесты безопасности** 🟡 P1 — автоматический скан всех эндпоинтов: 401 без токена, IDOR, privilege escalation.
5. **Процедура 11: E2E (Playwright)** 🟢 P2 — полные сценарии в браузере (авторизация → действие → результат).

**Также обновлено:**
- Таблица инфраструктуры: актуализирована (pytest ✅, vitest ✅, ~111 тестов)
- Матрица покрытия: 18 модулей × 5 слоёв
- Приоритеты: API-lint на 1-м месте (5 сек, ловит auth-баги)
- Правила: с 6 до 10 (новые правила для auth, контрактов, API-файлов)
- Делегирование: с 4 до 8 шагов (lint, контракт-сбор, auth-скан)

**Файл(ы):**
- `.agents/skills/tester/SKILL.md` — 5 новых процедур, обновлённые таблицы
- `.agents/skills/tester/references/api_lint_template.md` — шаблон Vitest lint для auth headers
- `.agents/skills/tester/references/api_unit_test_template.md` — шаблон unit-теста API-файла
- `.agents/skills/tester/references/contract_test_template.md` — шаблон контрактного теста
- `.agents/skills/tester/references/security_test_template.md` — шаблон теста безопасности

---

## ✅ Решённые задачи

### Кнопка «Сохранить как шаблон» не работала при свёрнутой правой панели

**Проблема:**  
При нажатии кнопки «Сохранить как шаблон» (иконка дискеты под кнопкой отправки) в поле ввода сообщения текст записывался в state, но если правая панель (UserInfoPanel) была свёрнута — ничего не происходило. Вместо UserInfoPanel рендерился CompactUserInfo, который не обрабатывает saveAsTemplateText. Текст терялся.

**Причина:**  
`handleSaveAsTemplate` в MessagesPage только устанавливал `setSaveAsTemplateText(text)`, но не разворачивал правую панель. Когда `isInfoPanelExpanded === false`, рендерится `CompactUserInfo`, который не получает проп `saveAsTemplateText` — текст не доходил до `TemplatesTab` и `useTemplatesTabLogic`.

**Решение:**  
В `handleSaveAsTemplate` добавлено автоматическое разворачивание правой панели (`setIsInfoPanelExpanded(true)` + запись в localStorage) и установка `initialTab = 'templates'`. Теперь при клике: 1) панель разворачивается, 2) открывается вкладка «Шаблоны», 3) текст из поля ввода передаётся в редактор создания шаблона.

**Файл(ы):** `features/messages/components/MessagesPage.tsx`

---

### Конкурс отзывов: записи из чёрного списка блокировали новые циклы

**Проблема:**  
После автоматического подведения итогов конкурса отзывов записи пользователей из чёрного списка оставались в статусе `commented`, вместо перехода в `used`. При следующем цикле `current_processed_count` учитывал эти «застрявшие» записи, из-за чего при лимите (finish_condition = `count`/`mixed`) доступные слоты для новых участников уменьшались с каждым циклом. В итоге кнопка «Прокомментировать» переставала работать — формально лимит достигнут, хотя реальных участников меньше.

**Причина:**  
В `finalize_contest()` статус менялся только для `valid_participants` (отфильтрованных от ЧС). Записи заблокированных авторов (`all_participants` минус `valid_participants`) не обновлялись и оставались `commented`.

**Решение:**  
После выбора победителя все записи заблокированных авторов (чей `user_vk_id` в `blacklisted_ids`) тоже переводятся в `used`. Таким образом после финализации `commented` записей = 0, и новый цикл стартует с чистого листа.

**Файл(ы):** `backend_python/services/automations/reviews/finalizer.py`

---

### Конкурс отзывов: кнопка «Прокомментировать» не давала обратной связи

**Проблема:**  
При нажатии «Прокомментировать» ничего не происходило — ни toast, ни сообщения. Пользователь не мог понять: сработало ли действие, достигнут ли лимит, есть ли ошибки VK API.

**Причина:**  
Роутер `/reviews/processEntries` всегда возвращал `{"success": true}` без деталей. Фронтенд получал `success: true` и молча обновлял таблицу.

**Решение:**  
Бэкенд-роутер теперь возвращает расширенный ответ: `processed` (сколько прокомментировано), `errors` (ошибки VK), `message` (текстовое пояснение), `limit_reached` (достигнут ли лимит). Фронтенд показывает toast с результатом: количество обработанных, ошибки, информация о лимите.

**Файл(ы):** `backend_python/routers/automations.py`, `features/automations/reviews-contest/components/PostsTab.tsx`, `services/api/automations.api.ts`

---

## 🆕 Новые возможности

### Кнопка «Шаблоны» в панели ввода сообщений

**Описание:**  
Добавлена кнопка «Шаблоны» в тулбар поля ввода сообщений (рядом с «Переменные»). При нажатии открывается аккордеон-панель со списком шаблонов сообщений. Функциональность дублирует шаблоны из правой панели информации о пользователе, но доступна прямо из области ввода.

**Реализация:**  
1. **Новый компонент `ChatInputTemplatesBar`** — аккордеон-панель с поиском, карточками шаблонов, кнопками «Вставить» / «Заменить» и предпросмотром (иконка глаза — серверная подстановка переменных).
2. **Кнопка в тулбаре** — добавлена в `ChatInputToolbar` с шевроном (аналог «Переменные»), видна при наличии проекта и шаблонов.
3. **Логика в `useChatInputLogic`** — подключён хук `useMessageTemplates`, добавлены `isTemplatesOpen`, `setIsTemplatesOpen`, `previewTemplate`.
4. **Хаб-контейнер `ChatInput`** — подключён `ChatInputTemplatesBar`, реализована взаимная эксклюзивность: открытие «Шаблоны» закрывает «Переменные» и наоборот.
5. **Предпросмотр** — кнопка глаза на карточке вызывает `previewMessageTemplate(projectId, text, userId)` и показывает текст с подставленными переменными.
6. **Кнопки в одну строку** — «Предпросмотр», «Вставить», «Заменить» расположены горизонтально.
7. **Высота панелей** — обе панели (Переменные и Шаблоны) ограничены `max-h-[40vh]`.

**Файл(ы):**  
- `features/messages/components/chat/ChatInputTemplatesBar.tsx` (новый)
- `features/messages/hooks/chat/useChatInputLogic.ts`
- `features/messages/components/chat/ChatInputToolbar.tsx`
- `features/messages/components/chat/ChatInput.tsx`

---
