# Релиз 13 — Улучшения настроек проекта

## 🆕 Новые возможности

### Счётчик важных диалогов + фильтрация по важным

**Описание:**  
На иконку-звёздочку (фильтр «Важные») в панели диалогов добавлен бейдж-счётчик — янтарный кружок с количеством диалогов, помеченных как важные. Аналогичен синему бейджу непрочитанных на иконке конверта. Также реализована фильтрация: при клике на звёздочку список диалогов теперь реально фильтруется, показывая только важные (ранее кнопка переключала стиль, но фильтрация в useMemo отсутствовала).

**Реализация:**  
1. Добавлен `importantDialogsCount` через `useMemo` — подсчёт `conversations.filter(c => c.isImportant).length`
2. На кнопку «Важные» добавлен `relative` и бейдж `<span>` с `bg-amber-500` (появляется при `importantDialogsCount > 0`, показывает «99+» для >99)
3. В `filteredConversations` useMemo добавлено условие `filterUnread === 'important'` → `result.filter(c => c.isImportant)`

**Файл(ы):**  
`features/messages/components/conversations/ConversationsSidebar.tsx`

---

### «В админы» — ENV-токен как участник вступления и назначения

**Описание:**  
Функционал «В админы» (массовое вступление в группы и назначение ролей) теперь позволяет включить ENV-токен (основной токен из .env) в список целей. Ранее ENV-токен использовался только утилитарно (проверка членства, поиск админ-токена для группы), но сам пользователь ENV-токена не вступал и не получал роль.

**Реализация:**  
1. Бэкенд: `PromoteToAdminsPayload` → новое поле `include_env_token: bool = False`. Функция `promote_to_admins()` при `include_env_token=True` добавляет ENV-пользователя в `effective_user_ids` (список целей для `groups.join` + `groups.editManager`).
2. Роутер: `management.py` пробрасывает `include_env_token` в сервис.
3. Фронтенд API: `promoteToAdmins()` принимает 4-й аргумент `includeEnvToken`, передаёт `include_env_token` в payload.
4. Хук: `usePromoteAdminsLogic` — состояние `includeEnvToken`, обновлён `canStart` (можно запустить с 0 системных страниц + ENV-токен), обновлён `totalPairs`.
5. UI: чекбокс «+ ENV токен» в футере модалки рядом с выбором роли.
6. Тесты: обновлены assertions и моки в 3 тестовых файлах (4-й аргумент `false` по умолчанию).

**Файл(ы):** `backend_python/schemas/api_payloads.py`, `backend_python/routers/management.py`, `backend_python/services/admin_tools_promote.py`, `services/api/management.api.ts`, `features/database-management/hooks/usePromoteAdminsLogic.ts`, `features/database-management/components/modals/PromoteAdminsSelection.tsx`, `features/database-management/components/modals/PromoteAdminsModal.tsx`

---

### Информация VK — VK ID, ссылка по ID, кнопки копирования

**Описание:**  
В секции «Информация VK» настроек проекта добавлены новые поля и функционал:
1. Поле **VK ID** — числовой идентификатор сообщества (`vkProjectId`) с кнопкой копирования.
2. **Ссылка по VK ID** — рабочая ссылка в формате `https://vk.com/public<id>` с кнопками копирования и перехода.
3. **Кнопки копирования** рядом с каждым полем и ссылкой (название группы, VK ID, ссылка shortname, ссылка по ID).

**Реализация:**  
Компоненты `CopyIcon`, `CheckIcon`, `CopyButton` — встроены в InfoSection.tsx. `CopyButton` использует `navigator.clipboard.writeText()` с анимацией галочки (1.5с). Ссылка по VK ID формируется как `https://vk.com/public${vkProjectId}` и показывается только при наличии `vkProjectId`.

**Файл(ы):** `features/projects/components/modals/settings-sections/InfoSection.tsx`

---

### Предпросмотр поста — полноэкранный lightbox с навигацией по всем фото

**Описание:**  
В предпросмотре поста (PostPreview) добавлен fullscreen lightbox для просмотра изображений. Изображения кликабельны, при клике открывается полноэкранный просмотр с навигацией стрелками (←/→) и счётчиком «X / Y». Решена проблема: ранее при >4 фото в посте пользователь видел только первые 4, остальные были недоступны.

**Реализация:**  
Компонент `ImageLightbox` с `createPortal` в `document.body`, `z-[9999]`, `bg-black/80`. Навигация клавишами (Escape, ArrowLeft, ArrowRight). Все `<div>` с фото заменены на `<button>` с `cursor-pointer` и `focus:ring-2 focus:ring-indigo-500`. Lightbox получает массив **всех** изображений `parsedImages` (не slice(0,4)), индекс навигации через `useState<number | null>`, стрелки и счётчик.

**Файл(ы):** `features/posts/components/modals/PostPreview.tsx`

---

### Предпросмотр поста — UI/UX рефакторинг по дизайн-системе

**Описание:**  
Комплексный аудит и рефакторинг предпросмотра поста по 17 пунктам дизайн-системы. Исправлены нарушения:
- **E8 Изображения:** Все `<img>` обёрнуты в `ImageWithSkeleton` — скелетон `animate-pulse` + fade-in `transition-opacity duration-300` (аватарка, фото поста, видео-превью, аватарка комментария).
- **C5 Анимации:** Плавное появление блоков при conditional rendering: фотогалерея `animate-fade-in-up` 50ms, вложения 100ms, комментарий 150ms, пустое состояние `animate-fade-in`.
- **E2 Кнопки:** «Опубликовать сейчас» ghost → secondary (`bg-green-50 text-green-700 border-green-200`), Save `px-6` → `px-4`.
- **E5 Счётчики:** Скобки `(N)` → тире `- N` в футере и сводке мультипроекта.
- **PreviewColumn:** Бейдж «Закреплён» — `animate-fade-in`, сводка мультипроекта — `animate-fade-in-up`, `strokeWidth` pin иконки 1→1.5.

