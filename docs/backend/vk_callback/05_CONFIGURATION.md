# ⚙️ Конфигурация VK Callback System

Все параметры сосредоточены в `services/vk_callback/config.py` → `CallbackConfig`.

---

## Параметры

### Redis Queue

| Параметр | Значение | Описание |
|---|---|---|
| `queue_key` | `"vk_callback:events"` | Название Redis-очереди |
| `queue_pop_timeout` | `5` сек | Таймаут BRPOP (0 = блокирующий бесконечно) |
| `queue_max_size` | `0` | Макс. размер очереди (0 = безлимитно) |
| `queue_event_ttl` | `3600` сек (1 час) | Время жизни сериализованного события |

### Debounce

| Параметр | Значение | Описание |
|---|---|---|
| `debounce_delay` | `3.0` сек | Задержка группировки связанных событий |
| `debounce_key_prefix` | `"vk_callback:debounce"` | Префикс Redis-ключа |

### Cooldown

| Параметр | Значение | Описание |
|---|---|---|
| `cooldown_default_seconds` | `30.0` сек | Длительность cooldown по умолчанию |
| `cooldown_key_prefix` | `"vk_callback:cooldown"` | Префикс Redis-ключа |

### Дедупликация

| Параметр | Значение | Описание |
|---|---|---|
| `dedup_ttl` | `300` сек (5 мин) | TTL запоминания обработанных event_id |
| `dedup_key_prefix` | `"vk_callback:seen"` | Префикс Redis-ключа |

### Rate Limiting

| Параметр | Значение | Описание |
|---|---|---|
| `rate_limit_max_events` | `100` | Макс. событий от группы в окне |
| `rate_limit_window` | `60` сек | Размер окна |
| `rate_limit_key_prefix` | `"vk_callback:ratelimit"` | Префикс Redis-ключа |

### Worker

| Параметр | Значение | Описание |
|---|---|---|
| `worker_concurrency` | `4` | Кол-во параллельных обработчиков |
| `worker_healthcheck_interval` | `60` сек | Интервал health-check логов |
| `worker_max_retries` | `3` | Макс. повторов при ошибке |
| `worker_retry_delay` | `5.0` сек | Задержка между повторами |

### Логирование

| Параметр | Значение | Описание |
|---|---|---|
| `log_full_payload` | `False` | Логировать полный payload (может быть большим) |
| `log_handler_results` | `True` | Логировать результат каждого хендлера |

---

## Изменение параметров

Параметры задаются через dataclass с дефолтами. Для изменения используй глобальный экземпляр:

```python
from services.vk_callback.config import callback_config

# Изменить задержку debounce
callback_config.debounce_delay = 5.0

# Увеличить rate limit
callback_config.rate_limit_max_events = 200

# Отключить логирование результатов
callback_config.log_handler_results = False
```

> **Примечание:** Изменения применяются в runtime. Для постоянных изменений — отредактируй дефолты в `config.py`.
