"""
Модуль для получения приоритетных токенов-администраторов для работы с группами VK.

Логика:
1. При запросе токенов для группы — сначала проверяем кэш
2. Если в кэше нет или протух — идём в БД (administered_groups + system_accounts)
3. Сопоставляем admins_data с system_accounts по vk_user_id
4. Возвращаем отсортированный список: сначала токены админов группы, потом остальные
5. Сохраняем результат в кэш на 5 минут
"""

import re
import time
import json
import threading
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

from database import SessionLocal
import crud
from config import settings


# =============================================================================
# КОНФИГУРАЦИЯ КЭША
# =============================================================================

CACHE_TTL = 300  # 5 минут (в секундах)

# Глобальный кэш: { group_id: (timestamp, [TokenInfo, ...]) }
_admin_tokens_cache: Dict[int, Tuple[float, List['TokenInfo']]] = {}
_cache_lock = threading.Lock()


# =============================================================================
# СТРУКТУРЫ ДАННЫХ
# =============================================================================

@dataclass
class TokenInfo:
    """Информация о токене с признаком админства."""
    token: str
    name: str
    is_admin: bool  # Является ли владелец токена админом данной группы
    vk_user_id: Optional[int] = None
    admin_level: int = 0  # 0 - не админ, 1 - модератор, 2 - редактор, 3 - админ
    
    def to_dict(self) -> dict:
        return {
            'token': self.token,
            'name': self.name,
            'is_admin': self.is_admin,
            'vk_user_id': self.vk_user_id,
            'admin_level': self.admin_level
        }


# =============================================================================
# ОСНОВНЫЕ ФУНКЦИИ
# =============================================================================

def get_admin_tokens_for_group(group_id: int, include_non_admins: bool = True) -> List[TokenInfo]:
    """
    Получает список токенов для работы с указанной группой.
    Токены администраторов группы идут первыми (отсортированы по admin_level: 3 → 2 → 1).
    
    Args:
        group_id: ID группы VK (положительное число, без минуса)
        include_non_admins: Включать ли токены не-админов в конец списка (fallback)
    
    Returns:
        Список TokenInfo, отсортированный по приоритету
    """
    # Нормализуем group_id (убираем минус если есть)
    group_id = abs(int(group_id))
    
    # 1. Проверяем кэш
    cached = _get_from_cache(group_id)
    if cached is not None:
        if include_non_admins:
            return cached
        else:
            return [t for t in cached if t.is_admin]
    
    # 2. Загружаем из БД
    tokens = _load_tokens_for_group(group_id)
    
    # 3. Сохраняем в кэш
    _save_to_cache(group_id, tokens)
    
    # 4. Возвращаем результат
    if include_non_admins:
        return tokens
    else:
        return [t for t in tokens if t.is_admin]


def get_admin_token_strings_for_group(group_id: int, include_non_admins: bool = True) -> List[str]:
    """
    Упрощённая версия — возвращает только строки токенов (без метаданных).
    Удобно для передачи в существующие функции ротации.
    """
    tokens_info = get_admin_tokens_for_group(group_id, include_non_admins)
    return [t.token for t in tokens_info]


def invalidate_cache_for_group(group_id: int):
    """
    Принудительно сбрасывает кэш для указанной группы.
    Вызывать при обновлении administered_groups.
    """
    group_id = abs(int(group_id))
    with _cache_lock:
        if group_id in _admin_tokens_cache:
            del _admin_tokens_cache[group_id]
            print(f"ADMIN_TOKENS: Кэш для группы {group_id} очищен")


def invalidate_all_cache():
    """
    Полностью очищает кэш всех групп.
    Вызывать при массовом обновлении system_accounts или administered_groups.
    """
    with _cache_lock:
        _admin_tokens_cache.clear()
        print("ADMIN_TOKENS: Весь кэш очищен")


