"""
Сервис групповых чатов (бесед) сообщества.

Два режима:
1. get_community_chats() — мгновенная загрузка из БД (кэш)
2. sync_community_chats() — синхронизация с VK API → сохранение в БД

VK API: messages.getConversations → фильтрация по peer.type === 'chat'
Чаты сообщества имеют peer_id >= 2000000001.
"""

import json
import logging
import time
from typing import Dict, Any, List

from sqlalchemy.orm import Session

from models_library.community_chats import CommunityGroupChat
from services.messages.vk_client import get_project_and_tokens
from services.vk_api.token_manager import call_vk_api_for_group

logger = logging.getLogger(__name__)

# Порог peer_id для групповых чатов VK
CHAT_PEER_ID_START = 2000000000


def get_community_chats(
    db: Session,
    project_id: str,
) -> Dict[str, Any]:
    """
    Мгновенная загрузка чатов из БД (кэш).
    Если кэш пуст — возвращает пустой список (фронтенд покажет «Нажмите синхронизацию»).
    """
    cached = (
        db.query(CommunityGroupChat)
        .filter(CommunityGroupChat.project_id == project_id)
        .order_by(CommunityGroupChat.peer_id)
        .all()
    )

    chats = [c.to_dict() for c in cached]
    return {
        "chats": chats,
        "count": len(chats),
        "from_cache": True,
    }


def sync_community_chats(
    db: Session,
    project_id: str,
) -> Dict[str, Any]:
    """
    Полная синхронизация чатов с VK API → сохранение в БД.
    Вызывается по кнопке «Синхронизация» на фронтенде.
    """
    project, community_tokens, group_id_int = get_project_and_tokens(db, project_id)

    # Пагинация: VK API max count=200, чаты разбросаны среди личных диалогов
    MAX_PAGES = 15
    PAGE_SIZE = 200

    all_chat_items = []
    profiles: dict = {}
    groups: dict = {}
    offset = 0

    for page in range(MAX_PAGES):
        try:
            vk_result = call_vk_api_for_group(
                method="messages.getConversations",
                params={
                    "count": PAGE_SIZE,
                    "offset": offset,
                    "filter": "all",
                    "extended": 1 if page == 0 else 0,
                },
                group_id=group_id_int,
                community_tokens=community_tokens,
                project_id=project_id,
            )
        except Exception as e:
            logger.error(f"COMMUNITY_CHATS SYNC: Ошибка VK API page={page}: {e}")
            break

        # call_vk_api_for_group уже извлекает response
        items = vk_result.get("items", [])
        total = vk_result.get("count", 0)

        # Профили и группы — только с первой страницы (extended=1)
        if page == 0:
            profiles = {p["id"]: p for p in vk_result.get("profiles", [])}
            groups = {g["id"]: g for g in vk_result.get("groups", [])}

        # Фильтруем чаты с текущей страницы
        for item in items:
            conv = item.get("conversation", {})
            peer = conv.get("peer", {})
            if peer.get("type") == "chat":
                all_chat_items.append(item)

        offset += PAGE_SIZE
        if offset >= total or len(items) < PAGE_SIZE:
            break

    logger.info(f"COMMUNITY_CHATS SYNC: project={project_id}, pages={page + 1}, chats_found={len(all_chat_items)}")

    # Сохраняем в БД (upsert)
    now = time.time()
    synced_peer_ids = set()

    for item in all_chat_items:
        conv = item.get("conversation", {})
        peer = conv.get("peer", {})
        peer_id = peer.get("id", 0)
        chat_id = peer.get("local_id", 0)
        chat_settings = conv.get("chat_settings", {})
        last_message = item.get("last_message")

        # Фото чата
        photo = chat_settings.get("photo", {})
        photo_url = (
            photo.get("photo_100")
            or photo.get("photo_200")
            or photo.get("photo_50")
        )

        # Отправитель последнего сообщения
        last_message_sender = None
        if last_message:
            from_id = last_message.get("from_id", 0)
            if from_id > 0 and from_id in profiles:
                p = profiles[from_id]
                last_message_sender = f"{p.get('first_name', '')} {p.get('last_name', '')}"
            elif from_id < 0 and abs(from_id) in groups:
                g = groups[abs(from_id)]
                last_message_sender = g.get("name", "")

        row_id = f"{project_id}_{peer_id}"
        synced_peer_ids.add(peer_id)

        existing = db.query(CommunityGroupChat).filter(CommunityGroupChat.id == row_id).first()
        if existing:
            existing.title = chat_settings.get("title", "Чат")
            existing.members_count = chat_settings.get("members_count", 0)
            existing.photo_url = photo_url
            existing.state = chat_settings.get("state")
            existing.unread_count = conv.get("unread_count", 0)
            existing.last_message_json = json.dumps(last_message, ensure_ascii=False) if last_message else None
            existing.last_message_sender = last_message_sender
            existing.last_synced_at = now
        else:
            db.add(CommunityGroupChat(
                id=row_id,
                project_id=project_id,
                peer_id=peer_id,
                chat_id=chat_id,
                title=chat_settings.get("title", "Чат"),
                members_count=chat_settings.get("members_count", 0),
                photo_url=photo_url,
                state=chat_settings.get("state"),
                unread_count=conv.get("unread_count", 0),
                last_message_json=json.dumps(last_message, ensure_ascii=False) if last_message else None,
                last_message_sender=last_message_sender,
                last_synced_at=now,
            ))

    # Удаляем чаты, которых больше нет в VK (удалены/вышли)
    if synced_peer_ids:
        db.query(CommunityGroupChat).filter(
            CommunityGroupChat.project_id == project_id,
            ~CommunityGroupChat.peer_id.in_(synced_peer_ids),
        ).delete(synchronize_session=False)

    db.commit()

    # Возвращаем обновлённые данные из БД
    return get_community_chats(db, project_id)
