"""Скрипт для вывода всех доступных токенов в системе."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models_library.system_accounts import SystemAccount
from models_library.projects import Project
from config import settings

db = SessionLocal()

# 1. ENV tokens
print("=== ENV TOKENS ===")
ut = settings.vk_user_token
print(f"  vk_user_token: {ut[:12]}... (len={len(ut)})")
sk = settings.vk_service_key
if sk:
    print(f"  vk_service_key: {sk[:12]}... (len={len(sk)})")
else:
    print("  vk_service_key: NOT SET")

# 2. System accounts
accounts = db.query(SystemAccount).all()
print()
print("=== SYSTEM ACCOUNTS ===")
for a in accounts:
    tok = a.token or ""
    tok_preview = tok[:12] + "..." if len(tok) > 12 else tok
    print(f"  vk_id={a.vk_user_id}, name={a.full_name}, status={a.status}, token={tok_preview}")

# 3. Projects with community tokens
projects = db.query(Project).all()
print()
print("=== PROJECTS ===")
for p in projects:
    ct = p.communityToken or ""
    ct_preview = ct[:12] + "..." if len(ct) > 12 else ct
    extras_raw = p.additional_community_tokens
    extras = json.loads(extras_raw) if extras_raw else []
    group_id = getattr(p, "communityId", "?")
    name = getattr(p, "communityName", "?")
    print(f"  group_id={group_id}, name={name}")
    print(f"    communityToken: {ct_preview}")
    if extras:
        for i, et in enumerate(extras):
            etp = et[:12] + "..." if len(et) > 12 else et
            print(f"    extra_token[{i}]: {etp}")

# 4. VK Users (OAuth)
try:
    from models_library.vk_users import VkUser
    vk_users = db.query(VkUser).all()
    print()
    print("=== VK USERS (OAuth) ===")
    for u in vk_users:
        tok = u.access_token or ""
        tok_preview = tok[:12] + "..." if len(tok) > 12 else tok
        print(f"  vk_user_id={u.vk_user_id}, scope={u.scope}, app_id={u.app_id}, token={tok_preview}")
except Exception as e:
    print(f"\n=== VK USERS: {e} ===")

db.close()
