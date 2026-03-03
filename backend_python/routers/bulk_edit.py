# Роутер для массового редактирования постов

from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, Query
from sqlalchemy.orm import Session
import json
import uuid

import schemas
from database import get_db
from config import settings
from services import task_monitor
from services.bulk_edit import search_posts, execute_bulk_edit_task, execute_bulk_edit_task_async
from services.worker_pool import bulk_edit_pool, get_all_pools_stats


router = APIRouter(prefix="/bulkEdit", tags=["Bulk Edit"])


@router.post("/search", response_model=schemas.BulkEditSearchResponse)
def search_matching_posts(
    payload: schemas.BulkEditSearchRequest,
    db: Session = Depends(get_db)
):
    """
    Ищет посты по заданным критериям.
    Возвращает список найденных совпадений с метаинформацией.
    """
    import time as _time
    _start = _time.time()
    
    # === ДЕБАГ: Логируем входящий запрос ===
    print(f"\n{'='*60}", flush=True)
    print(f"[BULK_EDIT_ROUTER] POST /bulkEdit/search", flush=True)
    print(f"[BULK_EDIT_ROUTER] Исходный пост: id={payload.sourcePost.id}, type={payload.sourcePost.postType}, projectId={payload.sourcePost.projectId}", flush=True)
    print(f"[BULK_EDIT_ROUTER] Текст исходного поста ({len(payload.sourcePost.text)} симв.): '{payload.sourcePost.text[:100]}...'", flush=True)
    print(f"[BULK_EDIT_ROUTER] Дата исходного: {payload.sourcePost.date}", flush=True)
    print(f"[BULK_EDIT_ROUTER] Критерии: byDateTime={payload.matchCriteria.byDateTime}, byText={payload.matchCriteria.byText}", flush=True)
    print(f"[BULK_EDIT_ROUTER] Дата начала поиска: {payload.searchFromDate}", flush=True)
    print(f"[BULK_EDIT_ROUTER] Типы постов: published={payload.targetPostTypes.published}, scheduled={payload.targetPostTypes.scheduled}, system={payload.targetPostTypes.system}", flush=True)
    print(f"[BULK_EDIT_ROUTER] Проекты: {len(payload.targetProjectIds)} шт: {payload.targetProjectIds}", flush=True)
    # === /ДЕБАГ ===
    
    # Валидация: хотя бы один критерий должен быть выбран
    if not any([
        payload.matchCriteria.byDateTime,
        payload.matchCriteria.byText
    ]):
        print(f"[BULK_EDIT_ROUTER] ❌ Валидация: ни один критерий не выбран", flush=True)
        raise HTTPException(
            status_code=400,
            detail="At least one match criteria must be selected"
        )
    
    # Валидация: хотя бы один тип поста должен быть выбран
    if not any([
        payload.targetPostTypes.published,
        payload.targetPostTypes.scheduled,
        payload.targetPostTypes.system
    ]):
        print(f"[BULK_EDIT_ROUTER] ❌ Валидация: ни один тип поста не выбран", flush=True)
        raise HTTPException(
            status_code=400,
            detail="At least one post type must be selected"
        )
    
    # Валидация: должны быть указаны проекты
    if not payload.targetProjectIds:
        print(f"[BULK_EDIT_ROUTER] ❌ Валидация: нет проектов", flush=True)
        raise HTTPException(
            status_code=400,
            detail="Target project IDs must not be empty"
        )
    
    result = search_posts(db, payload)
    
    # === ДЕБАГ: Логируем результат ===
    _elapsed = round((_time.time() - _start) * 1000)
    print(f"[BULK_EDIT_ROUTER] ✅ Поиск завершён за {_elapsed}ms", flush=True)
    print(f"[BULK_EDIT_ROUTER] Найдено: {result.stats.totalFound} постов в {result.stats.projectCount} проектах", flush=True)
    print(f"[BULK_EDIT_ROUTER] По типам: {result.stats.byType}", flush=True)
    for mp in result.matchedPosts[:5]:
        print(f"[BULK_EDIT_ROUTER]   - id={mp.id}, type={mp.postType}, project={mp.projectName}, date={mp.date}", flush=True)
    if len(result.matchedPosts) > 5:
        print(f"[BULK_EDIT_ROUTER]   ... и ещё {len(result.matchedPosts) - 5} постов", flush=True)
    print(f"{'='*60}\n", flush=True)
    # === /ДЕБАГ ===
    
    return result


