"""
Тесты для функционала мульти-команд (teams).
Проверяет: Pydantic-валидатор, CRUD-логику, миграцию данных.

Запуск: python test_teams.py
"""

import json
import sys
import os

# Добавляем текущую директорию в sys.path для корректных импортов
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
from schemas import Project as ProjectSchema
from db_migrations.projects import _migrate_team_to_teams
import models

# ===================================================================
# УТИЛИТЫ
# ===================================================================

class TestResult:
    """Простой класс для отслеживания результатов тестов."""
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []

    def ok(self, name: str):
        self.passed += 1
        print(f"  ✅ {name}")

    def fail(self, name: str, detail: str):
        self.failed += 1
        self.errors.append(f"{name}: {detail}")
        print(f"  ❌ {name} — {detail}")

    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"Итого: {total} тестов | ✅ {self.passed} пройдено | ❌ {self.failed} провалено")
        if self.errors:
            print("\nПроваленные тесты:")
            for e in self.errors:
                print(f"  - {e}")
        print(f"{'='*60}")
        return self.failed == 0


results = TestResult()


def create_test_engine():
    """Создаёт in-memory SQLite движок для тестов."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    # Регистрируем lower() для корректной работы с кириллицей
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        dbapi_connection.create_function("lower", 1, lambda s: s.lower() if s else s)

    # Создаём ТОЛЬКО таблицу projects (не все таблицы — у некоторых есть FK-зависимости)
    models.Project.__table__.create(engine, checkfirst=True)

    return engine


def create_test_session(engine):
    """Создаёт сессию для тестов."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


# ===================================================================
# ТЕСТЫ: Pydantic-валидатор parse_json_teams
# ===================================================================

def test_pydantic_schema():
    """Тестирует Pydantic-валидатор parse_json_teams."""
    print("\n📋 Тесты Pydantic-схемы (parse_json_teams)")
    print("-" * 50)

    # 1. JSON-строка парсится в список
    base = _base_project_data()
    base["teams"] = json.dumps(["Команда А", "Сеть Н"])
    p = ProjectSchema(**base)
    if p.teams == ["Команда А", "Сеть Н"]:
        results.ok("JSON-строка -> список")
    else:
        results.fail("JSON-строка -> список", f"Получено: {p.teams}")

    # 2. Пустая строка -> пустой список
    base["teams"] = ""
    p = ProjectSchema(**base)
    if p.teams == []:
        results.ok("Пустая строка -> []")
    else:
        results.fail("Пустая строка -> []", f"Получено: {p.teams}")

    # 3. None -> пустой список
    base["teams"] = None
    p = ProjectSchema(**base)
    if p.teams == []:
        results.ok("None -> []")
    else:
        results.fail("None -> []", f"Получено: {p.teams}")

    # 4. Уже список — без изменений
    base["teams"] = ["Прямой", "Список"]
    p = ProjectSchema(**base)
    if p.teams == ["Прямой", "Список"]:
        results.ok("Список -> проходит без изменений")
    else:
        results.fail("Список -> проходит без изменений", f"Получено: {p.teams}")

    # 5. Поле отсутствует -> дефолт []
    base.pop("teams", None)
    p = ProjectSchema(**base)
    if p.teams == []:
        results.ok("Поле отсутствует -> дефолт []")
    else:
        results.fail("Поле отсутствует -> дефолт []", f"Получено: {p.teams}")

    # 6. Некорректный JSON -> пустой список
    base["teams"] = "это не json"
    p = ProjectSchema(**base)
    if p.teams == []:
        results.ok("Некорректный JSON -> []")
    else:
        results.fail("Некорректный JSON -> []", f"Получено: {p.teams}")

    # 7. JSON-массив с одним элементом
    base["teams"] = json.dumps(["Единственная"])
    p = ProjectSchema(**base)
    if p.teams == ["Единственная"]:
        results.ok("JSON с одним элементом -> [\"Единственная\"]")
    else:
        results.fail("JSON с одним элементом", f"Получено: {p.teams}")

    # 8. Обратная совместимость: старое поле team по-прежнему принимается
    base["teams"] = []
    base["team"] = "Старая команда"
    p = ProjectSchema(**base)
    if p.team == "Старая команда":
        results.ok("Старое поле team по-прежнему работает")
    else:
        results.fail("Старое поле team", f"Получено: {p.team}")


# ===================================================================
# ТЕСТЫ: CRUD — update_project_settings (логика сериализации teams)
# ===================================================================

