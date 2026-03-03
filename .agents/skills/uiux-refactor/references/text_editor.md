# Текстовый редактор (Rich Text Editor)

**Правило:** Все текстовые поля для ввода контента (текст поста, комментарий, описание товара, шаблон автоматизации) ОБЯЗАНЫ использовать стандартный компонент текстового редактора. ЗАПРЕЩЕНО использовать голый `<textarea>` без тулбара, undo/redo, emoji-пикера и управления фокусом.

## Готовые компоненты

| Компонент | Путь | Назначение |
|---|---|---|
| `PostTextSection` | `features/posts/components/modals/PostTextSection.tsx` | Текст поста (max 8206 символов) + переменные сверху |
| `CommentTextEditor` | `shared/components/CommentTextEditor.tsx` | Комментарии (max 4096 символов), переиспользуемый |
| `RichTemplateEditor` | `features/automations/.../controls/RichTemplateEditor.tsx` | Шаблоны автоматизаций |

**При создании нового текстового поля — использовать `CommentTextEditor` или повторить его паттерн.**

## Обязательная структура блока

Текстовый редактор — это **единый визуальный блок** из 4 зон, обёрнутых в общий контейнер:

```
┌──────────────────────────────────────────────────────┐
│  ТУЛБАР: [@ ссылка] | [😊 эмодзи]    [↩ undo] [↪ redo] │  ← bg-gray-50, border-b
├──────────────────────────────────────────────────────┤
│                                                        │
│  TEXTAREA: ввод текста                                 │  ← bg-white, без border
│                                                        │
├──────────────────────────────────────────────────────┤
│  EMOJI PICKER (опционально, inline)                    │  ← появляется при клике
├──────────────────────────────────────────────────────┤
│                                        123/8206        │  ← bg-gray-50, border-t
└──────────────────────────────────────────────────────┘
```

## Обязательные элементы

### 1. Контейнер (единый блок)

```tsx
<div
    className={`border rounded-lg overflow-hidden ${
        isFocused
            ? 'border-indigo-500 ring-2 ring-indigo-500'
            : 'border-gray-300'
    }`}
    onFocus={handleContainerFocus}
    onBlur={handleContainerBlur}
>
```

**Критические требования:**
- `rounded-lg` — скругление контейнера
- `overflow-hidden` — чтобы дочерние элементы не вылезали за скругления
- Управление фокусом через **React-стейт** `isFocused`, НЕ через CSS `focus-within`
- Фокус: `border-indigo-500 ring-2 ring-indigo-500`
- Без фокуса: `border-gray-300`
- Нет `transition-all` на контейнере (чтобы не было чёрной вспышки при интерполяции gray→indigo)

### 2. Управление фокусом контейнера

ЗАПРЕЩЕНО использовать CSS `focus-within` — вызывает мерцание при переключении фокуса между элементами внутри контейнера.

**Эталонная реализация:**

```tsx
const [isFocused, setIsFocused] = useState(false);
const focusTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

// При фокусе — мгновенно включаем обводку
const handleContainerFocus = useCallback(() => {
    clearTimeout(focusTimeoutRef.current);
    setIsFocused(true);
}, []);

// При потере фокуса — ждём микротаск
const handleContainerBlur = useCallback(() => {
    focusTimeoutRef.current = setTimeout(() => {
        setIsFocused(false);
    }, 0);
}, []);

// Очистка при размонтировании
useEffect(() => {
    return () => clearTimeout(focusTimeoutRef.current);
}, []);
```

### 3. Тулбар

```tsx
<div className="flex items-center gap-0.5 px-2 py-1 bg-gray-50 border-b border-gray-200">
```

**Обязательные элементы тулбара (слева направо):**

1. **Кнопка ссылки @** — вставляет `@id (текст)`
2. **Разделитель** — `<div className="w-px h-4 bg-gray-300 mx-1" />`
3. **Кнопка эмодзи** — открывает inline-пикер (состояние toggle)
4. **Пружина** — `<div className="flex-1" />` (отодвигает undo/redo вправо)
5. **Кнопка Undo** — `Ctrl+Z`
6. **Кнопка Redo** — `Ctrl+Shift+Z`

**Стили кнопок тулбара:**

```tsx
// Обычная кнопка
const toolbarBtnClass = "p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors";

// Недоступная кнопка (undo/redo когда стек пуст)
const toolbarBtnDisabledClass = "p-1.5 rounded text-gray-300 cursor-default";

// Активная кнопка (эмодзи-пикер открыт)
// Добавляется: '!bg-indigo-100 !text-indigo-600'
```

**Размер иконок в тулбаре:** `w-4 h-4` (16x16px) — меньше стандартных `h-5 w-5`

### 4. Textarea

