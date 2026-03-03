# 📋 Release Log 4 — Журнал релизов

Продолжение журнала релизов. Предыдущий файл: `release3.md`.

---

## 🔴 Открытые задачи

_(нет открытых задач)_

---

## ✅ Решённые задачи

### 502 Bad Gateway при загрузке историй (getCachedStories)

**Проблема:**  
Эндпоинт `/getCachedStories` возвращал 502 Bad Gateway на проектах с большим количеством историй (~31+). Ответ (~4.4 МБ) превышал лимит Yandex Cloud Serverless Containers (~3.5 МБ).

**Причина:**  
Функция `get_unified_stories` возвращала ВСЕ истории за один запрос без ограничений. При наличии viewers-данных размер JSON-ответа разрастался далеко за лимит платформы.

**Решение:**  
1. Добавлена пагинация в `get_unified_stories()` — параметры `limit` (default=50) и `offset` (default=0). Теперь возвращается `{items: [...], total: N, offset: 0, limit: 50}`.
2. Создан отдельный лёгкий эндпоинт `/getStoriesDashboardStats` (~1KB ответ) для агрегированной статистики дашборда. Считает views, clicks, likes, ctr, er и т.д. напрямую из БД без загрузки viewers-данных.
3. На фронтенде добавлена кнопка «Загрузить ещё» в таблице историй (infinite scroll).

**Файл(ы):**
- `backend_python/services/automations/stories/retrieval.py` — пагинация + `get_stories_dashboard_stats()`
- `backend_python/routers/stories_automation.py` — новый эндпоинт + payload
- `features/automations/stories-automation/hooks/useStoriesAutomation.ts` — пагинация + `loadDashboardStats()`
- `features/automations/stories-automation/components/table/StoriesTable.tsx` — кнопка «Загрузить ещё»
- `features/automations/stories-automation/components/dashboard/StoriesDashboard.tsx` — серверная статистика
- `features/automations/stories-automation/components/dashboard/useStoriesDashboard.ts` — серверная статистика

---

### AttributeError: stories_service.get_stories_dashboard_stats

**Проблема:**  
Новый эндпоинт `/getStoriesDashboardStats` падал с 500 Internal Server Error: `AttributeError: module 'services.automations.stories_service' has no attribute 'get_stories_dashboard_stats'`.

**Причина:**  
Функция `get_stories_dashboard_stats` была добавлена в `retrieval.py`, но не была реэкспортирована через `stories_service.py` — hub-модуль, через который роутер импортирует все функции.

**Решение:**  
Добавлен реэкспорт `get_stories_dashboard_stats` в `stories_service.py`:
```python
from .stories.retrieval import get_community_stories, get_story_preview, get_unified_stories, get_stories_dashboard_stats
```

**Файл(ы):** `backend_python/services/automations/stories_service.py`

---

### Данные по зрителям не загружались (viewers = 0)

**Проблема:**  
После внедрения пагинации блок «Уникальные зрители» показывал 0, хотя данные о зрителях были в БД.

**Причина:**  
При добавлении пагинации параметр `include_viewers` был установлен в `False` в эндпоинтах `getCachedStories` и `refreshStories`. Зрители не включались в ответ.

**Решение:**  
Возвращён `include_viewers=True` в обоих эндпоинтах.

**Файл(ы):** `backend_python/routers/stories_automation.py`

---

### 4x дублирующих вызова getStoriesDashboardStats

**Проблема:**  
При открытии вкладки «Статистика» эндпоинт `/getStoriesDashboardStats` вызывался 4 раза вместо 1.

**Причина:**  
`loadDashboardStats()` вызывался одновременно из:
1. `Promise.all` в `loadStoriesWithCancel` (useStoriesAutomation.ts)
2. useEffect в `useStoriesDashboard.ts` при монтировании (срабатывал при установке начальных фильтров)
3. После refresh (второй вызов из loadStoriesWithCancel)

**Решение:**  
Убраны дублирующие вызовы из `loadStoriesWithCancel`. Управление дашбордом теперь идёт исключительно из `useStoriesDashboard.ts` через его useEffect — один вызов при монтировании и один при смене фильтров.

**Файл(ы):** `features/automations/stories-automation/hooks/useStoriesAutomation.ts`

---

### TypeScript ошибки: showAppToast not on Window

**Проблема:**  
16 TS-ошибок `Property 'showAppToast' does not exist on type 'Window & typeof globalThis'` в `useStoriesAutomation.ts`.

**Причина:**  
Глобальное свойство `window.showAppToast` использовалось через `@ts-ignore` в `toastBridge.ts`, но типизация Window нигде не была расширена. В других файлах TypeScript не знал об этом свойстве.

**Решение:**  
Создан файл `global.d.ts` в корне проекта с расширением интерфейса Window:
```typescript
interface Window {
    showAppToast?: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
}
```

**Файл(ы):** `global.d.ts`

---

### Зрители не фильтровались по периоду и типу

**Проблема:**  
Блок «Уникальные зрители» (демография) не реагировал на изменение фильтров периода (за неделю, за месяц и т.д.) и типа публикации (все, ручные, авто). Показывал одни и те же данные при любых фильтрах.

**Причина:**  
`viewersStats` в `useStoriesDashboard.ts` рассчитывался из полного массива `stories` без учёта выбранных фильтров.

**Решение:**  
Добавлена клиентская фильтрация историй перед расчётом демографии:
1. Промежуточный `filteredStories` через `useMemo` — фильтрует по `story.date` (период) и `story.is_automated` (тип).
2. `viewersStats` теперь считается из `filteredStories` вместо `stories`.

**Файл(ы):** `features/automations/stories-automation/components/dashboard/useStoriesDashboard.ts`

---

### Серое мерцание карточек при смене периода

**Проблема:**  
При переключении периода все карточки статистики в дашборде на ~1 секунду становились серыми, что выглядело как недогруженный скелетон.

**Причина:**  
CSS-класс `opacity-60` применялся к grid-контейнеру при `isLoadingDashboard === true`, вызывая видимое затемнение всех карточек.

**Решение:**  
Убран `opacity-60 transition-opacity` при загрузке. Карточки остаются с текущими данными и плавно обновляются при получении ответа.

**Файл(ы):** `features/automations/stories-automation/components/dashboard/StoriesDashboard.tsx`

---

### Индикаторы и фильтры автоматизаций в сайдбаре

**Задача:**  
На вкладках «Посты в истории» и «Конкурс отзывов» в сайдбаре не было видно, где автоматизация включена, а где нет. Нужно было переключаться между проектами, чтобы проверить статус.

**Решение:**  
1. **Бэкенд:** В `getInitialData` добавлен массовый запрос `storiesAutomationStatuses: {projectId: bool}` из таблицы `stories_automations`. Возвращается вместе с проектами при загрузке.
2. **Фронтенд — контекст:** Новое глобальное состояние `storiesAutomationStatuses` в `ProjectsContext` (аналог `reviewsContestStatuses`).
3. **Фронтенд — индикаторы:** В `ProjectListItem` добавлен prop `storiesAutomationActive`. На вкладке «Посты в истории» справа от проекта отображается зелёная точка (включена) или серая точка (выключена).
4. **Фронтенд — фильтры:** На обеих вкладках автоматизаций добавлены фильтры «Все / Включены / Выключены»:
   - `automations-stories` — фильтр по `storiesAutomationStatuses[projectId]`
   - `automations-reviews-contest` — фильтр по `reviewsContestStatuses[projectId].isActive`
5. **Синхронизация:** При сохранении настроек в `useStoriesSettings` обновляется глобальный контекст — индикатор меняется мгновенно.

**Файл(ы):**
- `backend_python/services/project_service.py` — запрос `StoriesAutomation.is_active` для всех проектов
- `backend_python/schemas/api_responses.py` — поле `storiesAutomationStatuses: Dict[str, bool]`
- `services/api/project.api.ts` — обновлён тип `getInitialData`
- `contexts/hooks/useDataInitialization.ts` — `storiesAutomationStatuses` в `InitialDataState`
- `contexts/ProjectsContext.tsx` — новое состояние + setter
- `features/projects/types.ts` — типы `StoriesFilter`, `ContestFilter`
- `features/projects/components/Sidebar.tsx` — фильтры + передача статуса
- `features/projects/components/ProjectListItem.tsx` — индикатор зелёная/серая точка
- `features/automations/stories-automation/hooks/useStoriesSettings.ts` — синхронизация с контекстом

