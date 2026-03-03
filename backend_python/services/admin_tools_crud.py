"""
Админ-инструменты — CRUD/DB операции.

Работа с таблицей AdministeredGroup: чтение, сохранение админов.
"""

from sqlalchemy.orm import Session
from typing import List, Dict
import json
import models


def get_all_administered_groups(db: Session) -> List[models.AdministeredGroup]:
    """Retrieves all administered groups from the database."""
    return db.query(models.AdministeredGroup).order_by(models.AdministeredGroup.name).all()


def _process_and_save_admins(db: Session, group: models.AdministeredGroup, managers_data: List[Dict]) -> models.AdministeredGroup:
    """Вспомогательная функция для сохранения админов в БД."""
    try:
        # Load existing admins to preserve history
        existing_admins_json = json.loads(group.admins_data) if group.admins_data else []
        existing_admins_map = {a['id']: a for a in existing_admins_json}
        
        new_admins_list = []
        
        creator_id = None
        creator_name = None

        # Process current managers from VK
        for manager in managers_data:
            user_id = manager['id']
            role = manager.get('role', 'unknown')
            
            if role == 'creator':
                creator_id = user_id
                creator_name = f"{manager.get('first_name', '')} {manager.get('last_name', '')}".strip()
            
            admin_obj = {
                'id': user_id,
                'first_name': manager.get('first_name', ''),
                'last_name': manager.get('last_name', ''),
                'role': role,
                'status': 'active',
                'permissions': manager.get('permissions', [])
            }
            
            new_admins_list.append(admin_obj)
            
            if user_id in existing_admins_map:
                del existing_admins_map[user_id]

        # Process remaining (inactive) admins
        for old_id, old_admin in existing_admins_map.items():
            old_admin['status'] = 'inactive'
            new_admins_list.append(old_admin)

        group.creator_id = creator_id
        group.creator_name = creator_name
        group.admins_data = json.dumps(new_admins_list, ensure_ascii=False)
        
        db.commit()
        db.refresh(group)
        return group
        
    except Exception as e:
        print(f"SERVICE: Error processing admin data: {e}")
        raise e
