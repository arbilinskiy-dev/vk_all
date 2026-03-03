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
