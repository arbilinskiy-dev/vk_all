"""
Эндпоинты публикации историй (ручная + прямая).
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from models_library.projects import Project
from services import vk_service
from services.automations import stories_service
import requests

from .schemas import ManualPublishPayload
from .dependencies import get_db, get_community_tokens, get_user_token, parse_vk_story_response

router = APIRouter()


@router.post("/manualPublishStory")
def manual_publish_story(payload: ManualPublishPayload, db: Session = Depends(get_db)):
    user_token = get_user_token()
    project = db.query(Project).filter(Project.id == payload.projectId).first()
    if not project:
         raise HTTPException(404, "Project not found")
    
    # Извлекаем все токены сообщества
    community_tokens = get_community_tokens(project)

    try:
        group_id = vk_service.resolve_vk_group_id(project.vkProjectId, user_token)
    except Exception as e:
        raise HTTPException(400, f"Failed to resolve group ID: {e}")
    
    post_full_id = f"-{group_id}_{payload.vkPostId}"
    
    # Для wall.getById используем user_token (пользовательский токен),
    # т.к. этот метод не поддерживает авторизацию токеном сообщества
    resp = requests.post("https://api.vk.com/method/wall.getById", data={
        "posts": post_full_id,
        "access_token": user_token,
        "v": "5.131"
    }).json()
    
    if 'error' in resp:
         raise HTTPException(400, f"VK Error: {resp['error'].get('error_msg')}")
    
    posts = resp.get('response', [])
    if not posts:
         raise HTTPException(404, "Post not found in VK")
    
    raw_post = posts[0]

    result = stories_service.process_single_story_for_post(
        db, 
        payload.projectId, 
        raw_post, 
        group_id, 
        user_token, 
        force=True,
        community_tokens=community_tokens
    )
    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))
    
    return result


@router.post("/publishDirectStory")
async def publish_direct_story(
    file: UploadFile = File(...),
    projectId: str = Form(...),
    link_text: str = Form(None),
    link_url: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Прямая публикация истории из загруженного файла (фото или видео).
    Определяет тип по content-type файла и вызывает соответствующую функцию загрузки.
    
    Используется для ручного создания историй и мультипроектной публикации.
    """
    user_token = get_user_token()
    
    # Получаем проект
    project = db.query(Project).filter(Project.id == projectId).first()
    if not project:
        raise HTTPException(404, "Проект не найден")
    
    # Резолвим group_id
    try:
        group_id = vk_service.resolve_vk_group_id(project.vkProjectId, user_token)
    except Exception as e:
        raise HTTPException(400, f"Не удалось определить ID группы: {e}")
    
    # Читаем файл
    file_bytes = await file.read()
    file_name = file.filename or "story_file"
    content_type = file.content_type or ""
    
    # Определяем тип: фото или видео
    is_video = content_type.startswith("video/") or file_name.lower().endswith(('.mp4', '.avi', '.mov', '.webm'))
    
    # Валидация размера
    file_size_mb = len(file_bytes) / (1024 * 1024)
    if not is_video and file_size_mb > 10:
        raise HTTPException(400, f"Фото для истории не должно превышать 10 МБ (текущий: {file_size_mb:.1f} МБ)")
    
    print(f"STORIES_DIRECT: Publishing {'video' if is_video else 'photo'} story for project {projectId}, "
          f"group_id={group_id}, file={file_name}, size={file_size_mb:.1f} MB")
    
    try:
        if is_video:
            # Видео-история
            uploaded_story = vk_service.upload_video_story(
                group_id=group_id,
                file_bytes=file_bytes,
                file_name=file_name,
                user_token=user_token,
                link_text=link_text,
                link_url=link_url,
            )
        else:
            # Фото-история
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
        
        print(f"STORIES_DIRECT: Success! Link: {story_link}")
        
        return {
            "status": "success",
            "story_link": story_link,
            "story_preview": story_preview,
            "story_type": story_type,
            "project_id": projectId,
            "group_id": group_id,
        }
        
    except Exception as e:
        print(f"STORIES_DIRECT: Failed to publish story: {e}")
        raise HTTPException(400, f"Ошибка публикации истории: {str(e)}")
