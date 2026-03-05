# React — Предотвращение каскадных ре-рендеров

> **Категория:** Архитектурный паттерн производительности  
> **Критичность:** HIGH — при 100+ элементах ощутимые тормоза UI, при 500+ — зависание  
> **Кейс-прецедент:** StoriesTable — 28+ рендеров → 6 (Release 10)

---

## Быстрая диагностика

Если компонент рендерится >2× на одно действие пользователя (2× нормально для StrictMode в dev):

```tsx
// Временный debug-логгер для любого React.memo компонента
const prevPropsRef = useRef<Record<string, any>>({});
useEffect(() => {
    if (import.meta.env.DEV) {
        const prev = prevPropsRef.current;
        const changes: string[] = [];
        for (const key of Object.keys(props)) {
            if (prev[key] !== (props as any)[key]) {
                const isFunc = typeof (props as any)[key] === 'function';
                changes.push(isFunc ? `⚡${key}` : `${key}: ${String(prev[key])}→${String((props as any)[key])}`);
            }
        }
        if (changes.length > 0) {
            console.log(`[RERENDER] ${componentName}:`, changes.join(', '));
        }
        prevPropsRef.current = { ...props };
    }
});
```

**`⚡` = нестабильная ссылка на функцию** — главный враг React.memo.

---

## Антипаттерн 1: useCallback с изменяющимися зависимостями

### Проблема

```tsx
// ❌ ЗАПРЕЩЕНО — useCallback пересоздаётся при каждом изменении stories
const loadMore = useCallback(() => {
    if (stories.length < totalStories) {
        fetchBatch(projectId, stories.length);
    }
}, [projectId, stories.length, totalStories]);
```

Любой компонент, получающий `loadMore` через props, ре-рендерится при каждом изменении `stories.length` — даже если результат функции тот же.

### Решение: useCallback([]) + useRef

```tsx
// ✅ ПРАВИЛЬНО — стабильная ссылка навсегда, актуальные данные через ref
const storiesLengthRef = useRef(stories.length);
const totalStoriesRef = useRef(totalStories);
const projectIdRef = useRef(projectId);

useEffect(() => { storiesLengthRef.current = stories.length; }, [stories.length]);
useEffect(() => { totalStoriesRef.current = totalStories; }, [totalStories]);
useEffect(() => { projectIdRef.current = projectId; }, [projectId]);

const loadMore = useCallback(() => {
    if (storiesLengthRef.current < totalStoriesRef.current) {
        fetchBatch(projectIdRef.current, storiesLengthRef.current);
    }
}, []); // ← пустой массив = стабильная ссылка
```

### Когда применять

- Функция передаётся через props в `React.memo` компонент
- Функция используется как зависимость в другом useCallback/useEffect
- Функция зависит от часто меняющихся значений (lists, counters, currentId)

---

## Антипаттерн 2: useState в finally после async

### Проблема

```tsx
// ❌ ЗАПРЕЩЕНО — лишний ре-рендер после фоновой операции
const load = async () => {
    setIsLoading(true);
    try {
        const cached = await loadFromCache();
        setData(cached);           // рендер 1: данные из кэша
        const fresh = await checkFreshness();  // фоновая проверка
        if (fresh !== cached) setData(fresh);
    } finally {
        setIsLoading(false);       // рендер 2: ЛИШНИЙ, если ничего не изменилось
    }
};
```

### Решение

```tsx
// ✅ ПРАВИЛЬНО — loading сбрасывается сразу после показа кэша
const load = async () => {
    setIsLoading(true);
    try {
        const cached = await loadFromCache();
        setData(cached);
        setIsLoading(false);       // сразу после данных из кэша
        
        // фоновая проверка свежести — «молча», без loading
        const fresh = await checkFreshness();
        if (hasRealChanges(fresh, cached)) setData(fresh);
    } catch (e) {
        setIsLoading(false);       // только в случае ошибки
    }
};
```

---

## Антипаттерн 3: React.memo без мемоизации callback-пропсов

### Проблема

```tsx
// ❌ React.memo бесполезен — каждый рендер родителя создаёт новый handleClick
const Parent = () => {
    const handleClick = () => doSomething(data);
    return <MemoizedChild onClick={handleClick} />;
};
```

### Решение

```tsx
// ✅ Полная цепочка мемоизации
const Parent = () => {
    const dataRef = useRef(data);
    useEffect(() => { dataRef.current = data; }, [data]);
    
    const handleClick = useCallback(() => doSomething(dataRef.current), []);
    return <MemoizedChild onClick={handleClick} />;
};
```

### Правило: React.memo работает только если ВСЕ props стабильны

Чеклист для React.memo компонента:
- [ ] Все функции-пропсы через useCallback с пустыми/стабильными зависимостями
- [ ] Все объекты-пропсы через useMemo или стабильные useState
- [ ] Внутренние обработчики тоже мемоизированы (handleMouseEnter, toggleX, etc.)

---

## Антипаттерн 4: setState всегда создаёт новый объект/массив

### Проблема

```tsx
// ❌ ЗАПРЕЩЕНО — React видит новую ссылку → ре-рендер, даже если данные те же
setStories(prev => prev.map(s => {
    const updated = newItems.find(n => n.id === s.id);
    return updated ? { ...s, ...updated } : s;
}));
```

