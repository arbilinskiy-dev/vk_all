#!/bin/bash
# Финальная миграция v2: стоп → TRUNCATE → pull → миграция → старт
set -e

export PGPASSWORD=asd232asd232
PROD_HOST="c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net"
PORT=6432
DB=db1
USER=user1
PSQL="psql -h $PROD_HOST -p $PORT -U $USER -d $DB"

cd /home/yc-user/vkplanner

echo "=== ШАГ 1: Остановка бэкенда ==="
sudo docker compose down
echo "OK"

echo ""
echo "=== ШАГ 2: Pull нового образа ==="
sudo docker compose pull
echo "OK"

echo ""
echo "=== ШАГ 3: TRUNCATE новых таблиц ==="
for tbl in post_interactions member_events project_dialogs project_authors project_members vk_profiles; do
  echo -n "  TRUNCATE $tbl... "
  $PSQL -c "TRUNCATE TABLE $tbl CASCADE;" 2>&1 | tr -d '\n'
  echo " OK"
done

echo ""
echo "=== ШАГ 4: Запуск миграции (без бэкенда) ==="
sudo docker compose run --rm --no-deps backend python -c "
from database import engine
from migrations import run_migrations
print('>>> Запуск миграций...')
run_migrations(engine)
print('>>> Миграции завершены.')
" 2>&1

echo ""
echo "=== ШАГ 5: Верификация ==="
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
echo "=== ШАГ 6: Запуск бэкенда ==="
sudo docker compose up -d backend
echo "OK. Бэкенд запущен."

echo ""
echo "=== ВОССТАНОВЛЕНИЕ ДАННЫХ ЗАВЕРШЕНО ==="
