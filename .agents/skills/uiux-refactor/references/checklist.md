# Чеклист аудита UI/UX

Этот чеклист содержит ВСЕ пункты проверки. При аудите пройти **каждый пункт** и зафиксировать результат.

## Пункты проверки

### 1. Скроллбары
- [ ] Все контейнеры с `overflow-y-auto` или `overflow-x-auto` имеют класс `custom-scrollbar`
- [ ] Нет устаревших классов `scrollbar-thin`, `overflow-y-scroll` без стилизации
- **Детали:** `references/scrollbars.md`

### 2. Кнопки
- [ ] Primary Action (Сохранить/Подтвердить): `bg-green-600 text-white hover:bg-green-700`
- [ ] Secondary Action (Отмена/Назад): `bg-gray-200 text-gray-800 hover:bg-gray-300`
- [ ] Размер: `px-4 py-2 text-sm font-medium`
- [ ] Скругление: `rounded-md` (единообразно, не смешивать `rounded-lg` и `rounded`)
- [ ] Интерактивный/брендовый цвет: `indigo-600`
- **Детали:** `references/buttons.md`

### 3. Тумблеры (Toggle Switch)
- [ ] Контейнер: `h-6 w-11 shrink-0 p-0 border-0 rounded-full`
- [ ] Кружок: `w-4 h-4 bg-white rounded-full shadow-sm`
- [ ] Активный трек: `bg-indigo-600`, Неактивный: `bg-gray-300`
- [ ] Смещения: `translate-x-1` (выкл) → `translate-x-6` (вкл)
- [ ] Обязательно `shrink-0` в flex-контейнере
- [ ] Focus ring: `focus:ring-4 focus:ring-indigo-100`
- **Детали:** `references/toggles.md`

### 4. Табы / Навигация по секциям
- [ ] Стиль: underline с `border-b-2` (НЕ pill/rounded tabs)
- [ ] Активный: `border-indigo-600 text-indigo-600`
- [ ] Неактивный: `border-transparent text-gray-500`
- [ ] Hover: `hover:text-gray-700 hover:border-gray-300`
- [ ] Шрифт: `text-sm font-medium`
- **Детали:** `references/tabs.md`

### 5. Текст со счётчиками
- [ ] Формат: `"Текст - Число"` (через тире)
- [ ] НЕ `"Текст (Число)"` (скобки запрещены)
- [ ] Проверить: фильтры, табы, заголовки секций, индикаторы прогресса
- **Детали:** `references/counters.md`

### 6. Уведомления и модалки
- [ ] Нет `alert()`, `confirm()`, `prompt()` — запрещены
- [ ] Toast: через `showAppToast()` или `toastBridge`
- [ ] Подтверждения: через `ConfirmationModal` из `shared/components/modals/`
- [ ] Модалки: backdrop `bg-black/50`, z-index выше всех элементов
- **Детали:** `references/notifications.md`

### 7. Кнопки-иконки (SVG)
- [ ] Только SVG-иконки, НЕ текстовые эмоджи (🗑️ ✏️ 📋 👁️)
- [ ] Размер: `h-5 w-5`, `strokeWidth={2}`
- [ ] Нейтральные: `text-gray-400 hover:text-indigo-600`
- [ ] Опасные: `text-red-500 hover:text-red-700`
- [ ] Обязательный `title="..."` атрибут
- **Детали:** `references/icon_buttons.md`

### 8. Изображения / Фото
- [ ] Каждый `<img>` имеет skeleton + fade-in через `useState(false)` → `onLoad`
- [ ] Скелетон: `bg-gray-200 animate-pulse`
- [ ] Переход: `transition-opacity duration-300`, `opacity-0` → `opacity-100`
- [ ] Все фото кликабельны → открывают fullscreen lightbox
- [ ] Lightbox: `bg-black/80`, `z-[9999]`, закрытие по клику/Escape/крестику
- [ ] Миниатюра: в `<button>` с `cursor-pointer` и focus ring
- **Детали:** `references/images.md`

### 9. Цвета и захардкоженные значения
- [ ] Нет raw hex/rgb (`#3B82F6`, `rgb(59,130,246)`) — использовать Tailwind классы
- [ ] Брендовый цвет: `indigo-600` (для активных состояний, ссылок, focus ring)
- [ ] Primary: `green-600` (действия сохранения/подтверждения)
- [ ] Secondary: `gray-200/gray-800` (отмена/назад)
- [ ] Danger: `red-500/red-700` (удаление, ошибки)
- **Детали:** `references/colors.md`

