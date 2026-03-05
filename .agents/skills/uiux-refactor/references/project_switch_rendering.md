# Переключение проектов — Рендеринг без ремаунта и мерцания

**Правило:** При переключении проекта (activeProject) компоненты страницы ОБЯЗАНЫ оставаться смонтированными. Обновляются ТОЛЬКО данные внутри них. ЗАПРЕЩЕНЫ: полный ремаунт через `key=`, скелетоны при смене проекта, синхронный сброс state в нули, мерцание карточек/таблиц/графиков.

---

## Антипаттерны (ЗАПРЕЩЕНЫ)

### 1. `key={projectId}` на компонентах страниц

```tsx
// ❌ ЗАПРЕЩЕНО — key= вызывает полный ремаунт: все хуки, state, подписки пересоздаются
<StoriesAutomationPage key={activeProject?.id} projectId={projectId} />
<MessagesPage key={activeProject?.id} projectId={projectId} />
```

**Почему плохо:**
- React уничтожает компонент и создаёт новый — все `useState` обнуляются, все `useEffect` перезапускаются
- Анимации появления перезапускаются (карточки бенто-сетки, строки таблиц)
- WebSocket-подписки разрываются и пересоздаются
- Пользователь видит «мигание» всей страницы

```tsx
// ✅ ПРАВИЛЬНО — пробрасываем projectId как проп, хуки реагируют реактивно
<StoriesAutomationPage projectId={projectId} activeTab={activeTab} />
```

### 2. `isLoading ? <Skeleton /> : <Content />` как ternary

```tsx
// ❌ ЗАПРЕЩЕНО — при isLoading=true Content полностью РАЗМОНТИРУЕТСЯ
{isLoading ? (
    <div className="animate-pulse">...скелетон...</div>
) : (
    <div>
        <Dashboard ... />   // ← размонтируется при isLoading=true
        <Table ... />        // ← размонтируется при isLoading=true
    </div>
)}
```

**Почему плохо:**
- Ternary `? :` — это два РАЗНЫХ React-элемента
- При переключении `true→false` React уничтожает скелетон и МОНТИРУЕТ контент с нуля
- Все дочерние `useState` сбрасываются (expanded viewers, scroll position, выделение)
- Все `useEffect` перезапускаются (повторные API-запросы)

### 3. Синхронный сброс state перед загрузкой

```tsx
// ❌ ЗАПРЕЩЕНО — мерцание: данные обнуляются → через 200мс приходят новые
useEffect(() => {
    setDashboardStats(null);     // ← графики моргают "0"
    setStories([]);              // ← таблица пустеет
    setIsActive(false);          // ← хедер мигает "Остановлен"
    setPosts([]);                // ← список постов пустеет
    loadData();                  // ← через 200мс приходят новые данные
}, [projectId]);
```

**Почему плохо:**
- React батчит setState'ы — но промежуточное состояние (все нули) рендерится ОДИН раз
- Пользователь видит: данные → 0/пусто/Остановлен → новые данные = мерцание

### 4. `setStories(newData)` без ref-проверки в асинхронных операциях

```tsx
// ❌ ЗАПРЕЩЕНО — stale-обновление перезаписывает данные нового проекта
useEffect(() => {
    let cancelled = false;
    const load = async () => {
        const data = await fetchStories(projectId);
        if (cancelled) return;     // ← НЕ ДОСТАТОЧНО!
        setStories(data);          // ← React batching: этот setState может
    };                              //   попасть в рендер нового проекта
    load();
    return () => { cancelled = true; };
}, [projectId]);
```

**Почему `cancelled` не достаточно:**
- `cancelled = true` выставляется в cleanup useEffect
- cleanup запускается ПОСЛЕ рендера, а `setStories(data)` уже поставлен в очередь React
- В React 18 batching: `setStories` от старого проекта может войти в пакет с рендером нового

---

## Паттерны (ОБЯЗАТЕЛЬНЫ)

### Паттерн 1: `hasEverLoadedRef` — скелетон только при первом открытии

**Проблема:** Скелетон нужен при первом открытии страницы, но при смене проекта он вызывает ремаунт контента.

**Решение:** `useRef(false)` — после первой успешной загрузки скелетон никогда не показывается.

```tsx
const hasEverLoadedRef = useRef(false);

const loadData = async () => {
    // Скелетон ТОЛЬКО при самом первом открытии
    if (!hasEverLoadedRef.current) {
        setIsLoading(true);
    }
    try {
        const data = await fetchData(projectId);
        // ... обработка
        hasEverLoadedRef.current = true;
    } finally {
        setIsLoading(false);
    }
};
```

**Где применять:**
- Хуки настроек (`useStoriesSettings`, `usePostsSettings` и аналогичные)
- Хуки загрузки данных (`useStoriesLoader`, `useMessagesLoader` и аналогичные)
- Любой хук, чей `isLoading` управляет ternary-скелетоном в родительском компоненте

