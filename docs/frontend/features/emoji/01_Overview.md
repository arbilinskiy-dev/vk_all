# Модуль Emoji

## Обзор

Модуль `features/emoji` предоставляет функционал работы с эмодзи в приложении, включая VK-эмодзи, выбор из палитры и хранение недавно использованных.

---

## Структура файлов

```
features/emoji/
├── components/          # UI компоненты
│   └── EmojiPicker.tsx  # Палитра выбора эмодзи
├── data/                # Статические данные
│   └── emojis.ts        # Список эмодзи по категориям
└── hooks/
    └── useRecentEmojis.ts  # Хук для недавних эмодзи
```

---

## Компоненты

### `EmojiPicker`

Палитра выбора эмодзи с поддержкой категорий и недавно использованных.

**Функционал:**
- Категоризированный список эмодзи
- Секция "Недавние" (последние использованные)
- Поиск по эмодзи
- Поддержка VK-эмодзи

---

## Хуки

### `useRecentEmojis`

Управляет списком недавно использованных эмодзи с сохранением в localStorage.

**API:**
```typescript
const { 
  recentEmojis,      // string[] — последние 20 эмодзи
  addRecentEmoji     // (emoji: string) => void
} = useRecentEmojis();
```

**Логика:**
- Хранит до 20 последних эмодзи
- Сохраняет в `localStorage` под ключом `recent_emojis`
- Дедупликация — перемещает повторно использованный эмодзи в начало

---

## Данные

### `emojis.ts`

Статический список эмодзи, сгруппированный по категориям:

```typescript
export const emojiCategories = {
  smileys: ['😀', '😃', '😄', '😁', '😆', ...],
  gestures: ['👍', '👎', '👌', '✌️', ...],
  animals: ['🐶', '🐱', '🐭', '🐹', ...],
  food: ['🍎', '🍐', '🍊', '🍋', ...],
  activities: ['⚽', '🏀', '🏈', '⚾', ...],
  travel: ['🚗', '🚕', '🚙', '🚌', ...],
  objects: ['⌚', '📱', '💻', '⌨️', ...],
  symbols: ['❤️', '💔', '💕', '💖', ...],
  flags: ['🇷🇺', '🇺🇸', '🇬🇧', '🇩🇪', ...]
};
```

---

## Использование

```tsx
import { EmojiPicker } from '../features/emoji/components/EmojiPicker';

function TextEditor() {
  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    setText(prev => prev + emoji);
    setShowPicker(false);
  };

  return (
    <div>
      <textarea value={text} onChange={e => setText(e.target.value)} />
      <button onClick={() => setShowPicker(!showPicker)}>😊</button>
      {showPicker && <EmojiPicker onSelect={handleEmojiSelect} />}
    </div>
  );
}
```

---

## Интеграция с постами

Эмодзи-пикер интегрирован в:
- `PostDetailsModal` — текст поста
- `NoteEditor` — заметки
- `ProductEditor` — описания товаров

---

## VK Эмодзи

VK поддерживает специальные эмодзи-стикеры. Они вставляются в текст поста и отображаются как картинки в ВКонтакте.

**Формат:** 
```
&#128522; — Unicode эмодзи
```

---

## См. также

- [Post Modal](../post_modal/) — использование в редакторе постов
- [Notes](../notes/) — использование в заметках
