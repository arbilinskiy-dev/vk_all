# Динамический пул воркеров с автоматическим масштабированием
# Позволяет параллельно обрабатывать задачи с адаптацией к нагрузке

import asyncio
from typing import Optional, Callable, Any, List, Dict
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import time


class ScaleDirection(Enum):
    """Направление масштабирования"""
    UP = "up"
    DOWN = "down"
    NONE = "none"


@dataclass
class WorkerPoolStats:
    """Статистика пула воркеров"""
    current_workers: int = 0          # Текущее количество слотов
    active_workers: int = 0           # Сколько сейчас занято
    queue_size: int = 0               # Размер очереди (ожидающие задачи)
    completed_tasks: int = 0          # Всего выполнено задач
    failed_tasks: int = 0             # Всего провалено задач
    avg_task_time_ms: float = 0       # Среднее время выполнения
    total_scale_ups: int = 0          # Сколько раз масштабировали вверх
    total_scale_downs: int = 0        # Сколько раз масштабировали вниз
    last_scale_time: Optional[datetime] = None
    last_scale_direction: ScaleDirection = ScaleDirection.NONE


class DynamicWorkerPool:
    """
    Пул воркеров с динамическим масштабированием.
    
    Автоматически увеличивает количество воркеров при высокой нагрузке
    и уменьшает при низкой. Поддерживает rate limiting.
    
    Пример использования:
    ```python
    pool = DynamicWorkerPool(min_workers=2, max_workers=15)
    
    async def process_post(post):
        async with pool.acquire():
            await edit_post(post)
    
    await asyncio.gather(*[process_post(p) for p in posts])
    ```
    """
    
    def __init__(
        self,
        min_workers: int = 2,
        max_workers: int = 20,
        initial_workers: int = 5,
        scale_up_threshold: float = 0.8,    # Нагрузка > 80% — добавляем воркеров
        scale_down_threshold: float = 0.3,  # Нагрузка < 30% — уменьшаем
        scale_step: int = 2,                # Шаг изменения
        cooldown_seconds: float = 3.0,      # Пауза между масштабированиями
        rate_limit_per_second: float = 0,   # Лимит запросов в секунду (0 = без лимита)
        name: str = "default"               # Имя пула для логов
    ):
        self.min_workers = min_workers
        self.max_workers = max_workers
        self.current_workers = initial_workers
        self.scale_up_threshold = scale_up_threshold
        self.scale_down_threshold = scale_down_threshold
        self.scale_step = scale_step
        self.cooldown_seconds = cooldown_seconds
        self.rate_limit_per_second = rate_limit_per_second
        self.name = name
        
        # Семафор для ограничения параллелизма
        self._semaphore = asyncio.Semaphore(initial_workers)
        self._active_count = 0
        self._lock = asyncio.Lock()
        self._last_scale_time = datetime.now()
        
        # Rate limiter
        self._rate_limiter = None
        if rate_limit_per_second > 0:
            self._rate_limiter = asyncio.Semaphore(int(rate_limit_per_second))
            self._rate_reset_task = None
        
        # Статистика
        self._task_times: List[float] = []
        self._stats = WorkerPoolStats(current_workers=initial_workers)
        self._completed = 0
        self._failed = 0
    
    @property
    def stats(self) -> WorkerPoolStats:
        """Текущая статистика пула"""
        self._stats.current_workers = self.current_workers
        self._stats.active_workers = self._active_count
        self._stats.completed_tasks = self._completed
        self._stats.failed_tasks = self._failed
        if self._task_times:
            # Берём последние 100 задач для среднего
            recent = self._task_times[-100:]
            self._stats.avg_task_time_ms = sum(recent) / len(recent)
        return self._stats
    
    @property
    def load_factor(self) -> float:
        """Коэффициент загрузки (0.0 - 1.0)"""
        if self.current_workers == 0:
            return 1.0
        return self._active_count / self.current_workers
    
    @property
    def is_overloaded(self) -> bool:
        """Пул перегружен (все воркеры заняты)"""
        return self._active_count >= self.current_workers
    
    async def acquire(self) -> 'WorkerContext':
        """
        Захватить воркер из пула.
        Возвращает контекстный менеджер для автоматического освобождения.
        """
        return WorkerContext(self)
    
    async def _do_acquire(self):
        """Внутренний метод захвата воркера"""
        # Ждём rate limit если нужно
        if self._rate_limiter:
            await self._rate_limiter.acquire()
            self._schedule_rate_reset()
        
        # Ждём свободный слот
        await self._semaphore.acquire()
        
        async with self._lock:
            self._active_count += 1
            await self._maybe_scale()
    
    async def _do_release(self, task_time_ms: float = 0, success: bool = True):
        """Внутренний метод освобождения воркера"""
        self._semaphore.release()
        
        async with self._lock:
            self._active_count -= 1
            
            if task_time_ms > 0:
                self._task_times.append(task_time_ms)
            
            if success:
                self._completed += 1
            else:
                self._failed += 1
            
            await self._maybe_scale()
    
    async def _maybe_scale(self):
        """Проверяет и выполняет масштабирование если нужно"""
        now = datetime.now()
        
        # Проверяем cooldown
        if (now - self._last_scale_time).total_seconds() < self.cooldown_seconds:
            return
        
        load = self.load_factor
        
        # Scale UP
        if load >= self.scale_up_threshold and self.current_workers < self.max_workers:
            new_count = min(self.current_workers + self.scale_step, self.max_workers)
            added = new_count - self.current_workers
            
            # Добавляем слоты в семафор
            for _ in range(added):
                self._semaphore.release()
            
            self.current_workers = new_count
            self._last_scale_time = now
            self._stats.last_scale_time = now
            self._stats.last_scale_direction = ScaleDirection.UP
            self._stats.total_scale_ups += 1
            
            print(f"[WorkerPool:{self.name}] 📈 Scale UP: {new_count - added} → {new_count} workers (load: {load:.0%})", flush=True)
        
        # Scale DOWN
        elif load <= self.scale_down_threshold and self.current_workers > self.min_workers:
            new_count = max(self.current_workers - self.scale_step, self.min_workers)
            removed = self.current_workers - new_count
            
            # Забираем слоты из семафора (только если они свободны)
            for _ in range(removed):
                # Используем try_acquire чтобы не блокироваться
                try:
                    self._semaphore._value = max(0, self._semaphore._value - 1)
                except:
                    pass
            
            self.current_workers = new_count
            self._last_scale_time = now
            self._stats.last_scale_time = now
            self._stats.last_scale_direction = ScaleDirection.DOWN
            self._stats.total_scale_downs += 1
            
            print(f"[WorkerPool:{self.name}] 📉 Scale DOWN: {new_count + removed} → {new_count} workers (load: {load:.0%})", flush=True)
    
    async def set_workers(self, count: int):
        """Принудительно установить количество воркеров"""
        count = max(self.min_workers, min(count, self.max_workers))
        
        async with self._lock:
            diff = count - self.current_workers
            
            if diff > 0:
                # Добавляем слоты
                for _ in range(diff):
                    self._semaphore.release()
            elif diff < 0:
                # Убираем слоты
                for _ in range(-diff):
                    self._semaphore._value = max(0, self._semaphore._value - 1)
            
            self.current_workers = count
            print(f"[WorkerPool:{self.name}] ⚙️ Workers manually set to {count}", flush=True)
    
    def _schedule_rate_reset(self):
        """Планирует сброс rate limiter через 1 секунду"""
        if self._rate_limiter and not self._rate_reset_task:
            self._rate_reset_task = asyncio.create_task(self._reset_rate_limiter())
    
    async def _reset_rate_limiter(self):
        """Сбрасывает rate limiter через 1 секунду"""
        await asyncio.sleep(1.0)
        if self._rate_limiter:
            self._rate_limiter.release()
        self._rate_reset_task = None
    
    def reset_stats(self):
        """Сбрасывает статистику"""
        self._task_times.clear()
        self._completed = 0
        self._failed = 0
        self._stats = WorkerPoolStats(current_workers=self.current_workers)


