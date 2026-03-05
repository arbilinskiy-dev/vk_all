# Паттерны оптимизации — Backend (Python / SQLAlchemy / FastAPI)

## Batch-запрос через IN

```python
from collections import defaultdict
from sqlalchemy import select
from sqlalchemy.orm import Session

def get_posts_by_project_ids(db: Session, project_ids: list[int]) -> dict[int, list[Post]]:
    """Один запрос вместо N. Возвращает dict[project_id → list[Post]]."""
    if not project_ids:
        return {}
    
    posts = db.query(Post).filter(Post.project_id.in_(project_ids)).all()
    
    result = defaultdict(list)
    for post in posts:
        result[post.project_id].append(post)
    return dict(result)
```

## Prefetch + dict для общих данных

```python
async def load_projects_with_details(db: Session, user_id: int):
    # Шаг 1: загрузить проекты
    projects = get_user_projects(db, user_id)
    project_ids = [p.id for p in projects]
    
    if not project_ids:
        return []
    
    # Шаг 2: prefetch ОБЩИХ данных (1 запрос на все проекты)
    all_tags = get_all_tags(db)  # справочник — один раз
    tags_map = {tag.id: tag for tag in all_tags}
    
    # Шаг 3: batch-запросы ИНДИВИДУАЛЬНЫХ данных (1 запрос каждый)
    posts_map = get_posts_by_project_ids(db, project_ids)
    stats_map = get_stats_by_project_ids(db, project_ids)
    
    # Шаг 4: сборка результата — без запросов к БД
    results = []
    for project in projects:
        results.append({
            "project": project,
            "posts": posts_map.get(project.id, []),
            "stats": stats_map.get(project.id, {}),
            "tags": [tags_map.get(tid) for tid in project.tag_ids if tid in tags_map],
        })
    
    return results
    # Итого: 4 запроса вместо 1 + N×3
```

## Кэширование справочников

```python
from functools import lru_cache
from datetime import datetime, timedelta

# Простой TTL-кэш для данных, которые редко меняются
_cache = {}
_cache_ttl = {}

def get_cached(key: str, fetch_fn, ttl_seconds: int = 300):
    """Получить данные из кэша или запросить."""
    now = datetime.utcnow()
    if key in _cache and _cache_ttl.get(key, now) > now:
        return _cache[key]
    
    data = fetch_fn()
    _cache[key] = data
    _cache_ttl[key] = now + timedelta(seconds=ttl_seconds)
    return data

# Использование
def get_all_tags_cached(db: Session):
    return get_cached("all_tags", lambda: db.query(Tag).all(), ttl_seconds=300)
```

## SQLAlchemy: joinedload / selectinload

```python
from sqlalchemy.orm import joinedload, selectinload

# ❌ Вызовет N+1 при обращении к project.posts
projects = db.query(Project).all()
for p in projects:
    print(p.posts)  # ← lazy load = отдельный запрос

# ✅ Eager loading — 1 или 2 запроса
projects = db.query(Project).options(
    selectinload(Project.posts),    # SELECT ... WHERE project_id IN (...)
    joinedload(Project.owner),      # JOIN users ON ...
).all()
```

## Пагинация обязательна для списков

```python
def get_posts_paginated(
    db: Session, 
    project_id: int, 
    skip: int = 0, 
    limit: int = 50
) -> tuple[list[Post], int]:
    """Всегда возвращай (items, total_count)."""
    query = db.query(Post).filter(Post.project_id == project_id)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return items, total
```

## Нормализация JSON → INSERT-only (решение TOAST bloat)

### Когда применять
- Есть `VARCHAR` / `Text` колонка, хранящая JSON-массив ID (`"[1,2,3]"`)
- Эта колонка UPDATE-ится при каждом новом элементе (json.loads → append → json.dumps → UPDATE)
- Операция массовая (100+ UPDATE на одну строку за цикл обработки)

### Архитектура решения (4 компонента)

#### 1. Нормализованная таблица (замена JSON)

```python
from sqlalchemy import Column, Integer, String, SmallInteger, PrimaryKeyConstraint, Index
from database import Base

class ParentStatsUsers(Base):
    """Нормализованная таблица: одна строка = один пользователь в одном слоте."""
    __tablename__ = "parent_stats_users"
    
    parent_id = Column(String, nullable=False)
    slot_key = Column(String, nullable=False)       # например "2026-03-05T14"
    user_id = Column(Integer, nullable=False)
    user_type = Column(SmallInteger, nullable=False) # 1=type_a, 2=type_b, 3=type_c
    
    __table_args__ = (
        PrimaryKeyConstraint("parent_id", "slot_key", "user_id", "user_type"),
        Index("ix_psu_parent_slot", "parent_id", "slot_key"),
        Index("ix_psu_parent_user", "parent_id", "user_id"),
    )
```

#### 2. Целочисленные счётчики в родительской таблице

```python
class ParentStats(Base):
    """Родительская таблица — только числа, никаких JSON."""
    __tablename__ = "parent_stats"
    
    # ... существующие колонки ...
    
    # Вместо users_json VARCHAR:
    type_a_count = Column(Integer, nullable=False, default=0)
    type_b_count = Column(Integer, nullable=False, default=0)
    type_c_count = Column(Integer, nullable=False, default=0)
    total_users_count = Column(Integer, nullable=False, default=0)
```

