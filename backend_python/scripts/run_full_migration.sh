#!/bin/bash
# Полный цикл: стоп бэкенда → TRUNCATE → миграция → старт
set -e

export PGPASSWORD=asd232asd232
PROD_HOST="c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net"
PORT=6432
DB=db1
USER=user1
PSQL="psql -h $PROD_HOST -p $PORT -U $USER -d $DB"

cd /home/yc-user/vkplanner

echo "=== ШАГ 1: Остановка бэкенда ==="
sudo docker compose stop backend
echo "Бэкенд остановлен."

echo ""
echo "=== ШАГ 2: TRUNCATE новых таблиц ==="
for tbl in post_interactions member_events project_dialogs project_authors project_members vk_profiles; do
  echo -n "TRUNCATE $tbl... "
  $PSQL -c "TRUNCATE TABLE $tbl CASCADE;" 2>&1
  echo "OK"
done

echo ""
echo "=== ШАГ 3: Проверка (новые = 0, старые полные) ==="
echo "Новые:"
for tbl in vk_profiles project_members member_events post_interactions project_dialogs project_authors; do
  cnt=$($PSQL -t -c "SELECT COUNT(*) FROM $tbl" 2>&1)
  echo "  $tbl: $cnt"
done
echo "Старые:"
for tbl in system_list_subscribers system_list_mailing system_list_likes system_list_comments system_list_reposts system_list_history_join system_list_history_leave system_list_authors; do
  cnt=$($PSQL -t -c "SELECT COUNT(*) FROM $tbl" 2>&1)
  echo "  $tbl: $cnt"
done

echo ""
echo "=== ШАГ 4: Запуск миграции через docker exec ==="
# Запускаем контейнер без gunicorn, только для миграции
sudo docker compose run --rm --no-deps -e RUN_MIGRATION_ONLY=1 backend python -c "
from database import engine
from migrations import run_migrations
print('>>> Запуск миграций...')
run_migrations(engine)
print('>>> Миграции завершены.')
"

echo ""
echo "=== ШАГ 5: Верификация после миграции ==="
echo "Новые:"
for tbl in vk_profiles project_members member_events post_interactions project_dialogs project_authors; do
  cnt=$($PSQL -t -c "SELECT COUNT(*) FROM $tbl" 2>&1)
  echo "  $tbl: $cnt"
done
echo "Старые (должны остаться — cleanup не сработает при ratio >= 50%):"
for tbl in system_list_subscribers system_list_mailing system_list_likes system_list_comments system_list_reposts system_list_history_join system_list_history_leave system_list_authors; do
  cnt=$($PSQL -t -c "SELECT COUNT(*) FROM $tbl" 2>&1)
  echo "  $tbl: $cnt"
done

echo ""
echo "=== ШАГ 6: Перезапуск бэкенда ==="
sudo docker compose up -d backend
echo "Бэкенд запущен."

echo ""
echo "=== ВОССТАНОВЛЕНИЕ ДАННЫХ ЗАВЕРШЕНО ==="
