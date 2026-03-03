"""
Тест 6: Генерация видео через доступные модели Google AI (Veo).

Полностью изолированный сервис песочницы.
Видеогенерация — асинхронный процесс:
1. Отправляем запрос → получаем operation name
2. Поллим статус → ждём done: true
3. Получаем URI видео

Модели: Veo 2.0, 3.0, 3.0 Fast, 3.1, 3.1 Fast.
Пробуем несколько API-методов для каждой модели (generateContent,
predictLongRunning, predict, generateVideos) — чтобы определить,
какой из них работает.
"""

import time
import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Конфигурация моделей Veo ──────────────────────────────────

VIDEO_MODELS = [
    {
        "display_name": "Veo 2",
        "model_id": "veo-2.0-generate-001",
        "description": "Стабильная модель 2-го поколения",
    },
    {
        "display_name": "Veo 3",
        "model_id": "veo-3.0-generate-001",
        "description": "3-е поколение, улучшенное качество + аудио",
    },
    {
        "display_name": "Veo 3 Fast",
        "model_id": "veo-3.0-fast-generate-001",
        "description": "Быстрая версия Veo 3",
    },
    {
        "display_name": "Veo 3.1 (Preview)",
        "model_id": "veo-3.1-generate-preview",
        "description": "Preview нового поколения",
    },
    {
        "display_name": "Veo 3.1 Fast (Preview)",
        "model_id": "veo-3.1-fast-generate-preview",
        "description": "Быстрая preview-версия Veo 3.1",
    },
]


# ─── Запуск генерации видео ────────────────────────────────────

