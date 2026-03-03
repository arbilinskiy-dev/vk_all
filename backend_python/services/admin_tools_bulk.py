"""
Админ-инструменты — фоновые задачи массового обновления.

Параллельный сбор админов, подписчиков и постов для всех групп.
"""

from typing import List, Dict, Tuple
import json
import time
import concurrent.futures
import models
import crud
from config import settings
from services.vk_api.api_client import call_vk_api as raw_vk_call
from database import SessionLocal
import services.task_monitor as task_monitor
from services.admin_tools_crud import _process_and_save_admins


def _worker_fetch_admins(token: str, group_ids: List[int], task_id: str, processed_counter: Dict, total_groups: int) -> Tuple[List[Tuple[int, List[Dict]]], List[int]]:
    """
    Воркер: обрабатывает список групп одним токеном.
    Возвращает: (success_results, failed_group_ids)
    success_results: [(group_id, managers_data), ...]
    """
    successes = []
    failures = []
    
    for gid in group_ids:
        try:
            # Имитация задержки для предотвращения rate limit
            time.sleep(0.35)
            
            response = raw_vk_call('groups.getMembers', {
                'group_id': gid,
                'filter': 'managers',
                'fields': 'role,permissions',
                'access_token': token
            })
            
            if response and 'items' in response:
                successes.append((gid, response['items']))
            else:
                failures.append(gid)
        except Exception as e:
            # print(f"  [Worker] Failed gid {gid} with token ...{token[-4:]}: {e}")
            failures.append(gid)
        
        # Обновляем прогресс (thread-safe не гарантируется идеально, но для UI достаточно)
        processed_counter['val'] += 1
        if processed_counter['val'] % 5 == 0:
            task_monitor.update_task(task_id, "processing", loaded=processed_counter['val'], total=total_groups)

    return successes, failures


