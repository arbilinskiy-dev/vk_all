"""
MCP-сервер для Битрикс24 — CRM, задачи, контакты, сделки, лиды.

Функции: CRM (лиды, сделки, контакты, компании), задачи, активити, сотрудники.
Запуск: python scripts/bitrix24/mcp_server.py
Настройка: .env (BITRIX24_WEBHOOK_URL)
Регистрация: .vscode/mcp.json
"""

import os
import time
import json
import logging
from datetime import datetime
from typing import Any

import requests
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

# ─── Конфигурация ─────────────────────────────────────────────

_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_project_root, ".env"))

BITRIX24_WEBHOOK_URL = os.environ["BITRIX24_WEBHOOK_URL"].rstrip("/")

# Rate limiting — 2 запроса/сек для вебхуков Битрикс24
_last_request_time = 0.0
_REQUEST_INTERVAL = 0.5


def _b24_call(method: str, params: dict | None = None) -> Any:
    """Вызов Bitrix24 REST API с rate-limiting и обработкой ошибок."""
    global _last_request_time

    now = time.time()
    elapsed = now - _last_request_time
    if elapsed < _REQUEST_INTERVAL:
        time.sleep(_REQUEST_INTERVAL - elapsed)
    _last_request_time = time.time()

    url = f"{BITRIX24_WEBHOOK_URL}/{method}"
    payload = params or {}

    resp = requests.post(url, json=payload, timeout=30)
    data = resp.json()

    if "error" in data:
        return {
            "error": True,
            "error_code": data.get("error"),
            "error_msg": data.get("error_description", "Unknown error"),
        }

    return data.get("result", data)


def _b24_list_all(method: str, params: dict | None = None, limit: int = 50) -> list:
    """Получить список с пагинацией (Битрикс отдаёт по 50 элементов)."""
    params = dict(params or {})
    params["start"] = 0
    all_items = []

    while True:
        data = _b24_call(method, params)
        if isinstance(data, dict) and data.get("error"):
            return data
        if isinstance(data, list):
            all_items.extend(data)
        elif isinstance(data, dict):
            # Некоторые методы возвращают {"tasks": [...]} или {"result": [...]}
            items = data.get("tasks") or data.get("result") or data.get("items") or []
            if isinstance(items, list):
                all_items.extend(items)
            else:
                all_items.append(data)

        if len(all_items) >= limit:
            all_items = all_items[:limit]
            break

        # Битрикс24 использует поле "next" для пагинации
        # Нужно проверить оригинальный ответ
        url = f"{BITRIX24_WEBHOOK_URL}/{method}"
        resp = requests.post(url, json=params, timeout=30)
        raw = resp.json()
        next_start = raw.get("next")
        if not next_start:
            break
        params["start"] = next_start

    return all_items


def _format_lead(lead: dict) -> dict:
    """Форматирует объект лида."""
    return {
        "id": lead.get("ID"),
        "title": lead.get("TITLE"),
        "name": f"{lead.get('NAME', '')} {lead.get('LAST_NAME', '')}".strip(),
        "status_id": lead.get("STATUS_ID"),
        "source_id": lead.get("SOURCE_ID"),
        "phone": _extract_phone(lead),
        "email": _extract_email(lead),
        "company_title": lead.get("COMPANY_TITLE"),
        "assigned_by": lead.get("ASSIGNED_BY_ID"),
        "created": lead.get("DATE_CREATE"),
        "modified": lead.get("DATE_MODIFY"),
        "comments": (lead.get("COMMENTS") or "")[:500],
    }


def _format_deal(deal: dict) -> dict:
    """Форматирует объект сделки."""
    return {
        "id": deal.get("ID"),
        "title": deal.get("TITLE"),
        "stage_id": deal.get("STAGE_ID"),
        "category_id": deal.get("CATEGORY_ID"),
        "opportunity": deal.get("OPPORTUNITY"),
        "currency": deal.get("CURRENCY_ID"),
        "contact_id": deal.get("CONTACT_ID"),
        "company_id": deal.get("COMPANY_ID"),
        "assigned_by": deal.get("ASSIGNED_BY_ID"),
        "created": deal.get("DATE_CREATE"),
        "modified": deal.get("DATE_MODIFY"),
        "closed": deal.get("CLOSEDATE"),
        "is_closed": deal.get("CLOSED") == "Y",
    }


def _format_contact(contact: dict) -> dict:
    """Форматирует объект контакта."""
    return {
        "id": contact.get("ID"),
        "name": f"{contact.get('NAME', '')} {contact.get('LAST_NAME', '')}".strip(),
        "phone": _extract_phone(contact),
        "email": _extract_email(contact),
        "company_id": contact.get("COMPANY_ID"),
        "type_id": contact.get("TYPE_ID"),
        "source_id": contact.get("SOURCE_ID"),
        "assigned_by": contact.get("ASSIGNED_BY_ID"),
        "created": contact.get("DATE_CREATE"),
    }


def _format_company(company: dict) -> dict:
    """Форматирует объект компании."""
    return {
        "id": company.get("ID"),
        "title": company.get("TITLE"),
        "industry": company.get("INDUSTRY"),
        "revenue": company.get("REVENUE"),
        "phone": _extract_phone(company),
        "email": _extract_email(company),
        "assigned_by": company.get("ASSIGNED_BY_ID"),
        "created": company.get("DATE_CREATE"),
    }


def _format_task(task: dict) -> dict:
    """Форматирует объект задачи."""
    return {
        "id": task.get("id"),
        "title": task.get("title"),
        "description": (task.get("description") or "")[:500],
        "status": task.get("status"),
        "priority": task.get("priority"),
        "responsible_id": task.get("responsibleId"),
        "created_by": task.get("createdBy"),
        "created": task.get("createdDate"),
        "deadline": task.get("deadline"),
        "closed": task.get("closedDate"),
        "group_id": task.get("groupId"),
        "tags": task.get("tags"),
    }


def _format_activity(act: dict) -> dict:
    """Форматирует объект активити CRM."""
    return {
        "id": act.get("ID"),
        "type_id": act.get("TYPE_ID"),
        "subject": act.get("SUBJECT"),
        "description": (act.get("DESCRIPTION") or "")[:500],
        "responsible_id": act.get("RESPONSIBLE_ID"),
        "completed": act.get("COMPLETED") == "Y",
        "deadline": act.get("DEADLINE"),
        "created": act.get("CREATED"),
        "owner_type_id": act.get("OWNER_TYPE_ID"),
        "owner_id": act.get("OWNER_ID"),
        "direction": act.get("DIRECTION"),
    }


def _extract_phone(entity: dict) -> str | None:
    """Извлекает первый телефон из мультиполя."""
    phones = entity.get("PHONE")
    if isinstance(phones, list) and phones:
        return phones[0].get("VALUE")
    return None


def _extract_email(entity: dict) -> str | None:
    """Извлекает первый email из мультиполя."""
    emails = entity.get("EMAIL")
    if isinstance(emails, list) and emails:
        return emails[0].get("VALUE")
    return None


# ─── MCP-сервер ────────────────────────────────────────────────

mcp = FastMCP(
    "bitrix24",
    instructions=(
        "Битрикс24 — CRM, задачи, контакты, сделки, лиды, компании, "
        "активити, сотрудники. REST API через вебхук."
    ),
)


# ═══════════════════════════════════════════════════════════════
#  ЛИДЫ
# ═══════════════════════════════════════════════════════════════


@mcp.tool()
def b24_get_leads(
    status_id: str | None = None,
    assigned_by_id: int | None = None,
    limit: int = 50,
    order_by: str = "DATE_CREATE",
    order_dir: str = "DESC",
) -> dict:
    """Получить список лидов CRM.

    Args:
        status_id: Фильтр по статусу (NEW, IN_PROCESS, PROCESSED, CONVERTED, JUNK и др.).
        assigned_by_id: Фильтр по ответственному (ID сотрудника).
        limit: Максимум записей (по умолчанию 50).
        order_by: Поле сортировки (DATE_CREATE, DATE_MODIFY, TITLE, ID).
        order_dir: Направление сортировки (ASC, DESC).
    """
    params = {
        "order": {order_by: order_dir},
        "select": [
            "ID", "TITLE", "NAME", "LAST_NAME", "STATUS_ID", "SOURCE_ID",
            "PHONE", "EMAIL", "COMPANY_TITLE", "ASSIGNED_BY_ID",
            "DATE_CREATE", "DATE_MODIFY", "COMMENTS",
        ],
    }
    filter_params = {}
    if status_id:
        filter_params["STATUS_ID"] = status_id
    if assigned_by_id:
        filter_params["ASSIGNED_BY_ID"] = assigned_by_id
    if filter_params:
        params["filter"] = filter_params

    result = _b24_call("crm.lead.list", params)
    if isinstance(result, dict) and result.get("error"):
        return result
    if isinstance(result, list):
        leads = [_format_lead(l) for l in result[:limit]]
        return {"total": len(leads), "leads": leads}
    return {"total": 0, "leads": []}


