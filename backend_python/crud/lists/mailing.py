
from sqlalchemy.orm import Session
from typing import List, Dict, Set, Optional
from datetime import datetime
import models
from models_library.vk_profiles import VkProfile
from models_library.dialogs_authors import ProjectDialog
from crud.lists.subscribers import _ensure_vk_profiles
from utils.db_retry import bulk_operation_with_retry, db_operation_with_retry

def bulk_upsert_mailing(db: Session, project_id: str, items: List[Dict]):
    """
    Обновление списка рассылки с retry-логикой.
    Использует ProjectDialog + VkProfile (нормализованная архитектура).
    
    Стратегия Split Upsert:
    1. Upsert VK-профилей через _ensure_vk_profiles
    2. Проверяет существование записей по project_id + vk_profile_id
    3. Новые записи → INSERT ProjectDialog
    4. Существующие → UPDATE (обновляем профиль, но сохраняем данные анализа и дату добавления)
    """
    if not items: return
    
    # 1. Обеспечиваем VK-профили
    vk_to_profile_id = _ensure_vk_profiles(db, items)
    
    # 2. Дедупликация по vk_user_id внутри пакета
    unique_map = {}
    for item in items:
        unique_map[item['vk_user_id']] = item
    deduped = list(unique_map.values())
    
    # 3. Проверяем, какие записи уже есть в базе
    profile_ids = [vk_to_profile_id[item['vk_user_id']] for item in deduped if item['vk_user_id'] in vk_to_profile_id]
    
    existing_profile_ids = set()
    CHUNK_SIZE = 500
    for i in range(0, len(profile_ids), CHUNK_SIZE):
        chunk = profile_ids[i:i + CHUNK_SIZE]
        found = db.query(ProjectDialog.vk_profile_id).filter(
            ProjectDialog.project_id == project_id,
            ProjectDialog.vk_profile_id.in_(chunk)
        ).all()
        existing_profile_ids.update(r[0] for r in found)

    # 4. Разделяем на INSERT и UPDATE
    to_insert = []
    to_update = []

    for item in deduped:
        profile_id = vk_to_profile_id.get(item['vk_user_id'])
        if not profile_id:
            continue
            
        if profile_id in existing_profile_ids:
            # UPDATE: обновляем профиль + last_message_date, но сохраняем added_at, source, first_message_*
            update_data = {
                'project_id': project_id,
                'vk_profile_id': profile_id,
            }
            # can_access_closed в старом формате → can_write в новом
            if 'can_access_closed' in item:
                update_data['can_write'] = item['can_access_closed']
            if 'last_message_date' in item:
                update_data['last_message_date'] = item['last_message_date']
            if 'updated_at' in item:
                update_data['updated_at'] = item['updated_at']
            
            to_update.append(update_data)
        else:
            # INSERT: строим запись ProjectDialog
            insert_data = {
                'project_id': project_id,
                'vk_profile_id': profile_id,
                'status': item.get('conversation_status', 'active'),
                'can_write': item.get('can_access_closed'),
                'first_message_date': item.get('first_message_date'),
                'last_message_date': item.get('last_message_date'),
                'first_message_from_id': item.get('first_message_from_id'),
                'source': item.get('source', 'sync'),
                'added_at': item.get('added_at'),
            }
            to_insert.append(insert_data)

    # 5. Выполняем UPDATE (по composite key: project_id + vk_profile_id)
    if to_update:
        for upd in to_update:
            update_fields = {k: v for k, v in upd.items() if k not in ('project_id', 'vk_profile_id')}
            if update_fields:
                db.query(ProjectDialog).filter(
                    ProjectDialog.project_id == upd['project_id'],
                    ProjectDialog.vk_profile_id == upd['vk_profile_id']
                ).update(update_fields, synchronize_session=False)
        db.commit()

    # 6. Выполняем INSERT
    if to_insert:
        def insert_chunk(chunk: List[Dict]):
            db.bulk_insert_mappings(ProjectDialog, chunk)
        
        bulk_operation_with_retry(
            db=db,
            items=to_insert,
            chunk_operation=insert_chunk,
            operation_name="bulk_insert_mailing",
            chunk_size=100,
            max_retries=3
        )