**Файл(ы):** `features/posts/components/modals/PostPreview.tsx`, `features/posts/components/modals/PostModalFooter.tsx`, `features/posts/components/modals/post-details/PreviewColumn.tsx`

---

### Системные списки — табличный вид истории активности

**Описание:**  
В системных списках (Лайкали / Комментировали / Репостили) при раскрытии строки пользователя теперь отображается таблица с подробной информацией о постах: превью изображения, текст поста (до 120 символов), счётчики лайков / комментариев / репостов / просмотров, дата и ссылка на VK.

**Реализация:**  
1. Бэкенд: новый эндпоинт `POST /lists/system/getPostsByIds` — принимает `projectId` + массив `postIds`, запрашивает `SystemListPost` из БД.
2. Фронтенд API: функция `getPostsByIds()` с маппингом `vk_post_id` → `vk_id`.
3. Компонент `InteractionTable.tsx`: при раскрытии строки (`toggleExpand`) вызывается `getPostsByIds`, результат кэшируется в `postsCache`. Отображается мини-таблица с колонками: фото (кликабельное для lightbox), текст, ❤️, 💬, 🔗, 👁, дата, VK-ссылка. Лоадер при загрузке, fallback на простые ссылки «Post #ID» если данных нет в БД.
4. Исправлен баг: `InteractionUserResult.post_ids` возвращал `"[]"` после рефакторинга БД Phase 3. В `fetchers.py` добавлен сбор реальных `post_ids` через SQL-запрос к `post_interactions`.

**Файл(ы):** `backend_python/routers/lists.py`, `backend_python/schemas/api_payloads.py`, `backend_python/services/lists/retrieval/fetchers.py`, `backend_python/services/lists/retrieval/interaction_wrapper.py`, `services/api/lists.api.ts`, `features/lists/components/InteractionTable.tsx`

---

### Оптимизация загрузки проектов — ProjectSummary / Project split

**Описание:**  
Рефакторинг загрузки проектов: разделение на лёгкую модель `ProjectSummary` (14 полей, загружается при старте) и полную модель `Project` (19 полей, загружается по требованию при открытии настроек). Ранее при старте приложения для каждого проекта загружались все данные, включая токены VK/AI — теперь они подгружаются только при необходимости.

**Реализация:**  
1. Бэкенд: Pydantic-схема `ProjectSummary` (14 полей) + `Project(ProjectSummary)` (+5 полей: `vkGroupAccessToken`, `userAccessToken`, `aiApiKey`, `aiModel`, `aiCustomEndpoint`). `InitialDataResponse` и `ForceRefreshResponse` возвращают `List[ProjectSummary]`. Новый эндпоинт `POST /api/getProjectDetails` возвращает полный `Project`.
2. Фронтенд: TypeScript интерфейсы `ProjectSummary` / `Project extends ProjectSummary`. Контекст `ProjectsContext` — `projectDetailsCache: Map<string, Project>`, функция `getFullProject()` с кэшированием. Хук `useProjectSettingsManager` загружает полный `Project` при открытии настроек.
3. Устранена гонка ID в DLVRY (race condition при параллельных запросах).

**Файл(ы):** `backend_python/schemas/models/projects.py`, `backend_python/schemas/api_responses.py`, `backend_python/routers/projects.py`, `backend_python/services/project_service.py`, `backend_python/crud/project_crud.py`, `shared/types/index.ts`, `contexts/ProjectsContext.tsx`, `features/projects/hooks/useProjectSettingsManager.ts`, `services/api/project.api.ts`

---

### Тестовое покрытие рефакторинга ProjectSummary / Project — 46 тестов

**Описание:**  
Полное тестовое покрытие рефакторинга ProjectSummary/Project по методологии Model-Field Contract. 30 backend-интеграционных тестов (pytest + FastAPI TestClient + in-memory SQLite) + 16 frontend unit-тестов (Vitest + Testing Library).

**Реализация:**  
Backend (30 тестов, 5 классов):
- `TestGetInitialData` (10): smoke, пустой проект, поля ProjectSummary, исключение полных полей, значения, парсинг teams, фильтр архивных.
- `TestForceRefreshProjects` (4): smoke, пустой, поля, только summary.
- `TestGetProjectDetails` (7): smoke, 404, summary+extended поля, значения, парсинг токенов.
- `TestPydanticSchemaContract` (7): наследование, наборы полей, валидаторы, response_model.
- `TestPydanticTypescriptContract` (2): выравнивание полей Pydantic↔TypeScript.

Frontend (16 тестов, 3 файла):
- Type contract (7): presence, optionality, inheritance, Pydantic↔TS alignment.
- getFullProject cache (5): cache miss→API, cache hit→no API, разные проекты, full data в кэше, error handling.
- useProjectSettingsManager (4): API call on mount, isLoadingDetails lifecycle, formData population, parallel loading.

**Файл(ы):** `backend_python/tests/projects/test_project_summary_contract.py`, `tests/projects/project_summary_types.test.ts`, `tests/projects/getFullProject.test.ts`, `tests/projects/useProjectSettingsManager.test.ts`

