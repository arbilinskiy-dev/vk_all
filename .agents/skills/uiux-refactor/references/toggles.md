# Тумблеры (Toggle Switch)

**Правило:** Использовать точную Tailwind-структуру для переключателей вкл/выкл.

## Эталонная реализация (через button)

```tsx
<button
    onClick={handleToggle}
    className={`relative inline-flex items-center h-6 w-11 shrink-0 p-0 border-0 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
        isActive ? 'bg-indigo-600' : 'bg-gray-300'
    }`}
>
    <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm ${
            isActive ? 'translate-x-6' : 'translate-x-1'
        }`}
    />
</button>
```

## Обязательные классы контейнера (трек)

```
relative inline-flex items-center h-6 w-11 shrink-0 p-0 border-0 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-100
```

### Критические классы

| Класс | Зачем | Без него |
|---|---|---|
| `shrink-0` | Предотвращает сжатие в flex-контейнере | Тумблер деформируется при нехватке ширины |
| `p-0` | Убирает дефолтный padding у `<button>` | Увеличенный размер тумблера |
| `border-0` | Убирает дефолтную рамку браузера | Видна рамка |
| `cursor-pointer` | Явный курсор клика | Не очевидно что можно кликнуть |
| `focus:ring-4 focus:ring-indigo-100` | Визуальный фокус | Несовместимость с другими тумблерами |

## Обязательные классы кружка (thumb)

```
inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm
```

### Критические классы

| Класс | Зачем |
|---|---|
| `shadow-sm` | Тень для визуального отделения от трека |
| `w-4 h-4` | Фиксированный размер. НЕ менять на проценты |

## Состояния

| Состояние | Трек | Кружок |
|---|---|---|
| Включён | `bg-indigo-600` | `translate-x-6` |
| Выключен | `bg-gray-300` | `translate-x-1` |

## Альтернативный паттерн (через peer)

Если тумблер реализован через `<input type="checkbox" className="sr-only peer">` + `<div>`, то `shrink-0` и прочие свойства адаптивности необходимо задать на обёрточном `<label>` или `<div>`, содержащем input и div-трек.

## Контейнер тумблера

Тумблер обычно размещается внутри flex-контейнера с лейблом:

```tsx
<div className="flex items-center justify-between border border-gray-200 p-3 rounded-lg bg-gray-50">
    <div>
        <label className="block text-sm font-medium text-gray-800">Название настройки</label>
        <p className="text-xs text-gray-500 mt-1">Описание настройки.</p>
    </div>
    {/* Тумблер с shrink-0 */}
</div>
```

## Типичные ошибки

| Ошибка | Должно быть |
|---|---|
| Нет `shrink-0` на тумблере | Добавить `shrink-0` |
| `bg-green-500` для активного | `bg-indigo-600` |
| `bg-blue-600` для активного | `bg-indigo-600` |
| `h-5 w-10` нестандартный размер | `h-6 w-11` |
| `w-3 h-3` маленький кружок | `w-4 h-4` |
| Нет `shadow-sm` на кружке | Добавить `shadow-sm` |
| `translate-x-5` смещение | `translate-x-6` |
| Нет `p-0` на кнопке-треке | Добавить `p-0` |
| Нет `focus:ring` | Добавить `focus:ring-4 focus:ring-indigo-100` |
