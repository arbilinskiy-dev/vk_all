import requests

# Получаем список проектов
r = requests.post('https://api.dosmmit.ru/api/getAllProjects', json={}, timeout=15)
print(f"Status: {r.status_code}")

if r.status_code == 200:
    data = r.json()
    # data может быть списком или объектом
    projects = data if isinstance(data, list) else data.get('projects', [])
    print(f"Total projects: {len(projects)}")
    for p in projects[:10]:
        pid = p.get('id', '?')
        name = p.get('name', '?')[:60]
        print(f"  {pid} | {name}")
    
    # Найдём ключиним
    for p in projects:
        name = p.get('name', '')
        if 'ключ' in name.lower() or 'КЛЮЧ' in name:
            pid = p.get('id')
            print(f"\n=== FOUND: {pid} | {name} ===")
            
            # Теперь проверим getMeta
            r2 = requests.post('https://api.dosmmit.ru/api/lists/system/getMeta', json={'projectId': pid}, timeout=15)
            print(f"getMeta status: {r2.status_code}")
            if r2.status_code == 200:
                meta = r2.json()
                print(f"Meta: {meta}")
            else:
                print(f"getMeta error: {r2.text[:500]}")
            
            # Проверим getStats для subscribers
            r3 = requests.post('https://api.dosmmit.ru/api/lists/system/getStats', json={'projectId': pid, 'listType': 'subscribers'}, timeout=15)
            print(f"\ngetStats(subscribers) status: {r3.status_code}")
            if r3.status_code == 200:
                stats = r3.json()
                print(f"total_users: {stats.get('total_users')}")
                print(f"Keys: {list(stats.keys())}")
            else:
                print(f"getStats error: {r3.text[:500]}")
            
            # Проверим getStats для mailing
            r4 = requests.post('https://api.dosmmit.ru/api/lists/system/getStats', json={'projectId': pid, 'listType': 'mailing'}, timeout=15)
            print(f"\ngetStats(mailing) status: {r4.status_code}")
            if r4.status_code == 200:
                stats = r4.json()
                print(f"total_users: {stats.get('total_users')}")
                print(f"mailing_stats: {stats.get('mailing_stats')}")
            else:
                print(f"getStats error: {r4.text[:500]}")
            
            break
else:
    print(f"Error: {r.text[:500]}")
