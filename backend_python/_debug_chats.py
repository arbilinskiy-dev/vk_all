"""Debug script: test community_chats_service after fix."""
import json
from database import SessionLocal
from services.messages.community_chats_service import get_community_chats

PROJECT_ID = "203623179"

db = SessionLocal()
try:
    result = get_community_chats(db, PROJECT_ID)
    print(f"Chats count: {result['count']}")
    if result.get("error"):
        print(f"Error: {result['error']}")
    for c in result["chats"]:
        title = c.get("title", "?")
        peer_id = c.get("peer_id", "?")
        members = c.get("members_count", "?")
        unread = c.get("unread_count", 0)
        print(f"  peer_id={peer_id}, title={title}, members={members}, unread={unread}")
finally:
    db.close()