@mcp.tool()
def b24_get_lead(lead_id: int) -> dict:
    """Получить детали одного лида по ID.

    Args:
        lead_id: ID лида.
    """
    result = _b24_call("crm.lead.get", {"ID": lead_id})
    if isinstance(result, dict) and result.get("error"):
        return result
    return _format_lead(result)


@mcp.tool()
def b24_add_lead(
    title: str,
    name: str | None = None,
    last_name: str | None = None,
    phone: str | None = None,
    email: str | None = None,
    source_id: str | None = None,
    company_title: str | None = None,
    comments: str | None = None,
    assigned_by_id: int | None = None,
) -> dict:
    """Создать нового лида в CRM.

    Args:
        title: Название лида.
        name: Имя контакта.
        last_name: Фамилия контакта.
        phone: Телефон.
        email: Email.
        source_id: Источник (CALL, WEB, ADVERTISING, PARTNER, RECOMMENDATION и др.).
        company_title: Название компании.
        comments: Комментарий.
        assigned_by_id: Ответственный (ID сотрудника).
    """
    fields = {"TITLE": title}
    if name:
        fields["NAME"] = name
    if last_name:
        fields["LAST_NAME"] = last_name
    if phone:
        fields["PHONE"] = [{"VALUE": phone, "VALUE_TYPE": "WORK"}]
    if email:
        fields["EMAIL"] = [{"VALUE": email, "VALUE_TYPE": "WORK"}]
    if source_id:
        fields["SOURCE_ID"] = source_id
    if company_title:
        fields["COMPANY_TITLE"] = company_title
    if comments:
        fields["COMMENTS"] = comments
    if assigned_by_id:
        fields["ASSIGNED_BY_ID"] = assigned_by_id

    result = _b24_call("crm.lead.add", {"fields": fields})
    if isinstance(result, dict) and result.get("error"):
        return result
    return {"success": True, "id": result}


@mcp.tool()
def b24_update_lead(lead_id: int, fields: str) -> dict:
    """Обновить поля лида.

    Args:
        lead_id: ID лида.
        fields: JSON-строка с полями для обновления.
               Пример: '{"STATUS_ID": "IN_PROCESS", "COMMENTS": "Перезвонить"}'
    """
    try:
        parsed_fields = json.loads(fields)
    except json.JSONDecodeError:
        return {"error": True, "error_msg": "Невалидный JSON в fields"}

    result = _b24_call("crm.lead.update", {"ID": lead_id, "fields": parsed_fields})
    if isinstance(result, dict) and result.get("error"):
        return result
    return {"success": True}


# ═══════════════════════════════════════════════════════════════
#  СДЕЛКИ
# ═══════════════════════════════════════════════════════════════


@mcp.tool()
def b24_get_deals(
    stage_id: str | None = None,
    category_id: int | None = None,
    assigned_by_id: int | None = None,
    closed: bool | None = None,
    limit: int = 50,
    order_by: str = "DATE_CREATE",
    order_dir: str = "DESC",
) -> dict:
    """Получить список сделок CRM.

    Args:
        stage_id: Фильтр по стадии (NEW, PREPARATION, PREPAYMENT_INVOICE, EXECUTING, FINAL_INVOICE, WON, LOSE и др.).
        category_id: Фильтр по направлению (воронке). 0 = основная воронка.
        assigned_by_id: Фильтр по ответственному.
        closed: Фильтр — только закрытые (True) или открытые (False).
        limit: Максимум записей.
        order_by: Поле сортировки.
        order_dir: Направление (ASC, DESC).
    """
    params = {
        "order": {order_by: order_dir},
        "select": [
            "ID", "TITLE", "STAGE_ID", "CATEGORY_ID", "OPPORTUNITY",
            "CURRENCY_ID", "CONTACT_ID", "COMPANY_ID", "ASSIGNED_BY_ID",
            "DATE_CREATE", "DATE_MODIFY", "CLOSEDATE", "CLOSED",
        ],
    }
    filter_params = {}
    if stage_id:
        filter_params["STAGE_ID"] = stage_id
    if category_id is not None:
        filter_params["CATEGORY_ID"] = category_id
    if assigned_by_id:
        filter_params["ASSIGNED_BY_ID"] = assigned_by_id
    if closed is not None:
        filter_params["CLOSED"] = "Y" if closed else "N"
    if filter_params:
        params["filter"] = filter_params

    result = _b24_call("crm.deal.list", params)
    if isinstance(result, dict) and result.get("error"):
        return result
    if isinstance(result, list):
        deals = [_format_deal(d) for d in result[:limit]]
        return {"total": len(deals), "deals": deals}
    return {"total": 0, "deals": []}


@mcp.tool()
def b24_get_deal(deal_id: int) -> dict:
    """Получить детали одной сделки по ID.

    Args:
        deal_id: ID сделки.
    """
    result = _b24_call("crm.deal.get", {"ID": deal_id})
    if isinstance(result, dict) and result.get("error"):
        return result
    return _format_deal(result)


@mcp.tool()
def b24_add_deal(
    title: str,
    stage_id: str = "NEW",
    category_id: int = 0,
    opportunity: float | None = None,
    currency: str = "RUB",
    contact_id: int | None = None,
    company_id: int | None = None,
    assigned_by_id: int | None = None,
) -> dict:
    """Создать новую сделку.

    Args:
        title: Название сделки.
        stage_id: Стадия (NEW, PREPARATION, WON, LOSE и др.).
        category_id: Направление/воронка (0 = основная).
        opportunity: Сумма сделки.
        currency: Валюта (RUB, USD, EUR).
        contact_id: ID привязанного контакта.
        company_id: ID привязанной компании.
        assigned_by_id: Ответственный (ID сотрудника).
    """
    fields = {
        "TITLE": title,
        "STAGE_ID": stage_id,
        "CATEGORY_ID": category_id,
        "CURRENCY_ID": currency,
    }
    if opportunity is not None:
        fields["OPPORTUNITY"] = opportunity
    if contact_id:
        fields["CONTACT_ID"] = contact_id
    if company_id:
        fields["COMPANY_ID"] = company_id
    if assigned_by_id:
        fields["ASSIGNED_BY_ID"] = assigned_by_id

    result = _b24_call("crm.deal.add", {"fields": fields})
    if isinstance(result, dict) and result.get("error"):
        return result
    return {"success": True, "id": result}


@mcp.tool()
def b24_update_deal(deal_id: int, fields: str) -> dict:
    """Обновить поля сделки.

    Args:
        deal_id: ID сделки.
        fields: JSON-строка с полями для обновления.
               Пример: '{"STAGE_ID": "WON", "OPPORTUNITY": 100000}'
    """
    try:
        parsed_fields = json.loads(fields)
    except json.JSONDecodeError:
        return {"error": True, "error_msg": "Невалидный JSON в fields"}

    result = _b24_call("crm.deal.update", {"ID": deal_id, "fields": parsed_fields})
    if isinstance(result, dict) and result.get("error"):
        return result
    return {"success": True}


# ═══════════════════════════════════════════════════════════════
#  КОНТАКТЫ
# ═══════════════════════════════════════════════════════════════


