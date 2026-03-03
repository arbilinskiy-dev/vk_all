# 📋 Release Log 2 — Журнал релизов

Продолжение журнала релизов. Предыдущий файл: `release.md`.

---

## 🔴 Открытые задачи

### Режим «По количеству» (finishCondition='count') полностью нерабочий

**Проблема:**  
При выборе условия завершения «По количеству» в настройках конкурса отзывов, SystemPost типа `contest_winner` **не создаётся** в планировщике. Scheduler явно исключает режим `count` из условия: `should_exist = settings.isActive and settings.finishCondition in ['date', 'mixed']`. Post Tracker никогда не запустит автоматический цикл. Конкурс будет бесконечно висеть без подведения итогов.

При этом UI обещает пользователю: «Пост с итогами опубликуется автоматически, как только наберется указанное количество постов».

**Статус:** 🔴 В работе

**Файл(ы):** `services/automations/reviews/scheduler.py`, `features/automations/reviews-contest/components/settings/FinishConditions.tsx`

---

### Тихий 0 участников при отсутствии admin-токена

**Проблема:**  
Если `get_admin_token_for_group()` не находит токен администратора группы и fallback ENV-токен тоже не является админом, VK API (`wall.get`) не возвращает `post_author_data`. Все `author_id` = `None` → 0 участников добавляется каждый цикл. Пользователь не получает никакого уведомления — ни заметки в календаре, ни ошибки. Collector не считает это ошибкой.

**Статус:** 🔴 В работе

**Файл(ы):** `services/automations/reviews/collector.py`

---

### `cleanup_expired_blacklist` снимает блокировку `with_for_update()`

**Проблема:**  
В finalizer участники загружаются с `with_for_update()` для атомарной блокировки строк. Затем вызывается `cleanup_expired_blacklist()`, который внутри делает `db.commit()` — это коммитит транзакцию и **снимает блокировку** до того, как победитель выбран и статусы обновлены. При параллельном запуске (ручной + автоматический) оба потока могут выбрать победителя из одного пула.

**Статус:** 🔴 В работе

**Файл(ы):** `services/automations/reviews/finalizer.py`, `services/automations/reviews/crud.py`

---

## ✅ Решённые задачи

### Подборка слетает при импорте товаров из буфера обмена

**Проблема:**  
При массовом создании товаров через "Из буфера", если пользователь указывал в таблице колонку "Подборка" с текстовым названием (например, "Сеты"), подборка не применялась к товарам на следующем шаге. Также отсутствовала возможность маппинга колонки с URL-ссылкой на фото.

**Причина:**  
В `PasteFromClipboardModal` поиск подборки шёл по точному совпадению названия с существующими подборками в VK. Если подборка с таким названием не существовала в VK (или была удалена и создана заново с новым ID), `album_ids` оставался `undefined` и данные молча терялись. Также в `FIELD_OPTIONS` отсутствовал вариант `photoUrl` для маппинга ссылки на фото.

**Решение:**  
1. Добавлена автоматическая проверка и создание подборок: при импорте система собирает все уникальные названия подборок, проверяет их наличие в VK, и автоматически создаёт отсутствующие через API `market/createAlbum`.
2. Добавлена опция "Фото (URL)" в маппинг колонок для обоих модальных окон импорта (из буфера и из файла).
3. Список подборок в родительском компоненте обновляется через callback `onAlbumsCreated`.
4. Кнопка импорта блокируется на время создания подборок с индикатором загрузки.

**Файл(ы):** `features/products/components/modals/PasteFromClipboardModal.tsx`, `features/products/components/modals/FileImportMappingModal.tsx`, `features/products/components/modals/CreateMultipleProductsModal.tsx`, `features/products/components/ProductsModals.tsx`, `features/products/components/ProductsTab.tsx`

---

### DetachedInstanceError при сборе участников конкурса отзывов

**Проблема:**  
При вызове `/api/automations/reviews/collectPosts` возникала ошибка `sqlalchemy.orm.exc.DetachedInstanceError: Instance <ReviewContest> is not bound to a Session`. Collector не мог прочитать `contest.id` после VK API вызовов.

**Причина:**  
`token_log_service.log_api_call()` вызывал `db = SessionLocal()`, получая **ту же самую** thread-local сессию (scoped_session). Затем делал `db.commit()` + `db.close()`, что убивало сессию вызывающего кода (collector). Все ORM-объекты в collector становились detached.

**Решение (двойной фикс):**  
1. **Корневая причина** (`token_log_service.py`): Заменён `SessionLocal()` на `_session_factory()` — создаёт полностью независимую сессию, не затрагивающую thread-local scoped_session вызывающего кода.
2. **Страховка** (`collector.py`): Все обращения `contest.id` заменены на кешированную переменную `contest_id = contest.id`, которая сохраняется сразу после загрузки объекта — до любых VK API вызовов.

**Файл(ы):** `services/token_log_service.py`, `services/automations/reviews/collector.py`

---

### Аудит автоматического цикла конкурса отзывов (14 багов)

**Проблема:**  
Глубокий аудит кода выявил 14 проблем разной критичности в полном автоматическом цикле конкурса (collect → process → finalize → next cycle).

**Причина и решение (по файлам):**

| Файл | Проблема | Исправление |
|------|----------|-------------|
| `execution.py` | `raise Exception` в этапе process убивал весь еженедельный цикл | Заменён на error swallowing с флагом `process_failed`, аналогично finalize |
| `execution.py` | `time.sleep(1)` без причины | Удалён вместе с `import time` |
| `post_tracker_service.py` | `datetime.now().isoformat()` давал формат без `Z`, несовместимый с планировщиком | Заменён на `datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')` |
| `finalizer.py` | Отсутствовал `with_for_update()` при SELECT участников | Добавлена блокировка строк для защиты от race condition |
| `finalizer.py` | Промокоды проверялись ПОСЛЕ выбора победителя | Перенесена проверка наличия промо ДО `random.choice()` |
| `finalizer.py` | `template_dm`, `template_winner_post`, `template_error_comment` = None → crash | Добавлены fallback-значения: `or '{promo_code}'`, `or 'Победитель: {user_name}'`, etc. |
| `finalizer.py` | Заблокированные пользователи получали статус `used` | Изменён фильтр: `used` назначается только `valid_participants` |
| `processor.py` | `template_comment = None` → crash | Добавлен fallback: `or '#{number}'` |
| `processor.py` | Мёртвый статус `processing` в `active_statuses` | Удалён, оставлен только `['commented']` |
| `automations.py` (model) | Отсутствовала колонка `log` в модели `ReviewContestEntry` | Добавлен `log = Column(Text, nullable=True)` |
| `automations.py` (migration) | Отсутствовала миграция для колонки `log` | Добавлена строка `check_and_add_column('review_contest_entries', 'log', 'TEXT')` |
| `scheduler.py` | `datetime.utcnow()` (deprecated) | Заменён на `datetime.now(timezone.utc)` |
| `collector.py` | `datetime.utcnow()` (deprecated) | Заменён на `datetime.now(timezone.utc)` |
| `post_tracker_service.py` | `datetime.utcnow()` в fallback `_calculate_next_occurrence` | Заменён на `datetime.now(timezone.utc)` |

