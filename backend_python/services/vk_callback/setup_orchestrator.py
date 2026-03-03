"""
Оркестрация автонастройки Callback API.
Бизнес-логика, вынесенная из routers/vk_callback.py (setup_callback_auto).

Отвечает за:
1. Предварительное сохранение confirmation code (до вызова VK API)
2. Подготовку словаря событий (events_dict)
3. Вызов auto_setup_callback
4. Финальное сохранение результата в БД
"""
import logging
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from models_library.projects import Project
from services.callback_setup import (
    auto_setup_callback,
    get_confirmation_code,
    VK_SETTABLE_EVENTS,
)

logger = logging.getLogger(__name__)


def orchestrate_callback_setup(
    db: Session,
    project: Project,
    project_id: str,
    is_local: bool,
    use_tunnel: bool,
    events: Optional[List[str]],
) -> Dict[str, Any]:
    """
    Оркестрирует полный цикл автонастройки Callback для проекта.

    Возвращает dict с полями для CallbackSetupResponse.
    """
    group_id = int(project.vkProjectId)
    community_token = project.communityToken

    logger.info(
        f"Автонастройка Callback: project={project_id}, "
        f"group={group_id}, is_local={is_local}"
    )

    # ─── Предварительное сохранение confirmation code ───
    # При вызове addCallbackServer / editCallbackServer VK шлёт confirmation-запрос
    # на наш callback URL. Наш хендлер ищет код в БД — он уже должен там быть,
    # иначе VK не подтвердит сервер и пометит его как "wait".
    _pre_save_confirmation_code(db, project, project_id, group_id, community_token)

    # ─── Подготовка словаря событий ───
    # ВАЖНО: VK API groups.setCallbackSettings НЕ сбрасывает непереданные события,
    # поэтому нужно явно передать 0 для невыбранных, иначе они останутся включёнными.
    events_dict = _prepare_events_dict(events)

    # ─── Запуск автонастройки ───
    result = auto_setup_callback(
        group_id=group_id,
        community_token=community_token,
        is_local=is_local,
        use_tunnel=use_tunnel,
        events=events_dict,
    )

    # ─── Финальное сохранение confirmation code ───
    if result["success"] and result["confirmation_code"]:
        _final_save_confirmation_code(db, project, project_id, result["confirmation_code"])

    # Добавляем short_name группы для формирования ссылки на фронте
    result["vk_group_short_name"] = project.vkGroupShortName or None

    return result


def _pre_save_confirmation_code(
    db: Session,
    project: Project,
    project_id: str,
    group_id: int,
    community_token: str,
) -> None:
    """Предварительно сохраняет confirmation code в проект (до вызова auto_setup_callback)."""
    try:
        pre_confirmation_code = get_confirmation_code(group_id, community_token)
        if pre_confirmation_code:
            project.vk_confirmation_code = pre_confirmation_code
            db.commit()
            logger.info(
                f"Confirmation code '{pre_confirmation_code}' "
                f"предварительно сохранён в проект {project_id} "
                f"(до вызова auto_setup_callback)"
            )
        else:
            logger.warning(
                f"Не удалось получить confirmation code для group={group_id} "
                f"до вызова auto_setup_callback"
            )
    except Exception as e:
        logger.error(f"Ошибка предварительного сохранения confirmation code: {e}")
        try:
            db.rollback()
        except Exception:
            pass


def _prepare_events_dict(events: Optional[List[str]]) -> Optional[Dict[str, int]]:
    """Преобразует список событий в dict для VK API (1/0 для каждого события)."""
    if events is None:
        return None

    selected_set = set(events)
    # Для каждого настраиваемого события: 1 если выбрано, 0 если нет
    events_dict = {event: (1 if event in selected_set else 0) for event in VK_SETTABLE_EVENTS}
    enabled = sum(1 for v in events_dict.values() if v)
    logger.info(f"События: {enabled}/{len(VK_SETTABLE_EVENTS)} включено")
    return events_dict


def _final_save_confirmation_code(
    db: Session,
    project: Project,
    project_id: str,
    confirmation_code: str,
) -> None:
    """Финально сохраняет confirmation code после успешной настройки."""
    project.vk_confirmation_code = confirmation_code
    try:
        db.commit()
        logger.info(
            f"Confirmation code '{confirmation_code}' "
            f"финально сохранён в проект {project_id}"
        )
    except Exception as e:
        logger.error(f"Ошибка сохранения confirmation code: {e}")
        db.rollback()
