# Shared компоненты и утилиты

## Обзор

Папка `shared/` содержит переиспользуемые компоненты, хуки и утилиты, которые используются во всём приложении.

---

## Структура

```
shared/
├── components/
│   ├── CommentTextEditor.tsx      # Редактор текста для комментариев (release3)
│   ├── LazyImage.tsx              # Ленивая загрузка изображений
│   ├── PlaceholderPage.tsx        # Заглушка для пустых страниц
│   ├── ToastProvider.tsx          # Провайдер уведомлений
│   ├── WelcomeScreen.tsx          # Экран приветствия
│   ├── modals/
│   │   ├── ConfirmationModal.tsx  # Модальное окно подтверждения
│   │   ├── ConfirmUnsavedChangesModal.tsx  # Подтверждение несохранённых изменений
│   │   ├── GlobalAiErrorModal.tsx # Глобальная ошибка AI
│   │   ├── ImagePreviewModal.tsx  # Просмотр изображения
│   │   └── SlidePanel.tsx         # Выезжающая панель справа (release3)
│   └── pickers/
│       ├── CustomDatePicker.tsx   # Выбор даты
│       └── CustomTimePicker.tsx   # Выбор времени
├── hooks/
│   ├── useLocalStorage.ts         # Хранение в localStorage
│   ├── useResponsiveActions.ts    # Адаптивные действия
│   └── useTextUndoHistory.ts      # Undo/Redo для текстовых полей (release3)
├── utils/
│   ├── apiClient.ts               # HTTP-клиент
│   ├── mockImageData.ts           # Моковые изображения
│   └── renderVkFormattedText.tsx   # Парсинг VK-разметки (release3)
├── types/                         # Общие TypeScript типы
├── config.ts                      # Конфигурация приложения
└── toastBridge.ts                 # Мост для тостов
```

---

## Компоненты

### `ConfirmationModal`

Универсальное модальное окно подтверждения действий.

**Props:**
| Prop | Тип | Описание |
|------|-----|----------|
| `isOpen` | `boolean` | Открыто ли окно |
| `onClose` | `() => void` | Закрытие окна |
| `onConfirm` | `() => void` | Подтверждение действия |
| `title` | `string` | Заголовок |
| `message` | `string \| ReactNode` | Текст сообщения |
| `confirmText` | `string` | Текст кнопки подтверждения |
| `cancelText` | `string` | Текст кнопки отмены |
| `variant` | `'danger' \| 'warning' \| 'info'` | Стиль окна |

**Использование:**
```tsx
import { ConfirmationModal } from '../shared/components/modals/ConfirmationModal';

const [showConfirm, setShowConfirm] = useState(false);

<ConfirmationModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Удалить пост?"
  message="Это действие нельзя отменить"
  confirmText="Удалить"
  variant="danger"
/>
```

**⚠️ Важно:** Всегда используйте `ConfirmationModal` вместо `window.confirm()`.

---

### `CustomDatePicker`

Кастомный выбор даты с поддержкой русской локализации.

**Props:**
| Prop | Тип | Описание |
|------|-----|----------|
| `value` | `Date \| null` | Выбранная дата |
| `onChange` | `(date: Date) => void` | Callback изменения |
| `minDate` | `Date` | Минимальная дата |
| `maxDate` | `Date` | Максимальная дата |
| `disabled` | `boolean` | Отключен |

---

### `CustomTimePicker`

Выбор времени с шагом 5 минут.

**Props:**
| Prop | Тип | Описание |
|------|-----|----------|
| `value` | `string` | Время в формате "HH:mm" |
| `onChange` | `(time: string) => void` | Callback изменения |
| `disabled` | `boolean` | Отключен |

---

### `LazyImage`

Компонент для ленивой загрузки изображений с placeholder.

**Props:**
| Prop | Тип | Описание |
|------|-----|----------|
| `src` | `string` | URL изображения |
| `alt` | `string` | Alt-текст |
| `className` | `string` | CSS классы |
| `placeholder` | `string` | URL placeholder |

---

### `ToastProvider`

Провайдер для показа уведомлений (toast messages).

**Лимитирование (release.md):**
- Максимум 5 видимых уведомлений (`MAX_VISIBLE_TOASTS = 5`).
- Кнопка «Скрыть все (N)» — появляется при 2+ уведомлениях.
- Индикатор скрытых: `+N ещё...`.
- Контейнер ограничен по высоте: `maxHeight: 60vh`.
- Метод `removeAll()` добавлен в контекст и хук `useToast()`.

**Использование:**
```tsx
// В корне приложения
<ToastProvider>
  <App />
</ToastProvider>

// В любом компоненте
import { toast } from '../shared/toastBridge';

toast.success('Сохранено!');
toast.error('Ошибка!');
toast.info('Информация');
toast.warning('Внимание!');
```

---

### `SlidePanel` (release3)

Выезжающая панель справа, заменяющая стандартное центрированное модальное окно для сложных форм.

