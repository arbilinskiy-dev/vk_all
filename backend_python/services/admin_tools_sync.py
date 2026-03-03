"""
Админ-инструменты — синхронизация групп и админов через VK API.

Функции синхронизации администрируемых групп и их менеджеров.
"""

from sqlalchemy.orm import Session
from typing import List, Dict
from fastapi import HTTPException
import json
import models
import crud
from config import settings
from services.vk_api.api_client import call_vk_api as raw_vk_call
from services.admin_tools_crud import _process_and_save_admins


def sync_administered_groups(db: Session) -> Dict:
    """
    Scans all available tokens (ENV + System Accounts) for groups where they have admin rights.
    Updates existing records, adds new ones, and clears admin sources for lost groups.
    """
    print("SERVICE: Starting sync of administered groups...")
    
    # 1. Collect tokens with metadata
    tokens_map = {} # token -> "Account Name"
    
    # ENV Token
    if settings.vk_user_token:
        tokens_map[settings.vk_user_token] = "ENV Token (Основной)"
        
    # System Accounts
    system_accounts = crud.get_all_accounts(db)
    for acc in system_accounts:
        if acc.token and acc.status == 'active':
            tokens_map[acc.token] = f"{acc.full_name} (ID: {acc.vk_user_id})"

    if not tokens_map:
        return {"success": False, "message": "No active tokens found"}

    print(f"SERVICE: Found {len(tokens_map)} tokens to scan.")

    # 2. Fetch data from VK
    # Map: group_id -> { group_data, admin_sources: set() }
    aggregated_groups = {}
    
    processed_count = 0
    errors_count = 0

    for token, source_name in tokens_map.items():
        try:
            # groups.get with filter=admin
            response = raw_vk_call('groups.get', {
                'filter': 'admin',
                'extended': 1,
                'fields': 'members_count,activity,description,screen_name',
                'access_token': token,
                'count': 1000 # Max limit usually
            })
            
            items = response.get('items', [])
            print(f"  -> Token '{source_name}': found {len(items)} groups.")
            
            for group in items:
                gid = group['id']
                if gid not in aggregated_groups:
                    aggregated_groups[gid] = {
                        'data': group,
                        'sources': set()
                    }
                aggregated_groups[gid]['sources'].add(source_name)
            
            processed_count += 1
            
        except Exception as e:
            print(f"  -> Error scanning with token '{source_name}': {e}")
            errors_count += 1

    # 3. Update DB (Upsert + Mark Lost)
    try:
        # Получаем все текущие группы из БД, чтобы найти "потерянные"
        existing_groups_query = db.query(models.AdministeredGroup).all()
        existing_ids = {g.id for g in existing_groups_query}
        found_ids = set(aggregated_groups.keys())

        # А. Обновляем/Вставляем найденные группы
        for gid, info in aggregated_groups.items():
            g_data = info['data']
            sources_list = sorted(list(info['sources']))
            
            # Получаем существующий объект или создаем новый
            db_obj = db.query(models.AdministeredGroup).filter(models.AdministeredGroup.id == gid).first()
            
            if not db_obj:
                db_obj = models.AdministeredGroup(id=gid)
                db.add(db_obj)
            
            db_obj.name = g_data.get('name', 'Unknown')
            db_obj.screen_name = g_data.get('screen_name')
            db_obj.photo_200 = g_data.get('photo_200')
            db_obj.members_count = g_data.get('members_count', 0)
            db_obj.activity = g_data.get('activity')
            db_obj.description = g_data.get('description')
            db_obj.admin_sources = json.dumps(sources_list, ensure_ascii=False)

        # Б. Обрабатываем группы, доступ к которым потерян
        lost_ids = existing_ids - found_ids
        if lost_ids:
            print(f"SERVICE: Lost access to {len(lost_ids)} groups. Marking as lost.")
            db.query(models.AdministeredGroup).filter(
                models.AdministeredGroup.id.in_(lost_ids)
            ).update({
                models.AdministeredGroup.admin_sources: "[]"
            }, synchronize_session=False)

        db.commit()
        
        total_groups_in_db = db.query(models.AdministeredGroup).count()
        print(f"SERVICE: Sync complete. Total groups in DB: {total_groups_in_db}.")
        
        return {
            "success": True, 
            "total_groups": total_groups_in_db,
            "tokens_scanned": processed_count,
            "errors": errors_count
        }

    except Exception as e:
        db.rollback()
        print(f"SERVICE: DB Error saving administered groups: {e}")
        raise e


def sync_group_admins(db: Session, group_id: int) -> models.AdministeredGroup:
    """
    Fetches the list of administrators for a specific group.
    """
    print(f"SERVICE: Starting admins sync for group {group_id}...")
    
    group = db.query(models.AdministeredGroup).filter(models.AdministeredGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found in database.")

    # 1. Collect all potential tokens
    tokens = []
    if settings.vk_user_token:
        tokens.append(settings.vk_user_token)
    
    system_tokens = crud.get_active_account_tokens(db)
    tokens.extend(system_tokens)
    
    unique_tokens = list(set([t for t in tokens if t]))
    
    if not unique_tokens:
        raise HTTPException(status_code=400, detail="No active tokens found.")

    managers_data = None
    
    # 2. Try to fetch managers with each token
    for token in unique_tokens:
        try:
            # groups.getMembers with filter=managers returns the list of admins including the creator
            response = raw_vk_call('groups.getMembers', {
                'group_id': group_id,
                'filter': 'managers',
                'fields': 'role,permissions',
                'access_token': token
            })
            
            if response and 'items' in response:
                managers_data = response['items']
                break
        except Exception as e:
            continue

    if managers_data is None:
        raise HTTPException(status_code=403, detail="None of the available tokens have access to view group managers.")

    # 3. Process data (Helper function)
    return _process_and_save_admins(db, group, managers_data)
