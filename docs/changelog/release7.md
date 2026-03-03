# Release 7 — Технический журнал

**Период:** 26.02.2026 — ...

---

## 🆕 Новые возможности

### Обновление статуса «можно ли писать» при VK Callback

**Описание:**  
При получении VK Callback событий `message_allow` / `message_deny` бэкенд теперь обновляет статус пользователя в таблице `SystemListMailing` — поля `can_access_closed`, `can_write_private_message` и `conversation_status`. После обновления БД отправляется SSE-событие `mailing_user_updated`, благодаря которому фронтенд мгновенно (без перезагрузки) обновляет badge «Можно писать» / «Нельзя писать». Также добавлен новый badge статуса в шапку чата (ChatHeader) рядом с именем пользователя и ссылкой на VK-диалог.

**Реализация:**  
- **Бэкенд (handler.py):** В обработчике `message_allow`/`message_deny` после записи в `message_subscriptions` добавлены: 1) UPDATE записи `SystemListMailing` по PK `{project_id}_{user_id}` — обновляются `can_access_closed`, `can_write_private_message`, `conversation_status` (blocked/active), 2) SELECT обновлённых данных через `get_mailing_user_by_vk_id()`, 3) SSE-событие `mailing_user_updated` с полными данными пользователя.
- **Фронтенд (ChatHeader.tsx):** Добавлен пропс `canWrite?: boolean` и компактный badge (зелёный/красный, с точкой-индикатором) между статусом онлайн и кнопками действий.
- **Пробросы:** `MessagesPage.tsx` → `ChatView.tsx` → `ChatHeader.tsx` по цепочке `state.userInfo?.can_write_private_message`.

**Файл(ы):**
- `backend_python/services/vk_callback/handlers/messages/handler.py` — обновление `SystemListMailing` + SSE push
- `features/messages/components/chat/ChatHeader.tsx` — badge «Можно писать» / «Нельзя писать»
- `features/messages/components/chat/ChatView.tsx` — пропс `canWrite`
- `features/messages/components/MessagesPage.tsx` — проброс `canWrite`

---

### Мониторинг активных сессий — «Кто в сети»

**Описание:**  
Новая вкладка «Активные сессии» на странице «Управление пользователями». Показывает всех пользователей, которые прямо сейчас авторизованы в системе, с индикатором статуса (активен / отошёл / неактивен), IP-адресом, браузером, временем входа, последней активностью и длительностью сессии. Администратор может принудительно завершить любую сессию (кикнуть пользователя). Данные автоматически обновляются каждые 30 секунд.

**Реализация:**  
- **Бэкенд CRUD:** Добавлены 2 функции в `auth_session_crud.py`:
  - `get_all_active_sessions()` — SELECT всех записей с `is_active=True`, сортировка по `last_activity DESC`
  - `terminate_session_by_id()` — деактивация сессии по ID + запись `terminated_by='force'`
- **Бэкенд роутер:** Создан `routers/active_sessions.py` с prefix `/active-sessions`:
  - `POST /api/active-sessions/get` — возвращает список сессий с вычисленными полями `session_duration_minutes` и `idle_minutes`
  - `POST /api/active-sessions/terminate` — принудительное завершение с записью в `auth_logs` (event_type `force_logout`, details=`{terminated_by_admin: ...}`)
- **Фронтенд API:** Типы `ActiveSession`, `ActiveSessionsResponse` + функции `getActiveSessions()`, `terminateSession()` в `services/api/auth.api.ts`
- **Фронтенд UI:** Компонент `ActiveSessionsTab.tsx`:
  - Таблица: статус (зелёный/жёлтый/серый кружок), пользователь, роль (бейдж), IP, браузер, вход, последняя активность, длительность
  - Автообновление каждые 30 сек (silent polling)
  - Кнопка ручного обновления
  - Кнопка «Завершить сессию» с ConfirmationModal
  - Статус-индикатор: ≤2 мин — зелёный (пульсирующий), 2–10 мин — жёлтый, >10 мин — серый
- Вкладка добавлена в `UserManagementPage.tsx`, доступна только администраторам

**Файл(ы):**
- `backend_python/crud/auth_session_crud.py` — `get_all_active_sessions()`, `terminate_session_by_id()`
- `backend_python/routers/active_sessions.py` — новый роутер
- `backend_python/main.py` — регистрация роутера
- `services/api/auth.api.ts` — типы + API функции
- `features/users/components/ActiveSessionsTab.tsx` — новый UI компонент
- `features/users/components/UserManagementPage.tsx` — добавлена вкладка

### Infinite scroll пагинация для Callback логов

**Описание:**  
Внедрена пагинация прокрутки (infinite scroll) для вкладки «Настройки → Колбэк логи». Данные загружаются порциями по 50 записей по аналогии с вкладкой «VK Логи». При прокрутке до нижнего края (порог 200px) автоматически подгружается следующая порция.

**Реализация:**  
- **Бэкенд:** Добавлен параметр `offset` в эндпоинт `GET /vk/logs?limit=50&offset=0`. Исправлен N+1 запрос — вместо цикла с `db.query(Project)` на каждый лог, теперь предзагрузка всех проектов за один запрос через `Project.vkProjectId.in_(group_ids)`.
- **API-клиент:** Функция `getCallbackLogs(limit, offset)` — передаёт offset в query string.
- **Хук `useCallbackApiLogs`:** Добавлены состояния `isLoadingMore`, `hasMore`, `scrollContainerRef`. Первоначальная загрузка — 50 записей, функция `loadMore()` подгружает следующую порцию при прокрутке. Scroll-listener навешивается через useEffect на ref контейнера.
- **UI-компонент:** `scrollContainerRef` привязан к scroll-контейнеру, добавлены индикатор загрузки (спиннер + «Загрузка...») при подгрузке и сообщение «Все записи загружены» когда данных больше нет.

**Файл(ы):**
- `backend_python/routers/vk_callback.py` — offset + fix N+1
- `services/api/vk.api.ts` — offset param
- `features/settings/hooks/useCallbackApiLogs.ts` — infinite scroll логика
- `features/settings/components/CallbackApiSettings.tsx` — scroll handler + loading footer

### UI/UX рефакторинг страницы «Управление базой проектов»

**Описание:**  
Комплексный UI/UX рефакторинг страницы массового редактирования проектов по 17-точечному чеклисту дизайн-системы. Затронуты все компоненты: DatabaseManagementPage, ProjectTable, AddProjectsModal, ProjectTableSkeleton.

