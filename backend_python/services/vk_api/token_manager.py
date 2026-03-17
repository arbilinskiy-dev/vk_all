
from typing import List, Dict, Any, Optional, Union
from database import SessionLocal
import crud
from config import settings
# Импортируем низкоуровневый клиент как _raw_call
from .api_client import call_vk_api as _raw_call_vk_api, VkApiError
import requests as _requests
import time as _time
import threading as _threading
# Импортируем модуль приоритетных токенов для групп
from .admin_tokens import get_admin_tokens_for_group, get_admin_token_strings_for_group, TokenInfo


# =============================================================================
# КЭШ УСПЕШНЫХ ТОКЕНОВ ДЛЯ (group_id, method)
# =============================================================================
# При ротации токенов запоминаем, какой токен успешно сработал для данной
# комбинации (группа, метод). При следующем вызове ставим его первым в очередь.
# Это устраняет бесполезный перебор токенов, которые заведомо не подходят
# (например, non-standalone токены для stories.get → Error 15).

_success_token_cache: Dict[str, tuple] = {}  # "group_id:method" → (timestamp, token_str)
_success_cache_lock = _threading.Lock()
_SUCCESS_CACHE_TTL = 600  # 10 минут


def _get_cached_success_token(group_id: int, method: str) -> Optional[str]:
    """Возвращает токен, который ранее успешно сработал для данной группы и метода."""
    key = f"{group_id}:{method}"
    with _success_cache_lock:
        if key in _success_token_cache:
            ts, token = _success_token_cache[key]
            if _time.time() - ts < _SUCCESS_CACHE_TTL:
                return token
            del _success_token_cache[key]
    return None


def _cache_success_token(group_id: int, method: str, token: str):
    """Запоминает успешный токен для данной группы и метода."""
    key = f"{group_id}:{method}"
    with _success_cache_lock:
        _success_token_cache[key] = (_time.time(), token)


def get_candidate_tokens(preferred_token: Optional[str] = None) -> List[str]:
    """
    Вспомогательная функция для сбора списка токенов в порядке приоритета.
    1. Preferred token (если передан).
    2. ENV token.
    3. System tokens (Active).
    Возвращает список уникальных токенов.
    """
    tokens = []
    if preferred_token:
        tokens.append(preferred_token)
    
    if settings.vk_user_token:
        tokens.append(settings.vk_user_token)
        
    db = SessionLocal()
    try:
        system_tokens = crud.get_active_account_tokens(db)
        tokens.extend(system_tokens)
    except Exception as e:
        print(f"VK_SERVICE: Error fetching system tokens: {e}")
    finally:
        SessionLocal.remove()  # Корректно очищает thread-local scoped_session
        
    # Удаляем дубликаты, сохраняя порядок
    seen = set()
    unique_tokens = []
    for t in tokens:
        if t and t not in seen:
            unique_tokens.append(t)
            seen.add(t)
            
    return unique_tokens

