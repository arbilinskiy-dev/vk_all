"""
Миграция: создание таблиц dialog_labels и dialog_label_assignments.
Метки (ярлыки) для диалогов — внутреннее использование менеджерами.
"""

from sqlalchemy import Engine, inspect
from models_library.dialog_labels import DialogLabel, DialogLabelAssignment


def migrate(engine: Engine):
    """Создаёт таблицы dialog_labels и dialog_label_assignments если не существуют."""
    inspector = inspect(engine)

    if not inspector.has_table("dialog_labels"):
        print("  Creating table 'dialog_labels'...")
        DialogLabel.__table__.create(bind=engine)
        print("  ✓ Table 'dialog_labels' created.")
    else:
        print("  Table 'dialog_labels' already exists, skipping.")

    if not inspector.has_table("dialog_label_assignments"):
        print("  Creating table 'dialog_label_assignments'...")
        DialogLabelAssignment.__table__.create(bind=engine)
        print("  ✓ Table 'dialog_label_assignments' created.")
    else:
        print("  Table 'dialog_label_assignments' already exists, skipping.")
