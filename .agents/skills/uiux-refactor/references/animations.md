# Анимации и плавные переходы (Animations & Transitions)

**Правило:** Все элементы интерфейса ОБЯЗАНЫ появляться и исчезать **плавно**. ЗАПРЕЩЕНЫ резкие скачки, мгновенные вставки блоков и дёрганые загрузки. Каждое изменение видимости элемента должно сопровождаться анимацией.

## Глобальные CSS-анимации

Все анимации определены в `index.html` и доступны глобально через CSS-классы:

### `animate-fade-in-up` — Плавное появление снизу
**Когда использовать:** Модалки, попапы, дропдауны, тултипы, строки таблиц, карточки.

```css
@keyframes fade-in-up {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
    animation: fade-in-up 0.35s ease-out forwards;
}
```

**Пример использования:**
```tsx
// Модалка
<div className="bg-white rounded-lg shadow-xl animate-fade-in-up">...</div>

// Строка таблицы с задержкой (stagger-эффект)
<tr className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 20}ms` }}>...</tr>

// Блок контента при загрузке
<div className="space-y-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>...</div>
```

### `animate-fade-in` — Плавное появление с масштабированием
**Когда использовать:** Иконки, бейджи, мелкие элементы, уведомления.

```css
@keyframes fade-in {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
    animation: fade-in 0.25s ease-out forwards;
}
```

### `animate-expand-down` — Плавное раскрытие панели вниз (только открытие)
**Когда использовать:** Сворачиваемые панели, аккордеоны, раскрывающиеся секции. **Внимание:** эта анимация работает только на открытие. Для **плавного открытия И закрытия** используй паттерн `transition + keep-in-DOM` (см. раздел «Сворачиваемые секции» ниже).

```css
@keyframes expand-down {
    from { opacity: 0; max-height: 0; }
    to { opacity: 1; max-height: 500px; }
}
.animate-expand-down {
    animation: expand-down 0.25s ease-out forwards;
    overflow: hidden;
}
```

**Пример использования:**
```tsx
// Панель переменных в текстовом редакторе
{showVariables && (
    <div className="p-3 bg-gray-50 border-b border-gray-200 animate-expand-down">
        <VariablesSelector ... />
    </div>
)}

// Inline Emoji Picker
{isEmojiPickerOpen && (
    <div className="animate-expand-down">
        <EmojiPicker variant="inline" ... />
    </div>
)}
```

### `animate-collapse-up` — Плавное сворачивание панели вверх
**Когда использовать:** Если требуется анимация закрытия (не просто unmount).

```css
@keyframes collapse-up {
    from { opacity: 1; max-height: 500px; }
    to { opacity: 0; max-height: 0; }
}
.animate-collapse-up {
    animation: collapse-up 0.2s ease-in forwards;
    overflow: hidden;
}
```

> **Примечание:** Для React-компонентов с conditional rendering (`{show && <div>}`) анимация закрытия требует задержки unmount через `setTimeout` или `onAnimationEnd`. В большинстве случаев достаточно анимации **только на появление** (`animate-expand-down`).

### `animate-fade-in-row` — Плавное появление строки
**Когда использовать:** Строки таблиц, элементы списков при пагинации, подгрузке данных.

```css
@keyframes fade-in-row {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-row {
    animation: fade-in-row 0.25s ease-out forwards;
}
```

**Пример с stagger-эффектом (каскадное появление строк):**
```tsx
{items.map((item, index) => (
    <tr 
        key={item.id} 
        className="opacity-0 animate-fade-in-row"
        style={{ animationDelay: `${index * 30}ms` }}
    >
        ...
    </tr>
))}
```

### `animate-image-fade-in` — Плавное появление изображения
**Когда использовать:** После загрузки фото (в паре со скелетоном).

```css
@keyframes image-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}
.animate-image-fade-in {
    animation: image-fade-in 0.4s ease-out forwards;
}
```

---

## Паттерны анимации по типам элементов

### 1. Таблицы и списки — Stagger-анимация

При загрузке данных в таблицу/список строки появляются каскадно, каждая с нарастающей задержкой:

```tsx
{data.map((item, index) => (
    <tr 
        key={item.id}
        className="opacity-0 animate-fade-in-up"
        style={{ animationDelay: `${index * 20}ms` }}
    >
        <td>...</td>
    </tr>
))}
```

**Параметры:**
- Базовая задержка: `20-30ms` на элемент
- Максимальная задержка: не более `500ms` (для списка из 20+ элементов — ограничить)
- Класс: `animate-fade-in-up` или `animate-fade-in-row`
- Обязательно `opacity-0` в className (начальное состояние до анимации)

### 2. Пагинация — Fade при смене страницы

При переключении страницы контент плавно появляется:

```tsx
{/* Обёртка контента с ключом страницы */}
<div key={currentPage} className="opacity-0 animate-fade-in-up">
    {pageContent}