**Применено в проекте:**
- `useStoriesSettings.ts` — `hasEverLoadedRef` для `isLoading` всей страницы
- `useStoriesLoader.ts` — `hasEverLoadedRef` для `isLoadingStories` таблицы

### Паттерн 2: `currentProjectIdRef` — синхронный ref для asyncguard

**Проблема:** `projectId` из props/deps доступен только в момент вызова useEffect. К моменту прихода API-ответа projectId уже может быть другим.

**Решение:** `useRef` обновляемый синхронно в теле компонента (не в useEffect!).

```tsx
const currentProjectIdRef = useRef<string | undefined>(projectId);

// ВАЖНО: обновляем СИНХРОННО при каждом рендере, ДО запуска useEffect
if (projectId !== currentProjectIdRef.current) {
    currentProjectIdRef.current = projectId;
}
```

**Где применять:** в КАЖДОМ хуке с асинхронными операциями, завязанными на projectId.

**Применено в проекте:**
- `useStoriesLoader.ts`
- `useStoriesSettings.ts`
- `useStoriesDashboard.ts` (hooks/)
- `useStoriesUpdater.ts`

### Паттерн 3: Functional updater + ref-проверка — защита от stale-обновлений

**Проблема:** `setStories(data)` из cleanup-эффекта старого проекта может попасть в React batch нового проекта.

**Решение:** Функциональный updater проверяет ref В МОМЕНТ РЕНДЕРА (не диспатча):

```tsx
// Вместо: setStories(newData)
setStories(prev => {
    if (currentProjectIdRef.current !== targetProjectId) return prev; // ← stale? отбросить
    return newData;
});

// Для числовых значений:
setTotalStories(prev => currentProjectIdRef.current !== targetPid ? prev : newTotal);
```

**Как это работает:**
1. `setStories(updaterFn)` ставит функцию в очередь React
2. React вызывает `updaterFn(prev)` в момент рендера
3. К этому моменту `currentProjectIdRef.current` уже обновлён на новый проект
4. Функция видит что `targetProjectId !== current` → возвращает `prev` (без изменений)
5. React видит `prev === prev` → **не триггерит ре-рендер**

**Где применять:**
- ВСЕ `setStories` / `setTotalStories` в useEffect с `[projectId]` зависимостью
- ВСЕ `setStories` в async-колбэках (`handleUpdateStats`, `handleUpdateViewers`)

**Применено в проекте:**
- `useStoriesLoader.ts` — все setState в useEffect `[activeTab, projectId]`
- `useStoriesUpdater.ts` — все `setStoriesRef.current(prev => ...)` в 3 хэндлерах
- `useStoriesDashboard.ts` — `setDashboardStats(prev => ...)`

### Паттерн 4: `targetPid` — фиксация projectId на старте операции

**Проблема:** `projectIdRef.current` может измениться между началом API-запроса и его завершением. Если использовать `projectIdRef.current` для отправки запроса, можно отправить запрос с ID нового проекта, но применить результат к старому state.

**Решение:** Зафиксировать `targetPid` в начале операции:

```tsx
const handleUpdateStats = useCallback(async (mode, params) => {
    const targetPid = projectIdRef.current;  // ← фиксируем
    if (!targetPid) return;

    // API-запрос с зафиксированным ID
    const res = await callApi('updateStats', { projectId: targetPid, ... });

    // Защита: если проект сменился — не применяем результат
    setStories(prev => {
        if (projectIdRef.current !== targetPid) return prev;
        // ... патчим данные
    });

    // onSuccess только если проект не сменился
    if (projectIdRef.current === targetPid) onSuccessRef.current?.();
}, []);
```

**Где применять:**
- Все async-хэндлеры, которые модифицируют state (обновление статистики, зрителей, сохранение настроек)
- Все `loadData()` функции

**Применено в проекте:**
- `useStoriesUpdater.ts` — `handleUpdateStats`, `handleUpdateViewers`, `handleUpdateAll`
- `useStoriesSettings.ts` — `loadData()`

### Паттерн 5: Тихая замена данных — без сброса в null/[]

**Проблема:** `setDashboardStats(null)` при смене проекта → карточки показывают нули → через 200мс новые данные = мерцание.

**Решение:** НЕ сбрасывать state. Старые данные остаются видимыми до прихода новых. Один плавный переход `oldData → newData` вместо `oldData → null → newData`.

```tsx
// ❌ ЗАПРЕЩЕНО
useEffect(() => {
    setDashboardStats(null);  // мерцание!
    setStories([]);           // мерцание!
}, [projectId]);

// ✅ ПРАВИЛЬНО — данные заменяются атомарно после API-ответа
useEffect(() => {
    loadData(); // новые данные придут и заменят старые одним setState
}, [projectId]);
```

**Исключение:** Если данные проекта A содержат конфиденциальную/чувствительную информацию, которую нельзя показывать при просмотре проекта B — тогда сброс допустим, но с overlay-индикатором (не через unmount контента).

