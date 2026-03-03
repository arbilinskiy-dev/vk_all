# Hub Pattern — Паттерн хаб-контейнера

## React (.tsx)

### Эталон: ProductsTab

```
features/products/
  components/
    ProductsTab.tsx          ← ХАБ (~80 строк): импорт хука + рендер подкомпонентов
    ProductsHeader.tsx
    AlbumFilters.tsx
    ProductsTable.tsx
    ProductsModals.tsx       ← Вложенный хаб для модальных окон
  hooks/
    useProductsManager.ts    ← ХАБ-ХУК: собирает 8 под-хуков в { state, actions }
    useProductData.ts
    useProductFiltering.ts
    useProductSelection.ts
    useProductEditing.ts
    useProductSaving.ts
    useProductModals.ts
    useProductAI.ts
    useProductBulkActions.ts
  types.ts
```

### Структура хаб-компонента

```tsx
// BigComponent.tsx — ХАБ (тонкий контейнер)
import { useBigComponentLogic } from '../hooks/useBigComponentLogic';
import { SectionHeader } from './SectionHeader';
import { SectionContent } from './SectionContent';
import { SectionModals } from './SectionModals';

interface BigComponentProps {
  projectId: number;
  onClose: () => void;
}

// Имя и props — ПРЕЖНИЕ. Это внешний контракт.
export const BigComponent: React.FC<BigComponentProps> = ({ projectId, onClose }) => {
  const { state, actions } = useBigComponentLogic({ projectId });

  return (
    <div className="...">
      <SectionHeader
        title={state.title}
        onSave={actions.handleSave}
        isSaving={state.isSaving}
      />
      <SectionContent
        items={state.items}
        onItemClick={actions.handleItemClick}
        isLoading={state.isLoading}
      />
      <SectionModals
        showConfirm={state.showConfirm}
        onConfirm={actions.handleConfirm}
        onCancel={actions.handleCancel}
      />
    </div>
  );
};
```

### Когда извлекать подкомпонент

- JSX-блок > 30 строк с собственным условным рендерингом
- Блок используется в нескольких местах (DRY)
- Блок имеет собственный стейт (useState внутри — вынести вместе со стейтом)
- Визуально самостоятельная секция (хедер, футер, сайдбар, модалка)

### Когда НЕ извлекать

- Блок < 15 строк и нет собственного стейта
- Однократное условие `{condition && <div>...</div>}`
- Простой список без логики: `items.map(item => <li>{item.name}</li>)`

---

## Python (.py)

### Эталон: Роутер → Сервис → CRUD

```
routers/
  market.py                  ← ХАБ: маршруты, вызовы сервисов
services/
  market/
    market_service.py        ← Бизнес-логика
    market_vk_client.py      ← VK API запросы
    market_export.py         ← Экспорт/импорт товаров
crud/
  market_crud.py             ← Операции с БД
schemas/
  market_schemas.py          ← Pydantic-модели
```

### Структура хаб-роутера (Python)

```python
# routers/market.py — ХАБ
from fastapi import APIRouter, Depends
from services.market.market_service import MarketService
from schemas.market_schemas import ProductCreate, ProductUpdate

router = APIRouter(prefix="/market", tags=["market"])

@router.post("/products")
async def create_product(data: ProductCreate, db=Depends(get_db)):
    return await MarketService.create(db, data)

@router.get("/products")
async def list_products(project_id: int, db=Depends(get_db)):
    return await MarketService.list(db, project_id)
```

Роутер **не содержит бизнес-логику** — только маршрутизация и вызов сервисов.

---

## Правила именования

| Что | Паттерн | Пример |
|---|---|---|
| Хаб-компонент | `{Name}.tsx` (оригинальное имя) | `ProductsTab.tsx` |
| Хук логики | `use{Name}Logic.ts` | `useProductsTabLogic.ts` |
| Под-хук | `use{Domain}.ts` | `useProductFiltering.ts` |
| Подкомпонент | `{Name}{Section}.tsx` | `ProductsHeader.tsx` |
| Утилиты | `{name}Utils.ts` | `productUtils.ts` |
| Константы | `{name}Constants.ts` | `productConstants.ts` |
| Типы | `types.ts` (один на фичу) | `types.ts` |

## Размещение файлов

```
features/{name}/
  components/     ← Хаб + подкомпоненты
    modals/       ← Модальные окна (если есть)
  hooks/          ← Хуки (хаб-хук + под-хуки)
  types.ts        ← Типы фичи
  utils/          ← Утилиты фичи
```

Хуки — **рядом с компонентом** в папке `hooks/`, не в глобальном `hooks/`.
Подкомпоненты — **рядом с хабом** в той же папке `components/`.
