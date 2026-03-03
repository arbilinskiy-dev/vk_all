from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func
from database import get_db
from models_library.projects import Project
from models_library.logs import VkCallbackLog
import logging
import json

# Импорт модульной системы обработки событий (v2 — Redis Queue)
from services.vk_callback import (
    dispatch_event,
    get_dispatcher_stats,
    get_queue_size,
    get_queue_stats,
    clear_queue,
)

# Импорт сервиса автонастройки Callback
from services.callback_setup import detect_ngrok_url, get_callback_servers, get_callback_settings, detect_ssh_tunnel

# Импорт Pydantic-схем
from schemas.vk_callback_schemas import CallbackSetupRequest, CallbackSetupResponse

# Импорт сервисов бизнес-логики
from services.vk_callback.setup_orchestrator import orchestrate_callback_setup
from services.vk_callback.state_service import get_callback_state

router = APIRouter()
logger = logging.getLogger(__name__)


# ─── Основной эндпоинт VK Callback API ────────────────────────────

@router.post("/callback", include_in_schema=False)
@router.post("", include_in_schema=False)
@router.post("/", include_in_schema=False)
async def vk_callback_handler(request: Request, db: Session = Depends(get_db)):
    """
    Обработчик VK Callback API.
    
    Поток событий (v2):
    1. Парсим JSON от VK
    2. Логируем в БД (VkCallbackLog)
    3. confirmation → синхронно через dispatcher (VK ждёт код)
    4. Все остальные → dispatcher ставит в Redis-очередь (мгновенный ответ "ok")
    5. Worker-процесс обрабатывает из очереди
    """
    try:
        body = await request.json()
    except Exception as parse_err:
        # Логируем подробности для диагностики потерянных callback-событий
        raw_body = None
        try:
            raw_body = (await request.body()).decode('utf-8', errors='replace')[:500]
        except Exception:
            pass
        logger.warning(
            f"VK Callback: Не удалось распарсить JSON. "
            f"IP={request.client.host if request.client else '?'}, "
            f"Content-Type={request.headers.get('content-type', '?')}, "
            f"Body={raw_body}, Error={parse_err}"
        )
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    event_type = body.get("type")
    group_id = body.get("group_id")
    
    if not event_type or not group_id:
        return PlainTextResponse("ok")

    # --- Логирование запроса в БД ---
    try:
        log_entry = VkCallbackLog(
            type=str(event_type),
            group_id=int(group_id),
            payload=json.dumps(body, ensure_ascii=False)
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        logger.error(f"Ошибка сохранения callback лога: {e}")
        try:
            db.rollback()
        except Exception:
            pass

    # --- Confirmation: синхронная обработка ---
    if event_type == "confirmation":
        result, confirmation_code = dispatch_event(db, event_type, group_id, body)
        
        if confirmation_code:
            logger.info(f"Confirmation code для group={group_id}: '{confirmation_code}'")
            return PlainTextResponse(content=confirmation_code)
        
        # Fallback: прямой поиск в БД
        logger.warning(f"Dispatcher не вернул код, fallback для group={group_id}")
        search_id = str(group_id)
        project = db.query(Project).filter(Project.vkProjectId == search_id).first()
        
        if project and project.vk_confirmation_code:
            return PlainTextResponse(content=project.vk_confirmation_code.strip())
        
        # Попытка с отрицательным ID
        project_neg = db.query(Project).filter(Project.vkProjectId == f"-{search_id}").first()
        if project_neg and project_neg.vk_confirmation_code:
            return PlainTextResponse(content=project_neg.vk_confirmation_code.strip())

        logger.error(f"Confirmation code не найден для group={group_id}")
        return PlainTextResponse(content="code_not_found")

    # --- Все остальные события: в Redis-очередь ---
    result, _ = dispatch_event(db, event_type, group_id, body)
    
    if result:
        logger.info(
            f"Событие '{event_type}' group={group_id}: "
            f"{result.message} (action={result.action_taken})"
        )
    
    # Всегда "ok" — VK не должен слать повторы
    return PlainTextResponse(content="ok")


# ─── Эндпоинты логов ──────────────────────────────────────────────

@router.get("/logs")
def get_callback_logs(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    """Возвращает логи Callback API с названиями групп и общим количеством.
    Поддержка пагинации через offset/limit."""
    # Общее количество записей в таблице
    total_count = db.query(sa_func.count(VkCallbackLog.id)).scalar() or 0
    
    logs = (
        db.query(VkCallbackLog)
        .order_by(VkCallbackLog.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    # Предзагрузка проектов за один запрос (fix N+1)
    group_ids = list({str(log.group_id) for log in logs})
    projects_map: dict[str, str] = {}
    if group_ids:
        projects_list = db.query(Project).filter(Project.vkProjectId.in_(group_ids)).all()
        for p in projects_list:
            projects_map[p.vkProjectId] = p.vkGroupName or p.vkGroupShortName or p.name
    
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "type": log.type,
            "group_id": log.group_id,
            "payload": log.payload,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "group_name": projects_map.get(str(log.group_id), None),
        })
    
    return {"logs": result, "total_count": total_count}

@router.delete("/logs")
def delete_all_callback_logs(db: Session = Depends(get_db)):
    """Удаляет все логи Callback API"""
    count = db.query(VkCallbackLog).delete()
    db.commit()
    return {"deleted": count}

@router.delete("/logs/{log_id}")
def delete_callback_log(log_id: int, db: Session = Depends(get_db)):
    """Удаляет конкретный лог по ID"""
    log = db.query(VkCallbackLog).filter(VkCallbackLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
    return {"deleted": 1}

@router.post("/logs/delete-batch")
def delete_batch_callback_logs(ids: list[int], db: Session = Depends(get_db)):
    """Удаляет несколько логов по списку ID"""
    count = db.query(VkCallbackLog).filter(VkCallbackLog.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return {"deleted": count}


# ─── Автонастройка Callback API ────────────────────────────────────

@router.post("/setup-callback", response_model=CallbackSetupResponse)
def setup_callback_auto(req: CallbackSetupRequest, db: Session = Depends(get_db)):
    """
    Автоматическая настройка Callback-сервера VK для проекта.
    
    - Для продакшена/предпрода: создаёт сервер "smmit" → api.dosmmit.ru
    - Для локальной разработки: создаёт/обновляет "smmitloc" → ngrok URL
    """
    # Валидация проекта
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    if not project.communityToken:
        raise HTTPException(
            status_code=400, 
            detail="Токен сообщества не задан. Сначала укажите токен в настройках проекта."
        )
    
    if not project.vkProjectId:
        raise HTTPException(
            status_code=400,
            detail="ID группы VK не задан в настройках проекта."
        )
    
    # Делегируем бизнес-логику в сервис
    result = orchestrate_callback_setup(
        db=db,
        project=project,
        project_id=req.project_id,
        is_local=req.is_local,
        use_tunnel=req.use_tunnel,
        events=req.events,
    )
    
    return CallbackSetupResponse(**result)


@router.get("/detect-ngrok")
def detect_ngrok_endpoint():
    """
    Определяет ngrok URL на локальной машине.
    Полезно для проверки перед автонастройкой callback.
    """
    ngrok_url = detect_ngrok_url()
    if ngrok_url:
        return {"detected": True, "url": ngrok_url}
    return {"detected": False, "url": None, "message": "Ngrok не обнаружен. Запустите: ngrok http 8000"}


@router.get("/detect-tunnel")
def detect_tunnel_endpoint():
    """
    Проверяет, работает ли SSH reverse tunnel на VM.
    Полезно для проверки перед автонастройкой callback через tunnel.
    """
    tunnel_active = detect_ssh_tunnel()
    if tunnel_active:
        return {
            "detected": True,
            "url": "https://api.dosmmit.ru/api/vk/callback-local",
            "message": "SSH tunnel активен. Можно настраивать callback."
        }
    return {
        "detected": False,
        "url": None,
        "message": "SSH tunnel не обнаружен. Запустите: start_tunnel.bat"
    }


@router.get("/callback-servers/{project_id}")
def get_project_callback_servers(project_id: str, db: Session = Depends(get_db)):
    """
    Получает список Callback-серверов для проекта из VK API.
    Полезно для отображения текущего состояния серверов.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    if not project.communityToken:
        raise HTTPException(status_code=400, detail="Токен сообщества не задан")
    
    if not project.vkProjectId:
        raise HTTPException(status_code=400, detail="ID группы VK не задан")
    
    servers = get_callback_servers(int(project.vkProjectId), project.communityToken)
    return {"servers": servers}


@router.get("/callback-settings/{project_id}/{server_id}")
def get_project_callback_settings(project_id: str, server_id: int, db: Session = Depends(get_db)):
    """
    Получает текущие настройки событий (подписку) конкретного Callback-сервера из VK API.
    
    Возвращает:
    - server_id: ID сервера
    - events: dict с ключами событий и значениями 0/1
    - enabled_events: список включённых событий
    - enabled_count: количество включённых событий
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    if not project.communityToken:
        raise HTTPException(status_code=400, detail="Токен сообщества не задан")
    
    if not project.vkProjectId:
        raise HTTPException(status_code=400, detail="ID группы VK не задан")
    
    settings = get_callback_settings(
        group_id=int(project.vkProjectId),
        server_id=server_id,
        access_token=project.communityToken,
    )
    
    # VK API возвращает {"events": {"message_new": 1, "wall_post_new": 0, ...}, "api_version": "..."}
    events = settings.get("events", {})
    enabled_events = [k for k, v in events.items() if v == 1]
    
    return {
        "server_id": server_id,
        "events": events,
        "enabled_events": enabled_events,
        "enabled_count": len(enabled_events),
    }


@router.get("/callback-current/{project_id}")
def get_current_callback_state(project_id: str, is_local: bool = False, db: Session = Depends(get_db)):
    """
    Получает полное текущее состояние callback для проекта.
    Удобный «всё-в-одном» эндпоинт для фронтенда.
    """
    logger.info(f"[CALLBACK-STATE] 📥 Запрос текущего состояния callback для project_id={project_id}")
    
    # Валидация проекта
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        logger.warning(f"[CALLBACK-STATE] ❌ Проект {project_id} не найден в БД")
        raise HTTPException(status_code=404, detail="Проект не найден")
    
    logger.info(f"[CALLBACK-STATE] 📋 Проект: \"{project.name}\" (group_id={project.vkProjectId}, token={'есть' if project.communityToken else 'НЕТ'})")
    
    if not project.communityToken:
        logger.warning(f"[CALLBACK-STATE] ❌ Токен не задан для \"{project.name}\"")
        raise HTTPException(status_code=400, detail="Токен сообщества не задан")
    
    if not project.vkProjectId:
        logger.warning(f"[CALLBACK-STATE] ❌ ID группы VK не задан для \"{project.name}\"")
        raise HTTPException(status_code=400, detail="ID группы VK не задан")
    
    # Делегируем бизнес-логику в сервис
    return get_callback_state(
        group_id=int(project.vkProjectId),
        token=project.communityToken,
        project_name=project.name,
        is_local=is_local,
    )


# ─── Эндпоинты статистики системы ─────────────────────────────────

@router.get("/stats")
def get_callback_system_stats():
    """
    Статистика системы обработки Callback событий.
    
    Возвращает:
    - Количество зарегистрированных хендлеров
    - Покрытие типов событий
    - Размер Redis-очереди
    - Конфигурацию воркера
    """
    return get_dispatcher_stats()

@router.get("/queue")
def get_callback_queue_stats():
    """Статистика Redis-очереди событий."""
    return get_queue_stats()

@router.delete("/queue")
def clear_callback_queue():
    """Очистить Redis-очередь событий (экстренная операция)."""
    cleared = clear_queue()
    return {"cleared": cleared}
