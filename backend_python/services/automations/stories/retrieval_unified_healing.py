"""
Self-healing логика для unified stories: восстановление превью, типов, image_url.
"""
from sqlalchemy.orm import Session
from models_library.posts import Post
import json


def _heal_log_preview(log_obj, preview: str, logs_to_update: list):
    """Self-healing: обновляет превью в логе из данных VK API."""
    log_obj.image_url = preview
    if log_obj.log:
        try:
            ld = json.loads(log_obj.log)
            ld['image_url'] = preview
            log_obj.log = json.dumps(ld)
        except:
            pass
    if log_obj not in logs_to_update:
        logs_to_update.append(log_obj)


def _heal_log_story_type(log_obj, story_type: str, logs_to_update: list):
    """Self-healing: сохраняет тип истории (photo/video) в JSON-лог."""
    if not log_obj.log:
        return
    try:
        ld = json.loads(log_obj.log)
        if ld.get('story_type') == story_type:
            return  # Уже сохранён правильный тип
        ld['story_type'] = story_type
        log_obj.log = json.dumps(ld)
        if log_obj not in logs_to_update:
            logs_to_update.append(log_obj)
    except:
        pass


def _recover_preview_from_log(log_obj) -> str | None:
    """Восстанавливает превью из полей лога (image_url или log JSON)."""
    if log_obj.image_url:
        return log_obj.image_url
    if log_obj.log:
        try:
            data = json.loads(log_obj.log)
            if 'image_url' in data:
                return data['image_url']
        except:
            pass
    return None


def _recover_preview_from_post(db: Session, log_obj, project_id: str, logs_to_update: list) -> str | None:
    """Восстанавливает превью из связанного поста (для автоматических историй)."""
    if not log_obj.vk_post_id or log_obj.vk_post_id == 0:
        return None
        
    preview = None
    try:
        post_match = db.query(Post).filter(
            Post.projectId == project_id,
            Post.vkPostUrl.like(f"%_{log_obj.vk_post_id}")
        ).first()
        
        if post_match:
            # 1. Пробуем колонку 'images'
            if post_match.images:
                try:
                    imgs = json.loads(post_match.images)
                    if imgs and len(imgs) > 0:
                        preview = imgs[0].get('url')
                except:
                    pass
            
            # 2. Пробуем колонку 'attachments'
            if not preview and post_match.attachments:
                try:
                    atts = json.loads(post_match.attachments)
                    for att in atts:
                        if att.get('type') == 'photo' and att.get('photo'):
                            sizes = att['photo'].get('sizes', [])
                            best = next((s for s in sizes if s.get('type') == 'w'), sizes[-1])
                            if best:
                                preview = best.get('url')
                                break
                except:
                    pass
                    
            # 3. SELF-HEALING: сохраняем восстановленное превью в БД
            if preview:
                log_obj.image_url = preview
                logs_to_update.append(log_obj)
                    
    except Exception:
        pass
    
    return preview
