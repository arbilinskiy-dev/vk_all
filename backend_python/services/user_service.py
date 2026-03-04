from sqlalchemy.orm import Session
from typing import List

import crud
import schemas

def get_all_users(db: Session) -> List[schemas.User]:
    """Получает всех пользователей из базы данных (с паролями для админа)."""
    users = crud.get_all_users(db)
    return [schemas.User.model_validate(u, from_attributes=True) for u in users]


def update_users(db: Session, users_data: List[schemas.User]):
    """Передает данные для массового обновления в CRUD слой."""
    crud.update_users(db, users_data)