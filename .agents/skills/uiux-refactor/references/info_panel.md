# Информационная панель пользователя (User Info Panel)

**Эталонная реализация:** `features/messages/components/UserInfoProfileTab.tsx`, `UserInfoPanel.tsx`, `UserInfoPanelHeader.tsx`, `userInfoPanelUtils.tsx`

Этот раздел описывает принципы построения боковой панели с информацией о пользователе — статистика сообщений, активность, профиль. Включает паттерны плавного переключения между пользователями без скачков и мерцания.

---

## 1. Структура панели: три информационных блока

Панель состоит из трёх визуально разделённых блоков одинаковой структуры:

| Блок | Содержимое | minHeight |
|---|---|---|
| **СООБЩЕНИЯ** | Donut-диаграмма + числовая статистика | `100px` |
| **АКТИВНОСТЬ** | Таблица дат (первый контакт, клиент писал, мы писали, подписан, онлайн) | `120px` |
| **ПРОФИЛЬ** | Таблица данных (город, возраст, платформа) с SVG-иконками | `90px` |

### 1.1. Общий шаблон блока

```tsx
<div className="!border-0 pb-1">
    <div className="bg-gray-100/80 rounded-lg p-3 space-y-2" style={{ minHeight: XXX }}>
        <p className="text-[11px] text-gray-600 uppercase tracking-wide font-semibold">
            НАЗВАНИЕ БЛОКА
        </p>
        {/* Содержимое блока */}
    </div>
</div>
```

**Правила:**
- `bg-gray-100/80 rounded-lg` — фон и скругление
- `p-3 space-y-2` — отступы и межстрочный интервал
- `minHeight` — **обязательный** фиксированный минимальный размер, предотвращает скачки layout
- Заголовок: `text-[11px] uppercase tracking-wide font-semibold text-gray-600`
- Блоки НЕ используют conditional rendering (всегда в DOM)

---

## 2. Блок статистики: Donut-диаграмма + цифры

### 2.1. Layout: диаграмма слева, цифры справа

```tsx
<div className="flex items-stretch gap-3">
    {/* Левая часть: SVG donut */}
    <div className="flex flex-col items-center justify-center flex-shrink-0 self-stretch">
        <div className="relative" style={{ width: 120, height: 120 }}>
            <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
                <circle cx="60" cy="60" r={52} fill="none" stroke="#e5e7eb" strokeWidth="7" />
                <circle cx="60" cy="60" r={52} fill="none" stroke={strokeColor} strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.3s ease' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xl font-bold ${textColorClass}`}>{percent}%</span>
            </div>
        </div>
        <span className="text-[10px] text-gray-400 mt-0.5">спам</span>
    </div>

    {/* Правая часть: числа */}
    <div className="min-w-0 space-y-1.5">
        {/* Группы чисел */}
    </div>
</div>
```

### 2.2. Donut-диаграмма — параметры

| Параметр | Значение |
|---|---|
| Размер SVG | `120×120`, `viewBox="0 0 120 120"` |
| Радиус | `r={52}` |
| Толщина | `strokeWidth="7"` |
| Фон кольца | `stroke="#e5e7eb"` |
| Цвет по порогу | `<30%` → `#22c55e`, `30-50%` → `#84cc16`, `50-70%` → `#f59e0b`, `>=70%` → `#ef4444` |
| CSS-переход | `transition: stroke-dashoffset 0.6s ease-out, stroke 0.3s ease` |
| Поворот | `className="-rotate-90"` (старт с 12 часов) |

### 2.3. Числовая статистика — формат

Каждая группа чисел:
```tsx
<div>
    <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-gray-800">{value1.toLocaleString('ru-RU')}</span>
        <span className="text-xs text-gray-400">/</span>
        <span className="text-lg font-bold text-gray-800">{value2.toLocaleString('ru-RU')}</span>
    </div>
    <div className="flex items-center gap-1">
        <span className="text-[9px] text-gray-400">метка1</span>
        <span className="text-[9px] text-gray-300">/</span>
        <span className="text-[9px] text-gray-400">метка2</span>
    </div>
</div>
```

**Правила чисел:**
- Числа: `text-lg font-bold` + `toLocaleString('ru-RU')` (разделитель тысяч)
- Метки: `text-[9px]` — мелкие подписи под числами
- Разделитель пар: `text-xs text-gray-400` → `/`
- «Удалённые из ВК» — **всегда видны** (даже если 0), серый при 0, красный при >0

