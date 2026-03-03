"""
Общие утилиты для модуля retrieval историй.
Используются в retrieval_unified.py и retrieval_dashboard.py.
"""
import json
import re


def get_story_preview(story: dict) -> str | None:
    """Извлекает URL превью из объекта VK-истории (photo или video)."""
    # Для фото-историй — берём наибольший размер из sizes
    if story.get('photo'):
        sizes = story['photo'].get('sizes', [])
        if sizes:
            return sizes[-1].get('url')
    
    # Для видео-историй — пробуем несколько фоллбэков
    if story.get('video'):
        video = story['video']
        # 1. first_frame по убыванию разрешения
        for key in ('first_frame_1280', 'first_frame_800', 'first_frame_320', 'first_frame_130'):
            if video.get(key):
                return video[key]
        # 2. Массив first_frame (объекты с url/width/height)
        first_frames = video.get('first_frame', [])
        if first_frames and isinstance(first_frames, list):
            return first_frames[-1].get('url')
        # 3. Массив image (объекты с url)
        images = video.get('image', [])
        if images and isinstance(images, list):
            return images[-1].get('url')
    
    return None


def get_story_video_url(story: dict) -> str | None:
    """
    Извлекает URL видеофайла из объекта VK-истории для воспроизведения.
    Пробует mp4 файлы разного качества (от высокого к низкому),
    затем HLS player.
    """
    if story.get('type') != 'video' or not story.get('video'):
        return None
    
    video = story['video']
    
    # 1. Прямые mp4 ссылки (от высокого качества к низкому)
    files = video.get('files', {})
    if files:
        for quality in ('mp4_1080', 'mp4_720', 'mp4_480', 'mp4_360', 'mp4_240'):
            if files.get(quality):
                return files[quality]
    
    # 2. Поле player (встроенный плеер VK)
    if video.get('player'):
        return video['player']
    
    return None


def extract_story_id_from_log(log_json_str: str) -> int | None:
    """
    Извлекает vk_story_id из JSON-строки лога по полю 'story_link'.
    Формат ссылки: https://vk.com/story-{group_id}_{story_id} или https://vk.ru/story-{group_id}_{story_id}
    """
    if not log_json_str:
        return None
    try:
        data = json.loads(log_json_str)
        if 'story_link' in data:
            # Поддерживаем оба домена: vk.com и vk.ru
            parts = re.sub(r'https?://vk\.(?:com|ru)/story', '', data['story_link']).split('_')
            if len(parts) >= 2:
                return int(parts[-1].split('?')[0])
    except Exception:
        pass
    return None