def warmup_cache_for_all_groups():
    """
    Прогревает кэш admin-токенов для ВСЕХ активных групп за один проход БД.
    
    Вместо N отдельных запросов (по одному на группу) делаем:
    1. Один SELECT — все administered_groups
    2. Один SELECT — все system_accounts
    3. Один SELECT — все проекты (для community tokens)
    4. В памяти сопоставляем и заполняем кэш
    
    Также предзаполняет кэш успешных токенов для stories.get:
    - Если у группы есть community token → stories.get кэшируется на первый community token
    - Если нет community token → stories.get кэшируется на ENV Token
    
    Это устраняет Error 15 spam на первом вызове stories.get.
    
    Вызывать перед массовым обновлением проектов (refresh_all_projects_task).
    """
    from .token_manager import _cache_success_token
    
    db = SessionLocal()
    try:
        import time as _time
        start = _time.time()
        
        # 1. Загружаем ВСЕ administered_groups
        from models import AdministeredGroup
        all_groups = db.query(AdministeredGroup).all()
        
        # 2. Загружаем ВСЕ системные аккаунты (один раз!)
        system_accounts = crud.get_all_accounts(db)
        
        # 3. Загружаем ВСЕ проекты (для community tokens)
        all_projects = crud.get_all_projects(db)
        
        # Строим словарь: numeric_group_id → [community_tokens]
        # vkProjectId может быть числовым или screen_name
        group_community_tokens: Dict[int, List[str]] = {}
        for proj in all_projects:
            vk_id_raw = getattr(proj, 'vkProjectId', None)
            if not vk_id_raw:
                continue
            # Парсим числовой ID (большинство проектов — числовые)
            sanitized = str(vk_id_raw).strip()
            # Поддерживаем оба домена: vk.com и vk.ru
            if 'vk.com/' in sanitized or 'vk.ru/' in sanitized:
                sanitized = re.split(r'vk\.(?:com|ru)/', sanitized)[-1].split('?')[0].split('#')[0]
            sanitized = sanitized.replace('@', '').replace('club', '').replace('public', '')
            if sanitized.startswith('-'):
                sanitized = sanitized[1:]
            if not sanitized.isdigit():
                continue  # screen_name — пропускаем, resolve будет при реальном вызове
            
            group_id_num = int(sanitized)
            tokens = []
            ct = getattr(proj, 'communityToken', None)
            if ct:
                tokens.append(str(ct))
            extra_raw = getattr(proj, 'additional_community_tokens', None)
            if extra_raw:
                try:
                    extras = json.loads(str(extra_raw))
                    if isinstance(extras, list):
                        tokens.extend([t for t in extras if t])
                except Exception:
                    pass
            if tokens:
                group_community_tokens[group_id_num] = tokens
        
        # Подготовка системных аккаунтов: фильтруем один раз
        active_accounts = []
        used_tokens_global = set()
        for acc in system_accounts:
            acc_status = getattr(acc, 'status', None)
            acc_token = getattr(acc, 'token', None)
            if acc_status != 'active' or not acc_token:
                continue
            token = str(acc_token)
            if token in used_tokens_global:
                continue
            used_tokens_global.add(token)
            active_accounts.append({
                'token': token,
                'name': str(getattr(acc, 'full_name', None) or f"Аккаунт {getattr(acc, 'vk_user_id', '?')}"),
                'vk_user_id': int(getattr(acc, 'vk_user_id', 0)) if getattr(acc, 'vk_user_id', None) else None
            })
        
        # Обработка каждой группы
        groups_cached = 0
        stories_prewarmed = 0
        
        for administered_group in all_groups:
            group_id = int(administered_group.id)
            
            # Парсим admins_data
            group_admin_vk_ids: Dict[int, int] = {}
            admins_data_raw = getattr(administered_group, 'admins_data', None)
            if admins_data_raw:
                try:
                    admins_data = json.loads(str(admins_data_raw))
                    for admin in admins_data:
                        if isinstance(admin, dict) and admin.get('status') == 'active':
                            vk_id = admin.get('id')
                            level = admin.get('admin_level', 0)
                            role = admin.get('role', '')
                            if role == 'creator':
                                level = 4
                            elif role == 'administrator' and level < 3:
                                level = 3
                            elif role == 'editor' and level < 2:
                                level = 2
                            elif role == 'moderator' and level < 1:
                                level = 1
                            if vk_id:
                                group_admin_vk_ids[vk_id] = level
                except json.JSONDecodeError:
                    pass
            
            # Сопоставляем с системными аккаунтами
            admin_tokens_list: List[TokenInfo] = []
            non_admin_tokens_list: List[TokenInfo] = []
            used_in_group = set()
            
            for acc_info in active_accounts:
                token = acc_info['token']
                if token in used_in_group:
                    continue
                used_in_group.add(token)
                
                vk_user_id = acc_info['vk_user_id']
                if vk_user_id and vk_user_id in group_admin_vk_ids:
                    admin_tokens_list.append(TokenInfo(
                        token=token,
                        name=acc_info['name'],
                        is_admin=True,
                        vk_user_id=vk_user_id,
                        admin_level=group_admin_vk_ids[vk_user_id]
                    ))
                else:
                    non_admin_tokens_list.append(TokenInfo(
                        token=token,
                        name=acc_info['name'],
                        is_admin=False,
                        vk_user_id=vk_user_id,
                        admin_level=0
                    ))
            
            # ENV Token
            if settings.vk_user_token and settings.vk_user_token not in used_in_group:
                used_in_group.add(settings.vk_user_token)
                env_is_admin = False
                env_admin_level = 0
                admin_sources_raw = getattr(administered_group, 'admin_sources', None)
                if admin_sources_raw:
                    try:
                        admin_sources = json.loads(str(admin_sources_raw))
                        for source in admin_sources:
                            if 'ENV' in source or 'Основной' in source:
                                env_is_admin = True
                                env_admin_level = 3
                                break
                    except json.JSONDecodeError:
                        pass
                
                token_info = TokenInfo(
                    token=settings.vk_user_token,
                    name="ENV Token (Основной)",
                    is_admin=env_is_admin,
                    vk_user_id=None,
                    admin_level=env_admin_level
                )
                if env_is_admin:
                    admin_tokens_list.append(token_info)
                else:
                    non_admin_tokens_list.append(token_info)
            
            # Сортировка и сохранение
            admin_tokens_list.sort(key=lambda t: -t.admin_level)
            result_tokens = admin_tokens_list + non_admin_tokens_list
            _save_to_cache(group_id, result_tokens)
            groups_cached += 1
            
            # === Прогрев кэша успешных токенов для stories.get ===
            # stories.get требует standalone-токен (ENV) или community token
            community_tokens = group_community_tokens.get(group_id, [])
            if community_tokens:
                # Есть community token — кэшируем первый
                _cache_success_token(group_id, 'stories.get', community_tokens[0])
                stories_prewarmed += 1
            elif settings.vk_user_token:
                # Нет community token — кэшируем ENV Token (единственный standalone)
                _cache_success_token(group_id, 'stories.get', settings.vk_user_token)
                stories_prewarmed += 1
            
            # === Прогрев wall.get — берём первый admin token ===
            if admin_tokens_list:
                _cache_success_token(group_id, 'wall.get', admin_tokens_list[0].token)
        
        elapsed = _time.time() - start
        print(f"WARMUP: Прогрев завершён за {elapsed:.2f}с — "
              f"{groups_cached} групп, {stories_prewarmed} stories.get предзаполнено")
        
    except Exception as e:
        print(f"WARMUP: Ошибка прогрева кэша: {e}")
        import traceback
        traceback.print_exc()
    finally:
        SessionLocal.remove()


