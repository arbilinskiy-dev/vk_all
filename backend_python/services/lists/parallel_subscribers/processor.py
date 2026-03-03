"""
Модуль обработки подписчиков одного проекта.

Содержит логику скачивания подписчиков из VK и сохранения их в БД.
"""

import time
import uuid
import logging
from datetime import datetime, timezone
from typing import Set

import crud
from database import SessionLocal
from services.vk_api.api_client import call_vk_api as raw_vk_call, VkApiError
import services.vk_service as vk_service
from services.lists.parallel_common import BulkRefreshState, ProjectStatus
from services.lists.subscribers.config import EXECUTE_BATCH_SIZE
from services.lists.subscribers.workers import _fetch_batch_execute_members
from utils.db_diagnostics import log_pool_status, log_session_status, OperationTimer

from .progress import update_task_progress

logger = logging.getLogger(__name__)


def process_single_project(
    state: BulkRefreshState, 
    project_id: str, 
    token: str, 
    token_name: str
) -> bool:
    """
    Обрабатывает подписчиков одного проекта.
    
    Выполняет полный цикл: инициализация -> скачивание -> сохранение.
    
    Args:
        state: Общее состояние задачи
        project_id: ID проекта
        token: Токен VK
        token_name: Имя токена для логов
        
    Returns:
        True если успешно, False если flood control (токен нужно отключить)
    """
    state.update_project(project_id, status=ProjectStatus.PROCESSING)
    update_task_progress(state)
    
    # === ЭТАП 1: ИНИЦИАЛИЗАЦИЯ ===
    init_data = _initialize_project(state, project_id)
    if init_data is None:
        return True  # Ошибка уже залогирована
    
    project_vk_id, project_name, db_ids_set = init_data
    
    # === ЭТАП 2: СКАЧИВАНИЕ ПОДПИСЧИКОВ ===
    fetch_result = _fetch_project_subscribers(
        state, project_id, project_vk_id, project_name, token, token_name
    )
    
    if fetch_result is None:
        return False  # Flood control
    if fetch_result == []:
        return True  # Пусто или ошибка (уже обработано)
    
    all_members = fetch_result
    
    # === ЭТАП 3: СОХРАНЕНИЕ ===
    return _save_project_subscribers(
        state, project_id, project_name, token_name, all_members, db_ids_set
    )


def _initialize_project(state: BulkRefreshState, project_id: str):
    """
    Инициализирует данные проекта из БД.
    
    Returns:
        Tuple[vk_id, name, db_ids_set] или None при ошибке
    """
    logger.debug(f"[INIT] {project_id} | Opening DB session")
    log_pool_status(f"INIT_START:{project_id}")
    
    db = SessionLocal()
    try:
        log_session_status(db, f"INIT_SESSION:{project_id}")
        
        with OperationTimer("get_project", project_id):
            project = crud.get_project_by_id(db, project_id)
        
        if not project:
            state.mark_project_error(project_id, "Проект не найден")
            return None
        
        project_vk_id = str(project.vkProjectId)
        project_name = str(project.name)
        
        with OperationTimer("get_subscriber_ids", project_name):
            db_ids_set = crud.get_all_subscriber_vk_ids(db, project_id)
        
        logger.debug(f"[INIT] {project_name} | Existing subscribers: {len(db_ids_set)}")
        return (project_vk_id, project_name, db_ids_set)
        
    except Exception as e:
        logger.error(f"[INIT_ERROR] {project_id} | {e}")
        log_session_status(db, f"INIT_ERROR:{project_id}")
        log_pool_status(f"INIT_ERROR:{project_id}")
        state.mark_project_error(project_id, f"Ошибка инициализации: {e}")
        return None
    finally:
        db.close()
        logger.debug(f"[INIT] {project_id} | DB session closed")


