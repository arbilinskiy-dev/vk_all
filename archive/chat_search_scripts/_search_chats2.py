import json, os, glob

base = os.path.join(os.environ['APPDATA'], 'Code', 'User', 'workspaceStorage', '2fc0c25da1c9c77c3db0a48c482fd244', 'chatSessions')
files = glob.glob(os.path.join(base, '*.jsonl'))

for fpath in sorted(files):
    fname = os.path.basename(fpath)
    found_msgs = []
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
                reqs = obj.get('v', {}).get('requests', [])
                for req in reqs:
                    msg = req.get('message', {})
                    if isinstance(msg, dict):
                        val = msg.get('value', '')
                    elif isinstance(msg, str):
                        val = msg
                    else:
                        continue
                    if val and not val.startswith('<context') and not val.startswith('<environment') and not val.startswith('<attachment'):
                        found_msgs.append((line_num, 'init', val))
            
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
                        if val and not val.startswith('<context') and not val.startswith('<environment') and not val.startswith('<attachment'):
                            found_msgs.append((line_num, 'update', val))
    
    if found_msgs:
        print(f'\n===== {fname} =====')
        # Get session title
        with open(fpath, 'r', encoding='utf-8') as f:
            first_line = f.readline()
            try:
                hdr = json.loads(first_line)
                title = hdr.get('v', {}).get('customTitle', 'No title')
                created = hdr.get('v', {}).get('creationDate', 0)
                print(f'Title: {title}, Created: {created}')
            except:
                pass
        
        for ln, typ, msg in found_msgs:
            short = msg[:300].replace('\n', ' ').replace('\r', '')
            print(f'  [{typ} L{ln}] {short}')
            print()
