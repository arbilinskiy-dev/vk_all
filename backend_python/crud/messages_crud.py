"""
CRUD-операции для кэша сообщений.
Чтение/запись кэшированных сообщений и метаданных.
"""

import json
import time
import logging
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, asc, inspect

from models_library.messages import CachedMessage, MessageCacheMeta

logger = logging.getLogger(__name__)


def _make_message_id(project_id: str, vk_message_id: int) -> str:
    """Генерирует синтетический PK для сообщения."""
    return f"{project_id}_{vk_message_id}"


def _make_meta_id(project_id: str, vk_user_id: int) -> str:
    """Генерирует PK для метаданных кэша."""
    return f"{project_id}_{vk_user_id}"


# =============================================================================
# МЕТАДАННЫЕ КЭША
# =============================================================================

def get_cache_meta(db: Session, project_id: str, vk_user_id: int) -> Optional[MessageCacheMeta]:
    """Получает метаданные кэша для пары (проект, пользователь)."""
    meta_id = _make_meta_id(project_id, vk_user_id)
    return db.query(MessageCacheMeta).filter(MessageCacheMeta.id == meta_id).first()


def upsert_cache_meta(
    db: Session,
    project_id: str,
    vk_user_id: int,
    total_count: int,
    cached_count: int,
    is_fully_loaded: bool = False,
    incoming_count: int = 0,
    outgoing_count: int = 0,
):
    """Обновляет или создаёт метаданные кэша."""
    meta_id = _make_meta_id(project_id, vk_user_id)
    meta = db.query(MessageCacheMeta).filter(MessageCacheMeta.id == meta_id).first()

    if meta:
        meta.last_synced_at = time.time()
        meta.total_count = total_count
        meta.cached_count = cached_count
        meta.is_fully_loaded = is_fully_loaded
        meta.incoming_count = incoming_count
        meta.outgoing_count = outgoing_count
    else:
        meta = MessageCacheMeta(
            id=meta_id,
            project_id=project_id,
            vk_user_id=vk_user_id,
            last_synced_at=time.time(),
            total_count=total_count,
            cached_count=cached_count,
            is_fully_loaded=is_fully_loaded,
            incoming_count=incoming_count,
            outgoing_count=outgoing_count,
        )
        db.add(meta)

    db.commit()
    return meta


# =============================================================================
# СООБЩЕНИЯ
# =============================================================================

