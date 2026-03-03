"""
Загрузка историй VK (фото и видео).
Подмодуль upload — истории (stories).
"""

import requests
from .api_client import call_vk_api as _raw_call_vk_api
from .admin_tokens import get_admin_token_strings_for_group


def _parse_story_upload_result(upload_response: dict) -> str:
    """Извлекает upload_result из ответа сервера загрузки историй."""
    upload_result = None
    if 'upload_result' in upload_response:
        upload_result = upload_response['upload_result']
    elif 'response' in upload_response:
        if isinstance(upload_response['response'], dict) and 'upload_result' in upload_response['response']:
            upload_result = upload_response['response']['upload_result']
    return upload_result


def _extract_story_from_response(saved_stories: dict) -> dict:
    """Извлекает первую историю из ответа stories.save."""
    if saved_stories and isinstance(saved_stories, dict) and 'items' in saved_stories and len(saved_stories['items']) > 0:
        return saved_stories['items'][0]
    if saved_stories and isinstance(saved_stories, dict) and saved_stories.get('count', 0) > 0:
        if 'items' in saved_stories:
            return saved_stories['items'][0]
    return None


def upload_story(group_id: int, file_bytes: bytes, file_name: str, user_token: str, link_text: str = None, link_url: str = None, attachment: str = None, clickable_stickers: str = None) -> dict:
    """
    Загрузка истории. Атомарное использование токена.
    
    :param attachment: Строка вида typeOwnerId_ObjectId (например, wall-123_456) для прикрепления объекта (репоста).
                       Примечание: Сам по себе attachment добавляет визуальную карточку поста. 
                       Чтобы появилась кнопка "Смотреть запись" (или "Перейти"), 
                       нужно также передать link_text='go_to' и link_url='https://vk.com/wall...'.
    :param clickable_stickers: JSON-строка с массивом кликабельных стикеров.
                               Позволяет размещать интерактивные области (mention, hashtag и т.д.).
                               Для ссылки на пост обычно используется attachment + link_url,
                               но можно использовать стикеры типа 'mention' или 'link' (если доступно).
    :param link_text: Текст кнопки снизу (например, 'go_to', 'more', 'view'). Обязателен, если есть link_url.
    :param link_url: Ссылка для кнопки снизу.
    """
    print(f"VK_SERVICE: Starting ATOMIC story upload for group_id {group_id}...")
    
    # Получаем список кандидатов с приоритетом админов группы
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
            # Step 1: Get upload server
            get_server_params = {
                'add_to_news': 1,
                'group_id': group_id, 
                'access_token': token
            }
            
            # MOVE PARAMS TO GET_SERVER STEP
            if link_text:
                get_server_params['link_text'] = link_text
            if link_url:
                get_server_params['link_url'] = link_url
            if clickable_stickers:
                get_server_params['clickable_stickers'] = clickable_stickers

            print(f"VK_SERVICE DEBUG: Calling stories.getPhotoUploadServer with params: {get_server_params}")
            upload_server_response = _raw_call_vk_api('stories.getPhotoUploadServer', get_server_params)
            
            upload_url = upload_server_response.get('upload_url')
            if not upload_url: raise Exception("No upload_url")

            # Step 2: Upload
            files = {'photo': (file_name, file_bytes, 'image/jpeg')}
            upload_response_req = requests.post(upload_url, files=files, timeout=60)
            upload_response_req.raise_for_status()
            upload_response = upload_response_req.json()
            
            upload_result = _parse_story_upload_result(upload_response)
            
            if not upload_result:
                raise Exception(f"Bad upload response for story: {upload_response}")

            # Step 3: Save
            save_params = {
                'upload_results': upload_result,
                'access_token': token
            }
            
            if attachment:
                save_params['attachment'] = attachment

            # REMOVED link_text, link_url, clickable_stickers from save_params 
            # as they are now passed to getPhotoUploadServer

            print(f"VK_SERVICE DEBUG: Calling stories.save with params: {save_params}")
            saved_stories = _raw_call_vk_api('stories.save', save_params)
            print(f"VK_SERVICE DEBUG: stories.save response: {saved_stories}")
            
            story = _extract_story_from_response(saved_stories)
            if story:
                return story

            raise Exception(f"No story data after saving: {saved_stories}")

        except Exception as e:
            print(f"VK_SERVICE: Story upload failed with token ...{token[-4:]}: {e}")
            last_exception = e
            continue
            
    raise last_exception or Exception("All tokens failed to upload story")


def upload_video_story(group_id: int, file_bytes: bytes, file_name: str, user_token: str, link_text: str = None, link_url: str = None, clickable_stickers: str = None) -> dict:
    """
    Загрузка видео-истории. Атомарное использование токена.
    Цепочка: stories.getVideoUploadServer → POST video_file → stories.save
    
    Ограничения VK: H.264, AAC, MP4, макс. 720×1280 px, 30 fps.
    
    :param link_text: Текст кнопки снизу ('go_to', 'more', 'view' и т.д.)
    :param link_url: Ссылка для кнопки снизу.
    :param clickable_stickers: JSON-строка с кликабельными стикерами.
    """
    print(f"VK_SERVICE: Starting ATOMIC video story upload for group_id {group_id}...")
    
    # Получаем список кандидатов с приоритетом админов группы
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
            # Step 1: Получаем upload_url для видео-истории
            get_server_params = {
                'add_to_news': 1,
                'group_id': group_id,
                'access_token': token
            }
            
            if link_text:
                get_server_params['link_text'] = link_text
            if link_url:
                get_server_params['link_url'] = link_url
            if clickable_stickers:
                get_server_params['clickable_stickers'] = clickable_stickers

            print(f"VK_SERVICE DEBUG: Calling stories.getVideoUploadServer with params: {get_server_params}")
            upload_server_response = _raw_call_vk_api('stories.getVideoUploadServer', get_server_params)
            
            upload_url = upload_server_response.get('upload_url')
            if not upload_url:
                raise Exception("No upload_url from stories.getVideoUploadServer")

            # Step 2: Загружаем видео-файл (поле 'video_file', НЕ 'file' как для фото)
            ext = file_name.lower().rsplit('.', 1)[-1] if '.' in file_name else 'mp4'
            mime_types = {
                'mp4': 'video/mp4',
                'avi': 'video/x-msvideo',
                'mov': 'video/quicktime',
                'webm': 'video/webm',
            }
            mime_type = mime_types.get(ext, 'video/mp4')
            
            files = {'video_file': (file_name, file_bytes, mime_type)}
            upload_response_req = requests.post(upload_url, files=files, timeout=300)
            upload_response_req.raise_for_status()
            upload_response = upload_response_req.json()
            
            upload_result = _parse_story_upload_result(upload_response)
            
            if not upload_result:
                raise Exception(f"Bad upload response for video story: {upload_response}")

            # Step 3: Сохраняем историю (тот же токен!)
            save_params = {
                'upload_results': upload_result,
                'access_token': token
            }

            print(f"VK_SERVICE DEBUG: Calling stories.save for video story")
            saved_stories = _raw_call_vk_api('stories.save', save_params)
            print(f"VK_SERVICE DEBUG: stories.save (video) response: {saved_stories}")
            
            story = _extract_story_from_response(saved_stories)
            if story:
                return story

            raise Exception(f"No story data after saving video story: {saved_stories}")

        except Exception as e:
            print(f"VK_SERVICE: Video story upload failed with token ...{token[-4:]}: {e}")
            last_exception = e
            continue
            
    raise last_exception or Exception("All tokens failed to upload video story")
