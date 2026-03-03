#!/bin/bash
# Дедупликация member_events — удаление дублей, оставляя записи с наименьшим id
export PGPASSWORD=asd232asd232
CONNSTR="host=c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net port=6432 dbname=db1 user=user1 sslmode=verify-full sslrootcert=/home/yc-user/.postgresql/root.crt"

echo "=== member_events ДО дедупликации ==="
psql "$CONNSTR" -t -A -c "SELECT COUNT(*) as total FROM member_events"

echo "=== Количество дублей ==="
psql "$CONNSTR" -t -A -c "
SELECT COUNT(*) FROM member_events me
WHERE me.id NOT IN (
    SELECT MIN(id) FROM member_events
    GROUP BY project_id, vk_profile_id, event_type, event_date
)
"

echo "=== Удаляю дубли ==="
psql "$CONNSTR" -c "
DELETE FROM member_events
WHERE id NOT IN (
    SELECT MIN(id) FROM member_events
    GROUP BY project_id, vk_profile_id, event_type, event_date
)
"

echo "=== member_events ПОСЛЕ дедупликации ==="
psql "$CONNSTR" -t -A -c "SELECT COUNT(*) as total FROM member_events"
