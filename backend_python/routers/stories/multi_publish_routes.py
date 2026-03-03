"""
Мультипроектная параллельная публикация историй.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from models_library.projects import Project
from services import vk_service
import json as json_lib
import asyncio

from .dependencies import get_db, get_user_token, parse_vk_story_response

router = APIRouter()


def _publish_story_for_group_sync(
    group_id: int,
    project_id: str,
    file_bytes: bytes,
    file_name: str,
    is_video: bool,
    user_token: str,
    link_text: str | None,
    link_url: str | None,
    max_retries: int = 2,
) -> dict:
    """
    Синхронная публикация одной истории в одну группу с retry.
    Запускается через asyncio.to_thread для параллелизма.
    """
    last_error = None
    
    for attempt in range(max_retries + 1):
        try:
            if is_video:
                uploaded_story = vk_service.upload_video_story(
                    group_id=group_id,
                    file_bytes=file_bytes,
                    file_name=file_name,
                    user_token=user_token,
                    link_text=link_text,
                    link_url=link_url,
                )
            else:
                uploaded_story = vk_service.upload_story(
                    group_id=group_id,
                    file_bytes=file_bytes,
                    file_name=file_name,
                    user_token=user_token,
                    link_text=link_text,
                    link_url=link_url,
                )
            
            # Парсим ответ VK
            story_link, story_preview, story_type = parse_vk_story_response(uploaded_story, is_video)
            
            # Проверяем что история реально создалась
            if not story_link:
                raise Exception("VK вернул пустой ответ (нет story_link)")
            
            print(f"STORIES_MULTI: ✅ group_id={group_id} — {story_link}")
            
            return {
                "status": "success",
                "story_link": story_link,
                "story_preview": story_preview,
                "story_type": story_type,
                "project_id": project_id,
                "group_id": group_id,
            }
        
        except Exception as e:
            last_error = str(e)
            if attempt < max_retries:
                import time
                time.sleep(1)  # Пауза 1 сек между retry
                print(f"STORIES_MULTI: ⚠️ group_id={group_id} attempt {attempt + 1} failed: {e}, retrying...")
            else:
                print(f"STORIES_MULTI: ❌ group_id={group_id} all {max_retries + 1} attempts failed: {e}")
    
    return {
        "status": "error",
        "error": last_error,
        "project_id": project_id,
        "group_id": group_id,
        "story_link": None,
        "story_preview": None,
        "story_type": "video" if is_video else "photo",
    }


@router.post("/publishDirectStoryMulti")
async def publish_direct_story_multi(
    file: UploadFile = File(...),
    project_ids: str = Form(...),  # JSON-массив строк: '["id1","id2","id3"]'
    link_text: str = Form(None),
    link_url: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Мультипроектная параллельная публикация одной истории в несколько групп.
    Файл загружается один раз, затем параллельно публикуется во все группы
    с задержкой 500мс между стартами и retry при ошибках.
    """
    user_token = get_user_token()
    
    # Парсим список проектов
    try:
        parsed_ids = json_lib.loads(project_ids)
        if not isinstance(parsed_ids, list) or len(parsed_ids) == 0:
            raise ValueError("Пустой массив")
    except Exception as e:
        raise HTTPException(400, f"Некорректный формат project_ids: {e}")
    
    # Читаем файл один раз
    file_bytes = await file.read()
    file_name = file.filename or "story_file"
    content_type = file.content_type or ""
    is_video = content_type.startswith("video/") or file_name.lower().endswith(('.mp4', '.avi', '.mov', '.webm'))
    
    file_size_mb = len(file_bytes) / (1024 * 1024)
    if not is_video and file_size_mb > 10:
        raise HTTPException(400, f"Фото для истории не должно превышать 10 МБ (текущий: {file_size_mb:.1f} МБ)")
    
    print(f"STORIES_MULTI: Starting parallel publish to {len(parsed_ids)} projects, "
          f"type={'video' if is_video else 'photo'}, file={file_name}, size={file_size_mb:.1f} MB")
    
    # Резолвим group_id для каждого проекта
    tasks_data = []
    for pid in parsed_ids:
        project = db.query(Project).filter(Project.id == pid).first()
        if not project:
            tasks_data.append({
                "project_id": pid,
                "error": f"Проект {pid} не найден",
            })
            continue
        
        try:
            gid = vk_service.resolve_vk_group_id(project.vkProjectId, user_token)
        except Exception as e:
            tasks_data.append({
                "project_id": pid,
                "error": f"Не удалось определить ID группы: {e}",
            })
            continue
        
        tasks_data.append({
            "project_id": pid,
            "group_id": gid,
        })
    
    # Запускаем параллельную публикацию через asyncio
    async def publish_with_delay(task_info: dict, delay_ms: int):
        """Публикация с начальной задержкой для stagger-эффекта."""
        if "error" in task_info:
            # Проект не найден — сразу возвращаем ошибку
            return {
                "status": "error",
                "error": task_info["error"],
                "project_id": task_info["project_id"],
                "group_id": 0,
                "story_link": None,
                "story_preview": None,
                "story_type": "video" if is_video else "photo",
            }
        
        # Задержка между стартами (0, 500, 1000 мс...)
        if delay_ms > 0:
            await asyncio.sleep(delay_ms / 1000)
        
        # Запускаем блокирующую функцию в отдельном потоке
        return await asyncio.to_thread(
            _publish_story_for_group_sync,
            group_id=task_info["group_id"],
            project_id=task_info["project_id"],
            file_bytes=file_bytes,
            file_name=file_name,
            is_video=is_video,
            user_token=user_token,
            link_text=link_text,
            link_url=link_url,
        )
    
    # Запускаем все задачи параллельно с задержкой 500мс между стартами
    coroutines = [
        publish_with_delay(td, idx * 500)
        for idx, td in enumerate(tasks_data)
    ]
    
    results = await asyncio.gather(*coroutines)
    
    success_count = sum(1 for r in results if r.get("status") == "success")
    error_count = sum(1 for r in results if r.get("status") == "error")
    
    print(f"STORIES_MULTI: Done! {success_count} success, {error_count} errors out of {len(results)} total")
    
    return {
        "results": list(results),
        "total": len(results),
        "success_count": success_count,
        "error_count": error_count,
    }
