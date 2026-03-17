import json, os, glob

ws_root = os.path.join(os.environ['APPDATA'], 'Code', 'User', 'workspaceStorage')

# Search ALL workspaces for chats where user specifically asked to write a post about Jarvis/personal assistant
# Also search for the generated post text (День pattern)
count = 0
for ws_dir in os.listdir(ws_root):
    ws_path = os.path.join(ws_root, ws_dir)
    chat_dir = os.path.join(ws_path, 'chatSessions')
    if not os.path.isdir(chat_dir):
        continue
    
    for fname in os.listdir(chat_dir):
        fpath = os.path.join(chat_dir, fname)
        if not os.path.isfile(fpath):
            continue
        
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            continue
        
        count += 1
        
        # Look for actual user request to write a post
        lower = content.lower()
        
        # Check for post about Jarvis / personal assistant / настроил
        relevance = 0
        if 'джарвис' in lower or 'jarvis' in lower:
            relevance += 1
        if 'напиши пост' in lower or 'пост про' in lower or 'пост о ' in lower:
            relevance += 1  
        if 'автор' in lower and ('скилл' in lower or 'стиле' in lower):
            relevance += 1
        if 'личн' in lower and 'помощник' in lower:
            relevance += 1
        if 'настроил' in lower:
            relevance += 1
        if 'вайбкодинг' in lower or 'нейронк' in lower:
            relevance += 1
        
        if relevance >= 3:
            # Get title
            first_line = content.split('\n')[0]
            try:
                hdr = json.loads(first_line)
                title = hdr.get('v', {}).get('customTitle', 'No title')
                created = hdr.get('v', {}).get('creationDate', 0)
            except:
                title = '?'
                created = 0
            
            print(f'\nRELEVANCE={relevance}: {ws_dir}/{fname}')
            print(f'  Title: {title}, Created: {created}')
            
            # Extract all user messages
            for line in content.split('\n'):
                if not line.strip():
                    continue
                try:
                    obj = json.loads(line)
                except:
                    continue
                
                if obj.get('kind') == 0:
                    reqs = obj.get('v', {}).get('requests', [])
                    for i, req in enumerate(reqs):
                        msg = req.get('message', {})
                        text = msg.get('text', '') if isinstance(msg, dict) else ''
                        if text and not text.startswith('<context') and not text.startswith('<environment') and not text.startswith('<attachment'):
                            print(f'  INIT[{i}]: {text[:300]}')
                
                elif obj.get('kind') == 2:
                    k = obj.get('k', [])
                    v = obj.get('v')
                    if k and k[0] == 'requests' and isinstance(v, list):
                        for req in v:
                            msg = req.get('message', {})
                            text = msg.get('text', '') if isinstance(msg, dict) else ''
                            if text and not text.startswith('<context') and not text.startswith('<environment') and not text.startswith('<attachment') and len(text) < 2000:
                                print(f'  UPDATE: {text[:300]}')

print(f'\nTotal files scanned: {count}')