def save_vk_messages(
    db: Session,
    project_id: str,
    vk_user_id: int,
    vk_items: List[Dict[str, Any]],
) -> int:
    """
    Сохраняет массив сообщений VK API в кэш одним bulk-запросом.
    Использует INSERT ... ON CONFLICT DO UPDATE (upsert).
    Работает и с SQLite, и с PostgreSQL.
    Возвращает количество сохранённых записей.
    """
    if not vk_items:
        return 0

    # Подготавливаем все записи разом
    rows = []
    for item in vk_items:
        attachments = item.get("attachments")
        attachments_json = json.dumps(attachments, ensure_ascii=False) if attachments else None

        keyboard = item.get("keyboard")
        keyboard_json = json.dumps(keyboard, ensure_ascii=False) if keyboard else None

        # Payload кнопки бота (строка JSON из VK API)
        raw_payload = item.get("payload")
        if raw_payload:
            # VK отдаёт payload как строку JSON — сохраняем как есть
            payload_json = raw_payload if isinstance(raw_payload, str) else json.dumps(raw_payload, ensure_ascii=False)
        else:
            payload_json = None

        # reply_message — сообщение, на которое ответ
        reply_msg = item.get("reply_message")
        reply_message_json = json.dumps(reply_msg, ensure_ascii=False) if reply_msg else None

        # fwd_messages — пересланные сообщения
        fwd_msgs = item.get("fwd_messages")
        fwd_messages_json = json.dumps(fwd_msgs, ensure_ascii=False) if fwd_msgs else None

        rows.append({
            "id": _make_message_id(project_id, item["id"]),
            "project_id": project_id,
            "vk_user_id": vk_user_id,
            "vk_message_id": item["id"],
            "from_id": item.get("from_id", 0),
            "peer_id": item.get("peer_id"),
            "text": item.get("text", ""),
            "date": item.get("date", 0),
            "is_outgoing": item.get("out", 0) == 1 or item.get("from_id", 0) < 0,
            "is_read": item.get("read_state") == 1 if item.get("read_state") is not None else None,
            "attachments_json": attachments_json,
            "keyboard_json": keyboard_json,
            "payload_json": payload_json,
            "sent_by_id": item.get("sent_by_id"),
            "sent_by_name": item.get("sent_by_name"),
            "reply_message_json": reply_message_json,
            "fwd_messages_json": fwd_messages_json,
            "conversation_message_id": item.get("conversation_message_id"),
        })

    # Определяем диалект БД для правильного upsert
    dialect = inspect(db.bind).dialect.name if db.bind else "sqlite"

    # Поля, которые обновляются при конфликте
    update_columns = ["from_id", "peer_id", "text", "date", "is_outgoing", "is_read", "attachments_json", "keyboard_json", "payload_json", "reply_message_json", "fwd_messages_json", "conversation_message_id"]
    # Важно: sent_by_id/sent_by_name не перезаписываются при синхронизации из VK API,
    # т.к. VK API не возвращает эти поля — они бы занулились.
    # Обновляем sent_by только если они переданы (COALESCE-логика в upsert).

    try:
        if dialect == "postgresql":
            from sqlalchemy.dialects.postgresql import insert as pg_insert
            from sqlalchemy import func as sa_func
            stmt = pg_insert(CachedMessage).values(rows)
            # COALESCE: если новое значение sent_by_id не None — записываем, иначе оставляем старое
            update_set = {col: stmt.excluded[col] for col in update_columns}
            update_set["sent_by_id"] = sa_func.coalesce(stmt.excluded.sent_by_id, CachedMessage.sent_by_id)
            update_set["sent_by_name"] = sa_func.coalesce(stmt.excluded.sent_by_name, CachedMessage.sent_by_name)
            stmt = stmt.on_conflict_do_update(
                index_elements=["id"],
                set_=update_set,
            )
        else:
            # SQLite — INSERT OR REPLACE (поддерживается с SQLAlchemy 1.4+)
            from sqlalchemy.dialects.sqlite import insert as sqlite_insert
            from sqlalchemy import func as sa_func
            stmt = sqlite_insert(CachedMessage).values(rows)
            update_set = {col: stmt.excluded[col] for col in update_columns}
            update_set["sent_by_id"] = sa_func.coalesce(stmt.excluded.sent_by_id, CachedMessage.sent_by_id)
            update_set["sent_by_name"] = sa_func.coalesce(stmt.excluded.sent_by_name, CachedMessage.sent_by_name)
            stmt = stmt.on_conflict_do_update(
                index_elements=["id"],
                set_=update_set,
            )

        db.execute(stmt)
        db.commit()
        logger.info(f"MESSAGES CRUD: bulk upsert {len(rows)} сообщений за 1 запрос (project={project_id}, user={vk_user_id})")
    except Exception as e:
        db.rollback()
        logger.error(f"MESSAGES CRUD: ошибка bulk upsert — {e}")
        raise

    return len(rows)