**Файл(ы):** `execution.py`, `post_tracker_service.py`, `finalizer.py`, `processor.py`, `automations.py` (model + migration), `scheduler.py`, `collector.py`

### Удаление верификации публикации постов (убрана двухфазная проверка)

**Проблема:**  
После публикации системного поста через VK API (`wall.post`) пост не удалялся из БД сразу, а переходил в промежуточный статус `publishing`. Далее каждые 50 секунд `_verification_check()` лезла на стену VK через `wall.get`, искала `vk_post_id` среди последних постов и только после подтверждения удаляла запись из БД и создавала следующий циклический пост. Если за 5 минут пост не находился — ставился статус `possible_error`. На UI это выглядело как вращающаяся шестерёнка на карточке поста.

**Причина:**  
Верификация была избыточной. VK API при успешной публикации возвращает `post_id` — это гарантия, что пост на стене. VK не делает отложенную модерацию опубликованных постов. Двухфазная проверка:
- Создавала лишний VK API вызов (`wall.get`) на каждый опубликованный пост
- Задерживала создание следующего циклического поста на ~50 секунд
- Для ручной публикации через `publishSystemPostNow` — `publication_date` в прошлом → таймаут 5 минут → `possible_error`
- Требовала отдельную UI-логику: шестерёнка, кнопка «Подтвердить», кнопка «Отменить проверку»

**Решение:**  
1. **`_publication_check()`** — для regular- и AI-постов после получения `vk_post_id` сразу вызывается `_create_next_cyclic_post()` и `crud.delete_system_post()`. Промежуточный статус `publishing` больше не ставится.
2. **`_verification_check()`** — функция удалена полностью.
3. **`scheduler_service.py`** и **`_tracker_loop()`** — убран вызов `_verification_check()`.
4. **`system_post_service.py`** — убраны статусы `publishing` и `possible_error` из допустимых для удаления. `confirm_publication()` упрощена. `publish_system_post_now()` убрана проверка на `publishing`.
5. **`reviews/scheduler.py`** — условие сброса статуса: было `!= 'publishing'`, стало `== 'error'`.
6. **Типы (фронтенд)** — `SystemPost.status`: было `'pending_publication' | 'publishing' | 'error' | 'possible_error'` → стало `'pending_publication' | 'error'`.
7. **`PostCard.tsx`** — убрана шестерёнка (`animate-spin`), иконка `possible_error`, пропсы `onConfirmPublication` и `onCancelPublicationCheck`.
8. **`usePostCardActions.ts`** — убран `isSystemPublishing`, кнопка «Подтвердить», `disabled`-логика для `publishing`.
9. **`ScheduleGrid.tsx`** — убраны пропсы `onConfirmPublication`, `onCancelPublicationCheck`.
10. **`ScheduleModals.tsx`** — убраны модалки «Подтвердить публикацию» и «Отменить проверку публикации».
11. **`useScheduleInteraction.ts`** — убрана логика копирования при drag'е `publishing`-постов.
12. **`usePostDetails.ts`** — `isLocked` теперь всегда `false`.

**Файл(ы):**  
- Backend: `services/post_tracker_service.py`, `services/scheduler_service.py`, `services/system_post_service.py`, `services/automations/reviews/scheduler.py`
- Frontend: `shared/types/index.ts`, `features/posts/components/PostCard.tsx`, `features/posts/hooks/usePostCardActions.ts`, `features/posts/hooks/usePostDetails.ts`, `features/schedule/components/ScheduleGrid.tsx`, `features/schedule/components/ScheduleModals.tsx`, `features/schedule/hooks/useScheduleInteraction.ts`

---

### Кнопка сброса поиска в сайдбаре проектов

**Проблема:**  
В сайдбаре «Проекты» поле поиска по названию не имело кнопки сброса. После ввода текста пользователю приходилось вручную выделять и удалять текст, чтобы очистить фильтр — это неудобно и неочевидно.

**Решение:**  
Добавлена кнопка-крестик (✕) внутри поля поиска, которая появляется при наличии текста в поле. По нажатию мгновенно очищает поисковый запрос и сбрасывает фильтрацию проектов. Кнопка скрывается, когда поле пустое.

**Файл(ы):** `features/projects/components/Sidebar.tsx`

---

### Удалена устаревшая папка src/

**Проблема:**  
В корне проекта существовала папка `src/` с 7 устаревшими файлами-дубликатами (`Sidebar.tsx`, `ProjectListItem.tsx`, `ProjectsContext.tsx`, `useDataInitialization.ts`, `ReviewsContestPage.tsx`, `project.api.ts`, `global.d.ts`). Эти файлы не импортировались ни одним компонентом, но могли вводить в заблуждение при разработке.

**Решение:**  
Проведён полный аудит: ни один файл из `src/` не подключён в приложении. Все актуальные версии находятся в корневых папках `features/`, `contexts/`, `services/`. Папка `src/` удалена целиком.

**Файл(ы):** Удалена папка `src/` (7 файлов)

---

### Адаптивность интерфейса конкурса отзывов

**Проблема:**  
При сжатии окна (узкие экраны, разделённый экран) несколько элементов на странице настроек конкурса отзывов ломались визуально:
1. **Кнопки «Условия подведения итогов»** — текст «В определенный день» и «День + Количество» обрезался, не помещаясь в `flex` контейнер.
2. **Шапка RichTemplateEditor** — кнопки переменных (`{promo_code}`, `{description}`, `{user_name}`) вылезали за границы контейнера.
3. **Тумблеры (toggle)** — кнопки `<button>` наследовали дефолтные стили браузера (padding, border), из-за чего выглядели увеличенными и не были зафиксированы по ширине (`shrink-0`).
4. **Раскладка настройки/превью** — обе колонки делили экран 50/50, при сжатии превью с широким контентом VK-постов вытесняло настройки.

