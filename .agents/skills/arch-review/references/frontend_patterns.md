# Паттерны оптимизации — Frontend (React / TypeScript)

## Batch API + Map для списков

```typescript
interface Project { id: number; name: string; }
interface ProjectWithDetails extends Project {
  posts: Post[];
  stats: Stats;
  tags: Tag[];
}

// ❌ Было: N×3 запроса
async function loadProjectsNaive(projects: Project[]): Promise<ProjectWithDetails[]> {
  return Promise.all(projects.map(async (p) => ({
    ...p,
    posts: await api.getPosts(p.id),     // N запросов
    stats: await api.getStats(p.id),     // N запросов  
    tags: await api.getTags(p.id),       // N запросов
  })));
}

// ✅ Стало: 3 запроса
async function loadProjectsOptimized(projects: Project[]): Promise<ProjectWithDetails[]> {
  const ids = projects.map(p => p.id);
  
  // 3 batch-запроса параллельно
  const [postsMap, statsMap, tagsMap] = await Promise.all([
    api.getPostsBatch(ids),   // → Map<number, Post[]>
    api.getStatsBatch(ids),   // → Map<number, Stats>
    api.getTagsBatch(ids),    // → Map<number, Tag[]>
  ]);

  return projects.map(p => ({
    ...p,
    posts: postsMap.get(p.id) ?? [],
    stats: statsMap.get(p.id) ?? { count: 0 },
    tags: tagsMap.get(p.id) ?? [],
  }));
}
```

## React Query — правильное кэширование

```typescript
// ❌ Каждый компонент запрашивает заново (даже если данные уже есть)
function TagSelector() {
  const { data: tags } = useQuery(['tags'], fetchTags);
}
function PostEditor() {
  const { data: tags } = useQuery(['tags'], fetchTags);  // ← дублирование
}

// ✅ React Query с staleTime = дедупликация из коробки
// Оба компонента используют один кэш, второй запрос не отправляется
function useTagsQuery() {
  return useQuery(['tags'], fetchTags, {
    staleTime: 5 * 60 * 1000,     // 5 минут считать данные свежими
    cacheTime: 30 * 60 * 1000,    // 30 минут хранить в кэше
  });
}
```

## useMemo для тяжёлых вычислений

```typescript
// ❌ Пересчитывается при каждом рендере
function PostList({ posts, filterTag }: Props) {
  const filtered = posts
    .filter(p => p.tags.includes(filterTag))   // O(n×m) на каждый рендер
    .sort((a, b) => b.date - a.date);          // O(n·log·n)
  
  return <>{filtered.map(p => <PostCard post={p} />)}</>;
}

// ✅ Пересчитывается только при изменении зависимостей
function PostList({ posts, filterTag }: Props) {
  const filtered = useMemo(() => {
    const tagSet = new Set(filterTag);  // O(1) lookup
    return posts
      .filter(p => p.tags.some(t => tagSet.has(t)))
      .sort((a, b) => b.date - a.date);
  }, [posts, filterTag]);

  return <>{filtered.map(p => <PostCard post={p} />)}</>;
}
```

## Map вместо array.find()

```typescript
// ❌ O(n) на каждый lookup
function getProjectName(projectId: number, projects: Project[]): string {
  return projects.find(p => p.id === projectId)?.name ?? '';
}
// Если вызывается 100 раз → 100 × N линейных поисков

// ✅ O(1) на каждый lookup
const projectMap = useMemo(
  () => new Map(projects.map(p => [p.id, p])),
  [projects]
);
function getProjectName(projectId: number): string {
  return projectMap.get(projectId)?.name ?? '';
}
```

## Пагинация / виртуализация для длинных списков

```typescript
// ❌ Рендер 1000 элементов сразу
function BigList({ items }: { items: Item[] }) {
  return (
    <div>
      {items.map(item => <ItemCard key={item.id} item={item} />)}
    </div>
  );
}

// ✅ Виртуализация — рендерятся только видимые (react-window)
import { FixedSizeList } from 'react-window';

function BigList({ items }: { items: Item[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <ItemCard item={items[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

## Предотвращение лишних ре-рендеров (Context)

```typescript
// ❌ Создаёт новый объект на каждый рендер → потомки ре-рендерятся
function Parent() {
  const value = { user, settings };  // ← новая ссылка каждый раз
  return <Context.Provider value={value}><Child /></Context.Provider>;
}

