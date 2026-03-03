
"""
Сервис параллельной обработки проектов с умным распределением токенов.

Логика:
1. Собираем все токены (ENV + System Accounts)
2. Для каждого токена определяем, в каких группах он админ
3. Распределяем проекты по токенам (админ = приоритет доступа к подписчикам)
4. Группы без админа раздаём на наименее загруженный токен
5. Запускаем параллельную обработку - каждый токен обрабатывает свои группы
   ВАЖНО: Каждый воркер использует ТОЛЬКО СВОЙ токен!
"""

import time
import threading
import json
import concurrent.futures
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field

import crud
from database import SessionLocal
from services.vk_api.api_client import call_vk_api as raw_vk_call
from services import task_monitor, vk_service
from config import settings


@dataclass
class TokenWorkload:
    """Структура для хранения информации о токене и его нагрузке."""
    token: str
    name: str  # Имя аккаунта для отображения
    admin_in_groups: List[str] = field(default_factory=list)  # ID групп, где токен - админ
    assigned_projects: List[dict] = field(default_factory=list)  # Назначенные проекты
    
    @property
    def load(self) -> int:
        """Текущая нагрузка (количество назначенных проектов)."""
        return len(self.assigned_projects)


@dataclass 
class WorkerProgress:
    """Прогресс одного воркера (токена)."""
    worker_id: int
    token_name: str
    status: str  # 'pending', 'processing', 'done', 'error'
    current_project: str = ""
    processed: int = 0
    total: int = 0
    errors: int = 0
    error_details: List[dict] = field(default_factory=list)


def get_all_tokens_with_names(db) -> List[Tuple[str, str]]:
    """
    Собирает все токены с их названиями.
    Возвращает: [(token, name), ...]
    """
    tokens = []
    
    # ENV токен
    if settings.vk_user_token:
        tokens.append((settings.vk_user_token, "Основной (ENV)"))
    
    # Системные аккаунты
    system_accounts = crud.get_all_accounts(db)
    for acc in system_accounts:
        if acc.token and acc.status == 'active':
            tokens.append((acc.token, acc.full_name or f"Аккаунт {acc.vk_user_id}"))
    
    return tokens


def check_admin_rights_batch(tokens: List[Tuple[str, str]], group_ids: List[str]) -> Dict[str, List[str]]:
    """
    Проверяет админские права для всех токенов во всех группах.
    
    ОПТИМИЗАЦИЯ: Вместо проверки каждой группы отдельно (N×M запросов),
    используем groups.get с filter=admin для каждого токена (N запросов).
    
    Возвращает: {token: [group_id1, group_id2, ...]}
    """
    admin_map = {token: [] for token, _ in tokens}
    group_ids_set = set(group_ids)  # Для быстрой проверки принадлежности
    
    print(f"PARALLEL_BULK: Проверяем админские права {len(tokens)} токенов (оптимизированно)...")
    
    for token, name in tokens:
        try:
            # Один запрос на токен - получаем ВСЕ группы, где он админ
            response = raw_vk_call('groups.get', {
                'filter': 'admin',
                'extended': 0,  # Нам нужны только ID
                'count': 1000,  # Максимум
                'access_token': token
            })
            
            # response.items содержит ID групп (без минуса)
            admin_group_ids = response.get('items', [])
            
            # Фильтруем только те группы, которые есть в нашем списке проектов
            # Приводим к строкам для сравнения
            matching_groups = []
            for gid in admin_group_ids:
                gid_str = str(gid)
                if gid_str in group_ids_set:
                    matching_groups.append(gid_str)
            
            admin_map[token] = matching_groups
            print(f"   -> {name}: админ в {len(matching_groups)} группах из наших проектов (всего админ в {len(admin_group_ids)})")
            
            # Пауза между токенами для предотвращения rate limit
            time.sleep(2.0)
            
        except Exception as e:
            print(f"   -> {name}: ошибка проверки - {e}")
    
    return admin_map


