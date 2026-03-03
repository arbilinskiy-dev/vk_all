"""
VK API клиент для получения статистики историй.

Воркер с ротацией токенов и fallback при ошибках.
"""
import requests
import time
from typing import List

from services.automations.stories.stats_utils import (
    StoryStatsData,
    REQUEST_TIMEOUT,
)


def _fetch_story_stats(
    owner_id: str,
    story_id: str,
    tokens: List[str],
    story_index: int
) -> StoryStatsData:
    """
    Воркер: получает статистику одной истории.
    Использует ротацию токенов при ошибках.
    """
    if not tokens:
        return StoryStatsData(
            owner_id=owner_id,
            story_id=story_id,
            stats=None,
            success=False,
            error="No tokens available"
        )
    
    # Round-robin: начинаем с токена по индексу истории
    num_tokens = len(tokens)
    primary_index = story_index % num_tokens
    rotation_order = tokens[primary_index:] + tokens[:primary_index]
    
    last_error = None
    
    for token in rotation_order:
        try:
            resp = requests.post(
                "https://api.vk.com/method/stories.getStats",
                data={
                    "owner_id": owner_id,
                    "story_id": story_id,
                    "access_token": token,
                    "v": "5.131"
                },
                timeout=REQUEST_TIMEOUT
            )
            
            result = resp.json()
            
            if 'error' in result:
                error_code = result['error'].get('error_code', 0)
                error_msg = result['error'].get('error_msg', 'Unknown error')
                last_error = f"VK Error {error_code}: {error_msg}"
                
                # Error 15 (non-standalone) - пробуем следующий токен
                if error_code == 15:
                    time.sleep(0.1)
                    continue
                
                # Другие permanent errors
                if error_code in [5, 204, 212]:
                    return StoryStatsData(
                        owner_id=owner_id,
                        story_id=story_id,
                        stats=None,
                        success=False,
                        error=last_error
                    )
                
                # Временные ошибки - пробуем следующий токен
                time.sleep(0.1)
                continue
            
            if 'response' in result:
                return StoryStatsData(
                    owner_id=owner_id,
                    story_id=story_id,
                    stats=result['response'],
                    success=True
                )
                
        except Exception as e:
            last_error = str(e)
            time.sleep(0.1)
            continue
    
    return StoryStatsData(
        owner_id=owner_id,
        story_id=story_id,
        stats=None,
        success=False,
        error=last_error or "All tokens failed"
    )
