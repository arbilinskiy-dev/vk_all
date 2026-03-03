````markdown
# Выпадающие списки (Dropdown / Select)

**Правило:** Все выпадающие списки в проекте ОБЯЗАНЫ следовать единым стандартам: рендеринг через портал, правильная стилизация, а при количестве элементов > 7 — обязательная строка поиска внутри dropdown.

## Критерий «нужен ли встроенный поиск»

| Условие | Поиск внутри dropdown |
|---|---|
| ≤ 7 элементов (фиксированный набор) | ❌ Не нужен |
| > 7 элементов ИЛИ количество элементов потенциально неограниченно / динамическое | ✅ **Обязателен** |

> **Почему 7?** — Пользователь комфортно просматривает глазами 5-7 элементов. Если их больше — скроллить неудобно, нужна фильтрация по тексту.

## Требования к встроенному поиску

| Параметр | Значение |
|---|---|
| Регистрозависимость | **Нет** — поиск регистронезависимый (`toLowerCase()`) |
| Учёт пробелов | **Да** — пробелы учитываются как часть строки |
| Метод фильтрации | `option.toLowerCase().includes(query.toLowerCase())` |
| Позиция поля поиска | Первый элемент внутри dropdown, над списком опций |
| Разделитель | `border-b border-gray-100` под полем поиска |
| Автофокус | `autoFocus` — курсор сразу в поле поиска при открытии |
| Сброс при открытии | При каждом открытии dropdown `searchQuery` сбрасывается в `''` |
| Пустой результат | Показывать `"Ничего не найдено"` (`text-xs text-gray-400 text-center py-4`) |

## Эталонная реализация — поле поиска внутри dropdown

```tsx
{/* Поле поиска (показывать если options.length > 7 или данные динамические) */}
<div className="p-2 border-b border-gray-100 flex-shrink-0">
    <input
        type="text"
        placeholder="Поиск..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        autoFocus
    />
</div>
```

### Логика фильтрации

```tsx
const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const lower = searchQuery.toLowerCase();
    return options.filter(opt => opt.toLowerCase().includes(lower));
}, [options, searchQuery]);
```

## Общие требования ко ВСЕМ dropdown

### 1. Рендеринг через портал

Все dropdown, которые могут обрезаться границами контейнера (таблица, модалка, сайдбар), **ОБЯЗАНЫ** рендериться через `createPortal(... , document.body)`.

### 2. Динамическое позиционирование

```tsx
const updatePosition = useCallback(() => {
    if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
            top: rect.bottom + 4,    // 4px отступ 
            left: rect.left,
            width: Math.max(rect.width, 200), // мин. ширина 200px
        });
    }
}, []);
```

### 3. Обработка scroll/resize

При скролле или изменении размера окна позиция dropdown **обновляется** динамически:

```tsx
useEffect(() => {
    const handleScrollOrResize = () => {
        if (isOpen) updatePosition();
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
    };
}, [isOpen, updatePosition]);
```

### 4. Закрытие по клику вне

```tsx
useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            isOpen &&
            buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
            menuRef.current && !menuRef.current.contains(event.target as Node)
        ) {
            setIsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isOpen]);
```

### 5. Стилизация

| Элемент | Классы |
|---|---|
| Контейнер dropdown | `fixed z-[100] bg-white rounded-md shadow-lg border border-gray-200 animate-fade-in-up` |
| Максимальная высота | `max-h-[300px]` (или `max-h-60` для компактных) |
| Скролл списка | `overflow-y-auto custom-scrollbar` |
| Опция (обычная) | `w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-900 transition-colors` |
| Опция (выбранная) | `bg-indigo-100 text-indigo-900` (single) или `bg-indigo-50 text-indigo-700 font-medium` |
| Разделитель | `border-t border-gray-100 my-1` |
| Появление | `animate-fade-in-up` |
| Стрелка триггера | SVG `w-4 h-4`, `transition-transform duration-200`, `rotate-180` при открытом |

