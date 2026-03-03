"""
CRUD-операции для статусов прочтения диалогов.
Отслеживание непрочитанных сообщений в многопользовательской среде.
"""

import time
import logging
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models_library.message_read_status import MessageReadStatus
from models_library.messages import CachedMessage

logger = logging.getLogger(__name__)


def _make_read_status_id(project_id: str, vk_user_id: int) -> str:
    """Генерирует PK для статуса прочтения."""
    return f"{project_id}_{vk_user_id}"


def mark_dialog_as_read(
    db: Session,
    project_id: str,
    vk_user_id: int,
    last_message_id: int,
    manager_id: Optional[str] = None,
) -> MessageReadStatus:
    """
    Помечает диалог как прочитанный до указанного message_id.
    Общий для всех менеджеров — если один прочитал, видно всем.
    """
    status_id = _make_read_status_id(project_id, vk_user_id)
    status = db.query(MessageReadStatus).filter(
        MessageReadStatus.id == status_id
    ).first()

    if status:
        # Обновляем только если новый message_id больше текущего
        if last_message_id > status.last_read_message_id:
            status.last_read_message_id = last_message_id
            status.read_at = time.time()
            status.read_by = manager_id
    else:
        status = MessageReadStatus(
            id=status_id,
            project_id=project_id,
            vk_user_id=vk_user_id,
            last_read_message_id=last_message_id,
            read_at=time.time(),
            read_by=manager_id,
        )
        db.add(status)

    db.commit()
    logger.info(
        f"READ STATUS: диалог {vk_user_id} в проекте {project_id} "
        f"прочитан до msg_id={last_message_id} менеджером {manager_id}"
    )
    return status


def get_unread_count(
    db: Session,
    project_id: str,
    vk_user_id: int,
) -> int:
    """
    Подсчитывает количество непрочитанных ВХОДЯЩИХ сообщений в диалоге.
    Непрочитанные = входящие сообщения с vk_message_id > last_read_message_id.
    """
    status_id = _make_read_status_id(project_id, vk_user_id)
    status = db.query(MessageReadStatus).filter(
        MessageReadStatus.id == status_id
    ).first()

    last_read_id = status.last_read_message_id if status else 0

    count = db.query(CachedMessage).filter(
        and_(
            CachedMessage.project_id == project_id,
            CachedMessage.vk_user_id == vk_user_id,
            CachedMessage.is_outgoing == False,
            CachedMessage.vk_message_id > last_read_id,
        )
    ).count()

    return count


def get_unread_counts_batch(
    db: Session,
    project_id: str,
    vk_user_ids: List[int],
) -> Dict[int, int]:
    """
    Пакетный подсчёт непрочитанных для нескольких диалогов.
    Использует 2 запроса вместо N (защита от N+1).
    
    Возвращает: {vk_user_id: unread_count, ...}
    """
    if not vk_user_ids:
        return {}

    from sqlalchemy import func as sa_func, or_

    # 1 SQL: LEFT JOIN cached_messages с message_read_status,
    # считаем входящие с vk_message_id > last_read_message_id (или без read-статуса)
    subq_read = db.query(
        MessageReadStatus.vk_user_id,
        MessageReadStatus.last_read_message_id,
    ).filter(
        MessageReadStatus.project_id == project_id,
    ).subquery()

    rows = db.query(
        CachedMessage.vk_user_id,
        sa_func.count(CachedMessage.id).label("unread_count"),
    ).outerjoin(
        subq_read,
        CachedMessage.vk_user_id == subq_read.c.vk_user_id,
    ).filter(
        and_(
            CachedMessage.project_id == project_id,
            CachedMessage.vk_user_id.in_(vk_user_ids),
            CachedMessage.is_outgoing == False,
            or_(
                subq_read.c.last_read_message_id == None,
                CachedMessage.vk_message_id > subq_read.c.last_read_message_id,
            ),
        )
    ).group_by(
        CachedMessage.vk_user_id,
    ).all()

    # Результат: инициализируем 0 для всех, заполняем из SQL
    result: Dict[int, int] = {uid: 0 for uid in vk_user_ids}
    for uid, cnt in rows:
        result[uid] = cnt

    return result


def get_last_read_message_id(
    db: Session,
    project_id: str,
    vk_user_id: int,
) -> int:
    """Возвращает ID последнего прочитанного сообщения (0 если не прочитано)."""
    status_id = _make_read_status_id(project_id, vk_user_id)
    status = db.query(MessageReadStatus).filter(
        MessageReadStatus.id == status_id
    ).first()
    return status.last_read_message_id if status else 0


