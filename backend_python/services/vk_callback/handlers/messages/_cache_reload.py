# Upsert пользователя в список рассылки (ProjectDialog) при получении сообщения.
# Запрашивает профиль через VK API users.get, делает upsert в БД,
# публикует SSE-событие mailing_user_updated.

import json
import logging
from sqlalchemy.orm import Session

from models_library.dialogs_authors import ProjectDialog
from ._helpers import _publish_sse_event

logger = logging.getLogger("vk_callback.handlers.messages")


def _upsert_mailing_and_notify(db: Session, project_id: str, vk_user_id: int, project, message_date: int):
    """
    Добавляет/обновляет пользователя в списке рассылки (ProjectDialog) при получении сообщения.
    Запрашивает данные профиля через VK API users.get, делает upsert в БД,
    и публикует SSE-событие mailing_user_updated для обновления интерфейса в реальном времени.
    """
    try:
        from services.vk_api.token_manager import call_vk_api_for_group
        from crud.lists.mailing import bulk_upsert_mailing, get_mailing_user_by_vk_id
        from crud import messages_crud as msg_crud_local
        from datetime import datetime, timezone

        # Получаем токены сообщества
        community_tokens = []
        if project and project.communityToken:
            community_tokens.append(project.communityToken)
        if project and project.additional_community_tokens:
            try:
                extras = json.loads(project.additional_community_tokens)
                if isinstance(extras, list):
                    community_tokens.extend([t for t in extras if t])
            except Exception:
                pass

        if not community_tokens:
            logger.warning(f"MAILING UPSERT: нет токенов для project={project_id}")
            return

        group_id = abs(int(project.vkProjectId)) if project.vkProjectId else None
        if not group_id:
            return

        # Запрашиваем профиль из VK API
        vk_result = call_vk_api_for_group(
            method="users.get",
            params={
                "user_ids": vk_user_id,
                "fields": "sex,bdate,city,country,photo_100,domain,has_mobile,last_seen,is_closed,can_access_closed,deactivated",
            },
            group_id=group_id,
            community_tokens=community_tokens,
            project_id=project_id,
        )

        if not isinstance(vk_result, list) or len(vk_result) == 0:
            logger.warning(f"MAILING UPSERT: пустой ответ VK API users.get для user={vk_user_id}")
            return

        vk_user = vk_result[0]

        # Формируем запись для upsert (нормализованный формат)
        last_msg_date = datetime.fromtimestamp(message_date, timezone.utc) if message_date else None

        entry = {
            "vk_user_id": vk_user_id,
            "first_name": vk_user.get("first_name", "Unknown"),
            "last_name": vk_user.get("last_name", ""),
            "sex": vk_user.get("sex", 0),
            "photo_url": vk_user.get("photo_100"),
            "domain": vk_user.get("domain"),
            "bdate": vk_user.get("bdate"),
            "city": vk_user.get("city", {}).get("title") if vk_user.get("city") else None,
            "country": vk_user.get("country", {}).get("title") if vk_user.get("country") else None,
            "has_mobile": bool(vk_user.get("has_mobile")),
            "deactivated": vk_user.get("deactivated"),
            "last_seen": vk_user.get("last_seen", {}).get("time") if vk_user.get("last_seen") else None,
            "platform": vk_user.get("last_seen", {}).get("platform") if vk_user.get("last_seen") else None,
            "is_closed": vk_user.get("is_closed", False),
            "can_access_closed": True,  # Пользователь нам написал → значит может
            "last_message_date": last_msg_date,
            "first_message_date": last_msg_date,       # Для новых — дата первого сообщения
            "first_message_from_id": vk_user_id,        # Для новых — кто написал первым
            "added_at": datetime.now(),
            "source": "callback",
            "updated_at": datetime.utcnow(),
        }

        # Upsert в БД (bulk_upsert_mailing обрабатывает и INSERT, и UPDATE,
        # при UPDATE сохраняет added_at, source, first_message_date, first_message_from_id)
        bulk_upsert_mailing(db, project_id, [entry])

        # Обновляем счётчик mailing_count в метаданных проекта
        from crud.lists.meta import update_list_meta
        real_count = db.query(ProjectDialog).filter(
            ProjectDialog.project_id == project_id
        ).count()
        update_list_meta(db, project_id, {
            "mailing_count": real_count,
            "mailing_last_updated": datetime.utcnow().strftime("%d.%m.%Y, %H:%M"),
        })

        # Получаем обновлённые данные (после upsert) для SSE
        updated_user = get_mailing_user_by_vk_id(db, project_id, vk_user_id)

        if updated_user:
            # Дополняем датами последних сообщений из кэша
            try:
                message_dates = msg_crud_local.get_last_message_dates(db, project_id, vk_user_id)
                incoming_ts = message_dates.get("last_incoming_date")
                updated_user["last_incoming_message_date"] = (
                    datetime.utcfromtimestamp(incoming_ts).isoformat() if incoming_ts else None
                )
                outgoing_ts = message_dates.get("last_outgoing_date")
                updated_user["last_outgoing_message_date"] = (
                    datetime.utcfromtimestamp(outgoing_ts).isoformat() if outgoing_ts else None
                )
            except Exception:
                pass

            # Публикуем SSE-событие mailing_user_updated
            _publish_sse_event("mailing_user_updated", project_id, {
                "user": updated_user,
            })

            logger.info(
                f"MAILING UPSERT: user={vk_user_id} → проект={project_id}, SSE mailing_user_updated отправлен"
            )

    except Exception as e:
        logger.error(f"MAILING UPSERT ERROR: {e}")
