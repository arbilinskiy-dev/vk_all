"""
Тест 4: Проверка доступности моделей Google AI (Gemini / Imagen / Gemma).

Полностью изолированный сервис песочницы.
Тестирует доступность каждой модели путём отправки минимального запроса
к Google Generative AI API (v1beta / v1).

Для текстовых моделей — генерация минимального промпта.
Для Imagen — попытка генерации изображения.
Для Embedding — попытка получения эмбеддинга.
Для TTS / Live API / Robotics — только проверка наличия модели через models.get.
"""

import time
import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Конфигурация моделей ────────────────────────────────

# Маппинг отображаемого имени → ID модели в Google AI API
# Актуальные model_id получены из ListModels API (февраль 2026)
GEMINI_MODELS = [
    # ═══ Gemini — Текстовая генерация (flagship) ═══
    {
        "display_name": "Gemini 2.5 Pro (stable)",
        "model_id": "gemini-2.5-pro",
        "category": "Gemini — Flagship",
        "test_type": "generate",
    },
    {
        "display_name": "Gemini 2.5 Flash (stable)",
        "model_id": "gemini-2.5-flash",
        "category": "Gemini — Flagship",
        "test_type": "generate",
    },
    {
        "display_name": "Gemini 2.5 Flash-Lite (stable)",
        "model_id": "gemini-2.5-flash-lite",
        "category": "Gemini — Flagship",
        "test_type": "generate",
    },
    {
        "display_name": "Gemini 2.0 Flash",
        "model_id": "gemini-2.0-flash",
        "category": "Gemini — Flagship",
        "test_type": "generate",
    },
    {
        "display_name": "Gemini 2.0 Flash-Lite",
        "model_id": "gemini-2.0-flash-lite",
        "category": "Gemini — Flagship",
        "test_type": "generate",
    },

    # ═══ Gemini 3 — Preview ═══
    {
        "display_name": "Gemini 3 Pro Preview",
        "model_id": "gemini-3-pro-preview",
        "category": "Gemini 3 — Preview",
        "test_type": "generate",
    },
    {
        "display_name": "Gemini 3 Flash Preview",
        "model_id": "gemini-3-flash-preview",
        "category": "Gemini 3 — Preview",
        "test_type": "generate",
    },

    # ═══ Gemini 2.5 — Preview (свежие) ═══
    {
        "display_name": "Gemini 2.5 Flash Preview Sep 2025",
        "model_id": "gemini-2.5-flash-preview-09-2025",
        "category": "Gemini 2.5 — Previews",
        "test_type": "generate",
    },
    {
        "display_name": "Gemini 2.5 Flash-Lite Preview Sep 2025",
        "model_id": "gemini-2.5-flash-lite-preview-09-2025",
        "category": "Gemini 2.5 — Previews",
        "test_type": "generate",
    },
    {
        "display_name": "Gemini Experimental 1206 (→ 2.5 Pro)",
        "model_id": "gemini-exp-1206",
        "category": "Gemini 2.5 — Previews",
        "test_type": "generate",
    },

    # ═══ Мультимодальные генеративные ═══
    {
        "display_name": "Nano Banana (Gemini 2.5 Flash Image)",
        "model_id": "gemini-2.5-flash-image",
        "category": "Image Generation",
        "test_type": "generate",
    },
    {
        "display_name": "Nano Banana Pro (Gemini 3 Pro Image)",
        "model_id": "gemini-3-pro-image-preview",
        "category": "Image Generation",
        "test_type": "generate",
    },
    {
        "display_name": "Imagen 4 (Preview)",
        "model_id": "imagen-4.0-generate-preview-06-06",
        "category": "Image Generation",
        "test_type": "imagen",
    },
    {
        "display_name": "Imagen 4 (Stable)",
        "model_id": "imagen-4.0-generate-001",
        "category": "Image Generation",
        "test_type": "imagen",
    },
    {
        "display_name": "Imagen 4 Ultra (Preview)",
        "model_id": "imagen-4.0-ultra-generate-preview-06-06",
        "category": "Image Generation",
        "test_type": "imagen",
    },
    {
        "display_name": "Imagen 4 Ultra (Stable)",
        "model_id": "imagen-4.0-ultra-generate-001",
        "category": "Image Generation",
        "test_type": "imagen",
    },
    {
        "display_name": "Imagen 4 Fast (Stable)",
        "model_id": "imagen-4.0-fast-generate-001",
        "category": "Image Generation",
        "test_type": "imagen",
    },

    # ═══ Видео генерация (Veo) ═══
    {
        "display_name": "Veo 2",
        "model_id": "veo-2.0-generate-001",
        "category": "Video Generation",
        "test_type": "model_info",
    },
    {
        "display_name": "Veo 3",
        "model_id": "veo-3.0-generate-001",
        "category": "Video Generation",
        "test_type": "model_info",
    },
    {
        "display_name": "Veo 3 Fast",
        "model_id": "veo-3.0-fast-generate-001",
        "category": "Video Generation",
        "test_type": "model_info",
    },
    {
        "display_name": "Veo 3.1 (Preview)",
        "model_id": "veo-3.1-generate-preview",
        "category": "Video Generation",
        "test_type": "model_info",
    },
    {
        "display_name": "Veo 3.1 Fast (Preview)",
        "model_id": "veo-3.1-fast-generate-preview",
        "category": "Video Generation",
        "test_type": "model_info",
    },

    # ═══ Аудио / TTS ═══
    {
        "display_name": "Gemini 2.5 Flash TTS",
        "model_id": "gemini-2.5-flash-preview-tts",
        "category": "Audio / TTS",
        "test_type": "model_info",
    },
    {
        "display_name": "Gemini 2.5 Pro TTS",
        "model_id": "gemini-2.5-pro-preview-tts",
        "category": "Audio / TTS",
        "test_type": "model_info",
    },
    {
        "display_name": "Gemini 2.5 Flash Native Audio (Latest)",
        "model_id": "gemini-2.5-flash-native-audio-latest",
        "category": "Audio / TTS",
        "test_type": "model_info",
    },

    # ═══ Agents / Deep Research ═══
    {
        "display_name": "Deep Research Pro Preview (Dec 2025)",
        "model_id": "deep-research-pro-preview-12-2025",
        "category": "Agents",
        "test_type": "model_info",
    },

    # ═══ Специализированные ═══
    {
        "display_name": "Gemini Robotics-ER 1.5 Preview",
        "model_id": "gemini-robotics-er-1.5-preview",
        "category": "Specialized",
        "test_type": "model_info",
    },
    {
        "display_name": "Gemini 2.5 Computer Use Preview",
        "model_id": "gemini-2.5-computer-use-preview-10-2025",
        "category": "Specialized",
        "test_type": "model_info",
    },

    # ═══ Gemma (открытые малые модели) ═══
    {
        "display_name": "Gemma 3 1B",
        "model_id": "gemma-3-1b-it",
        "category": "Gemma (Open)",
        "test_type": "generate",
    },
    {
        "display_name": "Gemma 3 4B",
        "model_id": "gemma-3-4b-it",
        "category": "Gemma (Open)",
        "test_type": "generate",
    },
    {
        "display_name": "Gemma 3 12B",
        "model_id": "gemma-3-12b-it",
        "category": "Gemma (Open)",
        "test_type": "generate",
    },
    {
        "display_name": "Gemma 3 27B",
        "model_id": "gemma-3-27b-it",
        "category": "Gemma (Open)",
        "test_type": "generate",
    },
    {
        "display_name": "Gemma 3n E4B",
        "model_id": "gemma-3n-e4b-it",
        "category": "Gemma (Open)",
        "test_type": "generate",
    },
    {
        "display_name": "Gemma 3n E2B",
        "model_id": "gemma-3n-e2b-it",
        "category": "Gemma (Open)",
        "test_type": "generate",
    },

    # ═══ Embedding ═══
    {
        "display_name": "Gemini Embedding 001",
        "model_id": "gemini-embedding-001",
        "category": "Embedding",
        "test_type": "embed",
    },

    # ═══ AQA (вопрос-ответ) ═══
    {
        "display_name": "AQA (Attributed QA)",
        "model_id": "aqa",
        "category": "Specialized",
        "test_type": "model_info",
    },
]


