"""
Генератор изображения-доказательства розыгрыша.

Создаёт красивое изображение в стиле VK Dark Theme с:
- Аватаркой победителя (большая, в центре)
- Мини-аватарками всех участников
- Номером победителя
- Датой и временем розыгрыша
- Названием организатора

Используется при подведении итогов конкурса отзывов для публикации
вместе с постом-результатом как доказательство честности розыгрыша.
"""

from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter
import io
import os
import re
import requests
from datetime import datetime
from typing import Optional


def strip_vk_links(text: str) -> str:
    """
    Удаляет VK-разметку ссылок из текста.
    Преобразует [id123|Имя Фамилия] -> Имя Фамилия
    и [club123|Название] -> Название
    
    Args:
        text: Текст с возможными VK-ссылками
    
    Returns:
        Очищенный текст без разметки
    """
    # Паттерн: [id/club/public + число | текст]
    pattern = r'\[(id|club|public)\d+\|([^\]]+)\]'
    return re.sub(pattern, r'\2', text)

# === ЦВЕТА В СТИЛЕ VK DARK THEME ===
VK_COLORS = {
    'bg': (25, 25, 26),              # #19191a - основной фон
    'card': (35, 35, 37),            # #232325 - карточки
    'accent': (38, 136, 235),        # #2688eb - VK Blue
    'accent_light': (74, 159, 245),  # Светлее для градиентов
    'text_primary': (255, 255, 255), # Белый текст
    'text_secondary': (142, 142, 145), # #8e8e91 - серый текст
    'divider': (50, 50, 52),         # Разделители
    'glow': (38, 136, 235, 60),      # Свечение (с альфой)
}


def fetch_user_photo(user_vk_id: int, access_token: str, size: str = "photo_200") -> Optional[bytes]:
    """
    Получает аватарку пользователя VK по ID.
    
    Args:
        user_vk_id: ID пользователя ВКонтакте
        access_token: Токен для API VK
        size: Размер фото (photo_50, photo_100, photo_200)
    
    Returns:
        bytes изображения или None если не удалось получить
    """
    try:
        resp = requests.get("https://api.vk.com/method/users.get", params={
            "user_ids": user_vk_id,
            "fields": size,
            "access_token": access_token,
            "v": "5.199"
        }, timeout=5)
        data = resp.json()
        
        if "response" in data and len(data["response"]) > 0:
            photo_url = data["response"][0].get(size)
            if photo_url:
                img_resp = requests.get(photo_url, timeout=5)
                if img_resp.status_code == 200:
                    return img_resp.content
    except Exception as e:
        print(f"PROOF_IMAGE: Failed to fetch photo for user {user_vk_id}: {e}")
    return None


def fetch_multiple_user_photos(user_ids: list[int], access_token: str, size: str = "photo_100") -> dict[int, bytes]:
    """
    Получает аватарки нескольких пользователей за один запрос.
    
    Args:
        user_ids: Список ID пользователей (макс. 1000)
        access_token: Токен для API VK
        size: Размер фото
    
    Returns:
        dict {user_id: photo_bytes}
    """
    result = {}
    
    if not user_ids:
        return result
        
    try:
        # VK API позволяет до 1000 ID за раз
        ids_str = ",".join(str(uid) for uid in user_ids[:1000])
        
        resp = requests.get("https://api.vk.com/method/users.get", params={
            "user_ids": ids_str,
            "fields": size,
            "access_token": access_token,
            "v": "5.199"
        }, timeout=10)
        data = resp.json()
        
        if "response" in data:
            for user in data["response"]:
                user_id = user.get("id")
                photo_url = user.get(size)
                
                if user_id and photo_url:
                    try:
                        img_resp = requests.get(photo_url, timeout=3)
                        if img_resp.status_code == 200:
                            result[user_id] = img_resp.content
                    except:
                        pass
                        
    except Exception as e:
        print(f"PROOF_IMAGE: Failed to fetch multiple photos: {e}")
    
    return result


def create_circular_avatar(photo_bytes: bytes, size: int) -> Image.Image:
    """
    Создаёт круглую аватарку из байтов изображения.
    
    Args:
        photo_bytes: Байты изображения
        size: Размер выходного изображения (квадрат)
    
    Returns:
        PIL Image с прозрачным фоном и круглой аватаркой
    """
    img = Image.open(io.BytesIO(photo_bytes)).convert("RGBA")
    img = ImageOps.fit(img, (size, size), centering=(0.5, 0.5))
    
    # Круглая маска
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    
    img.putalpha(mask)
    return img


