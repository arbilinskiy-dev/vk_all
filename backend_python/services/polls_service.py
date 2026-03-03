# polls_service — Сервис для создания опросов через VK API.
# Вызывается «на лету» перед wall.post/wall.edit при наличии poll_data в аттачментах.
# Опрос создаётся через polls.create, затем его ID прикрепляется к посту.

import json
from typing import Optional
from services import vk_service


def create_vk_poll(poll_data: dict, owner_id: str, user_token: str, group_id: Optional[int] = None) -> str:
    """
    Создаёт опрос в VK через polls.create и возвращает строку для attachments (poll{owner_id}_{poll_id}).
    
    Args:
        poll_data: словарь с полями question, answers, is_anonymous, is_multiple, end_date, disable_unvote
        owner_id: ID владельца (строка, например "-12345" для сообщества)
        user_token: токен пользователя с правом wall
        group_id: числовой ID группы (для publish_with_admin_priority)
    
    Returns:
        Строка вида "poll{owner_id}_{poll_id}" для вставки в attachments
    """
    # Параметры для polls.create
    params = {
        'owner_id': owner_id,
        'question': poll_data.get('question', ''),
        'add_answers': json.dumps(poll_data.get('answers', []), ensure_ascii=False),
    }
    
    # Опциональные параметры
    if poll_data.get('is_anonymous'):
        params['is_anonymous'] = 1
    if poll_data.get('is_multiple'):
        params['is_multiple'] = 1
    if poll_data.get('end_date') and poll_data['end_date'] > 0:
        params['end_date'] = poll_data['end_date']
    if poll_data.get('disable_unvote'):
        params['disable_unvote'] = 1
    
    print(f"POLLS_SERVICE: Creating poll with params: question='{params['question']}', "
          f"answers={params['add_answers']}, owner_id={owner_id}", flush=True)
    
    # Вызываем VK API через ротацию токенов
    if group_id:
        response = vk_service.publish_with_admin_priority(
            params, method='polls.create', group_id=group_id, preferred_token=user_token
        )
    else:
        # Fallback — прямой вызов
        response = vk_service.call_vk_api('polls.create', params, user_token)
    
    poll_id = response.get('id')
    poll_owner_id = response.get('owner_id', owner_id)
    
    if not poll_id:
        raise Exception(f"VK API polls.create didn't return poll_id. Response: {response}")
    
    attachment_string = f"poll{poll_owner_id}_{poll_id}"
    print(f"POLLS_SERVICE: Poll created successfully: {attachment_string}", flush=True)
    
    return attachment_string


def resolve_poll_attachments(attachments_list: list, owner_id: str, user_token: str, group_id: int = None) -> list:
    """
    Обрабатывает список аттачментов: если есть аттачмент с type='poll' и poll_data,
    создаёт опрос в VK и заменяет черновой ID на реальный.
    
    Возвращает обновлённый список строк attachment ID для VK API.
    """
    result_ids = []
    
    for att in attachments_list:
        # Если это словарь (от Pydantic .model_dump()) 
        if isinstance(att, dict):
            att_type = att.get('type', '')
            att_id = att.get('id', '')
            poll_data = att.get('poll_data')
        else:
            # Если это Pydantic-модель
            att_type = getattr(att, 'type', '')
            att_id = getattr(att, 'id', '')
            poll_data = getattr(att, 'poll_data', None)
            if poll_data and hasattr(poll_data, 'model_dump'):
                poll_data = poll_data.model_dump()
        
        if att_type == 'poll' and poll_data:
            # Создаём опрос в VK и получаем реальный ID
            try:
                real_poll_id = create_vk_poll(poll_data, owner_id, user_token, group_id)
                result_ids.append(real_poll_id)
                print(f"POLLS_SERVICE: Replaced draft poll '{att_id}' with real '{real_poll_id}'", flush=True)
            except Exception as e:
                print(f"POLLS_SERVICE: ERROR creating poll: {e}", flush=True)
                # Не прикрепляем невалидный опрос — пост опубликуется без него
        else:
            # Обычный аттачмент — просто берём ID
            result_ids.append(att_id)
    
    return result_ids