def get_cache_stats() -> dict:
    """Возвращает статистику кэша для отладки."""
    with _cache_lock:
        now = time.time()
        stats = {
            'total_entries': len(_admin_tokens_cache),
            'groups': []
        }
        for group_id, (timestamp, tokens) in _admin_tokens_cache.items():
            age = now - timestamp
            stats['groups'].append({
                'group_id': group_id,
                'tokens_count': len(tokens),
                'admin_tokens_count': sum(1 for t in tokens if t.is_admin),
                'age_seconds': int(age),
                'expires_in': max(0, int(CACHE_TTL - age))
            })
        return stats


# =============================================================================
# ВНУТРЕННИЕ ФУНКЦИИ (КЭШИРОВАНИЕ)
# =============================================================================

def _get_from_cache(group_id: int) -> Optional[List[TokenInfo]]:
    """Получает данные из кэша, если они актуальны."""
    with _cache_lock:
        if group_id not in _admin_tokens_cache:
            return None
        
        timestamp, tokens = _admin_tokens_cache[group_id]
        age = time.time() - timestamp
        
        if age > CACHE_TTL:
            # Кэш протух — удаляем
            del _admin_tokens_cache[group_id]
            print(f"ADMIN_TOKENS: Кэш для группы {group_id} протух (возраст: {int(age)} сек)")
            return None
        
        print(f"ADMIN_TOKENS: Кэш HIT для группы {group_id} (возраст: {int(age)} сек)")
        return tokens


