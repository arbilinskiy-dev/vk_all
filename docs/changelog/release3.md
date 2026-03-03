# 📋 Release Log 3 — Журнал релизов

Продолжение журнала релизов. Предыдущий файл: `release2.md`.

---

## 🔴 Открытые задачи

_(нет открытых задач)_

---

## ✅ Решённые задачи

### Закреплённый пост не отображался в расписании

**Проблема:**  
После закрепления поста на стене сообщества через кнопку в приложении, в расписании не было никакой визуальной индикации того, какой пост закреплён. Поле `is_pinned` всегда приходило как `false` на фронтенд.

**Причина:**  
VK API корректно отдавал `is_pinned: 1` через `wall.get`, и форматтер его парсил. Однако при сохранении в БД поле терялось по двум причинам:
1. В SQLAlchemy-модели `Post` (таблица `posts`) **отсутствовала колонка** `is_pinned` (была только в `SystemPost`).
2. CRUD-методы `replace_published_posts` и `upsert_published_posts` **не копировали** `is_pinned` из dict’а в ORM-объект.
3. Pydantic-схема `PostBase` имела `is_pinned: Optional[bool] = False`, но из-за отсутствия атрибута в ORM всегда возвращала дефолт `False`.

**Решение:**  
1. Добавлена колонка `is_pinned = Column(Boolean, default=False)` в модель `Post`.
2. Оба CRUD-метода теперь передают `is_pinned=p.get('is_pinned', False)` при создании/обновлении ORM-объектов.
3. Эндпоинты `pinPost`/`unpinPost` теперь сразу обновляют `is_pinned` в БД (сбрасывают у других постов, ставят у текущего).
4. Добавлена миграция 52 для существующей БД.
5. Улучшен бейдж на карточке: вместо маленького кружка — заметный amber-бейдж «Закреплён» + amber-рамка карточки.

**Файл(ы):**
- `backend_python/models_library/posts.py`
- `backend_python/crud/post_crud.py`
- `backend_python/routers/posts.py`
- `backend_python/db_migrations/posts.py`
- `features/posts/components/PostCard.tsx`

---

### 502 ошибки при загрузке данных проектов (getAllPostsForProjects)

**Проблема:**  
После авторизации при загрузке данных для ~145 проектов эндпоинт `getAllPostsForProjects` стабильно возвращал 502 Bad Gateway. Приложение не могло загрузить посты, отложенные записи, предложенные записи, системные посты, заметки и истории.

**Причина:**  
Множество проблем:
1. **N+1 SQL запросы:** Функция `get_unified_stories` выполняла отдельный SQL-запрос для каждого проекта через сетевую PostgreSQL (pgbouncer, порт 6432). При 145 проектах = 145 последовательных запросов + JSON-сериализация.
2. **Монолитный ответ:** Все 7 типов данных (`posts`, `scheduled`, `suggested`, `system`, `notes`, `stories`, `globalVars`) загружались одним HTTP-запросом. Размер ответа превышал лимит Yandex Cloud Serverless Containers (~3.5 МБ).
3. **29×12 setState вызовов:** На фронтенде данные распаковывались и записывались в состояние проект за проектом, вызывая массовые ре-рендеры.

**Решение (v62 → v63, поэтапно):**

**Этап 1 — 6 батчевых эндпоинтов (v62):**
- Создан `backend_python/crud/batch_crud.py` с 6 функциями: `get_posts_batch`, `get_scheduled_posts_batch`, `get_suggested_posts_batch`, `get_system_posts_batch`, `get_notes_batch`, `get_stories_batch`.
- Создан `backend_python/routers/batch.py` с 6 POST-эндпоинтами, принимающими `{ project_ids: string[] }`.
- Создан `services/api/batch.api.ts` — 6 API-функций на фронтенде.
- Полностью переписан `contexts/hooks/useDataInitialization.ts`:
  - **Phase 1:** загрузка проектов + счётчиков → UI готов к взаимодействию.
  - **Phase 2:** параллельная загрузка контента через `Promise.allSettled`.

**Этап 2 — Фикс stories (v63):**
- Поле `viewers` в историях содержало огромные JSON-массивы (тысячи просмотревших). Исключено из batch-ответа в `get_stories_batch` через `column_property` / ручную фильтрацию полей.
- Добавлен try/except + logging во все batch-эндпоинты.

**Этап 3 — Чанкинг по размеру (v63):**
- Экспериментально определён лимит Yandex Cloud: ~3.5 МБ на ответ (22 проекта = 3.06 МБ ✅, 24 проекта = 502 ❌).
- Внедрён чанкинг на фронтенде:
  - `HEAVY_CHUNK_SIZE = 10` — посты и истории загружаются порциями по 10 проектов.
  - `MAX_CONCURRENT = 5` — ограничение параллельных запросов.
  - `chunkArray()` и `fetchInChunks()` — утилиты для разбивки и последовательной загрузки.
  - Лёгкие типы (scheduled, suggested, system, notes) загружаются одним запросом.

**Файл(ы):**
- `backend_python/crud/batch_crud.py` (создан)
- `backend_python/routers/batch.py` (создан)
- `backend_python/main.py` (добавлен router)
- `services/api/batch.api.ts` (создан)
- `contexts/hooks/useDataInitialization.ts` (переписан)

---

### Favicon не отображается на предпроде

**Проблема:**  
После деплоя фронтенда на S3 бакет предпрода (`vk-content-planner-frontend-preprod`) иконка сайта (favicon) не отображалась в браузере.

**Причина:**  
Скрипт деплоя выполнял `yc storage s3 rm --recursive` (полная очистка бакета), затем загружал только 3 файла: `index.html`, `*.js`, `*.css`. Файлы `favicon.svg` и `favicon.ico` из папки `dist/` не загружались.

**Решение:**  
Загружены оба файла favicon в S3 бакет с правильными MIME-типами:
- `favicon.svg` → `image/svg+xml`
- `favicon.ico` → `image/x-icon`

**Файл(ы):** Процедура деплоя (загрузка в S3)

---

### Каскадная анимация проектов в сайдбаре слишком быстрая

**Проблема:**  
Проекты в сайдбаре появлялись визуально «все сразу», без заметного каскадного эффекта сверху вниз. Пользователь воспринимал загрузку как резкую.

**Причина:**  
Задержка между элементами составляла всего 30 мс. При ~15 видимых проектах каскад проигрывался за 450 мс — слишком быстро для восприятия. Смещение `translateY(20px)` было избыточным для маленьких элементов сайдбара.

**Решение:**
1. Задержка между элементами: 30 мс → 50 мс.
2. Добавлен потолок максимальной задержки: `Math.min(animationIndex * 50, 800)` — элементы далеко внизу списка не ждут слишком долго.
3. Длительность анимации: 0.3 с → 0.35 с.
4. Смещение: `translateY(20px)` → `translateY(12px)` — более аккуратное движение.

**Файл(ы):** `features/projects/components/ProjectListItem.tsx`, `index.html` (CSS keyframes)

---

### 🔐 Критический баг: несовпадение ключей шифрования (токены невалидны на предпроде)

**Проблема:**  
На предпроде `verifyToken` стабильно возвращал HTTP 400 для всех системных аккаунтов, кроме одного. В консоли браузера ошибка VK API: `User authorization failed: invalid access_token (4). (Code: 5)`. Аккаунты "Андрей Трафик", "Андрей Контент", "Андрей Менедж", "Андрей Тех", "Андрей Билинский" — все показывали «ошибка», только "Андрей Бобров" работал.

**Причина:**  
Токены проектов были зашифрованы ключом `aq-sMA9Y6jhyssTJewDmpcAS_3Qu9rXq35wZjZdDV-Q=` на старом контейнере `predprod2` (февраль 2–9), но после пересоздания контейнера `vk-planner-backend-preprod` (12 февраля) в переменных окружения был указан **другой** ключ `uvdbj3CxWuPL3DfPbItfioOeG6ToOLfdwdlPQv6AqlE=`. При чтении из БД `EncryptedString.process_result_value` не мог расшифровать токены новым ключом, но **молча возвращал зашифрованные данные** (`gAAAAA...`) вместо ошибки. Фронтенд отправлял эти зашифрованные строки как VK-токены, VK API закономерно отвечал «invalid access_token».

**Детальный процесс расследования (12 этапов):**

#### Этап 1 — Обнаружение симптома
Пользователь сообщил: на предпроде `verifyToken` возвращает 400 для всех аккаунтов. В консоли браузера — `VK_API_ERROR: invalid access_token (4), Code: 5`.

#### Этап 2 — Анализ потока данных verifyToken
Проанализирован полный путь вызова:
- Фронтенд: `useSystemAccounts.ts` → `api.verifyToken(acc.token!)` — отправляет токен из полученного аккаунта.
- Бэкенд: роутер `system_accounts.py` → `account_service.verify_token()` → `raw_vk_call('users.get', {access_token: clean_token})`.
- Токен приходит из БД через SQLAlchemy-модель → `EncryptedString` TypeDecorator → `process_result_value()`.

#### Этап 3 — Ключевая улика из console.log
В логах запросов браузера обнаружено:
- ✅ Работающий запрос (Андрей Бобров): `token: 'vk1.a.Q507...'` — **plain-text VK-токен**.
- ❌ Нерабочие запросы: `token: 'gAAAAABpTlvF...'` — **зашифрованная Fernet-строка** отправлялась как VK-токен!

**Вывод:** `process_result_value` при ошибке расшифровки возвращает «сырые» зашифрованные данные вместо ошибки.

#### Этап 4 — Анализ EncryptedString (models_library/types.py)
```python
# Строки 47-63 types.py
def process_result_value(self, value, dialect):
    try:
        return cipher_suite.decrypt(value.encode()).decode()
    except Exception as e:
        print(f"Error decrypting data (returning raw): {e}")
        return value  # ← МОЛЧА ВОЗВРАЩАЕТ ЗАШИФРОВАННЫЕ ДАННЫЕ
```
**Критический дефект:** при несовпадении ключа — никакой ошибки для вызывающего кода, только `print()` в логи.

