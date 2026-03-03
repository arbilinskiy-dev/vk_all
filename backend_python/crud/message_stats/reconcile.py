"""
СВЕРКА (Reconciliation): Запрос реальной истории из VK API
и корректировка счётчиков статистики через MAX()-подход.

Для каждого проекта+пользователя запрашиваем 200 последних сообщений
из messages.getHistory, считаем реальные incoming/outgoing по часовым слотам,
и обновляем message_stats_hourly / message_stats_user через MAX
(если реальное значение больше текущего — перезаписываем).

Идемпотентен: повторный вызов не увеличивает счётчики.
"""

import json
import time
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Set, Tuple, Optional
from collections import defaultdict

from sqlalchemy.orm import Session

from models_library.message_stats import MessageStatsHourly, MessageStatsUser
from models_library.projects import Project as ProjectModel
from services.messages.vk_client import get_community_tokens

logger = logging.getLogger("crud.message_stats.reconcile")


def reconcile_from_vk(
    db: Session,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Сверка статистики с реальными данными VK API.

    Алгоритм:
    1. Получаем все пары (project_id, vk_user_id) из message_stats_user
    2. Для каждого проекта получаем токен и group_id
    3. Для каждого пользователя запрашиваем messages.getHistory (200 последних)
    4. Считаем реальные incoming/outgoing по часовым слотам
    5. Обновляем message_stats_hourly через MAX
    6. Обновляем message_stats_user через MAX

    :return: итоги сверки (projects_processed, users_processed, corrections и т.д.)
    """
    from services.vk_api.token_manager import call_vk_api_for_group

    stats = {
        "projects_total": 0,
        "projects_processed": 0,
        "projects_skipped": 0,
        "users_total": 0,
        "users_processed": 0,
        "users_errors": 0,
        "hourly_corrections": 0,
        "user_corrections": 0,
        "details": "",
    }

    # --- 1. Определяем пары (project_id, vk_user_id) для сверки ---
    # Дашборд показывает «ВСЕГО ДИАЛОГОВ» = incoming_dialogs, а «УНИК. ЮЗЕРОВ» = incoming_users.
    # Оба считаются из unique_TEXT_users_json ∪ unique_PAYLOAD_users_json (входящие юзеры).
    # unique_users_json раздут (содержит получателей исходящих) — НЕ используем его.
    if date_from or date_to:
        from crud.message_stats.read import _hourly_date_filter

        # Шаг 1: находим hourly-записи за период (точно как дашборд)
        hourly_q = db.query(
            MessageStatsHourly.project_id,
            MessageStatsHourly.hour_slot,
            MessageStatsHourly.unique_text_users_json,
            MessageStatsHourly.unique_payload_users_json,
            MessageStatsHourly.incoming_count,
        )
        hourly_q = _hourly_date_filter(hourly_q, date_from, date_to)
        hourly_rows = hourly_q.all()

        logger.info(
            f"Сверка: найдено {len(hourly_rows)} hourly-записей "
            f"за {date_from}T00 — {date_to}T23"
        )

        # Шаг 2: собираем пары (project_id, vk_user_id) из ВХОДЯЩИХ полей
        # (text_users ∪ payload_users) — ровно как дашборд считает incoming_dialogs
        period_pairs: Dict[str, Set[int]] = defaultdict(set)
        for row in hourly_rows:
            # Юзеры, писавшие текстовые сообщения
            if row.unique_text_users_json:
                try:
                    for uid in json.loads(row.unique_text_users_json):
                        if isinstance(uid, int) and uid > 0:
                            period_pairs[row.project_id].add(uid)
                except (json.JSONDecodeError, TypeError):
                    pass
            # Юзеры, нажимавшие кнопки (payload)
            if row.unique_payload_users_json:
                try:
                    for uid in json.loads(row.unique_payload_users_json):
                        if isinstance(uid, int) and uid > 0:
                            period_pairs[row.project_id].add(uid)
                except (json.JSONDecodeError, TypeError):
                    pass

        project_ids = list(period_pairs.keys())
        total_dialogs = sum(len(v) for v in period_pairs.values())
        total_unique_users = len(set(uid for uids in period_pairs.values() for uid in uids))
        logger.info(
            f"Сверка (входящие): {len(project_ids)} проектов, "
            f"{total_dialogs} диалогов (проект×юзер), "
            f"{total_unique_users} уникальных юзеров"
        )
        # Дебаг: по-проектная раскладка
        for pid in project_ids:
            logger.info(f"  Проект {pid}: {len(period_pairs[pid])} юзеров")

        # Safety cap: защита на случай ошибки
        SAFETY_CAP = 500
        if total_dialogs > SAFETY_CAP:
            msg = (
                f"Сверка прервана: {total_dialogs} диалогов превышает лимит {SAFETY_CAP}. "
                f"Пожалуйста, сузьте период."
            )
            logger.error(msg)
            stats["details"] = msg
            return stats
    else:
        # Без фильтра — берём всех из message_stats_user (как раньше)
        period_pairs = None
        project_ids_q = db.query(MessageStatsUser.project_id).distinct()
        project_ids = [row[0] for row in project_ids_q.all()]
        logger.info(f"Сверка без фильтра: {len(project_ids)} проектов (все юзеры)")

    stats["projects_total"] = len(project_ids)

    if not project_ids:
        stats["details"] = "Нет данных за выбранный период."
        return stats

    # --- 2. Для каждого проекта получаем токен ---
    project_tokens: Dict[str, Tuple[List[str], int]] = {}
    for pid in project_ids:
        project = db.query(ProjectModel).filter(ProjectModel.id == pid).first()
        if not project:
            logger.warning(f"Сверка: проект {pid} не найден в БД — пропускаем")
            stats["projects_skipped"] += 1
            continue
        tokens = get_community_tokens(project)
        if not tokens:
            logger.warning(f"Сверка: у проекта {pid} нет токенов — пропускаем")
            stats["projects_skipped"] += 1
            continue
        try:
            group_id_int = abs(int(project.vkProjectId))
        except (ValueError, TypeError):
            logger.warning(f"Сверка: некорректный vkProjectId у проекта {pid}")
            stats["projects_skipped"] += 1
            continue
        project_tokens[pid] = (tokens, group_id_int)

    # --- 3. Для каждого проекта получаем список пользователей ---
    request_counter = 0  # Дебаг-счётчик запросов к VK API
    for pid, (tokens, group_id_int) in project_tokens.items():
        if period_pairs is not None:
            # Фильтрованный режим — только активные юзеры за период
            user_ids_for_project = period_pairs.get(pid, set())
            stats["users_total"] += len(user_ids_for_project)
        else:
            # Без фильтра — все юзеры проекта
            users_q = db.query(MessageStatsUser).filter(MessageStatsUser.project_id == pid)
            users = users_q.all()
            user_ids_for_project = {u.vk_user_id for u in users}
            stats["users_total"] += len(user_ids_for_project)
        
        stats["projects_processed"] += 1
        logger.info(
            f"Сверка: проект {pid} (group {group_id_int}): "
            f"{len(user_ids_for_project)} юзеров для обработки"
        )

        for vk_user_id in user_ids_for_project:
            request_counter += 1
            logger.info(
                f"Сверка [{request_counter}/{stats['users_total']}]: "
                f"проект {pid}, юзер {vk_user_id} — запрос getHistory"
            )
            try:
                # --- 4. Запрос историии из VK API ---
                response = call_vk_api_for_group(
                    method="messages.getHistory",
                    params={
                        "user_id": vk_user_id,
                        "count": 200,
                        "offset": 0,
                        "rev": 0,
                    },
                    group_id=group_id_int,
                    community_tokens=tokens,
                    project_id=pid,
                )

                if not response or "items" not in response:
                    logger.warning(f"Сверка: пустой ответ VK для проект {pid}, юзер {vk_user_id}")
                    stats["users_errors"] += 1
                    continue

                items = response["items"]
                if not items:
                    stats["users_processed"] += 1
                    continue

                # --- 5. Агрегируем по часовым слотам ---
                hourly_agg, user_totals = _aggregate_messages(items, group_id_int, date_from, date_to)

                # --- 6. Обновляем message_stats_hourly через MAX ---
                corrections_h = _reconcile_hourly(db, pid, hourly_agg)
                stats["hourly_corrections"] += corrections_h

                # --- 7. Обновляем message_stats_user через MAX ---
                corrections_u = _reconcile_user(db, pid, vk_user_id, user_totals)
                stats["user_corrections"] += corrections_u

                stats["users_processed"] += 1
                db.commit()

            except Exception as e:
                db.rollback()
                logger.error(f"Сверка: ошибка для проект {pid}, юзер {vk_user_id}: {e}")
                stats["users_errors"] += 1

    # --- Итоговая строка ---
    stats["details"] = (
        f"Сверка завершена: {stats['projects_processed']}/{stats['projects_total']} проектов, "
        f"{stats['users_processed']}/{stats['users_total']} юзеров. "
        f"Корректировок: {stats['hourly_corrections']} hourly, {stats['user_corrections']} user. "
        f"Пропущено проектов: {stats['projects_skipped']}, ошибок: {stats['users_errors']}."
    )
    logger.info(stats["details"])
    return stats


def _aggregate_messages(
    items: List[Dict[str, Any]],
    group_id_int: int,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Tuple[Dict[str, Dict[str, int]], Dict[str, int]]:
    """
    Агрегирует сообщения из VK API ответа по часовым слотам.

    :param items: список сообщений из messages.getHistory
    :param group_id_int: VK group_id (для определения направления)
    :param date_from: фильтр по дате
    :param date_to: фильтр по дате
    :return: (hourly_agg, user_totals)
        hourly_agg = { hour_slot: { "incoming": N, "outgoing": N, "users": set, "incoming_users": set, "outgoing_users": set } }
        user_totals = { "incoming": N, "outgoing": N, "first_at": ts, "last_at": ts }
    """
    hourly_agg: Dict[str, Dict[str, Any]] = defaultdict(
        lambda: {"incoming": 0, "outgoing": 0, "users": set(), "incoming_users": set(), "outgoing_users": set()}
    )
    user_totals = {"incoming": 0, "outgoing": 0, "first_at": float("inf"), "last_at": 0}

    for msg in items:
        msg_date = msg.get("date", 0)
        if not msg_date:
            continue

        # Фильтр по дате (если задан)
        dt = datetime.fromtimestamp(msg_date, tz=timezone.utc)
        date_str = dt.strftime("%Y-%m-%d")
        if date_from and date_str < date_from:
            continue
        if date_to and date_str > date_to:
            continue

        hour_slot = dt.strftime("%Y-%m-%dT%H")

        # Определяем направление: from_id > 0 = от пользователя (incoming),
        # from_id < 0 = от группы (outgoing)
        from_id = msg.get("from_id", 0)
        is_incoming = from_id > 0 and from_id != -group_id_int

        # Peer_id определяет собеседника
        peer_id = msg.get("peer_id", 0)
        # vk_user_id = peer_id если это личный диалог (peer_id > 0)
        vk_user_id = peer_id if peer_id > 0 else (from_id if from_id > 0 else 0)

        if is_incoming:
            hourly_agg[hour_slot]["incoming"] += 1
            user_totals["incoming"] += 1
            if vk_user_id > 0:
                hourly_agg[hour_slot]["incoming_users"].add(vk_user_id)
        else:
            hourly_agg[hour_slot]["outgoing"] += 1
            user_totals["outgoing"] += 1
            if vk_user_id > 0:
                hourly_agg[hour_slot]["outgoing_users"].add(vk_user_id)

        if vk_user_id > 0:
            hourly_agg[hour_slot]["users"].add(vk_user_id)

        user_totals["first_at"] = min(user_totals["first_at"], msg_date)
        user_totals["last_at"] = max(user_totals["last_at"], msg_date)

    # Приводим first_at к нормальному значению
    if user_totals["first_at"] == float("inf"):
        user_totals["first_at"] = 0

    return dict(hourly_agg), user_totals


def _reconcile_hourly(
    db: Session,
    project_id: str,
    hourly_agg: Dict[str, Dict[str, Any]],
) -> int:
    """
    Обновляет message_stats_hourly через MAX()-подход.
    Если реальное значение > текущего — перезаписываем.
    Возвращает количество корректировок.
    """
    corrections = 0

    for hour_slot, data in hourly_agg.items():
        row_id = f"{project_id}_{hour_slot}"
        real_in = data["incoming"]
        real_out = data["outgoing"]
        real_users: set = data.get("users", set())

        existing = db.query(MessageStatsHourly).filter(MessageStatsHourly.id == row_id).first()

        if existing:
            changed = False
            # MAX для входящих
            if real_in > (existing.incoming_count or 0):
                existing.incoming_count = real_in
                # Дозаписываем text_count как разницу (предполагаем живые, т.к. из истории нет info о payload)
                existing.incoming_text_count = max(
                    existing.incoming_text_count or 0,
                    real_in - (existing.incoming_payload_count or 0),
                )
                changed = True
            # MAX для исходящих
            if real_out > (existing.outgoing_count or 0):
                existing.outgoing_count = real_out
                changed = True
            # Обновляем уникальных пользователей (union множеств)
            if real_users:
                try:
                    existing_set = set(json.loads(existing.unique_users_json or "[]"))
                except (json.JSONDecodeError, TypeError):
                    existing_set = set()
                merged = existing_set | real_users
                if len(merged) > len(existing_set):
                    existing.unique_users_json = json.dumps(list(merged))
                    existing.unique_users_count = len(merged)
                    existing.unique_dialogs_count = len(merged)
                    changed = True

                # Дозаписываем новых ВХОДЯЩИХ юзеров из VK API в text_users
                # (из истории нет info о payload → новые incoming юзеры = текстовые)
                real_incoming_users: set = data.get("incoming_users", set())
                if real_incoming_users:
                    try:
                        existing_text = set(json.loads(existing.unique_text_users_json or "[]"))
                    except (json.JSONDecodeError, TypeError):
                        existing_text = set()
                    try:
                        existing_payload = set(json.loads(existing.unique_payload_users_json or "[]"))
                    except (json.JSONDecodeError, TypeError):
                        existing_payload = set()
                    # Входящие юзеры из VK API, которые ещё не в text и не в payload → считаем текстовыми
                    new_text_users = real_incoming_users - existing_text - existing_payload
                    if new_text_users:
                        merged_text = existing_text | new_text_users
                        existing.unique_text_users_json = json.dumps(list(merged_text))
                        changed = True

                # Дозаписываем outgoing юзеров
                real_outgoing_users: set = data.get("outgoing_users", set())
                if real_outgoing_users:
                    try:
                        existing_out = set(json.loads(existing.outgoing_users_json or "[]"))
                    except (json.JSONDecodeError, TypeError):
                        existing_out = set()
                    new_out = real_outgoing_users - existing_out
                    if new_out:
                        merged_out = existing_out | real_outgoing_users
                        existing.outgoing_users_json = json.dumps(list(merged_out))
                        changed = True
            if changed:
                existing.updated_at = time.time()
                corrections += 1
        else:
            # Создаём новую строку — данных в статистике не было вообще
            now = time.time()
            users_list = list(real_users) if real_users else []
            db.add(MessageStatsHourly(
                id=row_id,
                project_id=project_id,
                hour_slot=hour_slot,
                incoming_count=real_in,
                outgoing_count=real_out,
                incoming_payload_count=0,
                incoming_text_count=real_in,  # Из истории нет info о payload → считаем живыми
                outgoing_system_count=0,
                outgoing_bot_count=real_out,  # Из истории нет info о sender → считаем ботом
                unique_users_count=len(users_list),
                unique_users_json=json.dumps(users_list),
                unique_text_users_json=json.dumps(list(real_users - data.get("outgoing_users", set())) if real_in > 0 else []),
                unique_payload_users_json="[]",
                outgoing_users_json=json.dumps(list(data.get("outgoing_users", set()))) if real_out > 0 else "[]",
                unique_dialogs_count=len(users_list),
                created_at=now,
                updated_at=now,
            ))
            corrections += 1

    return corrections


def _reconcile_user(
    db: Session,
    project_id: str,
    vk_user_id: int,
    user_totals: Dict[str, Any],
) -> int:
    """
    Обновляет message_stats_user через MAX()-подход.
    Возвращает 1 если была корректировка, 0 если нет.
    """
    row_id = f"{project_id}_{vk_user_id}"
    real_in = user_totals["incoming"]
    real_out = user_totals["outgoing"]
    first_at = user_totals["first_at"]
    last_at = user_totals["last_at"]

    existing = db.query(MessageStatsUser).filter(MessageStatsUser.id == row_id).first()

    if existing:
        changed = False
        if real_in > (existing.incoming_count or 0):
            existing.incoming_count = real_in
            changed = True
        if real_out > (existing.outgoing_count or 0):
            existing.outgoing_count = real_out
            changed = True
        if first_at and first_at > 0 and (not existing.first_message_at or first_at < existing.first_message_at):
            existing.first_message_at = first_at
            changed = True
        if last_at and last_at > (existing.last_message_at or 0):
            existing.last_message_at = last_at
            changed = True
        return 1 if changed else 0
    else:
        # Создаём — пользователя в статистике вообще не было
        db.add(MessageStatsUser(
            id=row_id,
            project_id=project_id,
            vk_user_id=vk_user_id,
            incoming_count=real_in,
            outgoing_count=real_out,
            first_message_at=first_at if first_at > 0 else None,
            last_message_at=last_at if last_at > 0 else None,
        ))
        return 1
