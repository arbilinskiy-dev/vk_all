
from typing import Dict, Any, Optional, List, Callable, TypeVar
import time
import json
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, IntegrityError
from database import SessionLocal, redis_client
import models

# TTL для задач в секундах (удалять старые завершенные задачи)
TASK_TTL = 3600 # 1 час

# In-memory словарь для флагов отмены задач
# Когда задача удаляется через UI, мы устанавливаем флаг, чтобы фоновый процесс мог корректно завершиться
_cancelled_tasks: Dict[str, bool] = {}

# Тип для возвращаемого значения операции
T = TypeVar('T')

def is_task_cancelled(task_id: str) -> bool:
    """Проверяет, была ли задача отменена."""
    return _cancelled_tasks.get(task_id, False)

def cancel_task(task_id: str):
    """Помечает задачу как отмененную."""
    _cancelled_tasks[task_id] = True
    print(f"TASK_MONITOR: Task {task_id} marked for cancellation")

def clear_cancellation(task_id: str):
    """Очищает флаг отмены (вызывается при завершении задачи)."""
    _cancelled_tasks.pop(task_id, None)


# ===================================================================
# RETRY-ЛОГИКА ДЛЯ POSTGRESQL
# ===================================================================
# PostgreSQL в облаке может терять соединения из-за:
# - Таймаутов idle-соединений (10-15 мин в Yandex Cloud)
# - Сетевых проблем
# - Пересоздания пула после pool_recycle
# 
# Retry с экспоненциальной задержкой решает эти проблемы.
# ===================================================================

def _db_operation_with_retry(
    operation: Callable[[Session], T],
    operation_name: str,
    max_retries: int = 3
) -> Optional[T]:
    """
    Обёртка для операций с БД с retry-логикой.
    Создаёт свою сессию и корректно её закрывает через scoped_session.remove().
    
    Args:
        operation: Функция, принимающая Session и возвращающая результат
        operation_name: Имя операции для логирования
        max_retries: Количество попыток
        
    Returns:
        Результат операции или None при ошибке
    """
    last_error = None
    
    for attempt in range(max_retries):
        db = SessionLocal()
        try:
            result = operation(db)
            db.commit()
            return result
        except OperationalError as e:
            last_error = e
            db.rollback()
            if attempt < max_retries - 1:
                sleep_time = 0.5 * (2 ** attempt)  # 0.5s, 1s, 2s
                print(f"TASK_MONITOR: {operation_name} retry {attempt + 1}/{max_retries} in {sleep_time}s: {e}")
                time.sleep(sleep_time)
            else:
                print(f"TASK_MONITOR: {operation_name} failed after {max_retries} retries: {e}")
        except IntegrityError as e:
            # IntegrityError — логическая ошибка, retry не поможет
            db.rollback()
            print(f"TASK_MONITOR ERROR ({operation_name}): IntegrityError: {e}")
            return None
        except Exception as e:
            print(f"TASK_MONITOR ERROR ({operation_name}): {e}")
            db.rollback()
            return None
        finally:
            SessionLocal.remove()  # Корректное закрытие scoped session
    
    return None


def get_active_task_id(project_id: str, list_type: str) -> Optional[str]:
    """Проверяет, есть ли активная задача в БД для данного проекта."""
    cutoff_time = time.time() - 300  # 5 минут назад
    
    def do_query(db: Session) -> Optional[str]:
        task = db.query(models.SystemTask).filter(
            models.SystemTask.project_id == project_id,
            models.SystemTask.list_type == list_type,
            models.SystemTask.status.notin_(['done', 'error']),
            models.SystemTask.updated_at > cutoff_time
        ).first()
        return task.id if task else None
    
    return _db_operation_with_retry(do_query, "get_active_task_id")

def start_task(task_id: str, project_id: str = None, list_type: str = None):
    """Создает новую задачу в БД."""
    
    def do_start(db: Session) -> None:
        # Очищаем старые активные задачи этого типа для этого проекта
        if project_id and list_type:
            db.query(models.SystemTask).filter(
                models.SystemTask.project_id == project_id,
                models.SystemTask.list_type == list_type,
                models.SystemTask.status.notin_(['done', 'error'])
            ).delete(synchronize_session=False)
        
        now = time.time()
        new_task = models.SystemTask(
            id=task_id,
            project_id=project_id,
            list_type=list_type,
            status="pending",
            loaded=0,
            total=0,
            message="Инициализация...",
            error=None,
            created_at=now,
            updated_at=now
        )
        db.add(new_task)
        print(f"TASK_MONITOR: Started task {task_id}")
        return None
    
    _db_operation_with_retry(do_start, "start_task")

