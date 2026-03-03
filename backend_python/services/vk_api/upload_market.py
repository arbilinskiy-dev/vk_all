"""
Загрузка фото товаров VK Market.
Подмодуль upload — маркет (товары).
"""

import requests
from .api_client import call_vk_api as _raw_call_vk_api
from .admin_tokens import get_admin_token_strings_for_group


def ensure_market_photo_min_size(file_bytes: bytes, min_width: int = 400, min_height: int = 400) -> tuple:
    """
    Проверяет размер изображения и увеличивает до минимального размера VK Market (400x400),
    если фото меньше допустимого. Сохраняет пропорции, использует LANCZOS-интерполяцию.
    
    Возвращает: (processed_bytes, resize_info)
    - resize_info = None если ресайз не потребовался
    - resize_info = dict с original/new размерами если был ресайз
    """
    from PIL import Image
    import io
    
    try:
        img = Image.open(io.BytesIO(file_bytes))
        width, height = img.size
        
        if width >= min_width and height >= min_height:
            # Фото достаточного размера — возвращаем как есть
            return file_bytes, None
        
        # Нужен ресайз — увеличиваем с сохранением пропорций
        original_width, original_height = width, height
        
        # Вычисляем масштаб — берём максимальный коэффициент, чтобы обе стороны были >= min
        scale_w = min_width / width if width < min_width else 1.0
        scale_h = min_height / height if height < min_height else 1.0
        scale = max(scale_w, scale_h)
        
        new_width = int(width * scale)
        new_height = int(height * scale)
        
        print(f"VK_SERVICE: Фото слишком маленькое ({width}x{height}), увеличиваем до {new_width}x{new_height}")
        
        # Конвертируем в RGB если нужно (например, RGBA/P -> RGB для JPEG)
        if img.mode not in ('RGB', 'L'):
            img = img.convert('RGB')
        
        img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        buf = io.BytesIO()
        img_resized.save(buf, format='JPEG', quality=95)
        processed_bytes = buf.getvalue()
        
        resize_info = {
            "original_width": original_width,
            "original_height": original_height,
            "new_width": new_width,
            "new_height": new_height
        }
        
        return processed_bytes, resize_info
        
    except Exception as e:
        # Если не удалось проверить — загружаем как есть, VK сам проверит
        print(f"VK_SERVICE: Не удалось проверить размер фото: {e}. Загружаем как есть.")
        return file_bytes, None


def upload_market_photo(group_id: int, file_bytes: bytes, file_name: str, user_token: str) -> dict:
    """
    Загрузка фото товара. Атомарное использование токена.
    Используем ТОЛЬКО токены-админов группы — у остальных нет прав на загрузку фото в маркет.
    Автоматически увеличивает фото менее 400x400 до минимального размера.
    """
    print(f"VK_SERVICE: Starting ATOMIC market photo upload for group_id {group_id}...")
    
    # Проверяем и при необходимости увеличиваем размер фото до минимума VK Market (400x400)
    file_bytes, resize_info = ensure_market_photo_min_size(file_bytes)
    if resize_info:
        # Обновляем имя файла — после ресайза всегда JPEG
        file_name = file_name.rsplit('.', 1)[0] + '.jpg' if '.' in file_name else file_name + '.jpg'
    
    # Получаем ТОЛЬКО токены администраторов группы (не-админы получают Access denied)
    tokens = get_admin_token_strings_for_group(group_id, include_non_admins=False)
    
    # Если нет админских токенов — пробуем user_token как фолбэк
    if not tokens:
        if user_token:
            print(f"VK_SERVICE: Нет админских токенов для группы {group_id}, используем user_token")
            tokens = [user_token]
        else:
            raise Exception(f"Нет доступных админских токенов для группы {group_id}")
    else:
        # Если user_token — админ, перемещаем его в начало
        if user_token and user_token in tokens:
            tokens.remove(user_token)
            tokens.insert(0, user_token)
    
    print(f"VK_SERVICE: Доступно {len(tokens)} админских токенов для загрузки")
    last_exception = None

    for token in tokens:
        try:
            # Step 1: Получаем сервер для загрузки
            upload_server_response = _raw_call_vk_api('photos.getMarketUploadServer', {
                'group_id': group_id,
                'main_photo': 1,
                'access_token': token
            })
            upload_url = upload_server_response.get('upload_url')
            if not upload_url: raise Exception("No upload_url")

            # Step 2: Загружаем файл на сервер VK
            files = {'photo': (file_name, file_bytes, 'image/jpeg')}
            upload_response_req = requests.post(upload_url, files=files, timeout=60)
            upload_response_req.raise_for_status()
            upload_response = upload_response_req.json()

            # Проверяем на ошибку размера изображения — это проблема ФОТО, а не токена
            if 'error' in upload_response:
                error_msg = str(upload_response.get('error', ''))
                if 'ERR_UPLOAD_BAD_IMAGE_SIZE' in error_msg:
                    raise Exception(f"Изображение слишком маленькое. VK требует минимум 400x400 пикселей. ({error_msg})")

            if 'photo' not in upload_response or 'server' not in upload_response or 'hash' not in upload_response:
                raise Exception(f"Bad upload response: {upload_response}")

            # Step 3: Сохраняем фото на сервере VK
            save_params = {
                'group_id': group_id,
                'photo': upload_response['photo'],
                'server': upload_response['server'],
                'hash': upload_response['hash'],
                'access_token': token
            }
            saved_photos = _raw_call_vk_api('photos.saveMarketPhoto', save_params)
            
            if not saved_photos or len(saved_photos) == 0:
                raise Exception("No photo data after saving")
                
            print(f"VK_SERVICE: Market upload success with token ...{token[-4:]}")
            result = saved_photos[0]
            # Прокидываем информацию о ресайзе, если он был
            if resize_info:
                result['_resize_info'] = resize_info
            return result

        except Exception as e:
            error_str = str(e)
            print(f"VK_SERVICE: Market upload failed with token ...{token[-4:]}: {e}")
            
            # Ошибка размера изображения — нет смысла пробовать другие токены
            if 'ERR_UPLOAD_BAD_IMAGE_SIZE' in error_str or 'слишком маленькое' in error_str:
                print(f"VK_SERVICE: Ошибка размера фото — прекращаем перебор токенов")
                raise
            
            last_exception = e
            continue

    raise last_exception or Exception("Все админские токены не смогли загрузить фото товара")