---

### DLVRY: дефолтный период «Текущий месяц» + оптимизация запросов

**Описание:**  
Страница заказов DLVRY по умолчанию загружала данные «за всё время» (без фильтра дат), что при 150K+ заказах в базе генерировало тяжёлые COUNT(*) + агрегатные запросы, из-за чего сервер падал. Батчевая загрузка (infinite scroll, PAGE_SIZE=50) уже была реализована, но не спасала от тяжёлого первого запроса на подсчёт и статистику.

**Реализация:**  
1. Фронтенд: `OrdersTabContent.tsx` — дефолтный пресет изменён с `null` («За всё время») на `'this_month'` («Текущий месяц»). Вычисляются начальные даты: первый день текущего месяца → сегодня.
2. Хук `useDlvryOrders.ts` — добавлены параметры `initialDateFrom`/`initialDateTo` в интерфейс `UseDlvryOrdersParams`. Используются как дефолтные значения `dateFrom`/`dateTo` и при сбросе проекта/филиала.
3. Бэкенд: добавлен составной индекс `ix_dlvry_orders_project_date` (`project_id`, `order_date`) в модели `DlvryOrder` и миграции `db_migrations/dlvry_orders.py` — ускоряет основной паттерн запросов (фильтр по проекту + диапазон дат).

**Файл(ы):** `features/statistics/dlvry/OrdersTabContent.tsx`, `features/statistics/dlvry/useDlvryOrders.ts`, `backend_python/models_library/dlvry_orders.py`, `backend_python/db_migrations/dlvry_orders.py`

---

### CustomDatePicker: быстрый выбор месяца и года (drill-down навигация)

**Описание:**  
Кастомный датапикер `CustomDatePicker` поддерживал только помесячную навигацию стрелками ← →, что делало выбор далёких дат (например, март 2021 при текущем 2026) крайне неудобным — нужно было пролистать ~60 месяцев.

**Реализация:**  
Трёхуровневая drill-down навигация (аналог Material UI DatePicker):
1. **Дни** (по умолчанию) — стандартная сетка дней месяца. Клик на заголовок «Март 2026» → режим месяцев.
2. **Месяцы** — сетка 4×3 (Янв–Дек). Стрелки ← → переключают год. Клик на год в заголовке → режим годов. Выбор месяца → возврат к дням.
3. **Годы** — сетка 4×3 (десятилетие ±1). Стрелки ← → переключают десятилетие. Выбор года → возврат к месяцам.

Добавлено: `type ViewMode = 'days' | 'months' | 'years'`, `MONTHS_SHORT`, `getDecadeStart()`, SVG-компоненты `ArrowLeft`/`ArrowRight`. При открытии календаря — всегда начинает с режима «дни». Подсветка: текущий месяц/год — `text-blue-600 font-bold`, выбранный — `bg-blue-500 text-white`, за пределами десятилетия — `text-gray-400`.

Обновлён UIUX-скилл: создан `E14 date_picker.md` с полной спецификацией, добавлен в `.agents/skills/uiux-refactor/SKILL.md`.

**Файл(ы):** `shared/components/pickers/CustomDatePicker.tsx`, `.agents/skills/uiux-refactor/references/date_picker.md`, `.agents/skills/uiux-refactor/SKILL.md`

---

### Таб «Товары» — сопутствующие товары (co-occurrence аналитика)

**Описание:**  
При клике на товар в таблице под строкой раскрывается inline мини-дашборд с карточками сопутствующих товаров — товары, которые покупают вместе с выбранным. Каждая карточка: процент совместных заказов, прогресс-бар, кол-во заказов, ср. кол-во штук.

**Реализация:**  
Бэкенд: `get_product_related()` — SQL с `aliased(DlvryOrderItem)` для self-join, находит заказы с целевым товаром через subquery, считает другие товары в этих заказах, делит на общее кол-во → процент. Pydantic: `DlvryRelatedProductItem`, `DlvryProductRelatedResponse`. Эндпоинт `GET /dlvry/products/{item_id}/related`.
Фронтенд: клик по строке вызывает API, под строкой раскрывается `<tr>` с `colSpan={10}` — сетка карточек 5 колонок. Цветовая кодировка: зелёный ≥ 50%, жёлтый ≥ 25%, синий — остальные.

**Файл(ы):** `backend_python/crud/dlvry_order_crud.py`, `backend_python/schemas/dlvry_schemas.py`, `backend_python/routers/dlvry.py`, `services/api/dlvry.api.ts`, `features/statistics/dlvry/ProductsTabContent.tsx`

---

### Таб «Товары» — колонка «В % заказов»

**Описание:**  
Новая колонка в таблице товаров: показывает в каком проценте заказов за период встречается данный товар. Расчёт: `orders_count / total_orders * 100`. Прогресс-бар с цветовой кодировкой: зелёный ≥ 40%, жёлтый ≥ 15%, серый — остальные.

**Реализация:**  
Чисто фронтенд-расчёт на основе уже имеющихся `orders_count` и `summary.total_orders`. Добавлена колонка в thead/tbody с `ordersShare` переменной. Сортировка привязана к `orders_count`.

**Файл(ы):** `features/statistics/dlvry/ProductsTabContent.tsx`

---

### Таб «Товары» — идентификация товаров без названия

