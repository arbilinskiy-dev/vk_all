"""
Диагностика состояния пула соединений БД.
Используется для отладки проблем на предпроде.

Включение: установи переменную окружения SYNC_DEBUG=true
"""
import logging
import os
from datetime import datetime
from typing import Optional

# Настройка логгера
logger = logging.getLogger("db_diagnostics")

# Включаем DEBUG только если установлена переменная окружения
if os.getenv("SYNC_DEBUG", "false").lower() == "true":
    logger.setLevel(logging.DEBUG)
else:
    logger.setLevel(logging.INFO)


def log_pool_status(context: str = ""):
    """
    Логирует текущее состояние пула соединений.
    
    Показывает:
    - Pool size: базовый размер пула
    - Checked in: свободные соединения
    - Checked out: занятые соединения
    - Overflow: дополнительные соединения сверх pool_size
    """
    try:
        from database import engine
        pool = engine.pool
        
        # Получаем статистику пула
        checked_in = pool.checkedin()
        checked_out = pool.checkedout()
        overflow = pool.overflow()
        pool_size = pool.size()
        
        # Вычисляем процент использования
        total_connections = checked_in + checked_out
        usage_percent = (checked_out / total_connections * 100) if total_connections > 0 else 0
        
        message = (
            f"[DB_POOL] {context} | "
            f"Size: {pool_size} | "
            f"In: {checked_in} | "
            f"Out: {checked_out} | "
            f"Overflow: {overflow} | "
            f"Usage: {usage_percent:.0f}%"
        )
        
        # Предупреждаем если пул почти исчерпан
        if usage_percent > 80:
            logger.warning(message + " ⚠️ HIGH USAGE")
        else:
            logger.info(message)
            
    except Exception as e:
        logger.error(f"[DB_POOL] Ошибка получения статуса пула: {e}")


def log_session_status(db, context: str = ""):
    """
    Логирует состояние конкретной сессии БД.
    
    Проверяет:
    - is_active: есть ли незакоммиченные изменения
    - can_execute: можно ли выполнить запрос (соединение живо)
    """
    try:
        from sqlalchemy import text
        
        is_active = db.is_active
        in_transaction = db.in_transaction() if hasattr(db, 'in_transaction') else 'unknown'
        
        # Проверяем, можно ли выполнить запрос
        can_execute = False
        execute_error = None
        try:
            db.execute(text("SELECT 1"))
            can_execute = True
        except Exception as e:
            execute_error = str(e)[:100]
        
        message = (
            f"[DB_SESSION] {context} | "
            f"ID: {id(db)} | "
            f"Active: {is_active} | "
            f"InTx: {in_transaction} | "
            f"CanExec: {can_execute}"
        )
        
        if execute_error:
            message += f" | Error: {execute_error}"
            logger.error(message)
        else:
            logger.debug(message)
            
    except Exception as e:
        logger.error(f"[DB_SESSION] Ошибка проверки сессии: {e}")


def log_operation_timing(operation_name: str, start_time: datetime, context: str = ""):
    """
    Логирует время выполнения операции.
    
    Предупреждает если операция заняла слишком много времени.
    """
    duration = (datetime.now() - start_time).total_seconds()
    
    message = f"[TIMING] {operation_name} | Duration: {duration:.2f}s | {context}"
    
    if duration > 30:
        logger.warning(message + " ⚠️ VERY SLOW")
    elif duration > 10:
        logger.warning(message + " ⚠️ SLOW")
    else:
        logger.debug(message)
    
    return duration


class OperationTimer:
    """
    Контекстный менеджер для замера времени операций.
    
    Использование:
        with OperationTimer("save_subscribers", project_name) as timer:
            # код операции
        # Автоматически залогирует время
    """
    def __init__(self, operation_name: str, context: str = ""):
        self.operation_name = operation_name
        self.context = context
        self.start_time = None
        self.duration = None
    
    def __enter__(self):
        self.start_time = datetime.now()
        logger.debug(f"[TIMING] {self.operation_name} START | {self.context}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.duration = log_operation_timing(
            self.operation_name, 
            self.start_time, 
            self.context
        )
        if exc_type:
            logger.error(
                f"[TIMING] {self.operation_name} FAILED | "
                f"Duration: {self.duration:.2f}s | "
                f"Error: {exc_val}"
            )
        return False  # Не подавляем исключения