class WorkerContext:
    """
    Контекстный менеджер для работы с воркером.
    Автоматически отслеживает время выполнения и освобождает воркер.
    """
    
    def __init__(self, pool: DynamicWorkerPool):
        self._pool = pool
        self._start_time: float = 0
        self._success = True
    
    async def __aenter__(self):
        await self._pool._do_acquire()
        self._start_time = time.time()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        elapsed_ms = (time.time() - self._start_time) * 1000
        success = exc_type is None
        await self._pool._do_release(elapsed_ms, success)
        return False  # Не подавляем исключения
    
    def mark_failed(self):
        """Пометить задачу как неудачную (для ручного управления)"""
        self._success = False


# === Глобальные пулы воркеров для разных типов задач ===

# Пул для VK API запросов (с rate limiting)
vk_api_pool = DynamicWorkerPool(
    min_workers=2,
    max_workers=10,
    initial_workers=3,
    scale_up_threshold=0.7,
    scale_down_threshold=0.2,
    rate_limit_per_second=3,  # VK API ограничение
    name="vk_api"
)

# Пул для операций с БД
db_operations_pool = DynamicWorkerPool(
    min_workers=3,
    max_workers=20,
    initial_workers=5,
    scale_up_threshold=0.8,
    scale_down_threshold=0.3,
    name="database"
)

# Пул для массового редактирования
bulk_edit_pool = DynamicWorkerPool(
    min_workers=2,
    max_workers=15,
    initial_workers=5,
    scale_up_threshold=0.75,
    scale_down_threshold=0.25,
    cooldown_seconds=2.0,
    name="bulk_edit"
)


def get_all_pools_stats() -> Dict[str, WorkerPoolStats]:
    """Получить статистику всех пулов"""
    return {
        "vk_api": vk_api_pool.stats,
        "database": db_operations_pool.stats,
        "bulk_edit": bulk_edit_pool.stats
    }
