"""
Главный модуль оркестрации параллельной обработки постов.

Координирует работу воркеров, распределяет проекты по токенам,
обрабатывает fallback при отключении токенов.
"""

import time
import json
import concurrent.futures

import crud
from database import SessionLocal
import services.task_monitor as task_monitor
from services.lists.parallel_common import (
    BulkRefreshState,
    ProjectStatus,
    get_all_tokens_with_names,
    check_admin_rights_batch,
    distribute_projects_to_state,
)

from .progress import update_task_progress
from .worker import token_worker_posts


def run_parallel_posts_refresh_v2(task_id: str, user_token: str, limit: str = '1000', mode: str = 'limit'):
    """
    Главная функция параллельного обновления постов с fallback.
    
    Использует Split Session паттерн — получаем данные из БД
    и СРАЗУ закрываем сессию, чтобы не держать соединение часами.
    
    Args:
        task_id: ID задачи для отслеживания прогресса
        user_token: Токен пользователя (для совместимости, не используется)
        limit: Лимит постов на проект ('all' или число)
        mode: 'limit' — скачиваем limit постов, 'actual' — пропускаем если БД актуальна
    """
    # Парсим лимит
    if limit == 'all':
        limit_int = 999999
    else:
        limit_int = int(limit) if limit.isdigit() else 1000
    
    mode_label = 'актуализация' if mode == 'actual' else (str(limit_int) if limit != 'all' else 'все')
    print(f"PARALLEL_BULK_POSTS: Режим: {mode}, лимит: {mode_label}")
    
    # === ЭТАП 1: ПОЛУЧЕНИЕ ДАННЫХ (короткая сессия) ===
    projects_list, tokens = _load_initial_data()
    
    # === ЭТАП 2: ВАЛИДАЦИЯ ===
    if not _validate_data(task_id, projects_list, tokens):
        return
    
    print(f"PARALLEL_BULK_POSTS: Найдено {len(tokens)} токенов, {len(projects_list)} проектов")
    
    # === ЭТАП 3: ПРОВЕРКА АДМИНСКИХ ПРАВ ===
    group_ids = [p['vk_id'] for p in projects_list]
    admin_map = check_admin_rights_batch(tokens, group_ids)
    
    # Пауза после проверки админских прав
    print("PARALLEL_BULK_POSTS: Пауза 3 секунды для восстановления API лимитов...")
    time.sleep(3)
    
    # === ЭТАП 4: ПОДГОТОВКА СОСТОЯНИЯ ===
    state = BulkRefreshState(task_id, projects_list, tokens, admin_map)
    distribute_projects_to_state(state)
    _log_distribution(state)
    update_task_progress(state, force=True)
    
    # === ЭТАП 5: ПАРАЛЛЕЛЬНАЯ ОБРАБОТКА ===
    try:
        _run_parallel_workers(state, limit_int, mode)
        _finalize_task(state, task_id)
    except Exception as e:
        print(f"PARALLEL_BULK_POSTS CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        task_monitor.update_task(task_id, "error", error=str(e))
        task_monitor.clear_cancellation(task_id)


def _load_initial_data():
    """
    Загружает начальные данные из БД (проекты и токены).
    
    Использует короткую сессию — закрываем сразу после чтения.
    
    Returns:
        Tuple[projects_list, tokens]
    """
    projects_list = []
    tokens = []
    
    db = SessionLocal()
    try:
        # Получаем все проекты
        projects_db = crud.get_all_projects(db)
        projects_list = [
            {'id': p.id, 'name': p.name, 'vk_id': str(p.vkProjectId)}
            for p in projects_db if p.vkProjectId is not None
        ]
        
        # Получаем все токены
        tokens = get_all_tokens_with_names(db)
    finally:
        db.close()  # ЗАКРЫВАЕМ СРАЗУ после получения данных!
    
    return projects_list, tokens


def _validate_data(task_id: str, projects_list: list, tokens: list) -> bool:
    """
    Проверяет валидность данных перед обработкой.
    
    Returns:
        True если данные валидны, False если нужно завершить задачу
    """
    if len(projects_list) == 0:
        task_monitor.update_task(task_id, "done", message="Нет проектов для обработки")
        return False
    
    if not tokens:
        task_monitor.update_task(task_id, "error", error="Нет доступных токенов")
        return False
    
    return True


def _log_distribution(state: BulkRefreshState):
    """Логирует распределение проектов по токенам."""
    print("PARALLEL_BULK_POSTS: Распределение проектов:")
    for ts in state.tokens_state.values():
        admin_count = sum(
            1 for pid in ts.assigned_projects 
            if state.projects_progress[pid].is_admin
        )
        print(f"   -> {ts.name}: {len(ts.assigned_projects)} проектов (админ в {admin_count})")


def _run_parallel_workers(state: BulkRefreshState, limit_int: int, mode: str):
    """
    Запускает параллельную обработку с fallback.
    
    При отключении токенов из-за flood control, перераспределяет
    осиротевшие проекты между оставшимися активными токенами.
    """
    max_rounds = 3
    
    for round_num in range(max_rounds):
        active_tokens = state.get_active_tokens()
        if not active_tokens:
            print("PARALLEL_BULK_POSTS: Нет активных токенов, завершаем!")
            break
        
        print(f"\nPARALLEL_BULK_POSTS: Раунд {round_num + 1}, активных токенов: {len(active_tokens)}")
        
        # Ограничиваем количество параллельных воркеров
        # Причина: Каждый воркер создаёт свои DB сессии
        MAX_PARALLEL_WORKERS = 3
        num_workers = min(len(active_tokens), MAX_PARALLEL_WORKERS)
        
        # Запускаем воркеры
        with concurrent.futures.ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = {}
            for idx, ts in enumerate(active_tokens):
                # Стаггеред старт — интервал между запусками воркеров
                if idx > 0:
                    time.sleep(5.0)
                print(f"PARALLEL_BULK_POSTS: Запуск воркера {ts.name}...")
                future = executor.submit(token_worker_posts, state, ts.token, ts.name, limit_int, mode)
                futures[future] = ts.name
            
            # Ждём завершения
            for future in concurrent.futures.as_completed(futures):
                name = futures[future]
                try:
                    future.result()
                except Exception as e:
                    print(f"PARALLEL_BULK_POSTS: Воркер '{name}' упал: {e}")
        
        # Проверяем осиротевшие проекты
        orphaned = state.pop_orphaned_projects()
        if not orphaned:
            print("PARALLEL_BULK_POSTS: Нет осиротевших проектов, завершаем.")
            break
        
        print(f"PARALLEL_BULK_POSTS: Перераспределяем {len(orphaned)} осиротевших проектов...")
        
        # Очищаем assigned_projects у активных токенов
        for ts in state.get_active_tokens():
            ts.assigned_projects = []
        
        # Перераспределяем
        distribute_projects_to_state(state, orphaned)


def _finalize_task(state: BulkRefreshState, task_id: str):
    """Финализирует задачу — обновляет статус и логирует результат."""
    summary = state.get_summary()
    
    # Формируем финальное сообщение
    final_message = f"Посты готово: {summary['done']}/{summary['total']}"
    if summary['errors'] > 0:
        final_message += f", ошибок: {summary['errors']}"
    if summary['disabled_tokens']:
        final_message += f" | Отключены: {', '.join(summary['disabled_tokens'])}"
    
    # Собираем ошибки для JSON
    error_details = []
    for pp in state.projects_progress.values():
        if pp.status == ProjectStatus.ERROR:
            error_details.append({
                'project_id': pp.project_id,
                'project_name': pp.project_name,
                'error': pp.error
            })
    
    error_json = json.dumps({'errors': error_details}, ensure_ascii=False) if error_details else None
    
    task_monitor.update_task(
        task_id, "done",
        loaded=summary['done'],
        total=summary['total'],
        message=final_message,
        sub_message=state.get_progress_json(),  # Полный JSON только в конце
        error=error_json or ""
    )
    task_monitor.clear_cancellation(task_id)
    
    print(f"\nPARALLEL_BULK_POSTS: Завершено! {final_message}")
