"""
Сервис Песочницы: Тест 1 — Загрузка фото + публикация истории (Story).

Полностью изолирован от основной логики приложения.
User Token — для загрузки фото (stories.getPhotoUploadServer).
Community Token — для публикации истории (stories.save).
Возвращает полную цепочку JSON запросов и ответов каждого шага.
"""

import requests
import time
import json
from typing import Dict, Any, Optional, List

VK_API_VERSION = '5.199'
VK_API_BASE_URL = 'https://api.vk.com/method/'

# Таймаут для запросов к VK API
REQUEST_TIMEOUT = 15


def _make_vk_request(method: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Выполняет один запрос к VK API и возвращает структурированный лог.
    Не использует retry/ротацию — для прозрачности.
    """
    url = f"{VK_API_BASE_URL}{method}"
    
    # Добавляем версию API если не указана
    payload = params.copy()
    if 'v' not in payload:
        payload['v'] = VK_API_VERSION
    
    # Формируем лог запроса (без токена для безопасности)
    safe_payload = payload.copy()
    if 'access_token' in safe_payload:
        token = safe_payload['access_token']
        safe_payload['access_token'] = f"{token[:12]}...{token[-4:]}" if len(token) > 16 else "***"
    
    request_log = {
        "url": url,
        "method": "POST",
        "params": safe_payload
    }
    
    start_time = time.time()
    
    try:
        response = requests.post(url, data=payload, timeout=REQUEST_TIMEOUT)
        elapsed_ms = round((time.time() - start_time) * 1000)
        
        response_data = response.json()
        
        return {
            "success": "response" in response_data,
            "request": request_log,
            "response": response_data,
            "http_status": response.status_code,
            "elapsed_ms": elapsed_ms,
            "error": response_data.get("error", None)
        }
    except Exception as e:
        elapsed_ms = round((time.time() - start_time) * 1000)
        return {
            "success": False,
            "request": request_log,
            "response": None,
            "http_status": None,
            "elapsed_ms": elapsed_ms,
            "error": {"message": str(e), "type": type(e).__name__}
        }


def _upload_file_to_url(upload_url: str, file_bytes: bytes, file_name: str, field_name: str = 'file') -> Dict[str, Any]:
    """
    Загружает файл на VK upload server и возвращает лог.
    field_name — имя поля в multipart/form-data ('file' для сторис, 'photo' для стены).
    """
    request_log = {
        "url": upload_url,
        "method": "POST (multipart/form-data)",
        "file_name": file_name,
        "file_size_bytes": len(file_bytes),
        "field_name": field_name
    }
    
    start_time = time.time()
    
    try:
        files = {field_name: (file_name, file_bytes, 'image/jpeg')}
        response = requests.post(upload_url, files=files, timeout=30)
        elapsed_ms = round((time.time() - start_time) * 1000)
        
        response_data = response.json()
        
        # Универсальная проверка: ответ не пустой и HTTP 200
        has_content = bool(response_data) and response.status_code == 200
        
        return {
            "success": has_content,
            "request": request_log,
            "response": response_data,
            "http_status": response.status_code,
            "elapsed_ms": elapsed_ms,
            "error": None if has_content else {"message": "Пустой или ошибочный ответ от VK сервера"}
        }
    except Exception as e:
        elapsed_ms = round((time.time() - start_time) * 1000)
        return {
            "success": False,
            "request": request_log,
            "response": None,
            "http_status": None,
            "elapsed_ms": elapsed_ms,
            "error": {"message": str(e), "type": type(e).__name__}
        }


def run_story_upload_test(
    group_id: int,
    community_token: str,
    user_token: str,
    file_bytes: bytes,
    file_name: str,
) -> Dict[str, Any]:
    """
    Полный тест: загрузка фото → публикация истории.
    User Token — для получения upload server (шаг 1) и загрузки фото (шаг 2).
    Community Token — для публикации истории (шаг 3).
    
    Цепочка: stories.getPhotoUploadServer → upload → stories.save
    """
    steps: List[Dict[str, Any]] = []
    
    # ═══════════════════════════════════════════════
    # ШАГ 1: stories.getPhotoUploadServer (через user token)
    # ═══════════════════════════════════════════════
    step1 = _make_vk_request('stories.getPhotoUploadServer', {
        'group_id': group_id,
        'add_to_news': 1,
        'access_token': user_token
    })
    steps.append({
        "step": 1,
        "name": "stories.getPhotoUploadServer",
        "description": "Получение URL сервера для загрузки фото истории (через user token)",
        **step1
    })
    
    if not step1["success"]:
        return {
            "overall_success": False,
            "failed_at_step": 1,
            "steps": steps,
            "result": None
        }
    
    upload_url = step1["response"]["response"].get("upload_url")
    if not upload_url:
        steps[-1]["error"] = {"message": "VK не вернул upload_url в ответе"}
        return {
            "overall_success": False,
            "failed_at_step": 1,
            "steps": steps,
            "result": None
        }
    
    # ═══════════════════════════════════════════════
    # ШАГ 2: Загрузка файла на upload_url
    # (для сторис используется поле 'file')
    # ═══════════════════════════════════════════════
    step2 = _upload_file_to_url(upload_url, file_bytes, file_name, field_name='file')
    steps.append({
        "step": 2,
        "name": "Загрузка файла на VK сервер",
        "description": f"POST multipart/form-data на upload_url ({len(file_bytes)} байт)",
        **step2
    })
    
    if not step2["success"]:
        return {
            "overall_success": False,
            "failed_at_step": 2,
            "steps": steps,
            "result": None
        }
    
    upload_response = step2["response"]
    
    # Получаем upload_result из ответа загрузки
    # Структура ответа: {"response": {"upload_result": "go_upload:..."}, "_sig": "..."}
    upload_result = None
    if isinstance(upload_response.get("response"), dict):
        upload_result = upload_response["response"].get("upload_result")
    if not upload_result:
        upload_result = upload_response.get("upload_result")
    if not upload_result:
        steps[-1]["error"] = {"message": "VK не вернул upload_result в ответе загрузки"}
        return {
            "overall_success": False,
            "failed_at_step": 2,
            "steps": steps,
            "result": None
        }
    
    # ═══════════════════════════════════════════════
    # ШАГ 3: stories.save (через user token)
    # VK требует тот же токен, что использовался для getPhotoUploadServer.
    # Community token не может «подхватить» чужую загрузку — вернёт items: [].
    # ═══════════════════════════════════════════════
    step3 = _make_vk_request('stories.save', {
        'upload_results': upload_result,
        'access_token': user_token
    })
    steps.append({
        "step": 3,
        "name": "stories.save",
        "description": "Публикация истории в сообществе (через user token)",
        **step3
    })
    
    if not step3["success"]:
        return {
            "overall_success": False,
            "failed_at_step": 3,
            "steps": steps,
            "result": None
        }
    
    # Извлекаем данные из ответа stories.save
    save_response = step3["response"]["response"]
    story_items = save_response.get("items", [])
    story_data = story_items[0] if story_items else {}
    story_id = story_data.get("id")
    owner_id = story_data.get("owner_id")
    
    return {
        "overall_success": True,
        "failed_at_step": None,
        "steps": steps,
        "result": {
            "story_id": story_id,
            "owner_id": owner_id,
            "story_url": f"https://vk.com/story{owner_id}_{story_id}" if story_id and owner_id else None
        }
    }


def run_story_upload_only(
    group_id: int,
    user_token: str,
    file_bytes: bytes,
    file_name: str
) -> Dict[str, Any]:
    """
    Только загрузка фото для истории (без публикации).
    Использует user token.
    Возвращает 2 шага: getPhotoUploadServer → upload.
    """
    steps: List[Dict[str, Any]] = []
    
    # ШАГ 1: stories.getPhotoUploadServer (через user token)
    step1 = _make_vk_request('stories.getPhotoUploadServer', {
        'group_id': group_id,
        'add_to_news': 1,
        'access_token': user_token
    })
    steps.append({
        "step": 1,
        "name": "stories.getPhotoUploadServer",
        "description": "Получение URL сервера для загрузки фото истории (через user token)",
        **step1
    })
    
    if not step1["success"]:
        return {"overall_success": False, "failed_at_step": 1, "steps": steps, "result": None}
    
    upload_url = step1["response"]["response"].get("upload_url")
    if not upload_url:
        steps[-1]["error"] = {"message": "VK не вернул upload_url"}
        return {"overall_success": False, "failed_at_step": 1, "steps": steps, "result": None}
    
    # ШАГ 2: Загрузка файла
    step2 = _upload_file_to_url(upload_url, file_bytes, file_name, field_name='file')
    steps.append({
        "step": 2,
        "name": "Загрузка файла на VK сервер",
        "description": f"POST multipart/form-data ({len(file_bytes)} байт)",
        **step2
    })
    
    if not step2["success"]:
        return {"overall_success": False, "failed_at_step": 2, "steps": steps, "result": None}
    
    upload_response = step2["response"]
    # Извлекаем upload_result (может быть вложен в response.upload_result)
    upload_result_str = None
    if isinstance(upload_response.get("response"), dict):
        upload_result_str = upload_response["response"].get("upload_result")
    if not upload_result_str:
        upload_result_str = upload_response.get("upload_result")
    
    return {
        "overall_success": True,
        "failed_at_step": None,
        "steps": steps,
        "result": {
            "upload_result": upload_result_str,
            "raw_response": upload_response
        }
    }