---

### Увеличено текстовое поле «Текст поста» в 1.5 раза

**Задача:**  
Текстовое поле для написания поста было слишком маленьким — при написании длинных текстов приходилось постоянно скроллить.

**Решение:**  
Увеличена начальная высота textarea в 1.5 раза: с 8 до 12 строк (и с 4 до 6 строк при открытом эмодзи-пикере). Поле по-прежнему поддерживает ручное изменение размера (`resize-y`).

**Файл(ы):** `features/posts/components/modals/PostTextSection.tsx`

---

### Кастомные пикеры даты и времени в мультипроектном расписании

**Задача:**  
В секции «Расписание публикации» (мультипроектная публикация) использовались стандартные браузерные `<input type="date">` и `<input type="time">`, которые выглядели инородно и некон систентно с остальным интерфейсом.

**Решение:**  
Заменены стандартные инпуты на кастомные компоненты `CustomDatePicker` (выпадающий календарь) и `CustomTimePicker` (скроллер часов/минут) из `shared/components/pickers/`. Теперь расписание мультипроекта визуально консистентно с основными полями даты/времени в модалке поста.

**Файл(ы):** `features/posts/components/MultiProjectSelector.tsx`

---

### Массовое редактирование: поиск не находил посты с VK-разметкой и некорректная дата начала поиска

**Проблема:**  
При поиске совпадающих постов в массовом редактировании посты не находились, даже если визуально текст был идентичным. Две причины:
1. Поиск по тексту использовал строгое побайтовое сравнение SQL `text == source_text`.
2. Дата начала поиска по умолчанию устанавливалась на «сегодня», из-за чего посты за предыдущие дни не попадали в выборку.

**Причина:**  
1. VK-разметка ссылок (`[урл|текст]`) содержит ID сообщества в URL — в разных проектах URL разный, поэтому строгое `==` не срабатывало.
2. Глобальные переменные (`{global_phone}`) в SystemPost хранятся как плейсхолдеры, а в опубликованных — уже подставленные значения.
3. VK API может модифицировать пробелы/переносы строк при возврате текста.
4. `searchFromDate` = сегодня, а исходный пост может быть от вчера — он не попадает в SQL-фильтр `date >= searchFromDate`.

**Решение:**  
1. Создана утилита `normalize_text_for_comparison()` в `backend_python/utils/text_normalize.py`:
   - Убирает VK-ссылки: `[https://url|текст]` → `текст`
   - Убирает упоминания: `[club123|текст]` → `текст`, `@club123 (текст)` → `текст`
   - Удаляет глобальные переменные: `{global_phone}` → пусто
   - Нормализует пробелы и переносы строк
2. В `bulk_edit_crud.py` SQL-фильтр `text == source_text` заменён на Python-фильтрацию по нормализованному тексту для всех 3 типов постов.
3. Дата начала поиска по умолчанию теперь = дата исходного поста (вместо «сегодня»).

**Файл(ы):**
- `backend_python/utils/text_normalize.py` — новая утилита нормализации текста
- `backend_python/crud/bulk_edit_crud.py` — нормализованное сравнение вместо строгого `==`
- `features/posts/hooks/useBulkEdit.ts` — дата начала поиска = дата поста

---

### Загрузка и прикрепление видео к постам

**Задача:**  
При создании и редактировании поста можно было прикреплять только фотографии. Видео нужно было загружать отдельно через VK.

**Решение:**  

**Бэкенд (VK API):**
1. Реализована функция `upload_video()` в `upload.py` — двухшаговый процесс:
   - Шаг 1: `video.save` (получение `upload_url`, `video_id`, `owner_id`)
   - Шаг 2: POST файла на `upload_url`
   - Шаг 3 (опциональный): `video.get` с 3 ретраями (задержка 2с) для получения `thumbnail_url` и `player_url` (VK обрабатывает видео асинхронно)
2. Сервис `media_service.py` — бизнес-логика: определение `group_id` по `project_id`, вызов VK API, формирование `Attachment` с метаданными.
3. Эндпоинт `POST /api/media/uploadVideo` — принимает `UploadFile` + `projectId`, возвращает `Attachment`.

**Бэкенд (парсинг постов):**
4. В `formatters.py` функция `_extract_other_attachments()` теперь извлекает `thumbnail_url` из массива `image[]` видео-объекта VK API (берётся самый большой размер) и `player_url` из поля `player`.

**Фронтенд (API):**
5. Функция `uploadVideo()` в `media.api.ts` — таймаут 5 минут (300с), retry-логика.

**Фронтенд (UI — загрузка):**
6. В `PostMediaSection.tsx` добавлены:
   - Кнопка «Видео» рядом с «Загрузить» (фото)
   - Поддержка DnD видеофайлов (`.mp4`, `.avi`, `.mov`, `.wmv`, `.flv`, `.mkv`, `.webm`)
   - Визуальная карточка загрузки с пульсирующей миниатюрой и анимированным indeterminate прогресс-баром
   - Карточка ошибки с описанием проблемы
   - Ограничение: 256 МБ максимальный размер файла

**Фронтенд (UI — отображение):**
7. `AttachmentsDisplay.tsx` (модалка редактирования) — добавлен `VideoAttachmentCard` с превью 80×56px, иконкой Play, фолбэком на серую заглушку.
8. `postcard/Attachments.tsx` (карточка в календаре) — `VideoThumbnail` с превью на всю ширину (aspect-ratio 16:9), Play-иконкой и названием на градиентной плашке.
9. `PostPreview.tsx` (предпросмотр) — видео-вложение с превью на всю ширину (aspect-ratio 16:9), Play-иконкой и названием на градиентной плашке.

**Схемы:**
10. Pydantic `Attachment` и TypeScript `Attachment` расширены полями `thumbnail_url` и `player_url`.

**CSS:**
11. Добавлена анимация `@keyframes indeterminate` для прогресс-бара загрузки.

**Файл(ы):**
- `backend_python/services/vk_api/upload.py` — функция `upload_video()`
- `backend_python/services/media_service.py` — сервис `upload_video()`
- `backend_python/routers/media.py` — эндпоинт `POST /uploadVideo`
- `backend_python/services/vk_service.py` — реэкспорт `upload_video`
- `backend_python/schemas/models/media.py` — расширение `Attachment`
- `backend_python/services/vk_api/formatters.py` — извлечение `thumbnail_url`/`player_url` при парсинге постов
- `services/api/media.api.ts` — функция `uploadVideo()`
- `shared/types/index.ts` — расширение типа `Attachment`
- `features/posts/components/modals/PostMediaSection.tsx` — кнопка видео, DnD, индикатор загрузки
- `features/posts/components/AttachmentsDisplay.tsx` — `VideoAttachmentCard`
- `features/posts/components/postcard/Attachments.tsx` — `VideoThumbnail`
- `features/posts/components/modals/PostPreview.tsx` — превью видео
- `index.html` — анимация `@keyframes indeterminate`

---

### Ошибка 400 при ручной публикации истории (manualPublishStory)

**Проблема:**  
При ручной публикации истории через `manualPublishStory` возвращалась ошибка `400 Bad Request: VK Error: Group authorization failed: method is unavailable with group auth.`

**Причина:**  
В роутере `stories_automation.py` метод `wall.getById` вызывался с токеном сообщества (`community_tokens[0]`), если такой был доступен. На локальном хосте в SQLite-базе у проекта имелся community-токен, и он использовался для вызова `wall.getById`, который не поддерживает авторизацию сообщества.

**Решение:**  
`wall.getById` теперь всегда вызывается с `user_token` (ENV-токен), а не с токеном сообщества. Токен сообщества по-прежнему используется для шагов, где он допустим.

**Файл(ы):** `backend_python/routers/stories_automation.py`

---

### Зрители: 16 ошибок «story not found» тратили время впустую

**Проблема:**  
При обновлении зрителей историй система пыталась получить данные по удалённым/истёкшим историям. VK возвращал `Error 100: story not found` — по 16 ошибок за цикл. Каждая ошибка перебирала все доступные токены, что удваивало время обработки (27с → 14с после фикса).

**Причина:**  
VK Error 100 (story not found) не был добавлен в список перманентных ошибок. Система не финализировала `viewers_finalized` для удалённых историй — они продолжали попадать в каждый цикл обновления.

