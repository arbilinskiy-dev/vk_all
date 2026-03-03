# Middleware pipeline для VK Callback
#
# Middleware выполняются ДО передачи события хендлеру.
# Каждый middleware может: пропустить, заблокировать или модифицировать событие.

from .base import BaseMiddleware
from .secret_validator import SecretValidatorMiddleware
from .deduplicator import DeduplicatorMiddleware
from .rate_limiter import RateLimiterMiddleware

# Порядок выполнения middleware (важен!)
# 1. Дедупликация — самый дешёвый фильтр, сразу отсекает повторы
# 2. Rate limiting — защита от DoS
# 3. Secret validation — проверка подлинности
DEFAULT_MIDDLEWARE_CHAIN = [
    DeduplicatorMiddleware(),
    RateLimiterMiddleware(),
    SecretValidatorMiddleware(),
]

__all__ = [
    'BaseMiddleware',
    'SecretValidatorMiddleware',
    'DeduplicatorMiddleware',
    'RateLimiterMiddleware',
    'DEFAULT_MIDDLEWARE_CHAIN',
]
