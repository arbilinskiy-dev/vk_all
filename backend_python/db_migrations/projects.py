
from sqlalchemy import Engine, inspect, MetaData, Table, Column, String, Text, text
import json
from .utils import check_and_add_column
from models import ProjectContextField, ProjectContextValue, ProjectContextFieldVisibility

def migrate(engine: Engine):
    """Миграции, связанные с таблицей projects и контекстом."""
    inspector = inspect(engine)
    
    # Миграция 1: Добавить поле vk_confirmation_code
    check_and_add_column(engine, 'projects', 'vk_confirmation_code', 'VARCHAR')
    
    # Миграция 4: Добавить поля для отслеживания времени обновления
    check_and_add_column(engine, 'projects', 'last_published_update', 'VARCHAR')
    check_and_add_column(engine, 'projects', 'last_scheduled_update', 'VARCHAR')
    
    # Миграция 10: Добавить поле archived
    check_and_add_column(
        engine,
        'projects',
        'archived',
        'BOOLEAN DEFAULT FALSE NOT NULL' if 'sqlite' in engine.url.drivername else 'BOOLEAN DEFAULT FALSE'
    )
    
    # Миграция 11: Добавить поле sort_order
    check_and_add_column(engine, 'projects', 'sort_order', 'INTEGER')
    
    # Миграция 15: Добавить поле last_market_update
    check_and_add_column(engine, 'projects', 'last_market_update', 'VARCHAR')
    
    # Миграция 47: Добавить поле last_stories_update для отслеживания свежести данных историй
    check_and_add_column(engine, 'projects', 'last_stories_update', 'VARCHAR')

    # Миграция 34: Добавить поле additional_community_tokens
    check_and_add_column(engine, 'projects', 'additional_community_tokens', 'TEXT')
    
    # Миграция 46: Добавить поле avatar_url
    check_and_add_column(engine, 'projects', 'avatar_url', 'VARCHAR')

    # Миграция 48: Добавить поле teams (JSON-массив команд)
    check_and_add_column(engine, 'projects', 'teams', 'TEXT')
    
    # Миграция 48b: Перенос данных из team в teams
    _migrate_team_to_teams(engine)

    # Миграция 36 (Project Context): Создание таблиц
    if not inspector.has_table("project_context_fields"):
        print("Table 'project_context_fields' not found. Creating it...")
        ProjectContextField.__table__.create(engine)
        print("Table 'project_context_fields' created successfully.")
        
    if not inspector.has_table("project_context_values"):
        print("Table 'project_context_values' not found. Creating it...")
        ProjectContextValue.__table__.create(engine)
        print("Table 'project_context_values' created successfully.")

    # Миграция 37 (Project Context Visibility)
    check_and_add_column(
        engine,
        'project_context_fields',
        'is_global',
        'BOOLEAN DEFAULT TRUE NOT NULL' if 'sqlite' in engine.url.drivername else 'BOOLEAN DEFAULT TRUE'
    )

    if not inspector.has_table("project_context_field_visibility"):
        print("Table 'project_context_field_visibility' not found. Creating it...")
        ProjectContextFieldVisibility.__table__.create(engine)
        print("Table 'project_context_field_visibility' created successfully.")


def _migrate_team_to_teams(engine: Engine):
    """
    Миграция данных: переносит значение из старого поля team (строка) 
    в новое поле teams (JSON-массив).
    Выполняется только для проектов, где teams пустое, а team заполнено.
    """
    try:
        with engine.connect() as connection:
            # Находим проекты, где team заполнен, а teams ещё пустой
            result = connection.execute(
                text("SELECT id, team FROM projects WHERE team IS NOT NULL AND team != '' AND (teams IS NULL OR teams = '')")
            )
            rows = result.fetchall()
            
            if not rows:
                return
            
            print(f"Migrating 'team' -> 'teams' for {len(rows)} projects...")
            for row in rows:
                project_id = row[0]
                team_value = row[1]
                # Конвертируем строку в JSON-массив с одним элементом
                teams_json = json.dumps([team_value])
                connection.execute(
                    text("UPDATE projects SET teams = :teams WHERE id = :id"),
                    {"teams": teams_json, "id": project_id}
                )
            connection.commit()
            print(f"Migration 'team' -> 'teams' complete for {len(rows)} projects.")
    except Exception as e:
        print(f"Error during team->teams migration: {e}")