#### Этап 5 — Прямая проверка расшифровки (test_decrypt3.py)
Подключились к PostgreSQL напрямую (минуя SQLAlchemy), попробовали расшифровать текущим ключом:
- Системные аккаунты: **6/6 OK** ✅ (все расшифровались в `vk1.a...`).
- Проекты (communityToken): **0/10 OK, 10/10 FAIL** ❌ (`InvalidToken`).

**Вывод:** Ключ НЕ подходит для токенов проектов, но подходит для системных аккаунтов.

#### Этап 6 — Анализ Fernet-меток времени (test_decrypt4.py)
Декодировали бинарный формат Fernet (base64 → version + 8-byte big-endian timestamp):
- Системные аккаунты зашифрованы: `2026-02-12 17:40:38 UTC` — **текущий день**.
- Токены проектов зашифрованы: `2026-02-09 20:12:06 UTC` — **3 дня назад**.

**Вывод:** Данные шифровались в разные дни → **разными экземплярами** приложения → потенциально разными ключами.

#### Этап 7 — Гипотеза: «ключ никогда не менялся»
Пользователь утверждал, что ключ `uvdbj3CxWuPL3DfPbItfioOeG6ToOLfdwdlPQv6AqlE=` использовался всегда. Проверили:
- Все `.env` файлы на Desktop — одинаковый ключ.
- `deploy_preprod.bat` — тот же ключ.
- `config.py` — получает из env-переменной.

#### Этап 8 — Расширенный поиск ключей (test_decrypt5.py)
Создан скрипт, сканирующий **все** текстовые файлы на Desktop рекурсивно:
- Паттерн: regex `ENCRYPTION_KEY[=:]\s*[Fernet-compatible value]`.
- Дополнительно: brute-force поиск всех 44-символьных base64-строк и проверка через `Fernet()`.
- Результат: **только один ключ** найден локально.

#### Этап 9 — Проверка Yandex Cloud ревизий контейнеров
Запустили `yc serverless container list` и нашли **3 контейнера**:
| Контейнер | Ревизии | Период |
|-----------|---------|--------|
| `vk-planner-backend-preprod` | 6 ревизий | 12 февраля (все) |
| `vk-planner-backend` (production) | 1 ревизия | 2 декабря 2025 |
| **`predprod2`** | 2 ревизии | **2 февраля и 6 февраля** |

Ревизии `predprod2` совпадают по датам с timestamps в Fernet-токенах проектов!

#### Этап 10 — ROOT CAUSE: другой ключ в predprod2
Запустили `yc serverless container revision get --id <revision>` для ревизии `predprod2`:
```
ENCRYPTION_KEY = aq-sMA9Y6jhyssTJewDmpcAS_3Qu9rXq35wZjZdDV-Q=
```
**Это ДРУГОЙ ключ!** Не совпадает с текущим `uvdbj3CxWuPL3DfPbItfioOeG6ToOLfdwdlPQv6AqlE=`.

**Хронология событий:**
1. **2 февраля–9 февраля:** Контейнер `predprod2` с ключом `aq-sMA9Y...` шифровал токены проектов.
2. **12 февраля:** Создан новый контейнер `vk-planner-backend-preprod` с ключом `uvdbj3Cx...`.
3. Токены в БД остались зашифрованы старым ключом → расшифровка с новым ключом невозможна → `process_result_value` молча возвращает `gAAAAA...`.

#### Этап 11 — Верификация старого ключа
Попробовали расшифровать 5 токенов проектов старым ключом `aq-sMA9Y...`:
- **5/5 OK** ✅ — все расшифровались в валидные `vk1.a...` токены.

#### Этап 12 — Миграция (migrate_keys.py)
Создан и запущен скрипт `migrate_keys.py`:
1. Подключение к PostgreSQL (`psycopg2`).
2. Для каждого зашифрованного значения (`gAAAAA...`):
   - Попытка расшифровать **новым** ключом → если OK, пропустить (уже мигрировано).
   - Попытка расшифровать **старым** ключом → если OK: расшифровать, зашифровать новым ключом, обновить в БД.
3. Обработаны 2 колонки: `communityToken` (строка) и `additional_community_tokens` (JSON-массив объектов с полем `token`).
4. Результат: **136 токенов мигрировано**, 5 plain-text пропущено, всё закоммичено в БД.
5. Пользователь подтвердил: «все на предпроде нормальные токены вижу».

**Решение:**  
Выполнена миграция всех токенов с помощью скрипта `migrate_keys.py`. Все зашифрованные данные перешифрованы со старого ключа (`aq-sMA9Y...`) на актуальный (`uvdbj3Cx...`).

**Диагностические и миграционные скрипты (сохранены для повторного использования):**

| Скрипт | Назначение |
|--------|-----------|
| `backend_python/test_decrypt3.py` | Проверка расшифровки + гипотеза двойного шифрования + варианты ключей |
| `backend_python/test_decrypt4.py` | Анализ Fernet-меток времени + поиск всех ENCRYPTION_KEY в .env файлах на Desktop |
| `backend_python/test_decrypt5.py` | Финальный: рекурсивный поиск всех ключей (regex + brute-force) + попытка расшифровки каждым |
| `backend_python/migrate_keys.py` | **Миграция** токенов со старого ключа на новый (communityToken + additional_community_tokens) |

**Статистика миграции:**
- Всего проектов с токенами: 141
- Зашифрованных (старый ключ): 136 → мигрировано
- Plain-text (не зашифрованных): 5 → пропущено
- Ошибок: 0

**Известная уязвимость:**  
`EncryptedString.process_result_value` при ошибке расшифровки молча возвращает зашифрованные данные — без исключения и без флага ошибки. Это маскирует проблему до момента, когда зашифрованная строка попадает во внешний API.

**Рекомендация:** Рассмотреть добавление явного `raise` или логирования на уровне `WARNING` в `process_result_value` при ошибке расшифровки.

**Файл(ы):**
- `backend_python/models_library/types.py` (EncryptedString — core проблемы, не изменён)
- `backend_python/migrate_keys.py` (создан — скрипт миграции)
- `backend_python/test_decrypt3.py` (создан — диагностика)
- `backend_python/test_decrypt4.py` (создан — диагностика: Fernet timestamps)
- `backend_python/test_decrypt5.py` (создан — диагностика: brute-force поиск ключей)

---

### VK-разметка в превью поста (гиперссылки, хэштеги)

**Задача:**  
В превью поста (колонка «Предпросмотр» в модальном окне) VK-разметка отображалась как сырой текст. Например, `@id18407603 (Никита)` отображалось буквально вместо кликабельной ссылки «Никита».

**Решение:**  
Создана переиспользуемая утилита `renderVkFormattedText` в `shared/utils/`. Парсит текст регулярным выражением и возвращает массив React-элементов, где обычный текст остаётся как есть, а разметка превращается в `<a>` ссылки.

**Поддерживаемые конструкции:**
| Синтаксис | Пример | Результат |
|---|---|---|
| `@id123 (Текст)` | `@id18407603 (Никита)` | Синяя ссылка «Никита» → `vk.com/id18407603` |
| `@club123 (Текст)` | `@club12345 (Паблик)` | Ссылка «Паблик» → `vk.com/club12345` |
| `[id123\|Текст]` | `[id18407603\|Никита]` | Ссылка «Никита» |
| `[URL\|Текст]` | `[https://vk.me/club\|Написать нам]` | Кликабельная ссылка «Написать нам» |
| `#хэштег` | `#роллы` | Ссылка на поиск VK |

**Дополнение (13.02.2026):** В регулярное выражение `VK_MARKUP_REGEX` добавлена новая альтернатива `\[(https?:\/\/[^|\]]+)\|([^\]]+)\]` для поддержки произвольных URL в квадратных скобках. Ранее поддерживались только `[id/club/public/event + числовой ID | Текст]`.

**Файл(ы):**
- `shared/utils/renderVkFormattedText.tsx` (создан, дополнен)
- `features/posts/components/modals/PostPreview.tsx` (изменён — интеграция утилиты)

---

### Undo/Redo в текстовом поле поста (Ctrl+Z / Ctrl+Shift+Z)

**Задача:**  
React controlled `<textarea>` теряет нативную историю undo браузера при программном изменении value (вставка AI-текста, эмодзи, переменных). Пользователь не мог отменить действия Ctrl+Z после вставки сгенерированного текста.

**Решение:**  
Создан хук `useTextUndoHistory` с собственным стеком истории (100 снапшотов максимум). Перехватывает `keydown` на textarea и обрабатывает Ctrl+Z (undo), Ctrl+Shift+Z / Ctrl+Y (redo). Дебаунс 300мс при обычном наборе (чтобы не создавать снапшот на каждую букву).

Добавлены кнопки «Отменить» / «Повторить» со стрелками в области текстового поля (справа от лейбла «Текст публикации») с реактивными флагами `canUndo`/`canRedo`. Рядом — тултип-подсказка с горячими клавишами.

**Хук возвращает:** `{ undo, redo, canUndo, canRedo }`

**Файл(ы):**
- `shared/hooks/useTextUndoHistory.ts` (создан)
- `features/posts/components/modals/PostTextSection.tsx` (изменён — кнопки, подсказка, интеграция хука)

---

## Редизайн модального окна создания/редактирования поста (13.02.2026)

### Новый компонент SlidePanel — выезжающая панель вместо центрированного модального окна

**Задача:**  
Стандартное центрированное модальное окно было слишком узким для сложных форм (создание поста, настройки). Не хватало рабочего пространства для одновременного отображения настроек, текста, AI-помощника и превью.

**Решение:**  
Создан полностью новый компонент `SlidePanel` — выезжающая панель, которая появляется справа и занимает до 80% ширины экрана:

