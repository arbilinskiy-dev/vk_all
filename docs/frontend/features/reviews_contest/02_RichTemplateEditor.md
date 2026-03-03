# RichTemplateEditor — Текстовый редактор шаблонов

## Обзор

`RichTemplateEditor` — компонент текстового редактора для шаблонов автоматизаций (конкурс отзывов, рассылки и т.д.). Построен по эталону `CommentTextEditor` из дизайн-системы проекта.

**Расположение:** `features/automations/reviews-contest/components/settings/controls/RichTemplateEditor.tsx`

---

## Возможности

| Функция | Реализация |
|---|---|
| Undo / Redo | Хук `useTextUndoHistory` + кнопки в тулбаре |
| Автозакрытие скобок | `() [] {} "" '' «»` + Backspace удаляет пару |
| Счётчик символов | `tabular-nums`, краснеет при превышении лимита (4096) |
| Emoji-пикер | `EmojiPicker variant="inline"`, встроен в контейнер |
| Переменные проекта | Глобальные, базовые, конструкции, проектные |
| Частные переменные | Уникальные для конкретного поля (`{number}`, `{promo_code}` и т.д.) |
| Аккордеон секций | Одновременно открыт только один раздел переменных |
| Плавные анимации | `keep-in-DOM` паттерн для панели переменных и emoji-пикера |
| Фокус | React-стейт `isFocused`, не CSS `focus-within` |

---

## Props

```typescript
interface RichTemplateEditorProps {
    label: string;                    // Название поля (отображается в тулбаре)
    value: string;                    // Текст шаблона
    onChange: (val: string) => void;  // Callback при изменении
    rows?: number;                    // Количество строк textarea (default: 3)
    project: Project;                 // Текущий проект (для загрузки переменных)
    specificVariables?: {             // Частные переменные (уникальные для поля)
        name: string;                 //   Название для кнопки (напр. "Промокод")
        value: string;                //   Значение для вставки (напр. "{promo_code}")
        description: string;          //   Tooltip (напр. "Выигрышный промокод")
    }[];
    helpText?: string;                // Пояснительный текст под редактором
    maxLength?: number;               // Лимит символов (default: 4096)
}
```

---

## Визуальная структура

```
┌──────────────────────────────────────────────────────────────────┐
│  LABEL                         [⚙️] | [😊] | [↩] [↪]           │  ← Тулбар
├──────────────────────────────────────────────────────────────────┤
│  ▼ Панель переменных (аккордеон, keep-in-DOM + transition)      │
│                                                                  │
│  ▼ ЧАСТНЫЕ ПЕРЕМЕННЫЕ                                    ▲      │  ← открыта
│    Работают исключительно в этом поле...                         │
│    (Промокод) (Описание приза) (Имя)                            │
│  ──────────────────────────────────────────────────────────      │
│  ▶ ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ                                 ▼      │  ← свёрнута
│  ▶ БАЗОВЫЕ ПЕРЕМЕННЫЕ                                    ▼      │
│  ▶ КОНСТРУКЦИИ                                           ▼      │
│  ▶ ПЕРЕМЕННЫЕ ПРОЕКТА                                    ▼      │
├──────────────────────────────────────────────────────────────────┤
│  textarea (resize-y, custom-scrollbar)                           │
├──────────────────────────────────────────────────────────────────┤
│  [Inline EmojiPicker - при открытии]                             │
├──────────────────────────────────────────────────────────────────┤
│                                                    62/4096       │  ← Счётчик
└──────────────────────────────────────────────────────────────────┘
Пояснительный текст (helpText)
```

---

## Тулбар

Кнопки сгруппированы **справа** от лейбла через один `flex-1`:

| # | Элемент | Описание |
|---|---------|----------|
| 1 | Label | `text-sm font-medium text-gray-700 shrink-0` |
| 2 | `flex-1` | Пружина — прижимает кнопки вправо |
| 3 | ⚙️ Переменные | Открывает/закрывает панель-аккордеон |
| 4 | Разделитель | `w-px h-4 bg-gray-300 mx-1` |
| 5 | 😊 Эмодзи | Открывает/закрывает inline EmojiPicker |
| 6 | Разделитель | |
| 7 | ↩ Undo | `Ctrl+Z`, блокируется если стек пуст |
| 8 | ↪ Redo | `Ctrl+Shift+Z`, блокируется если стек пуст |

---

## Аккордеон переменных

Панель переменных содержит до 5 секций. **Одновременно открыт только один раздел** — нажатие на заголовок раскрывает секцию и сворачивает остальные.

### Состояние

```typescript
const [openSection, setOpenSection] = useState<string | null>(null);
const toggleSection = (id: string) => setOpenSection(prev => prev === id ? null : id);
```

### Секции

