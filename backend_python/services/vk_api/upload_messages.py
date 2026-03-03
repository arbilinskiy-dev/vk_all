"""
Загрузка медиа для личных сообщений VK (фото, документы, видео).
Подмодуль upload — медиа для сообщений.
"""

import requests
from .api_client import call_vk_api as _raw_call_vk_api
from .admin_tokens import get_admin_token_strings_for_group


def _detect_image_content_type(file_name: str) -> str:
    """Определяет content-type изображения по расширению файла."""
    file_name_lower = (file_name or 'photo.jpg').lower()
    if file_name_lower.endswith('.png'):
        return 'image/png'
    elif file_name_lower.endswith('.gif'):
        return 'image/gif'
    elif file_name_lower.endswith('.bmp'):
        return 'image/bmp'
    elif file_name_lower.endswith('.webp'):
        return 'image/webp'
    else:
        return 'image/jpeg'


def _detect_doc_content_type(file_name: str) -> str:
    """Определяет content-type документа по расширению файла."""
    file_name_lower = (file_name or 'document').lower()
    ext = file_name_lower.rsplit('.', 1)[-1] if '.' in file_name_lower else ''
    mime_map = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'gif': 'image/gif',
    }
    return mime_map.get(ext, 'application/octet-stream')


def _detect_video_mime_type(file_name: str) -> str:
    """Определяет MIME-тип видеофайла по расширению."""
    ext = file_name.lower().rsplit('.', 1)[-1] if '.' in file_name else 'mp4'
    mime_types = {
        'mp4': 'video/mp4', 'avi': 'video/x-msvideo', 'mov': 'video/quicktime',
        'wmv': 'video/x-ms-wmv', 'flv': 'video/x-flv', 'mkv': 'video/x-matroska',
        '3gp': 'video/3gpp', 'webm': 'video/webm',
    }
    return mime_types.get(ext, 'video/mp4')


def upload_message_photo(group_id: int, peer_id: int, file_bytes: bytes, file_name: str, community_tokens: list = None) -> dict:
    """
    Загрузка фото для отправки в личные сообщения.
    Использует photos.getMessagesUploadServer → POST → photos.saveMessagesPhoto.
    Атомарное использование одного токена (community token) на все 3 шага.

    ВАЖНО: Метод photos.getMessagesUploadServer требует ТОКЕН СООБЩЕСТВА.
    User-токены получают Access denied (Code: 15).

    :param group_id: Числовой ID группы VK
    :param peer_id: ID пользователя-получателя (для привязки к диалогу)
    :param file_bytes: Байты изображения
    :param file_name: Имя файла
    :param community_tokens: Список токенов сообщества (из проекта)
    :return: Словарь с данными сохранённого фото (owner_id, id и т.д.)
    """
    print(f"VK_SERVICE: Starting ATOMIC message photo upload for group_id {group_id}, peer_id {peer_id}...")

    # Для загрузки фото в сообщения нужны ТОЛЬКО токены сообщества (community tokens).
    # User-токены получают Access denied (Code: 15) на photos.getMessagesUploadServer.
    tokens = list(community_tokens) if community_tokens else []

    if not tokens:
        raise Exception(f"Нет токенов сообщества (community tokens) для группы {group_id}. "
                        "Метод photos.getMessagesUploadServer требует токен сообщества.")

    # Определяем content-type по расширению файла
    content_type = _detect_image_content_type(file_name)

    last_exception = None

    for token in tokens:
        try:
            # Шаг 1: Получаем URL сервера загрузки для сообщений
            # НЕ передаём group_id — он уже подразумевается из community-токена
            upload_server_response = _raw_call_vk_api('photos.getMessagesUploadServer', {
                'peer_id': peer_id,
                'access_token': token,
            })
            upload_url = upload_server_response.get('upload_url')
            if not upload_url:
                raise Exception("VK API не вернул upload_url для photos.getMessagesUploadServer")

            print(f"VK_SERVICE: Got upload_url for messages photo (token ...{token[-4:]})")

            # Шаг 2: Загружаем файл на сервер VK
            files = {'photo': (file_name, file_bytes, content_type)}
            upload_response_req = requests.post(upload_url, files=files, timeout=60)
            upload_response_req.raise_for_status()
            upload_response = upload_response_req.json()

            print(f"VK_SERVICE: Upload response keys: {list(upload_response.keys())}, "
                  f"photo_len={len(str(upload_response.get('photo', '')))}")

            # Валидация ответа upload-сервера
            photo_field = upload_response.get('photo', '')
            server_field = upload_response.get('server')
            hash_field = upload_response.get('hash', '')

            if not photo_field or photo_field == '[]' or not hash_field:
                raise Exception(
                    f"Upload-сервер вернул пустые данные (photo='{str(photo_field)[:50]}', "
                    f"server={server_field}, hash='{str(hash_field)[:20]}'). "
                    "Возможно, файл повреждён или имеет неподдерживаемый формат."
                )

            # Шаг 3: Сохраняем фото через photos.saveMessagesPhoto (тот же токен)
            # Передаём ВСЕ поля из upload response (как делает библиотека vk_api)
            save_params = dict(upload_response)  # Копируем все поля
            save_params['access_token'] = token
            saved_photos = _raw_call_vk_api('photos.saveMessagesPhoto', save_params)

            if not saved_photos or len(saved_photos) == 0:
                raise Exception("VK API не вернул данные фото после photos.saveMessagesPhoto")

            print(f"VK_SERVICE: Message photo upload success with token ...{token[-4:]}")
            return saved_photos[0]

        except Exception as e:
            print(f"VK_SERVICE: Message photo upload failed with token ...{token[-4:]}: {e}")
            last_exception = e
            continue

    raise last_exception or Exception("Все токены не смогли загрузить фото для сообщения")