</div>
```

**Ключевой момент:** `key={currentPage}` — React пересоздаёт элемент при смене страницы, что запускает анимацию заново.

### 3. Скелетоны — Каскадное превращение в реальные данные

Пока данные загружаются, вместо пустоты показываем пульсирующие плейсхолдеры, которые затем **последовательно превращаются** в реальный контент (не исчезают все разом).

#### Принципы скелетонов

| Правило | Описание |
|---|---|
| **Количество = видимая область** | Скелетонов должно быть столько, сколько помещается на экране в видимой области контейнера, либо столько, сколько элементов запрашивается (что меньше). Нельзя показывать 5 скелетонов если на экране помещается 14 — будет пустота снизу. |
| **Pixel-perfect размеры** | Каждый скелетон-элемент **обязан** совпадать по высоте с реальным отрисованным элементом. Учитывать: padding, line-height шрифтов (`text-sm` → `h-5`, `text-xs` → `h-4`), количество строк текста (`line-clamp-2` → две полоски), отступы между строками (`mt-0.5`, `space-y-1`). |
| **Нет необязательных элементов** | В скелетон НЕ включаются элементы, которые могут отсутствовать в реальном рендере. Пример: badge непрочитанных (может быть 0), индикатор онлайна, бот-иконка. Если элемент условный (`{count > 0 && ...}`), его нет в скелетоне. |
| **Каскадное раскрытие** | Данные НЕ заменяют скелетон целиком. Каждый элемент скелетона последовательно (сверху-вниз) превращается в реальный элемент с анимацией. |
| **Единый контейнер** | Скелетоны и реальные элементы живут в одном списке/гриде. Не должно быть двух отдельных блоков (скелетон → данные) с мгновенным переключением. |

#### Паттерн «Cascade Reveal» (каскадное раскрытие)

Стандартный подход для списков: скелетоны → данные пришли → по одному элементу снизу-вверх скелетон заменяется на реальный контент.

**Состояния:** 
```
1. isLoading=true, данных нет  → показать N скелетонов (N = видимая область)
2. Данные пришли               → запустить интервал: revealedCount++ каждые 35мс
3. revealedCount < i            → слот i = скелетон
4. revealedCount >= i           → слот i = реальный элемент (с fade-in)
5. Все видимые раскрыты         → revealedCount = Infinity, остальные мгновенно
```

**Реализация:**
```tsx
// Состояние каскадного раскрытия
const SKELETON_VISIBLE_COUNT = 14; // сколько помещается на экране
const [revealedCount, setRevealedCount] = useState<number>(Infinity);
const wasEmptyLoadingRef = useRef(false);
const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

useEffect(() => {
    // Фаза 1: загрузка началась — все слоты = скелетоны
    if (isLoading && items.length === 0) {
        wasEmptyLoadingRef.current = true;
        setRevealedCount(0);
        if (revealTimerRef.current) clearInterval(revealTimerRef.current);
        return;
    }
    // Фаза 2: данные пришли — каскадное раскрытие
    if (wasEmptyLoadingRef.current && items.length > 0) {
        wasEmptyLoadingRef.current = false;
        if (revealTimerRef.current) clearInterval(revealTimerRef.current);
        let count = 0;
        const limit = Math.min(items.length, SKELETON_VISIBLE_COUNT);
        revealTimerRef.current = setInterval(() => {
            count++;
            if (count >= limit) {
                setRevealedCount(Infinity); // показать остальные мгновенно
                clearInterval(revealTimerRef.current!);
                revealTimerRef.current = null;
            } else {
                setRevealedCount(count);
            }
        }, 35); // 35мс между элементами
    }
}, [isLoading, items.length]);

// Очистка таймера при размонтировании
useEffect(() => () => {
    if (revealTimerRef.current) clearInterval(revealTimerRef.current);
}, []);
```

**Рендер гибридного списка:**
```tsx
const totalSlots = items.length > 0
    ? items.length
    : (isLoading ? SKELETON_VISIBLE_COUNT : 0);

{Array.from({ length: totalSlots }, (_, i) => {
    const item = items[i];
    if (item && i < revealedCount) {
        return <RealItem key={item.id} item={item} />;
    }
    return <ItemSkeleton key={`skel-${i}`} index={i} />;
})}
```

#### Создание pixel-perfect скелетона

Скелетон-элемент должен повторять layout реального элемента с точностью до пикселя:

```tsx
// Реальный элемент (ConversationItem):
// - Обёртка: px-3 py-3 flex items-start gap-3
// - Аватар: relative flex-shrink-0 > w-11 h-11 rounded-full
// - Имя: text-sm font-medium → line-height 20px → контейнер h-5
// - Время: text-[11px] → маленький бар h-2.5 w-8
// - Превью: text-xs line-clamp-2 → mt-0.5 + 2 строки h-3 с space-y-1

