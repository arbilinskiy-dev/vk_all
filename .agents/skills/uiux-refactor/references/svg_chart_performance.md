# SVG-графики — Производительность рендеринга

## Проблема

SVG-графики с большим количеством данных (период «Всё время», длинная история) могут содержать **тысячи/десятки тысяч** точек. Если каждая точка рендерится как отдельный DOM-элемент (`<rect>`, `<circle>`, `<line>`) — браузер зависает.

**Критичность:** HIGH — полностью блокирует интерфейс, страница не отвечает.

---

## Что ЗАПРЕЩЕНО

### 1. Отдельная hover-зона на каждую точку данных

```tsx
// ❌ ЗАПРЕЩЕНО — N точек = N <rect> + N onMouseMove = зависание
{normalized.map((pt, index) => (
    <rect
        x={hitX}
        y={0}
        width={hitW}
        height={height}
        fill="transparent"
        onMouseMove={(e) => setTooltip({ x: e.clientX, y: e.clientY, point: pt })}
        onMouseLeave={() => setTooltip(null)}
    />
))}
```

### 2. Неограниченное количество SVG-элементов

```tsx
// ❌ ЗАПРЕЩЕНО — рендерить >200 circle/rect без downsampling
{normalized.map((pt, index) => (
    <circle cx={ptX} cy={ptY} r={2.5} ... />
))}
```

### 3. Math.min/max со spread на больших массивах

```tsx
// ❌ ЗАПРЕЩЕНО — при >100K элементов = stack overflow
const minVal = Math.min(...values);
const maxVal = Math.max(...values);
```

### 4. Часовая гранулярность на больших периодах

```tsx
// ❌ ЗАПРЕЩЕНО — 6 месяцев × 24 часа = 4320 точек
// fillGaps с granularity='hours' создаёт точку на каждый час пропуска
const normalized = fillGaps(data, 'hours'); // data за полгода
```

---

## Что ОБЯЗАТЕЛЬНО

### 1. Единая hover-зона + бинарный поиск ближайшей точки

```tsx
// ✅ ПРАВИЛЬНО — один <rect> на всю область графика
const svgRef = useRef<SVGSVGElement>(null);

// Кэш X-координат для бинарного поиска
const pointXCoords = useMemo(() =>
    normalized.map((_, i) => getCoords(0, i).x),
    [normalized, getCoords, width]
);

// Бинарный поиск ближайшей точки по X
const findNearestIndex = useCallback((mouseX: number): number => {
    let lo = 0, hi = pointXCoords.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (pointXCoords[mid] < mouseX) lo = mid + 1;
        else hi = mid;
    }
    if (lo > 0 && Math.abs(pointXCoords[lo - 1] - mouseX) < Math.abs(pointXCoords[lo] - mouseX))
        return lo - 1;
    return lo;
}, [pointXCoords]);

// Единый обработчик → SVG-координаты → бинарный поиск
<rect x={0} y={0} width={width} height={height} fill="transparent"
    onMouseMove={handleMouseMove}
    onMouseLeave={handleMouseLeave}
/>
```

### 2. Downsampling — ограничение количества точек

```tsx
// ✅ ПРАВИЛЬНО — максимум 200 точек на графике
const MAX_CHART_POINTS = 200;

function downsamplePoints(data: NormalizedPoint[], maxPoints = MAX_CHART_POINTS): NormalizedPoint[] {
    if (data.length <= maxPoints) return data;
    const bucketSize = Math.ceil(data.length / maxPoints);
    const result: NormalizedPoint[] = [];
    for (let i = 0; i < data.length; i += bucketSize) {
        const chunk = data.slice(i, Math.min(i + bucketSize, data.length));
        // Суммируем метрики, берём метку от средней точки
        const midPoint = chunk[Math.floor(chunk.length / 2)];
        // ... суммирование ...
        result.push({ slot: midPoint.slot, ...sums, labelDate: midPoint.labelDate, labelTime: midPoint.labelTime });
    }
    return result;
}
```

### 3. Авто-гранулярность по объёму данных