def _save_to_cache(group_id: int, tokens: List[TokenInfo]):
    """Сохраняет данные в кэш."""
    with _cache_lock:
        _admin_tokens_cache[group_id] = (time.time(), tokens)
        admin_count = sum(1 for t in tokens if t.is_admin)
        print(f"ADMIN_TOKENS: Кэш SAVE для группы {group_id}: {len(tokens)} токенов, {admin_count} админов")


# =============================================================================
# ВНУТРЕННИЕ ФУНКЦИИ (ЗАГРУЗКА ИЗ БД)
# =============================================================================

def _load_tokens_for_group(group_id: int) -> List[TokenInfo]:
    """
    Загружает и сопоставляет токены из БД.
    
    Источники данных:
    1. administered_groups.admins_data — список админов группы с их VK ID
    2. system_accounts — наши токены с привязкой к VK ID
    3. ENV токен — fallback
    """
    db = SessionLocal()
    admin_tokens: List[TokenInfo] = []
    non_admin_tokens: List[TokenInfo] = []
    used_tokens = set()  # Для избежания дубликатов
    
    try:
        # 1. Получаем информацию о группе
        from models import AdministeredGroup
        administered_group = db.query(AdministeredGroup).filter(
            AdministeredGroup.id == group_id
        ).first()
        
        # 2. Парсим admins_data — список реальных админов группы
        group_admin_vk_ids: Dict[int, int] = {}  # { vk_user_id: admin_level }
        admins_data_raw = getattr(administered_group, 'admins_data', None) if administered_group else None
        if admins_data_raw:
            try:
                admins_data = json.loads(str(admins_data_raw))
                for admin in admins_data:
                    if isinstance(admin, dict) and admin.get('status') == 'active':
                        vk_id = admin.get('id')
                        # admin_level из VK: 1-модератор, 2-редактор, 3-администратор
                        level = admin.get('admin_level', 0)
                        # Также проверяем роль
                        role = admin.get('role', '')
                        if role == 'creator':
                            level = 4  # Создатель — высший приоритет
                        elif role == 'administrator' and level < 3:
                            level = 3
                        elif role == 'editor' and level < 2:
                            level = 2
                        elif role == 'moderator' and level < 1:
                            level = 1
                        
                        if vk_id:
                            group_admin_vk_ids[vk_id] = level
            except json.JSONDecodeError:
                pass
        
        print(f"ADMIN_TOKENS: Группа {group_id} имеет {len(group_admin_vk_ids)} активных админов в admins_data")
        
        # 3. Получаем все системные аккаунты
        system_accounts = crud.get_all_accounts(db)
        
        # 4. Сопоставляем системные аккаунты с админами группы
        for acc in system_accounts:
            acc_status = getattr(acc, 'status', None)
            acc_token = getattr(acc, 'token', None)
            
            if acc_status != 'active' or not acc_token:
                continue
            
            token = str(acc_token)
            if token in used_tokens:
                continue
            used_tokens.add(token)
            
            acc_full_name = getattr(acc, 'full_name', None)
            acc_vk_user_id = getattr(acc, 'vk_user_id', None)
            name = str(acc_full_name) if acc_full_name else f"Аккаунт {acc_vk_user_id}"
            vk_user_id = int(acc_vk_user_id) if acc_vk_user_id else None
            
            # Проверяем, является ли этот аккаунт админом группы
            if vk_user_id and vk_user_id in group_admin_vk_ids:
                admin_level = group_admin_vk_ids[vk_user_id]
                admin_tokens.append(TokenInfo(
                    token=token,
                    name=name,
                    is_admin=True,
                    vk_user_id=vk_user_id,
                    admin_level=admin_level
                ))
                print(f"ADMIN_TOKENS: {name} (VK ID: {vk_user_id}) — АДМИН группы {group_id} (level={admin_level})")
            else:
                non_admin_tokens.append(TokenInfo(
                    token=token,
                    name=name,
                    is_admin=False,
                    vk_user_id=vk_user_id,
                    admin_level=0
                ))
        
        # 5. Добавляем ENV токен (если есть и не дубликат)
        if settings.vk_user_token and settings.vk_user_token not in used_tokens:
            used_tokens.add(settings.vk_user_token)
            
            # Проверяем, является ли ENV токен админом группы
            # Для этого нужно знать его vk_user_id — но у нас его нет в ENV
            # Используем admin_sources как fallback
            env_is_admin = False
            env_admin_level = 0
            
            admin_sources_raw = getattr(administered_group, 'admin_sources', None) if administered_group else None
            if admin_sources_raw:
                try:
                    admin_sources = json.loads(str(admin_sources_raw))
                    # Если "ENV Token (Основной)" есть в admin_sources — значит он админ
                    for source in admin_sources:
                        if 'ENV' in source or 'Основной' in source:
                            env_is_admin = True
                            env_admin_level = 3  # Предполагаем максимальный уровень
                            break
                except json.JSONDecodeError:
                    pass
            
            token_info = TokenInfo(
                token=settings.vk_user_token,
                name="ENV Token (Основной)",
                is_admin=env_is_admin,
                vk_user_id=None,
                admin_level=env_admin_level
            )
            
            if env_is_admin:
                admin_tokens.append(token_info)
                print(f"ADMIN_TOKENS: ENV Token — АДМИН группы {group_id}")
            else:
                non_admin_tokens.append(token_info)
        
        # 6. Сортируем админ-токены по уровню (4 → 3 → 2 → 1)
        admin_tokens.sort(key=lambda t: -t.admin_level)
        
        # 7. Объединяем: сначала админы, потом остальные
        result = admin_tokens + non_admin_tokens
        
        print(f"ADMIN_TOKENS: Итого для группы {group_id}: {len(admin_tokens)} админов, {len(non_admin_tokens)} остальных")
        
        return result
        
    except Exception as e:
        print(f"ADMIN_TOKENS: Ошибка загрузки токенов для группы {group_id}: {e}")
        import traceback
        traceback.print_exc()
        
        # Fallback: возвращаем все токены без приоритета
        return _get_all_tokens_fallback()
    finally:
        SessionLocal.remove()  # Корректно очищает thread-local scoped_session