**Описание:**  
Товары без названия (удалённые из каталога DLVRY) показывались как курсивное «Без названия» без возможности идентификации. Теперь вместо этого отображаются: артикул (`code`), вариант SKU (`sku_title`), средняя цена и пометка «Нет в каталоге».

**Реализация:**  
Бэкенд: в SQL-запрос `get_products_analytics()` добавлены `MAX(code)` и `MAX(sku_title)` в SELECT. Поля добавлены в Pydantic-схему и TS-интерфейс.
Фронтенд: ячейка названия показывает ⚠ + артикул/ID + SKU + подпись «Нет в каталоге · XXX ₽».

**Файл(ы):** `backend_python/crud/dlvry_order_crud.py`, `backend_python/schemas/dlvry_schemas.py`, `services/api/dlvry.api.ts`, `features/statistics/dlvry/ProductsTabContent.tsx`

---

### Модуль «Команда / HR» — API-слой + тесты безопасности

**Описание:**  
Новый модуль «Личный кабинет / Команда» — полный набор бэкенд-эндпоинтов (~64 маршрута) для управления HR-структурой агентства: сотрудники, отделы, должности, компетенции, регламенты, обучения, тесты, типы контактов, типы секций, категории. Мой профиль доступен для всех авторизованных, остальное — admin only. В `PATCH /my-profile` HR-поля (ИНН, паспорт, СНИЛС, статус, должность, отдел) автоматически исключаются из апдейта.

**Реализация:**  
1. Роутер: `backend_python/routers/team.py` — 64 эндпоинта (CRUD для 12 сущностей + связи position↔competencies/regulations/trainings/tests, employee↔contacts/competencies/trainings/test-results).
2. Тесты безопасности: `backend_python/tests/team/test_team_security.py` — 3 класса: `TestRouteRegistration` (маршруты ≠ 404), `TestAuthMiddleware` (без токена → 401), `TestRoleRestrictions` (user → 403, admin → pass, expired → 401, my-profile → user OK).
3. Схемы Pydantic и CRUD-слой пока не созданы — зависимость для полной реализации.
4. Фронтенд-часть отсутствует.

**Файл(ы):** `backend_python/routers/team.py`, `backend_python/tests/team/test_team_security.py`

**Статус:** 🔴 В работе

⚠️ **ПРОТЕСТИРОВАТЬ ПОСЛЕ РАЗВЁРТЫВАНИЯ И ОБНОВЛЕНИЯ:** проверить что роутер подключён в `main.py`, все 64 маршрута доступны (≠ 404), auth-middleware работает корректно (401/403), my-profile отдаёт профиль текущего пользователя.

---

### Хронология действий менеджера в диалогах сообщений

**Описание:**  
Полноценная система логирования и отображения действий менеджеров в хронологии чата: вход/выход из диалога, пометка важным/снятие, пометка непрочитанным, прикрепление/снятие меток, пересылка сообщений в групповой чат. Действия отображаются в ленте сообщений мелким шрифтом (как системные записи) в хронологическом порядке вместе с обычными сообщениями.

**Реализация:**  
1. Модель `ChatAction` (`backend_python/models_library/chat_actions.py`) — id, project_id, vk_user_id, manager_id, manager_name, action_type, action_metadata (JSON), created_at. Индекс по (project_id, vk_user_id).
2. Миграция `backend_python/db_migrations/chat_actions.py` — создание таблицы chat_actions.
3. CRUD (`backend_python/crud/chat_action_crud.py`) — `log_chat_action()`, `get_chat_actions()`.
4. Эндпоинты (`backend_python/routers/messages.py`):
   - GET `/chat-actions` — получение действий по диалогу.
   - Хелпер `_log_and_broadcast_chat_action()` — запись + SSE-публикация.
   - Модифицированы: dialog-focus (chat_enter/chat_leave), mark-unread, toggle-important.
5. Логирование пересылки в групповой чат: в `send_message_endpoint` при `body.forward` + `body.user_id >= 2000000000` логируется `forward_to_chat` с metadata `{target_chat_id, messages_count}`.
6. Логирование меток (`backend_python/routers/dialog_labels.py`) — `_broadcast_label_action()` при assign/unassign.
7. Фронтенд — типы (`features/messages/types.ts`), API-сервис (`services/api/messages.chat-actions.api.ts`), компонент `ChatActionEntry.tsx` с иконками и описаниями для всех типов действий, merge в таймлайн (`ChatMessageList.tsx`), загрузка в `useMessageHistory.ts`.
8. Мгновенное отображение через SSE: `useMessagesSSE.ts` обрабатывает событие `chat_action`, `useMessagesPageLogic.ts` фильтрует по `vk_user_id` активного диалога.

**Файл(ы):** `backend_python/models_library/chat_actions.py`, `backend_python/db_migrations/chat_actions.py`, `backend_python/crud/chat_action_crud.py`, `backend_python/routers/messages.py`, `backend_python/routers/dialog_labels.py`, `backend_python/migrations.py`, `features/messages/types.ts`, `services/api/messages.chat-actions.api.ts`, `features/messages/components/chat/ChatActionEntry.tsx`, `features/messages/components/chat/ChatMessageList.tsx`, `features/messages/components/chat/ChatView.tsx`, `features/messages/components/MessagesPage.tsx`, `features/messages/hooks/chat/useMessageHistory.ts`, `features/messages/hooks/chat/useMessagesSSE.ts`, `features/messages/hooks/chat/messageHistoryTypes.ts`, `features/messages/hooks/useMessagesPageLogic.ts`

**Статус:** 🟢 Готово