def get_max_incoming_message_id(
    db: Session,
    project_id: str,
    vk_user_id: int,
) -> int:
    """Возвращает максимальный vk_message_id входящего сообщения в диалоге."""
    from sqlalchemy import func as sa_func
    result = db.query(sa_func.max(CachedMessage.vk_message_id)).filter(
        and_(
            CachedMessage.project_id == project_id,
            CachedMessage.vk_user_id == vk_user_id,
            CachedMessage.is_outgoing == False,
        )
    ).scalar()
    return result or 0


def mark_dialog_as_unread(
    db: Session,
    project_id: str,
    vk_user_id: int,
    manager_id: Optional[str] = None,
) -> int:
    """
    Помечает диалог как непрочитанный.
    Стратегия: находим предпоследний входящий message_id и ставим last_read на него.
    Таким образом последнее входящее сообщение считается непрочитанным (бейдж = 1).
    Если входящих <= 1 — сбрасываем last_read_message_id в 0 (все непрочитаны).
    Возвращает новый unread_count.
    """
    from sqlalchemy import func as sa_func

    # Находим два последних входящих message_id (desc)
    top_two = db.query(CachedMessage.vk_message_id).filter(
        and_(
            CachedMessage.project_id == project_id,
            CachedMessage.vk_user_id == vk_user_id,
            CachedMessage.is_outgoing == False,
        )
    ).order_by(CachedMessage.vk_message_id.desc()).limit(2).all()

    if len(top_two) >= 2:
        # Ставим last_read на предпоследний → последнее сообщение = непрочитанное
        new_last_read = top_two[1][0]
    else:
        # 0 или 1 входящее — сбрасываем полностью
        new_last_read = 0

    status_id = _make_read_status_id(project_id, vk_user_id)
    status = db.query(MessageReadStatus).filter(
        MessageReadStatus.id == status_id
    ).first()

    if status:
        status.last_read_message_id = new_last_read
        status.read_at = time.time()
        status.read_by = manager_id
    else:
        # Если записи ещё не было — создаём с last_read=0 (всё непрочитано)
        status = MessageReadStatus(
            id=status_id,
            project_id=project_id,
            vk_user_id=vk_user_id,
            last_read_message_id=0,
            read_at=time.time(),
            read_by=manager_id,
        )
        db.add(status)

    db.commit()

    # Считаем актуальный unread_count
    unread = get_unread_count(db, project_id, vk_user_id)

    logger.info(
        f"UNREAD STATUS: диалог {vk_user_id} в проекте {project_id} "
        f"помечен как непрочитанный (last_read={new_last_read}, unread={unread}) "
        f"менеджером {manager_id}"
    )
    return unread


def mark_all_dialogs_as_read(
    db: Session,
    project_id: str,
    manager_id: Optional[str] = None,
) -> int:
    """
    Помечает ВСЕ диалоги проекта как прочитанные за один проход.
    Для каждого vk_user_id с непрочитанными входящими — ставит last_read = max(vk_message_id).
    Оптимизировано: 1 SELECT + 1 bulk upsert вместо N SELECT + N UPDATE.
    Возвращает количество обновлённых диалогов.
    """
    from sqlalchemy import func as sa_func, inspect as sa_inspect

    # 1. Находим max vk_message_id входящих для каждого vk_user_id в проекте
    max_ids = db.query(
        CachedMessage.vk_user_id,
        sa_func.max(CachedMessage.vk_message_id).label("max_msg_id"),
    ).filter(
        and_(
            CachedMessage.project_id == project_id,
            CachedMessage.is_outgoing == False,
        )
    ).group_by(CachedMessage.vk_user_id).all()

    if not max_ids:
        return 0

    now = time.time()

    # 2. Bulk upsert — 1 SQL вместо N SELECT + N UPDATE
    rows = []
    for vk_user_id, max_msg_id in max_ids:
        rows.append({
            "id": _make_read_status_id(project_id, vk_user_id),
            "project_id": project_id,
            "vk_user_id": vk_user_id,
            "last_read_message_id": max_msg_id,
            "read_at": now,
            "read_by": manager_id,
        })

    dialect = sa_inspect(db.bind).dialect.name if db.bind else "sqlite"

    try:
        if dialect == "postgresql":
            from sqlalchemy.dialects.postgresql import insert as pg_insert
            stmt = pg_insert(MessageReadStatus).values(rows)
            stmt = stmt.on_conflict_do_update(
                index_elements=["id"],
                set_={
                    "last_read_message_id": sa_func.greatest(
                        MessageReadStatus.last_read_message_id,
                        stmt.excluded.last_read_message_id,
                    ),
                    "read_at": stmt.excluded.read_at,
                    "read_by": stmt.excluded.read_by,
                },
            )
        else:
            from sqlalchemy.dialects.sqlite import insert as sqlite_insert
            stmt = sqlite_insert(MessageReadStatus).values(rows)
            stmt = stmt.on_conflict_do_update(
                index_elements=["id"],
                set_={
                    "last_read_message_id": sa_func.max(
                        MessageReadStatus.last_read_message_id,
                        stmt.excluded.last_read_message_id,
                    ),
                    "read_at": stmt.excluded.read_at,
                    "read_by": stmt.excluded.read_by,
                },
            )

        db.execute(stmt)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"MARK ALL READ: ошибка bulk upsert — {e}")
        raise

    updated_count = len(rows)
    logger.info(
        f"MARK ALL READ: проект {project_id} — обновлено {updated_count} диалогов за 1 SQL, "
        f"менеджер {manager_id}"
    )
    return updated_count