**Решение:**

| Компонент | Файл | Что сделано |
|-----------|------|-------------|
| FinishConditions | `FinishConditions.tsx` | `flex` → `flex flex-wrap` + `min-w-[120px]` на кнопках — автоматический перенос на 2-3 строки |
| RichTemplateEditor | `RichTemplateEditor.tsx` | Шапка: `flex` → `flex flex-wrap` + `gap-2`, label: `shrink-0`, кнопки переменных: `flex-wrap` + `whitespace-nowrap` |
| Тумблеры | `MainSettings.tsx` | Добавлены `shrink-0 p-0 border-0 cursor-pointer focus:ring-4 focus:ring-indigo-100`, кружку — `shadow-sm` |
| Раскладка колонок | `SettingsTab.tsx` + `ContestPreview.tsx` | Настройки: `lg:w-1/2` → `lg:flex-[3]` (60%), Превью: `lg:w-1/2` → `lg:flex-[2]` (40%), обоим `lg:min-w-0` |

**Файл(ы):** `features/automations/reviews-contest/components/settings/FinishConditions.tsx`, `features/automations/reviews-contest/components/settings/controls/RichTemplateEditor.tsx`, `features/automations/reviews-contest/components/settings/MainSettings.tsx`, `features/automations/reviews-contest/components/SettingsTab.tsx`, `features/automations/reviews-contest/components/preview/ContestPreview.tsx`

---

### Плавная загрузка фотографий товаров (skeleton + fade-in)

**Проблема:**  
В разделе «Товары» фотографии загружались с CDN ВКонтакте напрямую через `<img src={...}>` без обработки состояния загрузки. При большом количестве тяжёлых изображений они появлялись «рывками» — в разном порядке и с разной скоростью. Это выглядело непрофессионально.

**Решение:**  
В компонент `PhotoCell` добавлен паттерн «скелетон + плавное появление»:
1. Локальный стейт `isLoaded` отслеживает загрузку каждого изображения.
2. Пока фото загружается — отображается пульсирующий серый скелетон (`bg-gray-200 animate-pulse`).
3. Изображение рендерится с `opacity-0` и `transition-opacity duration-300`.
4. По событию `onLoad` фото плавно проявляется (`opacity-100`), скелетон исчезает.

Также обновлены инструкции UI/UX (`uiux.instructions.md`, `design_system.instructions.md`) — добавлены обязательные правила: все фото должны иметь скелетон-лоадер при загрузке и быть кликабельными с полноэкранным просмотром.

**Файл(ы):** `features/products/components/table/PhotoCell.tsx`, `.github/instructions/uiux.instructions.md`, `.github/instructions/design_system.instructions.md`

---

### Редактирование и удаление подборок товаров (full stack)

**Проблема:**  
В разделе «Товары» была доступна только функция создания подборки (альбома). Переименовать или удалить подборку через интерфейс было невозможно — приходилось делать это напрямую через ВКонтакте.

**Решение:**

**Бэкенд:**
1. Добавлены Pydantic-схемы `EditMarketAlbumPayload(projectId, albumId, title)` и `DeleteMarketAlbumPayload(projectId, albumId)` в `schemas/api_payloads.py` + экспорт в `schemas/__init__.py`.
2. Добавлены CRUD-функции `update_market_album_title()` и `delete_market_album()` в `crud/market_crud.py` + экспорт в `crud/__init__.py`.
3. Добавлены сервисные функции `edit_market_album()` и `delete_market_album()` в `services/market_album_service.py` — вызывают VK API `market.editAlbum` / `market.deleteAlbum`, затем обновляют/удаляют запись в БД.
4. Добавлены POST-эндпоинты `/editAlbum` и `/deleteAlbum` в `routers/market.py`.

**Фронтенд:**
1. Добавлены API-методы `editMarketAlbum()` и `deleteMarketAlbum()` в `services/api/market.api.ts`.
2. В хуке `useProductsManager.ts` добавлены стейты (`editingAlbumId`, `editingAlbumTitle`) и обработчики (`handleStartEditAlbum`, `handleSaveEditAlbum`, `handleCancelEditAlbum`, `handleDeleteAlbum`).
3. В компоненте `AlbumFilters.tsx` реализован UI: SVG-иконки карандаша (редактирование) и корзины (удаление) рядом с каждой вкладкой подборки, инлайн-редактирование с input + кнопки ✓/✕, `ConfirmationModal` для подтверждения удаления.
4. Пропсы переданы через `ProductsTab.tsx`.

**Файл(ы):** `backend_python/schemas/api_payloads.py`, `backend_python/schemas/__init__.py`, `backend_python/crud/market_crud.py`, `backend_python/crud/__init__.py`, `backend_python/services/market_album_service.py`, `backend_python/routers/market.py`, `services/api/market.api.ts`, `features/products/hooks/useProductsManager.ts`, `features/products/components/AlbumFilters.tsx`, `features/products/components/ProductsTab.tsx`

---

### Пустые подборки исчезали после обновления данных

**Проблема:**  
После создания пустой подборки (0 товаров) и обновления раздела «Товары» подборка пропадала. VK API `market.getAlbums` не возвращает альбомы с 0 товаров, и при синхронизации локальные записи затирались.

**Причина:**  
В `refresh_all_market_data()` данные из VK полностью заменяли записи в БД. Альбомы, существующие только в БД (пустые), удалялись.

**Решение:**  
После получения альбомов из VK, сервис сохраняет локальные альбомы, отсутствующие в ответе VK, устанавливая им `count = 0`. Также добавлена пагинация при запросе альбомов (offset loop) и подробное логирование всех этапов синхронизации.

**Файл(ы):** `backend_python/services/market_retrieval_service.py`

---

### Оптимизация выбора токена для операций с подборками

**Проблема:**  
При создании/редактировании/удалении подборки появлялись 5 ошибок `VK API Error 15` перед успешным выполнением. Функция `call_vk_api()` перебирала все токены в системе, а не только токены администратора нужной группы.

**Причина:**  
Использовалась общая функция `call_vk_api()`, которая не фильтрует токены по группе и не приоритезирует админские.

**Решение:**  
Все три функции в `market_album_service.py` (`create_market_album`, `edit_market_album`, `delete_market_album`) переведены на `call_vk_api_for_group()`, которая сначала пробует админские токены указанной группы.

