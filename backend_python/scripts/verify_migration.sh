#!/bin/bash
# Быстрая проверка результатов миграции
export PGPASSWORD=asd232asd232
PROD_HOST="c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net"
PORT=6432
DB=db1
USER=user1
PSQL="psql -h $PROD_HOST -p $PORT -U $USER -d $DB"

echo "=== НОВЫЕ ТАБЛИЦЫ (должны быть заполнены) ==="
for tbl in vk_profiles project_members member_events post_interactions project_dialogs project_authors; do
  cnt=$($PSQL -t -c "SELECT COUNT(*) FROM $tbl" 2>&1)
  echo "$tbl: $cnt"
done

echo ""
echo "=== СТАРЫЕ ТАБЛИЦЫ (должны быть на месте) ==="
for tbl in system_list_subscribers system_list_mailing system_list_likes system_list_comments system_list_reposts system_list_history_join system_list_history_leave system_list_authors; do
  cnt=$($PSQL -t -c "SELECT COUNT(*) FROM $tbl" 2>&1)
  echo "$tbl: $cnt"
done