def _get_fonts():
    """
    Загружает шрифты для генерации изображения.
    Поддерживает Docker (Linux) и Windows окружения.
    
    Returns:
        tuple шрифтов разных размеров + шрифт эмодзи
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    
    # Пути к локальным шрифтам (Docker)
    font_path = os.path.join(project_root, "assets", "fonts", "arial.ttf")
    font_bold_path = os.path.join(project_root, "assets", "fonts", "arialbd.ttf")
    font_emoji_path = os.path.join(project_root, "assets", "fonts", "seguiemj.ttf")
    
    # Fallback для Windows
    import platform
    if not os.path.exists(font_path) and platform.system() == "Windows":
        font_path = "C:/Windows/Fonts/segoeui.ttf"
        font_bold_path = "C:/Windows/Fonts/segoeuib.ttf"
        font_emoji_path = "C:/Windows/Fonts/seguiemj.ttf"
        
        # Ещё один fallback
        if not os.path.exists(font_path):
            font_path = "C:/Windows/Fonts/arial.ttf"
            font_bold_path = "C:/Windows/Fonts/arialbd.ttf"
    
    try:
        font_title = ImageFont.truetype(font_bold_path, 52)
        font_subtitle = ImageFont.truetype(font_path, 36)
        font_number = ImageFont.truetype(font_bold_path, 180)
        font_name = ImageFont.truetype(font_bold_path, 44)
        font_small = ImageFont.truetype(font_path, 28)
        font_tiny = ImageFont.truetype(font_path, 24)
    except Exception as e:
        print(f"PROOF_IMAGE: Font loading error, using defaults: {e}")
        default = ImageFont.load_default()
        font_title = font_subtitle = font_number = font_name = font_small = font_tiny = default
    
    # Шрифт для эмодзи
    font_emoji_title = None
    font_emoji_small = None
    try:
        if os.path.exists(font_emoji_path):
            font_emoji_title = ImageFont.truetype(font_emoji_path, 52)
            font_emoji_small = ImageFont.truetype(font_emoji_path, 44)
    except Exception as e:
        print(f"PROOF_IMAGE: Emoji font loading error: {e}")
    
    return font_title, font_subtitle, font_number, font_name, font_small, font_tiny, font_emoji_title, font_emoji_small


def create_random_proof_image(
    winner_number: int,
    winner_name: str,
    winner_vk_id: int,
    total_participants: int,
    participants_vk_ids: list[int],
    group_name: str = None,
    group_photo_bytes: bytes = None,
    contest_name: str = "Розыгрыш",
    access_token: str = None
) -> bytes:
    """
    Создаёт изображение-доказательство розыгрыша в стиле VK Dark Theme.
    
    Изображение содержит:
    - Большую аватарку победителя в центре с короной
    - Номер участника и имя победителя
    - Мини-аватарки всех участников внизу
    - Дату и время розыгрыша
    - Название организатора
    
    Args:
        winner_number: Номер победителя в конкурсе
        winner_name: Имя победителя
        winner_vk_id: VK ID победителя
        total_participants: Общее количество участников
        participants_vk_ids: Список VK ID всех участников (для мини-аватарок)
        group_name: Название сообщества-организатора
        group_photo_bytes: Аватарка сообщества (опционально)
        contest_name: Название конкурса
        access_token: Токен VK API для получения аватарок
    
    Returns:
        bytes изображения в формате JPEG
    """
    
    # === ОЧИСТКА VK-ССЫЛОК ИЗ ТЕКСТОВ ===
    # Преобразуем [id123|Имя] -> Имя
    winner_name = strip_vk_links(winner_name) if winner_name else "Победитель"
    group_name = strip_vk_links(group_name) if group_name else None
    contest_name = strip_vk_links(contest_name) if contest_name else "Розыгрыш"
    
    # === РАЗМЕРЫ ===
    WIDTH = 1080
    HEIGHT = 1080  # Квадратный формат
    
    # === СОЗДАЁМ ХОЛСТ ===
    img = Image.new('RGBA', (WIDTH, HEIGHT), VK_COLORS['bg'])
    draw = ImageDraw.Draw(img)
    
    # === ШРИФТЫ ===
    font_title, font_subtitle, font_number, font_name, font_small, font_tiny, font_emoji_title, font_emoji_small = _get_fonts()
    
    cursor_y = 60
    
    # === 1. ЗАГОЛОВОК ===
    # Рисуем эмодзи и текст отдельно для правильного отображения
    emoji_party = "🎉"
    title_text = " Итоги розыгрыша"
    
    # Измеряем размеры
    emoji_font = font_emoji_title if font_emoji_title else font_title
    bbox_emoji = draw.textbbox((0, 0), emoji_party, font=emoji_font)
    emoji_w = bbox_emoji[2] - bbox_emoji[0]
    
    bbox_title = draw.textbbox((0, 0), title_text, font=font_title)
    title_w = bbox_title[2] - bbox_title[0]
    
    total_w = emoji_w + title_w
    start_x = (WIDTH - total_w) // 2
    
    # Рисуем эмодзи с embedded_color если поддерживается
    try:
        draw.text((start_x, cursor_y), emoji_party, fill=VK_COLORS['text_primary'], font=emoji_font, embedded_color=True)
    except TypeError:
        draw.text((start_x, cursor_y), emoji_party, fill=VK_COLORS['text_primary'], font=emoji_font)
    
    # Рисуем текст
    draw.text((start_x + emoji_w, cursor_y), title_text, fill=VK_COLORS['text_primary'], font=font_title)
    
    cursor_y += 70
    
    # Название конкурса
    contest_display = contest_name if len(contest_name) <= 40 else contest_name[:37] + "..."
    bbox = draw.textbbox((0, 0), contest_display, font=font_subtitle)
    sub_w = bbox[2] - bbox[0]
    draw.text(((WIDTH - sub_w) // 2, cursor_y), contest_display, fill=VK_COLORS['text_secondary'], font=font_subtitle)
    
    cursor_y += 100
    
    # === 2. АВАТАРКА ПОБЕДИТЕЛЯ (БОЛЬШАЯ) ===
    winner_avatar_size = 280
    winner_x = (WIDTH - winner_avatar_size) // 2
    winner_y = cursor_y
    
    # Свечение (glow) вокруг аватарки
    glow_size = winner_avatar_size + 40
    glow_img = Image.new('RGBA', (glow_size, glow_size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    glow_draw.ellipse((0, 0, glow_size, glow_size), fill=VK_COLORS['glow'])
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=20))
    img.paste(glow_img, (winner_x - 20, winner_y - 20), glow_img)
    
    # Получаем аватарку победителя
    winner_photo = None
    if access_token:
        winner_photo = fetch_user_photo(winner_vk_id, access_token)
    
    if winner_photo:
        avatar = create_circular_avatar(winner_photo, winner_avatar_size)
        img.paste(avatar, (winner_x, winner_y), avatar)
    else:
        # Заглушка - серый круг с иконкой
        draw.ellipse(
            (winner_x, winner_y, winner_x + winner_avatar_size, winner_y + winner_avatar_size),
            fill=VK_COLORS['card'], outline=VK_COLORS['accent'], width=4
        )
        # Иконка пользователя
        user_icon = "👤"
        user_icon_font = font_emoji_title if font_emoji_title else font_number
        bbox = draw.textbbox((0, 0), user_icon, font=user_icon_font)
        icon_w = bbox[2] - bbox[0]
        try:
            draw.text(
                (winner_x + (winner_avatar_size - icon_w) // 2, winner_y + 50),
                user_icon, fill=VK_COLORS['text_secondary'], font=user_icon_font, embedded_color=True
            )
        except TypeError:
            draw.text(
                (winner_x + (winner_avatar_size - icon_w) // 2, winner_y + 50),
                user_icon, fill=VK_COLORS['text_secondary'], font=user_icon_font
            )
    
    # Корона над аватаркой
    crown = "👑"
    crown_font = font_emoji_small if font_emoji_small else font_title
    bbox = draw.textbbox((0, 0), crown, font=crown_font)
    crown_w = bbox[2] - bbox[0]
    try:
        draw.text(((WIDTH - crown_w) // 2, winner_y - 55), crown, font=crown_font, embedded_color=True)
    except TypeError:
        draw.text(((WIDTH - crown_w) // 2, winner_y - 55), crown, font=crown_font)
    
    # Обводка аватарки (VK blue ring)
    draw.ellipse(
        (winner_x - 4, winner_y - 4, winner_x + winner_avatar_size + 4, winner_y + winner_avatar_size + 4),
        outline=VK_COLORS['accent'], width=4
    )
    
    cursor_y += winner_avatar_size + 40
    
    # === 3. НОМЕР И ИМЯ ПОБЕДИТЕЛЯ ===
    # Номер участника
    number_text = f"Отзыв №{winner_number}"
    bbox = draw.textbbox((0, 0), number_text, font=font_subtitle)
    num_w = bbox[2] - bbox[0]
    draw.text(((WIDTH - num_w) // 2, cursor_y), number_text, fill=VK_COLORS['accent'], font=font_subtitle)
    
    cursor_y += 50
    
    # Имя победителя
    winner_display = winner_name if len(winner_name) <= 30 else winner_name[:27] + "..."
    bbox = draw.textbbox((0, 0), winner_display, font=font_name)
    name_w = bbox[2] - bbox[0]
    draw.text(((WIDTH - name_w) // 2, cursor_y), winner_display, fill=VK_COLORS['text_primary'], font=font_name)
    
    cursor_y += 80
    
    # === 4. РАЗДЕЛИТЕЛЬ ===
    line_y = cursor_y
    draw.line([(80, line_y), (WIDTH - 80, line_y)], fill=VK_COLORS['divider'], width=2)
    cursor_y += 40
    
    # === 5. СТАТИСТИКА ===
    stats_text = f"Всего участников: {total_participants}"
    bbox = draw.textbbox((0, 0), stats_text, font=font_small)
    stats_w = bbox[2] - bbox[0]
    draw.text(((WIDTH - stats_w) // 2, cursor_y), stats_text, fill=VK_COLORS['text_secondary'], font=font_small)
    
    cursor_y += 50
    
    # === 6. МИНИ-АВАТАРКИ УЧАСТНИКОВ ===
    mini_avatar_size = 56
    max_avatars = 12  # Максимум показываем
    spacing = 8
    
    avatars_to_show = participants_vk_ids[:max_avatars]
    total_avatars_width = len(avatars_to_show) * (mini_avatar_size + spacing) - spacing
    
    # Если участников больше, добавим "+N"
    has_extra = len(participants_vk_ids) > max_avatars
    if has_extra:
        total_avatars_width += 70  # Место для "+N"
    
    start_x = (WIDTH - total_avatars_width) // 2
    avatar_y = cursor_y
    
    # Получаем все аватарки за один запрос (оптимизация)
    photos_map = {}
    if access_token and avatars_to_show:
        photos_map = fetch_multiple_user_photos(avatars_to_show, access_token)
    
    for i, user_id in enumerate(avatars_to_show):
        ax = start_x + i * (mini_avatar_size + spacing)
        
        # Рисуем мини-аватарку
        mini_photo = photos_map.get(user_id)
        
        if mini_photo:
            mini_avatar = create_circular_avatar(mini_photo, mini_avatar_size)
            img.paste(mini_avatar, (ax, avatar_y), mini_avatar)
        else:
            # Заглушка
            draw.ellipse(
                (ax, avatar_y, ax + mini_avatar_size, avatar_y + mini_avatar_size),
                fill=VK_COLORS['card'], outline=VK_COLORS['divider'], width=2
            )
        
        # Подсветка победителя среди участников
        if user_id == winner_vk_id:
            draw.ellipse(
                (ax - 3, avatar_y - 3, ax + mini_avatar_size + 3, avatar_y + mini_avatar_size + 3),
                outline=VK_COLORS['accent'], width=3
            )
    
    # "+N" если участников больше
    if has_extra:
        extra_count = len(participants_vk_ids) - max_avatars
        extra_x = start_x + len(avatars_to_show) * (mini_avatar_size + spacing)
        extra_text = f"+{extra_count}"
        
        draw.ellipse(
            (extra_x, avatar_y, extra_x + mini_avatar_size, avatar_y + mini_avatar_size),
            fill=VK_COLORS['card']
        )
        bbox = draw.textbbox((0, 0), extra_text, font=font_tiny)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        draw.text(
            (extra_x + (mini_avatar_size - tw) // 2, avatar_y + (mini_avatar_size - th) // 2 - 2),
            extra_text, fill=VK_COLORS['text_secondary'], font=font_tiny
        )
    
    cursor_y += mini_avatar_size + 50
    
    # === 7. ДАТА И ВРЕМЯ ===
    now = datetime.now()
    datetime_str = now.strftime("%d.%m.%Y в %H:%M:%S")
    bbox = draw.textbbox((0, 0), datetime_str, font=font_small)
    dt_w = bbox[2] - bbox[0]
    draw.text(((WIDTH - dt_w) // 2, cursor_y), datetime_str, fill=VK_COLORS['text_secondary'], font=font_small)
    
    cursor_y += 40
    
    # === 8. ОРГАНИЗАТОР ===
    if group_name:
        org_text = f"Организатор: {group_name}"
        if len(org_text) > 50:
            org_text = org_text[:47] + "..."
        bbox = draw.textbbox((0, 0), org_text, font=font_tiny)
        org_w = bbox[2] - bbox[0]
        draw.text(((WIDTH - org_w) // 2, cursor_y), org_text, fill=VK_COLORS['text_secondary'], font=font_tiny)
    
    # === СОХРАНЕНИЕ ===
    output = io.BytesIO()
    # Конвертируем в RGB для JPEG (убираем альфа-канал)
    final_img = Image.new('RGB', img.size, VK_COLORS['bg'])
    final_img.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)
    final_img.save(output, format='JPEG', quality=95)
    
    print(f"PROOF_IMAGE: Generated image for winner #{winner_number} ({winner_name}), {total_participants} participants")
    
    return output.getvalue()
