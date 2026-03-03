# Цвета и захардкоженные значения

**Правило:** ЗАПРЕЩЕНО использовать raw hex/rgb значения (`#3B82F6`, `rgb(59,130,246)`) если существует Tailwind-класс или CSS-переменная.

## Семантические цвета проекта

| Назначение | Tailwind-класс | Hex (только для справки) |
|---|---|---|
| Брендовый / Интерактивный | `indigo-600` | `#4F46E5` |
| Primary Action (Сохранить) | `green-600` / `green-700` | `#16A34A` / `#15803D` |
| Secondary Action (Отмена) | `gray-200` / `gray-300` / `gray-800` | — |
| Danger (Удаление) | `red-500` / `red-700` | `#EF4444` / `#B91C1C` |
| Текст основной | `gray-900` | — |
| Текст вторичный | `gray-500` / `gray-700` | — |
| Иконки по умолчанию | `gray-400` | — |
| Фон карточек | `white` / `gray-50` | — |
| Бордеры | `gray-200` / `gray-300` | — |
| Скелетон | `gray-200` + `animate-pulse` | — |

## Цвета по зонам использования

### Активные состояния
- Табы: `border-indigo-600 text-indigo-600`
- Тумблеры: `bg-indigo-600`
- Focus ring: `focus:ring-indigo-500` или `focus:ring-indigo-100`
- Ссылки: `text-indigo-600 hover:text-indigo-800`

### Кнопки-иконки
- Нейтральные: `text-gray-400 hover:text-indigo-600`
- Опасные: `text-red-500 hover:text-red-700`

### Фон overlay / backdrop
- Модалки: `bg-black/50`
- Lightbox: `bg-black/80`

## Паттерны поиска нарушений

При аудите искать:
- `#[0-9A-Fa-f]{3,8}` — hex-значения в className или style
- `rgb(` / `rgba(` — rgb-значения
- `style={{` — inline-стили с цветами (проверить, нет ли Tailwind-альтернативы)
- `bg-blue-` — возможно должно быть `bg-indigo-` или `bg-green-`