```tsx
// ✅ ПРАВИЛЬНО — автоматическое переключение hours→days
const AUTO_DAYS_THRESHOLD = 168; // 7 дней × 24 часа

function suggestGranularity(dataLength: number): ChartGranularity {
    return dataLength > AUTO_DAYS_THRESHOLD ? 'days' : 'hours';
}

// В хуке:
const autoGranularity = useMemo(() => suggestGranularity(data.length), [data.length]);
const granularity = granularityOverride ?? autoGranularity;

// Сбрасываем override при смене данных (новый период)
useEffect(() => { setGranularityOverride(null); }, [data]);
```

### 4. Безопасный min/max без spread

```tsx
// ✅ ПРАВИЛЬНО — цикл вместо spread
let minVal = Infinity, maxVal = -Infinity;
for (let i = 0; i < normalized.length; i++) {
    const v = normalized[i][key];
    if (v < minVal) { minVal = v; minIdx = i; }
    if (v > maxVal) { maxVal = v; maxIdx = i; }
}
```

### 5. Рендеринг hover-элементов только для активной точки

```tsx
// ✅ ПРАВИЛЬНО — не рендерим circle для каждой точки,
// только для hovered точки + min/max меток

{hoveredIdx >= 0 && (
    <g className="pointer-events-none">
        <line x1={ptX} y1={paddingY} x2={ptX} y2={height - paddingY} stroke="#d1d5db" strokeDasharray="4" />
        {activeMetrics.map(key => (
            <circle key={key} cx={ptX} cy={getCoords(pt[key], hoveredIdx).y} r={5} fill="white" stroke={color} strokeWidth={2.5} />
        ))}
    </g>
)}
```

### 6. UI-индикаторы агрегации

При downsampling/авто-гранулярности — информировать пользователя:

```tsx
// Бейдж «данные агрегированы»
{isDownsampled && (
    <span className="text-[10px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
        данные агрегированы
    </span>
)}

// Бейдж «авто: по дням»
{autoGranularity === 'days' && granularity === 'days' && (
    <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
        авто: по дням
    </span>
)}
```

---

## Пороговые значения

| Параметр | Значение | Обоснование |
|----------|----------|-------------|
| MAX_CHART_POINTS | 200 | Достаточно для детализации, SVG рендерит мгновенно |
| AUTO_DAYS_THRESHOLD | 168 (7 дней) | При бо́льших периодах часовая гранулярность нечитаема |
| Math.min/max spread limit | ≤10 000 | После — stack overflow на V8. Использовать цикл |

## Чеклист при аудите графиков

- [ ] `normalized.length` ограничен сверху (≤200)
- [ ] Hover реализован через единый `<rect>` + бинарный поиск, НЕ через N отдельных `<rect>`
- [ ] Нет `Math.min(...largeArray)` / `Math.max(...largeArray)` — только циклы
- [ ] При большом объёме данных — автоматическое переключение гранулярности
- [ ] Circles/точки рендерятся ТОЛЬКО для hovered + min/max, а не для каждой точки
- [ ] Пользователь видит индикатор агрегации (если данные сгруппированы)
- [ ] `getCoords` обёрнут в `useCallback` для стабильной ссылки

## Grep-паттерны для поиска нарушений

```
# Hover-зона на каждую точку (N <rect>)
normalized\.map.*<rect.*onMouseMove

# Неограниченный рендер circle для каждой точки
normalized\.map.*<circle

# Spread min/max на массивах
Math\.min\(\.\.\.
Math\.max\(\.\.\.

# fillGaps без downsampling
fillGaps\(.*\)(?!.*downsample)
```

## Эталонные файлы

- `features/messages/components/stats/MessageStatsChartSVG.tsx` — единая hover-зона + бинарный поиск
- `features/messages/components/stats/messageStatsChartUtils.ts` — `downsamplePoints()` + `suggestGranularity()`
- `features/messages/hooks/stats/useMessageStatsChartLogic.ts` — авто-гранулярность + downsampling pipeline