const ItemSkeleton = ({ index = 0 }) => (
    <div className="w-full px-3 py-3 flex items-start gap-3 border-b border-gray-50 animate-pulse"
         style={{ animationDelay: `${index * 60}ms` }}>
        <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-gray-200" />
        </div>
        <div className="flex-1 min-w-0">
            {/* h-5 = line-height text-sm (20px) */}
            <div className="flex items-center justify-between gap-2 h-5">
                <div className="h-3.5 bg-gray-200 rounded" style={{ width: `${70 + (index % 3) * 20}px` }} />
                <div className="h-2.5 w-8 bg-gray-200 rounded flex-shrink-0" />
            </div>
            {/* mt-0.5 + 2 строки = text-xs line-clamp-2 */}
            <div className="mt-0.5 space-y-1">
                <div className="h-3 bg-gray-200 rounded" style={{ width: `${160 + (index % 4) * 15}px`, maxWidth: '100%' }} />
                <div className="h-3 bg-gray-200 rounded" style={{ width: `${80 + (index % 3) * 25}px` }} />
            </div>
        </div>
    </div>
);
```

**Чеклист pixel-perfect:**
| Шрифт реального элемента | Высота контейнера строки в скелетоне | Высота бара |
|---|---|---|
| `text-xs` (12px/16px) | `h-4` (16px) | `h-3` (12px) |
| `text-sm` (14px/20px) | `h-5` (20px) | `h-3.5` (14px) |
| `text-base` (16px/24px) | `h-6` (24px) | `h-4` (16px) |
| `text-[11px]` (~16px) | — | `h-2.5` (10px) |

**Разная ширина баров** — для естественности используй `(index % N) * step`:
```tsx
style={{ width: `${baseWidth + (index % 3) * 20}px` }}
```

#### Эталонная реализация

- **Скелетон-компонент:** `features/messages/components/ConversationItemSkeleton.tsx`
- **Каскадное раскрытие:** `features/messages/components/ConversationsSidebar.tsx` (секция «Каскадное раскрытие»)

**Правила скелетонов:**
- Размер скелетона **совпадает** с реальным элементом (не больше, не меньше)
- Стиль: `bg-gray-200 rounded animate-pulse`
- Количество скелетонов = видимая область экрана в данном контейнере
- Каскадное раскрытие: 35мс между элементами, видимые → последовательно, остальные → мгновенно

### 4. Сворачиваемые секции — Плавное открытие И закрытие

**Критическое правило:** Если панель должна плавно ОТКРЫВАТЬСЯ и ПЛАВНО ЗАКРЫВАТЬСЯ, нельзя использовать conditional rendering (`{show && <div>}`), потому что React мгновенно удаляет элемент из DOM без анимации.

**Паттерн `transition + keep-in-DOM`:**

```tsx
// 1. Два состояния: открыт ли сейчас + был ли открыт хотя бы раз
const [isOpen, setIsOpen] = useState(false);
const [everOpened, setEverOpened] = useState(false);

// 2. При открытии — запоминаем, что контент нужно держать в DOM
const handleToggle = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen) setEverOpened(true);
};

// 3. Wrapper всегда в DOM, анимируется через transition
<div className={`overflow-hidden transition-all duration-300 ease-out ${
    isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
}`}>
    {/* Контент рендерится только после первого открытия и остаётся в DOM */}
    {everOpened && (
        <div className="p-3 bg-gray-50 border-b border-gray-200">
            {Контент панели}
        </div>
    )}
</div>
```

**Почему так:**
- `everOpened` — загружает контент лениво (только по первому клику), но не удаляет из DOM при закрытии
- Wrapper `div` всегда в DOM → CSS transition работает в обе стороны
- `max-h-0 opacity-0` → панель визуально схлопывается плавно
- `overflow-hidden` — контент не вылезает за границы при сворачивании

**Когда использовать этот паттерн:**
- Панели переменных / фильтров в текстовом редакторе
- Inline emoji-пикер
- Любые секции, которые тогглятся кнопкой (открыть/закрыть)
- Аккордеоны, FAQ-блоки

**Когда НЕ использовать:**
- Модальные окна (у них свой паттерн с Portal)
- Элементы, которые появляются один раз и не закрываются (CSS-анимация `animate-fade-in-up` достаточна)

### 5. Модалки и оверлеи

Модалки появляются через `animate-fade-in-up`, бэкдроп — через `opacity transition`:

```tsx
{/* Бэкдроп */}
<div className="fixed inset-0 bg-black/50 animate-fade-in-up">
    {/* Контент модалки */}
    <div className="bg-white rounded-lg shadow-xl animate-fade-in-up">
        ...
    </div>
</div>
```

### 6. Переключение табов — Fade контента

При смене активного таба контент плавно появляется:

```tsx
<div key={activeTab} className="opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
    {activeTab === 'settings' && <SettingsContent />}
    {activeTab === 'posts' && <PostsContent />}
</div>
```

### 7. Тултипы и попапы

Мелкие всплывающие элементы:

```tsx
<div className="absolute top-full mt-1 z-20 shadow-xl animate-fade-in">
    {/* Контент тултипа */}
</div>
```

---

## Transition-классы Tailwind

Помимо CSS-анимаций, для интерактивных элементов используются Tailwind transitions:

| Класс | Использование |
|---|---|
| `transition-colors` | Кнопки, ссылки — плавная смена цвета при hover |
| `transition-opacity duration-300` | Фото — fade-in при загрузке |
| `transition-transform` | Тумблеры — плавное перемещение кружка |
| `transition-all duration-300` | Высота блоков (через `max-h-0` → `max-h-[500px]`) |

**Пример transition для сворачиваемого блока (альтернатива CSS-анимации):**
```tsx
<div className={`overflow-hidden transition-all duration-300 ${
    isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
}`}>
    {/* Контент */}