| id | Заголовок | Условие отображения | Стиль кнопок |
|---|---|---|---|
| `specific` | Частные переменные | `specificVariables?.length > 0` | `bg-indigo-50 border-indigo-200 text-indigo-700 rounded-full` |
| `global` | Глобальные переменные | `globalVariables !== null` | Стандартный (`bg-white border-gray-300 rounded-full`) |
| `base` | Базовые переменные | `project` существует | Стандартный |
| `constructions` | Конструкции | Всегда | Стандартный |
| `project` | Переменные проекта | Всегда | Стандартный + кнопка «+ Добавить» |

### Хелперы рендеринга

- `renderSection(id, title, content)` — рендерит кликабельный заголовок с шевроном + анимированный контент (`max-h-60 / max-h-0`)
- `renderVarBtn(name, value, title?)` — рендерит pill-кнопку переменной (`rounded-full`)

### По умолчанию

При первом открытии панели раскрывается секция `'specific'` (если есть частные переменные), иначе `'global'`.

---

## Анимации

### Панель переменных и EmojiPicker

Используется паттерн **keep-in-DOM** для плавного открытия И закрытия:

```typescript
const [variablesEverShown, setVariablesEverShown] = useState(false);

// При первом открытии: variablesEverShown = true → контент рендерится
// При закрытии: контент остаётся в DOM, transition схлопывает высоту
```

```tsx
<div className={`overflow-hidden transition-all duration-300 ease-out ${
    showVariables ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
}`}>
    {variablesEverShown && (
        <div className="px-3 py-1 bg-gray-50 border-b border-gray-200 divide-y divide-gray-100">
            {/* Секции аккордеона */}
        </div>
    )}
</div>
```

Аналогично для `EmojiPicker` — через `emojiEverShown`.

### Секции аккордеона

Каждая секция анимируется через `transition-all duration-200 ease-out` + `max-h-60 / max-h-0 opacity`.

---

## Управление фокусом

Вместо CSS `focus-within` (вызывает чёрную вспышку при `transition-all`) используется React-стейт:

```typescript
const [isFocused, setIsFocused] = useState(false);

const handleContainerFocus = () => {
    clearTimeout(focusTimeoutRef.current);
    setIsFocused(true);
};

const handleContainerBlur = () => {
    focusTimeoutRef.current = setTimeout(() => setIsFocused(false), 0);
};
```

`setTimeout(0)` позволяет фокусу перейти на другой дочерний элемент внутри контейнера без мерцания.

---

## Автозакрытие скобок

```typescript
const AUTO_CLOSE_PAIRS: Record<string, string> = {
    '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '«': '»',
};
```

Поведение:
- Ввод открывающего символа → вставляет пару, курсор между ними
- Ввод закрывающего символа (если уже стоит) → перешагивает
- Backspace между парой → удаляет оба символа
- Выделенный текст → оборачивается парой

---

## Зависимости

| Модуль | Назначение |
|---|---|
| `useTextUndoHistory` | Undo/Redo стек (`shared/hooks/`) |
| `EmojiPicker` | Inline emoji-пикер (`features/emoji/`) |
| `api.getProjectVariables` | Загрузка переменных проекта |
| `api.getAllGlobalVariableDefinitions` | Загрузка глобальных переменных |

> **Примечание:** `VariablesSelector` из `features/posts/` **НЕ используется**. Секции переменных рендерятся инлайн через `renderSection` / `renderVarBtn` для поддержки аккордеона.

---

## Дизайн-система

Компонент следует правилам дизайн-системы (см. `docs/ui-kit/`):

- **Контейнер:** `border rounded-lg overflow-hidden`
- **Фокус:** `border-indigo-500 ring-2 ring-indigo-500` (без `transition-all`)
- **Тулбар:** `bg-gray-50 border-b border-gray-200`
- **Textarea:** `border-0 focus:ring-0 focus:outline-none resize-y custom-scrollbar`
- **Счётчик:** `tabular-nums`, красный при превышении
- **Частные переменные:** `bg-indigo-50 border-indigo-200 text-indigo-700 rounded-full`

Подробнее: `.agents/skills/uiux-refactor/references/specific_variables.md`

---

## Пример использования

```tsx
<RichTemplateEditor
    label="Сообщение победителю (ЛС)"
    value={settings.templateDm}
    onChange={(val) => onChange('templateDm', val)}
    project={project}
    specificVariables={[
        { name: 'Промокод', value: '{promo_code}', description: 'Выигрышный промокод' },
        { name: 'Приз', value: '{description}', description: 'Описание приза из базы промокодов' },
        { name: 'Имя', value: '{user_name}', description: 'Имя победителя' },
    ]}
    rows={5}
    helpText="Это сообщение будет отправлено через ЛС сообщества."
/>
```