@router.post("/apply", response_model=schemas.BulkEditApplyResponse)
def apply_bulk_edit(
    payload: schemas.BulkEditApplyRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    use_async: bool = Query(True, description="Использовать асинхронную обработку с динамическими воркерами")
):
    """
    Запускает фоновую задачу массового редактирования.
    Возвращает taskId для отслеживания прогресса.
    
    При use_async=True (по умолчанию) используется параллельная обработка
    с динамическим пулом воркеров для максимальной скорости.
    """
    # Валидация: должны быть посты для редактирования
    if not payload.posts:
        raise HTTPException(
            status_code=400,
            detail="No posts selected for editing"
        )
    
    # Валидация: должно быть хотя бы одно изменение
    if (payload.changes.text is None and 
        payload.changes.images is None and 
        payload.changes.attachments is None and 
        payload.changes.date is None):
        raise HTTPException(
            status_code=400,
            detail="No changes specified"
        )
    
    # Создаём задачу
    task_id = str(uuid.uuid4())
    
    # === ДЕБАГ: Логируем запрос на применение ===
    print(f"\n{'='*60}", flush=True)
    print(f"[BULK_EDIT_ROUTER] POST /bulkEdit/apply", flush=True)
    print(f"[BULK_EDIT_ROUTER] task_id: {task_id}", flush=True)
    print(f"[BULK_EDIT_ROUTER] Постов для редактирования: {len(payload.posts)}", flush=True)
    for i, p in enumerate(payload.posts[:10]):
        print(f"[BULK_EDIT_ROUTER]   #{i+1}: id={p.id}, type={p.postType}, projectId={p.projectId}", flush=True)
    if len(payload.posts) > 10:
        print(f"[BULK_EDIT_ROUTER]   ... и ещё {len(payload.posts) - 10}", flush=True)
    print(f"[BULK_EDIT_ROUTER] Изменения:", flush=True)
    print(f"[BULK_EDIT_ROUTER]   text: {'(есть, ' + str(len(payload.changes.text)) + ' симв.)' if payload.changes.text is not None else '(не меняется)'}", flush=True)
    print(f"[BULK_EDIT_ROUTER]   images: {'(есть, ' + str(len(payload.changes.images)) + ' шт.)' if payload.changes.images is not None else '(не меняется)'}", flush=True)
    print(f"[BULK_EDIT_ROUTER]   attachments: {'(есть, ' + str(len(payload.changes.attachments)) + ' шт.)' if payload.changes.attachments is not None else '(не меняется)'}", flush=True)
    print(f"[BULK_EDIT_ROUTER]   date: {payload.changes.date if payload.changes.date is not None else '(не меняется)'}", flush=True)
    print(f"[BULK_EDIT_ROUTER]   use_async: {use_async}", flush=True)
    # === /ДЕБАГ ===
    
    # Определяем количество проектов для описания
    unique_projects = set(p.projectId for p in payload.posts)
    mode = "async" if use_async else "sync"
    task_description = f"Массовое редактирование {len(payload.posts)} постов в {len(unique_projects)} проектах ({mode})"
    
    # Инициализируем задачу в мониторе
    task_monitor.start_task(task_id, 'bulk_edit', task_description)
    
    # Выбираем способ выполнения
    if use_async:
        # Асинхронная версия с динамическими воркерами
        background_tasks.add_task(
            execute_bulk_edit_task_async,
            task_id,
            payload,
            settings.vk_user_token
        )
    else:
        # Синхронная версия (legacy)
        background_tasks.add_task(
            execute_bulk_edit_task,
            task_id,
            payload,
            settings.vk_user_token
        )
    
    print(f"[BULK_EDIT_ROUTER] ✅ Задача создана и запущена в фоне: {task_id}", flush=True)
    print(f"{'='*60}\n", flush=True)
    
    return schemas.BulkEditApplyResponse(taskId=task_id)