1. **Анимация:** Панель выезжает справа налево с кубической кривой Безье (`cubic-bezier(0.16, 1, 0.3, 1)`), overlay плавно появляется. Закрытие — обратная анимация `slide-panel-out`.
2. **Хлястик закрытия (close flap):** Кнопка-крестик прикреплена к левому краю панели, вне самой панели. Скруглённая форма `rounded-l-2xl`, с тенью `shadow-lg`, позиционирование `self-start mt-4 -mr-1`.
3. **Скруглённые углы:** Левый край панели `rounded-l-2xl`.
4. **Overlay:** Затемнённый полупрозрачный фон `bg-black bg-opacity-50`. Закрытие по клику на overlay (отключаемо через `disableOverlayClose`).
5. **Управление:** Escape-кнопка для закрытия (отключаемо через `disableEscapeClose`), блокировка скролла `body` (`overflow: hidden`) при открытой панели.
6. **Адаптивность:** `w-full` на мобильных, `sm:w-[85vw]`, `md:w-[85vw]`, минимальная ширина `320px`.
7. **Настраиваемые пропсы:** `width`, `zIndex`, `className`, `disableOverlayClose`, `disableEscapeClose`.

**CSS-анимации** добавлены в `index.html`:
- `@keyframes slide-panel-overlay-in` — fade-in overlay
- `@keyframes slide-panel-in` — панель выезжает справа (`translateX(100%)` → `translateX(0)`)
- `@keyframes slide-panel-out` — панель уезжает обратно (`translateX(0)` → `translateX(100%)`)

**Файл(ы):**
- `shared/components/modals/SlidePanel.tsx` (создан)
- `index.html` (добавлены CSS-анимации slide-panel)

---

### PostDetailsModal переведён на SlidePanel

**Задача:**  
Модальное окно создания/редактирования поста использовало стандартный центрированный модал, который ограничивал рабочее пространство.

**Решение:**  
`PostDetailsModal` полностью переведён на `SlidePanel`. Кнопка закрытия убрана из header — закрытие теперь через хлястик SlidePanel. Header упрощён до заголовка `modalTitle` без лишних элементов.

Для постов «Конкурс 2.0» (`contest_v2_start`) используется отдельный мини-компонент `ContestV2PostModal` в SlidePanel шириной `50vw` с упрощённым layout.

**Файл(ы):** `features/posts/components/modals/PostDetailsModal.tsx`

---

### Переход с 3-колоночной раскладки на 4-колоночную

**Задача:**  
В 3-колоночной раскладке (Настройки | AI | Превью) колонка настроек перегружена — в ней одновременно были и опции, и текстовое поле, и вложения.

**Решение:**  
Реализована 4-колоночная раскладка с заголовками в едином стиле (`text-xs font-semibold text-gray-500 uppercase tracking-wider`):

| Колонка | Ширина | Содержимое |
|---------|--------|-----------|
| **НАСТРОЙКИ** | 30% | Табы публикации, закрепление на стене, PostCreationOptions, MultiProjectSelector, PostDateTimePicker |
| **AI-ПОМОЩНИК** | 25% | AIGenerator с `fillParent={true}`, редактирование AI-пресетов, мульти-генерация |
| **КОНТЕНТ** | 25% | PostTextSection (текст + переменные + эмодзи), PostMediaSection (фото/документы) |
| **ПРЕДПРОСМОТР** | 20% | PostPreview (карточка VK), сводка расписания мультипроекта |

Каждая колонка: `overflow-y-auto`, независимая прокрутка, разделение `border-r`.

**Файл(ы):** `features/posts/components/modals/PostDetailsModal.tsx`

---

### Предпросмотр поста в стиле VK (PostPreview)

**Задача:**  
В модальном окне не было наглядного предпросмотра — пользователь не мог оценить, как пост будет выглядеть в ленте VK.

**Решение:**  
Создан компонент `PostPreview` — карточка поста в стиле ВКонтакте:

1. **Шапка:** Аватар сообщества (реальный из `currentProject.avatar_url` или заглушка) + название проекта + форматированная дата/время
2. **Текст:** `whitespace-pre-wrap`, переносы строк, подстановка глобальных переменных через `useMemo resolvedText`
3. **Сетка изображений:**
   - 1 фото → полная ширина, `aspect-square`
   - 2 фото → `grid-cols-2`
   - 3 фото → `grid-cols-3`
   - 4+ фото → `grid-cols-2`, 4-е фото с полупрозрачным оверлеем `+N`
4. **Вложения:** Иконка скрепки + название файла, `bg-gray-50 rounded-md`
5. **Футер VK-стайл:** Декоративные кнопки лайк ❤️ / комментарий 💬 / шер ↗ (неактивные, визуал)
6. **Пустое состояние:** Иконка глаза + подсказка «Начните вводить текст или добавьте медиа...»
7. **Фон колонки:** Полупрозрачный `bg-gray-50/50` для визуального отделения

**Файл(ы):** `features/posts/components/modals/PostPreview.tsx` (создан)

---

### Табы способа публикации

**Задача:**  
Способ публикации (запланировать / в отложку / сейчас) не был визуально выражен и удобно управляем.

**Решение:**  
Реализованы 3 табовые кнопки в контейнере `bg-gray-200 rounded-lg`:
- **Запланировать** — стандартный таймслот через систему
- **В отложку VK** — черновик в отложенные записи VK
- **Опубликовать сейчас** — немедленная публикация

Активный таб подсвечивается (`bg-white shadow-sm rounded-md`). Табы влияют на видимость дата-пикера и переключателей.

**Файл(ы):** `features/posts/components/modals/PostDetailsModal.tsx`

---

### Тумблер «Закрепить на стене»

**Задача:**  
Не было визуального элемента для управления закреплением поста на стене сообщества из окна создания.

**Решение:**  
Добавлен переключатель с иконкой закладки (📌) в колонке «Настройки». При включении в заголовке колонки «Предпросмотр» появляется бейдж «Закреплён». Состояние передаётся в PostPreview через пропс `isPinned`.

**Файл(ы):** `features/posts/components/modals/PostDetailsModal.tsx`

---

### Блок «Будут запланированы посты» перенесён в колонку предпросмотра

**Задача:**  
Информационный блок располагался в футере (`PostModalFooter`). При изменении количества проектов футер менял высоту, вызывая «прыжки» интерфейса.

**Решение:**  
Блок перенесён в нижнюю часть колонки «Предпросмотр» с `flex-shrink-0`. Формат: `📋 Будет создано X постов в Y проектах`.

**Файл(ы):**
- `features/posts/components/modals/PostDetailsModal.tsx`
- `features/posts/components/modals/PostModalFooter.tsx`

---

### Секция «Переменные» отображается всегда + автозагрузка

**Задача:**  
Переменные скрывались за кнопкой-toggle. Пользователи забывали раскрыть секцию. Загрузка переменных происходила только по клику.

**Решение:**  
1. Кнопка-переключатель полностью удалена из `PostTextSection`.
2. Секция переменных отображается всегда — без анимации.
3. Кнопки заменены на текстовые: `↻ Обновить`, `⚙ Настроить`.
4. `useEffect` в `usePostDetails` при монтировании автоматически загружает:
   - Проектные переменные (проверка кэша `sessionStorage`, fallback на API)
   - Глобальные переменные (определения + значения через `api.getGlobalVariablesForProject`)
5. Новый стейт `globalVariableValues: ProjectGlobalVariableValue[]`

**Файл(ы):**
- `features/posts/components/modals/PostTextSection.tsx`
- `features/posts/hooks/usePostDetails.ts`

---

### Подстановка значений глобальных переменных в предпросмотре

**Задача:**  
В PostPreview отображались «сырые» плейсхолдеры `{global_phone}`.

**Решение:**  
Новые пропсы `globalVariables` и `globalVariableValues` в `PostPreview`. `useMemo` `resolvedText` итерирует по определениям, ищет значения по `definition_id`, заменяет через `replaceAll()`.

Цепочка данных: `usePostDetails → PostDetailsModal → PostPreview`

**Файл(ы):**
- `features/posts/hooks/usePostDetails.ts`
- `features/posts/components/modals/PostDetailsModal.tsx`
- `features/posts/components/modals/PostPreview.tsx`

---

### Аватарка сообщества в предпросмотре заменена на реальную

**Проблема:**  
В предпросмотре поста вместо реальной аватарки сообщества отображалась SVG-заглушка (иконка здания).

**Решение:**  
1. В `PostPreviewProps` добавлен проп `projectAvatar?: string`.
2. `PostPreview` рендерит `<img>` с реальной аватаркой, если есть, иначе — SVG-заглушку.
3. В `PostDetailsModal` прокинут `projectAvatar={currentProject?.avatar_url}`.

**Файл(ы):**
- `features/posts/components/modals/PostPreview.tsx`
- `features/posts/components/modals/PostDetailsModal.tsx`

---

### Текстовые кнопки AI-помощника + новая кнопка «Заменить»

**Задача:**  
Кнопки действий под сгенерированным AI-текстом были SVG-иконками без подписей. Не было возможности заменить весь текст поста одной кнопкой.

**Решение:**  
SVG-кнопки заменены на текстовые с цветовыми акцентами: «Regenerate» (gray), «Копировать» (blue), «Добавить» (green), **«Заменить»** (indigo). Новый проп `onReplacePostText` пробрасывается по цепочке `PostDetailsModal → AIGenerator → useAIGenerator → ChatHistory → ChatTurnDisplay`.

**Файл(ы):**
- `features/posts/components/ai/ChatTurnDisplay.tsx`
- `features/posts/components/ai/ChatHistory.tsx`
- `features/posts/hooks/useAIGenerator.ts`
- `features/posts/components/AIGenerator.tsx`

---

### Убраны неработающие кнопки форматирования + обновлённый тулбар

**Задача:**  
В тулбаре текстового поля были кнопки B, I, U, S и «», которые не работали (VK не поддерживает markdown/BB-code в постах). После удаления тулбар нуждался в реорганизации.

**Решение:**  
1. Кнопки B, I, U, S и «» удалены вместе с функциями `wrapSelection`/`insertQuotes`.
2. Кнопки «Отменить» / «Повторить» перенесены влево.
3. Счётчик символов (N/8206) перемещён в тулбар справа.
4. Textarea `rows` увеличен с 8 до 14.