def start_video_generation(
    api_key: str,
    model_id: str,
    prompt: str,
    duration_seconds: int = 5,
    proxy_url: Optional[str] = None,
) -> dict:
    """
    Запускает генерацию видео. Пробует несколько API-методов:
    1. generateContent с responseModalities: ["VIDEO"]
    2. predictLongRunning
    3. predict
    4. generateVideos

    Возвращает operation_name для поллинга или результат сразу.
    """
    model_config = None
    for m in VIDEO_MODELS:
        if m["model_id"] == model_id:
            model_config = m
            break

    if not model_config:
        return {
            "display_name": model_id,
            "model_id": model_id,
            "success": False,
            "operation_name": None,
            "method_used": None,
            "is_done": False,
            "response": None,
            "attempts": [],
            "error": {
                "code": "NOT_FOUND",
                "message": f"Модель {model_id} не в конфигурации",
            },
        }

    proxies = None
    if proxy_url:
        proxies = {"http": proxy_url, "https": proxy_url}

    base_url = "https://generativelanguage.googleapis.com/v1beta"

    # ⚠ durationSeconds принимает ТОЛЬКО дискретные значения:
    #   Veo 2:    {5, 6, 8}
    #   Veo 3/3.1: {4, 6, 8}
    valid_duration = _get_valid_duration(model_id, duration_seconds)
    logger.info(f"[Sandbox] Veo: duration_seconds={duration_seconds} → valid={valid_duration} (model={model_id})")

    # Методы для попыток (от наиболее вероятного к fallback)
    # predictLongRunning — основной метод для Veo (асинхронная генерация)
    # generateContent с VIDEO — не поддерживается на AI Studio API (только Vertex AI)
    methods_to_try = [
        # Метод 1: predictLongRunning (async) — ОСНОВНОЙ для Veo
        {
            "name": "predictLongRunning",
            "url": f"{base_url}/models/{model_id}:predictLongRunning?key={api_key}",
            "payload": {
                "instances": [{"prompt": prompt}],
                "parameters": {
                    "sampleCount": 1,
                    "durationSeconds": valid_duration,
                    "aspectRatio": "16:9",
                },
            },
        },
        # Метод 2: generateVideos (специализированный эндпоинт)
        {
            "name": "generateVideos",
            "url": f"{base_url}/models/{model_id}:generateVideos?key={api_key}",
            "payload": {
                "instances": [{"prompt": prompt}],
                "parameters": {
                    "sampleCount": 1,
                    "durationSeconds": valid_duration,
                    "aspectRatio": "16:9",
                },
            },
        },
        # Метод 3: predict (sync вариант)
        {
            "name": "predict",
            "url": f"{base_url}/models/{model_id}:predict?key={api_key}",
            "payload": {
                "instances": [{"prompt": prompt}],
                "parameters": {
                    "sampleCount": 1,
                    "durationSeconds": valid_duration,
                },
            },
        },
        # Метод 4: generateContent с VIDEO modality (fallback, не работает на AI Studio)
        {
            "name": "generateContent",
            "url": f"{base_url}/models/{model_id}:generateContent?key={api_key}",
            "payload": {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "responseModalities": ["VIDEO"],
                },
            },
        },
    ]

    attempts = []

    for method in methods_to_try:
        method_name = method["name"]
        url = method["url"]
        payload = method["payload"]

        start = time.time()
        try:
            logger.info(f"[Sandbox] Veo: пробуем {method_name} для {model_id}")
            resp = requests.post(url, json=payload, timeout=60, proxies=proxies)
            elapsed = round((time.time() - start) * 1000)

            response_json = resp.json()

            attempt_info = {
                "method": method_name,
                "http_status": resp.status_code,
                "elapsed_ms": elapsed,
                "response_preview": _truncate_response(response_json),
            }
            attempts.append(attempt_info)

            # Успешный ответ
            if resp.status_code == 200:
                operation_name = response_json.get("name")
                is_done = response_json.get("done", False)

                # Проверяем, есть ли сразу видео в ответе
                video_uri = _extract_video_uri(response_json)

                return {
                    "display_name": model_config["display_name"],
                    "model_id": model_id,
                    "success": True,
                    "operation_name": operation_name,
                    "method_used": method_name,
                    "is_done": is_done or (video_uri is not None),
                    "video_uri": video_uri,
                    "response": response_json,
                    "attempts": attempts,
                    "error": None,
                }

            # 429 — квота, не пробуем дальше
            if resp.status_code == 429:
                error_info = response_json.get("error", {})
                return {
                    "display_name": model_config["display_name"],
                    "model_id": model_id,
                    "success": False,
                    "operation_name": None,
                    "method_used": method_name,
                    "is_done": False,
                    "video_uri": None,
                    "response": response_json,
                    "attempts": attempts,
                    "error": {
                        "code": error_info.get("code", 429),
                        "message": error_info.get("message", "Rate limit"),
                        "status": error_info.get("status", "RESOURCE_EXHAUSTED"),
                    },
                }

            # Другие ошибки — пробуем следующий метод
            logger.info(f"[Sandbox] Veo: {method_name} вернул {resp.status_code}, пробуем следующий")

        except requests.exceptions.Timeout:
            elapsed = round((time.time() - start) * 1000)
            attempts.append({
                "method": method_name,
                "http_status": None,
                "elapsed_ms": elapsed,
                "response_preview": "TIMEOUT",
            })
        except Exception as e:
            elapsed = round((time.time() - start) * 1000)
            attempts.append({
                "method": method_name,
                "http_status": None,
                "elapsed_ms": elapsed,
                "response_preview": str(e)[:200],
            })

    # Ни один метод не сработал
    return {
        "display_name": model_config["display_name"],
        "model_id": model_id,
        "success": False,
        "operation_name": None,
        "method_used": None,
        "is_done": False,
        "video_uri": None,
        "response": None,
        "attempts": attempts,
        "error": {
            "code": "ALL_FAILED",
            "message": f"Все {len(methods_to_try)} метода не сработали. Детали в attempts.",
            "status": "ALL_FAILED",
        },
    }


# ─── Поллинг статуса операции ──────────────────────────────────

