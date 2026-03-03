"""
Батч-обработка зрителей историй: обновление данных в БД.
Поддерживает параллельную и последовательную обработку, финализацию.
"""
import re
from sqlalchemy.orm import Session
from models_library.automations import StoriesAutomationLog
import json
from datetime import datetime, timezone
from typing import List, Dict, Any

# Импортируем функцию детального получения зрителей (для одиночных запросов)
from .viewers_details import fetch_viewers_with_details
# Импортируем параллельную обработку (для батчей)
from .viewers_parallel import fetch_viewers_parallel


def _parse_stories_from_logs(
    logs: List[StoriesAutomationLog]
) -> Dict[str, Any]:
    """
    Парсит логи и возвращает списки историй для обработки.
    Возвращает dict: stories_to_process, logs_needs_final_viewers, group_id, skipped_count
    """
    logs_needs_final_viewers = []  # Логи, для которых это последний сбор viewers
    stories_to_process = []  # [(owner_id, story_id, log), ...]
    group_id = None
    skipped_count = 0

    for log in logs:
        # Пропускаем истории с финализированными viewers
        if getattr(log, 'viewers_finalized', False):
            skipped_count += 1
            continue

        # Если stats финализированы, но viewers ещё нет — это последний сбор
        if getattr(log, 'stats_finalized', False) and not getattr(log, 'viewers_finalized', False):
            logs_needs_final_viewers.append(log)

        if not log.log:
            continue

        try:
            data = json.loads(log.log)
            link = data.get('story_link')
            if not link:
                continue

            # Format: https://vk.com/story{owner_id}_{story_id} или https://vk.ru/story{owner_id}_{story_id}
            # Поддерживаем оба домена: vk.com и vk.ru
            parts = re.sub(r'https?://vk\.(?:com|ru)/story', '', link).split('_')
            if len(parts) != 2:
                continue

            owner_id = parts[0]
            story_id = parts[1]

            # Извлекаем group_id из owner_id (формат: -152651211)
            if group_id is None and owner_id.startswith('-'):
                group_id = abs(int(owner_id))

            stories_to_process.append((owner_id, story_id, log))

        except Exception as e:
            print(f"[Viewers] Error parsing log {log.id}: {e}")
            continue

    return {
        "stories_to_process": stories_to_process,
        "logs_needs_final_viewers": logs_needs_final_viewers,
        "group_id": group_id,
        "skipped_count": skipped_count,
    }


def _save_viewer_result_to_log(
    log: StoriesAutomationLog,
    story_result: Dict[str, Any],
    owner_id: str,
    story_id: str,
    logs_needs_final_viewers: list,
    updated_stories: list,
    errors: list
) -> bool:
    """
    Сохраняет результат получения зрителей в лог.
    Возвращает True если обновление успешно.
    """
    story_key = f"{owner_id}_{story_id}"

    if story_result and story_result.get('success', True):
        viewers_data = {
            "items": story_result['items'],
            "count": story_result['count'],
            "reactions_count": story_result.get('reactions_count', 0),
            "partial": story_result.get('partial', False)
        }

        log.viewers = json.dumps(viewers_data, ensure_ascii=False)
        log.viewers_updated_at = datetime.now(timezone.utc)

        # Финализация viewers: если stats уже финализированы — это был последний сбор
        if log in logs_needs_final_viewers:
            log.viewers_finalized = True
            print(f"[Viewers] 🔒 Finalized viewers for story {owner_id}_{story_id} (stats already finalized)")

        # Добавляем в ответ для фронта
        updated_stories.append({
            'log_id': log.id,
            'vk_story_id': int(story_id),
            'viewers': viewers_data,
            'viewers_updated_at': log.viewers_updated_at.isoformat()
        })
        return True

    elif story_result and not story_result.get('success', True):
        error_msg = story_result.get('error', '')
        errors.append({
            "story_id": story_key,
            "error": error_msg or 'Unknown error'
        })

        # Финализация: если история не найдена (VK Error 100) — помечаем viewers_finalized
        # чтобы не запрашивать повторно при каждом обновлении
        if 'VK Error 100' in error_msg:
            log.viewers_finalized = True
            print(f"[Viewers] 🔒 Finalized viewers for story {story_key} (story not found in VK)")
        return False

    else:
        errors.append({
            "story_id": story_key,
            "error": story_result.get('error', 'Unknown error') if story_result else 'No data'
        })
        return False


def _commit_db(db: Session, errors: list) -> Dict[str, Any] | None:
    """
    Коммитит изменения в БД. Возвращает dict с ошибкой при неудаче, None при успехе.
    """
    try:
        db.commit()
        return None
    except Exception as e:
        print(f"[Viewers] DB commit error: {e}")
        db.rollback()
        return {
            "status": "error",
            "message": f"Database error: {str(e)}",
            "updated": 0,
            "errors": errors
        }


