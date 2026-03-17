"""
ИНТЕГРАЦИОННЫЕ ТЕСТЫ: model-field contract для getSettings / saveSettings
автоматизации конкурса отзывов.

Проверяем что поле targetCountMode (exact | minimum | maximum) корректно:
  - присутствует в ответах API
  - сохраняется в БД и читается обратно (roundtrip)
  - имеет правильный дефолт ('exact')
  - маппится между Pydantic-схемой и ORM-моделью

Используем реальную SQLite in-memory БД (StaticPool) + FastAPI TestClient.
Мокаем ТОЛЬКО contest_scheduler.sync_contest_post (иначе упадёт на VK API).
"""

import sys
import os
import pytest
from unittest.mock import patch, MagicMock

# Добавляем корень бэкенда в sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from database import get_db, Base
from main import app
from models_library.automations import ReviewContest
from models_library.projects import Project


# =============================================================================
# Константы
# =============================================================================

TEST_PROJECT_ID = "test-project-001"

# Базовый payload для saveSettings
BASE_PAYLOAD = {
    "projectId": TEST_PROJECT_ID,
    "isActive": True,
    "keywords": "#отзыв@test",
    "startDate": "2025-01-01",
    "finishCondition": "count",
    "targetCount": 10,
    "targetCountMode": "exact",
    "finishDate": "",
    "finishDayOfWeek": 1,
    "finishTime": "10:00",
    "templateComment": "Спасибо! Ваш номер: {number}",
    "templateWinnerPost": "Поздравляем!\n{winners_list}",
    "templateDm": "Вы выиграли! Промокод: {promo_code}",
    "templateErrorComment": "Напишите нам в сообщения!",
    "winnerPostImages": [],
}

# Обязательные поля, которые ВСЕГДА должны быть в ответе
REQUIRED_RESPONSE_FIELDS = {
    "projectId",
    "isActive",
    "keywords",
    "startDate",
    "finishCondition",
    "targetCount",
    "targetCountMode",
    "finishDate",
    "finishDayOfWeek",
    "finishTime",
    "templateComment",
    "templateWinnerPost",
    "templateDm",
    "templateErrorComment",
    "winnerPostImages",
}


# =============================================================================
# Фикстуры
# =============================================================================

@pytest.fixture(scope="function")
def test_db():
    """
    Создаёт in-memory SQLite БД с StaticPool.
    Каждый тест получает чистую БД.
    """
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Создаём все таблицы из моделей
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        # Создаём тестовый проект (FK для review_contests)
        project = Project(
            id=TEST_PROJECT_ID,
            vkProjectId="123456",
            vkGroupShortName="test_group",
            vkGroupName="Тестовая группа",
            vkLink="https://vk.com/test_group",
            name="Тестовый проект",
        )
        db.add(project)
        db.commit()
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(test_db):
    """
    TestClient с подменённым get_db на тестовую БД.
    raise_server_exceptions=False — чтобы 500 не превращались в исключения.
    """
    def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db
    c = TestClient(app, raise_server_exceptions=False)
    yield c
    app.dependency_overrides.clear()


# =============================================================================
# Хелпер: вызов saveSettings с патчем sync_contest_post
# =============================================================================

def _save_settings(client, payload: dict) -> dict:
    """Вызывает saveSettings, мокая sync_contest_post. Возвращает response json."""
    with patch("routers.automations.contest_scheduler.sync_contest_post"):
        resp = client.post("/api/automations/reviews/saveSettings", json=payload)
    return resp


def _get_settings(client, project_id: str = TEST_PROJECT_ID) -> dict:
    """Вызывает getSettings."""
    return client.post(
        "/api/automations/reviews/getSettings",
        json={"projectId": project_id},
    )


# =============================================================================
# 1. TestSmoke — базовая проверка (200, не 500)
# =============================================================================

class TestSmoke:
    """Минимальная проверка работоспособности эндпоинтов."""

    @patch("routers.automations.contest_scheduler.sync_contest_post")
    def test_save_settings_returns_200(self, mock_sync, client, test_db):
        """Сохранение настроек → 200."""
        resp = client.post("/api/automations/reviews/saveSettings", json=BASE_PAYLOAD)
        assert resp.status_code == 200, f"Ожидали 200, получили {resp.status_code}: {resp.text}"

    def test_get_settings_default_returns_200(self, client, test_db):
        """Получение настроек без существующего конкурса → 200 с дефолтами."""
        resp = _get_settings(client)
        assert resp.status_code == 200, f"Ожидали 200, получили {resp.status_code}: {resp.text}"


# =============================================================================
# 2. TestFieldContract — поля в ответе
# =============================================================================

class TestFieldContract:
    """Проверяем наличие обязательных полей в ответах API."""

    def test_get_settings_response_has_target_count_mode(self, client, test_db):
        """targetCountMode присутствует в ответе getSettings (дефолтный)."""
        resp = _get_settings(client)
        assert resp.status_code == 200
        data = resp.json()
        assert "targetCountMode" in data, (
            f"Поле targetCountMode отсутствует в ответе getSettings. Ключи: {list(data.keys())}"
        )

    def test_save_settings_response_has_all_fields(self, client, test_db):
        """Все обязательные поля присутствуют в ответе saveSettings."""
        resp = _save_settings(client, BASE_PAYLOAD)
        assert resp.status_code == 200
        data = resp.json()
        missing = REQUIRED_RESPONSE_FIELDS - set(data.keys())
        assert not missing, f"В ответе saveSettings отсутствуют поля: {missing}"