@mcp.tool()
def b24_get_contacts(
    assigned_by_id: int | None = None,
    company_id: int | None = None,
    limit: int = 50,
    order_by: str = "DATE_CREATE",
    order_dir: str = "DESC",
) -> dict:
    """Получить список контактов CRM.

    Args:
        assigned_by_id: Фильтр по ответственному.
        company_id: Фильтр по компании.
        limit: Максимум записей.
        order_by: Поле сортировки.
        order_dir: Направление.
    """
    params = {
        "order": {order_by: order_dir},
        "select": [
            "ID", "NAME", "LAST_NAME", "PHONE", "EMAIL",
            "COMPANY_ID", "TYPE_ID", "SOURCE_ID",
            "ASSIGNED_BY_ID", "DATE_CREATE",
        ],
    }
    filter_params = {}
    if assigned_by_id:
        filter_params["ASSIGNED_BY_ID"] = assigned_by_id
    if company_id:
        filter_params["COMPANY_ID"] = company_id
    if filter_params:
        params["filter"] = filter_params

    result = _b24_call("crm.contact.list", params)
    if isinstance(result, dict) and result.get("error"):
        return result
    if isinstance(result, list):
        contacts = [_format_contact(c) for c in result[:limit]]
        return {"total": len(contacts), "contacts": contacts}
    return {"total": 0, "contacts": []}


@mcp.tool()
def b24_get_contact(contact_id: int) -> dict:
    """Получить детали контакта по ID.

    Args:
        contact_id: ID контакта.
    """
    result = _b24_call("crm.contact.get", {"ID": contact_id})
    if isinstance(result, dict) and result.get("error"):
        return result
    return _format_contact(result)


@mcp.tool()
def b24_add_contact(
    name: str,
    last_name: str | None = None,
    phone: str | None = None,
    email: str | None = None,
    company_id: int | None = None,
    source_id: str | None = None,
    assigned_by_id: int | None = None,
) -> dict:
    """Создать контакт в CRM.

    Args:
        name: Имя.
        last_name: Фамилия.
        phone: Телефон.
        email: Email.
        company_id: ID компании.
        source_id: Источник.
        assigned_by_id: Ответственный.
    """
    fields = {"NAME": name}
    if last_name:
        fields["LAST_NAME"] = last_name
    if phone:
        fields["PHONE"] = [{"VALUE": phone, "VALUE_TYPE": "WORK"}]
    if email:
        fields["EMAIL"] = [{"VALUE": email, "VALUE_TYPE": "WORK"}]
    if company_id:
        fields["COMPANY_ID"] = company_id
    if source_id:
        fields["SOURCE_ID"] = source_id
    if assigned_by_id:
        fields["ASSIGNED_BY_ID"] = assigned_by_id

    result = _b24_call("crm.contact.add", {"fields": fields})
    if isinstance(result, dict) and result.get("error"):
        return result
    return {"success": True, "id": result}


# ═══════════════════════════════════════════════════════════════
#  КОМПАНИИ
# ═══════════════════════════════════════════════════════════════


@mcp.tool()
def b24_get_companies(
    assigned_by_id: int | None = None,
    limit: int = 50,
    order_by: str = "DATE_CREATE",
    order_dir: str = "DESC",
) -> dict:
    """Получить список компаний CRM.

    Args:
        assigned_by_id: Фильтр по ответственному.
        limit: Максимум записей.
        order_by: Поле сортировки.
        order_dir: Направление.
    """
    params = {
        "order": {order_by: order_dir},
        "select": [
            "ID", "TITLE", "INDUSTRY", "REVENUE", "PHONE", "EMAIL",
            "ASSIGNED_BY_ID", "DATE_CREATE",
        ],
    }
    filter_params = {}
    if assigned_by_id:
        filter_params["ASSIGNED_BY_ID"] = assigned_by_id
    if filter_params:
        params["filter"] = filter_params

    result = _b24_call("crm.company.list", params)
    if isinstance(result, dict) and result.get("error"):
        return result
    if isinstance(result, list):
        companies = [_format_company(c) for c in result[:limit]]
        return {"total": len(companies), "companies": companies}
    return {"total": 0, "companies": []}


@mcp.tool()
def b24_get_company(company_id: int) -> dict:
    """Получить детали компании по ID.

    Args:
        company_id: ID компании.
    """
    result = _b24_call("crm.company.get", {"ID": company_id})
    if isinstance(result, dict) and result.get("error"):
        return result
    return _format_company(result)


@mcp.tool()
def b24_add_company(
    title: str,
    industry: str | None = None,
    phone: str | None = None,
    email: str | None = None,
    assigned_by_id: int | None = None,
) -> dict:
    """Создать компанию в CRM.

    Args:
        title: Название компании.
        industry: Отрасль.
        phone: Телефон.
        email: Email.
        assigned_by_id: Ответственный.
    """
    fields = {"TITLE": title}
    if industry:
        fields["INDUSTRY"] = industry
    if phone:
        fields["PHONE"] = [{"VALUE": phone, "VALUE_TYPE": "WORK"}]
    if email:
        fields["EMAIL"] = [{"VALUE": email, "VALUE_TYPE": "WORK"}]
    if assigned_by_id:
        fields["ASSIGNED_BY_ID"] = assigned_by_id

    result = _b24_call("crm.company.add", {"fields": fields})
    if isinstance(result, dict) and result.get("error"):
        return result
    return {"success": True, "id": result}


# ═══════════════════════════════════════════════════════════════
#  ЗАДАЧИ
# ═══════════════════════════════════════════════════════════════


@mcp.tool()
def b24_get_tasks(
    responsible_id: int | None = None,
    created_by: int | None = None,
    status: str | None = None,
    group_id: int | None = None,
    limit: int = 50,
    order_by: str = "CREATED_DATE",
    order_dir: str = "desc",
) -> dict:
    """Получить список задач.

    Args:
        responsible_id: Фильтр по исполнителю.
        created_by: Фильтр по автору задачи.
        status: Фильтр по статусу (2=ждёт, 3=в работе, 4=ожидает контроль, 5=завершена, 6=отложена).
        group_id: Фильтр по группе (проекту).
        limit: Максимум записей.
        order_by: Поле сортировки (CREATED_DATE, DEADLINE, PRIORITY, TITLE).
        order_dir: Направление (asc, desc).
    """
    params = {
        "order": {order_by: order_dir},
        "select": [
            "ID", "TITLE", "DESCRIPTION", "STATUS", "PRIORITY",
            "RESPONSIBLE_ID", "CREATED_BY", "CREATED_DATE",
            "DEADLINE", "CLOSED_DATE", "GROUP_ID", "TAGS",
        ],
    }
    filter_params = {}
    if responsible_id:
        filter_params["RESPONSIBLE_ID"] = responsible_id
    if created_by:
        filter_params["CREATED_BY"] = created_by
    if status:
        filter_params["STATUS"] = status
    if group_id:
        filter_params["GROUP_ID"] = group_id
    if filter_params:
        params["filter"] = filter_params

    result = _b24_call("tasks.task.list", params)
    if isinstance(result, dict) and result.get("error"):
        return result
    # tasks.task.list возвращает {"tasks": [...]}
    tasks_data = result.get("tasks", []) if isinstance(result, dict) else result
    if isinstance(tasks_data, list):
        tasks = [_format_task(t) for t in tasks_data[:limit]]
        return {"total": len(tasks), "tasks": tasks}
    return {"total": 0, "tasks": []}


@mcp.tool()
def b24_get_task(task_id: int) -> dict:
    """Получить детали задачи по ID.

    Args:
        task_id: ID задачи.
    """
    result = _b24_call("tasks.task.get", {"taskId": task_id})
    if isinstance(result, dict) and result.get("error"):
        return result
    task_data = result.get("task", result) if isinstance(result, dict) else result
    return _format_task(task_data)


@mcp.tool()
def b24_add_task(
    title: str,
    description: str | None = None,
    responsible_id: int | None = None,
    deadline: str | None = None,
    priority: int = 1,
    group_id: int | None = None,
    tags: str | None = None,
) -> dict:
    """Создать задачу.

    Args:
        title: Название задачи.
        description: Описание.
        responsible_id: Исполнитель (ID сотрудника).
        deadline: Дедлайн в формате 'YYYY-MM-DD' или 'YYYY-MM-DD HH:MM:SS'.
        priority: Приоритет (0=низкий, 1=обычный, 2=высокий).
        group_id: Группа/проект.
        tags: Теги через запятую.
    """
    fields = {"TITLE": title, "PRIORITY": priority}
    if description:
        fields["DESCRIPTION"] = description
    if responsible_id:
        fields["RESPONSIBLE_ID"] = responsible_id
    if deadline:
        fields["DEADLINE"] = deadline
    if group_id:
        fields["GROUP_ID"] = group_id
    if tags:
        fields["TAGS"] = [t.strip() for t in tags.split(",")]

    result = _b24_call("tasks.task.add", {"fields": fields})
    if isinstance(result, dict) and result.get("error"):
        return result
    task_data = result.get("task", result) if isinstance(result, dict) else result
    return {"success": True, "id": task_data.get("id") if isinstance(task_data, dict) else task_data}


