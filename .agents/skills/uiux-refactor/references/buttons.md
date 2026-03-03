# Кнопки

**Правило:** Использовать строгие семантические цвета. Не смешивать размеры скругления (по умолчанию: `rounded-md`).

## Primary Action (Сохранить / Подтвердить)

- **Стиль:** `bg-green-600 text-white hover:bg-green-700`
- **Размер:** `px-4 py-2 text-sm font-medium`
- **Скругление:** `rounded-md`

```tsx
<button 
    onClick={handleSave}
    className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 text-sm font-medium rounded-md"
>
    Сохранить
</button>
```

## Secondary Action (Отмена / Назад)

- **Стиль:** `bg-gray-200 text-gray-800 hover:bg-gray-300`
- **Размер:** `px-4 py-2 text-sm font-medium`
- **Скругление:** `rounded-md`

```tsx
<button 
    onClick={handleCancel}
    className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 text-sm font-medium rounded-md"
>
    Отмена
</button>
```

## Интерактивные элементы

- **Брендовый цвет:** `indigo-600` (активные состояния, ссылки, focus ring)

## Типичные ошибки

| Ошибка | Должно быть |
|---|---|
| `bg-blue-500` для сохранения | `bg-green-600` |
| `bg-blue-600` для primary | `bg-green-600` |
| `rounded-lg` на кнопках | `rounded-md` |
| `rounded-xl` на кнопках | `rounded-md` |
| `text-base` размер текста | `text-sm` |
| `py-3` / `px-6` увеличенный padding | `px-4 py-2` |
| `bg-red-600` для отмены | `bg-gray-200 text-gray-800` |
