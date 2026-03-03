# 📋 Release Log — Журнал релизов

Этот файл содержит историю багов, задач и их решений в хронологическом порядке.

---

## 🔴 Открытые задачи

<!-- Сюда добавляются новые баги/задачи -->

---

## ✅ Решённые задачи

### Улучшение баннера «Ошибка доступа» — подробная пользовательская инструкция

**Проблема:**  
При отсутствии авторизованных системных аккаунтов-администраторов на вкладках «Расписание» и «Предложенные посты» показывался баннер «Ошибка доступа» с малоинформативным текстом «Убедитесь, что сервисный токен имеет права администратора…». Пользователь не понимал, что конкретно нужно сделать, и не знал, куда перейти для решения проблемы.

**Решение:**  
1. Заголовок баннера изменён с «Ошибка доступа» на **«Нет авторизованных аккаунтов»** — описывает суть проблемы, а не техническую ошибку.
2. Основной текст теперь объясняет: нужно добавить хотя бы одну страницу ВКонтакте, которая является администратором в сообществе.
3. Добавлен раскрывающийся блок **«Подробнее — как это исправить»** (`<details>`) с пошаговой инструкцией:
   - **Шаг 1:** Перейти в ⚙️ Настройки → вкладка «Системные страницы»
   - **Шаг 2:** Нажать «Добавить», вставить ссылку на профиль ВК-администратора группы
   - **Шаг 3:** Авторизовать страницу через иконку 🔑 — выбрать приложение (Android Офиц. / VK Me / Kate Mobile и др.), получить токен через VK OAuth, скопировать ссылку, вставить и сохранить
   - **Шаг 4:** Проверить статус «Активен», вернуться и нажать «Обновить»
4. Текст в `errorService.ts` обновлён — вместо технического описания ошибки теперь указан путь решения: «Перейдите в Настройки → Системные страницы».

**Файл(ы):**  
`features/schedule/components/ScheduleTab.tsx`, `features/suggested-posts/components/SuggestedPostsTab.tsx`, `services/errorService.ts`

---

### Гонка состояний при массовом удалении постов — пропадают истории

**Проблема:**  
После массового выбора и удаления публикаций в расписании происходила гонка состояний обновлений, в результате чего расписание загружалось без историй (stories).

**Причина:**  
Две независимые проблемы:

1. **Фронтенд — гонка рефрешей:** При массовом удалении каждый пост удалялся через `handleDelete`, который вызывал индивидуальный рефреш данных. Для published-постов это вызывало `handleRefreshPublished`, который параллельно загружал stories через `getCachedStories`. При 5 удалённых постах запускалось 5 параллельных рефрешей + 1 финальный `onRefreshAll` = 6 конкурирующих обновлений `setAllStories`. При ошибке сети catch-блок возвращал `[]`, затирая stories.

2. **Бэкенд — SQLAlchemy Session race condition:** Эндпоинт `POST /api/refreshStories` падал с 500 (`InvalidRequestError: identity map is no longer valid. Has the owning Session been closed?`). Роутер `stories_automation.py` использовал `SessionLocal()` (scoped_session), который привязывает сессию к потоку. При concurrent запросах в одном потоке threadpool один запрос закрывал сессию другого через `db.close()`.

**Решение:**  
1. **Фронтенд:** Создан метод `handleBulkDeleteOnly` — выполняет только API-вызовы удаления без индивидуальных рефрешей. После всех удалений делается **один** финальный `onRefreshAll`. В `handleRefreshPublished` при ошибке `getCachedStories` теперь возвращается `null` вместо `[]`, и `setAllStories` вызывается только при успешной загрузке.
2. **Бэкенд:** Заменил `SessionLocal()` (scoped_session) на `_session_factory()` в `get_db()` роутера `stories_automation.py` — каждый запрос получает изолированную сессию, не привязанную к потоку.