@router.get("/status/{task_id}", response_model=schemas.BulkEditTaskStatus)
def get_bulk_edit_status(task_id: str):
    """
    Возвращает статус фоновой задачи массового редактирования.
    """
    # === ДЕБАГ ===
    print(f"[BULK_EDIT_ROUTER] GET /bulkEdit/status/{task_id}", flush=True)
    # === /ДЕБАГ ===
    
    status = task_monitor.get_task_status(task_id)
    
    if status is None:
        print(f"[BULK_EDIT_ROUTER] ❌ Задача {task_id} не найдена в task_monitor!", flush=True)
        # === ДЕБАГ: Покажем все активные задачи ===
        all_tasks = task_monitor.get_all_tasks() if hasattr(task_monitor, 'get_all_tasks') else None
        if all_tasks:
            print(f"[BULK_EDIT_ROUTER] Все задачи в мониторе: {list(all_tasks.keys())}", flush=True)
        else:
            print(f"[BULK_EDIT_ROUTER] task_monitor не имеет метода get_all_tasks или пуст", flush=True)
        # === /ДЕБАГ ===
        raise HTTPException(
            status_code=404,
            detail=f"Task {task_id} not found"
        )
    
    # === ДЕБАГ ===
    task_status_str = status.get('status', 'pending')
    print(f"[BULK_EDIT_ROUTER] Статус {task_id}: {task_status_str}, loaded={status.get('loaded', 0)}/{status.get('total', 0)}", flush=True)
    # === /ДЕБАГ ===
    
    # Извлекаем данные из плоских полей task_monitor
    task_status_val = status.get('status', 'pending')
    loaded = status.get('loaded', 0) or 0
    total = status.get('total', 0) or 0
    failed = status.get('sub_loaded', 0) or 0  # sub_loaded хранит количество ошибок
    message_raw = status.get('message', '')
    error_raw = status.get('error', '')
    
    # Пытаемся распарсить JSON из message (финальный статус содержит мета-данные)
    affected_project_ids = []
    if task_status_val in ('done', 'error') and message_raw:
        try:
            meta = json.loads(message_raw)
            if isinstance(meta, dict):
                # Если message содержит JSON-метаданные, извлекаем из них прогресс
                progress_data = meta.get('progress', {})
                loaded = progress_data.get('completed', loaded)
                total = progress_data.get('total', total)
                failed = progress_data.get('failed', failed)
                affected_project_ids = meta.get('affectedProjectIds', [])
        except (json.JSONDecodeError, TypeError):
            pass
    
    # Пытаемся распарсить errors из поля error (JSON-массив)
    errors_list = []
    if error_raw:
        try:
            parsed_errors = json.loads(error_raw)
            if isinstance(parsed_errors, list):
                errors_list = [
                    schemas.TaskError(
                        postId=err.get('postId', ''),
                        projectName=err.get('projectName', ''),
                        error=err.get('error', '')
                    )
                    for err in parsed_errors
                ]
        except (json.JSONDecodeError, TypeError):
            # Если error — просто строка, не JSON
            if error_raw:
                errors_list = [schemas.TaskError(postId='', projectName='', error=error_raw)]
    
    if errors_list:
        print(f"[BULK_EDIT_ROUTER] Ошибки: {len(errors_list)} шт.", flush=True)
    
    # Преобразуем в нужный формат
    return schemas.BulkEditTaskStatus(
        status=task_status_val,
        progress=schemas.TaskProgress(
            total=total,
            completed=loaded,
            failed=failed,
            current=None
        ),
        errors=errors_list,
        affectedProjectIds=affected_project_ids
    )


# === Эндпоинты управления воркерами ===

@router.get("/workers/stats")
def get_worker_stats():
    """
    Возвращает статистику всех пулов воркеров.
    Полезно для мониторинга производительности.
    """
    all_stats = get_all_pools_stats()
    
    def format_stats(stats):
        return {
            'currentWorkers': stats.current_workers,
            'activeWorkers': stats.active_workers,
            'loadPercent': round((stats.active_workers / stats.current_workers * 100) if stats.current_workers > 0 else 0),
            'completedTasks': stats.completed_tasks,
            'failedTasks': stats.failed_tasks,
            'avgTaskTimeMs': round(stats.avg_task_time_ms, 2),
            'scaleUps': stats.total_scale_ups,
            'scaleDowns': stats.total_scale_downs,
            'lastScaleDirection': stats.last_scale_direction.value if stats.last_scale_direction else None
        }
    
    return {
        pool_name: format_stats(stats) 
        for pool_name, stats in all_stats.items()
    }


@router.get("/workers/bulk-edit")
def get_bulk_edit_pool_stats():
    """
    Возвращает детальную статистику пула воркеров bulk edit.
    """
    stats = bulk_edit_pool.stats
    return {
        'pool': 'bulk_edit',
        'config': {
            'minWorkers': bulk_edit_pool.min_workers,
            'maxWorkers': bulk_edit_pool.max_workers,
            'scaleUpThreshold': f"{bulk_edit_pool.scale_up_threshold:.0%}",
            'scaleDownThreshold': f"{bulk_edit_pool.scale_down_threshold:.0%}",
            'cooldownSeconds': bulk_edit_pool.cooldown_seconds
        },
        'current': {
            'workers': stats.current_workers,
            'active': stats.active_workers,
            'load': f"{(stats.active_workers / stats.current_workers * 100) if stats.current_workers > 0 else 0:.0f}%"
        },
        'performance': {
            'completedTasks': stats.completed_tasks,
            'failedTasks': stats.failed_tasks,
            'avgTaskTimeMs': round(stats.avg_task_time_ms, 2),
            'totalScaleUps': stats.total_scale_ups,
            'totalScaleDowns': stats.total_scale_downs
        }
    }


@router.post("/workers/scale")
async def scale_workers(
    workers: int = Query(..., ge=1, le=50, description="Количество воркеров (1-50)")
):
    """
    Принудительно устанавливает количество воркеров в пуле bulk edit.
    Используйте осторожно — это влияет на все активные задачи.
    """
    old_count = bulk_edit_pool.current_workers
    await bulk_edit_pool.set_workers(workers)
    
    return {
        'success': True,
        'message': f'Workers scaled from {old_count} to {bulk_edit_pool.current_workers}',
        'oldWorkers': old_count,
        'newWorkers': bulk_edit_pool.current_workers
    }


@router.post("/workers/reset-stats")
def reset_worker_stats():
    """
    Сбрасывает статистику пула воркеров.
    Полезно для начала нового измерения производительности.
    """
    bulk_edit_pool.reset_stats()
    return {'success': True, 'message': 'Worker pool stats reset'}
