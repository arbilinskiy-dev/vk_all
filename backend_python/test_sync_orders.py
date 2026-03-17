"""
Тестирование синхронизации заказов DLVRY.
Вызывает sync_dlvry_orders_for_project напрямую — как это делает роутер.
Результат записывается в test_sync_result.txt.
"""
import os
import sys
import json
import logging

RESULT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_sync_result.txt")

# Настройка логирования — INFO в файл (не DEBUG, иначе 50MB+)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(RESULT_FILE, mode="w", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)

# Добавляем backend_python в путь
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from database import SessionLocal, engine
from services.dlvry.orders_sync_service import sync_dlvry_orders_for_project
from db_migrations import dlvry_orders as dlvry_orders_migration

AFFILIATE_ID = "2579645"
PROJECT_ID = "0fa9bb5a-26bc-478a-bf1a-b9bbf93b18ee"


def main():
    logger.info("=" * 60)
    logger.info("Тест: sync_dlvry_orders_for_project (инкрементальный)")
    logger.info("=" * 60)

    # Миграция таблиц (с пересозданием для тестов)
    logger.info("Дропаем старые таблицы для чистого теста...")
    from sqlalchemy import text, inspect as sa_inspect
    with engine.begin() as conn:
        for tbl in ['dlvry_order_items', 'dlvry_webhook_logs', 'dlvry_orders']:
            conn.execute(text(f'DROP TABLE IF EXISTS {tbl}'))
    logger.info("Запуск миграции dlvry_orders...")
    dlvry_orders_migration.migrate(engine)
    logger.info("Миграция завершена.")

    db = SessionLocal()
    try:
        result = sync_dlvry_orders_for_project(
            db=db,
            project_id=PROJECT_ID,
            affiliate_id=AFFILIATE_ID,
        )
        logger.info("=" * 60)
        logger.info("РЕЗУЛЬТАТ:")
        logger.info(json.dumps(result, indent=2, ensure_ascii=False, default=str))
        logger.info("=" * 60)

        # Также запишем результат отдельно
        with open(RESULT_FILE, "a", encoding="utf-8") as f:
            f.write("\n\n### FINAL RESULT ###\n")
            f.write(json.dumps(result, indent=2, ensure_ascii=False, default=str))
            f.write("\n")

    except Exception as e:
        logger.error(f"ОШИБКА: {e}", exc_info=True)
    finally:
        db.close()

    # Signal completion
    done_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_sync_done.flag")
    with open(done_file, "w") as f:
        f.write("done")


if __name__ == "__main__":
    main()
