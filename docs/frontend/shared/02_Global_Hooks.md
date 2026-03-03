# Глобальные хуки приложения

## Обзор

В корневой папке `hooks/` находятся глобальные хуки, управляющие состоянием и поведением всего приложения.

---

## `useAppState`

**Расположение:** `hooks/useAppState.ts`

Центральный хук управления навигационным состоянием приложения.

### Возвращаемые значения

| Значение | Тип | Описание |
|----------|-----|----------|
| `activeModule` | `AppModule` | Активный модуль (`'km'`, `'lists'`, `null`) |
| `activeProjectId` | `string \| null` | ID активного проекта |
| `activeView` | `AppView` | Текущий вид (`'schedule'`, `'products'`, etc.) |
| `activeViewParams` | `Record<string, any>` | Параметры текущего вида (для deep linking) |
| `editingProject` | `Project \| null` | Проект в режиме редактирования |
| `activeListGroup` | `ListGroup` | Активная группа списков |

### Функции

| Функция | Описание |
|---------|----------|
| `setActiveProjectId(id)` | Установить активный проект |
| `setActiveViewParams(params)` | Установить параметры вида |
| `setEditingProject(project)` | Открыть редактирование проекта |
| `setActiveListGroup(group)` | Переключить группу списков |
| `handleSelectModule(module)` | Переключить модуль |
| `handleSelectGlobalView(view)` | Перейти к глобальному виду |
| `handleSelectKmView(view)` | Перейти к виду в модуле КМ |
| `handleSelectListsView(view)` | Перейти к виду в модуле Lists |

### Логика переключения модулей

```typescript
const handleSelectModule = (module: AppModule) => {
  setActiveModule(module);
  setActiveViewParams({}); // Сброс параметров
  
  if (module !== 'km' && module !== 'lists') {
    setActiveProjectId(null); // Сброс проекта вне КМ/Lists
  } else {
    // Установка вида по умолчанию
    if (module === 'km') {
      setActiveView('schedule');
    } else if (module === 'lists') {
      setActiveView('lists-system');
      setActiveListGroup('subscribers');
    }
  }
};
```

---

## `useSmartRefresh`

**Расположение:** `hooks/useSmartRefresh.ts`

Интеллектуальное обновление данных при навигации между проектами и видами.

### Параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `activeProjectId` | `string \| null` | Текущий проект |
| `activeView` | `AppView` | Текущий вид |
| `activeModule` | `AppModule \| null` | Текущий модуль |

### Ключевые механизмы

#### 1. Защита от дублирования
```typescript
const lastProcessedRef = useRef({
  projectId: null,
  view: null,
  timestamp: 0
});

// Debounce 300ms для одного проекта/вида
if (last.projectId === activeProjectId && 
    last.view === activeView && 
    (now - last.timestamp) < 300) {
  return;
}
```

#### 2. Отмена предыдущих операций
```typescript
const activeOperationsRef = useRef<Map<string, AbortController>>(new Map());

// Отменяем предыдущую операцию
const existingController = activeOperationsRef.current.get(operationKey);
if (existingController) {
  existingController.abort();
}
```

#### 3. Учёт ошибок доступа
```typescript
// Не обновляем проекты с ошибками
if (hasPermissionError) return;
if (activeView === 'schedule' && hasEmptyScheduleNotice) return;
if (activeView === 'suggested' && hasEmptySuggestedNotice) return;
```

#### 4. Ленивая загрузка
```typescript
// Сначала загружаем из БД, потом пользователь нажимает "Обновить"
if (isDataMissing) {
  console.log(`Данные отсутствуют. Загружаем из БД...`);
  syncDataForProject(activeProjectId);
}
```

### Преимущества

- **Снижение нагрузки** — не делает запросы к VK API при каждом переключении
- **Быстрый вход** — данные из БД загружаются мгновенно
- **Гонки состояний** — предотвращает конфликты при быстрой навигации
- **Осведомлённость об ошибках** — не пытается обновить проекты с проблемами доступа

---

## Использование

```typescript
// App.tsx
import { useAppState } from './hooks/useAppState';
import { useSmartRefresh } from './hooks/useSmartRefresh';

function App() {
  const {
    activeModule,
    activeProjectId,
    activeView,
    handleSelectModule,
    // ...
  } = useAppState();

  // Автоматическое обновление данных
  useSmartRefresh(activeProjectId, activeView, activeModule);

  return (
    <MainLayout 
      activeModule={activeModule}
      onSelectModule={handleSelectModule}
    >
      {/* ... */}
    </MainLayout>
  );
}
```

---

## См. также

- [State Management](../02_STATE_MANAGEMENT.md) — глубокий разбор Context API
- [API Communication](../03_API_COMMUNICATION.md) — паттерны взаимодействия с API