### 2.4. Блок «всегда рендерится»

Блок статистики ОБЯЗАН быть в DOM всегда, даже если данных ещё нет:
```tsx
{messageStats ? (
    <div>/* Реальные данные */</div>
) : (
    <div className="flex items-center gap-2 text-xs text-gray-400">
        <div className="loader h-3 w-3 border-2 border-gray-200 border-t-gray-400"></div>
        Загрузка...
    </div>
)}
```

Плейсхолдер занимает то же самое пространство (`minHeight` на контейнере).

---

## 3. Таблица активности: фиксированные столбцы

### 3.1. Паттерн table-fixed + colgroup

Для предотвращения скачков ширины столбцов при смене пользователя — используется `table-fixed` с явными `<colgroup>`:

```tsx
<table className="w-full border-collapse table-fixed">
    <colgroup>
        <col style={{ width: 130 }} />  {/* метка (Первый контакт, Клиент писал...) */}
        <col style={{ width: 24 }} />   {/* стрелка → */}
        <col style={{ width: 145 }} />  {/* дата */}
        <col style={{ width: 95 }} />   {/* относительное время */}
    </colgroup>
    <tbody className="text-sm">
        <tr>
            <td className="pr-2 py-0.5 text-gray-400 text-left whitespace-nowrap truncate">Метка</td>
            <td className="px-1.5 py-0.5 text-gray-300 text-center">→</td>
            <td className="px-2 py-0.5 font-medium text-gray-700 text-left whitespace-nowrap truncate">{дата}</td>
            <td className="pl-1.5 py-0.5 text-xs text-gray-400 text-left whitespace-nowrap truncate">{относительное}</td>
        </tr>
    </tbody>
</table>
```

**Критическое правило:** без `table-fixed` + `colgroup` столбцы прыгают при смене пользователя, потому что разная длина дат (`9 января 2023 г.` vs `25 февраля 2026 г.`) меняет auto-ширину.

### 3.2. Цвета строк активности

| Строка | Цвет метки |
|---|---|
| Первый контакт | `text-gray-400` |
| Клиент писал | `text-blue-400` |
| Мы писали | `text-indigo-400` |
| Подписан | `text-green-500` |
| Последний онлайн | `text-gray-400` |

### 3.3. Разделитель секций

Между основными строками и «Подписан/Онлайн» — горизонтальная линия:
```tsx
<tr><td colSpan={4} className="py-1"><div className="border-t border-gray-200" /></td></tr>
```

### 3.4. Фоллбэк первого контакта

Если `first_message_date` отсутствует, используется дата первого входящего сообщения:
```tsx
const firstContactDate = userInfo.first_message_date || userInfo.last_incoming_message_date || null;
```
Этот же `firstContactDate` используется для расчёта «Подписан» (lifetime).

### 3.5. Подсветка «Последний онлайн»

Если пользователь был онлайн менее 15 минут назад — относительное время зелёное:
```tsx
className={userInfo.last_seen && (Date.now() / 1000 - userInfo.last_seen) < 900 
    ? 'text-green-500' : 'text-gray-400'}
```

---

## 4. Таблица профиля: иконки + данные

### 4.1. Строка с SVG-иконкой

```tsx
<tr>
    <td className="pr-2 py-0.5 text-gray-400 text-left whitespace-nowrap align-middle">
        <div className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-gray-400" ...>...</svg>
            <span>Метка</span>
        </div>
    </td>
    <td className="px-1.5 py-0.5 text-gray-300 text-center align-middle">→</td>
    <td className="px-2 py-0.5 font-medium text-gray-700 text-left whitespace-nowrap align-middle">
        {значение}
    </td>
</tr>
```

### 4.2. Платформа — SVG-иконки по типу

Платформа определяется через `PLATFORM_MAP` и отображается через `PlatformIcon`:
```tsx
{platformInfo 
    ? <PlatformIcon type={platformInfo.icon} className="h-3.5 w-3.5 text-gray-400" />
    : <DefaultDeviceIcon />
}
```

---

## 5. Форматирование данных: «неизвестно» вместо прочерков