**Файл(ы):**  
`features/schedule/hooks/useScheduleData.ts`, `features/schedule/hooks/useScheduleInteraction.ts`, `features/schedule/components/ScheduleModals.tsx`, `contexts/hooks/useDataRefreshers.ts`, `backend_python/routers/stories_automation.py`

---

### Массовое редактирование постов

**Задача:**  
Разработать функционал массового редактирования постов. Логика: ищем в базе полное совпадение по заданным критериям (текст, дата/время), вносим правки — применяем изменения ко всем найденным постам одним действием.

**Решение:**  
Реализован полноценный модуль массового редактирования с 4-шаговым wizard-интерфейсом и асинхронным бэкендом.

**Архитектура:**

```
Frontend (React + TypeScript)
  BulkEditModal → BulkEditSearchStep → BulkEditResultsStep → BulkEditProgressStep
  useBulkEdit (хук) — вся бизнес-логика
  bulk_edit.api.ts — HTTP-клиент (search, apply, polling)

Backend (FastAPI + Python)
  bulk_edit router → search_service → async_execution_service
                                       ├── DynamicWorkerPool (авто-масштабирование)
                                       └── distribution_service (ротация токенов)
  bulk_edit_crud — SQL-запросы к Post/ScheduledPost/SystemPost
  13 Pydantic-схем (bulk_edit.py)
```

**Шаг 1 — Поиск (BulkEditSearchStep):**
- Превью исходного поста (текст, изображения, дата)
- Критерии совпадения: **по тексту** и/или **по дате/времени** (AND-логика)
- Настройка «искать начиная с даты» (DatePicker)
- Выбор типов постов: опубликованные / отложенные / системные
- Выбор проектов: чеклист с «Выбрать все / Снять все»
- Поиск по 3 таблицам: `Post`, `ScheduledPost`, `SystemPost`

**Шаг 2 — Результаты (BulkEditResultsStep):**
- Список найденных постов с чекбоксами (проект, тип, дата, текст, миниатюры)
- Редактирование: текст (textarea), удаление изображений, изменение даты
- Бейджи «Изменён» / «Изменены» у изменённых полей
- Partial apply — отправляются **только** изменённые поля (`null` = не трогать)
- Модальное подтверждение перед применением

**Шаг 3 — Прогресс (BulkEditProgressStep):**
- Прогресс-бар с процентами (X из Y, Z%)
- Background Task + Polling (каждую секунду) через `GET /bulkEdit/status/{taskId}`
- Блокировка закрытия окна во время выполнения

**Шаг 4 — Завершение:**
- Иконка статуса (✅ / ⚠️ / ❌) + статистика (успешно / ошибок / всего)
- Список ошибок со ссылками на VK-посты (`vk.com/wall...`) и группы (`vk.com/club...`)
- Текст ошибки (капча, access denied и т.д.)

**Бэкенд — параллельная обработка:**
- Системные посты → параллельно через `DynamicWorkerPool` + `ThreadPoolExecutor`
- VK-посты → `wall.edit` через `publish_with_admin_priority` с ротацией токенов
- VK Semaphore(3) + задержка 0.35с между запросами (rate limiting)
- Жадный алгоритм распределения постов по токенам (минимизация используемых)

**Обработка ошибок VK API:**
- Code 14 (капча) — немедленный `return False`, не ретраится одним токеном, но пробует другие
- Code 5, 15, 17, 27 — невалидный/неавторизованный токен → ротация на следующий
- Code 210 — пост не найден → немедленный отказ
- Code 100 — ошибка параметров → немедленный отказ
- `PERMANENT_ERROR_CODES` в `api_client.py` — коды, при которых ретрай одним токеном бессмысленен

**DynamicWorkerPool (worker_pool.py):**
- Авто-масштабирование на основе нагрузки (load ≥ 80% → +2, load ≤ 30% → −2)
- Пул `bulk_edit`: min=2, max=15, initial=5 воркеров
- Cooldown 2–3 сек между масштабированиями
- Статистика: completed/failed, avg_time, scale_ups/downs