**Реализация:**  
- **Toggles (ProjectTable.tsx):** Добавлены `shrink-0`, `p-0`, `border-0`, `focus:ring-4`, `shadow-sm`. Цвет архивного тогла исправлен с `bg-red-600` → `bg-indigo-600`. Бейджи изменены с `bg-blue-100/text-blue-800` → `bg-indigo-100/text-indigo-700`.
- **Pluralization:** Создан `shared/utils/plural.ts` — универсальная утилита для русских окончаний. Внедрена для текстов: «N команда/команды/команд», «N проект/проекта/проектов» (подтверждение архивации).
- **CustomSelect dropdown (ProjectTable.tsx):** Стрелка — `rotate-180` + `transition-transform duration-200` при открытии. Триггер: `px-3 py-2`, `hover:bg-gray-50`, `transition-colors`. Inline input: `rounded-md`, `focus:ring-2`.
- **DatabaseManagementPage.tsx:** Добавлен `isLoading` + `ProjectTableSkeleton`. Search input: убрана иконка лупы, добавлена кнопка очистки «×», корректный padding `pl-3 pr-8`. Pluralization в подтверждении архивации. Разделитель в dropdown колонок: `border-b border-gray-200`.
- **Dropdown «Колонки» → портал:** Перенесён с `absolute z-20` на `createPortal` + `fixed z-[100]`. Добавлен поиск (11 колонок > 7 — обязателен по чеклисту). Стрелка с `rotate-180`, scroll/resize обработка, click-outside закрытие + сброс поиска. «Ничего не найдено» при пустом результате.
- **Фильтр «Команда» → кастомный dropdown:** Нативный `<select>` заменён на кастомный dropdown через `createPortal`. Стрелка с `rotate-180`, выделение активного пункта (`bg-indigo-50 text-indigo-700 font-medium`), scroll/resize обработка, click-outside закрытие.
- **AddProjectsModal.tsx:** Табы: `pill` → `underline border-b-2`. Search input: убрана лупа, добавлена «×», padding. Кнопка «Отмена»: добавлен `text-gray-800`. Счётчик: «Добавить (N)» → «Добавить — N». Backdrop: `bg-black/50`. Аватарки групп: компонент `GroupAvatar` с skeleton + `animate-fade-in`.
- **ProjectTableSkeleton.tsx:** Добавлен `custom-scrollbar` к overflow-контейнеру.

**Файл(ы):**
- `features/database-management/components/DatabaseManagementPage.tsx`
- `features/database-management/components/ProjectTable.tsx`
- `features/database-management/components/modals/AddProjectsModal.tsx`
- `features/database-management/components/ProjectTableSkeleton.tsx`
- `shared/utils/plural.ts` — новый файл

### UI/UX рефакторинг «VK Логи» и «AI Логи»

**Описание:**  
Комплексный UI/UX рефакторинг вкладок «VK Логи» и «AI Логи» в разделе Настройки по 17-точечному чеклисту дизайн-системы. Затронуты все компоненты модуля token-logs-dashboard: FilterBar, EmptyState, MultiSelectDropdown, VkLogRow, AiLogRow, LoadMoreFooter, DashboardHeader, LogsTable + хук useTokenLogsDashboard.

**Реализация:**  
- **Поле поиска (FilterBar.tsx):** Убрана иконка лупы (`pl-9` → `px-3 pr-8`), добавлена кнопка-крестик сброса (`×`) — SVG `h-4 w-4`, `text-gray-400 hover:text-gray-600`, видна только при наличии текста. Placeholder: `"Поиск по методу, ошибке..."` / `"Поиск по модели, ошибке..."`.
- **Скелетоны загрузки (EmptyState.tsx):** Спиннер `.loader` заменён на полноценный скелетон таблицы: 10 скелетон-строк с `animate-pulse` и каскадным появлением (`animate-fade-in-up` + `animationDelay: i * 30ms`). Скелетон `thead` повторяет структуру реальной таблицы. Добавлен prop `activeTab` — VK отрисовывает 8 столбцов (с «Проект»), AI — 7 столбцов (без «Проект»).
- **Счётчик (LoadMoreFooter.tsx):** `"Все записи загружены ({count})"` → `"Все записи загружены - {count}"` — формат с тире вместо скобок по дизайн-системе.
- **MultiSelectDropdown.tsx → портал + поиск + анимации:** `absolute z-20` → `createPortal(document.body)` + `fixed z-[100]`. Добавлен `animate-fade-in-up`. Поиск (`autoFocus`, `searchQuery` сбрасывается при открытии, `"Ничего не найдено"` при пустом результате) — показывается при > 7 опциях. Стрелка: `transition-transform duration-200` + `rotate-180` при открытом. Обработка `scroll`/`resize` для динамической перепозиции. Click-outside через `mousedown` с проверкой `buttonRef` и `menuRef`.
- **Stagger-анимация строк (VkLogRow.tsx, AiLogRow.tsx):** Добавлен prop `index`. Класс `opacity-0 animate-fade-in-up` + `style={{ animationDelay: \`${index * 20}ms\` }}` — каскадное появление строк таблицы. Обновлён LogsTable.tsx — передаёт `index` в `map`.
- **Мягкое обновление (useTokenLogsDashboard.ts, DashboardHeader.tsx):** Добавлен `isRefreshing` — кнопка «Обновить» теперь не скрывает таблицу (`isLoading=true`), а обновляет данные in-place с крутящейся иконкой. `fetchLogsInitial({ soft: true })` ставит `isRefreshing` вместо `isLoading`. Иконка обновления: `animate-spin` при `isRefreshing`.

**Файл(ы):**
- `features/users/components/token-logs-dashboard/components/FilterBar.tsx`
- `features/users/components/token-logs-dashboard/components/EmptyState.tsx`
- `features/users/components/token-logs-dashboard/components/MultiSelectDropdown.tsx`
- `features/users/components/token-logs-dashboard/components/VkLogRow.tsx`
- `features/users/components/token-logs-dashboard/components/AiLogRow.tsx`
- `features/users/components/token-logs-dashboard/components/LogsTable.tsx`
- `features/users/components/token-logs-dashboard/components/LoadMoreFooter.tsx`
- `features/users/components/token-logs-dashboard/components/DashboardHeader.tsx`
- `features/users/components/token-logs-dashboard/useTokenLogsDashboard.ts`
- `features/users/components/token-logs-dashboard/TokenLogsDashboard.tsx`

---

## ✅ Решённые задачи

### Сломанная SVG-иконка копирования в колонке Payload

**Проблема:**  
Иконка копирования JSON в колонке «Payload» таблицы Callback логов отображалась криво — SVG-path был повреждён, пропущен сегмент `-2h-8a2 2 0 00-2` в атрибуте `d`.

**Причина:**  
В SVG-path применялась строка `00-2 2v8a2 2 0 002 2z` вместо корректной `00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z`. Это приводило к незамкнутому контуру и визуальному смещению иконки.

**Решение:**  
Восстановлен полный SVG-path иконки копирования (Heroicons clipboard-copy).

**Файл(ы):** `features/settings/components/CallbackApiSettings.tsx`

---

### Исправлен N+1 запрос в эндпоинте Callback логов

**Проблема:**  
При загрузке логов бэкенд выполнял `db.query(Project)` внутри цикла для каждого лога — N+1 запрос к БД.

**Причина:**  
Первоначальная реализация эндпоинта `GET /vk/logs` не предзагружала проекты, а выполняла поиск по `vkProjectId` на каждой итерации.

**Решение:**  
Сбор уникальных `group_id`, один запрос `Project.vkProjectId.in_(group_ids)`, построение dict `projects_map` для O(1) резолва имён групп.

**Файл(ы):** `backend_python/routers/vk_callback.py`

---

### UI/UX рефакторинг графика статистики сообщений

**Описание:**  
UI/UX аудит и рефакторинг компонента `MessageStatsChart` по 17-точечному чеклисту дизайн-системы. Исправлены 3 нарушения: эмоджи вместо SVG-иконки, inline-стили с hex-цветами в тултипе, отсутствие анимации появления empty state.