**Файл(ы):** `features/posts/components/modals/PostTextSection.tsx`

---

### Эмодзи-пикер встроен в текстовое поле (inline)

**Задача:**  
Эмодзи-пикер открывался во всплывающем окне, которое перекрывало другие элементы в 4-колоночной раскладке.

**Решение:**  
В `EmojiPicker.tsx` добавлен проп `inline`. При `inline=true` компонент растягивается внутри контейнера без border/shadow. Эмодзи-пикер рендерится между тулбаром и textarea внутри общего `border`-контейнера. Управление кнопкой 😀 в тулбаре.

**Файл(ы):**
- `features/emoji/components/EmojiPicker.tsx`
- `features/posts/components/modals/PostTextSection.tsx`

---

### Глобальные переменные не сохранялись в настройках проекта

**Проблема:**  
При добавлении или изменении глобальных переменных в настройках проекта и нажатии «Сохранить» — значения не сохранялись. При повторном открытии модального окна поля были пустыми.

**Причина (3 бага):**
1. В `global_variable_service.py` при создании `ProjectGlobalVariableValue` не передавались обязательные поля `id` и `project_id` → Pydantic бросал `ValidationError`, который проглатывался except.
2. Фронтенд сохранял definitions и values параллельно через `Promise.all()`, но новые definitions получали UUID на бэкенде, а values ссылались на временные «new-xxx» ID.
3. Фронтенд отправлял только изменённые values, но бэкенд удалял все values проекта.

**Решение:**  
Definitions сохраняются первыми (`await`), бэкенд возвращает `idMapping`, фронтенд подставляет реальные ID и отправляет все values.

**Файл(ы):**
- `backend_python/services/global_variable_service.py`
- Фронтенд: хук/компонент настроек глобальных переменных

---

### Мультипроектная публикация + несколько постов — даты игнорировались

**Проблема:**  
При одновременном включении «Создать несколько постов» (bulk mode) и «Мультипроектная публикация» все посты для каждого проекта создавались с одной и той же датой/временем. Массив `dateSlots` (3 разные даты) полностью игнорировался.

**Причина:**  
`projectDateTimes` — словарь `{projectId → {date, time}}`, хранит одну дату на проект (от `dateSlots[0]`). В `handleSave` условие `formState.isMultiProjectMode && formState.projectDateTimes[projId]` всегда было truthy, поэтому ветка с `slot` (текущий dateSlot) никогда не выполнялась.

**Решение:**  
1. В `handleSave` добавлена отдельная ветка для комбинации `isBulkMode + isMultiProjectMode`: вычисляется сдвиг проекта (`projectDateTimes[projId] - dateSlots[0]`), который применяется к каждому dateSlot.
2. Сводка «Будет запланировано» переписана — показывает реальное количество (проекты × даты) с точными датами/временами.

**Пример:** 3 проекта × 3 даты = 9 постов, каждый с уникальной датой.

**Файл(ы):**
- `features/posts/hooks/usePostDetails.ts`
- `features/posts/components/modals/PostDetailsModal.tsx`

---

## 📊 Техническое резюме релиза

### Контейнер
- **Версии:** v62 → v63 (предпрод)
- **Контейнер:** `vk-planner-backend-preprod`
- **Конфигурация:** 4 ГБ RAM, 2 cores, concurrency 16, execution-timeout 300s

### Лимиты Yandex Cloud (обнаружено)
- Yandex Cloud Serverless Containers имеет **ограничение размера HTTP-ответа ~3.5 МБ**.
- При превышении возвращается 502 Bad Gateway без тела ответа.
- Обходное решение: чанкинг запросов на фронтенде (10 проектов за запрос для тяжёлых типов данных).

### Архитектурные изменения
- Старый подход: 1 запрос `/getAllPostsForProjects` → монолитный JSON со всеми 7 типами данных.
- Новый подход: 7 раздельных batch-запросов (`/getPostsBatch`, `/getScheduledPostsBatch`, и т.д.) + чанкинг по 10 проектов + параллельная загрузка с лимитом 5 одновременных запросов.
- Двухфазная загрузка: Phase 1 (проекты + счётчики) → UI готов → Phase 2 (контент параллельно в фоне).

### Криптография и безопасность
- Обнаружена и устранена проблема несовпадения ключей шифрования между контейнерами `predprod2` и `vk-planner-backend-preprod`.
- Старый ключ: `aq-sMA9Y6jhyssTJewDmpcAS_3Qu9rXq35wZjZdDV-Q=` (контейнер `predprod2`, 2–9 февраля).
- Актуальный ключ: `uvdbj3CxWuPL3DfPbItfioOeG6ToOLfdwdlPQv6AqlE=` (контейнер `vk-planner-backend-preprod`, 12 февраля+).
- 136 токенов мигрированы со старого ключа на актуальный.
- Диагностические скрипты сохранены в `backend_python/` для повторного использования.

### Ошибка создания товара с заглушкой (ERR_UPLOAD_BAD_IMAGE_SIZE)

**Проблема:**  
При создании товара с включённой опцией «Заглушка (дефолтное фото)» VK API возвращал ошибку `ERR_UPLOAD_BAD_IMAGE_SIZE: market photo min size 400×400`. Товар не создавался.

**Причина:**  
Файл-заглушка `backend_python/assets/default_product.jpg` был битым (6.6 КБ, Pillow не мог его открыть как изображение). Его размер в пикселях был меньше требуемого VK API минимума 400×400.

**Решение:**  
Перегенерировано изображение-заглушка 800×800 пикселей (28.7 КБ, корректный JPEG). Изображение содержит текст «Фото скоро будет добавлено на сайт» и иконку камеры на белом фоне. Создан скрипт `scripts/generate_placeholder.py` для повторной генерации при необходимости.

**Файл(ы):**
- `backend_python/assets/default_product.jpg` (перегенерирован)
- `backend_python/scripts/generate_placeholder.py` (создан)

---

### Индивидуальные даты/время для мультипроектной публикации

**Задача:**  
При мультипроектной публикации все выбранные проекты получали одну и ту же базовую дату и время (единственный способ «развести» — глобальный сдвиг на фиксированный интервал). Нужна возможность задать уникальную дату/время для каждого проекта по отдельности.

**Решение:**  
Реализована архитектура «индивидуальных дат/времени» поверх существующего механизма мультипроектной публикации.

1. **Новое состояние `projectDateTimes`** (`Record<projectId, {date, time}>`) — хранит дату/время для каждого выбранного проекта. Синхронизируется автоматически при изменении базовой даты, порядка проектов или параметров сдвига.
2. **Новое состояние `customOverrideIds`** (`Set<string>`) — набор проектов с ручной настройкой. Проекты из этого набора НЕ пересчитываются при изменении базовых параметров.
3. **UI:** В `MultiProjectSelector` список выбранных проектов (drag-and-drop) всегда отображается при 2+ проектах. У каждого проекта — свои поля `<input type="date">` и `<input type="time">`. Ручные изменения подсвечиваются (`border-indigo-400 + bg-indigo-50`) с кнопкой сброса ↻.
4. **Сдвиг времени** сохранён как инструмент-помощник («Автоматический сдвиг времени»). При включении сбрасывает все ручные настройки и раздвигает даты формулой `base + interval × index`.
5. **`handleSave`** (usePostDetails) берёт дату из `projectDateTimes[projId]` напрямую, вместо расчёта сдвига в цикле.
6. **Сводка в футере** показывает итоговое расписание для всех проектов (не только при сдвиге).

**Файл(ы):**
- `features/posts/hooks/useBulkCreationManager.ts` — новые состояния, useEffect синхронизации, обработчики `setProjectDateTime` / `resetProjectDateTime` / `handleToggleTimeShift`
- `features/posts/hooks/usePostForm.ts` — проброс новых состояний и действий
- `features/posts/hooks/usePostDetails.ts` — `handleSave` использует `projectDateTimes` вместо расчёта сдвига
- `features/posts/components/MultiProjectSelector.tsx` — переработан `SortableProjectItem` (inline date/time пикеры), новый layout секции расписания
- `features/posts/components/modals/PostDetailsModal.tsx` — передача новых пропсов, обновлённая сводка

---

### Мульти-команды: проекту можно присвоить несколько команд

**Задача:**  
Ранее каждому проекту можно было присвоить только одну команду (поле `team: String`). Для фильтрации проектов в сайдбаре и на странице «Управление базой проектов» нужна возможность присвоить проекту несколько команд одновременно (например, «Команда А» + «Сеть Н»).

**Решение:**  
Реализована архитектура «JSON-массива» для хранения множественных команд, с полной обратной совместимостью.

**Бэкенд:**
1. **Модель** (`models_library/projects.py`): добавлена колонка `teams = Column(Text, nullable=True)` — JSON-массив строк. Старое поле `team` сохранено для обратной совместимости.
2. **Pydantic-схема** (`schemas/models/projects.py`): добавлено `teams: Optional[List[str]] = []` с `@field_validator('teams', mode='before')` валидатором `parse_json_teams` — парсит JSON-строку из БД в Python-список.
3. **CRUD** (`crud/project_crud.py`): в `update_project_settings()` добавлена сериализация `teams` в JSON (`json.dumps`) перед сохранением, фильтрация пустых строк, синхронизация `team = teams[0]` для обратной совместимости.
4. **Миграция** (`db_migrations/projects.py`): миграция 48 — создание колонки `teams`, миграция 48b — `_migrate_team_to_teams()` — перенос данных из `team` в `teams = ["значение"]` для существующих проектов.