**Решение:**  
1. В `viewers_parallel.py` добавлена обработка `error_code == 100` — немедленный возврат вместо перебора всех токенов.
2. В `viewers.py` добавлен `error_code 100` в массив `permanent_errors = [5, 15, 100, 204, 212]`.
3. В `viewers.py` в обоих путях (параллельный и последовательный) при ошибке «VK Error 100» устанавливается `viewers_finalized = True`, чтобы история больше не попадала в выборку.

**Результат:** 36 историй → 20, 27с → 14с, 16 ошибок → 0.

**Файл(ы):**
- `backend_python/services/automations/stories/viewers_parallel.py`
- `backend_python/services/automations/stories/viewers.py`

---

### Аватарки зрителей не отображались корректно в таблице

**Проблема:**  
В таблице зрителей аватарка и имя пользователя были разнесены по разным столбцам. Аватарка находилась в узкой колонке без заголовка (w-12), а имя — в отдельном столбце «Пользователь», что визуально разрывало информацию.

**Причина:**  
В `ViewersPanel.tsx` были два отдельных `<td>`: один для аватарки, другой для имени/ссылки. Заголовок таблицы содержал пустой `<th>` для аватарки.

**Решение:**  
Аватар и имя объединены в одну ячейку «Пользователь» через `flex`-контейнер. Удалён пустой `<th>`. Аватар получил `flex-shrink-0`, а имя — `min-w-0` для корректного обрезания длинных имён.

**Файл(ы):** `features/automations/stories-automation/components/table/ViewersPanel.tsx`

---

### Перенос демографии зрителей с клиента на сервер

**Задача:**  
Демография зрителей (пол, возраст, города, платформы, членство) рассчитывалась на фронтенде через `useMemo`, парсила JSON-поле `viewers` из каждой истории. При пагинации данные пересчитывались при каждой подгрузке батча (10+ раз), что замедляло интерфейс и показывало промежуточные данные.

**Решение:**  

**Бэкенд:**
1. В `get_stories_dashboard_stats()` добавлена агрегация `demographics`:
   - Парсит JSON-поле `viewers` из каждого лога
   - Дедуплицирует зрителей по `user_id` (key set)
   - Агрегирует: `gender` (male/female/unknown), `ageGroups` (до 18, 18-24, 25-34, 35-44, 45-54, 55+), `topCities` (топ-20), `platform` (mobile/desktop/unknown), `membership` (member/notMember/unknown)
   - Поля `uniqueCount`, `gender`, `membership`, `platform`, `topCities`, `ageGroups`
   - Фильтрация по периоду и типу публикации применяется ДО агрегации

**Фронтенд (6 файлов):**
2. `useStoriesDashboard.ts` (dashboard) — убрано ~80 строк клиентского `useMemo` для расчёта демографии. Теперь читает из prop `demographics`.
3. `StoriesDashboard.tsx` — убраны props `stories` и `getCount`, передаётся `dashboardStats?.demographics` в хук.
4. `StoriesStatsView.tsx` — убран prop `getCount`, обновлён тип `ServerDashboardStats` с полем `demographics?: ViewersStats`.
5. `StoriesAutomationPage.tsx` — убрана передача `getCount` в `StoriesStatsView`.
6. `useStoriesDashboard.ts` (hooks) — обновлён тип `ServerDashboardStats` с полем `demographics`.

**Результат:** Демография считается один раз на сервере по ВСЕМ историям с учётом фильтров, а не пересчитывается на клиенте при каждой подгрузке батча.

**Файл(ы):**
- `backend_python/services/automations/stories/retrieval.py` → `retrieval_dashboard.py` (функция `_aggregate_demographics`)
- `features/automations/stories-automation/components/dashboard/useStoriesDashboard.ts`
- `features/automations/stories-automation/components/dashboard/StoriesDashboard.tsx`
- `features/automations/stories-automation/components/StoriesStatsView.tsx`
- `features/automations/stories-automation/StoriesAutomationPage.tsx`
- `features/automations/stories-automation/hooks/useStoriesDashboard.ts`

---

### Рефакторинг retrieval.py — хаб-архитектура

**Задача:**  
Файл `retrieval.py` разросся до 671 строк, совмещая три разные зоны ответственности: утилиты, загрузку/синхронизацию историй из VK и агрегацию статистики дашборда. Это затрудняло навигацию и поддержку.

**Решение:**  
`retrieval.py` (671 строк) превращён в хаб-модуль (~20 строк), а логика разнесена по трём подмодулям:

1. **`retrieval_helpers.py`** (~35 строк) — утилиты:
   - `get_story_preview(story)` — извлечение URL превью из VK story object
   - `extract_story_id_from_log(log_json_str)` — извлечение vk_story_id из JSON-лога

2. **`retrieval_unified.py`** (~320 строк) — загрузка и синхронизация:
   - `get_unified_stories()` — основная функция с пагинацией, VK-sync, self-healing
   - `get_community_stories()` — deprecated-алиас
   - 12 приватных хелперов: `_fetch_active_stories_from_vk`, `_create_manual_story_log`, `_determine_activity_status`, `_extract_story_data`, `_get_date_from_log`, `_recover_preview_from_log`, `_recover_preview_from_post`, `_heal_log_preview`, `_extract_stats`, `_extract_viewers`, `_rescue_missing_previews`, `_commit_updates`, `_update_last_stories_timestamp`

3. **`retrieval_dashboard.py`** (~280 строк) — статистика дашборда:
   - `get_stories_dashboard_stats()` — агрегированная статистика + demographics
   - 5 приватных хелперов: `_apply_type_filter`, `_apply_period_filter`, `_get_count`, `_aggregate_stats`, `_aggregate_demographics`

4. **`retrieval.py`** (~20 строк) — хаб реэкспорта:
   ```python
   from .retrieval_helpers import get_story_preview, extract_story_id_from_log
   from .retrieval_unified import get_unified_stories, get_community_stories
   from .retrieval_dashboard import get_stories_dashboard_stats
   ```

**Внешний контракт не изменён:** импорт `from .stories.retrieval import ...` в `stories_service.py` работает без изменений.

**Файл(ы):**
- `backend_python/services/automations/stories/retrieval.py` — хаб (было 671 строк → 20)
- `backend_python/services/automations/stories/retrieval_helpers.py` — новый (~35 строк)
- `backend_python/services/automations/stories/retrieval_unified.py` — новый (~320 строк)
- `backend_python/services/automations/stories/retrieval_dashboard.py` — новый (~280 строк)

---

### Прямая публикация VK-историй (фото + видео)

**Задача:**  
Реализовать возможность публикации фото- и видео-историй ВКонтакте напрямую из приложения, без перехода на VK. Поддержка одиночного и мультипроектного режимов.

**Решение:**  

**Бэкенд:**
1. В `upload.py` уже были функции `upload_story()` (фото) и `upload_video_story()` (видео) — 3-шаговая атомарная цепочка: `stories.getPhotoUploadServer` / `stories.getVideoUploadServer` → POST файла на `upload_url` → `stories.save`. Пользовательский (standalone) токен обязателен на всех шагах.
2. Создан эндпоинт `POST /publishDirectStory` в `stories_automation.py` — принимает `multipart/form-data` (file + projectId + linkText? + linkUrl?). Определяет тип файла по MIME, вызывает `upload_story()` или `upload_video_story()`, возвращает `DirectStoryResult` (story_link, story_id, owner_id).
3. Создан `DirectStoryResult` в `schemas/` — pydantic-модель результата публикации.

**Фронтенд:**
4. Создан `services/api/storyPublish.api.ts` — функции `publishDirectStory()` и `publishDirectStoryMulti()`.
5. Создан хук `useStoryCreator()` в `hooks/useStoryCreator.ts` — управление состоянием: файл, ссылка, мультипроект, валидация, публикация, статусы.
6. Создан компонент `StoryCreatorView.tsx` — UI для загрузки файла, настройки ссылки, выбора проектов, отображения результатов.
7. Интегрирован в `StoriesAutomationPage.tsx` как вкладка «Создать историю».

**Файл(ы):**
- `backend_python/services/vk_api/upload.py` — `upload_story()`, `upload_video_story()`
- `backend_python/routers/stories_automation.py` — `POST /publishDirectStory`
- `backend_python/services/vk_service.py` — реэкспорт
- `services/api/storyPublish.api.ts` — API-функции фронтенда
- `features/automations/stories-automation/hooks/useStoryCreator.ts` — хук
- `features/automations/stories-automation/components/StoryCreatorView.tsx` — UI-компонент
- `features/automations/stories-automation/StoriesAutomationPage.tsx` — вкладка «Создать историю»