</div>
```

> Этот подход удобнее CSS-анимации, когда элемент **не unmount'ится** из DOM, а остаётся в дереве.

---

## Правила тайминга

| Тип анимации | Длительность | Easing |
|---|---|---|
| Появление элемента | `0.25–0.35s` | `ease-out` |
| Исчезновение элемента | `0.15–0.25s` | `ease-in` |
| Hover/интерактив | `0.15–0.2s` (Tailwind default) | `ease` |
| Раскрытие панели | `0.25s` | `ease-out` |
| Stagger (задержка между строками) | `20–30ms` на элемент | — |
| Скелетон-пульсация | `2s` infinite | `cubic-bezier(0.4, 0, 0.6, 1)` |

---

## Типичные ошибки

| Ошибка | Должно быть |
|---|---|
| Мгновенное появление таблицы без анимации | `opacity-0 animate-fade-in-up` + stagger `animationDelay` |
| Резкий скачок при раскрытии панели | `transition-all max-h-0 → max-h-[400px]` + `overflow-hidden` |
| Мгновенное закрытие панели (unmount) | Паттерн `keep-in-DOM`: `everOpened` + `transition-all` + `max-h-0 opacity-0` |
| Мгновенная вставка модалки без fade | `animate-fade-in-up` на контенте модалки |
| Пагинация — резкая замена контента | `key={currentPage}` + `animate-fade-in-up` |
| Загрузка данных — скелетон + каскадное раскрытие | скелетоны → по одному превращаются в данные |
| Загрузка данных — пустота → контент рывком | Скелетон `animate-pulse` → каскадное раскрытие `revealedCount` |
| Тултип появляется мгновенно | `animate-fade-in` на контейнере тултипа |
| `transition-all` на контейнере с бордером (gray→indigo) | Убрать `transition-all`, использовать React-стейт для мгновенной смены |
| Нет `overflow: hidden` при анимации высоты | Обязательно `overflow-hidden` / встроено в `animate-expand-down` |
| Слишком долгая анимация (>0.5s) | Максимум `0.35s` для появления, `0.25s` для исчезновения |
| Нет `opacity-0` начального состояния для `animate-fade-in-up` | Добавить `opacity-0` в className |
| Голые числа `{stats.total}` в дашборде | Обернуть в `<AnimatedNumber value={stats.total} />` |
| `{count.toLocaleString('ru-RU')}` без анимации | `<AnimatedNumber value={count} format />` |
| Серый overlay `bg-white/60` при обновлении данных | Убрать overlay, использовать «тихую замену» + AnimatedNumber |
| `opacity-60` на контейнере при загрузке | Контейнер всегда opacity-100, числа анимируются через AnimatedNumber |
| SVG-линия графика появляется мгновенно | Использовать `AnimatedPolyline` (stroke-dashoffset 1.2s) |
| Pie chart без анимации входа | `className="animate-pie-chart"` + стаггер секторов |
| Bar chart с `duration-300` | Увеличить до `duration-[800ms] ease-out` для плавности |
| Progress bar без transition | Добавить `transition-all duration-[800ms] ease-out` на ширину |

---

## 8. Дашборд статистики — Анимированные счётчики, графики и живое обновление данных

**Эталонная реализация:** `features/automations/stories-automation/components/dashboard/`

Этот раздел описывает принципы анимированного отображения числовых показателей, графиков и живого «дообновления» данных при получении новых значений с бэкенда — **без перезагрузки интерфейса**.

### 8.1. Принцип «Дообновление вместо перезагрузки»

**Ключевая идея:** когда приходят новые данные с бэкенда — НЕ перерисовываем весь интерфейс и не сбрасываем числа в 0. Вместо этого анимированно переводим показатели **от текущих значений к новым**.

Это достигается тремя механизмами:
1. **`useCountAnimation`** — хук анимирует число от предыдущего значения к новому target (а не от 0)
2. **`hasAnimatedCards`** — флаг в хуке дашборда: карточки анимируются (fade-in-up) **только при первом монтировании**, при обновлении данных анимация контейнера не перезапускается
3. **React reconciliation** — ключи карточек стабильны (не зависят от данных), поэтому React **обновляет** компоненты, а не пересоздаёт их

**Цепочка событий при обновлении:**
```
1. Пользователь меняет фильтр → useEffect вызывает loadDashboardStats()
2. Бэкенд возвращает новые агрегированные данные
3. setDashboardStats(newStats) → новый stats пробрасывается в карточки
4. AnimatedCounter получает новый value → useCountAnimation анимирует ОТ ТЕКУЩЕГО к новому
5. Sparkline получает новые data → обновляет SVG path плавно (линия + заливка уже видны)
6. Карточки НЕ перезапускают входную анимацию (hasAnimatedCards = true)
```

### 8.2. Хук `useCountAnimation` — анимированный переход числа

**Файл:** `useCountAnimation.tsx`

Хук реализует плавный переход числа с easeOutExpo (быстрый старт, медленное торможение):

| Параметр | Описание | Дефолт |
|---|---|---|
| `target` | Целевое число | — |
| `duration` | Длительность анимации | `1500ms` |
| `delay` | Задержка перед стартом (для синхронизации с появлением карточки) | `0ms` |

**Критические принципы:**

| Принцип | Реализация |
|---|---|
| **Анимация от текущего к новому** | `displayedValueRef.current` хранит последнее отображённое значение. При смене target стартуем ОТ него, а не от 0 |
| **Первый рендер — от 0** | При первом монтировании `prevTargetRef.current === null` → анимируем с 0 |
| **Easing: easeOutExpo** | `1 - Math.pow(2, -10 * progress)` — цифры быстро набегают, потом плавно «докручиваются» |
| **`requestAnimationFrame`** | Для плавности 60fps, без пропусков кадров |
| **Совместимость с StrictMode** | `prevTargetRef` обновляется только внутри setTimeout, не при синхронном запуске effect |
| **Cleanup** | `clearTimeout + cancelAnimationFrame` в cleanup effect |

**Паттерн использования:**
```tsx
// Простой счётчик
<AnimatedCounter value={stats.views} />