# ─── Вспомогательные функции ─────────────────────────────

def _test_generate(api_key: str, model_id: str, proxy_url: Optional[str] = None) -> dict:
    """
    Тестирует текстовую генерацию через generateContent.
    Отправляет минимальный промпт: "Say OK".
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={api_key}"

    payload = {
        "contents": [
            {
                "parts": [{"text": "Say OK"}]
            }
        ],
        "generationConfig": {
            "maxOutputTokens": 10,
        }
    }

    proxies = None
    if proxy_url:
        proxies = {"http": proxy_url, "https": proxy_url}

    start = time.time()
    try:
        resp = requests.post(url, json=payload, timeout=30, proxies=proxies)
        elapsed = round((time.time() - start) * 1000)

        response_json = resp.json()

        if resp.status_code == 200:
            # Извлекаем текст ответа
            candidates = response_json.get("candidates", [])
            text = ""
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    text = parts[0].get("text", "")

            return {
                "success": True,
                "http_status": resp.status_code,
                "elapsed_ms": elapsed,
                "response_text": text.strip(),
                "error": None,
                "raw_response": response_json,
            }
        else:
            error_info = response_json.get("error", {})
            return {
                "success": False,
                "http_status": resp.status_code,
                "elapsed_ms": elapsed,
                "response_text": None,
                "error": {
                    "code": error_info.get("code"),
                    "message": error_info.get("message", str(response_json)),
                    "status": error_info.get("status"),
                },
                "raw_response": response_json,
            }

    except requests.exceptions.Timeout:
        elapsed = round((time.time() - start) * 1000)
        return {
            "success": False,
            "http_status": None,
            "elapsed_ms": elapsed,
            "response_text": None,
            "error": {"code": "TIMEOUT", "message": "Запрос превысил таймаут (30с)", "status": "TIMEOUT"},
            "raw_response": None,
        }
    except Exception as e:
        elapsed = round((time.time() - start) * 1000)
        return {
            "success": False,
            "http_status": None,
            "elapsed_ms": elapsed,
            "response_text": None,
            "error": {"code": "EXCEPTION", "message": str(e), "status": "EXCEPTION"},
            "raw_response": None,
        }


def _test_model_info(api_key: str, model_id: str, proxy_url: Optional[str] = None) -> dict:
    """
    Проверяет доступность модели через GET models/{model_id}.
    Для моделей, которые нельзя вызвать напрямую (TTS, Live API, Robotics, etc.).
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}?key={api_key}"

    proxies = None
    if proxy_url:
        proxies = {"http": proxy_url, "https": proxy_url}

    start = time.time()
    try:
        resp = requests.get(url, timeout=15, proxies=proxies)
        elapsed = round((time.time() - start) * 1000)

        response_json = resp.json()

        if resp.status_code == 200:
            return {
                "success": True,
                "http_status": resp.status_code,
                "elapsed_ms": elapsed,
                "response_text": f"Model found: {response_json.get('displayName', model_id)}",
                "error": None,
                "raw_response": {
                    "name": response_json.get("name"),
                    "displayName": response_json.get("displayName"),
                    "description": response_json.get("description", "")[:200],
                    "inputTokenLimit": response_json.get("inputTokenLimit"),
                    "outputTokenLimit": response_json.get("outputTokenLimit"),
                    "supportedGenerationMethods": response_json.get("supportedGenerationMethods", []),
                },
            }
        else:
            error_info = response_json.get("error", {})
            return {
                "success": False,
                "http_status": resp.status_code,
                "elapsed_ms": elapsed,
                "response_text": None,
                "error": {
                    "code": error_info.get("code"),
                    "message": error_info.get("message", str(response_json)),
                    "status": error_info.get("status"),
                },
                "raw_response": response_json,
            }

    except requests.exceptions.Timeout:
        elapsed = round((time.time() - start) * 1000)
        return {
            "success": False,
            "http_status": None,
            "elapsed_ms": elapsed,
            "response_text": None,
            "error": {"code": "TIMEOUT", "message": "Запрос превысил таймаут (15с)", "status": "TIMEOUT"},
            "raw_response": None,
        }
    except Exception as e:
        elapsed = round((time.time() - start) * 1000)
        return {
            "success": False,
            "http_status": None,
            "elapsed_ms": elapsed,
            "response_text": None,
            "error": {"code": "EXCEPTION", "message": str(e), "status": "EXCEPTION"},
            "raw_response": None,
        }