def test_crud_teams_serialization():
    """Тестирует CRUD-логику сериализации teams в JSON и синхронизацию с team."""
    print("\n📋 Тесты CRUD (сериализация teams)")
    print("-" * 50)

    engine = create_test_engine()
    db = create_test_session(engine)

    try:
        # Создаём тестовый проект напрямую в БД
        project_id = "test-crud-1"
        db.execute(text(
            "INSERT INTO projects (id, name, vkProjectId, vkGroupShortName, vkGroupName, vkLink, archived) "
            "VALUES (:id, :name, :vkid, :short, :gname, :link, 0)"
        ), {
            "id": project_id, "name": "Тест CRUD", "vkid": "123",
            "short": "test", "gname": "Тест", "link": "https://vk.com/test"
        })
        db.commit()

        # Импортируем CRUD-функцию
        from crud.project_crud import update_project_settings

        # 1. Обновляем teams — должно сохраниться как JSON
        schema = ProjectSchema(
            id=project_id, name="Тест CRUD", vkProjectId="123",
            vkGroupShortName="test", vkGroupName="Тест", vkLink="https://vk.com/test",
            teams=["Команда А", "Сеть Н"]
        )
        updated = update_project_settings(db, schema)

        # Проверяем, что teams сохранено как JSON-строка в БД
        raw = db.execute(text("SELECT teams, team FROM projects WHERE id = :id"), {"id": project_id}).fetchone()
        raw_teams = raw[0]
        raw_team = raw[1]

        parsed = json.loads(raw_teams) if raw_teams else []
        if parsed == ["Команда А", "Сеть Н"]:
            results.ok("teams сохранено как JSON-строка в БД")
        else:
            results.fail("teams -> JSON", f"В БД: {raw_teams}, распарсено: {parsed}")

        # 2. Проверяем синхронизацию: team = teams[0]
        if raw_team == "Команда А":
            results.ok("team синхронизирован с teams[0]")
        else:
            results.fail("team синхронизация", f"Ожидалось 'Команда А', получено: {raw_team}")

        # 3. Очищаем teams -> team тоже должен стать None
        schema.teams = []
        update_project_settings(db, schema)
        raw = db.execute(text("SELECT teams, team FROM projects WHERE id = :id"), {"id": project_id}).fetchone()
        parsed = json.loads(raw[0]) if raw[0] else []
        if parsed == []:
            results.ok("Пустой teams -> JSON '[]' в БД")
        else:
            results.fail("Пустой teams", f"В БД: {raw[0]}")

        if raw[1] is None:
            results.ok("Пустой teams -> team = None")
        else:
            results.fail("team при пустом teams", f"Ожидалось None, получено: {raw[1]}")

        # 4. Пустые строки фильтруются
        schema.teams = ["Реальная", "", "  ", "Ещё одна"]
        update_project_settings(db, schema)
        raw = db.execute(text("SELECT teams FROM projects WHERE id = :id"), {"id": project_id}).fetchone()
        parsed = json.loads(raw[0]) if raw[0] else []
        if parsed == ["Реальная", "Ещё одна"]:
            results.ok("Пустые строки отфильтрованы из teams")
        else:
            results.fail("Фильтрация пустых строк", f"Получено: {parsed}")

    finally:
        db.close()


# ===================================================================
# ТЕСТЫ: Миграция team -> teams
# ===================================================================