// ✅ Стабильная ссылка
function Parent() {
  const value = useMemo(() => ({ user, settings }), [user, settings]);
  return <Context.Provider value={value}><Child /></Context.Provider>;
}
```

## useCallback([]) + ref — стабильные функции для React.memo

> **Реальный кейс:** StoriesTable → 28+ рендеров → 6 (Release 10)

```typescript
// ❌ useCallback пересоздаётся при каждом изменении stories → ломает React.memo
const loadMore = useCallback(() => {
    if (stories.length < totalStories) fetchBatch(projectId, stories.length);
}, [projectId, stories.length, totalStories]);

// ✅ Стабильная ссылка навсегда — refs обновляются через useEffect
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

**Когда применять:** функция передаётся через props в React.memo компонент ИЛИ используется как зависимость в другом useCallback/useEffect.

## setState merge с hasChanges — предотвращение ложных обновлений

```typescript
// ❌ .map() + spread ВСЕГДА создаёт новый массив → React видит изменение
setStories(prev => prev.map(s => {
    const updated = newItems.find(n => n.id === s.id);
    return updated ? { ...s, ...updated } : s;
}));

// ✅ Проверка hasChanges по ПРИМИТИВНЫМ полям → return prev если данные те же
setStories(prev => {
    const merged = buildMerged(prev, newItems);
    const hasChanges = merged.some((item, i) => {
        const old = prev[i];
        if (!old) return true;
        return (
            item.stats_updated_at !== old.stats_updated_at ||
            item.viewers_updated_at !== old.viewers_updated_at ||
            item.story_link !== old.story_link ||
            item.vk_story_id !== old.vk_story_id
        );
    }) || merged.length !== prev.length;
    return hasChanges ? merged : prev;  // prev = та же ссылка → React.memo пропускает
});
```

**КРИТИЧНО:** сравнивать ТОЛЬКО примитивы (string, number, boolean). Вложенные объекты после JSON.parse() **всегда** имеют новые ссылки в памяти:
```typescript
// ❌ ЛОЖНОЕ СРАБАТЫВАНИЕ — ссылки всегда разные после JSON-десериализации
item.detailed_stats !== old.detailed_stats  // false даже при {views: 5} === {views: 5}

// ✅ Сравниваем примитивное поле-маркер (timestamp обновления)
item.stats_updated_at !== old.stats_updated_at  // true ТОЛЬКО при реальном изменении
```

## Атомарная загрузка батчей

```typescript
// ❌ 10 батчей = 10 setState = 10 ре-рендеров
for (let page = 1; page <= totalPages; page++) {
    const batch = await fetchBatch(page);
    setStories(prev => [...prev, ...batch]);
}

// ✅ Один setState с полным набором данных
const allItems: Story[] = [];
for (let page = 1; page <= totalPages; page++) {
    const batch = await fetchBatch(page);
    allItems.push(...batch);
}
setStories(allItems);  // ОДИН рендер
```

## Цепочка React.memo — правило полного каскада

```
// ❌ memo только на конечном элементе — промежуточный пропускает все рендеры
Hook → ParentView (нет memo) → MemoTable          → 28+ рендеров

// ✅ memo на КАЖДОМ уровне каскада
Hook → MemoParentView → MemoTable                  → 6 рендеров
```

Внутренние обработчики мемоизированного компонента тоже обязаны быть стабильны:
```typescript
// Внутри StoriesTableInner (который обёрнут в React.memo):
const handleMouseEnter = useCallback((id: string) => setHoveredId(id), []);
const handleMouseLeave = useCallback(() => setHoveredId(null), []);
const toggleViewers = useCallback((id: string) => {
    setOpenViewersId(prev => prev === id ? null : id);
}, []);
```
```
