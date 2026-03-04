"""
Модуль-хаб для ПАРАЛЛЕЛЬНОГО обновления статистики историй VK.

v2.0: Параллельная обработка с ротацией токенов и fallback при ошибках.

Логика разнесена по модулям:
  - stats_utils.py  — константы, типы, хелперы сравнения
  - stats_client.py — VK API воркер (_fetch_story_stats)
"""
import re
from sqlalchemy.orm import Session
from models_library.automations import StoriesAutomationLog
import json
import concurrent.futures
from datetime import datetime, timezone
from typing import List, Dict, Any

from services.vk_api.admin_tokens import get_admin_token_strings_for_group
from services.automations.stories.stats_utils import StoryStatsData, _stats_are_equal
from services.automations.stories.stats_client import _fetch_story_stats


def batch_update_stats(
    db: Session, 
    logs: List[StoriesAutomationLog], 
    user_token: str,
    project_id: str = None,
    community_tokens: list = None
) -> Dict[str, Any]:
    """
    ПАРАЛЛЕЛЬНО обновляет статистику для списка историй.
    
    v2.0: Использует все доступные токены с приоритетом админов.
    v2.1: Пропускает финализированные истории (stats_finalized=True).
          После обновления проверяет: если история архивная (is_active=False)
          и новые данные совпадают с тем что уже было в БД → ставит stats_finalized=True.
    v3.0: Эксклюзивный режим community_tokens: если есть — используем ТОЛЬКО их.
    """
    if not logs:
        return {"status": "ok", "updated": 0}

    # Фильтруем: пропускаем финализированные истории
    active_logs = []
    skipped_count = 0
    for log in logs:
        if getattr(log, 'stats_finalized', False):
            skipped_count += 1
            continue
        active_logs.append(log)
    
    if skipped_count > 0:
        print(f"[Stats] Skipped {skipped_count} finalized stories")
    
    if not active_logs:
        return {"status": "ok", "updated": 0, "skipped": skipped_count}

    # Собираем данные о историях
    stories_to_process = []
    group_id = None
    no_link_count = 0  # Счётчик историй без story_link (не могут получить статистику)
    
    for log in active_logs:
        if not log.log:
            no_link_count += 1
            continue
        try:
            data = json.loads(log.log)
            link = data.get('story_link')
            if not link:
                no_link_count += 1
                continue
            
            # Поддерживаем оба домена: vk.com и vk.ru
            parts = re.sub(r'https?://vk\.(?:com|ru)/story', '', link).split('_')
            if len(parts) != 2:
                no_link_count += 1
                continue
            
            owner_id = parts[0]
            story_id = parts[1]
            
            # Извлекаем group_id
            if group_id is None and owner_id.startswith('-'):
                group_id = abs(int(owner_id))
            
            stories_to_process.append({
                'log': log,
                'owner_id': owner_id,
                'story_id': story_id
            })
        except:
            continue
            
    if not stories_to_process:
        return {"status": "ok", "updated": 0, "no_link": no_link_count}
    
    # Определяем project_id
    if not project_id and logs:
        project_id = logs[0].project_id
    
    # Получаем токены: если community_tokens → ТОЛЬКО они, иначе админ-токены → user_token
    tokens = []
    if community_tokens:
        # Эксклюзивный режим: ТОЛЬКО токены сообщества
        tokens = list(community_tokens)
        print(f"[Stats] Using {len(tokens)} community tokens (exclusive mode)")
    else:
        # Стандартный режим: админ-токены + fallback на user_token
        if group_id and project_id:
            admin_tokens = get_admin_token_strings_for_group(group_id, project_id)
            tokens = list(admin_tokens)
        
        # Fallback на user_token если нет других токенов
        if not tokens and user_token:
            tokens = [user_token]
    
    if not tokens:
        return {"status": "error", "message": "No tokens available", "updated": 0}
    
    print(f"[Stats] Processing {len(stories_to_process)} stories with {len(tokens)} tokens (parallel)...")
    
    # ========== ПАРАЛЛЕЛЬНАЯ ОБРАБОТКА ==========
    stats_results: List[StoryStatsData] = []
    max_workers = min(len(tokens), 15, len(stories_to_process))
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {}
        for i, item in enumerate(stories_to_process):
            future = executor.submit(
                _fetch_story_stats,
                item['owner_id'],
                item['story_id'],
                tokens,
                i
            )
            futures[future] = item
        
        for future in concurrent.futures.as_completed(futures):
            item = futures[future]
            result = future.result()
            
            # Связываем результат с логом
            result.log = item['log']
            stats_results.append(result)
            
            if result.success:
                print(f"[Stats] ✓ Story {result.owner_id}_{result.story_id}")
            else:
                print(f"[Stats] ✗ Story {result.owner_id}_{result.story_id}: {result.error}")
    
    # ========== СОХРАНЕНИЕ В БД ==========
    updated_count = 0
    finalized_count = 0
    updated_stories = []  # Список обновлённых историй для возврата на фронт
    
    for result in stats_results:
        if result.success and result.stats:
            new_stats_json = json.dumps(result.stats)
            old_stats_json = result.log.stats
            
            # Проверяем финализацию: история архивная + данные не изменились
            if not result.log.is_active and old_stats_json:
                try:
                    old_stats = json.loads(old_stats_json)
                    # Сравниваем ключевые метрики: views, replies, answer, shares, subscribers, bans, likes
                    if _stats_are_equal(old_stats, result.stats):
                        result.log.stats_finalized = True
                        finalized_count += 1
                        print(f"[Stats] 🔒 Finalized story {result.owner_id}_{result.story_id} (archived, data unchanged)")
                except:
                    pass
            
            # Если история активна — сбрасываем финализацию stats + viewers (на случай если кто-то вручную разархивировал)
            if result.log.is_active and getattr(result.log, 'stats_finalized', False):
                result.log.stats_finalized = False
                result.log.viewers_finalized = False
            
            result.log.stats = new_stats_json
            result.log.stats_updated_at = datetime.now(timezone.utc)
            updated_count += 1
            
            # Формируем данные для возврата на фронт
            updated_stories.append({
                'log_id': result.log.id,
                'vk_story_id': int(result.story_id),
                'detailed_stats': result.stats,
                'stats_updated_at': result.log.stats_updated_at.isoformat()
            })
        
        # Финализация перманентно недоступных историй (Error 15: Access denied, Error 100: story not found)
        # Если история архивная и VK стабильно отказывает в доступе — нет смысла переспрашивать
        elif not result.success and result.error and not result.log.is_active:
            if 'VK Error 15' in result.error or 'VK Error 100' in result.error:
                result.log.stats_finalized = True
                finalized_count += 1
                print(f"[Stats] 🔒 Finalized story {result.owner_id}_{result.story_id} (archived, permanently inaccessible)")
    
    try:
        db.commit()
    except Exception as e:
        print(f"[Stats] DB commit error: {e}")
        db.rollback()
        return {"status": "error", "message": str(e), "updated": 0}
    
    print(f"[Stats] ✓ Updated {updated_count}/{len(stories_to_process)} stories" + 
          (f", finalized {finalized_count}" if finalized_count else "") +
          (f", skipped {skipped_count}" if skipped_count else "") +
          (f", no_link {no_link_count}" if no_link_count else ""))
    
    # Считаем кол-во ошибок VK API
    failed_count = sum(1 for r in stats_results if not r.success)
    
    return {
        "status": "ok", 
        "updated": updated_count,
        "skipped": skipped_count,
        "finalized": finalized_count,
        "no_link": no_link_count,
        "failed": failed_count,
        "updated_stories": updated_stories  # Возвращаем обновлённые данные
    }
