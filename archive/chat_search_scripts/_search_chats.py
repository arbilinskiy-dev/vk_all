import json, os, glob

base = os.path.join(os.environ['APPDATA'], 'Code', 'User', 'workspaceStorage', '2fc0c25da1c9c77c3db0a48c482fd244', 'chatSessions')
files = glob.glob(os.path.join(base, '*.jsonl'))

keywords = ['джарвис', 'jarvis', 'автор', 'пост', 'напиши', 'скилл']

for fpath in sorted(files):
    fname = os.path.basename(fpath)
    with open(fpath, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except:
                continue
            
            if obj.get('kind') == 0:
                # Session header - extract initial requests
                reqs = obj.get('v', {}).get('requests', [])
                for req in reqs:
                    msg = req.get('message', {})
                    if isinstance(msg, dict):
                        val = msg.get('value', '')
                    elif isinstance(msg, str):
                        val = msg
                    else:
                        continue
                    if val and len(val) < 1000 and not val.startswith('<context') and not val.startswith('<environment'):
                        if any(kw in val.lower() for kw in keywords):
                            print(f'===== {fname} (line {line_num}, kind=0) =====')
                            print(f'MSG: {val[:600]}')
                            print('---')
            
            elif obj.get('kind') == 2:
                k = obj.get('k', [])
                v = obj.get('v', [])
                if k and k[0] == 'requests' and isinstance(v, list):
                    for req in v:
                        msg = req.get('message', {})
                        if isinstance(msg, dict):
                            val = msg.get('value', '')
                        elif isinstance(msg, str):
                            val = msg
                        else:
                            continue
                        if val and len(val) < 1000 and not val.startswith('<context') and not val.startswith('<environment'):
                            if any(kw in val.lower() for kw in keywords):
                                print(f'===== {fname} (line {line_num}, kind=2) =====')
                                print(f'MSG: {val[:600]}')
                                print('---')
