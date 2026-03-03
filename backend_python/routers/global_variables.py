from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import traceback

import schemas
import services.global_variable_service as gv_service
from database import get_db

router = APIRouter()

@router.post("/getAllDefinitions", response_model=List[schemas.GlobalVariableDefinition])
def get_all_definitions(db: Session = Depends(get_db)):
    return gv_service.get_all_definitions(db)

@router.post("/updateAllDefinitions")
def update_all_definitions(payload: schemas.UpdateAllDefinitionsPayload, db: Session = Depends(get_db)):
    """    Обновляет все определения глобальных переменных.
    Возвращает маппинг {old_new_id: real_uuid} для новых определений,
    чтобы клиент мог обновить definition_id в значениях.
    """
    id_mapping = gv_service.update_all_definitions(db, payload.definitions)
    return {"success": True, "idMapping": id_mapping}

@router.post("/getForProject", response_model=schemas.GetGlobalVariablesForProjectResponse)
def get_for_project(payload: schemas.ProjectIdPayload, db: Session = Depends(get_db)):
    return gv_service.get_for_project(db, payload.projectId)

@router.post("/getForMultipleProjects", response_model=schemas.GetGlobalVariablesForMultipleProjectsResponse)
def get_for_multiple_projects(payload: schemas.ProjectIdsPayload, db: Session = Depends(get_db)):
    """Батч-загрузка значений глобальных переменных для нескольких проектов одним запросом."""
    return gv_service.get_for_multiple_projects(db, payload.projectIds)

@router.post("/updateForProject", response_model=schemas.GenericSuccess)
def update_for_project(payload: schemas.UpdateValuesForProjectPayload, db: Session = Depends(get_db)):
    try:
        print(f"GLOBAL_VARS: updateForProject called for project {payload.projectId}, values: {payload.values}")
        gv_service.update_for_project(db, payload.projectId, payload.values)
        return {"success": True}
    except Exception as e:
        print(f"GLOBAL_VARS ERROR: {e}")
        print(f"GLOBAL_VARS ERROR Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
