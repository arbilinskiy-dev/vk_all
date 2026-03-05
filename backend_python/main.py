
from fastapi import FastAPI, HTTPException, Request, Depends, Response
from fastapi.responses import JSONResponse, PlainTextResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
from sqlalchemy.orm import Session
import uuid 
import os
import logging

# =====================================================
# НАСТРОЙКА ЛОГИРОВАНИЯ ДЛЯ ДИАГНОСТИКИ
# =====================================================
# Включение детального логирования:
#   SYNC_DEBUG=true  — логи синхронизации подписчиков
#   SQLALCHEMY_DEBUG=true — логи SQLAlchemy (пул, запросы)
#   LOG_LEVEL=DEBUG — общий уровень логирования
# =====================================================

log_level = os.getenv("LOG_LEVEL", "INFO").upper()
sync_debug = os.getenv("SYNC_DEBUG", "false").lower() == "true"
sqlalchemy_debug = os.getenv("SQLALCHEMY_DEBUG", "false").lower() == "true"

# Настраиваем формат логов
logging.basicConfig(
    level=getattr(logging, log_level, logging.INFO),
    format='%(asctime)s | %(name)s | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Логирование для модулей синхронизации
if sync_debug:
    logging.getLogger("services.lists.parallel_subscribers").setLevel(logging.DEBUG)
    logging.getLogger("db_diagnostics").setLevel(logging.DEBUG)
    logging.info("🔍 SYNC_DEBUG enabled — detailed sync logging active")

# Логирование SQLAlchemy
if sqlalchemy_debug:
    logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.pool").setLevel(logging.DEBUG)
    logging.info("🔍 SQLALCHEMY_DEBUG enabled — DB pool logging active")

# =====================================================
# КОМПАКТНЫЙ ФОРМАТ ACCESS-ЛОГОВ UVICORN
# Обрезает длинные query-параметры в URL (>120 символов)
# =====================================================
class CompactAccessLogFilter(logging.Filter):
    """Обрезает длинные URL в access-логах uvicorn для читаемости."""
    MAX_PATH_LEN = 120  # Максимальная длина пути в логе

    def filter(self, record: logging.LogRecord) -> bool:
        # uvicorn.access передаёт args как tuple: (client, method, full_path, http_version, status)
        if hasattr(record, 'args') and isinstance(record.args, tuple) and len(record.args) >= 5:
            args = list(record.args)
            full_path = str(args[2])  # full_path — третий элемент
            if '?' in full_path and len(full_path) > self.MAX_PATH_LEN:
                path_part = full_path.split('?')[0]
                query_part = full_path.split('?', 1)[1]
                # Считаем количество элементов (разделённых запятыми или %2C)
                param_count = query_part.count('%2C') + query_part.count(',') + 1
                short_query = query_part[:60] + f'...({param_count} items)'
                args[2] = f'{path_part}?{short_query}'
                record.args = tuple(args)
        return True

# Применяем фильтр к логгеру uvicorn.access
_uvicorn_access_logger = logging.getLogger("uvicorn.access")
_uvicorn_access_logger.addFilter(CompactAccessLogFilter())

from database import engine, SessionLocal, get_db
import models
import schemas
import services.post_service
from migrations import run_migrations
import crud 
from services import vk_service 
from config import settings 
import services.initialization_service as initialization_service 
import services.encryption_migration_service as encryption_migration 

# Импортируем новый планировщик
import services.scheduler_service as scheduler_service

# Старый импорт трекера убираем из использования в startup, но оставляем импорт если он нужен где-то еще
import services.post_tracker_service as post_tracker_service

from routers import projects, posts, ai, media, notes, management, tags, system_posts, auth, auth_logs, users, ai_presets, global_variables, market, market_ai, lists, system_accounts, project_context, ai_tokens, automations, automations_ai, automations_general, stories_automation, vk_test_auth, vk_callback, contest_v2, bulk_edit, sandbox, batch, messages, messages_stats, message_subscriptions, message_templates, active_sessions, promo_lists, dialog_labels, user_activity, roles, message_actions, dlvry

# Версия бэкенда - обновляй при каждом деплое!
BACKEND_VERSION = "v1.0.51_bulk_ai_fix"

# Создание всех таблиц в базе данных при старте
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(vk_callback.router, prefix="/api/vk", tags=["vk_callback"])

# ===== Эндпоинт версии =====
@app.get("/api/version")
def get_version():
    """Возвращает текущую версию бэкенда."""
    return {"version": BACKEND_VERSION}


# ===== VK OAuth Callback Handler =====
# Обрабатывает редирект от VK после авторизации
@app.get("/", response_class=HTMLResponse)
async def vk_oauth_callback(
    code: str = None,
    device_id: str = None,
    state: str = None,
    ext_id: str = None,
    type: str = None,
    expires_in: int = None
):
    """
    Обработчик callback от VK OAuth.
    VK перенаправляет сюда после авторизации пользователя.
    Страница пытается передать код обратно в opener через postMessage.
    """
    if code:
        # Это callback от VK с кодом авторизации
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>VK Авторизация — Планировщик контента</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                * {{
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }}
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-color: #f3f4f6;
                }}
                .card {{
                    background: white;
                    padding: 32px 40px;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                }}
                .icon {{
                    width: 48px;
                    height: 48px;
                    margin: 0 auto 16px;
                    background: #DEF7EC;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }}
                .icon svg {{
                    width: 24px;
                    height: 24px;
                    color: #059669;
                }}
                h1 {{
                    color: #111827;
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 8px;
                }}
                .status {{
                    color: #6b7280;
                    font-size: 14px;
                    margin-bottom: 16px;
                }}
                .loader {{
                    width: 20px;
                    height: 20px;
                    border: 2px solid #e5e7eb;
                    border-top-color: #4f46e5;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin: 0 auto;
                }}
                @keyframes spin {{
                    to {{ transform: rotate(360deg); }}
                }}
                .code-block {{
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    padding: 12px;
                    border-radius: 6px;
                    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
                    font-size: 11px;
                    color: #374151;
                    word-break: break-all;
                    margin-top: 16px;
                    text-align: left;
                }}
                .hint {{
                    color: #9ca3af;
                    font-size: 12px;
                    margin-top: 16px;
                }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h1>Авторизация успешна</h1>
                <p class="status" id="status">Передаём данные...</p>
                <div class="loader" id="loader"></div>
                <div class="code-block" id="code-block" style="display:none">
                    <strong>Code:</strong> {code[:40]}...
                </div>
                <p class="hint" id="close-hint" style="display:none">
                    Можете закрыть это окно
                </p>
            </div>
            
            <script>
                const authData = {{
                    code: "{code}",
                    device_id: "{device_id or ''}",
                    state: "{state or ''}",
                    type: "{type or ''}"
                }};
                
                if (window.opener) {{
                    try {{
                        window.opener.postMessage({{
                            type: 'VK_AUTH_CALLBACK',
                            payload: authData
                        }}, '*');
                        
                        document.getElementById('status').textContent = 'Данные переданы! Закрываем окно...';
                        document.getElementById('loader').style.display = 'none';
                        
                        setTimeout(() => window.close(), 1200);
                    }} catch (e) {{
                        document.getElementById('status').textContent = 'Не удалось передать данные автоматически';
                        document.getElementById('code-block').style.display = 'block';
                        document.getElementById('close-hint').style.display = 'block';
                        document.getElementById('loader').style.display = 'none';
                    }}
                }} else {{
                    document.getElementById('status').textContent = 'Код авторизации:';
                    document.getElementById('code-block').style.display = 'block';
                    document.getElementById('close-hint').style.display = 'block';
                    document.getElementById('loader').style.display = 'none';
                }}
            </script>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)
    else:
        # Обычный GET / без параметров
        return HTMLResponse(content="<h1>VK Planner Backend</h1><p>API is running.</p>")

# Событие при старте для миграций и начального заполнения БД
@app.on_event("startup")
def startup_event():
    print("\n" + "="*50)
    print(f"!!! ЗАПУЩЕНА ВЕРСИЯ: {BACKEND_VERSION} !!!")
    print(f"!!! ALLOWED ORIGINS: {origins} !!!")
    print("="*50 + "\n")

    # Шаг 0: Проверяем необходимость ротации ключей (перешифровки)
    encryption_migration.rotate_keys_using_env()

    # Шаг 1: Запускаем миграции для обновления схемы БД
    print("Checking database schema...")
    run_migrations(engine)

    # Шаг 1.5: Запускаем миграцию данных (Шифрование старых данных)
    encryption_migration.migrate_to_encrypted()
    
    db = SessionLocal()
    try:
        # Шаг 2: Проверяем, нужно ли начальное заполнение проектов (Seeding)
        project_count = db.query(models.Project).count()
        if project_count == 0:
            print("Database is empty. Seeding with initial project data...")
            # ... (код сидинга без изменений) ...
            initial_projects = [
                models.Project(
                    id='173525155',
                    vkProjectId='173525155',
                    vkGroupShortName='testagencymvp',
                    vkGroupName='Тестовое сообщество',
                    vkLink='https://vk.com/club173525155',
                    name='Тестовое сообщество',
                    team='C',
                    disabled=False,
                    notes='Тестовое сообщество труляля',
                    communityToken='vk1.a.95YIp2524hmexX5wFwuRcbNyYfcdKhFtciIWooFpenYNbZX7cBrgGgw8n9q3RGqKKxU5CCXs4WGptLKXPm23uBvKB0m-RydyWrEz-mPj2-j5M0SwN_RJRjl3v0xWQO4hjor2Gwodr8uiKxcEF0-r4iZvKPRb2BdLFpP5V4za-_E49FQIApRgQ9JvZJqplsBLYkyTvoaiJJLmki7u3cyMsg',
                    variables='(тестовая переменная||ссылка типо), (вторая тестоваря переменная||другая ссылка типо), (адрес||улица 3), (еще одна||), (Номер телефона||), (Режим работы||), (Сайт||), (DLVRY||), (Mobile ios||), (Mobile android||)'
                ),
                models.Project(
                    id='203623179',
                    vkProjectId='203623179',
                    vkGroupShortName='kluchinim31',
                    vkGroupName='Изготовление автоключей | КЛЮЧИНИМ | Белгород',
                    vkLink='https://vk.com/kluchinim31',
                    name='Изготовление автоключей | КЛЮЧИНИМ | Белгород',
                    team='А',
                    disabled=False,
                    notes='',
                    communityToken='vk1.a.oGO8lsb4UCwtjkE8kY1D6x5XUoy5yVryb1OAx_ewF9z7jHrhHZpi7ICmFzJEDUHkV6dujUANWoS447IIPl5DtVvEi2VfSKPADV1xrrbJ29K5wh66umF6IQVkF8pn1oVSjoOZ5MFX1W-LQ7e7heLyjvyvEUi-81-55vdJZQGUXiuvpG5bpWPAcHgVfNpiCFSsxx_ROUeBMRw9SPkv37YQlw',
                    variables=''
                ),
                models.Project(
                    id='201698791',
                    vkProjectId='201698791',
                    vkGroupShortName='fioletonmsk',
                    vkGroupName='Фиолето Суши | Доставка роллов | Новомосковск',
                    vkLink='https://vk.com/fioletonmsk',
                    name='Фиолето Суши | Доставка роллов | Новомосковск',
                    team='B',
                    disabled=False,
                    notes='Проект отключен',
                    communityToken='vk1.a.bAcqEAssWTsUjpuPV6YdS3zUFFlvBc0inngjHrfZA29ROWTHshB3vcL3iHDV4xii27RYLgcijz4QxIqSRc80c73pmBQGH8JWZC7pMbIz96Dj1mWWvALrpxu0BbX76Pi7_2ZVq54JDMM94F5f-IWinUewJrxu6codYC-fe04gGh1tvirUvUjPio4KEnsPrdrx98cYyjKMwyxA3gfZwRjvjA',
                    variables='(Номер телефона||89961655555), (Адрес||улица Мира, 36Б), (Режим работы||С 10.00 до 22.30), (Сайт||), (DLVRY||https://vk.com/app6408974_-201698791), (Mobile ios||), (Mobile android||), (Условия доставки||Бесплатная доставка от 800₽)'
                )
            ]
            db.add_all(initial_projects)
            db.commit()
            print(f"Successfully seeded {len(initial_projects)} projects.")

        # Шаг 3: Безопасная инициализация предзаданных данных
        initialization_service.init_all_data(db)

    except Exception as e:
        print(f"CRITICAL STARTUP ERROR: {e}")
    finally:
        db.close()

    # Шаг 4: Запускаем новый планировщик вместо старого трекера
    print("Starting APScheduler...")
    scheduler_service.start()
    
    # Шаг 5: Запускаем VK Callback Worker в фоновом потоке
    # Redis-лок гарантирует, что в Gunicorn (4 воркера) запустится только один экземпляр
    # Если DISABLE_EMBEDDED_CALLBACK=true — пропускаем (callback работает отдельным процессом)
    if os.getenv("DISABLE_EMBEDDED_CALLBACK", "").lower() in ("true", "1", "yes"):
        print("VK Callback Worker skipped (DISABLE_EMBEDDED_CALLBACK=true, запущен отдельным процессом).")
    else:
        try:
            from services.vk_callback.worker import start_embedded_worker
            started = start_embedded_worker()
            if started:
                print("VK Callback Worker started (embedded mode).")
            else:
                print("VK Callback Worker skipped (another process holds the lock).")
        except Exception as e:
            print(f"VK Callback Worker failed to start: {e}")
    
    # Шаг 6: Запускаем SSE Redis Listener (для push-уведомлений о новых сообщениях)
    try:
        from services.sse_manager import sse_manager
        # Инициализируем ссылку на event loop ДО запуска Redis listener —
        # гарантирует, что publish() из фоновых потоков (callback worker) всегда имеет валидный loop
        sse_manager.initialize_loop()
        sse_manager.start_redis_listener()
        print("SSE Manager initialized (loop + Redis Pub/Sub listener started if Redis available).")
    except Exception as e:
        print(f"SSE Manager initialization failed: {e}")
    
    # Старый запуск отключен:
    # post_tracker_service.start_post_tracker() 
    
    print("Startup complete.")

@app.on_event("shutdown")
async def shutdown_event():
    """Обработчик корректного завершения приложения."""
    print("Shutting down application...")
    
    # Останавливаем VK Callback Worker
    try:
        from services.vk_callback.worker import stop_embedded_worker
        stop_embedded_worker()
    except Exception as e:
        print(f"Error stopping callback worker: {e}")
    
    scheduler_service.shutdown()
    print("Shutdown complete.")


# Настройка CORS
# Важно: для allow_credentials=True нельзя использовать ["*"], нужно указывать конкретные домены.
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://vk-content-planner-frontend-preprod.website.yandexcloud.net",
    "https://vk-content-planner-frontend.website.yandexcloud.net", # На будущее для прода
    "https://dosmmit.ru",      # Новый домен (основной)
    "https://www.dosmmit.ru",  # Новый домен (www)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.ngrok-free\.app", # Разрешаем динамические адреса ngrok
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware для отключения кэширования (чистый ASGI — БЕЗ BaseHTTPMiddleware).
# BaseHTTPMiddleware буферизирует StreamingResponse, что ломает real-time SSE.
# Чистый ASGI middleware пропускает SSE-стримы без буферизации.
class NoCacheMiddleware:
    """
    ASGI middleware: добавляет no-cache заголовки ко всем ответам,
    кроме SSE-стримов (которые сами управляют своими заголовками).
    
    В отличие от @app.middleware("http") / BaseHTTPMiddleware,
    не оборачивает StreamingResponse во внутренний буфер — SSE-события
    отдаются клиенту в реальном времени без задержки.
    """
    def __init__(self, app: ASGIApp):
        self.app = app
    
    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Проверяем путь — SSE-стримы пропускаем без модификации
        path = scope.get("path", "")
        if path.endswith("/stream") or path.endswith("/global-unread-stream"):
            # SSE-эндпоинты: прямой passthrough без буферизации
            await self.app(scope, receive, send)
            return
        
        # Остальные запросы: добавляем no-cache заголовки
        async def send_with_no_cache(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((b"cache-control", b"no-cache, no-store, must-revalidate"))
                headers.append((b"pragma", b"no-cache"))
                headers.append((b"expires", b"0"))
                message = {**message, "headers": headers}
            await send(message)
        
        await self.app(scope, receive, send_with_no_cache)

app.add_middleware(NoCacheMiddleware)

# Обработчик исключений
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if exc.status_code == 401:
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "error": exc.detail},
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

# Старый эндпоинт /api/callback — удалён.
# Все VK Callback запросы обрабатываются через /api/vk/callback (routers/vk_callback.py).
# Для обратной совместимости перенаправляем старый URL на тот же обработчик.
from routers.vk_callback import vk_callback_handler as _vk_callback_handler

@app.post("/api/callback", response_class=PlainTextResponse, include_in_schema=False)
async def vk_callback_legacy(request: Request, db: Session = Depends(get_db)):
    """Legacy эндпоинт — делегирует в новую модульную систему."""
    return await _vk_callback_handler(request, db)


# Подключение роутеров с общим префиксом /api
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(auth_logs.router, prefix="/api", tags=["Auth Logs"])
app.include_router(active_sessions.router, prefix="/api", tags=["Active Sessions"])
app.include_router(user_activity.router, prefix="/api", tags=["User Activity"])
app.include_router(roles.router, prefix="/api", tags=["User Roles"])
app.include_router(users.router, prefix="/api", tags=["User Management"])
app.include_router(projects.router, prefix="/api", tags=["Projects"])
app.include_router(posts.router, prefix="/api", tags=["Posts & Schedule"])
app.include_router(system_posts.router, prefix="/api", tags=["System Posts"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(media.router, prefix="/api/media", tags=["Media"])
app.include_router(notes.router, prefix="/api", tags=["Notes"])
app.include_router(management.router, prefix="/api", tags=["Database Management"])
app.include_router(tags.router, prefix="/api/tags", tags=["Tags"])
app.include_router(ai_presets.router, prefix="/api/ai-presets", tags=["AI Prompt Presets"])
app.include_router(global_variables.router, prefix="/api/global-variables", tags=["Global Variables"])
app.include_router(market.router, prefix="/api/market", tags=["Market (Products)"])
app.include_router(market_ai.router, prefix="/api/market/ai", tags=["Market (AI)"])
app.include_router(lists.router, prefix="/api", tags=["System Lists"])
app.include_router(system_accounts.router, prefix="/api", tags=["System Accounts"])
app.include_router(project_context.router, prefix="/api", tags=["Project Context"])
app.include_router(ai_tokens.router, prefix="/api", tags=["AI Tokens"])
app.include_router(automations.router, prefix="/api", tags=["Automations"])
app.include_router(automations_ai.router, prefix="/api", tags=["AI Posts Automation"])
app.include_router(automations_general.router, prefix="/api", tags=["Automations General"])
app.include_router(stories_automation.router, prefix="/api", tags=["Stories Automation"])
app.include_router(contest_v2.router, tags=["Contest V2"])
app.include_router(bulk_edit.router, prefix="/api", tags=["Bulk Edit"])
app.include_router(batch.router, prefix="/api", tags=["Batch Loading"])
app.include_router(messages.router, prefix="/api", tags=["Messages"])
app.include_router(messages_stats.router, prefix="/api", tags=["Messages Stats"])
app.include_router(message_subscriptions.router, prefix="/api", tags=["Message Subscriptions"])
app.include_router(message_templates.router, prefix="/api/message-templates", tags=["Message Templates"])
app.include_router(promo_lists.router, prefix="/api/promo-lists", tags=["Promo Lists"])
app.include_router(dialog_labels.router, prefix="/api", tags=["Dialog Labels"])
app.include_router(message_actions.router, prefix="/api", tags=["AM Analysis"])
app.include_router(dlvry.router, prefix="/api/dlvry", tags=["DLVRY Orders"])
app.include_router(vk_test_auth.router)
app.include_router(sandbox.router)
