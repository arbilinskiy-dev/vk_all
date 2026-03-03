#!/bin/bash
# Скрипт для очистки неполных данных в новых таблицах перед ре-миграцией
# Выполняется ПЕРЕД перезапуском бэкенда с обновлённым кодом
set -e

export PGPASSWORD=asd232asd232
PROD_HOST="c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net"
PORT=6432
DB=db1
USER=user1

PSQL="psql -h $PROD_HOST -p $PORT -U $USER -d $DB"

echo "======================================"
echo "ЭТАП 1: Текущее состояние новых таблиц"
echo "======================================"
for tbl in vk_profiles project_members member_events post_interactions project_dialogs project_authors; do
  cnt=$($PSQL -t -c "SELECT COUNT(*) FROM $tbl" 2>&1)
  echo "$tbl: $cnt"
done

echo ""
echo "======================================"
echo "ЭТАП 2: TRUNCATE новых таблиц (очистка неполных данных)"
echo "======================================"

# Порядок важен из-за FK! Сначала зависимые, потом главные.
for tbl in post_interactions member_events project_dialogs project_authors project_members vk_profiles; do
  echo -n "TRUNCATE $tbl... "
  $PSQL -c "TRUNCATE TABLE $tbl CASCADE;" 2>&1
  echo "OK"
done

echo ""
echo "======================================"
echo "ЭТАП 3: Верификация (должно быть 0)"
echo "======================================"
for tbl in vk_profiles project_members member_events post_interactions project_dialogs project_authors; do
  cnt=$($PSQL -t -c "SELECT COUNT(*) FROM $tbl" 2>&1)
  echo "$tbl: $cnt"
done

echo ""
echo "======================================"
echo "ЭТАП 4: Проверка старых таблиц (должны содержать данные)"
echo "======================================"
for tbl in system_list_subscribers system_list_mailing system_list_likes system_list_comments system_list_reposts system_list_history_join system_list_history_leave system_list_authors; do
  cnt=$($PSQL -t -c "SELECT COUNT(*) FROM $tbl" 2>&1)
  echo "$tbl: $cnt"
done

echo ""
echo "=== ГОТОВО. Теперь можно деплоить обновлённый бэкенд ==="