**Где применять:**
- Дашборды (dashboardStats, charts, demographics)
- Таблицы (stories, posts, messages)
- Настройки (isActive, keywords, posts, logs)

**Применено в проекте:**
- `useStoriesDashboard.ts` — убран `setDashboardStats(null)` из useEffect
- `useStoriesSettings.ts` — убраны `setIsActive(false); setPosts([]); setLogs([])`

### Паттерн 6: `changed` flag в `.map()` — предотвращение ложных ре-рендеров

**Проблема:** `prev.map(item => ...)` ВСЕГДА создаёт новый массив, даже если ни один элемент не изменился. React.memo видит новую ссылку → ре-рендерит.

**Решение:** Флаг `changed` + возврат `prev` если ничего не изменилось:

```tsx
setStories(prev => {
    let changed = false;
    const result = prev.map(story => {
        const updated = updatedItems.find(u => u.id === story.id);
        if (updated) {
            changed = true;
            return { ...story, ...updated };
        }
        return story;
    });
    return changed ? result : prev; // ← prev === prev → React.memo не триггерит ре-рендер
});
```

**Где применять:**
- Любые патч-операции: обновление статистики, зрителей, статусов
- Операции merge при фоновом обновлении данных

**Применено в проекте:**
- `useStoriesUpdater.ts` — `handleUpdateStats`, `handleUpdateViewers`, `handleUpdateAll`
- `useStoriesLoader.ts` — функция `mergeStories()` (сравнение по timestamps)

### Паттерн 7: `projectId` в deps эффекта фильтров — реактивная перезагрузка

**Проблема:** После удаления `key={projectId}` фильтры дашборда (periodType, filterType) не перезапрашивают данные при смене проекта.

**Решение:** Добавить `projectId` в зависимости useEffect, который запрашивает данные при смене фильтров:

```tsx
// dashboard/useStoriesDashboard.ts
useEffect(() => {
    loadDashboardStats(periodType, filterType, customStartDate, customEndDate);
}, [projectId, periodType, filterType, customStartDate, customEndDate]);
//   ^^^^^^^^^ — гарантирует перезагрузку при смене проекта
```

**Где применять:**
- Любые компоненты с фильтрами, зависящими от projectId

**Применено в проекте:**
- `dashboard/useStoriesDashboard.ts` — projectId добавлен в deps эффекта фильтров

---

## Чеклист при ревью переключения проектов

| # | Проверка | Как проверить |
|---|----------|---------------|
| 1 | Нет `key={projectId}` на компонентах страниц | grep `key={.*project` в AppContent.tsx |
| 2 | `isLoading` ternary не размонтирует контент | Найти `isLoading ? <Skeleton> : <Content>`, проверить hasEverLoadedRef |
| 3 | Нет синхронного сброса state в useEffect[projectId] | Проверить useEffect с deps [projectId] — нет `setState(null/[]/false/'')` |
| 4 | Все async setState защищены ref-проверкой | Каждый `setX(data)` после await → `setX(prev => ref !== pid ? prev : data)` |
| 5 | Async-хэндлеры фиксируют targetPid | `const targetPid = ref.current` в начале каждого хэндлера |
| 6 | `.map()` патч возвращает prev при отсутствии изменений | `let changed = false; return changed ? result : prev;` |
| 7 | Фильтры включают projectId в deps | useEffect фильтров содержит projectId |
| 8 | console.log проверка | Переключить проект 5 раз, в логах нет `undefined→` или `0→` спайков |

---

## Визуальная диаграмма: что происходит при переключении проекта

### ❌ До оптимизации (3+ ре-рендера, мерцание)
```
Проект A → клик на Проект B
  ↓
[Рендер 1] key= изменился → UNMOUNT всей страницы
  ↓
[Рендер 2] MOUNT новой страницы, isLoading=true → скелетон
  ↓
[Рендер 3] setState(null), setState([]) → все обнуляется
  ↓
[Рендер 4] Данные проекта B пришли → контент отрисован
  ↓
Итого: 4 рендера, 1 unmount, 1 mount, мерцание ~300-500мс
```

### ✅ После оптимизации (1-2 ре-рендера, плавно)
```
Проект A → клик на Проект B
  ↓
[Рендер 0] ref обновился синхронно: currentProjectIdRef.current = B
  ↓
[~200мс] API для проекта B загружается
          Пользователь видит данные проекта A (без мерцания)
  ↓
[Рендер 1] setStories(prev => ref===B ? newData : prev)
           setDashboardStats(prev => ref===B ? newStats : prev)
           → Контент ПЛАВНО обновляется на данные проекта B
  ↓
Итого: 1 рендер, 0 unmount, 0 mount, без мерцания
```

---

## Связанные паттерны

- **`sidebar_state_isolation.md`** — изоляция состояний между модулями сайдбара
- **`animations.md` (§ Числа / AnimatedNumber)** — плавная анимация числовых значений при смене данных
- **`component_priority.md`** — shared-хуки vs локальные для управления projectId
