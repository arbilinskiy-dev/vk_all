#!/bin/bash
# Скрипт для переноса старых таблиц из бэкапа в текущую продакшен БД
# Этап 1: pg_dump из временного кластера → pg_restore в продакшен
set -e

mkdir -p ~/.postgresql
wget -qO ~/.postgresql/root.crt 'https://storage.yandexcloud.net/cloud-certs/CA.pem'

export PGPASSWORD=asd232asd232

TEMP_HOST="c-c9qo0p1jm3dudta26ib5.rw.mdb.yandexcloud.net"
PROD_HOST="c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net"
PORT=6432
DB=db1
USER=user1
SSLMODE="sslmode=verify-full"

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
mkdir -p "$DUMP_DIR"

echo "======================================"
echo "ЭТАП 1: Экспорт таблиц из бэкапа"
echo "======================================"

for tbl in "${TABLES[@]}"; do
  echo -n "Экспорт $tbl..."
  pg_dump "host=$TEMP_HOST port=$PORT dbname=$DB user=$USER $SSLMODE" \
    --table="$tbl" \
    --no-owner \
    --no-privileges \
    --format=custom \
    -f "$DUMP_DIR/$tbl.dump" 2>&1
  size=$(stat -c%s "$DUMP_DIR/$tbl.dump" 2>/dev/null || echo "?")
  echo " OK ($size bytes)"
done

echo ""
echo "======================================"
echo "ЭТАП 2: Импорт таблиц в продакшен БД"
echo "======================================"

for tbl in "${TABLES[@]}"; do
  echo -n "Импорт $tbl..."
  
  # Удаляем таблицу если вдруг существует (остатки)
  psql "host=$PROD_HOST port=$PORT dbname=$DB user=$USER $SSLMODE" \
    -c "DROP TABLE IF EXISTS $tbl CASCADE;" 2>/dev/null || true
  
  # Восстанавливаем из дампа
  pg_restore "host=$PROD_HOST port=$PORT dbname=$DB user=$USER $SSLMODE" \
    --no-owner \
    --no-privileges \
    -d "host=$PROD_HOST port=$PORT dbname=$DB user=$USER $SSLMODE" \
    "$DUMP_DIR/$tbl.dump" 2>&1
  echo " OK"
done

echo ""
echo "======================================"
echo "ЭТАП 3: Верификация"
echo "======================================"

for tbl in "${TABLES[@]}"; do
  cnt=$(psql "host=$PROD_HOST port=$PORT dbname=$DB user=$USER $SSLMODE" -t -c "SELECT COUNT(*) FROM $tbl" 2>&1)
  echo "$tbl: $cnt"
done

echo ""
echo "=== МИГРАЦИЯ ЗАВЕРШЕНА ==="