**Файл(ы):** `backend_python/services/market_album_service.py`

---

### VK API Error 1402 вызывал 5 повторных попыток

**Проблема:**  
При попытке удалить несуществующий альбом VK API возвращал ошибку 1402 (Album not found). Система делала 5 повторных попыток, хотя ошибка перманентная.

**Причина:**  
Код 1402 отсутствовал в списке `PERMANENT_ERROR_CODES` в `api_client.py`.

**Решение:**  
Добавлен код 1402 в `PERMANENT_ERROR_CODES` — теперь ошибка сразу прокидывается без ретраев.

**Файл(ы):** `backend_python/services/vk_api/api_client.py`

---

### Информационная подсказка о видимости подборок

**Проблема:**  
Пользователи не понимали, какие подборки отображаются в приложении и откуда они берутся.

**Решение:**  
Добавлена иконка ℹ️ рядом с кнопкой «Все» в фильтрах подборок. При наведении показывается тултип с пояснением, что отображаются подборки из ВКонтакте, и ссылкой на VK-раздел товаров группы.

**Файл(ы):** `features/products/components/AlbumFilters.tsx`

---

### Защита от двойного клика при создании/редактировании подборок

**Проблема:**  
Быстрый двойной клик на кнопку «Ок» при создании подборки приводил к созданию двух одинаковых подборок. Аналогично при сохранении нового названия.

**Причина:**  
Отсутствовала блокировка кнопок на время выполнения асинхронного запроса.

**Решение:**  
Добавлен флаг `isSavingAlbum` в хуке `useProductsManager.ts`. Обе функции (`handleCreateAlbum`, `handleSaveEditAlbum`) проверяют флаг на входе, выставляют его в `true` перед запросом и сбрасывают в `finally`. В UI (`AlbumFilters.tsx`) кнопки «Ок» и «✓» получили `disabled={isSavingAlbum}` с визуальной индикацией (`opacity-50`, текст «Создание...»).

**Файл(ы):** `features/products/hooks/useProductsManager.ts`, `features/products/components/AlbumFilters.tsx`, `features/products/components/ProductsTab.tsx`

---

### Потеря фото при массовом создании товаров (ERR_UPLOAD_BAD_IMAGE_SIZE)

**Проблема:**  
При массовом создании товаров из CSV/буфера все товары падали с ошибкой VK API `ERR_UPLOAD_BAD_IMAGE_SIZE`. Фотографии не загружались, данные терялись.

**Причина:**  
CRUD-слой `market_crud.py` при синхронизации сохранял поле `thumb_photo` напрямую — это URL маленького превью (`market_thumb`, <400x400px). VK API требует минимум 400x400 для `photos.saveMarketPhoto`. Форматтер `_extract_best_market_photo_url()` существовал в `formatters.py`, но не использовался в sync-пути — `replace_market_items_for_project()` обходил его.

**Решение:**  
1. В `market_crud.py` добавлена логика извлечения лучшего URL из `photos[].sizes[]` с приоритетом по типу размера (`w > z > y > x > r > q > p > o`). Если `photos[]` отсутствует — fallback на `thumb_photo`.
2. В `upload.py` добавлена ранняя проверка ошибки `ERR_UPLOAD_BAD_IMAGE_SIZE` — при её обнаружении загрузка прекращается немедленно, без бесполезной ротации токенов. Также для `upload_market_photo()` используются только админские токены (`include_non_admins=False`).
3. Фронтенд: `photoUrlHelper.ts` (pass-through), обновлены `csvExporter.ts`, `xlsxExporter.ts`, `fileParser.ts` для использования `getOriginalPhotoUrl()`.

**Файл(ы):** `backend_python/crud/market_crud.py`, `backend_python/services/vk_api/upload.py`, `backend_python/services/vk_api/formatters.py`, `features/products/utils/photoUrlHelper.ts`, `features/products/utils/csvExporter.ts`, `features/products/utils/xlsxExporter.ts`, `features/products/utils/fileParser.ts`

---

### Error 15 спам при массовом создании товаров

**Проблема:**  
При массовом создании товаров в логах появлялись 5 ошибок `VK API Error 15: Access denied` на каждый товар перед успешным выполнением. Общее время создания 12 товаров превышало 10 минут.

**Причина:**  
Функции `market.add` и `market.addToAlbum` вызывались через `call_vk_api()`, которая перебирала ВСЕ токены в системе (5 неадминских → Error 15 на каждом), прежде чем добраться до админского.

**Решение:**  
Заменён вызов `call_vk_api()` на `call_vk_api_for_group()` в `market_item_create.py` для методов `market.add` и `market.addToAlbum`. Эта функция приоритизирует токены администраторов указанной группы. Результат: чистые логи `✓ Успех с 👑 ENV Token` без Error 15 спама.

**Файл(ы):** `backend_python/services/market_item_create.py`

---

### VK CDN 500 при скачивании фото для загрузки товара

**Проблема:**  
Один из товаров при массовом создании падал с ошибкой — VK CDN возвращал HTTP 500 при попытке скачать фото по URL.

**Причина:**  
VK CDN периодически отдаёт 500/502/503/504 для больших изображений. Единичный запрос без retry приводил к полной потере товара.

**Решение:**  
Добавлена функция `_download_photo_with_retry()` с 3 попытками и задержкой 2 секунды между ними для серверных ошибок (500/502/503/504). При исчерпании retry для текущего URL вызывается `_build_smaller_photo_url()`, которая уменьшает параметр `cs=` в URL (например, `cs=2560x0` → `cs=1280x0`). Модификация размера применяется только к unsigned URL (`/s/v1/ig2/`); signed URL (`/impg/` с параметром `sign=`) не модифицируются, т.к. изменение параметров вызывает 403.

**Файл(ы):** `backend_python/services/market_item_create.py`

---

### Тройное создание подборок из-за urllib3 retry

**Проблема:**  
При массовом создании товаров подборка (альбом) создавалась 3 раза вместо 1. Процесс занимал значительно больше времени из-за каскадных retry.

**Причина:**  
urllib3 `Retry` по умолчанию имел `read=3` — при read timeout на POST-запросе (VK обработал запрос, но ответ не вернулся в отведённое время) urllib3 повторял POST. Так как POST не идемпотентный, VK создавал подборку заново при каждом retry. Дополнительно: `500` был в `status_forcelist`, что тоже вызывало retry POST-ов.

