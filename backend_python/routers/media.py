from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

import json
import asyncio
import requests as http_requests
import time

import schemas
import crud
import services.media_service as media_service
from services import vk_service
from database import get_db
from config import settings

router = APIRouter()


# === ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: Синхронная перезагрузка медиа для одного проекта ===
# Вызывается из asyncio.to_thread() для параллельного выполнения.
# Паттерн скопирован из stories_automation.py (_publish_story_for_group_sync).

def _reupload_media_for_project_sync(
    group_id: int,
    photos: list,
    video_files: list,
    user_token: str,
) -> dict:
    """
    Синхронная перезагрузка всех медиафайлов в одну целевую группу VK.
    Фото: скачиваются по URL с VK CDN → загружаются в целевую группу.
    Видео: загружаются из переданных байтов → загружаются в целевую группу.
    
    :param group_id: Числовой ID целевой группы VK
    :param photos: Список словарей [{"id": "photo-111_999", "url": "https://..."}]
    :param video_files: Список словарей [{"id": "video-111_888", "bytes": b"...", "filename": "video.mp4"}]
    :param user_token: VK user token (используется для ротации)
    :return: {"images": [PhotoAttachment...], "attachments": [Attachment...]}
    """
    result = {"images": [], "attachments": []}
    
    # --- Перезагрузка фото (скачиваем по URL → загружаем через VK API) ---
    for photo in photos:
        try:
            print(f"REUPLOAD: Скачиваю фото {photo['id']} с URL {photo['url'][:80]}...")
            resp = http_requests.get(photo["url"], timeout=30)
            resp.raise_for_status()
            photo_bytes = resp.content
            
            saved_photo = vk_service.upload_wall_photo(
                group_id=group_id,
                file_bytes=photo_bytes,
                file_name=f"reupload_{photo['id'].replace('photo', '')}.jpg",
                user_token=user_token,
            )
            
            owner_id = saved_photo.get('owner_id')
            photo_id = saved_photo.get('id')
            
            # Выбираем лучший размер для URL превью
            sizes = saved_photo.get('sizes', [])
            best_size = next((s for s in sizes if s.get('type') == 'y'), None)
            if not best_size:
                best_size = next((s for s in sizes if s.get('type') == 'x'), None)
            if not best_size and sizes:
                best_size = sorted(sizes, key=lambda s: s.get('width', 0), reverse=True)[0]
            
            photo_url = best_size.get('url', '') if best_size else ''
            
            result["images"].append({
                "id": f"photo{owner_id}_{photo_id}",
                "url": photo_url,
            })
            print(f"REUPLOAD: Фото перезагружено → photo{owner_id}_{photo_id} в группу {group_id}")
            
        except Exception as e:
            print(f"REUPLOAD ERROR: Не удалось перезагрузить фото {photo['id']} в группу {group_id}: {e}")
            raise Exception(f"Ошибка перезагрузки фото {photo['id']}: {e}")
    
    # --- Перезагрузка видео (из переданных байтов) ---
    for video in video_files:
        try:
            video_name = video["filename"].rsplit('.', 1)[0] if '.' in video["filename"] else video["filename"]
            
            print(f"REUPLOAD: Загружаю видео '{video_name}' ({len(video['bytes'])} bytes) в группу {group_id}...")
            
            video_data = vk_service.upload_video(
                group_id=group_id,
                file_bytes=video["bytes"],
                file_name=video["filename"],
                user_token=user_token,
                name=video_name,
            )
            
            owner_id = video_data.get('owner_id')
            video_id = video_data.get('video_id')
            
            result["attachments"].append({
                "id": f"video{owner_id}_{video_id}",
                "type": "video",
                "description": video_data.get('title', video_name),
                "thumbnail_url": video_data.get('thumbnail_url', ''),
                "player_url": video_data.get('player_url', ''),
            })
            print(f"REUPLOAD: Видео перезагружено → video{owner_id}_{video_id} в группу {group_id}")
            
        except Exception as e:
            print(f"REUPLOAD ERROR: Не удалось перезагрузить видео в группу {group_id}: {e}")
            raise Exception(f"Ошибка перезагрузки видео: {e}")
    
    return result


@router.post("/uploadPhoto", response_model=schemas.PhotoAttachment)
def upload_photo(
    file: UploadFile = File(...), 
    projectId: str = Form(...), 
    db: Session = Depends(get_db)
):
    """
    Загружает фото для проекта. Файл отправляется через multipart/form-data.
    Фото загружается в альбом на стене группы VK.
    """
    return media_service.upload_photo(db, projectId, file)