⚠️ **ПРОТЕСТИРОВАТЬ ПОСЛЕ РАЗВЁРТЫВАНИЯ И ОБНОВЛЕНИЯ:** открыть диалог, выполнить действия (вход/выход, пометить важным, прикрепить метку, переслать в групповой чат) — проверить что действия появляются в хронологии чата в реальном времени.

---

### Исправление: SSE chat_action не фильтровались по активному диалогу

**Описание:**  
SSE-события `chat_action` добавлялись в хронологию ЛЮБОГО открытого диалога, без проверки принадлежности к текущему `vk_user_id`. Если менеджер выполнял действие в одном диалоге, запись появлялась и в другом открытом диалоге.

**Реализация:**  
1. Изменён тип колбэка `onChatAction` в `useMessagesSSE.ts` с `ChatActionData` на `SSEChatActionData` (содержит `vk_user_id`).
2. В `useMessagesPageLogic.ts` добавлена обёртка `handleChatAction` — сравнивает `data.vk_user_id` с `vkUserIdRef.current` перед вызовом `addChatAction`.

**Файл(ы):** `features/messages/hooks/chat/useMessagesSSE.ts`, `features/messages/hooks/useMessagesPageLogic.ts`

**Статус:** 🟢 Готово

---

### Исправление: краш бэкенда из-за зарезервированного атрибута metadata (SQLAlchemy)

**Описание:**  
Модель ChatAction использовала имя столбца `metadata`, зарезервированное SQLAlchemy Declarative API. При импорте модели бэкенд падал при старте.

**Реализация:**  
Столбец переименован с `metadata` → `action_metadata` в модели и CRUD-слое.

**Файл(ы):** `backend_python/models_library/chat_actions.py`, `backend_python/crud/chat_action_crud.py`

**Статус:** 🟢 Готово

---

### Исправление: pre-existing TS-ошибки компиляции в модуле сообщений

**Описание:**  
Накопленные ошибки TypeScript: отсутствие полей `deleted_from_vk_count` и `profiles` в `MessageHistoryResponse`, несоответствие сигнатуры `sendMessage` (4 → 8 параметров), несовместимость inline SSE-типа сообщения с `VkMessageItem`.

**Реализация:**  
1. `MessageHistoryResponse` — добавлены `deleted_from_vk_count?: number`, `profiles?: Array<{id, first_name?, last_name?}>`.
2. `sendMessage` — расширена сигнатура (добавлены replyTo, forwardMessages, optimisticReply, optimisticForwarded).
3. `SSENewMessageData.message` — заменён inline-тип на `VkMessageItem`.

**Файл(ы):** `services/api/messages.types.ts`, `features/messages/hooks/chat/messageHistoryTypes.ts`, `features/messages/types.ts`

**Статус:** 🟢 Готово

---

### Подпись менеджера при пересылке в групповой чат

**Описание:**  
При пересылке сообщений из диалога с клиентом в групповой чат сообщества к тексту сообщения автоматически добавляется подпись «Менеджер: Фамилия Имя» — ФИО менеджера, который выполнил пересылку. Подпись добавляется только при пересылке в групповой чат (forward + peer_id >= 2000000000), обычные ответы клиентам не затрагиваются.

**Реализация:**  
1. В `send_service.py` перед формированием `send_params` добавлена проверка: если есть `forward` + `user_id >= CHAT_PEER_ID_START` + `sender_name` → к `message_text` дописывается `\n\nМенеджер: {sender_name}`.
2. Если комментарий к пересылке присутствует — подпись через двойной перенос строки. Если комментария нет — только подпись.
3. Имя менеджера берётся из `sender_name`, который передаётся фронтендом из auth-контекста (`user.name` из управления пользователями).

**Файл(ы):** `backend_python/services/messages/send_service.py`

**Статус:** 🟢 Готово

---

### Кнопка «Открыть диалог в системе» в групповом чате

**Описание:**  
В групповом чате сообщества на пересланных сообщениях, рядом с VK inline-кнопкой «Диалог с клиентом», появляется наша кнопка «Открыть диалог в системе». При нажатии — мгновенная навигация в диалог с тем пользователем, от которого были пересланы сообщения, внутри нашей системы.

**Реализация:**  
1. `ChatMessage.tsx` — добавлена функция `extractDialogUserId()`, которая парсит ссылку `vk.com/gim{groupId}?sel={userId}` из VK inline-кнопки для извлечения user_id клиента.
2. `ChatMessage.tsx` — новый проп `onNavigateToDialog`, кнопка с иконкой чата рендерится под VK keyboard если `extractDialogUserId` вернул user_id.
3. Проп проброшен через `ChatMessageList.tsx` → `ChatView.tsx` → `MessagesPage.tsx` (где передаётся существующий `handleNavigateToChat`).

**Файл(ы):** `features/messages/components/chat/ChatMessage.tsx`, `features/messages/components/chat/ChatMessageList.tsx`, `features/messages/components/chat/ChatView.tsx`, `features/messages/components/MessagesPage.tsx`

**Статус:** 🟢 Готово

---

## ✅ Решённые задачи

### Превью картинок в расписании — сетка 2×2 вместо строки из 5

**Проблема:**  
В карточках постов на странице расписания картинки отображались в одну строку (до 5 маленьких квадратиков 40×40px), что визуально выглядело мелко и плохо различимо.

**Причина:**  
Компонент `ImageGrid` использовал `flex` layout с `MAX_VISIBLE = 5` и фиксированным размером `w-10 h-10` (40×40px), что давало ряд мелких превьюшек.

