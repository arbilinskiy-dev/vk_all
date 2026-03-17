# E14: CustomDatePicker — Датапикер

**Файл компонента:** `shared/components/pickers/CustomDatePicker.tsx`

## Принцип работы

Кастомный календарь с тремя уровнями навигации (drill-down):

1. **Дни** (по умолчанию) — сетка дней месяца, кнопка «Сегодня»
2. **Месяцы** — сетка 4×3 (Янв–Дек), клик → возврат к дням выбранного месяца
3. **Годы** — сетка 4×3 (десятилетие ±1), клик → возврат к месяцам выбранного года

### Навигация между уровнями

- **Клик на заголовок** «Март 2026» → режим выбора месяца
- **Клик на год** в режиме месяцев → режим выбора года
- **Стрелки ← →** переключают: месяц (в днях), год (в месяцах), десятилетие (в годах)
- При открытии календаря — всегда начинает с режима «дни»

## Эталонные стили

### Кнопка-триггер
```
flex justify-between items-center border rounded-md px-2 py-1.5 text-sm
border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
h-[34px] bg-white
```
- Иконка календаря: `h-4 w-4 text-gray-500 ml-2`
- Без значения: `text-gray-400` (placeholder)
- Со значением: `text-gray-800` (дата в формате ru-RU)
- Disabled: `bg-gray-100 text-gray-500 cursor-not-allowed`

### Выпадающий календарь
```
bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-64
animate-fade-in-up select-none
```
- Позиционирование: `createPortal` + `fixed z-[100]`
- Открытие вниз (по умолчанию) или вверх (`-translate-y-full`) при нехватке места
- Высота для расчёта направления: 360px

### Заголовок
- Кликабельный текст: `font-bold text-gray-700 hover:text-blue-600` (курсор pointer для дней/месяцев)
- В режиме «годы»: `cursor-default hover:text-gray-700` (не кликабелен)
- Стрелки: `p-1 hover:bg-gray-100 rounded`, SVG `w-4 h-4`

### Сетка дней
- Дни недели: `text-xs text-gray-400 font-medium`, grid 7 колонок
- Ячейка дня: `w-7 h-7 text-sm rounded-full`
- Выбранный: `bg-blue-500 text-white`
- Сегодня: `text-blue-600 font-bold hover:bg-blue-50`
- Обычный: `text-gray-700 hover:bg-gray-100`

### Сетка месяцев / годов
- Grid 3 колонки, `gap-2 py-1`
- Ячейка: `py-2 text-sm rounded-lg`
- Выбранный: `bg-blue-500 text-white`
- Текущий (сегодняшний месяц/год): `text-blue-600 font-bold hover:bg-blue-50`
- Обычный: `text-gray-700 hover:bg-gray-100`
- За пределами десятилетия (годы): `text-gray-400 hover:bg-gray-50`

### Подвал
- `border-t border-gray-100 mt-3 pt-2 text-xs`
- «Сегодня»: `text-blue-600 hover:text-blue-800 font-medium w-full text-right`

## Запреты

- ❌ НЕ использовать `<input type="date">` — только `CustomDatePicker`
- ❌ НЕ использовать сторонние библиотеки (react-datepicker, dayjs UI и т.д.)
- ❌ НЕ заменять drill-down навигацию на помесячную прокрутку стрелками — **обязательно** поддерживать быстрый выбор месяца и года через клик на заголовок
- ❌ НЕ кастомизировать стили в месте использования — менять только в компоненте

## Чеклист аудита

1. [ ] Используется `CustomDatePicker` из `shared/components/pickers/`
2. [ ] Заголовок кликабелен → переход к выбору месяца → года
3. [ ] Стрелки ← → контекстно переключают месяц / год / десятилетие
4. [ ] Выбранная дата подсвечена `bg-blue-500 text-white`
5. [ ] Сегодняшняя дата: `text-blue-600 font-bold`
6. [ ] Кнопка «Сегодня» в подвале
7. [ ] Dropdown через `createPortal`, `z-[100]`
8. [ ] Автоматическое открытие вверх при нехватке места снизу
9. [ ] При открытии всегда начинает с режима «дни»
