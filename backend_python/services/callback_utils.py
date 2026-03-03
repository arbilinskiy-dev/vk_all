"""
Утилиты для обнаружения сетевых туннелей (ngrok, SSH).

Используются при настройке Callback API в локальном режиме разработки.
"""

import logging
from typing import Optional

import requests

from services.callback_constants import NGROK_API_URL, VM_TUNNEL_CALLBACK_URL

logger = logging.getLogger("callback_setup")


def detect_ngrok_url() -> Optional[str]:
    """
    Определяет публичный HTTPS URL ngrok-туннеля, обращаясь к локальному API ngrok.
    
    Ngrok предоставляет REST API на http://127.0.0.1:4040/api/tunnels,
    который возвращает список активных туннелей.
    
    Returns:
        HTTPS URL ngrok-туннеля или None, если ngrok не запущен / нет https-туннеля.
    """
    try:
        resp = requests.get(NGROK_API_URL, timeout=3)
        resp.raise_for_status()
        data = resp.json()
        tunnels = data.get("tunnels", [])
        
        # Ищем https-туннель
        for tunnel in tunnels:
            public_url = tunnel.get("public_url", "")
            if public_url.startswith("https://"):
                logger.info(f"Обнаружен ngrok-туннель: {public_url}")
                return public_url
        
        # Если https нет, берём любой туннель
        if tunnels:
            url = tunnels[0].get("public_url", "")
            logger.info(f"Обнаружен ngrok-туннель (без https): {url}")
            return url
        
        logger.warning("Ngrok запущен, но активных туннелей нет")
        return None
        
    except requests.exceptions.ConnectionError:
        logger.info("Ngrok не запущен (не удалось подключиться к 127.0.0.1:4040)")
        return None
    except Exception as e:
        logger.warning(f"Ошибка при определении ngrok URL: {e}")
        return None


def detect_ssh_tunnel() -> bool:
    """
    Проверяет, работает ли SSH reverse tunnel на VM.
    Делает тестовый HTTP-запрос к VM_TUNNEL_CALLBACK_URL.
    
    Returns:
        True если туннель активен (VM может достучаться до локалки через порт 8001)
    """
    try:
        import requests as _req
        # Шлём тестовый GET — если бэкенд локальный жив, получим 405 (Method Not Allowed)
        # Если туннель не работает — получим 502 Bad Gateway от nginx
        resp = _req.get(VM_TUNNEL_CALLBACK_URL, timeout=5)
        # 405 = бэкенд отвечает (callback только POST), значит туннель работает
        if resp.status_code in (200, 405):
            logger.info(f"SSH tunnel активен: {VM_TUNNEL_CALLBACK_URL} → status={resp.status_code}")
            return True
        logger.warning(f"SSH tunnel: неожиданный статус {resp.status_code}")
        return False
    except Exception as e:
        logger.info(f"SSH tunnel не обнаружен: {e}")
        return False