**Реализация:**  
- **Эмоджи → SVG (пункт 7 чеклиста):** Текстовый эмоджи `🕐` заменён на SVG-иконку часов (`h-3.5 w-3.5`, `currentColor`, Heroicons `clock`). Добавлен `inline-flex items-center gap-1` для выравнивания.
- **Inline-стили → Tailwind (пункт 9 чеклиста):** Тултип: убран объект `style: any` с `backgroundColor: '#1f2937'`, `color: 'white'`, `borderRadius: '0.5rem'`, `boxShadow`, `padding`, `fontSize`. Заменено на Tailwind-классы: `bg-gray-800 text-white rounded-lg shadow-lg py-2 px-3 text-xs`. Inline `style` оставлен только для динамического позиционирования (`top`, `left`/`right`).
- **Анимация empty state (пункт 13 чеклиста):** Пустое состояние графика (иконка + текст) появляется с анимацией `opacity-0 animate-fade-in-up` вместо мгновенной вставки.

**Файл(ы):** `features/messages/components/MessageStatsChart.tsx`

---

### UI/UX рефакторинг страницы «AI Токены»

**Описание:**  
UI/UX аудит и рефакторинг компонента `AiTokensSettings` (Настройки → AI Токены) по 17-точечному чеклисту дизайн-системы. Исправлены 4 нарушения: некорректный цвет кнопки «Проверить», спиннер вместо скелетона загрузки, отсутствие stagger-анимации строк таблицы, отсутствие анимации раскрытия панелей статистики.

**Реализация:**  
- **Цвет кнопки «Проверить» (пункт 9 чеклиста):** `border-blue-600 text-blue-600 hover:bg-blue-50` → `border-indigo-600 text-indigo-600 hover:bg-indigo-50`. Лоадер: `border-blue-600` → `border-indigo-600`. Приведён к брендовому цвету `indigo-600`.
- **Скелетон загрузки (пункт 14 чеклиста):** Спиннер `.loader` заменён на полноценный скелетон таблицы: `<thead>` с реальными заголовками + 5 скелетон-строк с `animate-pulse` и каскадным появлением (`animate-fade-in-up` + `animationDelay: i * 60ms`). Каждая ячейка скелетона повторяет размеры реального контента.
- **Stagger-анимация строк (пункт 13 чеклиста):** ENV TOKEN строка: `opacity-0 animate-fade-in-up` + `animationDelay: 80ms`. Обычные токены: `opacity-0 animate-fade-in-up` + `animationDelay: (index + 1) * 40 + 100ms`. Контейнер таблицы: `opacity-0 animate-fade-in-up` + `animationDelay: 50ms`.
- **Анимация раскрытия панелей (пункт 13 чеклиста):** `AiTokenStatsPanel` обёрнут в `<div className="animate-expand-down">` для плавного раскрытия вниз при клике на строку — как для ENV, так и для обычных токенов.

**Файл(ы):** `features/settings/components/AiTokensSettings.tsx`

---

### UI/UX рефакторинг страницы «Системные страницы»

**Описание:**  
Страница «Настройки → Системные страницы» приведена к дизайн-системе. Обнаружено и исправлено 4 типа нарушений (6 точек исправления).

**Реализация:**  
- **Цвет кнопки «Проверить» (пункт 2/9 чеклиста):** `border-blue-600 text-blue-600 hover:bg-blue-50` → `border-indigo-600 text-indigo-600 hover:bg-indigo-50`. Лоадер: `border-blue-600` → `border-indigo-600`. Приведён к брендовому цвету `indigo-600`.
- **Skeleton + fade-in аватаров (пункт 8 чеклиста):** Голые `<img>` заменены на паттерн: `useState<Set<string>>` для отслеживания загруженных URL, скелетон `bg-gray-200 animate-pulse rounded-full`, плавное появление `transition-opacity duration-300` при `onLoad`.
- **Кликабельность аватаров + Lightbox (пункт 8 чеклиста):** `<img>` обёрнут в `<button>` с `cursor-pointer` и `focus:ring-2 focus:ring-indigo-500`. При клике — fullscreen lightbox: `fixed inset-0 bg-black/80 z-[9999]`, закрытие по клику/крестику/Escape, `animate-fade-in-up`.
- **Скелетон загрузки таблицы (пункт 14 чеклиста):** Спиннер `.loader` заменён на скелетон таблицы: `<thead>` + 8 skeleton-строк с `animate-pulse` и каскадным появлением (`animate-fade-in-up` + `animationDelay: i * 40ms`). Pixel-perfect размеры столбцов.
- **Stagger-анимация строк (пункт 13 чеклиста):** Каждая строка таблицы: `opacity-0 animate-fade-in-up` + `animationDelay: index * 20ms`.
- **Анимация раскрытия панели (пункт 13 чеклиста):** `AccountStatsPanel` обёрнут в `<div className="animate-expand-down">` для плавного раскрытия вниз при клике на строку.

**Файл(ы):** `features/settings/components/SystemPagesSettings.tsx`

---

### UI/UX рефакторинг страницы «Админ-инструменты»

**Описание:**  
UI/UX аудит и рефакторинг компонента `AdminToolsSettings` (Настройки → Админ-инструменты) по 17-точечному чеклисту дизайн-системы. Исправлены 4 типа нарушений (12 точек исправления).

**Реализация:**  
- **Эмоджи → SVG (пункт 7 чеклиста):** Текстовый эмоджи `📂` (индикатор текущего проекта) заменён на SVG-иконку папки (`h-3 w-3`, `currentColor`, Heroicons `folder`). Текстовый символ `★` (индикатор админ-токена) заменён на SVG-иконку звезды (`h-4 w-4`, `fill`, Heroicons `star`).
- **Скругления кнопок (пункт 2 чеклиста):** 6 кнопок с `rounded` заменены на `rounded-md`: лимит-кнопки (100, 1000, Все), кнопка «Актуализ.», мини-фильтры проектов.
- **Stagger-анимация строк таблицы (пункт 13 чеклиста):** Строки операций «Обновить подписчиков» и «Собрать посты»: `opacity-0 animate-fade-in-up` + `animationDelay: 0ms/20ms`.
- **Анимация раскрытия секций (пункт 13 чеклиста):** Прогресс-бары подписчиков и постов: `<td>` обёрнут в `animate-expand-down`. Раскрывающийся список проектов: контейнер обёрнут в `animate-expand-down`.

**Файл(ы):** `features/settings/components/AdminToolsSettings.tsx`

---

### UI/UX рефакторинг страницы «Фоновые задачи»

**Описание:**  
Страница «Настройки → Фоновые задачи» приведена к дизайн-системе. Обнаружено и исправлено 6 нарушений.