@mcp.tool()
def b24_update_task(task_id: int, fields: str) -> dict:
    """Обновить поля задачи.

    Args:
        task_id: ID задачи.
        fields: JSON-строка с полями для обновления.
               Пример: '{"STATUS": 5, "DEADLINE": "2026-04-01"}'
    """
    try:
        parsed_fields = json.loads(fields)
    except json.JSONDecodeError:
        return {"error": True, "error_msg": "Невалидный JSON в fields"}

    result = _b24_call("tasks.task.update", {"taskId": task_id, "fields": parsed_fields})
    if isinstance(result, dict) and result.get("error"):
        return result
    return {"success": True}


@mcp.tool()
def b24_complete_task(task_id: int) -> dict:
    """Завершить задачу (перевести в статус 5 — завершена).

    Args:
        task_id: ID задачи.
    """
    result = _b24_call("tasks.task.complete", {"taskId": task_id})
    if isinstance(result, dict) and result.get("error"):
        return result
    return {"success": True}


# ═══════════════════════════════════════════════════════════════
#  ПОЛНЫЙ КОНТЕКСТ ЗАДАЧИ — комментарии, файлы, чеклисты, лог
# ═══════════════════════════════════════════════════════════════


@mcp.tool()
def b24_get_task_comments(task_id: int, limit: int = 50) -> dict:
    """Получить комментарии к задаче (включая пересланные из чатов).

    Args:
        task_id: ID задачи.
        limit: Максимум комментариев.
    """
    raw = _b24_call("task.commentitem.getlist", {"TASKID": task_id})
    if isinstance(raw, dict) and raw.get("error"):
        return raw
    comments = raw if isinstance(raw, list) else []
    formatted = []
    for c in comments[:limit]:
        formatted.append({
            "id": c.get("ID"),
            "author_id": c.get("AUTHOR_ID"),
            "author_name": c.get("AUTHOR_NAME"),
            "text": c.get("POST_MESSAGE") or c.get("POST_MESSAGE_HTML") or "",
            "created": c.get("POST_DATE"),
            "attached_objects": c.get("ATTACHED_OBJECTS"),
        })
    return {"total": len(formatted), "comments": formatted}


@mcp.tool()
def b24_get_task_files(task_id: int) -> dict:
    """Получить файлы/вложения задачи (прикреплённые к задаче + из комментариев).

    Args:
        task_id: ID задачи.
    """
    # Файлы самой задачи через расширенный select
    task_result = _b24_call("tasks.task.get", {
        "taskId": task_id,
        "select": ["ID", "TITLE", "UF_TASK_WEBDAV_FILES", "UF_CRM_TASK"],
    })
    task_files = []
    if isinstance(task_result, dict) and not task_result.get("error"):
        task_data = task_result.get("task", task_result) if isinstance(task_result, dict) else task_result
        file_ids = task_data.get("ufTaskWebdavFiles") or task_data.get("UF_TASK_WEBDAV_FILES") or []
        crm_links = task_data.get("ufCrmTask") or task_data.get("UF_CRM_TASK") or []
        task_files = {
            "task_file_ids": file_ids,
            "crm_links": crm_links,
        }

    # Файлы из комментариев
    comments_result = _b24_call("task.commentitem.getlist", {"TASKID": task_id})
    comment_files = []
    if isinstance(comments_result, list):
        for c in comments_result:
            attached = c.get("ATTACHED_OBJECTS")
            if attached:
                comment_files.append({
                    "comment_id": c.get("ID"),
                    "author_id": c.get("AUTHOR_ID"),
                    "attached_objects": attached,
                })

    return {
        "task_files": task_files,
        "comment_files": comment_files,
    }


@mcp.tool()
def b24_get_task_checklist(task_id: int) -> dict:
    """Получить чеклист задачи (список подпунктов).

    Args:
        task_id: ID задачи.
    """
    raw = _b24_call("task.checklistitem.getlist", {"TASKID": task_id})
    if isinstance(raw, dict) and raw.get("error"):
        return raw
    items = raw if isinstance(raw, list) else []
    formatted = []
    for item in items:
        formatted.append({
            "id": item.get("ID"),
            "title": item.get("TITLE"),
            "is_complete": item.get("IS_COMPLETE") == "Y",
            "sort_index": item.get("SORT_INDEX"),
        })
    return {"total": len(formatted), "checklist": formatted}


@mcp.tool()
def b24_get_task_history(task_id: int) -> dict:
    """Получить историю изменений задачи (лог).

    Args:
        task_id: ID задачи.
    """
    result = _b24_call("tasks.task.history.list", {"taskId": task_id})
    if isinstance(result, dict) and result.get("error"):
        return result
    history_list = result.get("list", result) if isinstance(result, dict) else result
    if not isinstance(history_list, list):
        history_list = []
    formatted = []
    for h in history_list:
        formatted.append({
            "id": h.get("id") or h.get("ID"),
            "created": h.get("createdDate") or h.get("CREATED_DATE"),
            "user_id": h.get("user", {}).get("id") if isinstance(h.get("user"), dict) else h.get("USER_ID"),
            "field": h.get("field") or h.get("FIELD"),
            "value_from": h.get("value", {}).get("from") if isinstance(h.get("value"), dict) else h.get("FROM_VALUE"),
            "value_to": h.get("value", {}).get("to") if isinstance(h.get("value"), dict) else h.get("TO_VALUE"),
        })
    return {"total": len(formatted), "history": formatted}


@mcp.tool()
def b24_get_task_full_context(task_id: int) -> dict:
    """Получить ПОЛНЫЙ контекст задачи — задача + комментарии + файлы + чеклист + история.

    Единый вызов для полного понимания задачи. Возвращает все данные одним объектом.

    Args:
        task_id: ID задачи.
    """
    # Основные данные задачи (расширенный select)
    task_result = _b24_call("tasks.task.get", {
        "taskId": task_id,
        "select": [
            "ID", "TITLE", "DESCRIPTION", "STATUS", "PRIORITY",
            "RESPONSIBLE_ID", "CREATED_BY", "CREATED_DATE",
            "DEADLINE", "CLOSED_DATE", "GROUP_ID", "TAGS",
            "UF_TASK_WEBDAV_FILES", "UF_CRM_TASK",
            "AUDITORS", "ACCOMPLICES", "PARENT_ID",
            "TIME_ESTIMATE", "TIME_SPENT_IN_LOGS",
            "MARK", "ALLOW_CHANGE_DEADLINE",
            "CHANGED_DATE", "STATUS_CHANGED_DATE",
        ],
    })
    task_data = {}
    if isinstance(task_result, dict) and not task_result.get("error"):
        raw = task_result.get("task", task_result)
        task_data = {
            "id": raw.get("id"),
            "title": raw.get("title"),
            "description": raw.get("description") or "",
            "status": raw.get("status"),
            "priority": raw.get("priority"),
            "responsible_id": raw.get("responsibleId"),
            "responsible_name": (raw.get("responsible") or {}).get("name"),
            "created_by": raw.get("createdBy"),
            "creator_name": (raw.get("creator") or {}).get("name"),
            "created": raw.get("createdDate"),
            "deadline": raw.get("deadline"),
            "closed": raw.get("closedDate"),
            "changed": raw.get("changedDate"),
            "status_changed": raw.get("statusChangedDate"),
            "group_id": raw.get("groupId"),
            "group_name": (raw.get("group") or {}).get("name"),
            "parent_id": raw.get("parentId"),
            "tags": raw.get("tags"),
            "auditors": raw.get("auditors"),
            "accomplices": raw.get("accomplices"),
            "mark": raw.get("mark"),
            "time_estimate": raw.get("timeEstimate"),
            "time_spent": raw.get("timeSpentInLogs"),
            "file_ids": raw.get("ufTaskWebdavFiles") or [],
            "crm_links": raw.get("ufCrmTask") or [],
        }
    else:
        task_data = task_result

    # Комментарии
    comments_raw = _b24_call("task.commentitem.getlist", {"TASKID": task_id})
    comments = []
    if isinstance(comments_raw, list):
        for c in comments_raw:
            comments.append({
                "id": c.get("ID"),
                "author_id": c.get("AUTHOR_ID"),
                "author_name": c.get("AUTHOR_NAME"),
                "text": c.get("POST_MESSAGE") or c.get("POST_MESSAGE_HTML") or "",
                "created": c.get("POST_DATE"),
                "attached_objects": c.get("ATTACHED_OBJECTS"),
            })

    # Чеклист
    checklist_raw = _b24_call("task.checklistitem.getlist", {"TASKID": task_id})
    checklist = []
    if isinstance(checklist_raw, list):
        for item in checklist_raw:
            checklist.append({
                "id": item.get("ID"),
                "title": item.get("TITLE"),
                "is_complete": item.get("IS_COMPLETE") == "Y",
            })

    # История
    history_raw = _b24_call("tasks.task.history.list", {"taskId": task_id})
    history = []
    if isinstance(history_raw, dict) and not history_raw.get("error"):
        h_list = history_raw.get("list", []) if isinstance(history_raw, dict) else []
        if isinstance(h_list, list):
            for h in h_list:
                history.append({
                    "created": h.get("createdDate") or h.get("CREATED_DATE"),
                    "field": h.get("field") or h.get("FIELD"),
                    "from": h.get("value", {}).get("from") if isinstance(h.get("value"), dict) else h.get("FROM_VALUE"),
                    "to": h.get("value", {}).get("to") if isinstance(h.get("value"), dict) else h.get("TO_VALUE"),
                })

    return {
        "task": task_data,
        "comments": {"total": len(comments), "items": comments},
        "checklist": {"total": len(checklist), "items": checklist},
        "history": {"total": len(history), "items": history},
    }


