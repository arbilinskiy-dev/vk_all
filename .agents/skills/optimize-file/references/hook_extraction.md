# Hook Extraction — Паттерн извлечения хуков

## Основной паттерн: `{ state, actions }`

Каждый хук возвращает объект с двумя секциями:
- **state** — реактивные данные (значения useState, вычисляемые переменные, флаги)
- **actions** — функции-обработчики (handleXxx, setXxx, toggle, reset)

```typescript
export function useBigComponentLogic({ projectId }: { projectId: number }) {
  // ─── State ───
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Derived state ───
  const selectedItem = items.find(i => i.id === selectedId) ?? null;
  const hasChanges = /* ... */;

  // ─── Effects ───
  useEffect(() => {
    loadItems();
  }, [projectId]);

  // ─── Handlers ───
  const handleSave = async () => { /* ... */ };
  const handleDelete = async (id: number) => { /* ... */ };
  const handleSelect = (id: number) => setSelectedId(id);

  // ─── Return ───
  return {
    state: { items, isLoading, selectedId, selectedItem, error, hasChanges },
    actions: { handleSave, handleDelete, handleSelect }
  };
}
```

## Композитный хук (хаб-хук)

Когда логика > 300 строк — разбить хук на под-хуки и собрать в хаб-хуке:

```typescript
// useProductsManager.ts — ХАБ-ХУК
export function useProductsManager({ projectId }: Props) {
  const data = useProductData(projectId);           // загрузка данных
  const filtering = useProductFiltering(data.items); // фильтрация
  const selection = useProductSelection();            // выбор элементов
  const saving = useProductSaving(data.refetch);      // сохранение
  const modals = useProductModals();                  // модальные окна

  return {
    state: {
      items: filtering.filteredItems,
      isLoading: data.isLoading,
      selectedIds: selection.selectedIds,
      ...modals.state,
    },
    actions: {
      handleSave: saving.save,
      handleFilter: filtering.setFilter,
      toggleSelect: selection.toggle,
      ...modals.actions,
    }
  };
}
```

## Правила извлечения

### Что выносить в хук

| Блок кода | Выносить? | Куда |
|---|---|---|
| `useState` + `useEffect` + обработчики | Да | `useXxxLogic.ts` |
| `useCallback` / `useMemo` с тяжёлой логикой | Да | Под-хук по домену |
| Простой `useState` для UI (showModal) | Нет* | Оставить в компоненте |
| Вызовы API + трансформация ответа | Да | `useXxxData.ts` |
| Подписки (WebSocket, EventSource) | Да | `useXxxSubscription.ts` |

*Если UI-стейт связан с бизнес-логикой — выносить вместе.

### Передача зависимостей

Хук получает **только то, что приходит из props компонента** или из других хуков:

```typescript
// ✅ Хорошо — зависимость из props
function useItemLogic({ projectId }: { projectId: number }) { ... }

// ✅ Хорошо — зависимость из другого хука
function useItemSaving(refetch: () => Promise<void>) { ... }

// ❌ Плохо — хук дублирует пропс верхнего компонента
function useItemLogic() {
  const projectId = useContext(ProjectContext); // лучше передать явно
}
```

### Типизация возвращаемого значения

Для хуков > 100 строк — описать тип возвращаемого значения:

```typescript
interface BigComponentState {
  items: Item[];
  isLoading: boolean;
  error: string | null;
}

interface BigComponentActions {
  handleSave: () => Promise<void>;
  handleDelete: (id: number) => Promise<void>;
}

export function useBigComponentLogic(props: Props): {
  state: BigComponentState;
  actions: BigComponentActions;
} { ... }
```

Для хуков < 100 строк — TypeScript выведет тип автоматически, явная типизация необязательна.

## Подводные камни

1. **Не забыть `useCallback` для функций, передаваемых в дочерние компоненты через props** — иначе лишние ре-рендеры
2. **Ref'ы** — если в компоненте есть `useRef`, решить: оставить в компоненте (DOM ref) или вынести в хук (логический ref)
3. **Context** — если компонент использует `useContext`, передать данные из контекста в хук через параметр, а не дублировать `useContext` в хуке
4. **Замыкания** — при выносе обработчиков убедиться, что они замыкают актуальные значения стейта
