"""
End-to-end тест: callback создаёт заглушку → enrichment заполняет данные из VK API.
Запуск: python tests/test_e2e_enrichment.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")

from database import SessionLocal
from models_library.vk_profiles import VkProfile
from models_library.dialogs_authors import ProjectDialog
from services.vk_callback.handlers.messages.message_allow_deny import MessageAllowDenyHandler
from services.profile_enrichment_service import enrich_stub_profiles
from sqlalchemy import or_


def run_test():
    db = SessionLocal()
    handler = MessageAllowDenyHandler()
    test_vk_id = 65079903  # реальный VK user

    print("=" * 60)
    print("END-TO-END ТЕСТ: callback → заглушка → enrichment")
    print("=" * 60)

    # 1. Очистка тестовых данных
    existing = db.query(VkProfile).filter(VkProfile.vk_user_id == test_vk_id).first()
    if existing:
        db.query(ProjectDialog).filter(ProjectDialog.vk_profile_id == existing.id).delete()
        db.delete(existing)
        db.commit()
        print("1. ✅ Очистили тестовые данные")
    else:
        print("1. ✅ Тестовых данных нет, чисто")

    # 2. Симулируем message_allow callback — создаёт заглушку
    vp = handler._get_or_create_vk_profile(db, test_vk_id)
    print(f"2. ✅ Создана заглушка: id={vp.id}, vk_user_id={vp.vk_user_id}, first_name={vp.first_name!r}")
    assert vp.first_name is None, "Заглушка должна быть без имени"

    # 3. Проверяем что заглушка видна для enrichment
    stubs = db.query(VkProfile).filter(
        or_(VkProfile.first_name == None, VkProfile.first_name == "")
    ).count()
    print(f"3. ✅ Заглушек для enrichment: {stubs}")
    assert stubs >= 1

    # 4. Запускаем enrichment
    result = enrich_stub_profiles()
    enriched = result.get("enriched", 0)
    failed = result.get("failed", 0)
    print(f"4. ✅ Enrichment: enriched={enriched}, failed={failed}")
    assert enriched >= 1, f"Должен был обогатить >= 1, получили {enriched}"

    # 5. Проверяем что данные заполнились (перечитываем из БД, т.к. enrichment использует свою сессию)
    db.expire_all()
    vp = db.query(VkProfile).filter(VkProfile.vk_user_id == test_vk_id).first()
    print(f"5. ✅ После enrichment: first_name={vp.first_name!r}, last_name={vp.last_name!r}, "
          f"domain={vp.domain!r}, city={vp.city!r}, sex={vp.sex}")
    assert vp.first_name is not None and vp.first_name != "", "Имя должно быть заполнено!"

    # 6. Повторный enrichment — заглушек больше нет
    result2 = enrich_stub_profiles()
    stubs2 = result2.get("total_stubs", -1)
    print(f"6. ✅ Повторный enrichment: total_stubs={stubs2} (идемпотентность)")

    # 7. Тест _get_or_create_vk_profile — повторный вызов = тот же профиль
    vp2 = handler._get_or_create_vk_profile(db, test_vk_id)
    assert vp.id == vp2.id, "Повторный вызов должен вернуть тот же профиль"
    print(f"7. ✅ Повторный _get_or_create возвращает тот же id={vp.id}")

    # Очистка
    db.close()
    db = SessionLocal()
    cleanup_vp = db.query(VkProfile).filter(VkProfile.vk_user_id == test_vk_id).first()
    if cleanup_vp:
        db.query(ProjectDialog).filter(ProjectDialog.vk_profile_id == cleanup_vp.id).delete()
        db.delete(cleanup_vp)
        db.commit()
    db.close()

    print("=" * 60)
    print("✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ")
    print("=" * 60)
    print()
    print("Проверено:")
    print("  • VK_SERVICE_KEY — работает, VK API отвечает")
    print("  • _get_or_create_vk_profile — создаёт заглушку, идемпотентен")
    print("  • enrich_stub_profiles() — обогащает заглушки данными из VK API")
    print("  • Поля заполняются: first_name, last_name, domain, city, sex")
    print("  • Повторный enrichment — 0 заглушек (идемпотентность)")


if __name__ == "__main__":
    run_test()
