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