# === МУЛЬТИПРОЕКТНАЯ ПЕРЕЗАГРУЗКА МЕДИА ===
# Когда пользователь публикует пост в несколько проектов, медиа (фото/видео)
# было загружено только в исходную группу VK. Для каждого дополнительного проекта
# нужно перезагрузить медиа в его группу: фото — скачать по URL и загрузить,
# видео — загрузить из оригинального файла (присылает фронтенд).
# Паттерн: asyncio.gather + stagger 500ms + asyncio.to_thread (как в stories).

@router.post("/reuploadForProjects")
async def reupload_for_projects(
    target_project_ids: str = Form(...),
    photos_json: str = Form("[]"),
    video_attachment_ids: str = Form("[]"),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    """
    Перезагружает медиа (фото + видео) в целевые проекты (группы VK).
    
    Защита от таймаута контейнера: бюджет 480с (из 600с жизни контейнера).
    Каждый проект имеет индивидуальный таймаут. Если бюджет времени исчерпан —
    оставшиеся проекты попадают в список failed[] для повторной попытки.
    
    Параметры (FormData):
    - target_project_ids: JSON-массив ID проектов
    - photos_json: JSON-массив [{"id": "photo-111_999", "url": "https://..."}]
    - video_attachment_ids: JSON-массив ID видео-аттачментов (порядок = files)
    - files: Видеофайлы (порядок = video_attachment_ids)
    
    Возвращает:
    {
        "mapping": {projectId: {images: [...], attachments: [...]}},
        "failed": [{"project_id": "...", "error": "..."}]
    }
    """
    # === БЮДЖЕТ ВРЕМЕНИ ===
    # Контейнер Yandex Cloud живёт ~10 минут (600с).
    # Оставляем 2 минуты запаса на сетевые задержки и ответ.
    TIME_BUDGET_SECONDS = 480
    PER_PROJECT_MAX_TIMEOUT = 300  # Макс. 5 минут на один проект (видео может быть большим)
    MIN_REMAINING_FOR_START = 30   # Не начинать проект, если осталось < 30с
    start_time = time.time()
    
    try:
        project_ids = json.loads(target_project_ids)
        photos = json.loads(photos_json)
        video_ids = json.loads(video_attachment_ids)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Невалидный JSON: {e}")
    
    if not project_ids:
        return {"mapping": {}, "failed": []}
    
    print(f"REUPLOAD: Запрос перезагрузки медиа для {len(project_ids)} проектов "
          f"({len(photos)} фото, {len(files)} видео). Бюджет: {TIME_BUDGET_SECONDS}с")
    
    # Читаем все видеофайлы в память (один раз, шарим между потоками по ссылке)
    video_file_data = []
    for i, f in enumerate(files):
        file_bytes = await f.read()
        vid_id = video_ids[i] if i < len(video_ids) else f"video_unknown_{i}"
        video_file_data.append({
            "id": vid_id,
            "bytes": file_bytes,
            "filename": f.filename or "video.mp4",
        })
        print(f"REUPLOAD: Видео {vid_id}: {len(file_bytes)} bytes ({len(file_bytes) / 1024 / 1024:.1f}MB)")
    
    # Резолвим group_id для каждого целевого проекта
    tasks_data = []
    resolve_failed = []
    for pid in project_ids:
        project = crud.get_project_by_id(db, pid)
        if not project:
            resolve_failed.append({"project_id": pid, "error": f"Проект {pid} не найден"})
            continue
        try:
            group_id = vk_service.resolve_vk_group_id(project.vkProjectId, settings.vk_user_token)
        except Exception as e:
            resolve_failed.append({"project_id": pid, "error": f"Не удалось определить группу: {e}"})
            continue
        
        tasks_data.append({
            "project_id": pid,
            "group_id": group_id,
        })
        print(f"REUPLOAD: Проект {pid} → группа {group_id}")
    
    # Параллельная перезагрузка с бюджетом времени и таймаутом на проект.
    # asyncio.gather + stagger 500ms + asyncio.wait_for (как в stories).
    async def _reupload_with_budget(td: dict, delay_ms: int):
        # Проверяем остаток бюджета ДО начала задержки
        elapsed = time.time() - start_time
        remaining = TIME_BUDGET_SECONDS - elapsed - (delay_ms / 1000.0)
        
        if remaining < MIN_REMAINING_FOR_START:
            msg = f"Бюджет времени исчерпан (осталось {remaining:.0f}с, нужно {MIN_REMAINING_FOR_START}с)"
            print(f"REUPLOAD SKIP: Проект {td['project_id']} — {msg}")
            return {"project_id": td["project_id"], "result": None, "error": msg}
        
        if delay_ms > 0:
            await asyncio.sleep(delay_ms / 1000.0)
        
        # Пересчитываем остаток после задержки
        elapsed = time.time() - start_time
        remaining = TIME_BUDGET_SECONDS - elapsed
        per_project_timeout = min(remaining - 5, PER_PROJECT_MAX_TIMEOUT)  # -5с запас
        
        if per_project_timeout <= 10:
            msg = f"Недостаточно времени для загрузки (осталось {remaining:.0f}с)"
            print(f"REUPLOAD SKIP: Проект {td['project_id']} — {msg}")
            return {"project_id": td["project_id"], "result": None, "error": msg}
        
        try:
            print(f"REUPLOAD START: Проект {td['project_id']}, таймаут {per_project_timeout:.0f}с")
            result = await asyncio.wait_for(
                asyncio.to_thread(
                    _reupload_media_for_project_sync,
                    group_id=td["group_id"],
                    photos=photos,
                    video_files=video_file_data,
                    user_token=settings.vk_user_token,
                ),
                timeout=per_project_timeout,
            )
            return {"project_id": td["project_id"], "result": result, "error": None}
        except asyncio.TimeoutError:
            msg = f"Таймаут загрузки ({per_project_timeout:.0f}с). Файлы слишком большие или VK API не отвечает."
            print(f"REUPLOAD TIMEOUT: Проект {td['project_id']} — {msg}")
            return {"project_id": td["project_id"], "result": None, "error": msg}
        except Exception as e:
            msg = str(e)
            print(f"REUPLOAD ERROR: Проект {td['project_id']} — {msg}")
            return {"project_id": td["project_id"], "result": None, "error": msg}
    
    raw_results = await asyncio.gather(*[
        _reupload_with_budget(td, idx * 500)
        for idx, td in enumerate(tasks_data)
    ])
    
    # Собираем результаты
    mapping = {}
    failed = list(resolve_failed)  # Начинаем с ошибок резолва
    
    for r in raw_results:
        if r["error"]:
            failed.append({"project_id": r["project_id"], "error": r["error"]})
        else:
            data = r["result"]
            mapping[r["project_id"]] = data
            print(f"REUPLOAD OK: Проект {r['project_id']} — "
                  f"{len(data['images'])} фото, {len(data['attachments'])} видео")
    
    total_time = time.time() - start_time
    print(f"REUPLOAD: Завершено за {total_time:.1f}с. "
          f"Успешно: {len(mapping)}, Ошибки: {len(failed)}")
    
    return {"mapping": mapping, "failed": failed}
@router.post("/getAlbums", response_model=List[schemas.Album])
def get_albums(payload: schemas.AlbumPayload, db: Session = Depends(get_db)):
    """
    Получает список альбомов для проекта.
    Сначала пытается загрузить из кеша (БД). Если кеш пуст,
    автоматически загружает из VK, сохраняет в кеш и возвращает.
    """
    return media_service.get_albums(db, payload.projectId)

@router.post("/refreshAlbums", response_model=List[schemas.Album])
def refresh_albums(payload: schemas.AlbumRefreshPayload, db: Session = Depends(get_db)):
    """
    Принудительно обновляет список альбомов для проекта из VK,
    перезаписывая кеш в БД.
    """
    return media_service.refresh_albums(db, payload.projectId)

@router.post("/getPhotos", response_model=schemas.PhotosResponse)
def get_photos(payload: schemas.PhotosPayload, db: Session = Depends(get_db)):
    """
    Получает страницу с фотографиями из альбома.
    Сначала пытается загрузить из кеша (БД). Если для первой страницы кеш пуст,
    автоматически загружает ВСЕ фото из VK, сохраняет в кеш и возвращает первую страницу.
    """
    return media_service.get_photos(db, payload.projectId, payload.albumId, payload.page)

@router.post("/refreshPhotos", response_model=schemas.PhotosResponse)
def refresh_photos(payload: schemas.PhotosRefreshPayload, db: Session = Depends(get_db)):
    """
    Принудительно обновляет ВСЕ фотографии для альбома из VK,
    перезаписывая кеш в БД, и возвращает первую страницу.
    """
    return media_service.refresh_photos(db, payload.projectId, payload.albumId)

@router.post("/createAlbum", response_model=schemas.Album)
def create_album(
    payload: schemas.CreateAlbumPayload, 
    db: Session = Depends(get_db)
):
    """
    Создает новый фотоальбом в сообществе VK.
    """
    return media_service.create_album(db, payload.projectId, payload.title)

@router.post("/uploadPhotoToAlbum", response_model=schemas.Photo)
def upload_photo_to_album(
    file: UploadFile = File(...),
    projectId: str = Form(...),
    albumId: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Загружает фото в конкретный альбом VK.
    """
    return media_service.upload_photo_to_album(db, projectId, albumId, file)


@router.post("/uploadVideo", response_model=schemas.Attachment)
def upload_video(
    file: UploadFile = File(...),
    projectId: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Загружает видео в сообщество VK.
    Видео отправляется через multipart/form-data.
    Возвращает Attachment с type='video'.
    """
    return media_service.upload_video(db, projectId, file)