### 10. Приоритет компонентов
- [ ] Используются компоненты из `ui-kit/` или `shared/components/` если они существуют
- [ ] Глобальные стили из `index.css` предпочтительнее локальных
- [ ] Не изобретены новые компоненты для существующих паттернов
- **Детали:** `references/component_priority.md`

### 11. Общие запреты
- [ ] Нет `window.confirm()` / `window.alert()` / `window.prompt()`
- [ ] Нет инлайн-хардкода цветов
- [ ] Нет эмоджи в качестве кнопок
- [ ] Нет `<img>` без обработки загрузки
- [ ] Нет `overflow-y-scroll` без `custom-scrollbar`
- [ ] Нет формата `"Текст (Число)"` для счётчиков
- [ ] Нет rounded/pill табов (только underline)
- **Детали:** `references/prohibitions.md`

### 12. Текстовый редактор (Rich Text Editor)
- [ ] Использован готовый компонент (`PostTextSection` / `CommentTextEditor`) или его паттерн
- [ ] Единый контейнер: `border rounded-lg overflow-hidden`
- [ ] Фокус через React-стейт `isFocused`, НЕ через CSS `focus-within`
- [ ] Фокус: `border-indigo-500 ring-2 ring-indigo-500`, нет `transition-all`
- [ ] Тулбар: `bg-gray-50 border-b border-gray-200` с кнопками (ссылка, эмодзи, undo, redo)
- [ ] Textarea: `border-0 focus:ring-0 focus:outline-none resize-y custom-scrollbar`
- [ ] Emoji picker: `variant="inline"`, внутри контейнера
- [ ] Счётчик символов: `tabular-nums`, красный при превышении лимита
- [ ] Undo/Redo через хук `useTextUndoHistory` (Ctrl+Z / Ctrl+Shift+Z)

### 13. Поле поиска (Search Input)
- [ ] Скругление: `rounded-md` (НЕ `rounded-lg` или `rounded-xl`)
- [ ] Бордер: `border border-gray-300` (НЕ `border-gray-200`)
- [ ] Размер: `px-3 py-1.5 pr-8 text-sm`
- [ ] Focus: `focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`
- [ ] Фон: Белый (НЕ `bg-gray-50`)
- [ ] Крестик сброса: SVG `h-4 w-4`, `text-gray-400 hover:text-gray-600`, `title`
- [ ] Крестик виден только когда есть текст
- [ ] Одинаковый стиль во всех сайдбарах
- **Детали:** `references/search_input.md`
- [ ] Автозакрытие скобок и кавычек: `() [] {} "" '' «»`
- [ ] Вставка переменных через `VariablesSelector`
- [ ] Вставка эмодзи через `EmojiPicker` (не нативный пикер ОС)
- [ ] Частные переменные (если есть): внутри панели переменных как секция аккордеона, стиль `rounded-full bg-indigo-50 text-indigo-700 border-indigo-200`, отображать `v.name`
- [ ] Секции переменных работают как аккордеон (`openSection` стейт, один раздел открыт одновременно)
- [ ] Кнопки тулбара (⚙️, 😊, undo, redo) сгруппированы справа (один `flex-1` перед ними, без второго)
- **Детали:** `references/text_editor.md`, `references/specific_variables.md`

### 14. Скелетоны загрузки (Skeleton Loading)
- [ ] Количество скелетонов заполняет видимую область контейнера (не 3-5, а сколько помещается)
- [ ] Размер каждого скелетон-элемента pixel-perfect совпадает с реальным элементом (padding, line-height, margins)
- [ ] Нет необязательных элементов в скелетоне (badge, счётчик, индикатор — если условные, не включать)
- [ ] Каскадное раскрытие: скелетоны последовательно (не разом) превращаются в реальные данные
- [ ] Единый гибридный список: скелетоны и данные в одном контейнере (не два отдельных блока)
- [ ] Нет «пустоты при загрузке» — всегда скелетон вместо спиннера/null
- **Эталон:** `features/messages/components/ConversationItemSkeleton.tsx` + `ConversationsSidebar.tsx`
- **Детали:** `references/animations.md` (раздел «Скелетоны — Каскадное превращение»)

