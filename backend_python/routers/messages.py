"""
Роутер для модуля сообщений — тонкий хаб.
Вся бизнес-логика вынесена в services/messages/.
Pydantic-схемы — в schemas/messages_schemas.py.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import logging

from database import get_db
from services.vk_api.token_manager import call_vk_api_for_group
from services.auth_middleware import get_current_user, CurrentUser
from services.action_tracker import track
from crud import chat_action_crud

# Сервисы
from services.messages.vk_client import get_project_and_tokens
from services.messages.user_info_service import get_user_info
from services.messages.history_service import get_history
from services.messages.parallel_loader import load_all_messages
from services.messages import send_service
from services.messages.sse_service import create_global_unread_stream, create_project_stream
from services.messages import read_service
from crud import messages_crud

# Схемы
from schemas.messages_schemas import (
    LoadAllRequest,
    SendMessageRequest,
    MarkReadRequest,
    MarkAllReadRequest,
    MarkUnreadRequest,
    DialogFocusRequest,
    TypingStatusRequest,
    ConversationsInitRequest,
    ToggleImportantRequest,
)
from services.messages.conversations_init_service import conversations_init as conv_init_service
from services.messages.community_chats_service import (
    get_community_chats as community_chats_service,
    sync_community_chats as sync_community_chats_service,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/messages", tags=["Messages"])


# =============================================================================
# ЭНДПОИНТ 0: GET /messages/user-info
# =============================================================================

@router.get("/user-info")
def get_mailing_user_info(
    project_id: str = Query(..., description="ID проекта"),
    user_id: int = Query(..., description="VK user_id пользователя"),
    force_refresh: bool = Query(False, description="Принудительное обновление из VK API"),
    db: Session = Depends(get_db),
):
    """Получает данные пользователя из таблицы рассылки с авто-обновлением (TTL 24ч)."""
    project, community_tokens, group_id_int = get_project_and_tokens(db, project_id)
    return get_user_info(db, project_id, user_id, community_tokens, group_id_int, force_refresh)


# =============================================================================
# ЭНДПОИНТ: GET /messages/last-messages
# =============================================================================

@router.get("/last-messages")
def get_last_messages(
    project_id: str = Query(..., description="ID проекта"),
    user_ids: str = Query(..., description="Список vk_user_id через запятую"),
    db: Session = Depends(get_db),
):
    """Возвращает последнее сообщение для каждого диалога (пакетно)."""
    vk_ids = [int(uid.strip()) for uid in user_ids.split(",") if uid.strip().isdigit()]
    if not vk_ids:
        return {"success": True, "messages": {}}

    last_msgs = messages_crud.get_last_messages_batch(db, project_id, vk_ids)
    return {
        "success": True,
        "messages": {str(uid): msg for uid, msg in last_msgs.items()},
    }


# =============================================================================
# ЭНДПОИНТ 1: GET /messages/history
# =============================================================================

@router.get("/history")
def get_message_history(
    project_id: str = Query(..., description="ID проекта"),
    user_id: int = Query(..., description="VK user_id собеседника"),
    count: int = Query(50, ge=1, le=200, description="Количество сообщений"),
    offset: int = Query(0, ge=0, description="Смещение для пагинации"),
    force_refresh: bool = Query(False, description="Принудительная синхронизация с VK"),
    include_user_info: bool = Query(False, description="Включить данные пользователя"),
    direction: Optional[str] = Query(None, description="Фильтр по направлению: incoming | outgoing"),
    search: Optional[str] = Query(None, description="Поиск по тексту сообщений"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
):
    """Получает историю сообщений с кэшированием в БД."""
    project, community_tokens, group_id_int = get_project_and_tokens(db, project_id)
    return get_history(
        db, project_id, user_id, count, offset,
        force_refresh, include_user_info,
        project, community_tokens, group_id_int,
        background_tasks,
        direction=direction,
        search_text=search,
    )


# =============================================================================
# ЭНДПОИНТ 2: POST /messages/history/all
# =============================================================================

@router.post("/history/all")
def load_all_messages_endpoint(
    body: LoadAllRequest,
    db: Session = Depends(get_db),
):
    """Загружает ВСЕ сообщения с пользователем через пагинацию VK API."""
    project, community_tokens, group_id_int = get_project_and_tokens(db, body.project_id)
    return load_all_messages(db, body.project_id, body.user_id, community_tokens, group_id_int)


# =============================================================================
# ЭНДПОИНТ 3: POST /messages/send
# =============================================================================

@router.post("/send")
def send_message_endpoint(
    body: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Отправляет сообщение пользователю через VK API messages.send."""
    project, community_tokens, group_id_int = get_project_and_tokens(db, body.project_id)
    result = send_service.send_message(
        db, body.project_id, body.user_id, body.message,
        community_tokens, group_id_int,
        sender_id=body.sender_id,
        sender_name=body.sender_name,
        attachment=body.attachment,
        reply_to=body.reply_to,
        forward_messages=body.forward_messages,
        forward=body.forward,
        keyboard=body.keyboard,
    )
    track(db, current_user, "message_send", "messages",
          entity_type="message", project_id=body.project_id,
          metadata={"user_id": body.user_id})

    # Логируем пересылку сообщений в групповой чат
    if body.forward and body.user_id >= 2000000000:
        try:
            import json as _json
            fwd = _json.loads(body.forward)
            source_peer_id = fwd.get("peer_id")
            msg_count = len(fwd.get("conversation_message_ids", []))
            if source_peer_id:
                _log_and_broadcast_chat_action(
                    db, body.project_id, source_peer_id,
                    current_user.user_id, current_user.username,
                    "forward_to_chat",
                    metadata={
                        "target_chat_id": body.user_id,
                        "messages_count": msg_count,
                    },
                )
        except Exception:
            pass  # некритичная функция, не блокируем отправку

    return result


