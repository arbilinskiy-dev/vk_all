"""
Общие зависимости и хелперы для эндпоинтов историй.
"""
from sqlalchemy.orm import Session
from database import _session_factory
from models_library.automations import StoriesAutomationLog
from models_library.projects import Project
from services import vk_service
from config import settings
from datetime import datetime, timedelta, timezone
import json
import uuid


def get_db():
    """
    Создаёт ИЗОЛИРОВАННУЮ сессию для каждого запроса.
    Используем _session_factory() напрямую вместо scoped_session (SessionLocal()),
    чтобы избежать гонки состояний, когда несколько concurrent запросов
    попадают в один поток threadpool и делят одну scoped-сессию.
    Ошибка: 'identity map is no longer valid. Has the owning Session been closed?'
    """
    db = _session_factory()
    try:
        yield db
    finally:
        db.close()


def get_community_tokens(project) -> list:
    """
    Извлекает все токены сообщества из проекта.
    Возвращает список строк-токенов (может быть пустым).
    """
    tokens = []
    if project and project.communityToken:
        tokens.append(project.communityToken)
    if project and project.additional_community_tokens:
        try:
            extras = json.loads(project.additional_community_tokens)
            if isinstance(extras, list):
                tokens.extend([t for t in extras if t])
        except:
            pass
    return tokens


def get_user_token() -> str:
    """Возвращает пользовательский VK-токен из конфигурации."""
    return settings.vk_user_token


def find_or_create_log_by_story_link(
    db: Session, project_id: str, story_link: str
) -> StoriesAutomationLog:
    """
    Ищет лог по story_link в JSON-поле log. Если не найден — создаёт промежуточный.
    Используется при обновлении статистики/зрителей по vkStoryId.
    """
    log = db.query(StoriesAutomationLog).filter(
        StoriesAutomationLog.project_id == project_id,
        StoriesAutomationLog.log.contains(story_link)
    ).first()
    
    if not log:
        log = StoriesAutomationLog(
            id=str(uuid.uuid4()),
            project_id=project_id,
            vk_post_id=0,
            status='published',
            log=json.dumps({"story_link": story_link}),
        )
        db.add(log)
        db.commit()
    
    return log


def resolve_logs_by_mode(
    db: Session, payload, project, user_token: str
) -> tuple[list, str | None]:
    """
    Универсальный резолвер логов по mode из UpdateStatsPayload.
    Возвращает (logs: list, error_message: str | None).
    
    Поддерживаемые режимы:
    - single (по logId или vkStoryId)
    - last_n (последние N записей)
    - period (за последние N дней)
    - all (все опубликованные)
    """
    if payload.mode == 'single':
        if payload.logId:
            log = db.query(StoriesAutomationLog).filter(
                StoriesAutomationLog.project_id == payload.projectId,
                StoriesAutomationLog.id == payload.logId
            ).first()
            return [log] if log else [], None
        
        elif payload.vkStoryId:
            if not project:
                return [], "Project not found"
            
            group_id = None
            try:
                group_id = vk_service.resolve_vk_group_id(project.vkProjectId, user_token)
            except:
                pass
            
            if not group_id:
                return [], "Group ID not found"
            
            owner_id = -group_id
            story_link = f"https://vk.com/story{owner_id}_{payload.vkStoryId}"
            log = find_or_create_log_by_story_link(db, payload.projectId, story_link)
            return [log], None
    
    # Для mode != 'single' (или fallthrough) — запрос по фильтрам
    query = db.query(StoriesAutomationLog).filter(
        StoriesAutomationLog.project_id == payload.projectId,
        StoriesAutomationLog.status == 'published'
    )
    
    if payload.mode == 'last_n' and payload.count:
        return query.order_by(StoriesAutomationLog.created_at.desc()).limit(payload.count).all(), None
    
    if payload.mode == 'period' and payload.days:
        cutoff = datetime.now(timezone.utc) - timedelta(days=payload.days)
        query = query.filter(StoriesAutomationLog.created_at >= cutoff)
    
    return query.order_by(StoriesAutomationLog.created_at.desc()).all(), None


def parse_vk_story_response(uploaded_story: dict | None, is_video: bool) -> tuple[str | None, str | None, str]:
    """
    Извлекает story_link, story_preview, story_type из ответа VK API после публикации.
    Используется в publishDirectStory и publishDirectStoryMulti.
    Возвращает (story_link, story_preview, story_type).
    """
    story_link = None
    story_preview = None
    story_type = "video" if is_video else "photo"
    
    if uploaded_story:
        owner_id = uploaded_story.get('owner_id')
        story_id = uploaded_story.get('id')
        if owner_id and story_id:
            story_link = f"https://vk.com/story{owner_id}_{story_id}"
        
        # Превью фото
        if 'photo' in uploaded_story and 'sizes' in uploaded_story['photo']:
            sizes = uploaded_story['photo']['sizes']
            best_size = next((s for s in sizes if s.get('type') == 'w'), sizes[-1])
            story_preview = best_size.get('url')
        
        # Превью видео
        if 'video' in uploaded_story:
            video_data = uploaded_story['video']
            first_frames = video_data.get('first_frame', [])
            if first_frames:
                story_preview = first_frames[-1].get('url')
            elif video_data.get('image'):
                story_preview = video_data['image'][-1].get('url')
        
        story_type = uploaded_story.get('type', story_type)
    
    return story_link, story_preview, story_type