def get_unread_dialogs_count(
    db: Session,
    project_id: str,
) -> int:
    """
    Считает количество ДИАЛОГОВ с непрочитанными входящими сообщениями.
    Один SQL-запрос: SELECT COUNT(DISTINCT vk_user_id) 
    из CachedMessage WHERE входящие AND vk_message_id > last_read.
    
    Используется для глобального SSE-стрима счётчиков в сайдбаре.
    """
    from sqlalchemy import func as sa_func, case, literal_column
    from sqlalchemy.orm import aliased

    # Подзапрос: все уникальные vk_user_id с входящими сообщениями в проекте
    # Для каждого — макс message_id входящих
    subq = db.query(
        CachedMessage.vk_user_id,
        sa_func.max(CachedMessage.vk_message_id).label("max_msg_id"),
    ).filter(
        and_(
            CachedMessage.project_id == project_id,
            CachedMessage.is_outgoing == False,
        )
    ).group_by(CachedMessage.vk_user_id).subquery()

    # LEFT JOIN с read statuses — считаем диалоги где max_msg_id > last_read (или нет записи)
    from sqlalchemy import outerjoin, select

    count = db.query(sa_func.count()).select_from(subq).outerjoin(
        MessageReadStatus,
        and_(
            MessageReadStatus.project_id == project_id,
            MessageReadStatus.vk_user_id == subq.c.vk_user_id,
        )
    ).filter(
        # Диалог непрочитан если: нет записи о прочтении ИЛИ есть новые сообщения после прочтения
        (MessageReadStatus.last_read_message_id == None) |
        (subq.c.max_msg_id > MessageReadStatus.last_read_message_id)
    ).scalar()

    return count or 0

def get_unread_dialogs_count_batch(
    db: Session,
    project_ids: List[str],
) -> Dict[str, int]:
    """
    Пакетный подсчёт количества ДИАЛОГОВ с непрочитанными для нескольких проектов.
    Один SQL-запрос вместо N — защита от N+1.

    Возвращает: {project_id: unread_dialogs_count, ...}
    """
    from sqlalchemy import func as sa_func

    if not project_ids:
        return {}

    # Подзапрос: для каждого (project_id, vk_user_id) — макс message_id входящих
    subq = db.query(
        CachedMessage.project_id,
        CachedMessage.vk_user_id,
        sa_func.max(CachedMessage.vk_message_id).label("max_msg_id"),
    ).filter(
        and_(
            CachedMessage.project_id.in_(project_ids),
            CachedMessage.is_outgoing == False,
        )
    ).group_by(
        CachedMessage.project_id,
        CachedMessage.vk_user_id,
    ).subquery()

    # LEFT JOIN с read statuses → фильтруем непрочитанные → COUNT по project_id
    rows = db.query(
        subq.c.project_id,
        sa_func.count().label("unread_dialogs"),
    ).outerjoin(
        MessageReadStatus,
        and_(
            MessageReadStatus.project_id == subq.c.project_id,
            MessageReadStatus.vk_user_id == subq.c.vk_user_id,
        )
    ).filter(
        # Диалог непрочитан: нет записи о прочтении ИЛИ есть новые сообщения
        (MessageReadStatus.last_read_message_id == None) |
        (subq.c.max_msg_id > MessageReadStatus.last_read_message_id)
    ).group_by(
        subq.c.project_id,
    ).all()

    # Словарь с результатами (проектов без непрочитанных не будет в rows — ставим 0)
    result: Dict[str, int] = {pid: 0 for pid in project_ids}
    for project_id, count in rows:
        result[project_id] = count

    return result