def _test_embed(api_key: str, model_id: str, proxy_url: Optional[str] = None) -> dict:
    """
    Тестирует модель эмбеддингов через embedContent.
    """
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:embedContent?key={api_key}"

    payload = {
        "content": {
            "parts": [{"text": "Hello world"}]
        }
    }

    proxies = None
    if proxy_url:
        proxies = {"http": proxy_url, "https": proxy_url}

    start = time.time()
    try:
        resp = requests.post(url, json=payload, timeout=30, proxies=proxies)
        elapsed = round((time.time() - start) * 1000)

        response_json = resp.json()

        if resp.status_code == 200:
            embedding = response_json.get("embedding", {})
            values = embedding.get("values", [])
            return {
                "success": True,
                "http_status": resp.status_code,
                "elapsed_ms": elapsed,
                "response_text": f"Embedding OK — {len(values)} dimensions",
                "error": None,
                "raw_response": {"embedding_dimensions": len(values), "first_5_values": values[:5]},
            }
        else:
            error_info = response_json.get("error", {})
            return {
                "success": False,
                "http_status": resp.status_code,
                "elapsed_ms": elapsed,
                "response_text": None,
                "error": {
                    "code": error_info.get("code"),
                    "message": error_info.get("message", str(response_json)),
                    "status": error_info.get("status"),
                },
                "raw_response": response_json,
            }

    except requests.exceptions.Timeout:
        elapsed = round((time.time() - start) * 1000)
        return {
            "success": False,
            "http_status": None,
            "elapsed_ms": elapsed,
            "response_text": None,
            "error": {"code": "TIMEOUT", "message": "Запрос превысил таймаут (30с)", "status": "TIMEOUT"},
            "raw_response": None,
        }
    except Exception as e:
        elapsed = round((time.time() - start) * 1000)
        return {
            "success": False,
            "http_status": None,
            "elapsed_ms": elapsed,
            "response_text": None,
            "error": {"code": "EXCEPTION", "message": str(e), "status": "EXCEPTION"},
            "raw_response": None,
        }


