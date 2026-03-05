# Поле поиска (Search Input)

**Правило:** Все поля поиска в сайдбарах и панелях ОБЯЗАНЫ выглядеть идентично — одинаковые скругления, бордеры, размеры, поведение крестика сброса.

## Эталонный стиль

```tsx
<div className="relative">
    <input
        type="text"
        placeholder="Поиск по названию..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
    />
    {searchQuery && (
        <button
            onClick={() => setSearchQuery('')}
            title="Сбросить поиск"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    )}
</div>
```

## Спецификации

| Параметр | Значение |
|---|---|
| Скругление | `rounded-md` |
| Бордер | `border border-gray-300` |
| Размер текста | `text-sm` |
| Padding | `px-3 py-1.5`, `pr-8` (под крестик) |
| Focus | `focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500` |
| Placeholder | Стандартный (без кастомных цветов) |
| Фон | Белый (по умолчанию, без `bg-gray-50`) |

## Крестик сброса

| Параметр | Значение |
|---|---|
| Позиция | `absolute right-2 top-1/2 -translate-y-1/2` |
| Иконка | SVG крестик `h-4 w-4` |
| Цвет | `text-gray-400 hover:text-gray-600` |
| Видимость | Только когда `searchQuery` не пустой |
| `title` | Обязателен (например `"Сбросить поиск"`) |

## Где используется

- **Sidebar проектов** (`features/projects/components/Sidebar.tsx`) — `"Поиск по названию..."`
- **ConversationsSidebar** (`features/messages/components/ConversationsSidebar.tsx`) — `"Поиск по имени..."`

## ОБЯЗАТЕЛЬНОЕ ПРАВИЛО: Крестик сброса на КАЖДОМ поле поиска

**Любое** поле поиска / фильтрации в приложении **ОБЯЗАНО** иметь кнопку-крестик для сброса введённого значения. Это правило безусловное и не допускает исключений.

### Почему это важно
- Пользователь должен иметь **очевидный** способ очистить поиск одним кликом
- Особенно критично на мобильных устройствах, где выделение и удаление текста неудобно
- Без крестика пользователь может не понять, почему список «пустой» (забыл что ввёл в поиск)

### Требования к крестику
1. **Видимость:** Крестик появляется **только** когда в поле есть текст (`value !== ''`)
2. **Действие:** По клику полностью очищает значение поиска (`setValue('')`)
3. **Позиция:** Абсолютное позиционирование внутри контейнера поля — `absolute right-2 top-1/2 -translate-y-1/2`
4. **Отступ справа у input:** `pr-8` — чтобы текст не залезал под крестик
5. **Иконка:** SVG крестик `h-4 w-4`, `strokeWidth={2}`
6. **Цвет:** `text-gray-400 hover:text-gray-600 transition-colors`
7. **Атрибут `title`:** Обязателен (например `"Сбросить поиск"`, `"Очистить"`)

### Эталонный пример (из Sidebar проектов)

```tsx
{/* features/projects/components/Sidebar.tsx — ЭТАЛОН поля поиска с крестиком */}
<div className="relative">
    <input
        type="text"
        placeholder="Поиск по названию..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
    />
    {searchQuery && (
        <button
            onClick={() => setSearchQuery('')}
            title="Сбросить поиск"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    )}
</div>
```

### Чеклист аудита поиска (при проверке любого компонента с поиском)

- [ ] Есть ли крестик сброса?
- [ ] Крестик скрыт при пустом поле?
- [ ] `pr-8` на input (текст не залезает под крестик)?
- [ ] SVG `h-4 w-4` с `strokeWidth={2}`?
- [ ] `title` атрибут на кнопке крестика?
- [ ] Обёрнут в `<div className="relative">`?

### Антипаттерны

| ❌ НЕ ДЕЛАТЬ | ✅ ПРАВИЛЬНО |
|---|---|
| Поле поиска без крестика | Всегда добавлять крестик сброса |
| Крестик виден при пустом поле | `{searchQuery && (<button>...)}` |
| `input` без `pr-8` (текст под крестиком) | `pr-8` чтобы текст не залезал |
| Кнопка «Очистить» отдельно от поля | Крестик внутри поля (absolute) |
| `type="search"` (браузерный крестик) | `type="text"` + кастомный SVG крестик |

---

## Типичные ошибки

| Ошибка | Должно быть |
|---|---|
| `rounded-lg` / `rounded-xl` | `rounded-md` |
| `border-gray-200` | `border-gray-300` |
| `bg-gray-50` на инпуте | Без фона (белый) |
| `pl-8` с иконкой лупы внутри | `px-3` без иконки лупы |
| `focus:border-transparent` | `focus:border-indigo-500` |
| Крестик в `rounded-full bg` кнопке | Простая иконка без фона |
| Разный стиль в разных сайдбарах | Одинаковый стиль везде |
| **Поле поиска без крестика сброса** | **Всегда крестик SVG в absolute** |
