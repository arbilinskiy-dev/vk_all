"""
Загрузка видео в сообщество VK.
Подмодуль upload — видео.
"""

import requests
import time
from .api_client import call_vk_api as _raw_call_vk_api
from .admin_tokens import get_admin_token_strings_for_group


def _fetch_video_thumbnail(token: str, owner_id: int, video_id: int, access_key: str, max_attempts: int = 3) -> tuple:
    """
    Пытается получить превью и player_url через video.get.
    VK обрабатывает видео асинхронно, превью может быть не готово сразу.
    Делает до max_attempts попыток с задержкой.
    
    :return: (thumbnail_url, player_url)
    """
    thumbnail_url = None
    player_url = None
    video_identifier = f"{owner_id}_{video_id}"
    if access_key:
        video_identifier += f"_{access_key}"

    for attempt in range(max_attempts):
        try:
            if attempt > 0:
                time.sleep(2)  # Ждём 2 секунды между попытками

            video_info = _raw_call_vk_api('video.get', {
                'videos': video_identifier,
                'access_token': token,
            })

            items = video_info.get('items', [])
            if items and len(items) > 0:
                video_item = items[0]
                # Берём лучшее доступное превью
                # VK возвращает image[] с разными размерами
                images = video_item.get('image', [])
                if images:
                    # Берём самое большое превью (последний элемент)
                    thumbnail_url = images[-1].get('url', '')
                # Fallback на старые поля
                if not thumbnail_url:
                    thumbnail_url = video_item.get('photo_800') or video_item.get('photo_320') or video_item.get('photo_130', '')

                player_url = video_item.get('player', '')

                if thumbnail_url:
                    print(f"VK_SERVICE: Got video thumbnail on attempt {attempt + 1}: {thumbnail_url[:80]}...")
                    break
                else:
                    print(f"VK_SERVICE: Video thumbnail not ready yet (attempt {attempt + 1}/{max_attempts})")
        except Exception as thumb_err:
            print(f"VK_SERVICE: Failed to get video info (attempt {attempt + 1}/{max_attempts}): {thumb_err}")

    return thumbnail_url, player_url


def upload_video(group_id: int, file_bytes: bytes, file_name: str, user_token: str, name: str = "", description: str = "") -> dict:
    """
    Загрузка видео в сообщество VK. Двухшаговый процесс:
    1. video.save — получаем upload_url, video_id, owner_id
    2. POST файл на upload_url — видео загружено (VK обрабатывает асинхронно)
    
    Атомарное использование одного токена на оба шага.
    Приоритет: токены-админы группы -> user_token -> остальные.
    """
    print(f"VK_SERVICE: Starting ATOMIC video upload for group_id {group_id}...")
    
    # Получаем список кандидатов с приоритетом админ-токенов группы
    tokens = get_admin_token_strings_for_group(group_id, include_non_admins=True)
    
    # Если user_token не в списке — добавляем его в начало
    if user_token and user_token not in tokens:
        tokens.insert(0, user_token)
    elif user_token and user_token in tokens:
        tokens.remove(user_token)
        tokens.insert(0, user_token)
    
    last_exception = None

    for token in tokens:
        try:
            # Step 1: video.save — получаем upload_url и данные видео
            save_params = {
                'group_id': group_id,
                'access_token': token,
            }
            if name:
                save_params['name'] = name[:128]  # VK ограничивает 128 символов
            if description:
                save_params['description'] = description[:5000]  # VK ограничивает 5000 символов
            
            video_data = _raw_call_vk_api('video.save', save_params)
            
            upload_url = video_data.get('upload_url')
            video_id = video_data.get('video_id')
            owner_id = video_data.get('owner_id')
            access_key = video_data.get('access_key', '')
            
            if not upload_url:
                raise Exception("VK API не вернул upload_url для видео")
            if not video_id or not owner_id:
                raise Exception(f"VK API вернул неполные данные видео: video_id={video_id}, owner_id={owner_id}")
            
            print(f"VK_SERVICE: video.save OK → video_id={video_id}, owner_id={owner_id}, uploading file...")

            # Step 2: POST файл на upload_url
            # Определяем MIME-тип по расширению файла
            ext = file_name.lower().rsplit('.', 1)[-1] if '.' in file_name else 'mp4'
            mime_types = {
                'mp4': 'video/mp4',
                'avi': 'video/x-msvideo',
                'mov': 'video/quicktime',
                'wmv': 'video/x-ms-wmv',
                'flv': 'video/x-flv',
                'mkv': 'video/x-matroska',
                '3gp': 'video/3gpp',
                'webm': 'video/webm',
            }
            mime_type = mime_types.get(ext, 'video/mp4')
            
            files = {'video_file': (file_name, file_bytes, mime_type)}
            upload_response_req = requests.post(upload_url, files=files, timeout=300)
            upload_response_req.raise_for_status()
            
            # VK может вернуть JSON с результатом или просто статус 200
            try:
                upload_result = upload_response_req.json()
                print(f"VK_SERVICE: Video upload response: {upload_result}")
                # Проверяем на ошибки в ответе
                if 'error' in upload_result:
                    raise Exception(f"Ошибка загрузки видео: {upload_result['error']}")
            except ValueError:
                # Не JSON — просто статус 200, всё ок
                print(f"VK_SERVICE: Video upload returned status {upload_response_req.status_code} (no JSON)")

            print(f"VK_SERVICE: Video upload success with token ...{token[-4:]}")
            
            # Step 3 (опционально): Получаем превью через video.get
            thumbnail_url, player_url = _fetch_video_thumbnail(token, owner_id, video_id, access_key)
            
            return {
                'video_id': video_id,
                'owner_id': owner_id,
                'access_key': access_key,
                'title': video_data.get('title', name),
                'description': video_data.get('description', description),
                'thumbnail_url': thumbnail_url or '',
                'player_url': player_url or '',
            }

        except Exception as e:
            print(f"VK_SERVICE: Video upload failed with token ...{token[-4:]}: {e}")
            last_exception = e
            continue
            
    raise last_exception or Exception("Все токены не смогли загрузить видео")