### 5.1. Правило: никаких прочерков (—)

Все утилитные функции при отсутствии данных возвращают **`'неизвестно'`**, а НЕ прочерк `'—'`:

| Функция | Пустое значение |
|---|---|
| `formatDate(null)` | `'неизвестно'` |
| `calcLifetime(null)` | `'неизвестно'` |
| `calcAge(null)` | `{ dateStr: 'неизвестно', age: null }` |
| `formatLastSeen(null)` | `'неизвестно'` |
| `formatLastSeenDate(null)` | `'неизвестно'` |
| Платформа (нет данных) | `'неизвестно'` |
| Город (нет данных) | `'неизвестно'` |

**Файл-эталон:** `features/messages/components/userInfoPanelUtils.tsx`

### 5.2. Пример утилиты

```tsx
export function formatDate(isoDate?: string | null): string {
    if (!isoDate) return 'неизвестно';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return 'неизвестно';
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}
```

---

## 6. Плавное переключение между пользователями

### 6.1. Проблема: мерцание при смене диалога

При клике на другой диалог в сайдбаре происходит:
1. `activeConversationId` меняется
2. Хуки запускают запрос новых данных
3. Старые данные очищаются → на экране мелькает спиннер/пустота → новые данные приходят

Это создаёт **тройной flash**: (старые данные) → (пустота/спиннер) → (новые данные).

### 6.2. Паттерн «Синхронный сброс при рендере» (Adjust State During Render)

React позволяет вызывать `setState` прямо в теле render-функции (не в useEffect). Это **синхронно** обновляет стейт ДО того, как браузер отрисует кадр.

```tsx
const [trackedParamsKey, setTrackedParamsKey] = useState(paramsKey);

// Синхронный сброс — выполняется В ТЕЛЕ РЕНДЕРА (не в useEffect!)
if (paramsKey !== trackedParamsKey) {
    setTrackedParamsKey(paramsKey);
    setMessages([]);           // очищаем сообщения
    setIsLoading(hasParams);   // ставим лоадер
    // НЕ ОЧИЩАЕМ messageStats и userInfoFromHistory!
}
```

**Почему не useEffect:** Effect выполняется ПОСЛЕ первой отрисовки, поэтому один кадр показывает старые данные с новым userId — мигание. Синхронный сброс при рендере решает это.

### 6.3. Паттерн «Сохранение устаревших данных» (Stale Data Preservation)

**Критическое правило:** При смене пользователя НЕ очищаем данные профиля. Устаревшая (stale) информация видна, пока не придут новые данные.

```tsx
// В useMessageHistory — при смене paramsKey:
setMessages([]);        // ✅ Очищаем сообщения (они от другого пользователя)
setIsLoading(hasParams); // ✅ Ставим флаг загрузки
// messageStats       — НЕ ТРОГАЕМ (стейлые данные видны в панели)
// userInfoFromHistory — НЕ ТРОГАЕМ (стейлые данные видны в панели)

// В useMailingUserInfo — при смене userId:
setIsLoading(false);    // ✅ Не показываем спиннер
setError(null);         // ✅ Очищаем ошибку
// userInfo           — НЕ ТРОГАЕМ (стейлые данные видны)
// isFound            — НЕ ТРОГАЕМ
```

**Результат:** пользователь видит данные предыдущего собеседника (без мерцания), которые плавно заменяются новыми при загрузке.

### 6.4. Нет `key` на панели

**ЗАПРЕЩЕНО:** `<UserInfoPanel key={swapKey} ... />`

Это уничтожает весь DOM панели и пересоздаёт его — серый фон flash. Вместо `key` используем обычный React reconciliation: компонент обновляет props in-place.

```tsx
// ❌ НЕЛЬЗЯ — DOM пересоздаётся, flash серого фона
<div key={swapKey} className="animate-data-swap">
    <Content />
</div>

// ✅ ПРАВИЛЬНО — React обновляет in-place
<div className="flex-1 flex flex-col overflow-y-auto">
    <Content />
</div>
```

### 6.5. Аватар: сброс `avatarLoaded` при смене URL

Аватар должен показать скелетон пока новый аватар не загрузился:
```tsx
const [avatarLoaded, setAvatarLoaded] = useState(false);
const prevAvatarUrlRef = useRef(user.avatarUrl);

useEffect(() => {
    if (user.avatarUrl !== prevAvatarUrlRef.current) {
        setAvatarLoaded(false);
        prevAvatarUrlRef.current = user.avatarUrl;
    }
}, [user.avatarUrl]);
```

