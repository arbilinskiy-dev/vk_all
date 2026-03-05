# Чеклист архитектурного ревью — детальные критерии

## 1. N+1 запросы

**Что искать:**
- `for` / `forEach` / `map` / list comprehension, внутри которого `await`, `db.query()`, `session.execute()`, `fetch()`, `api.get*()`
- Вложенные вызовы CRUD-функций, которые внутри делают запрос к БД
- `useQuery` внутри `.map()` при рендере списка компонентов

**Как считать:**
```
N+1 = количество_итераций × количество_запросов_в_теле_цикла
```

**Как исправлять:**
- Заменить на один `WHERE ... IN (ids)` запрос + группировка через dict/Map
- Для REST API: создать batch-эндпоинт или использовать `Promise.all` (но всё равно N запросов к серверу)
- Для SQLAlchemy: `selectinload()`, `joinedload()`, или ручной `in_()` запрос

---

## 2. Batch-возможности

**Что искать:**
- Несколько одинаковых запросов с разными параметрами (id)
- `db.query(Model).filter(Model.id == single_id)` в цикле
- Серия `api.getItem(id)` вызовов

**Как исправлять:**
- Собрать все ID в массив → один запрос `Model.id.in_(ids)` → распределить через dict
- Создать batch-функцию: `get_items_by_ids(ids: list[int]) -> dict[int, Item]`

---

## 3. Prefetching

**Что искать:**
- Данные, которые одинаковы для всех объектов в цикле (справочники, настройки, общие списки)
- Запрос к одной и той же таблице/эндпоинту с одинаковыми параметрами в разных итерациях

**Как исправлять:**
- Вынести запрос перед циклом
- Сохранить в переменную/Map
- Передать в функцию как параметр вместо повторного запроса

---

## 4. Структуры данных

**Что искать:**
- `array.find(x => x.id === targetId)` — линейный поиск O(n)
- `array.includes(value)` для проверки наличия — O(n)
- `array.filter()` внутри другого `array.map()` — O(n×m)
- Python: `if item in large_list` (list, не set)

**Как исправлять:**
- Построить `Map<id, item>` / `dict[id: item]` один раз → lookup O(1)
- Построить `Set` / `set()` для проверки наличия → O(1)
- Группировка: один проход через `reduce` / `defaultdict` вместо вложенных циклов

---

## 5. Алгоритмическая сложность

**Что искать:**
- Вложенные циклы: `for a in list_a: for b in list_b` → O(n²)
- Сортировка внутри цикла → O(n × n·log·n)
- Рекурсия без мемоизации
- `JSON.stringify()` / `JSON.parse()` для глубокого сравнения в цикле

**Как исправлять:**
- Вложенные циклы → Map + один проход
- Сортировка → вынести перед циклом (если данные не меняются)
- Рекурсия → `@lru_cache` / мемоизация
- Глубокое сравнение → структурное сравнение или hash

---

## 6. Кэширование

**Что искать:**
- Одинаковый запрос вызывается при каждом рендере / каждом вызове функции
- Тяжёлые вычисления (фильтрация, сортировка, трансформация) без мемоизации
- Справочные данные (теги, категории, пользователи), которые меняются редко

**Как исправлять:**
- **Фронтенд:** React Query с `staleTime`, `useMemo`, `useCallback`
- **Бэкенд:** `@lru_cache`, in-memory dict с TTL, Redis для shared state
- **Общее:** если данные не меняются чаще раза в 5 минут — кэшируй

---

## 7. Lazy loading

**Что искать:**
- Загрузка тяжёлых данных (изображения, длинные списки, вложенные сущности) до того, как пользователь их запросил
- Загрузка всех записей, когда показывается только первые 20 (нет пагинации)
- Загрузка подробностей для каждого элемента списка, хотя в списке нужен только заголовок

**Как исправлять:**
- Пагинация / infinite scroll
- Загрузка деталей по клику, а не сразу
- `fields` / `select` параметры в запросах — запрашивать только нужные поля

---