def _test_imagen(api_key: str, model_id: str, proxy_url: Optional[str] = None) -> dict:
    """
    Тестирует Imagen модели через predict (генерация 1 изображения минимального размера).
    Если predict не поддерживается — fallback на model_info.
    """
    # Пробуем через generateImages (v1beta Imagen API)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:predict?key={api_key}"

    payload = {
        "instances": [
            {"prompt": "A red circle on white background"}
        ],
        "parameters": {
            "sampleCount": 1,
        }
    }

    proxies = None
    if proxy_url:
        proxies = {"http": proxy_url, "https": proxy_url}

    start = time.time()
    try:
        resp = requests.post(url, json=payload, timeout=60, proxies=proxies)
        elapsed = round((time.time() - start) * 1000)

        response_json = resp.json()

        if resp.status_code == 200:
            predictions = response_json.get("predictions", [])
            return {
                "success": True,
                "http_status": resp.status_code,
                "elapsed_ms": elapsed,
                "response_text": f"Imagen OK — {len(predictions)} image(s) generated",
                "error": None,
                "raw_response": {"predictions_count": len(predictions)},
            }
        else:
            error_info = response_json.get("error", {})
            error_msg = error_info.get("message", str(response_json))

            # Если predict не поддерживается — пробуем model_info
            if resp.status_code in [400, 404, 405]:
                logger.info(f"[Sandbox] Imagen predict не поддерживается для {model_id}, пробуем model_info")
                fallback = _test_model_info(api_key, model_id, proxy_url)
                if fallback["success"]:
                    fallback["response_text"] = f"Модель найдена (predict недоступен): {fallback['response_text']}"
                return fallback

            return {
                "success": False,
                "http_status": resp.status_code,
                "elapsed_ms": elapsed,
                "response_text": None,
                "error": {
                    "code": error_info.get("code"),
                    "message": error_msg,
                    "status": error_info.get("status"),
                },
                "raw_response": response_json,
            }

    except requests.exceptions.Timeout:
        elapsed = round((time.time() - start) * 1000)
        return {
            "success": False,
            "http_status": None,
            "elapsed_ms": elapsed,
            "response_text": None,
            "error": {"code": "TIMEOUT", "message": "Запрос превысил таймаут (60с)", "status": "TIMEOUT"},
            "raw_response": None,
        }
    except Exception as e:
        elapsed = round((time.time() - start) * 1000)
        return {
            "success": False,
            "http_status": None,
            "elapsed_ms": elapsed,
            "response_text": None,
            "error": {"code": "EXCEPTION", "message": str(e), "status": "EXCEPTION"},
            "raw_response": None,
        }