---

### Параллельная мультипроектная публикация историй

**Проблема:**  
При публикации истории в несколько проектов фронтенд отправлял N отдельных HTTP-запросов, каждый с копией файла. Истории публиковались последовательно — медленно и нагружало сеть.

**Причина:**  
Фронтенд в цикле вызывал `publishDirectStory()` для каждого проекта отдельно. Файл передавался N раз.

**Решение:**  
1. Создан новый бэкенд-эндпоинт `POST /publishDirectStoryMulti` — принимает файл **один раз** + JSON-массив `project_ids`.
2. Бэкенд использует `asyncio.gather` + `asyncio.to_thread` для параллельной публикации с задержкой 500мс между запусками (stagger) и 2 ретраями при ошибке.
3. Вспомогательная синхронная функция `_publish_story_for_group_sync()` выполняет полный цикл для одного проекта: получение токенов → определение типа файла → вызов `upload_story()` / `upload_video_story()` → формирование результата.
4. Ответ: `{ results: [...], total, success_count, error_count }`.
5. Фронтенд обновлён: `publishDirectStoryMulti()` отправляет файл один раз, хук маппит результаты на статусы.

**Файл(ы):**
- `backend_python/routers/stories_automation.py` — `POST /publishDirectStoryMulti`, `_publish_story_for_group_sync()`
- `services/api/storyPublish.api.ts` — `publishDirectStoryMulti()`
- `features/automations/stories-automation/hooks/useStoryCreator.ts` — мультипроектная логика

---

### Клиентская валидация файлов для VK Stories

**Задача:**  
Добавить проверку файлов на стороне клиента до отправки на сервер, чтобы пользователь сразу видел ошибку, если файл не соответствует требованиям VK.

**Решение:**  
1. В хуке `useStoryCreator.ts` реализованы функции `validatePhoto()` и `validateVideo()`:
   - **Фото:** формат (JPG, PNG, GIF), размер ≤ 10 МБ, сумма сторон ≤ 14 000 px (проверка через `new Image()`)
   - **Видео:** формат (MP4, MOV, AVI, WebM), разрешение ≤ 720×1280 (проверка через `<video>` элемент)
2. Валидация запускается асинхронно при выборе файла. Во время проверки показывается индикатор «Проверка файла...» (спиннер + текст).
3. При ошибке отображается красный баннер с описанием проблемы и требованиями VK. Кнопка «Опубликовать» блокируется при наличии ошибки валидации или во время проверки.

**Файл(ы):**
- `features/automations/stories-automation/hooks/useStoryCreator.ts` — `validatePhoto()`, `validateVideo()`, `isValidating`, `validationError`
- `features/automations/stories-automation/components/StoryCreatorView.tsx` → `story-creator/StoryFileUpload.tsx` — UI индикаторов

---

### Кастомный дропдаун текста кнопки-ссылки (LinkTextDropdown)

**Задача:**  
Заменить стандартный нативный `<select>` для выбора текста кнопки-ссылки на кастомный дропдаун, консистентный с UI-китом приложения.

**Решение:**  
Создан компонент `LinkTextDropdown`:
- Рендерится через `createPortal` в `document.body` (исключает обрезание overflow)
- Позиционируется через `getBoundingClientRect()` с динамическим обновлением при scroll/resize
- Закрывается при клике вне (mousedown listener)
- 21 опция текста (от «Без ссылки» до «Голосовать»)
- Стилизован с подсветкой выбранного пункта и плавной анимацией chevron

**Файл(ы):** `features/automations/stories-automation/components/story-creator/StoryLinkParams.tsx` (включает `LinkTextDropdown`)

---

### Рефакторинг StoryCreatorView.tsx — хаб-архитектура

**Задача:**  
Файл `StoryCreatorView.tsx` разросся до 611 строк, содержа основной компонент + 3 вспомогательных компонента (StoryProjectSelector, PublishStatusRow, LinkTextDropdown) + константы. Затруднял навигацию и поддержку.

**Решение:**  
`StoryCreatorView.tsx` (611 строк) превращён в хаб-компонент (~95 строк), логика разнесена по 6 файлам в подпапке `story-creator/`:

1. **`constants.ts`** — `LINK_TEXT_OPTIONS` (21 опция), `ACCEPTED_PHOTO`, `ACCEPTED_VIDEO`, `ACCEPTED_ALL`
2. **`StoryFileUpload.tsx`** (~163 строк) — загрузка файла: drag-drop зона, превью фото/видео, бейдж типа, кнопка удаления, индикатор валидации, ошибка валидации с требованиями VK
3. **`StoryLinkParams.tsx`** (~160 строк) — параметры ссылки: `LinkTextDropdown` (portal-based, position tracking, click-outside) + поле URL + предупреждение
4. **`StoryMultiProject.tsx`** (~160 строк) — мультипроектный режим: toggle-переключатель + `StoryProjectSelector` (поиск, выбрать/снять все, чекбокс-список)
5. **`StoryPublishResults.tsx`** (~90 строк) — результаты публикации: `PublishStatusRow` (иконки статуса, ссылка на историю, ошибка)
6. **`StoryPublishButton.tsx`** (~75 строк) — кнопка публикации + «Создать ещё»

**Внешний контракт не изменён:** имя `StoryCreatorView`, props (`projectId`), импорт в `StoriesAutomationPage.tsx` — всё осталось без изменений.

**Файл(ы):**
- `features/automations/stories-automation/components/StoryCreatorView.tsx` — хаб (было 611 строк → ~95)
- `features/automations/stories-automation/components/story-creator/constants.ts`
- `features/automations/stories-automation/components/story-creator/StoryFileUpload.tsx`
- `features/automations/stories-automation/components/story-creator/StoryLinkParams.tsx`
- `features/automations/stories-automation/components/story-creator/StoryMultiProject.tsx`
- `features/automations/stories-automation/components/story-creator/StoryPublishResults.tsx`
- `features/automations/stories-automation/components/story-creator/StoryPublishButton.tsx`

---

### Мультипроектная перезагрузка медиа: retry/fallback защита

**Проблема:**  
При мультипроектной публикации поста с медиа (фото/видео) — если перезагрузка медиа для 2-3 из 10 проектов падала — пользователь не знал, какие проекты провалились. Нельзя было повторить только для упавших. Дополнительный риск: контейнер в Yandex Cloud живёт 10 минут — если загрузка 10+ видео превышала лимит, контейнер падал с потерей всех данных.

**Причина:**  
- Бэкенд: эндпоинт `reuploadForProjects` запускал все проекты через `asyncio.gather` без общего time budget и per-project timeout. Ошибки возвращались как строковый массив `errors: string[]`.
- Фронтенд: `handleSave` кидал общий throw при провале перезагрузки, не различая частичные и полные ошибки. Не сохранял исходный проект первым.

**Решение:**  

**Бэкенд (`media.py`):**
1. Time budget `TIME_BUDGET_SECONDS = 480` (8 из 10 мин жизни контейнера) — автоматический пропуск проектов при исчерпании.
2. Per-project timeout `PER_PROJECT_MAX_TIMEOUT = 300` через `asyncio.wait_for` — один «зависший» проект не убивает остальные.
3. `MIN_REMAINING_FOR_START = 30` — не начинаем новый проект, если осталось < 30 сек.
4. Структурированный ответ `failed: [{project_id, error}]` вместо строкового массива.
5. Ошибки resolve (project_id → group_id) добавляются в `resolve_failed` без HTTPException.

**Фронтенд (`usePostDetails.ts`):**
1. **Исходный проект сохраняется ПЕРВЫМ** (без перезагрузки) — защита от потери данных при падении контейнера.
2. Утилита `savePostsForProjects()` выделена для переиспользования в save и retry.
3. При частичном провале — `reuploadRetryInfo` state хранит упавшие проекты + успешные.
4. `handleRetryReupload()` — повторная загрузка только для упавших проектов.
5. `handleSkipFailedReupload()` — пропуск с сохранением уже готовых.
6. `ConfirmationModal` в `PostDetailsModal.tsx` — UI: выбор «Повторить» / «Пропустить», спиннер при retry.

**Фронтенд (`media.api.ts`):**
- Тип `ReuploadFailedProject {project_id: string; error: string}`.
- `ReuploadForProjectsResponse.failed` вместо `errors`.