## 8. Дублирование запросов

**Что искать:**
- Один эндпоинт вызывается из разных хуков/компонентов на одной странице
- Один CRUD-запрос вызывается из разных сервисов в рамках одного HTTP-запроса
- `useEffect` с одинаковым `fetchData()` в parent и child компонентах

**Как исправлять:**
- **Фронтенд:** Поднять запрос на уровень выше, передавать данные через props/context. Или React Query (дедупликация из коробки)
- **Бэкенд:** Передавать уже загруженные данные как параметр, а не запрашивать повторно

---

## 9. TOAST bloat (JSON в VARCHAR + UPDATE)

> **Условное исследование**: этот пункт анализируется только если в области ревью обнаружены VARCHAR/Text колонки, хранящие JSON-массивы, И эти колонки UPDATE-ятся. Если нет — пропускаем с пометкой ✅.

### Суть проблемы

PostgreSQL хранит строки > 2 KB в отдельном **TOAST-хранилище** (The Oversized-Attribute Storage Technique). При UPDATE строки с TOAST-данными:
1. Создаётся **новая** версия TOAST-страниц
2. Старая версия становится **dead tuple**
3. Autovacuum **не может удалить TOAST dead tuples**, если хотя бы одна основная строка ссылается на них
4. При массовых UPDATE (например, 30 000 итераций reconcile) — dead tuples накапливаются **экспоненциально**

**Формула bloat:**
```
TOAST_size = N_updates × avg_json_size × (1 + dead_ratio)
Реальный кейс: 4 JSON-колонки × ~200 юзеров/массив × 30000 updates = 44.5 GB
Факт: данные 58 MB, диск 44.5 GB (×750 bloat)
```

### Быстрая диагностика (3 признака)

| # | Признак | Как проверить |
|---|---|---|
| 1 | **JSON в VARCHAR** | `grep -r "json.loads\|json.dumps" crud/` + проверить что колонка — `String`/`Text`, не `JSONB` |
| 2 | **UPDATE в цикле** | Колонка присваивается (=) внутри `for`/`while` или в функции, вызываемой из цикла |
| 3 | **Массивы растут** | JSON-массив получает `.append()` / `.extend()` / union — т.е. размер растёт со временем |

**Если все 3 признака = YES → CRITICAL**: диск заполнится за дни/недели в зависимости от нагрузки.

### Что исследовать при обнаружении

1. **Масштаб**: сколько строк в таблице × средний размер JSON × частота UPDATE
2. **Кто читает JSON**: фронтенд использует массивы user_id или только числовые счётчики?
3. **Пересечение данных**: если данные per-project и cross-project overlap = 0, можно sum вместо union
4. **Текущий bloat**: `SELECT pg_total_relation_size('table')` vs `SELECT pg_relation_size('table')`

### Решение: нормализация + INSERT-only паттерн

```
❌ Было:
  table: hourly_stats
  columns: ..., users_json VARCHAR  ← "[1,2,3,4,5]"
  pattern: READ json → append → UPDATE json (TOAST dead tuple!)

✅ Стало:
  table: hourly_stats
  columns: ..., users_count INTEGER  ← 5

  table: hourly_stats_users  (новая, нормализованная)
  columns: stat_id, user_id, user_type
  pattern: INSERT ON CONFLICT DO NOTHING  (нет UPDATE → нет TOAST!)

  + _recount() для горячего пути (per-slot)
  + _bulk_recount() для batch-операций (per-project)
```

Подробный паттерн реализации: [backend_patterns.md — «Нормализация JSON → INSERT-only»](backend_patterns.md)

### Реальный кейс из проекта (март 2026 — TOAST bloat)

| Метрика | До | После |
|---|---|---|
| Размер таблицы на диске | 44,575 MB | 64.8 MB |
| Размер реальных данных | 58 MB | 58 MB |
| Bloat-коэффициент | ×750 | ×1.1 |
| UPDATE-ов на reconcile | 30,000/проект | 0 |
| INSERT-ов (нормализованная) | — | ~5000/проект (однократно) |

