"""
Скрипт для диагностики и починки зависшего цикла конкурса отзывов.

Использование:
  # Только диагностика (без изменений):
  python scripts/fix_stuck_contest_cycle.py

  # Починка (автоматически перевод commented → used/winner):
  python scripts/fix_stuck_contest_cycle.py --fix

Запускать из backend_python/ (или указать правильный PYTHONPATH).
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import _session_factory
import models

def diagnose_and_fix(do_fix: bool = False):
    db = _session_factory()
    try:
        # 1. Получаем все конкурсы
        contests = db.query(models.ReviewContest).all()
        
        if not contests:
            print("❌ Конкурсы отзывов не найдены в БД.")
            return
        
        print(f"\n{'='*70}")
        print(f"ДИАГНОСТИКА КОНКУРСОВ ОТЗЫВОВ — найдено {len(contests)} конкурсов")
        print(f"{'='*70}\n")
        
        for contest in contests:
            print(f"📌 Конкурс ID: {contest.id}")
            print(f"   Проект: {contest.project_id}")
            print(f"   Активен: {contest.is_active}")
            print(f"   Условие: {contest.finish_condition}, лимит: {contest.target_count}")
            print(f"   Авто-бан: {contest.auto_blacklist}")
            
            # Считаем entries по статусам
            statuses = db.query(
                models.ReviewContestEntry.status,
                db.query(models.ReviewContestEntry).filter(
                    models.ReviewContestEntry.contest_id == contest.id
                ).with_entities(
                    models.ReviewContestEntry.status
                ).subquery().c.status
            )
            
            # Проще: получаем все entries
            all_entries = db.query(models.ReviewContestEntry).filter(
                models.ReviewContestEntry.contest_id == contest.id
            ).all()
            
            status_counts = {}
            for entry in all_entries:
                status_counts[entry.status] = status_counts.get(entry.status, 0) + 1
            
            print(f"\n   📊 Статусы entries ({len(all_entries)} всего):")
            for status, count in sorted(status_counts.items()):
                icon = {"new": "⬜", "commented": "🟢", "winner": "🏆", "used": "⬛", "error": "🔴"}.get(status, "❓")
                print(f"      {icon} {status}: {count}")
            
            # Delivery logs
            delivery_logs = db.query(models.ReviewContestDeliveryLog).filter(
                models.ReviewContestDeliveryLog.contest_id == contest.id
            ).all()
            
            print(f"\n   📬 Delivery logs: {len(delivery_logs)}")
            winner_vk_ids = set()
            for log in delivery_logs:
                print(f"      - {log.user_name} (VK: {log.user_vk_id}), статус: {log.status}, дата: {log.created_at}")
                winner_vk_ids.add(log.user_vk_id)
            
            # Промокоды
            promos_total = db.query(models.PromoCode).filter(models.PromoCode.contest_id == contest.id).count()
            promos_free = db.query(models.PromoCode).filter(
                models.PromoCode.contest_id == contest.id,
                models.PromoCode.is_issued == False
            ).count()
            promos_issued = promos_total - promos_free
            print(f"\n   🎟️  Промокоды: {promos_total} всего, {promos_free} свободных, {promos_issued} выданных")
            
            # Проверяем зависание
            commented_count = status_counts.get('commented', 0)
            new_count = status_counts.get('new', 0)
            winner_count = status_counts.get('winner', 0)
            
            is_stuck = (
                len(delivery_logs) > 0 and  # есть доставки (финализация была)
                commented_count > 0 and     # но записи застряли в commented
                winner_count == 0           # и нет ни одного winner в entries
            )
            
            if is_stuck:
                print(f"\n   ⚠️  ОБНАРУЖЕН ЗАВИСШИЙ ЦИКЛ!")
                print(f"      Delivery logs показывают {len(delivery_logs)} розыгрышей,")
                print(f"      но {commented_count} записей застряли в 'commented' (должны быть 'used'/'winner').")
                print(f"      Победители по delivery_logs: {winner_vk_ids}")
                
                if do_fix:
                    print(f"\n   🔧 ИСПРАВЛЯЮ...")
                    
                    # Получаем entries в комментед
                    stuck = db.query(models.ReviewContestEntry).filter(
                        models.ReviewContestEntry.contest_id == contest.id,
                        models.ReviewContestEntry.status == 'commented'
                    ).all()
                    
                    fixed_winners = 0
                    fixed_used = 0
                    
                    for entry in stuck:
                        if entry.user_vk_id in winner_vk_ids:
                            entry.status = 'winner'
                            fixed_winners += 1
                        else:
                            entry.status = 'used'
                            fixed_used += 1
                    
                    db.commit()
                    print(f"   ✅ Готово! {fixed_winners} → winner, {fixed_used} → used")
                else:
                    print(f"\n   💡 Для починки запустите: python scripts/fix_stuck_contest_cycle.py --fix")
            else:
                print(f"\n   ✅ Цикл в норме")
            
            print(f"\n{'─'*70}\n")
    
    finally:
        db.close()

if __name__ == "__main__":
    do_fix = "--fix" in sys.argv
    if do_fix:
        print("🔧 Режим ПОЧИНКИ (--fix)")
    else:
        print("🔍 Режим ДИАГНОСТИКИ (без изменений)")
    
    diagnose_and_fix(do_fix)