**Исправленные баги в процессе разработки:**
1. `IndentationError` — дубликат `if` в `bulk_edit_crud.py`
2. Исходный пост исключался из `matchedPosts` → исправлено в `search_service.py`
3. `ConfirmationModal` при закрытии — event bubbling через backdrop → вынесен в React Fragment
4. `task_monitor.update_task()` получал dict вместо string → исправлена сигнатура вызовов
5. `DynamicWorkerPool.acquire()` — `async with pool.acquire()` → `async with (await pool.acquire())`
6. `execute_bulk_edit_task_async` была sync-функцией с `asyncio.create_task()` → переделана в `async def` с `await`
7. Посты без назначенного токена тихо терялись → добавлена детекция и запись ошибки
8. Капча (code 14) вызывала 36+ минут зависания через 3 уровня ретраев → добавлена во все `PERMANENT_ERROR_CODES`
9. Ошибки отображались без текста (`err.message` вместо `err.error`) → исправлено

**Файл(ы):**
- Frontend: `features/posts/components/bulk-edit/BulkEditModal.tsx`, `BulkEditSearchStep.tsx`, `BulkEditResultsStep.tsx`, `BulkEditProgressStep.tsx`, `features/posts/hooks/useBulkEdit.ts`, `services/api/bulk_edit.api.ts`
- Backend: `backend_python/routers/bulk_edit.py`, `backend_python/services/bulk_edit/async_execution_service.py`, `backend_python/services/bulk_edit/search_service.py`, `backend_python/services/bulk_edit/distribution_service.py`, `backend_python/crud/bulk_edit_crud.py`, `backend_python/schemas/bulk_edit.py`, `backend_python/services/worker_pool.py`
- VK API: `backend_python/services/vk_api/api_client.py`, `backend_python/services/vk_api/token_manager.py`

---

### Уведомления (тосты) занимают весь экран

**Проблема:**  
При массовых операциях (удаление системных постов, обновление публикаций) всплывающие уведомления (тосты) растягиваются на весь экран, перекрывая интерфейс. Невозможно быстро закрыть все уведомления разом.

**Причина:**  
В `ToastProvider` не было ограничения на количество отображаемых уведомлений — все тосты рендерились одновременно. Также отсутствовала кнопка массового закрытия.

**Решение:**  
1. Ограничено количество видимых уведомлений до 5 последних (`MAX_VISIBLE_TOASTS = 5`)
2. Добавлена кнопка «Скрыть все (N)» — появляется при 2+ уведомлениях, закрывает все разом
3. Индикатор скрытых уведомлений «+N ещё...» при превышении лимита
4. Контейнер ограничен по высоте (`maxHeight: 60vh`)
5. Метод `removeAll()` добавлен в контекст и хук `useToast()`

**Файл(ы):** `shared/components/ToastProvider.tsx`

---

### Фоновые задачи не работают на предпроде (PostgreSQL vs SQLite)

**Проблема:**  
Фоновые задачи (синхронизация подписчиков, массовое редактирование, публикация постов) работают корректно в локальной среде разработки с SQLite, но на предпроде с PostgreSQL происходят сбои: потеря соединений, "SSL SYSCALL error", зависание задач.

**Причина:**  
1. **Обычный `sessionmaker`** создаёт сессии, которые не потокобезопасны. При параллельной обработке (ThreadPoolExecutor, BackgroundTasks) несколько потоков используют одну сессию, что вызывает коллизии.
2. **Отсутствие retry-логики** в критичных местах (task_monitor) — при временных сбоях соединения с PostgreSQL операция просто падает.
3. **Некорректное закрытие сессий** через `db.close()` вместо `SessionLocal.remove()` — thread-local ресурсы не освобождаются полностью.
4. **PostgreSQL в облаке** (Yandex Cloud) закрывает idle-соединения через 10-15 минут, что критично для долгих фоновых задач.

