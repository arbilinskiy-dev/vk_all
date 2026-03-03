
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import NullPool
import redis
import json

# Импортируем наш централизованный объект настроек
from config import settings

# ===================================================================
# ДИНАМИЧЕСКИЙ ВЫБОР БАЗЫ ДАННЫХ
# ===================================================================
# Эта логика позволяет приложению работать как с PostgreSQL в "боевом"
# окружении, так и с локальной SQLite для разработки.
#
# 1. Если в переменных окружения (в .env или в настройках контейнера) 
#    задана переменная DATABASE_URL, будет использоваться PostgreSQL.
#    Это основной сценарий для развертывания в Yandex.Cloud.
#
# 2. Если DATABASE_URL не задана, приложение по умолчанию будет использовать
#    локальную базу данных SQLite в файле ./vk_planner.db (в текущей папке).
#    Это основной сценарий для локальной разработки, совместимый с Windows, macOS и Linux.
# ===================================================================

# ИЗМЕНЕНО: Путь к SQLite изменен на относительный для совместимости с Windows.
SQLALCHEMY_DATABASE_URL = settings.database_url if settings.database_url else "sqlite:///./vk_planner.db"

# SQLAlchemy 2.0+ требует, чтобы URL для psycopg2 начинался с 'postgresql+psycopg2://'
# Yandex.Cloud предоставляет URL, начинающийся с 'postgres://', поэтому мы его заменяем.
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)

# Настройка аргументов подключения
connect_args = {}
engine_args = {}

if "sqlite" in SQLALCHEMY_DATABASE_URL:
    connect_args["check_same_thread"] = False
    # NullPool: каждый запрос создаёт своё соединение, без переиспользования.
    # В связке с WAL-режимом каждый поток получает изолированное соединение,
    # а WAL обеспечивает параллельное чтение без блокировок.
    # StaticPool (одно соединение) нельзя — вызывает гонку identity map.
    engine_args["poolclass"] = NullPool
else:
    # Для PostgreSQL добавляем настройки пула для предотвращения обрывов соединений
    # 
    # КРИТИЧНО ДЛЯ ПАРАЛЛЕЛЬНЫХ ЗАДАЧ (bulk refresh подписчиков/постов):
    # При 6 токенах в параллели каждый поток создаёт свои сессии.
    # 
    # pool_pre_ping=True: Проверяет соединение перед выдачей (SELECT 1). Решает проблему "SSL SYSCALL error".
    # pool_recycle=120: Пересоздает соединения каждые 2 минуты.
    #                   Yandex Cloud закрывает idle-соединения через 10-15 мин, 
    #                   но при высокой нагрузке лучше обновлять чаще.
    # pool_timeout=60: Увеличено время ожидания свободного соединения (было 30).
    #                  При пиковой нагрузке потоки могут ждать дольше.
    # pool_size=10: Увеличено с 5. Для 4 workers × 10 = 40 базовых соединений.
    #              Параллельные bulk-задачи требуют больше соединений.
    # max_overflow=20: Увеличено с 10. Пиковые нагрузки (4 * 20 = 80).
    #                 Итого макс: 120 соединений — YC PostgreSQL поддерживает до 200.
    engine_args["pool_pre_ping"] = True
    engine_args["pool_recycle"] = 120  # Снижено с 300 до 120 секунд (2 минуты)
    engine_args["pool_timeout"] = 60   # Увеличено с 30 до 60 секунд
    engine_args["pool_size"] = 10      # Увеличено с 5 до 10
    engine_args["max_overflow"] = 20   # Увеличено с 10 до 20

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args,
    **engine_args
)

# ФИКС: Добавляем поддержку регистронезависимого поиска (lower) для кириллицы в SQLite.
# По умолчанию SQLite lower() работает только с ASCII, что ломает поиск (ilike) для русского языка.
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        # WAL-режим: позволяет параллельное чтение без блокировок файла БД.
        # Без WAL SQLite блокирует весь файл при любой операции,
        # что вызывает ERR_CONNECTION_RESET при 5+ параллельных запросах.
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=5000")  # Ждать до 5 сек при блокировке
        cursor.close()
        # Регистрируем функцию lower, использующую Python реализацию (корректный юникод)
        dbapi_connection.create_function("lower", 1, lambda s: s.lower() if s else s)

# ===================================================================
# SCOPED SESSION ДЛЯ ПОТОКОБЕЗОПАСНОСТИ
# ===================================================================
# scoped_session создаёт thread-local сессии — каждый поток получает свою сессию.
# Это критично для фоновых задач (ThreadPoolExecutor, BackgroundTasks),
# которые работают параллельно в разных потоках.
# ===================================================================
_session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
SessionLocal = scoped_session(_session_factory)

Base = declarative_base()

def get_db():
    """
    Dependency для FastAPI — создаёт ИЗОЛИРОВАННУЮ сессию на каждый запрос.
    
    Используем _session_factory() напрямую вместо scoped_session (SessionLocal()),
    чтобы избежать гонки состояний при параллельных запросах:
    - scoped_session привязывает сессию к потоку (thread-local)
    - FastAPI запускает sync-эндпоинты в пуле потоков (anyio thread pool)
    - При параллельных запросах потоки переиспользуются, и SessionLocal.remove()
      одного запроса может убить сессию другого запроса на том же потоке
    - _session_factory() создаёт полностью независимую сессию → нет гонок
    
    SessionLocal (scoped_session) остаётся для фоновых задач (get_background_session).
    """
    db = _session_factory()
    try:
        yield db
    finally:
        db.close()


def get_background_session():
    """
    Создаёт сессию для использования в фоновых задачах.
    ВАЖНО: После использования вызвать SessionLocal.remove()
    
    Пример использования:
        db = get_background_session()
        try:
            # работа с db
            db.commit()
        finally:
            SessionLocal.remove()
    """
    return SessionLocal()

# ===================================================================
# REDIS CLIENT (SINGLETON)
# ===================================================================
# Используется для хранения горячих данных (статусы задач, флаги обновлений),
# которые должны быть доступны всем инстансам контейнера.
# ===================================================================
redis_client = None
if settings.redis_host:
    try:
        redis_client = redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            password=settings.redis_password,
            decode_responses=True, # Автоматически декодировать bytes в str
            socket_timeout=5
        )
        redis_client.ping() # Проверка соединения
        print(f"✅ Redis connected successfully: {settings.redis_host}")
    except Exception as e:
        print(f"⚠️ Redis connection failed: {e}. Fallback to in-memory storage.")
        redis_client = None
else:
    print("ℹ️ Redis not configured. Using in-memory storage (not suitable for multi-instance deployment).")