**Реализация:**  
- **Размер кнопок (пункт 2 чеклиста):** `px-3 py-1.5` / `px-3 py-1` → `px-4 py-2` по стандарту дизайн-системы для 3 кнопок («Сбросить все», «Обновить», «Сбросить выбранные»).
- **Мягкое обновление (запрет #17):** Кнопка «Обновить» больше не ставит `setIsLoading(true)`. Добавлено состояние `isRefreshing` + `animate-spin` на иконке вращения. Контент таблицы остаётся видимым во время обновления.
- **Скелетон загрузки (пункт 14 чеклиста):** Спиннер `.loader` заменён на скелетон-таблицу: `<thead>` с реальными заголовками + 5 скелетон-строк с `animate-pulse` и каскадным появлением (`animate-fade-in-up` + `animationDelay: i * 60ms`).
- **Stagger-анимация строк (пункт 13 чеклиста):** Каждая строка таблицы: `opacity-0 animate-fade-in-row` + `animationDelay: index * 20ms`.
- **Анимация пустого состояния (пункт 13 чеклиста):** Блок «Нет активных задач»: `opacity-0 animate-fade-in-up`.
- **Склонение числительных (пункт 16 чеклиста):** Добавлена функция `pluralTasks()` для корректного склонения: «1 выбранную задачу», «2 выбранные задачи», «5 выбранных задач». Используется в модальном окне подтверждения удаления выбранных задач.

**Файл(ы):** `features/settings/components/ActiveTasksSettings.tsx`, `features/settings/hooks/useActiveTasks.tsx`

---

### Поддержка домена vk.ru

**Описание:**  
Система теперь принимает ссылки с доменом `vk.ru` наравне с `vk.com`. Ранее при вставке ссылки вида `https://vk.ru/club236229266` система не распознавала ID сообщества. Теперь все точки парсинга URL (проекты, сториз, списки, конкурсы, Gemini-промпты) обрабатывают оба домена.

**Реализация:**  
- **Бэкенд (10 файлов):**
  - `services/vk_api/utils.py` — функции `resolve_vk_group_id()` и `extract_vk_group_identifier()`: строковые проверки `'vk.com/'` дополнены `'vk.ru/'`, регулярные выражения обновлены на `vk\.(?:com|ru)`.
  - `services/vk_api/admin_tokens.py` — парсинг `vkProjectId` при привязке токенов сообществ: `split('vk.com/')` → `re.split(r'vk\.(?:com|ru)/', ...)`.
  - `services/project_context_service.py` — валидация полей «Сайт» и «Dlvry»: добавлена альтернатива `vk.ru` в regex и условиях.
  - `services/automations/stories/retrieval_helpers.py`, `stats.py`, `viewers_batch.py` — парсинг ссылок на сториз: `replace('https://vk.com/story', '')` → `re.sub(r'https?://vk\.(?:com|ru)/story', '', link)`.
  - `crud/batch_crud.py` — извлечение story ID: аналогичная замена `replace` → `re.sub`.
  - `crud/lists/retrieval.py`, `services/lists/retrieval/filters.py` — поиск пользователя по ссылке: regex `vk\.com` → `vk\.(?:com|ru)`.
  - `services/gemini_api/analysis.py` — промпт для Gemini: правила валидации «Dlvry» и «Сайт» теперь упоминают оба домена.
- **Фронтенд (12 файлов):**
  - `features/database-management/components/modals/AddProjectsModal.tsx` — regex парсинга URL: `vk\.com` → `vk\.(com|ru)`; placeholder обновлён.
  - `features/database-management/hooks/useAdministeredGroups.ts` — regex парсинга ссылки: добавлена альтернатива `vk.ru`.
  - `features/automations/general-contests/components/ConditionsBuilder.tsx` — `extractGroupIdFromUrl()`: regex обновлён + `includes('vk.ru/')`.
  - 9 файлов — обновлены placeholder'ы и hint-тексты: добавлено упоминание `vk.ru`.

**Файл(ы):** `services/vk_api/utils.py`, `services/vk_api/admin_tokens.py`, `services/project_context_service.py`, `services/automations/stories/retrieval_helpers.py`, `services/automations/stories/stats.py`, `services/automations/stories/viewers_batch.py`, `crud/batch_crud.py`, `crud/lists/retrieval.py`, `services/lists/retrieval/filters.py`, `services/gemini_api/analysis.py`, `features/database-management/components/modals/AddProjectsModal.tsx`, `features/database-management/hooks/useAdministeredGroups.ts`, `features/automations/general-contests/components/ConditionsBuilder.tsx`

---

### ✅ Мониторинг сообщений — интерактивный график с оверлейными метриками

**Тип:** Новая функциональность  
**Влияние:** Фронтенд + Бэкенд  
**Раздел:** Мониторинг — Сообщения

**Описание:**  
Полная переработка графика мониторинга сообщений. Вместо примитивного линейного графика — полноценный интерактивный SVG-компонент с адаптивной шириной (ResizeObserver), заливкой областей, порталовыми тултипами, зонами наведения, подписями min/max и адаптивными метками оси X. Добавлено переключение **оверлейных метрик**: клик по бейджу рисует на графике реальную почасовую линию для каждой метрики (пунктир, уникальный цвет). Временная шкала переведена в МСК (UTC+3).

**Backend:**  
Расширен `get_hourly_chart()` — теперь возвращает **12 метрик** на каждый часовой слот: `incoming`, `outgoing`, `total`, `unique_users`, `incoming_payload`, `incoming_text`, `outgoing_system`, `outgoing_bot`, `incoming_dialogs`, `unique_text_users`, `unique_payload_users`, `outgoing_recipients`. Для кросс-проектной агрегации уникальных пользователей парсятся JSON-массивы (`unique_text_users_json`, `unique_payload_users_json`, `outgoing_users_json`) и объединяются как множества (set-union). Исправлен подсчёт входящих диалогов: `incoming_dialogs = len(text_users | payload_users)` вместо суммирования по проектам.

**Frontend:**  
- `MessageStatsChartPoint` расширен 8 опциональными полями
- `MessageStatsChart.tsx` полностью переписан (~712 строк): SVG, ResizeObserver, `ChartOverlayMetric`, `NormalizedPoint` с 12 полями, `fillGaps()` с конверсией UTC→MSK, пунктирные polyline для оверлеев, авто-масштабирование Y-оси
- `MessageStatsPage.tsx`: вкладка «Входящие» — 6 оверлеев (Кнопка/бот, Реальные, Диалогов, Юзеров всего, Нажимали кнопки, Отправляли сообщ.), вкладка «Исходящие» — 3 оверлея (Админ, Бот/рассылка, Получателей)
- Тултип показывает значения активных оверлеев с разделительной линией

**Файл(ы):** `features/messages/components/MessageStatsChart.tsx`, `features/messages/components/MessageStatsPage.tsx`, `services/api/messages_stats.api.ts`, `backend_python/crud/message_stats/read.py`

---

## ✅ Решённые задачи

### Модалка «В админы» показывала «неизвестная ошибка» вместо результатов

**Проблема:**  
При массовом назначении системных страниц администраторами в группах VK модалка «В админы» показывала красное сообщение «Произошла неизвестная ошибка на бэкенде» вместо детализированных результатов. При этом бэкенд отвечал HTTP 200 OK и корректно обрабатывал все операции.

**Причина:**  
Бэкенд возвращал `"success": error_count == 0` в теле ответа. Когда хотя бы один пользователь не был назначен (например, из-за отсутствия scope `groups` у токена), `success` становился `false`. Фронтенд-функция `callApi()` в `shared/utils/apiClient.ts` содержит legacy-проверку: `if (result.success === false) throw new Error(result.error || 'Произошла неизвестная ошибка на бэкенде.')` — она выбрасывала исключение, не давая данным дойти до компонента.

**Решение:**  
Изменён бэкенд: `"success": True` — операция выполнена корректно (HTTP 200 = сервер отработал), детализация по каждому пользователю доступна в массиве `results` и счётчиках `promoted_count`, `error_count` и т.д. Фронт анализирует `results` и показывает категоризированные результаты.

**Файл(ы):** `backend_python/services/admin_tools_service.py`

---

### Улучшена функция «В админы» — полная переработка логики и интерфейса

**Описание:**  
Полная переработка функции массового назначения системных страниц администраторами в группах VK. Бэкенд: новая логика — вступление в группу происходит СНАЧАЛА для всех пользователей, поиск админ-токена выполняется ОДИН РАЗ на группу через живой API `groups.getMembers(filter=managers)`, добавлены рекомендации к каждому результату. Фронтенд: плоская таблица заменена на 5 категоризированных секций с рекомендациями.

**Реализация:**  
- **Бэкенд (admin_tools_service.py):**
  - `promote_to_admins()` — реструктурирован: join → find admin token (1 раз на группу) → editManager loop
  - `groups.join` Error 15 (уже в сообществе) — не фатальная, продолжает к editManager
  - `groups.isMember` — итерация по всем доступным токенам (раньше только первый)
  - `_find_admin_token_for_group()` — полностью переписана: живая верификация через API, DB admins_data как hint для приоритета, кеширование
  - Админ-токен маркируется `broken` после первого Error 15 на editManager
  - Поле `recommendation` в каждом результате
  - Error 203 добавлен в PERMANENT_ERROR_CODES (api_client.py)
- **Бэкенд (schemas/api_responses.py):** Поле `recommendation: Optional[str] = None` в PromoteUserResult
- **Фронтенд (management.api.ts):** Поле `recommendation: string | null` в PromoteUserResult
- **Фронтенд (PromoteAdminsModal.tsx):**
  - `useMemo(groupedResults)` — категоризация: promoted, alreadyAdmin, joinedOnly, failedJoin, failedPromote
  - 5 цветовых секций: зелёная (назначены), синяя (уже админы), жёлтая (вступили), красная (ошибка назначения), серая (ошибка вступления)
  - Блок «Что нужно сделать» с агрегированными рекомендациями
  - Исправлен React Rules of Hooks: useMemo перемещён до `if (!isOpen) return null`

**Файл(ы):**
- `backend_python/services/admin_tools_service.py` — основная логика
- `backend_python/services/vk_api/api_client.py` — Error 203 permanent
- `backend_python/schemas/api_responses.py` — recommendation field
- `services/api/management.api.ts` — TS type
- `features/database-management/components/modals/PromoteAdminsModal.tsx` — UI

---

### UI/UX рефакторинг модалки «В админы»

**Описание:**  
UI/UX аудит и рефакторинг модалки `PromoteAdminsModal` по 17-точечному чеклисту дизайн-системы. Исправлены 4 типа нарушений: динамический размер модалки при фильтрации, отсутствие крестика сброса в полях поиска, некорректные цвета кнопок, отсутствие анимации появления.

**Реализация:**  
- **Фиксированная высота модалки:** `max-h-[85vh]` → `h-[75vh]` на обеих фазах (выбор + результаты). Теперь при фильтрации поля поиска модалка не схлопывается — списки скроллятся внутри фиксированного контейнера.
- **Поля поиска (пункт 13 чеклиста):** Оба инпута (проекты и аккаунты) обёрнуты в `relative` контейнер с крестиком сброса по эталону (`pr-8`, SVG `h-4 w-4`, `text-gray-400 hover:text-gray-600`, `title="Сбросить поиск"`).
- **Анимация модалки (пункт 13 чеклиста):** Добавлен `animate-fade-in-up` на контент обеих фаз модалки.
- **Кнопки (пункт 2 чеклиста):** «Отмена» / «← Назад к выбору» → secondary `bg-gray-200 text-gray-800 hover:bg-gray-300`. «В админы» → primary `bg-green-600 hover:bg-green-700`.

**Файл(ы):** `features/database-management/components/modals/PromoteAdminsModal.tsx`

---

## 🔴 Открытые задачи

_(пока нет записей)_

---

## ✅ Решённые задачи (дополнение)

### ResponseValidationError при загрузке списков подписчиков (миграция БД)

**Проблема:**  
После миграции 8 денормализованных таблиц списков на 6 нормализованных (`project_members`, `member_events`, `post_interactions`, `project_dialogs`, `project_authors`, `vk_profiles`) эндпоинт `POST /api/lists/system/getSubscribers` возвращал `ResponseValidationError` с сотнями ошибок валидации. Pydantic не мог сериализовать объекты `ProjectMember`, `MemberEvent`, `ProjectDialog`, `ProjectAuthor` в response-схемы. Затронуты все типы списков: subscribers, history_join, history_leave, mailing, authors.

**Причина:**  
Две корневые проблемы:
1. **id: int vs str** — новые нормализованные модели используют `BigInteger autoincrement` для primary key (возвращает `int`), а Pydantic-схемы (`SystemListSubscriber`, `SystemListMailingItem`, `SystemListHistoryItem`, `SystemListAuthor`, `SystemListPost`, `SystemListInteraction`) объявляли `id: str`. FastAPI `response_model` с `Union[...]` пробовал все варианты — все отклонялись.
2. **Union validation cascade** — роутер `getSubscribers` использует `response_model=Union[SubscribersResponse, PostsResponse, HistoryResponse, AuthorsResponse, MailingResponse]`. При несовпадении первого типа Pydantic v2 пробует следующий, генерируя ошибки для каждого элемента × каждый тип = сотни ошибок.

**Решение:**  
1. Добавлена helper-функция `_coerce_id_to_str()` в `schemas/models/lists.py`.
2. Во всех 7 Pydantic-схемах заменено `id: str` → `id: Any` + `@field_validator('id', mode='before')` с автоконвертацией `int → str`.
3. Полный интеграционный тест: DB → ORM model (proxy properties через vk_profile) → dict → Pydantic response schema для всех 7 типов (subscribers, history_join, history_leave, mailing, authors, posts, likes) — ALL OK.

**Файл(ы):** `backend_python/schemas/models/lists.py`

---

### Некорректное отображение составных эмодзи в эмодзи-баре

**Проблема:**  
В эмодзи-баре (EmojiPicker) при работе с сообщениями часть эмодзи отображалась пустыми картинками (broken image) или не загружалась. Затронуты все ZWJ-эмодзи (составные через символ U+200D): ❤️‍🔥 «Сердце в огне», ❤️‍🩹 «Заживающее сердце», 😶‍🌫️ «В облаках», 🙂‍↔️ «Качает головой», 🙂‍↕️ «Кивает» и другие.

**Причина:**  
Функция `emojiToCodepoint()` в `features/emoji/utils/twemoji.ts` безусловно удаляла символ `FE0F` (variation selector-16) из всех кодпоинтов при формировании URL для Twemoji CDN. Для обычных эмодзи это корректно (Twemoji не использует `fe0f` в именах файлов), но для ZWJ-последовательностей `fe0f` является частью имени файла на CDN. Например: `2764-fe0f-200d-1f525.svg` — рабочий URL, `2764-200d-1f525.svg` — 404.

**Решение:**  
1. Исправлена `emojiToCodepoint()` — для ZWJ-эмодзи (содержащих `200d`) `fe0f` теперь сохраняется в кодпоинтах, для обычных — удаляется как раньше.
2. Добавлены вспомогательные `emojiToCodepointAlt()` и `getTwemojiUrlAlt()` — возвращают альтернативный URL с обратной логикой `fe0f` (для edge-case'ов).
3. В `EmojiPicker.tsx` добавлен `handleImgError` с трёхуровневым fallback: основной Twemoji URL → альтернативный Twemoji URL → нативный Unicode символ.

**Файл(ы):**
- `features/emoji/utils/twemoji.ts` — исправлена `emojiToCodepoint`, добавлены `emojiToCodepointAlt`, `getTwemojiUrlAlt`
- `features/emoji/components/EmojiPicker.tsx` — `handleImgError` с fallback, `onError` на всех `<img>`

---

### Подпись менеджера пропадала после отправки сообщения в чате

**Проблема:**  
При отправке сообщения из чата в модуле «Сообщения сообщества» подпись менеджера (кто отправил) отображалась в оптимистичном сообщении, но исчезала после прихода SSE-события `new_message`. При открытии диалога заново подпись появлялась корректно (из кэша БД).

**Причина:**  
Гонка между SSE и API-ответом. SSE-событие `new_message` приходило быстрее, чем ответ API `sendMessage`. В `handleNewMessage` (useMessagesPageLogic.ts) при создании `ChatMessageData` из SSE-данных поле `sentByName` не устанавливалось — его просто не было в типе `SSENewMessageData.message`. Когда API-ответ приходил и обнаруживал, что SSE уже добавил сообщение с реальным ID — API просто удалял оптимистичное (temp) сообщение, оставляя SSE-версию без подписи.

**Решение:**  
1. Добавлено поле `sent_by_name?: string` в тип `SSENewMessageData.message` (types.ts)
2. В SSE-обработчике `handleNewMessage` прокинуто `sentByName: data.message.sent_by_name` при создании `ChatMessageData` (useMessagesPageLogic.ts)
3. Защита от гонки: если SSE добавило сообщение раньше API-ответа, теперь вместо простого удаления оптимистичного сообщения выполняется `{ ...m, ...realMsg }` — SSE-версия обновляется полными данными из API (useMessageHistory.ts)

**Файл(ы):**
- `features/messages/types.ts` — добавлено `sent_by_name` в `SSENewMessageData.message`
- `features/messages/hooks/useMessagesPageLogic.ts` — прокинуто `sentByName` в SSE-обработчике
- `features/messages/hooks/chat/useMessageHistory.ts` — merge вместо delete при гонке SSE vs API

---

### Статус «печатает» отображался не в том проекте

**Проблема:**  
При получении callback `message_typing_state` от VK статус «печатает...» устанавливался на уровне пользователя (`Set<vk_user_id>`), а не на уровне диалога/проекта. Если один и тот же VK-пользователь участвовал в двух проектах (сообществах), его статус «печатает...» отображался в обоих диалогах одновременно, хотя набор текста происходил только в одном.

**Причина:**  
В хуке `useTypingState` при смене `projectId` не происходил сброс состояния `typingUsers: Set<number>` и связанных таймеров auto-expire (6 сек). При переключении между проектами старые typing-индикаторы «перетекали» в новый проект. Состояние `dialogFocuses` уже корректно сбрасывалось через `useEffect([projectId])`, но для `typingUsers` аналогичная очистка отсутствовала.

**Решение:**  
Добавлен `useEffect([projectId])`, который при смене проекта: 1) сбрасывает `typingUsers` в пустой `Set`, 2) очищает все таймеры auto-expire через `clearTimeout` + `typingTimersRef.current.clear()`. Это гарантирует, что при переключении между проектами не остаётся stale-данных от предыдущего проекта.

