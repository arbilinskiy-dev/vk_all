"""
VK API операции для unified stories: загрузка активных историй, rescue превью.
"""
from sqlalchemy.orm import Session
from models_library.projects import Project
from services import vk_service
import requests
import json

from .retrieval_helpers import get_story_preview


def _fetch_active_stories_from_vk(db: Session, project_id: str) -> tuple[dict, int | None]:
    """
    Получает активные истории из VK API.
    Возвращает (карта story_id → story_data, group_id).
    """
    from config import settings as app_settings
    user_token = app_settings.vk_user_token
    
    project = db.query(Project).filter(Project.id == project_id).first()
    
    # Собираем ВСЕ токены сообщества (основной + дополнительные)
    community_tokens = []
    if project and project.communityToken:
        community_tokens.append(project.communityToken)
    if project and project.additional_community_tokens:
        try:
            extras = json.loads(project.additional_community_tokens)
            if isinstance(extras, list):
                community_tokens.extend([t for t in extras if t])
        except:
            pass
    
    group_id = None
    if project and project.vkProjectId:
        try:
            group_id = vk_service.resolve_vk_group_id(project.vkProjectId, user_token)
        except:
            pass
    
    active_stories_map = {}
    if group_id:
        try:
            active_stories = vk_service.get_active_stories(
                group_id, 
                user_token,
                community_tokens=community_tokens if community_tokens else None
            )
            if active_stories:
                for s in active_stories:
                    if s.get('id'):
                        active_stories_map[int(s.get('id'))] = s
        except Exception as e:
            print(f"STORIES_AUTO: Failed to fetch active stories: {e}")
    
    return active_stories_map, group_id


def _rescue_missing_previews(group_id: int, log_map: dict, active_stories_map: dict, logs_to_update: list):
    """
    [RESCUE] Восстанавливает превью для архивных ручных историй через stories.getById.
    """
    try:
        from config import settings as app_settings
        user_token = app_settings.vk_user_token
        
        rescue_ids = []
        rescue_map = {} 
        
        for s_id, l in log_map.items():
            # Ручная история (vk_post_id=0 или None), без превью, не активная
            if s_id not in active_stories_map and (not l.vk_post_id) and not l.image_url:
                rescue_ids.append(f"-{group_id}_{s_id}")
                rescue_map[s_id] = l
        
        if rescue_ids:
            chunk_size = 70 
            for i in range(0, len(rescue_ids), chunk_size):
                chunk = rescue_ids[i:i + chunk_size]
                resp = requests.post("https://api.vk.com/method/stories.getById", data={
                    "stories": ",".join(chunk),
                    "access_token": user_token,
                    "v": "5.131",
                    "extended": 1
                }).json()
                
                if 'response' in resp and 'items' in resp['response']:
                    for item in resp['response']['items']:
                        s_id_remote = item.get('id')
                        if s_id_remote in rescue_map:
                            prev = get_story_preview(item)
                            if prev:
                                l_obj = rescue_map[s_id_remote]
                                l_obj.image_url = prev
                                if l_obj.log:
                                    try:
                                        ld = json.loads(l_obj.log)
                                        ld['image_url'] = prev
                                        l_obj.log = json.dumps(ld)
                                    except:
                                        pass
                                if l_obj not in logs_to_update:
                                    logs_to_update.append(l_obj)
    except Exception as e:
        print(f"STORIES RESCUE FAILED: {e}")