**Фронтенд:**
1. **Типы** (`shared/types/index.ts`): `Project` — добавлено `teams?: string[]`.
2. **Настройки проекта** (`TeamSection.tsx`): полностью переписан — из одиночного выбора (radio-кнопки) в мульти-выбор (toggle-кнопки с чекбокс-логикой). Отображает «Выбрано: X, Y» над кнопками, кнопка «Сбросить все».
3. **Фильтрация в сайдбаре** (`Sidebar.tsx` — оба файла): `uniqueTeams` извлекается через `p.teams.forEach()` с фоллбэком на `p.team`; фильтр проверяет `projectTeams.includes(teamFilter)` вместо `p.team !== teamFilter`.
4. **Массовое редактирование** (`DatabaseManagementPage.tsx`, `ProjectTable.tsx`): колонка `team` → `teams`; `CustomSelect` переписан на мульти-выбор с чекбоксами; localStorage backward compat (миграция ключа `team` → `teams`).
5. **Остальные файлы**: `MultiProjectSelector.tsx`, `useCreateSingleProduct.ts`, `useProjectContext.ts` — аналогичное обновление фильтрации.

**Тесты** (`test_teams.py`): 19 тестов покрывают Pydantic-валидатор, CRUD-сериализацию, миграцию данных и чтение из БД через `from_attributes`. Все 19/19 проходят.

**Файл(ы):**
- `backend_python/models_library/projects.py` (изменён)
- `backend_python/schemas/models/projects.py` (изменён)
- `backend_python/crud/project_crud.py` (изменён)
- `backend_python/db_migrations/projects.py` (изменён)
- `backend_python/test_teams.py` (создан)
- `shared/types/index.ts` (изменён)
- `features/projects/components/modals/settings-sections/TeamSection.tsx` (переписан)
- `features/projects/hooks/useProjectSettingsManager.ts` (изменён)
- `features/projects/components/Sidebar.tsx` (изменён — оба файла)
- `features/database-management/components/DatabaseManagementPage.tsx` (изменён)
- `features/database-management/components/ProjectTable.tsx` (переписан CustomSelect)
- `features/database-management/hooks/useProjectContext.ts` (изменён)
- `features/posts/components/MultiProjectSelector.tsx` (изменён)
- `features/products/hooks/useCreateSingleProduct.ts` (изменён)

---

### Файлы, затронутые в этом релизе
| Файл | Операция |
|------|----------|
| `backend_python/crud/batch_crud.py` | Создан |
| `backend_python/routers/batch.py` | Создан |
| `backend_python/main.py` | Изменён (добавлен batch router) |
| `services/api/batch.api.ts` | Создан |
| `contexts/hooks/useDataInitialization.ts` | Переписан |
| `features/projects/components/ProjectListItem.tsx` | Изменён |
| `index.html` | Изменён (CSS keyframes) |
| `backend_python/migrate_keys.py` | Создан (миграция ключей шифрования) |
| `backend_python/test_decrypt3.py` | Создан (диагностика расшифровки) |
| `backend_python/test_decrypt4.py` | Создан (анализ Fernet timestamps) |
| `backend_python/test_decrypt5.py` | Создан (поиск ключей + brute-force) |
| `backend_python/assets/default_product.jpg` | Перегенерирован (800×800 px) |
| `backend_python/scripts/generate_placeholder.py` | Создан |
| `features/posts/hooks/useBulkCreationManager.ts` | Изменён |
| `features/posts/hooks/usePostForm.ts` | Изменён |
| `features/posts/hooks/usePostDetails.ts` | Изменён |
| `features/posts/components/MultiProjectSelector.tsx` | Изменён |
| `features/posts/components/modals/PostDetailsModal.tsx` | Изменён |
| `backend_python/models_library/projects.py` | Изменён (добавлено поле teams) |
| `backend_python/schemas/models/projects.py` | Изменён (добавлено поле teams + валидатор) |
| `backend_python/crud/project_crud.py` | Изменён (сериализация teams в JSON) |
| `backend_python/db_migrations/projects.py` | Изменён (миграция team → teams) |
| `shared/types/index.ts` | Изменён (добавлено teams в Project) |
| `features/projects/components/modals/settings-sections/TeamSection.tsx` | Переписан (мульти-выбор) |
| `features/projects/hooks/useProjectSettingsManager.ts` | Изменён |
| `features/projects/components/Sidebar.tsx` | Изменён (фильтрация по teams) |
| `src/features/projects/components/Sidebar.tsx` | Изменён (фильтрация по teams) |
| `features/database-management/components/DatabaseManagementPage.tsx` | Изменён (teams в колонках) |
| `features/database-management/components/ProjectTable.tsx` | Переписан (мульти-выбор команд) |
| `features/database-management/hooks/useProjectContext.ts` | Изменён (фильтрация по teams) |
| `features/products/hooks/useCreateSingleProduct.ts` | Изменён (teams в фильтрации) |
| `backend_python/test_teams.py` | Создан (19 тестов мульти-команд) |
| `shared/utils/renderVkFormattedText.tsx` | Создан (утилита парсинга VK-разметки) |
| `features/posts/components/modals/PostPreview.tsx` | Изменён (интеграция renderVkFormattedText) |
| `shared/hooks/useTextUndoHistory.ts` | Создан (хук undo/redo для текстового поля) |
| `features/posts/components/modals/PostTextSection.tsx` | Изменён (кнопки undo/redo + подсказка) |
| `shared/components/modals/SlidePanel.tsx` | Создан (выезжающая панель) |
| `features/posts/components/modals/PostPreview.tsx` | Создан (VK-style предпросмотр) |
| `features/posts/components/modals/PostModalFooter.tsx` | Изменён (удалён timeShiftSummary) |
| `features/posts/components/ai/ChatTurnDisplay.tsx` | Изменён (текстовые кнопки + «Заменить») |
| `features/posts/components/ai/ChatHistory.tsx` | Изменён (проброс onReplacePostText) |
| `features/posts/hooks/useAIGenerator.ts` | Изменён (handleReplacePostText) |
| `features/posts/components/AIGenerator.tsx` | Изменён (проброс onReplacePostText) |
| `features/emoji/components/EmojiPicker.tsx` | Изменён (добавлен проп inline) |
| `backend_python/services/global_variable_service.py` | Изменён (фикс сохранения переменных) |

---

### Дублирование историй при автоматической публикации (4 копии вместо 1)

**Проблема:**  
Автоматизация «Посты → Истории» публиковала 4 одинаковые истории из одного поста вместо одной. На скриншоте — 4 истории с одним Post ID 512292 в одно и то же время (14:19).

**Причина:**  
Race condition между 4 Gunicorn-воркерами. Dockerfile запускает `gunicorn -w 4`, и каждый воркер создаёт собственный экземпляр APScheduler. Все 4 шедулера срабатывают одновременно каждые 10 минут.

Redis-лок (`vk_planner:stories_bg_lock`) должен был защитить от параллельного выполнения, но при ошибке подключения к Redis включался фолбэк `should_run = True` для всех воркеров. Кроме того, проверка дедупликации в `core.py` была обычным `SELECT` без `FOR UPDATE` — при одновременном выполнении все 4 воркера получали `None` (запись ещё не создана) и все 4 публиковали историю.

В отличие от системных постов, где используется `with_for_update()` + смена статуса на `publishing` (атомарная блокировка на уровне PostgreSQL), в историях такой защиты не было.

**Решение (трёхуровневая защита):**

1. **Redis-лок на конкретный пост** (`core.py`): перед обработкой каждого поста захватывается ключ `vk_planner:story_publish:{project_id}:{post_id}` с TTL 5 минут. Только один воркер пройдёт — остальные пропустят пост. Экономит VK API вызовы.

2. **UNIQUE constraint в БД** (`models_library/automations.py`): уникальный индекс `uq_stories_log_project_post` на `(project_id, vk_post_id)` в таблице `stories_automation_logs`. Даже при падении Redis база данных физически не позволит записать два лога для одного поста.

3. **IntegrityError обработка** (`logic.py`): при `db.commit()` перехватывается `IntegrityError` — если другой воркер успел вставить запись первым, текущий откатит транзакцию без краша.

**Файл(ы):**
- `backend_python/models_library/automations.py` (добавлен UniqueConstraint)
- `backend_python/db_migrations/automations.py` (миграция для создания уникального индекса)
- `backend_python/db_migrations/utils.py` (новая утилита `check_and_add_unique_constraint`)
- `backend_python/services/automations/stories/core.py` (Redis-лок на каждый пост)
- `backend_python/services/automations/stories/logic.py` (IntegrityError обработка)

---

### Полный набор Unicode-эмодзи (1897 штук) + генератор

**Задача:**  
В эмодзи-пикере было всего ~300 эмодзи, что значительно меньше, чем доступно в VK. Многие популярные эмодзи (флаги, еда, символы) отсутствовали.

**Решение:**  
1. Создан Python-скрипт `scripts/generate_emoji_data.py`, который загружает официальный Unicode 15.1 `emoji-test.txt` и генерирует TypeScript-файл `emojiData.ts`.
2. Скрипт фильтрует модификаторы тона кожи (skin tones) — оставляет только базовые версии эмодзи.
3. Добавлено ~500 русских переводов и ключевых слов для поиска (словарь `RUSSIAN_NAMES`).
4. Результат: **1897 эмодзи** в 9 категориях (Эмоции, Люди и тело, Животные и природа, Еда и напитки, Путешествия и места, Активности, Предметы, Символы, Флаги).
5. Файл `emojiData.ts` вырос с ~575 строк до ~3800 строк (159 КБ).

**Файл(ы):**
- `scripts/generate_emoji_data.py` (создан)
- `features/emoji/data/emojiData.ts` (перегенерирован — 1897 эмодзи)

---

### Рендеринг эмодзи через Twemoji (SVG-картинки вместо системных символов)

**Задача:**  
Эмодзи в пикере отображались через системные шрифты (нативный рендеринг ОС). На Windows многие новые Unicode-эмодзи показывались как пустые квадраты ▢ или чёрно-белые символы. Визуально результат сильно отличался от красочных эмодзи в VK.

**Решение:**  
1. Создан утилитный модуль `features/emoji/utils/twemoji.ts` с двумя функциями:
   - `emojiToCodepoint(emoji)` — преобразует символ эмодзи в строку кодпоинтов (hex), фильтрует FE0F (variation selector).
   - `getTwemojiUrl(emoji)` — возвращает URL SVG-картинки с CDN: `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/{codepoint}.svg`.
