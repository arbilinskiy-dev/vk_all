
from sqlalchemy.orm import Session
from fastapi import HTTPException
import time

import crud
import schemas
import models
from . import vk_service
from .post_helpers import get_rounded_timestamp

def create_market_album(db: Session, project_id: str, title: str, user_token: str) -> schemas.MarketAlbum:
    """
    Создает новую подборку товаров в VK и сохраняет её в локальную БД.
    """
    project = crud.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    try:
        numeric_group_id = vk_service.resolve_vk_group_id(project.vkProjectId, user_token)
        owner_id = -numeric_group_id
        
        # 1. Создаем подборку в VK (используем токены админов группы)
        vk_response = vk_service.call_vk_api_for_group('market.addAlbum', {
            'owner_id': owner_id,
            'title': title,
            'access_token': user_token
        }, group_id=numeric_group_id)
        
        market_album_id = vk_response.get('market_album_id')
        if not market_album_id:
             raise Exception("VK API did not return market_album_id.")
        
        print(f"SERVICE: Created market album '{title}' (id: {market_album_id}) in VK.")
        
        # 2. Создаем запись в локальной БД
        timestamp = get_rounded_timestamp()
        new_db_album = models.MarketAlbum(
            id=f"-{abs(owner_id)}_{market_album_id}", # составной ID: -ownerId_albumId
            project_id=project_id,
            title=title,
            count=0,
            updated_time=int(time.time()),
            last_updated=timestamp
        )
        
        created_album = crud.create_market_album(db, new_db_album)
        return schemas.MarketAlbum.model_validate(created_album, from_attributes=True)
        
    except vk_service.VkApiError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"SERVICE ERROR: Failed to create market album: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def edit_market_album(db: Session, project_id: str, album_id: int, title: str, user_token: str) -> schemas.MarketAlbum:
    """
    Редактирует название подборки товаров в VK и обновляет в локальной БД.
    """
    project = crud.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    try:
        numeric_group_id = vk_service.resolve_vk_group_id(project.vkProjectId, user_token)
        owner_id = -numeric_group_id

        # 1. Редактируем подборку в VK (используем токены админов группы)
        vk_service.call_vk_api_for_group('market.editAlbum', {
            'owner_id': owner_id,
            'album_id': album_id,
            'title': title,
            'access_token': user_token
        }, group_id=numeric_group_id)

        print(f"SERVICE: Edited market album {album_id}, new title: '{title}' in VK.")

        # 2. Обновляем запись в локальной БД
        album_pk = f"-{abs(owner_id)}_{album_id}"
        updated_album = crud.update_market_album_title(db, album_pk, title)
        if not updated_album:
            raise Exception(f"Album {album_pk} not found in local DB.")

        return schemas.MarketAlbum.model_validate(updated_album, from_attributes=True)

    except vk_service.VkApiError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"SERVICE ERROR: Failed to edit market album: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def delete_market_album(db: Session, project_id: str, album_id: int, user_token: str):
    """
    Удаляет подборку товаров из VK и из локальной БД.
    """
    project = crud.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    try:
        numeric_group_id = vk_service.resolve_vk_group_id(project.vkProjectId, user_token)
        owner_id = -numeric_group_id

        # 1. Удаляем подборку в VK (используем токены админов группы)
        vk_service.call_vk_api_for_group('market.deleteAlbum', {
            'owner_id': owner_id,
            'album_id': album_id,
            'access_token': user_token
        }, group_id=numeric_group_id)

        print(f"SERVICE: Deleted market album {album_id} from VK.")

        # 2. Удаляем запись из локальной БД
        album_pk = f"-{abs(owner_id)}_{album_id}"
        crud.delete_market_album(db, album_pk)

    except vk_service.VkApiError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"SERVICE ERROR: Failed to delete market album: {e}")
        raise HTTPException(status_code=500, detail=str(e))