**Решение:**  
Перешли на `grid grid-cols-2` (сетка 2×2) с `MAX_VISIBLE = 3` и `aspect-square` для адаптивного размера. Теперь показываем 3 картинки, а в 4-й ячейке — счётчик `+X` (сколько ещё вложений).

**Файл(ы):** `features/posts/components/postcard/ImageGrid.tsx`

---

### Визуальная группировка блока токенов в настройках проекта

**Описание:**  
Блок «Основной токен сообщества» + «Дополнительные токены сообщества» в настройках проекта отображался без визуального обрамления — в отличие от соседних секций Callback (индиго-фиолетовый градиент) и DLVRY (оранжево-янтарный градиент), которые были оформлены в карточки.

**Решение:**  
Обернули `TokensBlock` в карточку с голубым градиентом (`bg-gradient-to-r from-blue-50 to-sky-50`, `border border-blue-200`, `rounded-lg`, `p-4 space-y-4`). Теперь все три секции интеграций визуально единообразны.

**Файл(ы):** `features/projects/components/modals/settings-sections/TokensBlock.tsx`

---

### DLVRY-филиалы — миграция не запускалась на существующей БД

**Проблема:**  
После внедрения мульти-филиальной DLVRY (1 проект → N филиалов) существующие проекты с полем `dlvry_affiliate_id` не мигрировались в новую таблицу `dlvry_project_affiliates`. Фронтенд показывал «Нет привязанных филиалов», хотя старый ID был заполнен.

**Причина:**  
Функция `_migrate_existing_affiliates(engine)` вызывалась только внутри блока `if not has_table` — то есть только при первом создании таблицы. Если таблица уже существовала (например, после предыдущего запуска или на предпроде), миграция пропускалась.

**Решение:**  
Вынесли вызов `_migrate_existing_affiliates(engine)` за пределы блока `if not has_table`, чтобы миграция запускалась при каждом старте приложения. Функция безопасна для повторных вызовов — внутри есть проверка на дубликаты по `affiliate_id`.

**Файл(ы):** `backend_python/db_migrations/dlvry_affiliates.py`

---

### DLVRY-филиалы — тип ID number → string (UUID)

**Проблема:**  
Фронтенд-сервис DLVRY-филиалов определял `id` как `number`, а бэкенд возвращал UUID-строку. Операции обновления и удаления филиала падали с ошибкой, так как в URL подставлялся числовой тип вместо строки.

**Причина:**  
Первичный ключ `dlvry_project_affiliates.id` — UUID (`TEXT`), но TypeScript-интерфейс `DlvryAffiliate` содержал `id: number`. Также `deletingId` в компоненте `DlvryAffiliatesBlock` был `number | null`.

**Решение:**  
Исправили типы: `id: string` в `DlvryAffiliate`, `recordId: string` в `updateDlvryAffiliate()` и `deleteDlvryAffiliate()`, `deletingId: string | null` в `DlvryAffiliatesBlock.tsx`.

**Файл(ы):** `services/api/dlvryAffiliates.api.ts`, `features/projects/components/modals/settings-sections/DlvryAffiliatesBlock.tsx`

---

### Колонка «DLVRY филиалы» в таблице управления базой проектов

**Описание:**  
В таблице «Управление базой проектов» старая колонка «DLVRY ID» показывала одиночный текстовый `dlvry_affiliate_id`. После миграции на мульти-филиальную модель колонка была заменена на «DLVRY филиалы» с адаптивным отображением.

**Реализация:**  
1. Бэкенд: в `management_service.py` — SQL-запрос `SELECT project_id, affiliate_id FROM dlvry_project_affiliates ORDER BY created_at`, построение `affiliates_map`. В Pydantic-схему `Project` добавлены `dlvry_affiliates_count: Optional[int] = 0` и `dlvry_affiliate_ids: Optional[List[str]] = []`.
2. Фронтенд: колонка отображает 3 состояния:
   - 0 филиалов → прочерк «—»
   - 1 филиал → сам ID филиала (например `2579645`)
   - 2+ филиалов → оранжевый бейдж «X шт.» + кнопка-карандаш → открывает настройки интеграций
3. TypeScript: в `Project` добавлены `dlvry_affiliates_count?: number` и `dlvry_affiliate_ids?: string[]`.
4. Контракт-тесты обновлены (7 полей вместо 6, оба поля в expected sets).

**Файл(ы):** `backend_python/services/management_service.py`, `backend_python/schemas/models/projects.py`, `shared/types/index.ts`, `features/database-management/constants.ts`, `features/database-management/components/ProjectTable.tsx`, `features/database-management/hooks/useDatabaseManagementLogic.ts`, `backend_python/tests/projects/test_project_summary_contract.py`

---

### Шаблон из чата «залипал» при переключении диалога/проекта

**Проблема:**  
После вставки шаблона в текстовое поле чата и перехода в другой проект или к другому пользователю, текст шаблона оставался в поле ввода. Также сохранялись прикреплённые файлы и открытые панели (эмодзи, переменные, шаблоны). Компонент `ChatInput` не размонтировался при переключении контекста — React переиспользовал тот же экземпляр с новыми пропсами, но внутренний стейт оставался от предыдущего диалога.

**Причина:**  
В `useChatInputLogic` стейт (`text`, `attachedFiles`, `isTemplatesOpen` и т.д.) инициализировался через `useState` без сброса при смене `projectId` / `currentUserId`. В `MessagesPage` стейт `pendingTemplate` также не сбрасывался при смене `activeConversationId` / `activeProject`. В `ChatInput` ref `appliedTemplateKeyRef` не обнулялся, что могло привести к повторному применению шаблона при возврате к диалогу.