2. В `EmojiPicker.tsx` все текстовые символы эмодзи заменены на `<img>` с Twemoji SVG:
   - Кнопки категорий: `<img width={20} height={20}>` с иконкой-представителем категории.
   - Кнопки эмодзи: `<img width={28} height={28}>` с `loading="lazy"` для ленивой загрузки.
3. Результат: кросс-платформенное отображение, идентичное эмодзи в VK/Telegram. Работает одинаково на Windows, macOS, Linux.

**Файл(ы):**
- `features/emoji/utils/twemoji.ts` (создан)
- `features/emoji/components/EmojiPicker.tsx` (изменён — img вместо text)

---

### Первый комментарий от имени сообщества

**Задача:**  
Реализовать возможность автоматической публикации первого комментария от имени сообщества сразу после выхода поста на стену. Нужна в интерфейсе создания поста — тумблер + текстовое поле с тем же функционалом, что и основной редактор (emoji, undo/redo, переменные).

**Решение (бэкенд):**
1. Добавлено поле `first_comment_text` (Optional[str]) в Pydantic-схемы `PostBase` и `SystemPost`.
2. Добавлена колонка `first_comment_text = Column(Text, nullable=True)` в SQLAlchemy-модель `SystemPost`.
3. Миграция 53: `check_and_add_column(engine, 'system_posts', 'first_comment_text', 'TEXT')`.
4. CRUD `system_post_crud.py` — сохранение/обновление `first_comment_text` при create и update.
5. `save_system.py` — проброс `first_comment_text` при сохранении поста как системного.
6. `publish.py` — после успешного `wall.post` (и в `publish_now`, и в `publish_post_task`):
   - Проверяет наличие `first_comment_text`.
   - Подставляет глобальные переменные через `global_variable_service.substitute_global_variables()`.
   - Использует `communityToken` проекта (или `user_token` как fallback).
   - Вызывает `create_comment(owner_id, post_id, message, token, from_group=1)`.
   - Ошибка комментария не блокирует публикацию поста (try/except).
7. `system_post_service.py` — `publish_system_post_now()` передаёт `first_comment_text` в схему публикации.
8. `post_tracker_service.py` — автоматическая публикация трекером передаёт `first_comment_text` в схему; `_create_next_cyclic_post()` наследует поле для следующей итерации.

**Решение (фронтенд):**
1. Тип `ScheduledPost` в `shared/types/index.ts` — добавлено `first_comment_text?: string`.
2. Создан переиспользуемый компонент `shared/components/CommentTextEditor.tsx` (~280 строк):
   - Полноценный текстовый редактор для комментариев.
   - Emoji-пикер (inline), undo/redo через `useTextUndoHistory`, вставка переменных через `VariablesSelector`.
   - Автозакрытие скобок и кавычек, ссылки @id, счётчик символов (макс. 4096).
   - Управление фокусом контейнера через React-стейт с дебаунсом (вместо CSS focus-within) — исключает мерцание обводки и чёрную вспышку бордера.
3. `usePostForm.ts` — состояние `firstCommentEnabled` (boolean) и `firstCommentText` (string), добавлены в formState и formActions, участвуют в dirty-check.
4. `usePostDetails.ts` — `handleSave()` и `handlePublishNowClick()` передают `first_comment_text: formState.firstCommentEnabled ? formState.firstCommentText : undefined`.
5. `PostDetailsModal.tsx` — тумблер "Первый комментарий" в колонке настроек (видим только при `publicationMethod !== 'vk'` и наличии `communityToken`), `CommentTextEditor` в колонке контента.

**Дополнительно — фикс обводки текстовых редакторов:**
- В `PostTextSection.tsx` и `CommentTextEditor.tsx`: CSS `focus-within` + `transition-all` заменены на React-стейт `isFocused` с дебаунсом `setTimeout(0)`. Устранены:
  - Чёрная вспышка бордера при клике в textarea (интерполяция gray→indigo через transition).
  - Мерцание обводки при переключении фокуса между элементами (emoji-пикер, тулбар).
- `resize-none` → `resize-y` на обоих textarea — пользователь может менять высоту поля.

**Файл(ы):**
- `backend_python/schemas/models/posts.py`
- `backend_python/models_library/posts.py`
- `backend_python/db_migrations/posts.py`
- `backend_python/crud/system_post_crud.py`
- `backend_python/services/post_actions/save_system.py`
- `backend_python/services/post_actions/publish.py`
- `backend_python/services/system_post_service.py`
- `backend_python/services/post_tracker_service.py`
- `shared/types/index.ts`
- `shared/components/CommentTextEditor.tsx` (создан)
- `features/posts/hooks/usePostForm.ts`
- `features/posts/hooks/usePostDetails.ts`
- `features/posts/components/modals/PostDetailsModal.tsx`
- `features/posts/components/modals/PostTextSection.tsx`

---
### Оптимизация сбора статистики историй: финализация архивных данных

**Проблема:**  
При сборе статистики и зрителей историй система каждый раз отправляла запросы к VK API для **всех** историй в базе, включая давно архивированные, чья статистика уже не меняется. Для проекта со 176 историями это означало ~176 запросов `stories.getStats` и столько же `stories.getViewers` — каждый раз одинаковые данные. Кроме того, ~16 «мёртвых» историй с ошибками VK API (Error 15: Access denied / Error 100: Story deleted) опрашивались бесконечно, так как для финализации требовался успешный ответ.

**Причина:**  
1. Функции `batch_update_stats()` и `batch_update_viewers()` не фильтровали записи — обрабатывали все active истории из БД.
2. Не было механизма пометить историю как «данные больше не изменятся» (финализировать).
3. Для архивных историй с ошибками доступа (Error 15, 100) финализация была невозможна, так как требовала успешного ответа от VK API для сравнения данных.

**Решение:**  
1. Добавлено поле `stats_finalized` (Boolean, default=False) в модель `StoriesAutomationLog` + миграция.
2. В `stats.py`: после успешного получения статистики для архивной истории — сравнение нового и текущего значения по метрикам (views, replies, answer, shares, subscribers, bans, open_link, likes). Если данные идентичны → `stats_finalized = True`.
3. В `viewers.py`: аналогичная логика — сравнение количества зрителей. Если совпадает → `stats_finalized = True`. Реализовано в обоих путях: параллельном и последовательном.
4. Обе функции теперь фильтруют `stats_finalized=True` записи на старте — пропускают их полностью.
5. **Error 15/100 финализация:** если история архивная и VK возвращает ошибку доступа (Error 15) или «история удалена» (Error 100) — история финализируется навсегда как «permanently inaccessible».
6. В `retrieval.py`: поле `stats_finalized` добавлено в ответ API. При реактивации истории (переход из архивной в активную) флаг сбрасывается.
7. Результат: проект с 176 историями вместо ~352 запросов к VK API делает ~4-6 запросов (только свежие истории). Экономия ~98% запросов.

**Файл(ы):**
- `backend_python/models_library/automations.py` — поле `stats_finalized`
- `backend_python/db_migrations/automations.py` — миграция `stats_finalized`
- `backend_python/services/automations/stories/stats.py` — логика финализации статистики + Error 15/100
- `backend_python/services/automations/stories/viewers.py` — логика финализации зрителей + Error 15/100
- `backend_python/services/automations/stories/retrieval.py` — `stats_finalized` в ответе + сброс при реактивации

---

### Превью первого комментария в предпросмотре VK

**Задача:**  
Добавить в колонку предпросмотра поста визуализацию первого комментария в стиле ВКонтакте — чтобы пользователь видел, как будет выглядеть пост вместе с комментарием.

**Решение:**  
1. В `PostPreview.tsx` добавлен новый prop `firstCommentText?: string`.
2. После футера поста (лайки/комменты/шеры) рендерится блок комментария:
   - Заголовок «Первый комментарий» (серый, мелкий).
   - Аватарка сообщества + название + бейдж «Автор» (голубой, как в VK).
   - Текст комментария с поддержкой VK-форматирования через `renderVkFormattedText()`.
   - Подпись «только что · Ответить · Поделиться».
3. Блок появляется только когда тумблер «Первый комментарий» включён и текст не пуст.
4. Работает в обоих режимах: 4-колоночная раскладка (edit) и компактный предпросмотр (view).

**Файл(ы):**
- `features/posts/components/modals/PostPreview.tsx`
- `features/posts/components/modals/PostDetailsModal.tsx`

---

### Название сообщества VK в предпросмотре

**Задача:**  
В предпросмотре поста отображалось внутреннее название проекта (`project.name`), а не реальное название сообщества ВКонтакте (`vkGroupName`). Это вводило в заблуждение — превью не соответствовало тому, как пост будет выглядеть в VK.

**Решение:**  
В `PostDetailsModal.tsx` при передаче `projectName` в `PostPreview` заменено `currentProject?.name` на `currentProject?.vkGroupName || currentProject?.name`. Теперь в шапке поста и в блоке комментария показывается реальное название сообщества VK с fallback на внутреннее имя.

**Файл(ы):**
- `features/posts/components/modals/PostDetailsModal.tsx`

---

### Эксклюзивный режим токенов сообщества для статистики историй

**Проблема:**  
Все методы статистики историй (stories.get, stories.getStats, stories.getViewers, users.get) использовали user_token из .env или admin_tokens из БД. Это вызывало ошибки VK Error 15 (Access denied) для сообществ, которые имеют собственный токен сообщества, а приложение не одобрено как standalone.

**Причина:**  
VK API ограничивает доступ к методам историй для пользовательских токенов, если приложение не прошло модерацию. Токены сообщества (community tokens) имеют прямой доступ к историям своего сообщества без этого ограничения.

**Решение:**  
Реализован эксклюзивный режим: если у проекта заданы токены сообщества (`communityToken` + `additional_community_tokens`), то для ВСЕХ методов историй используются ТОЛЬКО эти токены. Пользовательские и admin-токены полностью игнорируются. Если токенов сообщества нет — используется прежняя логика (admin_tokens → user_token fallback).

