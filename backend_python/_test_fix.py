"""Симуляция: проверяем что фикс _collect_active_user_ids работает"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from crud.message_stats._users import _collect_active_user_ids, get_project_users

PROJECT_ID = 'a2b02ebd-76b2-4505-9bd1-8a86f0510fe2'
ALENA_ID = 493282588

db = SessionLocal()
try:
    # Тест 1: message_type='text' за сегодня
    active = _collect_active_user_ids(db, PROJECT_ID, '2026-03-02', '2026-03-02', message_type='text')
    print(f"active_ids (text, today): {sorted(active)}")
    print(f"  Алена (493282588) in active: {ALENA_ID in active}")

    # Тест 2: message_type='payload' за сегодня  
    active_p = _collect_active_user_ids(db, PROJECT_ID, '2026-03-02', '2026-03-02', message_type='payload')
    print(f"\nactive_ids (payload, today): {sorted(active_p)}")
    print(f"  Алена (493282588) in active: {ALENA_ID in active_p}")

    # Тест 3: без фильтра
    active_all = _collect_active_user_ids(db, PROJECT_ID, '2026-03-02', '2026-03-02', message_type=None)
    print(f"\nactive_ids (all, today): {sorted(active_all)}")

    # Тест 4: полный get_project_users с message_type='text'
    result = get_project_users(db, PROJECT_ID, date_from='2026-03-02', date_to='2026-03-02', message_type='text')
    print(f"\nget_project_users(text): total={result['total_count']}")
    for u in result['users']:
        marker = " <<< АЛЕНА" if u['vk_user_id'] == ALENA_ID else ""
        print(f"  uid={u['vk_user_id']} inc={u['incoming_count']} name={u.get('first_name','')} {u.get('last_name','')}{marker}")

finally:
    db.close()