**Файл(ы):**
- `features/messages/hooks/chat/useTypingState.ts` — добавлен `useEffect([projectId])` для сброса typing-стейта

---

### Кликабельные ссылки и VK-разметка в чате сообщений

**Описание:**  
В чате модуля «Сообщения сообщества» ссылки, упоминания, хэштеги и VK-разметка с квадратными скобками отображались как обычный текст. В модуле предпросмотра поста аналогичная разметка уже конвертировалась в кликабельные элементы.

**Реализация:**  
1. В `renderVkFormattedText` (shared/utils/) добавлен опциональный параметр `linkClassName` для кастомизации стилей ссылок (светлые для тёмного фона исходящих, синие для входящих). Обратная совместимость сохранена.
2. Расширена регулярка `VK_MARKUP_REGEX` — добавлена поддержка `@screen_name (Текст)` (группы 9–10). Ранее поддерживались только `@id12345`, `@club12345` и т.д. Формат `@screen_name` используется кнопкой «Упоминание сообщества» в панели переменных.
3. В `chatMessageUtils.tsx` добавлена функция `renderChatMessageText`, которая: вызывает `renderVkFormattedText` с адаптивным стилем ссылок, затем для текстовых узлов применяет подсветку поискового запроса через `highlightText`.
4. В `ChatMessage.tsx` заменён прямой рендер `message.text` / `highlightText` на `renderChatMessageText`.

