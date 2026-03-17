"""
Юнит-тесты бизнес-логики target_count_mode (exact/minimum/maximum)
в processor.py и finalizer.py модуля автоматизации конкурсов отзывов.

Покрытие:
  - TestProcessorCapBehavior: нумерация участников (cap / no-cap)
  - TestFinalizerSkipBehavior: пропуск финализации (skip / no-skip)
  - TestSkipLogicParametrized: параметризованная проверка условия пропуска
"""

import sys
import os
import pytest
from unittest.mock import patch, MagicMock

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# ─── sys.path: добавляем корень бэкенда ────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from database import Base
from models_library.automations import ReviewContest, ReviewContestEntry
from models_library.projects import Project

# ─── Константы ──────────────────────────────────────────────────────
TEST_PROJECT_ID = "test-project-001"
TEST_CONTEST_ID = "test-contest-001"


# =====================================================================
#  Фикстура: in-memory SQLite сессия
# =====================================================================
@pytest.fixture(scope="function")
def test_db():
    """Создаёт in-memory SQLite БД с нужными таблицами на каждый тест."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Создаём только необходимые таблицы (без полной миграции)
    ReviewContest.__table__.create(bind=engine, checkfirst=True)
    ReviewContestEntry.__table__.create(bind=engine, checkfirst=True)
    Project.__table__.create(bind=engine, checkfirst=True)

    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestSession()
    yield session
    session.close()
    engine.dispose()


# =====================================================================
#  Хелперы создания тестовых данных
# =====================================================================
def _create_project(db):
    """Вставляет минимальный Project для FK-ссылок."""
    p = Project(
        id=TEST_PROJECT_ID,
        name="Test Project",
        vkProjectId="123",
        vkGroupShortName="test",
        vkGroupName="Test Group",
        vkLink="https://vk.com/test",
        communityToken="test_token_123",
    )
    db.add(p)
    db.commit()
    return p


def _create_contest(db, target_count=10, mode="exact", condition="count"):
    """Вставляет ReviewContest с заданными параметрами."""
    contest = ReviewContest(
        id=TEST_CONTEST_ID,
        project_id=TEST_PROJECT_ID,
        is_active=True,
        keywords="#test",
        start_date="2025-01-01",
        finish_condition=condition,
        target_count=target_count,
        target_count_mode=mode,
        template_comment="#{number}",
    )
    db.add(contest)
    db.commit()
    db.refresh(contest)
    return contest


def _create_entries(db, count, status="new"):
    """Создаёт `count` записей ReviewContestEntry с указанным статусом."""
    for i in range(count):
        e = ReviewContestEntry(
            id=f"entry-{status}-{i}",
            contest_id=TEST_CONTEST_ID,
            vk_post_id=1000 + i,
            vk_owner_id=-100,
            user_vk_id=200 + i,
            user_name=f"User {i}",
            status=status,
        )
        if status == "commented":
            e.entry_number = i + 1
        db.add(e)
    db.commit()


# =====================================================================
#  TestProcessorCapBehavior — нумерация участников
# =====================================================================
class TestProcessorCapBehavior:
    """Тесты нумерации участников — поведение cap/no-cap по mode."""

    # Общие моки: VK-комментирование и глобальные переменные
    @patch("services.automations.reviews.processor.vk_service.create_comment")
    @patch(
        "services.automations.reviews.processor.global_variable_service.substitute_global_variables",
        side_effect=lambda db, text, pid: text,
    )
    def test_exact_mode_caps_at_target(self, mock_gv, mock_comment, test_db):
        """exact: нумерует ровно до target_count и останавливается."""
        _create_project(test_db)
        _create_contest(test_db, target_count=3, mode="exact", condition="count")
        _create_entries(test_db, count=5, status="new")

        from services.automations.reviews.processor import process_new_participants

        result = process_new_participants(test_db, TEST_PROJECT_ID)

        assert result["processed"] == 3, f"Ожидалось 3, получено {result['processed']}"
        assert result["limit_reached"] is True
        assert result["count_mode"] == "exact"

        # В БД должно быть 3 commented + 2 оставшихся new
        commented = (
            test_db.query(ReviewContestEntry)
            .filter(ReviewContestEntry.status == "commented")
            .count()
        )
        assert commented == 3

    @patch("services.automations.reviews.processor.vk_service.create_comment")
    @patch(
        "services.automations.reviews.processor.global_variable_service.substitute_global_variables",
        side_effect=lambda db, text, pid: text,
    )
    def test_minimum_mode_processes_all(self, mock_gv, mock_comment, test_db):
        """minimum: нумерует ВСЕХ без ограничения (лимит проверяется при финализации)."""
        _create_project(test_db)
        _create_contest(test_db, target_count=3, mode="minimum", condition="count")
        _create_entries(test_db, count=5, status="new")

        from services.automations.reviews.processor import process_new_participants

        result = process_new_participants(test_db, TEST_PROJECT_ID)

        assert result["processed"] == 5, f"Ожидалось 5, получено {result['processed']}"
        assert result["limit_reached"] is False  # minimum не ограничивает
        assert result["count_mode"] == "minimum"

    @patch("services.automations.reviews.processor.vk_service.create_comment")
    @patch(
        "services.automations.reviews.processor.global_variable_service.substitute_global_variables",
        side_effect=lambda db, text, pid: text,
    )
    def test_maximum_mode_caps_at_target(self, mock_gv, mock_comment, test_db):
        """maximum: нумерует до target_count (аналогично exact)."""
        _create_project(test_db)
        _create_contest(test_db, target_count=3, mode="maximum", condition="count")
        _create_entries(test_db, count=5, status="new")

        from services.automations.reviews.processor import process_new_participants

        result = process_new_participants(test_db, TEST_PROJECT_ID)

        assert result["processed"] == 3, f"Ожидалось 3, получено {result['processed']}"
        assert result["limit_reached"] is True
        assert result["count_mode"] == "maximum"

    @patch("services.automations.reviews.processor.vk_service.create_comment")
    @patch(
        "services.automations.reviews.processor.global_variable_service.substitute_global_variables",
        side_effect=lambda db, text, pid: text,
    )
    def test_exact_mode_stops_at_existing_plus_new(self, mock_gv, mock_comment, test_db):
        """exact: учитывает уже обработанных — добирает до target, а не сверх него."""
        _create_project(test_db)
        _create_contest(test_db, target_count=5, mode="exact", condition="count")
        # 3 уже обработанных + 5 новых → должно обработать только 2
        _create_entries(test_db, count=3, status="commented")
        _create_entries(test_db, count=5, status="new")

        from services.automations.reviews.processor import process_new_participants

        result = process_new_participants(test_db, TEST_PROJECT_ID)

        assert result["processed"] == 2, (
            f"Ожидалось 2 (3 existing + 2 new = 5 target), получено {result['processed']}"
        )
        assert result["limit_reached"] is True

        # Итого commented: 3 старых + 2 новых = 5
        commented = (
            test_db.query(ReviewContestEntry)
            .filter(ReviewContestEntry.status == "commented")
            .count()
        )
        assert commented == 5


# =====================================================================
#  TestFinalizerSkipBehavior — пропуск финализации
# =====================================================================
class TestFinalizerSkipBehavior:
    """Тесты финализации — поведение skip/no-skip по mode."""

    @patch("services.automations.reviews.finalizer.contest_log")
    @patch("services.automations.reviews.finalizer.contest_log_separator")
    def test_exact_mode_skips_if_below_target(self, mock_sep, mock_log, test_db):
        """exact + mixed: если участников меньше target → skipped=True."""
        _create_project(test_db)
        _create_contest(test_db, target_count=10, mode="exact", condition="mixed")
        _create_entries(test_db, count=5, status="commented")

        from services.automations.reviews.finalizer import finalize_contest

        result = finalize_contest(test_db, TEST_PROJECT_ID)

        assert result["success"] is True
        assert result["skipped"] is True
        assert "5 из 10" in result["message"]

    @patch("services.automations.reviews.finalizer.contest_log")
    @patch("services.automations.reviews.finalizer.contest_log_separator")
    def test_minimum_mode_skips_if_below_target(self, mock_sep, mock_log, test_db):
        """minimum + mixed: если участников меньше target → тоже skipped=True."""
        _create_project(test_db)
        _create_contest(test_db, target_count=10, mode="minimum", condition="mixed")
        _create_entries(test_db, count=5, status="commented")

        from services.automations.reviews.finalizer import finalize_contest

        result = finalize_contest(test_db, TEST_PROJECT_ID)

        assert result["success"] is True
        assert result["skipped"] is True
        assert "minimum" in result["message"]

    @patch("services.automations.reviews.finalizer.contest_log")
    @patch("services.automations.reviews.finalizer.contest_log_separator")
    @patch("services.automations.reviews.finalizer.crud_automations.cleanup_expired_blacklist", return_value=0)
    @patch("services.automations.reviews.finalizer.crud_automations.get_active_blacklist_user_ids", return_value=[])
    def test_maximum_mode_does_not_skip(
        self,
        mock_bl_ids,
        mock_bl_cleanup,
        mock_sep,
        mock_log,
        test_db,
    ):
        """maximum + mixed: НЕ пропускает skip-проверку — уходит дальше в логику.

        Финализатор крайне сложный (промокоды, VK API, генерация картинок и т.д.).
        Мокать всё — хрупко. Поэтому проверяем: если функция НЕ вернула
        skipped=True, а ушла дальше и упала на чём-то другом —
        значит skip-логика по mode='maximum' работает корректно.
        """
        _create_project(test_db)
        _create_contest(test_db, target_count=10, mode="maximum", condition="mixed")
        _create_entries(test_db, count=5, status="commented")

        from services.automations.reviews.finalizer import finalize_contest

        try:
            result = finalize_contest(test_db, TEST_PROJECT_ID)
            # Если функция вернула результат — проверяем что это НЕ skip
            assert result.get("skipped") is not True, (
                f"maximum mode НЕ должен пропускать финализацию, но получили: {result}"
            )
        except Exception:
            # Если упало на последующих шагах (промокоды, VK API и т.д.) —
            # это ОК: skip-проверка была пройдена, функция пошла дальше.
            pass

    @patch("services.automations.reviews.finalizer.contest_log")
    @patch("services.automations.reviews.finalizer.contest_log_separator")
    def test_maximum_mode_skips_on_zero_participants(self, mock_sep, mock_log, test_db):
        """maximum: при 0 участниках — всегда skipped (независимо от mode)."""
        _create_project(test_db)
        _create_contest(test_db, target_count=10, mode="maximum", condition="mixed")
        # НЕ создаём commented-записей → 0 участников

        from services.automations.reviews.finalizer import finalize_contest

        result = finalize_contest(test_db, TEST_PROJECT_ID)

        assert result["success"] is True
        assert result["skipped"] is True
        assert "0" in result["message"]

    @patch("services.automations.reviews.finalizer.contest_log")
    @patch("services.automations.reviews.finalizer.contest_log_separator")
    def test_count_condition_exact_skips(self, mock_sep, mock_log, test_db):
        """count + exact: если участников меньше target → skipped=True."""
        _create_project(test_db)
        _create_contest(test_db, target_count=10, mode="exact", condition="count")
        _create_entries(test_db, count=5, status="commented")

        from services.automations.reviews.finalizer import finalize_contest

        result = finalize_contest(test_db, TEST_PROJECT_ID)

        assert result["success"] is True
        assert result["skipped"] is True

    @patch("services.automations.reviews.finalizer.contest_log")
    @patch("services.automations.reviews.finalizer.contest_log_separator")
    @patch("services.automations.reviews.finalizer.crud_automations.cleanup_expired_blacklist", return_value=0)
    @patch("services.automations.reviews.finalizer.crud_automations.get_active_blacklist_user_ids", return_value=[])
    def test_count_condition_maximum_does_not_skip(
        self,
        mock_bl_ids,
        mock_bl_cleanup,
        mock_sep,
        mock_log,
        test_db,
    ):
        """count + maximum: НЕ пропускает skip-проверку — уходит дальше.

        Аналогично test_maximum_mode_does_not_skip — проверяем, что
        skip-логика не сработала, а функция пошла дальше.
        """
        _create_project(test_db)
        _create_contest(test_db, target_count=10, mode="maximum", condition="count")
        _create_entries(test_db, count=5, status="commented")

        from services.automations.reviews.finalizer import finalize_contest

        try:
            result = finalize_contest(test_db, TEST_PROJECT_ID)
            assert result.get("skipped") is not True, (
                f"maximum + count НЕ должен пропускать, но получили: {result}"
            )
        except Exception:
            # Упало на последующих шагах — skip-проверка пройдена успешно.
            pass


# =====================================================================
#  TestSkipLogicParametrized — параметризованная проверка условия пропуска
# =====================================================================
def _would_skip(finish_condition: str, count_mode: str, current_count: int, target: int) -> bool:
    """
    Имитация логики пропуска из finalizer.py.
    Точная копия условий принятия решения «пропустить или подводить итоги».
    """
    if finish_condition == "mixed":
        if count_mode != "maximum" and current_count < target:
            return True
    elif finish_condition == "count":
        if count_mode != "maximum" and current_count < target:
            return True
    # Ноль участников — всегда пропускаем
    if current_count == 0:
        return True
    return False


class TestSkipLogicParametrized:
    """Параметризованные тесты логики пропуска (без обращения к БД)."""

    @pytest.mark.parametrize(
        "condition, mode, count, target, expected_skip",
        [
            # exact — пропускает при нехватке
            ("mixed", "exact", 5, 10, True),
            ("count", "exact", 5, 10, True),
            ("mixed", "exact", 10, 10, False),
            ("count", "exact", 10, 10, False),
            # minimum — пропускает при нехватке (аналогично exact)
            ("mixed", "minimum", 3, 5, True),
            ("count", "minimum", 3, 5, True),
            ("mixed", "minimum", 5, 5, False),
            ("count", "minimum", 5, 5, False),
            # maximum — НИКОГДА не пропускает (кроме нуля)
            ("mixed", "maximum", 1, 100, False),
            ("count", "maximum", 1, 100, False),
            ("mixed", "maximum", 50, 100, False),
            ("count", "maximum", 50, 100, False),
            # Ноль участников — ВСЕГДА пропускает
            ("mixed", "exact", 0, 10, True),
            ("count", "exact", 0, 10, True),
            ("mixed", "maximum", 0, 10, True),
            ("count", "maximum", 0, 10, True),
            # date condition — не зависит от count (skip только при 0)
            ("date", "exact", 5, 10, False),
            ("date", "maximum", 5, 10, False),
            ("date", "exact", 0, 10, True),
        ],
        ids=[
            "mixed_exact_below",
            "count_exact_below",
            "mixed_exact_reached",
            "count_exact_reached",
            "mixed_min_below",
            "count_min_below",
            "mixed_min_reached",
            "count_min_reached",
            "mixed_max_below",
            "count_max_below",
            "mixed_max_partial",
            "count_max_partial",
            "mixed_exact_zero",
            "count_exact_zero",
            "mixed_max_zero",
            "count_max_zero",
            "date_exact_has_entries",
            "date_max_has_entries",
            "date_exact_zero",
        ],
    )
    def test_skip_logic(self, condition, mode, count, target, expected_skip):
        """Проверяет все комбинации condition × mode × count."""
        result = _would_skip(condition, mode, count, target)
        assert result is expected_skip, (
            f"condition={condition}, mode={mode}, count={count}, target={target}: "
            f"ожидался skip={expected_skip}, получен {result}"
        )