### 6.6. Сброс таба при смене пользователя

Если панель имеет табы — при смене пользователя сбрасываем на первый таб:
```tsx
const [activeTab, setActiveTab] = useState<'profile' | 'posts' | 'attachments'>('profile');

useEffect(() => {
    setActiveTab('profile');
}, [user.id]);
```

---

## 7. Фиксация высоты — предотвращение скачков layout

### 7.1. minHeight на каждом блоке

Каждый блок имеет `style={{ minHeight: XXX }}` — это гарантирует, что:
- При отсутствии данных блок занимает то же место, что и с данными
- При смене пользователя layout не прыгает

```tsx
<div className="bg-gray-100/80 rounded-lg p-3 space-y-2" style={{ minHeight: 100 }}>
    {/* Сообщения */}
</div>
<div className="bg-gray-100/80 rounded-lg p-3 space-y-2" style={{ minHeight: 120 }}>
    {/* Активность */}
</div>
<div className="bg-gray-100/80 rounded-lg p-3 space-y-2" style={{ minHeight: 90 }}>
    {/* Профиль */}
</div>
```

### 7.2. Условные элементы всегда в DOM

Элементы, которые могут скрываться (счётчик «удалено из ВК»), должны быть **всегда в DOM** с изменением только цвета:

```tsx
// ❌ НЕЛЬЗЯ — скрывает блок при 0, layout прыгает
{deletedCount > 0 && <div className="text-red-500">{deletedCount}</div>}

// ✅ ПРАВИЛЬНО — блок всегда на месте, цвет меняется
<span className={`text-lg font-bold ${deletedCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
    {deletedCount}
</span>
```

---

## 8. Чеклист для информационных панелей

При создании или аудите информационной панели — проверить:

- [ ] Каждый информационный блок имеет `minHeight` (предотвращение скачков)
- [ ] Таблицы используют `table-fixed` + `<colgroup>` с фиксированными ширинами столбцов
- [ ] После `truncate` на `<td>` — текст не вылезает за границы столбца
- [ ] Нет `key={...}` на контейнере панели (DOM не пересоздаётся при смене данных)
- [ ] Устаревшие данные НЕ очищаются при смене пользователя (stale data preservation)
- [ ] Синхронный сброс стейта в теле рендера (не useEffect) для мгновенного переключения
- [ ] Аватар сбрасывает `avatarLoaded` при смене URL
- [ ] Табы сбрасываются на первый при смене пользователя
- [ ] Все утилиты форматирования возвращают `'неизвестно'` (не прочерк `'—'`)
- [ ] Donut-диаграмма: `transition` на `strokeDashoffset` + `stroke` для плавной анимации
- [ ] Условные элементы (счётчики с 0) — всегда в DOM, меняется только цвет
- [ ] Числа с `toLocaleString('ru-RU')` — разделители тысяч
- [ ] `deletedFromVkCount` — всегда видно (серый при 0, красный при >0)
- [ ] Блоки данных фоллбэчатся (`first_message_date || last_incoming_message_date`)

---

## 9. Типичные ошибки

| Ошибка | Должно быть |
|---|---|
| `key={userId}` на панели → DOM пересоздаётся, flash | Убрать key, React обновляет in-place |
| Очистка userInfo при смене userId → спиннер + Layout shift | НЕ очищать userInfo, показать стейлые данные |
| `table` без `table-fixed` → столбцы прыгают | `table-fixed` + `<colgroup>` |
| Нет `minHeight` → блок схлопывается при пустых данных | Фиксированный `minHeight` на каждом блоке |
| `{count > 0 && <Block>}` → layout shift | Всегда рендерить, менять только цвет |
| Прочерк `—` при отсутствии данных | Текст `'неизвестно'` |
| `useEffect` для сброса стейта → flash 1 кадр | Синхронный сброс в теле рендера |
| `animate-data-swap` + `key` → DOM удаляется | Убрать оба — плавный in-place update |
| Нет фоллбэка дат → «неизвестно» при наличии другой даты | `first_message_date \|\| last_incoming_message_date` |