**Решение:**  
В `api_client.py`:
- `read=0` — запрет retry на read timeout (критично для POST-запросов)
- `total=2`, `connect=2` — уменьшены общие retry
- Удалён `500` из `status_forcelist` (оставлены `502, 503, 504`)
- `timeout` уменьшен с `30` до `15` секунд
- `MAX_RETRIES` уменьшен с `5` до `3`, `INITIAL_DELAY` с `2` до `1` секунды

В `token_manager.py`:
- Добавлен `import requests as _requests`
- В `call_vk_api()` и `call_vk_api_for_group()` добавлен catch `_requests.exceptions.RequestException` для сетевых ошибок — при timeout или сбросе соединения пробуем следующий токен вместо crash.

**Файл(ы):** `backend_python/services/vk_api/api_client.py`, `backend_python/services/vk_api/token_manager.py`

---

### Прогресс-бар массового создания товаров

**Проблема:**  
При массовом создании товаров (12+ штук) пользователь видел только крутящийся спиннер без информации о прогрессе. Невозможно было понять, сколько товаров создано, какой обрабатывается сейчас, и есть ли ошибки.

**Решение:**  
Добавлен визуальный прогресс-бар в модальное окно массового создания:

1. **Хук `useProductsManager.ts`**: `handleCreateMultipleProducts` принимает опциональный callback `onProgress({current, total, currentName, status})`, который вызывается для каждого товара.
2. **Хук `useCreateMultipleProducts.ts`**: Добавлен интерфейс `BulkCreationProgress` и стейт `creationProgress` с полями `current`, `total`, `currentName`, `succeeded`, `failed`, `status`. `handleConfirmSave` инициализирует прогресс и передаёт callback в `onSave`.
3. **Компонент `CreateMultipleProductsModal.tsx`**: Над таблицей отображается полоса прогресса (indigo bar с анимацией), счётчик `X из Y`, зелёная галочка для успешных, красный крестик для ошибок, название текущего товара с truncate. Кнопка в footer показывает `X/Y` во время выполнения.

**Файл(ы):** `features/products/hooks/useProductsManager.ts`, `features/products/hooks/useCreateMultipleProducts.ts`, `features/products/components/modals/CreateMultipleProductsModal.tsx`

---

### Фикс DB-сессий для подготовки к препрод-развёртыванию

**Проблема:**  
При аудите управления DB-соединениями в потоке массового создания товаров обнаружено некорректное закрытие scoped_session. В `routers/market.py`, `token_manager.py` и `admin_tokens.py` использовался `db.close()` вместо `SessionLocal.remove()`. Это оставляло «мёртвые» thread-local привязки в scoped_session, что могло привести к ошибкам при повторном использовании того же потока.

**Причина:**  
`scoped_session` (thread-local) требует вызова `remove()` для полной очистки реестра. При `close()` соединение возвращается в пул, но thread-local привязка остаётся — при следующем вызове `SessionLocal()` из того же потока возвращается закрытая сессия.

**Решение:**  
1. `routers/market.py` — удалена локальная копия `get_db()`, вместо неё импортируется корректная версия из `database.py` (которая использует `SessionLocal.remove()`).
2. `token_manager.py` — все `db.close()` заменены на `SessionLocal.remove()` (в `get_candidate_tokens()` и `call_vk_api()`).
3. `admin_tokens.py` — все `db.close()` заменены на `SessionLocal.remove()` (в `_load_tokens_for_group()` и `_get_all_tokens_fallback()`).

Конфигурация пула уже корректна: `pool_pre_ping=True` (защита от протухания), `pool_recycle=120` (обновление соединений каждые 2 мин).

**Файл(ы):** `backend_python/routers/market.py`, `backend_python/services/vk_api/token_manager.py`, `backend_python/services/vk_api/admin_tokens.py`

---

### Удаление и редактирование товаров перебирало все токены вместо админских

**Проблема:**  
При удалении (`market.delete`) и редактировании (`market.edit`, `market.removeFromAlbum`, `market.addToAlbum`) товаров использовалась функция `call_vk_api()`, которая перебирает **все** системные токены без учёта группы. Не-админские токены возвращали VK API Error 15 (Access denied), создавая до 5 лишних запросов на каждый товар. При массовом удалении 13 товаров это порождало ~65 бесполезных обращений к API VK.

**Причина:**  
В `market_item_delete.py` и `market_item_update.py` вызывалась `vk_service.call_vk_api()` (из `token_manager.py`), которая перебирает все системные аккаунты без фильтрации. При этом для создания товаров (`market.add`) уже корректно использовалась `call_vk_api_for_group()`, приоритизирующая админов.

**Решение:**  
1. `market_item_delete.py` — заменён `call_vk_api('market.delete', ...)` на `call_vk_api_for_group('market.delete', ..., group_id=numeric_group_id)`.
2. `market_item_update.py` — заменены все вызовы `call_vk_api` для `market.edit`, `market.removeFromAlbum`, `market.addToAlbum` и `upload_market_item_photo` на `call_vk_api_for_group` с передачей `group_id`.

**Файл(ы):** `backend_python/services/market_item_delete.py`, `backend_python/services/market_item_update.py`

---

### Ошибка сессии SQLAlchemy при массовом обновлении товаров

**Проблема:**  
При массовом сохранении 2+ товаров, если первый товар падал с ошибкой VK API, все последующие товары также не сохранялись с ошибкой `Instance '<MarketItem at 0x...>' is not persistent within this Session`. Результат: «Успешно обработано: 0 из 2, Ошибок: 2».

**Причина:**  
В `update_market_item()` при исключении от VK API пробрасывался `HTTPException`, но `db.rollback()` не вызывался. Сессия SQLAlchemy оставалась в «сломанном» состоянии (dirty/invalidated), и при следующей итерации цикла в `update_market_items()` объекты ORM становились detached.

**Решение:**  
1. В `update_market_item()` добавлен `db.rollback()` в `except` блок перед `raise HTTPException`.
2. В `update_market_items()` добавлен защитный `db.rollback()` при ловле ошибки каждого товара, обеспечивая чистую сессию для следующего.

**Файл(ы):** `backend_python/services/market_item_update.py`

---

### Фронт не обновлялся после массового удаления товаров

**Проблема:**  
После массового удаления товаров через toolbar (выделить → удалить) удалённые карточки оставались видимы в интерфейсе до ручного обновления страницы. Счётчики подборок также не обновлялись.

