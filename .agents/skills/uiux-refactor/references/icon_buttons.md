# Кнопки-иконки (SVG)

**Правило:** Для кнопок действий в таблицах, списках и компактных элементах — **только SVG-иконки**. **Категорически запрещено** использовать текстовые эмоджи (🗑️, ✏️, 📋, 👁️ и т.д.) в качестве кнопок.

## Почему SVG, а не эмоджи

- SVG масштабируются без потери качества
- Одинаково отображаются во всех браузерах и ОС
- Поддерживают hover-эффекты через CSS (`currentColor`)
- Профессиональный и консистентный внешний вид

## Стандартные стили

### Нейтральное действие (Просмотр, Логи, Копирование)

```tsx
<button
    onClick={handleAction}
    className="text-gray-400 hover:text-indigo-600"
    title="Описание действия"
>
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="..." />
    </svg>
</button>
```

### Опасное действие (Удаление)

```tsx
<button
    onClick={handleDelete}
    className="text-red-500 hover:text-red-700"
    title="Удалить"
>
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
</button>
```

### Редактирование

```tsx
<button
    onClick={handleEdit}
    className="text-gray-400 hover:text-indigo-600"
    title="Редактировать"
>
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
</button>
```

## Спецификации

| Параметр | Значение |
|---|---|
| Размер иконки | `h-5 w-5` (20x20px) — стандарт для таблиц |
| Толщина линий | `strokeWidth={2}` |
| Default (нейтральный) | `text-gray-400` |
| Hover (нейтральный) | `hover:text-indigo-600` |
| Default (опасный) | `text-red-500` |
| Hover (опасный) | `hover:text-red-700` |
| Обязательный атрибут | `title="..."` для accessibility и tooltip |

## Распространённые SVG-пути (Heroicons style)

| Действие | Path |
|---|---|
| **Удаление (Trash)** | `M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16` |
| **Редактирование (Pencil)** | `M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z` |
| **Логи (Clipboard)** | `M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01` |
| **Копирование (Copy)** | `M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z` |
| **Плюс (Add)** | `M12 4v16m8-8H4` |
| **Галочка (Check)** | `M5 13l4 4L19 7` |

## Запрещено

```tsx
// ❌ Эмоджи вместо иконок
<button onClick={handleDelete}>🗑️</button>
<button onClick={handleEdit}>✏️</button>
<button onClick={handleCopy}>📋</button>
<button onClick={handleView}>👁️</button>
```