Изменения:
1. **Роутер** (`stories_automation.py`): добавлен хелпер `_get_community_tokens(project)`, извлекающий токены из `communityToken` + JSON-поля `additional_community_tokens`. Все эндпоинты передают `community_tokens: List[str]`.
2. **Token Manager** (`token_manager.py`): `call_vk_api_for_group` принимает `community_tokens: Optional[List[str]]`. При наличии — создаёт `TokenInfo` только из этих токенов, пропуская `get_admin_tokens_for_group`.
3. **Methods** (`methods.py`): `get_active_stories` пробрасывает `community_tokens` в `call_vk_api_for_group`.
4. **Retrieval** (`retrieval.py`): извлекает полный список community_tokens из проекта.
5. **Stats** (`stats.py`): `batch_update_stats` в эксклюзивном режиме использует только community_tokens.
6. **Viewers** (`viewers.py`): `batch_update_viewers` и `update_all_stats_and_viewers` используют community_tokens.
7. **Viewers Parallel** (`viewers_parallel.py`): `fetch_viewers_parallel` с эксклюзивной логикой.
8. **Logic** (`logic.py`): `process_single_story_for_post` передаёт community_tokens.

**Файл(ы):**
- `backend_python/routers/stories_automation.py`
- `backend_python/services/vk_api/token_manager.py`
- `backend_python/services/vk_api/methods.py`
- `backend_python/services/automations/stories/retrieval.py`
- `backend_python/services/automations/stories/stats.py`
- `backend_python/services/automations/stories/viewers.py`
- `backend_python/services/automations/stories/viewers_parallel.py`
- `backend_python/services/automations/stories/logic.py`

---

### stats_finalized не блокирует обновление зрителей историй

**Проблема:**  
Флаг `stats_finalized` в модели `StoriesAutomationLog` блокировал не только повторный запрос статистики, но и обновление зрителей. Это приводило к тому, что после финализации статистики пользователь не мог обновить список зрителей.

**Причина:**  
В `viewers.py` была скопирована логика фильтрации по `stats_finalized` из `stats.py`, а также установка `stats_finalized = True` при совпадении количества зрителей. Это смешивало два разных процесса: статистику и просмотр зрителей.

**Решение:**  
Из `viewers.py` полностью удалены: фильтрация записей с `stats_finalized=True` при входе, все присвоения `stats_finalized = True`, финализация при VK Error 15/100, переменная `finalized_count`. Теперь `stats_finalized` влияет только на `stats.py`, а зрители всегда обновляются при запросе.

**Файл(ы):**
- `backend_python/services/automations/stories/viewers.py`

---

### Лимит users.get на 100 пользователей при использовании токена сообщества

**Проблема:**  
При получении деталей зрителей историй вызов `users.get` возвращал максимум 100 пользователей из запрошенных 121+. Остальные пользователи отображались без имени и фото — только числовой ID.

**Причина:**  
VK API с токеном сообщества ограничивает ответ `users.get` до 100 пользователей за один запрос. Константа `MAX_USERS_PER_REQUEST` была установлена в 1000, поэтому все 121 ID отправлялись одним запросом, а VK молча обрезал ответ до 100.

**Решение:**  
Уменьшена константа `MAX_USERS_PER_REQUEST` с 1000 до 100 в `viewers_details.py`. Теперь при 121 зрителе отправляется 2 чанка (100 + 21), и все пользователи получают полные данные. Добавлено диагностическое логирование: количество запрошенных/полученных в каждом чанке и предупреждение о пропущенных ID.

**Файл(ы):**
- `backend_python/services/automations/stories/viewers_details.py`

---

### Потеря данных зрителей при массовом обновлении (параллельный путь)

**Проблема:**  
При массовом обновлении зрителей через кнопку «Обновить всё» для историй с более 100 зрителями возвращалось только 100 пользователей с данными — остальные терялись.

**Причина:**  
Та же проблема, что и в `viewers_details.py`, но в **параллельном** пути. В `viewers_parallel.py` константа `MAX_USERS_PER_REQUEST` была 1000. Внутри `execute`-батчей каждый `API.users.get` отправлял до 1000 ID, но VK с токеном сообщества молча обрезал до 100. Супер-батч 25×1000=25000 становился фактически 25×100=2500.

**Решение:**  
Уменьшена `MAX_USERS_PER_REQUEST` с 1000 до 100 в `viewers_parallel.py`. Теперь execute создаёт корректные под-чанки по 100 пользователей. Обновлены комментарии и док-строки. Удалены лишние диагностические логи из всех трёх файлов зрителей.

**Файл(ы):**
- `backend_python/services/automations/stories/viewers_parallel.py`
- `backend_python/services/automations/stories/viewers_details.py`
- `backend_python/services/automations/stories/viewers.py`

---

### UnboundLocalError: переменная tokens использовалась до инициализации

**Проблема:**  
При нажатии «Обновить всё» сервер возвращал 500 Internal Server Error.

**Причина:**  
В `viewers_parallel.py` строка `print(f"... {len(tokens)} tokens")` стояла **до** определения переменной `tokens`. После очистки диагностических логов этот print остался на месте, но оказался перед блоком инициализации токенов.

**Решение:**  
Перемещён print после блока получения токенов.

**Файл(ы):**
- `backend_python/services/automations/stories/viewers_parallel.py`

---

### Интеграция groups.isMember для проверки подписки зрителей

**Описание:**  
Добавлен вызов VK API `groups.isMember` для проверки, является ли зритель истории подписчиком сообщества.

**Реализация:**  
- Бэкенд: функция `_fetch_members_status()` в `viewers_details.py` — батчи по 500 user_ids, метод `groups.isMember` v5.199.
- Последовательный путь (`viewers_details.py`): этап 2.5 после users.get, поле `is_member` в каждом viewer.
- Параллельный путь (`viewers_parallel.py`): фаза 3.5 после execute-батчей, поле `is_member` в фазе 4.
- Фронтенд: поле `is_member` в типе `StoryViewer`, колонка «Подписчик» в таблице, секция «Подписка» в дашборде.

**Файл(ы):**
- `backend_python/services/automations/stories/viewers_details.py`
- `backend_python/services/automations/stories/viewers_parallel.py`
- `features/automations/stories-automation/types.ts`
- `features/automations/stories-automation/components/table/StoriesTable.tsx`
- `features/automations/stories-automation/components/dashboard/StoriesDashboard.tsx`

---

### Рефакторинг StoriesDashboard.tsx — декомпозиция 726 строк в модульный хаб

**Описание:**  
Монолитный файл `StoriesDashboard.tsx` (726 строк) содержал всю логику дашборда: фильтры, расчёт агрегированных метрик, анимации, 8 карточек с графиками, демографию. Это затрудняло поддержку и поиск конкретных мест.

**Изменения:**  
Файл превращён в хаб (~65 строк) по паттерну «Хук-контейнер»:
1. **`useStoriesDashboard.ts`** (~274 строки) — хук с логикой фильтрации, расчёта `DashboardStats`, `ViewersStats`, `ChartDataPoint[]`, анимации карточек (`getCardAnimationClass` / `getCardAnimationStyle`).
2. **`types.ts`** — интерфейсы `PeriodType`, `FilterType`, `DashboardStats`, `ChartDataPoint`, `ViewersStats`, `CardAnimationProps`.
3. **`AnimatedCounter.tsx`** — переиспользуемый компонент анимированного счётчика.
4. **`DashboardFilters.tsx`** — компонент фильтров (период + тип + кастомные даты).
5. **8 карточек:** `ViewsCard.tsx`, `BudgetCard.tsx`, `ClicksCard.tsx`, `ActivityCard.tsx`, `StoriesCountCard.tsx`, `SubscriptionsCard.tsx`, `ERViewCard.tsx`, `DemographicsCard.tsx`.

Все props компонентов, внешний вид, логика расчётов и анимации сохранены без изменений. Внешний контракт `StoriesDashboard` (имя + props `stories` + `getCount`) не изменился — никакие другие части приложения не затронуты.

**Файл(ы):**
- `features/automations/stories-automation/components/dashboard/StoriesDashboard.tsx` (726 → 65 строк)
- `features/automations/stories-automation/components/dashboard/useStoriesDashboard.ts` (создан)
- `features/automations/stories-automation/components/dashboard/types.ts` (создан)
- `features/automations/stories-automation/components/dashboard/AnimatedCounter.tsx` (создан)
- `features/automations/stories-automation/components/dashboard/DashboardFilters.tsx` (создан)
- `features/automations/stories-automation/components/dashboard/ViewsCard.tsx` (создан)
- `features/automations/stories-automation/components/dashboard/BudgetCard.tsx` (создан)
- `features/automations/stories-automation/components/dashboard/ClicksCard.tsx` (создан)
- `features/automations/stories-automation/components/dashboard/ActivityCard.tsx` (создан)
- `features/automations/stories-automation/components/dashboard/StoriesCountCard.tsx` (создан)
- `features/automations/stories-automation/components/dashboard/SubscriptionsCard.tsx` (создан)
- `features/automations/stories-automation/components/dashboard/ERViewCard.tsx` (создан)
- `features/automations/stories-automation/components/dashboard/DemographicsCard.tsx` (создан)

---

### Нули в дашборде историй при переключении между проектами

**Проблема:**  
После посещения статистики историй для 2+ проектов, при возвращении к ранее просмотренному проекту все числа в дашборде отображались как 0. Анимация не запускалась. Проблема воспроизводилась стабильно: первый проект ✅ → второй проект ✅ → возврат к первому → нули.

**Причина:**  
Несовместимость хука `useCountAnimation` с React StrictMode + быстрым кэшем.