# =============================================================================
# ЭНДПОИНТ 4: POST /messages/upload-attachment
# Загрузка фото/документа для отправки в сообщении.
# Возвращает VK attachment ID (например "photo-123_456").
# =============================================================================

@router.post("/upload-attachment")
def upload_message_attachment(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    user_id: int = Form(...),
    db: Session = Depends(get_db),
):
    """
    Загружает файл (фото / видео / документ) для отправки в личном сообщении.
    Автоматически определяет тип файла по content-type и использует соответствующий VK API.
    Возвращает attachment_id вида 'photo{owner_id}_{id}', 'video{owner_id}_{id}', 'doc{owner_id}_{id}'.
    """
    from services.vk_api.upload import upload_message_photo, upload_message_doc, upload_message_video

    project, community_tokens, group_id_int = get_project_and_tokens(db, project_id)

    # Читаем байты файла
    file_bytes = file.file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Файл пуст")

    content_type = (file.content_type or '').lower()
    file_name = file.filename or 'file'

    # ─── Определяем тип вложения по MIME-type ───────────────────────
    if content_type.startswith('image/'):
        attach_type = 'photo'
    elif content_type.startswith('video/'):
        attach_type = 'video'
    else:
        attach_type = 'doc'  # Всё остальное — документ

    logger.info(f"MESSAGES UPLOAD: type={attach_type}, content_type={content_type}, "
                f"file={file_name} (project={project_id}, user={user_id})")

    try:
        # ─── ФОТО ──────────────────────────────────────────────────
        if attach_type == 'photo':
            saved = upload_message_photo(
                group_id=group_id_int,
                peer_id=user_id,
                file_bytes=file_bytes,
                file_name=file_name,
                community_tokens=community_tokens,
            )
            owner_id = saved.get('owner_id')
            item_id = saved.get('id')
            if not owner_id or not item_id:
                raise HTTPException(status_code=500, detail="VK API вернул неполные данные фото")

            attachment_id = f"photo{owner_id}_{item_id}"

            # Лучший URL превью
            sizes = saved.get('sizes', [])
            best = next((s for s in sizes if s.get('type') == 'x'), None)
            if not best:
                best = next((s for s in sizes if s.get('type') == 'y'), None)
            if not best and sizes:
                best = sorted(sizes, key=lambda s: s.get('width', 0), reverse=True)[0]
            preview_url = best.get('url', '') if best else ''

            return {
                "success": True,
                "attachment_id": attachment_id,
                "attachment_type": "photo",
                "preview_url": preview_url,
                "file_name": file_name,
            }

        # ─── ВИДЕО ─────────────────────────────────────────────────
        elif attach_type == 'video':
            saved = upload_message_video(
                group_id=group_id_int,
                peer_id=user_id,
                file_bytes=file_bytes,
                file_name=file_name,
                community_tokens=community_tokens,
                name=file_name.rsplit('.', 1)[0] if '.' in file_name else file_name,
            )
            owner_id = saved.get('owner_id')
            video_id = saved.get('video_id')
            access_key = saved.get('access_key', '')
            if not owner_id or not video_id:
                raise HTTPException(status_code=500, detail="VK API вернул неполные данные видео")

            attachment_id = f"video{owner_id}_{video_id}"
            if access_key:
                attachment_id += f"_{access_key}"

            return {
                "success": True,
                "attachment_id": attachment_id,
                "attachment_type": "video",
                "preview_url": "",  # Превью видео генерируется VK асинхронно
                "file_name": saved.get('title', file_name),
            }

        # ─── ДОКУМЕНТ ──────────────────────────────────────────────
        else:
            saved = upload_message_doc(
                group_id=group_id_int,
                peer_id=user_id,
                file_bytes=file_bytes,
                file_name=file_name,
                community_tokens=community_tokens,
            )
            owner_id = saved.get('owner_id')
            doc_id = saved.get('id')
            if not owner_id or not doc_id:
                raise HTTPException(status_code=500, detail="VK API вернул неполные данные документа")

            attachment_id = f"doc{owner_id}_{doc_id}"
            preview_url = ''
            # Документы могут иметь превью (изображения-gif, pdf)
            preview = saved.get('preview', {})
            photo = preview.get('photo', {})
            photo_sizes = photo.get('sizes', [])
            if photo_sizes:
                preview_url = photo_sizes[-1].get('src', '')

            return {
                "success": True,
                "attachment_id": attachment_id,
                "attachment_type": "document",
                "preview_url": preview_url,
                "file_name": saved.get('title', file_name),
                "file_size": saved.get('size', 0),
                "file_url": saved.get('url', ''),
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MESSAGES UPLOAD: Ошибка — {e} (type={attach_type}, project={project_id}, user={user_id})")
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки {attach_type}: {str(e)}")


# =============================================================================
# SSE STREAM — push-уведомления
# =============================================================================

@router.get("/global-unread-stream")
async def global_unread_sse_stream():
    """Глобальный SSE-стрим для счётчиков непрочитанных диалогов по ВСЕМ проектам."""
    return await create_global_unread_stream()


@router.get("/stream")
async def messages_sse_stream(
    project_id: str = Query(..., description="ID проекта"),
    manager_id: str = Query("anonymous", description="ID менеджера"),
    manager_name: str = Query("", description="Имя менеджера"),
):
    """SSE поток для push-уведомлений по проекту."""
    return await create_project_stream(project_id, manager_id, manager_name)


# =============================================================================
# MARK-READ / MARK-UNREAD / MARK-ALL-READ
# =============================================================================

@router.put("/mark-read")
def mark_dialog_as_read(
    body: MarkReadRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Помечает диалог как прочитанный (локально + в VK API)."""
    # Получаем токены проекта для VK API
    try:
        _project, community_tokens, group_id_int = get_project_and_tokens(db, body.project_id)
    except Exception:
        community_tokens, group_id_int = [], 0
    result = read_service.mark_dialog_read(
        db, body.project_id, body.user_id, body.manager_id,
        community_tokens=community_tokens, group_id_int=group_id_int,
    )
    was_unread = result.get("was_unread", False)
    # Трекаем вход в диалог (всегда)
    track(db, current_user, "message_dialog_read", "messages",
          entity_type="dialog", entity_id=str(body.user_id),
          project_id=body.project_id,
          metadata={"vk_user_id": body.user_id, "was_unread": was_unread})
    # Трекаем прочтение непрочитанного диалога (только если был непрочитанный)
    if was_unread:
        track(db, current_user, "message_unread_dialog_read", "messages",
              entity_type="dialog", entity_id=str(body.user_id),
              project_id=body.project_id,
              metadata={"vk_user_id": body.user_id})
    return result


@router.put("/mark-all-read")
def mark_all_dialogs_as_read(
    body: MarkAllReadRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Помечает ВСЕ диалоги проекта как прочитанные."""
    result = read_service.mark_all_dialogs_read(db, body.project_id, body.manager_id)
    track(db, current_user, "message_mark_all_read", "messages",
          entity_type="project", project_id=body.project_id)
    return result


@router.put("/mark-unread")
def mark_dialog_as_unread(
    body: MarkUnreadRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Помечает диалог как непрочитанный."""
    result = read_service.mark_dialog_unread(db, body.project_id, body.user_id, body.manager_id)
    track(db, current_user, "message_mark_unread", "messages",
          entity_type="dialog", entity_id=str(body.user_id),
          project_id=body.project_id,
          metadata={"vk_user_id": body.user_id})
    # Записываем действие «отметил непрочитанным» в хронологию чата
    _log_and_broadcast_chat_action(
        db, body.project_id, body.user_id,
        current_user.user_id, current_user.username,
        "mark_unread",
    )
    return result


# =============================================================================
# UNREAD COUNTS
# =============================================================================

@router.get("/unread-counts")
def get_unread_counts(
    project_id: str = Query(..., description="ID проекта"),
    user_ids: Optional[str] = Query(None, description="Список vk_user_id через запятую"),
    db: Session = Depends(get_db),
):
    """Возвращает количество непрочитанных входящих сообщений по диалогам."""
    return read_service.get_unread_counts(db, project_id, user_ids)


@router.get("/unread-dialog-counts-batch")
def get_unread_dialog_counts_batch(
    project_ids: str = Query(..., description="Список ID проектов через запятую"),
    db: Session = Depends(get_db),
):
    """Пакетный подсчёт диалогов с непрочитанными для нескольких проектов (один SQL)."""
    ids = [pid.strip() for pid in project_ids.split(",") if pid.strip()]
    return read_service.get_unread_dialog_counts_batch(db, ids)


# =============================================================================
# SSE STATS
# =============================================================================

@router.get("/sse-stats")
def get_sse_stats():
    """Возвращает статистику SSE-подключений."""
    try:
        from services.sse_manager import sse_manager
        return {"success": True, **sse_manager.get_stats()}
    except Exception as e:
        return {"success": False, "error": str(e)}


# =============================================================================
# DIALOG FOCUS / TYPING
# =============================================================================

@router.post("/dialog-focus")
def set_dialog_focus(body: DialogFocusRequest, db: Session = Depends(get_db)):
    """Устанавливает/снимает фокус менеджера на диалоге."""
    from services.sse_manager import sse_manager

    logger.info(
        f"POST /dialog-focus: action={body.action}, project_id={body.project_id}, "
        f"vk_user_id={body.vk_user_id}, manager_id={body.manager_id}, "
        f"manager_name={body.manager_name}, pid(sse_manager)={id(sse_manager)}"
    )

    if body.action == "enter":
        sse_manager.set_dialog_focus(
            body.project_id, body.vk_user_id,
            body.manager_id, body.manager_name,
        )
        # Записываем действие «зашёл в чат»
        _log_and_broadcast_chat_action(
            db, body.project_id, body.vk_user_id,
            body.manager_id, body.manager_name,
            "chat_enter",
        )
    elif body.action == "leave":
        sse_manager.remove_dialog_focus(
            body.project_id, body.vk_user_id,
            body.manager_id, body.manager_name,
        )
        # Записываем действие «вышел из чата»
        _log_and_broadcast_chat_action(
            db, body.project_id, body.vk_user_id,
            body.manager_id, body.manager_name,
            "chat_leave",
        )
    else:
        return {"success": False, "error": f"Неизвестное action: {body.action}"}

    return {"success": True, "action": body.action}


@router.post("/typing")
def send_typing_status(
    body: TypingStatusRequest,
    db: Session = Depends(get_db),
):
    """Отправляет статус "набирает текст" пользователю через VK API."""
    project, community_tokens, group_id_int = get_project_and_tokens(db, body.project_id)

    try:
        call_vk_api_for_group(
            method="messages.setActivity",
            params={
                "user_id": body.user_id,
                "type": "typing",
                "group_id": group_id_int,
            },
            group_id=group_id_int,
            community_tokens=community_tokens,
            project_id=body.project_id,
        )
        return {"success": True}
    except Exception as e:
        logger.warning(f"TYPING STATUS: ошибка VK API — {e} (project={body.project_id}, user={body.user_id})")
        return {"success": False, "error": str(e)}


# =============================================================================
# ЭНДПОИНТ: POST /messages/conversations-init
# Единый эндпоинт инициализации — заменяет 4 отдельных запроса
# =============================================================================

@router.post("/conversations-init")
def conversations_init(
    body: ConversationsInitRequest,
    db: Session = Depends(get_db),
):
    """
    Единый эндпоинт инициализации модуля сообщений.
    Возвращает подписчиков + непрочитанные + последние сообщения за один запрос.
    Заменяет waterfall из 4 запросов (2x getSubscribers + getUnreadCounts + getLastMessages).
    """
    return conv_init_service(
        db,
        body.project_id,
        body.page,
        sort_unread_first=body.sort_unread_first,
        filter_unread=body.filter_unread,
    )


# =============================================================================
# ЭНДПОИНТ: POST /messages/community-chats
# Список групповых чатов (бесед) сообщества (из кэша БД)
# =============================================================================

class CommunityChatsRequest(BaseModel):
    project_id: str

@router.post("/community-chats")
def get_community_chats(
    body: CommunityChatsRequest,
    db: Session = Depends(get_db),
):
    """Возвращает список групповых чатов из кэша БД (мгновенно)."""
    return community_chats_service(db, body.project_id)


# =============================================================================
# ЭНДПОИНТ: POST /messages/community-chats/sync
# Синхронизация чатов с VK API → сохранение в БД
# =============================================================================

@router.post("/community-chats/sync")
def sync_community_chats(
    body: CommunityChatsRequest,
    db: Session = Depends(get_db),
):
    """Синхронизирует чаты с VK API и сохраняет в БД. Медленная операция."""
    return sync_community_chats_service(db, body.project_id)


# =============================================================================
# ЭНДПОИНТ: PUT /messages/toggle-important
# Пометить/снять пометку «Важное» для диалога
# =============================================================================

@router.put("/toggle-important")
def toggle_important(
    body: ToggleImportantRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Переключить пометку «Важное» для диалога.
    Обновляет поле is_important в project_dialogs.
    """
    from models_library.dialogs_authors import ProjectDialog
    from models_library.vk_profiles import VkProfile

    dialog = (
        db.query(ProjectDialog)
        .join(VkProfile, ProjectDialog.vk_profile_id == VkProfile.id)
        .filter(
            ProjectDialog.project_id == body.project_id,
            VkProfile.vk_user_id == body.vk_user_id,
        )
        .first()
    )

    if not dialog:
        raise HTTPException(status_code=404, detail=f"Диалог не найден: project={body.project_id}, user={body.vk_user_id}")

    dialog.is_important = body.is_important
    db.commit()

    logger.info(
        f"TOGGLE_IMPORTANT: project={body.project_id}, user={body.vk_user_id}, "
        f"is_important={body.is_important}"
    )
    track(db, current_user, "message_toggle_important", "messages",
          entity_type="dialog", entity_id=str(body.vk_user_id),
          project_id=body.project_id,
          metadata={"vk_user_id": body.vk_user_id, "is_important": body.is_important})
    # Записываем действие в хронологию чата
    action_type = "mark_important" if body.is_important else "unmark_important"
    _log_and_broadcast_chat_action(
        db, body.project_id, body.vk_user_id,
        current_user.user_id, current_user.username,
        action_type,
    )
    return {"success": True, "is_important": body.is_important}


@router.get("/dialog-focuses")
def get_dialog_focuses(
    project_id: str = Query(..., description="ID проекта"),
):
    """Возвращает все активные фокусы менеджеров на диалогах для проекта."""
    from services.sse_manager import sse_manager

    focuses = sse_manager.get_all_dialog_focuses(project_id)
    logger.info(
        f"GET /dialog-focuses: project_id={project_id}, "
        f"найдено {len(focuses)} диалогов с фокусами, "
        f"pid(sse_manager)={id(sse_manager)}, "
        f"всего ключей в _dialog_focus={len(sse_manager._dialog_focus)}"
    )
    # Диагностика: логируем ВСЕ ключи в трекере для поиска кросс-проектных проблем
    for (pid, uid), managers in sse_manager._dialog_focus.items():
        logger.info(
            f"  _dialog_focus[({pid}, {uid})] → {list(managers.keys())}"
        )
    return {
        "success": True,
        "focuses": {str(uid): managers for uid, managers in focuses.items()},
    }


@router.get("/dialog-focuses-debug")
def get_dialog_focuses_debug():
    """ДИАГНОСТИКА: все фокусы всех проектов (для отладки кросс-проектного бага)."""
    from services.sse_manager import sse_manager

    all_focuses = {}
    with sse_manager._focus_lock:
        for (pid, uid), managers in sse_manager._dialog_focus.items():
            key = f"{pid}:{uid}"
            all_focuses[key] = [
                {"manager_id": mid, "manager_name": info["name"], "ts": info["ts"]}
                for mid, info in managers.items()
            ]

    stats = sse_manager.get_stats()
    return {
        "success": True,
        "instance_id": sse_manager._instance_id,
        "sse_manager_object_id": id(sse_manager),
        "total_focus_keys": len(sse_manager._dialog_focus),
        "all_focuses": all_focuses,
        "sse_stats": stats,
    }


# =============================================================================
# ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: запись действия + SSE
# =============================================================================

def _log_and_broadcast_chat_action(
    db: Session,
    project_id: str,
    vk_user_id: int,
    manager_id: str,
    manager_name: str,
    action_type: str,
    metadata: dict = None,
):
    """
    Записывает действие менеджера в chat_actions и публикует SSE 'chat_action'.
    Вызывается из эндпоинтов dialog-focus, mark-unread, toggle-important, label assign/unassign.
    """
    from services.sse_manager import sse_manager
    from services.sse_event import SSEEvent

    action = chat_action_crud.log_chat_action(
        db=db,
        project_id=project_id,
        vk_user_id=vk_user_id,
        manager_id=manager_id,
        manager_name=manager_name,
        action_type=action_type,
        metadata=metadata,
    )

    # SSE: транслируем действие всем подписчикам проекта
    import json as _json
    action_data = {
        "vk_user_id": vk_user_id,
        "action": {
            "id": f"action_{action.id}",
            "action_type": action_type,
            "manager_id": manager_id,
            "manager_name": manager_name,
            "timestamp": action.created_at.isoformat() if action.created_at else None,
        },
    }
    if metadata:
        action_data["action"]["metadata"] = metadata

    sse_manager.publish(SSEEvent(
        event_type="chat_action",
        project_id=project_id,
        data=action_data,
    ))

    return action


# =============================================================================
# ЭНДПОИНТ: GET /messages/chat-actions
# Получить действия менеджеров в диалоге (для хронологии чата)
# =============================================================================

@router.get("/chat-actions")
def get_chat_actions(
    project_id: str = Query(..., description="ID проекта"),
    vk_user_id: int = Query(..., description="VK user ID"),
    limit: int = Query(200, description="Максимум записей"),
    db: Session = Depends(get_db),
):
    """Возвращает действия менеджеров в диалоге для отображения в хронологии чата."""
    actions = chat_action_crud.get_chat_actions(db, project_id, vk_user_id, limit=limit)
    return {"success": True, "actions": actions}