# ═══════════════════════════════════════════════════════════════
#  АКТИВИТИ CRM (дела: звонки, встречи, письма)
# ═══════════════════════════════════════════════════════════════


@mcp.tool()
def b24_get_activities(
    owner_type_id: int | None = None,
    owner_id: int | None = None,
    completed: bool | None = None,
    limit: int = 50,
) -> dict:
    """Получить список дел CRM (звонки, встречи, письма).

    Args:
        owner_type_id: Тип владельца (1=лид, 2=сделка, 3=контакт, 4=компания).
        owner_id: ID владельца (лида/сделки/контакта/компании).
        completed: Фильтр — только завершённые (True) или незавершённые (False).
        limit: Максимум записей.
    """
    params = {
        "order": {"DEADLINE": "DESC"},
        "select": [
            "ID", "TYPE_ID", "SUBJECT", "DESCRIPTION", "RESPONSIBLE_ID",
            "COMPLETED", "DEADLINE", "CREATED", "OWNER_TYPE_ID", "OWNER_ID",
            "DIRECTION",
        ],
    }
    filter_params = {}
    if owner_type_id:
        filter_params["OWNER_TYPE_ID"] = owner_type_id
    if owner_id:
        filter_params["OWNER_ID"] = owner_id
    if completed is not None:
        filter_params["COMPLETED"] = "Y" if completed else "N"
    if filter_params:
        params["filter"] = filter_params

    result = _b24_call("crm.activity.list", params)
    if isinstance(result, dict) and result.get("error"):
        return result
    if isinstance(result, list):
        activities = [_format_activity(a) for a in result[:limit]]
        return {"total": len(activities), "activities": activities}
    return {"total": 0, "activities": []}


@mcp.tool()
def b24_add_activity(
    owner_type_id: int,
    owner_id: int,
    subject: str,
    description: str | None = None,
    type_id: int = 2,
    deadline: str | None = None,
    responsible_id: int | None = None,
) -> dict:
    """Создать дело CRM (звонок, встречу, задачу).

    Args:
        owner_type_id: Тип владельца (1=лид, 2=сделка, 3=контакт, 4=компания).
        owner_id: ID владельца.
        subject: Тема дела.
        description: Описание.
        type_id: Тип дела (1=email, 2=звонок, 3=встреча).
        deadline: Дедлайн (YYYY-MM-DD HH:MM:SS).
        responsible_id: Ответственный.
    """
    fields = {
        "OWNER_TYPE_ID": owner_type_id,
        "OWNER_ID": owner_id,
        "SUBJECT": subject,
        "TYPE_ID": type_id,
        "COMPLETED": "N",
    }
    if description:
        fields["DESCRIPTION"] = description
    if deadline:
        fields["DEADLINE"] = deadline
    if responsible_id:
        fields["RESPONSIBLE_ID"] = responsible_id

    result = _b24_call("crm.activity.add", {"fields": fields})
    if isinstance(result, dict) and result.get("error"):
        return result
    return {"success": True, "id": result}


@mcp.tool()
def b24_complete_activity(activity_id: int) -> dict:
    """Завершить дело CRM.

    Args:
        activity_id: ID дела.
    """
    result = _b24_call("crm.activity.update", {
        "ID": activity_id,
        "fields": {"COMPLETED": "Y"},
    })
    if isinstance(result, dict) and result.get("error"):
        return result
    return {"success": True}


# ═══════════════════════════════════════════════════════════════
#  СОТРУДНИКИ
# ═══════════════════════════════════════════════════════════════


@mcp.tool()
def b24_get_users(
    active: bool = True,
    department_id: int | None = None,
) -> dict:
    """Получить список сотрудников (пользователей Битрикс24).

    Args:
        active: Только активные (по умолчанию True).
        department_id: Фильтр по отделу.
    """
    params = {}
    filter_params = {}
    if active:
        filter_params["ACTIVE"] = True
    if department_id:
        filter_params["UF_DEPARTMENT"] = department_id
    if filter_params:
        params["FILTER"] = filter_params

    result = _b24_call("user.get", params)
    if isinstance(result, dict) and result.get("error"):
        return result
    if isinstance(result, list):
        users = []
        for u in result:
            users.append({
                "id": u.get("ID"),
                "name": f"{u.get('NAME', '')} {u.get('LAST_NAME', '')}".strip(),
                "email": u.get("EMAIL"),
                "position": u.get("WORK_POSITION"),
                "department": u.get("UF_DEPARTMENT"),
                "active": u.get("ACTIVE"),
            })
        return {"total": len(users), "users": users}
    return {"total": 0, "users": []}


@mcp.tool()
def b24_get_current_user() -> dict:
    """Получить профиль текущего пользователя (владельца вебхука)."""
    result = _b24_call("user.current")
    if isinstance(result, dict) and result.get("error"):
        return result
    return {
        "id": result.get("ID"),
        "name": f"{result.get('NAME', '')} {result.get('LAST_NAME', '')}".strip(),
        "email": result.get("EMAIL"),
        "position": result.get("WORK_POSITION"),
        "department": result.get("UF_DEPARTMENT"),
    }


# ═══════════════════════════════════════════════════════════════
#  ВОРОНКИ (НАПРАВЛЕНИЯ СДЕЛОК)
# ═══════════════════════════════════════════════════════════════


@mcp.tool()
def b24_get_deal_categories() -> list[dict]:
    """Получить список направлений (воронок) сделок."""
    result = _b24_call("crm.dealcategory.list")
    if isinstance(result, dict) and result.get("error"):
        return [result]
    if isinstance(result, list):
        return [{"id": c.get("ID"), "name": c.get("NAME"), "sort": c.get("SORT")} for c in result]
    return []


@mcp.tool()
def b24_get_deal_stages(category_id: int = 0) -> list[dict]:
    """Получить стадии сделок для конкретной воронки.

    Args:
        category_id: ID воронки (0 = основная).
    """
    entity_id = f"DEAL_STAGE_{category_id}" if category_id > 0 else "DEAL_STAGE"
    result = _b24_call("crm.status.list", {"filter": {"ENTITY_ID": entity_id}})
    if isinstance(result, dict) and result.get("error"):
        return [result]
    if isinstance(result, list):
        return [
            {"status_id": s.get("STATUS_ID"), "name": s.get("NAME"), "sort": s.get("SORT")}
            for s in result
        ]
    return []