def upload_message_doc(group_id: int, peer_id: int, file_bytes: bytes, file_name: str, community_tokens: list = None) -> dict:
    """
    Загрузка документа для отправки в личные сообщения.
    Использует docs.getMessagesUploadServer → POST → docs.save.
    Атомарное использование одного токена (community token) на все 3 шага.

    ВАЖНО: Метод docs.getMessagesUploadServer требует ТОКЕН СООБЩЕСТВА.

    :param group_id: Числовой ID группы VK
    :param peer_id: ID пользователя-получателя
    :param file_bytes: Байты документа
    :param file_name: Имя файла
    :param community_tokens: Список токенов сообщества
    :return: Словарь с данными сохранённого документа (owner_id, id, title, url и т.д.)
    """
    print(f"VK_SERVICE: Starting ATOMIC message doc upload for group_id {group_id}, peer_id {peer_id}...")

    tokens = list(community_tokens) if community_tokens else []
    if not tokens:
        raise Exception(f"Нет токенов сообщества для группы {group_id}. "
                        "Метод docs.getMessagesUploadServer требует токен сообщества.")

    # Определяем content-type по расширению
    content_type = _detect_doc_content_type(file_name)

    last_exception = None

    for token in tokens:
        try:
            # Шаг 1: Получаем URL сервера загрузки документов для сообщений
            upload_server_response = _raw_call_vk_api('docs.getMessagesUploadServer', {
                'type': 'doc',
                'peer_id': peer_id,
                'access_token': token,
            })
            upload_url = upload_server_response.get('upload_url')
            if not upload_url:
                raise Exception("VK API не вернул upload_url для docs.getMessagesUploadServer")

            print(f"VK_SERVICE: Got upload_url for messages doc (token ...{token[-4:]})")

            # Шаг 2: Загружаем файл на сервер VK
            files = {'file': (file_name, file_bytes, content_type)}
            upload_response_req = requests.post(upload_url, files=files, timeout=120)
            upload_response_req.raise_for_status()
            upload_response = upload_response_req.json()

            file_field = upload_response.get('file', '')
            if not file_field:
                raise Exception(f"Upload-сервер вернул пустые данные: {upload_response}")

            # Шаг 3: Сохраняем документ через docs.save (тот же токен)
            save_params = {
                'file': file_field,
                'title': file_name or 'document',
                'access_token': token,
            }
            saved_docs = _raw_call_vk_api('docs.save', save_params)

            # docs.save возвращает {"type": "doc", "doc": {...}}
            doc_data = saved_docs.get('doc', saved_docs)
            if not doc_data or not doc_data.get('id'):
                raise Exception("VK API не вернул данные документа после docs.save")

            print(f"VK_SERVICE: Message doc upload success with token ...{token[-4:]}")
            return doc_data

        except Exception as e:
            print(f"VK_SERVICE: Message doc upload failed with token ...{token[-4:]}: {e}")
            last_exception = e
            continue

    raise last_exception or Exception("Все токены не смогли загрузить документ для сообщения")


