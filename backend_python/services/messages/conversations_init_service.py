"""
Сервис инициализации модуля сообщений — единый эндпоинт.

Заменяет 4 отдельных HTTP-запроса (2x getSubscribers + getUnreadCounts + getLastMessages)
одним вызовом, устраняя waterfall и экономя ~500ms-1s на загрузке.

Все SQL-запросы идут в одной DB-сессии без лишних round-trip.
"""

import time
import logging
from typing import Dict, Any, List, Set

from sqlalchemy.orm import Session

import crud
import models
from crud import messages_crud, message_read_crud, dialog_label_crud
from services.lists.retrieval.fetchers import fetch_list_items, fetch_list_count
from services.lists.retrieval.unread_filter import get_unread_user_ids
from schemas.models.lists import SystemListMailingItem
from models_library.dialogs_authors import ProjectDialog
from models_library.vk_profiles import VkProfile

logger = logging.getLogger(__name__)


def conversations_init(
    db: Session,
    project_id: str,
    page: int = 1,
    page_size: int = 50,
    sort_unread_first: bool = True,
    filter_unread: str = 'all',
) -> Dict[str, Any]:
    """
    Единый эндпоинт инициализации модуля сообщений.

    Возвращает подписчиков (отсортированных по непрочитанным) + unread_counts + last_messages
    за один запрос вместо 4 отдельных (2x getSubscribers + getUnreadCounts + getLastMessages).

    Оптимизация:
    - Все SQL-запросы в одной DB-сессии (нет overhead на подключение)
    - Нет waterfall: данные подписчиков, unread, last_messages запрашиваются последовательно,
      но в одном HTTP-запросе — экономим 3 network round-trips
    - Непрочитанные пользователи с других страниц подгружаются автоматически
    """
    t0 = time.time()

    # 1. Определяем пользователей с непрочитанными (для сортировки и/или фильтрации)
    unread_user_ids_set: Set[int] = set()
    if sort_unread_first or filter_unread == 'unread':
        unread_user_ids_list = get_unread_user_ids(db, project_id)
        unread_user_ids_set = set(unread_user_ids_list)
        logger.info(
            f"CONV_INIT: {len(unread_user_ids_set)} пользователей с непрочитанными "
            f"(project={project_id}, filter_unread={filter_unread})"
        )

    # 2. Загружаем подписчиков (основная страница)
    #    При filter_unread='unread' передаём фильтр в fetch_list_items
    #    При filter_unread='important' запрашиваем только важные диалоги
    #    При filter_unread='label:<id>' фильтруем по метке
    if filter_unread.startswith('label:'):
        # Фильтр по метке диалога
        label_id = filter_unread.split(':', 1)[1]
        label_user_ids = dialog_label_crud.get_user_ids_by_label(db, project_id, label_id)
        total_count = len(label_user_ids)

        # Пагинация
        start = (page - 1) * page_size
        end = start + page_size
        page_ids = label_user_ids[start:end]

        if page_ids:
            items = (
                db.query(ProjectDialog)
                .join(VkProfile, ProjectDialog.vk_profile_id == VkProfile.id)
                .filter(
                    ProjectDialog.project_id == project_id,
                    VkProfile.vk_user_id.in_(page_ids),
                )
                .all()
            )
        else:
            items = []
    elif filter_unread == 'important':
        # Фильтр «Важное»: сначала получаем vk_user_ids важных диалогов, затем загружаем подписчиков
        important_all = (
            db.query(VkProfile.vk_user_id)
            .join(ProjectDialog, ProjectDialog.vk_profile_id == VkProfile.id)
            .filter(
                ProjectDialog.project_id == project_id,
                ProjectDialog.is_important == True,
            )
            .all()
        )
        important_all_ids = [r.vk_user_id for r in important_all]
        total_count = len(important_all_ids)
        
        # Пагинация
        start = (page - 1) * page_size
        end = start + page_size
        page_ids = important_all_ids[start:end]
        
        if page_ids:
            items = (
                db.query(ProjectDialog)
                .join(VkProfile, ProjectDialog.vk_profile_id == VkProfile.id)
                .filter(
                    ProjectDialog.project_id == project_id,
                    VkProfile.vk_user_id.in_(page_ids),
                )
                .all()
            )
        else:
            items = []
    else:
        items = fetch_list_items(db, project_id, 'mailing', page, page_size, filter_unread=filter_unread)
        total_count = fetch_list_count(db, project_id, 'mailing', filter_unread=filter_unread)

    # 3. Стратегия unread-first: подгружаем непрочитанных, которых нет на текущей странице
    if sort_unread_first and unread_user_ids_set and page == 1:
        items_in_page_ids = {s.vk_user_id for s in items}
        missing_unread_ids = unread_user_ids_set - items_in_page_ids

        if missing_unread_ids:
            # Загружаем недостающих непрочитанных напрямую из БД (ProjectDialog + VkProfile)
            extra_items = (
                db.query(ProjectDialog)
                .join(VkProfile, ProjectDialog.vk_profile_id == VkProfile.id)
                .filter(
                    ProjectDialog.project_id == project_id,
                    VkProfile.vk_user_id.in_(list(missing_unread_ids)),
                )
                .all()
            )

            # Мержим: непрочитанные наверх, затем остальные (дедуплицированные)
            extra_ids = {s.vk_user_id for s in extra_items}
            non_dupe_items = [s for s in items if s.vk_user_id not in extra_ids]
            items = list(extra_items) + non_dupe_items

            logger.info(
                f"CONV_INIT: подгружено {len(extra_items)} непрочитанных с других страниц"
            )
        else:
            # Все непрочитанные уже на странице — просто сортируем их наверх
            items = sorted(
                items,
                key=lambda s: (0 if s.vk_user_id in unread_user_ids_set else 1),
            )

    # 4. Конвертируем ORM-объекты в Pydantic → dict (для JSON-сериализации)
    subscribers_data = []
    for item in items:
        try:
            sub = SystemListMailingItem.model_validate(item, from_attributes=True)
            subscribers_data.append(sub.model_dump(mode='json'))
        except Exception as e:
            # Fallback: базовые поля напрямую
            logger.warning(f"CONV_INIT: ошибка сериализации подписчика {getattr(item, 'vk_user_id', '?')}: {e}")
            subscribers_data.append({
                "id": getattr(item, "id", ""),
                "project_id": getattr(item, "project_id", ""),
                "vk_user_id": getattr(item, "vk_user_id", 0),
                "first_name": getattr(item, "first_name", ""),
                "last_name": getattr(item, "last_name", ""),
                "photo_url": getattr(item, "photo_url", None),
                "sex": getattr(item, "sex", None),
                "added_at": str(getattr(item, "added_at", "")),
                "source": getattr(item, "source", ""),
            })

    # 5. Получаем vk_user_ids для метаданных
    vk_user_ids = [s.vk_user_id for s in items]

    # 5.5. Получаем пометки «Важное» — диалоги, помеченные менеджером
    important_user_ids: set = set()
    if vk_user_ids:
        important_rows = (
            db.query(ProjectDialog.vk_profile_id, VkProfile.vk_user_id)
            .join(VkProfile, ProjectDialog.vk_profile_id == VkProfile.id)
            .filter(
                ProjectDialog.project_id == project_id,
                ProjectDialog.is_important == True,
                VkProfile.vk_user_id.in_(vk_user_ids),
            )
            .all()
        )
        important_user_ids = {row.vk_user_id for row in important_rows}

    # 6. Пакетно: unread counts + last messages + метки диалогов (одна DB-сессия!)
    unread_counts = (
        message_read_crud.get_unread_counts_batch(db, project_id, vk_user_ids)
        if vk_user_ids else {}
    )
    last_messages = (
        messages_crud.get_last_messages_batch(db, project_id, vk_user_ids)
        if vk_user_ids else {}
    )
    # Метки диалогов: batch-запрос {vk_user_id: [label_id, ...]}
    dialog_labels_map = (
        dialog_label_crud.get_labels_batch(db, project_id, vk_user_ids)
        if vk_user_ids else {}
    )

    # 7. Meta
    meta = crud.get_list_meta(db, project_id)

    elapsed = time.time() - t0
    unread_with_msgs = sum(1 for c in unread_counts.values() if c > 0)
    logger.info(
        f"CONV_INIT: завершено за {elapsed:.3f}s — {len(subscribers_data)} подписчиков, "
        f"{unread_with_msgs} с непрочитанными (project={project_id})"
    )

    return {
        "meta": meta,
        "subscribers": subscribers_data,
        "total_count": total_count,
        "unread_counts": {str(uid): cnt for uid, cnt in unread_counts.items()},
        "last_messages": {str(uid): msg for uid, msg in last_messages.items()},
        "important_dialogs": {str(uid): True for uid in important_user_ids},
        "dialog_labels": {str(uid): lids for uid, lids in dialog_labels_map.items()},
    }