**Файл(ы):**
- `shared/utils/renderVkFormattedText.tsx` — `linkClassName` параметр + `@screen_name (Текст)` в регулярке
- `features/messages/components/chat/chatMessageUtils.tsx` — функция `renderChatMessageText`
- `features/messages/components/chat/ChatMessage.tsx` — подключение `renderChatMessageText`

---

### Автоматическое увеличение маленьких фото товаров до минимального размера VK

**Описание:**  
При загрузке товаров через сервис (создание, обновление, массовый импорт) фото менее 400×400 пикселей отклонялись VK API с ошибкой `ERR_UPLOAD_BAD_IMAGE_SIZE`. Пользователям приходилось вручную увеличивать размеры через внешние сервисы.

**Реализация:**  
- В `upload.py` добавлена функция `ensure_market_photo_min_size()`: открывает изображение через Pillow, проверяет размер, при необходимости увеличивает с сохранением пропорций (LANCZOS-интерполяция, JPEG quality=95). Вызывается в `upload_market_photo()` — единой точке загрузки всех фото товаров.
- Функция возвращает `resize_info` dict, который пробрасывается через `_resize_info` ключ в ответе upload, далее извлекается в `create_market_item()`, `update_market_item()` и `upload_market_item_photo()` и записывается в поле `photo_resized_warning` схемы `MarketItem`.
- На фронтенде добавлено опциональное поле `photo_resized_warning` в тип `MarketItem`. При создании одного товара — toast с деталями ресайза. При массовом создании — итоговый toast с количеством увеличенных фото. При обновлении — аналогичный toast.

**Файл(ы):**
- `backend_python/services/vk_api/upload.py` — `ensure_market_photo_min_size()` + интеграция в `upload_market_photo()`
- `backend_python/schemas/models/market.py` — поле `photo_resized_warning`
- `backend_python/services/market_item_create.py` — проброс `_resize_info` → `photo_resized_warning`
- `backend_python/services/market_item_update.py` — проброс `_resize_info` → `photo_resized_warning` (update + upload_photo)
- `shared/types/index.ts` — `photo_resized_warning?: string`
- `features/products/hooks/useProductsManager.ts` — toast при создании (single + multiple)
- `features/products/hooks/useProductSaving.ts` — toast при обновлении

---

### Медиа-вложения терялись при отправке сообщений с несколькими файлами

**Проблема:**  
При отправке сообщения с несколькими вложениями (фото + видео, несколько фото + документ) часть медиа не отображалась в чате. Например, при прикреплении фото и видео — видео было видно, а фотографии пропадали. После обновления истории всё отображалось корректно.