### 15. Информационная панель пользователя (Info Panel)
- [ ] Каждый блок (Сообщения, Активность, Профиль) имеет `minHeight` для предотвращения скачков
- [ ] Таблицы используют `table-fixed` + `<colgroup>` с явными ширинами столбцов
- [ ] Нет `key={userId}` на контейнере панели (DOM не пересоздаётся)
- [ ] Устаревшие данные НЕ очищаются при смене пользователя (stale data preservation)
- [ ] Синхронный сброс стейта в теле рендера (не useEffect)
- [ ] Все утилиты форматирования возвращают `'неизвестно'` (не прочерк `'—'`)
- [ ] Donut-диаграмма с CSS-transition на `strokeDashoffset`
- [ ] Условные элементы (deletedFromVkCount) — всегда в DOM, меняется цвет
- [ ] Фоллбэк дат: `first_message_date || last_incoming_message_date`
- [ ] Аватар сбрасывает `avatarLoaded` при смене URL
- **Эталон:** `features/messages/components/UserInfoProfileTab.tsx`, `UserInfoPanel.tsx`, `UserInfoPanelHeader.tsx`
- **Детали:** `references/info_panel.md`

### 16. Склонение числительных (Pluralization)
- [ ] Все числа с существительными склоняются по правилам русского языка
- [ ] Нет захардкоженных суффиксов типа `${n} лет`, `${n} дней`, `${n} сообщений`
- [ ] Используется утилита `pluralAge()` из `userInfoPanelUtils.tsx` для возраста
- [ ] Для любых других единиц — аналогичная функция или шаблон `plural(n, ['год', 'года', 'лет'])`
- [ ] Проверить все интерполяции `${count} ...` на корректное склонение
- **Детали:** `references/pluralization.md`

### 17. Выпадающие списки (Dropdown / Select)
- [ ] Все dropdown внутри таблиц/модалок рендерятся через `createPortal(... , document.body)`
- [ ] Позиция dropdown обновляется при scroll/resize (`addEventListener('scroll', ..., true)`)
- [ ] Закрытие по клику вне области (mousedown на document)
- [ ] Контейнер: `fixed z-[100] bg-white rounded-md shadow-lg border border-gray-200 animate-fade-in-up`
- [ ] Скролл списка: `overflow-y-auto custom-scrollbar`
- [ ] Стрелка триггера: SVG `w-4 h-4`, `rotate-180` при открытом через `transition-transform duration-200`
- [ ] **> 7 элементов или динамическое количество → обязательна строка поиска внутри dropdown**
- [ ] Поиск: регистронезависимый (`toLowerCase()`), с учётом пробелов (НЕ `trim()`)
- [ ] Поле поиска: `autoFocus`, сброс `searchQuery` при каждом открытии
- [ ] Пустой результат поиска: `"Ничего не найдено"` (`text-xs text-gray-400 text-center py-4`)
- [ ] Multi-select: чекбоксы `w-4 h-4 rounded border`, активный `bg-indigo-600 border-indigo-600`
- [ ] Single-select: клик → закрытие; выбранная опция `bg-indigo-50 text-indigo-700 font-medium`
- **Детали:** `references/dropdowns.md`

### 18. Сайдбар — Изоляция состояний вкладок
- [ ] Каждый модуль (`km`, `lists`, `am`) хранит свои стейты внутри своих компонентов, а не в `App.tsx`
- [ ] Состояния модуля `am` (unreadCounts, conversations, typing) НЕ передаются в компоненты `km` или `lists`
- [ ] Состояния модуля `km` (postFilters, scheduleData) НЕ передаются в компоненты `am` или `lists`
- [ ] `activeViewParams` сбрасывается при смене вкладки внутри модуля
- [ ] Нет вызовов хуков модуля `am` в компонентах `km`/`lists` (и наоборот)
- [ ] Переиспользуемые состояния (`activeProjectId`, `navigationBlocker`) явно задокументированы
- [ ] При смене модуля не сбрасываются стейты других модулей (сохраняются для возврата)
- [ ] При смене проекта сбрасываются: `conversationFilterUnread`, `activeConversationId`, `activeViewParams`
- **Детали:** `references/sidebar_state_isolation.md`