**Файл(ы):**
- `backend_python/routers/media.py` — time budget, per-project timeout, структурированный failed[]
- `services/api/media.api.ts` — типы ReuploadFailedProject, ReuploadForProjectsResponse
- `features/posts/hooks/usePostDetails.ts` — savePostsForProjects, handleSave rewrite, handleRetryReupload, handleSkipFailedReupload, retry state
- `features/posts/components/modals/PostDetailsModal.tsx` — деструктуризация retry state/actions, ConfirmationModal retry UI

---

### Зависание сервера при загрузке видео (отсутствие таймаута)

**Проблема:**  
Сервер зависал навсегда на этапе `uploading file...` после `video.save OK`. Процесс не завершался и не падал — бесконечное ожидание.

**Причина:**  
Все 6 вызовов `requests.post(upload_url, files=files)` в `upload.py` были **без параметра `timeout`**. По умолчанию `requests` ждёт бесконечно. Если VK upload-сервер не отвечал или зависал на приёме файла, Python-поток блокировался навсегда.

**Решение:**  
Добавлен `timeout` ко всем 6 вызовам `requests.post` в `upload.py`:
- **Фото** (4 вызова): `timeout=60` (1 минута) — фото маленькие, 60 сек достаточно.
- **Видео** (2 вызова): `timeout=300` (5 минут) — видео тяжёлые, но 5 мин — разумный лимит.
При превышении таймаута выбрасывается `requests.exceptions.ReadTimeout`, код переходит к следующему токену или возвращает ошибку.

**Файл(ы):** `backend_python/services/vk_api/upload.py` (строки 43, 112, 209, 314, 387, 484)

---

### Кнопка отмены загрузки видео в окне редактирования поста

**Проблема:**  
Когда видео загружалось долго, пользователь не мог отменить загрузку. Карточка «Загрузка видео… Отправка файла в ВК» висела без возможности прервать процесс.

**Причина:**  
`AbortController` в `uploadVideo()` использовался только для таймаута (5 мин), не экспонировался наружу. В UI не было никакого элемента для отмены.

**Решение:**  

**API (`media.api.ts`):**
- `uploadVideo()` теперь принимает опциональный `externalSignal?: AbortSignal`.
- Внешний signal комбинируется с таймают-контроллером через `addEventListener('abort')`.
- При отмене пользователем — retry-попытки не запускаются, сразу выбрасывается ошибка.

**UI (`PostMediaSection.tsx`):**
- `videoUploadAbortRef = useRef<AbortController | null>(null)` — хранит контроллер текущей загрузки.
- При старте `uploadVideoFile()` создаётся `new AbortController()`, передаётся в `api.uploadVideo()`.
- `cancelVideoUpload()` вызывает `abort()` — fetch мгновенно прерывается.
- В карточке загрузки добавлена кнопка ✕ (крестик) справа от прогресс-бара: при наведении подсвечивается красным.
- При отмене карточка исчезает без показа ошибки (отмена ≠ ошибка).

**Файл(ы):**
- `services/api/media.api.ts` — externalSignal параметр, комбинированный abort
- `features/posts/components/modals/PostMediaSection.tsx` — videoUploadAbortRef, cancelVideoUpload, кнопка ✕

---

### Рефакторинг stories_automation.py в модульную хаб-архитектуру

**Задача:**  
Файл `routers/stories_automation.py` (893 строки) содержал все 16 эндпоинтов автоматизации историй в одном файле — настройки, загрузка, статистика, публикация. Код дублировался (парсинг VK-ответов копировался 3 раза, резолв логов — 3 раза).

**Решение:**  
Файл разбит на хаб (~40 строк) + 5 подроутеров + общий модуль схем + модуль зависимостей:

1. **`routers/stories/__init__.py`** — модуль
2. **`routers/stories/schemas.py`** (~50 строк) — 7 Pydantic-схем: `StoriesAutomationSchema`, `GetPayload`, `DashboardStatsPayload`, `UpdatePayload`, `ManualPublishPayload`, `UpdateStatsPayload`, `StoriesFreshnessResponse`
3. **`routers/stories/dependencies.py`** (~120 строк) — общие зависимости: `get_db()`, `get_community_tokens()`, `get_user_token()`, `find_or_create_log_by_story_link()`, `resolve_logs_by_mode()` (убрана тройная дупликация), `parse_vk_story_response()` (убрана двойная дупликация)
4. **`routers/stories/settings_routes.py`** — 4 эндпоинта: getStoriesFreshness, getStoriesAutomation, getStoriesAutomationLogs, updateStoriesAutomation
5. **`routers/stories/retrieval_routes.py`** — 5 эндпоинтов: getUnifiedStories, getCachedStories, refreshStories, getStoriesDashboardStats, getCommunityStories
6. **`routers/stories/stats_routes.py`** — 4 эндпоинта: getStoriesStats, updateStoriesStats, updateStoriesViewers, updateStoriesAll (дедупликация через `resolve_logs_by_mode`)
7. **`routers/stories/publish_routes.py`** — 2 эндпоинта: manualPublishStory, publishDirectStory
8. **`routers/stories/multi_publish_routes.py`** — 1 эндпоинт: publishDirectStoryMulti + хелпер `_publish_story_for_group_sync`

**Внешний контракт не изменён:** `main.py` по-прежнему импортирует `stories_automation.router` с prefix `/api`. Все 16 эндпоинтов зарегистрированы корректно.

**Файл(ы):**
- `backend_python/routers/stories_automation.py` — хаб (~40 строк)
- `backend_python/routers/stories/__init__.py`
- `backend_python/routers/stories/schemas.py`
- `backend_python/routers/stories/dependencies.py`
- `backend_python/routers/stories/settings_routes.py`
- `backend_python/routers/stories/retrieval_routes.py`
- `backend_python/routers/stories/stats_routes.py`
- `backend_python/routers/stories/publish_routes.py`
- `backend_python/routers/stories/multi_publish_routes.py`

---

### Видео-истории не отображались (показывали «Нет изображения»)

**Проблема:**  
При просмотре видео-историй в модальном окне просмотра (`StoryViewerModal`) показывалось «Нет изображения», хотя история содержала видео. В таблице историй не было индикатора, что история — видео.

**Причина:**  
1. Бэкенд: `get_story_preview()` не обрабатывал видеоистории — не извлекал `first_frame` (превью кадр) из VK API.
2. Бэкенд: `video_url` не возвращался в API-ответе.
3. Фронтенд: `StoryViewerModal` не имел ветки рендеринга для видеоисторий.
4. Фронтенд: `StoryRow` не показывал иконку видео.

**Решение:**  
1. **Бэкенд (`retrieval_helpers.py`):** `get_story_preview()` расширен fallback-цепочкой для видео: `first_frame_1080` → `first_frame_604` → `first_frame_130` → `photo_130` → `preview` → любое значение с 'http'.
2. **Бэкенд (`retrieval_helpers.py`):** Новая функция `get_story_video_url()` — извлекает URL видео из `story['video']`.
3. **Бэкенд (`retrieval_unified.py`):** В ответ API добавлены поля `video_url` и `type` из VK-данных.
4. **Фронтенд (`StoryViewerModal.tsx`):** Добавлен оверлей для видео-историй: бейдж «ВИДЕОИСТОРИЯ», иконка Play, кнопка «Смотреть в VK», пояснительный текст.
5. **Фронтенд (`StoryRow.tsx`):** Видео-истории в таблице показывают иконку ▶ на превью.
6. **Фронтенд:** `video_url: string | null` добавлен в типы `UnifiedStory`.

**Файл(ы):**
- `backend_python/services/automations/stories/retrieval_helpers.py` — `get_story_preview()` fallbacks, `get_story_video_url()`
- `backend_python/services/automations/stories/retrieval_unified.py` — `video_url`, `type` в API-ответе
- `features/schedule/components/StoryViewerModal.tsx` — оверлей видео
- `features/automations/stories-automation/components/table/StoryRow.tsx` — иконка ▶
- `shared/types/index.ts` — `video_url` в UnifiedStory
- `features/automations/stories-automation/types.ts` — `video_url` в UnifiedStory

---

### Истории не синхронизировались вместе с постами (5 пробелов)

