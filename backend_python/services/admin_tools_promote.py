"""
Админ-инструменты — массовое назначение администраторов в группах VK.

Логика promote_to_admins: вступление в группы и назначение ролей через VK API.
"""

from sqlalchemy.orm import Session
from typing import Dict
import json
import time as _time
import models
import crud
from config import settings
from services.vk_api.api_client import call_vk_api as raw_vk_call


def promote_to_admins(db: Session, group_ids: list, user_ids: list, role: str = 'administrator', include_env_token: bool = False) -> dict:
    """
    Массовое назначение системных страниц администраторами в группах VK.
    
    Алгоритм:
    1. Собираем все токены (ENV + System Accounts) → словарь user_id → token
    2. Для каждой группы находим токен действующего админа (из admin_sources или перебором)
    3. Для каждой группы батчем проверяем членство всех user_ids через groups.isMember
    4. Не-участников вступаем в группу через groups.join (токен самого пользователя)
    5. Не-админов назначаем через groups.editManager (токен действующего админа группы)
    """
    
    print(f"PROMOTE: Начинаю назначение {len(user_ids)} пользователей в {len(group_ids)} групп, роль={role}")
    
    # 1. Собираем карту токенов: vk_user_id → {token, name}
    user_tokens_map = {}  # int(vk_user_id) → {"token": str, "name": str}
    
    # ENV Token → определяем его user_id
    env_token_user_id = None
    if settings.vk_user_token:
        try:
            resp = raw_vk_call('users.get', {'access_token': settings.vk_user_token})
            if resp and isinstance(resp, list) and len(resp) > 0:
                env_token_user_id = resp[0]['id']
                user_tokens_map[env_token_user_id] = {
                    "token": settings.vk_user_token,
                    "name": f"{resp[0].get('first_name', '')} {resp[0].get('last_name', '')} (ENV)"
                }
        except Exception as e:
            print(f"PROMOTE: Ошибка получения user_id ENV токена: {e}")
    
    # System Accounts → у них уже есть vk_user_id
    system_accounts = crud.get_all_accounts(db)
    for acc in system_accounts:
        if acc.token and acc.status == 'active':
            uid = int(acc.vk_user_id) if acc.vk_user_id else None
            if uid:
                user_tokens_map[uid] = {
                    "token": acc.token,
                    "name": acc.full_name or f"ID:{uid}"
                }
    
    print(f"PROMOTE: Доступно {len(user_tokens_map)} токенов пользователей")
    
    # 1b. Если include_env_token — добавляем ENV-пользователя в список целей
    effective_user_ids = list(user_ids)
    if include_env_token and env_token_user_id and env_token_user_id not in effective_user_ids:
        effective_user_ids.append(env_token_user_id)
        print(f"PROMOTE: ENV-токен (user_id={env_token_user_id}) добавлен в список целей")
    
    # 2. Проверяем, что для запрошенных user_ids у нас есть токены
    target_users = {}  # user_id → {"token": str, "name": str}
    missing_tokens = []
    for uid in effective_user_ids:
        if uid in user_tokens_map:
            target_users[uid] = user_tokens_map[uid]
        else:
            missing_tokens.append(uid)
    
    if missing_tokens:
        print(f"PROMOTE: ВНИМАНИЕ — нет токенов для пользователей: {missing_tokens}")
    
    # 3. Загружаем информацию о группах из БД (имена)
    groups_map = {}  # group_id → name
    db_groups = db.query(models.AdministeredGroup).filter(
        models.AdministeredGroup.id.in_(group_ids)
    ).all()
    for g in db_groups:
        groups_map[g.id] = g.name
    
    # Для групп, которых нет в AdministeredGroup, подставляем ID как имя
    for gid in group_ids:
        if gid not in groups_map:
            groups_map[gid] = f"Группа {gid}"
    
    # 4. Для каждой группы находим токен действующего админа
    # Используем всю коллекцию user_tokens_map — любой пользователь с нашим токеном,
    # который уже является админом группы, может назначать других
    
    results = []
    admin_token_cache = {}  # gid → {"token": str, "name": str, "uid": int}
    
    for gid in group_ids:
        group_name = groups_map[gid]
        
        # 4a. Батч-проверка членства: groups.isMember с user_ids
        target_user_ids = list(target_users.keys())
        if not target_user_ids:
            continue
            
        membership = {}  # user_id → bool (является ли участником)
        
        # groups.isMember поддерживает до 500 user_ids за раз
        # Пробуем несколько токенов — первый попавшийся может не иметь доступа к закрытой группе
        check_token = None
        is_member_success = False
        
        for _uid, _info in user_tokens_map.items():
            try:
                resp = raw_vk_call('groups.isMember', {
                    'group_id': gid,
                    'user_ids': ','.join(str(u) for u in target_user_ids),
                    'access_token': _info["token"]
                })
                # Ответ: [{user_id: 123, member: 1}, ...]
                if isinstance(resp, list):
                    for item in resp:
                        membership[item['user_id']] = item.get('member', 0) == 1
                is_member_success = True
                print(f"PROMOTE: groups.isMember для группы {gid} — успех (токен {_info['name']})")
                break
            except Exception as e:
                # Пробуем следующий токен
                continue
        
        if not is_member_success:
            print(f"PROMOTE: Ни один токен не смог проверить членство в группе {gid}, считаем всех не-участниками")
            for uid in target_user_ids:
                membership[uid] = False
        
        _time.sleep(0.35)
        
        # 4b. Ищем админ-токен для группы ОДИН РАЗ (до цикла по пользователям)
        if gid not in admin_token_cache:
            found = _find_admin_token_for_group(db, gid, user_tokens_map)
            admin_token_cache[gid] = found  # может быть None
            if found:
                print(f"PROMOTE: Найден админ-токен для группы {group_name}: {found['name']} (uid={found['uid']})")
            else:
                print(f"PROMOTE: НЕ найден ни один админ-токен для группы {group_name}! Страницы вступят, но назначение невозможно.")
        
        # 4c. Вступаем в группу + назначаем админом
        for uid in target_user_ids:
            is_member = membership.get(uid, False)
            user_info = target_users.get(uid, {})
            user_name = user_info.get("name", f"ID:{uid}")
            user_token = user_info.get("token")
            
            if not user_token:
                results.append({
                    "group_id": gid, "group_name": group_name,
                    "user_id": uid, "user_name": user_name,
                    "was_member": is_member, "joined": False, "promoted": False,
                    "already_admin": False, "error": f"Нет токена для пользователя {uid}",
                    "recommendation": "Добавьте токен для этой системной страницы в разделе «Системные страницы»."
                })
                continue
            
            # --- Вступление ---
            joined = False
            was_already_member = is_member
            if not is_member:
                try:
                    raw_vk_call('groups.join', {
                        'group_id': gid,
                        'access_token': user_token
                    })
                    joined = True
                    is_member = True
                    print(f"  PROMOTE: {user_name} вступил в группу {group_name}")
                    _time.sleep(0.35)
                except Exception as e:
                    error_msg = str(e)
                    # Код 15 = «уже в сообществе» → не ошибка
                    if 'Code: 15' in error_msg or 'already in this community' in error_msg.lower():
                        print(f"  PROMOTE: {user_name} уже участник {group_name}, продолжаем назначение")
                        is_member = True
                        was_already_member = True
                    else:
                        print(f"  PROMOTE: Ошибка groups.join для {user_name} в {group_name}: {e}")
                        results.append({
                            "group_id": gid, "group_name": group_name,
                            "user_id": uid, "user_name": user_name,
                            "was_member": False, "joined": False, "promoted": False,
                            "already_admin": False, "error": f"Не удалось вступить: {error_msg}",
                            "recommendation": "Проверьте, не заблокирован ли пользователь в группе. Попробуйте вступить вручную."
                        })
                        continue
            
            # --- Назначение админом ---
            cached_admin = admin_token_cache.get(gid)
            
            # Если токен broken (Error 15 на предыдущем пользователе)
            if cached_admin and cached_admin.get("broken"):
                results.append({
                    "group_id": gid, "group_name": group_name,
                    "user_id": uid, "user_name": user_name,
                    "was_member": was_already_member, "joined": joined, "promoted": False,
                    "already_admin": False,
                    "error": f"Не удалось назначить: токен {cached_admin['name']} не имеет прав на groups.editManager",
                    "recommendation": f"Переавторизуйте страницу «{cached_admin['name']}» через Standalone-авторизацию (с правом 'groups'). Или назначьте вручную через VK."
                })
                continue
            
            admin_token = cached_admin["token"] if cached_admin else None
            
            if not admin_token:
                results.append({
                    "group_id": gid, "group_name": group_name,
                    "user_id": uid, "user_name": user_name,
                    "was_member": was_already_member, "joined": joined, "promoted": False,
                    "already_admin": False,
                    "error": "Нет токена администратора для этой группы",
                    "recommendation": "Ни одна из системных страниц не является админом этой группы. Назначьте одну из страниц админом вручную через VK, затем повторите."
                })
                continue
            
            promoted_ok = False
            edit_error = None
            
            try:
                raw_vk_call('groups.editManager', {
                    'group_id': gid,
                    'user_id': uid,
                    'role': role,
                    'access_token': admin_token
                })
                promoted_ok = True
                print(f"  PROMOTE: {user_name} назначен {role} в {group_name}")
                results.append({
                    "group_id": gid, "group_name": group_name,
                    "user_id": uid, "user_name": user_name,
                    "was_member": was_already_member, "joined": joined, "promoted": True,
                    "already_admin": False, "error": None, "recommendation": None
                })
                _time.sleep(0.35)
            except Exception as e:
                edit_error = str(e)
                # Код 224 = пользователь уже назначен менеджером
                already_admin = '224' in edit_error or 'already' in edit_error.lower()
                if already_admin:
                    promoted_ok = True
                    print(f"  PROMOTE: {user_name} уже админ в {group_name}")
                    results.append({
                        "group_id": gid, "group_name": group_name,
                        "user_id": uid, "user_name": user_name,
                        "was_member": was_already_member, "joined": joined, "promoted": False,
                        "already_admin": True, "error": None, "recommendation": None
                    })
            
            # Если editManager упал с Error 15 — токен не имеет scope 'groups'
            if not promoted_ok and edit_error and 'Code: 15' in edit_error:
                scope_error_msg = (
                    f"Не удалось назначить: токен {cached_admin['name']} не имеет прав на groups.editManager (Error 15)"
                )
                print(f"  PROMOTE: ⚠️ {scope_error_msg}")
                
                # Помечаем токен как broken
                cached_admin["broken"] = True
                
                results.append({
                    "group_id": gid, "group_name": group_name,
                    "user_id": uid, "user_name": user_name,
                    "was_member": was_already_member, "joined": joined, "promoted": False,
                    "already_admin": False, "error": scope_error_msg,
                    "recommendation": f"Переавторизуйте страницу «{cached_admin['name']}» через Standalone-авторизацию (с правом 'groups'). Или назначьте вручную через VK."
                })
            
            elif not promoted_ok and edit_error:
                print(f"  PROMOTE: Ошибка editManager для {user_name} в {group_name}: {edit_error}")
                results.append({
                    "group_id": gid, "group_name": group_name,
                    "user_id": uid, "user_name": user_name,
                    "was_member": was_already_member, "joined": joined, "promoted": False,
                    "already_admin": False, "error": f"Ошибка назначения: {edit_error}",
                    "recommendation": "Попробуйте назначить вручную через VK или обратитесь к администратору."
                })
    
    # 5. Формируем итоговую статистику
    promoted_count = sum(1 for r in results if r["promoted"])
    already_admin_count = sum(1 for r in results if r["already_admin"])
    joined_count = sum(1 for r in results if r["joined"])
    error_count = sum(1 for r in results if r["error"])
    
    print(f"PROMOTE: Итого — назначено: {promoted_count}, уже админы: {already_admin_count}, "
          f"вступили: {joined_count}, ошибки: {error_count}")
    
    return {
        "success": True,  # Операция выполнена — фронт анализирует results/error_count
        "total_pairs": len(results),
        "promoted_count": promoted_count,
        "already_admin_count": already_admin_count,
        "joined_count": joined_count,
        "error_count": error_count,
        "results": results
    }