**Решение:**  
1. **Переход на `scoped_session`** в `database.py`:
   - `SessionLocal = scoped_session(sessionmaker(...))` — каждый поток получает свою изолированную сессию
   - `get_db()` использует `SessionLocal.remove()` для корректной очистки
   - Добавлен хелпер `get_background_session()` для фоновых задач

2. **Retry-логика в `task_monitor.py`**:
   - Новая функция `_db_operation_with_retry()` с 3 попытками и экспоненциальной задержкой (0.5s → 1s → 2s)
   - Все функции (`start_task`, `update_task`, `get_task_status`, `delete_task`) переписаны с использованием retry
   - Отдельная обработка `IntegrityError` (без retry, т.к. это логическая ошибка)
   - Корректное закрытие через `SessionLocal.remove()`

**Файлы:** 
- `backend_python/database.py`
- `backend_python/services/task_monitor.py`

---

### Динамический пул воркеров для массового редактирования

**Задача:**  
Ускорить массовое редактирование постов за счёт параллельной обработки с динамическим масштабированием количества воркеров.

**Решение:**  
Реализована система динамического пула воркеров с автоматическим масштабированием:

1. **Ядро системы (`worker_pool.py`):**
   - Класс `DynamicWorkerPool` с автоматическим масштабированием
   - Увеличение воркеров при нагрузке > 75%
   - Уменьшение при нагрузке < 25%
   - Настраиваемый rate limiting для VK API (3 req/sec по умолчанию)
   - Сбор статистики выполнения (время задач, количество scale up/down)
   - Cooldown между масштабированиями для предотвращения флуктуаций

2. **Асинхронный обработчик (`async_execution_service.py`):**
   - Параллельная обработка постов через `asyncio.gather`
   - Использование `ThreadPoolExecutor` для синхронных операций с БД
   - Интеграция с пулом воркеров через контекстный менеджер
   - Отдельный семафор для rate limiting VK API запросов

3. **API для управления воркерами:**
   - `GET /bulkEdit/workers/stats` — статистика всех пулов
   - `GET /bulkEdit/workers/bulk-edit` — детальная статистика пула bulk edit
   - `POST /bulkEdit/workers/scale?workers=N` — ручное масштабирование
   - `POST /bulkEdit/workers/reset-stats` — сброс статистики

4. **Обратная совместимость:**
   - Параметр `use_async=True` (по умолчанию) в `/bulkEdit/apply`
   - При `use_async=False` используется старая последовательная обработка

**Ожидаемое ускорение:** 5-10x для массовых операций (100+ постов)

**Файлы:**
- `backend_python/services/worker_pool.py` — ядро системы воркеров
- `backend_python/services/bulk_edit/async_execution_service.py` — асинхронный обработчик
- `backend_python/services/bulk_edit/__init__.py` — экспорт новых функций
- `backend_python/routers/bulk_edit.py` — эндпоинты управления воркерами

---

### Сдвиг времени при мультипроектной публикации

**Задача:**  
Добавить опцию "Сдвиг" при создании мультипроектной публикации. Позволяет задать интервал между публикациями в разных проектах.

**Решение:**  
Реализован полный функционал сдвига времени для мультипроектной публикации:

1. **UI-компоненты:**
   - Переключатель "Сдвиг по времени между проектами" (появляется при выборе 2+ проектов)
   - Поля настройки интервала: дни / часы / минуты (по умолчанию 0/0/10)
   - Drag-n-drop сортировка проектов для определения порядка публикации
   - Таблица с рассчитанным временем публикации для каждого проекта
   - Сводка в футере модалки: "Будут запланированы посты: Проект1 - 12:00, Проект2 - 12:10..."

2. **Логика:**
   - Первый проект публикуется в базовое время
   - Каждый следующий проект получает накопительный сдвиг: `baseTime + (shiftInterval × projectIndex)`
   - Порядок проектов можно менять перетаскиванием

3. **Важно:** Посты создаются как независимые записи в каждом проекте (без связи между собой). Удаление поста в одном проекте не затрагивает остальные.