**Проблема:**  
Истории (stories) не подтягивались при большинстве операций обновления данных:
1. Кнопка «Глобальное обновление расписания» обновляла только посты (scheduled + published), но НЕ stories.
2. При переключении на проект (`syncDataForProject`) бэкенд возвращал `allStories` в ответе, но фронтенд НЕ деструктурировал и НЕ записывал их в состояние.
3. Проверка свежести данных (`getProjectUpdateStatus`) не содержала поля `staleStories` — stories вообще не проверялись на устаревание.
4. Полное обновление проектов (`handleForceRefreshProjects`) мержило батчи постов, но игнорировало `allStories` из ответа.
5. Ручное обновление проекта из сайдбара (`handleRefreshForSidebar`) вызывало refresh для scheduled + published + notes, но НЕ для stories.

**Причина:**  
Stories были добавлены как контент-тип позже остальных и не были подключены ко всем существующим потокам обновления данных. Они работали только при нажатии «Обновить всё» внутри страницы расписания (`handleRefreshAllSchedule`), где `handleRefreshStories` уже был подключен.

**Решение:**  
6 точечных правок, подключающих stories ко всем потокам по аналогии с постами:

1. **Бэкенд — `project_service.py`:** В `refresh_all_projects_task` для вида `schedule` добавлен вызов `get_unified_stories(refresh=True)` с try/except (ошибка stories не ломает обновление постов).
2. **Бэкенд — `post_crud.py`:** В `get_project_update_status` добавлено поле `staleStories` с порогом **6 часов** (вместо 12ч у постов, т.к. stories живут 24ч). Используется поле `Project.last_stories_update`.
3. **Фронтенд — `useDataRefreshers.ts` → `syncDataForProject`:** Деструктурируется `allStories` из ответа `getAllPostsForProjects` и записывается в `setAllStories`.
4. **Фронтенд — `useDataRefreshers.ts` → `handleForceRefreshProjects`:** При батч-загрузке мержатся `allStories` и записываются через `setAllStories(mergedStories)`.
5. **Фронтенд — `useDataRefreshers.ts` → `handleRefreshForSidebar`:** Для вида `schedule` добавлен `handleRefreshStories(projectId)` в массив параллельных промисов.
6. **Фронтенд — `useSmartRefresh.ts`:** При проверке свежести для вида `schedule`, если `status.staleStories` содержит текущий проект, вызывается `handleRefreshStories`.
7. **Фронтенд — `project.api.ts`:** Тип ответа `getProjectUpdateStatus` расширен полем `staleStories: string[]`.

**Файл(ы):**
- `backend_python/services/project_service.py` — stories в `refresh_all_projects_task`
- `backend_python/crud/post_crud.py` — `staleStories` с порогом 6ч
- `contexts/hooks/useDataRefreshers.ts` — 3 правки: syncDataForProject, handleForceRefresh, handleRefreshForSidebar
- `hooks/useSmartRefresh.ts` — staleStories check
- `services/api/project.api.ts` — тип staleStories

---

### story_type не сохранялся в БД — видео-оверлей пропадал после перезагрузки

**Проблема:**  
После первого refresh видео-истории корректно отображали оверлей. Но при перезагрузке страницы (F5) истории загружались из кеша БД, и все снова показывались как `type: "photo"` — оверлей пропадал.

**Причина:**  
Поле `story_type` не сохранялось в JSON-лог (`StoriesAutomationLog.log`). При загрузке из кеша `_extract_story_data()` не мог определить тип истории и всегда ставил `"photo"`.

**Решение:**  
1. **Self-healing (`_heal_log_story_type`):** Новая функция в `retrieval_unified.py` — при refresh, если VK отдаёт `type=video`, а в JSON-логе типа нет, автоматически дописывает `"story_type": "video"` в JSON.
2. **Чтение из JSON (`_extract_story_data`):** При загрузке без VK-данных (`vk_story=None`) читает `story_type` из `data.get('story_type')`.
3. **Сохранение при автопубликации (`logic.py`):** `story_type` включается в JSON-лог при создании записи.
4. **Сохранение при ручной публикации (`_create_manual_story_log`):** `story_type` включается в JSON-лог.

**Файл(ы):**
- `backend_python/services/automations/stories/retrieval_unified.py` — `_heal_log_story_type()`, `_extract_story_data()`, `_create_manual_story_log()`
- `backend_python/services/automations/stories/logic.py` — `story_type` в JSON-логе

---

### StoryViewerModal показывал нативный видеоплеер вместо оверлея

**Проблема:**  
При refresh VK API возвращал временный CDN mp4-URL (вида `vkvd216.okcdn.ru/...`). Frontend попадал в ветку нативного `<video>` тега — показывались стандартные браузерные контролы вместо нашего оверлея «ВИДЕОИСТОРИЯ».

**Причина:**  
В `StoryViewerModal` было 4 ветки рендеринга для видео:
1. `type==='video' && video_url && !includes('vk.com/video_ext')` → нативный `<video>` (эту ветку ловил CDN-URL)
2. `type==='video' && video_url && includes('vk.com/video_ext')` → `<iframe>`
3. `type==='video' && preview` → оверлей (наша цель)
4. `!media` → placeholder

VK CDN mp4 URL-ы временные (истекают за минуты) и ненадёжные для прямого воспроизведения.

**Решение:**  
Удалены ветки 1 (нативный `<video>`) и 2 (`<iframe>`). Теперь для `type === 'video'` **всегда** рендерится оверлей с превью-изображением, бейджем «ВИДЕОИСТОРИЯ», кнопкой Play и ссылкой «Смотреть в VK».

**Файл(ы):** `features/schedule/components/StoryViewerModal.tsx`

---

### Batch-загрузка историй не возвращала type и video_url

**Проблема:**  
При первой загрузке страницы (Фаза 2: `getStoriesBatch`) все истории приходили с `type: "photo"` и без `video_url` — видео-оверлей не показывался. После нажатия «Обновить» (refresh через `retrieval_unified.py`) тип корректно определялся.

**Причина:**  
В `batch_crud.py` функция `get_stories_batch()` захардкодила `"type": "photo"` и не возвращала `video_url`. JSON-лог содержал оба поля (`story_type`, `video_url`), но они не читались.

**Решение:**  
`get_stories_batch()` теперь читает из JSON-лога:
- `story_type` → поле `type` в ответе (fallback: `"photo"`)
- `video_url` → новое поле `video_url` в ответе

**Файл(ы):** `backend_python/crud/batch_crud.py`

---

### Оптимизация массового рефреша VK API (6 bottlenecks)

**Проблема:**  
Массовое обновление всех проектов (`refresh_all_projects_task`) генерировало чрезмерное количество VK API запросов с ошибками. На каждом проекте происходила ротация через 5-7 токенов с Error 15 (non-standalone application) для `stories.get`, лишние DB-запросы для загрузки admin-токенов, повторный resolve VK Group ID, и избыточное логирование. В результате — сотни ошибок в логах и замедление обновления.

**Причина:**  
6 узких мест:
1. Отсутствие кэша «успешного токена» — каждый вызов метода ротировал все токены заново.
2. Отсутствие кэша `resolve_vk_group_id` — повторные API-вызовы для одной группы.
3. `_fetch_vk_posts` передавал community tokens в wall.get, который не работает с ними (Error 27).
4. Дублированная ротация (следствие п.1).
5. Избыточное логирование — verbose вывод всех токенов при каждом вызове.
6. `process_stories_automation` загружала до 100 постов без фильтрации по дате.

**Решение:**  
1. **Success token cache** в `token_manager.py` — кэш успешного токена для пары `group_id:method` (TTL 600с). При повторном вызове метод сразу использует работавший ранее токен.
2. **Resolve cache** в `utils.py` — словарь `_resolved_group_ids` предотвращает повторный resolve.
3. **community_tokens=None для wall.get** в `helpers.py` — wall.get вызывается только с admin/ENV токенами.
4. Решено п.1.
5. **Убрано verbose логирование** из `helpers.py`.
6. **Оптимизация stories** в `core.py` — лимит 30 постов, фильтр по дате, batch DB-запрос.

**Файл(ы):**
- `backend_python/services/vk_api/token_manager.py` — success token cache
- `backend_python/services/vk_api/utils.py` — resolve_vk_group_id cache
- `backend_python/services/post_retrieval/helpers.py` — community_tokens=None, убран verbose лог
- `backend_python/services/automations/stories/core.py` — оптимизация stories automation

---

### Warmup-кэш: прогрев токенов для всех групп перед массовым рефрешем

