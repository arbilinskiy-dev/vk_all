"""
Сервис отправки сообщений через VK API messages.send.
"""

import time
import random
import logging
from typing import Dict, Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from crud import messages_crud
from services.vk_api.token_manager import call_vk_api_for_group
from services.vk_api.api_client import VkApiError
from services import global_variable_service

logger = logging.getLogger(__name__)


def send_message(
    db: Session,
    project_id: str,
    user_id: int,
    message: str,
    community_tokens: list,
    group_id_int: int,
    sender_id: str = None,
    sender_name: str = None,
    attachment: str = None,
) -> Dict[str, Any]:
    """
    Отправляет сообщение пользователю через VK API messages.send.
    Сохраняет отправленное сообщение в кэш.
    """
    if not message.strip() and not attachment:
        raise HTTPException(status_code=400, detail="Сообщение не может быть пустым")

    # Подставляем глобальные переменные ({global_*}) в текст сообщения
    message_text = global_variable_service.substitute_global_variables(db, message, project_id)

    # Подставляем промокоды ({promo_*_code}, {promo_*_description}) — реальная выдача
    # Для user_name берём имя получателя из vk_profiles, а не sender_name (имя менеджера)
    try:
        from services import promo_list_service
        from models_library.vk_profiles import VkProfile

        # Получаем имя получателя из глобальной таблицы VK-профилей
        recipient_name = None
        try:
            vk_profile = db.query(VkProfile).filter(VkProfile.vk_user_id == user_id).first()
            if vk_profile and vk_profile.first_name:
                recipient_name = f"{vk_profile.first_name} {vk_profile.last_name or ''}".strip()
        except Exception as profile_err:
            logger.warning(f"MESSAGES SEND: не удалось получить имя получателя (не критично): {profile_err}")

        message_text = promo_list_service.substitute_promo_variables(
            db, message_text, project_id,
            user_id=user_id,
            user_name=recipient_name or f"id{user_id}",
            dry_run=False,
        )
    except Exception as promo_err:
        logger.warning(f"MESSAGES SEND: promo substitution error (не критично): {promo_err}")

    try:
        # Формируем параметры запроса
        send_params = {
            "user_id": user_id,
            "message": message_text,
            "random_id": random.randint(1, 2**31),
        }
        # Добавляем вложения, если есть (строка вида "photo123_456,photo123_789")
        if attachment:
            send_params["attachment"] = attachment

        # Отправляем через VK API
        result = call_vk_api_for_group(
            method="messages.send",
            params=send_params,
            group_id=group_id_int,
            community_tokens=community_tokens,
            project_id=project_id,
        )

        # result — это ID отправленного сообщения (число)
        sent_message_id = result if isinstance(result, int) else result.get("response", result)

        # Создаём запись для кэша
        now_ts = int(time.time())
        sent_item = {
            "id": sent_message_id,
            "from_id": -group_id_int,  # Отправлено от имени сообщества
            "peer_id": user_id,
            "text": message_text,
            "date": now_ts,
            "out": 1,
            "read_state": 0,
        }

        # Добавляем вложения в sent_item для корректного отображения на фронтенде
        if attachment:
            vk_attachments = []
            for att_id in attachment.split(','):
                att_id = att_id.strip()
                if att_id.startswith('photo'):
                    # Парсим "photo{owner_id}_{photo_id}"
                    parts = att_id.replace('photo', '').split('_')
                    vk_attachments.append({
                        "type": "photo",
                        "photo": {
                            "id": int(parts[1]) if len(parts) > 1 else 0,
                            "owner_id": int(parts[0]) if parts else 0,
                            "sizes": [],
                        }
                    })
                elif att_id.startswith('video'):
                    # Парсим "video{owner_id}_{video_id}" или "video{owner_id}_{video_id}_{access_key}"
                    parts = att_id.replace('video', '').split('_')
                    vk_attachments.append({
                        "type": "video",
                        "video": {
                            "id": int(parts[1]) if len(parts) > 1 else 0,
                            "owner_id": int(parts[0]) if parts else 0,
                            "access_key": parts[2] if len(parts) > 2 else '',
                            "title": '',
                            "image": [],
                        }
                    })
                elif att_id.startswith('doc'):
                    # Парсим "doc{owner_id}_{doc_id}"
                    parts = att_id.replace('doc', '').split('_')
                    vk_attachments.append({
                        "type": "doc",
                        "doc": {
                            "id": int(parts[1]) if len(parts) > 1 else 0,
                            "owner_id": int(parts[0]) if parts else 0,
                            "title": '',
                            "url": '',
                        }
                    })
            if vk_attachments:
                sent_item["attachments"] = vk_attachments

        # Фиксируем кто отправил сообщение через нашу систему
        if sender_id:
            sent_item["sent_by_id"] = sender_id
        if sender_name:
            sent_item["sent_by_name"] = sender_name

        # Сохраняем в кэш
        messages_crud.save_vk_messages(db, project_id, user_id, [sent_item])

        # AUTO READ: исходящее от менеджера → помечаем диалог прочитанным
        # (чтобы старые входящие не висели как фантомные непрочитанные)
        try:
            from crud.message_read_crud import get_max_incoming_message_id, mark_dialog_as_read
            max_incoming_id = get_max_incoming_message_id(db, project_id, user_id)
            if max_incoming_id > 0:
                mark_dialog_as_read(db, project_id, user_id, max_incoming_id, manager_id=sender_id or "system_send")
        except Exception as e:
            logger.warning(f"MESSAGES SEND: auto-read ошибка (не критично): {e}")

        # Пересчитываем направленные счётчики
        messages_crud.recalc_direction_counts(db, project_id, user_id)

        # --- STATS: записываем в статистику нагрузки (исходящее через систему) ---
        try:
            from crud.message_stats_crud import record_message as stats_record
            stats_record(
                db, project_id, user_id,
                is_incoming=False,
                message_timestamp=now_ts,
                has_payload=False,
                sender_id=sender_id,
                sender_name=sender_name,
            )
        except Exception as stats_err:
            logger.warning(f"MESSAGES SEND: stats record error (не критично): {stats_err}")

        logger.info(f"MESSAGES SEND: OK, msg_id={sent_message_id}, sender={sender_name or 'unknown'} (project={project_id}, user={user_id})")

        # --- SSE PUSH: уведомляем других менеджеров об исходящем сообщении ---
        # Без этого другие вкладки/менеджеры не увидят сообщение до VK callback message_reply
        try:
            from services.sse_manager import sse_manager, SSEEvent
            sse_manager.publish_via_redis(SSEEvent(
                event_type="new_message",
                project_id=project_id,
                data={
                    "vk_user_id": user_id,
                    "message": sent_item,
                    "unread_count": 0,
                    "is_incoming": False,
                    "cache_action": "append",
                },
            ))
        except Exception as sse_err:
            logger.warning(f"MESSAGES SEND: SSE publish error (не критично): {sse_err}")

        return {
            "success": True,
            "message_id": sent_message_id,
            "item": sent_item,
        }

    except VkApiError as e:
        logger.error(f"MESSAGES SEND: VK API error — {e}")
        raise HTTPException(status_code=502, detail=f"Ошибка VK API: {str(e)}")
    except Exception as e:
        logger.error(f"MESSAGES SEND: Unexpected error — {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка: {str(e)}")
