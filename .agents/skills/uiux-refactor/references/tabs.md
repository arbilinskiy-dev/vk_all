# Табы / Навигация по секциям

**Правило:** ВСЯ внутренняя навигация (главные табы, под-табы, вложенная навигация) ОБЯЗАНА использовать единый стиль **underline** с `border-b-2`. ЗАПРЕЩЕНО создавать альтернативные стили (rounded tabs, pill buttons и т.д.).

## Эталонная реализация

### Функция генерации классов

```tsx
const tabClass = (tabName: string) => `py-2 px-2 text-sm font-medium border-b-2 transition-colors ${
    activeTab === tabName 
        ? 'border-indigo-600 text-indigo-600' 
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
}`;
```

### Контейнер

```tsx
<div className="px-4 pt-2 bg-white border-b border-gray-200">
    <div className="flex gap-4">
        <button onClick={() => setActiveTab('tab1')} className={tabClass('tab1')}>Tab 1</button>
        <button onClick={() => setActiveTab('tab2')} className={tabClass('tab2')}>Tab 2</button>
    </div>
</div>
```

## Спецификации

| Состояние | Классы |
|---|---|
| Активный | `border-indigo-600 text-indigo-600` (indigo подчёркивание + текст) |
| Неактивный | `border-transparent text-gray-500` |
| Hover | `hover:text-gray-700 hover:border-gray-300` |

| Параметр | Значение |
|---|---|
| Расстояние между табами | `gap-4` |
| Padding табов | `px-2 py-2` |
| Шрифт | `text-sm font-medium` |
| Подчёркивание | `border-b-2` |

## Где применяется

- Главные табы страниц (Настройки, Управление пользователями и т.д.)
- Под-табы секций (Логи → Callback API / Токены)
- Любые вложенные логические переключатели секций

## Типичные ошибки

| Ошибка | Должно быть |
|---|---|
| `rounded-full bg-indigo-100` pill-стиль | `border-b-2 border-indigo-600` underline |
| `bg-indigo-600 text-white` активный фон | `border-indigo-600 text-indigo-600` (только подчёркивание) |
| `rounded-md bg-gray-100` card-стиль | `border-b-2 border-transparent` |
| `text-base` размер текста | `text-sm` |
| `font-bold` жирность | `font-medium` |
| `gap-2` маленькое расстояние | `gap-4` |
| `border-blue-600` синий | `border-indigo-600` |
