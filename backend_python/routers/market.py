
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json

import schemas
import services.market_service as market_service
from database import get_db
from config import settings
from services.auth_middleware import get_current_user, CurrentUser
from services.action_tracker import track

router = APIRouter()

@router.post("/getData", response_model=schemas.MarketDataResponse)
def get_data(payload: schemas.ProjectIdPayload, db: Session = Depends(get_db)):
    """
    Получает данные о товарах для проекта.
    Сначала проверяет свежесть кеша в БД. Если кеш свежий, возвращает его.
    Иначе, запускает полное обновление из VK.
    """
    return market_service.get_market_data(db, payload.projectId, settings.vk_user_token)

@router.post("/refreshAll", response_model=schemas.MarketDataResponse)
def refresh_all(payload: schemas.ProjectIdPayload, db: Session = Depends(get_db)):
    """Принудительно обновляет все данные о товарах из VK."""
    return market_service.refresh_all_market_data(db, payload.projectId, settings.vk_user_token)

@router.post("/getCategories", response_model=List[schemas.MarketCategory])
def get_categories(db: Session = Depends(get_db)):
    """Получает глобальный список категорий товаров."""
    return market_service.get_market_categories(db, settings.vk_user_token)

@router.post("/refreshCategories", response_model=schemas.GenericSuccess)
def refresh_categories(db: Session = Depends(get_db)):
    """Принудительно обновляет глобальный список категорий товаров из VK."""
    market_service.force_refresh_market_categories(db, settings.vk_user_token)
    return {"success": True}

@router.post("/createAlbum", response_model=schemas.MarketAlbum)
def create_album(payload: schemas.CreateAlbumPayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """Создает новую подборку товаров."""
    result = market_service.create_market_album(db, payload.projectId, payload.title, settings.vk_user_token)
    track(db, current_user, "market_create_album", "market",
          entity_type="album", project_id=payload.projectId)
    return result

@router.post("/editAlbum", response_model=schemas.MarketAlbum)
def edit_album(payload: schemas.EditMarketAlbumPayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """Редактирует название подборки товаров."""
    result = market_service.edit_market_album(db, payload.projectId, payload.albumId, payload.title, settings.vk_user_token)
    track(db, current_user, "market_edit_album", "market",
          entity_type="album", entity_id=str(payload.albumId),
          project_id=payload.projectId)
    return result

@router.post("/deleteAlbum", response_model=schemas.GenericSuccess)
def delete_album(payload: schemas.DeleteMarketAlbumPayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """Удаляет подборку товаров."""
    market_service.delete_market_album(db, payload.projectId, payload.albumId, settings.vk_user_token)
    track(db, current_user, "market_delete_album", "market",
          entity_type="album", entity_id=str(payload.albumId),
          project_id=payload.projectId)
    return {"success": True}

@router.post("/createItem", response_model=schemas.MarketItem)
def create_item(
    projectId: str = Form(...),
    itemData: str = Form(...),
    file: Optional[UploadFile] = File(None),
    photoUrl: Optional[str] = Form(None),
    useDefaultImage: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Создает один товар, опционально с файлом изображения или ссылкой."""
    print(f"\nROUTER [createItem]: Входящие данные:")
    print(f"  > projectId: {projectId}")
    print(f"  > itemData (raw JSON): {itemData}")
    print(f"  > photoUrl: {photoUrl}")
    print(f"  > useDefaultImage: {useDefaultImage}")
    print(f"  > file: {file.filename if file else 'None'}")
    try:
        item_pydantic = schemas.NewMarketItemPayload.model_validate_json(itemData)
        print(f"  > Parsed payload: name={item_pydantic.name}, category_id={item_pydantic.category_id}, price={item_pydantic.price}, old_price={item_pydantic.old_price}, sku={item_pydantic.sku}, album_id={item_pydantic.album_id}")
    except Exception as e:
        print(f"  > PARSE ERROR: {e}")
        raise HTTPException(status_code=422, detail=f"Invalid JSON format for itemData: {e}")
    result = market_service.create_market_item(db, projectId, item_pydantic, settings.vk_user_token, file, photoUrl, useDefaultImage)
    track(db, current_user, "market_create_item", "market",
          entity_type="market_item", project_id=projectId)
    return result

@router.post("/createItems", response_model=schemas.GenericSuccess)
def create_items(payload: schemas.CreateMarketItemsPayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """Массово создает несколько товаров (без изображений)."""
    market_service.create_market_items(db, payload.projectId, payload.items, settings.vk_user_token)
    track(db, current_user, "market_create_items", "market",
          entity_type="market_item", project_id=payload.projectId,
          metadata={"count": len(payload.items)})
    return {"success": True}

@router.post("/deleteItems", response_model=schemas.GenericSuccess)
def delete_items(payload: schemas.DeleteMarketItemsPayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """Массово удаляет один или несколько товаров."""
    market_service.delete_market_items(db, payload.projectId, payload.itemIds, settings.vk_user_token)
    track(db, current_user, "market_delete_items", "market",
          entity_type="market_item", project_id=payload.projectId,
          metadata={"count": len(payload.itemIds)})
    return {"success": True}


@router.post("/updateItem", response_model=schemas.MarketItem)
def update_item(
    projectId: str = Form(...),
    itemData: str = Form(...),
    file: Optional[UploadFile] = File(None),
    photoUrl: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Обновляет один товар.
    Можно передать новое фото либо как файл (file), либо как ссылку (photoUrl).
    """
    try:
        item_pydantic = schemas.MarketItem.model_validate_json(itemData)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid JSON format for itemData: {e}")
        
    result = market_service.update_market_item(
        db, 
        projectId, 
        item_pydantic, 
        settings.vk_user_token, 
        file, 
        photoUrl
    )
    track(db, current_user, "market_update_item", "market",
          entity_type="market_item", project_id=projectId)
    return result


@router.post("/updateItems", response_model=schemas.GenericSuccess)
def update_items(payload: schemas.UpdateMarketItemsPayload, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_user)):
    """Массово обновляет несколько товаров."""
    market_service.update_market_items(db, payload.projectId, payload.items, settings.vk_user_token)
    track(db, current_user, "market_update_items", "market",
          entity_type="market_item", project_id=payload.projectId,
          metadata={"count": len(payload.items)})
    return {"success": True}

@router.post("/uploadPhoto", response_model=schemas.MarketItem)
def upload_photo(
    file: UploadFile = File(...), 
    projectId: str = Form(...), 
    itemId: int = Form(...),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Загружает новое главное фото для товара."""
    result = market_service.upload_market_item_photo(db, projectId, itemId, file, settings.vk_user_token)
    track(db, current_user, "market_upload_photo", "market",
          entity_type="market_item", entity_id=str(itemId),
          project_id=projectId)
    return result
