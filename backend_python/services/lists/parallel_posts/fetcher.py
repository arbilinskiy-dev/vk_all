"""
Модуль скачивания постов из VK API.

Содержит функции для batch-загрузки постов через execute.
"""

from typing import List, Dict
from services.vk_api.api_client import call_vk_api as raw_vk_call


# Количество постов за один execute запрос
EXECUTE_BATCH_SIZE = 200


def fetch_posts_batch(token: str, owner_id: str, offset: int, count: int, project_id: str) -> List[Dict]:
    """
    Скачивает пачку постов через VK execute.
    
    Использует внутренний цикл VKScript для получения до 200 постов
    за один API-вызов (2 итерации по 100 постов).
    
    Args:
        token: Токен доступа VK
        owner_id: ID владельца стены (с минусом для групп)
        offset: Смещение от начала списка постов
        count: Количество постов для загрузки (макс. 200)
        project_id: ID проекта для логирования
        
    Returns:
        Список словарей с данными постов
    """
    iterations = (count + 99) // 100
    
    code = f"""
    var owner_id = {owner_id};
    var offset = {offset};
    var iterations = {iterations};
    var items = [];
    var i = 0;
    
    while (i < iterations) {{
        var resp = API.wall.get({{
            "owner_id": owner_id, 
            "count": 100, 
            "offset": offset + (i * 100),
            "extended": 1 
        }});
        if (resp.items) {{
            items = items + resp.items;
        }}
        i = i + 1;
    }}
    return items;
    """
    
    response = raw_vk_call("execute", {"code": code, "access_token": token}, project_id=project_id)
    return response if isinstance(response, list) else []
