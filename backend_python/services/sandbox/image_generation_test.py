"""
Тест 5: Генерация изображений через доступные модели Google AI.

Полностью изолированный сервис песочницы.
Тестирует реальную генерацию изображений через:
- Gemini модели (generateContent с responseModalities: ["IMAGE", "TEXT"])
- Imagen модели (predict endpoint)

Пользователь вводит промпт — каждая модель пытается сгенерировать
изображение. Результат: base64-картинка или ошибка.
"""

import time
import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Конфигурация моделей для генерации изображений ────────────

IMAGE_MODELS = [
    # ═══ Gemini — нативная генерация изображений ═══
    {
        "display_name": "Gemini 2.5 Flash Image",
        "model_id": "gemini-2.5-flash-image",
        "method": "gemini",
        "description": "Нативная генерация через generateContent + responseModalities",
    },
    {
        "display_name": "Gemini 3 Pro Image Preview",
        "model_id": "gemini-3-pro-image-preview",
        "method": "gemini",
        "description": "Нативная генерация через generateContent + responseModalities",
    },

    # ═══ Imagen 4 — dedicated image generation ═══
    {
        "display_name": "Imagen 4 (Preview)",
        "model_id": "imagen-4.0-generate-preview-06-06",
        "method": "imagen",
        "description": "Генерация через predict endpoint",
    },
    {
        "display_name": "Imagen 4 (Stable)",
        "model_id": "imagen-4.0-generate-001",
        "method": "imagen",
        "description": "Генерация через predict endpoint (стабильная)",
    },
    {
        "display_name": "Imagen 4 Ultra (Preview)",
        "model_id": "imagen-4.0-ultra-generate-preview-06-06",
        "method": "imagen",
        "description": "Ультра-качество, preview",
    },
    {
        "display_name": "Imagen 4 Ultra (Stable)",
        "model_id": "imagen-4.0-ultra-generate-001",
        "method": "imagen",
        "description": "Ультра-качество, стабильная",
    },
    {
        "display_name": "Imagen 4 Fast (Stable)",
        "model_id": "imagen-4.0-fast-generate-001",
        "method": "imagen",
        "description": "Быстрая генерация",
    },
]


# ─── Генерация через Gemini (generateContent) ─────────────────