**Причина:**  
4 бага в race condition между SSE-событиями и API-ответом `messages.send`:
1. SSE-обработчик (`handleNewMessage` в `useMessagesPageLogic.ts`) создавал `ChatMessageData` вручную **без маппинга вложений** — поле `attachments` не заполнялось.
2. Race condition: SSE приходил раньше, чем `handleSendMessage` завершался → SSE добавлял новое сообщение, потом `handleSendMessage` удалял temp → счётчик сообщений прыгал (52→51).
3. При замене temp→real спред `{...existing, ...incoming}` затирал хорошие вложения (blob/upload превью) пустыми из API-ответа `messages.send` (VK часто не возвращает вложения в ответе на send).
4. `addIncomingMessage` при замене temp→SSE делал прямую замену без мёржа вложений.

**Решение:**  
- **SSE:** `handleNewMessage` теперь использует `mapVkMessage(data.message, vkGroupId)` вместо ручного маппинга — все вложения (фото, видео, документы) корректно извлекаются из VK-формата.
- **Оптимистичное отображение:** При нажатии «Отправить» сразу генерируются blob-превью из `File[]` через `URL.createObjectURL` — пользователь видит вложения мгновенно.
- **addIncomingMessage:** Для исходящих SSE-сообщений при наличии temp-* — **заменяет** temp (вместо добавления нового), с мёржем вложений по принципу «берём массив с бОльшим количеством элементов».
- **smartMerge:** При мёрже temp→real предпочитает массив с бОльшим количеством вложений. При равном — incoming (свежие данные). Это гарантирует, что вложения **никогда не уменьшаются**.
- **Все 4 ветки** `setMessages` в `handleSendMessage` (hasTemp&&hasReal, hasTemp&&!hasReal, !hasTemp&&hasReal, edge case) теперь используют `smartMerge`.

**Файл(ы):**
- `features/messages/hooks/chat/useMessageHistory.ts` — `handleSendMessage` (blob-превью, smartMerge), `addIncomingMessage` (замена temp, мёрж вложений)
- `features/messages/hooks/useMessagesPageLogic.ts` — `handleNewMessage` (использует `mapVkMessage` вместо ручного маппинга), импорт `mapVkMessage`

---

### Медиа-вложения не заполняли ширину бабла сообщения

**Проблема:**  
В чате модуля «Сообщения сообщества» фото и видео-вложения были ограничены фиксированной шириной `max-w-[280px]`, в то время как бабл сообщения мог быть шире (за счёт текста, документов и т.д.). Это приводило к пустой фиолетовой/серой полосе справа от медиа внутри бабла — выглядело криво.

**Решение:**  
Заменены фиксированные ограничения ширины на `w-full` — теперь фото и видео растягиваются на всю ширину родительского контейнера (бабла сообщения). Ширину самого бабла по-прежнему ограничивает `max-w-[70%]` на внешнем wrapper.

**Файл(ы):**
- `features/messages/components/attachments/PhotoGrid.tsx` — одиночное фото и сетка: `max-w-[280px]` → `w-full`, скелетон: `w-[280px]` → `w-full`
- `features/messages/components/chat/ChatMessageAttachments.tsx` — VideoAttachment: `max-w-[280px]` → `w-full`, скелетон/заглушка видео: фиксированная ширина → `w-full`

---

### Фильтр «Непрочитанные» в сайдбаре диалогов не работал

**Проблема:**  
В модуле «Сообщения» при нажатии на вкладку «Непрочитанные» в сайдбаре диалогов список не менялся — отображались все диалоги, как и на вкладке «Все». Значение `filterUnread` корректно передавалось в компонент `ConversationsSidebar`, но фактическая фильтрация по `unreadCount` не применялась к массиву `filteredConversations`.

**Причина:**  
В `useMemo` переменной `filteredConversations` фильтровались только по поиску имени (`searchQuery`), но фильтр `filterUnread === 'unread'` не был реализован. Комментарий в коде гласил: «без фильтра непрочитанных — пока нет данных о непрочитанных», хотя данные `unreadCount` уже были доступны в объекте `Conversation`.

**Решение:**  
Добавлена фильтрация `result.filter(c => c.unreadCount > 0)` при `filterUnread === 'unread'` перед фильтрацией по имени. `filterUnread` добавлен в зависимости `useMemo`.

**Файл(ы):** `features/messages/components/conversations/ConversationsSidebar.tsx`

---
### ⭐ Статус «отвечает» в диалогах просачивался между проектами

**Проблема:**  
Когда администратор просматривал диалог с пользователем X в проекте A, статус «отвечает» (dialog_focus) отображался у этого же пользователя X во **всех** проектах, а не только в текущем. Например: админ открыл диалог в «тестовая группа 122» — статус «Админ отвечает» появлялся и в проекте «Тест» для того же VK-пользователя.

**Причина (3 корневых):**  
1. **КРИТИЧЕСКАЯ — Multi-worker:** uvicorn запускается с `--workers 2`. Каждый воркер имеет свой экземпляр `SSEManager` с отдельным `_dialog_focus` dict. Методы `set_dialog_focus()` / `remove_dialog_focus()` / `_cleanup_focus_for_manager()` использовали `self.publish()` (локальная очередь), а не `self.publish_via_redis()`. POST и GET попадали на случайные воркеры → рассинхрон состояния.
2. **СРЕДНЯЯ — localStorage manager_id:** ID менеджера хранился в `localStorage`, что разделяло его между всеми вкладками одного origin. Два таба у одного пользователя получали одинаковый `manager_id` → при отключении одной вкладки фильтрация «self» удаляла фокус другой вкладки.
3. **МИНОРНАЯ — Нет фильтрации own manager_id при GET:** Начальная загрузка `getDialogFocuses` возвращала все фокусы, включая собственный `manager_id` текущего менеджера → пользователь видел «сам себя отвечает».

**Решение:**  
1. **Бэкенд:** `publish()` → `publish_via_redis()` для всех 3 точек SSE-рассылки dialog_focus. Новый метод `_apply_dialog_focus_from_event()` синхронизирует локальный `_dialog_focus` dict при получении event через Redis listener.
2. **Фронтенд:** `localStorage` → `sessionStorage` для `manager_id` — каждая вкладка получает уникальный ID.
3. **Фронтенд:** Фильтрация `manager_id !== myManagerId` при начальной загрузке `getDialogFocuses`.
4. **Фронтенд:** Cross-project guard в `handleDialogFocus` (SSE callback) — если `project_id` события ≠ текущему `projectIdRef`, событие игнорируется. Мгновенная очистка `dialogFocuses` Map при смене проекта.
5. **Диагностика:** Добавлен эндпоинт `GET /dialog-focuses-debug` (убрать перед production).

⭐ _Статус: под наблюдением на предпроде. TTL для dialog_focus отсутствует — очистка только по leave/disconnect._

**Файл(ы):**
- `backend_python/services/sse_manager.py` — `publish_via_redis` для dialog_focus, `_apply_dialog_focus_from_event()`, Redis listener sync
- `backend_python/routers/messages.py` — расширенный logging, `GET /dialog-focuses-debug`
- `features/messages/utils/getManagerId.ts` — `localStorage` → `sessionStorage`
- `features/messages/hooks/chat/useTypingState.ts` — own manager_id filter, projectIdRef guard, instant Map clear
- `features/messages/hooks/chat/useMessagesSSE.ts` — propagate `project_id` from SSE envelope
- `features/messages/types.ts` — `project_id?: string` в `SSEDialogFocusData`