def _process_parallel(
    db: Session,
    stories_to_process: list,
    logs_needs_final_viewers: list,
    group_id: int,
    project_id: str,
    skipped_count: int,
    community_tokens: list = None
) -> Dict[str, Any]:
    """Параллельная обработка зрителей для > 1 истории."""
    # Подготавливаем данные для параллельной функции
    stories_data = [(owner_id, story_id) for owner_id, story_id, _ in stories_to_process]

    # Вызываем параллельную обработку (эксклюзивный режим community_tokens)
    parallel_result = fetch_viewers_parallel(stories_data, group_id, project_id, community_tokens=community_tokens)

    if not parallel_result['success']:
        return {
            "status": "error",
            "message": parallel_result.get('error', 'Parallel fetch failed'),
            "updated": 0,
            "errors": []
        }

    # Сохраняем результаты в логи
    updated_count = 0
    errors = []
    updated_stories = []

    for owner_id, story_id, log in stories_to_process:
        story_key = f"{owner_id}_{story_id}"
        story_result = parallel_result['stories'].get(story_key)

        success = _save_viewer_result_to_log(
            log, story_result, owner_id, story_id,
            logs_needs_final_viewers, updated_stories, errors
        )
        if success:
            updated_count += 1

    # Коммитим
    commit_error = _commit_db(db, errors)
    if commit_error:
        return commit_error

    stats = parallel_result.get('stats', {})
    print(f"[Viewers] Parallel update: {updated_count} stories, {stats.get('time_elapsed', 0)}s")

    return {
        "status": "ok",
        "updated": updated_count,
        "skipped": skipped_count,
        "errors": errors,
        "stats": stats,
        "updated_stories": updated_stories
    }


def _process_sequential(
    db: Session,
    stories_to_process: list,
    logs_needs_final_viewers: list,
    group_id: int,
    user_token: str,
    skipped_count: int,
    community_tokens: list = None
) -> Dict[str, Any]:
    """Последовательная обработка зрителей (для 1 истории или fallback)."""
    updated_count = 0
    errors = []
    updated_stories = []

    for owner_id, story_id, log in stories_to_process:
        try:
            # Используем первый токен сообщества если доступен, иначе user_token
            effective_token = community_tokens[0] if community_tokens else user_token
            result = fetch_viewers_with_details(owner_id, story_id, effective_token, group_id=group_id)

            # Приводим результат fetch_viewers_with_details к формату story_result
            story_result = {
                "success": result.get('success', False),
                "items": result.get('items', []),
                "count": result.get('count', 0),
                "reactions_count": result.get('reactions_count', 0),
                "partial": result.get('partial', False),
                "error": result.get('error', '')
            }

            success = _save_viewer_result_to_log(
                log, story_result, owner_id, story_id,
                logs_needs_final_viewers, updated_stories, errors
            )
            if success:
                updated_count += 1

        except Exception as e:
            print(f"[Viewers] Exception processing log {log.id}: {e}")
            errors.append({
                "log_id": log.id,
                "error": str(e)
            })

    # Коммитим все изменения
    commit_error = _commit_db(db, errors)
    if commit_error:
        return commit_error

    return {
        "status": "ok",
        "updated": updated_count,
        "skipped": skipped_count,
        "errors": errors,
        "updated_stories": updated_stories
    }


def batch_update_viewers(
    db: Session,
    logs: List[StoriesAutomationLog],
    user_token: str,
    project_id: str = None,
    community_tokens: list = None
) -> Dict[str, Any]:
    """
    Обновляет данные о зрителях для списка историй.
    
    v2.0: Использует ПАРАЛЛЕЛЬНУЮ обработку если > 1 истории.
    v2.1: Пропускает финализированные истории (stats_finalized=True).
    v3.0: Эксклюзивный режим community_tokens: если есть — ТОЛЬКО они.
    """
    if not logs:
        return {"status": "ok", "updated": 0, "errors": []}

    # Парсим логи
    parsed = _parse_stories_from_logs(logs)
    stories_to_process = parsed["stories_to_process"]
    logs_needs_final_viewers = parsed["logs_needs_final_viewers"]
    group_id = parsed["group_id"]
    skipped_count = parsed["skipped_count"]

    if not stories_to_process:
        return {"status": "ok", "updated": 0, "skipped": skipped_count, "errors": []}

    if skipped_count > 0:
        print(f"[Viewers] Skipped {skipped_count} viewers-finalized stories")

    # Определяем project_id если не передан
    if not project_id and logs:
        project_id = logs[0].project_id

    print(f"[Viewers] Processing {len(stories_to_process)} stories (group_id={group_id})")

    # Параллельная обработка (для > 1 истории)
    if len(stories_to_process) > 1 and group_id:
        return _process_parallel(
            db, stories_to_process, logs_needs_final_viewers,
            group_id, project_id, skipped_count, community_tokens
        )

    # Последовательная обработка (для 1 истории или fallback)
    return _process_sequential(
        db, stories_to_process, logs_needs_final_viewers,
        group_id, user_token, skipped_count, community_tokens
    )