def distribute_projects_to_tokens(
    tokens: List[Tuple[str, str]], 
    projects: List[dict],
    admin_map: Dict[str, List[str]]
) -> List[TokenWorkload]:
    """
    Распределяет проекты по токенам с приоритетом админских прав.
    
    Логика:
    1. Если токен - админ в группе, назначаем группу ему
    2. Если несколько токенов - админы, выбираем наименее загруженный
    3. Если нет админов, назначаем на наименее загруженный токен
    """
    workloads = [TokenWorkload(token=t, name=n) for t, n in tokens]
    
    # Заполняем информацию об админских правах
    for wl in workloads:
        wl.admin_in_groups = admin_map.get(wl.token, [])
    
    for project in projects:
        project_id = project['id']
        project_name = project['name']
        vk_id = project['vk_id']
        
        # Находим токены, которые являются админами в этой группе
        admin_workloads = [wl for wl in workloads if vk_id in wl.admin_in_groups]
        
        if admin_workloads:
            # Выбираем наименее загруженный токен с админскими правами
            target = min(admin_workloads, key=lambda x: x.load)
        else:
            # Нет админов - назначаем на наименее загруженный токен
            target = min(workloads, key=lambda x: x.load)
        
        target.assigned_projects.append({
            'id': project_id,
            'name': project_name,
            'vk_id': vk_id,
            'is_admin': vk_id in target.admin_in_groups
        })
    
    return workloads


