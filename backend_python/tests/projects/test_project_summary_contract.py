"""
Интеграционные тесты ProjectSummary / Project — Model-Field Contract.

ЗАЧЕМ ЭТОТ ТЕСТ:
    После рефакторинга Project → ProjectSummary + Project(ProjectSummary)
    нужно гарантировать, что:
      1. POST /api/getInitialData → projects содержат ТОЛЬКО поля ProjectSummary
      2. POST /api/getProjectDetails → содержит ВСЕ поля Project (включая notes, team, variables)
      3. POST /api/forceRefreshProjects → тоже возвращает ProjectSummary
      4. Pydantic-валидаторы (parse_json_teams, parse_json_tokens) работают корректно
      5. Наследование ProjectSummary → Project не сломалось

ПАТТЕРН:
    1. In-memory SQLite + StaticPool (как в dlvry gold standard)
    2. Создаём нужные таблицы из ORM моделей
    3. Подмена get_db через dependency_overrides
    4. Реальный TestClient → ловит AttributeError, TypeError, схемные несоответствия
"""

import sys
import os
import json
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from database import Base, get_db
from main import app
from models_library.projects import Project as ProjectORM


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Фикстуры
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@pytest.fixture(scope="function")
def test_db():
    """In-memory SQLite с таблицей projects."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Создаём ВСЕ таблицы — чтобы FK и зависимые модели не падали
    Base.metadata.create_all(bind=engine)

    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestSession()
    yield session
    session.close()
    engine.dispose()


@pytest.fixture(scope="function")
def client(test_db):
    """TestClient с подменённой зависимостью get_db."""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


def _insert_project(db, **overrides) -> ProjectORM:
    """Вставляет тестовый проект и возвращает ORM объект."""
    defaults = dict(
        id="proj-test-1",
        name="Тестовый проект",
        vkProjectId="123456",
        vkGroupShortName="testgroup",
        vkGroupName="Тестовая группа",
        vkLink="https://vk.com/testgroup",
        avatar_url="https://vk.com/avatar.jpg",
        team="Команда А",
        teams='["Команда А", "Команда Б"]',
        disabled=False,
        archived=False,
        notes="Заметки проекта",
        variables='{"key": "value"}',
        vk_confirmation_code="abc123",
        communityToken="test-token-secret",
        additional_community_tokens='["token1", "token2"]',
        sort_order=1,
        last_market_update="2026-01-01",
        dlvry_affiliate_id="aff-1",
    )
    defaults.update(overrides)
    project = ProjectORM(**defaults)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# POST /api/getInitialData — возвращает ProjectSummary[]
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestGetInitialData:
    """
    Тесты: POST /api/getInitialData
    response_model = InitialDataResponse → projects: List[ProjectSummary]

    Ловит: AttributeError на модели, несовпадение полей схемы,
           утечку полных данных (notes, variables) в лёгкий ответ.
    """

    def test_smoke_returns_200(self, client, test_db):
        """Эндпоинт не падает с 500 — базовая связка router→service→CRUD→model→schema."""
        _insert_project(test_db)
        r = client.post("/api/getInitialData")
        assert r.status_code == 200, (
            f"Ожидали 200, получили {r.status_code}. Тело: {r.text[:500]}. "
            f"Скорее всего несоответствие полей модели / CRUD / Pydantic Schema."
        )

    def test_empty_returns_200(self, client, test_db):
        """Пустая таблица → 200 с пустым списком проектов."""
        r = client.post("/api/getInitialData")
        assert r.status_code == 200
        data = r.json()
        assert data["projects"] == []

    def test_response_has_required_top_level_fields(self, client, test_db):
        """JSON содержит все поля InitialDataResponse."""
        _insert_project(test_db)
        r = client.post("/api/getInitialData")
        data = r.json()
        for field in ["projects", "allPosts", "suggestedPostCounts"]:
            assert field in data, f"Поле '{field}' отсутствует в InitialDataResponse"

    def test_project_summary_has_expected_fields(self, client, test_db):
        """Каждый проект содержит все поля ProjectSummary."""
        _insert_project(test_db)
        r = client.post("/api/getInitialData")
        projects = r.json()["projects"]
        assert len(projects) >= 1

        p = projects[0]
        summary_fields = [
            "id", "name", "vkProjectId", "vkGroupShortName", "vkGroupName",
            "vkLink", "avatar_url", "teams", "disabled", "archived",
            "sort_order", "communityToken", "vk_confirmation_code",
            "dlvry_affiliate_id",
        ]
        for field in summary_fields:
            assert field in p, (
                f"Поле '{field}' отсутствует в ProjectSummary. "
                f"Фронтенд ожидает его для sidebar/фильтров. "
                f"Имеющиеся: {list(p.keys())}"
            )

    def test_project_summary_excludes_full_fields(self, client, test_db):
        """ProjectSummary НЕ содержит поля, которые есть только в полном Project.

        Это ключевой тест рефакторинга — если notes/variables/additional_community_tokens
        утекают в getInitialData, значит response_model не работает как ProjectSummary.
        """
        _insert_project(test_db, notes="секретные заметки", variables='{"secret": true}')
        r = client.post("/api/getInitialData")
        p = r.json()["projects"][0]

        full_only_fields = ["notes", "team", "variables", "additional_community_tokens", "last_market_update"]
        for field in full_only_fields:
            assert field not in p, (
                f"Поле '{field}' УТЕКЛО в ProjectSummary (getInitialData). "
                f"Это полное поле Project — не должно быть в лёгком ответе. "
                f"response_model=InitialDataResponse должен фильтровать."
            )

    def test_project_summary_values_correct(self, client, test_db):
        """Значения полей маппятся корректно (не None, не MagicMock)."""
        _insert_project(test_db)
        r = client.post("/api/getInitialData")
        p = r.json()["projects"][0]

        assert p["id"] == "proj-test-1"
        assert p["name"] == "Тестовый проект"
        assert p["vkProjectId"] == "123456"
        assert p["vkGroupShortName"] == "testgroup"
        assert p["vkGroupName"] == "Тестовая группа"
        assert p["vkLink"] == "https://vk.com/testgroup"
        assert p["avatar_url"] == "https://vk.com/avatar.jpg"
        assert p["disabled"] is False
        assert p["archived"] is False
        assert p["sort_order"] == 1
        assert p["dlvry_affiliate_id"] == "aff-1"

    def test_teams_json_parsed(self, client, test_db):
        """Валидатор parse_json_teams парсит JSON-строку в список."""
        _insert_project(test_db, teams='["Alpha", "Beta"]')
        r = client.post("/api/getInitialData")
        p = r.json()["projects"][0]
        assert p["teams"] == ["Alpha", "Beta"]

    def test_teams_empty_string(self, client, test_db):
        """Пустая строка teams → пустой список."""
        _insert_project(test_db, teams="")
        r = client.post("/api/getInitialData")
        p = r.json()["projects"][0]
        assert p["teams"] == []

    def test_teams_none(self, client, test_db):
        """teams=None → пустой список."""
        _insert_project(test_db, teams=None)
        r = client.post("/api/getInitialData")
        p = r.json()["projects"][0]
        assert p["teams"] == []

    def test_archived_projects_excluded(self, client, test_db):
        """Архивированные проекты НЕ попадают в getInitialData (фильтр в CRUD)."""
        _insert_project(test_db, id="active", archived=False)
        _insert_project(test_db, id="archived", archived=True)
        r = client.post("/api/getInitialData")
        project_ids = [p["id"] for p in r.json()["projects"]]
        assert "active" in project_ids
        assert "archived" not in project_ids


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# POST /api/forceRefreshProjects — тоже ProjectSummary[]
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestForceRefreshProjects:
    """
    Тесты: POST /api/forceRefreshProjects
    response_model = ForceRefreshResponse → projects: List[ProjectSummary]
    """

    def test_smoke_returns_200(self, client, test_db):
        """Эндпоинт не падает."""
        _insert_project(test_db)
        r = client.post("/api/forceRefreshProjects")
        assert r.status_code == 200, f"forceRefresh вернул {r.status_code}: {r.text[:500]}"

    def test_empty_returns_200(self, client, test_db):
        """Пустая таблица → 200."""
        r = client.post("/api/forceRefreshProjects")
        assert r.status_code == 200
        assert r.json()["projects"] == []

    def test_response_has_required_fields(self, client, test_db):
        """Ответ содержит projects и suggestedPostCounts."""
        _insert_project(test_db)
        r = client.post("/api/forceRefreshProjects")
        data = r.json()
        assert "projects" in data
        assert "suggestedPostCounts" in data

    def test_projects_are_summaries_not_full(self, client, test_db):
        """forceRefresh тоже возвращает ProjectSummary (без notes/variables)."""
        _insert_project(test_db, notes="заметки", variables='{"v": 1}')
        r = client.post("/api/forceRefreshProjects")
        p = r.json()["projects"][0]

        for field in ["notes", "team", "variables", "additional_community_tokens", "last_market_update"]:
            assert field not in p, (
                f"Поле '{field}' утекло в forceRefreshProjects. "
                f"ForceRefreshResponse.projects должен быть List[ProjectSummary]."
            )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# POST /api/getProjectDetails — полный Project
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestGetProjectDetails:
    """
    Тесты: POST /api/getProjectDetails
    response_model = Project (полная версия, наследует ProjectSummary)

    Ловит: AttributeError на модели, отсутствие полных полей (notes, variables, etc.)
    """

    def test_smoke_returns_200(self, client, test_db):
        """Эндпоинт не падает с 500."""
        _insert_project(test_db)
        r = client.post("/api/getProjectDetails", json={"projectId": "proj-test-1"})
        assert r.status_code == 200, f"getProjectDetails вернул {r.status_code}: {r.text[:500]}"

    def test_404_for_missing_project(self, client, test_db):
        """Несуществующий проект → 404."""
        r = client.post("/api/getProjectDetails", json={"projectId": "nonexistent"})
        assert r.status_code == 404

    def test_full_project_has_all_summary_fields(self, client, test_db):
        """Полный Project содержит ВСЕ поля ProjectSummary (наследование)."""
        _insert_project(test_db)
        r = client.post("/api/getProjectDetails", json={"projectId": "proj-test-1"})
        p = r.json()

        summary_fields = [
            "id", "name", "vkProjectId", "vkGroupShortName", "vkGroupName",
            "vkLink", "avatar_url", "teams", "disabled", "archived",
            "sort_order", "communityToken", "vk_confirmation_code",
            "dlvry_affiliate_id",
        ]
        for field in summary_fields:
            assert field in p, (
                f"Поле '{field}' отсутствует в полном Project. "
                f"Project наследует ProjectSummary — поле должно быть."
            )

    def test_full_project_has_extended_fields(self, client, test_db):
        """Полный Project содержит поля, которых НЕТ в ProjectSummary."""
        _insert_project(test_db)
        r = client.post("/api/getProjectDetails", json={"projectId": "proj-test-1"})
        p = r.json()

        extended_fields = ["notes", "team", "variables", "additional_community_tokens", "last_market_update"]
        for field in extended_fields:
            assert field in p, (
                f"Поле '{field}' отсутствует в полном Project. "
                f"Это расширенное поле — должно быть в getProjectDetails."
            )

    def test_full_project_values_correct(self, client, test_db):
        """Значения полных полей маппятся корректно."""
        _insert_project(test_db)
        r = client.post("/api/getProjectDetails", json={"projectId": "proj-test-1"})
        p = r.json()

        assert p["notes"] == "Заметки проекта"
        assert p["team"] == "Команда А"
        assert p["variables"] == '{"key": "value"}'
        assert p["last_market_update"] == "2026-01-01"

    def test_additional_community_tokens_parsed(self, client, test_db):
        """Валидатор parse_json_tokens парсит JSON-строку в список."""
        _insert_project(test_db, additional_community_tokens='["tok-a", "tok-b"]')
        r = client.post("/api/getProjectDetails", json={"projectId": "proj-test-1"})
        p = r.json()
        assert p["additional_community_tokens"] == ["tok-a", "tok-b"]

    def test_additional_community_tokens_empty(self, client, test_db):
        """Пустая строка → пустой список."""
        _insert_project(test_db, additional_community_tokens="")
        r = client.post("/api/getProjectDetails", json={"projectId": "proj-test-1"})
        p = r.json()
        assert p["additional_community_tokens"] == []


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Pydantic-схема контракт (unit-тесты без HTTP)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestPydanticSchemaContract:
    """
    Юнит-тесты Pydantic моделей ProjectSummary и Project.
    Не требуют БД — проверяют саму схему.
    """

    def test_project_inherits_project_summary(self):
        """Project ДОЛЖЕН наследовать ProjectSummary."""
        from schemas.models.projects import Project, ProjectSummary
        assert issubclass(Project, ProjectSummary), (
            "Project должен наследовать ProjectSummary. "
            "Без наследования getProjectDetails не вернёт поля сайдбара."
        )

    def test_project_summary_fields(self):
        """ProjectSummary содержит ровно нужные поля (не больше, не меньше)."""
        from schemas.models.projects import ProjectSummary
        fields = set(ProjectSummary.model_fields.keys())
        expected = {
            "id", "name", "vkProjectId", "vkGroupShortName", "vkGroupName",
            "vkLink", "avatar_url", "teams", "disabled", "archived",
            "sort_order", "communityToken", "vk_confirmation_code",
            "dlvry_affiliate_id",
        }
        assert fields == expected, (
            f"Поля ProjectSummary изменились!\n"
            f"Лишние: {fields - expected}\n"
            f"Отсутствующие: {expected - fields}"
        )

    def test_project_extra_fields(self):
        """Project добавляет ровно 7 полей поверх ProjectSummary."""
        from schemas.models.projects import Project, ProjectSummary
        summary_fields = set(ProjectSummary.model_fields.keys())
        project_fields = set(Project.model_fields.keys())
        extra = project_fields - summary_fields
        expected_extra = {"notes", "team", "variables", "additional_community_tokens", "last_market_update", "dlvry_affiliates_count", "dlvry_affiliate_ids"}
        assert extra == expected_extra, (
            f"Расширенные поля Project изменились!\n"
            f"Ожидали: {expected_extra}\n"
            f"Получили: {extra}"
        )

    def test_project_summary_from_orm(self):
        """ProjectSummary.model_validate создаёт объект из dict (from_attributes=True)."""
        from schemas.models.projects import ProjectSummary
        data = {
            "id": "p1", "name": "Test", "vkProjectId": "100",
            "vkGroupShortName": "test", "vkGroupName": "Test",
            "vkLink": "https://vk.com/test",
            "teams": '["A", "B"]',  # JSON-строка — валидатор должен распарсить
        }
        obj = ProjectSummary.model_validate(data)
        assert obj.teams == ["A", "B"]
        assert obj.id == "p1"

    def test_project_from_orm_with_tokens(self):
        """Project.model_validate парсит additional_community_tokens из JSON-строки."""
        from schemas.models.projects import Project
        data = {
            "id": "p1", "name": "Test", "vkProjectId": "100",
            "vkGroupShortName": "t", "vkGroupName": "T", "vkLink": "https://vk.com/t",
            "teams": "[]",
            "additional_community_tokens": '["tok1", "tok2"]',
            "notes": "hello",
        }
        obj = Project.model_validate(data)
        assert obj.additional_community_tokens == ["tok1", "tok2"]
        assert obj.notes == "hello"

    def test_initial_data_response_uses_project_summary(self):
        """InitialDataResponse.projects — это List[ProjectSummary], не List[Project]."""
        from schemas.api_responses import InitialDataResponse
        import typing
        field_info = InitialDataResponse.model_fields["projects"]
        # Проверяем что тип аннотации содержит ProjectSummary
        annotation_str = str(field_info.annotation)
        assert "ProjectSummary" in annotation_str, (
            f"InitialDataResponse.projects должен быть List[ProjectSummary], "
            f"а получили: {annotation_str}"
        )

    def test_force_refresh_response_uses_project_summary(self):
        """ForceRefreshResponse.projects — тоже List[ProjectSummary]."""
        from schemas.api_responses import ForceRefreshResponse
        field_info = ForceRefreshResponse.model_fields["projects"]
        annotation_str = str(field_info.annotation)
        assert "ProjectSummary" in annotation_str, (
            f"ForceRefreshResponse.projects должен быть List[ProjectSummary], "
            f"а получили: {annotation_str}"
        )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Контрактные тесты (Pydantic ↔ TypeScript)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TestPydanticTypescriptContract:
    """
    Контракт: поля Pydantic ProjectSummary/Project должны совпадать
    с TypeScript интерфейсами ProjectSummary/Project.

    Если фронтенд-разработчик добавит поле в TS-интерфейс,
    и бэкенд его не возвращает — эти тесты ловят рассинхронизацию.
    """

    def test_project_summary_fields_match_typescript(self):
        """Поля Pydantic ProjectSummary совпадают c TypeScript ProjectSummary."""
        from schemas.models.projects import ProjectSummary

        # Поля из shared/types/index.ts → interface ProjectSummary
        ts_fields = {
            "id", "name", "teams", "disabled", "archived", "sort_order",
            "vkGroupName", "vkGroupShortName", "vkLink", "vkProjectId",
            "avatar_url", "communityToken", "vk_confirmation_code",
            "dlvry_affiliate_id",
        }

        pydantic_fields = set(ProjectSummary.model_fields.keys())

        missing_in_pydantic = ts_fields - pydantic_fields
        missing_in_ts = pydantic_fields - ts_fields

        assert not missing_in_pydantic, (
            f"TypeScript ProjectSummary имеет поля, которых нет в Pydantic: {missing_in_pydantic}. "
            f"Добавьте их в schemas/models/projects.py → ProjectSummary."
        )
        assert not missing_in_ts, (
            f"Pydantic ProjectSummary имеет поля, которых нет в TypeScript: {missing_in_ts}. "
            f"Добавьте их в shared/types/index.ts → ProjectSummary."
        )

    def test_project_extra_fields_match_typescript(self):
        """Расширенные поля Pydantic Project совпадают c TypeScript Project extends ProjectSummary."""
        from schemas.models.projects import Project, ProjectSummary

        # Поля из shared/types/index.ts → interface Project extends ProjectSummary
        ts_extra = {"team", "notes", "additional_community_tokens", "variables", "last_market_update", "dlvry_affiliates_count", "dlvry_affiliate_ids"}

        pydantic_extra = set(Project.model_fields.keys()) - set(ProjectSummary.model_fields.keys())

        assert pydantic_extra == ts_extra, (
            f"Расширенные поля Project не совпадают!\n"
            f"Pydantic extra: {pydantic_extra}\n"
            f"TypeScript extra: {ts_extra}\n"
            f"Разница: TS-only={ts_extra - pydantic_extra}, Pydantic-only={pydantic_extra - ts_extra}"
        )