**Файлы:**
- `features/posts/hooks/useBulkCreationManager.ts` — состояния сдвига и порядка проектов
- `features/posts/hooks/usePostForm.ts` — расширение экспорта
- `features/posts/hooks/usePostDetails.ts` — расчёт времени со сдвигом в `handleSave()`
- `features/posts/components/MultiProjectSelector.tsx` — DnD-интерфейс и настройки
- `features/posts/components/modals/PostDetailsModal.tsx` — передача пропсов и сводка
- `features/posts/components/modals/PostModalFooter.tsx` — отображение сводки

**Зависимости:** Установлен пакет `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

---

### Race condition при мультипроектной публикации (500 Internal Server Error)

**Проблема:**  
При сохранении мультипроектной публикации (со сдвигом времени или без) часть постов не создавалась. В логах бэкенда появлялись ошибки:
- `IllegalStateChangeError: Method 'close()' can't be called here; method 'commit()' is already in progress`
- `InvalidRequestError: Instance '<SystemPost>' is not persistent within this Session`

**Причина:**  
Фронтенд отправлял все запросы на сохранение постов параллельно через `Promise.allSettled()`. При одновременных запросах к SQLite возникал race condition на уровне SQLAlchemy сессий — несколько commit'ов пытались выполниться одновременно.

**Решение:**  
Заменено параллельное сохранение на **последовательное**:
- Теперь посты сохраняются один за другим с `await`
- Каждый запрос завершается полностью перед началом следующего
- Исправлен ID поста: теперь включает `projectIndex` для уникальности

**Файл:** `features/posts/hooks/usePostDetails.ts`

---

### DetachedInstanceError в модуле историй

**Проблема:**  
При обновлении списка историй (`/api/refreshStories`) возникала ошибка:
```
sqlalchemy.orm.exc.DetachedInstanceError: Instance <StoriesAutomationLog> is not bound to a Session; attribute refresh operation cannot proceed
```

**Причина:**  
Объекты `StoriesAutomationLog` загружались из БД, но при обращении к lazy-loaded атрибуту `log.log` объект уже был отсоединён от сессии SQLAlchemy (после других операций с БД).

**Решение:**  
Добавлена принудительная загрузка всех атрибутов объектов сразу после запроса к БД:
```python
for log in logs:
    _ = log.id
    _ = log.log  # Критически важно загрузить этот атрибут
    # ... и остальные атрибуты
```
Это гарантирует, что все данные загружены в память до того, как произойдут другие операции с БД.

**Файл:** `backend_python/services/automations/stories/retrieval.py`

---

### Удаление отложенных постов без приоритета админских токенов

**Проблема:**  
При удалении отложенных постов система перебирала все доступные токены, даже если токен не является админом группы. Это приводило к лишним неудачным попыткам и замедлению операции.

**Причина:**  
Функция `delete_scheduled_post` использовала `vk_service.call_vk_api()` (перебор всех токенов), в то время как `delete_published_post` уже использовала `call_vk_api_for_group()` с приоритетом админов.

**Решение:**  
Заменено `call_vk_api()` на `call_vk_api_for_group()` в функции `delete_scheduled_post`. Теперь обе функции удаления используют приоритет админских токенов группы.

**Файл:** `backend_python/services/post_actions/delete.py`

---

### Истории отображаются как архивные при загрузке страницы

**Проблема:**  
При входе в раздел "Статистика историй" (Автоматизация → Посты в истории) все истории отображались как "архивные". После нажатия кнопки "Обновить список" активные истории корректно отображались как активные.

**Причина:**  
Состояние `is_active` (активная/архивная история) не сохранялось в базе данных. При загрузке без параметра `refresh=True` значение `is_active` всегда устанавливалось в `False` (строка 117 в `retrieval.py`: `is_active = vk_story is not None if refresh else False`).

