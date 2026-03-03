#!/bin/bash
export PGPASSWORD=asd232asd232
CONNSTR="host=c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net port=6432 dbname=db1 user=user1 sslmode=verify-full sslrootcert=/home/yc-user/.postgresql/root.crt"

echo "=== Активные запросы ==="
psql "$CONNSTR" -c "SELECT pid, state, NOW()-query_start as duration, LEFT(query, 100) as query FROM pg_stat_activity WHERE state != 'idle' AND query NOT LIKE '%pg_stat%';"

echo "=== Отменяю медленные запросы (>30 сек) ==="
psql "$CONNSTR" -c "SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE state != 'idle' AND query NOT LIKE '%pg_stat%' AND NOW()-query_start > interval '30 seconds';"
