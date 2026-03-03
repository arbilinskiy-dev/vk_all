
from .client import generate_text
import json
import re
from typing import List, Dict

def get_corrected_text(text_to_correct: str, group_info: dict, dlvry_link: str) -> str:
    hashtag = f"#отзыв@{group_info.get('screen_name', '')}" if group_info.get('screen_name') else ''

    link_instruction = ""
    if dlvry_link:
        link_instruction = f"В самом конце, после благодарности, добавь ссылку на заказ в формате [{dlvry_link}| Оформить заказ]."

    full_text = text_to_correct.strip()

    prompt = (
        f"Твоя задача — отредактировать отзыв клиента. "
        f"1. Исправь все орфографические, пунктуационные и грамматические ошибки в тексте отзыва. "
        f"2. После исправленного текста отзыва, с новой пустой строки, добавь хештег: {hashtag}. "
        f"3. Затем, с новой пустой строки после хештега, напиши 2 предложения благодарности клиенту за его отзыв и заказ. "
        f"{link_instruction} "
        f"Верни только итоговый текст без каких-либо дополнительных комментариев, объяснений или заголовков. "
        f'Вот текст отзыва для обработки: "{full_text}"'
    )
    
    # ИЗМЕНЕНО: Используем 'CREATIVE' стратегию для более качественного текста благодарности.
    return generate_text(prompt, strategy='CREATIVE')


def get_bulk_corrected_texts(posts: List[Dict[str, str]], group_info: dict, dlvry_link: str) -> List[Dict[str, str]]:
    """
    Массовая коррекция текстов предложенных постов одним запросом к Gemini.
    Принимает список [{id, text}, ...], возвращает [{id, correctedText}, ...].
    """
    hashtag = f"#отзыв@{group_info.get('screen_name', '')}" if group_info.get('screen_name') else ''

    link_instruction = ""
    if dlvry_link:
        link_instruction = f"В самом конце каждого исправленного текста, после благодарности, добавь ссылку на заказ в формате [{dlvry_link}| Оформить заказ]."

    # Формируем блок с пронумерованными отзывами и их ID
    reviews_block = ""
    for post in posts:
        reviews_block += f'\n--- ОТЗЫВ ID: {post["id"]} ---\n{post["text"].strip()}\n'

    prompt = (
        f"Твоя задача — отредактировать НЕСКОЛЬКО отзывов клиентов. "
        f"Для КАЖДОГО отзыва выполни следующее:\n"
        f"1. Исправь все орфографические, пунктуационные и грамматические ошибки в тексте отзыва.\n"
        f"2. После исправленного текста отзыва, с новой пустой строки, добавь хештег: {hashtag}.\n"
        f"3. Затем, с новой пустой строки после хештега, напиши 2 предложения благодарности клиенту за его отзыв и заказ.\n"
        f"{link_instruction}\n\n"
        f"КРИТИЧЕСКИ ВАЖНО: Верни результат СТРОГО в формате JSON-массива. "
        f"Каждый элемент массива — объект с полями \"id\" (строка, ID отзыва) и \"correctedText\" (строка, исправленный текст). "
        f"НЕ добавляй никаких комментариев, пояснений или маркеров кода. Только чистый JSON.\n\n"
        f"Пример формата ответа:\n"
        f'[{{"id": "123", "correctedText": "Исправленный текст..."}}, {{"id": "456", "correctedText": "Другой текст..."}}]\n\n'
        f"Вот отзывы для обработки:{reviews_block}"
    )

    raw_response = generate_text(prompt, strategy='CREATIVE')

    # Парсим JSON из ответа нейронки
    return _parse_bulk_response(raw_response, posts)


def _parse_bulk_response(raw_response: str, original_posts: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """
    Надёжный парсер JSON-ответа от нейронки с fallback-логикой.
    """
    # Пробуем извлечь JSON из ```json ... ``` блока
    json_text = ""
    json_match = re.search(r"```json\s*([\s\S]*?)\s*```", raw_response)
    if json_match:
        json_text = json_match.group(1).strip()
    else:
        # Fallback: ищем JSON-массив напрямую
        start_index = raw_response.find('[')
        end_index = raw_response.rfind(']')
        if start_index != -1 and end_index != -1 and end_index > start_index:
            json_text = raw_response[start_index:end_index + 1].strip()
        else:
            json_text = raw_response.strip()

    try:
        results = json.loads(json_text)

        if not isinstance(results, list):
            raise ValueError("AI вернул не массив")

        # Валидируем, что каждый элемент содержит id и correctedText
        validated = []
        for item in results:
            if isinstance(item, dict) and 'id' in item and 'correctedText' in item:
                validated.append({
                    "id": str(item["id"]),
                    "correctedText": str(item["correctedText"])
                })

        return validated

    except (json.JSONDecodeError, ValueError) as e:
        print(f"⚠️ Ошибка парсинга bulk AI response: {e}")
        print(f"⚠️ Raw response: {raw_response[:500]}")
        raise Exception(f"Не удалось распарсить ответ AI: {e}")