### 6. Кнопка-триггер

```tsx
<button
    ref={buttonRef}
    onClick={toggleDropdown}
    className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
>
    <span className="truncate">{displayValue}</span>
    <svg 
        className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
</button>
```

## Типы dropdown в проекте

### Single-select (одиночный выбор)

- Клик по опции → закрытие dropdown
- Выбранная опция: `bg-indigo-50 text-indigo-700 font-medium`
- **Эталон:** `SingleSelectSearchableDropdown`

### Multi-select (множественный выбор)

- Клик по опции → toggle, dropdown **НЕ** закрывается
- Чекбоксы: `w-4 h-4 rounded border`, активный: `bg-indigo-600 border-indigo-600` с галочкой
- Опция «Без команды» / «Сбросить все» — отдельная кнопка над списком
- **Эталон:** `CustomSelect` в ProjectTable

### С возможностью создания

- Кнопка `"+ Создать"` вверху списка (над опциями)
- Стиль: `text-indigo-600 hover:bg-indigo-50`, SVG иконка `+`
- При клике: inline-инпут с кнопками ✓ (сохранить) и ✕ (отмена)
- Enter → сохранить, Escape → отмена
- **Эталон:** `CustomSelect` в ProjectTable

## Существующие компоненты

| Компонент | Файл | Тип | Поиск | Портал |
|---|---|---|---|---|
| `CustomSelect` | `features/database-management/components/ProjectTable.tsx` | multi + create | ❌ (<10 опций) | ✅ |
| `SingleSelectSearchableDropdown` | `features/database-management/components/administered-groups/` | single | ✅ | ✅ |
| `MultiSelectDropdown` (admin-groups) | `features/database-management/components/administered-groups/` | multi | ❌ | ❌ |
| `MultiSelectDropdown` (token-logs) | `features/users/components/token-logs-dashboard/components/` | multi | ❌ | ❌ |
| `AlbumSelector` | `features/products/components/AlbumSelector.tsx` | single | ✅ | ✅ |
| `CategorySelector` | `features/products/components/CategorySelector.tsx` | single, grouped | ✅ | ✅ |
| `ContextSelector` | `features/posts/components/ai/ContextSelector.tsx` | single + tabs | ✅ | ✅ |
| `MultiProjectSelector` | `features/posts/components/MultiProjectSelector.tsx` | multi + DnD | ✅ | ❌ (inline) |
| `FilterDropdown` | `features/lists/components/FilterDropdown.tsx` | single | ❌ (<7 опций) | ✅ |
| `LinkTextDropdown` | `features/automations/stories-automation/...` | single | ❌ (21 опция⚠️) | ✅ |
| `AccountSelector` | `features/users/components/token-logs-analytics/...` | multi | ❌ | ❌ |

> ⚠️ **LinkTextDropdown** — 21 опция без поиска. **Нарушение** правила «>7 → поиск». Требуется исправление.

## Типичные ошибки

| Ошибка | Должно быть |
|---|---|
| Dropdown без портала внутри таблицы → обрезается | `createPortal(... , document.body)` |
| Нет обработки scroll → dropdown "уплывает" | `addEventListener('scroll', update, true)` |
| > 7 элементов без поиска | Добавить `<input>` с фильтрацией |
| Поиск с `===` (точное совпадение) | `.includes()` — подстрока |
| Регистрозависимый поиск | `.toLowerCase()` на обоих операндах |
| Поиск игнорирует пробелы (trim) | **НЕ** делать `trim()` — пробелы учитываются |
| `searchQuery` не сбрасывается при открытии | `setSearchQuery('')` при toggle |
| Нет `autoFocus` на поле поиска | Добавить `autoFocus` |
| Нет сообщения «Ничего не найдено» | `text-xs text-gray-400 text-center py-4` |
| `overflow-y-scroll` без `custom-scrollbar` | `overflow-y-auto custom-scrollbar` |
| Нет `animate-fade-in-up` | Добавить анимацию появления |

````