**Решение:**  
1. `useChatInputLogic` — добавлен `useEffect` на `[projectId, currentUserId]`, сбрасывающий `text`, `attachedFiles` (с освобождением blob URL), `isEmojiPickerOpen`, `isVariablesOpen`, `isTemplatesOpen`, а также кешированные переменные (`globalVariables`, `projectVariables`, `promoVariables`).
2. `MessagesPage` — добавлен `useEffect` на `[activeConversationId, activeProject?.id]`, сбрасывающий `pendingTemplate` и `saveAsTemplateText`.
3. `ChatInput` — добавлен сброс `appliedTemplateKeyRef` при смене `projectId` / `currentUserId`.

**Файл(ы):** `features/messages/hooks/chat/useChatInputLogic.ts`, `features/messages/components/MessagesPage.tsx`, `features/messages/components/chat/ChatInput.tsx`

---

### Кликабельная ссылка на сообщество в сайдбаре диалогов

**Описание:**  
Название сообщества под заголовком «Диалоги» теперь является кликабельной ссылкой. При клике открывается VK-сообщество в новой вкладке браузера.

**Реализация:**  
В `ConversationsSidebar` элемент `<p>` с `projectName` заменён на `<a>` со ссылкой из `activeProject.vkLink`. При наведении текст меняет цвет (серый → indigo). Если `vkLink` отсутствует — отображается обычный текст без ссылки (fallback).

**Файл(ы):** `features/messages/components/conversations/ConversationsSidebar.tsx`

---

### Исправлен молчаливый partial-fail при массовом обновлении проектов

**Проблема:**  
При массовом сохранении проектов (`/management/updateProjects`), если какой-то проект не находился в БД (удалён другим пользователем), сервер молча пропускал его и возвращал `{ success: true }`. Фронтенд показывал «Сохранено!», хотя часть данных не обновилась.

**Причина:**  
В `management_service.update_projects()` при `crud.update_project_settings()` возвращающем `None` выводился только `print(WARNING)`, но не выбрасывалось исключение.

**Решение:**  
Теперь сервис собирает ID ненайденных проектов и выбрасывает `HTTPException(400)` с перечислением. Фронтенд получит ошибку и покажет тост.

**Файл(ы):** `backend_python/services/management_service.py`

---

### Строгая типизация UpdateContextValuesPayload

**Описание:**  
`UpdateContextValuesPayload.values` типизирован как `List[Dict[str, Any]]` — бэкенд принимал любой JSON без валидации обязательных полей `project_id`, `field_id`, `value`. При некорректном запросе падал с `KeyError` вместо понятной 422.

**Реализация:**  
Добавлена Pydantic-модель `ContextValueItem(project_id: str, field_id: str, value: Optional[str])`. Payload переведён на `List[ContextValueItem]`. CRUD `update_values()` обновлён для работы с атрибутами объекта вместо dict-ключей.

**Файл(ы):** `backend_python/schemas/api_payloads.py`, `backend_python/crud/project_context_crud.py`, `backend_python/services/project_context_service.py`

---

### Групповые чаты (беседы) ВКонтакте — новый таб «Чаты»

**Описание:**  
В модуле «Сообщения» отсутствовал доступ к групповым чатам (беседам) сообщества. Были только личные диалоги. Теперь в сайдбаре диалогов появилась кнопка-фильтр «Чаты» (иконка `Users`), которая показывает беседы с `peer_id >= 2000000000`.

**Реализация:**  
1. Бэкенд: новый сервис `community_chats_service.py` — `get_community_chats()` (из БД) + `sync_community_chats()` (VK API `messages.getConversations` → фильтр `peer.type === 'chat'` → кэш в `community_group_chats`).
2. Модель: `CommunityGroupChat` (SQLAlchemy) — `peer_id`, `title`, `members_count`, `admin_ids`, `photo`, `last_message_date`.
3. Роутер: `/messages/community-chats/{group_id}` (GET) + `/messages/community-chats/{group_id}/sync` (POST).
4. Фронтенд: хук `useCommunityChats` — загрузка/sync, маппинг в `ConversationData[]` с `unreadCount: 0`. Кнопка «Чаты» + `filterChat` в `ConversationsSidebar.tsx`.

**Файл(ы):** `backend_python/services/messages/community_chats_service.py`, `backend_python/models.py`, `backend_python/routers/messages.py`, `features/messages/hooks/useCommunityChats.ts`, `features/messages/components/conversations/ConversationsSidebar.tsx`

---

### Имена отправителей в групповых чатах

**Описание:**  
Сообщения в групповых чатах не показывали, от кого они — все выглядели одинаково. Теперь над каждым входящим сообщением отображается имя отправителя (цветная подпись).

**Реализация:**  
1. Бэкенд: `fetch_from_vk()` для `peer_id >= CHAT_PEER_ID_START` добавляет `extended=1` в запрос VK API, получает `profiles[]`. `history_service.get_history()` возвращает `profiles` в ответе.
2. Фронтенд: `useMessageHistory` — `profilesMapRef` (Map id→name), обогащает `senderName` каждого сообщения по `fromId`. `mapVkMessage` маппит `from_id` → `fromId`. `ChatMessage` рендерит `senderName` для входящих (цвет по хешу `fromId`).

