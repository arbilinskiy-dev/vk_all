# Настройки VK Callback системы
#
# Все параметры, управляющие поведением обработки событий:
# таймауты, размеры очередей, интервалы debounce и т.д.

from dataclasses import dataclass, field


@dataclass
class CallbackConfig:
    """Конфигурация VK Callback Event System."""
    
    # ─── Redis Queue ───────────────────────────────────────────────
    # Название Redis-очереди для событий
    queue_key: str = "vk_callback:events"
    
    # Таймаут ожидания новых событий в очереди (секунды, 0 = блокирующий)
    queue_pop_timeout: int = 5
    
    # Максимальный размер очереди. Предохранитель от OOM:
    # если worker не успевает — лишние события отбрасываются (лучше потерять событие, чем упасть)
    queue_max_size: int = 10000
    
    # TTL для сериализованного события в очереди (секунды)
    queue_event_ttl: int = 3600  # 1 час
    
    # ─── Debounce ──────────────────────────────────────────────────
    # Задержка debounce для группировки связанных событий (секунды)
    debounce_delay: float = 3.0
    
    # Префикс ключа debounce в Redis
    debounce_key_prefix: str = "vk_callback:debounce"
    
    # ─── Cooldown ──────────────────────────────────────────────────
    # Длительность cooldown по умолчанию (секунды)
    cooldown_default_seconds: float = 30.0
    
    # Префикс ключа cooldown в Redis
    cooldown_key_prefix: str = "vk_callback:cooldown"
    
    # ─── Дедупликация ──────────────────────────────────────────────
    # TTL для запоминания обработанных event_id (секунды)
    dedup_ttl: int = 300  # 5 минут
    
    # Префикс ключа дедупликации в Redis
    dedup_key_prefix: str = "vk_callback:seen"
    
    # ─── Rate Limiting ─────────────────────────────────────────────
    # Максимум событий от одной группы в окне.
    # 3000/мин — чтобы при рассылке (30к+ получателей) не обрезались входящие ответы.
    rate_limit_max_events: int = 3000
    
    # Размер окна rate limiting (секунды)
    rate_limit_window: int = 60
    
    # Префикс ключа rate limiting в Redis
    rate_limit_key_prefix: str = "vk_callback:ratelimit"
    
    # ─── Worker ────────────────────────────────────────────────────
    # Количество параллельных обработчиков в воркере
    worker_concurrency: int = 4
    
    # Интервал health-check логирования (секунды)
    worker_healthcheck_interval: int = 60
    
    # Максимум повторов обработки одного события при ошибке
    worker_max_retries: int = 3
    
    # Задержка между повторами (секунды)
    worker_retry_delay: float = 5.0
    
    # ─── Логирование ───────────────────────────────────────────────
    # Логировать payload целиком (может быть большим)
    log_full_payload: bool = False
    
    # Логировать результат каждого обработчика
    log_handler_results: bool = True


# Глобальный экземпляр конфигурации
callback_config = CallbackConfig()