`.map()` + spread **всегда** возвращает новый массив с новыми объектами, даже если все поля идентичны.

### Решение: проверка hasChanges перед возвратом нового массива

```tsx
// ✅ ПРАВИЛЬНО — возвращаем prev по ссылке если данные не изменились
setStories(prev => {
    const merged = buildMergedArray(prev, newItems);
    
    // Проверяем ТОЛЬКО примитивные поля (не ссылки на объекты!)
    const hasChanges = merged.some((item, i) => {
        const old = prev[i];
        if (!old) return true;  // новый элемент
        return (
            item.stats_updated_at !== old.stats_updated_at ||
            item.viewers_updated_at !== old.viewers_updated_at ||
            item.story_link !== old.story_link
        );
    }) || merged.length !== prev.length;
    
    return hasChanges ? merged : prev;  // ← prev = та же ссылка = React.memo не ре-рендерит
});
```

### КРИТИЧНО: сравнивать только примитивы

```tsx
// ❌ ЗАПРЕЩЕНО — ссылки на объекты после JSON-десериализации ВСЕГДА разные
item.detailed_stats !== old.detailed_stats  // false даже при идентичных данных

// ✅ ПРАВИЛЬНО — сравниваем только string/number/boolean
item.stats_updated_at !== old.stats_updated_at  // true только при реальном изменении
```

При десериализации JSON (ответ API → JSON.parse) каждый вложенный объект получает **новую ссылку в памяти**, даже если содержимое идентично. Сравнение через `!==` для объектов проверяет ссылку, а не содержимое.

---

## Антипаттерн 5: Каскад нестабильных зависимостей через хуки

### Проблема

```
useStoriesLoader       → loadMoreStories зависит от [stories.length]
  ↓ передаёт loadMoreStories в props
StoriesStatsView       → НЕТ React.memo → рендерится при любом изменении родителя
  ↓ передаёт loadMoreStories дальше
StoriesTable           → React.memo, НО loadMoreStories — новая ссылка → ре-рендер
  ↓ 120 карточек
28+ рендеров
```

### Решение: стабилизация на всех уровнях

```
useStoriesLoader       → loadMoreStories = useCallback([], refs) — СТАБИЛЬНАЯ ССЫЛКА
  ↓
StoriesStatsView       → React.memo(StoriesStatsViewInner) — НЕ ре-рендерится
  ↓
StoriesTable           → React.memo(StoriesTableInner) — НЕ ре-рендерится
  ↓
6 рендеров (3 + 3 StrictMode)
```

**Правило:** если функция проходит через >1 уровень компонентов — она ОБЯЗАНА быть стабильной (useCallback с пустыми зависимостями).

---

## Антипаттерн 6: Стриминговая загрузка данных в стейт

### Проблема

```tsx
// ❌ ЗАПРЕЩЕНО — 10 батчей = 10 setState = 10 ре-рендеров
for (let page = 1; page <= totalPages; page++) {
    const batch = await fetchBatch(page);
    setStories(prev => [...prev, ...batch]);  // рендер на каждой итерации
}
```

### Решение: атомарная загрузка

```tsx
// ✅ ПРАВИЛЬНО — один setState с полным набором данных
const allItems: Story[] = [];
for (let page = 1; page <= totalPages; page++) {
    const batch = await fetchBatch(page);
    allItems.push(...batch);
}
setStories(allItems);  // ОДИН рендер
```

---

## Чеклист при создании нового hub-hook + компонента

1. **Все функции, передаваемые через props:** useCallback([]) + refs для изменяемых данных
2. **Все компоненты, принимающие функции через props:** React.memo()
3. **Внутренние обработчики мемоизированных компонентов:** useCallback/useMemo
4. **setState с merge-логикой:** hasChanges проверка по примитивам → return prev если нет изменений
5. **Загрузка данных батчами:** атомарная сборка → один setState
6. **isLoading:** сбрасывать сразу после показа данных, не в finally
7. **Объекты в deps useCallback:** заменить на refs

---

## Таблица «симптом → причина → решение»

| Симптом (debug-лог) | Вероятная причина | Решение |
|---|---|---|
| `⚡functionName` в debug | useCallback с нестабильными deps | useCallback([]) + refs |
| `data: [object]→[object]` | setState merge создаёт новый массив | hasChanges по примитивам |
| 4× render на 1 действие | 2× real + 2× StrictMode (НОРМА) | — |
| 6×+ render на 1 действие | Промежуточный компонент без React.memo | Обернуть в React.memo |
| Рендер без видимых изменений | setIsLoading(false) в finally | Сбросить loading раньше |
| Рендер при смене проекта | Новый projectId → новые useCallback | Перевести projectId на ref |

---

## Ссылки на реальные файлы (прецедент)

- **useCallback+ref pattern:** `features/automations/stories-automation/hooks/useStoriesLoader.ts`
- **mergeStories с hasChanges:** `features/automations/stories-automation/hooks/useStoriesLoader.ts`
- **React.memo + мемоизированные обработчики:** `features/automations/stories-automation/components/table/StoriesTable.tsx`
- **React.memo wrapper view:** `features/automations/stories-automation/components/StoriesStatsView.tsx`
- **hub-hook с refs:** `features/automations/stories-automation/hooks/useStoriesUpdater.ts`