def update_task(task_id: str, status: str, loaded: int = 0, total: int = 0, message: str = None, error: str = None,
                sub_loaded: int = None, sub_total: int = None, sub_message: str = None):
    """Обновляет состояние задачи в БД."""
    
    def do_update(db: Session) -> None:
        task = db.query(models.SystemTask).filter(models.SystemTask.id == task_id).first()
        if not task:
            # Если задачи нет, возможно, ее удалили вручную
            return None
        
        task.status = status
        task.updated_at = time.time()
        
        # Записываем время завершения при статусах done/error
        if status in ('done', 'error'):
            task.finished_at = time.time()
        
        # Обновляем основной прогресс
        if loaded is not None: task.loaded = loaded
        if total is not None: task.total = total
        if message is not None: task.message = message
        if error is not None: task.error = error
        
        # Обновляем вложенный прогресс (для bulk-операций)
        if sub_loaded is not None: task.sub_loaded = sub_loaded
        if sub_total is not None: task.sub_total = sub_total
        if sub_message is not None: task.sub_message = sub_message
        
        return None
    
    _db_operation_with_retry(do_update, "update_task")

def get_task_status(task_id: str) -> Optional[Dict[str, Any]]:
    """Получает статус задачи из БД."""
    
    def do_get(db: Session) -> Optional[Dict[str, Any]]:
        task = db.query(models.SystemTask).filter(models.SystemTask.id == task_id).first()
        if not task:
            return None
        
        # Формируем ответ в формате, который ожидает фронтенд
        return {
            "taskId": task.id,
            "status": task.status,
            "loaded": task.loaded,
            "total": task.total,
            "message": task.message,
            "error": task.error,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "finished_at": task.finished_at,
            # Вложенный прогресс для детализации (например, подписчики в рамках проекта)
            "sub_loaded": task.sub_loaded,
            "sub_total": task.sub_total,
            "sub_message": task.sub_message,
            "meta": {
                "project_id": task.project_id,
                "list_type": task.list_type
            }
        }
    
    return _db_operation_with_retry(do_get, "get_task_status")

def get_all_tasks() -> List[Dict[str, Any]]:
    """Возвращает список всех задач из БД (активных и недавних)."""
    
    def do_get_all(db: Session) -> List[Dict[str, Any]]:
        # Удаляем очень старые задачи (старше 24 часов)
        cleanup_threshold = time.time() - 86400
        db.query(models.SystemTask).filter(
            models.SystemTask.updated_at < cleanup_threshold
        ).delete(synchronize_session=False)
        
        tasks = db.query(models.SystemTask).order_by(
            models.SystemTask.updated_at.desc()
        ).limit(50).all()
        
        result = []
        for task in tasks:
            result.append({
                "taskId": task.id,
                "status": task.status,
                "loaded": task.loaded,
                "total": task.total,
                "message": task.message,
                "error": task.error,
                "created_at": task.created_at,
                "updated_at": task.updated_at,
                "finished_at": task.finished_at,
                # Вложенный прогресс для детализации
                "sub_loaded": task.sub_loaded,
                "sub_total": task.sub_total,
                "sub_message": task.sub_message,
                "meta": {
                    "project_id": task.project_id,
                    "list_type": task.list_type
                }
            })
        return result
    
    result = _db_operation_with_retry(do_get_all, "get_all_tasks")
    return result if result is not None else []

def delete_task(task_id: str):
    """Принудительно удаляет задачу из БД и помечает её для отмены."""
    # Сначала помечаем задачу как отмененную, чтобы фоновый процесс мог завершиться
    cancel_task(task_id)
    
    def do_delete(db: Session) -> None:
        db.query(models.SystemTask).filter(
            models.SystemTask.id == task_id
        ).delete(synchronize_session=False)
        print(f"TASK_MONITOR: Force deleted task {task_id}")
        return None
    
    _db_operation_with_retry(do_delete, "delete_task")


def delete_all_tasks():
    """Полностью очищает таблицу задач и помечает все для отмены."""
    
    def do_delete_all(db: Session) -> None:
        # Получаем все ID задач перед удалением
        tasks = db.query(models.SystemTask.id).all()
        for (task_id,) in tasks:
            cancel_task(task_id)
        
        db.query(models.SystemTask).delete(synchronize_session=False)
        print("TASK_MONITOR: Deleted ALL tasks.")
        return None
    
    _db_operation_with_retry(do_delete_all, "delete_all_tasks")