def check_video_operation(
    api_key: str,
    operation_name: str,
    proxy_url: Optional[str] = None,
) -> dict:
    """
    Проверяет статус long-running операции генерации видео.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/{operation_name}?key={api_key}"

    proxies = None
    if proxy_url:
        proxies = {"http": proxy_url, "https": proxy_url}

    start = time.time()
    try:
        resp = requests.get(url, timeout=15, proxies=proxies)
        elapsed = round((time.time() - start) * 1000)
        response_json = resp.json()

        if resp.status_code == 200:
            is_done = response_json.get("done", False)
            video_uri = _extract_video_uri(response_json) if is_done else None

            return {
                "success": True,
                "is_done": is_done,
                "video_uri": video_uri,
                "elapsed_ms": elapsed,
                "response": response_json,
                "error": None,
            }
        else:
            error_info = response_json.get("error", {})
            return {
                "success": False,
                "is_done": False,
                "video_uri": None,
                "elapsed_ms": elapsed,
                "response": response_json,
                "error": {
                    "code": error_info.get("code"),
                    "message": error_info.get("message", str(response_json)),
                    "status": error_info.get("status"),
                },
            }

    except Exception as e:
        elapsed = round((time.time() - start) * 1000)
        return {
            "success": False,
            "is_done": False,
            "video_uri": None,
            "elapsed_ms": elapsed,
            "response": None,
            "error": {"code": "EXCEPTION", "message": str(e), "status": "EXCEPTION"},
        }


# ─── Вспомогательные функции ──────────────────────────────────

def _extract_video_uri(response_json: dict) -> Optional[str]:
    """
    Извлекает URI видео из различных форматов ответа.
    Google может возвращать видео в разных структурах.
    
    Основной формат (из документации):
      response.generated_videos[0].video.uri
    """
    resp_data = response_json.get("response", response_json)

    # Формат 1 (основной): response.generated_videos[].video.uri
    # Документация: operation.response.generated_videos[0].video
    gen_videos = resp_data.get("generated_videos") or resp_data.get("generatedVideos", [])
    if gen_videos:
        video = gen_videos[0].get("video", {})
        uri = video.get("uri")
        if uri:
            return uri

    # Формат 2: response.generateVideoResponse.generatedSamples[].video.uri
    gen_resp = resp_data.get("generateVideoResponse", {})
    samples = gen_resp.get("generatedSamples", [])
    if samples:
        video = samples[0].get("video", {})
        uri = video.get("uri")
        if uri:
            return uri

    # Формат 3: predictions[].videoUri
    predictions = resp_data.get("predictions", [])
    if predictions:
        uri = predictions[0].get("videoUri") or predictions[0].get("uri")
        if uri:
            return uri

    # Формат 4: candidates[].content.parts[].fileData.fileUri (generateContent формат)
    candidates = resp_data.get("candidates", [])
    if candidates:
        parts = candidates[0].get("content", {}).get("parts", [])
        for part in parts:
            file_data = part.get("fileData", {})
            if file_data.get("fileUri"):
                return file_data["fileUri"]
            # Или inlineData с видео
            inline = part.get("inlineData", {})
            if inline.get("mimeType", "").startswith("video/"):
                return f"data:{inline['mimeType']};base64,{inline.get('data', '')[:100]}..."

    # Формат 5: generatedSamples / generated_videos напрямую (без обёртки response)
    for key in ["generated_videos", "generatedVideos", "generatedSamples"]:
        items = response_json.get(key, [])
        if items:
            video = items[0].get("video", {})
            uri = video.get("uri")
            if uri:
                return uri

    return None


def _get_valid_duration(model_id: str, requested: int) -> int:
    """
    Маппит запрошенную длительность к ближайшему допустимому значению.
    
    Veo API принимает ТОЛЬКО дискретные значения durationSeconds:
      - Veo 2:      {5, 6, 8}
      - Veo 3/3.1:  {4, 6, 8}
    """
    if "veo-2" in model_id:
        valid = [5, 6, 8]
    else:
        valid = [4, 6, 8]
    # Выбираем ближайшее допустимое значение
    return min(valid, key=lambda x: abs(x - requested))


def _truncate_response(response_json: dict) -> dict:
    """Обрезает большие ответы для лога."""
    text = str(response_json)
    if len(text) > 500:
        return {"_truncated": True, "preview": text[:500] + "..."}
    return response_json


def get_video_models() -> list:
    """Список моделей для фронтенда."""
    return [
        {
            "display_name": m["display_name"],
            "model_id": m["model_id"],
            "description": m.get("description", ""),
        }
        for m in VIDEO_MODELS
    ]