def _fetch_project_subscribers(
    state: BulkRefreshState,
    project_id: str,
    project_vk_id: str,
    project_name: str,
    token: str,
    token_name: str
):
    """
    Скачивает подписчиков проекта из VK.
    
    Returns:
        - None: flood control (нужно отключить токен)
        - []: пусто или ошибка
        - list: успешно скачанные подписчики
    """
    all_members = []
    
    try:
        state.update_project(project_id, status=ProjectStatus.FETCHING)
        update_task_progress(state)
        
        print(f"   [{token_name}] Обработка: {project_name}")
        
        numeric_id = vk_service.resolve_vk_group_id(project_vk_id, token)
        fields = 'sex,bdate,city,country,photo_100,domain,has_mobile,last_seen'
        
        # Получаем количество подписчиков
        try:
            initial_resp = raw_vk_call('groups.getMembers', {
                'group_id': numeric_id, 
                'count': 1, 
                'access_token': token
            }, project_id=project_id)
            total_vk_count = initial_resp.get('count', 0)
        except VkApiError as e:
            if e.code == 9:
                print(f"   [{token_name}] FLOOD CONTROL при получении count!")
                return None
            state.mark_project_error(project_id, f"VK Error {e.code}: {e}")
            return []
        except Exception as e:
            state.mark_project_error(project_id, f"Ошибка получения count: {e}")
            return []
        
        state.update_project(project_id, total=total_vk_count)
        update_task_progress(state)
        
        if total_vk_count == 0:
            state.mark_project_done(project_id, added=0, left=0)
            return []
        
        # Разбиваем на чанки
        tasks_params = []
        current_offset = 0
        while current_offset < total_vk_count:
            remaining = total_vk_count - current_offset
            chunk_size = min(remaining, EXECUTE_BATCH_SIZE)
            tasks_params.append({"offset": current_offset, "count": chunk_size})
            current_offset += chunk_size
        
        total_fetched = 0
        
        # Загрузка чанков
        for i, params in enumerate(tasks_params):
            try:
                items = _fetch_batch_execute_members(
                    [token],
                    i, 
                    numeric_id, 
                    params['offset'], 
                    params['count'], 
                    fields, 
                    project_id
                )
                all_members.extend(items)
                total_fetched += len(items)
                state.update_project(project_id, loaded=total_fetched)
                update_task_progress(state)
                
                time.sleep(0.5)
                
            except VkApiError as e:
                if e.code == 9:
                    print(f"   [{token_name}] FLOOD CONTROL при скачивании chunk {i}!")
                    return None
                print(f"   [{token_name}] Chunk {i} failed: {e}")
            except Exception as e:
                print(f"   [{token_name}] Chunk {i} failed: {e}")
        
        # Проверяем порог успешности (90%)
        threshold = int(total_vk_count * 0.90)
        if total_fetched < threshold:
            state.mark_project_error(project_id, 
                f"Скачано {total_fetched} из {total_vk_count} ({int(total_fetched/total_vk_count*100)}%)")
            return []
        
        return all_members
            
    except VkApiError as e:
        if e.code == 9:
            return None
        state.mark_project_error(project_id, f"VK Error {e.code}: {e}")
        return []
    except Exception as e:
        state.mark_project_error(project_id, f"Ошибка скачивания: {e}")
        return []


def _save_project_subscribers(
    state: BulkRefreshState,
    project_id: str,
    project_name: str,
    token_name: str,
    all_members: list,
    db_ids_set: Set[int]
) -> bool:
    """
    Сохраняет скачанных подписчиков в БД.
    
    Сравнивает с текущим списком в БД:
    - Новые подписчики добавляются
    - Ушедшие подписчики удаляются
    - Изменения записываются в историю
    
    Returns:
        True всегда (ошибки логируются, но не требуют отключения токена)
    """
    state.update_project(project_id, status=ProjectStatus.SAVING)
    update_task_progress(state)
    
    logger.info(f"[SAVE_START] {project_name} | Members to process: {len(all_members)}")
    log_pool_status(f"SAVE_START:{project_name}")
    
    db = SessionLocal()
    try:
        log_session_status(db, f"SAVE_SESSION:{project_name}")
        
        vk_members_map = {m['id']: m for m in all_members if 'id' in m}
        vk_ids_set = set(vk_members_map.keys())
        
        new_ids = list(vk_ids_set - db_ids_set)
        left_ids = list(db_ids_set - vk_ids_set)
        
        logger.info(f"[SAVE] {project_name} | New: {len(new_ids)} | Left: {len(left_ids)}")
        
        timestamp = datetime.now(timezone.utc)
        
        # Сохраняем новых подписчиков
        with OperationTimer("save_new_subscribers", f"{project_name}:{len(new_ids)}"):
            _save_new_subscribers(db, project_id, new_ids, vk_members_map, timestamp, project_name)
        
        log_session_status(db, f"AFTER_SAVE_NEW:{project_name}")
        
        # Обрабатываем ушедших подписчиков
        with OperationTimer("process_left_subscribers", f"{project_name}:{len(left_ids)}"):
            _process_left_subscribers(db, project_id, left_ids, timestamp, project_name)
        
        log_session_status(db, f"AFTER_PROCESS_LEFT:{project_name}")
        log_pool_status(f"SAVE_DONE:{project_name}")
        
        state.mark_project_done(project_id, added=len(new_ids), left=len(left_ids))
        logger.info(f"[SAVE_COMPLETE] {project_name} | +{len(new_ids)} / -{len(left_ids)}")
        print(f"   [{token_name}] ✓ {project_name}: +{len(new_ids)} / -{len(left_ids)}")
        return True
        
    except Exception as e:
        logger.error(f"[SAVE_ERROR] {project_name} | {e}")
        log_session_status(db, f"SAVE_ERROR:{project_name}")
        log_pool_status(f"SAVE_ERROR:{project_name}")
        
        import traceback
        logger.error(f"[SAVE_ERROR_TRACE] {project_name} | {traceback.format_exc()}")
        
        db.rollback()
        state.mark_project_error(project_id, f"Ошибка сохранения: {e}")
        return True
    finally:
        db.close()
        logger.debug(f"[SAVE] {project_name} | DB session closed")