def get_cached_messages(
    db: Session,
    project_id: str,
    vk_user_id: int,
    limit: int = 200,
    offset: int = 0,
    direction: Optional[str] = None,
    search_text: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Читает кэшированные сообщения из БД.
    Возвращает (items, total_filtered) — items в формате VK API (для совместимости).
    Сортировка: от новых к старым (как VK API).

    direction: "incoming" | "outgoing" | None (все)
    search_text: подстрока для поиска по тексту (ILIKE '%text%')
    """
    has_filters = direction is not None or bool(search_text and search_text.strip())

    # Базовые фильтры диалога
    filters = [
        CachedMessage.project_id == project_id,
        CachedMessage.vk_user_id == vk_user_id,
    ]

    # Фильтр по направлению (.is_ — безопасно для NULL и для разных СУБД)
    if direction == "incoming":
        filters.append(CachedMessage.is_outgoing.is_(False))
    elif direction == "outgoing":
        filters.append(CachedMessage.is_outgoing.is_(True))

    # Фильтр по тексту сообщения
    if search_text and search_text.strip():
        filters.append(CachedMessage.text.ilike(f"%{search_text.strip()}%"))

    # Количество: без фильтров — быстрый путь через метаданные, с фильтрами — COUNT
    if not has_filters:
        meta = get_cache_meta(db, project_id, vk_user_id)
        total_in_cache = meta.cached_count if meta and meta.cached_count > 0 else 0
        # Фолбэк: COUNT если метаданных нет (первый запрос до создания meta)
        if total_in_cache == 0:
            total_in_cache = db.query(CachedMessage).filter(and_(*filters)).count()
    else:
        # С фильтрами — всегда COUNT по фактическим данным
        total_in_cache = db.query(CachedMessage).filter(and_(*filters)).count()

    # Получаем страницу (от новых к старым)
    rows = db.query(CachedMessage).filter(
        and_(*filters)
    ).order_by(desc(CachedMessage.date)).offset(offset).limit(limit).all()

    # Конвертируем обратно в формат VK API
    items = []
    for r in rows:
        item: Dict[str, Any] = {
            "id": r.vk_message_id,
            "from_id": r.from_id,
            "peer_id": r.peer_id,
            "text": r.text or "",
            "date": r.date,
            "out": 1 if r.is_outgoing else 0,
        }
        if r.is_read is not None:
            item["read_state"] = 1 if r.is_read else 0
        if r.attachments_json:
            try:
                item["attachments"] = json.loads(r.attachments_json)
            except json.JSONDecodeError:
                pass
        if r.keyboard_json:
            try:
                item["keyboard"] = json.loads(r.keyboard_json)
            except json.JSONDecodeError:
                pass
        if r.payload_json:
            item["payload"] = r.payload_json
        # Кто отправил сообщение через нашу систему
        if r.sent_by_name:
            item["sent_by_name"] = r.sent_by_name
        # Пометка: удалено из ВК
        if r.is_deleted_from_vk:
            item["is_deleted_from_vk"] = True
        # Цитируемое сообщение (reply_message)
        if r.reply_message_json:
            try:
                item["reply_message"] = json.loads(r.reply_message_json)
            except json.JSONDecodeError:
                pass
        # Пересланные сообщения (fwd_messages)
        if r.fwd_messages_json:
            try:
                item["fwd_messages"] = json.loads(r.fwd_messages_json)
            except json.JSONDecodeError:
                pass
        # conversation_message_id — для кросс-диалоговой пересылки
        if r.conversation_message_id is not None:
            item["conversation_message_id"] = r.conversation_message_id
        items.append(item)

    return items, total_in_cache


def mark_deleted_from_vk(
    db: Session,
    project_id: str,
    vk_user_id: int,
    vk_items: List[Dict[str, Any]],
) -> int:
    """
    Сравнивает сообщения из VK API с кэшем и помечает удалённые.
    
    Логика:
    1. Берём диапазон дат из ответа VK (от самого старого до самого нового)
    2. Находим все наши кэшированные сообщения в этом диапазоне
    3. Те, что есть в кэше, но НЕТ в ответе VK → is_deleted_from_vk = True
    4. Те, что ЕСТЬ в ответе VK → is_deleted_from_vk = False (снимаем пометку)
    
    Возвращает количество помеченных как удалённые.
    """
    if not vk_items:
        return 0
    
    # Собираем set VK message_id из ответа
    vk_ids = {item["id"] for item in vk_items}
    
    # Диапазон дат из ответа VK
    dates = [item.get("date", 0) for item in vk_items]
    min_date = min(dates)
    max_date = max(dates)
    
    if min_date == 0 or max_date == 0:
        return 0
    
    # Получаем все кэшированные сообщения в этом диапазоне дат
    cached_in_range = db.query(CachedMessage).filter(
        and_(
            CachedMessage.project_id == project_id,
            CachedMessage.vk_user_id == vk_user_id,
            CachedMessage.date >= min_date,
            CachedMessage.date <= max_date,
        )
    ).all()
    
    marked_count = 0
    unmarked_count = 0
    for msg in cached_in_range:
        if msg.vk_message_id not in vk_ids:
            # Сообщение есть в кэше, но нет в VK → удалено
            if not msg.is_deleted_from_vk:
                msg.is_deleted_from_vk = True
                marked_count += 1
        else:
            # Сообщение есть в VK → снимаем пометку (если была)
            if msg.is_deleted_from_vk:
                msg.is_deleted_from_vk = False
                unmarked_count += 1
    
    if marked_count > 0 or unmarked_count > 0:
        db.commit()
        if marked_count > 0:
            logger.info(
                f"MESSAGES CRUD: помечено {marked_count} удалённых из VK сообщений "
                f"(project={project_id}, user={vk_user_id}, range={min_date}..{max_date})"
            )
        if unmarked_count > 0:
            logger.info(
                f"MESSAGES CRUD: снято {unmarked_count} пометок удаления "
                f"(project={project_id}, user={vk_user_id})"
            )
    
    return marked_count


def get_deleted_from_vk_count(db: Session, project_id: str, vk_user_id: int) -> int:
    """Считает количество сообщений, помеченных как удалённые из ВК."""
    return db.query(CachedMessage).filter(
        and_(
            CachedMessage.project_id == project_id,
            CachedMessage.vk_user_id == vk_user_id,
            CachedMessage.is_deleted_from_vk.is_(True),
        )
    ).count()


def get_cached_messages_count(db: Session, project_id: str, vk_user_id: int) -> int:
    """Количество сообщений в кэше для диалога."""
    return db.query(CachedMessage).filter(
        and_(
            CachedMessage.project_id == project_id,
            CachedMessage.vk_user_id == vk_user_id,
        )
    ).count()


def get_newest_cached_date(db: Session, project_id: str, vk_user_id: int) -> Optional[int]:
    """Возвращает дату (unix timestamp) самого нового кэшированного сообщения."""
    row = db.query(CachedMessage.date).filter(
        and_(
            CachedMessage.project_id == project_id,
            CachedMessage.vk_user_id == vk_user_id,
        )
    ).order_by(desc(CachedMessage.date)).first()
    return row[0] if row else None


def get_last_message_dates(db: Session, project_id: str, vk_user_id: int) -> Dict[str, Optional[int]]:
    """
    Возвращает дату последнего входящего и исходящего сообщения из кэша.
    Два запроса MAX с индексом — O(1) по сути.
    Возвращает: {"last_incoming_date": unix_ts|None, "last_outgoing_date": unix_ts|None}
    """
    from sqlalchemy import func as sa_func
    
    # Последнее входящее (от пользователя — is_outgoing=False)
    incoming = db.query(sa_func.max(CachedMessage.date)).filter(
        and_(
            CachedMessage.project_id == project_id,
            CachedMessage.vk_user_id == vk_user_id,
            CachedMessage.is_outgoing.is_(False),
        )
    ).scalar()
    
    # Последнее исходящее (от сообщества — is_outgoing=True)
    outgoing = db.query(sa_func.max(CachedMessage.date)).filter(
        and_(
            CachedMessage.project_id == project_id,
            CachedMessage.vk_user_id == vk_user_id,
            CachedMessage.is_outgoing.is_(True),
        )
    ).scalar()
    
    return {
        "last_incoming_date": incoming,
        "last_outgoing_date": outgoing,
    }


def get_message_direction_counts(
    db: Session,
    project_id: str,
    vk_user_id: int,
) -> Dict[str, int]:
    """
    Считает количество входящих и исходящих сообщений.
    Сначала пробует прочитать из метаданных (O(1)), фолбек — COUNT запрос.
    Возвращает: {"incoming_count": N, "outgoing_count": M, "cached_total": N+M}
    """
    # Быстрый путь: данные в метаданных
    meta = get_cache_meta(db, project_id, vk_user_id)
    if meta and meta.cached_count > 0 and (meta.incoming_count > 0 or meta.outgoing_count > 0):
        return {
            "incoming_count": meta.incoming_count,
            "outgoing_count": meta.outgoing_count,
            "cached_total": meta.cached_count,
        }
    
    # Фолбек: пересчёт через COUNT (для старых записей без incoming/outgoing)
    counts = _count_direction(db, project_id, vk_user_id)
    
    # Обновляем meta чтобы в следующий раз было мгновенно
    if meta and counts["cached_total"] > 0:
        meta.incoming_count = counts["incoming_count"]
        meta.outgoing_count = counts["outgoing_count"]
        meta.cached_count = counts["cached_total"]
        db.commit()
    
    return counts


def _count_direction(
    db: Session,
    project_id: str,
    vk_user_id: int,
) -> Dict[str, int]:
    """Пересчёт incoming/outgoing через SQL COUNT (фолбек)."""
    from sqlalchemy import func as sa_func, case

    row = db.query(
        sa_func.count().label("total"),
        sa_func.sum(case((CachedMessage.is_outgoing.is_(True), 1), else_=0)).label("outgoing"),
        sa_func.sum(case((CachedMessage.is_outgoing.is_(False), 1), else_=0)).label("incoming"),
    ).filter(
        and_(
            CachedMessage.project_id == project_id,
            CachedMessage.vk_user_id == vk_user_id,
        )
    ).first()

    if not row or not row.total:
        return {"incoming_count": 0, "outgoing_count": 0, "cached_total": 0}

    return {
        "incoming_count": int(row.incoming or 0),
        "outgoing_count": int(row.outgoing or 0),
        "cached_total": int(row.total or 0),
    }


def recalc_direction_counts(db: Session, project_id: str, vk_user_id: int) -> Dict[str, int]:
    """
    Пересчитывает incoming/outgoing в кэше и обновляет метаданные.
    Вызывается после save_vk_messages.
    """
    counts = _count_direction(db, project_id, vk_user_id)
    
    meta = get_cache_meta(db, project_id, vk_user_id)
    if meta:
        meta.incoming_count = counts["incoming_count"]
        meta.outgoing_count = counts["outgoing_count"]
        meta.cached_count = counts["cached_total"]
        db.commit()
    
    return counts


def get_last_messages_batch(
    db: Session,
    project_id: str,
    vk_user_ids: List[int],
) -> Dict[int, Dict[str, Any]]:
    """
    Возвращает последнее сообщение для каждого диалога (пакетно).
    Ключ — vk_user_id, значение — сообщение в формате VK API.
    Оптимизировано: 1 SQL (subquery max(date) + JOIN) вместо N отдельных запросов.
    """
    from sqlalchemy import func as sa_func

    if not vk_user_ids:
        return {}

    # 1 SQL: подзапрос max(date) per user + JOIN для получения полных строк
    subq = db.query(
        CachedMessage.vk_user_id,
        sa_func.max(CachedMessage.date).label("max_date"),
    ).filter(
        and_(
            CachedMessage.project_id == project_id,
            CachedMessage.vk_user_id.in_(vk_user_ids),
        )
    ).group_by(CachedMessage.vk_user_id).subquery()

    rows = db.query(CachedMessage).join(
        subq,
        and_(
            CachedMessage.vk_user_id == subq.c.vk_user_id,
            CachedMessage.date == subq.c.max_date,
            CachedMessage.project_id == project_id,
        )
    ).all()

    # Дедупликация (если несколько сообщений с одной max_date у одного пользователя)
    result: Dict[int, Dict[str, Any]] = {}
    for row in rows:
        if row.vk_user_id in result:
            continue
        item: Dict[str, Any] = {
            "id": row.vk_message_id,
            "from_id": row.from_id,
            "peer_id": row.peer_id,
            "text": row.text or "",
            "date": row.date,
            "out": 1 if row.is_outgoing else 0,
        }
        if row.attachments_json:
            try:
                item["attachments"] = json.loads(row.attachments_json)
            except json.JSONDecodeError:
                pass
        if row.payload_json:
            item["payload"] = row.payload_json
        # Кто отправил через нашу систему
        if row.sent_by_name:
            item["sent_by_name"] = row.sent_by_name
        result[row.vk_user_id] = item

    logger.info(f"MESSAGES CRUD: get_last_messages_batch — {len(result)} сообщений за 1 SQL (project={project_id})")
    return result
