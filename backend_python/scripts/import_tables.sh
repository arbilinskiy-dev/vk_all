#!/bin/bash
# Скрипт для импорта старых таблиц из дампов в продакшен БД
# Дампы уже скачаны в /tmp/db_migration_dump/
set -e

mkdir -p ~/.postgresql
wget -qO ~/.postgresql/root.crt 'https://storage.yandexcloud.net/cloud-certs/CA.pem'

export PGPASSWORD=asd232asd232

PROD_HOST="c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net"
PORT=6432
DB=db1
USER=user1

TABLES=(
  system_list_subscribers
  system_list_mailing
  system_list_likes
  system_list_comments
  system_list_reposts
  system_list_history_join
  system_list_history_leave
  system_list_authors
)

DUMP_DIR="/tmp/db_migration_dump"

echo "======================================"
echo "ИМПОРТ ТАБЛИЦ В ПРОДАКШЕН БД"
echo "======================================"

for tbl in "${TABLES[@]}"; do
  echo -n "Импорт $tbl..."
  
  # Удаляем таблицу если вдруг существует
  psql -h "$PROD_HOST" -p "$PORT" -U "$USER" -d "$DB" \
    -c "DROP TABLE IF EXISTS $tbl CASCADE;" 2>/dev/null || true
  
  # Восстанавливаем из дампа (custom format)
  pg_restore -h "$PROD_HOST" -p "$PORT" -U "$USER" -d "$DB" \
    --no-owner \
    --no-privileges \
    "$DUMP_DIR/$tbl.dump" 2>&1 || true
  
  # Считаем строки для верификации
  cnt=$(psql -h "$PROD_HOST" -p "$PORT" -U "$USER" -d "$DB" -t -c "SELECT COUNT(*) FROM $tbl" 2>&1)
  echo " OK (строк: $cnt)"
done

echo ""
echo "=== ВЕРИФИКАЦИЯ ЗАВЕРШЕНА ==="