def _find_admin_token_for_group(db: Session, group_id: int, user_tokens_map: dict) -> dict:
    """
    Находит токен пользователя, который является администратором указанной группы.
    Всегда верифицирует через живой API-вызов groups.getMembers.
    Возвращает {"token": str, "name": str, "uid": int} или None.
    """
    # Стратегия 1: Проверяем admins_data из БД как подсказку для приоритета
    priority_uids = []
    group = db.query(models.AdministeredGroup).filter(models.AdministeredGroup.id == group_id).first()
    
    if group and group.admins_data:
        admins = group.admins_data
        if isinstance(admins, str):
            try:
                import json
                admins = json.loads(admins)
            except:
                admins = []
        
        for admin in admins:
            admin_id = admin.get('id') if isinstance(admin, dict) else getattr(admin, 'id', None)
            admin_role = admin.get('role', '') if isinstance(admin, dict) else getattr(admin, 'role', '')
            if admin_role in ('creator', 'administrator') and admin_id in user_tokens_map:
                priority_uids.append(admin_id)
    
    # Стратегия 2: Верифицируем через groups.getMembers (живой API)
    # Сначала пробуем приоритетных, потом остальных
    all_uids = priority_uids + [uid for uid in user_tokens_map if uid not in priority_uids]
    
    for uid in all_uids:
        info = user_tokens_map[uid]
        try:
            resp = raw_vk_call('groups.getMembers', {
                'group_id': group_id,
                'filter': 'managers',
                'access_token': info["token"]
            })
            items = resp.get('items', []) if isinstance(resp, dict) else []
            # Ищем в списке менеджеров ЛЮБОГО нашего пользователя с ролью creator/administrator
            # Приоритет: сначала проверяем текущий uid
            for item in items:
                item_id = item.get('id')
                item_role = item.get('role', '')
                if item_id == uid and item_role in ('creator', 'administrator'):
                    print(f"  _find_admin: Подтверждён админ {info['name']} (uid={uid}) в группе {group_id} через API")
                    return {"token": info["token"], "name": info["name"], "uid": uid}
            # Если текущий uid не админ, но он получил список — ищем в списке другого нашего пользователя
            for item in items:
                item_id = item.get('id')
                item_role = item.get('role', '')
                if item_id in user_tokens_map and item_role in ('creator', 'administrator'):
                    other_info = user_tokens_map[item_id]
                    print(f"  _find_admin: Подтверждён админ {other_info['name']} (uid={item_id}) в группе {group_id} через API (найден из списка)")
                    return {"token": other_info["token"], "name": other_info["name"], "uid": item_id}
        except:
            continue
    
    return None