def run_parallel_subscribers_refresh(
    task_id: str,
    user_token: str,
    on_worker_progress: callable = None
):
    """
    Главная функция параллельного обновления подписчиков.
    
    Args:
        task_id: ID основной задачи
        user_token: ENV токен
        on_worker_progress: Callback для обновления прогресса воркеров
    """
    from services.lists.subscribers.sync_task import refresh_subscribers_task
    
    db = SessionLocal()
    try:
        # 1. Получаем все проекты
        all_projects = crud.get_all_projects(db)
        if not all_projects:
            task_monitor.update_task(task_id, "done", message="Нет активных проектов")
            return
        
        projects_list = [
            {'id': p.id, 'name': p.name, 'vk_id': p.vkProjectId}
            for p in all_projects
        ]
        total_projects = len(projects_list)
        
        task_monitor.update_task(task_id, "processing", loaded=0, total=total_projects,
                                  message=f"Анализ токенов и прав доступа...")
        
        # 2. Собираем токены
        tokens = get_all_tokens_with_names(db)
        if not tokens:
            task_monitor.update_task(task_id, "error", error="Нет доступных токенов")
            return
        
        print(f"PARALLEL_BULK: Найдено {len(tokens)} токенов, {total_projects} проектов")
        
        # 3. Проверяем админские права (это займёт время)
        group_ids = [p['vk_id'] for p in projects_list]
        admin_map = check_admin_rights_batch(tokens, group_ids)
        
        # ВАЖНО: Пауза после проверки админских прав!
        # VK API нужно "остыть" после серии запросов groups.get
        print("PARALLEL_BULK: Пауза 10 секунд для восстановления API лимитов...")
        time.sleep(10)
        
        # 4. Распределяем проекты по токенам
        workloads = distribute_projects_to_tokens(tokens, projects_list, admin_map)
        
        # Фильтруем пустые воркеры
        active_workloads = [wl for wl in workloads if wl.assigned_projects]
        
        print(f"PARALLEL_BULK: Распределение проектов:")
        for wl in active_workloads:
            admin_count = sum(1 for p in wl.assigned_projects if p['is_admin'])
            print(f"   -> {wl.name}: {len(wl.assigned_projects)} проектов (админ в {admin_count})")
        
        task_monitor.update_task(task_id, "processing", loaded=0, total=total_projects,
                                  message=f"Запуск {len(active_workloads)} параллельных потоков...")
        
        # 5. Инициализируем прогресс воркеров
        workers_progress: Dict[int, WorkerProgress] = {}
        for idx, wl in enumerate(active_workloads):
            workers_progress[idx] = WorkerProgress(
                worker_id=idx,
                token_name=wl.name,
                status='pending',
                total=len(wl.assigned_projects)
            )
        
        # 6. Запускаем параллельную обработку
        total_processed = 0
        total_errors = 0
        all_error_details = []
        progress_lock = threading.Lock()
        
        def process_workload(workload: TokenWorkload, worker_idx: int):
            """Обработчик для одного воркера (токена)."""
            nonlocal total_processed, total_errors, all_error_details
            
            worker_progress = workers_progress[worker_idx]
            worker_progress.status = 'processing'
            
            # Начальная пауза для "прогрева" - первые проекты обрабатываем медленнее
            warmup_projects = 3  # Количество проектов с увеличенной паузой
            
            for proj_idx, project in enumerate(workload.assigned_projects):
                # Проверяем отмену
                if task_monitor.is_task_cancelled(task_id):
                    worker_progress.status = 'cancelled'
                    return
                
                project_id = project['id']
                project_name = project['name']
                worker_progress.current_project = project_name
                
                try:
                    # Создаём под-задачу для одного проекта
                    sub_task_id = f"{task_id}_w{worker_idx}_{project_id}"
                    task_monitor.start_task(sub_task_id, project_id, "subscribers_sync")
                    
                    # ВАЖНО: Передаём ТОЛЬКО токен этого воркера, а не все токены!
                    # Это предотвращает перегрузку API
                    refresh_subscribers_task_single_token(sub_task_id, project_id, workload.token, workload.name)
                    
                    # Проверяем результат
                    sub_status = task_monitor.get_task_status(sub_task_id)
                    if sub_status and sub_status.get('status') == 'error':
                        worker_progress.errors += 1
                        error_msg = sub_status.get('error', 'Неизвестная ошибка')
                        worker_progress.error_details.append({
                            'project_id': project_id,
                            'project_name': project_name,
                            'error': error_msg
                        })
                    
                    # Очищаем под-задачу
                    task_monitor.delete_task(sub_task_id)
                    
                except Exception as e:
                    worker_progress.errors += 1
                    worker_progress.error_details.append({
                        'project_id': project_id,
                        'project_name': project_name,
                        'error': str(e)
                    })
                
                worker_progress.processed += 1
                
                # Обновляем общий прогресс
                with progress_lock:
                    total_processed += 1
                    # Обновляем основной таск
                    _update_main_task_progress(task_id, total_processed, total_projects, workers_progress)
                
                # Пауза между проектами одного воркера (важно для rate limit!)
                # Первые несколько проектов обрабатываем медленнее (прогрев)
                if proj_idx < warmup_projects:
                    time.sleep(3.0)  # Увеличенная пауза для прогрева
                else:
                    time.sleep(1.5)  # Обычная пауза
            
            worker_progress.status = 'done'
            
            # Собираем ошибки
            with progress_lock:
                total_errors += worker_progress.errors
                all_error_details.extend(worker_progress.error_details)
        
        # Запускаем воркеры в параллельных потоках со стаггеред стартом
        # (задержка между запуском воркеров для снижения начальной нагрузки)
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(active_workloads)) as executor:
            futures = {}
            for idx, wl in enumerate(active_workloads):
                # Стаггеред старт: каждый следующий воркер стартует через 5 секунд
                # Это даёт API время "остыть" между запусками
                if idx > 0:
                    time.sleep(5.0)
                print(f"PARALLEL_BULK: Запуск воркера {idx} ({wl.name})...")
                future = executor.submit(process_workload, wl, idx)
                futures[future] = idx
            
            # Ждём завершения всех воркеров
            for future in concurrent.futures.as_completed(futures):
                worker_idx = futures[future]
                try:
                    future.result()
                except Exception as e:
                    print(f"PARALLEL_BULK: Worker {worker_idx} crashed: {e}")
                    workers_progress[worker_idx].status = 'error'
        
        # 7. Финализация
        final_message = f"Обработано {total_processed} проектов"
        if total_errors > 0:
            final_message += f", ошибок: {total_errors}"
        
        # Логируем детали ошибок
        if all_error_details:
            print(f"\n=== PARALLEL BULK REFRESH: ДЕТАЛИ ОШИБОК ===")
            for idx, err_info in enumerate(all_error_details, 1):
                print(f"{idx}. Проект: {err_info['project_name']} (ID: {err_info['project_id']})")
                print(f"   Ошибка: {err_info['error']}")
            print(f"=" * 50)
        
        import json
        error_json = json.dumps({'errors': all_error_details}, ensure_ascii=False) if all_error_details else None
        
        task_monitor.update_task(
            task_id, "done",
            loaded=total_processed,
            total=total_projects,
            message=final_message,
            error=error_json
        )
        task_monitor.clear_cancellation(task_id)
        
    except Exception as e:
        print(f"PARALLEL_BULK CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        task_monitor.update_task(task_id, "error", error=str(e))
        task_monitor.clear_cancellation(task_id)
    finally:
        db.close()


def _update_main_task_progress(task_id: str, total_processed: int, total_projects: int, workers_progress: Dict[int, WorkerProgress]):
    """Обновляет прогресс основной задачи с информацией о воркерах."""
    import json
    
    # Формируем данные о воркерах для отображения в UI
    workers_data = []
    for idx, wp in workers_progress.items():
        workers_data.append({
            'id': wp.worker_id,
            'name': wp.token_name,
            'status': wp.status,
            'current': wp.current_project,
            'processed': wp.processed,
            'total': wp.total,
            'errors': wp.errors
        })
    
    # Сообщение с текущими проектами
    active_workers = [w for w in workers_data if w['status'] == 'processing']
    if active_workers:
        current_names = [w['current'][:20] for w in active_workers if w['current']]
        message = f"Обработка: {', '.join(current_names[:3])}"
        if len(current_names) > 3:
            message += f" +{len(current_names) - 3}"
    else:
        message = "Обработка..."
    
    # Сохраняем данные воркеров в поле sub_message как JSON
    workers_json = json.dumps(workers_data, ensure_ascii=False)
    
    task_monitor.update_task(
        task_id, "processing",
        loaded=total_processed,
        total=total_projects,
        message=message,
        sub_message=workers_json  # Используем sub_message для передачи данных о воркерах
    )


# =============================================================================
# УПРОЩЁННАЯ СИНХРОНИЗАЦИЯ С ОДНИМ ТОКЕНОМ
# =============================================================================
# Эта функция используется для параллельной обработки, где каждый воркер
# работает только со своим токеном. Это предотвращает перегрузку API.
# =============================================================================

def refresh_subscribers_task_single_token(task_id: str, project_id: str, token: str, token_name: str):
    """
    Синхронизация подписчиков с использованием ОДНОГО токена.
    Упрощённая версия для параллельной обработки.
    
    Args:
        task_id: ID задачи для отслеживания прогресса
        project_id: ID проекта
        token: Токен VK API (только один!)
        token_name: Имя токена для логов
    """
    from services.lists.subscribers.config import EXECUTE_BATCH_SIZE
    from services.lists.subscribers.workers import _fetch_batch_execute_members
    from datetime import datetime, timezone
    import uuid
    
    db = SessionLocal()
    try:
        project = crud.get_project_by_id(db, project_id)
        if not project:
            task_monitor.update_task(task_id, "error", error="Project not found")
            return
            
        project_vk_id = project.vkProjectId
        project_name = project.name
        
        # Загружаем существующие ID для сравнения
        db_ids_set = crud.get_all_subscriber_vk_ids(db, project_id)
        
    except Exception as e:
        task_monitor.update_task(task_id, "error", error=f"Init failed: {e}")
        return
    finally:
        db.close()
    
    # --- ЭТАП 2: СКАЧИВАНИЕ ИЗ VK ---
    all_members = []
    
    try:
        print(f"SERVICE [Single Token]: Refreshing subscribers for '{project_name}' using token '{token_name}'")
        
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
        except Exception as e:
            task_monitor.update_task(task_id, "error", error=f"Не удалось получить кол-во: {e}")
            return
        
        if total_vk_count == 0:
            task_monitor.update_task(task_id, "done", loaded=0, total=0, message="Нет подписчиков")
            return
        
        # Разбиваем на чанки
        tasks_params = []
        current_offset = 0
        while current_offset < total_vk_count:
            remaining = total_vk_count - current_offset
            chunk_size = min(remaining, EXECUTE_BATCH_SIZE)
            tasks_params.append({"offset": current_offset, "count": chunk_size})
            current_offset += chunk_size
        
        total_fetched = 0
        
        # ПОСЛЕДОВАТЕЛЬНАЯ загрузка чанков (один токен = последовательно!)
        for i, params in enumerate(tasks_params):
            try:
                items = _fetch_batch_execute_members(
                    [token],  # Только один токен!
                    i, 
                    numeric_id, 
                    params['offset'], 
                    params['count'], 
                    fields, 
                    project_id
                )
                all_members.extend(items)
                total_fetched += len(items)
                task_monitor.update_task(task_id, "fetching", loaded=total_fetched, total=total_vk_count)
                
                # Пауза между чанками для одного токена
                time.sleep(0.5)
                
            except Exception as e:
                print(f"   [Single Token] Chunk {i} failed: {e}")
        
        # Проверяем порог
        threshold = int(total_vk_count * 0.90)  # 90% - более мягкий порог для одного токена
        if total_fetched < threshold:
            task_monitor.update_task(task_id, "error", 
                error=f"Скачано {total_fetched} из {total_vk_count} ({int(total_fetched/total_vk_count*100)}%)")
            return
            
    except Exception as e:
        task_monitor.update_task(task_id, "error", error=f"Download failed: {e}")
        return
    
    # --- ЭТАП 3: СОХРАНЕНИЕ ---
    try:
        task_monitor.update_task(task_id, "processing", message="Сохранение...")
        
        vk_members_map = {m['id']: m for m in all_members if 'id' in m}
        vk_ids_set = set(vk_members_map.keys())
        
        new_ids = list(vk_ids_set - db_ids_set)
        left_ids = list(db_ids_set - vk_ids_set)
        existing_ids = list(vk_ids_set.intersection(db_ids_set))
        
        timestamp = datetime.now(timezone.utc)
        
        # 1. Сохраняем НОВЫХ подписчиков
        if new_ids:
            BATCH_SIZE = 1000
            for i in range(0, len(new_ids), BATCH_SIZE):
                batch_ids = new_ids[i:i + BATCH_SIZE]
                new_subs = []
                new_history = []
                
                for vk_id in batch_ids:
                    vk_data = vk_members_map.get(vk_id, {})
                    
                    base_data = {
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

                    subscriber_entry = base_data.copy()
                    subscriber_entry["id"] = f"{project_id}_{vk_id}"
                    subscriber_entry["added_at"] = timestamp
                    new_subs.append(subscriber_entry)
                    
                    history_entry = base_data.copy()
                    history_entry["id"] = str(uuid.uuid4())
                    history_entry["event_date"] = timestamp
                    new_history.append(history_entry)
                
                # Запись в БД с новой сессией
                db_batch = SessionLocal()
                try:
                    crud.bulk_add_subscribers(db_batch, new_subs)
                    crud.bulk_add_history_join(db_batch, new_history)
                finally:
                    db_batch.close()
        
        # 2. Удаляем УШЕДШИХ подписчиков
        if left_ids:
            BATCH_SIZE = 1000
            for i in range(0, len(left_ids), BATCH_SIZE):
                batch_ids = left_ids[i:i + BATCH_SIZE]
                
                db_batch = SessionLocal()
                try:
                    # Получаем данные перед удалением для истории
                    leavers_data = crud.get_subscribers_by_vk_ids(db_batch, project_id, batch_ids)
                    
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
                        crud.bulk_add_history_leave(db_batch, leave_history)

                    crud.bulk_delete_subscribers(db_batch, project_id, batch_ids)
                finally:
                    db_batch.close()

        # 3. Обновление СУЩЕСТВУЮЩИХ (обновляем last_seen)
        if existing_ids:
            BATCH_SIZE = 1000
            for i in range(0, len(existing_ids), BATCH_SIZE):
                batch_ids = existing_ids[i:i + BATCH_SIZE]
                
                updates = []
                for vk_id in batch_ids:
                    vk_data = vk_members_map.get(vk_id, {})
                    updates.append({
                        'vk_user_id': vk_id,
                        'last_seen': vk_data.get('last_seen', {}).get('time') if vk_data.get('last_seen') else None,
                        'platform': vk_data.get('last_seen', {}).get('platform') if vk_data.get('last_seen') else None,
                        'photo_url': vk_data.get('photo_100'),
                        'deactivated': vk_data.get('deactivated')
                    })
                
                if updates:
                    db_batch = SessionLocal()
                    try:
                        crud.bulk_update_subscriber_details(db_batch, project_id, updates)
                    finally:
                        db_batch.close()
        
        task_monitor.update_task(task_id, "done", 
            loaded=total_fetched, 
            total=total_vk_count,
            message=f"+{len(new_ids)} / -{len(left_ids)}")
        
    except Exception as e:
        task_monitor.update_task(task_id, "error", error=f"Save failed: {e}")
