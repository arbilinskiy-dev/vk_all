"""
Утилиты для обработки ошибок БД с retry-логикой.

Этот модуль решает проблему "database is locked" для SQLite (локальная разработка)
и потенциальных таймаутов/дедлоков для PostgreSQL (продакшен).

Использование:
    from utils.db_retry import db_operation_with_retry
    
    db_operation_with_retry(
        db=session,
        operation=lambda: db.bulk_insert_mappings(Model, data),
        operation_name="bulk_insert_subscribers"
    )
"""

import time
from typing import Callable, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, IntegrityError
from config import settings


# Определяем, работаем ли мы с SQLite
def _is_sqlite() -> bool:
    """Проверяет, используется ли SQLite (по настройкам)."""
    db_url = settings.database_url or ""
    return "sqlite" in db_url.lower() or not db_url


def db_operation_with_retry(
    db: Session,
    operation: Callable[[], Any],
    operation_name: str = "db_operation",
    max_retries: int = 3,
    base_delay: float = 0.5
) -> Any:
    """
    Выполняет операцию БД с retry-логикой для PostgreSQL.
    Для SQLite retry отключен (там проблема в архитектуре, не в временных локах).
    
    Args:
        db: SQLAlchemy сессия
        operation: Функция для выполнения (lambda или callable)
        operation_name: Имя операции для логирования
        max_retries: Максимальное количество попыток (только для PostgreSQL)
        base_delay: Базовая задержка между попытками в секундах
        
    Returns:
        Результат выполнения operation
        
    Raises:
        OperationalError: Если все попытки исчерпаны
    """
    # Для SQLite не делаем retry — это бесполезно при параллельной записи
    if _is_sqlite():
        try:
            result = operation()
            return result
        except OperationalError as e:
            # Для SQLite просто логируем и пробрасываем
            print(f"⚠️ SQLite error in {operation_name}: {e}")
            db.rollback()
            raise
    
    # Для PostgreSQL — retry с экспоненциальной задержкой
    last_error: Optional[Exception] = None
    
    for attempt in range(max_retries):
        try:
            result = operation()
            return result
        except OperationalError as e:
            last_error = e
            db.rollback()  # Откатываем неудачную транзакцию
            
            if attempt < max_retries - 1:
                # Экспоненциальная задержка: 0.5s, 1s, 2s
                sleep_time = base_delay * (2 ** attempt)
                print(f"⚠️ DB error in {operation_name}, retry {attempt + 1}/{max_retries} in {sleep_time}s: {e}")
                time.sleep(sleep_time)
            else:
                print(f"❌ DB error in {operation_name}, all {max_retries} retries failed: {e}")
        except IntegrityError as e:
            # IntegrityError (дубликаты, FK нарушения) — не ретраим, это логическая ошибка
            db.rollback()
            print(f"❌ Integrity error in {operation_name}: {e}")
            raise
    
    # Все попытки исчерпаны
    if last_error:
        raise last_error
    
    return None


def bulk_operation_with_retry(
    db: Session,
    items: list,
    chunk_operation: Callable[[list], None],
    operation_name: str = "bulk_operation",
    chunk_size: int = 100,
    max_retries: int = 3
) -> int:
    """
    Выполняет bulk-операцию по чанкам с retry для каждого чанка.
    Коммитит после каждого успешного чанка.
    
    Args:
        db: SQLAlchemy сессия
        items: Список элементов для обработки
        chunk_operation: Функция, принимающая чанк (список элементов)
        operation_name: Имя операции для логирования
        chunk_size: Размер одного чанка
        max_retries: Максимальное количество попыток на чанк
        
    Returns:
        Количество успешно обработанных элементов
    """
    if not items:
        return 0
    
    processed = 0
    failed_chunks = []
    
    for i in range(0, len(items), chunk_size):
        chunk = items[i:i + chunk_size]
        chunk_num = i // chunk_size + 1
        total_chunks = (len(items) + chunk_size - 1) // chunk_size
        
        try:
            db_operation_with_retry(
                db=db,
                operation=lambda c=chunk: chunk_operation(c),
                operation_name=f"{operation_name}_chunk_{chunk_num}/{total_chunks}",
                max_retries=max_retries
            )
            db.commit()
            processed += len(chunk)
        except Exception as e:
            # Запоминаем неудачные чанки для отчёта
            failed_chunks.append({
                "chunk_num": chunk_num,
                "start_idx": i,
                "size": len(chunk),
                "error": str(e)
            })
            print(f"❌ Chunk {chunk_num}/{total_chunks} failed permanently: {e}")
    
    if failed_chunks:
        print(f"⚠️ {operation_name}: {len(failed_chunks)} chunks failed out of {total_chunks}")
    
    return processed
