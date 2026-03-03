from sqlalchemy.orm import Session
from typing import List, Dict
import re

import crud
from schemas import GlobalVariableDefinition, GetGlobalVariablesForProjectResponse, ProjectGlobalVariableValue

def get_all_definitions(db: Session) -> List[GlobalVariableDefinition]:
    defs = crud.get_all_definitions(db)
    # ФИКС: Конвертируем ORM-объекты напрямую, чтобы избежать проблем с сессией
    result = []
    for d in defs:
        if d is not None:
            try:
                result.append(GlobalVariableDefinition(
                    id=str(d.id),
                    name=d.name,
                    placeholder_key=d.placeholder_key,
                    note=d.note
                ))
            except Exception:
                pass
    return result

def update_all_definitions(db: Session, definitions_data: List[GlobalVariableDefinition]) -> dict:
    """Обновляет все определения. Возвращает маппинг {old_new_id: real_uuid} для новых определений."""
    return crud.update_all_definitions(db, definitions_data)

def get_for_project(db: Session, project_id: str) -> GetGlobalVariablesForProjectResponse:
    defs = crud.get_all_definitions(db)
    values = crud.get_values_by_project_id(db, project_id)
    
    # ФИКС: Конвертируем ORM-объекты в Pydantic-модели сразу, пока сессия активна.
    # Это предотвращает ошибку "identity map is no longer valid" при параллельных запросах.
    # Фильтруем None значения, которые могут появиться при проблемах с БД.
    definitions_list = []
    for d in defs:
        if d is not None:
            try:
                definitions_list.append(GlobalVariableDefinition(
                    id=str(d.id),
                    name=d.name,
                    placeholder_key=d.placeholder_key,
                    note=d.note
                ))
            except Exception:
                pass  # Пропускаем невалидные записи
    
    values_list = []
    for v in values:
        if v is not None:
            try:
                # ФИКС: Передаем ВСЕ обязательные поля Pydantic-модели (id, project_id)
                values_list.append(ProjectGlobalVariableValue(
                    id=str(v.id),
                    project_id=str(v.project_id),
                    definition_id=str(v.definition_id),
                    value=v.value
                ))
            except Exception as e:
                print(f"GLOBAL_VARS WARNING: Failed to serialize value {v}: {e}")
                pass  # Пропускаем невалидные записи
    
    return GetGlobalVariablesForProjectResponse(
        definitions=definitions_list,
        values=values_list
    )

def get_for_multiple_projects(db: Session, project_ids: List[str]) -> dict:
    """
    Загружает определения и значения глобальных переменных для нескольких проектов
    одним запросом к БД вместо N отдельных.
    """
    defs = crud.get_all_definitions(db)
    all_values = crud.get_values_by_project_ids(db, project_ids)
    
    # Конвертируем определения
    definitions_list = []
    for d in defs:
        if d is not None:
            try:
                definitions_list.append(GlobalVariableDefinition(
                    id=str(d.id),
                    name=d.name,
                    placeholder_key=d.placeholder_key,
                    note=d.note
                ))
            except Exception:
                pass
    
    # Группируем значения по project_id
    values_by_project: dict[str, list] = {pid: [] for pid in project_ids}
    for v in all_values:
        if v is not None:
            try:
                pid = str(v.project_id)
                if pid in values_by_project:
                    # ФИКС: Передаем ВСЕ обязательные поля Pydantic-модели
                    values_by_project[pid].append(ProjectGlobalVariableValue(
                        id=str(v.id),
                        project_id=str(v.project_id),
                        definition_id=str(v.definition_id),
                        value=v.value
                    ))
            except Exception as e:
                print(f"GLOBAL_VARS WARNING: Failed to serialize value {v}: {e}")
                pass
    
    return {
        "definitions": definitions_list,
        "valuesByProject": values_by_project
    }

def update_for_project(db: Session, project_id: str, values_data: List[Dict[str, str]]):
    crud.update_values_for_project(db, project_id, values_data)

def substitute_global_variables(db: Session, text: str, project_id: str) -> str:
    """
    Находит плейсхолдеры {global_key} в тексте и заменяет их на значения для данного проекта.
    Если значение для проекта не найдено, заменяет на пустую строку.
    """
    if not text or '{global_' not in text:
        return text

    print(f"SERVICE: Substituting global variables for project {project_id}...")

    # Получаем все определения и значения для проекта за один раз для эффективности
    definitions = crud.get_all_definitions(db)
    project_values = crud.get_values_by_project_id(db, project_id)

    if not definitions:
        print("SERVICE: No global variable definitions found. Skipping substitution.")
        return text

    # Создаем удобные словари для быстрого поиска
    definitions_map = {d.placeholder_key: d.id for d in definitions}
    values_map = {v.definition_id: v.value for v in project_values}

    def replace_match(match):
        placeholder_key = match.group(1)
        definition_id = definitions_map.get(placeholder_key)
        
        if definition_id:
            # Если для этого проекта есть значение, используем его. Иначе - пустая строка.
            value = values_map.get(definition_id, '')
            print(f"  -> Found placeholder '{{global_{placeholder_key}}}'. Replacing with '{value}'.")
            return value
        
        # УЛУЧШЕНИЕ: Если определение для плейсхолдера было удалено,
        # заменяем его на пустую строку, чтобы избежать публикации "мусора" вида {global_...}
        print(f"  -> Found placeholder '{{global_{placeholder_key}}}' but no matching definition was found (it may have been deleted). Replacing with an empty string for safety.")
        return ''

    # Используем регулярное выражение для поиска всех плейсхолдеров {global_...}
    substituted_text = re.sub(r'\{global_(\w+)\}', replace_match, text)
    
    print("SERVICE: Substitution complete.")
    return substituted_text