**Причина:**  
1. В `handleConfirmBulkDelete` (хук `useProductBulkActions.ts`) после успешного `api.deleteMarketItems()` не вызывалось обновление стейта — стоял комментарий-заглушка `// Здесь нужно будет вызвать обновление данных`.
2. В хук не передавались `setItems` и `setAlbums` для обновления данных.

**Решение:**  
1. Добавлены `setItems` и `setAlbums` в пропсы хука `useProductBulkActions`, передаются из `useProductsManager`.
2. После успешного удаления: удалённые товары убираются из стейта (`setItems`), очищаются их редактирования (`setEditedItems`), пересчитываются счётчики подборок (`setAlbums`).
3. Кэш `localStorage` обновляется автоматически через `useEffect` в `useProductData`.

**Файл(ы):** `features/products/hooks/useProductBulkActions.ts`, `features/products/hooks/useProductsManager.ts`

---

### Префикс «NEW» не применялся при импорте товаров из файла

**Проблема:**  
При импорте товаров из CSV/XLSX с включённой галочкой «Добавить NEW к названию», префикс «NEW » не добавлялся к названиям товаров в форме массового создания. Товары создавались с оригинальными названиями.

**Причина:**  
В `ProductsTab.tsx` колбэк `onCreate` в `UploadOptionsModal` игнорировал параметр `addPrefix`: `onCreate={() => handleInitiateMapping('create')}`. Значение чекбокса не сохранялось и не использовалось при формировании строк таблицы в `handleImportMappedRows`.

**Решение:**  
1. Добавлен стейт `addNewPrefix` в `ProductsTab.tsx`, который запоминает выбор пользователя из `UploadOptionsModal`.
2. В `handleImportMappedRows` добавлена проверка флага: если `addNewPrefix === true`, каждому товару добавляется префикс `NEW ` к `title`.
3. После обработки флаг сбрасывается в `false`.

**Файл(ы):** `features/products/components/ProductsTab.tsx`

---

### Колонки «VK ID» и «VK ссылка» отображались при создании новых товаров

**Проблема:**  
В модальном окне маппинга колонок при импорте из файла отображались поля «VK ID товара» и «VK ссылка на товар» даже в режиме создания новых товаров. Эти поля не имеют смысла для новых товаров (у них ещё нет VK ID) и вводили пользователя в заблуждение.

**Причина:**  
`FileImportMappingModal` не имел понятия режима (создание/обновление) и всегда показывал полный список `FIELD_OPTIONS`, включая `vk_id` и `vk_link`.

**Решение:**  
1. Добавлен проп `mode?: 'create' | 'update'` в `FileImportMappingModal`.
2. Создан `filteredFieldOptions` через `useMemo`: при `mode === 'create'` поля `vk_id` и `vk_link` скрываются.
3. Автоматический маппинг (`autoDetectMapping`) также пропускает `vk_id`/`vk_link` в режиме создания.
4. `ProductsTab.tsx` передаёт `mode={mappingMode || 'create'}` в модальное окно.

**Файл(ы):** `features/products/components/modals/FileImportMappingModal.tsx`, `features/products/components/ProductsTab.tsx`

---

### Ошибки валидации при массовом создании были незаметны

**Проблема:**  
При нажатии «Создать товары» в окне массового создания, если таблица содержала ошибки (пустые обязательные поля), ничего визуально не происходило — ни уведомления, ни автопрокрутки к ошибке. Пользователь должен был самостоятельно прокручивать таблицу в поисках подсвеченных строк.

**Причина:**  
В `handleSaveClick` при обнаружении ошибок выполнялся `return` без каких-либо уведомлений или навигации к проблемной строке.

**Решение:**  
1. При наличии ошибок показывается toast-уведомление с количеством ошибочных строк.
2. Первая строка с ошибкой автоматически прокручивается в центр видимой области через `scrollIntoView({ behavior: 'smooth', block: 'center' })`.
3. Для привязки используется атрибут `data-tempid` на элементах `<tr>` в `ProductRow.tsx`.

**Файл(ы):** `features/products/hooks/useCreateMultipleProducts.ts`, `features/products/components/modals/create-multiple/ProductRow.tsx`

---

### Прогресс-бар перенесён в футер + возможность отмены создания

**Проблема:**  
1. Прогресс-бар массового создания располагался над таблицей в прокручиваемой области `<main>`. При прокрутке таблицы вниз прогресс-бар уходил из видимости.
2. Отсутствовала возможность остановить процесс создания — пользователь должен был ждать завершения всех товаров, даже если обнаружил ошибку.

**Решение:**  
1. **Перенос прогресс-бара:** Прогресс-бар перемещён из `<main>` в фиксированный `<footer>` модального окна, рядом с кнопками управления. Теперь он всегда видим.
2. **Механизм отмены:** Реализован через паттерн `AbortController`:
   - В `useCreateMultipleProducts.ts` добавлен `abortControllerRef`, стейт `showCancelCreation` и обработчик `handleCancelCreation`.
   - В `useProductsManager.ts` функция `handleCreateMultipleProducts` принимает `signal?: AbortSignal` и проверяет `signal.aborted` перед каждой итерацией цикла. Оставшиеся товары помечаются как «Отменено пользователем».
   - Кнопка «Отмена» меняет текст на «Остановить» во время создания и остаётся кликабельной.
   - При нажатии «Остановить» показывается `ConfirmationModal` с информацией о прогрессе: «Уже создано X из Y товаров. Остальные не будут созданы.»
3. **Результаты отмены:** Уже созданные товары сохраняются, несозданные отображаются в таблице результатов как отменённые.

**Файл(ы):** `features/products/hooks/useCreateMultipleProducts.ts`, `features/products/hooks/useProductsManager.ts`, `features/products/components/modals/CreateMultipleProductsModal.tsx`

---

### Группировка записей по разделам в Центре обновлений

**Задача:**  
В «Центре обновлений» (страница «Обновления») все записи внутри категорий (Новые возможности / Улучшения / Исправления) отображались плоским списком. При большом количестве записей было сложно найти изменения, относящиеся к конкретному разделу приложения (например, «Контент — Товары» или «Автоматизации — Конкурс отзывов»).