// С увеличенной длительностью (для больших чисел — героическая метрика)
<AnimatedCounter value={stats.views} duration={1500} />

// С суффиксом и десятичными знаками (проценты, валюта)
<AnimatedCounter value={stats.ctr} decimals={1} suffix="%" />
<AnimatedCounter value={stats.moneySaved} duration={1500} suffix=" ₽" />

// Составное значение (сумма нескольких метрик)
<AnimatedCounter value={stats.likes + stats.shares + stats.replies} />
```

**Для целых и дробных чисел:**
```tsx
// Целые: value передаётся напрямую, отображается через toLocaleString()
// 12345 → 12 345

// Дробные (decimals > 0): value умножается на 10^decimals, анимируется как целое,
// при отображении делится обратно → точность без потерь
// 2.7% → внутри анимирует 27, отображает (27/10).toFixed(1) = "2.7"
```

### 8.3. Компонент `AnimatedCounter` / `AnimatedNumber` — обёртки над хуком

#### Модуль-специфичная версия: `AnimatedCounter`

**Файл:** `features/automations/stories-automation/components/dashboard/AnimatedCounter.tsx`

Исходная версия для дашбордов stories-automation.

#### Универсальная shared-версия: `AnimatedNumber`

**Файл:** `shared/hooks/useCountAnimation.tsx`

**Это ОСНОВНОЙ компонент для ВСЕХ модулей.** Экспортирует и хук `useCountAnimation`, и компонент `AnimatedNumber` из одного файла.

```tsx
import { AnimatedNumber } from '../../shared/hooks/useCountAnimation';

// Простое число
<AnimatedNumber value={stats.total_users} />

// С разделителями тысяч (12 345)
<AnimatedNumber value={count} format />

// С суффиксом и десятичными
<AnimatedNumber value={stats.ctr} decimals={1} suffix="%" />