**Проблема:**  
Даже с success token cache, первый вызов метода для каждой группы генерировал DB-запрос для загрузки admin-токенов + ротацию через нерабочие токены (Error 15 для stories.get с non-standalone tokens).

**Причина:**  
`_load_tokens_for_group()` вызывался lazy — по одному запросу на группу. При 30+ проектах это 30+ DB-запросов последовательно. Для stories.get первый вызов всегда ротировал 4-5 admin-токенов прежде чем дойти до ENV Token.

**Решение:**  
Функция `warmup_cache_for_all_groups()` в `admin_tokens.py`:
1. Загружает ВСЕ `AdministeredGroup` + ВСЕ `SystemAccount` + ВСЕ `Project` за 3 DB-запроса.
2. Строит admin-токены для каждой группы (cross-match admins_data ↔ system_accounts).
3. Заполняет `_admin_tokens_cache` для всех групп.
4. Предзаполняет success token cache: `stories.get` → Community Token #1 или ENV Token; `wall.get` → первый admin-токен.
5. Вызывается в `refresh_all_projects_task` перед циклом проектов.

Результат: 0.12с на 797 групп. Во всём цикле — только `Кэш HIT`, ноль Error 15 для stories.get.

**Файл(ы):**
- `backend_python/services/vk_api/admin_tokens.py` — `warmup_cache_for_all_groups()`
- `backend_python/services/project_service.py` — вызов warmup перед этапом 2

---

### Регрессия wall.get: Error 27 с community tokens

**Проблема:**  
После оптимизации `_fetch_vk_posts` по ошибке передавал community tokens в `call_vk_api_for_group()` для wall.get. Community tokens вызывали Error 27 «method is unavailable with group auth».

**Причина:**  
В ходе оптимизации п.3 (унификация вызовов) `_fetch_vk_posts` по аналогии со stories.get стал передавать community tokens. Но wall.get — метод, не работающий с групповой авторизацией.

**Решение:**  
Установлен `community_tokens=None` в вызове `call_vk_api_for_group('wall.get', ...)` в `helpers.py`. Добавлен комментарий поясняющий почему.

**Файл(ы):** `backend_python/services/post_retrieval/helpers.py`

---

### Прогресс-бар массового обновления зависал на фронтенде

**Проблема:**  
При массовом обновлении проектов прогресс-бар в сайдбаре зависал на определённом проценте (например, 8%), хотя бэкенд продолжал обработку. Визуально спиннер крутился, но процент не менялся.

**Причина:**  
Два фактора:
1. **Browser GET caching:** `pollTask()` и `getTaskStatus()` делали `fetch()` без `cache: 'no-store'`. Браузер мог кешировать GET-ответ `/getTaskStatus/{taskId}` и возвращать устаревший прогресс.
2. **Disabled-проекты раздували total:** `refresh_all_projects_task` обрабатывал ВСЕ проекты включая `disabled`. Disabled-проекты (без прав в VK) генерировали Error 15 на всех 7 токенах — каждый такой проект занимал 7+ секунд. При 50% disabled проектов общий total был в 2 раза больше реального.

**Решение:**  
1. **Frontend:** Добавлен `cache: 'no-store'` в `fetch()` в `pollTask()` и `getTaskStatus()` в `lists.api.ts`.
2. **Backend:** Добавлен фильтр `if not p.disabled` в `refresh_all_projects_task` в `project_service.py`. Disabled-проекты теперь пропускаются.

**Файл(ы):**
- `services/api/lists.api.ts` — `cache: 'no-store'`
- `backend_python/services/project_service.py` — фильтр disabled проектов

---

### Снижение количества запрашиваемых постов (100 → 50)

**Проблема:**  
`_fetch_vk_posts()` запрашивал 100 последних постов для каждого проекта при каждом обновлении. Для массового рефреша 30+ проектов это генерировало избыточный трафик.

**Причина:**  
Захардкоженный параметр `'count': '100'` в `helpers.py`.

**Решение:**  
Снижено до `'count': '50'`. Для большинства проектов 50 последних постов — достаточно для актуализации данных.

**Файл(ы):** `backend_python/services/post_retrieval/helpers.py`

---

### Прикрепление опроса к посту (polls)

**Проблема:**  
Отсутствовала возможность создавать и прикреплять опросы (polls) к постам. Пользователям приходилось создавать опросы напрямую во ВКонтакте вручную.

**Решение:**  
Реализован полный цикл работы с опросами по архитектуре «создание при публикации» (Variant A):

**Бэкенд:**
1. Добавлена Pydantic-модель `PollData` (question, answers, is_anonymous, is_multiple, end_date, disable_unvote) в `schemas/models/media.py`. Поле `poll_data: Optional[PollData]` добавлено в `Attachment`.
2. Создан сервис `polls_service.py` — `create_vk_poll()` вызывает `polls.create` через ротацию токенов (publish_with_admin_priority), возвращает строку `poll{owner_id}_{poll_id}`. `resolve_poll_attachments()` обрабатывает массив аттачментов: для элементов с `poll_data` создаёт опрос в VK, для остальных — берёт ID.
3. Интегрировано в три точки публикации: `save_vk.py` (отложенная публикация), `publish.py` — синхронная `publish_now()` и асинхронная фоновая `publish_post_task()`.

**Фронтенд:**
1. Интерфейс `PollData` + поле `poll_data?: PollData` добавлены в `shared/types/index.ts`.
2. Создан компонент `PollSection.tsx` (~254 строки) — форма создания/редактирования опроса с полем вопроса, управлением вариантов ответов (2–10, max 100 символов), чекбоксами «Анонимное» и «Несколько ответов», кнопкой удаления опроса. Для уже опубликованных опросов (без poll_data) — read-only отображение.
3. `PostDetailsModal.tsx` — PollSection встроен в колонку 3 «Контент» между PostMediaSection и блоком первого комментария.
4. `PostPreview.tsx` — добавлен компонент `PollPreview` с VK-стилем: карточка с вопросом, опции-бары, бейджи свойств (анонимное/множественный выбор).
5. `postcard/Attachments.tsx` — компактная карточка опроса в расписании (фиолетовый стиль: `bg-purple-50 border-purple-200 text-purple-600`).
6. `AttachmentsDisplay.tsx` — карточка опроса в модальном окне просмотра/редактирования с указанием количества вариантов и свойств.

**Архитектура:**
- Опрос хранится как JSON в поле `poll_data` аттачмента (type='poll') до момента публикации. `polls.create` вызывается «на лету» перед `wall.post`/`wall.edit`, что исключает мусорные объекты в VK.
- Ограничения VK API: 1 опрос на пост, 1–10 ответов, max 100 символов на ответ.

**Файл(ы):**
- `shared/types/index.ts` — PollData, Attachment.poll_data
- `features/posts/components/PollSection.tsx` — **новый** компонент формы опроса
- `features/posts/components/modals/PostDetailsModal.tsx` — интеграция PollSection
- `features/posts/components/modals/PostPreview.tsx` — PollPreview
- `features/posts/components/postcard/Attachments.tsx` — компактная карточка
- `features/posts/components/AttachmentsDisplay.tsx` — полная карточка
- `backend_python/schemas/models/media.py` — PollData модель
- `backend_python/services/polls_service.py` — **новый** сервис
- `backend_python/services/post_actions/save_vk.py` — интеграция resolve_poll_attachments
- `backend_python/services/post_actions/publish.py` — интеграция resolve_poll_attachments

---

### Переработка текстовых полей шаблонов в Конкурсе отзывов

**Описание:**  
Полная переработка компонента `RichTemplateEditor` в разделе «Конкурс отзывов». Текстовые поля шаблонов (комментарий регистрации, ЛС победителю, ошибка, пост с итогами) полностью переписаны по эталону дизайн-системы (CommentTextEditor).

**Реализация:**  

