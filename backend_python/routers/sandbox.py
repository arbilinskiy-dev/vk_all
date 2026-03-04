"""
Роутер Песочницы (Sandbox).
Полностью изолирован от основной бизнес-логики.
Все эндпоинты начинаются с /api/sandbox/

Каждый тест — отдельный блок эндпоинтов.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import requests as http_requests
import io

# Импортируем изолированные сервисы песочницы
from services.sandbox.photo_upload_test import run_story_upload_test, run_story_upload_only
from services.sandbox.stories_data_test import (
    run_method_with_all_tokens,
    run_full_stories_data_test,
)
from services.sandbox.gemini_models_test import (
    test_single_model,
    test_all_models,
    get_available_models,
)
from services.sandbox.image_generation_test import (
    generate_image,
    get_image_models,
)
from services.sandbox.video_generation_test import (
    start_video_generation,
    check_video_operation,
    get_video_models,
)
from services.sandbox.email_sender_test import (
    test_smtp_connection,
    send_single_email,
    send_mass_email,
    parse_csv_contractors,
    get_smtp_info,
)

router = APIRouter(prefix="/api/sandbox", tags=["Sandbox"])


# ═══════════════════════════════════════════════════════════════
# ТЕСТ 1: Загрузка фото + публикация истории (Story)
# ═══════════════════════════════════════════════════════════════

@router.post("/test1/upload-story")
async def test1_upload_story(
    photo: UploadFile = File(...),
    group_id: int = Form(...),
    community_token: str = Form(...),
    user_token: str = Form(...),
):
    """
    Полный цикл: загрузка фото (user token) + публикация истории (community token).
    Цепочка: stories.getPhotoUploadServer → upload → stories.save
    """
    try:
        # Читаем файл
        file_bytes = await photo.read()
        file_name = photo.filename or "sandbox_test.jpg"
        
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Файл пустой")
        
        if len(file_bytes) > 50 * 1024 * 1024:  # 50 МБ лимит
            raise HTTPException(status_code=400, detail="Файл слишком большой (макс. 50 МБ)")
        
        # Запускаем тест
        result = run_story_upload_test(
            group_id=group_id,
            community_token=community_token,
            user_token=user_token,
            file_bytes=file_bytes,
            file_name=file_name,
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "overall_success": False,
            "failed_at_step": 0,
            "steps": [],
            "result": None,
            "error": str(e)
        }


@router.post("/test1/upload-only")
async def test1_upload_only(
    photo: UploadFile = File(...),
    group_id: int = Form(...),
    user_token: str = Form(...)
):
    """
    Только загрузка фото для истории (без публикации).
    Использует user token для stories.getPhotoUploadServer.
    Возвращает цепочку из 2 шагов.
    """
    try:
        file_bytes = await photo.read()
        file_name = photo.filename or "sandbox_test.jpg"
        
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Файл пустой")
        
        result = run_story_upload_only(
            group_id=group_id,
            user_token=user_token,
            file_bytes=file_bytes,
            file_name=file_name
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "overall_success": False,
            "failed_at_step": 0,
            "steps": [],
            "result": None,
            "error": str(e)
        }


# ═══════════════════════════════════════════════════════════════
# ТЕСТ 2: Получение данных историй (stories.get / getStats / getViewers)
# Тестирование 3 методов с 3 типами токенов
# ═══════════════════════════════════════════════════════════════

class Test2Request(BaseModel):
    """Тело запроса для теста 2."""
    group_id: int
    story_id: Optional[int] = None
    user_token: Optional[str] = None
    user_non_admin_token: Optional[str] = None
    community_token: Optional[str] = None
    service_token: Optional[str] = None
    viewers_count: int = 10


@router.post("/test2/single-method")
async def test2_single_method(
    body: Test2Request,
    method: str,
):
    """
    Тестирует один VK API метод с каждым из предоставленных токенов.
    Query-параметр method: stories.get | stories.getStats | stories.getViewers | viewers_details
    """
    allowed_methods = ["stories.get", "stories.getStats", "stories.getViewers", "viewers_details"]
    if method not in allowed_methods:
        raise HTTPException(
            status_code=400,
            detail=f"Допустимые методы: {', '.join(allowed_methods)}"
        )

    try:
        result = run_method_with_all_tokens(
            method=method,
            group_id=body.group_id,
            story_id=body.story_id,
            user_token=body.user_token,
            user_non_admin_token=body.user_non_admin_token,
            community_token=body.community_token,
            service_token=body.service_token,
            viewers_count=body.viewers_count,
        )
        return result
    except Exception as e:
        return {"error": str(e)}


@router.post("/test2/full-test")
async def test2_full_test(body: Test2Request):
    """
    Запускает все 4 метода (stories.get, stories.getStats, stories.getViewers, viewers_details)
    с каждым из предоставленных токенов.
    Возвращает матрицу результатов: метод × токен.
    """
    try:
        result = run_full_stories_data_test(
            group_id=body.group_id,
            story_id=body.story_id,
            user_token=body.user_token,
            user_non_admin_token=body.user_non_admin_token,
            community_token=body.community_token,
            service_token=body.service_token,
            viewers_count=body.viewers_count,
        )
        return result
    except Exception as e:
        return {"error": str(e)}


# ═══════════════════════════════════════════════════════════════
# ТЕСТ 4: Проверка доступности моделей Google AI (Gemini / Imagen / Gemma)
# Тестирование каждой модели путём минимального запроса к Google AI API
# ═══════════════════════════════════════════════════════════════

class Test4Request(BaseModel):
    """Тело запроса для теста 4."""
    api_key: str
    proxy_url: Optional[str] = None


@router.get("/test4/models")
async def test4_get_models():
    """
    Возвращает список всех доступных для тестирования моделей.
    """
    return {"models": get_available_models()}


@router.post("/test4/single-model")
async def test4_single_model(
    body: Test4Request,
    model_id: str = Query(..., description="ID модели Google AI"),
):
    """
    Тестирует одну модель Google AI.
    Query-параметр model_id: ID модели (например, gemini-2.5-pro-preview-05-06).
    """
    if not body.api_key.strip():
        raise HTTPException(status_code=400, detail="API ключ не указан")

    try:
        result = test_single_model(
            api_key=body.api_key.strip(),
            model_id=model_id,
            proxy_url=body.proxy_url.strip() if body.proxy_url else None,
        )
        return result
    except Exception as e:
        return {"error": str(e)}


@router.post("/test4/all-models")
async def test4_all_models(body: Test4Request):
    """
    Тестирует все модели Google AI последовательно.
    Возвращает сводку + детальные результаты по каждой.
    """
    if not body.api_key.strip():
        raise HTTPException(status_code=400, detail="API ключ не указан")

    try:
        result = test_all_models(
            api_key=body.api_key.strip(),
            proxy_url=body.proxy_url.strip() if body.proxy_url else None,
        )
        return result
    except Exception as e:
        return {"error": str(e)}


# ═══════════════════════════════════════════════════════════════
# ТЕСТ 5: Генерация изображений через Google AI (Gemini / Imagen)
# Пользователь вводит промпт — каждая модель генерирует картинку
# ═══════════════════════════════════════════════════════════════

class Test5Request(BaseModel):
    """Тело запроса для теста 5 (генерация изображений)."""
    api_key: str
    prompt: str
    proxy_url: Optional[str] = None


@router.get("/test5/models")
async def test5_get_models():
    """Список моделей для генерации изображений."""
    return {"models": get_image_models()}


@router.post("/test5/generate")
async def test5_generate_image(
    body: Test5Request,
    model_id: str = Query(..., description="ID модели для генерации изображения"),
):
    """
    Генерирует изображение через указанную модель.
    Gemini — generateContent с IMAGE modality.
    Imagen — predict endpoint.
    """
    if not body.api_key.strip():
        raise HTTPException(status_code=400, detail="API ключ не указан")
    if not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Промпт не указан")

    try:
        result = generate_image(
            api_key=body.api_key.strip(),
            model_id=model_id,
            prompt=body.prompt.strip(),
            proxy_url=body.proxy_url.strip() if body.proxy_url else None,
        )
        return result
    except Exception as e:
        return {"error": str(e)}


# ═══════════════════════════════════════════════════════════════
# ТЕСТ 6: Генерация видео через Google AI (Veo)
# Асинхронная генерация: запуск → поллинг → результат
# ═══════════════════════════════════════════════════════════════

class Test6Request(BaseModel):
    """Тело запроса для теста 6 (генерация видео)."""
    api_key: str
    prompt: str
    duration_seconds: int = 5
    proxy_url: Optional[str] = None


class Test6CheckRequest(BaseModel):
    """Тело запроса для проверки статуса операции."""
    api_key: str
    operation_name: str
    proxy_url: Optional[str] = None


@router.get("/test6/models")
async def test6_get_models():
    """Список моделей Veo для генерации видео."""
    return {"models": get_video_models()}


@router.post("/test6/start")
async def test6_start_video(
    body: Test6Request,
    model_id: str = Query(..., description="ID модели Veo"),
):
    """
    Запускает генерацию видео. Пробует несколько API-методов.
    Возвращает operation_name для поллинга или результат сразу.
    """
    if not body.api_key.strip():
        raise HTTPException(status_code=400, detail="API ключ не указан")
    if not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Промпт не указан")

    try:
        result = start_video_generation(
            api_key=body.api_key.strip(),
            model_id=model_id,
            prompt=body.prompt.strip(),
            duration_seconds=body.duration_seconds,
            proxy_url=body.proxy_url.strip() if body.proxy_url else None,
        )
        return result
    except Exception as e:
        return {"error": str(e)}


@router.post("/test6/check")
async def test6_check_video(body: Test6CheckRequest):
    """
    Проверяет статус long-running операции генерации видео.
    Возвращает is_done + video_uri когда готово.
    """
    if not body.api_key.strip():
        raise HTTPException(status_code=400, detail="API ключ не указан")
    if not body.operation_name.strip():
        raise HTTPException(status_code=400, detail="Имя операции не указано")

    try:
        result = check_video_operation(
            api_key=body.api_key.strip(),
            operation_name=body.operation_name.strip(),
            proxy_url=body.proxy_url.strip() if body.proxy_url else None,
        )
        return result
    except Exception as e:
        return {"error": str(e)}


# ─── Проксирование видео (обход CORS для <video>) ───────────────

class Test6ProxyRequest(BaseModel):
    api_key: str
    video_uri: str
    proxy_url: Optional[str] = None


@router.get("/test6/proxy-video")
async def test6_proxy_video_get(
    api_key: str = Query(...),
    video_uri: str = Query(...),
    proxy_url: Optional[str] = Query(None),
):
    """
    GET-эндпоинт для <video src="..."> — скачивает видео через бэкенд.
    Google AI video URI требует API ключ для доступа.
    """
    return _proxy_video(api_key, video_uri, proxy_url)


@router.post("/test6/proxy-video")
async def test6_proxy_video_post(body: Test6ProxyRequest):
    """
    POST-эндпоинт для кнопки «Скачать» (принимает JSON body).
    """
    return _proxy_video(
        body.api_key.strip(),
        body.video_uri.strip(),
        body.proxy_url.strip() if body.proxy_url else None,
    )


def _proxy_video(api_key: str, video_uri: str, proxy_url: Optional[str] = None):
    """Общая логика проксирования видео."""
    if not api_key:
        raise HTTPException(status_code=400, detail="API ключ не указан")
    if not video_uri:
        raise HTTPException(status_code=400, detail="Video URI не указан")

    # Добавляем API ключ к URI
    separator = "&" if "?" in video_uri else "?"
    video_url = f"{video_uri}{separator}key={api_key}"

    proxies = None
    if proxy_url:
        proxies = {"http": proxy_url, "https": proxy_url}

    try:
        resp = http_requests.get(video_url, timeout=120, proxies=proxies, stream=True)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Google API вернул {resp.status_code}: {resp.text[:500]}"
            )

        content_type = resp.headers.get("Content-Type", "video/mp4")
        content_length = resp.headers.get("Content-Length")

        headers = {}
        if content_length:
            headers["Content-Length"] = content_length
        headers["Content-Disposition"] = 'inline; filename="veo_video.mp4"'

        return StreamingResponse(
            io.BytesIO(resp.content),
            media_type=content_type,
            headers=headers,
        )
    except http_requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Таймаут при скачивании видео")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка загрузки видео: {str(e)}")


# ═══════════════════════════════════════════════════════════════
# ТЕСТ 7: Массовая отправка email с вложениями (Яндекс SMTP)
# Отправка документов контрагентам — каждому свой файл
# ═══════════════════════════════════════════════════════════════

class Test7ConnectionRequest(BaseModel):
    """Тело запроса для проверки подключения SMTP."""
    login: str
    app_password: str
    use_ssl: bool = True


class Test7SendRequest(BaseModel):
    """Тело запроса для отправки одного письма."""
    login: str
    app_password: str
    to_emails: list[str]
    subject: str
    body_html: str
    use_ssl: bool = True


class Test7MassRequest(BaseModel):
    """Тело запроса для массовой отправки."""
    login: str
    app_password: str
    csv_content: str
    body_template: str
    delay_seconds: int = 7
    use_ssl: bool = True


class Test7ParseCsvRequest(BaseModel):
    """Тело запроса для парсинга CSV."""
    csv_content: str


@router.get("/test7/info")
async def test7_smtp_info():
    """Информация о SMTP настройках и лимитах Яндекса."""
    return get_smtp_info()


@router.post("/test7/test-connection")
async def test7_test_connection(body: Test7ConnectionRequest):
    """Проверяет подключение к SMTP-серверу Яндекса."""
    if not body.login.strip():
        raise HTTPException(status_code=400, detail="Логин не указан")
    if not body.app_password.strip():
        raise HTTPException(status_code=400, detail="Пароль приложения не указан")

    try:
        result = test_smtp_connection(
            login=body.login.strip(),
            app_password=body.app_password.strip(),
            use_ssl=body.use_ssl,
        )
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/test7/send")
async def test7_send_email(
    login: str = Form(...),
    app_password: str = Form(...),
    to_emails: str = Form(...),
    subject: str = Form(...),
    body_html: str = Form(...),
    use_ssl: bool = Form(True),
    attachment: Optional[UploadFile] = File(None),
):
    """
    Отправляет одно письмо с опциональным вложением.
    to_emails — через запятую: "a@mail.ru,b@mail.ru"
    """
    if not login.strip():
        raise HTTPException(status_code=400, detail="Логин не указан")
    if not app_password.strip():
        raise HTTPException(status_code=400, detail="Пароль приложения не указан")
    if not to_emails.strip():
        raise HTTPException(status_code=400, detail="Адресаты не указаны")

    emails = [e.strip() for e in to_emails.split(",") if e.strip()]
    if not emails:
        raise HTTPException(status_code=400, detail="Некорректные email-адреса")

    # Читаем вложение если есть
    attachment_data = None
    attachment_filename = None
    if attachment and attachment.filename:
        attachment_data = await attachment.read()
        attachment_filename = attachment.filename

    try:
        result = send_single_email(
            login=login.strip(),
            app_password=app_password.strip(),
            to_emails=emails,
            subject=subject.strip(),
            body_html=body_html,
            attachment_data=attachment_data,
            attachment_filename=attachment_filename,
            use_ssl=use_ssl,
        )
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/test7/parse-csv")
async def test7_parse_csv(body: Test7ParseCsvRequest):
    """Парсит CSV и возвращает список контрагентов для предпросмотра."""
    if not body.csv_content.strip():
        raise HTTPException(status_code=400, detail="CSV пустой")

    return parse_csv_contractors(body.csv_content.strip())


@router.post("/test7/mass-send")
async def test7_mass_send(
    login: str = Form(...),
    app_password: str = Form(...),
    csv_content: str = Form(...),
    body_template: str = Form(...),
    delay_seconds: int = Form(7),
    use_ssl: bool = Form(True),
    attachment: Optional[UploadFile] = File(None),
):
    """
    Массовая отправка писем контрагентам из CSV.
    Каждому контрагенту — своё письмо на все его email-адреса.
    Вложение — один файл для всех (или без вложения).
    """
    if not login.strip():
        raise HTTPException(status_code=400, detail="Логин не указан")
    if not app_password.strip():
        raise HTTPException(status_code=400, detail="Пароль приложения не указан")

    # Парсим CSV
    parsed = parse_csv_contractors(csv_content.strip())
    if not parsed["success"]:
        raise HTTPException(status_code=400, detail=f"Ошибка CSV: {parsed['errors']}")
    if not parsed["contractors"]:
        raise HTTPException(status_code=400, detail="CSV не содержит контрагентов")

    # Читаем вложение
    attachment_data = None
    attachment_filename = None
    if attachment and attachment.filename:
        attachment_data = await attachment.read()
        attachment_filename = attachment.filename

    try:
        result = send_mass_email(
            login=login.strip(),
            app_password=app_password.strip(),
            contractors=parsed["contractors"],
            body_template=body_template,
            attachment_data=attachment_data,
            attachment_filename=attachment_filename,
            delay_seconds=delay_seconds,
            use_ssl=use_ssl,
        )
        return result
    except Exception as e:
        return {"success": False, "error": str(e)}