**Решение:**  
1. Добавлено поле `is_active` (Boolean) в модель `StoriesAutomationLog`
2. Создана миграция для добавления колонки в таблицу `stories_automation_logs`
3. Обновлена логика в `retrieval.py`:
   - При `refresh=True` — получаем актуальное состояние из VK API и сохраняем в базу
   - При `refresh=False` — берём сохранённое состояние из базы
   - Новые истории создаются с `is_active=True`

**Файлы:**
- `backend_python/models_library/automations.py` — добавлено поле `is_active`
- `backend_python/services/automations/stories/retrieval.py` — обновлена логика
- `backend_python/db_migrations/automations.py` — добавлена миграция

---

### Постинг через токены пользователей вместо токена сообщества

**Изменение:**  
Система публикации постов теперь работает через токены пользователей-администраторов, а не через токен сообщества.

**Что изменилось:**
- Публикация постов (scheduled, system posts) использует токены из `administered_groups.admins_data` и `system_accounts`
- Токен сообщества (`communityToken`) больше **не требуется** для работы планера и системных постов
- Приоритет токенов: сначала админ-токены из настроек группы, затем ENV-токен (`VK_USER_TOKEN`)

**Причина:**  
VK API не позволяет публиковать посты с вложениями (фото, видео), загруженными другим токеном. Токен сообщества не имеет доступа к медиа, загруженным пользователем.

**Файлы:**
- `backend_python/services/posting/publish.py` — `publish_with_admin_priority()`
- `backend_python/services/posting/admin_tokens.py` — `get_admin_tokens_for_group()`

---

### Инструкция по получению токена сообщества

**Задача:**  
Добавить в настройки проекта (вкладка "Интеграции") инструкцию для пользователей о том, как получить токен сообщества VK.

**Решение:**  
Добавлен информационный блок в секцию "Интеграции" с пошаговой инструкцией:
1. Описание где находится настройка в VK (Управление → Работа с API → Ключи доступа)
2. Динамическая ссылка на страницу настроек сообщества (`https://vk.com/{shortname}?act=tokens`)
3. Перечень необходимых прав доступа для токена

**Файл:** `features/projects/components/modals/settings/IntegrationsSection.tsx`

---

### Бесконечный цикл загрузки промокодов

**Проблема:**  
При входе в раздел "Промокоды" (вкладка Конкурс отзывов) происходил бесконечный цикл загрузки базы промокодов.

**Причина:**  
В хуке `usePromocodesManager.ts` функция `updateGlobalContestStatus` зависела от `reviewsContestStatuses` в массиве зависимостей `useCallback`. При каждом вызове `setReviewsContestStatuses` объект `reviewsContestStatuses` менялся, что вызывало пересоздание `updateGlobalContestStatus`, а это триггерило пересоздание `loadPromocodes`, который вызывался в `useEffect`.

**Решение:**  
Убрали `reviewsContestStatuses` из зависимостей `useCallback`, переместив логику получения `isActive` внутрь функционального обновления `setReviewsContestStatuses(prev => ...)`. Теперь `isActive` берётся из `prev[projectId]`, а не из внешней переменной.

**Файл:** `features/automations/reviews-contest/hooks/usePromocodesManager.ts`

---

### Статус промокодов не обновляется в сайдбаре

**Проблема:**  
При добавлении или удалении промокодов в разделе "Конкурс отзывов" статус в сайдбаре не обновлялся. Приходилось перезагружать страницу.

**Причина:**  
Хук `usePromocodesManager` управлял промокодами локально, но не синхронизировал изменения с глобальным контекстом `reviewsContestStatuses`, который использует `Sidebar` для отображения статуса конкурса.

**Решение:**  
1. Добавлен импорт `useProjects` в хук
2. Создана функция `updateGlobalContestStatus` для обновления глобального состояния
3. Вызов этой функции добавлен в `loadPromocodes`, `confirmDelete` и `confirmClearAll`

**Файл:** `features/automations/reviews-contest/hooks/usePromocodesManager.ts`

---