#### 3. Паттерн записи: INSERT ON CONFLICT DO NOTHING

```python
from sqlalchemy.dialects.postgresql import insert as pg_insert

def record_user(db, parent_id: str, slot_key: str, user_id: int, user_type: int):
    """Горячий путь: один пользователь → одна запись."""
    stmt = pg_insert(ParentStatsUsers).values(
        parent_id=parent_id,
        slot_key=slot_key,
        user_id=user_id,
        user_type=user_type,
    ).on_conflict_do_nothing()
    
    result = db.execute(stmt)
    
    # Пересчитываем счётчики ТОЛЬКО если это новый пользователь
    if result.rowcount > 0:
        _recount_slot(db, parent_row, parent_id, slot_key)

def record_users_batch(db, rows: list[dict]):
    """Batch-путь: reconcile/sync — много пользователей за раз."""
    for chunk in chunks(rows, 5000):
        stmt = pg_insert(ParentStatsUsers).values(chunk).on_conflict_do_nothing()
        db.execute(stmt)
    db.commit()
    
    # Один SQL пересчитывает ВСЕ слоты проекта
    _bulk_recount(db, parent_id)
    db.commit()
```

#### 4. Пересчёт счётчиков

```python
from sqlalchemy import func, distinct, case, text

def _recount_slot(db, row, parent_id: str, slot_key: str):
    """Пересчёт одного слота (1 SQL). Горячий путь."""
    counts = db.query(
        func.count(distinct(ParentStatsUsers.user_id)).label("total"),
        func.count(distinct(case(
            (ParentStatsUsers.user_type == 1, ParentStatsUsers.user_id),
        ))).label("type_a"),
        func.count(distinct(case(
            (ParentStatsUsers.user_type == 2, ParentStatsUsers.user_id),
        ))).label("type_b"),
    ).filter(
        ParentStatsUsers.parent_id == parent_id,
        ParentStatsUsers.slot_key == slot_key,
    ).first()
    
    row.total_users_count = counts.total or 0
    row.type_a_count = counts.type_a or 0
    row.type_b_count = counts.type_b or 0

def _bulk_recount(db, parent_id: str):
    """Пересчёт ВСЕГО проекта одним SQL (для batch-операций)."""
    db.execute(text("""
        UPDATE parent_stats h SET
            total_users_count = COALESCE(sub.total, 0),
            type_a_count = COALESCE(sub.type_a, 0),
            type_b_count = COALESCE(sub.type_b, 0)
        FROM (
            SELECT parent_id, slot_key,
                COUNT(DISTINCT user_id) as total,
                COUNT(DISTINCT CASE WHEN user_type = 1 THEN user_id END) as type_a,
                COUNT(DISTINCT CASE WHEN user_type = 2 THEN user_id END) as type_b
            FROM parent_stats_users
            WHERE parent_id = :pid
            GROUP BY parent_id, slot_key
        ) sub
        WHERE h.parent_id = sub.parent_id AND h.slot_key = sub.slot_key
    """), {"pid": parent_id})
```

### Миграция существующих JSON → нормализованная таблица

```python
def _migrate_json_to_normalized(engine):
    """Одноразовая миграция: парсим JSON, INSERT в нормализованную таблицу."""
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT parent_id, slot_key, users_json, user_type_json "
            "FROM parent_stats WHERE users_json IS NOT NULL AND users_json != '[]'"
        )).fetchall()
        
        batch = []
        for row in rows:
            for uid in json.loads(row.users_json):
                batch.append({
                    "parent_id": row.parent_id,
                    "slot_key": row.slot_key,
                    "user_id": uid,
                    "user_type": 1,
                })
            if len(batch) >= 5000:
                conn.execute(text(
                    "INSERT INTO parent_stats_users (parent_id, slot_key, user_id, user_type) "
                    "VALUES (:parent_id, :slot_key, :user_id, :user_type) "
                    "ON CONFLICT DO NOTHING"
                ), batch)
                batch.clear()
        
        if batch:
            conn.execute(text(...), batch)
        
        conn.commit()
```

### Паттерн чтения: SQL вместо json.loads()

```python
# ❌ Было: json.loads() на каждую строку → O(N × M) в Python
for row in hourly_rows:
    users = json.loads(row.users_json)      # десериализация
    all_users.update(users)                 # union в Python

# ✅ Стало: один SQL-запрос
users = db.query(
    ParentStatsUsers.user_id,
    ParentStatsUsers.user_type,
).distinct().filter(
    ParentStatsUsers.parent_id == parent_id,
)
# Фильтр по дате, тип, проект — всё в SQL, не в Python
```

### Ключевые принципы

1. **INSERT-only**: `ON CONFLICT DO NOTHING` — никогда не UPDATE нормализованную таблицу
2. **Счётчики пересчитываются**: `_recount_slot()` (горячий путь, 1 SQL) или `_bulk_recount()` (batch, 1 SQL на весь проект)
3. **JSON-колонки = deprecated**: при создании новых строк ставим `"[]"`, постепенно убираем
4. **Обратная совместимость**: миграция идемпотентна (`ON CONFLICT DO NOTHING`), старый код продолжает работать пока не обновлён