### 13. Анимации и плавные переходы
- [ ] Таблицы/списки: stagger-анимация `opacity-0 animate-fade-in-up` + `animationDelay`
- [ ] Сворачиваемые панели: `animate-expand-down` (не мгновенное появление)
- [ ] Модалки/попапы: `animate-fade-in-up`
- [ ] Пагинация: `key={currentPage}` + fade-анимация
- [ ] Загрузка данных: скелетон `animate-pulse` → контент `animate-fade-in-up`
- [ ] Нет мгновенных вставок блоков без анимации
- [ ] Нет пустоты (`null`) при загрузке — всегда скелетон
- **Детали:** `references/animations.md`

### 19. Tailwind Spacing — Валидация классов
- [ ] Нет несуществующих half-step классов: `w-4.5`, `h-4.5`, `w-5.5`, `h-5.5`, `p-4.5`, `m-4.5`, `gap-4.5`
- [ ] Half-step шкала: **только** `0.5, 1.5, 2.5, 3.5` — после `3.5` идут целые: `4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16...`
- [ ] При увеличении размера: `w-3.5` → `w-4` или `w-5`, **НЕ** `w-4.5`
- **Grep:** `w-4\.5|h-4\.5|w-5\.5|h-5\.5|p-4\.5|m-4\.5|gap-4\.5`
- **Детали:** `references/prohibitions.md` (запрет 18)

### 20. Overflow + Absolute позиционирование
- [ ] Элементы с `position: absolute` + отрицательные offsets (`-top-*`, `-right-*`) НЕ вложены в контейнер с `overflow-auto/hidden/scroll`
- [ ] При добавлении `absolute` элемента проверить `overflow` ВСЕХ предков вплоть до ближайшего `position: relative`
- [ ] Если нужен `overflow-auto` на контейнере И выступающий элемент — использовать `createPortal` или вложить элемент внутрь границ
- **Grep:** `absolute.*-top-|-right-` + проверить `overflow` ближайших предков
- **Детали:** `references/prohibitions.md` (запрет 19)

### 21. Полнота фикса — grep после исправления
- [ ] После исправления ЛЮБОГО бага — grep по всему файлу на аналогичный паттерн
- [ ] Если исправлено `w-4.5` → `w-5` в одном месте — найти ВСЕ `w-4.5` в файле
- [ ] Не оставлять «осколки» одной ошибки в разных местах файла
- **Детали:** `references/prohibitions.md` (запрет 20)

### 22. Blur race condition в inline-формах
- [ ] `onBlur` на input, рядом с которым есть кнопки (палитра цветов, иконки, чекбоксы), ОБЯЗАН проверять `e.relatedTarget`
- [ ] Паттерн: `onBlur={e => { if (container.contains(e.relatedTarget as Node)) return; save(); }}`
- [ ] Альтернатива: `onMouseDown={e => e.preventDefault()}` на соседних кнопках
- [ ] Проверить: все `onBlur={handle...}` в формах с соседними интерактивными элементами
- **Grep:** `onBlur={handle` — проверить наличие `relatedTarget` guard
- **Детали:** `references/prohibitions.md` (запрет 21)

### 23. Минимальный diff — принцип наименьшего изменения
- [ ] Фикс визуального бага НЕ должен менять layout-модель (scroll→wrap, flex→grid) если можно обойтись 1-2 свойствами
- [ ] Предпочитать: изменение значения (`w-4.5`→`w-5`) > добавление 1 свойства (`overflow-visible`) > смена layout-модели
- **Детали:** `references/prohibitions.md` (запрет 22)

### 24. SVG-графики — Производительность рендеринга
- [ ] Количество SVG-точек/элементов на графике ≤ 200 (downsampling при превышении)
- [ ] Hover реализован через ЕДИНЫЙ `<rect>` + бинарный поиск, НЕ через N отдельных `<rect>` на каждую точку
- [ ] Нет `Math.min(...largeArray)` / `Math.max(...largeArray)` — только цикл `for`
- [ ] Автоматическое переключение гранулярности (hours→days) при большом объёме данных (>168 часовых точек)
- [ ] Circles/точки рендерятся ТОЛЬКО для hovered + min/max, а не для каждой точки
- [ ] `getCoords` обёрнут в `useCallback` для стабильной ссылки
- [ ] Пользователь видит индикатор агрегации при downsampling
- [ ] Нет `transition-all` на SVG-элементах, которые пересоздаются при смене данных
- **Grep:** `normalized.map.*<rect.*onMouseMove`, `normalized.map.*<circle`, `Math\.min\(\.\.\.`, `Math\.max\(\.\.\.`
- **Детали:** `references/svg_chart_performance.md`
