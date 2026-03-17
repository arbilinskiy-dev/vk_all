import json, os

base = os.path.join(os.environ['APPDATA'], 'Code', 'User', 'workspaceStorage', '2fc0c25da1c9c77c3db0a48c482fd244', 'chatSessions')
fpath = os.path.join(base, '0e11f163-a13e-470e-b5a0-ece75ce04e34.jsonl')

with open(fpath, 'r', encoding='utf-8') as f:
    for line_num, line in enumerate(f, 1):
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except Exception as e:
            print(f'Line {line_num}: PARSE ERROR: {e}')
            continue
        
        kind = obj.get('kind')
        k = obj.get('k', [])
        
        if kind == 0:
            # Full session dump
            v = obj.get('v', {})
            title = v.get('customTitle', 'No title')
            created = v.get('creationDate', 0)
            reqs = v.get('requests', [])
            print(f'Line {line_num}: KIND=0, title={title}, created={created}, requests={len(reqs)}')
            for i, req in enumerate(reqs):
                msg = req.get('message', {})
                if isinstance(msg, dict):
                    msg_val = msg.get('value', '<no value>')[:200]
                else:
                    msg_val = str(msg)[:200]
                print(f'  Request {i}: message type={type(msg).__name__}')
                print(f'  Message: {msg_val}')
                print()
        else:
            print(f'Line {line_num}: KIND={kind}, k={k[:3]}')