1. **Фокус через React-стейт** — заменён CSS `focus-within` на `isFocused` стейт с `onFocus/onBlur` + `setTimeout(0)` для перехода между дочерними элементами. Убран `transition-all` (чёрная вспышка).
2. **Undo/Redo** — подключён хук `useTextUndoHistory` (Ctrl+Z / Ctrl+Shift+Z) с кнопками в тулбаре.
3. **Автозакрытие скобок** — `() [] {} "" '' «»` + Backspace удаляет пару, перешагивание закрывающей скобки.
4. **Счётчик символов** — `tabular-nums`, красный при превышении 4096.
5. **Inline EmojiPicker** — внутри контейнера, `variant="inline"`.
6. **Плавные анимации** — панель переменных и emoji-пикер раскрываются/сворачиваются плавно через `keep-in-DOM` паттерн (`everShown` флаг + CSS transition `max-h / opacity`).
7. **Аккордеон переменных** — 5 секций (Частные, Глобальные, Базовые, Конструкции, Проектные) с одновременным открытием только одного раздела. `VariablesSelector` заменён на инлайн-рендер через `renderSection` / `renderVarBtn`.
8. **Тулбар** — кнопки (⚙️ переменные, 😊 эмодзи, ↩ undo, ↪ redo) сгруппированы справа (один `flex-1` после лейбла).
9. **Частные переменные** — перенесены из тулбара в первую секцию аккордеона с пояснением и pill-кнопками (`rounded-full`, отображается `v.name`).

**Файл(ы):**
- `features/automations/reviews-contest/components/settings/controls/RichTemplateEditor.tsx` — полная перезапись компонента
- `index.html` — добавлены CSS-анимации (`expand-down`, `collapse-up`, `fade-in-row`)

---

### Кнопка «Сейчас» для быстрой установки даты и времени

**Описание:**  
Добавлена кнопка «Сейчас» (иконка часов) рядом с полем времени в модальном окне создания/редактирования поста. При нажатии автоматически устанавливает текущую дату и время + 2 минуты — минимальный запас для отложенной публикации.

**Реализация:**  

1. **Функция `handleSetNow()`** — создаёт объект `Date`, добавляет 2 минуты, устанавливает дату через `onChange` и время через `onTimeChange` в формате `HH:MM`.
2. **Кнопка с SVG-иконкой часов** — расположена рядом с CustomTimePicker, стилизована в `text-gray-500 hover:text-indigo-600`, скрывается для опубликованных постов (`isDisabled`).
3. **Tooltip** — при наведении показывает «Установить текущее время + 2 мин».

**Файл(ы):**
- `features/posts/components/modals/PostDateTimePicker.tsx` — добавлена функция `handleSetNow` и кнопка с иконкой часов

---

### UI-рефакторинг секции «Контент» по дизайн-системе

**Описание:**  
Проведён аудит секции «Контент» модального окна поста по 13-точечному чеклисту дизайн-системы. Найдено и исправлено 6 нарушений.

**Реализация:**  

1. **Формат счётчиков** — `PostMediaSection.tsx`: `Изображения ({n})` → `Изображения - {n}` (тире вместо скобок).
2. **Формат счётчиков** — `PollSection.tsx`: `Варианты ({n}/{max})` → `Варианты - {n}/{max}`.
3. **Цвета blue→indigo** — `VariablesSelector.tsx`: `border-blue-400 text-blue-600 hover:bg-blue-50` → `border-indigo-400 text-indigo-600 hover:bg-indigo-50`.
4. **SVG вместо символа `×`** — `PostMediaSection.tsx`: замена HTML-символа `&times;` на SVG-иконку крестика.
5. **Skeleton + fade-in для изображений** — `PostMediaSection.tsx`: `MediaGridItem` и `ViewImageItem` получили серый скелетон при загрузке и плавное появление `animate-fadeIn`.
6. **Перестройка колонки «Контент»** — `PostDetailsModal.tsx`: AttachmentsDisplay вынесен наверх (всегда видим под текстом), PollSection размещён рядом с карточкой опроса.

**Файл(ы):**
- `features/posts/components/modals/PostMediaSection.tsx` — счётчик, SVG, skeleton+fadeIn
- `features/posts/components/PollSection.tsx` — формат счётчика
- `features/posts/components/VariablesSelector.tsx` — blue→indigo
- `features/posts/components/modals/PostDetailsModal.tsx` — реорганизация колонки «Контент»

---

### Средние показатели и min/max зрителей в дашборде историй

**Описание:**  
Добавлены 4 новые метрики в дашборд автоматизации историй: среднее количество просмотров на историю, среднее количество зрителей на историю, минимальные и максимальные зрители. Все метрики рассчитываются на бэкенде.

**Реализация:**  
1. **Бэкенд** — функция `_calculate_averages()` в `retrieval_dashboard.py`: итерирует логи с дедупликацией (аналог `_aggregate_stats`), считает avg/min/max по `detailed_stats.views` и `detailed_stats.answer` (уникальные зрители).
2. **Тип** — расширен `DashboardStats` полями `avgViews`, `avgViewers`, `minViewers`, `maxViewers`.
3. **UI** — создан новый компонент `AveragesCard.tsx`: grid 2×2 (Ø Просмотров / Ø Зрителей / Мин / Макс) с иконками (indigo, teal, red, emerald). Значения округляются `Math.round`.
4. **Карточки объединены** — `StoriesCountCard` расширен: левая часть (количество историй), правая часть (подписки + скрытия, перенесены из `SubscriptionsCard`). Заголовок «Истории и охват».
5. **Порядок карточек** — Views → Budget → Clicks → Activity → StoriesCount → Averages → ERView → Demographics.

**Файл(ы):**
- `backend_python/services/automations/stories/retrieval_dashboard.py` — `_calculate_averages()`
- `features/automations/stories-automation/components/dashboard/types.ts` — расширен `DashboardStats`
- `features/automations/stories-automation/components/dashboard/AveragesCard.tsx` — **новый** компонент
- `features/automations/stories-automation/components/dashboard/StoriesCountCard.tsx` — merge с SubscriptionsCard
- `features/automations/stories-automation/components/dashboard/StoriesDashboard.tsx` — порядок карточек

---

### Объединение возрастных групп 45-54/55+ → 45+ и сокращение топ-городов

**Описание:**  
В блоке демографии дашборда возрастные группы «45-54» и «55+» объединены в одну группу «45+». Количество отображаемых городов сокращено с 6 до 5.

**Реализация:**  
1. **Бэкенд** — `retrieval_dashboard.py`: словарь `age_groups` изменён с 6 на 5 групп, логика классификации возраста (`elif age >= 45`) теперь попадает в `45+`. `top_cities` ограничен `[:5]`.
2. **Фронтенд** — тип `ViewersStats.ageGroups` обновлён: `'45+'` вместо `'45-54'`/`'55+'`. `DemographicsCard` — массив `orderedGroups` обновлён.

**Файл(ы):**
- `backend_python/services/automations/stories/retrieval_dashboard.py`
- `features/automations/stories-automation/components/dashboard/types.ts`
- `features/automations/stories-automation/components/dashboard/useStoriesDashboard.ts`
- `features/automations/stories-automation/components/dashboard/DemographicsCard.tsx`

---

### Авто-рефреш дашборда после обновления статистики

**Описание:**  
После нажатия кнопки «Обновить всё» (или обновления статистики/зрителей) дашборд автоматически перезагружается с актуальными данными, сохраняя текущие фильтры.

**Реализация:**  
1. **`useStoriesDashboard` (hooks)** — `loadDashboardStats` запоминает последние параметры фильтров в `lastParamsRef`. Добавлена функция `refreshDashboard()` — перезапрос с теми же фильтрами.
2. **`useStoriesUpdater`** — принимает новый параметр `onSuccess?: () => void`, вызывается после каждого успешного `handleUpdateStats`, `handleUpdateViewers`, `handleUpdateAll`.
3. **`useStoriesAutomation`** — передаёт `dashboard.refreshDashboard` в `useStoriesUpdater` как `onSuccess`.

**Файл(ы):**
- `features/automations/stories-automation/hooks/useStoriesDashboard.ts`
- `features/automations/stories-automation/hooks/useStoriesUpdater.ts`
- `features/automations/stories-automation/hooks/useStoriesAutomation.ts`

---

### Баг: temporal dead zone при входе в историй

**Проблема:**  
При переходе на вкладку «Истории» приложение падало с ошибкой `Cannot access 'dashboard' before initialization`.

**Причина:**  
В `useStoriesAutomation.ts` переменная `dashboard` использовалась в строке 27 (передача `dashboard.refreshDashboard` в `useStoriesUpdater`), но объявлялась позже в строке 33. Это вызывало ошибку temporal dead zone (TDZ) — обращение к `const` до инициализации.

**Решение:**  
Перемещён вызов `useStoriesDashboard(projectId)` выше `useStoriesUpdater()`. Порядок хуков: settings → loader → **dashboard** → updater → postHelpers.

**Файл(ы):** `features/automations/stories-automation/hooks/useStoriesAutomation.ts`

---
