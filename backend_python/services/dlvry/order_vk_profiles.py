"""
Управление VK-профилями при синхронизации заказов DLVRY.
Кеширование, upsert VkProfile и ProjectMember.
"""

from typing import Optional, Dict

from sqlalchemy.orm import Session

from models_library.vk_profiles import VkProfile
from models_library.members import ProjectMember

# Кеш vk_user_id → vk_profiles.id в рамках одного sync-запуска
_vk_profile_cache: Dict[int, int] = {}


def ensure_vk_profile_for_order(
    db: Session,
    vk_user_id_str: str,
    project_id: Optional[str],
) -> Optional[int]:
    """
    Гарантирует наличие VkProfile для vk_user_id.
    Upsert в project_members (source='dlvry_order') если есть project_id.
    Возвращает vk_profiles.id или None.
    """
    if not vk_user_id_str or not vk_user_id_str.strip() or not vk_user_id_str.isdigit():
        return None

    vk_uid = int(vk_user_id_str)
    if vk_uid <= 0:
        return None

    # Кеш
    if vk_uid in _vk_profile_cache:
        profile_id = _vk_profile_cache[vk_uid]
    else:
        # Поиск существующего
        row = db.query(VkProfile.id).filter(VkProfile.vk_user_id == vk_uid).first()
        if row:
            profile_id = row.id
        else:
            # Создаём минимальный профиль
            profile = VkProfile(vk_user_id=vk_uid)
            db.add(profile)
            db.flush()
            profile_id = profile.id
        _vk_profile_cache[vk_uid] = profile_id

    # Upsert project_members
    if project_id and profile_id:
        exists = db.query(ProjectMember.id).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.vk_profile_id == profile_id,
        ).first()
        if not exists:
            member = ProjectMember(
                project_id=project_id,
                vk_profile_id=profile_id,
                status='customer',
                source='dlvry_order',
            )
            db.add(member)

    return profile_id
