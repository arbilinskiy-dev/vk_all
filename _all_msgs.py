import json, os

base = os.path.join(os.environ['APPDATA'], 'Code', 'User', 'workspaceStorage', '2fc0c25da1c9c77c3db0a48c482fd244', 'chatSessions')

# Check ALL requests in ALL lines
for fname in sorted(os.listdir(base)):
    if not fname.endswith('.jsonl'):
        continue
    fpath = os.path.join(base, fname)
    all_msgs = []
    
    with open(fpath, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except:
                continue
            
            kind = obj.get('kind')
            k = obj.get('k', [])
            v = obj.get('v')
            
            # kind=0: initial state
            if kind == 0:
                reqs = obj.get('v', {}).get('requests', [])
                for i, req in enumerate(reqs):
                    msg = req.get('message', {})
                    text = msg.get('text', '') if isinstance(msg, dict) else ''
                    if text and not text.startswith('<context') and not text.startswith('<environment'):
                        all_msgs.append((f'init-req{i}', text))
            
            # kind=2, k=['requests',...]: updated requests
            elif kind == 2 and k and k[0] == 'requests':
                if isinstance(v, list):
                    for i, req in enumerate(v):
                        msg = req.get('message', {})
                        text = msg.get('text', '') if isinstance(msg, dict) else ''
                        if text and not text.startswith('<context') and not text.startswith('<environment'):
                            all_msgs.append((f'update-L{line_num}', text))
    
    if all_msgs:
        print(f'\n===== {fname} =====')
        for tag, msg in all_msgs:
            short = msg[:400].replace('\n', ' ').replace('\r', '')
            print(f'  [{tag}]: {short}')
            print()