// С кастомной длительностью и CSS-классом
<AnimatedNumber value={revenue} duration={1500} suffix=" ₽" className="text-2xl font-bold" />
```

**Расширенные props `AnimatedNumber`:**

| Prop | Тип | Дефолт | Описание |
|---|---|---|---|
| `value` | `number` | — | Целевое число |
| `duration` | `number` | `1500` | Длительность анимации (ms) |
| `delay` | `number` | `0` | Задержка перед стартом (ms) |
| `suffix` | `string` | `''` | Суффикс после числа (%, ₽, шт.) |
| `prefix` | `string` | `''` | Префикс перед числом |
| `decimals` | `number` | `0` | Количество десятичных знаков |
| `className` | `string` | — | CSS-класс для `<span>` |
| `format` | `boolean` | `false` | `toLocaleString('ru-RU')` — разделители тысяч |

> **Правило:** При создании НОВОГО модуля всегда использовать `AnimatedNumber` из `shared/hooks/useCountAnimation.tsx`. `AnimatedCounter` — legacy для stories-automation.

---

#### Legacy: `AnimatedCounter.tsx`

```tsx
export const AnimatedCounter: React.FC<{
    value: number;
    duration?: number;
    suffix?: string;
    decimals?: number;
}> = ({ value, duration = 1200, suffix = '', decimals = 0 }) => {
    const animatedValue = useCountAnimation(
        decimals > 0 ? Math.round(value * Math.pow(10, decimals)) : value,
        duration,
        100 // небольшая задержка для синхронизации с появлением контейнера
    );
    const displayValue = decimals > 0
        ? (animatedValue / Math.pow(10, decimals)).toFixed(decimals)
        : animatedValue.toLocaleString();
    return <>{displayValue}{suffix}</>;
};
```

**Правила:**
- Компонент **вынесен за пределы** родительского дашборда → не пересоздаётся при каждом рендере
- `delay: 100ms` — даёт карточке время на fade-in-up перед стартом счётчика (иначе цифры бегут в невидимом блоке)
- Для hero-метрик (заголовочная цифра) — `duration={1500}`, для обычных — `duration={1200}`

### 8.4. Sparkline (SVG мини-график) — анимация линии

**Файл:** `Sparkline.tsx`

| Параметр | Описание |
|---|---|
| `data` | Массив чисел (history.map(h => h.views)) |
| `colorClass` | Tailwind-класс цвета линии (`text-indigo-500`) |
| `fillClass` | Tailwind-класс цвета заливки |
| `animationDelay` | Задержка появления линии (для каскадности карточек) |

**Принципы анимации графика:**

| Принцип | Реализация |
|---|---|
| **Анимация только при первом монтировании** | `hasAnimatedRef.current` — флаг, предотвращает повторный запуск |
| **Fade-in линии** | `opacity: 0 → 1` через `transition: opacity 0.8s ease-out` |
| **Fade-in заливки** | Отдельная opacity-анимация заливки под линией (`duration: 700ms`, `opacity: 0.2`) |
| **SVG viewBox** | Фиксированный `viewBox="0 0 200 50"` (4:1) для равномерной толщины линии |
| **vectorEffect** | `vectorEffect="non-scaling-stroke"` — толщина линии постоянна при масштабировании |
| **Даунсэмплинг** | Если >50 точек → прореживание для оптимизации SVG |

**При обновлении данных:**
- SVG path пересчитывается React-ом (новые `d` атрибуты)
- Линия уже видна (не `opacity: 0`) → изменение формы происходит **мгновенно** → нет мерцания
- Анимация fade-in НЕ перезапускается (`hasAnimatedRef.current = true`)

### 8.5. DonutChart (кольцевая диаграмма) — CSS-переход

**Файл:** `DonutChart.tsx`

Кольцевая диаграмма рисуется SVG через `strokeDasharray` / `strokeDashoffset`:
```
offset = circumference - (value / max) * circumference
```
При изменении `value` (новые данные с бэкенда) — `strokeDashoffset` пересчитывается React-ом → визуально кольцо «доворачивается» до нового значения.

### 8.6. Каскадное появление карточек дашборда

**Файл:** `useStoriesDashboard.ts`

Карточки дашборда появляются стаггерно (одна за другой) при **первом** монтировании:

| Карточка | Задержка |
|---|---|
| Сумма показов (2 колонки) | `0ms` |
| Эквивалент в рекламе | `100ms` |
| Клики и CTR | `200ms` |
| Активность | `300ms` |
| Количество историй | `350ms` |
| Среднее | `375ms` |
| ER View | `425ms` |
| Демография | `475ms` |

**Реализация:**
```tsx
// Хелпер — при первом монтировании
const getCardAnimationClass = (delay: number) => {
    if (hasAnimatedCards) return ''; // уже анимировано — показать сразу
    return 'opacity-0 animate-fade-in-up';
};
const getCardAnimationStyle = (delay: number) => {
    if (hasAnimatedCards) return {}; // без задержки
    return { animationDelay: `${delay}ms`, animationFillMode: 'forwards' as const };
};
```

**Критическое правило: `hasAnimatedCards`**
- При первом монтировании карточки анимируются (`opacity-0 animate-fade-in-up` + stagger delay)
- После анимации `hasAnimatedCards = true` → при обновлении данных (смена фильтра) карточки НЕ «пропадают и возвращаются»
- Обновляются **только числа внутри** (AnimatedCounter), контейнеры остаются на месте

### 8.7. Бэкенд: агрегированный эндпоинт

**Файл:** `backend_python/services/automations/stories/retrieval_dashboard.py`

Один лёгкий SQL-запрос возвращает ВСЕ метрики дашборда (~1KB JSON):

```python
# /getStoriesDashboardStats → {
#     count, views, likes, replies, clicks, shares,
#     subscribers, hides, msg, ctr, er, moneySaved,
#     avgViews, avgViewers, minViewers, maxViewers,
#     history: [{views, likes, clicks}, ...],  # для спарклайнов
#     demographics: { uniqueCount, gender, membership, platform, topCities, ageGroups }
# }
```

**Принципы бэкенда для анимированного фронтенда:**

| Принцип | Почему |
|---|---|
| **Один запрос → все данные** | Фронтенд не ждёт 8 разных API → все счётчики анимируются _одновременно_ |
| **Формат `history[]`** | Массив точек для Sparkline — данные для графика приходят _в том же ответе_ |
| **Производные метрики на бэке** | CTR, ER, moneySaved считаются на бэке → фронт не ждёт и не пересчитывает |
| **Дедупликация на бэке** | `seen_story_ids` — бэкенд убирает дубли, фронт получает чистые агрегаты |
| **Фильтры = перезапрос** | При смене периода/типа фронт вызывает тот же endpoint с новыми параметрами → новые числа плавно «докручиваются» |

### 8.8. Прогресс-бары демографии — transition

**Файл:** `DemographicsCard.tsx`

Прогресс-бары пола, подписки, платформ отрисовываются через inline-width + CSS transition:
```tsx
<div className="h-full bg-blue-500 rounded-full transition-all duration-700"
     style={{ width: `${malePercent}%` }} />