# ═══════════════════════════════════════════════════════════════
#  ПОИСК
# ═══════════════════════════════════════════════════════════════


@mcp.tool()
def b24_search_crm(query: str, entity_type: str = "all") -> dict:
    """Универсальный поиск по CRM — лиды, сделки, контакты, компании.

    Args:
        query: Поисковый запрос (имя, телефон, email, название).
        entity_type: Тип сущности — all, lead, deal, contact, company.
    """
    results = {}

    if entity_type in ("all", "lead"):
        leads = _b24_call("crm.lead.list", {
            "filter": {"%TITLE": query},
            "select": ["ID", "TITLE", "NAME", "LAST_NAME", "STATUS_ID"],
        })
        if isinstance(leads, list):
            results["leads"] = [{"id": l.get("ID"), "title": l.get("TITLE"),
                                 "name": f"{l.get('NAME', '')} {l.get('LAST_NAME', '')}".strip()}
                                for l in leads[:10]]

    if entity_type in ("all", "deal"):
        deals = _b24_call("crm.deal.list", {
            "filter": {"%TITLE": query},
            "select": ["ID", "TITLE", "STAGE_ID", "OPPORTUNITY"],
        })
        if isinstance(deals, list):
            results["deals"] = [{"id": d.get("ID"), "title": d.get("TITLE"),
                                 "stage_id": d.get("STAGE_ID")}
                                for d in deals[:10]]

    if entity_type in ("all", "contact"):
        contacts = _b24_call("crm.contact.list", {
            "filter": {"%NAME": query},
            "select": ["ID", "NAME", "LAST_NAME", "PHONE", "EMAIL"],
        })
        if isinstance(contacts, list):
            results["contacts"] = [{"id": c.get("ID"),
                                    "name": f"{c.get('NAME', '')} {c.get('LAST_NAME', '')}".strip()}
                                   for c in contacts[:10]]

    if entity_type in ("all", "company"):
        companies = _b24_call("crm.company.list", {
            "filter": {"%TITLE": query},
            "select": ["ID", "TITLE", "INDUSTRY"],
        })
        if isinstance(companies, list):
            results["companies"] = [{"id": c.get("ID"), "title": c.get("TITLE")}
                                    for c in companies[:10]]

    return results


# ═══════════════════════════════════════════════════════════════
#  ОТДЕЛЫ
# ═══════════════════════════════════════════════════════════════


@mcp.tool()
def b24_get_departments() -> list[dict]:
    """Получить список отделов компании."""
    result = _b24_call("department.get")
    if isinstance(result, dict) and result.get("error"):
        return [result]
    if isinstance(result, list):
        return [
            {"id": d.get("ID"), "name": d.get("NAME"), "parent": d.get("PARENT"),
             "head": d.get("UF_HEAD")}
            for d in result
        ]
    return []


# ═══════════════════════════════════════════════════════════════
#  ЧАТ И УВЕДОМЛЕНИЯ (im)
# ═══════════════════════════════════════════════════════════════


@mcp.tool()
def b24_get_recent_chats(limit: int = 50) -> dict:
    """Получить список недавних чатов/диалогов.
    Возвращает последние чаты с последним сообщением, счётчиком непрочитанных и т.д.
    """
    return _b24_call("im.recent.list", {"LIMIT": limit})


@mcp.tool()
def b24_get_dialog_messages(dialog_id: str, limit: int = 20, last_id: int = 0) -> dict:
    """Получить сообщения из диалога/чата.

    Args:
        dialog_id: ID диалога. Для личного чата - ID пользователя, для группового - 'chatXXX' (например 'chat123').
        limit: Количество сообщений (по умолчанию 20).
        last_id: ID последнего загруженного сообщения (для пагинации, 0 = с конца).
    """
    params = {"DIALOG_ID": dialog_id, "LIMIT": limit}
    if last_id:
        params["LAST_ID"] = last_id
    return _b24_call("im.dialog.messages.get", params)


@mcp.tool()
def b24_get_chat_info(chat_id: int) -> dict:
    """Получить информацию о групповом чате по его ID.

    Args:
        chat_id: Числовой ID чата (без префикса 'chat').
    """
    return _b24_call("im.chat.get", {"CHAT_ID": chat_id})


@mcp.tool()
def b24_search_chats(query: str) -> dict:
    """Поиск чатов по названию.

    Args:
        query: Строка поиска.
    """
    return _b24_call("im.search.chat.list", {"FIND": query})


@mcp.tool()
def b24_send_message(dialog_id: str, message: str, reply_to_message_id: int | None = None) -> dict:
    """Отправить сообщение в чат/диалог.

    Args:
        dialog_id: ID диалога. Для личного чата - ID пользователя (число), для группового - 'chatXXX'.
        message: Текст сообщения. Поддерживает BB-коды Битрикс24.
        reply_to_message_id: ID сообщения, на которое нужно ответить (reply).
    """
    payload = {
        "DIALOG_ID": dialog_id,
        "MESSAGE": message,
    }
    if reply_to_message_id:
        payload["REPLY_ID"] = reply_to_message_id
    return _b24_call("im.message.add", payload)


@mcp.tool()
def b24_add_task_comment(task_id: int, message: str) -> dict:
    """Добавить комментарий в задачу (техническая заметка/результат работ).

    Args:
        task_id: ID задачи.
        message: Текст комментария.
    """
    result = _b24_call("task.commentitem.add", {
        "TASKID": task_id,
        "FIELDS": {"POST_MESSAGE": message},
    })
    if isinstance(result, dict) and result.get("error"):
        return result
    return {"success": True, "comment_id": result}


@mcp.tool()
def b24_report_task_completion(
    task_id: int,
    user_message: str,
    technical_note: str,
    user_dialog_id: str | None = None,
    user_reply_message_id: int | None = None,
    task_chat_dialog_id: str | None = None,
    task_chat_message: str | None = None,
) -> dict:
    """Комплексная отписка после выполнения задачи: техкомментарий + сообщение в чат.

    Сценарий:
    1) Добавляет техническую заметку в комментарии задачи.
    2) Отправляет пользовательское сообщение в чат (с reply на конкретное сообщение, если указан ID).
    3) Опционально отправляет сообщение в чат задачи (если задан task_chat_dialog_id).

    Args:
        task_id: ID задачи.
        user_message: Пользовательское сообщение простым языком.
        technical_note: Техническая заметка в комментарии задачи.
        user_dialog_id: Диалог для ответа пользователю (например 'chat34984' или ID пользователя).
        user_reply_message_id: ID сообщения пользователя, на которое отвечаем.
        task_chat_dialog_id: Диалог чата задачи (если отличается от user_dialog_id).
        task_chat_message: Текст в чат задачи. Если не задан, отправляется user_message.
    """
    response: dict[str, Any] = {
        "task_id": task_id,
        "task_comment": None,
        "user_chat": None,
        "task_chat": None,
    }

    # 1. Технический контекст в задачу
    comment_result = _b24_call("task.commentitem.add", {
        "TASKID": task_id,
        "FIELDS": {"POST_MESSAGE": technical_note},
    })
    response["task_comment"] = comment_result

    # 2. Сообщение пользователю (reply к конкретному сообщению)
    if user_dialog_id:
        user_payload = {
            "DIALOG_ID": user_dialog_id,
            "MESSAGE": user_message,
        }
        if user_reply_message_id:
            user_payload["REPLY_ID"] = user_reply_message_id
        response["user_chat"] = _b24_call("im.message.add", user_payload)

    # 3. Сообщение в чат задачи (опционально)
    if task_chat_dialog_id:
        response["task_chat"] = _b24_call("im.message.add", {
            "DIALOG_ID": task_chat_dialog_id,
            "MESSAGE": task_chat_message or user_message,
        })

    response["success"] = True
    return response


@mcp.tool()
def b24_get_notifications(limit: int = 50) -> dict:
    """Получить список уведомлений текущего пользователя.

    Args:
        limit: Количество уведомлений.
    """
    return _b24_call("im.notify.personal.get", {"LIMIT": limit})