---

### Автоматизация историй через VK Callback (wall_post_new)

**Описание:**  
Публикация историй на основе новых постов полностью переведена с polling-схемы (APScheduler каждые 10 мин → VK API wall.get → upsert → проверка) на callback-first архитектуру. Теперь при получении VK Callback `wall_post_new` история создаётся мгновенно (~3 сек), а фоновая задача (раз в 60 мин) выполняет reconciliation пропущенных постов и сбор статистики/зрителей по историям.

**Архитектура — 3 уровня:**
1. **Callback-first (мгновенный):** `PostNewHandler._trigger_stories_automation()` — при получении `wall_post_new` проверяет активность автоматизации, совпадение ключевых слов, свежесть поста (24ч), SQL-дедупликацию, Redis-лок, вызывает `process_single_story_for_post()`.
2. **Reconciliation (раз в 60 мин):** `_reconcile_missed_posts()` — находит посты за последний час из таблицы `posts`, у которых нет записи в `StoriesAutomationLog`, и обрабатывает их через ту же `process_single_story_for_post()`.
3. **Сбор данных (раз в 60 мин):** `_collect_stories_data()` — для всех проектов с активной автоматизацией вызывает `update_all_stats_and_viewers()` с community_tokens — собирает статистику и данные зрителей историй.

**Дедупликация — 4 уровня:**
1. `event_id` — middleware Deduplicator (Redis SET NX TTL 5 мин)
2. SQL — `SELECT ... WHERE project_id AND vk_post_id` в `StoriesAutomationLog`
3. Redis lock — `SET NX story_publish:{project}:{post}` TTL 300 сек
4. DB — `UniqueConstraint(project_id, vk_post_id)` на таблице `StoriesAutomationLog`

**Токены:**  
- Генерация + загрузка истории: `user_token` (обязательно, VK API ограничение)
- Сбор статистики и зрителей: `community_tokens` (приоритет) → `admin_tokens` → `user_token`

**Тестирование:**  
Callback получен в 15:51:16, история опубликована в 15:51:19 (3 секунды). Полный VK API flow: `getPhotoUploadServer` → upload → `stories.save` → success. Ссылка: `https://vk.com/story-173525155_456239287`.

**Файл(ы):**
- `backend_python/services/vk_callback/handlers/wall/post_new.py` — добавлен шаг 2.5: `_trigger_stories_automation()` (~100 строк), проверка is_active, keywords-matching, 24ч freshness, SQL dedup, Redis lock, вызов `process_single_story_for_post()`
- `backend_python/services/automations/stories_background_service.py` — полная перезапись: убран VK API polling и upsert постов, добавлены `run_stories_automation_cycle()`, `_reconcile_missed_posts()`, `_collect_stories_data()`, `_get_community_tokens()`, `_extract_vk_post_id()`, `_post_model_to_dict()`
- `backend_python/services/scheduler_service.py` — интервал `IntervalTrigger` изменён с `minutes=10` на `minutes=60`, Redis lock TTL 590→3550 сек

---

### Исправлена автонастройка Callback API — события wall_schedule_post не отправлялись в VK

**Проблема:**  
При автонастройке Callback API события `wall_schedule_post_new` и `wall_schedule_post_delete` (добавление/удаление отложенных записей) не включались/выключались в VK. Пользователь ставил чекбоксы, нажимал «Авто-настройка», но VK показывал прежнее состояние. Причина: эти два события были ошибочно помещены в список `VK_ALWAYS_ON_EVENTS` (неуправляемые) вместо `VK_SETTABLE_EVENTS`, и не отправлялись в `groups.setCallbackSettings`.

**Причина:**  
В `callback_setup.py` список `VK_ALWAYS_ON_EVENTS` содержал 4 события: `wall_schedule_post_new`, `wall_schedule_post_delete`, `vkpay_transaction`, `app_payload`. Функция `_prepare_events_dict()` в `setup_orchestrator.py` строит словарь событий только из `VK_SETTABLE_EVENTS` — всё, что в `VK_ALWAYS_ON_EVENTS`, игнорировалось. На деле `wall_schedule_post_new/delete` являются полноценно настраиваемыми параметрами `groups.setCallbackSettings` (проверено тестированием VK API).

**Решение:**  
Перенесены `wall_schedule_post_new` и `wall_schedule_post_delete` из `VK_ALWAYS_ON_EVENTS` → `VK_SETTABLE_EVENTS`. Теперь `VK_SETTABLE_EVENTS` содержит 56 событий, `VK_ALWAYS_ON_EVENTS` — 2 (`vkpay_transaction`, `app_payload`). Обновлены комментарии в бэкенде и фронтенде.

**Файл(ы):** `backend_python/services/callback_setup.py`, `shared/utils/callbackEvents.ts`

---

### Инлайн-настройка интеграции в автоматизации историй

**Описание:**  
На странице «Автоматизация историй → Настройки» добавлен блок проверки интеграционных требований с 3-шаговым чеклистом. Каждый шаг можно выполнить прямо на странице — без перехода в настройки проекта:
1. **Токен сообщества** — если нет, показывается инлайн-форма ввода (дубль из TokensBlock)
2. **Callback API сервер** — если нет, встраивается полный UI автонастройки (переиспользованы компоненты из IntegrationsSection: CallbackAutoSetupBlock, CallbackCurrentStateBlock, CallbackEventSelector, CallbackSetupResult)
3. **Событие wall_post_new** — если выключено, кнопка включения прямо из чеклиста

Тогл включения автоматизации блокируется до выполнения всех 3 требований.

**Реализация:**  
- **Хук `useIntegrationRequirements`:** Проверяет последовательно: токен → callback state (getCurrentCallbackState) → wall_post_new. Возвращает `state`, `actions` (saveToken, enableWallPostNew, recheck) и `callbackSetup` — полное состояние и действия для инлайн-автонастройки callback (isSettingUp, setupResult, tunnelMode, selectedEvents, handleAutoSetup, loadCurrentSettings и т.д.).
- **Компонент `IntegrationRequirementsBlock`:** 3 RequirementRow с иконками-индикаторами (✅/❌/⏳). Шаг 1 — InlineTokenForm с инструкцией + input + кнопка сохранения. Шаг 2 — при hasToken && !hasCallback встраивает CallbackAutoSetupBlock + CallbackEventSelector + CallbackCurrentStateBlock + CallbackSetupResult из `features/projects/components/modals/settings-sections/`. Шаг 3 — кнопка «Включить wall_post_new».
- **StoriesSettingsView:** Тогл `canEnableAutomation = integrationState.isReady`. При клике на заблокированный тогл — toast с предупреждением.

**Файл(ы):**
- `features/automations/stories-automation/hooks/useIntegrationRequirements.ts` — хук проверки + инлайн-автонастройка callback
- `features/automations/stories-automation/components/IntegrationRequirementsBlock.tsx` — UI чеклиста с инлайн-формами
- `features/automations/stories-automation/components/StoriesSettingsView.tsx` — интеграция хука + блокировка тогла
- `features/automations/stories-automation/StoriesAutomationPage.tsx` — проброс projectId

---