```
- `transition-all duration-700` — при обновлении данных бар плавно расширяется/сужается
- Ширина рассчитывается на фронте из абсолютных чисел: `male / (male + female) * 100`

### 8.9. Сводная таблица принципов

| # | Принцип | Как реализовано |
|---|---|---|
| 1 | **Числа анимируются от текущего к новому** | `useCountAnimation` запоминает `displayedValueRef`, анимирует delta |
| 2 | **Контейнеры не моргают** | `hasAnimatedCards` — карточки анимируются только при первом монтировании |
| 3 | **Easing = easeOutExpo** | Быстрый рост в начале, плавное торможение — визуально «энергичные» числа |
| 4 | **Графики не мигают** | Sparkline запускает fade-in один раз, далее SVG path обновляется реактивно |
| 5 | **Один запрос = все данные** | Бэкенд `/getStoriesDashboardStats` → ~1KB JSON → синхронный старт всех анимаций |
| 6 | **Каскадное появление** | Stagger 0–475ms для 8 карточек при первом заходе |
| 7 | **Delay счётчика** | `100ms` задержка AnimatedCounter → цифры бегут ПОСЛЕ появления карточки |
| 8 | **Прогресс-бары через transition** | `transition-all duration-700` + inline width → плавное расширение |
| 9 | **Кольцевая диаграмма** | SVG `strokeDashoffset` → пересчёт при новых данных |
| 10 | **Форматирование чисел** | `toLocaleString()` — числа с пробелами (12 345), проценты через `decimals` |

### 8.10. Чеклист для новых дашбордов

При создании нового дашборда со статистикой — проверить:

- [ ] Все числовые показатели обёрнуты в `AnimatedNumber` (из `shared/hooks/useCountAnimation.tsx`) или `AnimatedCounter`
- [ ] Hero-метрика (главная цифра) имеет `duration={1500}`
- [ ] Проценты и дроби используют `decimals={1}` или `decimals={2}`
- [ ] Карточки имеют stagger-анимацию при первом монтировании
- [ ] Повторная загрузка данных НЕ перезапускает входную анимацию карточек
- [ ] Графики (Sparkline) анимируются один раз при появлении, при обновлении данных — только перерисовка path
- [ ] **SVG-линии графиков** имеют draw-анимацию (stroke-dashoffset) — см. 8.11
- [ ] **Области под линиями** имеют fade-in (animate-chart-area) — см. 8.11
- [ ] **Pie/Donut-диаграммы** имеют scale+rotate входную анимацию — см. 8.11
- [ ] **Bar-чарты** (столбцы) имеют `transition-all duration-[800ms] ease-out` на высоте/ширине
- [ ] Прогресс-бары имеют `transition-all duration-[800ms] ease-out`
- [ ] Бэкенд возвращает все данные одним ответом (не 5 запросов → 5 рендеров)
- [ ] DonutChart реагирует на изменение value без анимации opacity (только strokeDashoffset)
- [ ] Числа с `toLocaleString('ru-RU')` (разделители тысяч) — prop `format` в AnimatedNumber
- [ ] **Нет серых оверлеев** (bg-white/60, opacity-60) при обновлении данных — данные заменяются тихо
- [ ] **Нет мигания** при переключении контекста (проект, фильтр) — стейт не сбрасывается до прихода новых данных

### 8.11. SVG Chart Animations — Анимации полноразмерных графиков

Раздел описывает анимации для **полноразмерных SVG-графиков** (Line Chart, Pie Chart, Bar Chart) — в отличие от мини-спарклайнов из 8.4.

**Эталонные реализации:**
- Line Chart: `features/lists/components/statistics/Chart.tsx` (`AnimatedPolyline`)
- Pie Chart: `features/lists/components/statistics/PieChart.tsx`
- Bar Chart: `features/lists/components/statistics/sections/UserStatsCards.tsx` (AgeCard, BirthdayCard)
- CSS-анимации: `index.css` (@keyframes chart-area-fade, pie-spin-in)

#### 8.11.1. Line Chart — Анимация «рисования» линии (stroke-dashoffset)

**Принцип:** Линия графика «рисуется» слева направо через SVG stroke-dashoffset.

```tsx
const AnimatedPolyline: React.FC<{ points: string; stroke: string }> = ({ points, stroke }) => {
    const ref = useRef<SVGPolylineElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const len = el.getTotalLength();
        // Начальное состояние: линия полностью скрыта
        setStyle({
            strokeDasharray: len,
            strokeDashoffset: len,
            transition: 'none',
        });
        // Через кадр — запуск анимации
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setStyle({
                    strokeDasharray: len,
                    strokeDashoffset: 0,
                    transition: 'stroke-dashoffset 1.2s ease-out',
                });
            });
        });
    }, [points]);

    return (
        <polyline ref={ref} points={points} fill="none" stroke={stroke}
                  strokeWidth={2} strokeLinejoin="round" style={style} />
    );
};
```

**Правила:**
- `getTotalLength()` измеряет реальную длину SVG-пути
- Двойной `requestAnimationFrame` гарантирует, что browser отрисовал начальное состояние
- Длительность: **1.2s ease-out** — неторопливое рисование
- `points` в deps — при смене данных линия перерисовывается с анимацией

#### 8.11.2. Area под линией — Fade-in

Область заливки под линией появляется через CSS-анимацию:

```css
/* index.css */
@keyframes chart-area-fade {
    from { opacity: 0; }
    to { opacity: 1; }
}
.animate-chart-area {
    animation: chart-area-fade 1.2s ease-out forwards;
}
```

```tsx
<path d={areaPath} fill={color} fillOpacity={0.1} className="animate-chart-area" />
```

#### 8.11.3. Pie Chart — Scale + Rotate вход

Круговая диаграмма появляется с эффектом "вращения и масштабирования":

```css
/* index.css */
@keyframes pie-spin-in {
    from {
        opacity: 0;
        transform: scale(0.7) rotate(-90deg);
    }
    to {
        opacity: 1;
        transform: scale(1) rotate(-90deg);
    }
}
.animate-pie-chart {
    animation: pie-spin-in 0.8s ease-out forwards;
    transform-origin: center;
}
```

**Стаггер секторов:** каждый сектор появляется с нарастающей задержкой:
```tsx
<path
    d={sectorPath}
    fill={color}
    style={{
        opacity: 0,
        animation: `chart-area-fade 0.5s ease-out ${i * 0.1}s forwards`
    }}