def test_migration_team_to_teams():
    """Тестирует функцию миграции _migrate_team_to_teams."""
    print("\n📋 Тесты миграции (team -> teams)")
    print("-" * 50)

    engine = create_test_engine()

    with engine.connect() as conn:
        # Подготовка: вставляем проекты с разными состояниями
        conn.execute(text(
            "INSERT INTO projects (id, name, vkProjectId, vkGroupShortName, vkGroupName, vkLink, archived, team, teams) "
            "VALUES (:id, :name, :vkid, :short, :gname, :link, 0, :team, :teams)"
        ), [
            # 1. Есть team, нет teams -> должен мигрировать
            {"id": "p1", "name": "Проект 1", "vkid": "1", "short": "p1", "gname": "П1", "link": "vk.com/p1",
             "team": "Команда А", "teams": None},
            # 2. Есть team, teams уже заполнен -> НЕ трогать
            {"id": "p2", "name": "Проект 2", "vkid": "2", "short": "p2", "gname": "П2", "link": "vk.com/p2",
             "team": "Команда Б", "teams": json.dumps(["Команда Б", "Команда В"])},
            # 3. team пустой, teams пустой -> НЕ трогать
            {"id": "p3", "name": "Проект 3", "vkid": "3", "short": "p3", "gname": "П3", "link": "vk.com/p3",
             "team": None, "teams": None},
            # 4. Есть team, teams = пустая строка -> должен мигрировать
            {"id": "p4", "name": "Проект 4", "vkid": "4", "short": "p4", "gname": "П4", "link": "vk.com/p4",
             "team": "Сеть Н", "teams": ""},
        ])
        conn.commit()

    # Запускаем миграцию
    _migrate_team_to_teams(engine)

    with engine.connect() as conn:
        rows = conn.execute(text("SELECT id, team, teams FROM projects ORDER BY id")).fetchall()
        data = {r[0]: {"team": r[1], "teams": r[2]} for r in rows}

    # 1. p1: team="Команда А" -> teams=["Команда А"]
    p1_teams = json.loads(data["p1"]["teams"]) if data["p1"]["teams"] else []
    if p1_teams == ["Команда А"]:
        results.ok("p1: team мигрирован в teams")
    else:
        results.fail("p1 миграция", f"Ожидалось ['Команда А'], получено: {p1_teams}")

    # 2. p2: teams уже был заполнен -> не изменился
    p2_teams = json.loads(data["p2"]["teams"]) if data["p2"]["teams"] else []
    if p2_teams == ["Команда Б", "Команда В"]:
        results.ok("p2: существующий teams не тронут")
    else:
        results.fail("p2 не тронут", f"Ожидалось ['Команда Б', 'Команда В'], получено: {p2_teams}")

    # 3. p3: team=None -> teams остался None
    if data["p3"]["teams"] is None:
        results.ok("p3: пустой team -> teams остался None")
    else:
        results.fail("p3 без team", f"Ожидалось None, получено: {data['p3']['teams']}")

    # 4. p4: team="Сеть Н", teams="" -> мигрирован
    p4_teams = json.loads(data["p4"]["teams"]) if data["p4"]["teams"] else []
    if p4_teams == ["Сеть Н"]:
        results.ok("p4: team мигрирован (teams была пустой строкой)")
    else:
        results.fail("p4 миграция", f"Ожидалось ['Сеть Н'], получено: {p4_teams}")


# ===================================================================
# ТЕСТЫ: Чтение из БД через Pydantic (from_attributes)
# ===================================================================

def test_schema_from_db_model():
    """Тестирует, что Pydantic-схема корректно парсит данные из SQLAlchemy-модели."""
    print("\n📋 Тесты чтения из БД через Pydantic")
    print("-" * 50)

    engine = create_test_engine()
    db = create_test_session(engine)

    try:
        # 1. Модель с JSON-строкой teams — валидатор должен распарсить
        db.execute(text(
            "INSERT INTO projects (id, name, vkProjectId, vkGroupShortName, vkGroupName, vkLink, archived, teams) "
            "VALUES (:id, :name, :vkid, :short, :gname, :link, 0, :teams)"
        ), {
            "id": "read-1", "name": "Чтение 1", "vkid": "1",
            "short": "r1", "gname": "Р1", "link": "vk.com/r1",
            "teams": json.dumps(["Альфа", "Бета"])
        })
        db.commit()

        db_project = db.query(models.Project).filter(models.Project.id == "read-1").first()
        schema = ProjectSchema.model_validate(db_project)

        if schema.teams == ["Альфа", "Бета"]:
            results.ok("from_attributes: JSON-строка -> список в схеме")
        else:
            results.fail("from_attributes с JSON", f"Получено: {schema.teams}")

        # 2. Модель с None teams — дефолт []
        db.execute(text(
            "INSERT INTO projects (id, name, vkProjectId, vkGroupShortName, vkGroupName, vkLink, archived) "
            "VALUES (:id, :name, :vkid, :short, :gname, :link, 0)"
        ), {
            "id": "read-2", "name": "Чтение 2", "vkid": "2",
            "short": "r2", "gname": "Р2", "link": "vk.com/r2"
        })
        db.commit()

        db_project2 = db.query(models.Project).filter(models.Project.id == "read-2").first()
        schema2 = ProjectSchema.model_validate(db_project2)

        if schema2.teams == []:
            results.ok("from_attributes: None teams -> []")
        else:
            results.fail("from_attributes с None", f"Получено: {schema2.teams}")

    finally:
        db.close()


# ===================================================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ===================================================================

def _base_project_data() -> dict:
    """Возвращает минимальный набор данных для создания ProjectSchema."""
    return {
        "id": "test-1",
        "name": "Тестовый проект",
        "vkProjectId": "12345",
        "vkGroupShortName": "test_group",
        "vkGroupName": "Тестовая группа",
        "vkLink": "https://vk.com/test_group"
    }


# ===================================================================
# ТОЧКА ВХОДА
# ===================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 Тесты мульти-команд (teams)")
    print("=" * 60)

    test_pydantic_schema()
    test_crud_teams_serialization()
    test_migration_team_to_teams()
    test_schema_from_db_model()

    success = results.summary()
    sys.exit(0 if success else 1)