@mcp.tool()
def b24_get_chat_users(chat_id: int) -> dict:
    """Получить список участников группового чата.

    Args:
        chat_id: Числовой ID чата.
    """
    return _b24_call("im.chat.user.list", {"CHAT_ID": chat_id})


# ─── Комплексные инструменты ───────────────────────────────────


import re


@mcp.tool()
def b24_get_task_chat_context(task_id: int, messages_around: int = 15) -> dict:
    """Получить полный контекст задачи: задача + переписка из чата, откуда она создана.

    Автоматически парсит описание задачи, находит ссылку на чат (IM_DIALOG/IM_MESSAGE),
    вытаскивает окружающие сообщения. Возвращает задачу + чат-контекст + файлы из сообщений.

    Args:
        task_id: ID задачи в Битрикс24.
        messages_around: Сколько сообщений вокруг исходного загрузить (по умолчанию 15).
    """
    # 1. Получаем задачу
    task_data = _b24_call("tasks.task.get", {
        "taskId": task_id,
        "select": ["*", "UF_*"],
    })
    if isinstance(task_data, dict) and task_data.get("error"):
        return task_data

    task = task_data.get("task", task_data)
    description = task.get("description", "") or ""

    result = {"task": task, "chat_context": None, "chat_files": []}

    # 2. Парсим BB-код ссылки на чат: IM_DIALOG=chatXXXX&IM_MESSAGE=YYYYYYY
    match = re.search(r"IM_DIALOG=(chat\d+)(?:&(?:amp;)?IM_MESSAGE=(\d+))?", description)
    if not match:
        result["chat_context"] = "Задача не создана из чата (нет ссылки IM_DIALOG в описании)"
        return result

    dialog_id = match.group(1)
    message_id = match.group(2)

    # 3. Получаем сообщения из чата
    chat_params = {
        "DIALOG_ID": dialog_id,
        "LIMIT": messages_around * 2,
    }
    if message_id:
        chat_params["FIRST_ID"] = max(int(message_id) - messages_around, 0)

    chat_data = _b24_call("im.dialog.messages.get", chat_params)
    if isinstance(chat_data, dict) and chat_data.get("error"):
        result["chat_context"] = {"error": chat_data}
        return result

    messages = chat_data.get("messages", [])
    users = chat_data.get("users", [])

    # Составляем маппинг user_id -> имя
    user_map = {}
    if isinstance(users, list):
        for u in users:
            user_map[str(u.get("id", ""))] = u.get("name", f"User {u.get('id')}")

    # Форматируем сообщения
    formatted_messages = []
    files_found = []
    for msg in messages:
        author = user_map.get(str(msg.get("author_id", "")), f"User {msg.get('author_id')}")
        entry = {
            "id": msg.get("id"),
            "author": author,
            "date": msg.get("date"),
            "text": msg.get("text", ""),
        }
        # Собираем файлы из сообщений
        if msg.get("files"):
            entry["files"] = msg["files"]
            for f in msg["files"]:
                files_found.append({
                    "id": f.get("id"),
                    "name": f.get("name"),
                    "size": f.get("size"),
                    "type": f.get("type"),
                    "urlDownload": f.get("urlDownload"),
                    "urlPreview": f.get("urlPreview"),
                })
        if message_id and str(msg.get("id")) == message_id:
            entry["is_source_message"] = True
        formatted_messages.append(entry)

    result["chat_context"] = {
        "dialog_id": dialog_id,
        "source_message_id": message_id,
        "messages": formatted_messages,
        "users": user_map,
    }
    result["chat_files"] = files_found
    return result


@mcp.tool()
def b24_analyze_chat_task_coverage(
    dialog_id: str = "chat34984",
    group_id: int | None = 500,
    messages_limit: int = 100,
    tasks_limit: int = 200,
) -> dict:
    """Сверка обращений в чате и задач: что уже заведено, что не заведено, что выполнено.

    Используется для контроля потерь: помогает увидеть сообщения пользователей,
    по которым не создана задача, а также задачи без привязки к чату.

    Args:
        dialog_id: ID чата (например 'chat34984').
        group_id: ID проекта задач (например 500). Если None — без фильтра по проекту.
        messages_limit: Сколько последних сообщений чата анализировать.
        tasks_limit: Сколько задач анализировать.
    """
    # 1) Загружаем последние сообщения чата
    chat_raw = _b24_call("im.dialog.messages.get", {
        "DIALOG_ID": dialog_id,
        "LIMIT": messages_limit,
    })
    if isinstance(chat_raw, dict) and chat_raw.get("error"):
        return chat_raw

    messages = chat_raw.get("messages", []) if isinstance(chat_raw, dict) else []
    users = chat_raw.get("users", []) if isinstance(chat_raw, dict) else []
    user_map = {
        str(u.get("id")): u.get("name", f"User {u.get('id')}")
        for u in users if isinstance(u, dict)
    }

    # 2) Загружаем задачи проекта
    task_params: dict[str, Any] = {
        "order": {"CREATED_DATE": "desc"},
        "select": [
            "ID", "TITLE", "STATUS", "CREATED_DATE", "CLOSED_DATE",
            "GROUP_ID", "RESPONSIBLE_ID", "DESCRIPTION", "CHANGED_DATE",
        ],
        "filter": {},
    }
    if group_id is not None:
        task_params["filter"]["GROUP_ID"] = group_id

    tasks_raw = _b24_call("tasks.task.list", task_params)
    if isinstance(tasks_raw, dict) and tasks_raw.get("error"):
        return tasks_raw

    tasks = (tasks_raw.get("tasks", []) if isinstance(tasks_raw, dict) else [])[:tasks_limit]

    # 3) Строим индексы: какие сообщения уже связаны с задачами
    linked_message_ids: set[int] = set()
    tasks_without_chat_link: list[dict[str, Any]] = []
    open_tasks: list[dict[str, Any]] = []
    completed_tasks: list[dict[str, Any]] = []

    for t in tasks:
        description = t.get("description") or ""

        # Ищем привязку вида CONTEXT=chat34984/3765788 или IM_DIALOG=chat34984&IM_MESSAGE=3765788
        context_matches = re.findall(r"CONTEXT=(chat\d+)/(\d+)", description)
        for d_id, m_id in context_matches:
            if d_id == dialog_id:
                linked_message_ids.add(int(m_id))

        im_match = re.search(r"IM_DIALOG=(chat\d+)(?:&(?:amp;)?IM_MESSAGE=(\d+))?", description)
        if im_match and im_match.group(1) == dialog_id and im_match.group(2):
            linked_message_ids.add(int(im_match.group(2)))

        if not context_matches and not im_match:
            tasks_without_chat_link.append({
                "task_id": int(t.get("id")) if str(t.get("id", "")).isdigit() else t.get("id"),
                "title": t.get("title"),
                "status": t.get("status"),
                "created": t.get("createdDate") or t.get("created_date") or t.get("created"),
            })

        status_str = str(t.get("status", ""))
        task_item = {
            "task_id": int(t.get("id")) if str(t.get("id", "")).isdigit() else t.get("id"),
            "title": t.get("title"),
            "status": status_str,
            "created": t.get("createdDate") or t.get("created_date") or t.get("created"),
            "closed": t.get("closedDate") or t.get("closed_date") or t.get("closed"),
        }
        if status_str == "5":
            completed_tasks.append(task_item)
        else:
            open_tasks.append(task_item)

    # 4) Выделяем пользовательские сообщения, которые похожи на обращения
    # Пропускаем системные (author_id=0) и служебные короткие ответы
    candidate_user_messages: list[dict[str, Any]] = []
    no_task_messages: list[dict[str, Any]] = []

    for m in messages:
        author_id = m.get("author_id")
        text = (m.get("text") or "").strip()
        if not text:
            continue
        if author_id in (0, 1):
            # 0 — системные сообщения, 1 — наши внутренние сообщения
            continue

        message_id = m.get("id")
        if not isinstance(message_id, int):
            continue

        candidate = {
            "message_id": message_id,
            "author_id": author_id,
            "author_name": user_map.get(str(author_id), f"User {author_id}"),
            "date": m.get("date"),
            "text": text[:500],
            "has_task": message_id in linked_message_ids,
        }
        candidate_user_messages.append(candidate)

        if message_id not in linked_message_ids:
            no_task_messages.append(candidate)

    return {
        "summary": {
            "dialog_id": dialog_id,
            "group_id": group_id,
            "analyzed_messages": len(messages),
            "user_messages": len(candidate_user_messages),
            "tasks_total": len(tasks),
            "tasks_open": len(open_tasks),
            "tasks_completed": len(completed_tasks),
            "linked_user_messages": len(candidate_user_messages) - len(no_task_messages),
            "user_messages_without_task": len(no_task_messages),
            "tasks_without_chat_link": len(tasks_without_chat_link),
        },
        "open_tasks": open_tasks[:50],
        "completed_tasks": completed_tasks[:50],
        "user_messages_without_task": no_task_messages[:50],
        "tasks_without_chat_link": tasks_without_chat_link[:50],
    }


