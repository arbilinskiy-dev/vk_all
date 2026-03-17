import json, os

base = os.path.join(os.environ['APPDATA'], 'Code', 'User', 'workspaceStorage', '2fc0c25da1c9c77c3db0a48c482fd244', 'chatSessions')

for fname in sorted(os.listdir(base)):
    if not fname.endswith('.jsonl'):
        continue
    fpath = os.path.join(base, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        first_line = f.readline().strip()
    
    try:
        obj = json.loads(first_line)
    except:
        continue
    
    v = obj.get('v', {})
    title = v.get('customTitle', 'No title')
    created = v.get('creationDate', 0)
    reqs = v.get('requests', [])
    
    print(f'\n===== {fname} =====')
    print(f'Title: {title}, Created: {created}, Requests: {len(reqs)}')
    
    for i, req in enumerate(reqs):
        msg = req.get('message', {})
        msg_keys = list(msg.keys()) if isinstance(msg, dict) else 'N/A'
        print(f'  Req {i}: msg_keys={msg_keys}')
        if isinstance(msg, dict):
            for mk, mv in msg.items():
                if isinstance(mv, str) and len(mv) < 500 and not mv.startswith('<context') and not mv.startswith('<environment'):
                    print(f'    {mk}: {mv[:300]}')
                elif isinstance(mv, str):
                    print(f'    {mk}: [{len(mv)} chars]')
                elif isinstance(mv, dict):
                    print(f'    {mk}: dict with keys {list(mv.keys())[:5]}')
                elif isinstance(mv, list):
                    print(f'    {mk}: list[{len(mv)}]')
                else:
                    print(f'    {mk}: {type(mv).__name__}')
