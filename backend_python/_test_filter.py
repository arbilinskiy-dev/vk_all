"""Quick API test for date filtering on current server."""
import requests

BASE = "http://127.0.0.1:8000/api"
PID = "0fa9bb5a-26bc-478a-bf1a-b9bbf93b18ee"

# Test yesterday filter
r = requests.get(f"{BASE}/dlvry/orders", params={
    "project_id": PID,
    "date_from": "2026-03-11",
    "date_to": "2026-03-11",
    "skip": "0",
    "limit": "5"
})
print(f"Yesterday filter: status={r.status_code}, total={r.json().get('total')}")

# Test today filter
r2 = requests.get(f"{BASE}/dlvry/orders", params={
    "project_id": PID,
    "date_from": "2026-03-12",
    "date_to": "2026-03-12",
    "skip": "0",
    "limit": "5"
})
print(f"Today filter: status={r2.status_code}, total={r2.json().get('total')}")

# Test stats
r3 = requests.get(f"{BASE}/dlvry/orders/stats", params={
    "project_id": PID,
    "date_from": "2026-03-11",
    "date_to": "2026-03-11",
})
print(f"Stats yesterday: status={r3.status_code}, data={r3.json()}")

# Test no filter
r4 = requests.get(f"{BASE}/dlvry/orders", params={
    "project_id": PID,
    "skip": "0",
    "limit": "5"
})
print(f"No filter: status={r4.status_code}, total={r4.json().get('total')}")