def _generate_image_gemini(
    api_key: str,
    model_id: str,
    prompt: str,
    proxy_url: Optional[str] = None,
) -> dict:
    """
    Генерация изображения через Gemini generateContent.
    Используем responseModalities: ["IMAGE", "TEXT"] — модель возвращает
    картинку как inlineData (base64) внутри parts.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={api_key}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE", "TEXT"],
            "maxOutputTokens": 8192,
        },
    }

    proxies = None
    if proxy_url:
        proxies = {"http": proxy_url, "https": proxy_url}

    start = time.time()
    try:
        resp = requests.post(url, json=payload, timeout=120, proxies=proxies)
        elapsed = round((time.time() - start) * 1000)
        response_json = resp.json()

        if resp.status_code == 200:
            # Извлекаем изображение и текст из candidates
            candidates = response_json.get("candidates", [])
            image_data = None
            image_mime = None
            response_text = None

            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                for part in parts:
                    if "inlineData" in part:
                        image_data = part["inlineData"].get("data")
                        image_mime = part["inlineData"].get("mimeType", "image/png")
                    elif "text" in part:
                        response_text = part["text"]

            if image_data:
                return {
                    "success": True,
                    "http_status": resp.status_code,
                    "elapsed_ms": elapsed,
                    "image_base64": image_data,
                    "image_mime": image_mime,
                    "response_text": response_text,
                    "error": None,
                }
            else:
                return {
                    "success": False,
                    "http_status": resp.status_code,
                    "elapsed_ms": elapsed,
                    "image_base64": None,
                    "image_mime": None,
                    "response_text": response_text or "Модель не вернула изображение",
                    "error": {
                        "code": "NO_IMAGE",
                        "message": "Ответ не содержит inlineData с изображением",
                        "status": "NO_IMAGE",
                    },
                }
        else:
            error_info = response_json.get("error", {})
            return {
                "success": False,
                "http_status": resp.status_code,
                "elapsed_ms": elapsed,
                "image_base64": None,
                "image_mime": None,
                "response_text": None,
                "error": {
                    "code": error_info.get("code"),
                    "message": error_info.get("message", str(response_json)),
                    "status": error_info.get("status"),
                },
            }

    except requests.exceptions.Timeout:
        elapsed = round((time.time() - start) * 1000)
        return {
            "success": False, "http_status": None, "elapsed_ms": elapsed,
            "image_base64": None, "image_mime": None, "response_text": None,
            "error": {"code": "TIMEOUT", "message": "Таймаут (120с)", "status": "TIMEOUT"},
        }
    except Exception as e:
        elapsed = round((time.time() - start) * 1000)
        return {
            "success": False, "http_status": None, "elapsed_ms": elapsed,
            "image_base64": None, "image_mime": None, "response_text": None,
            "error": {"code": "EXCEPTION", "message": str(e), "status": "EXCEPTION"},
        }


# ─── Генерация через Imagen (predict) ─────────────────────────

def _generate_image_imagen(
    api_key: str,
    model_id: str,
    prompt: str,
    proxy_url: Optional[str] = None,
) -> dict:
    """
    Генерация изображения через Imagen predict endpoint.
    Возвращает bytesBase64Encoded в predictions.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:predict?key={api_key}"

    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "1:1",
        },
    }

    proxies = None
    if proxy_url:
        proxies = {"http": proxy_url, "https": proxy_url}

    start = time.time()
    try:
        resp = requests.post(url, json=payload, timeout=120, proxies=proxies)
        elapsed = round((time.time() - start) * 1000)
        response_json = resp.json()

        if resp.status_code == 200:
            predictions = response_json.get("predictions", [])
            if predictions:
                image_data = predictions[0].get("bytesBase64Encoded")
                image_mime = predictions[0].get("mimeType", "image/png")
                if image_data:
                    return {
                        "success": True,
                        "http_status": resp.status_code,
                        "elapsed_ms": elapsed,
                        "image_base64": image_data,
                        "image_mime": image_mime,
                        "response_text": f"Imagen: 1 изображение сгенерировано",
                        "error": None,
                    }

            return {
                "success": False, "http_status": resp.status_code, "elapsed_ms": elapsed,
                "image_base64": None, "image_mime": None,
                "response_text": "Пустой массив predictions",
                "error": {"code": "NO_IMAGE", "message": "predict вернул пустой predictions", "status": "NO_IMAGE"},
            }
        else:
            error_info = response_json.get("error", {})
            return {
                "success": False, "http_status": resp.status_code, "elapsed_ms": elapsed,
                "image_base64": None, "image_mime": None, "response_text": None,
                "error": {
                    "code": error_info.get("code"),
                    "message": error_info.get("message", str(response_json)),
                    "status": error_info.get("status"),
                },
            }

    except requests.exceptions.Timeout:
        elapsed = round((time.time() - start) * 1000)
        return {
            "success": False, "http_status": None, "elapsed_ms": elapsed,
            "image_base64": None, "image_mime": None, "response_text": None,
            "error": {"code": "TIMEOUT", "message": "Таймаут (120с)", "status": "TIMEOUT"},
        }
    except Exception as e:
        elapsed = round((time.time() - start) * 1000)
        return {
            "success": False, "http_status": None, "elapsed_ms": elapsed,
            "image_base64": None, "image_mime": None, "response_text": None,
            "error": {"code": "EXCEPTION", "message": str(e), "status": "EXCEPTION"},
        }


# ─── Основные функции ─────────────────────────────────────────

def generate_image(
    api_key: str,
    model_id: str,
    prompt: str,
    proxy_url: Optional[str] = None,
) -> dict:
    """
    Генерирует изображение через указанную модель.
    Определяет метод (gemini / imagen) из конфигурации.
    """
    model_config = None
    for m in IMAGE_MODELS:
        if m["model_id"] == model_id:
            model_config = m
            break

    if not model_config:
        return {
            "display_name": model_id,
            "model_id": model_id,
            "method": "unknown",
            "description": "",
            "result": {
                "success": False, "http_status": None, "elapsed_ms": 0,
                "image_base64": None, "image_mime": None, "response_text": None,
                "error": {"code": "NOT_FOUND", "message": f"Модель {model_id} не в конфигурации", "status": "NOT_FOUND"},
            },
        }

    method = model_config["method"]

    if method == "gemini":
        result = _generate_image_gemini(api_key, model_id, prompt, proxy_url)
    elif method == "imagen":
        result = _generate_image_imagen(api_key, model_id, prompt, proxy_url)
    else:
        result = {
            "success": False, "http_status": None, "elapsed_ms": 0,
            "image_base64": None, "image_mime": None, "response_text": None,
            "error": {"code": "UNSUPPORTED", "message": f"Неизвестный метод: {method}", "status": "UNSUPPORTED"},
        }

    return {
        "display_name": model_config["display_name"],
        "model_id": model_id,
        "method": method,
        "description": model_config.get("description", ""),
        "result": result,
    }


def get_image_models() -> list:
    """Список моделей для фронтенда."""
    return [
        {
            "display_name": m["display_name"],
            "model_id": m["model_id"],
            "method": m["method"],
            "description": m.get("description", ""),
        }
        for m in IMAGE_MODELS
    ]
