# conftest.py — Шаблон фикстур для тестирования

## Файл: tests/conftest.py

```python
"""
Фикстуры для тестирования бэкенда.
Создаёт тестовую SQLite in-memory БД и TestClient.
"""
import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Добавляем backend_python в путь
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from main import app
from database import Base, get_db


# =====================================================================
# Тестовая БД (SQLite in-memory)
# =====================================================================
SQLALCHEMY_TEST_DATABASE_URL = "sqlite://"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Создаёт чистую БД для каждого теста."""
    Base.metadata.create_all(bind=test_engine)
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """TestClient с подменённой БД."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# =====================================================================
# Фикстура авторизации
# =====================================================================
@pytest.fixture
def auth_headers(client):
    """
    Создаёт тестового пользователя и возвращает заголовки с JWT.
    Адаптировать под реальную схему авторизации проекта.
    """
    # Вариант 1: Если есть эндпоинт регистрации
    # client.post("/api/register", json={"username": "test", "password": "test123"})
    # r = client.post("/api/token", data={"username": "test", "password": "test123"})
    # token = r.json()["access_token"]

    # Вариант 2: Прямая генерация JWT (быстрее)
    from jose import jwt
    from config import settings
    token = jwt.encode(
        {"sub": "test_user", "user_id": 1},
        settings.SECRET_KEY,
        algorithm="HS256"
    )
    return {"Authorization": f"Bearer {token}"}


# =====================================================================
# Фикстура тестовых данных
# =====================================================================
@pytest.fixture
def test_project(client, auth_headers):
    """Создаёт тестовый проект для использования в других тестах."""
    r = client.post("/api/projects/", json={
        "name": "Тестовый проект",
        "vk_group_id": 123456,
    }, headers=auth_headers)
    return r.json()
```

## Важно

- `scope="function"` — чистая БД на каждый тест (изоляция)
- `StaticPool` — нужен для SQLite in-memory с потоками
- `dependency_overrides` — подменяет `get_db` на тестовую сессию
- Адаптировать `auth_headers` под реальную схему авторизации проекта
- Если проект использует Redis — мокать через `unittest.mock.patch`