def upload_message_video(group_id: int, peer_id: int, file_bytes: bytes, file_name: str, community_tokens: list = None, name: str = "") -> dict:
    """
    Загрузка видео для отправки в личные сообщения.
    Использует video.save → POST файл на upload_url.

    ВАЖНО: video.save требует USER-ТОКЕН (админ группы), НЕ токен сообщества!
    VK API возвращает Code 27 (method is unavailable with group auth) при использовании
    community token для video.save.

    :param group_id: Числовой ID группы VK
    :param peer_id: ID пользователя-получателя
    :param file_bytes: Байты видеофайла
    :param file_name: Имя файла
    :param community_tokens: НЕ используется (параметр оставлен для совместимости сигнатуры)
    :param name: Название видео (опционально)
    :return: Словарь с данными видео (video_id, owner_id, access_key, ...)
    """
    print(f"VK_SERVICE: Starting ATOMIC message video upload for group_id {group_id}, peer_id {peer_id}...")

    # video.save требует USER-TOKEN (админ группы), community token даёт Code 27
    tokens = get_admin_token_strings_for_group(group_id, include_non_admins=True)
    if not tokens:
        raise Exception(f"Нет user-токенов (admin) для группы {group_id}. "
                        "Метод video.save требует токен пользователя-администратора.")

    # Определяем MIME-тип
    mime_type = _detect_video_mime_type(file_name)

    last_exception = None

    for token in tokens:
        try:
            # Шаг 1: video.save — получаем upload_url
            save_params = {
                'group_id': group_id,
                'is_private': 1,  # Приватное видео для отправки в ЛС
                'access_token': token,
            }
            if name:
                save_params['name'] = name[:128]

            video_data = _raw_call_vk_api('video.save', save_params)

            upload_url = video_data.get('upload_url')
            video_id = video_data.get('video_id')
            owner_id = video_data.get('owner_id')
            access_key = video_data.get('access_key', '')

            if not upload_url or not video_id or not owner_id:
                raise Exception(f"VK API вернул неполные данные video.save: "
                                f"upload_url={bool(upload_url)}, video_id={video_id}, owner_id={owner_id}")

            print(f"VK_SERVICE: video.save OK → video_id={video_id}, owner_id={owner_id}")

            # Шаг 2: POST файл на upload_url
            files = {'video_file': (file_name, file_bytes, mime_type)}
            upload_response_req = requests.post(upload_url, files=files, timeout=300)
            upload_response_req.raise_for_status()

            try:
                upload_result = upload_response_req.json()
                if 'error' in upload_result:
                    raise Exception(f"Ошибка загрузки видео: {upload_result['error']}")
            except ValueError:
                pass  # Не JSON — просто 200 OK

            print(f"VK_SERVICE: Message video upload success with token ...{token[-4:]}")

            return {
                'video_id': video_id,
                'owner_id': owner_id,
                'access_key': access_key,
                'title': video_data.get('title', name or file_name),
            }

        except Exception as e:
            print(f"VK_SERVICE: Message video upload failed with token ...{token[-4:]}: {e}")
            last_exception = e
            continue

    raise last_exception or Exception("Все токены не смогли загрузить видео для сообщения")