**Решение:**  
1. **Хелпер `groupBySection`:** Добавлена функция группировки массива `UpdateEntry[]` по полю `section`. Записи без `section` попадают в группу «Общее». Порядок групп определяется порядком первого вхождения записи с данным `section`.
2. **Подзаголовки разделов:** Внутри каждой из трёх категорий (features/improvements/bugfixes) карточки теперь группируются по `section`. Каждая группа имеет визуальный подзаголовок: иконка 📂, название раздела (uppercase), горизонтальная разделительная линия и счётчик записей в группе.
3. **Убран бейдж `section` с карточек:** Так как раздел теперь виден из подзаголовка группы, индивидуальный бейдж `📂 section` убран с карточек. Бейдж `impactType` (🎨/⚙️/🔄) остался.
4. **Ранее добавленные поля `section` и `impactType`:** Все записи в `release2Data.ts` (22 шт.) и `updatesData.ts` (16 шт.) были размечены полями `section` и `impactType`. Тип `ImpactType` и поля добавлены в интерфейс `UpdateEntry`.

**Файл(ы):** `features/updates/components/UpdatesPage.tsx`, `features/updates/data/updatesData.ts`, `features/updates/data/release2Data.ts`

---

### Переносы строк в ячейках ломали TSV-парсер при вставке из буфера

**Проблема:**  
При копировании таблицы из Google Sheets / Excel, если ячейка содержала переносы строк (Enter), формат TSV оборачивал содержимое в кавычки. Наивный парсер (`split(/\r\n|\n|\r/)`) разбивал такую ячейку на несколько строк — данные «сползали», появлялись лишние пустые строки, колонки не совпадали.

**Причина:**  
TSV-формат (RFC 4180) требует обработки кавычек: если ячейка начинается с `"`, содержимое до парной закрывающей `"` является одной ячейкой, даже если внутри есть `\n`. Предыдущий код не учитывал этот стандарт.

**Решение:**  
Создан полноценный TSV-парсер `tsvParser.ts` — посимвольный конечный автомат, поддерживающий:
- Ячейки в кавычках с переносами строк
- Экранирование кавычек (`""` → `"`)
- Корректное определение конца строки и конца ячейки
- Обрезку пробелов для каждой ячейки

Заменён `text.split(/\r\n|\n|\r/)` на `parseTSV(text)` в `PasteFromClipboardModal.tsx`.

**Файл(ы):** `features/products/utils/tsvParser.ts`, `features/products/components/modals/PasteFromClipboardModal.tsx`

---

### Категория не маппилась при импорте из буфера обмена

**Проблема:**  
При массовом создании товаров из буфера обмена категория не применялась, даже если в скопированных данных была колонка «Категория» с корректными значениями (например, «Суши и роллы (30543)»). В таблице создания все товары отображались без категории.

**Причина:**  
Формат экспорта содержит ID категории в скобках: `"VR-шлем (41347)"`. В `PasteFromClipboardModal` поиск шёл через `categories.find(c => c.name === cellValue)`, где `c.name = "VR-шлем"`, а `cellValue = "VR-шлем (41347)"` — точного совпадения не было. В `FileImportMappingModal` аналогичная проблема решалась через `idMatch`, но в буферном модале этого кода не было.

**Решение:**  
Добавлена двухступенчатая логика поиска в `PasteFromClipboardModal`:
1. Из значения ячейки извлекается ID в скобках (regex `/\((\d+)\)$/`).
2. Если ID найден — поиск категории по `c.id === extractedId`.
3. Если ID не найден — fallback поиск по имени `c.name === cleanCellValue`.

**Файл(ы):** `features/products/components/modals/PasteFromClipboardModal.tsx`

---

### Данные о товарах и подборках не обновлялись после создания

**Проблема:**  
После массового создания товаров (из буфера или файла) интерфейс не отражал изменения: счётчики подборок оставались прежними, новые товары не появлялись в списке до ручного обновления страницы. При создании одного товара — аналогично.

**Причина:**  
В `useProductsManager.ts` после вызова `handleCreateSingleProduct` и `handleCreateMultipleProducts` не вызывалась функция обновления данных.

**Решение:**  
Добавлен вызов `dataActions.handleRefreshAll()` после успешного создания как одиночного, так и массового товара. Функция синхронизирует данные с VK API: обновляет список товаров, пересчитывает количество товаров в подборках.

**Файл(ы):** `features/products/hooks/useProductsManager.ts`

---

### CSV из Google Sheets отображал кириллицу как mojibake

**Проблема:**  
При экспорте товаров в CSV, редактировании в Google Sheets, сохранении как CSV и повторном импорте — кириллический текст отображался как нечитаемые символы (mojibake): `Đ¢Đ°Đ´Ñ‚Đ°Đ²` вместо «Такуан ролл». Заголовки колонок и содержимое ячеек были полностью нечитаемы.

**Причина:**  
Функция `parseFileToGrid()` использовала `FileReader.readAsArrayBuffer()` + `XLSX.read(data, { type: 'array' })` для всех типов файлов. Библиотека XLSX при получении CSV как ArrayBuffer не определяет кодировку и интерпретирует байты UTF-8 как Latin-1, что ломает кириллицу.

**Решение:**  
1. Добавлена функция `isBinaryExcelFile()` — определяет формат файла по magic bytes (первые 4 байта): XLSX = ZIP `PK\x03\x04`, XLS = OLE2 `0xD0CF11E0`.
2. Для бинарных Excel-файлов — сохранён прежний путь через `readAsArrayBuffer` + XLSX.
3. Для CSV/TSV/текстовых файлов — создан отдельный парсер `parseCSVFile()`:
   - Читает файл как `readAsText(file, 'UTF-8')` — корректная обработка кириллицы.
   - Удаляет BOM (`\uFEFF`) если присутствует.
   - Автоопределение разделителя (запятая, точка с запятой, табуляция) через `detectCSVDelimiter()`.
   - Полноценный CSV-парсер (`parseCSVText()`) по RFC 4180: кавычки, переносы строк, экранирование `""`.
4. Общая функция `normalizeGrid()` приводит результат к прямоугольной сетке.

**Файл(ы):** `features/products/utils/fileParser.ts`

---

### TS-ошибка showAppToast в FileImportMappingModal

**Проблема:**  
В `FileImportMappingModal.tsx` использовался `window.showAppToast?.()`, что вызывало TS-ошибку `Property 'showAppToast' does not exist on type 'Window & typeof globalThis'` (TS2339). Проект не собирался.

**Причина:**  
В `toastBridge.ts` присвоение `window.showAppToast = showAppToast` подавлялось через `@ts-ignore`, но в других файлах обращение к `window.showAppToast` без типизации вызывало TS-ошибку.

