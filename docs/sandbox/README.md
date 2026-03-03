# Песочница (Sandbox) — Итоги тестирования VK API

> Документ описывает текущие тесты, выявленные особенности VK API и архитектуру модуля Песочницы.

---

## Оглавление

| Раздел | Файл | Описание |
|---|---|---|
| Архитектура модуля | [architecture.md](architecture.md) | Файловая структура, принцип работы, навигация |
| Тест 1: Фото + История | [test1_photo_story.md](test1_photo_story.md) | Загрузка фото → публикация Story от имени сообщества |
| Тест 2: Данные историй | [test2_stories_data.md](test2_stories_data.md) | Матрица: 4 метода stories × 4 типа токенов |
| Тест 3: groups.getById | [test3_groups_getbyid.md](test3_groups_getbyid.md) | Сравнение ответа groups.getById по типам токенов |
| Тест 4: Модели Google AI | [test4_gemini_models.md](test4_gemini_models.md) | Проверка доступности 36 моделей Google AI (Gemini, Gemma, Imagen, Veo, TTS) |
| Тест 5: Генерация изображений | [test5_image_generation.md](test5_image_generation.md) | Генерация изображений через 7 моделей (Gemini Image + Imagen) |
| Тест 6: Генерация видео | [test6_video_generation.md](test6_video_generation.md) | Генерация видео через 5 моделей Veo (2.0–3.1) + проксирование |
| Особенности VK API | [vk_api_findings.md](vk_api_findings.md) | Критические и важные находки при работе с VK API |
| Особенности Google AI API | [google_ai_findings.md](google_ai_findings.md) | Находки при работе с Google Generative Language API |
| Конфигурация | [config.md](config.md) | Параметры VK API, токены, безопасность логов |
| Хронология отладки | [debug_chronology.md](debug_chronology.md) | Все итерации отладки (1–19) |

---

## Текущее состояние тестов

| ID | Название | Статус | Последняя итерация |
|---|---|---|---|
| test1 | Фото + История (Story) | ✅ Работает | Итерация 6: user_token для stories.save |
| test2 | Получение данных историй | ✅ Работает | Итерация 9: Исправление парсинга stories.get |
| test3 | groups.getById — сравнение токенов | ✅ Работает | Итерация 10: Матрица данных по токенам |
| test4 | Модели Google AI — проверка доступности | ✅ Работает | Итерация 14: Задержка между запросами, 3-статусная система |
| test5 | Генерация изображений (Gemini Image + Imagen) | ⚠️ Требует billing | Итерация 15: 0/7 моделей на Free Tier |
| test6 | Генерация видео (Veo 2.0–3.1) | ✅ Работает (billing) | Итерация 19: Проксирование видео для просмотра |
