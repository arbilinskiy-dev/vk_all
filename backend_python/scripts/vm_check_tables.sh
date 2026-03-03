#!/bin/bash
export PGPASSWORD=asd232asd232
CONNSTR="host=c-c9qgkb8mi31to563td6n.rw.mdb.yandexcloud.net port=6432 dbname=db1 user=user1 sslmode=verify-full sslrootcert=/home/yc-user/.postgresql/root.crt"
for TBL in vk_profiles project_members member_events post_interactions project_dialogs project_authors system_list_subscribers system_list_mailing system_list_likes system_list_comments system_list_reposts system_list_history_join system_list_history_leave system_list_authors; do
  CNT=$(psql "$CONNSTR" -t -A -c "SELECT COUNT(*) FROM $TBL" 2>/dev/null)
  if [ $? -eq 0 ]; then
    echo "$TBL: $CNT"
  else
    echo "$TBL: NOT_EXISTS"
  fi
done
