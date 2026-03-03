"""
Скрипт для генерации изображения-заглушки для товаров.
Создаёт изображение 800x800 пикселей с текстом, совместимое с VK API (минимум 400x400).
"""
from PIL import Image, ImageDraw, ImageFont
import os

# Размер изображения (VK требует минимум 400x400)
WIDTH = 800
HEIGHT = 800

# Создаём белое изображение
img = Image.new('RGB', (WIDTH, HEIGHT), '#FFFFFF')
draw = ImageDraw.Draw(img)

# Ищем подходящий шрифт
font_large = None
font_small = None
font_paths = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/tahoma.ttf",
]

for fp in font_paths:
    if os.path.exists(fp):
        try:
            font_large = ImageFont.truetype(fp, 42)
            font_small = ImageFont.truetype(fp, 28)
            print(f"Используется шрифт: {fp}")
            break
        except Exception:
            continue

if font_large is None:
    font_large = ImageFont.load_default()
    font_small = ImageFont.load_default()
    print("Используется дефолтный шрифт PIL")

# Рисуем рамку
border_color = '#E0E0E0'
draw.rectangle([(20, 20), (WIDTH - 21, HEIGHT - 21)], outline=border_color, width=2)

# Рисуем иконку камеры (простой прямоугольник с кружком)
camera_color = '#BDBDBD'
# Корпус камеры
cam_x, cam_y = WIDTH // 2 - 80, HEIGHT // 2 - 60
draw.rounded_rectangle(
    [(cam_x, cam_y), (cam_x + 160, cam_y + 120)],
    radius=15,
    outline=camera_color,
    width=3
)
# Объектив камеры (круг)
lens_cx, lens_cy = WIDTH // 2, HEIGHT // 2 + 5
draw.ellipse(
    [(lens_cx - 35, lens_cy - 35), (lens_cx + 35, lens_cy + 35)],
    outline=camera_color,
    width=3
)
# Маленький круг внутри объектива
draw.ellipse(
    [(lens_cx - 15, lens_cy - 15), (lens_cx + 15, lens_cy + 15)],
    outline=camera_color,
    width=2
)
# Вспышка камеры
draw.rectangle(
    [(cam_x + 55, cam_y - 20), (cam_x + 105, cam_y + 2)],
    outline=camera_color,
    width=3
)

# Текст сверху
text_top = "Фото скоро будет"
bbox_top = draw.textbbox((0, 0), text_top, font=font_large)
tw = bbox_top[2] - bbox_top[0]
draw.text(((WIDTH - tw) / 2, HEIGHT // 2 - 140), text_top, fill='#757575', font=font_large)

# Текст снизу
text_bottom = "добавлено на сайт"
bbox_bottom = draw.textbbox((0, 0), text_bottom, font=font_large)
tw2 = bbox_bottom[2] - bbox_bottom[0]
draw.text(((WIDTH - tw2) / 2, HEIGHT // 2 + 100), text_bottom, fill='#757575', font=font_large)

# Сохраняем
output_path = os.path.join(os.path.dirname(__file__), "..", "assets", "default_product.jpg")
output_path = os.path.abspath(output_path)

img.save(output_path, "JPEG", quality=90)
file_size = os.path.getsize(output_path)
print(f"Заглушка сохранена: {output_path}")
print(f"Размер: {WIDTH}x{HEIGHT} px, {file_size} байт")

# Проверка
verify = Image.open(output_path)
print(f"Верификация: {verify.size}, mode={verify.mode}")