def _get_all_tokens_fallback() -> List[TokenInfo]:
    """
    Fallback — возвращает все токены без информации об админстве.
    Используется при ошибках загрузки из БД.
    """
    tokens = []
    used = set()
    
    db = SessionLocal()
    try:
        # ENV токен
        if settings.vk_user_token:
            tokens.append(TokenInfo(
                token=settings.vk_user_token,
                name="ENV Token (Основной)",
                is_admin=False,
                admin_level=0
            ))
            used.add(settings.vk_user_token)
        
        # Системные аккаунты
        system_accounts = crud.get_all_accounts(db)
        for acc in system_accounts:
            acc_status = getattr(acc, 'status', None)
            acc_token = getattr(acc, 'token', None)
            acc_full_name = getattr(acc, 'full_name', None)
            acc_vk_user_id = getattr(acc, 'vk_user_id', None)
            
            if acc_status == 'active' and acc_token and acc_token not in used:
                token = str(acc_token)
                name = str(acc_full_name) if acc_full_name else f"Аккаунт {acc_vk_user_id}"
                vk_user_id = int(acc_vk_user_id) if acc_vk_user_id else None
                
                tokens.append(TokenInfo(
                    token=token,
                    name=name,
                    is_admin=False,
                    vk_user_id=vk_user_id,
                    admin_level=0
                ))
                used.add(token)
    finally:
        SessionLocal.remove()  # Корректно очищает thread-local scoped_session
    
    return tokens

