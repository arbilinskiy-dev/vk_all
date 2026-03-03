#!/bin/bash
# Оптимизированная дедупликация member_events через CTE + ROW_NUMBER
export PGPASSWORD=asd232asd232
CONNSTR="host=c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net port=6432 dbname=db1 user=user1 sslmode=verify-full sslrootcert=/home/yc-user/.postgresql/root.crt"

echo "=== member_events ДО ==="
psql "$CONNSTR" -t -A -c "SELECT COUNT(*) FROM member_events"

echo "=== Удаляю дубли через CTE ==="
psql "$CONNSTR" -c "
DELETE FROM member_events
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY project_id, vk_profile_id, event_type, event_date
            ORDER BY id
        ) as rn
        FROM member_events
    ) dupes
    WHERE rn > 1
)
"

echo "=== member_events ПОСЛЕ ==="
psql "$CONNSTR" -t -A -c "SELECT COUNT(*) FROM member_events"