Затронутые файлы: `models_library/message_stats.py`, `crud/message_stats/` (write, sync, reconcile, charts, summary, users, helpers)

---

## 10. Каскадные ре-рендеры (React)

> **Критичность:** HIGH при 100+ элементах в списке. Medium при <20.

**Что искать (5 признаков):**

| # | Признак | Как обнаружить |
|---|---|---|
| 1 | **useCallback с изменяющимися deps** | `useCallback(() => ..., [data.length, currentId, list])` — массив содержит часто меняющиеся значения |
| 2 | **React.memo без стабильных callback-пропсов** | Компонент обёрнут в `React.memo`, но получает `onClick`, `onLoad` и др. функции без useCallback |
| 3 | **setState merge без проверки изменений** | `setState(prev => prev.map(x => ({...x, ...update})))` — ВСЕГДА новый массив, даже при идентичных данных |
| 4 | **Промежуточный компонент без React.memo** | Компонент между хуком и конечным списком не мемоизирован → каскад |
| 5 | **setIsLoading(false) в finally после async** | Фоновая операция (проверка свежести, prefetch) завершается — лишний setState |

**Как считать:**
```
Рендеров = (state_changes × cascade_depth × 2_StrictMode)
StoriesTable кейс: (3 setState × 2 каскад × 2 StrictMode) + mount = 28+
После фикса: 3 реальных + 3 StrictMode = 6
```

**Как обнаруживать автоматически:**

Вставить в подозрительный React.memo компонент:
```tsx
const prevPropsRef = useRef<Record<string, any>>({});
useEffect(() => {
    if (import.meta.env.DEV) {
        const prev = prevPropsRef.current;
        const changes: string[] = [];
        for (const key of Object.keys(props)) {
            if (prev[key] !== (props as any)[key]) {
                changes.push(typeof (props as any)[key] === 'function' ? `⚡${key}` : key);
            }
        }
        if (changes.length > 0) console.log(`[RERENDER]:`, changes.join(', '));
        prevPropsRef.current = { ...props };
    }
});
```

- `⚡functionName` → нестабильный useCallback (причина #1)
- `data: [object]→[object]` → setState merge создаёт новый массив (причина #3)
- Рендер без видимых изменений → промежуточный компонент без memo (причина #4)

**Как исправлять (пошагово):**

1. **Стабилизировать функции:** useCallback([], ...) + useRef для всех данных-зависимостей
2. **React.memo на промежуточных уровнях:** каждый компонент между хуком и списком
3. **Мемоизировать внутренние обработчики:** handleMouseEnter, toggle, onClick внутри memo-компонента
4. **setState merge с hasChanges:** сравнить ТОЛЬКО примитивные поля (string/number/boolean), вернуть `prev` по ссылке если нет изменений
5. **Убрать лишние setState:** setIsLoading(false) → после показа данных, не в finally
6. **Атомарная загрузка батчей:** собрать все страницы в локальную переменную → один setState

### Реальный кейс из проекта (март 2026 — StoriesTable)

| Метрика | До | После |
|---|---|---|
| Рендеров StoriesTable (120 историй) | 28+ | 6 |
| Рендеров (1 история) | — | 4 |
| Нестабильных функций-пропсов | 5 (⚡) | 0 |
| React.memo обёртки | 1 (только таблица) | 3 (таблица + view + dashboard) |

**7 корневых причин:** loadMoreStories с [stories.length], setIsLoading в finally, StoriesStatsView без memo, loadDashboardStats с [projectId], mergeStories без hasChanges, mergeStories сравнивал ссылки на объекты, все хендлеры updater с нестабильными closure.

**Затронутые файлы:** `features/automations/stories-automation/hooks/` (useStoriesLoader, useStoriesUpdater, useStoriesDashboard), `features/automations/stories-automation/components/` (StoriesTable, StoriesStatsView)

Подробный reference: [docs/architecture/references/react_rerender_prevention.md](../../../docs/architecture/references/react_rerender_prevention.md)