def refresh_all_group_admins_task(task_id: str):
    """
    Фоновая задача для умного сбора админов со всех групп.
    1. Распределяет нагрузку по токенам.
    2. Выполняет запросы параллельно.
    3. Обрабатывает ошибки (Retry).
    4. Сохраняет результаты.
    Поддерживает graceful cancellation.
    
    ВАЖНО: Использует Split Session - получаем данные из БД и СРАЗУ закрываем,
    чтобы не держать соединение открытым часами.
    """
    
    # === ЭТАП 1: ПОЛУЧЕНИЕ ДАННЫХ (короткая сессия) ===
    active_groups = []
    name_to_token = {}
    
    db = SessionLocal()
    try:
        # Проверка отмены в начале
        if task_monitor.is_task_cancelled(task_id):
            print(f"TASK {task_id}: Cancelled before start")
            task_monitor.clear_cancellation(task_id)
            return
            
        # 1. Загрузка данных
        all_groups = db.query(models.AdministeredGroup).all()
        # Фильтруем группы без токенов и сохраняем как словари
        active_groups = [
            {'id': g.id, 'admin_sources': g.admin_sources}
            for g in all_groups if g.admin_sources and g.admin_sources != "[]"
        ]
        
        # 2. Карта токенов (Name -> Token)
        # ENV
        if settings.vk_user_token:
            name_to_token["ENV Token (Основной)"] = settings.vk_user_token
        # System
        accounts = crud.get_all_accounts(db)
        for acc in accounts:
            if acc.token and acc.status == 'active':
                key = f"{acc.full_name} (ID: {acc.vk_user_id})"
                name_to_token[key] = acc.token
    finally:
        db.close()  # ЗАКРЫВАЕМ СРАЗУ после получения данных!
    
    # === ЭТАП 2: ВАЛИДАЦИЯ (без БД) ===
    if not active_groups:
        task_monitor.update_task(task_id, "done", message="Нет групп с доступными токенами.")
        return

    # === ЭТАП 3: БАЛАНСИРОВКА (без БД) ===
    # Queues: { token: [group_id, group_id, ...] }
    token_queues: Dict[str, List[int]] = {t: [] for t in name_to_token.values()}
    group_to_valid_tokens: Dict[int, List[str]] = {}

    print(f"TASK {task_id}: Balancing load for {len(active_groups)} groups across {len(token_queues)} tokens...")
    task_monitor.update_task(task_id, "processing", message="Балансировка нагрузки...", total=len(active_groups))

    for group in active_groups:
        try:
            source_names = json.loads(group['admin_sources'])
            valid_tokens = []
            for name in source_names:
                if name in name_to_token:
                    valid_tokens.append(name_to_token[name])
            
            if not valid_tokens:
                continue
            
            group_to_valid_tokens[group['id']] = valid_tokens
            
            # Выбираем токен с самой короткой очередью
            best_token = min(valid_tokens, key=lambda t: len(token_queues[t]))
            token_queues[best_token].append(group['id'])
            
        except Exception as e:
            print(f"Error distributing group {group['id']}: {e}")

    # Удаляем пустые очереди
    token_queues = {k: v for k, v in token_queues.items() if v}
    
    if not token_queues:
        task_monitor.update_task(task_id, "error", error="Не удалось распределить токены.")
        return

    # Проверка отмены перед параллельной фазой
    if task_monitor.is_task_cancelled(task_id):
        print(f"TASK {task_id}: Cancelled before parallel fetch")
        task_monitor.update_task(task_id, "done", message="Отменено пользователем")
        task_monitor.clear_cancellation(task_id)
        return

    # === ЭТАП 4: ПАРАЛЛЕЛЬНАЯ ЗАГРУЗКА (без БД) ===
    total_groups = len(active_groups)
    processed_counter = {'val': 0}
    
    success_results = [] # [(gid, managers_data), ...]
    failed_group_ids = []

    max_workers = min(len(token_queues), 10)
    
    task_monitor.update_task(task_id, "processing", message=f"Сбор данных ({max_workers} потоков)...", loaded=0, total=total_groups)

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            for token, gids in token_queues.items():
                futures.append(executor.submit(_worker_fetch_admins, token, gids, task_id, processed_counter, total_groups))
            
            for future in concurrent.futures.as_completed(futures):
                try:
                    s_res, f_gids = future.result()
                    success_results.extend(s_res)
                    failed_group_ids.extend(f_gids)
                except Exception as e:
                    print(f"Thread error: {e}")

        # Проверка отмены перед retry-фазой
        if task_monitor.is_task_cancelled(task_id):
            print(f"TASK {task_id}: Cancelled before retry phase")
            task_monitor.update_task(task_id, "done", message=f"Отменено. Собрано {len(success_results)} групп")
            task_monitor.clear_cancellation(task_id)
            return

        # === ЭТАП 5: RETRY (без БД) ===
        if failed_group_ids:
            print(f"TASK {task_id}: Retrying {len(failed_group_ids)} failed groups...")
            task_monitor.update_task(task_id, "processing", message=f"Докачка ошибок ({len(failed_group_ids)})...")
            
            for gid in failed_group_ids:
                # Проверка отмены в цикле retry
                if task_monitor.is_task_cancelled(task_id):
                    break
                    
                # Пробуем все доступные токены для этой группы
                tokens = group_to_valid_tokens.get(gid, [])
                success = False
                for token in tokens:
                    try:
                        time.sleep(0.5) # Пауза
                        response = raw_vk_call('groups.getMembers', {
                            'group_id': gid,
                            'filter': 'managers',
                            'fields': 'role,permissions',
                            'access_token': token
                        })
                        if response and 'items' in response:
                            success_results.append((gid, response['items']))
                            success = True
                            break
                    except:
                        continue
                
                if not success:
                    print(f"  -> Group {gid} completely failed all tokens.")

        # Проверка отмены перед сохранением
        if task_monitor.is_task_cancelled(task_id):
            print(f"TASK {task_id}: Cancelled before save phase")
            task_monitor.update_task(task_id, "done", message=f"Отменено. Собрано {len(success_results)} групп (не сохранено)")
            task_monitor.clear_cancellation(task_id)
            return

        # === ЭТАП 6: СОХРАНЕНИЕ (новая короткая сессия) ===
        task_monitor.update_task(task_id, "processing", message="Сохранение результатов...", loaded=len(success_results), total=total_groups)
        
        saved_count = 0
        db_save = SessionLocal()
        try:
            for gid, managers_data in success_results:
                group = db_save.query(models.AdministeredGroup).filter(models.AdministeredGroup.id == gid).first()
                if group:
                    _process_and_save_admins(db_save, group, managers_data)
                    saved_count += 1
        finally:
            db_save.close()
                
        task_monitor.update_task(task_id, "done", message=f"Обновлено {saved_count} групп")
        task_monitor.clear_cancellation(task_id)
        
    except Exception as e:
        print(f"TASK CRITICAL ERROR: {e}")
        task_monitor.update_task(task_id, "error", error=str(e))
        task_monitor.clear_cancellation(task_id)


def refresh_all_subscribers_task(task_id: str, user_token: str):
    """
    Фоновая задача для ПАРАЛЛЕЛЬНОГО обновления подписчиков ВСЕХ активных проектов.
    
    Логика (v2):
    1. Собирает все токены (ENV + System Accounts)
    2. Определяет, в каких группах каждый токен является админом
    3. Распределяет проекты по токенам (админ имеет приоритет)
    4. Запускает параллельную обработку - каждый токен обрабатывает свои группы
    5. При flood control отключает токен и перераспределяет проекты на оставшиеся
    
    Это ускоряет процесс в N раз (где N = количество токенов) без риска бана.
    """
    from services.lists.parallel_bulk_service_v2 import run_parallel_subscribers_refresh_v2
    
    # Запускаем параллельное обновление подписчиков
    run_parallel_subscribers_refresh_v2(task_id, user_token)


def refresh_all_posts_task(task_id: str, user_token: str, limit: str = '1000', mode: str = 'limit'):
    """
    Фоновая задача для ПАРАЛЛЕЛЬНОГО обновления постов ВСЕХ активных проектов.
    
    mode:
      - 'limit': скачиваем limit постов для каждого проекта
      - 'actual': проверяем БД, если постов >= VK — пропускаем (быстрая актуализация)
    """
    from services.lists.parallel_bulk_posts_v2 import run_parallel_posts_refresh_v2
    
    # Запускаем параллельное обновление постов
    run_parallel_posts_refresh_v2(task_id, user_token, limit, mode)
