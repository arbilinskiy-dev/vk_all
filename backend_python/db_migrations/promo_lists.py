"""
Миграция: создание таблиц promo_lists и promo_list_codes.
Списки промокодов для шаблонов сообщений сообщества.
"""

from sqlalchemy import Engine, inspect
from models import PromoList, PromoListCode


def migrate(engine: Engine):
    """Создаёт таблицы promo_lists и promo_list_codes если не существуют."""
    inspector = inspect(engine)

    # Сначала создаём родительскую таблицу
    if not inspector.has_table("promo_lists"):
        print("  Creating table 'promo_lists'...")
        PromoList.__table__.create(bind=engine)
        print("  ✓ Table 'promo_lists' created.")
    else:
        print("  Table 'promo_lists' already exists, skipping.")

    # Затем дочернюю
    if not inspector.has_table("promo_list_codes"):
        print("  Creating table 'promo_list_codes'...")
        PromoListCode.__table__.create(bind=engine)
        print("  ✓ Table 'promo_list_codes' created.")
    else:
        print("  Table 'promo_list_codes' already exists, skipping.")