# =============================================================================
# 3. TestTargetCountModeRoundtrip — значения проходят туда-обратно
# =============================================================================

class TestTargetCountModeRoundtrip:
    """Save → Get roundtrip для каждого допустимого значения targetCountMode."""

    def test_exact_mode_roundtrip(self, client, test_db):
        """save с exact → get → exact."""
        payload = {**BASE_PAYLOAD, "targetCountMode": "exact"}
        save_resp = _save_settings(client, payload)
        assert save_resp.status_code == 200
        assert save_resp.json()["targetCountMode"] == "exact"

        get_resp = _get_settings(client)
        assert get_resp.status_code == 200
        assert get_resp.json()["targetCountMode"] == "exact"

    def test_minimum_mode_roundtrip(self, client, test_db):
        """save с minimum → get → minimum."""
        payload = {**BASE_PAYLOAD, "targetCountMode": "minimum"}
        save_resp = _save_settings(client, payload)
        assert save_resp.status_code == 200
        assert save_resp.json()["targetCountMode"] == "minimum"

        get_resp = _get_settings(client)
        assert get_resp.status_code == 200
        assert get_resp.json()["targetCountMode"] == "minimum"

    def test_maximum_mode_roundtrip(self, client, test_db):
        """save с maximum → get → maximum."""
        payload = {**BASE_PAYLOAD, "targetCountMode": "maximum"}
        save_resp = _save_settings(client, payload)
        assert save_resp.status_code == 200
        assert save_resp.json()["targetCountMode"] == "maximum"

        get_resp = _get_settings(client)
        assert get_resp.status_code == 200
        assert get_resp.json()["targetCountMode"] == "maximum"


# =============================================================================
# 4. TestDefaultValues — дефолты
# =============================================================================

class TestDefaultValues:
    """Проверяем дефолтные значения targetCountMode."""

    def test_default_mode_is_exact(self, client, test_db):
        """При получении настроек нового конкурса дефолт = 'exact'."""
        resp = _get_settings(client)
        assert resp.status_code == 200
        data = resp.json()
        assert data["targetCountMode"] == "exact", (
            f"Ожидали дефолт 'exact', получили '{data['targetCountMode']}'"
        )

    def test_none_mode_falls_back_to_exact(self, client, test_db):
        """Если передать None → должен вернуться 'exact'."""
        payload = {**BASE_PAYLOAD, "targetCountMode": None}
        save_resp = _save_settings(client, payload)
        assert save_resp.status_code == 200
        # Роутер и CRUD делают fallback: contest.target_count_mode or 'exact'
        assert save_resp.json()["targetCountMode"] == "exact", (
            f"Ожидали fallback 'exact' для None, получили '{save_resp.json()['targetCountMode']}'"
        )


# =============================================================================
# 5. TestValueMapping — маппинг значений
# =============================================================================

class TestValueMapping:
    """Проверяем корректный маппинг между API и ORM-моделью."""

    def test_save_settings_maps_mode_to_model(self, client, test_db):
        """Проверка что ORM-модель получает правильное значение target_count_mode."""
        payload = {**BASE_PAYLOAD, "targetCountMode": "minimum"}
        _save_settings(client, payload)

        # Проверяем напрямую в БД через ORM
        contest = test_db.query(ReviewContest).filter(
            ReviewContest.project_id == TEST_PROJECT_ID
        ).first()
        assert contest is not None, "Конкурс не найден в БД после saveSettings"
        assert contest.target_count_mode == "minimum", (
            f"Ожидали 'minimum' в модели, получили '{contest.target_count_mode}'"
        )

    def test_settings_persist_after_update(self, client, test_db):
        """Обновление mode: exact → minimum → maximum — каждый раз сохраняется."""
        for mode in ["exact", "minimum", "maximum"]:
            payload = {**BASE_PAYLOAD, "targetCountMode": mode}
            resp = _save_settings(client, payload)
            assert resp.status_code == 200
            assert resp.json()["targetCountMode"] == mode, (
                f"После обновления на '{mode}' получили '{resp.json()['targetCountMode']}'"
            )

            # Проверяем через getSettings
            get_resp = _get_settings(client)
            assert get_resp.status_code == 200
            assert get_resp.json()["targetCountMode"] == mode, (
                f"getSettings после обновления на '{mode}' вернул '{get_resp.json()['targetCountMode']}'"
            )

            # Проверяем напрямую в ORM
            contest = test_db.query(ReviewContest).filter(
                ReviewContest.project_id == TEST_PROJECT_ID
            ).first()
            assert contest.target_count_mode == mode, (
                f"В БД после обновления на '{mode}' найдено '{contest.target_count_mode}'"
            )