# ─── Основные функции тестирования ───────────────────────

def test_single_model(api_key: str, model_id: str, proxy_url: Optional[str] = None) -> dict:
    """
    Тестирует одну модель.
    Определяет тип теста из конфигурации GEMINI_MODELS.
    """
    # Находим конфигурацию модели
    model_config = None
    for m in GEMINI_MODELS:
        if m["model_id"] == model_id:
            model_config = m
            break

    if not model_config:
        return {
            "display_name": model_id,
            "model_id": model_id,
            "category": "Unknown",
            "test_type": "unknown",
            "result": {
                "success": False,
                "http_status": None,
                "elapsed_ms": 0,
                "response_text": None,
                "error": {"code": "NOT_FOUND", "message": f"Модель {model_id} не найдена в конфигурации", "status": "NOT_FOUND"},
                "raw_response": None,
            }
        }

    test_type = model_config["test_type"]

    # Выбираем функцию тестирования
    if test_type == "generate":
        result = _test_generate(api_key, model_id, proxy_url)
    elif test_type == "embed":
        result = _test_embed(api_key, model_id, proxy_url)
    elif test_type == "imagen":
        result = _test_imagen(api_key, model_id, proxy_url)
    elif test_type == "model_info":
        result = _test_model_info(api_key, model_id, proxy_url)
    else:
        result = _test_model_info(api_key, model_id, proxy_url)

    return {
        "display_name": model_config["display_name"],
        "model_id": model_id,
        "category": model_config["category"],
        "test_type": test_type,
        "result": result,
    }


def test_all_models(api_key: str, proxy_url: Optional[str] = None) -> dict:
    """
    Тестирует все модели из GEMINI_MODELS последовательно.
    Возвращает сводку + детальные результаты по каждой модели.
    """
    results = []
    total = len(GEMINI_MODELS)
    success_count = 0
    fail_count = 0
    total_elapsed = 0

    for model_config in GEMINI_MODELS:
        model_id = model_config["model_id"]
        logger.info(f"[Sandbox] Тестируем модель: {model_config['display_name']} ({model_id})")

        result = test_single_model(api_key, model_id, proxy_url)
        results.append(result)

        if result["result"]["success"]:
            success_count += 1
        else:
            fail_count += 1

        total_elapsed += result["result"].get("elapsed_ms", 0)

    return {
        "total_models": total,
        "success_count": success_count,
        "fail_count": fail_count,
        "total_elapsed_ms": total_elapsed,
        "results": results,
    }


def get_available_models() -> list:
    """
    Возвращает список всех моделей для отображения на фронтенде.
    """
    return [
        {
            "display_name": m["display_name"],
            "model_id": m["model_id"],
            "category": m["category"],
            "test_type": m["test_type"],
        }
        for m in GEMINI_MODELS
    ]