def call_vk_api(method: str, params: Dict[str, Any], project_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Высокоуровневая обертка над вызовом API VK с инвертированным механизмом Token Rotation.
    Сначала используются токены системных аккаунтов, а токен из .env - как резервный.
    """
    fallback_token_from_env = params.get('access_token')
    last_exception = None

    # 1. Получаем основные токены (Системные аккаунты)
    db = SessionLocal()
    primary_system_tokens = []
    try:
        primary_system_tokens = crud.get_active_account_tokens(db)
    except Exception as db_err:
        print(f"VK_SERVICE: Ошибка получения токенов из БД: {db_err}")
    finally:
        SessionLocal.remove()  # Корректно очищает thread-local scoped_session

    # 2. Пытаемся выполнить запрос с токенами системных аккаунтов
    if primary_system_tokens:
        api_params = params.copy()
        
        for token in primary_system_tokens:
            try:
                api_params['access_token'] = token
                result = _raw_call_vk_api(method, api_params, project_id=project_id)
                return result
            except VkApiError as e:
                last_exception = e
                continue
            except _requests.exceptions.RequestException as e:
                # Сетевая ошибка — пробуем следующий токен
                print(f"VK_SERVICE: Сетевая ошибка с токеном ...{token[-4:]}: {e}")
                last_exception = e
                continue
    
    # 3. Если все системные токены не сработали (или их не было), используем резервный токен из .env
    if fallback_token_from_env:
        try:
            return _raw_call_vk_api(method, params, project_id=project_id)
        except VkApiError as e:
            last_exception = e
        except _requests.exceptions.RequestException as e:
            print(f"VK_SERVICE: Сетевая ошибка с ENV-токеном: {e}")
            last_exception = e
    else:
        print("VK_SERVICE: Резервный токен из .env не предоставлен.")

    # 4. Если ничего не помогло, пробрасываем последнюю пойманную ошибку
    if last_exception:
        raise last_exception
    
    raise VkApiError("Нет доступных токенов (ни системных, ни из .env) для выполнения API запроса.", -1)


def publish_with_fallback(params: Dict[str, Any], method: str = 'wall.post', preferred_token: Optional[str] = None, project_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Специализированная функция для публикации/редактирования постов с агрессивной ротацией токенов.
    """
    last_exception = None
    unique_tokens = get_candidate_tokens(preferred_token)

    print(f"VK_SERVICE [PUBLISH]: Starting attempt for {method}. {len(unique_tokens)} tokens available.")

    for token in unique_tokens:
        try:
            current_params = params.copy()
            current_params['access_token'] = token
            
            result = _raw_call_vk_api(method, current_params, project_id=project_id)
            print(f"VK_SERVICE [PUBLISH]: Success with token ending in ...{token[-4:]}!")
            return result

        except VkApiError as e:
            print(f"VK_SERVICE [PUBLISH]: Failed with token ...{token[-4:]}. Error: {e}")
            last_exception = e
            # Если ошибка параметров, нет смысла менять токен
            if e.code in {100}: 
                 raise e
            continue
            
    if last_exception:
        raise last_exception
        
    raise VkApiError("No tokens available for publication", -1)


# =============================================================================
# ФУНКЦИИ С ПРИОРИТЕТОМ АДМИН-ТОКЕНОВ ДЛЯ КОНКРЕТНОЙ ГРУППЫ
# =============================================================================

def call_vk_api_for_group(
    method: str, 
    params: Dict[str, Any], 
    group_id: Union[int, str],
    project_id: Optional[str] = None,
    community_tokens: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Вызов VK API с приоритетом токенов-администраторов указанной группы.
    
    Логика выбора токенов:
    1. Если переданы community_tokens — используем ТОЛЬКО их (без user/admin токенов)
    2. Если community_tokens пуст — стандартная ротация admin → user токенов
    
    Args:
        method: Метод VK API (например 'wall.post')
        params: Параметры запроса (access_token будет перезаписан)
        group_id: ID группы VK (положительное число или строка)
        project_id: ID проекта для логирования (опционально)
        community_tokens: Список токенов сообщества (если есть — используются ЭКСКЛЮЗИВНО)
    
    Returns:
        Ответ VK API
        
    Raises:
        VkApiError: Если все токены не сработали
    """
    # Нормализуем group_id
    group_id_int = abs(int(group_id))
    
    if community_tokens:
        # Режим «только токены сообщества»
        from .admin_tokens import TokenInfo
        tokens_info = [
            TokenInfo(token=t, name=f"Community Token #{i+1}", is_admin=True, admin_level=5)
            for i, t in enumerate(community_tokens)
        ]
        print(f"VK_SERVICE [GROUP {group_id_int}]: {method} — {len(tokens_info)} токенов сообщества (эксклюзивный режим)")
    else:
        # Стандартный режим: токены админов/пользователей
        tokens_info = get_admin_tokens_for_group(group_id_int, include_non_admins=True)
        
        if not tokens_info:
            raise VkApiError("Нет доступных токенов для выполнения запроса", -1)
        
        admin_count = sum(1 for t in tokens_info if t.is_admin)
        print(f"VK_SERVICE [GROUP {group_id_int}]: {method} — {len(tokens_info)} токенов ({admin_count} админов)")
        
        # Оптимизация: если для этой (группа, метод) уже есть успешный токен — ставим первым
        cached_token = _get_cached_success_token(group_id_int, method)
        if cached_token:
            for i, ti in enumerate(tokens_info):
                if ti.token == cached_token:
                    tokens_info.insert(0, tokens_info.pop(i))
                    print(f"VK_SERVICE [GROUP {group_id_int}]: {method} — кэш успеха: приоритет → {ti.name}")
                    break
    
    last_exception = None
    api_params = params.copy()
    
    for token_info in tokens_info:
        try:
            api_params['access_token'] = token_info.token
            result = _raw_call_vk_api(method, api_params, project_id=project_id)
            
            admin_mark = "👑" if token_info.is_admin else "👤"
            print(f"VK_SERVICE [GROUP {group_id_int}]: ✓ Успех с {admin_mark} {token_info.name}")
            
            # Кэшируем успешный токен для этой группы и метода
            _cache_success_token(group_id_int, method, token_info.token)
            
            return result
            
        except VkApiError as e:
            admin_mark = "👑" if token_info.is_admin else "👤"
            print(f"VK_SERVICE [GROUP {group_id_int}]: ✗ {admin_mark} {token_info.name} — {e}")
            last_exception = e
            
            # Критические ошибки — не пробуем другие токены
            # Код 14 (капча) НЕ критический: капча привязана к токену, другой токен может сработать
            if e.code in {100}:  # Invalid parameters — бессмысленно пробовать другие токены
                raise e
            continue
            
        except _requests.exceptions.RequestException as e:
            # Сетевая ошибка (таймаут, SSL, сброс соединения) — пробуем следующий токен
            admin_mark = "👑" if token_info.is_admin else "👤"
            print(f"VK_SERVICE [GROUP {group_id_int}]: ✗ {admin_mark} {token_info.name} — Сеть: {e}")
            last_exception = e
            continue
    
    if last_exception:
        raise last_exception
    
    raise VkApiError(f"Все токены не сработали для группы {group_id_int}", -1)


def publish_with_admin_priority(
    params: Dict[str, Any], 
    method: str = 'wall.post',
    group_id: Optional[Union[int, str]] = None,
    preferred_token: Optional[str] = None,
    project_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Публикация/редактирование с приоритетом токенов-администраторов группы.
    
    Отличия от publish_with_fallback:
    - Если указан group_id — сначала пробуем токены админов этой группы
    - Если group_id не указан или автоопределение не удалось — fallback на обычную ротацию
    
    Args:
        params: Параметры запроса (должен содержать owner_id для автоопределения группы)
        method: Метод VK API
        group_id: ID группы (опционально, можно определить из owner_id)
        preferred_token: Предпочтительный токен (будет в начале списка)
        project_id: ID проекта для логирования
    
    Returns:
        Ответ VK API
    """
    # Пробуем определить group_id из параметров если не передан явно
    if group_id is None:
        owner_id = params.get('owner_id')
        if owner_id:
            try:
                # owner_id для групп отрицательный (-12345)
                group_id = abs(int(owner_id))
            except (ValueError, TypeError):
                pass
    
    # Если не удалось определить группу — используем обычную ротацию
    if group_id is None:
        print(f"VK_SERVICE [PUBLISH]: group_id не определён, используем обычную ротацию")
        return publish_with_fallback(params, method, preferred_token, project_id)
    
    group_id_int = abs(int(group_id))
    
    # Получаем приоритетный список токенов
    tokens_info = get_admin_tokens_for_group(group_id_int, include_non_admins=True)
    
    # Если есть preferred_token — определяем его позицию на основе admin-статуса
    if preferred_token:
        # Проверяем, является ли preferred_token админом этой группы
        existing = next((t for t in tokens_info if t.token == preferred_token), None)
        is_preferred_admin = existing.is_admin if existing else False
        
        # Убираем его из списка если уже есть
        tokens_info = [t for t in tokens_info if t.token != preferred_token]
        
        if is_preferred_admin:
            # Админ — ставим первым (высший приоритет)
            tokens_info.insert(0, TokenInfo(
                token=preferred_token,
                name="Preferred Token (admin)",
                is_admin=True,
                admin_level=99
            ))
        else:
            # НЕ админ — ставим ПОСЛЕ всех админов, чтобы сначала пробовались админские токены
            # (VK API молча удаляет вложения если токен не админ группы)
            first_non_admin_idx = next(
                (i for i, t in enumerate(tokens_info) if not t.is_admin),
                len(tokens_info)
            )
            tokens_info.insert(first_non_admin_idx, TokenInfo(
                token=preferred_token,
                name="Preferred Token (non-admin)",
                is_admin=False,
                admin_level=0
            ))
            print(f"VK_SERVICE [PUBLISH GROUP {group_id_int}]: preferred_token НЕ админ — перемещён после {first_non_admin_idx} админ-токенов")
    
    if not tokens_info:
        raise VkApiError("Нет доступных токенов для публикации", -1)
    
    admin_count = sum(1 for t in tokens_info if t.is_admin)
    print(f"VK_SERVICE [PUBLISH GROUP {group_id_int}]: {method} — {len(tokens_info)} токенов ({admin_count} админов)")
    
    last_exception = None
    
    for token_info in tokens_info:
        try:
            current_params = params.copy()
            current_params['access_token'] = token_info.token
            
            result = _raw_call_vk_api(method, current_params, project_id=project_id)
            
            admin_mark = "👑" if token_info.is_admin else "👤"
            print(f"VK_SERVICE [PUBLISH GROUP {group_id_int}]: ✓ Успех с {admin_mark} {token_info.name}")
            return result
            
        except VkApiError as e:
            admin_mark = "👑" if token_info.is_admin else "👤"
            print(f"VK_SERVICE [PUBLISH GROUP {group_id_int}]: ✗ {admin_mark} {token_info.name} — {e}")
            last_exception = e
            
            # Критические ошибки — не пробуем другие токены
            # Код 14 (капча) НЕ критический: капча привязана к токену, другой токен может сработать
            if e.code in {100}:  # Invalid parameters — бессмысленно пробовать другие токены
                raise e
            continue
    
    if last_exception:
        raise last_exception
    
    raise VkApiError(f"Все токены не сработали для публикации в группу {group_id_int}", -1)

