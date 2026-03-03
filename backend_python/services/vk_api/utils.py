import re
from typing import Optional

# Используем относительный импорт, так как все модули находятся в одном пакете
from .api_client import call_vk_api

# Кэш resolved group_id: vkProjectId → numeric_id
# Для screen_name (типа "sushimoji") кэшируем результат VK API,
# чтобы не делать повторный HTTP-запрос при каждом вызове.
# Для числовых ID кэш не нужен (int() и так мгновенный), но хранение не мешает.
_resolved_group_ids: dict[str, int] = {}

def vk_owner_id_string(group_id: int) -> str:
    """Returns the string owner_id for a community: '-{group_id}'."""
    return f"-{abs(int(group_id))}"

def resolve_vk_group_id(vk_project_id: str, user_token: str) -> int:
    """Resolves any vkProjectId format to a numeric group_id. Результат кэшируется."""
    raw_input = str(vk_project_id or '').strip()
    
    # Проверяем кэш по оригинальному входу
    if raw_input in _resolved_group_ids:
        return _resolved_group_ids[raw_input]
    
    sanitized_input = raw_input
    
    # Поддерживаем оба домена: vk.com и vk.ru
    if 'vk.com/' in sanitized_input or 'vk.ru/' in sanitized_input:
        sanitized_input = re.split(r'vk\.(?:com|ru)/', sanitized_input)[-1].split('?')[0].split('#')[0]

    sanitized_input = sanitized_input.replace('@', '').replace('club', '').replace('public', '')

    if sanitized_input.startswith('-'):
        sanitized_input = sanitized_input[1:]

    if sanitized_input.isdigit():
        result = int(sanitized_input)
        _resolved_group_ids[raw_input] = result
        return result

    resp = call_vk_api('groups.getById', {'group_id': sanitized_input, 'access_token': user_token})
    
    if not resp or not isinstance(resp, list) or not resp[0].get('id'):
        raise Exception(f"INVALID_DATA: Cannot resolve VK group by '{sanitized_input}'. Check 'vkProjectId'.")
    
    result = int(resp[0]['id'])
    _resolved_group_ids[raw_input] = result
    return result

def extract_vk_group_identifier(input_str: str) -> Optional[str]:
    """Extracts a group identifier (numeric or screen_name) from various string formats."""
    if not input_str:
        return None
    s = input_str.strip()

    if re.fullmatch(r'-?\d+', s):
        return s

    # Поддерживаем оба домена: vk.com и vk.ru
    match = re.search(r'(?:https?://)?(?:www\.)?vk\.(?:com|ru)/([^/?#]+)', s, re.IGNORECASE)
    tail = match.group(1) if match else s
    
    clean = re.sub(r'[?#].*$', '', tail)

    club_match = re.match(r'^(club|public|event)(\d+)$', clean, re.IGNORECASE)
    if club_match:
        return club_match.group(2)

    return clean if clean else None


def resolve_screen_name(screen_name: str, user_token: str) -> dict:
    """Resolves a screen name to an object_id and type using utils.resolveScreenName."""
    # The API method can handle numeric IDs as well, simplifying the logic.
    # It will just return the object for that ID.
    param = screen_name.lstrip('-')
    
    response = call_vk_api('utils.resolveScreenName', {
        'screen_name': param,
        'access_token': user_token
    })
    # An empty response {} means the name was not found
    return response if response else {}