def get_mailing_user_by_vk_id(db: Session, project_id: str, vk_user_id: int) -> Optional[Dict]:
    """
    Получение одного пользователя рассылки по vk_user_id.
    Возвращает dict со всеми полями или None если не найден.
    Использует ProjectDialog + VkProfile.
    """
    # Ищем vk_profile_id по vk_user_id
    vp = db.query(VkProfile).filter(VkProfile.vk_user_id == vk_user_id).first()
    if not vp:
        return None
    
    row = db.query(ProjectDialog).filter(
        ProjectDialog.project_id == project_id,
        ProjectDialog.vk_profile_id == vp.id
    ).first()
    
    if not row:
        return None
    
    return {
        "vk_user_id": vp.vk_user_id,
        "first_name": vp.first_name,
        "last_name": vp.last_name,
        "photo_url": vp.photo_url,
        "sex": vp.sex,
        "bdate": vp.bdate,
        "city": vp.city,
        "country": vp.country,
        "platform": vp.platform,
        "last_seen": vp.last_seen,
        "domain": vp.domain,
        "is_closed": vp.is_closed,
        "can_access_closed": row.can_write,  # Backward compat
        "can_write_private_message": row.can_write,
        "deactivated": vp.deactivated,
        "has_mobile": vp.has_mobile,
        "added_at": row.added_at.isoformat() if row.added_at else None,
        "first_message_date": row.first_message_date.isoformat() if row.first_message_date else None,
        "first_message_from_id": row.first_message_from_id,
        "last_message_date": row.last_message_date.isoformat() if row.last_message_date else None,
        "conversation_status": row.status,
        "source": row.source,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def update_mailing_user_profile(db: Session, project_id: str, vk_user_id: int, vk_data: Dict) -> bool:
    """
    Обновляет профиль пользователя рассылки данными из VK API (users.get).
    В нормализованной архитектуре обновляет VkProfile.
    """
    vp = db.query(VkProfile).filter(VkProfile.vk_user_id == vk_user_id).first()
    if not vp:
        return False
    
    # Обновляем поля VkProfile из VK API users.get
    if 'first_name' in vk_data:
        vp.first_name = vk_data['first_name']
    if 'last_name' in vk_data:
        vp.last_name = vk_data['last_name']
    if 'sex' in vk_data:
        vp.sex = vk_data['sex']
    if 'photo_100' in vk_data:
        vp.photo_url = vk_data['photo_100']
    if 'deactivated' in vk_data:
        vp.deactivated = vk_data['deactivated']
    if 'domain' in vk_data:
        vp.domain = vk_data['domain']
    if 'bdate' in vk_data:
        vp.bdate = vk_data['bdate']
    if 'has_mobile' in vk_data:
        vp.has_mobile = bool(vk_data['has_mobile'])
    if 'is_closed' in vk_data:
        vp.is_closed = vk_data['is_closed']
    if 'can_access_closed' in vk_data:
        vp.can_access_closed = vk_data['can_access_closed']
    
    # city / country — объекты {id, title} в VK API
    if 'city' in vk_data and isinstance(vk_data['city'], dict):
        vp.city = vk_data['city'].get('title', '')
    if 'country' in vk_data and isinstance(vk_data['country'], dict):
        vp.country = vk_data['country'].get('title', '')
    
    # last_seen — объект {time, platform}
    if 'last_seen' in vk_data and isinstance(vk_data['last_seen'], dict):
        vp.last_seen = vk_data['last_seen'].get('time')
        vp.platform = vk_data['last_seen'].get('platform')
    
    # Обновляем also ProjectDialog.updated_at
    dialog = db.query(ProjectDialog).filter(
        ProjectDialog.project_id == project_id,
        ProjectDialog.vk_profile_id == vp.id
    ).first()
    if dialog:
        dialog.updated_at = datetime.utcnow()
        # can_write_private_message → can_write
        if 'can_write_private_message' in vk_data:
            dialog.can_write = bool(vk_data['can_write_private_message'])
    
    db.commit()
    return True

def get_all_mailing_vk_ids(db: Session, project_id: str) -> Set[int]:
    """Получает все VK ID пользователей рассылки проекта."""
    results = db.query(VkProfile.vk_user_id).join(
        ProjectDialog, ProjectDialog.vk_profile_id == VkProfile.id
    ).filter(
        ProjectDialog.project_id == project_id
    ).all()
    return {r[0] for r in results}

def delete_all_mailing(db: Session, project_id: str):
    """Полное удаление списка рассылки с retry-логикой."""
    
    def do_delete():
        db.query(ProjectDialog).filter(
            ProjectDialog.project_id == project_id
        ).delete(synchronize_session=False)
    
    db_operation_with_retry(
        db=db,
        operation=do_delete,
        operation_name="delete_all_mailing",
        max_retries=3
    )
    db.commit()