def _save_new_subscribers(db, project_id: str, new_ids: list, vk_members_map: dict, timestamp, project_name: str = ""):
    """Сохраняет новых подписчиков в БД."""
    BATCH_SIZE = 1000
    total_batches = (len(new_ids) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for i in range(0, len(new_ids), BATCH_SIZE):
        batch_num = i // BATCH_SIZE + 1
        batch_ids = new_ids[i:i + BATCH_SIZE]
        new_subscribers_data = []
        new_history_data = []
        
        for vk_id in batch_ids:
            vk_data = vk_members_map[vk_id]
            base_data = _parse_subscriber_data(project_id, vk_id, vk_data)
            
            subscriber_entry = base_data.copy()
            subscriber_entry["id"] = f"{project_id}_{vk_id}"
            subscriber_entry["added_at"] = timestamp
            new_subscribers_data.append(subscriber_entry)
            
            history_entry = base_data.copy()
            history_entry["id"] = str(uuid.uuid4())
            history_entry["event_date"] = timestamp
            new_history_data.append(history_entry)
        
        # Замеряем время каждого батча
        batch_start = datetime.now()
        crud.bulk_add_subscribers(db, new_subscribers_data)
        crud.bulk_add_history_join(db, new_history_data)
        batch_duration = (datetime.now() - batch_start).total_seconds()
        
        if batch_duration > 5:
            logger.warning(f"[SLOW_BATCH] {project_name} | Batch {batch_num}/{total_batches} took {batch_duration:.2f}s")
        else:
            logger.debug(f"[BATCH] {project_name} | Batch {batch_num}/{total_batches} done in {batch_duration:.2f}s")
        
        # Пауза между батчами для снижения нагрузки на пул соединений
        if i + BATCH_SIZE < len(new_ids):
            time.sleep(0.3)


def _process_left_subscribers(db, project_id: str, left_ids: list, timestamp, project_name: str = ""):
    """Обрабатывает ушедших подписчиков — записывает в историю и удаляет."""
    BATCH_SIZE = 1000
    total_batches = (len(left_ids) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for i in range(0, len(left_ids), BATCH_SIZE):
        batch_num = i // BATCH_SIZE + 1
        batch_ids = left_ids[i:i + BATCH_SIZE]
        
        batch_start = datetime.now()
        leavers_data = crud.get_subscribers_by_vk_ids(db, project_id, batch_ids)
        
        leave_history = []
        for leaver in leavers_data:
            leave_history.append({
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "vk_user_id": leaver.vk_user_id,
                "first_name": leaver.first_name,
                "last_name": leaver.last_name,
                "sex": leaver.sex,
                "photo_url": leaver.photo_url,
                "domain": leaver.domain,
                "bdate": leaver.bdate,
                "city": leaver.city,
                "country": leaver.country,
                "has_mobile": leaver.has_mobile,
                "deactivated": leaver.deactivated,
                "last_seen": leaver.last_seen,
                "platform": leaver.platform,
                "event_date": timestamp,
                "source": "manual"
            })
        
        if leave_history:
            crud.bulk_add_history_leave(db, leave_history)
        crud.bulk_delete_subscribers(db, project_id, batch_ids)
        
        batch_duration = (datetime.now() - batch_start).total_seconds()
        if batch_duration > 5:
            logger.warning(f"[SLOW_BATCH] {project_name} | Left batch {batch_num}/{total_batches} took {batch_duration:.2f}s")
        else:
            logger.debug(f"[BATCH] {project_name} | Left batch {batch_num}/{total_batches} done in {batch_duration:.2f}s")
        
        # Пауза между батчами
        if i + BATCH_SIZE < len(left_ids):
            time.sleep(0.3)


def _parse_subscriber_data(project_id: str, vk_id: int, vk_data: dict) -> dict:
    """Парсит данные подписчика из VK в формат для БД."""
    return {
        "project_id": project_id,
        "vk_user_id": vk_id,
        "first_name": vk_data.get('first_name'),
        "last_name": vk_data.get('last_name'),
        "sex": vk_data.get('sex'),
        "photo_url": vk_data.get('photo_100'),
        "domain": vk_data.get('domain'),
        "bdate": vk_data.get('bdate'),
        "city": vk_data.get('city', {}).get('title') if vk_data.get('city') else None,
        "country": vk_data.get('country', {}).get('title') if vk_data.get('country') else None,
        "has_mobile": bool(vk_data.get('has_mobile')),
        "deactivated": vk_data.get('deactivated'),
        "last_seen": vk_data.get('last_seen', {}).get('time') if vk_data.get('last_seen') else None,
        "platform": vk_data.get('last_seen', {}).get('platform') if vk_data.get('last_seen') else None,
        "source": "manual"
    }