@mcp.tool()
def b24_get_dev_task_context(task_id: int, messages_count: int = 10) -> dict:
    """Собрать ПОЛНЫЙ контекст задачи для разработки: задача + релевантные сообщения из чата + все вложения с download URL.

    Идеальный инструмент для разработчика: вытаскивает задачу, окружающие сообщения
    из проектного чата (фильтрует только релевантные), все файлы/скриншоты задачи
    и чата с прямыми ссылками на скачивание.

    Возвращает структурированный контекст:
    - task_summary: краткая сводка задачи (название, описание, статус, дедлайн, проект)
    - chat_messages: отфильтрованные релевантные сообщения из чата
    - task_attachments: все вложения задачи с именами, размерами и download URL
    - chat_attachments: файлы/скриншоты из сообщений чата
    - comments: комментарии к задаче
    - checklist: чеклист подпунктов

    Args:
        task_id: ID задачи в Битрикс24.
        messages_count: Сколько сообщений вокруг исходного загрузить (по умолчанию 10).
    """
    # 1. Получаем задачу со всеми полями
    task_data = _b24_call("tasks.task.get", {
        "taskId": task_id,
        "select": ["*", "UF_*"],
    })
    if isinstance(task_data, dict) and task_data.get("error"):
        return task_data

    task = task_data.get("task", task_data)
    description = task.get("description", "") or ""

    # 2. Формируем сводку задачи
    task_summary = {
        "id": task.get("id"),
        "title": task.get("title"),
        "description_raw": description,
        "status": task.get("status"),
        "priority": task.get("priority"),
        "created": task.get("createdDate"),
        "deadline": task.get("deadline"),
        "creator": task.get("creator", {}).get("name") if isinstance(task.get("creator"), dict) else task.get("createdBy"),
        "responsible": task.get("responsible", {}).get("name") if isinstance(task.get("responsible"), dict) else task.get("responsibleId"),
        "project": task.get("group", {}).get("name") if isinstance(task.get("group"), dict) else task.get("groupId"),
        "project_id": task.get("groupId"),
    }

    result = {
        "task_summary": task_summary,
        "chat_messages": [],
        "task_attachments": [],
        "chat_attachments": [],
        "comments": [],
        "checklist": [],
    }

    # 3. Вытаскиваем вложения задачи (ufTaskWebdavFiles)
    attached_ids = task.get("ufTaskWebdavFiles") or []
    for att_id in attached_ids:
        try:
            att_data = _b24_call("disk.attachedObject.get", {"id": int(att_id)})
            if isinstance(att_data, dict) and not att_data.get("error"):
                result["task_attachments"].append({
                    "attached_id": att_data.get("ID"),
                    "file_id": att_data.get("OBJECT_ID"),
                    "name": att_data.get("NAME"),
                    "size": att_data.get("SIZE"),
                    "download_url": att_data.get("DOWNLOAD_URL"),
                })
        except Exception:
            result["task_attachments"].append({"attached_id": att_id, "error": "failed to fetch"})

    # 4. Получаем комментарии
    comments_data = _b24_call("task.commentitem.getlist", {"TASKID": task_id})
    if isinstance(comments_data, list):
        for c in comments_data:
            result["comments"].append({
                "id": c.get("ID"),
                "author_id": c.get("AUTHOR_ID"),
                "date": c.get("POST_DATE"),
                "text": c.get("POST_MESSAGE", ""),
            })

    # 5. Получаем чеклист
    checklist_data = _b24_call("task.checklistitem.getlist", {"TASKID": task_id})
    if isinstance(checklist_data, list):
        for item in checklist_data:
            result["checklist"].append({
                "id": item.get("ID"),
                "title": item.get("TITLE"),
                "is_complete": item.get("IS_COMPLETE") == "Y",
            })

    # 6. Парсим ссылку на чат из описания
    match = re.search(r"IM_DIALOG=(chat\d+)(?:&(?:amp;)?IM_MESSAGE=(\d+))?", description)
    if not match:
        return result

    dialog_id = match.group(1)
    message_id = match.group(2)

    # 7. Получаем сообщения из чата
    chat_params = {
        "DIALOG_ID": dialog_id,
        "LIMIT": messages_count * 3,  # берём с запасом для фильтрации
    }
    if message_id:
        chat_params["FIRST_ID"] = max(int(message_id) - messages_count, 0)

    chat_data = _b24_call("im.dialog.messages.get", chat_params)
    if isinstance(chat_data, dict) and chat_data.get("error"):
        return result

    messages = chat_data.get("messages", [])
    users = chat_data.get("users", [])

    user_map = {}
    if isinstance(users, list):
        for u in users:
            user_map[str(u.get("id", ""))] = u.get("name", f"User {u.get('id')}")

    # 8. Фильтруем и форматируем сообщения (пропускаем системные о создании задач)
    for msg in messages:
        text = msg.get("text", "") or ""
        # Пропускаем системные уведомления бота о создании задач
        if "создал задачу на основании" in text and "CONTEXT=" in text:
            continue
        author = user_map.get(str(msg.get("author_id", "")), f"User {msg.get('author_id')}")
        entry = {
            "id": msg.get("id"),
            "author": author,
            "date": msg.get("date"),
            "text": text,
        }
        if message_id and str(msg.get("id")) == message_id:
            entry["is_source_message"] = True
        result["chat_messages"].append(entry)

        # Собираем файлы из сообщений чата
        if msg.get("files"):
            for f in msg["files"]:
                result["chat_attachments"].append({
                    "message_id": msg.get("id"),
                    "name": f.get("name"),
                    "size": f.get("size"),
                    "type": f.get("type"),
                    "url_download": f.get("urlDownload"),
                    "url_preview": f.get("urlPreview"),
                })

    # Ограничиваем до запрошенного количества сообщений
    if len(result["chat_messages"]) > messages_count:
        # Находим позицию исходного сообщения и берём вокруг него
        source_idx = None
        for i, m in enumerate(result["chat_messages"]):
            if m.get("is_source_message"):
                source_idx = i
                break
        if source_idx is not None:
            half = messages_count // 2
            start = max(0, source_idx - half)
            end = start + messages_count
            result["chat_messages"] = result["chat_messages"][start:end]
        else:
            result["chat_messages"] = result["chat_messages"][:messages_count]

    return result


# ─── Диск / Файлы ─────────────────────────────────────────────


@mcp.tool()
def b24_get_file_info(file_id: int) -> dict:
    """Получить информацию о файле на Диске Битрикс24.

    Args:
        file_id: ID файла (например из ufTaskWebdavFiles задачи).
    """
    return _b24_call("disk.file.get", {"id": file_id})


@mcp.tool()
def b24_get_attached_object(object_id: int) -> dict:
    """Получить информацию о вложенном объекте (attached object) Диска.

    Args:
        object_id: ID вложенного объекта (из ufTaskWebdavFiles).
    """
    return _b24_call("disk.attachedObject.get", {"id": object_id})


@mcp.tool()
def b24_get_folder_children(folder_id: int, limit: int = 50) -> list:
    """Получить содержимое папки на Диске Битрикс24.

    Args:
        folder_id: ID папки.
        limit: Максимум элементов.
    """
    return _b24_list_all("disk.folder.getchildren", {"id": folder_id}, limit=limit)


@mcp.tool()
def b24_get_storage_list() -> dict:
    """Получить список доступных хранилищ (дисков) в Битрикс24."""
    return _b24_call("disk.storage.getlist")


if __name__ == "__main__":
    mcp.run(transport="stdio")