**Файл(ы):** `backend_python/services/messages/vk_client.py`, `backend_python/services/messages/history_service.py`, `features/messages/hooks/useMessageHistory.ts`, `features/messages/utils/messageHistoryMappers.ts`, `features/messages/components/chat/ChatMessage.tsx`

---

### Исправлена отправка сообщений в групповых чатах

**Проблема:**  
При попытке отправить сообщение в групповой чат (беседу) VK API возвращал ошибку — сообщение не отправлялось.

**Причина:**  
`send_service.py` для всех сообщений использовал параметр `user_id`, но VK API для групповых чатов (peer_id ≥ 2000000000) требует параметр `peer_id`.

**Решение:**  
Добавлена условная логика: если `user_id >= CHAT_PEER_ID_START (2000000000)` → передаётся `peer_id`, иначе → `user_id`. Импортирована константа `CHAT_PEER_ID_START` из `vk_client.py`.

**Файл(ы):** `backend_python/services/messages/send_service.py`

---

### Убран ложный бейдж непрочитанных на кнопке «Чаты»

**Проблема:**  
На кнопке фильтра «Чаты» (групповые чаты) отображался бейдж «1» — пользователь думал, что есть непрочитанное сообщение.

**Причина:**  
Бейдж показывал `communityChats.length` (количество чатов), а не количество непрочитанных сообщений.

**Решение:**  
Убран блок бейджа с кнопки фильтра «Чаты». Все чаты маппятся с `unreadCount: 0`.

**Файл(ы):** `features/messages/components/conversations/ConversationsSidebar.tsx`

---

### Тестовое покрытие групповых чатов — 44 теста

**Описание:**  
Написаны комплексные тесты для всех изменений по групповым чатам: бэкенд (pytest) и фронтенд (vitest).

**Реализация:**  
1. Бэкенд (13 тестов):
   - `test_send_service.py` — 3 теста: peer_id для групповых, user_id для обычных, граничное значение 2000000000.
   - `test_vk_client.py` — 3 теста: peer_id + extended=1 для групповых, без extended для обычных.
   - `test_history_service.py` — 2 теста: profiles для групповых чатов, без profiles для обычных.
   - `test_community_chats_service.py` — 4 теста: кэш, пустой кэш, фильтрация peer.type='chat', обработка ошибок VK API.
   - `test_smart_merge.py` — 1 тест: сохранение replyMessage/forwardedMessages при мерже.
2. Фронтенд (31 тест):
   - `messageHistoryMappers.test.ts` — 8 тестов: fromId, text, timestamp, replyMessage, forwardedMessages, фото, fallback.
   - `ChatMessage.test.tsx` — 4 теста: senderName для входящих, скрытие для исходящих, без senderName, fromId.
   - `ConversationsSidebar.test.tsx` — 2 теста: отсутствие бейджа, рендер кнопки фильтра.

**Файл(ы):** `backend_python/tests/messages/test_send_service.py`, `backend_python/tests/messages/test_vk_client.py`, `backend_python/tests/messages/test_history_service.py`, `backend_python/tests/messages/test_community_chats_service.py`, `tests/messages/messageHistoryMappers.test.ts`, `tests/messages/ChatMessage.test.tsx`, `tests/messages/ConversationsSidebar.test.tsx`

---

### Каскадные 500-ки при входе в приложение (DB pool exhaustion + CORS + retry storm + SSE flood)

**Проблема:**  
При входе в приложение с 154 проектами консоль браузера заливалась сотнями ошибок: `psycopg2.OperationalError: connection refused` → 500 + CORS ERR_FAILED. Фаза 1 занимала 19+ секунд, Batch-эндпоинты файлили каскадом, conversations-init не загружался.

**Причина (комплекс из 4 проблем):**
1. **DB pool exhaustion**: Фаза 2 запускала 7 типов batch-запросов × 16 чанков × 5 параллельных = ~80 одновременных HTTP-запросов к бэкенду, исчерпывая пул соединений PostgreSQL (pool_size=10, max_overflow=20).
2. **CORS на 500**: Необработанные исключения (psycopg2) генерировали 500 без CORS-заголовков → браузер показывал двойные ошибки.
3. **Retry storm**: Каждый провалившийся запрос ретряился 3 раза с экспоненциальным бэкоффом, утраивая нагрузку на уже перегруженный пул.
4. **SSE flood**: 154 события `unread_count_changed` приходили одновременно, каждое вызывало setCounts → 154 ре-рендера + reconciliation.

**Решение (4 фикса):**
1. **Generic exception handler** (main.py): Добавлен `@app.exception_handler(Exception)` — все необработанные исключения возвращают JSONResponse с CORS-заголовками.
2. **Снижение параллелизма** (useDataInitialization.ts): MAX_CONCURRENT 5→2, HEAVY_CHUNK_SIZE 10→25 — ~14 запросов вместо ~80.
3. **Отключение retry для batch** (batch.api.ts, global_variable.api.ts): `{ noRetry: true }` для всех 7 batch-эндпоинтов инициализации.
4. **Батчинг SSE** (useUnreadDialogCounts.ts): События собираются 500ms и применяются одним setCounts.

**Файл(ы):** `backend_python/main.py`, `contexts/hooks/useDataInitialization.ts`, `shared/utils/apiClient.ts`, `services/api/batch.api.ts`, `services/api/global_variable.api.ts`, `features/messages/hooks/useUnreadDialogCounts.ts`

**Статус:** 🟡 Реализовано, ожидает тестирования после деплоя

---