**Props:**
| Prop | Тип | Описание |
|------|-----|----------|
| `isOpen` | `boolean` | Открыта ли панель |
| `onClose` | `() => void` | Закрытие панели |
| `children` | `ReactNode` | Содержимое |
| `width` | `string` | CSS-ширина (по умолчанию `85vw`) |
| `zIndex` | `number` | z-index |
| `className` | `string` | Дополнительные CSS-классы |
| `disableOverlayClose` | `boolean` | Отключить закрытие по overlay |
| `disableEscapeClose` | `boolean` | Отключить закрытие по Escape |

**Особенности:**
- Анимация: `slide-panel-in` / `slide-panel-out` (кубическая кривая Безье).
- Хлястик закрытия: кнопка-крестик на левом краю вне панели, `rounded-l-2xl`.
- Скруглённые углы: `rounded-l-2xl`.
- Overlay: `bg-black bg-opacity-50`.
- Блокировка скролла body.
- Адаптивность: `w-full` на мобильных, `sm:w-[85vw]`.

---

### `CommentTextEditor` (release3)

Переиспользуемый редактор текста для комментариев (~280 строк).

**Props:**
| Prop | Тип | Описание |
|------|-----|----------|
| `value` | `string` | Текст комментария |
| `onChange` | `(text: string) => void` | Обработчик изменения |
| `maxLength` | `number` | Максимум символов (по умолчанию 4096) |
| `disabled` | `boolean` | Отключен |

**Включает:**
- Inline EmojiPicker через `useTextUndoHistory`.
- Undo/Redo (Ctrl+Z / Ctrl+Shift+Z).
- Вставка переменных через `VariablesSelector`.
- Автозакрытие скобок и кавычек.
- Счётчик символов.
- Управление фокусом контейнера через React-стейт с дебаунсом (устранение мерцания обводки).

---

## Хуки

### `useLocalStorage`

Синхронизация состояния с localStorage.

```typescript
const [value, setValue] = useLocalStorage<T>(key: string, initialValue: T);
```

**Особенности:**
- Автоматическая сериализация/десериализация JSON
- Синхронизация между вкладками
- Fallback на initialValue при ошибке парсинга

---

### `useResponsiveActions`

Определение размера экрана для адаптивного UI.

```typescript
const { isMobile, isTablet, isDesktop } = useResponsiveActions();
```

**Breakpoints:**
- `isMobile`: < 640px
- `isTablet`: 640px - 1024px
- `isDesktop`: > 1024px

---

### `useTextUndoHistory` (release3)

Собственный стек истории undo/redo для React controlled textarea (100 снапшотов).

```typescript
const { undo, redo, canUndo, canRedo } = useTextUndoHistory(text, setText, textareaRef);
```

**Зачем нужен:** React controlled `<textarea>` теряет нативную историю undo при программном изменении value (вставка AI-текста, эмодзи, переменных).

**Возможности:**
- Перехват `keydown` на textarea: Ctrl+Z (undo), Ctrl+Shift+Z / Ctrl+Y (redo).
- Дебаунс 300мс при обычном наборе (один снапшот на фразу, а не на букву).
- Флаги `canUndo`/`canRedo` для реактивных кнопок.
- Используется в `PostTextSection` и `CommentTextEditor`.

---

## Утилиты

### `apiClient.ts`

Базовый HTTP-клиент для API-запросов.

```typescript
import { callApi } from '../shared/utils/apiClient';

const result = await callApi<ResponseType>(url, {
  method: 'POST',
  body: JSON.stringify(data)
});
```

**Возможности:**
- Автоматическое добавление Content-Type.
- Парсинг JSON-ответов.
- Обработка ошибок с типизацией.
- `MAX_RETRIES = 3` с экспоненциальным бэкоффом 1с → 2с → 4с (release2). Без ретраев для 4xx.

---

### `renderVkFormattedText.tsx` (release3)

Переиспользуемая утилита парсинга VK-разметки. Возвращает массив React-элементов.

```typescript
import { renderVkFormattedText } from '../shared/utils/renderVkFormattedText';

// В JSX
<p>{renderVkFormattedText(postText)}</p>
```

**Поддерживаемые конструкции:**
| Синтаксис | Пример | Результат |
|-----------|--------|-----------|
| `@id123 (Текст)` | `@id18407603 (Никита)` | Ссылка «Никита» → `vk.com/id18407603` |
| `@club123 (Текст)` | `@club12345 (Паблик)` | Ссылка «Паблик» → `vk.com/club12345` |
| `[id123\|Текст]` | `[id18407603\|Никита]` | Ссылка «Никита» |
| `[URL\|Текст]` | `[https://vk.me/club\|Написать нам]` | Кликабельная ссылка |
| `#хэштег` | `#роллы` | Ссылка на поиск VK |

Используется в `PostPreview` и потенциально в других местах отображения VK-текста.

---

### `config.ts`

Конфигурация приложения.

```typescript
import { API_BASE_URL, IS_DEV } from '../shared/config';
```

| Константа | Описание |
|-----------|----------|
| `API_BASE_URL` | Базовый URL API |
| `IS_DEV` | Development-режим |

---

## См. также

- [Component Guide](../04_COMPONENT_GUIDE.md) — Smart vs Dumb компоненты
- [Hooks and Logic](../05_HOOKS_AND_LOGIC.md) — использование хуков
