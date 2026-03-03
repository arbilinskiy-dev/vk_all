#!/bin/bash
# Скрипт для проверки старых таблиц во временном кластере из бэкапа 25.02.2026
mkdir -p ~/.postgresql
wget -qO ~/.postgresql/root.crt 'https://storage.yandexcloud.net/cloud-certs/CA.pem'

export PGPASSWORD=asd232asd232
TEMP_HOST="c-c9qo0p1jm3dudta26ib5.rw.mdb.yandexcloud.net"

echo "=== ПРОВЕРКА ТАБЛИЦ В БЭКАПЕ 25.02.2026 ==="
for tbl in system_list_subscribers system_list_mailing system_list_likes system_list_comments system_list_reposts system_list_history_join system_list_history_leave system_list_authors; do
  cnt=$(psql "host=$TEMP_HOST port=6432 dbname=db1 user=user1 sslmode=verify-full" -t -c "SELECT COUNT(*) FROM $tbl" 2>&1)
  echo "$tbl: $cnt"
done