**Решение:**  
Заменён `window.showAppToast` на `(window as any).showAppToast` в обоих местах использования.

**Файл(ы):** `features/products/components/modals/FileImportMappingModal.tsx`

---

### Улучшение UX модального окна «Импорт данных из буфера» (3 пункта)

**Проблема:**  
1. При вставке данных из буфера обмена колонки всегда инициализировались на «Пропустить», даже если в первой строке были заголовки, совпадающие с полями системы (Название, Описание, Цена и т.д.). Пользователю приходилось вручную выставлять каждый маппинг.
2. Ничто не мешало пользователю выбрать одно и то же поле (например, «Описание») для двух разных колонок, что приводило к перезаписи данных при импорте.
3. Выпадающие списки маппинга колонок использовали нативный `<select>` браузера с чёрной обводкой при фокусе, что не соответствовало дизайн-системе приложения (indigo-стилистика).

**Решение:**  
1. **Авто-маппинг по заголовкам:** При вставке данных первая строка анализируется через `HEADER_MAP` (карта из `fileParser.ts`). Если значение ячейки совпадает с известным заголовком (`название` → `title`, `цена` → `price` и т.д.), поле автоматически выставляется. Гарантируется уникальность: каждое поле маппится не более одного раза.
2. **Валидация уникальности выбора:** Через `useMemo` вычисляется `usedFields` — множество уже занятых полей. В кастомном дропдауне занятые поля отображаются с пометкой «занято» и `disabled`, что исключает дублирование выбора.
3. **Кастомный dropdown через портал:** Нативный `<select>` заменён на компонент `ColumnMappingDropdown`, рендерящийся через `createPortal` в `document.body`. Это обеспечивает: корректное отображение поверх таблицы с `overflow: auto`, голубую indigo-обводку при фокусе (`focus:ring-2 focus:ring-indigo-500`), визуальную галочку у выбранного пункта, закрытие по клику-вне/скроллу/ресайзу.

**Файл(ы):** `features/products/components/modals/PasteFromClipboardModal.tsx`

---

### Массовая AI-коррекция всех предложенных постов («Отредактировать все»)

**Задача:**  
При работе с предложенными постами (отзывами) пользователю приходилось нажимать «Редактор AI» для каждого поста отдельно — отдельный запрос к нейронке на каждый отзыв. При 10–20 постах это занимало много времени и расходовало токены неэффективно.

**Решение:**  
Добавлен новый эндпоинт `POST /ai/bulkCorrectSuggestedPosts` и кнопка «Отредактировать все (N)» на фронтенде.

**Архитектура:**
1. **Backend:** Новый эндпоинт принимает массив `[{id, text}]`. Информация о группе (`groups.getById`) и переменная `DLVRY` запрашиваются **один раз** для всех постов. Формируется один промпт с чётким JSON-форматом вывода. Ответ парсится с fallback-логикой (````json` блоки → поиск массива → raw parse). При >10 постах автоматический батчинг.
2. **Frontend:** Кнопка «Отредактировать все» рядом с «Обновить». Макет переключается в режим bulk: все посты отображаются в split view (пост слева, AI-редактор справа). Каждый текст можно отредактировать вручную и скопировать отдельно.
3. **Промпт:** Адаптирован существующий промпт коррекции отзывов — те же правила (хештег, благодарность, DLVRY), но для набора отзывов с привязкой к ID.

**Новые схемы:** `SuggestedPostItem`, `BulkCorrectSuggestedPostsPayload`, `BulkCorrectedPostItem`, `BulkCorrectedSuggestedPostsResponse`

**Файл(ы):**  
- Backend: `schemas/api_payloads.py`, `schemas/api_responses.py`, `schemas/__init__.py`, `routers/ai.py`, `services/ai_service.py`, `services/gemini_api/correction.py`, `services/gemini_service.py`
- Frontend: `services/api/ai.api.ts`, `features/suggested-posts/hooks/useSuggestedPostsManager.ts`, `features/suggested-posts/components/SuggestedPostsTab.tsx`, `features/suggested-posts/components/SuggestedPostsLayout.tsx`, `features/suggested-posts/components/AiEditor.tsx`

---

### 502 Bad Gateway при загрузке данных на предпроде (батчи и обновление проектов)

**Проблема:**  
На предпроде первый батч загрузки контента (Фаза 2) стабильно падал с ошибкой `502 Bad Gateway`. Аналогичная ошибка возникала при принудительном обновлении проектов через сайдбар — все 145 проектов отправлялись одним запросом `getAllPostsForProjects`, что перегружало контейнер Yandex Cloud.

**Причина:**  
1. `MAX_RETRIES` в `callApi` был равен `1` — т.е. повторных попыток не было вообще. При «холодном» контейнере первый тяжёлый запрос после лёгких запросов Фазы 1 не успевал обработаться.
2. Функция `handleForceRefreshProjects` отправляла ВСЕ ID проектов (145 шт.) одним запросом, в отличие от `useDataInitialization`, где загрузка уже была разбита на батчи по 5.

**Решение:**  
1. Увеличен `MAX_RETRIES` с `1` до `3` в `callApi`. Логика ретраев уже была реализована (экспоненциальный бэкофф 1с → 2с → 4с, без ретраев для 4xx), но фактически не работала из-за `MAX_RETRIES = 1`.
2. Функция `handleForceRefreshProjects` переписана: загрузка контента теперь идёт батчами по 5 проектов (как в `useDataInitialization`), с обработкой ошибок на уровне батча — при падении одного батча остальные продолжат загрузку.

**Файл(ы):** `shared/utils/apiClient.ts`, `contexts/hooks/useDataRefreshers.ts`

---

### Добавлена иконка вкладки браузера (favicon)

**Проблема:**  
Во вкладке браузера отсутствовала иконка приложения — отображалась стандартная иконка (или пустое место). В консоли при каждой загрузке была ошибка `GET /favicon.ico 404 (Not Found)`. Файл `favicon.ico` в папке `public/` существовал, но был заполнен нулями (1000 байт нулей).

**Решение:**  
1. Создан SVG-файл `public/favicon.svg` — синий скруглённый квадрат с буквой «β» (бета), обозначающей предпродакшен-версию.
2. В `index.html` добавлен тег `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` — SVG-формат поддерживается всеми современными браузерами и выглядит чётко на любых разрешениях.

**Файл(ы):** `public/favicon.svg`, `index.html`

---