```tsx
<textarea
    ref={textareaRef}
    value={text}
    onChange={e => onTextChange(e.target.value)}
    onKeyDown={handleKeyDown}
    rows={isEmojiPickerOpen ? 6 : 12}
    className="w-full p-2.5 text-sm text-gray-800 bg-white resize-y border-0 outline-none focus:ring-0 focus:outline-none custom-scrollbar"
    placeholder="Введите текст..."
/>
```

**Критические классы:**
- `border-0 outline-none focus:ring-0 focus:outline-none` — убирает все встроенные стили фокуса (фокус только на контейнере)
- `resize-y` — разрешает вертикальный ресайз
- `custom-scrollbar` — стилизованный скроллбар
- `text-sm text-gray-800` — стандартный размер и цвет текста
- `p-2.5` — внутренний padding
- При открытом emoji-пикере — `rows` уменьшается

### 5. Inline Emoji Picker

```tsx
{isEmojiPickerOpen && (
    <EmojiPicker
        projectId={projectId}
        onSelectEmoji={handleInsertEmoji}
        variant="inline"
    />
)}
```

- Компонент: `EmojiPicker` из `features/emoji/components/EmojiPicker.tsx`
- Обязательно `variant="inline"` (встроенный, не floating)
- Появляется **внутри** контейнера, между textarea и счётчиком

### 6. Счётчик символов

```tsx
<div className="flex items-center justify-end px-2.5 py-1 bg-gray-50 border-t border-gray-200">
    <span className={`text-xs tabular-nums ${isOverLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
        {charCount}/{MAX_LENGTH}
    </span>
</div>
```

**Критические классы:**
- `tabular-nums` — моноширинные цифры (чтобы счётчик не прыгал при изменении)
- Нормальное состояние: `text-gray-400`
- Превышение лимита: `text-red-500 font-semibold`
- Фон: `bg-gray-50 border-t border-gray-200`

## Обязательные фичи

### Undo/Redo через `useTextUndoHistory`

- Хук: `shared/hooks/useTextUndoHistory.ts`
- Перехватывает `Ctrl+Z` (undo) и `Ctrl+Shift+Z` (redo)
- Ведёт собственный стек истории (до 100 снапшотов)
- Необходим потому что React controlled inputs теряют нативную историю undo браузера

```tsx
const { undo, redo, canUndo, canRedo } = useTextUndoHistory({
    text,
    onTextChange,
    textareaRef,
});
```

### Автозакрытие скобок и кавычек

Пары авто-закрывающихся символов:

```tsx
const AUTO_CLOSE_PAIRS: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    "'": "'",
    '«': '»',
};
```

**Поведение:**
- При вводе открывающего символа — автоматически вставляет закрывающий, курсор между ними
- При выделении текста и вводе открывающего — оборачивает выделение
- При вводе закрывающего символа, если он уже стоит справа — перешагивает
- `Backspace` между парой — удаляет оба символа

### Вставка переменных

- Компонент `VariablesSelector` из `features/posts/components/VariablesSelector.tsx`
- Вставка в позицию курсора с сохранением фокуса
- Поддержка глобальных переменных, переменных проекта, базовых переменных и конструкций

### Вставка эмодзи

- Используется `EmojiPicker` с `variant="inline"`
- Вставка в позицию курсора с сохранением фокуса
- Пикер с поиском, категориями и недавними эмодзи

### Вставка ссылок

- Формат VK: `@id (текст)`
- Если текст выделен — оборачивает: `@id (выделенный текст)`
- Если нет — вставляет `@id ()` и ставит курсор между скобками

## Блок переменных (над текстовым полем)

В `PostTextSection` переменные отображаются **над** текстовым полем в отдельном блоке:

```tsx
<div className="bg-gray-100 border rounded-md p-3">
    <VariablesSelector ... />
</div>
```

В `CommentTextEditor` переменные в более компактном виде:

```tsx
<div className="bg-gray-50 border rounded-md p-2">
    <VariablesSelector ... />
</div>
```

## Типичные ошибки

| Ошибка | Должно быть |
|---|---|
| Голый `<textarea>` без тулбара | Полный блок: тулбар + textarea + счётчик |
| CSS `focus-within` на контейнере | React-стейт `isFocused` с `setTimeout(0)` |
| `transition-all` на контейнере | Убрать (вспышка чёрного при gray→indigo) |
| Нет `border-0 focus:ring-0` на textarea | Добавить — фокус только на контейнере |
| Стандартный browser undo (без хука) | `useTextUndoHistory` — свой стек |
| Floating emoji picker | `variant="inline"` внутри контейнера |
| Нет `custom-scrollbar` на textarea | Добавить |
| Нет `tabular-nums` на счётчике | Добавить — цифры не должны прыгать |
| Нет `resize-y` на textarea | Добавить — пользователь должен мочь ресайзить |
| Нет автозакрытия скобок | Добавить `AUTO_CLOSE_PAIRS` + `handleKeyDown` |
| Нет счётчика символов | Добавить с лимитом и красным цветом при превышении |
| Эмодзи через нативный пикер ОС | Использовать `EmojiPicker` из `features/emoji/` |