**Механизм бага (пошагово):**
1. `key={activeProject?.id}` в `AppContent.tsx` пересоздаёт компонент при смене проекта → `StoriesDashboard` полностью размонтируется и монтируется заново.
2. При **первом** визите кэш историй ещё не прогрет → `getCachedStories` отвечает медленно → `stories = []` при маунте → target = 0 → через 200мс stories приходят → target меняется 0→1234 на ре-рендере → **StrictMode не дублирует повторный эффект** → анимация проигрывается ✅.
3. При **повторном** визите кэш прогрет → `getCachedStories` отвечает **мгновенно** → `stories` уже с данными при маунте → target = 1234 уже на первом рендере.
4. React StrictMode при маунте: запуск эффекта → `prevTargetRef.current = target` (синхронно!) → `setTimeout(delay=100)` → **cleanup** (StrictMode отменяет первый запуск) → `clearTimeout` (анимация убита).
5. Второй запуск эффекта: `prevTargetRef.current === target` (уже 1234 из шага 4) → условие «Target не изменился — ничего не делаем» → `return` → **анимация не запускается** → count остаётся 0.

**Решение:**  
Перенос `prevTargetRef.current = target` из синхронной части эффекта **внутрь** callback `setTimeout`. Теперь при StrictMode-cleanup ref не обновляется → второй запуск эффекта корректно обнаруживает «новый» target → перезапускает анимацию.

```typescript
// ДО (баг): ref обновлялся ДО setTimeout
prevTargetRef.current = target; // ← StrictMode cleanup не откатывает ref!
const delayTimeout = setTimeout(() => { ... }, delay);

// ПОСЛЕ (фикс): ref обновляется ВНУТРИ setTimeout
const delayTimeout = setTimeout(() => {
    prevTargetRef.current = target; // ← cleanup отменяет timeout → ref остаётся старым → повторный запуск работает
    ...
}, delay);
```

**Файл(ы):**
- `features/automations/stories-automation/components/dashboard/useCountAnimation.tsx`

---

### Дашборд историй: платформа, переработка демографии

**Описание:**  
Переработан блок демографии в дашборде историй.

**Изменения:**  
1. **Платформа (Android / iPhone / iPad / Web):** добавлена новая секция с SVG donut-диаграммой и легендой. Данные из поля `user.platform` (VK API `last_seen.platform`). Коды платформ: 1=mobile, 2=iPhone, 3=iPad, 4=Android, 5=WP, 6=Win10, 7=Web.
2. **Формат чисел:** изменён с «N из M — X%» на «N — X%» во всех секциях.
3. **Удалены эмодзи:** вместо 👥/🌐/♂/♀ используются цветные точки-индикаторы (`<span>` с rounded bg).
4. **Сетка:** Пол+Подписка объединены в 1 колонку, порядок: Пол+Подписка | Возраст | Города | Платформа.
5. **Адаптивность:** `col-span-full` + сетка `[1fr_1fr_1fr_auto]` — платформа занимает ровно столько места, сколько нужно.
6. **tabular-nums:** добавлено для выравнивания цифр в возрасте и других секциях.

**Файл(ы):**
- `features/automations/stories-automation/components/dashboard/StoriesDashboard.tsx`

---

### Упрощение UI обновления статистики историй

**Описание:**  
Убран сложный многоуровневый интерфейс обновления статистики в таблице историй. Ранее было 3 элемента управления: переключатель режима (Статистика/Зрители/Всё), кнопка с выпадающей панелью выбора (Посл: 10/30/50/100, Дни: 7/30/90, Все), кнопка «Обновить список». После оптимизации загрузки (архивные истории не требуют выборочного обновления) этот функционал стал избыточным.

**Изменения:**  
1. **Удалено:** переключатель режима (Статистика/Зрители/Всё), выпадающая панель с выбором периода/количества, состояния `isRefreshDropdownOpen` / `updateMode` / `refreshDropdownRef`, обработчик clickOutside, функция `getUpdateModeLabel()`.
2. **Добавлено:** одна кнопка «Обновить всё» — вызывает `onBatchUpdate('period', { days: 3650 }, 'all')`, т.е. обновляет статистику + зрителей за всё время.
3. **Сохранено:** кнопка «Обновить список» (перезагрузка из кэша/VK), 3 иконки на каждой строке (стата/зрители/всё для конкретной истории).

**Файл(ы):**
- `features/automations/stories-automation/components/table/StoriesTable.tsx`

---

### Текст в карточках постов не учитывал переносы строк и VK-разметку

**Описание:**  
В превью карточек постов (`PostCard.tsx`) текст рендерился через `{displayText}` без CSS `whitespace-pre-wrap` и без парсинга VK-разметки. В результате переносы строк `\n` игнорировались (текст шёл сплошной строкой), а VK-ссылки, хештеги и упоминания не были кликабельными — в отличие от компонента предпросмотра (`PostPreview.tsx`), где и то и другое работало корректно.

**Изменения:**  
1. Добавлен CSS-класс `whitespace-pre-wrap` к `<p>` с текстом поста в `PostCard.tsx`.
2. Текст теперь обрабатывается через `renderVkFormattedText(displayText)` вместо `{displayText}`.
3. Добавлен импорт утилиты `renderVkFormattedText`.

**Файл(ы):**
- `features/posts/components/PostCard.tsx`

---

### Обычные URL и короткие ссылки не отображались как кликабельные

**Описание:**  
Утилита `renderVkFormattedText` поддерживала только VK-разметку (`@id`, `[club|…]`, `[url|text]`, `#тег`), но не обрабатывала обычные URL вида `https://vk.cc/cUdZHe` или короткие ссылки без протокола (`vk.cc/xxx`). В результате такие ссылки в тексте поста, предпросмотре и AI-ответах отображались как plain text.

**Изменения:**  
1. Расширена регулярка `VK_MARKUP_REGEX` — добавлена новая группа (9) для URL: `(https?://[^\s<>\[\]]+|[a-zA-Z0-9][a-zA-Z0-9.-]*\.(?:cc|ly|me|ru|com|net|org|io|co|pro|link|рф)/[^\s<>\[\]]+)`.
2. Хештеги сдвинулись в группу 10.
3. Добавлена обработка завершающей пунктуации (`.`, `,`, `;` и т.д.) — она отсекается от URL и не попадает в ссылку. `VK_MARKUP_REGEX.lastIndex` корректируется назад.
4. Для URL без протокола автоматически добавляется `https://`.
5. Обновлен JSDoc-комментарий.

**Файл(ы):**
- `shared/utils/renderVkFormattedText.tsx`

---

### Quick Actions в AI-помощнике не показывали системный промпт и обрезали текст запроса

**Описание:**  
При использовании быстрых действий (Рерайт, Исправить ошибки и др.) в блоке «Роль / Инструкция» отображалась строка `"Quick Action: rewrite"` вместо реального описания роли. В блоке «Ваш запрос» текст обрезался до 100 символов (`substring(0, 100) + "..."`), и пользователь не мог увидеть полный текст, отправленный на обработку.

**Изменения:**  
1. Добавлен маппинг `quickActionRoles` с понятными описаниями ролей для каждого action (rewrite, fix_errors, shorten, expand, add_emoji, remove_emoji).
2. `systemPrompt` теперь берётся из маппинга вместо `"Quick Action: ${action}"`.
3. `userPrompt` теперь содержит **полный текст** поста (`textToProcess`) вместо `textToProcess.substring(0, 100)`.
4. Компонент `ExpandableText` в `ChatTurnDisplay` по-прежнему сворачивает длинный текст с кнопкой «Показать полностью».

**Файл(ы):**
- `features/posts/hooks/useAIGenerator.ts`

---

### Кнопка копирования запроса в AI-чате

**Описание:**  
Добавлена кнопка копирования в блок «Ваш запрос» в AI-помощнике.

**Изменения:**  
1. В `ChatTurnDisplay.tsx` в секции «Ваш запрос» добавлена иконка-кнопка копирования справа от заголовка.
2. При нажатии текст `turn.userPrompt` копируется в буфер обмена через `navigator.clipboard.writeText()`.
3. Иконка на 1.5 секунды меняется на зелёную галочку (состояние `isPromptCopied`).

**Файл(ы):**
- `features/posts/components/ai/ChatTurnDisplay.tsx`

---

### Форматирование текста и ссылок в AI-ответе + отображение использованной модели

**Описание:**  
В блоке «Результат генерации» AI-помощника текст рендерился как plain text — URL и хештеги не были кликабельными. Также пользователь не мог видеть, какая AI-модель была использована для генерации.

**Изменения:**  

**Фронтенд:**
1. В `ChatTurnDisplay.tsx` текст AI-ответа теперь обрабатывается через `renderVkFormattedText(turn.aiResponse)` — URL и хештеги кликабельные.
2. Под ответом, слева от кнопок действий, отображается название модели (`⚡ gemini-2.5-flash`).
3. В интерфейс `ChatTurn` добавлено поле `modelUsed?: string`.
4. В `useAIGenerator.ts` обновлены `handleGenerateText` и `handleQuickAction` — теперь сохраняют `result.modelUsed`.
5. В `ai.api.ts` обновлены `generatePostText` и `processPostTextWithAI` — теперь возвращают `{ generatedText, modelUsed? }`.

**Бэкенд:**
1. В `gemini_api/client.py` добавлен `threading.local()` для хранения имени последней успешной модели (`_thread_local.last_model_used`). Экспортирована функция `get_last_model_used()`.
2. В `ai_service.py` функции `generate_text_from_prompt` и `process_post_text` теперь возвращают dict `{"generatedText": ..., "modelUsed": ...}`.
3. В `schemas/api_responses.py` в `GeneratedTextResponse` добавлено поле `modelUsed: Optional[str] = None`.
4. В `routers/ai.py` обновлены эндпоинты `generatePostText` и `processPostText`.

**Файл(ы):**
- `features/posts/components/ai/ChatTurnDisplay.tsx`
- `features/posts/hooks/useAIGenerator.ts`
- `services/api/ai.api.ts`
- `backend_python/services/gemini_api/client.py`
- `backend_python/services/ai_service.py`
- `backend_python/schemas/api_responses.py`
- `backend_python/routers/ai.py`

---