/>
```
- Задержка: `i * 0.1s` — каждый следующий сектор через 100ms
- Анимация: `chart-area-fade` (переиспользуем fade для секторов)

#### 8.11.4. Bar Chart — Transition на высоте/ширине

Столбцы (вертикальные или горизонтальные) анимируются через CSS transition:

```tsx
<div
    className="bg-indigo-500 rounded-t transition-all duration-[800ms] ease-out"
    style={{ height: `${percent}%` }}
/>
```

**Правила:**
- `transition-all duration-[800ms] ease-out` — медленнее стандартного 300ms
- Для горизонтальных баров — `style={{ width: '${percent}%' }}`
- Для прогресс-баров — тот же паттерн: `transition-all duration-[800ms] ease-out`

### 8.12. Запрет серых оверлеев при обновлении данных

**Правило:** При обновлении данных (смена проекта, фильтра, подгрузка) ЗАПРЕЩЕНО показывать полупрозрачный серый оверлей поверх текущих данных.

| ❌ Запрещено | ✅ Правильно |
|---|---|
| `<div className="bg-white/60 absolute inset-0">` + спиннер | Данные заменяются тихо, `AnimatedNumber` анимирует переход |
| `className={isLoading ? 'opacity-60 pointer-events-none' : ''}` | Контейнер всегда `opacity-100`, числа анимируются от старых к новым |
| Серый backdrop на время загрузки таблицы | Таблица показывает старые данные, затем React обновляет строки |

**Почему:** серый оверлей создаёт ощущение "тормозящего" интерфейса. Плавная замена чисел без мигания — ощущение мгновенного отклика.

**Исключение:** Первая загрузка (данных ещё нет) — показать скелетон. Но НЕ оверлей поверх скелетона.

**Паттерн «тихая замена»:**
```tsx
// При переключении проекта:
// 1. НЕ вызывать resetData() перед запросом
// 2. НЕ показывать спиннер поверх текущих данных
// 3. Когда новые данные пришли — setState(newData) → React обновит компоненты
// 4. AnimatedNumber автоматически анимирует от старого к новому значению
// 5. Таблицы обновляются через React reconciliation (key={item.id})
```

---

## ❌ ЗАПРЕЩЁННЫЕ паттерны

```tsx
// Мгновенное появление блока — НЕТ
{showPanel && <div>Контент</div>}

// Резкая вставка строк таблицы — НЕТ
{data.map(item => <tr key={item.id}><td>{item.name}</td></tr>)}

// Пустота при загрузке — НЕТ
{isLoading ? null : <Table data={data} />}

// Серый оверлей при обновлении данных — НЕТ
{isLoading && <div className="absolute inset-0 bg-white/60"><Spinner /></div>}

// Снижение opacity при загрузке — НЕТ
<div className={isLoading ? 'opacity-60' : ''}>...</div>

// Голые числа без анимации — НЕТ
<span>{stats.total_users}</span>
<span>{count.toLocaleString('ru-RU')}</span>
```

## ✅ ПРАВИЛЬНЫЕ паттерны

```tsx
// Плавное появление панели (только открытие, без анимации закрытия) — ДА
{showPanel && <div className="animate-expand-down">Контент</div>}

// Плавное открытие И закрытие (элемент остаётся в DOM) — ДА
<div className={`overflow-hidden transition-all duration-300 ease-out ${
    isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
}`}>
    {everOpened && <Content />}
</div>

// Каскадное появление строк — ДА
{data.map((item, i) => (
    <tr key={item.id} className="opacity-0 animate-fade-in-row" style={{ animationDelay: `${i * 25}ms` }}>
        <td>{item.name}</td>
    </tr>
))}

// Скелетон при загрузке — ДА (каскадное раскрытие)
{Array.from({ length: totalSlots }, (_, i) => {
    const item = items[i];
    if (item && i < revealedCount) {
        return <RealItem key={item.id} item={item} />;
    }
    return <ItemSkeleton key={`skel-${i}`} index={i} />;
})}

// Анимированные числа — ДА
<AnimatedNumber value={stats.total} />
<AnimatedNumber value={count} format />

// Тихая замена данных при обновлении — ДА
// (данные обновляются через setState, числа анимируются через AnimatedNumber)
// (НЕТ overlay, НЕТ opacity-60, НЕТ спиннера поверх контента)

// SVG-линия с draw-анимацией — ДА
<AnimatedPolyline points={pointsStr} stroke={color} />

// Bar chart с transition — ДА
<div className="bg-indigo-500 transition-all duration-[800ms] ease-out"
     style={{ height: `${percent}%` }} />
```
