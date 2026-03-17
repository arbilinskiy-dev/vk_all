"""
API-роутер модуля «Личный кабинет / Команда».
Доступ: admin only (кроме /my-profile).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from services.auth_middleware import get_current_admin, get_current_user, CurrentUser
from crud import team_crud
from schemas.models import team as s

router = APIRouter(prefix="/team", tags=["Team / HR"])


# ═══════════════════════════════════════════════════
#  МОЙ ПРОФИЛЬ (доступ для всех авторизованных)
# ═══════════════════════════════════════════════════

@router.get("/my-profile", response_model=Optional[s.Employee])
def get_my_profile(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """Получить карточку текущего пользователя (по user_id из сессии)."""
    return team_crud.get_employee_by_user_id(db, user.user_id)


@router.patch("/my-profile", response_model=s.Employee)
def update_my_profile(
    data: s.EmployeeUpdate,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """Обновить свой профиль (без HR-полей)."""
    emp = team_crud.get_employee_by_user_id(db, user.user_id)
    if not emp:
        raise HTTPException(404, "Карточка сотрудника не найдена")
    # Удаляем HR-поля из set, чтобы model_dump(exclude_unset=True) их не включал
    _HR_FIELDS = {"inn", "passport_series", "passport_number", "snils",
                  "status", "employment_type", "position_id", "department_id", "supervisor_id"}
    data.__pydantic_fields_set__ -= _HR_FIELDS
    return team_crud.update_employee(db, emp.id, data)


# ═══════════════════════════════════════════════════
#  КОНСТРУКТОР — сводка (admin)
# ═══════════════════════════════════════════════════

@router.get("/constructor", response_model=s.ConstructorOverview)
def get_constructor(
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.get_constructor_overview(db)


# ═══════════════════════════════════════════════════
#  CONTACT TYPES (admin)
# ═══════════════════════════════════════════════════

@router.get("/contact-types", response_model=List[s.ContactType])
def list_contact_types(
    active_only: bool = False,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.list_contact_types(db, active_only)

@router.post("/contact-types", response_model=s.ContactType)
def create_contact_type(
    data: s.ContactTypeCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.create_contact_type(db, data)

@router.patch("/contact-types/{ct_id}", response_model=s.ContactType)
def update_contact_type(
    ct_id: str,
    data: s.ContactTypeUpdate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    result = team_crud.update_contact_type(db, ct_id, data)
    if not result:
        raise HTTPException(404, "Тип контакта не найден")
    return result

@router.delete("/contact-types/{ct_id}")
def delete_contact_type(
    ct_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_contact_type(db, ct_id):
        raise HTTPException(404, "Тип контакта не найден")
    return {"ok": True}


# ═══════════════════════════════════════════════════
#  SECTION TYPES (admin)
# ═══════════════════════════════════════════════════

@router.get("/section-types", response_model=List[s.SectionType])
def list_section_types(
    active_only: bool = False,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.list_section_types(db, active_only)

@router.post("/section-types", response_model=s.SectionType)
def create_section_type(
    data: s.SectionTypeCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.create_section_type(db, data)

@router.patch("/section-types/{st_id}", response_model=s.SectionType)
def update_section_type(
    st_id: str,
    data: s.SectionTypeUpdate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    result = team_crud.update_section_type(db, st_id, data)
    if not result:
        raise HTTPException(404, "Тип секции не найден")
    return result

@router.delete("/section-types/{st_id}")
def delete_section_type(
    st_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_section_type(db, st_id):
        raise HTTPException(404, "Тип секции не найден")
    return {"ok": True}


# ═══════════════════════════════════════════════════
#  CATEGORIES (generic — competency / regulation / training / test)
# ═══════════════════════════════════════════════════

VALID_CAT_TYPES = {"competency", "regulation", "training", "test"}

def _validate_cat_type(cat_type: str):
    if cat_type not in VALID_CAT_TYPES:
        raise HTTPException(400, f"Неверный тип категории: {cat_type}")

@router.get("/categories/{cat_type}", response_model=List[s.Category])
def list_categories(
    cat_type: str,
    active_only: bool = False,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    _validate_cat_type(cat_type)
    return team_crud.list_categories(db, cat_type, active_only)

@router.post("/categories/{cat_type}", response_model=s.Category)
def create_category(
    cat_type: str,
    data: s.CategoryCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    _validate_cat_type(cat_type)
    return team_crud.create_category(db, cat_type, data)

@router.patch("/categories/{cat_type}/{cat_id}", response_model=s.Category)
def update_category(
    cat_type: str,
    cat_id: str,
    data: s.CategoryUpdate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    _validate_cat_type(cat_type)
    result = team_crud.update_category(db, cat_type, cat_id, data)
    if not result:
        raise HTTPException(404, "Категория не найдена")
    return result

@router.delete("/categories/{cat_type}/{cat_id}")
def delete_category(
    cat_type: str,
    cat_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    _validate_cat_type(cat_type)
    if not team_crud.delete_category(db, cat_type, cat_id):
        raise HTTPException(404, "Категория не найдена")
    return {"ok": True}


# ═══════════════════════════════════════════════════
#  COMPETENCIES (admin)
# ═══════════════════════════════════════════════════

@router.get("/competencies", response_model=List[s.Competency])
def list_competencies(
    category_id: Optional[str] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.list_competencies(db, category_id, active_only)

@router.post("/competencies", response_model=s.Competency)
def create_competency(
    data: s.CompetencyCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.create_competency(db, data)

@router.patch("/competencies/{comp_id}", response_model=s.Competency)
def update_competency(
    comp_id: str,
    data: s.CompetencyUpdate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    result = team_crud.update_competency(db, comp_id, data)
    if not result:
        raise HTTPException(404, "Навык не найден")
    return result

@router.delete("/competencies/{comp_id}")
def delete_competency(
    comp_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_competency(db, comp_id):
        raise HTTPException(404, "Навык не найден")
    return {"ok": True}


# ═══════════════════════════════════════════════════
#  REGULATIONS (admin)
# ═══════════════════════════════════════════════════

@router.get("/regulations", response_model=List[s.Regulation])
def list_regulations(
    category_id: Optional[str] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.list_regulations(db, category_id, active_only)

@router.post("/regulations", response_model=s.Regulation)
def create_regulation(
    data: s.RegulationCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.create_regulation(db, data)

@router.patch("/regulations/{reg_id}", response_model=s.Regulation)
def update_regulation(
    reg_id: str,
    data: s.RegulationUpdate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    result = team_crud.update_regulation(db, reg_id, data)
    if not result:
        raise HTTPException(404, "Регламент не найден")
    return result

@router.delete("/regulations/{reg_id}")
def delete_regulation(
    reg_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_regulation(db, reg_id):
        raise HTTPException(404, "Регламент не найден")
    return {"ok": True}


# ═══════════════════════════════════════════════════
#  TRAININGS (admin)
# ═══════════════════════════════════════════════════

@router.get("/trainings", response_model=List[s.Training])
def list_trainings(
    category_id: Optional[str] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.list_trainings(db, category_id, active_only)

@router.post("/trainings", response_model=s.Training)
def create_training(
    data: s.TrainingCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.create_training(db, data)

@router.patch("/trainings/{tr_id}", response_model=s.Training)
def update_training(
    tr_id: str,
    data: s.TrainingUpdate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    result = team_crud.update_training(db, tr_id, data)
    if not result:
        raise HTTPException(404, "Обучение не найдено")
    return result

@router.delete("/trainings/{tr_id}")
def delete_training(
    tr_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_training(db, tr_id):
        raise HTTPException(404, "Обучение не найдено")
    return {"ok": True}


# ═══════════════════════════════════════════════════
#  TESTS (admin)
# ═══════════════════════════════════════════════════

@router.get("/tests", response_model=List[s.Test])
def list_tests(
    category_id: Optional[str] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.list_tests(db, category_id, active_only)

@router.post("/tests", response_model=s.Test)
def create_test(
    data: s.TestCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.create_test(db, data)

@router.patch("/tests/{test_id}", response_model=s.Test)
def update_test(
    test_id: str,
    data: s.TestUpdate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    result = team_crud.update_test(db, test_id, data)
    if not result:
        raise HTTPException(404, "Тест не найден")
    return result

@router.delete("/tests/{test_id}")
def delete_test(
    test_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_test(db, test_id):
        raise HTTPException(404, "Тест не найден")
    return {"ok": True}


# ═══════════════════════════════════════════════════
#  DEPARTMENTS (admin)
# ═══════════════════════════════════════════════════

@router.get("/departments", response_model=List[s.Department])
def list_departments(
    active_only: bool = False,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.list_departments(db, active_only)

@router.get("/departments/tree")
def get_department_tree(
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.get_department_tree(db)

@router.post("/departments", response_model=s.Department)
def create_department(
    data: s.DepartmentCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.create_department(db, data)

@router.patch("/departments/{dept_id}", response_model=s.Department)
def update_department(
    dept_id: str,
    data: s.DepartmentUpdate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    result = team_crud.update_department(db, dept_id, data)
    if not result:
        raise HTTPException(404, "Отдел не найден")
    return result

@router.delete("/departments/{dept_id}")
def delete_department(
    dept_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_department(db, dept_id):
        raise HTTPException(404, "Отдел не найден")
    return {"ok": True}


# ═══════════════════════════════════════════════════
#  POSITIONS (admin)
# ═══════════════════════════════════════════════════

@router.get("/positions", response_model=List[s.Position])
def list_positions(
    department_id: Optional[str] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.list_positions(db, department_id, active_only)

@router.get("/positions/{pos_id}", response_model=s.PositionFull)
def get_position(
    pos_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    result = team_crud.get_position_full(db, pos_id)
    if not result:
        raise HTTPException(404, "Должность не найдена")
    # Flatten dict into PositionFull schema
    pos = result["position"]
    return s.PositionFull(
        **s.Position.model_validate(pos).model_dump(),
        sections=[s.PositionSection.model_validate(x) for x in result["sections"]],
        competencies=[s.PositionCompetency.model_validate(x) for x in result["competencies"]],
        regulations=[s.PositionRegulation.model_validate(x) for x in result["regulations"]],
        trainings=[s.PositionTraining.model_validate(x) for x in result["trainings"]],
        tests=[s.PositionTest.model_validate(x) for x in result["tests"]],
    )

@router.post("/positions", response_model=s.Position)
def create_position(
    data: s.PositionCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.create_position(db, data)

@router.patch("/positions/{pos_id}", response_model=s.Position)
def update_position(
    pos_id: str,
    data: s.PositionUpdate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    result = team_crud.update_position(db, pos_id, data)
    if not result:
        raise HTTPException(404, "Должность не найдена")
    return result

@router.delete("/positions/{pos_id}")
def delete_position(
    pos_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_position(db, pos_id):
        raise HTTPException(404, "Должность не найдена")
    return {"ok": True}

# Position → sections
@router.post("/positions/{pos_id}/sections", response_model=s.PositionSection)
def add_position_section(
    pos_id: str,
    data: s.PositionSectionCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.add_position_section(db, pos_id, data)

@router.delete("/position-sections/{section_id}")
def delete_position_section(
    section_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_position_section(db, section_id):
        raise HTTPException(404, "Секция не найдена")
    return {"ok": True}

# Position → competencies
@router.post("/positions/{pos_id}/competencies", response_model=s.PositionCompetency)
def add_position_competency(
    pos_id: str,
    data: s.PositionCompetencyCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.add_position_competency(db, pos_id, data)

@router.delete("/position-competencies/{link_id}")
def delete_position_competency(
    link_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_position_competency(db, link_id):
        raise HTTPException(404, "Связь не найдена")
    return {"ok": True}

# Position → regulations
@router.post("/positions/{pos_id}/regulations", response_model=s.PositionRegulation)
def add_position_regulation(
    pos_id: str,
    data: s.PositionRegulationCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.add_position_regulation(db, pos_id, data)

@router.delete("/position-regulations/{link_id}")
def delete_position_regulation(
    link_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_position_regulation(db, link_id):
        raise HTTPException(404, "Связь не найдена")
    return {"ok": True}

# Position → trainings
@router.post("/positions/{pos_id}/trainings", response_model=s.PositionTraining)
def add_position_training(
    pos_id: str,
    data: s.PositionTrainingCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.add_position_training(db, pos_id, data)

@router.delete("/position-trainings/{link_id}")
def delete_position_training(
    link_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_position_training(db, link_id):
        raise HTTPException(404, "Связь не найдена")
    return {"ok": True}

# Position → tests
@router.post("/positions/{pos_id}/tests", response_model=s.PositionTest)
def add_position_test(
    pos_id: str,
    data: s.PositionTestCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.add_position_test(db, pos_id, data)

@router.delete("/position-tests/{link_id}")
def delete_position_test(
    link_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_position_test(db, link_id):
        raise HTTPException(404, "Связь не найдена")
    return {"ok": True}


# ═══════════════════════════════════════════════════
#  EMPLOYEES (admin)
# ═══════════════════════════════════════════════════

@router.get("/employees", response_model=List[s.EmployeeShort])
def list_employees(
    department_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.list_employees(db, department_id, status)

@router.get("/employees/{emp_id}", response_model=s.EmployeeFull)
def get_employee(
    emp_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    emp = team_crud.get_employee(db, emp_id)
    if not emp:
        raise HTTPException(404, "Сотрудник не найден")
    comps = team_crud.list_employee_competencies(db, emp_id)
    trains = team_crud.list_employee_trainings(db, emp_id)
    tests = team_crud.list_employee_test_results(db, emp_id)
    return s.EmployeeFull(
        **s.Employee.model_validate(emp).model_dump(),
        competencies=[s.EmployeeCompetency.model_validate(x) for x in comps],
        trainings=[s.EmployeeTraining.model_validate(x) for x in trains],
        test_results=[s.EmployeeTestResult.model_validate(x) for x in tests],
    )

@router.post("/employees", response_model=s.Employee)
def create_employee(
    data: s.EmployeeCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.create_employee(db, data)

@router.patch("/employees/{emp_id}", response_model=s.Employee)
def update_employee(
    emp_id: str,
    data: s.EmployeeUpdate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    result = team_crud.update_employee(db, emp_id, data)
    if not result:
        raise HTTPException(404, "Сотрудник не найден")
    return result

@router.delete("/employees/{emp_id}")
def delete_employee(
    emp_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_employee(db, emp_id):
        raise HTTPException(404, "Сотрудник не найден")
    return {"ok": True}

# Employee → contacts
@router.post("/employees/{emp_id}/contacts", response_model=s.EmployeeContact)
def add_employee_contact(
    emp_id: str,
    data: s.EmployeeContactCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.add_employee_contact(db, emp_id, data)

@router.delete("/employee-contacts/{contact_id}")
def delete_employee_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_employee_contact(db, contact_id):
        raise HTTPException(404, "Контакт не найден")
    return {"ok": True}

# Employee → competencies
@router.post("/employees/{emp_id}/competencies", response_model=s.EmployeeCompetency)
def add_employee_competency(
    emp_id: str,
    data: s.EmployeeCompetencyCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.add_employee_competency(db, emp_id, data)

@router.delete("/employee-competencies/{link_id}")
def delete_employee_competency(
    link_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_employee_competency(db, link_id):
        raise HTTPException(404, "Связь не найдена")
    return {"ok": True}

# Employee → trainings
@router.post("/employees/{emp_id}/trainings", response_model=s.EmployeeTraining)
def add_employee_training(
    emp_id: str,
    data: s.EmployeeTrainingCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.add_employee_training(db, emp_id, data)

@router.patch("/employee-trainings/{link_id}/status")
def update_employee_training_status(
    link_id: str,
    status: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    result = team_crud.update_employee_training_status(db, link_id, status)
    if not result:
        raise HTTPException(404, "Связь не найдена")
    return {"ok": True}

@router.delete("/employee-trainings/{link_id}")
def delete_employee_training(
    link_id: str,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    if not team_crud.delete_employee_training(db, link_id):
        raise HTTPException(404, "Связь не найдена")
    return {"ok": True}

# Employee → test results
@router.post("/employees/{emp_id}/test-results", response_model=s.EmployeeTestResult)
def add_employee_test_result(
    emp_id: str,
    data: s.EmployeeTestResultCreate,
    db: Session = Depends(get_db),
    admin: CurrentUser = Depends(get_current_admin),
):
    return team_crud.add_employee_test_result(db, emp_id, data)
