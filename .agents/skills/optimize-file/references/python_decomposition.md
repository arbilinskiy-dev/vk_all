# Python Decomposition — Декомпозиция Python-файлов

## Структура бэкенда проекта

```
backend_python/
  routers/          ← Маршруты FastAPI (тонкие, вызывают сервисы)
  services/         ← Бизнес-логика (сервисные классы/функции)
  crud/             ← Операции с БД (SQLAlchemy)
  schemas/          ← Pydantic-модели (request/response)
  models.py         ← SQLAlchemy-модели таблиц
  utils/            ← Утилиты
```

## Паттерн: Роутер → Сервис → CRUD

### Роутер (хаб)

Роутер — **тонкий контейнер**, аналог React-хаба. Содержит только:
- Декораторы маршрутов (`@router.get`, `@router.post`)
- Валидацию входных данных (через Pydantic-схемы)
- Вызовы сервисов
- Обработку HTTP-ошибок (try/except → HTTPException)

```python
# routers/market.py — ХАБ
@router.post("/products")
async def create_product(data: ProductCreate, db=Depends(get_db)):
    try:
        return await market_service.create_product(db, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### Сервис (логика)

Сервис содержит бизнес-логику: валидацию, трансформации, оркестрацию вызовов.

```python
# services/market/market_service.py
async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    # Валидация бизнес-правил
    await _validate_product(data)
    # Вызов CRUD для сохранения
    product = await market_crud.create(db, data)
    # Пост-обработка (VK API, уведомления и т.д.)
    await _sync_with_vk(product)
    return product
```

### CRUD (БД)

CRUD содержит только операции с базой данных — чистый SQLAlchemy.

```python
# crud/market_crud.py
async def create(db: AsyncSession, data: ProductCreate) -> Product:
    product = Product(**data.dict())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product
```

---

## Когда декомпозировать Python-файл

| Признак | Действие |
|---|---|
| Роутер > 300 строк | Вынести логику в `services/{name}/` |
| Сервис > 400 строк | Разбить на под-сервисы по доменам |
| Функция > 80 строк | Выделить подфункции (`_helper_name`) |
| Дублирование VK API вызовов | Вынести в `{name}_vk_client.py` |
| Pydantic-модели в роутере | Вынести в `schemas/{name}_schemas.py` |

## Декомпозиция большого роутера

Исходный файл: `routers/big_router.py` (600 строк)

**План:**
```
routers/big_router.py         (150 строк — маршруты)
services/big/
  big_service.py               (200 строк — основная логика)
  big_vk_client.py             (100 строк — VK API)
  big_export.py                (100 строк — экспорт/импорт)
schemas/big_schemas.py         (50 строк — Pydantic-модели)
```

## Декомпозиция большого сервиса

Исходный файл: `services/market/market_service.py` (500 строк)

Разбить по доменам:
```
services/market/
  market_service.py            (хаб — оркестрация, 100 строк)
  product_operations.py        (CRUD-обёртки для товаров)
  album_operations.py          (CRUD-обёртки для подборок)
  vk_sync.py                   (синхронизация с VK Market API)
  export_import.py             (CSV/Excel экспорт/импорт)
```

## Правила для Python

1. **Приватные функции** — хелперы начинаются с `_`: `_validate_product`, `_format_price`
2. **Async** — сохранять `async/await` при выносе. Если функция использовала `await` — новый файл тоже async
3. **Зависимости** — `db: AsyncSession` передаётся параметром, не создаётся внутри
4. **Импорты** — относительные внутри `services/`, абсолютные для `crud/`, `schemas/`, `models`
5. **Типизация** — все публичные функции сервиса должны иметь type hints (параметры + return)
6. **Docstrings** — для публичных функций сервиса (одна строка, что делает)
